"""Check the contact finder on a modern transit: 2006 Nov 8-9, geocentric.
Reference: NASA/GSFC (F. Espenak), https://eclipse.gsfc.nasa.gov/OH/transit06.html, Table 1
(cached data/ref/transit06.html): I 19:12:04, II 19:13:57, III 00:08:16, IV 00:10:08 UT."""
import sys

sys.path.insert(0, __import__("os").path.dirname(__file__))
import transit as T

ref = {"I": (8, "19:12:04"), "II": (8, "19:13:57"), "III": (9, "00:08:16"), "IV": (9, "00:10:08")}
dT = 65.0  # placeholder for the window centre only; UT result uses Horizons' own TDB-UT below
lines = ["contact,nasa_ut,horizons_ut,diff_s,v_path_arcsec_per_min"]
for k, (day, s) in ref.items():
    jd_ut = T.jd_gregorian(2006, 11, day, T.hms(s) / 3600)
    ser = T.series(jd_ut + dT / 86400, 6)
    c = T.contact(ser, k, jd_ut + dT / 86400)
    ut = c["jd"] - c["tdb_ut"] / 86400
    diff = (ut - jd_ut) * 86400
    lines.append(f"{k},{s},{T.fmt_hms(((ut + 0.5) % 1) * 86400)},{diff:+.1f},{c['v_path']:.2f}")
print("\n".join(lines))
print("Horizons TDB-UT at contact:", round(c["tdb_ut"], 2), "s; source:", ser["source"])
open(T.hz.ROOT / "out" / "validation_2006.csv", "w").write("\n".join(lines) + "\n")
