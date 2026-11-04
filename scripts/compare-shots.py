#!/usr/bin/env python3
from pathlib import Path
from PIL import Image, ImageDraw, ImageFont

ROOT = Path(__file__).resolve().parents[1]
DEST = ROOT / "docs" / "reviews" / "world-props"
PLAY = DEST / "phone_390_play.png"
PAIRS = (
    (ROOT / "docs" / "target_look.jpg", "compare_390_ref1.png", "target_look.jpg"),
    (ROOT / "docs" / "target_look2.png", "compare_390_ref2.png", "target_look2.png"),
)

def fit_height(im: Image.Image, height: int) -> Image.Image:
    w = max(1, round(im.width * (height / im.height)))
    return im.convert("RGBA").resize((w, height), Image.Resampling.LANCZOS)

def pair(play: Image.Image, ref: Image.Image, label: str) -> Image.Image:
    h = 844
    live = fit_height(play, h)
    if live.width != 390:
        live = live.resize((390, h), Image.Resampling.LANCZOS)
    other = fit_height(ref, h)
    gap = 16
    canvas = Image.new("RGBA", (live.width + gap + other.width, h + 36), (16, 12, 10, 255))
    canvas.paste(live, (0, 36), live)
    canvas.paste(other, (live.width + gap, 36), other)
    draw = ImageDraw.Draw(canvas)
    font = ImageFont.load_default()
    draw.text((12, 10), "live 390x844", fill=(246, 241, 230, 255), font=font)
    draw.text((live.width + gap + 12, 10), label, fill=(246, 241, 230, 255), font=font)
    return canvas.convert("RGB")

def main() -> None:
    DEST.mkdir(parents=True, exist_ok=True)
    play = Image.open(PLAY)
    for ref, name, label in PAIRS:
        out = DEST / name
        pair(play, Image.open(ref), label).save(out, "PNG")
        print(f"wrote {out}")

if __name__ == "__main__":
    main()
