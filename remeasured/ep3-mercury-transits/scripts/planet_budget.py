"""Newtonian planetary contribution to the advance of Mercury's perihelion, from our own integration.

Rate of Mercury's heliocentric osculating longitude of perihelion (J2000 ecliptic, inertial frame),
straight-line fit to the series. Runs: all planets; Sun + Mercury + one planet at a time; Sun + Mercury
alone (must be zero). Spans: 1000 years centred on 1780, and the data window 1677-1881.
Omitted: solar oblateness, asteroids, the Moon as a separate body (it is inside the Earth-Moon point).
Output: out/planet_budget.json
"""
import json
import os
import sys
import time
from concurrent.futures import ProcessPoolExecutor

import numpy as np

sys.path.insert(0, os.path.dirname(__file__))
import nbody as N

OUT = N.hz.ROOT / "out"
STATES = N.horizons_states()


def run(job):
    bodies, t0y, t1y, step = job
    sim = N.build(STATES, bodies=bodies)
    t = np.arange(t0y * 365.25, t1y * 365.25 + 1e-9, step)
    neg = t[t < 0][::-1]
    pos = t[t >= 0]
    s2 = sim.copy()
    pn = N.pomega_series(sim, neg)[::-1] if len(neg) else np.array([])
    pp = N.pomega_series(s2, pos)
    tt = np.concatenate([neg[::-1], pos])
    pom = np.unwrap(np.concatenate([pn, pp]))
    return N.rate_arcsec_per_century(tt, pom)


if __name__ == "__main__":
    t0 = time.time()
    planets = ["299", "3", "4", "5", "6", "7", "8", "9"]
    jobs = {}
    for span, (a, b) in {"1000yr": (-500, 500), "1677-1881": (-103, 101)}.items():
        jobs[(span, "all")] = (N.ORDER, a, b, 5.0)
        jobs[(span, "none")] = (["10", "199"], a, b, 5.0)
        for p in planets:
            jobs[(span, N.NAMES[p])] = (["10", "199", p], a, b, 5.0)
    with ProcessPoolExecutor(max_workers=6) as ex:
        res = dict(zip(jobs, ex.map(run, jobs.values())))
    out = {}
    for (span, name), v in res.items():
        out.setdefault(span, {})[name] = round(v, 3)
    for span in out:
        out[span]["sum_of_single_planet_runs"] = round(sum(out[span][N.NAMES[p]] for p in planets), 3)
    out["frame"] = "J2000 ecliptic, inertial (no precession of the equinoxes); arcsec per Julian century"
    out["wall_s"] = round(time.time() - t0, 1)
    json.dump(out, open(OUT / "planet_budget.json", "w"), indent=1)
    print(json.dumps(out, indent=1))
