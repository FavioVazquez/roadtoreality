# Find the law in these observations

`positions.csv` holds 187 measurements of the direction to one object, as seen by an observer, made over a long period. The rows are in no particular order. Columns:
- `t`: time, in arbitrary but uniform units;
- `x_deg`: an angle around a great circle, 0–360 (fixed reference frame);
- `y_deg`: the angle above or below that great circle;
- `sx_arcmin` and `sy_arcmin`: 1σ measurement errors, in arcminutes.
Some rows are wrong (recording slips) and nobody knows which.

**Task:** find the model of this motion that predicts it best and is as simple as the data allow. No model family is given or
preferred; deciding what kind of model to use is the task. Then report what the model says about how the system works,
and any regularity between its numbers.

## Rules
- Read ONLY this folder. No other path, no repository, no web. Do not type in any known physical or astronomical
  constants or parameters. Every starting value must come from the data. If you think you recognise the system, say so
  in the report, say why, and keep that knowledge out of the fit.
- Allowed: numpy and scipy. Use multiprocessing across 6 cores for any grid or multistart search.
- **Time budget: 30 minutes wall time.** Keep searches lean and vectorised; prefer good starting values from periodograms
  over brute-force grids.
- **Prediction test, fixed now:** fit on rows with t < 1050.889543, and predict the rows with t >= 1050.889543 without
  refitting. Report in-sample and held-out median and RMS residuals for every family you try. A model that fits the
  training rows but fails on the held-out ones loses.
- **Pre-register:** before any fit, write `PLAN.md`: the families in order, the outlier rule (fixed threshold), the
  complexity penalty and the decision rule. Later additions go under "post hoc".
- Try at least three structurally different families, including at least one with no physics at all (e.g. a flexible
  function of time).

## Deliverables in this folder
- `PLAN.md`;
- `fit.py`;
- `MODEL.json`: the winning model's parameters with σ, and the scores of every family;
- `REPORT.md`;
- `FROZEN.txt`: the sha256 of MODEL.json, written last.
Reply in under 200 words: the winning model, its key parameters, the held-out scores, the regularities, and whether you
recognised the system and why.
