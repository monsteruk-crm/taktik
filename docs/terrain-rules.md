## Terrain Rules (Movement + Combat Modifiers)

### What this feature does
- Applies terrain effects to movement and combat using data-driven rules (no terrain-specific logic in engine code).
- Resolves movement range via per-tile movement costs, overlay rules (roads/rivers), and connector overrides (bridges).
- Applies combat roll modifiers from attacker/defender terrain and optional rule conditions.

### Why it exists (rule source / manual reference)
- The manual states that terrain, roads, rivers, and urban areas affect movement and combat resolution. `docs/Taktik_Manual_EN.md` references terrain affecting movement and combat bonuses/penalties.

### Constraints
- Terrain effects are configured in `src/lib/engine/terrainRules.ts` (definitions + rule lists).
- No `if (terrain === "forest")` logic in the engine; all behavior comes from data/config.
- Roads and rivers are overlays, not base terrain; bridges are connectors that neutralize overlays locally.
- Deterministic: movement resolution is pure and depends only on state + config.

### Edge cases
- Water tiles block movement unless rules or effects explicitly override blocking.
- Road boosts only apply when moving along connected road tiles.
- River penalties apply unless a connector (bridge) neutralizes the river overlay on that step.
- Movement range uses costed steps; some tiles within Manhattan distance can be unreachable if costs exceed movement points.
- Combat modifiers are applied to the roll and clamped to the 1..6 range.

### How to test it manually
1. Start a game and identify road, river, and hill tiles on the board.
2. Select a unit near a road segment; verify movement highlights extend farther along the road than off-road.
3. Select a unit adjacent to a river tile without a bridge; verify the highlighted range is reduced across the river.
4. Find a road-over-river crossing (bridge); verify movement range does not incur the river penalty on that tile.
5. Attack a unit standing on forest or hill terrain and confirm the dice roll result reflects a penalty (forest) or defense bonus (hill).
