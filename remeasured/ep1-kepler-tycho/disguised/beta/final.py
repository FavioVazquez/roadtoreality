"""Final weighted fits from the staged seeds (stage3/stage4), plus F1 loaded from `fit.py f1` and F2 refit."""
import numpy as np, json
from multiprocessing import Pool
import importlib.util
D='/private/tmp/claude-501/-Users-faviovazquez-Projects-ClaudeCode-showtime/f0dc559b-8c70-47fc-b88b-974366698b7f/scratchpad/disguise/beta'
spec=importlib.util.spec_from_file_location('fit',D+'/fit.py'); F=importlib.util.module_from_spec(spec); spec.loader.exec_module(F)
def f3job(p0):
    p,s,keep=F.robust_then_clean(F.mod_f3,p0); sc=F.score('F3_two_kepler',F.mod_f3,p,s,keep); return sc,p,F.cov_sigma(s,sc['red_chi2'])
def f3cjob(p0):
    p,s,keep=F.robust_then_clean(F.mod_f3c,p0); sc=F.score('F3c_two_circular',F.mod_f3c,p,s,keep); return sc,p,F.cov_sigma(s,sc['red_chi2'])
def f2job(p0):
    p,s,keep=F.robust_then_clean(F.mod_f2,p0); sc=F.score('F2_kepler_geocentric',F.mod_f2,p,s,keep); return sc,p,F.cov_sigma(s,sc['red_chi2'])
if __name__=='__main__':
    s3=np.load(D+'/_seed3.npy')[:6]
    g4=np.load(D+'/_grid4.npy')[:6]
    c_starts=[np.r_[g[1],g[2],g[3],g[4],g[5],0.03,n] for g in g4[:3] for n in (0,np.pi)]
    rng=np.random.default_rng(3)
    f2_starts=[np.r_[sg*P,0.05*rng.standard_normal(2),lam,0.03,rng.uniform(0,2*np.pi)] for P in (6691.1,838.7) for sg in (1,-1) for lam in (0,2,4)]
    with Pool(6) as pool:
        r3=pool.map(f3job,list(s3)); rc=pool.map(f3cjob,c_starts); r2=pool.map(f2job,f2_starts)
    res={}; par={}
    for name,r in (('F3_two_kepler',r3),('F3c_two_circular',rc),('F2_kepler_geocentric',r2)):
        b=min(r,key=lambda z:z[0]['BIC']); res[name]=b[0]; par[name]=(b[1],b[2])
    f1=np.load(D+'/_f1.npy',allow_pickle=True).item()['F1_harmonic']
    res['F1_harmonic']=f1[2]; par['F1_harmonic']=(f1[0],f1[1])
    json.dump(res,open(D+'/_scores.json','w'),indent=1)
    np.save(D+'/_params.npy',par,allow_pickle=True)
    for k,v in res.items(): print(k,{q:v[q] for q in ('k','BIC','in_median','in_rms','ho_median_all','ho_rms_all','ho_rms_clean','n_train_flagged')})
