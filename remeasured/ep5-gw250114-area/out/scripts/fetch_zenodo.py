#!/usr/bin/env python
"""Fetch files from a Zenodo record (default: 16877102, GW250114 release, CC BY 4.0).
Usage: fetch_zenodo.py [record_id] [substring filter ...]  e.g. fetch_zenodo.py 6513631 GW150914_095045_PEDataRelease_mixed_cosmo.h5
Verifies Zenodo md5, records sha256 in data/zenodo_16877102/CHECKSUMS.tsv."""
import json, hashlib, os, sys, urllib.request, datetime, subprocess
REC = sys.argv[1] if len(sys.argv) > 1 else "16877102"
FILT = sys.argv[2:]
HERE = os.path.dirname(os.path.abspath(__file__))
DEST = os.path.abspath(os.path.join(HERE, "..", "..", "data", f"zenodo_{REC}"))
os.makedirs(DEST, exist_ok=True)
meta = json.load(urllib.request.urlopen(f"https://zenodo.org/api/records/{REC}"))
json.dump(meta, open(os.path.join(DEST, "record_metadata.json"), "w"), indent=1)
rows = []
for f in meta["files"]:
    if FILT and not any(x in f["key"] for x in FILT): continue
    key, url, md5exp = f["key"], f["links"]["self"], f["checksum"].split(":")[1]
    out = os.path.join(DEST, key)
    if not os.path.exists(out) or os.path.getsize(out) != f["size"]:
        print("downloading", key, flush=True)
        for attempt in range(10):  # resumable download (Zenodo drops long connections)
            subprocess.run(["curl", "-sS", "-L", "-C", "-", "--retry", "5", "-o", out, url])
            if os.path.exists(out) and os.path.getsize(out) == f["size"]: break
    md5, sha = hashlib.md5(), hashlib.sha256()
    with open(out, "rb") as fh:
        for chunk in iter(lambda: fh.read(1 << 20), b""):
            md5.update(chunk); sha.update(chunk)
    ok = md5.hexdigest() == md5exp
    print(key, "md5 ok" if ok else "MD5 MISMATCH", flush=True)
    if not ok: sys.exit(1)
    rows.append((key, f["size"], md5.hexdigest(), sha.hexdigest(), url))
with open(os.path.join(DEST, "CHECKSUMS.tsv"), "w") as fh:
    fh.write(f"# fetched {datetime.datetime.utcnow().isoformat()}Z from zenodo record {REC} doi:10.5281/zenodo.{REC} license {meta['metadata'].get('license',{}).get('id')}\n")
    fh.write("file\tbytes\tmd5\tsha256\turl\n")
    for r in rows: fh.write("\t".join(map(str, r)) + "\n")
