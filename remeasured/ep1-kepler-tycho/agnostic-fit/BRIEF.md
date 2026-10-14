# Find a law in these observations

`positions.csv` in this folder holds 187 observed sky positions of one planet, made by naked-eye instruments between
1580 and 1601 and reduced one night at a time. Columns:
- `session_id`: date, plus V/M/N for the part of the night;
- `jd_tt`: Julian Date, TT;
- `lon_deg` and `lat_deg`: apparent ecliptic longitude and latitude seen from the observer, true ecliptic and equinox of date;
- `sigma_lon_arcmin` and `sigma_lat_arcmin`: formal 1σ errors;
- `site`;
- `flags`: notes from the reduction.
Some rows are wrong (transcription slips, date conventions), and nobody knows which.

**Task:** find the model of this motion that predicts it best and is as simple as the data allow. No model family is
given or preferred; deciding what kind of model to use is the task. Report what the model says about how the system works.

## Rules (a blind measurement under a strict protocol)
- Read ONLY this folder. Do not open any other path, any repository, any ephemeris (no Horizons, JPL, DE files, astropy
  solar-system bodies such as `get_body` or `get_sun`) or the web. Do not type in any known orbital or planetary
  parameters from memory, either as a start or as a check: every starting value must come from the data. You may well
  recognise the planet and know textbook astronomy; say so in your report, and keep it out of the fit.
- Allowed: numpy, scipy, and erfa or astropy for precession and nutation of the coordinate frame ONLY.
- **Prediction test, fixed now:** fit on rows with jd_tt < 2304000.5 (before mid-January 1596), and predict the later rows
  without refitting. Report the in-sample and held-out median and RMS residuals for every model you try. A model that fits
  the early years but fails on the later ones loses.
- **Pre-register:** before any fit, write `PLAN.md`: the families you will try and in what order, the outlier rule
  (fixed threshold), the complexity penalty (e.g. BIC on the training set), and the decision rule. Later additions go
  under a "post hoc" heading.
- Try at least three structurally different families, including at least one that needs no physics at all (e.g. a flexible
  function of time), so the comparison is fair.

## Deliverables in this folder
- `PLAN.md`;
- `fit.py` (reproducible);
- `MODEL.json`: the winning model's parameters with σ and the scores of every family;
- `REPORT.md`: what the winning model says about the geometry and the regularities, in your own words, with a figure of
  held-out residuals;
- `FROZEN.txt`: the sha256 of MODEL.json, written last.
Reply in under 250 words: the winning model, its parameters, the held-out scores of every family, and any regularity you
noticed between the model's numbers.
