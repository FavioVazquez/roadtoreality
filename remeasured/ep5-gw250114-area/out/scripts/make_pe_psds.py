#!/usr/bin/env python
"""Extract the PE PSDs stored in posterior_samples_NRSur7dq4.h5 (group bilby-NRSur7dq4_prod-reweighted/psds; 0-2048 Hz,
df = 0.125 Hz; values below 20 Hz are a 0.25 filler) and write two-column text files for ringdown_fit.py.
The PSD is truncated at 1024 Hz (Nyquist of the 2048 Hz conditioned data) or 2048 Hz (for 4096 Hz runs).
Below f_low = 20 Hz the filler is replaced by  scale * PSD(20 Hz):  scale = 1 ('flat', primary), 100 ('x100', variant).
Outputs: results/psd/GW250114_<ifo>_PE_psd_<fmax>Hz_<variant>.txt"""
import os, h5py, numpy as np
OUT = os.path.abspath(os.path.join(os.path.dirname(os.path.abspath(__file__)), ".."))
SRC = os.path.join(OUT, "..", "data", "zenodo_16877102", "posterior_samples_NRSur7dq4.h5")
os.makedirs(os.path.join(OUT, "results", "psd"), exist_ok=True)
with h5py.File(SRC) as f:
    for ifo in ("H1", "L1"):
        a = f["bilby-NRSur7dq4_prod-reweighted/psds"][ifo][()]
        fr, p = a[:, 0], a[:, 1].copy()
        # stored frequencies are rounded to ~6 significant digits; restore the exact uniform grid
        f_exact = np.arange(len(fr)) * 0.125
        assert np.max(np.abs(fr - f_exact)) < 0.01, np.max(np.abs(fr - f_exact)); fr = f_exact
        p20 = p[np.searchsorted(fr, 20.0)]
        for fmax in (1024.0,):
            for tag, scale in (("flat", 1.0), ("x100", 100.0)):
                q = p.copy(); q[fr < 20.0] = scale * p20
                if fmax > fr[-1]:   # extend last bin to exactly fmax (PE grid stops at 2047.875 Hz)
                    fq, qq = np.append(fr, fmax), np.append(q, q[-1])
                else:
                    k = fr <= fmax; fq, qq = fr[k], q[k]
                np.savetxt(os.path.join(OUT, "results", "psd", f"GW250114_{ifo}_PE_psd_{int(fmax)}Hz_{tag}.txt"), np.c_[fq, qq],
                           header=f"from {os.path.basename(SRC)} psds/{ifo}; f<20 Hz -> {scale} x PSD(20 Hz)={p20:.6e}; columns f[Hz] PSD[1/Hz]")
        print(ifo, "PSD(20Hz)", p20, "PSD(245Hz)", p[np.searchsorted(fr, 245.0)])
