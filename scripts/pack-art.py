#!/usr/bin/env python3
from __future__ import annotations

import json
from pathlib import Path

from PIL import Image

ROOT = Path(__file__).resolve().parents[1]
SRC = ROOT / "art" / "az_art_v2"
OUT = ROOT / "src" / "art" / "packed"
MANIFEST = json.loads((SRC / "manifest.json").read_text())

SCALE = {
    "hero": 0.5,
    "enemy": 0.5,
    "prop": 0.45,
    "breakable": 0.45,
    "hud": 0.5,
    "fx": 0.45,
    "floor_decal": 0.4,
    "tile": 0.5,
}

SHEET_OF = {
    "hero": "actors",
    "enemy": "actors",
    "prop": "world",
    "breakable": "world",
    "fx": "world",
    "floor_decal": "world",
    "hud": "hud",
    "tile": "tile",
}

PAD = 1


def scaled(src: Image.Image, factor: float) -> Image.Image:
    w = max(1, round(src.width * factor))
    h = max(1, round(src.height * factor))
    return src.resize((w, h), Image.Resampling.LANCZOS)


def pack_sheet(items: list[tuple[str, Image.Image, dict, float]], max_w: int) -> tuple[Image.Image, dict]:
    items = sorted(items, key=lambda it: (-it[1].height, -it[1].width, it[0]))
    x = PAD
    y = PAD
    row_h = 0
    used_w = PAD
    placed: dict[str, dict] = {}
    for name, im, meta, factor in items:
        if x + im.width + PAD > max_w:
            x = PAD
            y += row_h + PAD
            row_h = 0
        ax = round(meta["anchor"]["x"] * factor)
        ay = round(meta["anchor"]["y"] * factor)
        placed[name] = {
            "x": x,
            "y": y,
            "w": im.width,
            "h": im.height,
            "ax": ax,
            "ay": ay,
        }
        x += im.width + PAD
        used_w = max(used_w, x)
        row_h = max(row_h, im.height)
    sheet = Image.new("RGBA", (max(1, used_w), max(1, y + row_h + PAD)), (0, 0, 0, 0))
    for name, im, _meta, _factor in items:
        rec = placed[name]
        sheet.paste(im, (rec["x"], rec["y"]), im)
    return sheet, placed


def main() -> None:
    OUT.mkdir(parents=True, exist_ok=True)
    buckets: dict[str, list[tuple[str, Image.Image, dict, float]]] = {
        "actors": [],
        "world": [],
        "hud": [],
        "tile": [],
    }
    sprites_out: dict[str, dict] = {}
    for name, meta in MANIFEST["sprites"].items():
        factor = SCALE[meta["category"]]
        im = Image.open(SRC / meta["file"]).convert("RGBA")
        im = scaled(im, factor)
        sheet = SHEET_OF[meta["category"]]
        buckets[sheet].append((name, im, meta, factor))

    sheets_out: dict[str, dict] = {}
    for sheet_name, items in buckets.items():
        if not items:
            continue
        if sheet_name == "tile":
            for name, im, meta, factor in items:
                path = OUT / f"{name}.webp"
                im.save(path, "WEBP", quality=64, method=6)
                sheets_out[name] = {"file": path.name, "w": im.width, "h": im.height}
                sprites_out[name] = {
                    "sheet": name,
                    "x": 0,
                    "y": 0,
                    "w": im.width,
                    "h": im.height,
                    "ax": 0,
                    "ay": 0,
                }
            continue
        max_w = 1024 if sheet_name == "hud" else 768
        sheet, placed = pack_sheet(items, max_w)
        path = OUT / f"{sheet_name}.webp"
        sheet.save(path, "WEBP", quality=64, method=6)
        sheets_out[sheet_name] = {"file": path.name, "w": sheet.width, "h": sheet.height}
        for name, rec in placed.items():
            sprites_out[name] = {"sheet": sheet_name, **rec}

    pack = {
        "scale_note": MANIFEST["scale_note"],
        "hero_px": 64,
        "sheets": sheets_out,
        "sprites": sprites_out,
    }
    (OUT / "pack.json").write_text(json.dumps(pack, indent=2) + "\n")
    (OUT / "pack.ts").write_text("export const PACK = " + json.dumps(pack, indent=2) + " as const;\n")
    sizes = {p.name: p.stat().st_size for p in OUT.glob("*.webp")}
    print(json.dumps({"sheets": sheets_out, "bytes": sizes, "total": sum(sizes.values())}, indent=2))


if __name__ == "__main__":
    main()
