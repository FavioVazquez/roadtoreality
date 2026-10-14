#!/usr/bin/env python
"""Task 3(a) check: does Isi & Farr's published config (Zenodo 7597043 figure2/gw150914/config-ds8.ini, written for
ringdown git 49f2dc4e, PyMC era) load under ringdown 1.1.0 unchanged? No sampling. Tries:
 (1) rd.Fit.from_config(<ini verbatim>)   (2) the same with [target] t0 = [pipe] t0-ref added (the pipe normally supplies t0)
 (3) ringdown 1.1.0 ringdown_pipe argument parsing only (--help), to record that the pipe entry point exists.
Prints every exception and logged warning, and the resulting model/condition/ACF settings."""
import sys, os, logging, traceback, configparser, shutil, subprocess
logging.basicConfig(level=logging.INFO, format="LOG %(levelname)s %(name)s: %(message)s")
import ringdown as rd
ini = sys.argv[1]
print("ringdown", rd.__version__)
def attempt(path, tag):
    print(f"==== {tag}: Fit.from_config({path})", flush=True)
    try:
        fit = rd.Fit.from_config(path)
        print("OK: modes", getattr(fit, "modes", None))
        print("model_settings:", fit.model_settings)
        print("info:", {k: v for k, v in fit.info.items()})
        print("target:", fit.target if fit.has_target else None)
        try:
            print("start_times:", fit.start_times, "n_analyze:", fit.n_analyze)
        except Exception as e:
            print("start_times failed:", repr(e))
        try:
            fit._make_model(False)
            print("model build (Fit._make_model): ok")
        except Exception as e:
            print("model build FAILED:", repr(e))
    except Exception as e:
        print("FAILED:", repr(e)); traceback.print_exc(limit=6, file=sys.stdout)
attempt(ini, "verbatim")
cp = configparser.ConfigParser(); cp.read(ini)
cp["target"]["t0"] = cp["pipe"]["t0-ref"]
p2 = "their_ini_with_t0.ini"; cp.write(open(p2, "w"))
attempt(p2, "with [target] t0 = t0-ref")
print("==== ringdown_pipe --help"); r = subprocess.run(["ringdown_pipe", "--help"], capture_output=True, text=True)
print(r.returncode, r.stdout[:1500], r.stderr[:500])
