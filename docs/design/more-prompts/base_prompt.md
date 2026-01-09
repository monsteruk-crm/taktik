Generate a single isometric tactical terrain TILE for a deterministic, turn-based, grid-based military board game.

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
