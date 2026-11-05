"""Fail if belt cargo crop lacks amber glow or reads as tan cardboard crates."""
from PIL import Image
import sys

path = sys.argv[1]
im = Image.open(path).convert("RGBA")
w, h = im.size
px = im.load()
glow = cardboard = 0
for y in range(h):
    for x in range(w):
        r, g, b, a = px[x, y]
        if a < 140:
            continue
        if r > 185 and g > 105 and b < 135 and r > b + 55:
            glow += 1
            continue
        if (
            145 < r < 205
            and 118 < g < 168
            and 95 < b < 145
            and abs(r - g) < 28
            and g - b < 45
        ):
            cardboard += 1
print(f"amber={glow} cardboard={cardboard} size={w}x{h}")
ok = glow >= 550 and cardboard < 220
sys.exit(0 if ok else 1)
