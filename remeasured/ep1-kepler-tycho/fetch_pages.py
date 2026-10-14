"""Download the page images a transcriber needs (gitignored data/pages/), and optionally crop a region at full size.

  data/.venv/bin/python -I fetch_pages.py --chunk 3            every leaf in chunk 3 plus the next leaf
  data/.venv/bin/python -I fetch_pages.py --leaf 12 497         one leaf (volume, leaf)
  data/.venv/bin/python -I fetch_pages.py --crop 12 497 0.5 0.3 1.0 0.6
        crop of leaf 497, vol 12: x0 y0 x1 y1 as fractions of the page, saved at full resolution (x2 upscale)
        into data/crops/ -- read numbers on crops, never on the downscaled full page.
Files: data/pages/v{vol}_leaf{leaf}.jpg ; the image index n comes from the archive.org page_numbers.json.
"""
import json, pathlib, subprocess, sys

HERE = pathlib.Path(__file__).resolve().parent
DATA = HERE / "data"


def n_of(vol, leaf):
    pages = json.load(open(DATA / "ocr" / f"v{vol}_pages.json"))["pages"]
    for i, p in enumerate(pages):
        if p["leafNum"] == leaf:
            return i, p["pageNumber"]
    return None, None


def get(vol, leaf):
    n, pg = n_of(vol, leaf)
    if n is None:
        print(f"vol {vol} leaf {leaf}: not in page_numbers.json"); return None
    out = DATA / "pages" / f"v{vol}_leaf{leaf}.jpg"
    if not out.exists() or out.stat().st_size < 10000:
        out.parent.mkdir(parents=True, exist_ok=True)
        url = f"https://archive.org/download/operaomniaedidit{vol}brahuoft/page/n{n}.jpg"
        for _ in range(4):
            if subprocess.run(["/usr/bin/curl", "-sfL", "-m", "120", "-o", str(out), url]).returncode == 0:
                break
    print(f"vol {vol} leaf {leaf} n{n} (printed page guess {pg}) -> {out}")
    return out


def crop(vol, leaf, x0, y0, x1, y1):
    from PIL import Image
    src = get(vol, leaf)
    im = Image.open(src)
    w, h = im.size
    c = im.crop((int(x0 * w), int(y0 * h), int(x1 * w), int(y1 * h)))
    c = c.resize((c.width * 2, c.height * 2))
    out = DATA / "crops" / f"v{vol}_leaf{leaf}_{x0:.2f}_{y0:.2f}_{x1:.2f}_{y1:.2f}.png"
    out.parent.mkdir(parents=True, exist_ok=True)
    c.save(out)
    print(out)


def main():
    a = sys.argv[1:]
    if a and a[0] == "--chunk":
        wl = json.load(open(HERE / "WORKLIST.json"))
        leaves = sorted({(s["volume"], s["leaf"]) for s in wl["sessions"] if s["chunk"] == int(a[1])}
                        | {(s["volume"], s["leaf"] + 1) for s in wl["sessions"] if s["chunk"] == int(a[1])})
        for v, l in leaves:
            get(v, l)
    elif a and a[0] == "--leaf":
        get(int(a[1]), int(a[2]))
    elif a and a[0] == "--crop":
        crop(int(a[1]), int(a[2]), *map(float, a[3:7]))
    else:
        print(__doc__)


if __name__ == "__main__":
    main()
