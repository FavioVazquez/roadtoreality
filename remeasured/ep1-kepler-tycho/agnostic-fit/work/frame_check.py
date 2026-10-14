import numpy as np, erfa, csv
r=list(csv.DictReader(open('positions.csv')))
def R1(a):
    c,s=np.cos(a),np.sin(a); return np.array([[1,0,0],[0,c,s],[0,-s,c]])
M0=erfa.ecm06(2451545.0,0.0)
for x in r[::30]:
    jd=float(x['jd_tt']); l=np.radians(float(x['lon_deg'])); b=np.radians(float(x['lat_deg']))
    v=np.array([np.cos(b)*np.cos(l),np.cos(b)*np.sin(l),np.sin(b)])
    dpsi,deps=erfa.nut06a(jd,0); eps=erfa.obl06(jd,0)+deps
    NPB=erfa.pnm06a(jd,0)
    g=NPB.T@R1(eps).T@v
    w=M0@g
    print(x['session_id'], np.degrees(l), np.degrees(np.arctan2(w[1],w[0]))%360, np.degrees(np.arctan2(w[1],w[0]))%360-np.degrees(l), np.degrees(np.arcsin(w[2])),np.degrees(b))
