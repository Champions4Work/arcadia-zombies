#!/usr/bin/env python3
import sys
from PIL import Image

path = sys.argv[1]
im = Image.open(path).convert("RGBA")
w, h = im.size
px = im.load()
red = 0
gold = 0
corridor = 0
dark = 0
for y in range(h):
    for x in range(w):
        r, g, b, a = px[x, y]
        if a < 32:
            continue
        if r > 160 and g < 90 and b < 90:
            red += 1
        if r > 170 and g > 120 and b < 120:
            gold += 1
        if g > 180 and b > 180 and r < 140:
            corridor += 1
        if r + g + b < 90:
            dark += 1
area = max(1, w * h)
if red < 8:
    raise SystemExit(f"FAIL red_dots={red} need>=8")
if gold < 24:
    raise SystemExit(f"FAIL gold_room={gold} need>=24")
if corridor < 6:
    raise SystemExit(f"FAIL corridor_cyan={corridor} need>=6")
if dark > area * 0.72:
    raise SystemExit(f"FAIL empty_disc dark_ratio={dark/area:.2f} max=0.72")
print(f"PASS red={red} gold={gold} corridor={corridor} dark_ratio={dark/area:.2f}")
