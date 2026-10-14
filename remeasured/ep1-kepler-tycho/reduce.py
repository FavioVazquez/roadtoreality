"""Episode 1 batch reducer: Tycho Brahe's Mars sessions -> geocentric apparent ecliptic longitude and latitude of date,
each compared with JPL Horizons (Mars barycenter, body 4, DE441). Nothing about the motion of Mars is fitted here: each session stands alone.

Run:  data/.venv/bin/python -I reduce.py [merged.json ...]        (default: transcription.json)
      data/.venv/bin/python -I reduce.py --check                   (kill-test regression on transcription.json)
Writes out/batch/results.json, out/batch/summary.csv, out/batch/log.txt.

Input: one or more files in the session format of TRANSCRIBE-GUIDE.md ("schema": "tycho-mars-session/2").
Other inputs (see fetch.sh, SHA256SUMS): data/hip/ (Hipparcos, fetched here for any HIP the transcribers name),
data/horizons/ (raw Horizons replies, fetched here and cached).

Batch handling (from the transcribers' reports): per-row time basis; times from t_corr, t, t_resp or the clock
star's 'resp'; a clock-star hour angle in the row fixes that row's sidereal time even without a printed time
(hours-of-time readings, vol X 1585, are converted when the row note says so); timed or clock-star-referenced
meridian transits give right ascension; one index term per distance-instrument class (sextant, old/new/portable
sextant, astronomical arc, radius); armillary and quadrant zero points from the same session, else pooled by
(site or instrument, year) from all sessions; per-cell confidence: H weight 1, M sigma x1.5, L cells excluded from
the primary solution and reported in a second one (sigma x2.5). Tycho's printed reductions are a cross-check only.
The data product (out/mars_positions.csv, written by batch_report.py) uses a nominal 1 au Earth-Mars distance for
the diurnal parallax (< 0.25' worst case) so that it carries no ephemeris input.

Per session:
  1. time: each row's printed time -> local apparent time on a civil day (time_basis, night_before, session);
     sidereal time from the clock-star hour angles read on the armillary when present (median offset, 1-degree
     slips detected and flagged), else from the apparent solar time; rows given relative to Mars's meridian transit
     ('at': 'transit+2') use Mars's own right ascension. UT from sidereal time; the UT candidate is chosen at
     night (Sun below -6 deg) closest to the printed time, and a jump of more than 2 h is flagged.
  2. reference stars: Hipparcos moved to the date (proper motion, parallax), apparent place on the true equator and
     equinox of date (astropy TETE).
  3. measurements, each with a forward model that includes refraction (Saemundsson, 101 kPa, 10 C):
       distance Mars-star (sextant sigma 1', radius 3') + per-session index term per instrument class
       ('sext', 'radius') when the session can determine it (star-to-star checks, or 3+ reference stars);
       armillary declination (sigma 1') with a zero point from the reference-star declinations of the same
       session (sigma 2' and a flag when there are none);
       meridian altitude (sigma 1') with a zero point per instrument from reference-star meridian altitudes of the
       same session (sigma 1.5' and a flag when there are none);
       armillary hour angles of Mars and a clock star in the same row -> right-ascension difference (sigma 1.5');
       a timed meridian transit -> right ascension = sidereal time of the transit (sigma 3'; only in sessions whose
       clock is fixed by clock-star readings);
       altitude + azimuth pairs (sigma 4'), used only when the row has an azimuth and the session has no two
       independent constraints of the kinds above (else they are left out of the fit and flagged).
  4. least squares for Mars's true topocentric RA/Dec (+ index terms); one pass of outlier removal (> 4 sigma,
     at most a fifth of the rows); covariance -> formal errors; degeneracy flagged.
  5. diurnal parallax removed with the Earth-Mars distance from Horizons (cited; < 0.4'), rotation to the true
     ecliptic of date.
  6. Horizons comparison at the session epoch; Tycho's own printed reductions (if transcribed) compared too.
"""
import csv, hashlib, json, math, pathlib, re, subprocess, sys, warnings
import numpy as np
from scipy.optimize import least_squares

warnings.filterwarnings("ignore")  # erfa 'dubious year' warnings for 1580-1601 are expected
import erfa
import astropy.units as u
from astropy.time import Time
from astropy.coordinates import SkyCoord, ICRS, TETE, Distance, get_sun

HERE = pathlib.Path(__file__).resolve().parent
DATA = HERE / "data"
OUTB = HERE / "out" / "batch"
D2R = math.pi / 180
LOG = []

# Observing sites (modern coordinates of the places; cited, approximate). Latitude matters for meridian altitudes
# (an error of 0.1 deg is 6' in declination): sessions at 'approx' sites are flagged.
SITES = {
    "Hven":       dict(lat=55.9075, lon=12.6967, q="good", note="Uraniborg / Stjerneborg (60 m apart)"),
    "Copenhagen": dict(lat=55.6786, lon=12.5790, q="approx", note="city centre"),
    "Rostock":    dict(lat=54.0887, lon=12.1405, q="approx", note="city centre"),
    "Wandsbek":   dict(lat=53.5733, lon=10.0717, q="approx", note="Wandsbek castle, Hamburg"),
    "Wittenberg": dict(lat=51.8664, lon=12.6460, q="good", note="town; observers' own pole height 51 52 30 to 51 53 30 (vol XIII pp.123, 182)"),
    "Dresden":    dict(lat=51.0504, lon=13.7373, q="approx", note="city centre"),
    "Girsitz":    dict(lat=50.12, lon=14.65, q="approx", note="identification uncertain (near Prague)"),
    "Benatky":    dict(lat=50.2906, lon=14.8237, q="good", note="Benatky nad Jizerou castle"),
    "Prague":     dict(lat=50.0900, lon=14.4000, q="approx", note="Hradcany / Belvedere area"),
    "Padua":      dict(lat=45.4064, lon=11.8768, q="approx", note="Padua (observations sent by G. Sascerides / Magini, 1591)"),
}
SITE_BY_DATE = [  # default when a session gives no site (Julian dates; boundaries approximate, cited)
    ("1597-03-15", "Hven"), ("1597-06-01", "Copenhagen"), ("1597-10-15", "Rostock"), ("1598-10-01", "Wandsbek"),
    ("1598-12-01", "Dresden"), ("1599-08-28", "Wittenberg"), ("1600-08-01", "Benatky"), ("1601-12-31", "Prague")]

# Calendar of the printed dates. Denmark and the Protestant German towns kept the Julian calendar ("stylo veteri");
# Bohemia used the Gregorian. Evidence for Benatky: 1600-01-01N (vol XIII p.219) only fits as a Gregorian date
# (Tycho's own printed longitude and the reduced one both sit 10 days of motion away under the Julian reading).
# A session can override with "calendar": "julian" | "gregorian"; with a clock star the reducer also tests both
# against the printed solar time (the Sun's RA moves ~10 deg in 10 days, i.e. 40 min of time) and flags a conflict.
CALENDAR_BY_SITE = {"Hven": "julian", "Copenhagen": "julian", "Rostock": "julian", "Wandsbek": "julian",
                    "Wittenberg": "julian", "Dresden": "julian", "Girsitz": "gregorian", "Benatky": "gregorian",
                    "Prague": "gregorian", "Padua": "gregorian"}
# Evidence (transcribers): Wandsbek dates are 'stylo veteri' (vol XIII p.142); Benatky Gregorian is confirmed by
# Tycho's own 'styli veteris' footnote (vol XIII p.221); Padua (Catholic Italy) Gregorian.

SIGMA = dict(transit=3.0, transit_clock=2.0, sext=1.0, sext_vet=1.0, sext_nov=1.0, sext_port=1.5, arcus=1.5, radius=3.0,
             dec=1.0, dec_pool=1.3, dec_uncal=2.0, malt=1.0, malt_pool=1.2, malt_uncal=1.5, radiff=1.5, altaz=4.0, starstar=1.0)
WEATHER = dict(P_kpa=101.0, T_c=10.0)
SIGNS = ["aries", "taurus", "gemini", "cancer", "leo", "virgo", "libra", "scorpius", "sagittarius", "capricornus",
         "aquarius", "pisces"]


def log(*a):
    s = " ".join(str(x) for x in a)
    print(s)
    LOG.append(s)


def wrap180(x):
    return (x + 180.0) % 360.0 - 180.0


# ---------------------------------------------------------------- printed values

def parse_angle(s):
    try:
        return _parse_angle(s)
    except (ValueError, ZeroDivisionError):
        return None


def parse_time(s):
    try:
        return _parse_time(s)
    except (ValueError, ZeroDivisionError):
        return None


def _parse_angle(s):
    """'20 17 1/6' -> 20 + (17 + 1/6)/60 ; '19 53 0' -> d m s ; '58 54 1/2' ; '35 1/6' (degrees + fraction of a degree)."""
    if s is None:
        return None
    if isinstance(s, (int, float)):
        return float(s)
    toks = str(s).replace(",", " ").split()
    nums, frac = [], 0.0
    for t in toks:
        if "/" in t:
            a, b = t.split("/"); frac = float(a) / float(b)
        else:
            nums.append(float(t))
    if not nums:
        return None
    if len(nums) == 1:
        return nums[0] + frac
    if len(nums) == 2:
        return nums[0] + (nums[1] + frac) / 60
    return nums[0] + nums[1] / 60 + (nums[2] + frac) / 3600


def _parse_time(s):
    """'8 4 2/5' -> 8 h 4.4 min ; '7 22 20' -> h m s ; returns hours."""
    if s is None:
        return None
    toks = str(s).split()
    nums, frac = [], 0.0
    for t in toks:
        if "/" in t:
            a, b = t.split("/"); frac = float(a) / float(b)
        else:
            nums.append(float(t))
    if len(nums) == 1:
        return nums[0] + frac
    if len(nums) == 2:
        return nums[0] + (nums[1] + frac) / 60
    return nums[0] + nums[1] / 60 + (nums[2] + frac) / 3600


def signed_dec(v, d):
    """B (Borealis) and S / Sept. (Septentrionalis) are north; A (Australis) and M (Meridionalis) are south."""
    d = (d or "B").strip().upper()
    return -v if d.startswith(("A", "M")) else v


# ---------------------------------------------------------------- calendar and time

def jd_julian(y, m, d):
    if m <= 2:
        y -= 1; m += 12
    return math.floor(365.25 * (y + 4716)) + math.floor(30.6001 * (m + 1)) + d - 1524.5


def delta_t_seconds(year):
    if year < 1600:
        uu = (year - 1000) / 100
        return (1574.2 - 556.01 * uu + 71.23472 * uu**2 + 0.319781 * uu**3 - 0.8503463 * uu**4
                - 0.005050998 * uu**5 + 0.0083572073 * uu**6)
    t = year - 1600
    return 120 - 0.9808 * t - 0.01532 * t**2 + t**3 / 7129


def gast_deg(jd_ut1, dt_s):
    return math.degrees(erfa.gst06a(jd_ut1, 0.0, jd_ut1 + dt_s / 86400, 0.0)) % 360


def ut_candidates(lst_deg, jd_guess, dt_s, lon):
    """UT JDs within +-14 h of jd_guess at which the local apparent sidereal time equals lst_deg."""
    jd = jd_guess
    for _ in range(5):
        jd += wrap180(lst_deg - (gast_deg(jd, dt_s) + lon) % 360) / 360.98564736629
    sid_day = 0.99726957
    return [jd + k * sid_day for k in (-1, 0, 1) if abs(jd + k * sid_day - jd_guess) < 14 / 24]


_SUN = {}


def sun_radec(jd_tt):
    k = round(jd_tt, 3)
    if k not in _SUN:
        t = Time(jd_tt, format="jd", scale="tt")
        s = get_sun(t).transform_to(TETE(obstime=t))
        _SUN[k] = (s.ra.deg, s.dec.deg)
    return _SUN[k]


def true_obliquity(jd_tt):
    return math.degrees(erfa.obl06(jd_tt, 0.0) + erfa.nut06a(jd_tt, 0.0)[1])


# ---------------------------------------------------------------- stars

HIP_FILE = DATA / "hip" / "hip2_all.tsv"
_HIP = {}


def load_hip(needed):
    rows = {}
    for f in [DATA / "hip" / "hip2_refstars.tsv", HIP_FILE]:
        if f.exists():
            for line in f.read_text().splitlines():
                p = line.split("\t")
                try:
                    rows[int(p[0])] = dict(ra=float(p[1]), dec=float(p[2]), plx=float(p[3]), pmra=float(p[4]), pmde=float(p[5]))
                except (ValueError, IndexError):
                    pass
    missing = sorted(set(needed) - set(rows))
    if missing:
        url = ("https://vizier.cds.unistra.fr/viz-bin/asu-tsv?-source=I/311/hip2&-out=HIP,RArad,DErad,Plx,pmRA,pmDE,Hpmag&HIP="
               + ",".join(str(h) for h in missing))
        txt = subprocess.run(["/usr/bin/curl", "-sf", "-m", "120", url], capture_output=True, text=True, check=True).stdout
        HIP_FILE.parent.mkdir(parents=True, exist_ok=True)
        with open(HIP_FILE, "a") as f:
            for line in txt.splitlines():
                if line.split("\t")[0].strip().isdigit():
                    f.write(line.strip() + "\n")
        return load_hip([])
    _HIP.update(rows)
    return rows


RV = {9884: -14.64, 15863: -2.04, 21421: 54.26, 113963: -2.71, 97649: -26.60, 107315: 3.39}  # SIMBAD, cited
_STAR = {}


def star_apparent(hip, jd_tt):
    k = (hip, round(jd_tt, 2))
    if k not in _STAR:
        h = _HIP[hip]
        c = SkyCoord(ra=h["ra"] * u.deg, dec=h["dec"] * u.deg, distance=Distance(parallax=max(h["plx"], 0.5) * u.mas),
                     pm_ra_cosdec=h["pmra"] * u.mas / u.yr, pm_dec=h["pmde"] * u.mas / u.yr,
                     radial_velocity=RV.get(hip, 0.0) * u.km / u.s, frame=ICRS, obstime=Time(1991.25, format="jyear", scale="tt"))
        t = Time(jd_tt, format="jd", scale="tt")
        a = c.apply_space_motion(new_obstime=t).transform_to(TETE(obstime=t))
        _STAR[k] = (a.ra.deg, a.dec.deg)
    return _STAR[k]


# ---------------------------------------------------------------- geometry and refraction

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
    return math.degrees(math.atan2(y * math.cos(e) + z * math.sin(e), x)) % 360, math.degrees(math.asin(-y * math.sin(e) + z * math.cos(e)))


def ecl2eq(lon, lat, eps):
    e = eps * D2R
    x, y, z = vec(lon, lat)
    return math.degrees(math.atan2(y * math.cos(e) - z * math.sin(e), x)) % 360, math.degrees(math.asin(y * math.sin(e) + z * math.cos(e)))


def refraction_arcmin(h):
    h = max(h, -1.0)
    return 1.02 / math.tan((h + 10.3 / (h + 5.11)) * D2R) * (WEATHER["P_kpa"] / 101.0) * (283.0 / (273.0 + WEATHER["T_c"]))


def altaz(ra, dec, lst, lat):
    H = (lst - ra) * D2R; d = dec * D2R; p = lat * D2R
    h = math.asin(math.sin(p) * math.sin(d) + math.cos(p) * math.cos(d) * math.cos(H))
    az = math.atan2(-math.cos(d) * math.sin(H), math.sin(d) * math.cos(p) - math.cos(d) * math.sin(p) * math.cos(H))
    return math.degrees(h), math.degrees(az) % 360


def from_altaz(h, az, lst, lat):
    hh, A, p = h * D2R, az * D2R, lat * D2R
    d = math.asin(math.sin(p) * math.sin(hh) + math.cos(p) * math.cos(hh) * math.cos(A))
    H = math.atan2(-math.cos(hh) * math.sin(A), math.sin(hh) * math.cos(p) - math.cos(hh) * math.sin(p) * math.cos(A))
    return (lst - math.degrees(H)) % 360, math.degrees(d)


def refract(ra, dec, lst, lat):
    h, az = altaz(ra, dec, lst, lat)
    return from_altaz(h + refraction_arcmin(h) / 60.0, az, lst, lat)


def topo_to_geo(ra, dec, lst, dist_au, lat):
    a, b = 6378.137, 6356.752
    p = lat * D2R
    C = 1 / math.sqrt(math.cos(p) ** 2 + (b / a) ** 2 * math.sin(p) ** 2); S = (b / a) ** 2 * C
    r = np.array([a * C * math.cos(p) * math.cos(lst * D2R), a * C * math.cos(p) * math.sin(lst * D2R), a * S * math.sin(p)])
    return radec(vec(ra, dec) * dist_au * 149597870.7 + r)


AZ_REF = {"mer_ort": lambda A: 180 - A, "mer_occ": lambda A: 180 + A, "sept_ort": lambda A: A, "sept_occ": lambda A: 360 - A}


# ---------------------------------------------------------------- Horizons (batched, cached)

HZ_CACHE = DATA / "horizons" / "batch_cache.json"


def horizons_geo(jds):
    cache = json.loads(HZ_CACHE.read_text()) if HZ_CACHE.exists() else {}
    need = sorted({f"{j:.6f}" for j in jds} - set(cache))
    for i in range(0, len(need), 40):
        part = need[i:i + 40]
        params = {"format": "text", "COMMAND": "'4'", "OBJ_DATA": "'YES'", "MAKE_EPHEM": "'YES'", "EPHEM_TYPE": "'OBSERVER'",
                  "CENTER": "'500@399'", "TLIST": "'" + " ".join(part) + "'", "TLIST_TYPE": "'JD'", "TIME_TYPE": "'UT'",
                  "QUANTITIES": "'2,20,23,31'", "ANG_FORMAT": "'DEG'", "EXTRA_PREC": "'YES'", "CAL_FORMAT": "'JD'",
                  "APPARENT": "'AIRLESS'", "CSV_FORMAT": "'YES'"}
        q = "&".join(f"{k}={v}" for k, v in params.items())
        q = q.replace("'", "%27").replace("@", "%40").replace(",", "%2C").replace(" ", "%20")
        txt = subprocess.run(["/usr/bin/curl", "-sf", "-m", "180", "https://ssd.jpl.nasa.gov/api/horizons.api?" + q],
                             capture_output=True, text=True, check=True).stdout
        raw = DATA / "horizons" / "raw" / (hashlib.sha1("".join(part).encode()).hexdigest()[:12] + ".txt")
        raw.parent.mkdir(parents=True, exist_ok=True)
        raw.write_text(txt)
        head = txt.split("$$SOE")[0].strip().splitlines()[-2]
        cols = [c.strip() for c in head.split(",")]
        meta = [l.strip() for l in txt.splitlines() if "Target body name" in l or "Center body name" in l]
        for line in txt.split("$$SOE")[1].split("$$EOE")[0].strip().splitlines():
            rec = dict(zip(cols, [v.strip() for v in line.split(",")]))
            jd = float(rec["Date_________JDUT"])
            key = min(part, key=lambda p: abs(float(p) - jd))
            cache[key] = dict(lon=float(rec["ObsEcLon"]), lat=float(rec["ObsEcLat"]), delta=float(rec["delta"]),
                              elong=float(rec["S-O-T"]), ra=float(rec["R.A.__(a-app)"]), dec=float(rec["DEC___(a-app)"]),
                              raw=raw.name, meta=meta)
        HZ_CACHE.write_text(json.dumps(cache, indent=0))
    return {j: cache[f"{j:.6f}"] for j in jds}


# ---------------------------------------------------------------- one session

TIME_UNITS = re.compile(r"time unit|units of time|in time|hours and minutes|hours/minutes|minutes of time|in hours", re.I)
CONF_W = {"H": 1.0, "M": 1.5, "L": 2.5}


def instr_class(s):
    """distance instruments -> index class (one zero-point term per class and session)"""
    s = (s or "").lower()
    if "rad" in s:
        return "radius"
    if "arcus" in s:
        return "arcus"
    if "port" in s:
        return "sext_port"
    if "vet" in s:
        return "sext_vet"
    if "nov" in s or "nou" in s:
        return "sext_nov"
    return "sext"  # Sext., Sext. Trig., or not named (assumed sextant, flagged)


def quad_class(s):
    """meridian-altitude instruments -> zero-point class; None = adopted value (skip)"""
    s = (s or "").lower().strip()
    if s.startswith("limit"):
        return None
    for key, name in (("vol", "Volub."), ("chal", "Chalyb."), ("tichon", "Q. Tichon."), ("tychon", "Q. Tichon."),
                      ("mural", "Mural"), ("min", "Q. minor"), ("maior", "Q. maior"), ("port", "Portat."),
                      ("sext", "Sext."), ("solid", "Q. solidum")):
        if key in s:
            return name
    return "Q.?"


def idc(code):
    """star identification confidence -> measurement code: an L identification excludes the row from the primary
    set; H and M identifications do not change the measurement weight (a wrong star is a blunder, not noise)"""
    return "L" if code == "L" else None


def worst(*codes):
    codes = [c for c in codes if c]
    if not codes:
        return "M"
    return "L" if "L" in codes else ("M" if "M" in codes else "H")


class Session:
    """One observing session: time model, reference stars, zero points, measurements, least squares."""

    def __init__(self, S):
        self.S = S
        self.id = S["id"]
        self.flags = []
        y, m, d = (int(x) for x in S["date_julian"].split("-"))
        site = (S.get("site") or "").replace("other:", "")
        if site not in SITES:
            site = next(s for dd, s in SITE_BY_DATE if S["date_julian"] <= dd)
            self.flags.append(f"site_default_by_date:{site}")
        self.site = site
        self.lat, self.lon = SITES[site]["lat"], SITES[site]["lon"]
        if SITES[site]["q"] != "good":
            self.flags.append(f"site_approx:{site}")
        self.calendar = S.get("calendar") or CALENDAR_BY_SITE.get(site, "julian")
        if not S.get("calendar") and self.calendar != "julian":
            self.flags.append(f"calendar_by_site:{self.calendar}")
        self.jd_date0 = jd_julian(y, m, d) if self.calendar == "julian" else sum(erfa.cal2jd(y, m, d))
        self.year = y + (m - 0.5) / 12
        self.yr = y
        self.dT = delta_t_seconds(self.year)
        sess = (S.get("session") or "unknown").lower()
        nb = bool(S.get("night_before"))
        basis = S.get("time_basis") or "unknown"
        if basis == "unknown":
            basis = "from_midnight" if (nb or sess == "mane") else "from_noon"
            self.flags.append("time_basis_unknown_assumed")
        self.basis = basis
        morning = nb or sess == "mane" or (sess == "unknown" and basis == "from_midnight")
        if sess == "unknown" and basis == "from_midnight":
            self.flags.append("night_assigned_to_morning_of_date")
        # the night of this session runs from the local noon 'base' to the next noon
        self.base_noon_ut = self.jd_date0 + 0.5 - (1 if morning else 0) - self.lon / 360
        self.stars = S.get("stars", {})
        self.vol = (S.get("source") or {}).get("volume")

    # ---- time
    def hours(self, t, basis=None):
        h = parse_time(t)
        if h is None:
            return None
        if h >= 12:
            return h  # 12 or more: counted from noon
        return h + 12 if (basis or self.basis) == "from_midnight" else h

    def row_hours(self, r):
        for k in ("t_corr", "t", "t_resp"):
            if r.get(k):
                return self.hours(r[k], r.get("row_time_basis"))
        c = r.get("clock") or {}
        if c.get("resp"):
            return self.hours(c["resp"], r.get("row_time_basis"))
        if r.get("t_assumed"):
            self.flags.append("time_assumed_row")
            return self.hours(r["t_assumed"], r.get("row_time_basis"))
        return None

    def clock_lst(self, r):
        """LST from the clock-star hour angle printed in the row (degrees, or hours of time when the note says so)"""
        c = r.get("clock") or {}
        st = self.stars.get(c.get("star")) or {}
        if not (c.get("ha") and st.get("hip") and st["hip"] in _HIP):
            return None
        ha = parse_time(c["ha"]) * 15 if TIME_UNITS.search(r.get("note") or "") else parse_angle(c["ha"])
        side = (c.get("side") or "occ").lower()
        ra, _ = star_apparent(st["hip"], self.jd_tt_mid)
        return (ra + (ha if side.startswith("occ") else -ha)) % 360

    def prepare(self):
        """clock model, star places, per-session zero points"""
        rows = self.S["rows"]
        self.h = [self.row_hours(r) for r in rows]
        known = [h for h in self.h if h is not None]
        self.h_mean = float(np.mean(known)) if known else None
        self.jd_tt_mid = self.base_noon_ut + (self.h_mean if self.h_mean is not None else 10) / 24 + self.dT / 86400
        hips = {k: v["hip"] for k, v in self.stars.items() if v.get("hip") and v["hip"] in _HIP}
        self.pos = {k: star_apparent(h, self.jd_tt_mid) for k, h in hips.items()}
        self.lst_clock = [self.clock_lst(r) for r in rows]
        # clock offset: rows with both a time and a clock-star reading
        offs = [(l - h * 15.041068640) % 360 for l, h in zip(self.lst_clock, self.h) if l is not None and h is not None]
        ra_sun, _ = sun_radec(self.base_noon_ut + self.dT / 86400)
        self.solar_off = ra_sun % 360
        self.calendar_test = None
        if offs:
            rel = np.array([wrap180(o - offs[0]) for o in offs])
            med = float(np.median(rel))
            self.off = (offs[0] + med) % 360
            dev = (rel - med) * 4
            slips = int(np.sum(np.abs(np.abs(dev) - 4) < 0.8))
            if slips:
                self.flags.append(f"clock_slip_1deg:{slips}")
            if np.sum(np.abs(dev) > 2) > slips:
                self.flags.append("clock_readings_scatter>2min")
            self.clock_source = f"clock star ({len(offs)})"
            d_this = wrap180(self.off - self.solar_off) / 15.041
            other = 10 if self.calendar == "julian" else -10
            d_other = wrap180(self.off - sun_radec(self.base_noon_ut + other + self.dT / 86400)[0] % 360) / 15.041
            self.calendar_test = dict(minutes_this=round(d_this * 60, 1), minutes_other=round(d_other * 60, 1))
            if abs(d_this) > 0.5:
                self.flags.append(f"clock_vs_printed_time:{d_this:+.1f}h")
            if abs(d_other) < abs(d_this) and abs(d_this) > 0.25:
                self.flags.append(f"calendar_conflict:{d_other*60:+.0f}min_vs_{d_this*60:+.0f}min")
        elif any(l is not None for l in self.lst_clock):
            self.off = self.solar_off
            self.clock_source = "clock star per row (no printed times)"
        else:
            self.off = self.solar_off
            self.clock_source = "solar (printed apparent time)"
        # LST per row: own clock star > printed time > session mean time > Mars transit (set in build)
        self.lst = []
        for l, h in zip(self.lst_clock, self.h):
            self.lst.append(l if l is not None else (self.off + h * 15.041068640) % 360 if h is not None else None)
        # zero points
        self.zdec_list, self.zq_list, self.kss_list = [], {}, {}
        for i, r in enumerate(rows):
            lst = self.lst[i] if self.lst[i] is not None else ((self.off + self.h_mean * 15.041068640) % 360 if self.h_mean is not None else None)
            if r.get("type") == "dec_star" and r.get("star") in self.pos and lst is not None:
                if (r.get("conf") or {}).get("dec") == "L" or (r.get("conf") or {}).get("star") == "L" \
                        or (self.stars.get(r["star"]) or {}).get("id_confidence") == "L":
                    continue
                model = refract(*self.pos[r["star"]], lst, self.lat)[1]
                for d in r.get("dec", []) or []:
                    z = signed_dec(parse_angle(d), r.get("dec_dir")) - model
                    if abs(z) * 60 > 10:  # Tycho's armillaries were good to a few minutes: a larger 'zero' is a misread or a wrong star
                        self.flags.append("armillary_calibration_reading_rejected(>10')")
                        continue
                    self.zdec_list.append(z)
            if r.get("type") == "star_star" and r.get("star_a") in self.pos and r.get("star_b") in self.pos and lst is not None:
                a = refract(*self.pos[r["star_a"]], lst, self.lat); b = refract(*self.pos[r["star_b"]], lst, self.lat)
                for d in r.get("dist") or []:
                    v = parse_angle(d)
                    if v is not None and abs(v - sep(*a, *b)) * 60 < 10:
                        self.kss_list.setdefault(instr_class(r.get("instr")), []).append(v - sep(*a, *b))
            if r.get("type") == "merid_alt_star" and r.get("star") in self.pos:
                if (r.get("conf") or {}).get("alt") == "L" or (self.stars.get(r["star"]) or {}).get("id_confidence") == "L":
                    continue
                de = self.pos[r["star"]][1]
                h0 = 90 - self.lat + de
                for a in r.get("alt", []) or []:
                    qc = quad_class(a.get("instr"))
                    if qc and a.get("alt") and parse_angle(a["alt"]) is not None:
                        z = parse_angle(a["alt"]) - (h0 + refraction_arcmin(h0) / 60)
                        if abs(z) * 60 > 10:
                            self.flags.append("quadrant_calibration_reading_rejected(>10')")
                            continue
                        self.zq_list.setdefault(qc, []).append(z)

    # ---- measurements
    def build(self, pools):
        rows = self.S["rows"]
        self.zdec = float(np.median(self.zdec_list)) if self.zdec_list else None
        zdec_src = "session" if self.zdec_list else None
        if self.zdec is None and pools["dec"].get((self.site, self.yr)) is not None:
            self.zdec, zdec_src = pools["dec"][(self.site, self.yr)], "pooled (site, year)"
        self.zdec_src = zdec_src
        self.zq = {k: float(np.median(v)) for k, v in self.zq_list.items()}
        # pooled sextant index (site, year, class) from all star-to-star checks, used when a session cannot fit its own
        self.k_pool = {c: v for (st, yr, c), v in pools.get("kss", {}).items() if st == self.site and yr == self.yr}
        self.zq_src = {k: "session" for k in self.zq}
        meas = []
        untimed = False
        has_dec_rows = any(r.get("dec_mars") for r in rows)
        if has_dec_rows and self.zdec is None:
            self.flags.append("armillary_uncalibrated")
        elif has_dec_rows and zdec_src != "session":
            self.flags.append("armillary_zero_pooled")
        for i, r in enumerate(rows):
            typ = r.get("type", "obs")
            cf = r.get("conf") or {}
            q = " ".join(x.lower() for x in (r.get("qualifiers") or []))
            if r.get("adopted") or re.search(r"\bpone\b|limitata|lineis inducta|struck", q):
                continue
            w = 0.5 if re.search(r"dub|nubes|non satis|incert|non est fidendum|non admodum|tempestate|non est tuta", q) else 1.0
            lst = self.lst[i]
            at = r.get("at")
            if lst is None and not at and typ in ("obs", "star_star", "merid_alt_mars"):
                if self.h_mean is not None:
                    lst = (self.off + self.h_mean * 15.041068640) % 360
                    untimed = True
                else:
                    at = "transit"
                    untimed = True
            base = dict(row=i, lst=lst, at=at)
            if typ == "obs":
                st = self.stars.get(r.get("star")) or {}
                if r.get("star") and r.get("dist"):
                    if r["star"] in self.pos:
                        cls = instr_class(r.get("instr"))
                        if not r.get("instr") and cls == "sext":
                            self.flags.append("instrument_not_named_sextant_assumed")
                        c = worst(cf.get("dist"), idc(st.get("id_confidence")))
                        meas.append(dict(base, kind="dist", star=r["star"], val=parse_angle(r["dist"]), cls=cls,
                                         conf=c, sigma=SIGMA.get(cls, 1.0) / w))
                    else:
                        self.flags.append("star_unidentified")
                for d in r.get("dec_mars") or []:
                    if not r.get("dec_dir"):
                        continue
                    c = worst(cf.get("dec_mars"), cf.get("dec_dir"))
                    sig = SIGMA["dec"] if self.zdec_src == "session" else (SIGMA["dec_pool"] if self.zdec_src else SIGMA["dec_uncal"])
                    meas.append(dict(base, kind="dec", val=signed_dec(parse_angle(d), r.get("dec_dir")), conf=c, sigma=sig / w))
                if r.get("ha_mars") and r.get("clock") and r["clock"].get("star") in self.pos:
                    sm = 1 if (r.get("ha_mars_side") or "").lower().startswith("occ") else -1
                    side_conf = "H" if r.get("ha_mars_side") else "L"
                    tu = 15 if TIME_UNITS.search(r.get("note") or "") else 1
                    sc = 1 if (r["clock"].get("side") or "occ").lower().startswith("occ") else -1
                    ha_c = (parse_time(r["clock"]["ha"]) * 15) if tu == 15 else parse_angle(r["clock"]["ha"])
                    ha_m = (parse_time(r["ha_mars"]) * 15) if tu == 15 else parse_angle(r["ha_mars"])
                    c = worst(cf.get("ha_mars"), cf.get("clock"), side_conf, idc((self.stars[r["clock"]["star"]] or {}).get("id_confidence")))
                    meas.append(dict(base, kind="radiff", star=r["clock"]["star"], val=sc * ha_c - sm * ha_m, conf=c,
                                     sigma=SIGMA["radiff"] / w))
                if r.get("az_mars") and r.get("alt_mars") and r.get("az_ref") in AZ_REF and lst is not None:
                    c = worst(cf.get("az_mars"), cf.get("alt_mars"), cf.get("az_ref"))
                    meas.append(dict(base, kind="alt", val=parse_angle(r["alt_mars"]), conf=c, sigma=SIGMA["altaz"] / w))
                    meas.append(dict(base, kind="az", val=AZ_REF[r["az_ref"]](parse_angle(r["az_mars"])) % 360, conf=c,
                                     sigma=SIGMA["altaz"] / w))
            elif typ == "merid_alt_mars":
                if self.lst_clock[i] is not None:
                    c = worst(cf.get("clock"), idc((self.stars.get(r["clock"]["star"]) or {}).get("id_confidence")))
                    meas.append(dict(base, kind="transit_ra", val=self.lst_clock[i], conf=c, sigma=SIGMA["transit_clock"] / w))
                elif self.h[i] is not None and self.clock_source.startswith("clock star ("):
                    meas.append(dict(base, kind="transit_ra", val=(self.off + self.h[i] * 15.041068640) % 360,
                                     conf=worst(cf.get("t")), sigma=SIGMA["transit"] / w))
                for a in r.get("alt") or []:
                    qc = quad_class(a.get("instr"))
                    if not qc or not a.get("alt"):
                        continue
                    z = self.zq.get(qc)
                    src = "session" if z is not None else None
                    if z is None and pools["quad"].get((qc, self.yr)) is not None:
                        z, src = pools["quad"][(qc, self.yr)], "pooled"
                    if src is None:
                        self.flags.append(f"quadrant_uncalibrated:{qc}")
                    elif src == "pooled":
                        self.flags.append(f"quadrant_zero_pooled:{qc}")
                    sig = {"session": SIGMA["malt"], "pooled": SIGMA["malt_pool"], None: SIGMA["malt_uncal"]}[src]
                    meas.append(dict(base, kind="malt", val=parse_angle(a["alt"]) - (z or 0.0),
                                     conf=worst(cf.get("alt")), sigma=sig / w))
            elif typ == "star_star" and r.get("star_a") in self.pos and r.get("star_b") in self.pos and lst is not None:
                c = worst(cf.get("dist"), idc(self.stars[r["star_a"]].get("id_confidence")), idc(self.stars[r["star_b"]].get("id_confidence")))
                for d in r.get("dist") or []:
                    meas.append(dict(base, kind="starstar", a=r["star_a"], b=r["star_b"], val=parse_angle(d),
                                     cls=instr_class(r.get("instr")), conf=c, sigma=SIGMA["starstar"]))
        if untimed:
            self.flags.append("untimed_rows_at_mean_time" if self.h_mean is not None else "time_unknown_assumed_transit")
        used = {m["cls"] for m in meas if m["kind"] == "dist"}
        for c in sorted(used & set(self.k_pool)):
            self.flags.append(f"sextant_index_pooled:{c}:{self.k_pool[c]*60:+.1f}'")
        # altitude/azimuth only when nothing better constrains the night
        strong = len({m["star"] for m in meas if m["kind"] == "dist"}) + len({m["star"] for m in meas if m["kind"] == "radiff"}) \
            + (1 if any(m["kind"] == "transit_ra" for m in meas) else 0) + (1 if any(m["kind"] in ("dec", "malt") for m in meas) else 0)
        if any(m["kind"] in ("alt", "az") for m in meas):
            if strong >= 2:
                meas = [m for m in meas if m["kind"] not in ("alt", "az")]
            else:
                self.flags.append("altaz_used")
        self.all_meas = meas
        self.flags = sorted(set(self.flags))

    def lst_of_meas(self, m, ra):
        if m.get("lst") is not None:
            return m["lst"]
        at = m.get("at") or "transit"
        x = float(at.split("+")[1]) if "+" in at else (-float(at.split("-", 1)[1]) if at.startswith("transit-") else 0.0)
        return (ra + x * 15.041068640) % 360

    def resid(self, p, meas, kfree):
        ra, de = p[0], p[1]
        k = {c: p[2 + i] for i, c in enumerate(kfree)}
        for c, v in getattr(self, "k_pool", {}).items():
            k.setdefault(c, v * 60)
        out = []
        for m in meas:
            lst = self.lst_of_meas(m, ra)
            kd = m["kind"]
            if kd == "dist":
                a = refract(ra, de, lst, self.lat); b = refract(*self.pos[m["star"]], lst, self.lat)
                out.append((sep(*a, *b) + k.get(m["cls"], 0) / 60 - m["val"]) * 60 / m["sigma"])
            elif kd == "starstar":
                a = refract(*self.pos[m["a"]], lst, self.lat); b = refract(*self.pos[m["b"]], lst, self.lat)
                out.append((sep(*a, *b) + k.get(m["cls"], 0) / 60 - m["val"]) * 60 / m["sigma"])
            elif kd == "dec":
                out.append((refract(ra, de, lst, self.lat)[1] + (self.zdec or 0.0) - m["val"]) * 60 / m["sigma"])
            elif kd == "malt":
                h0 = 90 - self.lat + de
                out.append((h0 + refraction_arcmin(h0) / 60 - m["val"]) * 60 / m["sigma"])
            elif kd == "transit_ra":
                out.append(wrap180(ra - m["val"]) * 60 * math.cos(de * D2R) / m["sigma"])
            elif kd == "radiff":
                a = refract(ra, de, lst, self.lat); b = refract(*self.pos[m["star"]], lst, self.lat)
                out.append(wrap180(a[0] - b[0] - m["val"]) * 60 * math.cos(de * D2R) / m["sigma"])
            elif kd in ("alt", "az"):
                h, az = altaz(ra, de, lst, self.lat)
                if kd == "alt":
                    out.append((h + refraction_arcmin(h) / 60 - m["val"]) * 60 / m["sigma"])
                else:
                    out.append(wrap180(az - m["val"]) * 60 * math.cos(h * D2R) / m["sigma"])
        return np.array(out)

    def starts(self, meas, kfree):
        """starting points: a 2-D grid (3 deg) around the reference stars and clock-derived right ascensions; the
        best grid cells that are at least 6 deg apart (distinct local minima, e.g. the two mirror solutions of one
        distance + one declination)"""
        refs = {m["star"] for m in meas if m["kind"] in ("dist", "radiff")}
        ras = [v[0] for k, v in self.pos.items() if k in refs] or [v[0] for v in self.pos.values()]
        ras += [m["val"] for m in meas if m["kind"] == "transit_ra"]
        ras += [(self.pos[m["star"]][0] + m["val"]) % 360 for m in meas if m["kind"] == "radiff"]
        if not ras:
            return []
        ra0 = math.degrees(math.atan2(np.mean(np.sin(np.radians(ras))), np.mean(np.cos(np.radians(ras))))) % 360
        des = [v[1] for v in self.pos.values()] or [0.0]
        decs = [m["val"] - (self.zdec or 0) for m in meas if m["kind"] == "dec"] + [m["val"] - 90 + self.lat for m in meas if m["kind"] == "malt"]
        dcenter = float(np.median(decs)) if decs else float(np.mean(des))
        sub = [m for m in meas if m["kind"] != "starstar"]
        sig = np.array([m["sigma"] for m in sub])
        cells = []
        for dra in np.arange(-75, 76, 3.0):
            for dd in np.arange(-36, 37, 3.0):
                ra, de = (ra0 + dra) % 360, float(np.clip(dcenter + dd, -85, 85))
                r = self.resid([ra, de] + [0.0] * len(kfree), sub, kfree) * sig
                # smooth robust cost in arcmin (a 3-degree grid misses the true point by up to ~1.5 deg)
                cells.append((float(np.sum(np.log1p((r / 30.0) ** 2))), ra, de))
        cells.sort()
        picks = []
        for c, ra, de in cells:
            if all(sep(ra, de, p[1], p[2]) > 6 for p in picks):
                picks.append((c, ra, de))
            if len(picks) == 5:
                break
        return [[ra, de] for c, ra, de in picks]

    def solve(self, primary=True):
        meas = [dict(m) for m in self.all_meas if (m["conf"] != "L" if primary else True)]
        for m in meas:
            m["sigma"] = m["sigma"] * CONF_W[m["conf"]]
        n_pos = len([m for m in meas if m["kind"] in ("dist", "radiff", "transit_ra", "az")])
        n_dim = len({m.get("star", m["kind"]) for m in meas if m["kind"] in ("dist", "radiff", "transit_ra", "az")}) + \
            (1 if any(m["kind"] in ("dec", "malt", "alt") for m in meas) else 0)
        if n_pos < 1 or n_dim < 2:
            return None, "fewer than two independent constraints" + ("" if primary else " (with L cells)")
        classes = {m["cls"] for m in meas if m["kind"] == "dist"}
        kfree = [c for c in sorted(classes)
                 if len({m["star"] for m in meas if m["kind"] == "dist" and m["cls"] == c}) >= 3
                 or any(m["kind"] == "starstar" and m["cls"] == c for m in meas)]
        starts = self.starts(meas, kfree)
        if not starts:
            return None, "no reference star or clock reading with a position"

        def fit(ms, kf, x0):
            p0 = list(x0[:2]) + [0.0] * len(kf)
            sol = least_squares(lambda p: self.resid(p, ms, kf), p0, x_scale=[0.01, 0.01] + [1.0] * len(kf))
            r = self.resid(sol.x, ms, kf)
            dof = len(r) - len(sol.x)
            try:
                cov = np.linalg.inv(sol.jac.T @ sol.jac) * (max(1.0, float(np.sum(r ** 2) / dof)) if dof > 0 else 4.0)
                err = np.sqrt(np.diag(cov))
            except np.linalg.LinAlgError:
                err = np.full(len(sol.x), np.nan)
            return sol.x, r, err, dof

        def low_alt(ms, x):
            keep = []
            for m in ms:
                m = dict(m)
                lst = self.lst_of_meas(m, x[0])
                hs = [altaz(x[0], x[1], lst, self.lat)[0]] if m["kind"] not in ("malt", "transit_ra", "starstar") else []
                if m["kind"] in ("dist", "radiff"):
                    hs.append(altaz(*self.pos[m["star"]], lst, self.lat)[0])
                if m["kind"] == "starstar":
                    hs += [altaz(*self.pos[m["a"]], lst, self.lat)[0], altaz(*self.pos[m["b"]], lst, self.lat)[0]]
                hmin = min(hs) if hs else 90
                if hmin < 1:
                    continue
                m["sigma"] *= 4.0 if hmin < 5 else (2.5 if hmin < 10 else (1.5 if hmin < 15 else 1.0))
                keep.append(m)
            return keep

        cands = []
        for st in starts:
            x, r, err, dof = fit(meas, kfree, st)
            ms = low_alt(meas, x)
            if len(ms) < 2:
                continue
            x, r, err, dof = fit(ms, kfree, x)
            # compare candidates on the same footing: a candidate that puts Mars below the horizon for some rows
            # pays for the rows it had to drop
            cands.append((float(np.sum(np.minimum(r ** 2, 100))) + 100.0 * (len(meas) - len(ms)), x, ms))
        if not cands:
            return None, "every measurement below 1 deg altitude"
        cands.sort(key=lambda c: c[0])
        # distinct solutions only
        uniq = []
        for c in cands:
            if all(sep(c[1][0], c[1][1], u[1][0], u[1][1]) > 1.0 for u in uniq):
                uniq.append(c)
        chosen = uniq[0]
        ambiguity = None
        n_ref = len({m["star"] for m in meas if m["kind"] in ("dist", "radiff")}) + (1 if any(m["kind"] == "transit_ra" for m in meas) else 0)
        if len(uniq) > 1 and (uniq[1][0] - uniq[0][0] < 9 or n_ref <= 1):
            # two solutions fit about equally (one distance + one declination has a mirror twin): decide with
            # coarse evidence from the page only (printed Mars altitudes and azimuths, then Tycho's own printed
            # place for the session); never with the ephemeris
            pick, how = self.disambiguate([uniq[0], uniq[1]])
            if pick is None:
                ambiguity = "two_fold_ambiguity_unresolved"
            else:
                chosen = uniq[pick]
                ambiguity = f"two_fold_ambiguity_resolved_by:{how}"
        cost, x, ms = chosen
        x, r, err, dof = fit(ms, kfree, x)
        removed = []
        groups = {}
        for m in ms:
            groups[(m["kind"], m.get("star"))] = groups.get((m["kind"], m.get("star")), 0) + 1
        # never remove the last measurements of a kind/star: they may be what decides the solution
        bad = [int(i) for i in np.argsort(-np.abs(r)) if abs(r[i]) > 4 and groups[(ms[i]["kind"], ms[i].get("star"))] >= 3][: max(0, len(ms) // 5)]
        if bad:
            removed = [dict(row=ms[i]["row"], kind=ms[i]["kind"], resid_sigma=float(r[i])) for i in bad]
            ms = [m for j, m in enumerate(ms) if j not in bad]
            x, r, err, dof = fit(ms, kfree, x)
        n_drop = len(meas) - len(ms) - len(removed)
        e_ra = float(err[0] * 60 * math.cos(x[1] * D2R)); e_de = float(err[1] * 60)
        return dict(ra=float(x[0]) % 360, dec=float(x[1]), err=[e_ra, e_de], dof=int(dof), ambiguity=ambiguity,
                    dropped_low=int(n_drop),
                    k={c: (float(x[2 + i]), float(err[2 + i])) for i, c in enumerate(kfree)},
                    meas=ms, resid=[float(v) for v in r], removed=removed, chi2_dof=float(np.sum(r ** 2) / max(1, dof))), None

    def disambiguate(self, cands):
        rows = self.S["rows"]
        scores = []
        for cost, x, ms in cands:
            dev = []
            for i, r in enumerate(rows):
                lst = self.lst[i]
                if lst is None or not r.get("alt_mars"):
                    continue
                v = parse_angle(r["alt_mars"])
                if v is None:
                    continue
                h, az = altaz(x[0], x[1], lst, self.lat)
                dev.append(h + refraction_arcmin(h) / 60 - v)
                if r.get("az_mars") and r.get("az_ref") in AZ_REF:
                    dev.append(wrap180(az - AZ_REF[r["az_ref"]](parse_angle(r["az_mars"]))) * math.cos(h * D2R))
            scores.append(float(np.sqrt(np.mean(np.square(dev)))) if dev else None)
        if all(sc is not None for sc in scores) and abs(scores[0] - scores[1]) > 1.0 and min(scores) < 3.0:
            return int(np.argmin(scores)), "printed_altitudes"
        # Tycho's own printed place (right ascension or longitude) on the page, as a choice between branches only
        for tr in self.S.get("tycho_reduction") or []:
            if tr.get("ra") and parse_angle(tr["ra"]) is not None:
                d = [abs(wrap180(x[0] - parse_angle(tr["ra"]))) for _, x, _ in cands]
                if min(d) < 3 and max(d) > 6:
                    return int(np.argmin(d)), "tycho_printed_ra"
            if tr.get("lon") and (tr.get("lon_sign") or "").lower() in SIGNS and parse_angle(tr["lon"]) is not None:
                tl = SIGNS.index(tr["lon_sign"].lower()) * 30 + parse_angle(tr["lon"])
                eps = true_obliquity(self.jd_tt_mid)
                d = [abs(wrap180(eq2ecl(x[0], x[1], eps)[0] - tl)) for _, x, _ in cands]
                if min(d) < 3 and max(d) > 6:
                    return int(np.argmin(d)), "tycho_printed_longitude"
        return None, None

    def epoch_jd(self, sol):
        """UT of the session: mean over the measurements used of the UT at which their sidereal time falls in this
        night (Sun below -3 deg, between the base noon and the next noon)"""
        uts = []
        for m in sol["meas"]:
            lst = self.lst_of_meas(m, sol["ra"])
            guess = self.base_noon_ut + 0.5
            c0 = ut_candidates(lst, guess, self.dT, self.lon)
            cands = [c for k in (-1, 0, 1) for c in [c0[0] + k * 0.99726957] if self.base_noon_ut <= c < self.base_noon_ut + 1] if c0 else []
            cands = sorted(set(round(c, 6) for c in cands))
            dark = []
            for c in cands:
                ra_s, de_s = sun_radec(c + self.dT / 86400)
                if altaz(ra_s, de_s, (gast_deg(c, self.dT) + self.lon) % 360, self.lat)[0] < -3:
                    dark.append(c)
            pool = dark or cands
            if not pool:
                continue
            if len(pool) > 1:
                h = self.h[m["row"]] if self.h[m["row"]] is not None else self.h_mean
                g = self.base_noon_ut + (h if h is not None else 12) / 24
                pool = [min(pool, key=lambda c: abs(c - g))]
            uts.append(pool[0])
        if not uts:
            return None
        jd = float(np.mean(uts))
        if np.ptp(uts) > 2.5 / 24:
            self.flags.append(f"long_span:{np.ptp(uts)*24:.1f}h")
        return jd


def _solve_one(i):
    ss = SESSIONS[i]
    out = {}
    for primary in (True, False):
        try:
            sol, why = ss.solve(primary)
        except Exception as e:
            sol, why = None, f"error:{type(e).__name__}:{e}"
        out["primary" if primary else "with_L"] = (sol, why)
    if out["primary"][0]:
        out["epoch"] = ss.epoch_jd(out["primary"][0])
    if out["with_L"][0]:
        out["epoch_L"] = ss.epoch_jd(out["with_L"][0])
    return i, out, ss.flags


SESSIONS = []


def to_ecliptic(ss, sol, jd, delta_au):
    # sidereal time at the epoch, for the parallax direction
    lst = (gast_deg(jd, ss.dT) + ss.lon) % 360
    ra_g, de_g = topo_to_geo(sol["ra"], sol["dec"], lst, delta_au, ss.lat)
    eps = true_obliquity(jd + ss.dT / 86400)
    return eq2ecl(ra_g, de_g, eps)


def sigma_ecl(ss, sol, jd):
    """formal errors (RA*cos dec, dec) -> (lon*cos lat, lat) by a numerical Jacobian of the frame rotation"""
    eps = true_obliquity(jd + ss.dT / 86400)
    ra, de = sol["ra"], sol["dec"]
    l0, b0 = eq2ecl(ra, de, eps)
    h = 1e-4
    la, ba = eq2ecl(ra + h / math.cos(de * D2R), de, eps)
    ld, bd = eq2ecl(ra, de + h, eps)
    J = np.array([[wrap180(la - l0) * math.cos(b0 * D2R) / h, wrap180(ld - l0) * math.cos(b0 * D2R) / h],
                  [(ba - b0) / h, (bd - b0) / h]])
    C = J @ np.diag(np.array(sol["err"]) ** 2) @ J.T
    return float(math.sqrt(C[0, 0])), float(math.sqrt(C[1, 1]))


def run(files, check=False, workers=6):
    global SESSIONS
    sessions = []
    for f in files:
        d = json.loads(pathlib.Path(f).read_text())
        for s in d["sessions"]:
            s["_file"] = str(f)
            sessions.append(s)
    load_hip([v["hip"] for s in sessions for v in s.get("stars", {}).values() if isinstance(v.get("hip"), int)])
    results, objs, calib_only = [], [], []
    for S in sessions:
        if any(str(f).startswith("no_mars_data") for f in (S.get("flags") or [])):
            try:  # no Mars, but its calibration readings (reference-star altitudes, star-to-star checks) still count
                cs = Session(S); cs.prepare(); calib_only.append(cs)
            except Exception:
                pass
            results.append(dict(id=S["id"], date_julian=S["date_julian"], site=S.get("site"), source=S.get("source"),
                                status="skipped", why="no_mars_data (transcriber)", flags=["no_mars_data"]))
            continue
        try:
            ss = Session(S)
            ss.prepare()
            objs.append(ss)
        except Exception as e:
            results.append(dict(id=S.get("id"), date_julian=S.get("date_julian"), site=S.get("site"), source=S.get("source"),
                                status="unreducible", why=f"error in session header/time model: {type(e).__name__}: {e}", flags=[]))
    # pooled zero points (site/instrument, year) from all sessions' own calibration readings
    pools = {"dec": {}, "quad": {}, "kss": {}}
    tmp = {}
    for ss in objs + calib_only:
        for c, zs in ss.kss_list.items():
            tmp.setdefault(("kss", (ss.site, ss.yr, c)), []).extend(zs)
        for z in ss.zdec_list:
            tmp.setdefault(("dec", (ss.site, ss.yr)), []).append(z)
        for qc, zs in ss.zq_list.items():
            tmp.setdefault(("quad", (qc, ss.yr)), []).extend(zs)
    for (kind, key), zs in tmp.items():
        if len(zs) >= 2:
            v = float(np.median(zs))
            if kind == "kss" and abs(v) * 60 > 3:  # a pooled sextant index beyond 3' is not trusted
                continue
            pools[kind][key] = v
    for ss in objs:
        try:
            ss.build(pools)
        except Exception as e:
            ss.all_meas = []
            ss.flags.append(f"error_in_build:{type(e).__name__}:{e}")
    SESSIONS = objs
    import multiprocessing as mp
    if workers > 1 and len(objs) > 8:
        with mp.get_context("fork").Pool(workers) as pool:
            outs = pool.map(_solve_one, range(len(objs)), chunksize=4)
    else:
        outs = [_solve_one(i) for i in range(len(objs))]
    # Horizons at every epoch (verification only)
    epochs = []
    for i, out, fl in outs:
        objs[i].flags = fl
        for k in ("epoch", "epoch_L"):
            if out.get(k):
                epochs.append(out[k])
        for tr in objs[i].S.get("tycho_reduction") or []:
            if out.get("epoch"):
                tt = tr.get("t")
                th = objs[i].hours(tt) if tt else None
                tr["_jd"] = objs[i].base_noon_ut + th / 24 if th is not None else out["epoch"]
                if abs(tr["_jd"] - out["epoch"]) > 0.6:
                    tr["_jd"] = out["epoch"]
                epochs.append(tr["_jd"])
    hz = horizons_geo(epochs) if epochs else {}
    for i, out, _ in outs:
        ss = objs[i]
        sol, why = out["primary"]
        rec = dict(id=ss.id, date_julian=ss.S["date_julian"], calendar=ss.calendar, calendar_test=ss.calendar_test,
                   site=ss.site, lat_site=ss.lat, lon_site=ss.lon, source=ss.S.get("source"), file=ss.S.get("_file"),
                   clock=ss.clock_source, n_meas_all=len(ss.all_meas),
                   n_meas_L=sum(1 for m in ss.all_meas if m["conf"] == "L"))
        if sol and out.get("epoch"):
            jd = out["epoch"]
            H = hz[jd]
            lam, bet = to_ecliptic(ss, sol, jd, H["delta"])        # verification: true Earth-Mars distance
            lam_n, bet_n = to_ecliptic(ss, sol, jd, 1.0)           # data product: nominal 1 au (no ephemeris input)
            sl, sb = sigma_ecl(ss, sol, jd)
            dl = wrap180(lam - H["lon"]) * 60 * math.cos(H["lat"] * D2R); db = (bet - H["lat"]) * 60
            kinds = sorted({m["kind"] for m in sol["meas"]})
            classes = sorted({m.get("cls") for m in sol["meas"] if m.get("cls")})
            rec.update(status="reduced", jd_ut=jd, jd_tt=jd + ss.dT / 86400, ra=sol["ra"], dec=sol["dec"],
                       lon=lam, lat=bet, lon_product=lam_n, lat_product=bet_n,
                       sigma_lon_arcmin=sl, sigma_lat_arcmin=sb, formal_err_radec_arcmin=sol["err"], dof=sol["dof"],
                       chi2_dof=sol["chi2_dof"], n_meas=len(sol["meas"]), kinds=kinds, dist_classes=classes,
                       index_terms_arcmin=sol["k"], zero_armillary_arcmin=(ss.zdec * 60 if ss.zdec is not None else None),
                       zero_armillary_source=ss.zdec_src, zero_quadrant_arcmin={k: v * 60 for k, v in ss.zq.items()},
                       removed=sol["removed"],
                       residuals=[dict(row=m["row"], kind=m["kind"], conf=m["conf"], resid_arcmin=v * m["sigma"])
                                  for m, v in zip(sol["meas"], sol["resid"])],
                       horizons=dict(lon=H["lon"], lat=H["lat"], delta=H["delta"], elong=H["elong"], raw=H["raw"]),
                       dlon_arcmin=dl, dlat_arcmin=db, total_arcmin=math.hypot(dl, db))
            if not np.isfinite(sl) or not np.isfinite(sb) or max(sl, sb) > 3:
                ss.flags.append("geometry_weak(formal_err>3')")
            if sol.get("ambiguity"):
                ss.flags.append(sol["ambiguity"])
            if sol.get("dropped_low"):
                ss.flags.append(f"below_5deg_dropped:{sol['dropped_low']}")
            # with L cells
            solL, whyL = out["with_L"]
            if solL and out.get("epoch_L") and rec["n_meas_L"]:
                HL = hz[out["epoch_L"]]
                lL, bL = to_ecliptic(ss, solL, out["epoch_L"], HL["delta"])
                rec["with_L"] = dict(n_meas=len(solL["meas"]), dlon_arcmin=wrap180(lL - HL["lon"]) * 60 * math.cos(HL["lat"] * D2R),
                                     dlat_arcmin=(bL - HL["lat"]) * 60)
            # Tycho's own printed reductions (cross-check only, never data)
            tys = []
            for tr in ss.S.get("tycho_reduction") or []:
                if "_jd" not in tr:
                    continue
                Ht = hz[tr["_jd"]]
                e = {}
                try:
                    if tr.get("lon") and (tr.get("lon_sign") or "").lower() in SIGNS:
                        tl = SIGNS.index(tr["lon_sign"].lower()) * 30 + parse_angle(tr["lon"])
                        e["dlon_arcmin"] = wrap180(tl - Ht["lon"]) * 60 * math.cos(Ht["lat"] * D2R)
                        e["tycho_minus_ours_lon"] = wrap180(tl - lam) * 60 * math.cos(bet * D2R)
                    if tr.get("lat") and tr.get("lat_dir"):
                        tb = signed_dec(parse_angle(tr["lat"]), tr["lat_dir"])
                        e["dlat_arcmin"] = (tb - Ht["lat"]) * 60
                        e["tycho_minus_ours_lat"] = (tb - bet) * 60
                    if tr.get("ra"):
                        e["dra_arcmin"] = wrap180(parse_angle(tr["ra"]) - Ht["ra"]) * 60 * math.cos(Ht["dec"] * D2R)
                    if tr.get("dec") and tr.get("dec_dir"):
                        e["ddec_arcmin"] = (signed_dec(parse_angle(tr["dec"]), tr["dec_dir"]) - Ht["dec"]) * 60
                except (TypeError, ValueError):
                    e["parse_error"] = True
                if e:
                    tc = tr.get("conf") or {}
                    e["conf"] = worst(*(tc.values() if isinstance(tc, dict) else [str(tc)]))
                    e["verbatim"] = (tr.get("verbatim") or "")[:160]
                    e["table_comparison"] = bool(re.search(r"Calculus Tychon|LOCA MARTIS|tabula", (tr.get("verbatim") or "") + (tr.get("note") or ""), re.I))
                    tys.append(e)
            rec["tycho_reduction_vs_horizons"] = tys
        else:
            rec.update(status="unreducible", why=why or "no epoch")
        rec["flags"] = sorted(set(ss.flags + [f for f in (ss.S.get("flags") or []) if f.split(":")[0] in
                                              ("copy_codex_K", "star_name_conflict", "clock_slip_suspected", "altitudes_suspect",
                                               "time_basis_uncertain", "site_uncertain", "dreyer_correction", "long_session",
                                               "illegible", "extra_session_not_in_worklist")]))
        results.append(rec)
    results.sort(key=lambda r: r["id"] or "")
    OUTB.mkdir(parents=True, exist_ok=True)
    (OUTB / "results.json").write_text(json.dumps(results, indent=1, default=float))
    red = [r for r in results if r.get("status") == "reduced"]
    for r in red:
        LOG.append(f"{r['id']:14s} {r['site']:10s} n={r['n_meas']:3d} d={r['dlon_arcmin']:+7.2f}' {r['dlat_arcmin']:+7.2f}' "
                   f"tot {r['total_arcmin']:6.2f}' sig {r['sigma_lon_arcmin']:.2f}/{r['sigma_lat_arcmin']:.2f} | {','.join(r['flags'])}")
    tot = [r["total_arcmin"] for r in red]
    log(f"SUMMARY: {len(red)} reduced, {sum(1 for r in results if r.get('status') == 'unreducible')} unreducible, "
        f"{sum(1 for r in results if r.get('status') == 'skipped')} skipped; median total {np.median(tot) if tot else float('nan'):.2f}'")
    (OUTB / "log.txt").write_text("\n".join(LOG) + "\n")
    if check:
        ref = {"1595-10-25V": 0.87, "1595-07-22M": 0.82}
        got = {k: next((r.get("total_arcmin", 99) for r in results if r["id"] == k), 99) for k in ref}
        ok = all(got[k] < 2.0 for k in ref)
        log(f"KILL-TEST REGRESSION (both kill-test nights under 2', kill test 0.87' and 0.82'): {got}: {'OK' if ok else 'CHANGED'}")
        return 0 if ok else 1
    return 0


if __name__ == "__main__":
    args = [a for a in sys.argv[1:] if not a.startswith("--")]
    sys.exit(run(args or [HERE / "transcription.json"], check="--check" in sys.argv))
