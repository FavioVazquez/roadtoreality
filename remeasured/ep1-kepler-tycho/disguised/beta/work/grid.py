import numpy as np, sys, time
D='/private/tmp/claude-501/-Users-faviovazquez-Projects-ClaudeCode-showtime/f0dc559b-8c70-47fc-b88b-974366698b7f/scratchpad/disguise/beta2/positions.csv'
d=np.genfromtxt(D,delimiter=',',names=True); d=d[np.argsort(d['t'])]
tr=d['t']<6009.989529; d=d[tr]
t=d['t']-3000.0; x=np.radians(d['x_deg']); w=1/np.radians(d['sx_arcmin']/60)
zo=np.exp(1j*x)
f=np.arange(3e-5,0.01,3e-6)*2*np.pi
E=np.exp(1j*np.outer(f,t))  # F x N
# residual r = Im(conj(zo) * (a E_A + b E_B)) * w, linear in [Ra,Ia,Rb,Ib]
# Im(conj(zo)*a*E) = Re(a)*Im(c) + Im(a)*Re(c), c=conj(zo)*E
C=np.conj(zo)[None,:]*E*w[None,:]
cols=np.stack([C.imag,C.real],1) # F x 2 x N
G=np.einsum('fin,gjn->fgij',cols,cols)  # F x F x 2 x 2 (cross blocks)
nF=len(f); best=[]
S=np.zeros((nF,nF))
for i in range(nF):
    M=np.zeros((nF,4,4))
    M[:,:2,:2]=G[i,i]; M[:,2:,2:]=G[np.arange(nF),np.arange(nF)]; M[:,:2,2:]=G[i,:]; M[:,2:,:2]=np.transpose(G[i,:],(0,2,1))
    ev=np.linalg.eigvalsh(M)[:,0]
    S[i]=ev
np.save('S.npy',S); np.save('f.npy',f)
iu=np.triu_indices(nF,10)
v=S[iu]; o=np.argsort(v)[:15]
for k in o: print(f[iu[0][k]]/2/np.pi, f[iu[1][k]]/2/np.pi, v[k])
