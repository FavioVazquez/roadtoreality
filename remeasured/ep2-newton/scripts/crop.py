"""crop.py <image> <out> <x0f> <y0f> <x1f> <y1f> [maxw]: crop by fractions of width/height for reading on screen."""
import sys
from PIL import Image
im = Image.open(sys.argv[1]); W, H = im.size
x0, y0, x1, y1 = (float(v) for v in sys.argv[3:7])
c = im.crop((int(x0*W), int(y0*H), int(x1*W), int(y1*H)))
mw = int(sys.argv[7]) if len(sys.argv) > 7 else 1600
if c.width > mw: c = c.resize((mw, int(c.height*mw/c.width)))
c.save(sys.argv[2], quality=90)
