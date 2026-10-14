"""Build disguised copies of the frozen Tycho/Mars product for blind tests. Keys stay in this folder (never given to agents)."""
import csv, json, math, sys, random, hashlib
import erfa
SRC = sys.argv[1]; OUT = sys.argv[2]
rows = list(csv.DictReader(open(SRC)))
JD_REF = 2302032.5  # J1590.0-ish reference epoch for the fixed frame
def to_fixed(jd, lon, lat):
    # apparent ecliptic of date -> fixed mean ecliptic/equinox of JD_REF (precession+nutation only)
    lo, la = math.radians(lon), math.radians(lat)
    v = [math.cos(la)*math.cos(lo), math.cos(la)*math.sin(lo), math.sin(la)]
    rd = erfa.ecm06(jd, 0.0)          # ecliptic(mean of date) <- GCRS
    rr = erfa.ecm06(JD_REF, 0.0)
    # true -> mean of date ecliptic: nutation in longitude only (small), remove dpsi
    dpsi, _ = erfa.nut06a(jd, 0.0)
    lo2 = lo - dpsi
    v = [math.cos(la)*math.cos(lo2), math.cos(la)*math.sin(lo2), math.sin(la)]
    import numpy as np
    g = np.array(rd).T @ np.array(v)     # to GCRS
    w = np.array(rr) @ g                 # to fixed ecliptic
    return math.degrees(math.atan2(w[1], w[0])) % 360, math.degrees(math.asin(w[2]))
DIS = {
 'alpha': dict(k=1/3.7,  t0=2300100.0, phi=137.0, mirror=False, flipb=False, seed=11),
 'beta':  dict(k=1/0.83, t0=2299000.0, phi=251.5, mirror=True,  flipb=False, seed=22),
 'gamma': dict(k=1/12.4, t0=2301500.0, phi=12.25, mirror=True,  flipb=True,  seed=33),
}
keys = {}
for name, d in DIS.items():
    out = []
    for r in rows:
        jd = float(r['jd_tt']); lon, lat = to_fixed(jd, float(r['lon_deg']), float(r['lat_deg']))
        t = (jd - d['t0']) * d['k']
        L = ((-lon if d['mirror'] else lon) + d['phi']) % 360
        B = -lat if d['flipb'] else lat
        out.append({'t': f"{t:.6f}", 'x_deg': f"{L:.5f}", 'y_deg': f"{B:.5f}",
                    'sx_arcmin': r['sigma_lon_arcmin'], 'sy_arcmin': r['sigma_lat_arcmin']})
    random.Random(d['seed']).shuffle(out)
    import os; os.makedirs(f"{OUT}/{name}", exist_ok=True)
    p = f"{OUT}/{name}/positions.csv"
    with open(p, 'w', newline='') as f:
        w = csv.DictWriter(f, fieldnames=list(out[0].keys()), lineterminator='\n'); w.writeheader(); w.writerows(out)
    ts = sorted(float(o['t']) for o in out); cut = ts[int(0.85*len(ts))]
    keys[name] = dict(d, sha256=hashlib.sha256(open(p,'rb').read()).hexdigest(), holdout_from_t=cut, JD_REF=JD_REF)
json.dump(keys, open(sys.argv[3], 'w'), indent=1)
print(json.dumps({k:(v['sha256'][:12], round(v['holdout_from_t'],3)) for k,v in keys.items()}))
