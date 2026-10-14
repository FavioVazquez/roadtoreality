"""Blind fit of one planet's observed sky positions (positions.csv).  Reproducible:  python3 fit.py
Protocol in PLAN.md.  Writes MODEL.json, work/results.json, work/residuals_heldout.png, work/residuals_table.csv.
Only numpy/scipy (fits) and erfa (frame precession-nutation) are used.  No orbital numbers are typed in: every start
value comes from a frequency search on the data."""
import numpy as np, erfa, csv, json, hashlib, os
from scipy.optimize import least_squares, minimize
from scipy.interpolate import UnivariateSpline

AM = 180 * 60 / np.pi            # rad -> arcmin
T0 = 2302000.0                   # time origin and fixed-frame epoch (mid-July 1590)
SPLIT = 2304000.5                # train: jd < SPLIT (fixed by the brief)
FLOOR = 0.5                      # arcmin, added in quadrature to formal sigmas (PLAN)
ZCUT, DCUT = 5.0, 60.0           # outlier rule (PLAN)
SHA = '626925e414f24010f6f44f36377c1abaede66265e24eac12226fc970e1b8183c'
HERE = os.path.dirname(os.path.abspath(__file__))


def R1(a):
    c, s = np.cos(a), np.sin(a)
    return np.array([[1, 0, 0], [0, c, s], [0, -s, c]])


# ============================================================== data + frame
def load(path=os.path.join(HERE, 'positions.csv')):
    r = list(csv.DictReader(open(path)))
    D = {'sid': np.array([x['session_id'] for x in r]), 'site': np.array([x['site'] for x in r]),
         'flags': [x['flags'] for x in r]}
    jd = np.array([float(x['jd_tt']) for x in r]); D['jd'] = jd
    lon = np.radians([float(x['lon_deg']) for x in r]); lat = np.radians([float(x['lat_deg']) for x in r])
    D['slon'] = np.array([float(x['sigma_lon_arcmin']) for x in r])
    D['slat'] = np.array([float(x['sigma_lat_arcmin']) for x in r])
    Mfix = erfa.ecm06(T0, 0.0)   # GCRS -> mean ecliptic & equinox of the fixed epoch (an inertial frame)
    U = np.zeros((len(r), 3))
    for k in range(len(r)):
        v = np.array([np.cos(lat[k]) * np.cos(lon[k]), np.cos(lat[k]) * np.sin(lon[k]), np.sin(lat[k])])
        dpsi, deps = erfa.nut06a(jd[k], 0)
        eps = erfa.obl06(jd[k], 0) + deps                      # true obliquity of date
        U[k] = Mfix @ erfa.pnm06a(jd[k], 0).T @ R1(eps).T @ v   # true ecliptic of date -> fixed frame
    D['U'] = U
    L = np.arctan2(U[:, 1], U[:, 0]); B = np.arcsin(np.clip(U[:, 2], -1, 1))
    D['L'], D['B'] = L, B
    D['elon'] = np.stack([-np.sin(L), np.cos(L), 0 * L], 1)
    D['elat'] = np.stack([-np.sin(B) * np.cos(L), -np.sin(B) * np.sin(L), np.cos(B)], 1)
    D['sel'] = np.sqrt(D['slon'] ** 2 + FLOOR ** 2); D['seb'] = np.sqrt(D['slat'] ** 2 + FLOOR ** 2)
    D['t'] = jd - T0
    D['train'] = jd < SPLIT
    return D


def resid(D, Umod, m=None):
    """dlon* = dlon cos(lat), dlat (arcmin; obs - model, tangent plane at the observed point) and exact distance d."""
    if m is None: m = np.ones(len(D['jd']), bool)
    Umod = Umod / np.linalg.norm(Umod, axis=1, keepdims=True)
    Uo = D['U'][m]
    x = np.sum(Uo * Umod, 1)       # atan2 form: smooth, and an antipodal model gives a large residual
    dl = -np.arctan2(np.sum(Umod * D['elon'][m], 1), x) * AM
    db = -np.arctan2(np.sum(Umod * D['elat'][m], 1), x) * AM
    d = np.arccos(np.clip(x, -1, 1)) * AM
    return dl, db, d


def wres(D, Umod, m):
    dl, db, d = resid(D, Umod, m)
    return np.concatenate([dl / D['sel'][m], db / D['seb'][m]])


# ============================================================== orbit primitives
def rot2(k, h, a):
    c, s = np.cos(a), np.sin(a)
    return (c * k - s * h, s * k + c * h)


def rot_plane(xy, i, Om):
    """in-plane (x, y), x axis at the ascending node -> 3-D with inclination i and node longitude Om."""
    x, y = xy
    cO, sO, ci, si = np.cos(Om), np.sin(Om), np.cos(i), np.sin(i)
    return np.stack([cO * x - sO * ci * y, sO * x + cO * ci * y, si * y], 1)


def kepler_xy(t, n, L0, k, h, a):
    """Keplerian ellipse (Kepler's equation): mean longitude L0 + n t, (k, h) = e (cos w, sin w), w = perihelion."""
    a = abs(a)
    e = min(np.hypot(k, h), 0.95); w = np.arctan2(h, k)
    M = L0 - w + n * t
    E = M + e * np.sin(M)
    for _ in range(40):
        E = E - (E - e * np.sin(E) - M) / (1 - e * np.cos(E))
    xp = a * (np.cos(E) - e); yp = a * np.sqrt(1 - e * e) * np.sin(E)
    return (np.cos(w) * xp - np.sin(w) * yp, np.sin(w) * xp + np.cos(w) * yp)


def equant_xy(t, n, L0, k, h, f, a):
    """circle of radius a whose centre is a (k, h) from the origin; uniform angular motion (L0 + n t) as seen from
    the equant point at f * a (k, h).  f = 1: plain eccentric circle; f = 2: equant bisected by the centre."""
    a = abs(a)
    C = a * np.array([k, h]); E = f * C
    th = L0 + n * t
    u = np.stack([np.cos(th), np.sin(th)])
    EC = (E - C)[:, None]
    b = np.sum(u * EC, 0); c = np.sum(EC * EC) - a * a
    s = -b + np.sqrt(np.maximum(b * b - c, 0))
    return (E[0] + s * u[0], E[1] + s * u[1])


# ============================================================== physical families: params -> geocentric vector
def m_circ(p, t):      # Copernican concentric circles. Earth: n_E, L_E (radius 1); planet: n_P, L_P, a_P, i, Om
    nE, LE, nP, LP, aP, i, Om = p
    E = rot_plane((np.cos(LE + nE * t), np.sin(LE + nE * t)), 0, 0)
    P = rot_plane((abs(aP) * np.cos(LP - Om + nP * t), abs(aP) * np.sin(LP - Om + nP * t)), i, Om)
    return P - E


def m_ptol(p, t):      # Earth at rest. Deferent: eccentric circle radius 1 + equant (free fraction f), inclined;
    nD, LD, kD, hD, fD, i, Om, r, nC, LC = p      # epicycle: radius r in the ecliptic plane, uniform motion
    kk, hh = rot2(kD, hD, -Om)
    Dv = rot_plane(equant_xy(t, nD, LD - Om, kk, hh, fD, 1.0), i, Om)
    Ep = np.stack([abs(r) * np.cos(LC + nC * t), abs(r) * np.sin(LC + nC * t), 0 * t], 1)
    return Dv + Ep


def m_equant(p, t):    # heliocentric eccentric circles with equants, both orbits
    nE, LE, kE, hE, fE, nP, LP, kP, hP, fP, aP, i, Om = p
    E = rot_plane(equant_xy(t, nE, LE, kE, hE, fE, 1.0), 0, 0)
    kk, hh = rot2(kP, hP, -Om)
    return rot_plane(equant_xy(t, nP, LP - Om, kk, hh, fP, aP), i, Om) - E


def m_kep(p, t):       # heliocentric Kepler ellipses, both orbits (Earth a = 1 sets the scale)
    nE, LE, kE, hE, nP, LP, kP, hP, aP, i, Om = p
    E = rot_plane(kepler_xy(t, nE, LE, kE, hE, 1.0), 0, 0)
    kk, hh = rot2(kP, hP, -Om)
    return rot_plane(kepler_xy(t, nP, LP - Om, kk, hh, aP), i, Om) - E


Q3 = 2.0 / 3.0


def m_kep3(p, t):      # post hoc (PLAN family 7): a_P tied to the period ratio, a_P = (n_E / n_P)^(2/3)
    nE, LE, kE, hE, nP, LP, kP, hP, i, Om = p
    return m_kep([nE, LE, kE, hE, nP, LP, kP, hP, (nE / nP) ** Q3, i, Om], t)


def kepler_xy_rot(t, n, L0, k, h, a, wdot):
    a = abs(a); e = min(np.hypot(k, h), 0.95); w = np.arctan2(h, k) + wdot * t
    M = L0 - w + n * t
    E = M + e * np.sin(M)
    for _ in range(40):
        E = E - (E - e * np.sin(E) - M) / (1 - e * np.cos(E))
    xp = a * (np.cos(E) - e); yp = a * np.sqrt(1 - e * e) * np.sin(E)
    return (np.cos(w) * xp - np.sin(w) * yp, np.sin(w) * xp + np.cos(w) * yp)


def m_kep_aps(p, t):   # post hoc: Kepler with apse lines rotating uniformly (wdot in rad/day)
    nE, LE, kE, hE, nP, LP, kP, hP, aP, i, Om, wdE, wdP = p
    E = rot_plane(kepler_xy_rot(t, nE, LE, kE, hE, 1.0, wdE), 0, 0)
    kk, hh = rot2(kP, hP, -Om)
    return rot_plane(kepler_xy_rot(t, nP, LP - Om, kk, hh, aP, wdP), i, Om) - E


# ============================================================== fitting machinery
def outlier_flags(D, Umod, s=None, fitmask=None):
    dl, db, d = resid(D, Umod)
    zl, zb = dl / D['sel'], db / D['seb']
    if s is None:
        z = np.concatenate([zl[fitmask], zb[fitmask]])
        s = 1.4826 * np.median(np.abs(z - np.median(z)))
    bad = (np.maximum(np.abs(zl), np.abs(zb)) > ZCUT * s) | (d > DCUT)
    return bad, s


class ParamModel:
    def __init__(self, name, f, labels, family):
        self.name, self.f, self.labels, self.family = name, f, labels, family
        self.k = len(labels)

    def predict(self, D, p=None):
        return self.f(self.p if p is None else p, D['t'])

    def fit(self, D, m, starts, nfev=20000):
        best = None
        for p0 in starts:
            fun = lambda p: wres(D, self.f(p, D['t'][m]), m)
            r = least_squares(fun, p0, method='lm', x_scale='jac', max_nfev=nfev)
            if best is None or r.cost < best.cost: best = r
        self.p = best.x
        return best.x

    def cov(self, D, m):
        fun = lambda q: wres(D, self.f(q, D['t'][m]), m)
        p = self.p
        J = np.zeros((2 * m.sum(), len(p))); r0 = fun(p)
        for j in range(len(p)):
            h = 1e-7 * max(1.0, abs(p[j])); q = p.copy(); q[j] += h
            J[:, j] = (fun(q) - r0) / h
        s2 = np.sum(r0 ** 2) / (len(r0) - len(p))
        return s2 * np.linalg.pinv(J.T @ J), s2


class SplineModel:
    """No physics A: cubic smoothing spline in time for each coordinate of the unit direction vector."""
    family = 'no physics: smoothing spline in time'

    def __init__(self):
        self.name = 'A_spline_time'

    def fit(self, D, m, starts=None):
        t = D['t'][m]; o = np.argsort(t); t = t[o] + np.arange(len(t)) * 1e-6
        w = 1 / (np.sqrt(D['sel'][m] * D['seb'][m])[o] / AM)
        self.sp = [UnivariateSpline(t, D['U'][m][o, c], w=w, k=3, s=len(t)) for c in range(3)]
        self.k = sum(len(s.get_coeffs()) for s in self.sp)
        return None

    def predict(self, D, p=None):
        return np.stack([s(D['t']) for s in self.sp], 1)


class HarmonicModel:
    """No physics B: direction = normalised linear combination of exp(i (j w1 + k w2) t), |j| + |k| <= K, for the
    in-plane complex part and the matching real series for the out-of-plane part.  No geometry."""
    family = 'no physics: two-frequency harmonic series'

    def __init__(self, K):
        self.K = K; self.name = 'B_harmonic_K%d' % K
        self.terms = [(j, k) for j in range(-K, K + 1) for k in range(-K, K + 1) if abs(j) + abs(k) <= K]
        self.half = [(j, k) for (j, k) in self.terms if (j > 0) or (j == 0 and k > 0)]
        self.nz = len(self.terms); self.nr = 1 + 2 * len(self.half)
        self.k = 2 + 2 * self.nz + self.nr

    def basis(self, t, w):
        Z = np.stack([np.exp(1j * (j * w[0] + k * w[1]) * t) for (j, k) in self.terms], 1)
        R = [np.ones_like(t)]
        for (j, k) in self.half:
            ph = (j * w[0] + k * w[1]) * t; R += [np.cos(ph), np.sin(ph)]
        return Z, np.stack(R, 1)

    def unpack(self, p):
        w = p[:2]; cz = p[2:2 + self.nz] + 1j * p[2 + self.nz:2 + 2 * self.nz]; cr = p[2 + 2 * self.nz:]
        return w, cz, cr

    def f(self, p, t):
        w, cz, cr = self.unpack(p)
        Z, R = self.basis(t, w); z = Z @ cz
        return np.stack([z.real, z.imag, R @ cr], 1)

    def lin(self, D, m, w):
        Z, R = self.basis(D['t'][m], w)
        z = D['U'][m, 0] + 1j * D['U'][m, 1]
        wt = 1 / D['sel'][m]; wb = 1 / D['seb'][m]
        cz = np.linalg.lstsq(Z * wt[:, None], z * wt, rcond=None)[0]
        cr = np.linalg.lstsq(R * wb[:, None], D['U'][m, 2] * wb, rcond=None)[0]
        return np.concatenate([w, cz.real, cz.imag, cr])

    def predict(self, D, p=None):
        return self.f(self.p if p is None else p, D['t'])

    def fit(self, D, m, starts):
        best = None
        for w0 in starts:
            w0 = np.asarray(w0)[:2]
            cost = lambda w: np.sum(wres(D, self.f(self.lin(D, m, w), D['t'][m]), m) ** 2)
            r = minimize(cost, w0, method='Nelder-Mead', options={'xatol': 1e-10, 'fatol': 1e-8, 'maxiter': 3000})
            p0 = self.lin(D, m, r.x)
            # polish every coefficient on the true (normalised-direction) residuals
            rr = least_squares(lambda p: wres(D, self.f(p, D['t'][m]), m), p0, method='trf', x_scale='jac',
                               max_nfev=200)
            if best is None or rr.cost < best.cost: best = rr
        self.p = best.x
        return best.x


def fit_with_outliers(D, model, starts, base=None, maxit=5):
    tr = D['train'] if base is None else base
    m = tr.copy()
    p = model.fit(D, m, starts)
    for it in range(maxit):
        bad, s = outlier_flags(D, model.predict(D), fitmask=m)
        m_new = tr & ~bad
        if np.array_equal(m_new, m): break
        m = m_new
        p = model.fit(D, m, [p] if p is not None else starts)
    bad, s = outlier_flags(D, model.predict(D), fitmask=m)
    return m, s


def scores(D, U, s):
    dl, db, d = resid(D, U)
    bad, _ = outlier_flags(D, U, s=s)
    out = {}
    for nm, mm in [('in_sample', D['train']), ('held_out', ~D['train'])]:
        dd = d[mm]; ok = ~bad[mm]
        out[nm] = {'n_rows': int(mm.sum()),
                   'median_arcmin': round(float(np.median(dd)), 3),
                   'rms_arcmin': round(float(np.sqrt(np.mean(dd ** 2))), 3),
                   'n_outliers': int(bad[mm].sum()),
                   'median_arcmin_inliers': round(float(np.median(dd[ok])), 3),
                   'rms_arcmin_inliers': round(float(np.sqrt(np.mean(dd[ok] ** 2))), 3)}
    return out, bad, d, dl, db


# ============================================================== start values from the data
def ridge_starts(D):
    """2-D frequency search with the linear trick: for two uniform circular motions the condition 'model vector
    parallel to the observed in-plane direction' is linear in the two complex amplitudes (smallest eigenvector).
    Coarse global scan over periods 100-6000 d, then a fine scan around the best pair; returns several points
    along the valley (the circle approximation leaves a ridge of nearly equal minima)."""
    m = D['train']; t = D['t'][m]; lam = D['L'][m]

    def C(f):
        th = 2 * np.pi * f[:, None] * t[None, :] - lam[None, :]
        return np.stack([np.sin(th), np.cos(th)], 2)

    def scan(fa, fb, gap):
        Ca, Cb = C(fa), C(fb)
        Ga = np.einsum('fni,fnj->fij', Ca, Ca); Gb = np.einsum('fni,fnj->fij', Cb, Cb)
        Q = np.full((len(fa), len(fb)), np.inf); X = np.zeros((len(fa), len(fb), 4))
        for i in range(len(fa)):
            G12 = np.einsum('ni,gnj->gij', Ca[i], Cb)
            G = np.zeros((len(fb), 4, 4)); G[:, :2, :2] = Ga[i]; G[:, :2, 2:] = G12
            G[:, 2:, :2] = G12.transpose(0, 2, 1); G[:, 2:, 2:] = Gb
            w, v = np.linalg.eigh(G)
            A = np.hypot(v[:, 0, 0], v[:, 1, 0]); B = np.hypot(v[:, 2, 0], v[:, 3, 0])
            q = w[:, 0] / np.maximum(np.abs(A ** 2 - B ** 2), 1e-3) ** 2
            q[np.abs(fb - fa[i]) < gap] = np.inf
            Q[i] = q; X[i] = v[:, :, 0]
        return Q, X

    f = np.arange(1 / 6000, 1 / 100, 4e-6)
    Q, X = scan(f, f, 8.4e-5)
    i, j = np.unravel_index(np.argmin(Q), Q.shape)
    fa, fb = max(f[i], f[j]), min(f[i], f[j])   # fa: faster, fb: slower motion
    coarse = (1 / fa, 1 / fb)
    ga = fa + np.arange(-6e-5, 6e-5, 1e-6); gb = fb + np.arange(-6e-5, 6e-5, 1e-6)
    Q, X = scan(ga, gb, 0)
    order = np.argsort(Q, axis=None); pts = []
    for kk in order:
        a, b = np.unravel_index(kk, Q.shape)
        if any(abs(a - a2) < 5 and abs(b - b2) < 5 for a2, b2, _ in pts): continue
        pts.append((a, b, X[a, b]))
        if len(pts) == 4: break
    out = []
    for a, b, x in pts:
        cA = x[0] + 1j * x[1]; cB = x[2] + 1j * x[3]   # amplitudes of the faster / slower motion
        out.append((ga[a], gb[b], cA, cB))
    return coarse, out


def circle_starts(st):
    """heliocentric reading: vector = planet - earth; try each motion as 'earth' (radius 1)."""
    res = []
    for fa, fb, cA, cB in st:
        for (fE, cE, fP, cP) in [(fa, cA, fb, cB), (fb, cB, fa, cA)]:
            for Om in np.linspace(0, 2 * np.pi, 4, endpoint=False):
                res.append([2 * np.pi * fE, np.angle(-cE), 2 * np.pi * fP, np.angle(cP), abs(cP) / abs(cE), 0.03, Om])
    return res


def periodogram_freqs(D, m):
    """model-free: strongest frequency of the complex in-plane direction signal, then the best second
    frequency for the K = 1 harmonic model by a 1-D scan over 100-6000 d."""
    t = D['t'][m]; z = D['U'][m, 0] + 1j * D['U'][m, 1]
    f = np.arange(1 / 6000, 1 / 100, 2e-7) * 2 * np.pi
    P = np.abs(np.exp(-1j * np.outer(f, t)) @ z) ** 2
    w1 = f[np.argmax(P)]
    hm = HarmonicModel(1)
    best = (np.inf, None)
    for w1b in w1 + 2 * np.pi * np.arange(-4e-5, 4.01e-5, 2e-6):
        for w2 in 2 * np.pi * np.arange(1 / 6000, 1 / 100, 4e-6):
            if abs(w2 - w1b) < 2 * np.pi * 2e-5: continue
            w = np.array([w1b, w2])
            c = np.sum(wres(D, hm.f(hm.lin(D, m, w), t), m) ** 2)
            if c < best[0]: best = (c, w)
    return w1, best[1]


# ============================================================== main
def main():
    assert hashlib.sha256(open(os.path.join(HERE, 'positions.csv'), 'rb').read()).hexdigest() == SHA
    D = load()
    tr = D['train']
    print('rows: train %d, held out %d' % (tr.sum(), (~tr).sum()))
    log = {}
    models = {}

    # ---------- start values
    coarse, st = ridge_starts(D)
    log['grid_coarse_periods_d'] = coarse
    log['grid_fine_valley_periods_d'] = [(1 / a, 1 / b) for a, b, _, _ in st]
    print('grid: coarse periods', coarse, 'valley', log['grid_fine_valley_periods_d'])

    # ---------- family 4: heliocentric circles
    circ = ParamModel('H_circles', m_circ, ['n_E', 'L_E', 'n_P', 'L_P', 'a_P', 'i', 'Omega'],
                      'heliocentric uniform concentric circles (Copernican, no eccentrics)')
    circ.fit(D, tr, circle_starts(st))
    circ_valley = []
    for c0 in circle_starts(st):   # keep every valley start's circle solution as seeds for Kepler
        c1 = least_squares(lambda p: wres(D, m_circ(p, D['t'][tr]), tr), c0, method='lm', x_scale='jac').x
        circ_valley.append(c1)
    models['H_circles'] = circ

    # ---------- family 6: Kepler ellipses (seeded by circle solutions, multistart over perihelion directions)
    kep = ParamModel('H_kepler', m_kep, ['n_E', 'L_E', 'k_E', 'h_E', 'n_P', 'L_P', 'k_P', 'h_P', 'a_P', 'i', 'Omega'],
                     'heliocentric Kepler ellipses for both orbits')
    pre = []
    for c in circ_valley:
        nE, LE, nP, LP, aP, i, Om = c
        if abs(aP) < 1:   # by convention call the inner orbit 'E' (the observer): swap the reading
            continue
        for we in np.linspace(0, 2 * np.pi, 8, endpoint=False):
            for wp in np.linspace(0, 2 * np.pi, 8, endpoint=False):
                s0 = [nE, LE, 0.02 * np.cos(we), 0.02 * np.sin(we), nP, LP, 0.08 * np.cos(wp), 0.08 * np.sin(wp),
                      abs(aP), i, Om]
                r = least_squares(lambda p: wres(D, m_kep(p, D['t'][tr]), tr), s0, method='trf', loss='soft_l1',
                                  f_scale=3, x_scale='jac', max_nfev=150)
                pre.append((r.cost, r.x))
    pre.sort(key=lambda z: z[0])
    kep_seeds = [z[1] for z in pre[:4]]
    models['H_kepler'] = kep
    kep.fit(D, tr, kep_seeds)

    # ---------- family 5: heliocentric eccentric circles + equants (seeded from Kepler, f in {1, 2})
    eq = ParamModel('H_equant_circles', m_equant,
                    ['n_E', 'L_E', 'k_E', 'h_E', 'f_E', 'n_P', 'L_P', 'k_P', 'h_P', 'f_P', 'a_P', 'i', 'Omega'],
                    'heliocentric eccentric circles with equants, both orbits, equant fraction free')
    pk = kep.p
    eq_seeds = []
    for fE in [1.0, 2.0]:
        for fP in [1.0, 2.0]:
            eq_seeds.append([pk[0], pk[1], pk[2] / fE, pk[3] / fE, fE, pk[4], pk[5], pk[6] / fP, pk[7] / fP, fP,
                             abs(pk[8]), pk[9], pk[10]])
    models['H_equant_circles'] = eq

    # ---------- family 3: geocentric deferent + epicycle (Earth at rest, circular epicycle, equant free)
    ptol = ParamModel('G_ptolemy_equant', m_ptol,
                      ['n_def', 'L_def', 'k_def', 'h_def', 'f_equant', 'i', 'Omega', 'r_epi', 'n_epi', 'L_epi'],
                      'geocentric eccentric deferent with equant + circular epicycle (Earth at rest)')
    a = abs(pk[8])
    pt_seeds = [[pk[4], pk[5], pk[6] / fD, pk[7] / fD, fD, pk[9], pk[10], 1 / a, pk[0], pk[1] + np.pi]
                for fD in [1.0, 2.0]]
    models['G_ptolemy_equant'] = ptol

    # ---------- no physics
    spl = SplineModel()
    models['A_spline_time'] = spl
    w1, w12 = periodogram_freqs(D, tr)
    log['periodogram_strongest_period_d'] = 2 * np.pi / w1
    log['harmonic_K1_scan_periods_d'] = list(2 * np.pi / w12)
    print('periodogram', log['periodogram_strongest_period_d'], 'K1 scan', log['harmonic_K1_scan_periods_d'])
    harm = {K: HarmonicModel(K) for K in [1, 2, 3, 4]}
    for K, h in harm.items(): models[h.name] = h

    seeds = {'H_circles': circle_starts(st), 'H_kepler': kep_seeds, 'H_equant_circles': eq_seeds,
             'G_ptolemy_equant': pt_seeds, 'A_spline_time': None}
    for K, h in harm.items(): seeds[h.name] = [w12]

    # ---------- fit every family with the outlier rule
    fitted = {}
    for name, mod in models.items():
        m, s = fit_with_outliers(D, mod, seeds[name])
        fitted[name] = (m, s)
        sc, bad, d, dl, db = scores(D, mod.predict(D), s)
        print('%-18s k=%3d rejected(train)=%2d  in: med %.2f rms %.2f | held-out: med %.2f rms %.2f (inl med %.2f rms %.2f)'
              % (name, mod.k, (tr & ~m).sum(), sc['in_sample']['median_arcmin'], sc['in_sample']['rms_arcmin'],
                 sc['held_out']['median_arcmin'], sc['held_out']['rms_arcmin'],
                 sc['held_out']['median_arcmin_inliers'], sc['held_out']['rms_arcmin_inliers']))
    return D, models, fitted, seeds, log


def finish(D, models, fitted, seeds, log, posthoc=None):
    tr = D['train']
    # common inlier set for BIC: training rows that are inliers for every physical and harmonic model
    common = tr.copy()
    for name, (m, s) in fitted.items(): common &= m
    table = {}
    keep = {}
    for name, mod in models.items():
        m, s = fitted[name]
        sc, bad, d, dl, db = scores(D, mod.predict(D), s)
        keep[name] = (np.array(mod.p).copy() if getattr(mod, 'p', None) is not None else None)
        bics = {}
        sets = {'common_train': common, 'kepler_inliers_posthoc': fitted['H_kepler'][0]}
        for key, cs in sets.items():   # refit on each reference set for BIC (start from the fitted solution)
            if isinstance(mod, SplineModel):
                mod.fit(D, cs)
            else:
                mod.fit(D, cs, [keep[name]])
            r = wres(D, mod.predict(D)[cs], cs); n = len(r); chi2 = float(np.sum(r ** 2))
            bics[key] = (float(n * np.log(chi2 / n) + mod.k * np.log(n)), chi2, n)
        b, chi2, n = bics['common_train']
        # restore the outlier-rule fit used for the scores
        if isinstance(mod, SplineModel):
            mod.fit(D, m)
        else:
            mod.fit(D, m, [keep[name]])
        table[name] = {'family': mod.family, 'k_params': int(mod.k), 'train_rows_rejected': int((tr & ~m).sum()),
                       'robust_scale_s': round(float(s), 3), 'BIC_common_train': round(b, 1),
                       'chi2_common_train': round(chi2, 1), 'n_resid_common': n,
                       'BIC_kepler_inliers_posthoc': round(bics['kepler_inliers_posthoc'][0], 1),
                       'chi2_kepler_inliers_posthoc': round(bics['kepler_inliers_posthoc'][1], 1),
                       'n_resid_kepler_inliers': bics['kepler_inliers_posthoc'][2], **sc}
    return table, common


def decide(table, candidates, bkey='BIC_common_train'):
    best = min(table[c]['held_out']['median_arcmin'] for c in candidates)
    tied = []
    for c in candidates:
        h = table[c]['held_out']['median_arcmin']; i = table[c]['in_sample']['median_arcmin']
        fails = h > 3 * i
        table[c]['fails_later_years'] = bool(fails)
        if h <= 1.25 * best and not fails: tied.append(c)
    return min(tied, key=lambda c: table[c][bkey]), tied


if __name__ == '__main__':
    import pickle
    D, models, fitted, seeds, log = main()
    # ---------- post hoc (PLAN family 7): Kepler with a_P tied to the period ratio
    kep = models['H_kepler']; pk = kep.p
    from fractions import Fraction
    q_fit = np.log(abs(pk[8])) / np.log(pk[0] / pk[4])
    Q3 = float(Fraction(q_fit).limit_denominator(4))      # PLAN family 7: simple fraction with denominator <= 4
    log['q_fitted'] = q_fit; log['q_used'] = Q3
    print('size ~ period^q with q = %.5f -> %s' % (q_fit, Fraction(q_fit).limit_denominator(4)))
    ratio_free = abs(pk[8]); ratio_law = (pk[0] / pk[4]) ** Q3
    log['kepler_aP_free'] = ratio_free; log['kepler_aP_from_periods^(2/3)'] = ratio_law
    k3 = ParamModel('H_kepler_3rd_law', m_kep3, ['n_E', 'L_E', 'k_E', 'h_E', 'n_P', 'L_P', 'k_P', 'h_P', 'i', 'Omega'],
                    'heliocentric Kepler ellipses with a_P = (P_P/P_E)^(2/3) imposed (post hoc)')
    s3 = [list(pk[:8]) + list(pk[9:])]
    models['H_kepler_3rd_law'] = k3
    m3, sc3 = fit_with_outliers(D, k3, s3)
    fitted['H_kepler_3rd_law'] = (m3, sc3)
    # ---------- post hoc: Kepler + uniform rotation of both apse lines (tests for slow orbit changes)
    aps = ParamModel('H_kepler_apsidal_posthoc', m_kep_aps,
                     ['n_E', 'L_E', 'k_E', 'h_E', 'n_P', 'L_P', 'k_P', 'h_P', 'a_P', 'i', 'Omega', 'wdot_E', 'wdot_P'],
                     'Kepler ellipses + uniformly rotating apse lines (post hoc)')
    models[aps.name] = aps
    fitted[aps.name] = fit_with_outliers(D, aps, [list(pk) + [0.0, 0.0]])
    table, common = finish(D, models, fitted, seeds, log)
    pre_registered = [n for n in table if n not in ('H_kepler_3rd_law', 'H_kepler_apsidal_posthoc')]
    win_pre, tied_pre = decide(table, pre_registered)
    win_all, tied_all = decide(table, list(table))
    win_ph, tied_ph = decide(table, list(table), 'BIC_kepler_inliers_posthoc')
    log['decision_posthoc_BIC_on_kepler_inliers'] = {'winner': win_ph, 'tied': tied_ph}
    print('winner (post hoc BIC on Kepler inliers):', win_ph, tied_ph)
    log['decision_preregistered'] = {'winner': win_pre, 'tied': tied_pre}
    log['decision_including_posthoc'] = {'winner': win_all, 'tied': tied_all}
    for n, v in table.items():
        print('%-18s k=%3d BIC=%9.1f  in med %.2f rms %.2f  held med %.2f rms %.2f  inl %.2f/%.2f  out(tr/te)=%d/%d'
              % (n, v['k_params'], v['BIC_common_train'], v['in_sample']['median_arcmin'], v['in_sample']['rms_arcmin'],
                 v['held_out']['median_arcmin'], v['held_out']['rms_arcmin'], v['held_out']['median_arcmin_inliers'],
                 v['held_out']['rms_arcmin_inliers'], v['train_rows_rejected'], v['held_out']['n_outliers']))
    print('winner (pre-registered set):', win_pre, tied_pre)
    print('winner (incl. post hoc):', win_all, tied_all)
    os.makedirs(os.path.join(HERE, 'work'), exist_ok=True)
    state = {'table': table, 'log': log,
             'params': {n: (list(map(float, mo.p)) if getattr(mo, 'p', None) is not None else None)
                        for n, mo in models.items()},
             'masks': {n: fitted[n][0].tolist() for n in fitted}, 'scales': {n: fitted[n][1] for n in fitted},
             'common': common.tolist()}
    json.dump(state, open(os.path.join(HERE, 'work', 'results.json'), 'w'), indent=1, default=float)
    pickle.dump({n: (mo.p if getattr(mo, 'p', None) is not None else None) for n, mo in models.items()},
                open(os.path.join(HERE, 'work', 'params.pkl'), 'wb'))
    import report
    report.write_all(D, models, fitted, table, log, win_pre, win_all, common)
    print('done')
