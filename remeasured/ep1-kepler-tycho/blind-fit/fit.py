#!/usr/bin/env python3
"""Blind fit of the orbits of Mars and Earth to Tycho's Mars positions (see PLAN.md).

python fit.py  ->  ORBIT.json, results.json, fig_*.png
No planetary ephemeris or known element is used anywhere; erfa is used for precession and nutation only.
"""
import csv, json, sys, os
import numpy as np
import erfa
from scipy.optimize import least_squares

HERE = os.path.dirname(os.path.abspath(__file__))
D2R = np.pi / 180.0
AM = 180.0 * 60.0 / np.pi          # radians -> arcmin
EPOCH = 2301792.5                  # J1590.0 (TT)
EPJ0 = 1590.0
LT_DAY = 499.005 / 86400.0         # light time for 1 unit (Earth's a taken as 1 au)
C_UNIT = 1.0 / LT_DAY              # speed of light, units/day
FAST = '--fast' in sys.argv
NBOOT = 30 if FAST else 300

# ----------------------------------------------------------------------------- data
def load():
    rows = list(csv.DictReader(open(os.path.join(HERE, 'mars_positions.csv'))))
    jd = np.array([float(r['jd_tt']) for r in rows])
    lon = np.array([float(r['lon_deg']) for r in rows]) * D2R
    lat = np.array([float(r['lat_deg']) for r in rows]) * D2R
    slon = np.array([float(r['sigma_lon_arcmin']) for r in rows])
    slat = np.array([float(r['sigma_lat_arcmin']) for r in rows])
    # true ecliptic & equinox of date -> mean of date (remove nutation in longitude) -> mean ecliptic J1590.0
    M0 = erfa.ltecm(EPJ0)
    L2, B2 = np.empty_like(lon), np.empty_like(lat)
    for k in range(len(jd)):
        dpsi, deps = erfa.nut06a(jd[k], 0.0)
        l = lon[k] - dpsi
        v = np.array([np.cos(lat[k]) * np.cos(l), np.cos(lat[k]) * np.sin(l), np.sin(lat[k])])
        epj = erfa.epj(jd[k], 0.0)
        w = M0 @ erfa.ltecm(epj).T @ v
        L2[k] = np.arctan2(w[1], w[0]) % (2 * np.pi)
        B2[k] = np.arcsin(w[2])
    return rows, jd, L2, B2, slon, slat, lon, lat


def frame_selftest():
    """A fixed ICRS direction must gain ~50"/yr of longitude in the frame of date (precession)."""
    v = np.array([1.0, 0.3, 0.1]); v /= np.linalg.norm(v)
    l1 = np.arctan2(*(erfa.ltecm(1580.0) @ v)[[1, 0]])
    l2 = np.arctan2(*(erfa.ltecm(1600.0) @ v)[[1, 0]])
    rate = (l2 - l1) / 20.0 * AM * 60.0
    assert 45 < rate < 56, rate
    return rate

# ----------------------------------------------------------------------------- geometry
def rot(x, y, Om, inc, om):
    """in-plane (x toward perihelion) -> ecliptic, for argument of perihelion om, node Om, inclination inc."""
    co, so = np.cos(om), np.sin(om)
    xp, yp = co * x - so * y, so * x + co * y            # x axis now toward the ascending node
    ci, si = np.cos(inc), np.sin(inc)
    cO, sO = np.cos(Om), np.sin(Om)
    X = cO * xp - sO * ci * yp
    Y = sO * xp + cO * ci * yp
    Z = si * yp
    return np.stack([X, Y, Z], axis=-1)


def eq_circle_inplane(M, R, ec, eq):
    """Circle radius R, centre at -ec*R on the perihelion axis, uniform motion (mean anomaly M) seen from the
    equant at -eq*R. Returns in-plane coordinates with x toward perihelion. ec=eq: uniform about the centre."""
    w = -(eq - ec) * R                       # equant minus centre, along x
    dx, dy = np.cos(M), np.sin(M)
    wd = w * dx
    s = -wd + np.sqrt(np.maximum(wd * wd - w * w + R * R, 0.0))
    x = -eq * R + s * dx
    y = s * dy
    return x, y


def kepler_inplane(M, a, e):
    M = np.mod(M + np.pi, 2 * np.pi) - np.pi
    E = M + e * np.sin(M)
    for _ in range(30):
        dE = (E - e * np.sin(E) - M) / (1 - e * np.cos(E))
        E -= dE
        if np.max(np.abs(dE)) < 1e-13:
            break
    return a * (np.cos(E) - e), a * np.sqrt(1 - e * e) * np.sin(E)


# parameter sets (angles in radians inside the vectors, periods in days)
MARS_CIRC = ['R', 'ec', 'eq', 'varpi', 'L0', 'P', 'Om', 'inc']
MARS_ELL = ['a', 'e', 'varpi', 'L0', 'P', 'Om', 'inc']
EARTH = ['eE', 'varpiE', 'LE0', 'PE']
MODELS = {
    # name: (mars type, earth type, mars params, bisected?)
    '1':   ('equant', 'circle', ['R', 'ec', 'eq', 'varpi', 'L0', 'P', 'Om', 'inc'], False),
    '1b':  ('equant', 'circle', ['R', 'eq', 'varpi', 'L0', 'P', 'Om', 'inc'], True),
    '2':   ('kepler', 'circle', MARS_ELL, False),
    '3':   ('kepler', 'kepler', MARS_ELL, False),
    '1c':  ('equant', 'kepler', ['R', 'ec', 'eq', 'varpi', 'L0', 'P', 'Om', 'inc'], False),
    '1cb': ('equant', 'kepler', ['R', 'eq', 'varpi', 'L0', 'P', 'Om', 'inc'], True),
}
ANGLES = {'varpi', 'L0', 'Om', 'inc', 'varpiE', 'LE0'}
SCALE = {'R': 0.01, 'a': 0.01, 'e': 0.01, 'ec': 0.01, 'eq': 0.01, 'eE': 0.001, 'varpi': 0.01, 'L0': 0.001,
         'P': 0.1, 'Om': 0.01, 'inc': 0.001, 'varpiE': 0.01, 'LE0': 0.001, 'PE': 0.01}


def pnames(m):
    return MODELS[m][2] + EARTH


def unpack(m, x):
    d = dict(zip(pnames(m), x))
    if MODELS[m][3]:
        d['ec'] = d['eq'] / 2.0
    return d


def earth_pos(m, d, t):
    M = d['LE0'] + 2 * np.pi * (t - EPOCH) / d['PE'] - d['varpiE']
    if MODELS[m][1] == 'circle':
        x, y = eq_circle_inplane(M, 1.0, d['eE'], d['eE'])
    else:
        x, y = kepler_inplane(M, 1.0, d['eE'])
    return rot(x, y, 0.0, 0.0, d['varpiE'])


def mars_pos(m, d, t):
    M = d['L0'] + 2 * np.pi * (t - EPOCH) / d['P'] - d['varpi']
    if MODELS[m][0] == 'equant':
        x, y = eq_circle_inplane(M, d['R'], d['ec'], d['eq'])
    else:
        x, y = kepler_inplane(M, d['a'], d['e'])
    return rot(x, y, d['Om'], d['inc'], d['varpi'] - d['Om'])


def predict(m, x, t, extra=False):
    d = unpack(m, x)
    rE = earth_pos(m, d, t)
    h = 0.05
    vE = (earth_pos(m, d, t + h) - earth_pos(m, d, t - h)) / (2 * h)
    tau = np.zeros_like(t)
    for _ in range(3):
        rho = mars_pos(m, d, t - tau) - rE
        tau = np.linalg.norm(rho, axis=1) * LT_DAY
    u = rho / np.linalg.norm(rho, axis=1)[:, None]
    b = vE / C_UNIT
    u = u + b - u * np.sum(u * b, axis=1)[:, None]          # annual aberration, first order
    u /= np.linalg.norm(u, axis=1)[:, None]
    lon = np.arctan2(u[:, 1], u[:, 0]) % (2 * np.pi)
    lat = np.arcsin(u[:, 2])
    if not extra:
        return lon, lat
    sun = -rE / np.linalg.norm(rE, axis=1)[:, None]
    elong = np.arccos(np.clip(np.sum(sun * u, axis=1), -1, 1))
    return lon, lat, elong, d


def resid_arcmin(m, x, t, L, B):
    lon, lat = predict(m, x, t)
    dl = (np.mod(L - lon + np.pi, 2 * np.pi) - np.pi) * np.cos(B) * AM
    db = (B - lat) * AM
    return dl, db


def selftest_aberration():
    """Synthetic: a far target along +y, Earth moving along +y: no shift; moving along +x: shift toward +x."""
    u = np.array([[0.0, 1.0, 0.0]]); b = np.array([[1e-4, 0.0, 0.0]])
    v = u + b - u * np.sum(u * b, axis=1)[:, None]
    assert v[0, 0] > 0
    return True


# ----------------------------------------------------------------------------- fitting
def bounds(m):
    lo, hi = [], []
    for n in pnames(m):
        if n in ('R', 'a'):
            lo.append(0.2); hi.append(20.0)
        elif n in ('e', 'ec', 'eq', 'eE'):
            lo.append(0.0); hi.append(0.6)
        elif n in ('P', 'PE'):
            lo.append(50.0); hi.append(5000.0)
        elif n == 'inc':
            lo.append(-0.5); hi.append(0.5)
        else:
            lo.append(-np.inf); hi.append(np.inf)
    return np.array(lo), np.array(hi)


class Fitter:
    def __init__(self, t, L, B, sl, sb):
        self.t, self.L, self.B, self.sl, self.sb = t, L, B, sl, sb

    def z(self, m, x, idx):
        dl, db = resid_arcmin(m, x, self.t[idx], self.L[idx], self.B[idx])
        return np.concatenate([dl / self.sl[idx], db / self.sb[idx]])

    def fit(self, m, x0, idx, loss='linear', fix=None, lon_only=False):
        """fix: dict name->value of parameters held fixed (the rest are free).
        loss='huber' is the Huber M-estimator (f_scale = 2 on z) solved by iteratively reweighted least squares
        (least_squares' own huber loss converged too slowly here; the estimator is the same)."""
        names = pnames(m)
        free = [i for i, n in enumerate(names) if not fix or n not in fix]
        lo, hi = bounds(m)
        x0 = np.array(x0, float).copy()
        x0 = np.clip(x0, lo + 1e-9, hi - 1e-9)
        sc = np.array([SCALE[n] for n in names])[free]
        w = None

        def f(xf):
            x = x0.copy(); x[free] = xf
            r = self.z(m, x, idx)
            r = r[:len(idx)] if lon_only else r
            return r if w is None else r * w
        xf = x0[free]
        for it in range(12 if loss == 'huber' else 1):
            res = least_squares(f, xf, bounds=(lo[free], hi[free]), x_scale=sc,
                                max_nfev=3000, xtol=1e-10, ftol=1e-10, gtol=1e-10)
            if loss != 'huber':
                break
            w = None
            r = f(res.x)
            wn = np.sqrt(np.minimum(1.0, 2.0 / np.maximum(np.abs(r), 1e-12)))
            done = it > 0 and np.max(np.abs(res.x - xf) / sc) < 1e-3
            xf = res.x; w = wn
            if done:
                break
        if loss == 'huber':
            r = res.fun / w if w is not None else res.fun
            res.cost = float(np.sum(np.where(np.abs(r) <= 2, 0.5 * r * r, 2 * np.abs(r) - 2)))
        x = x0.copy(); x[free] = res.x
        return x, res

    def clip(self, m, x0, log=None):
        """PLAN section 4: Huber fit done before; iterative 5-sigma robust clipping with linear refits."""
        N = len(self.t)
        allidx = np.arange(N)
        x = np.array(x0, float)
        keep = None
        for it in range(20):
            dl, db = resid_arcmin(m, x, self.t, self.L, self.B)
            zl, zb = dl / self.sl, db / self.sb
            ref = allidx if keep is None else keep
            s_l = 1.4826 * np.median(np.abs(zl[ref]))
            s_b = 1.4826 * np.median(np.abs(zb[ref]))
            new = allidx[(np.abs(zl) <= 5 * s_l) & (np.abs(zb) <= 5 * s_b)]
            if keep is not None and np.array_equal(new, keep):
                break
            keep = new
            x, _ = self.fit(m, x, keep)
        return x, keep, it


def circ_std(a):
    c = np.exp(1j * a)
    R = np.abs(np.mean(c))
    return np.sqrt(-2 * np.log(min(R, 1.0)))


# ----------------------------------------------------------------------------- starting values from the data
def apparitions(t, gap=120.0):
    order = np.argsort(t)
    groups, cur = [], [order[0]]
    for a, b in zip(order[:-1], order[1:]):
        if t[b] - t[a] > gap:
            groups.append(np.array(cur)); cur = []
        cur.append(b)
    groups.append(np.array(cur))
    return groups


def find_oppositions(t, L):
    """For each apparition: rows taking part in a retrograde step (consecutive rows <= 20 d apart with falling
    longitude) define the retrograde arc; a robust (soft-L1) cubic through those rows gives the opposition as the time of
    most negative dλ/dt (the inflection of the loop)."""
    out = []
    for g in apparitions(t):
        g = g[np.argsort(t[g])]
        tt = t[g]; ll = np.unwrap(L[g])
        retro = set()
        for k in range(len(g) - 1):
            dt = tt[k + 1] - tt[k]
            if 0.2 < dt <= 20 and ll[k + 1] < ll[k]:
                retro.update((k, k + 1))
        retro = np.array(sorted(retro))
        if len(retro) < 5:
            continue
        tr, lr = tt[retro], ll[retro]
        t0 = tr.mean()
        c0 = np.polyfit(tr - t0, lr, 3)
        c = least_squares(lambda c: np.polyval(c, tr - t0) - lr, c0, loss='soft_l1', f_scale=0.005).x
        ts = np.linspace(tr.min(), tr.max(), 4000) - t0
        rate = np.polyval(np.polyder(c), ts)
        to = ts[np.argmin(rate)]
        out.append((to + t0, np.polyval(c, to) % (2 * np.pi), len(retro)))
    return out


def mean_motion_aliases(topp, lopp):
    ns = np.arange(0.02, 2.5, 0.00002) * D2R
    ph = lopp[None, :] - ns[:, None] * (topp[None, :] - EPOCH)
    coh = np.abs(np.mean(np.exp(1j * ph), axis=1))
    peaks = [i for i in range(1, len(ns) - 1) if coh[i] > coh[i - 1] and coh[i] >= coh[i + 1] and coh[i] > 0.9 * coh.max()]
    return ns, coh, peaks


def starting_values(F, log):
    t, L, B = F.t, F.L, F.B
    opp = find_oppositions(t, L)
    topp = np.array([o[0] for o in opp]); lopp = np.array([o[1] for o in opp])
    log['oppositions_found'] = [{'jd': round(float(a), 2), 'lon_deg': round(float(b / D2R), 2), 'rows': int(c)}
                                for a, b, c in opp]
    # synodic period from the opposition spacings
    dts = np.diff(np.sort(topp))
    p0 = dts.min()
    k = np.round((topp - topp.min()) / p0)
    Psyn = np.polyfit(k, topp, 1)[0]
    ns, coh, peaks = mean_motion_aliases(topp, lopp)
    log['synodic_period_days'] = round(float(Psyn), 2)
    log['mean_motion_peaks_deg_per_day'] = [round(float(ns[i] / D2R), 5) for i in peaks]
    # candidate pairs (slow = Mars, fast = Earth) separated by 2π/Psyn
    nsyn = 2 * np.pi / Psyn
    cands = []
    pk = [ns[i] for i in peaks]
    for a in pk:
        for b in pk:
            if b > a and abs((b - a) - nsyn) < 0.05 * nsyn:
                cands.append((a, b))
    cands = sorted(cands, key=lambda c: c[0])[:4]
    best = None
    all_idx = np.arange(len(t))
    trials = []
    for nM, nE in cands:
        PM, PE = 2 * np.pi / nM, 2 * np.pi / nE
        LM = np.angle(np.mean(np.exp(1j * (lopp - nM * (topp - EPOCH)))))
        LE = np.angle(np.mean(np.exp(1j * (lopp - nE * (topp - EPOCH)))))
        for R0 in (0.5, 1.5, 3.0):
            x0 = [R0, 0.0, 0.0, 0.0, LM, PM, 0.0, 0.0, 0.0, 0.0, LE, PE]
            fix = {'ec': 0, 'eq': 0, 'varpi': 0, 'Om': 0, 'inc': 0, 'eE': 0, 'varpiE': 0}
            x, res = F.fit('1', x0, all_idx, loss='huber', fix=fix, lon_only=True)
            trials.append({'PM': round(float(x[5]), 2), 'PE': round(float(x[11]), 2), 'R': round(float(x[0]), 3),
                           'cost': round(float(res.cost), 1)})
            if best is None or res.cost < best[1]:
                best = (x, res.cost)
    log['two_circle_alias_trials'] = trials
    x = best[0]
    # node from ascending latitude sign changes (heliocentric longitude of Mars there)
    d = unpack('1', x)
    order = np.argsort(t)
    asc = []
    for a, b in zip(order[:-1], order[1:]):
        if t[b] - t[a] < 30 and B[a] < 0 <= B[b]:
            tc = t[a] + (t[b] - t[a]) * (-B[a]) / (B[b] - B[a])
            r = mars_pos('1', d, np.array([tc]))[0]
            asc.append(np.arctan2(r[1], r[0]))
    if asc:   # circular median: the crossing closest (in sum of |angle|) to all others
        A = np.array(asc)
        Om0 = A[np.argmin([np.sum(np.abs(np.angle(np.exp(1j * (A - a))))) for a in A])]
    else:
        Om0 = 0.0
    log['ascending_crossings_helio_lon_deg'] = [round(float(a / D2R % 360), 2) for a in asc]
    best_i = None
    for i0 in (0.01, 0.03, 0.06):
        x1 = x.copy(); x1[6] = Om0; x1[7] = i0
        names = pnames('1')
        fix = {n: x1[k] for k, n in enumerate(names) if n != 'inc'}
        xi, res = F.fit('1', x1, all_idx, loss='huber', fix=fix)
        if best_i is None or res.cost < best_i[1]:
            best_i = (xi, res.cost)
    x = best_i[0]
    log['start_two_circle'] = {'P_mars': float(x[5]), 'P_earth': float(x[11]), 'R': float(x[0]),
                               'Om_deg': float(x[6] / D2R % 360), 'inc_deg': float(x[7] / D2R)}
    return x


def convert(src, dst, x):
    """map a parameter vector between models (geometry approximately preserved)."""
    d = unpack(src, x)
    if 'R' in d:
        d.setdefault('a', d['R']); d.setdefault('e', d['eq'] / 2 if d['eq'] else d['ec'])
    if 'a' in d and 'R' not in d:
        d['R'] = d['a']; d['eq'] = 2 * d['e']; d['ec'] = d['e']
    return np.array([d[n] for n in pnames(dst)])


def robust_fit(F, m, starts, log):
    all_idx = np.arange(len(F.t))
    best = None
    names = pnames(m)
    for x0 in starts:
        x, res = F.fit(m, x0, all_idx, loss='huber')
        if best is None or res.cost < best[1]:
            best = (x, res.cost)
    x, keep, nit = F.clip(m, best[0])
    return x, keep


def grid_starts(m, base):
    names = pnames(m)
    out = [np.array(base, float)]
    for vp in np.arange(0, 360, 45) * D2R:
        for vpE in np.arange(0, 360, 90) * D2R:
            x = np.array(base, float).copy()
            for k, n in enumerate(names):
                if n == 'varpi': x[k] = vp
                if n == 'varpiE': x[k] = vpE
                if n in ('e', 'ec', 'eE'): x[k] = 0.05 if n != 'eE' else 0.02
                if n == 'eq': x[k] = 0.1
            out.append(x)
    return out


def covariance(F, m, x, keep):
    names = pnames(m)
    _, res = F.fit(m, x, keep)
    J = res.jac
    r = res.fun
    dof = len(r) - len(x)
    chi2 = float(np.sum(r ** 2))
    cov = np.linalg.pinv(J.T @ J) * chi2 / dof
    return np.sqrt(np.diag(cov)), chi2, dof


def bootstrap(F, m, x, keep, nb, seed=1590):
    rng = np.random.default_rng(seed)
    out = []
    for b in range(nb):
        idx = rng.choice(keep, size=len(keep), replace=True)
        xb, _ = F.fit(m, x, np.sort(idx))
        out.append(xb)
    out = np.array(out)
    names = pnames(m)
    sd = []
    for k, n in enumerate(names):
        sd.append(circ_std(out[:, k]) if n in ANGLES else np.std(out[:, k], ddof=1))
    return np.array(sd)


# ----------------------------------------------------------------------------- diagnostics
def mean_anomaly3(x3, t):
    d = unpack('3', x3)
    return np.mod(d['L0'] + 2 * np.pi * (t - EPOCH) / d['P'] - d['varpi'], 2 * np.pi)


def stats(dl, db, idx):
    if len(idx) == 0:
        return None
    return {'n': int(len(idx)),
            'rms_lon': round(float(np.sqrt(np.mean(dl[idx] ** 2))), 3),
            'rms_lat': round(float(np.sqrt(np.mean(db[idx] ** 2))), 3),
            'med_abs_lon': round(float(np.median(np.abs(dl[idx]))), 3),
            'med_abs_lat': round(float(np.median(np.abs(db[idx]))), 3)}


def systematics(dl, db, idx, Manom, t):
    bins = np.floor(Manom[idx] / (30 * D2R)).astype(int)
    binmed = []
    for b in range(12):
        sel = idx[bins == b]
        if len(sel) >= 4:
            binmed.append((b * 30 + 15, len(sel), float(np.median(dl[sel])), float(np.median(db[sel]))))
    app = []
    for g in apparitions(t):
        sel = np.intersect1d(g, idx)
        if len(sel) >= 4:
            app.append((float(np.mean(t[sel])), len(sel), float(np.median(dl[sel])), float(np.median(db[sel]))))
    # harmonic fit of longitude residuals
    Mi = Manom[idx]
    A = np.stack([np.ones_like(Mi), np.sin(Mi), np.cos(Mi), np.sin(2 * Mi), np.cos(2 * Mi)], 1)
    c = np.linalg.lstsq(A, dl[idx], rcond=None)[0]
    Ab = np.linalg.lstsq(A, db[idx], rcond=None)[0]
    bl = max(binmed, key=lambda q: abs(q[2])); bb = max(binmed, key=lambda q: abs(q[3]))
    al = max(app, key=lambda q: abs(q[2])); ab = max(app, key=lambda q: abs(q[3]))
    return {
        'bins_M_deg': [[q[0], q[1], round(q[2], 2), round(q[3], 2)] for q in binmed],
        'apparitions': [[round(1590 + (q[0] - EPOCH) / 365.25, 2), q[1], round(q[2], 2), round(q[3], 2)] for q in app],
        'max_bin_lon': [bl[0], round(bl[2], 2)], 'max_bin_lat': [bb[0], round(bb[3], 2)],
        'max_app_lon': [round(1590 + (al[0] - EPOCH) / 365.25, 2), round(al[2], 2)],
        'max_app_lat': [round(1590 + (ab[0] - EPOCH) / 365.25, 2), round(ab[3], 2)],
        'systematic_lon': round(max(abs(bl[2]), abs(al[2])), 2),
        'harm_lon_A1': round(float(np.hypot(c[1], c[2])), 2), 'harm_lon_A2': round(float(np.hypot(c[3], c[4])), 2),
        'harm_lat_A1': round(float(np.hypot(Ab[1], Ab[2])), 2), 'harm_lat_A2': round(float(np.hypot(Ab[3], Ab[4])), 2),
    }


def elements_out(m, x, sf, sb):
    names = pnames(m)
    out = {}
    for k, n in enumerate(names):
        v, a, b = x[k], sf[k], sb[k]
        if n in ANGLES:
            v = v / D2R; a = a / D2R; b = b / D2R
            if n != 'inc':
                v = v % 360
        out[n] = {'value': round(float(v), 6), 'sigma': round(float(max(a, b)), 6),
                  'sigma_formal': round(float(a), 6), 'sigma_boot': round(float(b), 6)}
    if MODELS[m][3]:
        out['ec'] = {'value': round(float(x[names.index('eq')] / 2), 6), 'note': 'bisected: ec = eq/2'}
    return out


# ----------------------------------------------------------------------------- main
def main():
    rate = frame_selftest(); selftest_aberration()
    rows, t, L, B, sl, sb, Lraw, Braw = load()
    F = Fitter(t, L, B, sl, sb)
    log = {'precession_selftest_arcsec_per_yr': round(float(rate), 2),
           'frame_shift_arcmin_median': round(float(np.median(np.abs(np.mod(L - Lraw + np.pi, 2*np.pi) - np.pi)) * AM), 2)}
    x2c = starting_values(F, log)
    print('start', log['start_two_circle'], flush=True)

    fits = {}
    order = ['1', '1b', '2', '3', '1c', '1cb']
    prev = {'1': ('1', x2c), '1b': ('1', None), '2': ('1', None), '3': ('2', None), '1c': ('3', None), '1cb': ('1c', None)}
    for m in order:
        src = prev[m][0]
        base = x2c if m == '1' else convert(src, m, fits[src]['x'])
        starts = grid_starts(m, base)
        if m in ('1c', '1cb'):
            # Earth from model 3, Mars from model 1/1b
            src2 = '1' if m == '1c' else '1b'
            d1 = unpack(src2, fits[src2]['x']); d3 = unpack('3', fits['3']['x'])
            alt = np.array([d1.get(n, d3.get(n)) if n not in EARTH else d3[n] for n in pnames(m)])
            starts.append(alt)
        if m == '3':
            d2 = unpack('2', fits['2']['x'])
            alt = np.array([d2[n] for n in pnames('3')]); alt[pnames('3').index('eE')] = d2['eE'] / 2
            starts.append(alt)
        x, keep = robust_fit(F, m, starts, log)
        fits[m] = {'x': x, 'keep': keep}
        dl, db = resid_arcmin(m, x, t, L, B)
        print(m, len(keep), 'rms', np.sqrt(np.mean(dl[keep]**2)), np.sqrt(np.mean(db[keep]**2)), flush=True)

    x3 = fits['3']['x']
    Manom = mean_anomaly3(x3, t)
    _, _, elong3, _ = predict('3', x3, t, extra=True)
    thr = 150.0
    common = np.arange(len(t))
    for m in order:
        common = np.intersect1d(common, fits[m]['keep'])
    clean = fits['3']['keep']
    near = np.where(elong3 >= thr * D2R)[0]
    if len(np.intersect1d(near, clean)) < 15 or len(np.setdiff1d(clean, near)) < 15:
        thr = 135.0; near = np.where(elong3 >= thr * D2R)[0]
    far = np.setdiff1d(np.arange(len(t)), near)
    log['near_opposition_threshold_deg'] = thr

    results = {'log': log, 'models': {}}
    # noise scale for BIC: model 3's reduced chi2 on the common set
    z3 = F.z('3', x3, common); s3sq = float(np.sum(z3 ** 2) / (len(z3) - len(x3)))
    for m in order:
        x, keep = fits[m]['x'], fits[m]['keep']
        sf, chi2, dof = covariance(F, m, x, keep)
        sbt = bootstrap(F, m, x, keep, NBOOT)
        dl, db = resid_arcmin(m, x, t, L, B)
        zc = F.z(m, x, common)
        bic = float(np.sum(zc ** 2) / s3sq + len(x) * np.log(2 * len(common)))
        rej = np.setdiff1d(np.arange(len(t)), keep)
        results['models'][m] = {
            'elements': elements_out(m, x, sf, sbt),
            'n_retained': int(len(keep)), 'chi2_formal': round(chi2, 1), 'dof': dof,
            'reduced_chi2': round(chi2 / dof, 3),
            'own': stats(dl, db, keep), 'common': stats(dl, db, common),
            'own_near_opp': stats(dl, db, np.intersect1d(keep, near)),
            'own_elsewhere': stats(dl, db, np.intersect1d(keep, far)),
            'clean_near_opp': stats(dl, db, np.intersect1d(clean, near)),
            'clean_elsewhere': stats(dl, db, np.intersect1d(clean, far)),
            'systematics_clean': systematics(dl, db, clean, Manom, t),
            'BIC_common': round(bic, 1),
            'rejected': [{'session': rows[i]['session_id'], 'dlon': round(float(dl[i]), 1), 'dlat': round(float(db[i]), 1)}
                         for i in rej],
        }
        fits[m]['dl'], fits[m]['db'] = dl, db
        print(m, 'done', results['models'][m]['own'], flush=True)

    # Kepler-style test: Earth from model 3; Mars equant longitude params from near-opposition rows only
    kt = {}
    for m in ('1c', '1cb'):
        x = fits[m]['x'].copy()
        names = pnames(m)
        nidx = np.intersect1d(near, clean)
        lonp = [n for n in names if n in ('ec', 'eq', 'varpi', 'L0', 'P')]
        fixA = {n: x[k] for k, n in enumerate(names) if n not in lonp}
        best = None
        for s in grid_starts(m, x):
            s = s.copy()
            for k, n in enumerate(names):
                if n in fixA: s[k] = x[k]
            xa, res = F.fit(m, s, nidx, fix=fixA, lon_only=True)
            if best is None or res.cost < best[1]:
                best = (xa, res.cost)
        xa = best[0]
        fixB = {n: xa[k] for k, n in enumerate(names) if n not in ('R', 'Om', 'inc')}
        xb, _ = F.fit(m, xa, clean, fix=fixB)
        dl, db = resid_arcmin(m, xb, t, L, B)
        kt[m] = {'elements': {n: round(float(xb[k] / D2R % 360 if n in ANGLES and n != 'inc' else (xb[k] / D2R if n == 'inc' else xb[k])), 5)
                              for k, n in enumerate(names)},
                 'near_opp': stats(dl, db, nidx), 'elsewhere': stats(dl, db, np.intersect1d(clean, far)),
                 'max_abs_lon_elsewhere': round(float(np.max(np.abs(dl[np.intersect1d(clean, far)]))), 2),
                 'systematics_clean': systematics(dl, db, clean, Manom, t)}
        fits['K' + m] = {'dl': dl, 'db': db}
    results['kepler_test'] = kt

    results['common_n'] = int(len(common))
    results['clean_n'] = int(len(clean))
    results['outliers_model3'] = results['models']['3']['rejected']
    s1 = results['models']['1c']['systematics_clean']['systematic_lon']
    s3 = results['models']['3']['systematics_clean']['systematic_lon']
    results['answer_8arcmin'] = {'systematic_1c': s1, 'systematic_3': s3,
                                 'systematic_1': results['models']['1']['systematics_clean']['systematic_lon'],
                                 'YES': bool(s1 >= 3.0 and s3 <= 0.5 * s1)}
    bics = {m: results['models'][m]['BIC_common'] for m in ('1', '2', '3')}
    results['BIC_primary'] = bics

    # ---- POST HOC (added after seeing residuals; not part of the pre-registered decision) ----
    # (a) heliocentric longitude of Mars, model m minus model 3, over one revolution (model-vs-model curve)
    # (b) near-opposition geocentric residuals scaled by Δ/r (model 3 geometry) = heliocentric-equivalent error
    d3 = unpack('3', x3)
    tg = EPOCH + np.linspace(0, d3['P'], 721)
    Mg = mean_anomaly3(x3, tg)
    def helio_lon(m, x, tt):
        r = mars_pos(m, unpack(m, x), tt)
        return np.arctan2(r[:, 1], r[:, 0])
    h3 = helio_lon('3', x3, tg)
    rE3 = earth_pos('3', d3, t); rM3 = mars_pos('3', d3, t)
    ratio = np.linalg.norm(rM3 - rE3, axis=1) / np.linalg.norm(rM3, axis=1)     # Δ / r
    ph = {'curves': {}, 'near_opp_helio_equiv': {}}
    nidx = np.intersect1d(near, clean)
    curves = {}
    for m in ('1c', '1cb', '1', '1b'):
        dh = (np.mod(helio_lon(m, fits[m]['x'], tg) - h3 + np.pi, 2 * np.pi) - np.pi) * AM
        dh -= np.mean(dh)
        curves[m] = dh
        A = np.stack([np.ones_like(Mg), np.sin(Mg), np.cos(Mg), np.sin(2 * Mg), np.cos(2 * Mg)], 1)
        c = np.linalg.lstsq(A, dh, rcond=None)[0]
        ph['curves'][m] = {'max_abs_arcmin': round(float(np.max(np.abs(dh))), 2),
                           'A1': round(float(np.hypot(c[1], c[2])), 2), 'A2': round(float(np.hypot(c[3], c[4])), 2),
                           'M_at_max_deg': round(float(Mg[np.argmax(np.abs(dh))] / D2R), 1)}
    for m in ('3', '1c', '1cb'):
        he = fits[m]['dl'][nidx] * ratio[nidx]
        bins = np.floor(Manom[nidx] / (30 * D2R)).astype(int)
        bm = []
        for b in range(12):
            sel = bins == b
            if sel.sum() >= 4:
                bm.append([b * 30 + 15, int(sel.sum()), round(float(np.median(he[sel])), 2)])
        ph['near_opp_helio_equiv'][m] = {'rms': round(float(np.sqrt(np.mean(he ** 2))), 2),
                                         'max_abs_bin_median': max(abs(q[2]) for q in bm), 'bins': bm}
    ph['kepler_third_law'] = {'a3': round(float(d3['a'] ** 3), 4), '(P/PE)^2': round(float((d3['P'] / d3['PE']) ** 2), 4)}
    results['post_hoc'] = ph
    fits['_curves'] = (Mg, curves)
    fits['_near'] = (nidx, ratio)

    # ORBIT.json
    orbit = {'frame': 'mean ecliptic and equinox J1590.0; epoch J1590.0 = JD(TT) 2301792.5; lengths in Earth a',
             'model_3_two_kepler_ellipses': results['models']['3']['elements'],
             'model_2_mars_ellipse_circular_earth': results['models']['2']['elements'],
             'model_1_circle_free_equant_circular_earth': results['models']['1']['elements'],
             'model_1b_circle_bisected_equant_circular_earth': results['models']['1b']['elements'],
             'model_1c_circle_free_equant_kepler_earth': results['models']['1c']['elements'],
             'model_1cb_circle_bisected_equant_kepler_earth': results['models']['1cb']['elements'],
             'outliers_model3': [r['session'] for r in results['outliers_model3']],
             'rms_arcmin_model3': results['models']['3']['own']}
    with open(os.path.join(HERE, 'ORBIT.json'), 'w') as f:
        json.dump(orbit, f, indent=1, sort_keys=True)
    with open(os.path.join(HERE, 'results.json'), 'w') as f:
        json.dump(results, f, indent=1)

    figures(fits, t, Manom, clean, near, order)
    import report
    report.main()


def figures(fits, t, Manom, clean, near, order):
    import matplotlib
    matplotlib.use('Agg')
    import matplotlib.pyplot as plt
    yr = 1590 + (t - EPOCH) / 365.25
    labels = {'1': '1: circle+equant, circular Earth', '1b': '1b: bisected equant, circular Earth',
              '2': '2: Mars ellipse, circular Earth', '3': '3: two Kepler ellipses',
              '1c': '1c: circle+equant, Kepler Earth', '1cb': '1cb: bisected equant, Kepler Earth',
              'K1c': 'Kepler test: free equant fit at oppositions', 'K1cb': 'Kepler test: bisected equant fit at oppositions'}
    for key, xs, xl, fn in (('time', yr, 'year', 'fig_resid_vs_time.png'),
                            ('M', Manom / D2R, 'Mars mean anomaly (deg, model 3)', 'fig_resid_vs_anomaly.png')):
        ms = ['1', '1c', '2', '3', 'K1c', 'K1cb']
        fig, ax = plt.subplots(len(ms), 2, figsize=(13, 2.3 * len(ms)), sharex=True)
        isnear = np.zeros(len(t), bool); isnear[near] = True
        for r, m in enumerate(ms):
            for c, (arr, nm) in enumerate(((fits[m]['dl'], 'Δlon·cos b'), (fits[m]['db'], 'Δlat'))):
                a = ax[r, c]
                sel = clean
                a.scatter(xs[sel][~isnear[sel]], arr[sel][~isnear[sel]], s=9, c='tab:blue', label='elsewhere')
                a.scatter(xs[sel][isnear[sel]], arr[sel][isnear[sel]], s=9, c='tab:red', label='near opposition')
                for lv in (-8, 8):
                    a.axhline(lv, color='0.7', lw=0.6, ls=':')
                a.axhline(0, color='k', lw=0.5)
                lim = max(10.0, min(60.0, 1.15 * np.percentile(np.abs(arr[clean]), 98)))
                a.set_ylim(-lim, lim)
                a.set_ylabel(nm + " (′)")
                a.set_title(labels[m], fontsize=9)
                if r == len(ms) - 1:
                    a.set_xlabel(xl)
        ax[0, 0].legend(fontsize=7, loc='upper left')
        fig.suptitle('Geocentric residuals (obs − model), arcmin, on model 3\'s clean rows; dotted lines at ±8′; y-scales differ', fontsize=10)
        fig.tight_layout()
        fig.savefig(os.path.join(HERE, fn), dpi=110)
        plt.close(fig)
    # post hoc figure: near-opposition residuals scaled to heliocentric-equivalent (x Δ/r, model 3 geometry)
    nidx, ratio = fits['_near']
    fig, a = plt.subplots(figsize=(8, 4.2))
    for m, mk, col in (('1cb', 's', 'tab:orange'), ('1c', '^', 'tab:green'), ('3', 'o', 'k')):
        a.scatter(Manom[nidx] / D2R, fits[m]['dl'][nidx] * ratio[nidx], s=14, marker=mk, color=col, label=labels[m])
    for lv in (-8, 8):
        a.axhline(lv, color='0.6', lw=0.6, ls=':')
    a.axhline(0, color='k', lw=0.5)
    a.set_xlabel('Mars mean anomaly (deg, model 3)')
    a.set_ylabel("Δlon × Δ/r  (heliocentric-equivalent, ′)")
    a.set_title('Post hoc: near-opposition residuals as heliocentric errors (Kepler\'s comparison)', fontsize=10)
    a.legend(fontsize=8)
    fig.tight_layout(); fig.savefig(os.path.join(HERE, 'fig_posthoc_opposition_helio.png'), dpi=110)
    plt.close(fig)


if __name__ == '__main__':
    main()
