#!/usr/bin/env python
"""Fetch GWOSC strain (H1, L1; 4 kHz, 4096 s) for GW250114_082203 and GW150914 (calibration).
GWOSC data are CC BY 4.0. Records URL, size, sha256, md5 into data/gwosc/CHECKSUMS.tsv."""
import os, hashlib, subprocess, datetime, json
from gwosc import locate, datasets
HERE = os.path.dirname(os.path.abspath(__file__))
DEST = os.path.abspath(os.path.join(HERE, "..", "..", "data", "gwosc")); os.makedirs(DEST, exist_ok=True)
rows = []; meta = {}
for ev in ["GW250114_082203", "GW150914"]:
    meta[ev] = {"gps": datasets.event_gps(ev)}
    for det in ["H1", "L1"]:
        urls = [u for u in locate.get_event_urls(ev, detector=det) if u.endswith(".hdf5")]
        assert len(urls) == 1, urls
        url = urls[0]; out = os.path.join(DEST, os.path.basename(url))
        if not os.path.exists(out):
            subprocess.run(["curl", "-sS", "-L", "--retry", "5", "-o", out + ".part", url], check=True)
            os.replace(out + ".part", out)
        md5, sha = hashlib.md5(), hashlib.sha256()
        with open(out, "rb") as fh:
            for ch in iter(lambda: fh.read(1 << 20), b""): md5.update(ch); sha.update(ch)
        rows.append((ev, det, os.path.basename(out), os.path.getsize(out), md5.hexdigest(), sha.hexdigest(), url))
        print(rows[-1][:4], flush=True)
with open(os.path.join(DEST, "CHECKSUMS.tsv"), "w") as fh:
    fh.write(f"# fetched {datetime.datetime.utcnow().isoformat()}Z from GWOSC (gwosc.org), license CC-BY-4.0; event GPS: {json.dumps(meta)}\n")
    fh.write("event\tifo\tfile\tbytes\tmd5\tsha256\turl\n")
    for r in rows: fh.write("\t".join(map(str, r)) + "\n")
