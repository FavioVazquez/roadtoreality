"""Episode 1 batch reducer: Tycho Brahe's Mars sessions -> geocentric apparent ecliptic longitude and latitude of date,
each compared with JPL Horizons (Mars barycenter, body 4, DE441). Nothing about the motion of Mars is fitted here: each session stands alone.

Run:  data/.venv/bin/python -I reduce.py [merged.json ...]        (default: transcription.json)
      data/.venv/bin/python -I reduce.py --check                   (kill-test regression on transcription.json)
Writes out/batch/results.json, out/batch/summary.csv, out/batch/log.txt.

Input: one or more files in the session format of TRANSCRIBE-GUIDE.md ("schema": "tycho-mars-session/2").
Other inputs (see fetch.sh, SHA256SUMS): data/hip/ (Hipparcos, fetched here for any HIP the transcribers name),
data/horizons/ (raw Horizons replies, fetched here and cached).

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
                    "Prague": "gregorian"}

SIGMA = dict(transit=3.0, sext=1.0, radius=3.0, dec=1.0, dec_uncal=2.0, malt=1.0, malt_uncal=1.5, radiff=1.5, altaz=4.0, starstar=1.0)
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


def parse_time(s):
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
    return -v if (d or "B").upper().startswith(("A", "M", "S")) else v


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

class Session:
    def __init__(self, S):
        self.S = S
        self.flags = list(S.get("flags", []))
        self.id = S["id"]
        y, m, d = (int(x) for x in S["date_julian"].split("-"))
        site = S.get("site")
        if not site or site not in SITES:
            site = next(s for dd, s in SITE_BY_DATE if S["date_julian"] <= dd)
            self.flags.append(f"site_default_by_date:{site}")
        self.site = site
        self.calendar = S.get("calendar") or CALENDAR_BY_SITE.get(site, "julian")
        if not S.get("calendar") and self.calendar != "julian":
            self.flags.append(f"calendar_by_site:{self.calendar}")
        # 0h UT of the civil date as printed
        self.jd_date0 = jd_julian(y, m, d) if self.calendar == "julian" else sum(erfa.cal2jd(y, m, d))
        self.year = y + (m - 0.5) / 12
        self.dT = delta_t_seconds(self.year)
        self.lat, self.lon = SITES[site]["lat"], SITES[site]["lon"]
        if SITES[site]["q"] != "good":
            self.flags.append(f"site_approx:{site}")
        night_before = bool(S.get("night_before"))
        sess = (S.get("session") or "").lower()
        # base = local apparent noon from which 'from_noon' hours run
        self.base_noon = self.jd_date0 - (1 if (night_before or sess == "mane") else 0) + 0.5
        self.basis = S.get("time_basis", "unknown")
        self.stars = {k: v for k, v in S.get("stars", {}).items()}

    def hours_from_base(self, t):
        """printed time -> hours after the base local apparent noon"""
        h = parse_time(t)
        if h >= 12:
            return h  # any printed hour of 12 or more counts from noon, whatever the label (e.g. "12 24 1/2 A.M.")
        if self.basis == "from_noon":
            return h
        if self.basis == "from_midnight":
            sess = (self.S.get("session") or "").lower()
            if self.S.get("night_before") or sess == "mane":
                return h + 12  # base is the previous noon
            return h + 12 if h < 12 else h  # evening session written from midnight is unusual
        return h  # unknown: treated as from noon, flagged

    def row_time(self, r):
        t = r.get("t_corr") or r.get("t") or r.get("t_assumed")
        if r.get("t_assumed") and not (r.get("t_corr") or r.get("t")):
            self.flags.append("time_assumed_row")
        return self.hours_from_base(t) if t else None

    def setup_clock(self):
        """sidereal time as a function of hours from base noon"""
        jd_noon_ut = self.base_noon - self.lon / 360  # local apparent noon ~ UT, rough
        offs = []
        for r in self.S["rows"]:
            c = r.get("clock")
            h = self.row_time(r)
            if c and h is not None and c.get("ha") and c.get("star") in self.stars and self.stars[c["star"]].get("hip"):
                ra_c, _ = star_apparent(self.stars[c["star"]]["hip"], jd_noon_ut + h / 24 + self.dT / 86400)
                ha = parse_angle(c["ha"]) * (1 if c.get("side", "occ").startswith("occ") else -1)
                lst = (ra_c + ha) % 360
                offs.append((lst - h * 15.041068640) % 360)
        ra_sun, _ = sun_radec(jd_noon_ut + self.dT / 86400)
        self.clock_source = "solar"
        # apparent solar time: the Sun's hour angle is 15 h deg, so LST = RA_sun(t) + 15 h ~ RA_sun(noon) + 15.041 h
        self.solar_off = ra_sun % 360
        if offs:
            rel = np.array([wrap180(o - offs[0]) for o in offs])
            med = float(np.median(rel))
            self.off = (offs[0] + med) % 360
            dev = (rel - med) * 4
            slips = [x for x in dev if abs(abs(x) - 4) < 0.8]
            if slips:
                self.flags.append(f"clock_slip_1deg:{len(slips)}")
            if np.any(np.abs(dev) > 2) and len(slips) < np.sum(np.abs(dev) > 2):
                self.flags.append("clock_readings_scatter>2min")
            self.clock_source = f"clock star ({len(offs)})"
            d_solar = wrap180(self.off - self.solar_off) / 15.041
            if abs(d_solar) > 0.5:
                self.flags.append(f"clock_vs_printed_time:{d_solar:+.1f}h")
            # calendar test: the other calendar moves the Sun's RA by ~10 deg (40 min of printed time)
            other = 10 if self.calendar == "julian" else -10
            ra_sun_o, _ = sun_radec(jd_noon_ut + other + self.dT / 86400)
            d_other = wrap180(self.off - ra_sun_o % 360) / 15.041
            self.calendar_test = dict(minutes_this=round(d_solar * 60, 1), minutes_other=round(d_other * 60, 1))
            if abs(d_other) < abs(d_solar) and abs(d_solar) > 0.25:
                self.flags.append(f"calendar_conflict:clock fits the other calendar ({d_other*60:+.0f} vs {d_solar*60:+.0f} min)")
            self.clock_dev = [float(x) for x in dev]
        else:
            self.off = self.solar_off
            if self.basis == "unknown":
                self.flags.append("time_basis_unknown")

    def lst_of(self, h):
        return (self.off + h * 15.041068640) % 360

    def jd_of(self, h):
        """UT JD for hours-from-base h, made consistent with the sidereal time and night-time"""
        guess = self.base_noon - self.lon / 360 + h / 24
        cands = ut_candidates(self.lst_of(h), guess, self.dT, self.lon)
        night = []
        for c in cands:
            ra_s, de_s = sun_radec(c + self.dT / 86400)
            lst = (gast_deg(c, self.dT) + self.lon) % 360
            if altaz(ra_s, de_s, lst, self.lat)[0] < -6:
                night.append(c)
        pool = night or cands
        best = min(pool, key=lambda c: abs(c - guess))
        if abs(best - guess) > 2 / 24:
            self.flags.append(f"ut_moved:{(best-guess)*24:+.1f}h")
        return best

    def build(self):
        S = self.S
        self.setup_clock()
        rows = S["rows"]
        hips = {k: v["hip"] for k, v in self.stars.items() if v.get("hip")}
        times = [self.row_time(r) for r in rows]
        known = [t for t in times if t is not None]
        self.h_mean = float(np.mean(known)) if known else None
        self.meas = []   # (kind, sigma, payload)
        if any(t is None and not r.get("at") for r, t in zip(rows, times)
               if r.get("type") in ("obs", "star_star") and not r.get("adopted") and (r.get("dist") or r.get("dec_mars"))):
            if self.h_mean is not None:
                times = [t if (t is not None or r.get("at")) else self.h_mean for r, t in zip(rows, times)]
                self.flags.append("untimed_rows_at_session_mean_time")
            else:
                self.flags.append("time_unknown_assumed_transit")
        zdec, zq = [], {}
        jd_mid = self.base_noon - self.lon / 360 + (self.h_mean if self.h_mean is not None else 12) / 24
        self.jd_tt_mid = jd_mid + self.dT / 86400
        pos = {k: star_apparent(h, self.jd_tt_mid) for k, h in hips.items()}
        self.pos = pos
        # zero points
        for r, h in zip(rows, times):
            if r.get("type") == "dec_star" and r.get("star") in pos and h is not None:
                model = refract(*pos[r["star"]], self.lst_of(h), self.lat)[1]
                for d in r.get("dec", []):
                    zdec.append(signed_dec(parse_angle(d), r.get("dec_dir")) - model)
            if r.get("type") == "merid_alt_star" and r.get("star") in pos:
                de = pos[r["star"]][1]
                h0 = 90 - self.lat + de
                for a in r.get("alt", []):
                    zq.setdefault(a.get("instr", "?"), []).append(parse_angle(a["alt"]) - (h0 + refraction_arcmin(h0) / 60))
        self.zdec = float(np.mean(zdec)) if zdec else 0.0
        self.zq = {k: float(np.mean(v)) for k, v in zq.items()}
        if not zdec and any(r.get("dec_mars") for r in rows):
            self.flags.append("armillary_uncalibrated")
        n_ss = 0
        for i, (r, h) in enumerate(zip(rows, times)):
            typ = r.get("type", "obs")
            q = [x.lower() for x in r.get("qualifiers", [])]
            if r.get("adopted") or "pone" in q or "limitata" in q:
                continue
            w = 0.5 if any(x in " ".join(q) for x in ("dubia", "nubes", "non satis", "incert")) else 1.0
            at = r.get("at")
            if typ == "obs":
                if r.get("star") in pos and r.get("dist"):
                    instr = "radius" if "rad" in (r.get("instr") or "").lower() else "sext"
                    self.meas.append(dict(kind="dist", row=i, h=h, at=at, star=r["star"], val=parse_angle(r["dist"]), cls=instr,
                                          sigma=SIGMA[instr] / w))
                elif r.get("star") and r.get("dist") and r.get("star") not in pos:
                    self.flags.append(f"star_unidentified:{r['star']}")
                for d in r.get("dec_mars", []) or []:
                    self.meas.append(dict(kind="dec", row=i, h=h, at=at, val=signed_dec(parse_angle(d), r.get("dec_dir")),
                                          sigma=(SIGMA["dec"] if zdec else SIGMA["dec_uncal"]) / w))
                if r.get("ha_mars") and r.get("clock") and r["clock"].get("star") in pos and h is not None:
                    sm = 1 if r.get("ha_mars_side", "occ").startswith("occ") else -1
                    sc = 1 if r["clock"].get("side", "occ").startswith("occ") else -1
                    self.meas.append(dict(kind="radiff", row=i, h=h, star=r["clock"]["star"],
                                          val=sc * parse_angle(r["clock"]["ha"]) - sm * parse_angle(r["ha_mars"]), sigma=SIGMA["radiff"] / w))
                if r.get("az_mars") and r.get("alt_mars") and r.get("az_ref") in AZ_REF and h is not None:
                    self.meas.append(dict(kind="alt", row=i, h=h, val=parse_angle(r["alt_mars"]), sigma=SIGMA["altaz"] / w))
                    self.meas.append(dict(kind="az", row=i, h=h, val=AZ_REF[r["az_ref"]](parse_angle(r["az_mars"])) % 360, sigma=SIGMA["altaz"] / w))
            elif typ == "merid_alt_mars":
                if h is not None and self.clock_source.startswith("clock star"):
                    # a timed meridian transit gives RA = local sidereal time at the transit (clock star sessions only)
                    self.meas.append(dict(kind="transit_ra", row=i, h=h, val=self.lst_of(h), sigma=SIGMA["transit"] / w))
                for a in r.get("alt", []):
                    ins = a.get("instr", "?")
                    self.meas.append(dict(kind="malt", row=i, val=parse_angle(a["alt"]) - self.zq.get(ins, 0.0),
                                          sigma=(SIGMA["malt"] if ins in self.zq else SIGMA["malt_uncal"]) / w))
                    if ins not in self.zq:
                        self.flags.append(f"quadrant_uncalibrated:{ins}")
            elif typ == "star_star" and r.get("star_a") in pos and r.get("star_b") in pos and h is not None:
                for d in r.get("dist", []):
                    n_ss += 1
                    self.meas.append(dict(kind="starstar", row=i, h=h, a=r["star_a"], b=r["star_b"], val=parse_angle(d),
                                          cls="radius" if "rad" in (r.get("instr") or "").lower() else "sext", sigma=SIGMA["starstar"]))
        # altitude/azimuth pairs are coarse (azimuth zero, timing, conventions): use them only when the session has no
        # two independent constraints otherwise; else keep them out of the fit (they stay in the record as rows)
        strong = len({m["star"] for m in self.meas if m["kind"] == "dist"}) + len({m["star"] for m in self.meas if m["kind"] == "radiff"}) \
            + (1 if any(m["kind"] in ("dec", "malt") for m in self.meas) else 0)
        if strong >= 2 and any(m["kind"] in ("alt", "az") for m in self.meas):
            self.meas = [m for m in self.meas if m["kind"] not in ("alt", "az")]
            self.flags.append("altaz_not_used(other constraints suffice)")
        elif any(m["kind"] in ("alt", "az") for m in self.meas):
            self.flags.append("altaz_used")
        nstars = {c: len({m["star"] for m in self.meas if m["kind"] == "dist"and m["cls"] == c}) for c in ("sext", "radius")}
        self.free_k = [c for c in ("sext", "radius")
                       if any(m["kind"] == "dist" and m["cls"] == c for m in self.meas)
                       and (nstars[c] >= 3 or any(m["kind"] == "starstar" and m["cls"] == c for m in self.meas))]
        self.flags = sorted(set(self.flags))

    def lst_row(self, m, ra_mars):
        if m.get("h") is not None:
            return self.lst_of(m["h"])
        at = m.get("at") or "transit"
        x = float(at.split("+")[1]) if "+" in at else (-float(at.split("-")[1]) if "-" in at[7:] else 0.0)
        return (ra_mars + x * 15.041) % 360

    def resid(self, p, meas, kfree):
        ra, de = p[0], p[1]
        k = {c: p[2 + i] for i, c in enumerate(kfree)}
        out = []
        for m in meas:
            lst = self.lst_row(m, ra)
            if m["kind"] == "dist":
                a = refract(ra, de, lst, self.lat); b = refract(*self.pos[m["star"]], lst, self.lat)
                out.append((sep(*a, *b) + k.get(m["cls"], 0) / 60 - m["val"]) * 60 / m["sigma"])
            elif m["kind"] == "starstar":
                a = refract(*self.pos[m["a"]], lst, self.lat); b = refract(*self.pos[m["b"]], lst, self.lat)
                out.append((sep(*a, *b) + k.get(m["cls"], 0) / 60 - m["val"]) * 60 / m["sigma"])
            elif m["kind"] == "dec":
                out.append((refract(ra, de, lst, self.lat)[1] + self.zdec - m["val"]) * 60 / m["sigma"])
            elif m["kind"] == "malt":
                h0 = 90 - self.lat + de
                out.append((h0 + refraction_arcmin(h0) / 60 - m["val"]) * 60 / m["sigma"])
            elif m["kind"] == "transit_ra":
                out.append(wrap180(refract(ra, de, m["val"], self.lat)[0] - m["val"]) * 60 * math.cos(de * D2R) / m["sigma"])
            elif m["kind"] == "radiff":
                a = refract(ra, de, lst, self.lat); b = refract(*self.pos[m["star"]], lst, self.lat)
                out.append((wrap180(a[0] - b[0]) - m["val"]) * 60 / m["sigma"])
            elif m["kind"] in ("alt", "az"):
                h, az = altaz(ra, de, lst, self.lat)
                if m["kind"] == "alt":
                    out.append((h + refraction_arcmin(h) / 60 - m["val"]) * 60 / m["sigma"])
                else:
                    out.append(wrap180(az - m["val"]) * 60 * math.cos(h * D2R) / m["sigma"])
        return np.array(out)

    def first_guess(self):
        """coarse grid for a start: RA within 60 deg of the reference stars' mean, Dec from the declination or
        meridian-altitude data when present, else a 2-degree grid."""
        if not self.pos:
            return None
        ras = [v[0] for v in self.pos.values()]; des = [v[1] for v in self.pos.values()]
        ra0 = math.degrees(math.atan2(np.mean(np.sin(np.radians(ras))), np.mean(np.cos(np.radians(ras))))) % 360
        decs = [m["val"] - self.zdec for m in self.meas if m["kind"] == "dec"]
        malts = [m["val"] - 90 + self.lat for m in self.meas if m["kind"] == "malt"]
        if decs or malts:
            dgrid = [float(np.median(decs or malts))]
        else:
            dgrid = list(np.clip(np.mean(des) + np.arange(-40, 41, 2.0), -80, 80))
        best, bx = None, None
        for dra in np.arange(-60, 61, 1.0 if len(dgrid) == 1 else 2.0):
            for de in dgrid:
                ra = (ra0 + dra) % 360
                r = self.resid([ra, de] + [0.0] * len(self.free_k), self.meas, self.free_k)
                c = float(np.sum(np.minimum(r**2, 400)))
                if best is None or c < best:
                    best, bx = c, [ra, de]
        return bx

    def solve(self):
        if len([m for m in self.meas if m["kind"] in ("dist", "radiff", "az", "transit_ra")]) < 1 or len(self.meas) < 2:
            return None
        x0 = self.first_guess()
        if x0 is None:
            return None
        meas = list(self.meas)
        kfree = list(self.free_k)

        def fit(meas, kfree):
            p0 = list(x0) + [0.0] * len(kfree)
            sol = least_squares(lambda p: self.resid(p, meas, kfree), p0, x_scale=[0.01, 0.01] + [1.0] * len(kfree))
            r = self.resid(sol.x, meas, kfree)
            dof = max(1, len(r) - len(sol.x))
            try:
                cov = np.linalg.inv(sol.jac.T @ sol.jac) * max(1.0, float(np.sum(r**2) / dof))
                err = np.sqrt(np.diag(cov))
            except np.linalg.LinAlgError:
                err = np.full(len(sol.x), np.nan)
            return sol.x, r, err

        x, r, err = fit(meas, kfree)
        bad = [i for i in np.argsort(-np.abs(r)) if abs(r[i]) > 4][: max(0, len(meas) // 5)]
        if bad:
            self.flags.append(f"outliers_removed:{len(bad)}")
            self.removed = [dict(row=meas[i]["row"], kind=meas[i]["kind"], resid_sigma=float(r[i])) for i in bad]
            meas = [m for j, m in enumerate(meas) if j not in bad]
            x, r, err = fit(meas, kfree)
        else:
            self.removed = []
        kinfo = {c: (float(x[2 + i]), float(err[2 + i])) for i, c in enumerate(kfree)}
        for c, (kv, ke) in kinfo.items():
            if not np.isfinite(ke) or ke > 1.5:
                self.flags.append(f"index_{c}_poorly_determined")
            elif abs(kv) > 2.0:
                self.flags.append(f"index_{c}_large:{kv:+.1f}'")
        xk0, rk0, _ = fit(meas, []) if kfree else (x, r, err)
        e_ra = err[0] * 60 * math.cos(x[1] * D2R); e_de = err[1] * 60
        if not np.isfinite(e_ra) or not np.isfinite(e_de) or max(e_ra, e_de) > 3:
            self.flags.append("geometry_weak(formal_err>3')")
        return dict(ra=float(x[0]) % 360, dec=float(x[1]), err=[float(e_ra), float(e_de)], k=kinfo, meas=meas,
                    resid=[float(v) for v in r], x_k0=[float(xk0[0]) % 360, float(xk0[1])])


def run(files, check=False):
    sessions = []
    for f in files:
        d = json.loads(pathlib.Path(f).read_text())
        for s in d["sessions"]:
            s["_file"] = str(f)
            sessions.append(s)
    load_hip([v["hip"] for s in sessions for v in s.get("stars", {}).values() if v.get("hip")])
    results, epochs = [], {}
    objs = []
    for S in sessions:
        try:
            ss = Session(S)
        except Exception as e:  # a malformed session must not stop the batch
            results.append(dict(id=S.get("id"), date_julian=S.get("date_julian"), file=S.get("_file"), n_meas=0,
                                flags=[f"error_in_header:{type(e).__name__}:{e}", "not_reducible"]))
            log(f"{S.get('id')!s:14s} not reduced | header error {e}")
            continue
        try:
            ss.build()
            sol = ss.solve()
        except Exception as e:  # keep going; the session is reported with its error
            sol = None
            ss.flags.append(f"error:{type(e).__name__}:{e}")
        if sol is None:
            ss.flags.append("not_reducible")
        objs.append((ss, sol))
        if sol:
            h = ss.h_mean
            if h is None:  # transit-referenced session: solar time of transit
                h = wrap180(sol["ra"] - ss.off) / 15.041 % 24
                tr = [m for m in sol["meas"] if m.get("at")]
                if tr:
                    shifts = []
                    for m in tr:
                        a = m["at"]
                        shifts.append(float(a.split("+")[1]) if "+" in a else 0.0)
                    h += float(np.mean(shifts))
                ss.h_epoch = h
            else:
                ss.h_epoch = h
            epochs[ss.id] = ss.jd_of(ss.h_epoch)
            for tr in ss.S.get("tycho_reduction", []) or []:
                tt = tr.get("t")
                th = ss.hours_from_base(tt) if tt else ss.h_epoch
                epochs[ss.id + "|tycho|" + (tt or "")] = ss.jd_of(th)
    hz = horizons_geo(list(epochs.values())) if epochs else {}
    rows_out = []
    for ss, sol in objs:
        rec = dict(id=ss.id, date_julian=ss.S["date_julian"], calendar=ss.calendar, calendar_test=getattr(ss, "calendar_test", None),
                   file=ss.S.get("_file"), site=ss.site, source=ss.S.get("source"),
                   n_meas=len(sol["meas"]) if sol else 0)
        if sol:
            jd = epochs[ss.id]
            H = hz[jd]
            lst = ss.lst_of(ss.h_epoch)
            ra_g, de_g = topo_to_geo(sol["ra"], sol["dec"], lst, H["delta"], ss.lat)
            eps = true_obliquity(jd + ss.dT / 86400)
            lam, bet = eq2ecl(ra_g, de_g, eps)
            dl = wrap180(lam - H["lon"]) * 60 * math.cos(H["lat"] * D2R); db = (bet - H["lat"]) * 60
            rg0 = topo_to_geo(*sol["x_k0"], lst, H["delta"], ss.lat); l0, b0 = eq2ecl(*rg0, eps)
            rec.update(jd_ut=jd, clock=ss.clock_source, lon=lam, lat=bet, horizons_lon=H["lon"], horizons_lat=H["lat"],
                       elongation=H["elong"], dlon_arcmin=dl, dlat_arcmin=db, total_arcmin=math.hypot(dl, db),
                       formal_err_arcmin=sol["err"], index_terms_arcmin={c: v for c, v in sol["k"].items()},
                       zero_armillary_arcmin=ss.zdec * 60, zero_quadrant_arcmin={k: v * 60 for k, v in ss.zq.items()},
                       without_index_terms=dict(dlon=wrap180(l0 - H["lon"]) * 60 * math.cos(H["lat"] * D2R), dlat=(b0 - H["lat"]) * 60),
                       residuals=[dict(row=m["row"], kind=m["kind"], resid_arcmin=v * m["sigma"]) for m, v in zip(sol["meas"], sol["resid"])],
                       removed=ss.removed, horizons_raw=H["raw"])
            if rec["total_arcmin"] > 5:
                ss.flags.append("horizons_residual>5'")
            elif rec["total_arcmin"] > 2:
                ss.flags.append("horizons_residual>2'")
            tys = []
            for tr in ss.S.get("tycho_reduction", []) or []:
                if tr.get("lon") and tr.get("lon_sign"):
                    sg = SIGNS.index(tr["lon_sign"].lower()) if tr["lon_sign"].lower() in SIGNS else None
                    if sg is None:
                        continue
                    tl = sg * 30 + parse_angle(tr["lon"]); tb = signed_dec(parse_angle(tr.get("lat", "0")), tr.get("lat_dir"))
                    Ht = hz[epochs[ss.id + "|tycho|" + (tr.get("t") or "")]]
                    d1 = wrap180(tl - Ht["lon"]) * 60 * math.cos(Ht["lat"] * D2R); d2 = (tb - Ht["lat"]) * 60
                    tys.append(dict(lon=tl, lat=tb, dlon_arcmin=d1, dlat_arcmin=d2))
                    if math.hypot(d1, d2) > 5:
                        ss.flags.append("tycho_reduction_vs_horizons>5'")
            rec["tycho_reduction_vs_horizons"] = tys
        rec["flags"] = sorted(set(ss.flags))
        results.append(rec)
        if sol:
            log(f"{rec['id']:14s} {ss.site:10s} n={rec['n_meas']:2d} lon {rec['lon']:8.3f} lat {rec['lat']:+7.3f} | Horizons "
                f"d={rec['dlon_arcmin']:+6.2f}' {rec['dlat_arcmin']:+6.2f}' tot {rec['total_arcmin']:5.2f}' | elong {rec['elongation']:5.1f} | "
                f"k={ {c: round(v[0], 2) for c, v in sol['k'].items()} } | {','.join(rec['flags'])}")
            for t in rec["tycho_reduction_vs_horizons"]:
                log(f"{'':14s} Tycho's printed reduction vs Horizons: {t['dlon_arcmin']:+.2f}' {t['dlat_arcmin']:+.2f}'")
        else:
            log(f"{rec['id']:14s} not reduced | {','.join(rec['flags'])}")
    OUTB.mkdir(parents=True, exist_ok=True)
    (OUTB / "results.json").write_text(json.dumps(results, indent=1, default=float))
    with open(OUTB / "summary.csv", "w", newline="") as f:
        w = csv.writer(f)
        w.writerow(["id", "date_julian", "site", "n_meas", "elongation", "dlon_arcmin", "dlat_arcmin", "total_arcmin", "flags", "volume", "pages", "leaves"])
        for r in results:
            src = r.get("source") or {}
            w.writerow([r["id"], r["date_julian"], r["site"], r["n_meas"], r.get("elongation"), r.get("dlon_arcmin"), r.get("dlat_arcmin"),
                        r.get("total_arcmin"), ";".join(r["flags"]), src.get("volume"), src.get("pages"), src.get("leaves")])
    tot = [r["total_arcmin"] for r in results if "total_arcmin" in r]
    if tot:
        log(f"SUMMARY: {len(tot)} of {len(results)} sessions reduced; median total {np.median(tot):.2f}'; within 2': "
            f"{sum(t <= 2 for t in tot)}; within 5': {sum(t <= 5 for t in tot)}")
    (OUTB / "log.txt").write_text("\n".join(LOG) + "\n")
    if check:
        ref = {"1595-10-25V": 0.87, "1595-07-22M": 0.82}
        ok = all(abs(next(r for r in results if r["id"] == k).get("total_arcmin", 99) - v) < 0.5 for k, v in ref.items())
        log(f"KILL-TEST REGRESSION (batch within 0.5' of the kill-test totals 0.87', 0.82'): {'OK' if ok else 'CHANGED'}")
        return 0 if ok else 1
    return 0


if __name__ == "__main__":
    args = [a for a in sys.argv[1:] if not a.startswith("--")]
    sys.exit(run(args or [HERE / "transcription.json"], check="--check" in sys.argv))
