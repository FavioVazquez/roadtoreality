#!/usr/bin/env python
"""Write the prior used by run_premerger.py for each event to priors/<event>.prior (bilby prior-file format)."""
import os

from run_premerger import EVENTS, ROOT, make_priors

for event, ev in EVENTS.items():
    out = os.path.join(ROOT, "priors", f"{event}.prior")
    make_priors(ev["trigger_time"]).to_file(outdir=os.path.dirname(out), label=event)
    print(out)
