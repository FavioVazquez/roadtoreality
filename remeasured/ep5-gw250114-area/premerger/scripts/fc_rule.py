#!/usr/bin/env python
"""Inspiral cutoff f_c by the LVK IMR-consistency rule (GWTC-1 TGR, PRD 100 104036 (2019), Sec. V B;
GW250114 TGR companion, arXiv:2509.08099): GW frequency of the (2,2) mode at the ISCO of the Kerr
remnant whose mass and spin follow from NR fits applied to the MEDIAN redshifted component masses,
spin magnitudes and spin angles of the full-IMR posterior.

Only f_c is written. The intermediate remnant mass/spin are not printed or saved (lane rule).
Inputs are cited LVK posterior releases (fetched by fetch_reference.sh), not our measurements.
"""
import json
import os
import sys

import h5py
import numpy as np
from lalinference.imrtgr import nrutils

HERE = os.path.dirname(os.path.abspath(__file__))
ROOT = os.path.dirname(HERE)
TSUN = 4.925490947641267e-06  # G Msun / c^3 [s]
FITS_MF = ["UIB2016", "HL2016"]
FITS_AF = ["UIB2016", "HBR2016", "HL2016"]


def fc_from_medians(m1, m2, a1, a2, tilt1, tilt2, phi12):
    mf = nrutils.bbh_average_fits_precessing(m1, m2, a1, a2, tilt1, tilt2, phi12, "Mf", FITS_MF)
    af = nrutils.bbh_average_fits_precessing(m1, m2, a1, a2, tilt1, tilt2, phi12, "af", FITS_AF)
    mf, af = float(np.squeeze(mf)), float(np.squeeze(af))
    r = float(np.squeeze(nrutils.calc_isco_radius(af)))
    omega = 1.0 / (r**1.5 + af)          # orbital angular frequency at ISCO, units of 1/(G Mf / c^3)
    return omega / (np.pi * mf * TSUN)   # f_GW(2,2) = Omega / pi


def gwtc1(path):
    p = h5py.File(path, "r")["Overall_posterior"][()]
    med = dict(m1=np.median(p["m1_detector_frame_Msun"]), m2=np.median(p["m2_detector_frame_Msun"]),
               a1=np.median(p["spin1"]), a2=np.median(p["spin2"]),
               tilt1=np.median(np.arccos(p["costilt1"])), tilt2=np.median(np.arccos(p["costilt2"])),
               phi12=0.0)  # phi_12 is not in the GWTC-1 release; 0 used (assumption)
    return med


def pesummary(path, label):
    p = h5py.File(path, "r")[label]["posterior_samples"][()]
    return dict(m1=np.median(p["mass_1"]), m2=np.median(p["mass_2"]), a1=np.median(p["a_1"]),
                a2=np.median(p["a_2"]), tilt1=np.median(p["tilt_1"]), tilt2=np.median(p["tilt_2"]),
                phi12=np.median(p["phi_12"]))


def main():
    ref = os.path.join(ROOT, "data", "reference")
    out = {}
    med = gwtc1(os.path.join(ref, "GW150914_GWTC-1.hdf5"))
    out["GW150914"] = dict(source="GWTC-1 Overall_posterior (LIGO-P1800370)", medians=med,
                           f_c_Hz=fc_from_medians(**med), published_f_c_Hz=132)
    med = pesummary(os.path.join(ref, "GW250114_posterior_samples_PhenomXPHM.h5"),
                    "bilby-IMRPhenomXPHM-SpinTaylor_prod-reweighted")
    out["GW250114_082203"] = dict(source="LVK GW250114 PhenomXPHM release (Zenodo 16877102)", medians=med,
                                  f_c_Hz=fc_from_medians(**med))
    for v in out.values():
        v["medians"] = {k: float(x) for k, x in v["medians"].items()}
    json.dump(out, open(os.path.join(ROOT, "results", "fc_rule.json"), "w"), indent=1)
    for k, v in out.items():
        print(k, "f_c = %.1f Hz" % v["f_c_Hz"], "(published %s)" % v.get("published_f_c_Hz", "n/a"))


if __name__ == "__main__":
    sys.exit(main())
