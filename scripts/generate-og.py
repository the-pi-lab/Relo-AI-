#!/usr/bin/env python
"""
Generate the Open Graph share card: public/og.png (1200x630).

Run after any brand change so the link preview matches the live palette:
    python scripts/generate-og.py

Colours are duplicated from src/styles/theme.css on purpose — this runs in
plain Python with no build step, so it cannot import the CSS tokens.
"""

import os
from PIL import Image, ImageDraw, ImageFont

# ── brand tokens (mirror of theme.css dark block) ────────────────────
BG = "#0b0d12"
SURFACE = "#12151c"
SURFACE_2 = "#191d26"
BORDER = "#232833"
TEXT = "#e6e8ef"
TEXT_SOFT = "#9aa3b2"
TEXT_FAINT = "#626b7c"
ACCENT = "#4fbb8a"  # pine, dark-mode accent

W, H = 1200, 630
OUT = os.path.join(os.path.dirname(__file__), "..", "public", "og.png")

FONT_DIR = "C:/Windows/Fonts"
REGULAR = os.path.join(FONT_DIR, "segoeui.ttf")
SEMIBOLD = os.path.join(FONT_DIR, "seguisb.ttf")
BOLD = os.path.join(FONT_DIR, "segoeuib.ttf")


def font(path, size):
    return ImageFont.truetype(path, size)


img = Image.new("RGB", (W, H), BG)
d = ImageDraw.Draw(img)

# ── brand mark ───────────────────────────────────────────────────────
MARK = 64
MARK_X, MARK_Y = 80, 76
d.rounded_rectangle(
    [MARK_X, MARK_Y, MARK_X + MARK, MARK_Y + MARK], radius=18, fill=ACCENT
)
mark_font = font(BOLD, 34)
tb = d.textbbox((0, 0), "R.", font=mark_font)
d.text(
    (MARK_X + (MARK - (tb[2] - tb[0])) / 2 - tb[0], MARK_Y + (MARK - (tb[3] - tb[1])) / 2 - tb[1]),
    "R.",
    font=mark_font,
    fill=BG,
)

d.text((MARK_X + MARK + 18, MARK_Y + 10), "RELO", font=font(BOLD, 34), fill=TEXT)

# ── headline ─────────────────────────────────────────────────────────
head_font = font(BOLD, 76)
line1_y = 210
d.text((80, line1_y), "Instagram comments", font=head_font, fill=TEXT)

# accent line 2
line2 = "become verified DMs."
d.text((80, line1_y + 92), line2, font=head_font, fill=ACCENT)

# ── subline ──────────────────────────────────────────────────────────
sub_font = font(REGULAR, 32)
d.text((80, line1_y + 212), "On the official Meta Graph API. One flat subscription.", font=sub_font, fill=TEXT_SOFT)

# ── proof chips ──────────────────────────────────────────────────────
chips = [
    "Keyword triggers",
    "3-button DM cards",
    "Follow-gate",
    "Sent → Clicked",
]
chip_font = font(SEMIBOLD, 25)
cx, cy = 80, H - 132
for label in chips:
    w = d.textbbox((0, 0), label, font=chip_font)[2]
    d.rounded_rectangle([cx, cy, cx + w + 44, cy + 56], radius=28, fill=SURFACE_2, outline=BORDER)
    d.text((cx + 22, cy + 13), label, font=chip_font, fill=TEXT_SOFT)
    cx += w + 44 + 16

# ── footer rule + price line ─────────────────────────────────────────
d.line([(80, H - 62), (W - 80, H - 62)], fill=BORDER, width=2)
foot_font = font(SEMIBOLD, 24)
d.text((80, H - 46), "Free plan available", font=foot_font, fill=ACCENT)
right = "relo.ai"
rb = d.textbbox((0, 0), right, font=foot_font)
d.text((W - 80 - (rb[2] - rb[0]), H - 46), right, font=foot_font, fill=TEXT_FAINT)

img.save(OUT, "PNG", optimize=True)
print(f"wrote {os.path.abspath(OUT)} ({W}x{H})")
