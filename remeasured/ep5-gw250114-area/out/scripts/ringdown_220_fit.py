#!/usr/bin/env python
"""Single-mode (l=m=2, n=0) Kerr ringdown fit with `ringdown` (Isi & Farr; JAX/NumPyro).
Usage: ringdown_220_fit.py <label> <config.json>
Config keys: H1, L1 (GWOSC hdf5 paths), t0_geocenter (GPS s), ra, dec, psi (rad), duration (s),
             ds (decimation), f_min (Hz), slice (s each side), m_min, m_max (Msun, detector frame),
             a_scale_max, num_warmup, num_samples, num_chains, seed, provenance (free-text citations).
Writes: <label>_posterior.npz (m, chi, f220, g220), <label>_summary.json, <label>_result.nc
"""
import os, sys, json, time, hashlib, platform
os.environ.setdefault("XLA_FLAGS", "--xla_force_host_platform_device_count=8")
import numpyro; numpyro.set_host_device_count(8)
import jax; jax.config.update("jax_enable_x64", True)
import numpy as np, ringdown as rd, arviz as az

label, cfgp = sys.argv[1], sys.argv[2]
cfg = json.load(open(cfgp)); t_start = time.time()
def sha256(p):
    h = hashlib.sha256()
    with open(p, "rb") as f:
        for ch in iter(lambda: f.read(1 << 20), b""): h.update(ch)
    return h.hexdigest()
inputs = {ifo: {"file": cfg[ifo], "sha256": sha256(cfg[ifo])} for ifo in ("H1", "L1")}
print(label, json.dumps(inputs), flush=True)

fit = rd.Fit(modes=[(1, -2, 2, 2, 0)])          # (prograde, s=-2, l=2, m=2, n=0): fundamental 220 only
fit.load_data({ifo: cfg[ifo] for ifo in ("H1", "L1")}, kind="gwosc")
fit.set_target(cfg["t0_geocenter"], ra=cfg["ra"], dec=cfg["dec"], psi=cfg["psi"], duration=cfg["duration"])
fit.condition_data(ds=cfg["ds"], f_min=cfg["f_min"], slice_left=cfg["slice"], slice_right=cfg["slice"])
fit.compute_acfs()
fit.update_model(m_min=cfg["m_min"], m_max=cfg["m_max"], a_scale_max=cfg["a_scale_max"])
print("valid model settings:", fit.valid_model_settings, flush=True)
print("model settings:", fit.model_settings, flush=True)
print("target:", fit.target, flush=True)
print("start times per ifo:", {i: float(t) for i, t in fit.start_times.items()}, flush=True)
print("n_analyze:", fit.n_analyze, "fsamp:", 1/ (fit.data["H1"].index[1]-fit.data["H1"].index[0]), flush=True)

fit.run(num_warmup=cfg["num_warmup"], num_samples=cfg["num_samples"], num_chains=cfg["num_chains"],
        prng=cfg["seed"], min_ess=cfg.get("min_ess"))
res = fit.result
post = res.posterior
summ = az.summary(res, var_names=["m", "chi"], kind="all")
print(summ.to_string(), flush=True)
m = np.asarray(post["m"]).ravel(); chi = np.asarray(post["chi"]).ravel()
out = {"m": m, "chi": chi}
for k in ("f", "g"):
    if k in post: out[k + "220"] = np.asarray(post[k]).reshape(len(m), -1)[:, 0]
np.savez_compressed(f"{label}_posterior.npz", **out)
try:
    res.to_netcdf(f"{label}_result.nc")
except Exception as e:
    print("netcdf save failed:", repr(e), flush=True)
q = lambda x: [float(np.quantile(x, p)) for p in (0.05, 0.5, 0.95)]
summary = dict(label=label, config=cfg, inputs=inputs, n_samples=int(len(m)),
               m_det_Msun_q05_q50_q95=q(m), chi_q05_q50_q95=q(chi),
               rhat_m=float(summ.loc["m", "r_hat"]), rhat_chi=float(summ.loc["chi", "r_hat"]),
               ess_bulk_m=float(summ.loc["m", "ess_bulk"]), ess_bulk_chi=float(summ.loc["chi", "ess_bulk"]),
               start_times={i: float(t) for i, t in fit.start_times.items()},
               versions=dict(ringdown=rd.__version__, jax=jax.__version__, numpyro=numpyro.__version__, arviz=az.__version__, numpy=np.__version__),
               platform=platform.platform(), wall_s=time.time() - t_start, script_sha256=sha256(__file__))
json.dump(summary, open(f"{label}_summary.json", "w"), indent=1)
print("DONE", label, json.dumps({k: summary[k] for k in ("m_det_Msun_q05_q50_q95", "chi_q05_q50_q95", "rhat_m", "ess_bulk_m", "wall_s")}), flush=True)
