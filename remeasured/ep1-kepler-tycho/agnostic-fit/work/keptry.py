import sys; sys.path.insert(0,'.')
import fit, numpy as np
from scipy.optimize import least_squares
D=fit.load(); m=D['train']; t=D['t'][m]; lam=D['L'][m]
ridge=[(367.52,688.96),(365.50,686.12),(363.51,683.31),(369.56,691.82),(371.62,693.74),(361.5,680.5)]
res=[]
for Pe,Pp in ridge[:3]:
    fe,fp=1/Pe,1/Pp
    a=np.stack([np.sin(2*np.pi*fe*t-lam),np.cos(2*np.pi*fe*t-lam),np.sin(2*np.pi*fp*t-lam),np.cos(2*np.pi*fp*t-lam)],1)
    w,v=np.linalg.eigh(a.T@a); x=v[:,0]
    B=x[0]+1j*x[1]; A=x[2]+1j*x[3]   # earth coef B, planet coef A
    best=None
    for s in [1,-1]:
        c=[2*np.pi*fe,np.angle(-s*B),2*np.pi*fp,np.angle(s*A),abs(A)/abs(B),0.03,1.0]
        for Om in np.linspace(0,2*np.pi,4,endpoint=False):
            c[6]=Om
            r=least_squares(lambda q: fit.wres(D,fit.m_circ(q,t),m), c, method='lm', x_scale='jac')
            if best is None or r.cost<best.cost: best=r
    pc=best.x; ne,Le,n_,Lp,ap,inc,Om=pc
    dl,db,d=fit.resid(D,fit.m_circ(pc,t),m)
    print('circle',Pe,Pp,'->',2*np.pi/ne,2*np.pi/n_,ap,'median d',np.median(d))
    st=[]
    for we in np.linspace(0,2*np.pi,8,endpoint=False):
        for wp in np.linspace(0,2*np.pi,8,endpoint=False):
            st.append([ne,Le,0.02*np.cos(we),0.02*np.sin(we),n_,Lp,0.08*np.cos(wp),0.08*np.sin(wp),ap,inc,Om])
    for s0 in st:
        r=least_squares(lambda q: fit.wres(D,fit.m_kep(q,t),m), s0, method='trf',loss='soft_l1',f_scale=3, x_scale='jac',max_nfev=200)
        res.append((r.cost,r.x))
res.sort(key=lambda z:z[0])
for c,x in res[:10]:
    dl,db,d=fit.resid(D,fit.m_kep(x,t),m)
    print(round(c,1), 2*np.pi/x[0],2*np.pi/x[4], np.hypot(x[2],x[3]),np.hypot(x[6],x[7]),x[8],'median',np.median(d))
np.save('work/kepbest.npy',res[0][1])
