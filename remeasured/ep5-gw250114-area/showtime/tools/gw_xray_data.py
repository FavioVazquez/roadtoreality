"""GW150914 chirp X-ray: events, sound and drawing data from the whitened, band-passed H1 strain.

Input: the Claude Science export (gw150914_whitened_strain_4096Hz.csv, column H1_whitened_bp35_350; 4096 Hz, 32 s).
Output (into the showtime project folder given as argv[2]):
  xray.json       showtime.xray/1: one event per wave cycle = each positive peak of the strain that stands out of
                  the noise (prominence >= 5 sigma of the first 10 s), in film time (data slowed SLOW times)
  media/chirp.wav the sound: the same strain, slowed SLOW times, carried on a CARRIER Hz tone
                  (y = h(t / SLOW) * sin(2 pi CARRIER t)): its spectrum shifted up by CARRIER Hz, point for point
                  in time with the picture
  gwdata.js       the trace for the left panel and the drawing model for the inside (orbit phase from the peaks)
  gwdata.json     the same numbers, plus the derivation, for the record

Data time 0 = the sample of largest |h| (15.4260 s into the file). Cited, not measured (GWTC-1, arXiv:1811.12907):
m1 = 35.6, m2 = 30.6, M_f = 63.1 solar masses (source frame), chi_f = 0.69, z = 0.09.
"""
import hashlib
import json
import sys
from pathlib import Path

import numpy as np
from scipy.interpolate import CubicSpline, PchipInterpolator
from scipy.optimize import curve_fit
from scipy.signal import find_peaks
import soundfile as sf

SR = 4096
SLOW = 100.0               # film seconds per data second
CARRIER = 400.0            # Hz (GWOSC's own audio shifts by +400 Hz)
FPS = 30
W0, W1 = -0.140, 0.035     # the data window shown and heard, seconds from the largest |h|
PROM_SIGMA = 5.0
SEARCH = (-0.15, 0.04)     # where peaks are looked for
OUT_SR = 48000

# cited (GWTC-1)
M1, M2, MF, CHIF, Z = 35.6, 30.6, 63.1, 0.69, 0.09
TSUN = 4.925490947e-6      # G M_sun / c^3, seconds


def main(csv_path: str, project: str) -> None:
    csv_path, proj = Path(csv_path), Path(project)
    d = np.loadtxt(csv_path, delimiter=",", skiprows=1)
    h = d[:, 3]                                   # H1_whitened_bp35_350
    sigma = float(h[: 10 * SR].std())             # off-source noise: the first 10 s
    i0 = int(np.argmax(np.abs(h)))
    t = (np.arange(len(h)) - i0) / SR             # data time, s from the largest |h|
    spl = CubicSpline(t, h)

    # ---- events: positive peaks with prominence >= 5 sigma in the search window, refined by a parabola
    m = (t >= SEARCH[0]) & (t <= SEARCH[1])
    idx = np.where(m)[0]
    pk, pr = find_peaks(h[idx], prominence=0)
    ev = []
    for k, prom in zip(pk, pr["prominences"]):
        if prom / sigma < PROM_SIGMA:
            continue
        j = idx[k]
        y0, y1, y2 = h[j - 1], h[j], h[j + 1]
        dx = 0.5 * (y0 - y2) / (y0 - 2 * y1 + y2)
        ev.append({"t_data": float(t[j] + dx / SR), "h_sigma": float(spl(t[j] + dx / SR) / sigma),
                   "prom_sigma": float(prom / sigma)})
    td = np.array([e["t_data"] for e in ev])
    hmax = int(np.argmax([e["h_sigma"] for e in ev]))   # the largest cycle = the merger
    kinds = {}
    for i in range(len(ev)):
        if i == hmax:
            kinds[str(i)] = "merger"
        elif i > hmax:
            kinds[str(i)] = "ringdown"

    # ---- frequency between peaks (measured) and the Newtonian chirp f = A (tc - t)^(-3/8) through the inspiral ones
    mids = 0.5 * (td[1:] + td[:-1])
    fgap = 1.0 / np.diff(td)
    insp = slice(0, hmax)                         # gaps that end at or before the merger peak
    fn = lambda tt, A, tc: A * np.clip(tc - tt, 1e-4, None) ** (-0.375)
    (A, tc), _ = curve_fit(fn, mids[insp], fgap[insp], p0=(10.0, 0.0), maxfev=20000)

    # ---- the orbit: GW phase = 2 pi per cycle at the measured peaks; before the first, the fitted chirp backwards;
    # orbit phase = GW phase / 2 (one wave cycle = half an orbit)
    tb = np.linspace(W0 - 0.01, td[0], 400)
    fb = fn(tb, A, tc)
    phb = -np.flip(np.cumsum(np.flip(np.r_[np.diff(tb) * 0.5 * (fb[1:] + fb[:-1]), 0.0]))) * 2 * np.pi
    knots_t = list(tb[:-1:20]) + list(td[: hmax + 1])
    knots_p = list(phb[:-1:20]) + [2 * np.pi * k for k in range(hmax + 1)]
    phase = PchipInterpolator(knots_t, knots_p)
    # after the merger: the remnant's bulge turns half a turn per wave cycle, through the ringdown peaks
    rt = list(td[hmax:])
    rp = [2 * np.pi * k for k in range(len(rt))]
    fr_last = 1.0 / (rt[-1] - rt[-2]) if len(rt) > 1 else 250.0
    rt.append(W1 + 0.02); rp.append(rp[-1] + 2 * np.pi * fr_last * (W1 + 0.02 - rt[-2]))
    rphase = PchipInterpolator(rt, rp)

    # separation from Kepler's law (Newtonian) with the fitted frequency, detector-frame total mass, in units of M
    Mdet = (M1 + M2) * (1 + Z)
    def sep(f):
        return (np.pi * Mdet * TSUN * f) ** (-2.0 / 3.0)

    # ---- film sampling for the page (one value per film frame of the clip)
    nfr = int(round((W1 - W0) * SLOW * FPS))
    ft = np.arange(nfr + 1) / FPS
    tdat = W0 + ft / SLOW
    orb = np.where(tdat <= td[hmax], phase(np.minimum(tdat, td[hmax])) / 2.0, np.nan)
    ring = np.where(tdat >= td[hmax], rphase(np.maximum(tdat, td[hmax])) / 2.0, np.nan)
    fsm = fn(np.minimum(tdat, td[hmax - 1]), A, tc)
    r = sep(fsm)
    # the plunge: from the last inspiral peak to the merger peak the spacing closes to contact (drawn, not measured)
    rh1, rh2 = 2 * M1 / (M1 + M2), 2 * M2 / (M1 + M2)      # horizon radii (non-spinning), units of M
    t4, t5 = td[hmax - 1], td[hmax]
    r4 = float(sep(fn(t4, A, tc)))
    plunge = (tdat > t4) & (tdat <= t5)
    u = (tdat[plunge] - t4) / (t5 - t4)
    r[plunge] = r4 + (0.92 * (rh1 + rh2) - r4) * u ** 2
    r[tdat > t5] = np.nan

    # ---- trace for the left panel: the window, every data sample
    tm = (t >= W0 - 0.002) & (t <= W1 + 0.002)
    trace_t = t[tm]
    trace_h = h[tm] / sigma

    # ---- the sound: y(t_film) = h(t_film / SLOW) * sin(2 pi CARRIER t_film)
    n = int(round((W1 - W0) * SLOW * OUT_SR))
    tf = np.arange(n) / OUT_SR
    hs = spl(W0 + tf / SLOW) / sigma
    y = hs * np.sin(2 * np.pi * CARRIER * tf)
    fade = int(0.25 * OUT_SR)
    y[:fade] *= np.linspace(0, 1, fade); y[-fade:] *= np.linspace(1, 0, fade)
    y = 0.89 * y / np.abs(y).max()
    (proj / "media").mkdir(parents=True, exist_ok=True)
    sf.write(proj / "media" / "chirp.wav", y.astype(np.float32), OUT_SR, subtype="PCM_24")

    # ---- the same data at real speed for the end card, GWOSC-style: shifted up CARRIER Hz (single sideband),
    # -0.25..+0.05 s, so the 100x slow motion can be compared with the real 0.3 s
    from scipy.signal import hilbert, resample_poly
    rm = (t >= -0.30) & (t <= 0.10)
    xr = resample_poly(h[rm] / sigma, 375, 32)          # 4096 -> 48000 Hz
    tr = np.arange(len(xr)) / OUT_SR
    yr = np.real(hilbert(xr) * np.exp(2j * np.pi * CARRIER * tr))
    keep = (tr >= 0.05) & (tr <= 0.35)                  # -0.25..+0.05 s around the largest |h|
    yr = yr[keep]
    tp = int(0.03 * OUT_SR)
    yr[:tp] *= np.linspace(0, 1, tp); yr[-tp:] *= np.linspace(1, 0, tp)
    yr = 0.7 * yr / np.abs(yr).max()
    sf.write(proj / "media" / "realtime.wav", yr.astype(np.float32), OUT_SR, subtype="PCM_24")

    # ---- xray.json (film time = (t_data - W0) * SLOW; frame = floor(t * fps), as showtime's frame_of)
    events = []
    for i, e in enumerate(ev):
        tfilm = (e["t_data"] - W0) * SLOW
        events.append({"i": i, "t": round(tfilm, 4), "frame": int(np.floor(tfilm * FPS + 1e-9)),
                       "strength": round(min(1.0, e["h_sigma"] / max(x["h_sigma"] for x in ev)), 3), "band": "low",
                       "t_data_ms": round(e["t_data"] * 1000, 2), "h_sigma": round(e["h_sigma"], 2),
                       "prominence_sigma": round(e["prom_sigma"], 2)})
    sha = hashlib.sha256((proj / "media" / "clip.webm").read_bytes()).hexdigest() if (proj / "media" / "clip.webm").is_file() else None
    doc = {"schema": "showtime.xray/1",
           "source": {"file": "clip.webm", "sha256": sha, "fps": FPS, "duration": round((W1 - W0) * SLOW, 3),
                      "width": 430, "height": 280},
           "detector": {"engine": "data", "min_gap": None, "sensitivity": None, "from": 0.0, "to": None,
                        "note": ("written from the data stream, not from the sound: positive peaks of the whitened, "
                                 "band-passed (35-350 Hz) LIGO Hanford strain with prominence >= %g sigma of the first "
                                 "10 s, %g..%g s around the largest |h|; film time = (t_data - (%g s)) x %g"
                                 % (PROM_SIGMA, SEARCH[0], SEARCH[1], W0, SLOW))},
           "events": events, "dropped": [], "track": None}
    (proj / "xray.json").write_text(json.dumps(doc, indent=1))

    model = {"slow": SLOW, "carrier": CARRIER, "fps": FPS, "w0": W0, "w1": W1, "sigma": sigma,
             "trace": {"t0": float(trace_t[0]), "dt": 1.0 / SR, "h": [round(float(v), 3) for v in trace_h]},
             "frames": {"orbit": [None if np.isnan(v) else round(float(v), 4) for v in orb],
                        "ring": [None if np.isnan(v) else round(float(v), 4) for v in ring],
                        "sep": [None if np.isnan(v) else round(float(v), 4) for v in r],
                        "f_fit": [round(float(v), 2) for v in fsm]},
             "events_data_ms": [round(x * 1000, 2) for x in td], "event_frames": [e["frame"] for e in events], "kinds": kinds,
             "gap_hz": [round(float(x), 1) for x in fgap], "chirp_fit": {"A": float(A), "tc": float(tc)},
             "cited": {"m1": M1, "m2": M2, "mf": MF, "chif": CHIF, "z": Z, "source": "GWTC-1, arXiv:1811.12907"},
             "rh": [rh1, rh2], "rf": MF / (M1 + M2) * (1 + np.sqrt(1 - CHIF ** 2))}
    (proj / "gwdata.js").write_text("window.GW = " + json.dumps(model) + ";\n")
    rec = dict(model); rec.pop("trace"); rec.pop("frames")
    rec.update({"input": csv_path.name, "input_sha256": hashlib.sha256(csv_path.read_bytes()).hexdigest(),
                "sigma": sigma, "i_max_abs_h": i0, "t_max_abs_h_in_file_s": i0 / SR, "events": events})
    (proj / "gwdata.json").write_text(json.dumps(rec, indent=1))
    print("sigma %.4f; largest |h| at %.6f s in the file" % (sigma, i0 / SR))
    for e in events:
        print("  event %d  data %+7.2f ms  film %6.3f s  frame %4d  h %.2f sigma  prom %.2f" % (
            e["i"], e["t_data_ms"], e["t"], e["frame"], e["h_sigma"], e["prominence_sigma"]))
    print("gaps Hz", [round(float(x), 1) for x in fgap], "fit A=%.2f tc=%.4f" % (A, tc), "kinds", kinds)
    print("sep at window start %.2f M, at last inspiral peak %.2f M" % (r[0], r4))


if __name__ == "__main__":
    main(sys.argv[1], sys.argv[2])
