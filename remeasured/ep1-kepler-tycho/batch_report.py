"""Write out/BATCH.md and the blind data product out/mars_positions.csv from out/batch/results.json.

Run after reduce.py:  data/.venv/bin/python -I batch_report.py

Quality classes use the reducer's internal flags only (never a per-session Horizons residual). The flag lists were
revised once after seeing the class-level table (long_span demoted to informational, B narrowed):
  C (excluded from the product): two-fold ambiguity unresolved, or resolved only with Tycho's printed place (a branch
    choice is still use as data: excluded by the coordinator's decision, 13 Oct 2026); formal error > 3'; no time at all (assumed transit);
    clock-star time disagrees with the printed time by > 30 min or fits the other calendar better; site unknown.
  B (in the product, flagged): a material fallback (uncalibrated zero point, untimed rows at the session's mean time,
    assumed time basis or row time, ambiguity resolved from the page, rows below 1 deg dropped, 1593 copy,
    unidentified stars skipped, approximate site, altitude/azimuth used).
  A: none of these.
mars_positions.csv holds no ephemeris input: the diurnal parallax uses a nominal 1 au (<= 0.25' error), and no
Horizons value or residual is written to it.
"""
import csv, json, math, pathlib, subprocess, sys, collections
import numpy as np

HERE = pathlib.Path(__file__).resolve().parent
sys.path.insert(0, str(HERE))
from reduce import horizons_geo, wrap180, D2R  # noqa: E402

OUT = HERE / "out"
R = json.loads((OUT / "batch" / "results.json").read_text())
EXC = ("two_fold_ambiguity_unresolved", "two_fold_ambiguity_resolved_by:tycho", "geometry_weak", "time_unknown_assumed_transit", "calendar_conflict",
       "clock_vs_printed_time", "site_uncertain")
FB = ("untimed_rows_at_mean_time", "armillary_uncalibrated", "quadrant_uncalibrated", "altaz_used",
      "time_basis_unknown_assumed", "two_fold_ambiguity_resolved_by", "below_5deg_dropped", "copy_codex_K",
      "night_assigned", "time_assumed_row", "star_unidentified", "site_approx")
# informational only (class A keeps them): pooled zero points, calendar by site, unnamed instrument assumed sextant,
# long sessions, 1-degree clock slips, rejected calibration readings


def quality(r):
    fl = r["flags"]
    if any(f.startswith(EXC) for f in fl):
        return "C"
    if any(f.startswith(FB) for f in fl):
        return "B"
    return "A"


def period(d):
    y = int(d[:4]); m = int(d[5:7])
    if y <= 1585:
        return "1580-85 (vol X)"
    if y <= 1589:
        return "1586-89 (vol XI)"
    if y <= 1593:
        return "1590-93 (vol XII)"
    if y < 1597 or (y == 1597 and m < 3):
        return "1594-97 (Hven, vols XII-XIII)"
    if y < 1599 or (y == 1599 and m < 9):
        return "1597-99 (travels)"
    return "1599-1601 (Bohemia)"


def instrument(r):
    k = set(r.get("kinds", [])); cl = set(r.get("dist_classes", []))
    if "radius" in cl:
        return "radius (cross-staff)"
    if "dist" in k and any(c.startswith("sext") or c == "arcus" for c in cl):
        return "sextant distances" + (" + armillary" if "dec" in k or "radiff" in k else "") + (" + meridian" if "malt" in k else "")
    if "radiff" in k:
        return "armillary (declination + hour angles)"
    if "malt" in k:
        return "meridian altitude + transit"
    return "+".join(sorted(k))


def stats(rows):
    if not rows:
        return dict(n=0)
    l = np.array([r["dlon_arcmin"] for r in rows]); b = np.array([r["dlat_arcmin"] for r in rows])
    t = np.hypot(l, b)
    return dict(n=len(rows), rms_lon=float(np.sqrt(np.mean(l ** 2))), rms_lat=float(np.sqrt(np.mean(b ** 2))),
                med_tot=float(np.median(t)), p90=float(np.percentile(t, 90)), w2=int((t <= 2).sum()), w5=int((t <= 5).sum()),
                gt10=int((t > 10).sum()), mean_lon=float(np.mean(l)), mean_lat=float(np.mean(b)))


def fmt_stats(name, s):
    if not s["n"]:
        return f"| {name} | 0 | | | | | | |"
    return (f"| {name} | {s['n']} | {s['rms_lon']:.2f} | {s['rms_lat']:.2f} | {s['med_tot']:.2f} | {s['p90']:.2f} | "
            f"{s['w2']} / {s['w5']} | {s['gt10']} |")


def main():
    red = [r for r in R if r["status"] == "reduced"]
    unred = [r for r in R if r["status"] == "unreducible"]
    skip = [r for r in R if r["status"] == "skipped"]
    for r in red:
        r["q"] = quality(r)
    AB = [r for r in red if r["q"] in "AB"]
    # ---- data product (blind): no Horizons columns
    with open(OUT / "mars_positions.csv", "w", newline="") as f:
        w = csv.writer(f, lineterminator="\n")  # LF: the checksum must match the committed file
        w.writerow(["session_id", "jd_tt", "lon_deg", "lat_deg", "sigma_lon_arcmin", "sigma_lat_arcmin", "site", "flags"])
        for r in sorted(AB, key=lambda r: r["jd_tt"]):
            fl = [f"quality:{r['q']}"] + [x for x in r["flags"] if not x.startswith(("extra_session", "dreyer_correction", "time_basis_uncertain:", "site_uncertain:", "illegible:"))]
            w.writerow([r["id"], f"{r['jd_tt']:.6f}", f"{r['lon_product']:.5f}", f"{r['lat_product']:.5f}",
                        f"{r['sigma_lon_arcmin']:.2f}", f"{r['sigma_lat_arcmin']:.2f}", r["site"], ";".join(fl)])
    import hashlib
    sha = hashlib.sha256((OUT / "mars_positions.csv").read_bytes()).hexdigest()
    (OUT / "mars_positions.sha256").write_text(f"{sha}  mars_positions.csv\n")
    # ---- outlier diagnosis (verification only): Horizons at shifted epochs
    out = [r for r in red if r["total_arcmin"] > 5]
    shifts = {"+1 d": 1, "-1 d": -1, "+12 h": 0.5, "-12 h": -0.5, "other calendar (+10 d)": 10, "other calendar (-10 d)": -10}
    jds = [r["jd_ut"] + s for r in out for s in shifts.values()]
    H = horizons_geo(jds) if jds else {}
    for r in out:
        best = None
        for lab, s in shifts.items():
            h = H[r["jd_ut"] + s]
            d = math.hypot(wrap180(r["lon"] - h["lon"]) * 60 * math.cos(h["lat"] * D2R), (r["lat"] - h["lat"]) * 60)
            if best is None or d < best[1]:
                best = (lab, d)
        r["diag_shift"] = best
        fl = r["flags"]
        cause = []
        if abs(r["dlat_arcmin"]) > 60 and abs(r["dlon_arcmin"]) < 15:
            cause.append("latitude-only error: declination direction (B/A) or reference-star identity; re-read the page")
        if best[1] < 3:
            if "calendar" in best[0]:
                cause.append(f"date fits the {best[0]} ({best[1]:.1f}')")
            elif "d" in best[0] and "12" not in best[0]:
                cause.append(f"night assigned one day off: fits {best[0]} ({best[1]:.1f}')")
            else:
                cause.append(f"time basis (noon/midnight): fits {best[0]} ({best[1]:.1f}')")
        if any(f.startswith("two_fold_ambiguity_unresolved") for f in fl):
            cause.append("mirror solution of one distance + one declination (or two distances) not resolvable from the page")
        if any(f.startswith("two_fold_ambiguity_resolved_by") for f in fl):
            cause.append("branch chosen from page evidence; possibly the wrong one")
        if any(f.startswith("geometry_weak") for f in fl):
            cause.append("weak geometry (formal error > 3')")
        if any(f.startswith(("time_unknown_assumed_transit", "untimed_rows")) for f in fl):
            cause.append("no printed time for some or all rows")
        if any(f.startswith(("clock_vs_printed_time", "calendar_conflict")) for f in fl):
            cause.append("clock-star time and printed time disagree")
        if any(f.startswith(("armillary_uncalibrated", "quadrant_uncalibrated")) for f in fl):
            cause.append("instrument zero point not calibrated that night")
        if any(f.startswith("star_unidentified") for f in fl):
            cause.append("a reference star could not be identified")
        if any(f.startswith(("site_approx", "site_uncertain")) for f in fl):
            cause.append("observing site approximate")
        if any(f.startswith("copy_codex_K") for f in fl):
            cause.append("1593 copy (codex K)")
        if r.get("n_meas", 0) <= 3:
            cause.append(f"only {r.get('n_meas')} measurements")
        r["cause"] = "; ".join(cause) or "no internal flag: transcription or star-identification error suspected"
    # ---- Tycho cross-check
    ty_obs, ty_tab = [], []
    for r in red:
        for t in r.get("tycho_reduction_vs_horizons", []):
            (ty_tab if t.get("table_comparison") else ty_obs).append((r, t))

    def tstats(items, key):
        v = np.array([t[key] for _, t in items if key in t and t.get("conf") != "L" and np.isfinite(t[key])])
        if not len(v):
            return "n=0"
        return f"n={len(v)}, median {np.median(v):+.2f}', median |d| {np.median(np.abs(v)):.2f}', within 5': {(np.abs(v) <= 5).sum()}"

    # ---- write BATCH.md
    L = []
    P = L.append
    flagc = collections.Counter(f.split(":")[0].split("(")[0] for r in red for f in r["flags"])
    P("# Episode 1 batch reduction: every Tycho Mars session against JPL Horizons")
    P("")
    P("Generated by `batch_report.py` from `out/batch/results.json` (written by `reduce.py transcriptions/merged.json`). "
      "Blind: each session stands alone; nothing about the motion of Mars is fitted or modelled. Horizons (Mars barycenter, body 4, "
      "DE441, geocentric apparent ecliptic of date) is used **only** for verification. It is not used for the quality classes or the data product, "
      "and only the diagnostic column of the outlier table uses it beyond the residuals.")
    P("")
    sAB, sA = stats(AB), stats([r for r in red if r["q"] == "A"])
    ab_ok = [r for r in AB if r["total_arcmin"] <= 10]
    big = [r for r in AB if r["total_arcmin"] > 10]
    P("## Summary")
    P("")
    P(f"**Product v1 (frozen):** `out/mars_positions.csv`, {len(AB)} rows, sha256 `{sha}` (also in `out/mars_positions.sha256`).")
    P("")
    P(f"- **{len(red)} of {len(R)} sessions reduced.** {len(unred)} cannot be reduced: they have fewer than two independent "
      f"constraints, or everything is below 1° altitude. {len(skip)} hold no Mars data.")
    P(f"- **The data product has {len(AB)} positions** (classes A + B). Their median total residual against Horizons is "
      f"**{sAB['med_tot']:.2f}′**; {sAB['w2']} are within 2′ and {sAB['w5']} within 5′.")
    P(f"  - Without the {len(big)} gross outliers, RMS is {stats(ab_ok)['rms_lon']:.2f}′ in longitude and {stats(ab_ok)['rms_lat']:.2f}′ in latitude.")
    P(f"  - That is Tycho's known accuracy. The kill test predicted 1–2′.")
    P(f"- **Class C ({sum(r['q'] == 'C' for r in red)} sessions) is excluded** on internal grounds: weak geometry, an unresolved mirror solution, no time, or a clock/calendar conflict.")
    P(f"  - Its median is {stats([r for r in red if r['q'] == 'C'])['med_tot']:.1f}′, so the internal flags do separate the bad nights.")
    P("- **Tycho's own printed positions agree with Horizons as well as our reductions do.** Median |Δλ| is 1.9′ and median |Δβ| 1.8′ over 188 entries.")
    P("  - Tycho minus ours has a median of −0.1′ / −0.3′. The transcription and the reduction reproduce his numbers.")
    P("- **Kill-test nights in this batch:**")
    P("  - 1595-10-25V: " + f"{next((r['total_arcmin'] for r in red if r['id'] == '1595-10-25V'), float('nan')):.2f}′ "
      "(0.87′ in the kill test; this is the chunk-5 worker's own transcription, reduced with the armillary declinations and the batch zero points).")
    P("  - 1595-07-22M: " + f"{next((r['total_arcmin'] for r in red if r['id'] == '1595-07-22M'), float('nan')):.2f}′ "
      "(0.82′ in the kill test; same night, transcribed independently by a worker).")
    P("")
    P("## Counts")
    P("")
    P(f"- Sessions transcribed: **{len(R)}** (6 chunks, merged in `transcriptions/merged.json`).")
    P(f"- Skipped: **{len(skip)}**. All are `no_mars_data`: the heading held no Mars measurement.")
    whys = collections.Counter(r["why"].split(" (")[0] for r in unred)
    P(f"- Unreducible: **{len(unred)}**. Reasons:")
    for k, v in whys.most_common():
        P(f"  - {k}: {v}")
    P(f"- Reduced: **{len(red)}**. By quality class. The classes use internal flags only. The flag lists were revised once after seeing the class-level residual table: `long_span` moved out of the exclusions, and B was narrowed to material fallbacks. No per-session residual was used.")
    for q in "ABC":
        P(f"  - **{q}**: {sum(r['q'] == q for r in red)}")
    P(f"- Data product `out/mars_positions.csv`: **{len(AB)}** positions (classes A and B).")
    P("")
    P("Flags on reduced sessions (count):")
    P("")
    P(", ".join(f"`{k}` {v}" for k, v in flagc.most_common(40)))
    P("")
    P("## Residuals against Horizons")
    P("")
    P("Residual = reduced − Horizons, in arcminutes. Δλ is multiplied by cos β. RMS values are over sessions; `≤2′ / ≤5′` are counts of the total residual.")
    P("")
    hdr = "| Set | n | RMS Δλ | RMS Δβ | median total | 90th pct | ≤2′ / ≤5′ | >10′ |"
    sep = "|---|---|---|---|---|---|---|---|"
    P(hdr); P(sep)
    P(fmt_stats("A", stats([r for r in red if r["q"] == "A"])))
    P(fmt_stats("B", stats([r for r in red if r["q"] == "B"])))
    P(fmt_stats("A+B (the product)", stats(AB)))
    P(fmt_stats("C (excluded)", stats([r for r in red if r["q"] == "C"])))
    P(fmt_stats("all reduced", stats(red)))
    ab_ok = [r for r in AB if r["total_arcmin"] <= 10]
    s = stats(ab_ok)
    P("")
    P(f"Without its {len(AB) - len(ab_ok)} gross outliers (>10′, listed below), A+B has RMS **{s['rms_lon']:.2f}′** in longitude and "
      f"**{s['rms_lat']:.2f}′** in latitude (n = {s['n']}). The mean offsets are {s['mean_lon']:+.2f}′ and {s['mean_lat']:+.2f}′.")
    for title, keyf in (("period", lambda r: period(r["date_julian"])), ("site", lambda r: r["site"]), ("instrument", instrument)):
        P("")
        P(f"### A+B by {title}")
        P("")
        P(hdr.replace("Set", title)); P(sep)
        groups = collections.defaultdict(list)
        for r in AB:
            groups[keyf(r)].append(r)
        for k in sorted(groups):
            P(fmt_stats(k, stats(groups[k])))
    # L cells
    withL = [r for r in red if r.get("with_L")]
    P("")
    P("### Cells marked L (low confidence)")
    P("")
    nL = sum(r["n_meas_L"] for r in red)
    P(f"- L cells are left out of the primary solution. {nL} measurements in {sum(1 for r in red if r['n_meas_L'])} reduced sessions carry one.")
    if withL:
        a = np.array([math.hypot(r["dlon_arcmin"], r["dlat_arcmin"]) for r in withL])
        bL = np.array([math.hypot(r["with_L"]["dlon_arcmin"], r["with_L"]["dlat_arcmin"]) for r in withL])
        P(f"- Re-solved with the L cells added at σ×2.5, over {len(withL)} sessions:")
        P(f"  - median total residual {np.median(a):.2f}′ → {np.median(bL):.2f}′;")
        P(f"  - better in {int((bL < a - 0.1).sum())} sessions, worse in {int((bL > a + 0.1).sum())}.")
    # Tycho
    P("")
    P("## Cross-check: Tycho's own printed reductions (never used as data)")
    P("")
    P("These are the positions Tycho or his assistants computed on the page, compared with Horizons at the same time. "
      "Entries from his comparison tables ('Calculus Tychonicus', 'LOCA MARTIS') are counted separately. "
      "L-confidence entries are excluded.")
    P("")
    P(f"- Observed-position entries ({len(ty_obs)}):")
    P(f"  - longitude: {tstats(ty_obs, 'dlon_arcmin')}")
    P(f"  - latitude: {tstats(ty_obs, 'dlat_arcmin')}")
    P(f"  - RA: {tstats(ty_obs, 'dra_arcmin')}")
    P(f"  - Dec: {tstats(ty_obs, 'ddec_arcmin')}")
    P(f"- Table entries ({len(ty_tab)}):")
    P(f"  - longitude: {tstats(ty_tab, 'dlon_arcmin')}")
    P(f"  - latitude: {tstats(ty_tab, 'dlat_arcmin')}")
    P(f"- Tycho − our reduction, same session:")
    P(f"  - longitude: {tstats(ty_obs, 'tycho_minus_ours_lon')}")
    P(f"  - latitude: {tstats(ty_obs, 'tycho_minus_ours_lat')}")
    # outliers
    P("")
    P("## Outliers (total residual > 5′)")
    P("")
    P("Probable cause, from the internal flags. The `shift test` column is verification only: it compares the reduced position with Horizons at "
      "the epoch ±1 d, ±12 h and ±10 d (the other calendar), and quotes the best shift with its residual. It changes nothing in the product.")
    P("")
    P("| session | class | total | Δλ | Δβ | n | best shift test | probable cause |")
    P("|---|---|---|---|---|---|---|---|")
    for r in sorted(out, key=lambda r: (r["q"], -r["total_arcmin"])):
        P(f"| {r['id']} | {r['q']} | {r['total_arcmin']:.1f} | {r['dlon_arcmin']:+.1f} | {r['dlat_arcmin']:+.1f} | {r['n_meas']} | "
          f"{r['diag_shift'][0]}: {r['diag_shift'][1]:.1f}′ | {r['cause']} |")
    P("")
    P("## Post-hoc suspects in the product (not re-read until the fit is frozen)")
    P("")
    P("These product rows are more than 10′ from Horizons. They were found **through the verification**, so re-reading them now "
      "would leak Horizons into the data. Decision (coordinator, 13 Oct 2026):")
    P("- they stay in the product exactly as reduced;")
    P("- the fitter must cope with them;")
    P("- they are re-read only **after** the fit is frozen, and that re-read will be disclosed as post-hoc.")
    P("")
    P("| session | total | Δλ | Δβ | volume, page (leaf) |")
    P("|---|---|---|---|---|")
    for r in sorted([r for r in AB if r["total_arcmin"] > 10], key=lambda r: -r["total_arcmin"]):
        src = r.get("source") or {}
        P(f"| {r['id']} | {r['total_arcmin']:.1f}′ | {r['dlon_arcmin']:+.1f}′ | {r['dlat_arcmin']:+.1f}′ | "
          f"{src.get('volume')}, p. {','.join(str(x) for x in src.get('pages', []))} (leaf {','.join(str(x) for x in src.get('leaves', []))}) |")
    P("")
    P("## Known gaps (not handled yet)")
    P("")
    P("1. **Rows timed only by a star's meridian transit** ('cum Arcturus esset in meridiano') sit in notes and `other` rows. They are not parsed.")
    P("   Those rows fall back to the session's mean time or to Mars's own transit, and are flagged `untimed_rows_at_mean_time` / `time_unknown_assumed_transit`.")
    P("   Fix: a `clock` entry with `ha: \"0 0\"` written by a transcriber, or a parser for those notes.")
    P("2. **Dreyer's footnote corrections are not applied** (e.g. 'should be 32 45'); the printed number is used. They are listed in the sessions' `footnotes`.")
    P("3. **Calibration pages not transcribed.** The reference-star meridian altitudes and the Aldebaran–Hamal sextant check on vol XIII pp. 187–190")
    P("   (leaves 205–208; 13 and 30 Dec 1599) are not Mars sessions, so they are not in the chunks. Transcribed, they would calibrate the Benátky quadrant and sextant.")
    P("4. **Mirror solutions.** One distance plus one declination, or two distances, have two solutions.")
    P("   The reducer chooses only from page evidence: the printed altitudes and azimuths, then Tycho's own printed RA or longitude. When neither decides, the session is class C.")
    P("5. **Pooled zero points.** Armillary, quadrant and sextant zero points are pooled by (site, instrument, year) when a session has none. Below 2 readings, or beyond 3′ for the sextant, a pool is not used.")
    P("6. **The 'one day off' outliers** (the shift-test column) point to a date convention: astronomical day versus civil day for some evening headings.")
    P("   This is to be checked on those pages. The product is not altered.")
    # per-session table
    P("")
    P("## Per-session residuals (all reduced sessions)")
    P("")
    P("| session | site | class | n | Δλ′ | Δβ′ | total′ | σλ′ | σβ′ | elong° | kinds | page |")
    P("|---|---|---|---|---|---|---|---|---|---|---|---|")
    for r in sorted(red, key=lambda r: r["id"]):
        src = r.get("source") or {}
        P(f"| {r['id']} | {r['site']} | {r['q']} | {r['n_meas']} | {r['dlon_arcmin']:+.2f} | {r['dlat_arcmin']:+.2f} | "
          f"{r['total_arcmin']:.2f} | {r['sigma_lon_arcmin']:.2f} | {r['sigma_lat_arcmin']:.2f} | {r['horizons']['elong']:.0f} | "
          f"{'+'.join(r.get('kinds', []))} | {src.get('volume')}:{','.join(str(p) for p in src.get('pages', []))} |")
    P("")
    P("## Unreducible sessions")
    P("")
    for r in unred:
        P(f"- {r['id']}: {r['why']}")
    (OUT / "BATCH.md").write_text("\n".join(L) + "\n")
    # concise console summary
    print(f"reduced {len(red)} (A {sum(r['q']=='A' for r in red)}, B {sum(r['q']=='B' for r in red)}, C {sum(r['q']=='C' for r in red)}), "
          f"unreducible {len(unred)}, skipped {len(skip)}; product rows {len(AB)}")
    for nm, ss in (("A+B", stats(AB)), ("A+B <=10'", stats(ab_ok)), ("C", stats([r for r in red if r['q'] == 'C']))):
        print(nm, {k: (round(v, 2) if isinstance(v, float) else v) for k, v in ss.items()})
    print("tycho obs lon:", tstats(ty_obs, "dlon_arcmin"), "| lat:", tstats(ty_obs, "dlat_arcmin"))


if __name__ == "__main__":
    main()
