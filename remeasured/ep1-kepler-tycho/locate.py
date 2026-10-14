"""Locate text in Dreyer's Opera Omnia OCR and map it to archive.org page index, leaf and printed page.

Usage: python3 -I locate.py VOL REGEX [max_hits]
  VOL is 10..13. Reads data/ocr/v{VOL}_search.txt and v{VOL}_pageidx.json (archive.org hOCR
  search text + page index) and v{VOL}_scandata.xml / v{VOL}_pages.json.
The hOCR page index equals the scan leaf number (checked against the page images: hOCR page 491 of
vol 12 holds the text of printed p. 441 = leaf 491). The image URL index n is the position of that
leaf in page_numbers.json (https://archive.org/download/<id>/page/n<N>.jpg).
Prints: leaf, image index n, printed page (archive.org's detection, verify on the image), match.
"""
import json, re, sys, pathlib

HERE = pathlib.Path(__file__).resolve().parent
OCR = HERE / "data" / "ocr"


def load(vol):
    text = (OCR / f"v{vol}_search.txt").read_text(encoding="utf-8")
    idx = json.load(open(OCR / f"v{vol}_pageidx.json"))
    pages = json.load(open(OCR / f"v{vol}_pages.json"))["pages"]
    pn = {p["leafNum"]: p["pageNumber"] for p in pages}
    nidx = {p["leafNum"]: i for i, p in enumerate(pages)}
    return text, idx, nidx, pn


def page_of(idx, off):
    for i, (a, b, *_rest) in enumerate(idx):
        if a <= off < b:
            return i
    return None


def main():
    vol = int(sys.argv[1]); rx = re.compile(sys.argv[2]); mx = int(sys.argv[3]) if len(sys.argv) > 3 else 50
    text, idx, nidx, pn = load(vol)
    for k, m in enumerate(rx.finditer(text)):
        if k >= mx:
            break
        leaf = page_of(idx, m.start())
        ctx = text[max(0, m.start() - 60): m.end() + 60].replace("\n", " ")
        print(f"v{vol} leaf{leaf} n{nidx.get(leaf)} p.{pn.get(leaf, '?')} | {ctx}")


if __name__ == "__main__":
    main()
