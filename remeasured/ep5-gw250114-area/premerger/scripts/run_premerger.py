#!/usr/bin/env python
"""Pre-merger (inspiral-only) bilby + dynesty run on GWOSC open strain.

The likelihood only uses frequencies between --fmin and --fmax (the inspiral cutoff),
and the waveform is generated only up to --fmax, as in the LVK IMR consistency test.
"""
import argparse
import json
import os
import platform
import sys
import time

import numpy as np
import bilby
from gwpy.timeseries import TimeSeries

HERE = os.path.dirname(os.path.abspath(__file__))
ROOT = os.path.dirname(HERE)

EVENTS = {
    "GW150914": dict(
        trigger_time=1126259462.4,
        files={"H1": "H-H1_GWOSC_4KHZ_R1-1126257415-4096.hdf5",
               "L1": "L-L1_GWOSC_4KHZ_R1-1126257415-4096.hdf5"},
    ),
    "GW250114_082203": dict(
        trigger_time=1420878141.2,
        files={"H1": "H-H1_GWOSC_O4b_4KHZ_R1-1420877824-4096.hdf5",
               "L1": "L-L1_GWOSC_O4b_4KHZ_R1-1420877824-4096.hdf5"},
    ),
}


def parse():
    p = argparse.ArgumentParser()
    p.add_argument("--event", required=True, choices=list(EVENTS))
    p.add_argument("--fmax", type=float, required=True, help="inspiral cutoff frequency [Hz]")
    p.add_argument("--fmin", type=float, default=20.0)
    p.add_argument("--duration", type=float, default=8.0)
    p.add_argument("--post-trigger", type=float, default=2.0)
    p.add_argument("--psd-duration", type=float, default=256.0)
    p.add_argument("--sampling-frequency", type=float, default=1024.0,
                   help="resample the 4 kHz strain to this rate (Nyquist must exceed --fmax)")
    p.add_argument("--approximant", default="IMRPhenomXPHM")
    p.add_argument("--fref", type=float, default=20.0)
    p.add_argument("--likelihood", choices=["full", "relbin"], default="full")
    p.add_argument("--nlive", type=int, default=1000)
    p.add_argument("--naccept", type=int, default=60)
    p.add_argument("--dlogz", type=float, default=0.1)
    p.add_argument("--npool", type=int, default=os.cpu_count())
    p.add_argument("--label", default=None)
    p.add_argument("--outdir", default=None)
    p.add_argument("--seed", type=int, default=150914)
    p.add_argument("--fiducial-from", default=None,
                   help="relbin: bilby result file whose max-likelihood sample is the fiducial point "
                        "(e.g. a short full-likelihood run on the same data); fiducial is then not re-optimised")
    p.add_argument("--benchmark", type=int, default=0,
                   help="only time N likelihood calls from the prior and exit")
    return p.parse_args()


def load_ifos(args):
    ev = EVENTS[args.event]
    t0 = ev["trigger_time"]
    start = t0 + args.post_trigger - args.duration
    end = start + args.duration
    psd_end = start
    psd_start = psd_end - args.psd_duration
    ifos = bilby.gw.detector.InterferometerList([])
    for name, fname in ev["files"].items():
        full = TimeSeries.read(os.path.join(ROOT, "data", fname), format="hdf5.gwosc")
        full = full.crop(psd_start - 16, end + 16)
        if args.sampling_frequency < full.sample_rate.value:
            full = full.resample(args.sampling_frequency)
        seg = full.crop(start, end)
        psd_data = full.crop(psd_start, psd_end)
        if not (np.all(np.isfinite(seg.value)) and np.all(np.isfinite(psd_data.value))):
            raise RuntimeError(f"{name}: NaN in analysis or PSD segment")
        ifo = bilby.gw.detector.get_empty_interferometer(name)
        ifo.strain_data.set_from_gwpy_timeseries(seg)
        alpha = 2 * 0.2 / args.duration  # 0.2 s Tukey roll-off, matching set_from_gwpy defaults
        psd = psd_data.psd(fftlength=args.duration, overlap=0, window=("tukey", alpha), method="median")
        ifo.power_spectral_density = bilby.gw.detector.PowerSpectralDensity(
            frequency_array=psd.frequencies.value, psd_array=psd.value)
        ifo.minimum_frequency = args.fmin
        ifo.maximum_frequency = args.fmax
        ifos.append(ifo)
    return ifos, t0


def make_priors(t0):
    pr = bilby.gw.prior.BBHPriorDict()
    for k in ["mass_1", "mass_2", "chirp_mass", "mass_ratio", "luminosity_distance"]:
        pr.pop(k, None)
    # Detector-frame chirp mass and mass ratio, uniform in component masses.
    pr["chirp_mass"] = bilby.gw.prior.UniformInComponentsChirpMass(10, 100, name="chirp_mass")
    pr["mass_ratio"] = bilby.gw.prior.UniformInComponentsMassRatio(0.125, 1, name="mass_ratio")
    pr["mass_1"] = bilby.core.prior.Constraint(1, 1000, name="mass_1")
    pr["mass_2"] = bilby.core.prior.Constraint(1, 1000, name="mass_2")
    pr["luminosity_distance"] = bilby.gw.prior.UniformSourceFrame(
        50, 3000, cosmology="Planck15", name="luminosity_distance", unit="Mpc")
    pr["geocent_time"] = bilby.core.prior.Uniform(t0 - 0.1, t0 + 0.1, name="geocent_time")
    # a_1, a_2 U(0, 0.99); isotropic tilts; phi_12, phi_jl, theta_jn, psi, phase, ra, dec: bilby defaults
    return pr


def main():
    args = parse()
    label = args.label or f"{args.event}_{args.approximant}_fmax{args.fmax:g}_{args.likelihood}_nlive{args.nlive}"
    outdir = args.outdir or os.path.join(ROOT, "out", label)
    os.makedirs(outdir, exist_ok=True)
    bilby.core.utils.setup_logger(outdir=outdir, label=label)
    np.random.seed(args.seed)

    ifos, t0 = load_ifos(args)
    ifos.plot_data(outdir=outdir, label=label)
    priors = make_priors(t0)

    wf_args = dict(waveform_approximant=args.approximant, reference_frequency=args.fref,
                   minimum_frequency=args.fmin, maximum_frequency=args.fmax)
    common = dict(duration=args.duration, sampling_frequency=ifos[0].sampling_frequency,
                  parameter_conversion=bilby.gw.conversion.convert_to_lal_binary_black_hole_parameters,
                  waveform_arguments=wf_args, start_time=ifos.start_time)
    if args.likelihood == "relbin":
        wfg = bilby.gw.WaveformGenerator(
            frequency_domain_source_model=bilby.gw.source.lal_binary_black_hole_relative_binning, **common)
        fid_file = os.path.join(outdir, "fiducial_seed.json")
        if args.fiducial_from:
            if args.fiducial_from.endswith("fiducial.json"):
                best = json.load(open(args.fiducial_from))
            else:
                seed_res = bilby.core.result.read_in_result(args.fiducial_from)
                best = seed_res.posterior.iloc[seed_res.posterior["log_likelihood"].idxmax()]
            fid = {k: float(best[k]) for k in priors.non_fixed_keys if k in best}
            fid["luminosity_distance"] = float(best["luminosity_distance"])
        else:
            fid = priors.sample()
            fid["luminosity_distance"] = 400.0
        likelihood = bilby.gw.likelihood.RelativeBinningGravitationalWaveTransient(
            interferometers=ifos, waveform_generator=wfg, priors=priors,
            fiducial_parameters=fid, update_fiducial_parameters=not args.fiducial_from,
            distance_marginalization=True, epsilon=0.025)
        with open(fid_file, "w") as f:
            json.dump({k: float(v) for k, v in likelihood.fiducial_parameters.items()}, f, indent=1)
    else:
        wfg = bilby.gw.WaveformGenerator(
            frequency_domain_source_model=bilby.gw.source.lal_binary_black_hole, **common)
        likelihood = bilby.gw.likelihood.GravitationalWaveTransient(
            interferometers=ifos, waveform_generator=wfg, priors=priors,
            distance_marginalization=True)

    if args.benchmark:
        samples = [priors.sample() for _ in range(args.benchmark)]
        tic = time.perf_counter()
        for s in samples:
            likelihood.parameters.update(s)
            likelihood.log_likelihood_ratio()
        dt = (time.perf_counter() - tic) / args.benchmark
        print(json.dumps(dict(likelihood=args.likelihood, approximant=args.approximant,
                              seconds_per_call=dt)))
        return

    meta = dict(event=args.event, argv=sys.argv, args=vars(args), cores=os.cpu_count(),
                host=platform.node(), python=platform.python_version(), bilby=bilby.__version__)
    tic = time.time()
    result = bilby.run_sampler(
        likelihood=likelihood, priors=priors, sampler="dynesty", nlive=args.nlive,
        sample="acceptance-walk", naccept=args.naccept, dlogz=args.dlogz, npool=args.npool,
        outdir=outdir, label=label, seed=args.seed, check_point_delta_t=1800,
        conversion_function=bilby.gw.conversion.generate_all_bbh_parameters,
        result_class=bilby.gw.result.CBCResult)
    meta["wall_seconds"] = time.time() - tic
    meta["sampling_time_seconds"] = float(result.sampling_time.total_seconds()) \
        if hasattr(result.sampling_time, "total_seconds") else float(result.sampling_time)
    meta["log_evidence"] = result.log_evidence
    meta["log_bayes_factor"] = result.log_bayes_factor
    meta["n_samples"] = len(result.posterior)
    meta["num_likelihood_evaluations"] = int(getattr(result, "num_likelihood_evaluations", 0) or 0)
    with open(os.path.join(outdir, "run_meta.json"), "w") as f:
        json.dump(meta, f, indent=1, default=str)
    print(json.dumps(meta, indent=1, default=str))


if __name__ == "__main__":
    main()
