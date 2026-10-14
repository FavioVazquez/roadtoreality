import sys; sys.path.insert(0,'.')
import fit, numpy as np
D=fit.load(); m=D['train']
w0=fit.periodogram_freqs(D,m)
hm=fit.HarmonicModel(1)
def cost(w):
    c=hm.lin(D,m,w); U=hm.predict({'t':D['t'][m]},w=w,c=c); r=fit.wres(D,U,m); return np.sum(r**2)
f2=np.arange(1/6000,1/100,4e-6)
f1=np.arange(w0[0]/2/np.pi-2e-6*20,w0[0]/2/np.pi+2e-6*20,2e-6)
best=[]
for a in f1:
    for b in f2:
        best.append((cost(2*np.pi*np.array([a,b])),1/a,1/b))
best.sort()
for x in best[:15]: print(x)
