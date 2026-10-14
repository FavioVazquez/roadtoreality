"""Render a crop of a printed page of Newcomb (1882), Astron. Papers vol. 1, at high dpi for reading by eye.
usage: crop.py PRINTED_PAGE Y0_FRAC Y1_FRAC [X0_FRAC X1_FRAC] [DPI]
PDF page index = printed page + 31 (archive.org item astronomicalpap00newcgoog)."""
import sys, pathlib, pymupdf
here = pathlib.Path(__file__).resolve().parent.parent
pr = int(sys.argv[1]); y0, y1 = float(sys.argv[2]), float(sys.argv[3])
x0, x1 = (float(sys.argv[4]), float(sys.argv[5])) if len(sys.argv) > 5 else (0.0, 1.0)
dpi = int(sys.argv[6]) if len(sys.argv) > 6 else 300
d = pymupdf.open(here / 'data/src/vol1.pdf'); p = d[pr + 31]; r = p.rect
clip = pymupdf.Rect(r.width * x0, r.height * y0, r.width * x1, r.height * y1)
out = here / f'data/pages/c{pr}_{y0:.2f}_{y1:.2f}_{x0:.2f}_{x1:.2f}.png'
p.get_pixmap(dpi=dpi, clip=clip).save(out); print(out)
