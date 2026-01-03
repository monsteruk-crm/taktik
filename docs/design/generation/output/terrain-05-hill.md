Generate a single isometric tactical terrain TILE for a deterministic, turn-based, grid-based military board game.

05 — HILL
TERRAIN: HILL
Top face uses stepped elevation bands:
- 3–5 nested diamond or angular contour plates
- clean hard-edged terraces
  No gradients. No slope shading. Elevation is implied by discrete steps only.


REFERENCE ANGLE (MUST MATCH)
Match the classic isometric board angle shown in the provided reference screenshot:
- true isometric projection (30°/30°)
- diamond top face
- left + right side faces visible
- no perspective / no vanishing point

STYLE (HARD CONSTRAINTS)
Brutalist + Constructivist military command console.
Cold-war operational board model.
Diagrammatic, abstract, symbolic.
Manufactured, not illustrative.

TILE FORM (FLAT BASED TILE)
- One single tile only (not a full map)
- Isometric slab with a diamond top face
- Uniform thickness (about 12% of tile width)
- Hard edges, sharp corners
- NO bevel, NO shadow, NO lighting

FACES
- Top face: contains ALL terrain meaning via abstract geometry
- Side faces: neutral, silent, no markings (only slightly darker flat tone than top)
- No surface texture, no noise, no grain

COLOR (BOARD-PASSIVE)
- Mostly neutral palette (off-white / concrete / muted gray)
- Terrain meaning expressed by geometry + density
- Avoid bright colors
- DO NOT use UI semantic colors (no saturated blue/red/yellow)
- No gradients

GRAPHIC RULES
- Flat color fills only (no strokes unless explicitly requested)
- No icons, no labels, no text
- No realism, no environment illustration
- No trees, rocks, grass, water rendering
- No topographic map styling
- No 3D render look

OUTPUT
- 1:1 square image containing the single isometric tile centered
- Transparent background (tile only)
- Clean silhouette, crisp edges
- High resolution (e.g., 1024x1024 or 2048x2048)

## GLOBAL NEGATIVE PROMPT (append to EVERY terrain tile prompt)

ABSOLUTE NEGATIVES / EXCLUSIONS
- no realism, no realistic terrain, no environment art
- no grass, no trees, no leaves, no rocks, no soil, no sand, no mud
- no water rendering, no waves, no foam, no reflections
- no buildings, no windows, no doors, no vehicles, no props
- no people, no units, no miniatures, no diorama, no tabletop photography

NO LIGHTING / NO DEPTH TRICKS
- no shadows (including ambient occlusion, contact shadows, drop shadows)
- no shading, no highlights, no reflections, no specular
- no bevel, no emboss, no 3D render look

NO STYLE NOISE
- no gradients, no glow, no blur
- no texture, no grain, no paper texture, no noise, no halftone
- no weathering, no scratches, no rust, no dirt

NO CAMERA / COMPOSITION FAILURES
- no perspective, no vanishing point, no wide-angle distortion
- no cropped tile, no partial tile, no multiple tiles, no full board
- no background scene, no floor, no tabletop surface

NO UI / TEXT
- no labels, no typography, no numbers, no icons, no arrows-as-UI
- no borders outside the tile, no frames, no captions, no watermark

NO COLOR ABUSE
- no saturated neon colors
- no bright UI semantic colors (avoid strong red/blue/yellow)
- no high-contrast illustration palette

FAIL CONDITIONS
If any of the above appear, discard and regenerate.
