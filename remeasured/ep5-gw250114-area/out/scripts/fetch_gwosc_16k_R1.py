#!/usr/bin/env python
"""Fetch GWOSC 16 kHz strain (H1, L1; GWTC-1 release GWOSC_16KHZ_R1-1126257415-4096) for GW150914 — the files named in the [data] section of
Isi & Farr 2023 config-ds8.ini (Zenodo 7597043), for the Task-3 reproduction. CC BY 4.0. Writes data/gwosc/CHECKSUMS_16k_R1.tsv."""
import os, hashlib, subprocess, datetime
from gwosc import locate
DEST = os.path.abspath(os.path.join(os.path.dirname(os.path.abspath(__file__)), "..", "..", "data", "gwosc"))
rows = []
for det in ["H1", "L1"]:
    url = [u for u in locate.get_event_urls("GW150914", detector=det, sample_rate=16384, duration=4096, catalog="GWTC-1-confident", version=3) if u.endswith(".hdf5")][0]
    out = os.path.join(DEST, os.path.basename(url))
    if not os.path.exists(out):
        subprocess.run(["curl", "-sS", "-L", "--retry", "5", "-C", "-", "-o", out + ".part", url], check=True); os.replace(out + ".part", out)
    md5, sha = hashlib.md5(), hashlib.sha256()
    with open(out, "rb") as fh:
        for ch in iter(lambda: fh.read(1 << 20), b""): md5.update(ch); sha.update(ch)
    rows.append(("GW150914", det, os.path.basename(out), os.path.getsize(out), md5.hexdigest(), sha.hexdigest(), url)); print(rows[-1][:4], flush=True)
with open(os.path.join(DEST, "CHECKSUMS_16k_R1.tsv"), "w") as fh:
    fh.write(f"# fetched {datetime.datetime.now(datetime.timezone.utc).isoformat()} from GWOSC, license CC-BY-4.0\nevent\tifo\tfile\tbytes\tmd5\tsha256\turl\n")
    for r in rows: fh.write("\t".join(map(str, r)) + "\n")
