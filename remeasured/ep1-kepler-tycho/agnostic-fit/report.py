"""Writes MODEL.json, the held-out residual figure and a residual table (called from fit.py)."""
import numpy as np, json, os, csv
import matplotlib
matplotlib.use('Agg')
import matplotlib.pyplot as plt
import fit

HERE = fit.HERE
DEG = 180 / np.pi


def wrap(a):
    return a % 360.0


def derived_kep(p):
    nE, LE, kE, hE, nP, LP, kP, hP, aP, i, Om = p
    PE, PP = 2 * np.pi / nE, 2 * np.pi / nP
    return {'P_E_days': PE, 'P_P_days': PP, 'e_E': np.hypot(kE, hE), 'e_P': np.hypot(kP, hP),
            'perihelion_lon_E_deg': wrap(np.arctan2(hE, kE) * DEG), 'perihelion_lon_P_deg': wrap(np.arctan2(hP, kP) * DEG),
            'mean_lon_E_at_T0_deg': wrap(LE * DEG), 'mean_lon_P_at_T0_deg': wrap(LP * DEG),
            'a_P_over_a_E': abs(aP), 'inclination_deg': abs(i) * DEG,
            'ascending_node_deg': wrap((Om + (np.pi if i < 0 else 0)) * DEG),
            'period_ratio_PP_over_PE': PP / PE, 'synodic_period_days': 1 / (1 / PE - 1 / PP),
            'third_law_a3_over_P2_ratio': abs(aP) ** 3 / (PP / PE) ** 2,
            'exponent_q_in_a_eq_Pratio_pow_q': np.log(abs(aP)) / np.log(PP / PE)}


def derived_kep3(p):
    nE, LE, kE, hE, nP, LP, kP, hP, i, Om = p
    aP = (nE / nP) ** fit.Q3
    d = derived_kep([nE, LE, kE, hE, nP, LP, kP, hP, aP, i, Om])
    return d


def derived_with_sigma(fun, p, cov):
    d0 = fun(p); keys = list(d0)
    J = np.zeros((len(keys), len(p)))
    for j in range(len(p)):
        h = 1e-6 * max(1.0, abs(p[j]))
        q = np.array(p, float); q[j] += h; d1 = fun(q)
        for k, kk in enumerate(keys):
            dv = d1[kk] - d0[kk]
            if 'deg' in kk and 'inclination' not in kk: dv = (dv + 180) % 360 - 180
            J[k, j] = dv / h
    C = J @ cov @ J.T
    return {k: {'value': float(d0[k]), 'sigma': float(np.sqrt(max(C[i, i], 0)))} for i, k in enumerate(keys)}


def write_all(D, models, fitted, table, log, win_pre, win_all, common):
    out = {}
    # winner and its parameters with sigma (covariance from the training fit on its inlier rows, chi2-scaled)
    params = {}
    for name in ['H_kepler', 'H_kepler_3rd_law', 'H_kepler_apsidal_posthoc', 'H_equant_circles', 'G_ptolemy_equant',
                 'H_circles']:
        mod = models[name]; m, s = fitted[name]
        cov, s2 = mod.cov(D, m)
        raw = {lab: {'value': float(v), 'sigma': float(np.sqrt(cov[i, i]))} for i, (lab, v) in enumerate(zip(mod.labels, mod.p))}
        entry = {'raw_parameters': raw, 'reduced_chi2_with_floor': float(s2)}
        if name == 'H_kepler': entry['derived'] = derived_with_sigma(derived_kep, mod.p, cov)
        if name == 'H_kepler_3rd_law': entry['derived'] = derived_with_sigma(derived_kep3, mod.p, cov)
        if name == 'H_kepler_apsidal_posthoc':
            entry['derived'] = derived_with_sigma(lambda q: {
                'apse_rate_E_deg_per_century': q[11] * DEG * 36525, 'apse_rate_P_deg_per_century': q[12] * DEG * 36525},
                mod.p, cov)
        if name == 'H_equant_circles':
            p = mod.p
            entry['derived'] = derived_with_sigma(lambda q: {
                'P_E_days': 2 * np.pi / q[0], 'P_P_days': 2 * np.pi / q[5],
                'centre_offset_E': np.hypot(q[2], q[3]), 'equant_fraction_f_E': q[4],
                'equant_offset_E': abs(q[4]) * np.hypot(q[2], q[3]),
                'centre_offset_P': np.hypot(q[7], q[8]), 'equant_fraction_f_P': q[9],
                'equant_offset_P': abs(q[9]) * np.hypot(q[7], q[8]),
                'a_P_over_a_E': abs(q[10]), 'apsis_lon_E_deg': wrap(np.arctan2(q[3], q[2]) * DEG),
                'apsis_lon_P_deg': wrap(np.arctan2(q[8], q[7]) * DEG)}, p, cov)
        if name == 'G_ptolemy_equant':
            p = mod.p
            entry['derived'] = derived_with_sigma(lambda q: {
                'P_deferent_days': 2 * np.pi / q[0], 'P_epicycle_days': 2 * np.pi / q[8],
                'deferent_centre_offset': np.hypot(q[2], q[3]), 'equant_fraction': q[4],
                'epicycle_radius_over_deferent': abs(q[7])}, p, cov)
        if name == 'H_circles':
            p = mod.p
            entry['derived'] = derived_with_sigma(lambda q: {
                'P_E_days': 2 * np.pi / q[0], 'P_P_days': 2 * np.pi / q[2], 'a_P_over_a_E': abs(q[4])}, p, cov)
        params[name] = entry
    out['protocol'] = {'train': 'jd_tt < 2304000.5', 'frame': 'mean ecliptic and equinox of JD 2302000.0 (fixed, inertial); '
                       'angles below are in that frame; time origin T0 = JD 2302000.0 (TT); rates in rad/day',
                       'sigma_floor_arcmin': fit.FLOOR, 'outlier_rule': '|z| > 5 x 1.4826 MAD or d > 60 arcmin',
                       'decision': 'lowest held-out median; within 1.25x tied; lowest training BIC among tied; '
                                   'held-out median > 3x in-sample median disqualifies'}
    out['winner_preregistered'] = win_pre
    out['winner_including_posthoc'] = win_all
    out['winner'] = params.get(win_all, None) and {'name': win_all, **params[win_all]}
    out['other_physical_models'] = {k: v for k, v in params.items() if k != win_all}
    out['scores'] = table
    out['search_log'] = log
    json.dump(out, open(os.path.join(HERE, 'MODEL.json'), 'w'), indent=1, default=float)

    # residual table + figure of held-out residuals
    te = ~D['train']
    rows = []
    fig, axes = plt.subplots(2, 1, figsize=(10, 7.5), sharex=True)
    yrs = 1600 + (D['jd'] - 2305447.5) / 365.25
    show = ['H_kepler', 'H_kepler_3rd_law', 'H_equant_circles', 'G_ptolemy_equant', 'H_circles', 'B_harmonic_K4',
            'A_spline_time']
    colors = dict(zip(show, ['k', 'tab:blue', 'tab:orange', 'tab:red', 'tab:purple', 'tab:green', 'tab:gray']))
    for name in show:
        mod = models[name]; m, s = fitted[name]
        sc, bad, d, dl, db = fit.scores(D, mod.predict(D), s)
        for k in np.where(te)[0]:
            rows.append([name, D['sid'][k], D['jd'][k], round(dl[k], 2), round(db[k], 2), round(d[k], 2), int(bad[k])])
        x = yrs[te] + (show.index(name) - 3) * 0.02
        axes[0].plot(x, np.abs(d[te]), 'o', ms=4 if name.startswith('H_kep') else 3, color=colors[name],
                     label='%s (median %.2f\')' % (name, np.median(d[te])), alpha=0.85)
        if name == 'H_kepler':
            ok = ~bad & te
            axes[1].errorbar(yrs[ok], dl[ok], yerr=D['sel'][ok], fmt='o', ms=4, color='k', label="dlon cos(lat)")
            axes[1].errorbar(yrs[ok] + 0.03, db[ok], yerr=D['seb'][ok], fmt='s', ms=4, color='tab:blue', mfc='none',
                             label='dlat')
            for k in np.where(bad & te)[0]:
                axes[1].annotate('%s rejected: d=%.0f\'' % (D['sid'][k], d[k]), (yrs[k], 0), xytext=(yrs[k] - 1.2, 5.5),
                                 fontsize=8, arrowprops=dict(arrowstyle='->', lw=0.6))
    axes[0].set_yscale('log'); axes[0].set_ylabel('held-out angular residual (arcmin)')
    axes[0].legend(fontsize=7, ncol=2, loc='upper left'); axes[0].grid(alpha=0.3)
    axes[0].set_title('Held-out rows (jd_tt >= 2304000.5, 1596-1601): predicted without refitting')
    axes[1].axhline(0, color='0.5', lw=0.8)
    axes[1].set_ylabel('Kepler residual, obs - model (arcmin)'); axes[1].set_xlabel('year')
    axes[1].set_ylim(-5, 7.5); axes[1].legend(fontsize=8); axes[1].grid(alpha=0.3)
    fig.tight_layout(); fig.savefig(os.path.join(HERE, 'heldout_residuals.png'), dpi=130)
    with open(os.path.join(HERE, 'work', 'heldout_residuals.csv'), 'w') as f:
        w = csv.writer(f); w.writerow(['model', 'session_id', 'jd_tt', 'dlon_cos_lat_arcmin', 'dlat_arcmin', 'd_arcmin', 'outlier'])
        w.writerows(rows)
    # all-row residuals of the Kepler model (for the report)
    mod = models['H_kepler']; m, s = fitted['H_kepler']
    sc, bad, d, dl, db = fit.scores(D, mod.predict(D), s)
    with open(os.path.join(HERE, 'work', 'kepler_all_residuals.csv'), 'w') as f:
        w = csv.writer(f); w.writerow(['session_id', 'jd_tt', 'train', 'dlon_cos_lat', 'dlat', 'd', 'z_lon', 'z_lat', 'outlier'])
        for k in range(len(d)):
            w.writerow([D['sid'][k], D['jd'][k], int(D['train'][k]), round(dl[k], 2), round(db[k], 2), round(d[k], 2),
                        round(dl[k] / D['sel'][k], 2), round(db[k] / D['seb'][k], 2), int(bad[k])])
