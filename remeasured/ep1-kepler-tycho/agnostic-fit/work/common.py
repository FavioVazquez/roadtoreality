import numpy as np, erfa, csv
AM = 180*60/np.pi  # rad -> arcmin
def R1(a):
    c,s=np.cos(a),np.sin(a); return np.array([[1,0,0],[0,c,s],[0,-s,c]])
T0=2302000.0
M0=erfa.ecm06(T0,0.0)   # fixed frame: mean ecliptic and equinox of JD 2302000 (1590 Jan), inertial
def load(path='positions.csv'):
    r=list(csv.DictReader(open(path)))
    D={}
    D['sid']=np.array([x['session_id'] for x in r]); D['site']=np.array([x['site'] for x in r])
    D['flags']=[x['flags'] for x in r]
    jd=np.array([float(x['jd_tt']) for x in r]); D['jd']=jd
    lon=np.radians([float(x['lon_deg']) for x in r]); lat=np.radians([float(x['lat_deg']) for x in r])
    D['slon']=np.array([float(x['sigma_lon_arcmin']) for x in r]); D['slat']=np.array([float(x['sigma_lat_arcmin']) for x in r])
    U=np.zeros((len(r),3)); Mto=[]
    for k in range(len(r)):
        v=np.array([np.cos(lat[k])*np.cos(lon[k]),np.cos(lat[k])*np.sin(lon[k]),np.sin(lat[k])])
        dpsi,deps=erfa.nut06a(jd[k],0); eps=erfa.obl06(jd[k],0)+deps
        M=M0@erfa.pnm06a(jd[k],0).T@R1(eps).T   # true ecliptic of date -> J2000 mean ecliptic
        U[k]=M@v; Mto.append(M)
    D['U']=U; D['Mto']=np.array(Mto)
    L=np.arctan2(U[:,1],U[:,0]); B=np.arcsin(np.clip(U[:,2],-1,1))
    D['L']=L; D['B']=B
    D['elon']=np.stack([-np.sin(L),np.cos(L),0*L],1)
    D['elat']=np.stack([-np.sin(B)*np.cos(L),-np.sin(B)*np.sin(L),np.cos(B)],1)
    D['train']=jd<2304000.5
    return D
FLOOR=0.5
def resid_components(D,Umod):
    """returns dlon*, dlat (arcmin) in J2000 frame tangent basis and exact angular distance"""
    Umod=Umod/np.linalg.norm(Umod,axis=1,keepdims=True)
    dU=D['U']-Umod
    dl=np.sum(dU*D['elon'],1)*AM; db=np.sum(dU*D['elat'],1)*AM
    # exact: use lon/lat of model
    Lm=np.arctan2(Umod[:,1],Umod[:,0]); Bm=np.arcsin(np.clip(Umod[:,2],-1,1))
    dlon=(np.angle(np.exp(1j*(D['L']-Lm))))*np.cos(D['B'])*AM; dlat=(D['B']-Bm)*AM
    d=np.arccos(np.clip(np.sum(D['U']*Umod,1),-1,1))*AM
    return dlon,dlat,d
