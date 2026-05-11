# Scout Animation Plan

## Current Correction

- `assets/brand/images.png` is the real transparent PNG source.
- `assets/brand/scout-sports-transparent.png` is not actually transparent and should not be used as a production mascot source.
- `assets/brand/scout-animation-lab.html` is now labeled as a motion test, not final animation.

## Why The First Lab Was Not Enough

Moving a whole PNG up, down, left, or right is motion, not character animation.
Real Scout animation needs either:

- frame-by-frame pose sheets, or
- a rigged character file in Rive.

## Recommended Near-Term Asset Set

Generate transparent PNG sprite sheets for each reaction. Each sheet should keep the same character design, line weight, card body, hands, shoes, and face.

### Football Scout

- `scout-football-run-8.png`
- `scout-football-wave-8.png`
- `scout-football-win-8.png`
- `scout-football-badbeat-8.png`

### Basketball Scout

- `scout-basketball-dribble-8.png`
- `scout-basketball-win-8.png`
- `scout-basketball-sweat-8.png`

### Hockey Scout

- `scout-hockey-shot-8.png`
- `scout-hockey-win-8.png`
- `scout-hockey-badbeat-8.png`

### Soccer Scout

- `scout-soccer-kick-8.png`
- `scout-soccer-win-8.png`
- `scout-soccer-sweat-8.png`

### Generic Reactions

- `scout-wave-8.png`
- `scout-thinking-8.png`
- `scout-lock-in-8.png`
- `scout-celebrate-8.png`

## Sprite Sheet Format

- Transparent PNG
- 8 frames wide by 1 frame tall
- Each frame: 512x512
- Full sheet: 4096x512
- Character centered with consistent feet baseline
- No background, glow, shadow, or border

## App Implementation

Build a `ScoutMascot` component that accepts:

```tsx
<ScoutMascot sport="football" reaction="run" size="md" />
```

Under the hood:

- static transparent PNGs for still states
- CSS `steps(8)` animation for sprite sheets
- later replacement with Rive if we want fully rigged motion
