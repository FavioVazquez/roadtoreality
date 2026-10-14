#!/usr/bin/env python
"""Max-likelihood point found so far in a dynesty resume pickle -> JSON of physical parameters
(rescaled with the run's own priors from run_premerger.make_priors). Used only to seed the relative-
binning fiducial waveform; not a result.  usage: fiducial_from_checkpoint.py EVENT resume.pickle out_fiducial.json"""
import json
import os
import sys

import bilby
import dill
import numpy as np

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from run_premerger import EVENTS, make_priors  # noqa: E402

event, pickle_file, out = sys.argv[1:4]
with open(pickle_file, "rb") as f:
    sampler = dill.load(f)
if isinstance(sampler, tuple):  # dynesty 3 checkpoint: (sampler, ...)
    sampler = sampler[0]
saved = getattr(sampler.saved_run, "D", sampler.saved_run)
logl = np.asarray(saved["logl"])
v = np.asarray(saved["v"])[np.argmax(logl)]  # dynesty "v": prior-transformed (physical) point
priors = make_priors(EVENTS[event]["trigger_time"])
keys = [k for k in priors.non_fixed_keys
        if not isinstance(priors[k], bilby.core.prior.Constraint) and k != "luminosity_distance"]
assert len(keys) == len(v), (keys, len(v))
phys = {k: float(x) for k, x in zip(keys, v)}
phys["luminosity_distance"] = 400.0  # distance is marginalised; relbin fiducial needs a value
json.dump(phys, open(out, "w"), indent=1)
print("max log-likelihood ratio so far %.2f" % logl.max(), json.dumps(phys))
