import numpy as np, time
from multiprocessing import Pool
from scipy.optimize import least_squares
import importlib.util
D='/private/tmp/claude-501/-Users-faviovazquez-Projects-ClaudeCode-showtime/f0dc559b-8c70-47fc-b88b-974366698b7f/scratchpad/disguise/beta'
spec=importlib.util.spec_from_file_location('fit',D+'/fit.py'); F=importlib.util.module_from_spec(spec); spec.loader.exec_module(F)
idx=np.where(F.TR)[0]
def lon_only(p):
    v=F.mod_f3(p,F.t[idx]); return np.degrees((F.X[idx]-np.arctan2(v[:,1],v[:,0])+np.pi)%(2*np.pi)-np.pi)
def lat_too(p):
    v=F.mod_f3(p,F.t[idx]); dl=np.degrees((F.X[idx]-np.arctan2(v[:,1],v[:,0])+np.pi)%(2*np.pi)-np.pi)
    db=np.degrees(F.Y[idx]-np.arctan2(v[:,2],np.hypot(v[:,0],v[:,1]))); return np.r_[dl*np.cos(F.Y[idx]),db]
def job(p0):
    try:
        s=least_squares(lon_only,p0,loss='soft_l1',f_scale=0.5,max_nfev=400)
        s=least_squares(lat_too,s.x,loss='soft_l1',f_scale=0.2,max_nfev=400)
        return float(np.median(np.abs(s.fun))), s.x
    except Exception: return 1e9,p0
if __name__=='__main__':
    rng=np.random.default_rng(2)
    tt=F.t[idx]-F.T0; Xo=F.X[idx]
    agrid=np.exp(np.linspace(np.log(0.1),np.log(10),16)); ph=np.linspace(0,2*np.pi,24,endpoint=False)
    seeds=[]
    for Ps in (6691.1,5571.8,8373.4):
      for Psyn in (838.7,860.3,818.1):
        for Po,Pb in ((1/(1/Psyn+1/Ps),Ps),(Ps,1/(1/Psyn+1/Ps)),(1/abs(1/Psyn-1/Ps),Ps),(Ps,1/abs(1/Psyn-1/Ps))):
          for sg in (1,-1):
            A,LO,LB=[g.ravel()[:,None] for g in np.meshgrid(agrid,ph,ph,indexing='ij')]
            vx=A*np.cos(LB+sg*2*np.pi/Pb*tt)-np.cos(LO+sg*2*np.pi/Po*tt); vy=A*np.sin(LB+sg*2*np.pi/Pb*tt)-np.sin(LO+sg*2*np.pi/Po*tt)
            c=np.median(np.abs((Xo-np.arctan2(vy,vx)+np.pi)%(2*np.pi)-np.pi),1)
            for j in np.argsort(c)[:3]: seeds.append((c[j],[sg*Po,LO[j,0],sg*Pb,A[j,0],LB[j,0]]))
    seeds.sort(key=lambda z:z[0])
    starts=[]
    for c,q in seeds[:40]:
        for k in range(8):
            eo=rng.uniform(0,0.4); eb=rng.uniform(0,0.6); wo=rng.uniform(0,2*np.pi); wb=rng.uniform(0,2*np.pi)
            starts.append(np.r_[q[0],eo*np.sin(wo),eo*np.cos(wo),q[1],q[2],q[3],eb*np.sin(wb),eb*np.cos(wb),q[4],rng.uniform(0.01,0.1),rng.uniform(0,2*np.pi)])
    t0=time.time()
    with Pool(6) as pool: out=pool.map(job,starts,chunksize=4)
    out.sort(key=lambda z:z[0])
    for m,x in out[:8]: print(round(m,4), np.round(x,4))
    print('time',time.time()-t0)
    np.save(D+'/_seed3.npy',np.array([x for _,x in out[:10]]))
