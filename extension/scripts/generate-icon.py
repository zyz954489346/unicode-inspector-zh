"""Render the geometric SVG icon to a portable 256px PNG using only Python stdlib."""
from pathlib import Path
import math
import struct
import zlib

MEDIA = Path(__file__).resolve().parent.parent / 'media'
SVG = '''<svg xmlns="http://www.w3.org/2000/svg" width="256" height="256" viewBox="0 0 256 256">
  <rect width="256" height="256" rx="48" fill="#12243a"/>
  <path d="M65 72 V119 A33 33 0 0 0 131 119 V72" fill="none" stroke="#8de6e2" stroke-width="18" stroke-linecap="round"/>
  <circle cx="166" cy="160" r="35" fill="#12243a" stroke="#ffca70" stroke-width="12"/>
  <path d="M191 185 L213 207" stroke="#ffca70" stroke-width="14" stroke-linecap="round"/>
  <circle cx="193" cy="57" r="7" fill="#8de6e2"/>
</svg>
'''

def segment(x, y, ax, ay, bx, by, radius):
    t = max(0, min(1, ((x-ax)*(bx-ax)+(y-ay)*(by-ay))/((bx-ax)**2+(by-ay)**2)))
    return (x-ax-t*(bx-ax))**2+(y-ay-t*(by-ay))**2 <= radius**2

def pixel(x, y):
    bg, cyan, gold = (18,36,58,255), (141,230,226,255), (255,202,112,255)
    dx, dy = max(48-x, 0, x-208), max(48-y, 0, y-208)
    if dx*dx+dy*dy > 48*48:
        return (0,0,0,0)
    color = bg
    if segment(x,y,65,72,65,119,9) or segment(x,y,131,72,131,119,9) or (y>=119 and abs(math.hypot(x-98,y-119)-33)<=9):
        color = cyan
    distance = math.hypot(x-166,y-160)
    if distance <= 41:
        color = gold if distance >= 29 else bg
    if segment(x,y,191,185,213,207,7):
        color = gold
    if (x-193)**2+(y-57)**2 <= 49:
        color = cyan
    return color

def chunk(kind, data):
    return struct.pack('!I', len(data))+kind+data+struct.pack('!I', zlib.crc32(kind+data)&0xffffffff)

rows = bytearray()
for y in range(256):
    rows.append(0)
    for x in range(256):
        samples = [pixel(x+(sx+.5)/3, y+(sy+.5)/3) for sy in range(3) for sx in range(3)]
        alpha = sum(p[3] for p in samples)
        # Preserve RGB on the transparent outer edge (straight alpha).
        rgb = [round(sum(p[c]*p[3] for p in samples)/alpha) if alpha else 0 for c in range(3)]
        rows.extend([*rgb, round(alpha/9)])
MEDIA.mkdir(exist_ok=True)
(MEDIA/'icon.svg').write_text(SVG)
(MEDIA/'icon.png').write_bytes(b'\x89PNG\r\n\x1a\n'+chunk(b'IHDR', struct.pack('!2I5B',256,256,8,6,0,0,0))+chunk(b'IDAT',zlib.compress(rows,9))+chunk(b'IEND',b''))
