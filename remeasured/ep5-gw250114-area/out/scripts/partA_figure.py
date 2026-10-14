#!/usr/bin/env python
"""Figure for Part A: out/figures/partA_area_change.{png,pdf} from out/results/partA_area_samples.npz."""
import os, numpy as np, matplotlib; matplotlib.use("Agg"); import matplotlib.pyplot as plt
OUT = os.path.abspath(os.path.join(os.path.dirname(os.path.abspath(__file__)), ".."))
S = np.load(os.path.join(OUT, "results", "partA_area_samples.npz"))
order = ['bilby-NRSur7dq4_prod-reweighted','bilby-NRSur7dq4_prod_nocal-reweighted','bilby-IMRPhenomXPHM-SpinTaylor_prod-reweighted','bilby-SEOBNRv5PHM-reweighted','bilby-IMRPhenomXO4a_prod-reweighted']
names = dict(zip(order, ['NRSur7dq4','NRSur7dq4 (no calib.)','IMRPhenomXPHM','SEOBNRv5PHM','IMRPhenomXO4a']))
cols = ['#1b4f8a','#7fa7d1','#c2552b','#5a8f3c','#8a5a9e']
plt.rcParams.update({"font.size": 7, "axes.titlesize": 8, "axes.labelsize": 7, "legend.fontsize": 7, "axes.spines.top": False, "axes.spines.right": False})
fig, axes = plt.subplots(1, 2, figsize=(7.0, 2.8), gridspec_kw=dict(width_ratios=[1.25, 1]))
ax = axes[0]; mx = max(float(S[k][:, 2].max()) for k in order)
bins = np.arange(0.54, mx + 0.0026, 0.0025)
for k, cl in zip(order, cols):
    ax.hist(S[k][:, 2], bins=bins, histtype='step', lw=1.6 if k == order[0] else 1.0, color=cl, density=True, label=names[k])
ax.set_xlim(0.54, 0.80); ax.legend(frameon=False, loc='upper right')
ntail = sum(int((S[k][:, 2] > 0.80).sum()) for k in order); ntot = sum(len(S[k]) for k in order)
ax.text(0.985, 0.50, 'smallest sample: %.3f\n(zero is far off-axis)\n%d of %s samples\n> 0.80 not shown (max %.2f)' % (min(float(S[k][:, 2].min()) for k in order), ntail, f"{ntot:,}", mx),
        transform=ax.transAxes, ha='right', va='top', fontsize=7, color='0.35')
ax.set_xlabel(r'fractional area change $(A_f-A_i)/A_i$'); ax.set_ylabel('posterior density')
ax.set_title('All five IMR posteriors: area grows by 58–60%', loc='left')
ax = axes[1]; k = order[0]; u = 1e9
ax.scatter(S[k][:, 0]/u, S[k][:, 1]/u, s=1, alpha=0.15, color=cols[0], rasterized=True)
ax.plot([180, 420], [180, 420], color='0.4', lw=0.8); ax.text(330, 315, r'$A_f=A_i$', ha='left', va='top', color='0.3', fontsize=7)
ax.set_xlim(180, 420); ax.set_ylim(180, 420)
ax.set_xlabel(r'initial area $A_1+A_2$ [$10^3$ km$^2$]'); ax.set_ylabel(r'final area $A_f$ [$10^3$ km$^2$]')
ax.set_title('NRSur7dq4: every sample has A_f > A_i', loc='left')
fig.tight_layout(); fig.savefig(os.path.join(OUT, "figures", "partA_area_change.png"), dpi=300); fig.savefig(os.path.join(OUT, "figures", "partA_area_change.pdf"))
