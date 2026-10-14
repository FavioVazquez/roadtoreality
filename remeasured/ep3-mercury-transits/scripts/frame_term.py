"""Frame term for the planetary budget: Mercury's longitude-of-perihelion rate changes when it is referred to
the ecliptic of date instead of the fixed J2000 ecliptic (the frame of tables such as Clemence's).
The ecliptic of date is tilted by pi_A = 47.0029"/cy about the node Pi_A = 174.876384 deg (Meeus,
Astronomical Algorithms, 2nd ed., eq. 21.1 constants at J2000); because the obliquity decreases, the plane of date lies
north of the J2000 plane at longitude Pi_A + 90 deg. A fixed vector v has date-frame components R(-theta) v,
R = right-handed rotation about the node axis. Method: build Mercury's orbit-normal and perihelion vectors from
the 1780 osculating elements, rotate, read off Omega_d, omega_d, pomega_d = Omega_d + omega_d, and divide the
change by theta / pi_A to get the rate. Also the analytic form pi_A sin(Omega - Pi_A) tan(i/2) (sign checked here).
Writes out/frame_term.json."""
import json, math, os, sys
import numpy as np
sys.path.insert(0, os.path.dirname(__file__))
import nbody as N

AS = math.pi / 180 / 3600
PI_A, NODE = 47.0029, math.radians(174.876384)

def rot(axis, ang):
    x, y, z = axis; c, s = math.cos(ang), math.sin(ang); C = 1 - c
    return np.array([[c+x*x*C, x*y*C-z*s, x*z*C+y*s], [y*x*C+z*s, c+y*y*C, y*z*C-x*s], [z*x*C-y*s, z*y*C+x*s, c+z*z*C]])

def pomega_in_frame(inc, Om, om, theta):
    P = np.array([math.cos(om)*math.cos(Om) - math.sin(om)*math.sin(Om)*math.cos(inc),
                  math.cos(om)*math.sin(Om) + math.sin(om)*math.cos(Om)*math.cos(inc),
                  math.sin(om)*math.sin(inc)])
    h = np.array([math.sin(Om)*math.sin(inc), -math.cos(Om)*math.sin(inc), math.cos(inc)])
    R = rot(np.array([math.cos(NODE), math.sin(NODE), 0.0]), -theta)
    Pd, hd = R @ P, R @ h
    Om_d = math.atan2(hd[0], -hd[1])
    n = np.array([math.cos(Om_d), math.sin(Om_d), 0.0])
    om_d = math.atan2(np.dot(np.cross(n, Pd), hd), np.dot(n, Pd))
    return (Om_d + om_d) % (2*math.pi), Om_d, math.acos(hd[2])

if __name__ == "__main__":
    a, e, inc, Om, pom, l = N.mercury_elements(N.horizons_states())
    om = pom - Om
    out = {"i_deg": math.degrees(inc), "Omega_deg": math.degrees(Om), "pomega_deg": math.degrees(pom)}
    for T in (0.01, 0.1):  # centuries; the rotation is linear in T at this size
        th = PI_A * AS * T
        p1 = pomega_in_frame(inc, Om, om, th)[0]; p0 = pomega_in_frame(inc, Om, om, 0.0)[0]
        d = (p1 - p0 + math.pi) % (2*math.pi) - math.pi
        out[f"numerical_rate_arcsec_per_cy_T{T}"] = d / AS / T
    out["analytic_pi_A_sin(Omega-Pi_A)_tan(i/2)"] = PI_A * math.sin(Om - NODE) * math.tan(inc/2)
    b = json.load(open(N.hz.ROOT / "out" / "planet_budget.json"))
    out["budget_J2000_all_planets_1677_1881"] = b["1677-1881"]["all"]
    out["budget_J2000_all_planets_1000yr"] = b["1000yr"]["all"]
    out["budget_ecliptic_of_date_1000yr"] = b["1000yr"]["all"] + out["numerical_rate_arcsec_per_cy_T0.01"]
    json.dump(out, open(N.hz.ROOT / "out" / "frame_term.json", "w"), indent=1)
    print(json.dumps(out, indent=1))
