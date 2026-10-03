#!/usr/bin/env python3
"""Subset Noto Sans JP Bold to the characters used by the game.

usage: python3 tools/subset_font.py /path/to/NotoSansJP-Bold.ttf
(the full font can be fetched from Google Fonts, SIL Open Font License 1.1)
"""
import pathlib
import sys

from fontTools import subset

root = pathlib.Path(__file__).resolve().parent.parent
chars = set(chr(c) for c in range(0x20, 0x7F))
chars |= set(chr(c) for c in range(0x3000, 0x3100))  # CJK punctuation, kana
chars |= set(chr(c) for c in range(0x30A0, 0x3100))
chars |= set(chr(c) for c in range(0xFF01, 0xFF5F))  # full width forms
chars |= set("…―ー・「」『』（）！？：／〜×−▲▼●★☆♪→←↑↓■□")
for f in list(root.rglob("*.gd")) + list(root.rglob("*.tscn")):
    chars |= set(f.read_text(encoding="utf-8"))
chars = {c for c in chars if ord(c) >= 0x20}

src = sys.argv[1]
out = root / "fonts" / "NotoSansJP-Bold.ttf"
opts = subset.Options()
opts.layout_features = ["*"]
opts.name_IDs = ["*"]
opts.name_languages = ["*"]
opts.notdef_outline = True
font = subset.load_font(src, opts)
sub = subset.Subsetter(opts)
sub.populate(text="".join(sorted(chars)))
sub.subset(font)
subset.save_font(font, str(out), opts)
print(f"{len(chars)} chars -> {out} ({out.stat().st_size // 1024} KB)")
