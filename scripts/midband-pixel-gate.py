"""Fail if midband crop lacks blue tanks or still has cyan pads."""
from PIL import Image
import sys

path = sys.argv[1]
im = Image.open(path).convert("RGBA")
w, h = im.size
px = im.load()
cyan = blue = yellow = 0
for y in range(h):
    for x in range(w):
        r, g, b, a = px[x, y]
        if a < 200:
            continue
        if (
            r < 130
            and g > 200
            and b > 200
            and g >= b - 8
            and abs(g - b) < 36
            and (g + b) / 2 > r + 60
        ):
            cyan += 1
        if b > 150 and r < 100 and g < 140 and b > g + 40 and b > r + 80:
            blue += 1
        if r > 180 and g > 140 and b < 100 and r > b + 80:
            yellow += 1
print(f"cyan={cyan} blue={blue} yellow={yellow} size={w}x{h}")
ok = cyan == 0 and blue >= 200
sys.exit(0 if ok else 1)
