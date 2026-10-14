"""Kill test, episode 1: reduce two of Tycho Brahe's 1595 Mars nights to geocentric apparent ecliptic
longitude and latitude of date, and compare with JPL Horizons (Mars barycenter, body 4, DE441).

Run:  data/.venv/bin/python -I reduce.py      (writes out/reduction.json and out/reduction_log.txt)

Inputs (see fetch.sh, SHA256SUMS):
  transcription.json                 hand transcription from the page images (Dreyer, Opera Omnia XII)
  data/hip/hip2_refstars.tsv         Hipparcos (van Leeuwen 2007, CDS I/311) for the reference and clock stars
  data/catalog/keplere.dat           Tycho's star catalogue (Verbunt & van Gent 2010, CDS J/A+A/516/A28)
  data/horizons/*.txt                raw JPL Horizons replies (fetched here if missing)

Steps, per night (each is a function below):
  1. clock: local sidereal time from the clock star's hour angle that the observers read on the armillary
     (LST = apparent RA of the star + hour angle west); other rows shifted by their clock difference at the
     sidereal rate. UT1 from LST by inverting Greenwich apparent sidereal time; TT = UT + Delta T.
  2. star places: Hipparcos positions moved to the date with proper motion, parallax and radial velocity, then
     apparent place (precession, nutation, annual aberration) on the true equator and equinox of date (astropy
     TETE). This is the primary frame.
  3. forward model of each measurement: Mars and the star are refracted (Saemundsson formula, standard
     atmosphere scaled to a guessed temperature and pressure) at the row's sidereal time; the model distance is the
     arc between the two refracted points; the armillary declination is the refracted declination plus a zero
     point fixed by the reference star whose declination the observers took the same night.
  4. least squares for Mars's true topocentric RA/Dec at the mean epoch of the rows used.
  5. diurnal parallax removed (topocentric to geocentric; uses the Earth-Mars distance from Horizons, a <0.4'
     effect), then rotation to the true ecliptic of date.
  6. comparison with Horizons: geocentric apparent ecliptic longitude/latitude of date (ObsEcLon/ObsEcLat),
     and topocentric RA/Dec from the Hven site as a second check.
  Side tracks: (a) Tycho's own arithmetic on the page, recomputed (checks transcription and geometry) and his
  printed result compared with Horizons; (b) the same least squares with Tycho's own catalogue positions
  (equinox 1601.0, moved back with Tycho's 51"/yr; cited) to show what his star frame does to the result;
  (c) sensitivity to the refraction weather guess.
"""
import json, math, pathlib, subprocess, sys, warnings
import numpy as np
from scipy.optimize import least_squares

warnings.filterwarnings("ignore")  # erfa 'dubious year' warnings for 1595 are expected
import erfa
import astropy.units as u
from astropy.time import Time
from astropy.coordinates import SkyCoord, ICRS, TETE, Distance

HERE = pathlib.Path(__file__).resolve().parent
DATA = HERE / "data"
OUT = HERE / "out"
OUT.mkdir(exist_ok=True)
(DATA / "horizons").mkdir(parents=True, exist_ok=True)

# Uraniborg, Hven (modern position of the site, approx.; cited). Tycho's own value for the latitude was 55 54 1/2.
LAT = 55.9075
LON_E = 12.6967
ELEV_KM = 0.05

D2R = math.pi / 180
LOG = []


def log(*a):
    s = " ".join(str(x) for x in a)
    print(s)
    LOG.append(s)


def dm(x):
    """[deg, min] -> degrees"""
    return x[0] + x[1] / 60.0


def fmt_dms(deg):
    s = "-" if deg < 0 else ""
    d = abs(deg)
    D = int(d); m = (d - D) * 60; M = int(m); S = (m - M) * 60
    return f"{s}{D}d{M:02d}'{S:04.1f}\""


def wrap180(x):
    return (x + 180.0) % 360.0 - 180.0


# ---------------------------------------------------------------- time

def delta_t_seconds(year):
    """Espenak & Meeus polynomial (NASA eclipse site), valid 1500-1600 and 1600-1700."""
    if year < 1600:
        uu = (year - 1000) / 100
        return (1574.2 - 556.01 * uu + 71.23472 * uu**2 + 0.319781 * uu**3 - 0.8503463 * uu**4
                - 0.005050998 * uu**5 + 0.0083572073 * uu**6)
    t = year - 1600
    return 120 - 0.9808 * t - 0.01532 * t**2 + t**3 / 7129


def gast_deg(jd_ut1, dt_s):
    jd_tt = jd_ut1 + dt_s / 86400
    return math.degrees(erfa.gst06a(jd_ut1, 0.0, jd_tt, 0.0)) % 360


def jd_from_lst(lst_deg, jd_guess, dt_s):
    """UT1 Julian date near jd_guess at which the local apparent sidereal time equals lst_deg."""
    jd = jd_guess
    for _ in range(6):
        cur = (gast_deg(jd, dt_s) + LON_E) % 360
        jd += wrap180(lst_deg - cur) / 360.98564736629
    return jd


# ---------------------------------------------------------------- stars

def load_hip():
    rows = {}
    for line in (DATA / "hip" / "hip2_refstars.tsv").read_text().splitlines():
        if not line or line.startswith("#") or line.startswith("HIP") or line.startswith("-") or line.startswith(" \t"):
            continue
        p = line.split("\t")
        try:
            rows[int(p[0])] = dict(ra=float(p[1]), dec=float(p[2]), plx=float(p[3]), pmra=float(p[4]), pmde=float(p[5]))
        except ValueError:
            pass
    return rows


# radial velocities (km/s), SIMBAD; only a second-order effect over 405 years (cited)
RV = {9884: -14.64, 15863: -2.04, 21421: 54.26, 113963: -2.71, 97649: -26.60, 107315: 3.39}


def star_apparent_tete(hip, jd_tt):
    """Apparent RA/Dec (deg) of a Hipparcos star on the true equator and equinox of date."""
    h = HIP[hip]
    c = SkyCoord(ra=h["ra"] * u.deg, dec=h["dec"] * u.deg, distance=Distance(parallax=h["plx"] * u.mas),
                 pm_ra_cosdec=h["pmra"] * u.mas / u.yr, pm_dec=h["pmde"] * u.mas / u.yr,
                 radial_velocity=RV.get(hip, 0.0) * u.km / u.s, frame=ICRS, obstime=Time(1991.25, format="jyear", scale="tt"))
    t = Time(jd_tt, format="jd", scale="tt")
    c2 = c.apply_space_motion(new_obstime=t)
    a = c2.transform_to(TETE(obstime=t))
    return a.ra.deg, a.dec.deg


def load_tycho_catalog():
    cat = {}
    for line in (DATA / "catalog" / "keplere.dat").read_text().splitlines():
        try:
            hip = int(line[49:55])
        except ValueError:
            continue
        Z = int(line[25:27]); d = int(line[28:30]); m = float(line[31:35])
        bd = int(line[36:38]); bm = float(line[39:43]); sg = line[44]
        cat[hip] = dict(lon=(Z - 1) * 30 + d + m / 60, lat=(1 if sg == "B" else -1) * (bd + bm / 60), raw=line)
    return cat


# ---------------------------------------------------------------- spherical geometry

def vec(ra, dec):
    a, d = ra * D2R, dec * D2R
    return np.array([math.cos(d) * math.cos(a), math.cos(d) * math.sin(a), math.sin(d)])


def radec(v):
    v = v / np.linalg.norm(v)
    return math.degrees(math.atan2(v[1], v[0])) % 360, math.degrees(math.asin(max(-1, min(1, v[2]))))


def sep(ra1, de1, ra2, de2):
    v1, v2 = vec(ra1, de1), vec(ra2, de2)
    return math.degrees(math.atan2(np.linalg.norm(np.cross(v1, v2)), np.dot(v1, v2)))


def eq2ecl(ra, dec, eps):
    e = eps * D2R
    x, y, z = vec(ra, dec)
    y2 = y * math.cos(e) + z * math.sin(e)
    z2 = -y * math.sin(e) + z * math.cos(e)
    return math.degrees(math.atan2(y2, x)) % 360, math.degrees(math.asin(z2))


def ecl2eq(lon, lat, eps):
    e = eps * D2R
    x, y, z = vec(lon, lat)
    y2 = y * math.cos(e) - z * math.sin(e)
    z2 = y * math.sin(e) + z * math.cos(e)
    return math.degrees(math.atan2(y2, x)) % 360, math.degrees(math.asin(z2))


def true_obliquity(jd_tt):
    eps0 = erfa.obl06(jd_tt, 0.0)
    dpsi, deps = erfa.nut06a(jd_tt, 0.0)
    return math.degrees(eps0 + deps)


# ---------------------------------------------------------------- refraction

WEATHER = dict(P_kpa=101.0, T_c=10.0)


def refraction_arcmin(h_true_deg, P_kpa=None, T_c=None):
    """Saemundsson (1986) refraction for a true altitude, scaled to pressure and temperature."""
    P = WEATHER["P_kpa"] if P_kpa is None else P_kpa
    T = WEATHER["T_c"] if T_c is None else T_c
    h = max(h_true_deg, -1.0)
    R = 1.02 / math.tan((h + 10.3 / (h + 5.11)) * D2R)
    return R * (P / 101.0) * (283.0 / (273.0 + T))


def altaz(ra, dec, lst):
    H = (lst - ra) * D2R; d = dec * D2R; p = LAT * D2R
    sh = math.sin(p) * math.sin(d) + math.cos(p) * math.cos(d) * math.cos(H)
    h = math.asin(sh)
    az = math.atan2(-math.cos(d) * math.sin(H), math.sin(d) * math.cos(p) - math.cos(d) * math.sin(p) * math.cos(H))
    return math.degrees(h), math.degrees(az) % 360


def from_altaz(h, az, lst):
    hh, A, p = h * D2R, az * D2R, LAT * D2R
    sd = math.sin(p) * math.sin(hh) + math.cos(p) * math.cos(hh) * math.cos(A)
    d = math.asin(sd)
    H = math.atan2(-math.cos(hh) * math.sin(A), math.sin(hh) * math.cos(p) - math.cos(hh) * math.sin(p) * math.cos(A))
    return (lst - math.degrees(H)) % 360, math.degrees(d)


def refract(ra, dec, lst, **w):
    h, az = altaz(ra, dec, lst)
    h2 = h + refraction_arcmin(h, **w) / 60.0
    return from_altaz(h2, az, lst)


# ---------------------------------------------------------------- parallax

def topo_to_geo(ra, dec, lst, dist_au):
    """Remove diurnal parallax: geocentric vector = topocentric vector + observer's geocentric position."""
    a, b = 6378.137, 6356.752
    p = LAT * D2R
    # geocentric distance and latitude of the site (WGS84 reference figure)
    C = 1 / math.sqrt(math.cos(p) ** 2 + (b / a) ** 2 * math.sin(p) ** 2)
    S = (b / a) ** 2 * C
    rx = (a * C + ELEV_KM) * math.cos(p) * math.cos(lst * D2R)
    ry = (a * C + ELEV_KM) * math.cos(p) * math.sin(lst * D2R)
    rz = (a * S + ELEV_KM) * math.sin(p)
    AU = 149597870.7
    v = vec(ra, dec) * dist_au * AU + np.array([rx, ry, rz])
    return radec(v)


# ---------------------------------------------------------------- Horizons

def horizons(name, jd_ut, center, site=None, quantities="1,2,20,23,31"):
    path = DATA / "horizons" / f"{name}.txt"
    if not path.exists():
        params = {
            "format": "text", "COMMAND": "'4'", "OBJ_DATA": "'YES'", "MAKE_EPHEM": "'YES'", "EPHEM_TYPE": "'OBSERVER'",
            "CENTER": f"'{center}'", "TLIST": f"'{jd_ut:.8f}'", "TLIST_TYPE": "'JD'", "TIME_TYPE": "'UT'",
            "QUANTITIES": f"'{quantities}'", "ANG_FORMAT": "'DEG'", "EXTRA_PREC": "'YES'", "CAL_FORMAT": "'BOTH'",
            "APPARENT": "'AIRLESS'", "REF_SYSTEM": "'ICRF'", "CSV_FORMAT": "'YES'",
        }
        if site:
            params["COORD_TYPE"] = "'GEODETIC'"
            params["SITE_COORD"] = f"'{site}'"
        q = "&".join(f"{k}={v}" for k, v in params.items())
        url = "https://ssd.jpl.nasa.gov/api/horizons.api?" + q.replace("'", "%27").replace("@", "%40").replace(",", "%2C")
        txt = subprocess.run(["/usr/bin/curl", "-sf", "-m", "120", url], capture_output=True, text=True, check=True).stdout
        path.write_text(txt)
    txt = path.read_text()
    body = txt.split("$$SOE")[1].split("$$EOE")[0].strip()
    head = txt.split("$$SOE")[0]
    cols = [c.strip() for c in head.strip().splitlines()[-2].split(",")]
    vals = [v.strip() for v in body.split(",")]
    rec = dict(zip(cols, vals))
    meta = [l.strip() for l in txt.splitlines() if ("Target body name" in l or "Center body name" in l
                                                     or "ephemeris" in l.lower() and "DE" in l or "Center geodetic" in l)]
    return rec, meta


# ---------------------------------------------------------------- solver

def solve(rows, star_pos, lsts, dec_rows, dec_zero, x0, use_dec=True, w=None):
    """rows: [(star_key, measured_distance_deg, row_index)], star_pos: key -> (ra, dec) in the working frame
    (true, unrefracted); lsts: row_index -> LST deg; dec_rows: [(measured_dec_deg, row_index)].
    Unknown: Mars (ra, dec) true topocentric at the mean epoch. Returns solution and residuals (arcmin)."""
    w = w or {}

    def resid(x):
        ra, de = x
        r = []
        for key, dmeas, i in rows:
            mra, mde = refract(ra, de, lsts[i], **w)
            sra, sde = refract(*star_pos[key], lsts[i], **w)
            r.append((sep(mra, mde, sra, sde) - dmeas) * 60)
        if use_dec:
            for dmeas, i in dec_rows:
                r.append((refract(ra, de, lsts[i], **w)[1] + dec_zero - dmeas) * 60)
        return np.array(r)

    sol = least_squares(resid, x0, x_scale=[0.01, 0.01])
    J = sol.jac
    res = resid(sol.x)
    dof = max(1, len(res) - 2)
    s2 = float(np.sum(res**2) / dof)
    try:
        cov = np.linalg.inv(J.T @ J) * s2
        err = np.sqrt(np.diag(cov)) * 60  # arcmin
    except np.linalg.LinAlgError:
        err = [float("nan"), float("nan")]
    return sol.x, res, err


# ---------------------------------------------------------------- the nights

def night(key, cfg):
    T = json.loads((HERE / "transcription.json").read_text())["nights"][key]
    log("=" * 100)
    log(f"NIGHT {key}  ({T['label']})  Julian {T['date_julian']} = Gregorian {T['date_gregorian']}  {T['session']}")
    log(f"  source: vol {T['source']['volume']}, p. {T['source']['printed_page']} ({T['source']['column']} column), "
        f"leaf {T['source']['leaf']}, {T['source']['image_url']}")
    stars = T["stars"]
    hip_of = {k: v["hip"] for k, v in stars.items()}

    # Gregorian civil date and a first guess of UT from the clock (local apparent time minus longitude)
    y, mo, d = (int(x) for x in T["date_gregorian"].split("-"))
    jd0 = sum(erfa.cal2jd(y, mo, d))  # 0h UT of the civil date
    year = y + (mo - 0.5) / 12
    dT = delta_t_seconds(year)
    hours_from_midnight = (lambda t: (12 + t[0] + t[1] / 60) if cfg["session"] == "vesperi" else (t[0] + t[1] / 60))
    rows = T["rows"]

    def clock_h(r):
        return hours_from_midnight(r["t"]) if r.get("t") else None

    # 1. clock: LST from the clock star readings
    ref = [r for r in rows if r.get("clock_star") and r.get("t") and "clock_ha_west" in r]
    jd_guess = jd0 + (clock_h(ref[0]) - LON_E / 15) / 24
    jd_tt_guess = jd_guess + dT / 86400
    clk_star = stars[ref[0]["clock_star"]]["hip"]
    ra_clk, de_clk = star_apparent_tete(clk_star, jd_tt_guess)
    log(f"  Delta T used: {dT:.0f} s (Espenak-Meeus polynomial; Mars moves <1'/h so this is irrelevant to the residual)")
    log(f"  clock star {ref[0]['clock_star']} = {stars[ref[0]['clock_star']]['modern']}: apparent RA {ra_clk:.4f}, Dec {de_clk:.4f}")
    offs = []
    for r in ref:
        lst = (ra_clk + dm(r["clock_ha_west"])) % 360
        # LST at clock 0 (sidereal degrees), assuming the clock ran at solar rate between rows
        offs.append(wrap180(lst - clock_h(r) * 15.041068640) % 360)
        log(f"    clock {r['t'][0]}h{r['t'][1]:05.2f}m  HA west {dm(r['clock_ha_west']):.4f} -> LST {lst:.4f} deg "
            f"({lst/15:.4f} h)")
    offs = np.array(offs)
    rel = np.array([wrap180(o - offs[0]) for o in offs])
    off = (offs[0] + float(np.median(rel))) % 360
    dev = (rel - np.median(rel)) * 4  # minutes of time
    log(f"    clock-to-LST offset: median of {len(offs)} readings; deviations of single readings (min of time): "
        f"{', '.join(f'{x:+.1f}' for x in dev)}; MAD {np.median(np.abs(dev)):.1f} min")

    def lst_of(h):
        return (off + h * 15.041068640) % 360

    # check: local apparent solar time implied by the clock star (Tycho's 'Resp.' if printed)
    jd_r = jd_from_lst(lst_of(clock_h(ref[-1])), jd_guess, dT)
    ra_sun = radec_sun(jd_r + dT / 86400)
    lat_solar = ((lst_of(clock_h(ref[-1])) - ra_sun) / 15 + 12) % 24
    log(f"    local apparent solar time at clock {ref[-1]['t']}: {int(lat_solar)}h{(lat_solar%1)*60:04.1f}m "
        f"(sun apparent RA {ra_sun:.3f})" + (f"; Tycho's note: {ref[-1].get('clock_note')}" if ref[-1].get('clock_note') else ""))

    # 2. reference star places (modern, apparent of date)
    jd_tt = jd_r + dT / 86400
    pos = {}
    for k, v in stars.items():
        pos[k] = star_apparent_tete(v["hip"], jd_tt)
        log(f"  star {k:45s} {v['modern']:24s} apparent RA {pos[k][0]:9.4f}  Dec {pos[k][1]:8.4f}")

    # rows used: distances to reference stars
    use = [(i, r) for i, r in enumerate(rows) if r.get("star") and r.get("dist") and i not in cfg.get("skip", [])]
    lsts = {i: lst_of(clock_h(r)) for i, r in enumerate(rows) if r.get("t")}
    for i in cfg.get("assume_time", {}):
        lsts[i] = lst_of(hours_from_midnight(cfg["assume_time"][i]))
    meas = [(r["star"], dm(r["dist"]), i) for i, r in use]
    decs = []
    for i, r in use + [(j, rows[j]) for j in cfg.get("dec_extra_rows", [])]:
        for dd in r.get("dec_mars", []):
            decs.append((dm(dd), i))
    decs = sorted(set(decs), key=lambda x: (x[1], x[0]))
    mean_lst_h = np.mean([clock_h(r) for _, r in use])
    jd_mean = jd_from_lst(lst_of(mean_lst_h), jd_guess, dT)
    log(f"  rows used: {len(meas)} distances, {len(decs)} declination readings; mean clock time "
        f"{int(mean_lst_h % 24)}h{(mean_lst_h % 1)*60:05.2f}m -> UT JD {jd_mean:.5f} ({jd_to_str(jd_mean)})")

    # armillary zero point from the reference star's declination the same night
    zr = cfg["dec_zero_star"]
    zrows = [(i, r) for i, r in enumerate(rows) if zr["field"] in r]
    zs = []
    zlst = {}
    for i, r in zrows:
        lst = lsts.get(i) if i in lsts else lst_of(hours_from_midnight(zr["assume_time"]))
        zlst[i] = lst
        model = refract(*pos[zr["star"]], lst)[1]
        for dd in r[zr["field"]]:
            zs.append(dm(dd) - model)
    dec_zero = float(np.mean(zs))
    log(f"  armillary zero point from {zr['star']}: measured - (modern refracted apparent) = "
        f"{', '.join(f'{z*60:+.2f}' for z in zs)} arcmin; mean {dec_zero*60:+.2f}'")

    # 3-4. least squares in the modern frame
    x0 = cfg["x0"]
    xs, res, err = solve(meas, pos, lsts, decs, dec_zero, x0, use_dec=cfg["use_dec"])
    log(f"  solution (true topocentric, equator of date): RA {xs[0]:.4f}  Dec {xs[1]:.4f}   formal err "
        f"{err[0]*math.cos(xs[1]*D2R):.2f}' (RA*cosDec), {err[1]:.2f}' (Dec)")
    for (k, dmeas, i), rr in zip(meas, res[:len(meas)]):
        log(f"    dist row {i:2d} {k[:28]:28s} meas {dmeas:8.4f}  residual {rr:+.2f}'")
    if cfg["use_dec"]:
        log(f"    declination residuals: {', '.join(f'{x:+.2f}' for x in res[len(meas):])} arcmin")
    # distance-only and declination checks
    xd, resd, errd = solve(meas, pos, lsts, decs, dec_zero, x0, use_dec=False)
    log(f"  distance-only solution: RA {xd[0]:.4f} Dec {xd[1]:.4f}  formal err {errd[0]*math.cos(xd[1]*D2R):.2f}', {errd[1]:.2f}'")
    dec_pred = [refract(xd[0], xd[1], lsts[i])[1] + dec_zero for _, i in decs]
    log(f"    armillary declination minus distance-only prediction: "
        f"{', '.join(f'{(dmeas-p)*60:+.2f}' for (dmeas, _), p in zip(decs, dec_pred))} arcmin")

    # sextant check: the observers' own star-to-star distance (Aldebaran - Hamal) against the modern refracted arc
    for i, r in enumerate(rows):
        if r.get("dist_aldebaran_hamal") and i in lsts:
            a = refract(*pos["Oculus Tauri / Aldebaran"], lsts[i]); b = refract(*pos["Lucida Arietis"], lsts[i])
            model = sep(*a, *b)
            for dd in r["dist_aldebaran_hamal"]:
                log(f"    sextant check row {i}: Aldebaran-Hamal measured {dm(dd):.4f}, modern refracted {model:.4f} "
                    f"-> measured - model {(dm(dd)-model)*60:+.2f}'")

    # Mars altitude check against the 'Altit.' column
    for i, r in enumerate(rows):
        if r.get("alt_mars") and i in lsts:
            h, _ = altaz(xs[0], xs[1], lsts[i])
            h_ref = h + refraction_arcmin(h) / 60
            log(f"    altitude check row {i}: printed {dm(r['alt_mars']):.3f}, model (refracted) {h_ref:.3f} "
                f"-> diff {(dm(r['alt_mars'])-h_ref)*60:+.1f}'")

    # 5. parallax and ecliptic
    hz_geo, meta_geo = horizons(f"{key}_geo", jd_mean, "500@399")
    hz_top, meta_top = horizons(f"{key}_hven", jd_mean, "coord@399", site=f"{LON_E},{LAT},{ELEV_KM}")
    delta = float(hz_geo["delta"])
    lst_mean = lst_of(mean_lst_h)
    ra_g, de_g = topo_to_geo(xs[0], xs[1], lst_mean, delta)
    eps = true_obliquity(jd_mean + dT / 86400)
    lam, bet = eq2ecl(ra_g, de_g, eps)
    lam_t, bet_t = eq2ecl(xs[0], xs[1], eps)
    log(f"  parallax: Earth-Mars distance {delta:.4f} au (Horizons, cited); shift "
        f"{sep(xs[0], xs[1], ra_g, de_g)*3600:.1f}\"")
    log(f"  true obliquity of date {eps:.5f}")
    log(f"  RESULT geocentric apparent ecliptic of date: lon {lam:.4f} ({fmt_dms(lam)})  lat {bet:.4f} ({fmt_dms(bet)})")

    # 6. Horizons
    hl, hb = float(hz_geo["ObsEcLon"]), float(hz_geo["ObsEcLat"])
    dl = wrap180(lam - hl) * 60 * math.cos(hb * D2R)
    db = (bet - hb) * 60
    log(f"  HORIZONS (geocentric, body 4, apparent ecliptic of date): lon {hl:.4f}  lat {hb:.4f}")
    for m in meta_geo:
        log(f"    | {m}")
    log(f"  RESIDUAL Tycho - Horizons: dlon*cos(lat) {dl:+.2f}'  dlat {db:+.2f}'  total {math.hypot(dl, db):.2f}'")
    # topocentric RA/Dec check (Horizons apparent RA/Dec from the site; airless)
    hra, hde = float(hz_top["R.A.__(a-app)"]), float(hz_top["DEC___(a-app)"])
    log(f"  Horizons topocentric (Hven) airless apparent RA/Dec {hra:.4f} {hde:.4f}; ours {xs[0]:.4f} {xs[1]:.4f}: "
        f"dRA*cos {wrap180(xs[0]-hra)*60*math.cos(hde*D2R):+.2f}' dDec {(xs[1]-hde)*60:+.2f}'")
    log(f"  Sun-Observer-Target elongation (Horizons): {hz_geo.get('S-O-T')} deg {hz_geo.get('/r')}")

    # sensitivity: refraction weather and distance-only
    sens = {}
    for lab, w in [("P-1kPa", dict(P_kpa=100.0)), ("P+1kPa", dict(P_kpa=102.0)), ("T-10C", dict(T_c=WEATHER['T_c'] - 10)),
                   ("T+10C", dict(T_c=WEATHER['T_c'] + 10)), ("no refraction", dict(P_kpa=0.0))]:
        xw, _, _ = solve(meas, pos, lsts, decs, dec_zero, x0, use_dec=cfg["use_dec"], w=w)
        rg = topo_to_geo(xw[0], xw[1], lst_mean, delta)
        l2, b2 = eq2ecl(*rg, eps)
        sens[lab] = (wrap180(l2 - hl) * 60 * math.cos(hb * D2R), (b2 - hb) * 60)
    rg = topo_to_geo(xd[0], xd[1], lst_mean, delta)
    l2, b2 = eq2ecl(*rg, eps)
    sens["distance-only (no armillary)"] = (wrap180(l2 - hl) * 60 * math.cos(hb * D2R), (b2 - hb) * 60)
    sens["no parallax correction"] = (wrap180(lam_t - hl) * 60 * math.cos(hb * D2R), (bet_t - hb) * 60)
    for k, (a, b) in sens.items():
        log(f"    sensitivity {k:30s}: dlon {a:+.2f}'  dlat {b:+.2f}'")

    # side track (b): Tycho's catalogue frame
    tyc = tycho_frame_solution(stars, meas, decs, lsts, xs, cfg, pos, year, hl, hb, zr, rows, zlst)

    return dict(night=key, label=T["label"], source=T["source"], jd_ut=jd_mean, ut=jd_to_str(jd_mean),
                lon=lam, lat=bet, horizons_lon=hl, horizons_lat=hb, dlon_arcmin=dl, dlat_arcmin=db,
                total_arcmin=math.hypot(dl, db), formal_err_arcmin=[float(err[0] * math.cos(xs[1] * D2R)), float(err[1])],
                dist_residuals_arcmin=[float(x) for x in res[:len(meas)]], dec_zero_arcmin=dec_zero * 60,
                delta_au=delta, elongation=hz_geo.get("S-O-T"), sensitivity=sens, tycho_catalog=tyc,
                horizons_meta=meta_geo)


def tycho_frame_solution(stars, meas, decs, lsts, xs, cfg, pos, year, hl, hb, zr, rows, zlst):
    """Same measurements, reference stars from Tycho's own catalogue (equinox 1601.0), moved back to the date
    with Tycho's precession of 51"/yr, and Tycho's obliquity 23 31 30 (both cited: Tycho's published constants, not on
    the pages read). Refraction is removed from the distances
    and declinations with the modern model evaluated at the modern solution (Tycho's own refraction table gave
    nothing above 20 deg for stars, so this is the honest correction, not his)."""
    cat = load_tycho_catalog()
    EPS_T = 23 + 31.5 / 60
    dyear = 1601.0 - year
    tpos = {}
    for k, v in stars.items():
        c = cat[v["hip"]]
        lon = c["lon"] - 51.0 / 3600 * dyear
        tpos[k] = ecl2eq(lon, c["lat"], EPS_T)
    # refraction corrections from the modern model
    corr_meas = []
    for k, dmeas, i in meas:
        mra, mde = refract(xs[0], xs[1], lsts[i]); sra, sde = refract(*pos[k], lsts[i])
        dref = sep(mra, mde, sra, sde) - sep(xs[0], xs[1], *pos[k])
        corr_meas.append((k, dmeas - dref, i))
    corr_dec = [(dd - (refract(xs[0], xs[1], lsts[i])[1] - xs[1]), i) for dd, i in decs]
    # armillary zero from the same reference star, Tycho frame
    zs = []
    for i, r in enumerate(rows):
        if zr["field"] in r:
            lst = zlst[i]
            dref = refract(*pos[zr["star"]], lst)[1] - pos[zr["star"]][1]
            for dd in r[zr["field"]]:
                zs.append(dm(dd) - dref - tpos[zr["star"]][1])
    z = float(np.mean(zs))

    def resid(x):
        r = [(sep(x[0], x[1], *tpos[k]) - d) * 60 for k, d, i in corr_meas]
        if cfg["use_dec"]:
            r += [(x[1] + z - d) * 60 for d, i in corr_dec]
        return np.array(r)

    sol = least_squares(resid, xs, x_scale=[0.01, 0.01])
    lam, bet = eq2ecl(sol.x[0], sol.x[1], EPS_T)
    dl = wrap180(lam - hl) * 60 * math.cos(hb * D2R); db = (bet - hb) * 60
    log(f"  [Tycho-catalogue frame] stars (lon, lat at date): " + "; ".join(
        f"{k.split(' (')[0][:22]} {eq2ecl(*tpos[k], EPS_T)[0]:.3f},{eq2ecl(*tpos[k], EPS_T)[1]:.3f}" for k in tpos))
    log(f"  [Tycho-catalogue frame] armillary zero {z*60:+.2f}'; Mars lon {lam:.4f} lat {bet:.4f} -> vs Horizons "
        f"dlon {dl:+.2f}' dlat {db:+.2f}' (diurnal parallax not removed; <0.4')")
    log(f"    distance residuals: {', '.join(f'{x:+.2f}' for x in resid(sol.x)[:len(corr_meas)])} arcmin")
    return dict(lon=lam, lat=bet, dlon_arcmin=dl, dlat_arcmin=db)


def radec_sun(jd_tt):
    """Apparent RA of the Sun (deg), from erfa's Earth ephemeris + aberration, via astropy."""
    from astropy.coordinates import get_sun
    s = get_sun(Time(jd_tt, format="jd", scale="tt")).transform_to(TETE(obstime=Time(jd_tt, format="jd", scale="tt")))
    return s.ra.deg


def jd_to_str(jd):
    y, m, d, f = erfa.jd2cal(jd, 0.0)
    h = f * 24
    return f"{y:04d}-{m:02d}-{d:02d} {int(h):02d}:{int((h%1)*60):02d} UT (Gregorian)"


# ---------------------------------------------------------------- Tycho's own arithmetic (side track a)

def tycho_own_arithmetic():
    log("=" * 100)
    log("TYCHO'S OWN ARITHMETIC, recomputed from the numbers printed on p. 441 (1595 Jul 22 mane)")
    EPS_T = 23 + 31.5 / 60
    dmars = 10 + 36 / 60
    out = {}
    for name, ra_s, de_s, dist, sign in [("prima alae Peg. (Markab)", 341 + 9.25 / 60, 13 + 3 / 60 + 37 / 3600, 50 + 28 / 60, +1),
                                          ("Aldebaran", 63 + 12.5 / 60, 15 + 37 / 60, 29 + 58.5 / 60, -1)]:
        # spherical triangle pole-star-Mars: cos d = sin d1 sin d2 + cos d1 cos d2 cos dRA
        c = (math.cos(dist * D2R) - math.sin(de_s * D2R) * math.sin(dmars * D2R)) / (math.cos(de_s * D2R) * math.cos(dmars * D2R))
        dra = math.degrees(math.acos(c))
        ra = (ra_s + sign * dra) % 360
        out[name] = (dra, ra)
        log(f"  {name:28s} Ang. diff. ascens. {fmt_dms(dra)}  -> RA Mars {fmt_dms(ra)}")
    ra_m = np.mean([v[1] for v in out.values()])
    lam, bet = eq2ecl(ra_m, dmars, EPS_T)
    log(f"  mean ('limitata') RA {fmt_dms(ra_m)} [printed 32d47'14\"]; with Tycho's obliquity 23d31'30\": "
        f"lon {fmt_dms(lam)} [printed 34d11'10\" = 4 11 1/6 Taurus], lat {fmt_dms(bet)} [printed -2d30']")
    return dict(ra=ra_m, lon=lam, lat=bet, printed_lon=34 + 11 / 60 + 10 / 3600, printed_lat=-2.5)


# ---------------------------------------------------------------- main

if __name__ == "__main__":
    HIP = load_hip()
    results = {}
    results["tycho_arithmetic_jul22"] = tycho_own_arithmetic()
    cfg_oct = dict(session="vesperi", x0=[50.5, 17.5], use_dec=False, skip=[0],
                   dec_zero_star=dict(star="Oculus Tauri / Aldebaran", field="dec_aldebaran", assume_time=[7, 0]))
    cfg_jul = dict(session="mane", x0=[32.8, 10.6], use_dec=True, dec_extra_rows=[6],
                   dec_zero_star=dict(star="Lucida Arietis", field="dec_hamal", assume_time=[2, 50]))
    results["oct25"] = night("1595-10-25_vesperi", cfg_oct)
    results["jul22"] = night("1595-07-22_mane", cfg_jul)

    # Tycho's printed Jul 22 result vs Horizons at his stated time (2h40m clock)
    j = results["jul22"]
    ta = results["tycho_arithmetic_jul22"]
    dl = wrap180(ta["printed_lon"] - j["horizons_lon"]) * 60 * math.cos(j["horizons_lat"] * D2R)
    db = (ta["printed_lat"] - j["horizons_lat"]) * 60
    log(f"Tycho's own printed result for Jul 22 (his stars, his obliquity, no refraction) vs Horizons: "
        f"dlon {dl:+.2f}' dlat {db:+.2f}'")
    results["tycho_printed_vs_horizons_jul22"] = dict(dlon_arcmin=dl, dlat_arcmin=db)

    worst = max(results["oct25"]["total_arcmin"], results["jul22"]["total_arcmin"])
    log("=" * 100)
    log(f"KILL-TEST POSITIONAL CRITERION (both nights within 5'): {'MET' if worst <= 5 else 'NOT MET'} (worst {worst:.2f}')")
    (OUT / "reduction.json").write_text(json.dumps(results, indent=2, default=float))
    (OUT / "reduction_log.txt").write_text("\n".join(LOG) + "\n")
