# Project Context & Handoff Notes

## What This Project Is
A Vite-based landing page for **Soverin**. The hero section has a **pixel-art animated background** rendered entirely from JavaScript on a `<canvas>` — no network image fetch at runtime.

---

## Background Rendering Architecture

### The Key Idea
The background image (`assets/nature_bg.jpg`, original size `1376x768`) is **NOT loaded by the browser at runtime**. Instead:

1. A Python script (`compress_bg_pure.py` in the scratch dir) downsamples the original `1376x768` JPG to `640x360` using **Lanczos resampling**, then quantizes it to **32 colors**.
2. It writes the entire pixel index string + palette into `assets/nature_bg_data.js` as an exported ES6 module.
3. `app.js` imports `BG_WIDTH`, `BG_HEIGHT`, `BG_PALETTE`, and `BG_PIXELS` from that module.
4. In the render loop, `app.js` decodes each screen pixel's color from the palette lookup and draws it to the canvas using `ImageData`.

### Scale Factor
- `scale = 2` — the canvas maps 1 source pixel → 2×2 screen pixels, giving a crisp retro pixel-art look.
- The canvas is sized to `window.innerWidth / scale` × `window.innerHeight / scale`.

---

## Current In-Progress Work: Tree Shaking (Test Mode)

### Goal
Prove pixel-level control works by making **only the tree** (trunk + foliage) shake violently left/right, while everything else stays static.

### Problem Being Debugged
The tree segmentation mask keeps capturing the wrong region. The current code in `app.js` around line 623 uses `rawSrcX` and `rawSrcY` (source grid coordinates in the `640x360` downsampled image) to classify which pixels belong to the tree.

### The Tree's Location in the 640×360 Source Grid
From ASCII analysis of the original image (see scan in conversation), the tree is visible in the **left-center portion** of the image. Here is what the scene looks like in ASCII (G=green foliage, D=dark trunk, B=blue sky/mountains, .=warm sky):

```
y=120:  .. ......BBBBBBBBDDDBDDDDDGBGBDDBDGBGBBB......
y=132: BBB BB BB BBBB...BBBDDDDDDDGGDDDDDDDBG. .
y=144:    D      .......DDDDDDDDDDGGBDG DDBGG  B
y=156:    D           .DDDDDBDBDDGDDDDDDGGDDG   ...
y=168: .G DGD.  ..  ....DDDGDDDDDDBDDDDDDDDDD...
y=180: DGDGGDD...........BDDDDDDDDDDDDDDDBBB.....
y=192: DDDGDGGDGGD ......DDDDDDD.DD.DDDDDGB....
y=204: GGGGGGGGGDDG........GD...DDD .....
y=216: GGGGGGGGGGGGGGGGG.....
```

- Each character = 8 pixels wide × 12 pixels tall
- The `D` and `G` cluster near x=0..40 characters (i.e., x ≈ 0..320 in 640px space) is the **hill/ground**, NOT the tree
- The actual **tree trunk** appears to be around **x=8..40 chars = pixel x ≈ 64..320**, **y=72..180 = pixel y ≈ 60..180** based on where the D and G cluster densely on the LEFT side

### ⚠️ Key Issue: Wrong Reference Image
Previous attempts used `assets/nature_bg_padded.jpg` (5118×2856 — a padded version) instead of the **original** `assets/nature_bg.jpg` (1376×768). This has now been corrected. All analysis and the current `nature_bg_data.js` are based on the **original `1376x768` image**.

### Current app.js Tree Segmentation Logic (around line 623)
```js
const rawIsBlue = (rawB > rawR && rawB > rawG * 0.9);
const rawIsGreen = (rawG > rawR * 0.9 && rawG > rawB * 0.9 && rawG > 40);

let isTree = (rawSrcX < 130 && rawSrcY < 235 && rawSrcY > 120 && rawBrightness < 0.48 && !rawIsBlue);
if (isTree && rawSrcY > 190 && rawIsGreen) {
  isTree = false;
}

if (isTree) {
  dx += Math.sin(frame * 0.8) * 15; // Violent left-right shake
}
```

### What Still Needs Fixing
The user said: **"the tree is not even remotely selected, you have selected way too much to the left"** — meaning the bounding box `rawSrcX < 130` is still too broad and capturing background/hill pixels. The tree trunk itself is a much narrower structure.

**Next step**: Look at the user's screen recording at `/Users/jaychauhan/Downloads/Screen Recording 2026-07-20 at 4.23.32 PM.mov` to see exactly what is shaking vs what should be shaking. Then tighten `rawSrcX` and `rawSrcY` ranges to precisely isolate the tree.

A better approach may be to **use color alone** rather than spatial bounds — the tree has very specific palette colors:
- `Color 18: [26, 69, 49]` — dark green foliage  
- `Color 19: [26, 63, 31]` — dark green foliage  
- `Color 28: [7, 18, 9]` — almost-black trunk/shadow  
- `Color 29: [3, 8, 4]` — almost-black trunk  
- `Color 30: [2, 3, 2]` — almost-black trunk  
- `Color 13: [68, 109, 75]` — medium green foliage  
- `Color 10: [97, 126, 75]` — light green foliage  

The problem is these same greens also appear in the grass hill. A combined color + tight spatial bound is needed.

---

## Other Animations (Currently Disabled for Tree Test)

Before the tree test, the following animations were active and should be restored after:
1. **Grass Hill Sway** — subtle back/forth on `y > h * 0.55`, amplitude 1.8, speed 2x base
2. **Foreground Plants** — LEFT (`x < w * 0.30 && y > h * 0.68`) and RIGHT (`x > w * 0.72 && y > h * 0.70`) plant clusters → **must stay STATIC** (user explicitly requested no sway)
3. **Lake Ripples** — bottom-right water area (`y > h * 0.60 && x > w * 0.32`), horizontal + vertical ripple warp

---

## User Preferences & Constraints

- **No fluid warp** on the tree — user wants the actual pixels to move horizontally, not a CSS/fluid effect
- **No sway on foreground plants** — they must be completely static
- **Grass dither highlights must NOT shimmer** — they were flickering too much previously
- **Crisp pixels, not blocky** — scale=2 was chosen specifically for this; do NOT increase it back to 3
- **Do NOT use the padded image** — only `nature_bg.jpg` (1376×768 original)
- **No CSS image-rendering tricks** — everything is native canvas pixel manipulation

---

## File Locations

| File | Purpose |
|------|---------|
| `app.js` | Main render loop, pixel drawing, tree segmentation |
| `assets/nature_bg.jpg` | Original source image (1376×768) — used ONLY by compress script |
| `assets/nature_bg_data.js` | Generated pixel data (640×360, 32-color palette) imported by app.js |
| `index.html` | No image tag — canvas only |
| `~/.gemini/antigravity-cli/brain/5e7ed417-.../scratch/compress_bg_pure.py` | Script that generates nature_bg_data.js from nature_bg.jpg |

---

## GitHub Repo
`https://github.com/JayChauhan2/soverin-new-landing` (branch: `main`)
