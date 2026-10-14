import sys; sys.path.insert(0,'.')
import fit, numpy as np
D=fit.load(); m=D['train']; t=D['t'][m]; lam=D['L'][m]
fe=np.arange(1/420,1/320,1e-6); fp=np.arange(1/850,1/560,1e-6)
def C(f):
    th=2*np.pi*f[:,None]*t[None,:]-lam[None,:]; return np.stack([np.sin(th),np.cos(th)],2)
Ce,Cp=C(fe),C(fp)
Gee=np.einsum('fni,fnj->fij',Ce,Ce); Gpp=np.einsum('fni,fnj->fij',Cp,Cp)
Q=np.zeros((len(fe),len(fp))); AR=np.zeros_like(Q)
for i in range(len(fe)):
    G12=np.einsum('ni,gnj->gij',Ce[i],Cp)
    G=np.zeros((len(fp),4,4)); G[:,:2,:2]=Gee[i]; G[:,:2,2:]=G12; G[:,2:,:2]=G12.transpose(0,2,1); G[:,2:,2:]=Gpp
    w,v=np.linalg.eigh(G); A=np.hypot(v[:,0,0],v[:,1,0]); B=np.hypot(v[:,2,0],v[:,3,0])
    Q[i]=w[:,0]/np.maximum(np.abs(A**2-B**2),1e-3)**2; AR[i]=B/A
np.save('work/boxQ.npy',Q)
idx=np.argsort(Q,axis=None)
seen=[]
for k in idx:
    i,j=np.unravel_index(k,Q.shape)
    if any(abs(i-a)<5 and abs(j-c)<5 for a,c in seen): continue
    seen.append((i,j)); print('%.2f %.2f %.3f ratio %.3f synodic %.1f'%(1/fe[i],1/fp[j],Q[i,j],AR[i,j],1/(fe[i]-fp[j])))
    if len(seen)>=25: break
