# Find the orbit of Mars from Tycho Brahe's observations

You get one file: `mars_positions.csv`, in this folder. It holds 187 positions of Mars between 1580 and 1601, each reduced on its own from Tycho Brahe's
raw observing logs. Nothing about the motion of Mars was used to make it. Columns:
- `session_id`: date, plus V/M/N for the part of the night;
- `jd_tt`: Julian Date, TT;
- `lon_deg` and `lat_deg`: geocentric apparent ecliptic longitude and latitude, true ecliptic and equinox of date;
- `sigma_lon_arcmin` and `sigma_lat_arcmin`: formal 1σ errors;
- `site`;
- `flags`: quality A or B, plus notes.
Some rows are bad: transcription slips, wrong reference stars, date conventions. Nobody knows which. You must deal with outliers yourself.

Your job is Kepler's job: find the orbit that fits.

## Rules (this is a blind measurement; the protocol is strict)
- Read ONLY this folder. Do not open the repository, any ephemeris, Horizons, JPL, astropy's solar-system ephemerides (`get_body`,
  `get_sun`, `solar_system_ephemeris`), or the web. Do not type in known orbital elements of Mars or Earth from memory, either as a
  starting value or as a check. Every starting value must come from the data: for example, the period from the repeat of the
  oppositions, or the node from the latitude sign changes. You will know roughly what Mars's orbit is; say so in your report, and
  keep it out of the fit.
- Allowed: numpy, scipy, and erfa or astropy for precession and nutation ONLY (these carry no planetary information). Precession is
  about 50″/yr, so over 21 years it is about 17′: refer everything to one fixed equinox, for example J1590.0. Annual aberration
  (about 20″) and light time may be modelled from your own fitted orbits, or ignored with that stated.
- Earth's orbit is unknown too. As Kepler did, determine it from the same data (triangulation via Mars). Fit Earth and Mars jointly.
- Pre-register: BEFORE any fit, write `PLAN.md` with the models, the robust loss or outlier rule (for example Huber, or iterative
  5σ clipping with a fixed threshold), how σ is computed (formal and bootstrap), and the decision rule between models.
  Do not change the plan after seeing residuals. Anything added later goes in a section marked "post hoc".

## The models to compare (pre-register exactly these, in this order)
1. **Circle with equant** for Mars (Kepler's "vicarious hypothesis": eccentric circle, bisected or free equant), with a circular
   Earth orbit with an eccentric centre.
2. **Kepler ellipse** for Mars (Kepler's equation, focus at the Sun), with a circular eccentric Earth.
3. **Two Kepler ellipses** (Earth and Mars), heliocentric, with the Sun at a focus of both.
For each model report:
- the fitted parameters with σ (for an ellipse: a in units of Earth's a, e, longitude of perihelion, node, inclination, period,
  mean longitude at the epoch);
- the RMS and median residual in longitude and latitude;
- the residuals around oppositions vs elsewhere;
- the largest systematic residual pattern.
Then answer Kepler's question directly: does the circle-plus-equant model leave a systematic error of several arcminutes (Kepler
reported 8′) that the ellipse removes? Show it with a figure of residuals vs time or vs Mars's mean anomaly for each model.

## Deliverables in this folder
- `PLAN.md` (written first);
- `fit.py` (reproducible: `python fit.py` regenerates everything);
- `ORBIT.json`: model 3's elements with σ, plus models 1 and 2;
- `REPORT.md`: the model comparison, outliers found (by your rule only) and the answer to the 8′ question;
- figures (PNG).
Then write one line in `FROZEN.txt`: the sha256 of `ORBIT.json`. After that, nothing changes; a referee compares it with modern values.
Report in under 250 words: the elements, the model comparison, the 8′ answer and the outliers.
