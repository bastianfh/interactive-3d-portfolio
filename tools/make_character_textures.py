"""
Builds the PS1-style character textures from the reference renders in
tools/reference/ (front-view, A-pose, flat grey background).

Each crop is "unwarped" row by row so its silhouette edges land exactly on
the edges of the matching low-poly mesh (the width profiles below are the
same numbers used in src/scene/Character.tsx), then box-filtered down to a
tiny texture. three.js samples them with NearestFilter, so the texels stay
crisp and blocky.

    python3 tools/make_character_textures.py

Outputs PNGs + palette.ts into src/scene/textures/character/.
"""

from __future__ import annotations

import json
import os
import random

import numpy as np
from PIL import Image

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
REF = os.path.join(ROOT, "tools", "reference")
OUT = os.path.join(ROOT, "src", "scene", "textures", "character")
os.makedirs(OUT, exist_ok=True)

BG = 117  # flat grey background value in the renders
CX = 896  # body centre line (px)

# ── width profiles shared with Character.tsx (t = 0 bottom … 1 top) ──────────
HEAD_PROFILE = [(0, 0.35), (1 / 6, 0.82), (2 / 6, 0.93), (3 / 6, 0.97), (4 / 6, 0.98), (5 / 6, 1.0), (1, 0.73)]
HEAD_W_PX, HEAD_TOP, HEAD_CHIN = 205, 165, 465
TORSO_PROFILE = [(0, 0.77), (0.125, 0.75), (0.25, 0.735), (0.375, 0.745), (0.5, 0.8), (0.625, 0.89), (0.75, 0.98), (0.875, 0.95), (1, 0.68)]
TORSO_W_PX, TORSO_TOP, TORSO_BOTTOM = 507, 540, 1154

# vertical landmarks (px) — upper arm, forearm, hand, thigh, shin, shoe
ARM_TOP, ELBOW, WRIST, HAND_END = 610, 972, 1250, 1420
HIP, KNEE, ANKLE, FLOOR = 1226, 1709, 2204, 2313


def interp(profile, t):
    t = min(1.0, max(0.0, t))
    for (t0, v0), (t1, v1) in zip(profile, profile[1:]):
        if t <= t1:
            return v0 + (t - t0) / (t1 - t0) * (v1 - v0)
    return profile[-1][1]


def load(name):
    a = np.asarray(Image.open(os.path.join(REF, name + ".jpg")).convert("RGB")).astype(np.float32)
    mask = np.abs(a - BG).max(axis=2) > 14
    return a, mask


def runs(mask_row, min_len=6):
    out, start = [], None
    for x, v in enumerate(mask_row):
        if v and start is None:
            start = x
        elif not v and start is not None:
            if x - start > min_len:
                out.append((start, x - 1))
            start = None
    if start is not None:
        out.append((start, len(mask_row) - 1))
    return out


def unwarp(img, y0, y1, extent, out_w, out_h, ymin=0):
    """Resample rows y0…y1; each row's [xl, xr] (from `extent(y)`) → out_w texels."""
    res = np.zeros((out_h, out_w, 3), np.float32)
    for j in range(out_h):
        sy0 = max(ymin, y0 + (y1 - y0) * j / out_h)
        sy1 = max(ymin + 1, y0 + (y1 - y0) * (j + 1) / out_h)
        band = img[int(sy0) : max(int(sy1), int(sy0) + 1)].mean(axis=0)
        xl, xr = extent((sy0 + sy1) / 2)
        for i in range(out_w):
            a = xl + (xr - xl) * i / out_w
            b = xl + (xr - xl) * (i + 1) / out_w
            res[j, i] = band[int(a) : max(int(b), int(a) + 1)].mean(axis=0)
    return res


def save(arr, name):
    Image.fromarray(np.clip(arr, 0, 255).astype(np.uint8)).save(os.path.join(OUT, name + ".png"))


def mean_color(img, x0, y0, x1, y1):
    return img[y0:y1, x0:x1].reshape(-1, 3).mean(axis=0)


def hexc(c):
    return "#%02x%02x%02x" % tuple(int(round(v)) for v in c)


def noisy(base, w, h, amp, seed):
    rnd = np.random.default_rng(seed)
    arr = np.tile(np.array(base, np.float32), (h, w, 1))
    arr += rnd.normal(0, amp, (h, w, 1))
    return arr


def stretch(arr, w):
    """Nearest-resample columns of arr to width w."""
    idx = (np.arange(w) * arr.shape[1] / w).astype(int)
    return arr[:, idx]


def back_from_front(front, k):
    """Mirror the outer k columns (plain fabric, no buttons/lapels) into a full back panel."""
    half = stretch(front[:, :k], front.shape[1] // 2)
    return np.concatenate([half, half[:, ::-1]], axis=1)


def side_from_front(front, k=6, w=32):
    return stretch(front[:, :k], w)


# ── per-row extent helpers ───────────────────────────────────────────────────
def centred(profile, width_px, top, bottom):
    return lambda y: (
        CX - width_px * interp(profile, (bottom - y) / (bottom - top)) / 2,
        CX + width_px * interp(profile, (bottom - y) / (bottom - top)) / 2,
    )


def limb(mask, pick, merged_width):
    """Extent of the image-left limb (the character's right) on row y."""

    def ext(y):
        rs = runs(mask[int(y)])
        sep = [r for r in rs if pick(r)]
        if sep:
            xl, xr = sep[0]
        else:
            xl = rs[0][0]
            xr = xl + merged_width
        inset = (xr - xl) * 0.06
        return xl + inset, xr - inset

    return ext


def leg_extent(mask):
    def ext(y):
        rs = runs(mask[int(y)])
        legs = [r for r in rs if r[0] > 600 and r[1] < CX - 4]
        if legs:
            xl, xr = legs[0]
        else:
            body = next((r for r in rs if r[0] <= CX <= r[1]), rs[0])
            xl, xr = body[0], body[0] + 205
        inset = (xr - xl) * 0.05
        return xl + inset, xr - inset

    return ext


def silhouette(mask, inset=4):
    def ext(y):
        rs = runs(mask[int(y)])
        body = next((r for r in rs if r[0] <= CX <= r[1]), rs[0])
        return body[0] + inset, body[1] - inset

    return ext


# ── shared head / hair (from the shirt render) ──────────────────────────────
shirt, shirt_mask = load("shirt")
palette: dict[str, dict[str, str]] = {}

save(unwarp(shirt, HEAD_TOP, HEAD_CHIN, centred(HEAD_PROFILE, HEAD_W_PX, HEAD_TOP, HEAD_CHIN), 128, 128), "face")
save(unwarp(shirt, 150, 214, silhouette(shirt_mask, 10), 64, 32), "hair")

skin = mean_color(shirt, 880, 232, 912, 252)  # lit forehead
skin_dark = mean_color(shirt, 838, 330, 862, 346)  # shaded cheek
hair = mean_color(shirt, 870, 160, 930, 190)
palette["head"] = {"skin": hexc(skin), "skinDark": hexc(skin_dark), "hair": hexc(hair)}

# side of the head (u=0 = front edge): skin continues from the face's outer
# columns; hair above the temple line, ear, then hair down to the nape.
face = np.asarray(Image.open(os.path.join(OUT, "face.png")).convert("RGB")).astype(np.float32)
edge = np.array([face[min(r, 96), 8:16].mean(axis=0) for r in range(128)])  # mid-cheek tone per row (no jaw outline)
side = np.zeros((64, 32, 3), np.float32)
rnd = np.random.default_rng(1)
for row in range(64):
    t = 1 - row / 63
    base = edge[min(127, row * 2)]
    for u in range(32):
        f = u / 31
        hair_bottom = 0.66 - 0.12 * min(1.0, f / 0.35) if f < 0.35 else 0.54 - (f - 0.35) / 0.65 * 0.32
        if t >= hair_bottom:
            side[row, u] = hair * (0.92 + 0.12 * rnd.random())
        else:
            side[row, u] = base * (0.94 - 0.14 * f)  # turns away from the light toward the back
for row in range(int(64 * 0.45), int(64 * 0.73)):  # ear
    side[row, 13:19] = skin_dark
    side[row, 14:18] = skin_dark * 0.9
save(side, "head_side")

back = np.zeros((64, 32, 3), np.float32)
for row in range(64):
    back[row] = hair * (0.85 + 0.15 * rnd.random((32, 1))) if row < int(64 * 0.84) else skin * 0.88
save(back, "head_back")

# ── outfits ──────────────────────────────────────────────────────────────────
OUTFITS = {
    "business": dict(src="shirt", torso_bottom=TORSO_BOTTOM, watch=True),
    "suit": dict(src="suit", torso_bottom=TORSO_BOTTOM, watch=False, skirt=(TORSO_BOTTOM, 1292, 390, 465)),
    "hoodie": dict(src="hoodie", torso_bottom=1175, watch=True),
}

for name, cfg in OUTFITS.items():
    img, mask = load(cfg["src"])
    tb = cfg["torso_bottom"]

    torso = unwarp(img, TORSO_TOP, tb, centred(TORSO_PROFILE, TORSO_W_PX, TORSO_TOP, tb), 64, 80)
    save(torso, f"{name}_torso")
    plain_cols = {"business": 24, "suit": 13, "hoodie": 15}[name]

    fabric = mean_color(img, 770, 700, 800, 740)  # chest, beside the placket / lapel
    pants = mean_color(img, 700, 1500, 760, 1600)
    shoe = mean_color(img, 650, 2240, 700, 2290)
    sole = mean_color(img, 630, 2296, 720, 2306)
    p = {"fabric": hexc(fabric), "pants": hexc(pants), "shoe": hexc(shoe), "sole": hexc(sole)}

    # sides / shoulders / back: built from the plain fabric at the front's outer edge
    save(side_from_front(torso), f"{name}_torso_side")
    tback = back_from_front(torso, plain_cols)
    if name == "business":
        tback[11, :] *= 0.86  # yoke seam
    elif name == "suit":
        tback[:3, 20:44] *= 0.75  # collar
        tback[:, 31:33] *= 0.8  # centre back seam
    else:
        tback[:14, 18:46] *= 0.78  # hood shadow
    save(tback, f"{name}_torso_back")

    # pelvis front (pants), plus jacket skirt for the suit
    pel_top = 1300 if name == "suit" else tb
    pelvis = unwarp(img, pel_top, 1306, lambda y, t0=pel_top: (CX - (390 + (y - t0) / (1306 - t0) * 40) / 2, CX + (390 + (y - t0) / (1306 - t0) * 40) / 2), 64, 32)
    save(pelvis, f"{name}_pelvis")
    save(side_from_front(pelvis), f"{name}_pelvis_side")
    save(back_from_front(pelvis, 18), f"{name}_pelvis_back")
    if "skirt" in cfg:
        y0, y1, w0, w1 = cfg["skirt"]
        skirt = unwarp(img, y0, y1, lambda y: (CX - (w0 + (y - y0) / (y1 - y0) * (w1 - w0)) / 2, CX + (w0 + (y - y0) / (y1 - y0) * (w1 - w0)) / 2), 64, 24)
        save(skirt, f"{name}_skirt")
        sb = back_from_front(skirt, 12)
        sb[:, 31:33] *= 0.6  # centre vent
        save(sb, f"{name}_skirt_back")
        save(side_from_front(skirt), f"{name}_skirt_side")

    # limbs (character's right arm / leg, mirrored for the other side in 3D)
    arm = limb(mask, lambda r: r[1] < 700 and r[1] - r[0] > 40, 140)
    save(unwarp(img, ARM_TOP, ELBOW, arm, 32, 64), f"{name}_arm_upper")
    save(unwarp(img, ELBOW, WRIST, arm, 32, 64), f"{name}_arm_fore")

    leg = leg_extent(mask)
    save(unwarp(img, HIP, KNEE, leg, 32, 64, ymin=1352), f"{name}_thigh")  # above 1352 is hidden in the pelvis / crotch gap
    save(unwarp(img, KNEE, ANKLE, leg, 32, 64), f"{name}_shin")
    save(unwarp(img, 2214, FLOOR - 2, leg, 32, 16), f"{name}_shoe")

    p["watch"] = "yes" if cfg["watch"] else "no"
    palette[name] = p

with open(os.path.join(OUT, "palette.ts"), "w") as f:
    f.write("// Generated by tools/make_character_textures.py: colours sampled from the reference renders.\n")
    f.write("export const PALETTE = " + json.dumps(palette, indent=2) + " as const;\n")

print("wrote", sorted(os.listdir(OUT)))

# ── blink frame: closed lids painted over both eyes (face texture swap) ─────
face = np.asarray(Image.open(os.path.join(OUT, "face.png")).convert("RGB")).astype(np.float32)
blink = face.copy()
for cc, hw in [(35.0, 13.5), (94.5, 13.0)]:  # eye centre column, half width
    for c in range(int(cc - hw), int(cc + hw) + 1):
        k = max(0.0, 1 - ((c - cc) / hw) ** 2)
        half = 2.6 * k ** 0.5
        if half < 0.4:
            continue
        lid = (0.55 * face[55, c] + 0.45 * face[64, c]) * 0.9  # eye-socket tone above, cheek below
        top, bot = int(round(59 - half)), int(round(60.6 + half * 0.75))
        blink[top:bot, c] = lid
        lash = int(round(60.4 + 0.9 * k))  # closed lid line dips slightly in the middle
        blink[lash, c] = face[lash, c] * 0.25 + lid * 0.35
save(blink, "face_blink")

# ── extra outfits for the Experience station ─────────────────────────────────
# No renders exist for these, so they are derived from the reference crops:
# the fold shading is kept and recoloured, then details are painted on top.
from PIL import ImageDraw, ImageFilter, ImageFont


def load_out(name):
    return np.asarray(Image.open(os.path.join(OUT, name + ".png")).convert("RGB")).astype(np.float32)


def rgb(h):
    h = h.lstrip("#")
    return np.array([int(h[i : i + 2], 16) for i in (0, 2, 4)], np.float32)


def lum(a):
    return a[..., 0] * 0.299 + a[..., 1] * 0.587 + a[..., 2] * 0.114


def recolor(src, target, contrast=1.0, cap=1.5):
    """Keep the source's light/shade pattern, swap its colour."""
    n = lum(src) / max(1.0, lum(src).mean())
    n = np.clip(n, 0.2, cap) ** contrast
    return np.clip(rgb(target) * n[..., None], 0, 255)


def blurred(name, size, radius):
    im = Image.open(os.path.join(OUT, name + ".png")).convert("RGB").resize(size, Image.BILINEAR)
    return np.asarray(im.filter(ImageFilter.GaussianBlur(radius))).astype(np.float32)


def resample_rows(arr, h):
    idx = (np.arange(h) * arr.shape[0] / h).astype(int)
    return arr[idx]


def crew_neck(arr, skin_rgb, rib_rgb, cx, rx, ry):
    h, w = arr.shape[:2]
    for y in range(int(ry) + 2):
        for x in range(w):
            d = ((x - cx) / rx) ** 2 + (y / ry) ** 2
            if d < 1:
                arr[y, x] = skin_rgb * (0.85 + 0.1 * (y / ry))
            elif d < 1.45:
                arr[y, x] = rib_rgb
    return arr


def knit(arr, amt=0.08):
    arr = arr.copy()
    arr[:, ::2] *= 1 - amt
    return arr


def font(size):
    for f in ("DejaVuSerif-Bold.ttf", "/usr/share/fonts/truetype/dejavu/DejaVuSerif-Bold.ttf", "Georgia Bold.ttf", "arialbd.ttf"):
        try:
            return ImageFont.truetype(f, size)
        except OSError:
            continue
    return ImageFont.load_default(size)


def varsity_graphic(w, h, word, color, outline):
    """Original arched varsity lettering + a basketball emblem, drawn at 4x then reduced."""
    S = 4
    img = Image.new("RGBA", (w * S, h * S), (0, 0, 0, 0))
    d = ImageDraw.Draw(img)
    f = font(int(12 * S))
    cx, cy, radius = w * S / 2, h * S * 1.1, w * S * 1.05
    span = 0.62  # radians covered by the arch
    for i, ch in enumerate(word):
        a = -span / 2 + span * (i + 0.5) / len(word)
        x = cx + radius * np.sin(a)
        y = cy - radius * np.cos(a)
        glyph = Image.new("RGBA", (f.size * 2, f.size * 2), (0, 0, 0, 0))
        gd = ImageDraw.Draw(glyph)
        gd.text((f.size, f.size), ch, font=f, fill=color, anchor="mm", stroke_width=S, stroke_fill=outline)
        glyph = glyph.rotate(-np.degrees(a), resample=Image.BICUBIC)
        img.alpha_composite(glyph, (int(x - glyph.width / 2), int(y - glyph.height / 2)))
    # basketball emblem below the arch
    bx, by, br = w * S / 2, h * S * 0.46, 11 * S
    d.ellipse([bx - br, by - br, bx + br, by + br], fill="#e0782c", outline="#0d0d0d", width=S)
    d.line([bx - br, by, bx + br, by], fill="#0d0d0d", width=S)
    d.line([bx, by - br, bx, by + br], fill="#0d0d0d", width=S)
    d.arc([bx - br * 1.6, by - br, bx - br * 0.2, by + br], -60, 60, fill="#0d0d0d", width=S)
    d.arc([bx + br * 0.2, by - br, bx + br * 1.6, by + br], 120, 240, fill="#0d0d0d", width=S)
    return img.resize((w, h), Image.LANCZOS)


skin_c = rgb(palette["head"]["skin"])
skin_strip = load_out("business_arm_fore")[22:]  # forearm skin with its shading
DENIM = "#34496b"

def denim(name):
    a = recolor(load_out(name), DENIM, contrast=1.1)
    rnd = np.random.default_rng(len(name))
    a *= 1 + rnd.normal(0, 0.035, (a.shape[0], a.shape[1], 1))  # twill streaks
    a[:, ::3] *= 0.95
    return a


def save_panels(prefix, front, plain_cols):
    save(front, f"{prefix}_torso")
    save(side_from_front(front, k=max(4, front.shape[1] // 12)), f"{prefix}_torso_side")
    save(back_from_front(front, plain_cols), f"{prefix}_torso_back")


def save_pelvis(prefix, pel):
    save(pel, f"{prefix}_pelvis")
    save(side_from_front(pel), f"{prefix}_pelvis_side")
    save(back_from_front(pel, 18), f"{prefix}_pelvis_back")


# athletics: black tee with an original varsity graphic, jeans, white sneakers
TEE = "#1d1e22"
tee = recolor(blurred("business_torso", (128, 160), 2.2), TEE, contrast=0.9)
tee[118:] = tee[112]  # no belt line under a loose tee
tee = crew_neck(tee, skin_c, rgb("#2a2b30"), 64, 17, 9)
g = np.asarray(varsity_graphic(128, 160, "ATHLETICS", "#2f8fe0", "#0b2f57")).astype(np.float32)
alpha = g[..., 3:4] / 255
tee = tee * (1 - alpha) + g[..., :3] * alpha
save_panels("athletics", tee, 18)
save_pelvis("athletics", denim("business_pelvis"))
sleeve = recolor(load_out("hoodie_arm_upper"), TEE, contrast=0.9)
upper = np.concatenate([sleeve[:27], np.tile(rgb("#141518"), (2, 32, 1)), resample_rows(skin_strip, 35)])
save(upper, "athletics_arm_upper")
save(resample_rows(skin_strip, 64), "athletics_arm_fore")
save(denim("business_thigh"), "athletics_thigh")
save(denim("business_shin"), "athletics_shin")
save(recolor(load_out("hoodie_shoe"), "#d6d6d1", contrast=0.7), "athletics_shoe")
palette["athletics"] = {"fabric": TEE, "pants": DENIM, "shoe": "#d6d6d1", "sole": "#efefea", "watch": "no"}

# waiter: black dress shirt (placket + buttons kept from the oxford), black trousers
SHIRT = "#1f1f23"
src = load_out("business_torso")
w_t = recolor(src, SHIRT, contrast=1.15, cap=1.6)
skinmask = (src[..., 0] > src[..., 2] + 25) & (np.arange(80)[:, None] < 14)  # keep the neck skin in the open collar
w_t[skinmask] = src[skinmask]
save_panels("waiter", w_t, 24)
save_pelvis("waiter", recolor(load_out("business_pelvis"), "#18181b", contrast=1.1))
save(recolor(load_out("suit_arm_upper"), SHIRT, contrast=1.1, cap=1.3), "waiter_arm_upper")
save(recolor(load_out("suit_arm_fore"), SHIRT, contrast=1.1, cap=1.3), "waiter_arm_fore")
save(recolor(load_out("suit_thigh"), "#18181b", contrast=1.1), "waiter_thigh")
save(recolor(load_out("suit_shin"), "#18181b", contrast=1.1), "waiter_shin")
save(recolor(load_out("suit_shoe"), "#141414", contrast=1.2), "waiter_shoe")
palette["waiter"] = {"fabric": SHIRT, "pants": "#18181b", "shoe": "#141414", "sole": "#0b0b0b", "watch": "no"}

# casual (kindergarten): knit crew-neck sweater, jeans, brown shoes
SWEATER = "#5d6b7a"
sw = recolor(blurred("business_torso", (128, 160), 2.6), SWEATER, contrast=0.85)
sw[116:] = sw[110]  # sweater hangs over the belt
sw = knit(sw, 0.07)
sw = crew_neck(sw, skin_c, rgb("#4c5866"), 64, 16, 8)
sw[-10:] = knit(sw[-10:] * 0.86, 0.15)  # ribbed hem
save_panels("casual", sw, 30)
save_pelvis("casual", denim("business_pelvis"))
save(knit(recolor(load_out("hoodie_arm_upper"), SWEATER, contrast=0.9), 0.07), "casual_arm_upper")
save(knit(recolor(load_out("hoodie_arm_fore"), SWEATER, contrast=0.9), 0.07), "casual_arm_fore")
save(denim("business_thigh"), "casual_thigh")
save(denim("business_shin"), "casual_shin")
save(recolor(load_out("business_shoe"), "#5a3b28", contrast=1.0), "casual_shoe")
palette["casual"] = {"fabric": SWEATER, "pants": DENIM, "shoe": "#5a3b28", "sole": "#24170f", "watch": "yes"}

with open(os.path.join(OUT, "palette.ts"), "w") as f:
    f.write("// Generated by tools/make_character_textures.py: colours sampled from the reference renders.\n")
    f.write("export const PALETTE = " + json.dumps(palette, indent=2) + " as const;\n")
