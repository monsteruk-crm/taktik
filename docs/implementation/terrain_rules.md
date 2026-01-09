## CODEX PROMPT — TERRAIN RULE SYSTEM (ABSTRACT, EXTENSIBLE)

### Goal

Implement terrain rules for movement and combat **without hard-coding logic per terrain**.
The system must allow **adding, removing, or tuning terrain effects by data/config**, not by rewriting engine code.

---

## 1. Core Design Principles (NON-NEGOTIABLE)

* Terrain effects must be **data-driven**
* Movement and combat logic must be **rule-based, not conditional**
* No `if (terrain === "forest")` anywhere in the engine
* Terrain, roads, rivers, and bridges must be **orthogonal concepts**
* Adding a new terrain or modifier must require:

    * editing a config object
    * NOT changing engine logic

---

## 2. Conceptual Model

### Separate these concerns cleanly:

1. **Base terrain** (what the tile fundamentally is)
2. **Overlays** (roads, rivers)
3. **Connectors** (bridges)
4. **Unit capabilities**
5. **Rule modifiers**

Each tile can have:

```ts
{
  baseTerrain: TerrainType
  overlays: OverlayType[]
  connectors: ConnectorType[]
}
```

---

## 3. Terrain Definition (DATA ONLY)

Define terrain as **pure data**:

```ts
type TerrainDefinition = {
  id: string
  movementCost: number
  blocksMovement: boolean
  combatModifiers: {
    hitChance?: number        // additive modifier
    defenseBonus?: number     // additive modifier
  }
  tags: string[]
}
```

Example (DO NOT hardcode logic):

```ts
forest: {
  id: "forest",
  movementCost: 2,
  blocksMovement: false,
  combatModifiers: {
    hitChance: -1
  },
  tags: ["cover", "concealment"]
}
```

---

## 4. Overlay System (Roads, Rivers)

Overlays are **movement graphs**, not terrain.

```ts
type OverlayDefinition = {
  id: string
  movementRule: "restrict" | "boost" | "block"
  costModifier?: number
  allowedDirections?: Direction[]
  tags: string[]
}
```

### Roads

* Reduce movement cost **only when moving along connected road segments**
* Never reduce cost off-road

```ts
road: {
  id: "road",
  movementRule: "boost",
  costModifier: -1,
  tags: ["path", "logistics"]
}
```

### Rivers

* Restrict forward movement
* Increase cost or block movement unless overridden

```ts
river: {
  id: "river",
  movementRule: "restrict",
  costModifier: +2,
  tags: ["water", "barrier"]
}
```

---

## 5. Bridges (Explicit Override)

Bridges are **connectors**, not terrain, not overlays.

```ts
type ConnectorDefinition = {
  id: string
  allowsOverlay: string[]     // overlays it neutralizes
  tags: string[]
}
```

```ts
bridge: {
  id: "bridge",
  allowsOverlay: ["river"],
  tags: ["crossing"]
}
```

Meaning:

* A bridge does **not** remove the river
* It **locally cancels river penalties**
* Other river effects still apply elsewhere

---

## 6. Movement Resolution (RULE PIPELINE)

Movement is resolved through **a pipeline**, not conditionals:

1. Start with unit base movement points
2. For each step:

    * Read base terrain modifiers
    * Apply overlay modifiers (if movement follows overlay graph)
    * Apply connector overrides
    * Apply unit abilities
    * Apply card effects
3. If total cost exceeds remaining points → movement stops

**No terrain-specific logic in this pipeline.**

---

## 7. Combat Resolution (MODIFIER STACK)

Combat calculations must follow a **modifier stack**:

```ts
type CombatContext = {
  baseHitChance: number
  modifiers: number[]
}
```

Modifiers come from:

* Defender terrain
* Attacker terrain (if relevant)
* Line-of-sight overlays
* Cards
* Unit abilities

Final hit chance = sum(base + modifiers)

---

## 8. Example Terrain Effects (DATA ONLY)

| Terrain    | Movement | Combat                    |
| ---------- | -------- | ------------------------- |
| Plain      | normal   | none                      |
| Rough      | +1 cost  | none                      |
| Hill       | +1 cost  | +1 defense                |
| Forest     | +1 cost  | −1 hit chance             |
| Urban      | +1 cost  | −1 hit chance, +1 defense |
| Industrial | +1 cost  | −1 hit chance             |
| Water      | blocked  | N/A                       |

These must exist **only as configuration**, never logic.

---

## 9. Extensibility Tests (MANDATORY)

The implementation must support these **without code changes**:

* Adding a new terrain: `swamp`
* Making roads unusable for certain units
* Making rivers frozen by a card
* Making urban terrain give attackers a penalty only if defender is infantry

If any of these require changing engine logic → the implementation is wrong.

---

## 10. Output Requirements

* Implement:

    * Terrain definitions
    * Overlay definitions
    * Connector definitions
    * Movement resolver
    * Combat modifier resolver
* No UI code
* No rendering logic
* Pure deterministic functions
* Fully testable with unit tests

