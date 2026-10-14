#!/usr/bin/env python
"""Fetch GWOSC 16 kHz strain (H1, L1; O1 LOSC_16_V1, 4096 s) for GW150914 — same release as the 4 kHz LOSC_4_V1 files,
so the only difference for the Task-2 check is the sampling rate. CC BY 4.0. Writes data/gwosc/CHECKSUMS_16k.tsv."""
import os, hashlib, subprocess, datetime
from gwosc import locate
DEST = os.path.abspath(os.path.join(os.path.dirname(os.path.abspath(__file__)), "..", "..", "data", "gwosc"))
rows = []
for det in ["H1", "L1"]:
    url = [u for u in locate.get_event_urls("GW150914", detector=det, sample_rate=16384, duration=4096) if u.endswith(".hdf5")][0]
    out = os.path.join(DEST, os.path.basename(url))
    if not os.path.exists(out):
        subprocess.run(["curl", "-sS", "-L", "--retry", "5", "-C", "-", "-o", out + ".part", url], check=True); os.replace(out + ".part", out)
    md5, sha = hashlib.md5(), hashlib.sha256()
    with open(out, "rb") as fh:
        for ch in iter(lambda: fh.read(1 << 20), b""): md5.update(ch); sha.update(ch)
    rows.append(("GW150914", det, os.path.basename(out), os.path.getsize(out), md5.hexdigest(), sha.hexdigest(), url)); print(rows[-1][:4], flush=True)
with open(os.path.join(DEST, "CHECKSUMS_16k.tsv"), "w") as fh:
    fh.write(f"# fetched {datetime.datetime.now(datetime.timezone.utc).isoformat()} from GWOSC, license CC-BY-4.0\nevent\tifo\tfile\tbytes\tmd5\tsha256\turl\n")
    for r in rows: fh.write("\t".join(map(str, r)) + "\n")
