import numpy as np, time
from multiprocessing import Pool
D='/private/tmp/claude-501/-Users-faviovazquez-Projects-ClaudeCode-showtime/f0dc559b-8c70-47fc-b88b-974366698b7f/scratchpad/disguise/beta'
d=np.sort(np.genfromtxt(D+'/positions.csv',delimiter=',',names=True),order='t')
tr=d['t']<6009.989529; tt=d['t'][tr]-3000.0; Xo=np.radians(d['x_deg'][tr])
Pg=np.exp(np.linspace(np.log(150),np.log(20000),140))
agrid=np.exp(np.linspace(np.log(0.15),np.log(6.5),12)); ph=np.linspace(0,2*np.pi,12,endpoint=False)
A,LO,LB=[g.ravel()[:,None] for g in np.meshgrid(agrid,ph,ph,indexing='ij')]
def job(i):
    out=[]
    for j in range(len(Pg)):
        for sg in (1,-1):
            no=sg*2*np.pi/Pg[i]; nb=sg*2*np.pi/Pg[j]
            vx=A*np.cos(LB+nb*tt)-np.cos(LO+no*tt); vy=A*np.sin(LB+nb*tt)-np.sin(LO+no*tt)
            c=np.median(np.abs((Xo-np.arctan2(vy,vx)+np.pi)%(2*np.pi)-np.pi),1)
            k=np.argmin(c); out.append((c[k],sg*Pg[i],LO[k,0],sg*Pg[j],A[k,0],LB[k,0]))
    return out
if __name__=='__main__':
    t0=time.time()
    with Pool(6) as p: res=sum(p.map(job,range(len(Pg))),[])
    res.sort(key=lambda z:z[0])
    for r in res[:15]: print(np.round(np.degrees(r[0]),2), np.round(r[1:],3))
    np.save(D+'/_grid4.npy',np.array(res[:200]))
    print(time.time()-t0)
