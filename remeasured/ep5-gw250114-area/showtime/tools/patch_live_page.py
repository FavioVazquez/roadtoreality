"""Fix two lines showtime 0.4.4's X-ray live page hard-codes for a filmed clip (logged in v045/ROAD-FINDINGS.md):
the 'Measured: ... from the clip's own sound' sentence (here the events come from the strain data, not the sound)
and the 'commands it runs' list (here: analyze is not used; the binary mechanism is not in the library)."""
import json
import sys

path = sys.argv[1]
s = open(path, encoding="utf-8").read()
old_sentence = "'’s frame, from the clip’s own sound. '"
new_sentence = "'’s frame, from the recorded strain (positive peaks 5σ out of the noise), not from the sound. '"
if old_sentence in s:
    s = s.replace(old_sentence, new_sentence)
old_cmds = ('"commands":["showtime xray analyze clip.mp4 --job xray-binary","showtime new xray xray-binary/project '
            '--mechanism binary --layout split --theme dark","showtime render xray-binary/project --job xray-binary",'
            '"showtime xray verify xray-binary"]')
new_cmds = '"commands":' + json.dumps([
    "showtime job init xray-gw",
    "showtime new xray <job>/project --layout split --theme dark   # then replace mechanism.js with the binary",
    "python tools/gw_xray_data.py strain.csv <job>/project   # events, sound and trace from the data",
    "cp <job>/project/xray.json <job>/xray/xray.json",
    "showtime render <job>/project --job <job>",
    "showtime xray verify <job>",
], ensure_ascii=False)
if old_cmds in s:
    s = s.replace(old_cmds, new_cmds)
assert new_sentence in s and new_cmds in s
# the project's own @font-face files (the sigma fallback) are not packed by the export, and the page's CSP blocks them
import base64, os, re
proj = sys.argv[2]
def inline(m):
    f = os.path.join(proj, m.group(1))
    return 'url("data:font/woff2;base64,%s")' % base64.b64encode(open(f, "rb").read()).decode()
s, n = re.subn(r'url\("(fonts/noto-sans-mono/[^"]+\.woff2)"\)', inline, s)
print("inlined", n, "font url(s)")
open(path, "w", encoding="utf-8").write(s)
print("patched", path)
