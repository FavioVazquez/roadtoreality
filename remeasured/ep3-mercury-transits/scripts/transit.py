"""Contact geometry from Horizons apparent positions, time conversions and Delta T.

Conventions
- Newcomb's times are on the astronomical day (it starts at noon): civil = astronomical + 12 h.
- Newcomb's equation of time is printed as the correction apparent -> mean: mean = apparent + E.
- Longitudes here are east-positive (Newcomb prints west-positive hours; converted in stations.csv).
- Contact II/III (internal): centre separation = R_sun - r_merc; I/IV (external): R_sun + r_merc,
  with both radii taken from Horizons' angular diameters at that instant and place.
- O-C (s) = observed instant - Horizons instant, both on the TT scale.
"""
import math

import numpy as np

import hz

ARCSEC = 180 / math.pi * 3600


def jd_gregorian(y, m, d, hours=0.0):
    """Julian Date for a Gregorian calendar date + hours (Meeus, Astronomical Algorithms, ch. 7)."""
    if m <= 2:
        y, m = y - 1, m + 12
    a = y // 100
    b = 2 - a + a // 4
    return int(365.25 * (y + 4716)) + int(30.6001 * (m + 1)) + d + b - 1524.5 + hours / 24.0


def hms(s):
    """'h:m:s' -> seconds (float)."""
    h, m, sec = s.split(":")
    return int(h) * 3600 + int(m) * 60 + float(sec)


def fmt_hms(sec):
    sec = sec % 86400
    h = int(sec // 3600)
    m = int((sec - 3600 * h) // 60)
    return f"{h:02d}:{m:02d}:{sec - 3600 * h - 60 * m:04.1f}"


def deltat_em(year_dec):
    """Delta T = TT - UT1 in seconds, Espenak & Meeus (2006) polynomials fitted to
    Morrison & Stephenson (2004); text from https://eclipse.gsfc.nasa.gov/SEhelp/deltatpoly2004.html
    (cached in data/ref/deltatpoly2004.html). Valid branches for 1600-2050 only."""
    y = year_dec
    if 1600 <= y < 1700:
        t = y - 1600
        return 120 - 0.9808 * t - 0.01532 * t**2 + t**3 / 7129
    if 1700 <= y < 1800:
        t = y - 1700
        return 8.83 + 0.1603 * t - 0.0059285 * t**2 + 0.00013336 * t**3 - t**4 / 1174000
    if 1800 <= y < 1860:
        t = y - 1800
        return (13.72 - 0.332447 * t + 0.0068612 * t**2 + 0.0041116 * t**3 - (0.000374 + 0.00000036) * t**4
                + 0.0000121272 * t**5 - 0.0000001699 * t**6 + 0.000000000875 * t**7)
    if 1860 <= y < 1900:
        t = y - 1860
        return (7.62 + 0.5737 * t - 0.251754 * t**2 + 0.01680668 * t**3
                - 0.0004473624 * t**4 + t**5 / 233174)
    if 1986 <= y < 2005:
        t = y - 2000
        return (63.86 + 0.3345 * t - 0.060374 * t**2 + 0.0017275 * t**3
                + 0.000651814 * t**4 + 0.00002373599 * t**5)
    if 2005 <= y < 2050:
        t = y - 2000
        return 62.92 + 0.32217 * t + 0.005589 * t**2
    raise ValueError(f"no Delta T branch for {y}")


def _unit(ra, dec):
    a, d = np.radians(ra), np.radians(dec)
    return np.stack([np.cos(d) * np.cos(a), np.cos(d) * np.sin(a), np.sin(d)], axis=-1)


def series(jd_center_tt, half_min, site=None, center="500@399"):
    """1-second grid of Sun/Mercury geometry around jd_center_tt (TT).
    Returns t (JD TT), sep, R_sun, r_merc (arcsec) and Mercury's offset from the Sun's centre
    (x east, y north, arcsec, gnomonic)."""
    n = int(2 * half_min * 60)
    j0 = jd_center_tt - half_min / 1440
    j1 = jd_center_tt + half_min / 1440
    s = hz.observer("10", j0, j1, n, center=center, site=site)
    m = hz.observer("199", j0, j1, n, center=center, site=site)
    assert np.allclose(s["jd"], m["jd"])
    us, um = _unit(s["ra"], s["dec"]), _unit(m["ra"], m["dec"])
    sep = 2 * np.arcsin(np.linalg.norm(um - us, axis=-1) / 2) * ARCSEC
    a0, d0 = np.radians(s["ra"]), np.radians(s["dec"])
    a, d = np.radians(m["ra"]), np.radians(m["dec"])
    cosc = np.sin(d0) * np.sin(d) + np.cos(d0) * np.cos(d) * np.cos(a - a0)
    x = np.cos(d) * np.sin(a - a0) / cosc * ARCSEC
    y = (np.cos(d0) * np.sin(d) - np.sin(d0) * np.cos(d) * np.cos(a - a0)) / cosc * ARCSEC
    return {"t": s["jd"], "sep": sep, "Rs": s["angdiam"] / 2, "rm": m["angdiam"] / 2, "x": x, "y": y,
            "tdb_ut": s["tdb_ut"], "source": (s["source"], m["source"])}


def contact(ser, kind, jd_hint):
    """Instant (JD TT) of contact `kind` in ('I','II','III','IV') nearest jd_hint, plus the
    path speed of Mercury with respect to the Sun and the radial rate there (arcsec/min)."""
    ingress = kind in ("I", "II")
    target = ser["Rs"] + ser["rm"] if kind in ("I", "IV") else ser["Rs"] - ser["rm"]
    f = ser["sep"] - target
    if ingress:
        idx = np.where((f[:-1] > 0) & (f[1:] <= 0))[0]
    else:
        idx = np.where((f[:-1] < 0) & (f[1:] >= 0))[0]
    if len(idx) == 0:
        return None
    t = ser["t"]
    i = idx[np.argmin(np.abs(t[idx] - jd_hint))]
    frac = f[i] / (f[i] - f[i + 1])
    tc = t[i] + frac * (t[i + 1] - t[i])
    dt_min = (t[i + 1] - t[i]) * 1440
    vx = (ser["x"][i + 1] - ser["x"][i]) / dt_min
    vy = (ser["y"][i + 1] - ser["y"][i]) / dt_min
    v = math.hypot(vx, vy)
    vr = (ser["sep"][i + 1] - ser["sep"][i]) / dt_min
    return {"jd": tc, "v_path": v, "v_radial": vr, "target": float(target[i]),
            "Rs": float(ser["Rs"][i]), "rm": float(ser["rm"][i]),
            "tdb_ut": float(np.interp(tc, t, ser["tdb_ut"]))}


def radial_error(ser, kind, jd_obs):
    """Separation predicted at the observed instant minus the contact separation (arcsec).
    Positive = at the recorded instant Horizons puts Mercury's centre farther from the Sun's
    centre than the contact geometry requires."""
    target = ser["Rs"] + ser["rm"] if kind in ("I", "IV") else ser["Rs"] - ser["rm"]
    return float(np.interp(jd_obs, ser["t"], ser["sep"] - target))
