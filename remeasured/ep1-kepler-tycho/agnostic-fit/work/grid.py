import numpy as np, sys
sys.path.insert(0,'work'); from common import *
D=load(); m=D['train']
t=D['jd'][m]-2302000.0; lam=D['L'][m]
f=np.arange(1/6000,1/100,4e-6); nf=len(f); print(nf)
th=2*np.pi*f[:,None]*t[None,:]-lam[None,:]
C=np.stack([np.sin(th),np.cos(th)],2)  # nf,n,2
G11=np.einsum('fni,fnj->fij',C,C)
best=np.full((nf,nf),np.inf)
for i in range(nf):
    G12=np.einsum('ni,gnj->gij',C[i],C[i:])
    G=np.zeros((nf-i,4,4)); G[:,:2,:2]=G11[i]; G[:,:2,2:]=G12; G[:,2:,:2]=G12.transpose(0,2,1); G[:,2:,2:]=G11[i:]
    w,v=np.linalg.eigh(G)
    x=v[:,:,0]; A=np.hypot(x[:,0],x[:,1]); Bm=np.hypot(x[:,2],x[:,3])
    q=w[:,0]/np.maximum(np.abs(A**2-Bm**2),1e-3)**2   # penalize |A|=|B| degeneracy
    best[i,i:]=q
np.save('work/grid.npy',best); np.save('work/gridf.npy',f)
idx=np.argsort(best,axis=None)[:4000]
seen=[]
for k in idx:
    i,j=np.unravel_index(k,best.shape)
    if any(abs(i-a)<15 and abs(j-b)<15 for a,b in seen): continue
    seen.append((i,j)); print(1/f[i],1/f[j],best[i,j])
    if len(seen)>=15: break
