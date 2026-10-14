import sys, os; sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
import fit, numpy as np, json, pickle
from scipy.optimize import least_squares
D=fit.load(); P=pickle.load(open('work/params.pkl','rb')); pk=np.array(P['H_kepler'])
def kxy_t(t,n,L0,k,h,a,wdot):
    out_x=np.empty_like(t); out_y=np.empty_like(t)
    e=np.hypot(k,h); w=np.arctan2(h,k)+wdot*t
    M=L0-w+n*t; E=M+e*np.sin(M)
    for _ in range(40): E=E-(E-e*np.sin(E)-M)/(1-e*np.cos(E))
    xp=abs(a)*(np.cos(E)-e); yp=abs(a)*np.sqrt(1-e*e)*np.sin(E)
    return (np.cos(w)*xp-np.sin(w)*yp, np.sin(w)*xp+np.cos(w)*yp)
def m_aps(p,t):
    nE,LE,kE,hE,nP,LP,kP,hP,aP,i,Om,wdE,wdP=p
    E=fit.rot_plane(kxy_t(t,nE,LE,kE,hE,1.0,wdE),0,0)
    kk,hh=fit.rot2(kP,hP,-Om)
    return fit.rot_plane(kxy_t(t,nP,LP-Om,kk,hh,aP,wdP),i,Om)-E
mod=fit.ParamModel('H_kepler_apsidal_motion',m_aps,['n_E','L_E','k_E','h_E','n_P','L_P','k_P','h_P','a_P','i','Omega','wdot_E','wdot_P'],'Kepler + apsidal rotation')
m,s=fit.fit_with_outliers(D,mod,[list(pk)+[0,0]])
sc,bad,d,dl,db=fit.scores(D,mod.predict(D),s)
cov,s2=mod.cov(D,m)
print(sc); print('wdot (deg/century):',np.degrees(mod.p[11:])*36525,'+-',np.degrees(np.sqrt(np.diag(cov)[11:]))*36525)
mk=np.array(json.load(open('work/results.json'))['masks']['H_kepler'])
for name,f,p in [('kep',fit.m_kep,pk),('aps',m_aps,mod.p)]:
    r=fit.wres(D,f(p,D['t'][mk]),mk); n=len(r); print(name,'chi2',np.sum(r**2),'BIC on Kepler inliers',n*np.log(np.sum(r**2)/n)+len(p)*np.log(n))
