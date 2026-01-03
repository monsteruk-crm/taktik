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
