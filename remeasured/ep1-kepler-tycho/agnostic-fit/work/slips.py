import sys, os; sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
import fit, numpy as np, json
D=fit.load(); M=json.load(open('work/MODEL_run2.json'))
p=np.array([v['value'] for v in M['winner']['raw_parameters'].values()])
labs=list(M['winner']['raw_parameters'])
assert labs==['n_E','L_E','k_E','h_E','n_P','L_P','k_P','h_P','i','Omega'], labs
for sid in ['1583-01-25V','1585-01-17M','1585-02-09V','1586-09-23V','1593-11-27V','1594-02-14V','1598-03-02V']:
    k=int(np.where(D['sid']==sid)[0][0]); out=[]
    for dt in [-10,-1,-0.5,0,0.5,1,10]:
        Dk={kk:(v[k:k+1] if isinstance(v,np.ndarray) else v) for kk,v in D.items()}
        U=fit.m_kep3(p,D['t'][k:k+1]+dt); dl,db,d=fit.resid(Dk,U)
        out.append('%+.1fd: %.1f'%(dt,d[0]))
    print(sid, ' | '.join(out))
