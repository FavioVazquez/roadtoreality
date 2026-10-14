"""Newtonian-only solar-system model (REBOUND 4.4.10, IAS15) and its geocentric contact finder.

Physics in the model: point-mass Newtonian gravity of the Sun, Mercury, Venus, Earth-Moon barycentre,
Mars, Jupiter, Saturn, Uranus, Neptune and Pluto system barycentres. No terms beyond Newtonian point-mass gravity, no solar
oblateness, no asteroids. Initial conditions: JPL Horizons (DE441) barycentric states at EPOCH.

Optional extra term (the fitted parameter): an inverse-cube central acceleration on Mercury toward the
Sun, a = -C r_hat / r^3. By Newton's theorem of revolving orbits this turns the orbit uniformly, i.e. it
adds a pure apsidal advance; C is converted to arcsec/century with calibrate_C() (two-body run).

Observer: the geocentre is taken from Horizons (body 399) rather than integrated: the Earth's orbit is
treated as known (as it was historically, from solar observations), and only Mercury's motion is the
Newtonian model under test. The Earth-Moon barycentre is still integrated as a perturber of Mercury.
The Sun's barycentric position in the geometry is also Horizons'; the model supplies only Mercury's
heliocentric vector: Mercury_bary = Sun_Horizons + (Mercury_model - Sun_model).
Directions: light-time for Sun and Mercury, annual aberration (first order) for both; no light deflection.
Contacts: centre separation = R_sun -/+ r_merc with R_sun = 695,700 km, r_merc = 2,440.53 km (Horizons'
radii), so the model and the Horizons contact finder share one geometry.
"""
import math
import os

import numpy as np
import rebound
from scipy.interpolate import CubicSpline

import hz
import transit as T

AU_KM = 149597870.7
DAY = 86400.0
C_AUD = 299792.458 * DAY / AU_KM  # speed of light, AU/day
GM_KM = {  # km^3/s^2
    "10": 132712440041.93938,  # Sun, Horizons DE441 header
    "199": 22031.86855,  # Mercury, Horizons header
    "299": 324858.592,  # Venus, Horizons header
    "3": 398600.435507 + 4902.800066,  # Earth + Moon (Earth: DE440; Moon: Horizons header)
    "4": 42828.375816, "5": 126712764.1, "6": 37940584.8418,  # system GMs, DE440 (Park et al. 2021)
    "7": 5794556.4, "8": 6836527.10058, "9": 975.5,
}
ORDER = ["10", "199", "299", "3", "4", "5", "6", "7", "8", "9"]
NAMES = dict(zip(ORDER, ["Sun", "Mercury", "Venus", "Earth-Moon", "Mars", "Jupiter", "Saturn", "Uranus",
                         "Neptune", "Pluto"]))
EPOCH = T.jd_gregorian(1780, 1, 1, 0.0)  # TDB
R_SUN = 695700.0 / AU_KM
R_MER = 2440.53 / AU_KM


def gm_au(k):
    return GM_KM[k] * DAY**2 / AU_KM**3


def horizons_states(epoch=EPOCH):
    return {b: hz.vectors(b, [epoch])[0][0] for b in ORDER}


def mercury_elements(states):
    """Heliocentric osculating elements of Mercury at epoch from Horizons states (a,e,inc,Omega,pomega,l)."""
    sim = rebound.Simulation()
    sim.G = 1.0
    for b in ("10", "199"):
        x = states[b]
        sim.add(m=gm_au(b), x=x[0], y=x[1], z=x[2], vx=x[3], vy=x[4], vz=x[5])
    o = sim.particles[1].orbit(primary=sim.particles[0])
    return np.array([o.a, o.e, o.inc, o.Omega, o.pomega, o.l])


def build(states, elems=None, C=0.0, bodies=ORDER):
    sim = rebound.Simulation()
    sim.G = 1.0
    sim.integrator = "ias15"
    for b in bodies:
        x = states[b]
        if b == "199" and elems is not None:
            a, e, inc, Om, pom, l = elems
            sim.add(primary=sim.particles[0], m=gm_au(b), a=a, e=e, inc=inc, Omega=Om, pomega=pom, l=l)
        else:
            sim.add(m=gm_au(b), x=x[0], y=x[1], z=x[2], vx=x[3], vy=x[4], vz=x[5])
    sim.t = 0.0
    if C != 0.0:
        im = bodies.index("199")

        def extra(simp):
            ps = simp.contents.particles  # the simulation being integrated (also valid for copies)
            s, m = ps[0], ps[im]
            dx, dy, dz = m.x - s.x, m.y - s.y, m.z - s.z
            r2 = dx * dx + dy * dy + dz * dz
            f = -C / (r2 * r2)  # -C r_hat / r^3 = -C r_vec / r^4
            m.ax += f * dx
            m.ay += f * dy
            m.az += f * dz

        sim.additional_forces = extra
        sim._extra_ref = extra  # keep the callback alive
    return sim


def sample(sim, times, idx):
    """Integrate to each time (days from epoch, any order) and return positions/velocities of the
    particles in idx: dict t -> array (len(idx), 6). Integrates backward then forward from epoch."""
    out = {}
    times = np.unique(np.asarray(times))
    neg = sorted([t for t in times if t < 0], reverse=True)
    pos = sorted([t for t in times if t >= 0])
    snap = sim.copy()
    for seq, s in ((neg, sim), (pos, snap)):
        if s is snap:
            s.integrator = "ias15"
            if hasattr(sim, "_extra_ref"):
                s.additional_forces = sim._extra_ref
        for t in seq:
            s.integrate(t, exact_finish_time=1)
            ps = s.particles
            out[t] = np.array([[ps[i].x, ps[i].y, ps[i].z, ps[i].vx, ps[i].vy, ps[i].vz] for i in idx])
    return out


GRID = np.arange(-2760, 2401, 120) / DAY  # sample offsets around each contact guess (days)
HALFW = 2000  # seconds searched either side of the guess
if os.environ.get("EP3_WIDE"):  # wider search, used to follow the time-offset fit down its flat valley
    GRID = np.arange(-6360, 6001, 120) / DAY
    HALFW = 5600


def earth_tables(guesses_tt):
    """Horizons geocentre (399) and Sun (10) barycentric states on GRID around each guess (cached)."""
    return [(hz.vectors("399", list(g + GRID))[0], hz.vectors("10", list(g + GRID))[0]) for g in guesses_tt]


def contact_times(sim, guesses_tt, kinds, earth, bodies=ORDER):
    """Model geocentric contact instants (JD TDB~TT) nearest each guess."""
    t0 = np.array(guesses_tt) - EPOCH
    req = np.concatenate([g + GRID for g in t0])
    idx = [bodies.index(b) for b in ("10", "199")]
    st = sample(sim, req, idx)
    res = []
    for g, kind, et in zip(t0, kinds, earth):
        tt = g + GRID
        arr = np.array([st[t] for t in tt])  # (n, 2 bodies, 6)
        et, sh = et
        sun_h = CubicSpline(tt, sh[:, :3])
        helio = CubicSpline(tt, arr[:, 1, :3] - arr[:, 0, :3])
        spl = [sun_h, lambda x: sun_h(x) + helio(x)]
        espl = CubicSpline(tt, et[:, :3])
        vspl = CubicSpline(tt, et[:, 3:6])
        fine = g + np.arange(-HALFW, HALFW + 1, 1.0) / DAY
        E = espl(fine)
        vE = vspl(fine)

        def apparent(j):
            tau = np.zeros_like(fine)
            for _ in range(3):
                d = spl[j](fine - tau) - E
                tau = np.linalg.norm(d, axis=1) / C_AUD
            u = d / np.linalg.norm(d, axis=1)[:, None]
            beta = vE / C_AUD
            u = u + beta - np.sum(u * beta, axis=1)[:, None] * u
            return u / np.linalg.norm(u, axis=1)[:, None], np.linalg.norm(d, axis=1)

        us, ds = apparent(0)
        um, dm = apparent(1)
        sep = 2 * np.arcsin(np.linalg.norm(um - us, axis=1) / 2)
        Rs = np.arcsin(R_SUN / ds)
        rm = np.arcsin(R_MER / dm)
        target = Rs + rm if kind in ("I", "IV") else Rs - rm
        f = sep - target
        if kind in ("I", "II"):
            ii = np.where((f[:-1] > 0) & (f[1:] <= 0))[0]
        else:
            ii = np.where((f[:-1] < 0) & (f[1:] >= 0))[0]
        if len(ii) == 0:
            res.append(np.nan)
            continue
        i = ii[np.argmin(np.abs(fine[ii] - g))]
        fr = f[i] / (f[i] - f[i + 1])
        res.append(EPOCH + fine[i] + fr * (fine[i + 1] - fine[i]))
    return np.array(res)


def pomega_series(sim, t_days, i_merc=1):
    """Heliocentric osculating longitude of perihelion of Mercury (rad, unwrapped) at the times."""
    out = []
    for t in t_days:
        sim.integrate(t, exact_finish_time=1)
        o = sim.particles[i_merc].orbit(primary=sim.particles[0])
        out.append(o.pomega)
    return np.unwrap(np.array(out))


def rate_arcsec_per_century(t_days, pom):
    A = np.vstack([np.ones_like(t_days), t_days / 36525.0]).T
    coef, *_ = np.linalg.lstsq(A, pom, rcond=None)
    return math.degrees(coef[1]) * 3600


def calibrate_C(states, C=1e-9, years=200):
    """Extra apsidal advance (arcsec/century) per unit C, from a Sun+Mercury run with and without C."""
    t = np.linspace(0, years * 365.25, 2001)
    r = []
    for c in (0.0, C):
        sim = build(states, C=c, bodies=["10", "199"])
        r.append(rate_arcsec_per_century(t, pomega_series(sim, t)))
    return (r[1] - r[0]) / C, r
