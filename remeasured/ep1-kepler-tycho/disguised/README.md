# Disguised blind fits (episode 1, post hoc test of recognition)

**Question:** does the agent find Kepler's ellipses because it recognises Mars and recalls the answer? To test that, the
frozen 187-position product (`../out/mars_positions.csv`, sha256 `626925e4…`) was disguised three ways and given to
fresh agents with no names, no units and no dates. This test was added after the agnostic fit and is post hoc
with respect to PROTOCOL.md.

**Disguise** (`keys/make.py`; keys in `keys/KEYS.json`, kept private until every run had finished):
- every row rotated with erfa precession and nutation into one fixed ecliptic frame (JD 2302032.5);
- time rescaled and shifted (`k` units per day, origin `t0`);
- longitude rotated by `phi`, optionally mirrored; latitude optionally flipped;
- rows shuffled, every label and flag removed.

The brief (`*/BRIEF.md`) gave 187 "measurements of the direction to one object, as seen by an observer" and asked for the
best model, with a held-out tail and a pre-registered plan. It named no families and asked the agent to say if it
recognised the system.

| run | disguise | outcome | winning model | held-out (unflagged) | recovered |
|---|---|---|---|---|---|
| alpha | 3.7 d per unit, rotated | succeeded | two Kepler ellipses, common centre | median 2.05′, RMS 2.96′ | size ratio 1.52363, e 0.0931 / 0.0169, i 1.86° |
| beta | 0.83 d per unit, rotated, mirrored | **failed** | none (`winner: null`) | best median 1045′ | search failure (see below) |
| beta2 | same data as beta, declared rerun | succeeded | two Kepler ellipses, direction = target − observer | median 2.13′, RMS 3.20′ | ratio 1.5236, exponent 1.50017 ± 0.00014, mirror detected |
| gamma | 12.4 d per unit, rotated, mirrored, latitude flipped | succeeded | two Kepler ellipses | median 2.18′, RMS 3.02′ | same ellipses, flags the same 14° latitude slip |

Every run is reported. The three successful runs recognised the system as Mars seen from Earth only *after* fitting,
from the invariants (size ratio, eccentricities, tilt, period ratio). They recovered the hidden time unit (beta2:
0.83 d per unit; key `k` = 1/0.83) and, in beta2, the mirror (key `mirror: true`).

**Beta, run 1.** It ran while the machine was heavily loaded (load average above 100) and its multistart search
never reached the two-ellipse basin: in-sample errors stayed at hundreds of arcminutes, so this is a search failure
and not a model judgement. The disguise was checked by inverting it with the key. The second attempt (beta2) was
declared in advance as a rerun of the same data with the same brief, except for a longer time budget (45 instead of
30 minutes). Its failure would have been reported the same way.

**What this shows and does not show.** Across a rescaled, rotated and mirrored record, two Kepler ellipses still win
on held-out rows, and the third-law exponent comes out at 1.5 (period ∝ size^1.5). Recognition came after the fit,
not before it. This does not prove the agent's general knowledge played no role in which families it chose to try.
The agents know astronomy, and ellipses are a family any physicist would try.

Files per run: `BRIEF.md`, `PLAN.md` (written before any fit), `fit.py`, `MODEL.json`, `REPORT.md`, `FROZEN.txt` (where
written), and the input `positions.csv`. Large arrays (`*.npy`) are not committed. Some scripts and logs contain
absolute paths from the machine they ran on.
