# Taktik – Detailed Game Manual (English Translation)

## 1. Game Objective
Taktik is a tactical board game played on a rectangular 20×30 grid (each cell represents 5 km). Two players face off as Attacker and Defender, navigating terrain, cards, and dice to achieve the agreed-upon victory condition.

### Victory conditions
Players decide before the match which single or combined victory paths will end the game:
1. **Total annihilation** – eliminate every enemy unit.
2. **Capture and hold** – occupy a base or flag and retain it for X turns.
3. **Victory Points (VP)** – score VPs from eliminations, zone control, or card usage; the first to reach the agreed threshold wins.
4. **Timed resistance** – survive until turn X; if the Defender still holds, they win.
5. **Logistics run** – transport supplies from point A to point B a set number of times.
6. **Secret missions** – each player receives hidden objectives; completing one wins the match.
7. **Territorial control** – after X turns, the player controlling the most strategic points is victorious.
8. **Target elimination (assassination)** – destroy a specific unit or leader.
9. **Evacuation/Exfiltration** – move N units off-map via designated evacuation points.
10. **Resource accumulation** – control resource nodes until reaching the agreed threshold.
11. **Sabotage enemy lines** – neutralize critical structures or logistics hubs (depot, bridge, etc.).
12. **Combined scoring** – tally VP, objectives, and control after a set time; highest total wins.

## 2. Board and Units
- **Board layout:** 20 alphabetic columns (A–T) by 30 numeric rows (1–30).
- **Unit categories:** Light infantry, mechanized infantry, and special units.
- **Force size:** Defender fields 15 units, Attacker fields 10 units.

### Unit composition
- **Light infantry:** 6–8 units per player.
- **Mechanized infantry:** 3–5 units per player.
- **Special units:** 1–2 units per player.

### Movement allowances
- **Movement per turn:** A maximum of five units may move each turn.
- **Movement logic:** Units may move in any of the eight surrounding directions (every quadrant). Each type carries its own intrinsic movement value:
  - Light infantry: 1–2 cells.
  - Mechanized infantry (vehicles): 3–4 cells.
  - Special units: 2–3 cells.

### 2.1 Board Tiles and Composition
Each board cell is composed of independent layers that the rules engine evaluates separately.

A tile contains:
1. **Base Terrain** (exactly one).
2. **Overlays** (zero or more).
3. **Connectors** (zero or more).

This layered approach keeps terrain behavior configurable, extensible, and engine-agnostic.

### 2.2 Base Terrain
Base terrain describes the tile's fundamental nature. Every base terrain defines:
* Movement cost
* Whether movement is blocked
* Combat modifiers
* Semantic tags for cards, units, and special rules

Base terrain never encodes special-case logic. Effects stack additively.

#### Standard Base Terrains
| Terrain | Movement Cost | Combat Effects | Notes |
| --- | --- | --- | --- |
| Plain | 1 | None | Neutral ground |
| Rough | 2 | None | Slows movement |
| Hill | 2 | +1 defense | Elevated position |
| Forest | 2 | −1 attacker hit chance | Concealment |
| Urban | 2 | −1 attacker hit chance, +1 defense | Dense cover |
| Industrial | 2 | −1 attacker hit chance | Obstructed visibility |
| Water | Blocked | N/A | Impassable unless overridden |

> Base terrain effects are additive, not absolute.

### 2.3 Terrain Overlays
Overlays are structures laid on top of base terrain; they modify movement only when a unit travels along their topology. They never replace the underlying terrain.

#### Road Overlay
* Reduces movement cost only while moving along connected road segments.
* Does not affect combat.
* Does not reduce off-road movement cost.

#### River Overlay
* Increases movement cost or blocks movement depending on crossing vs. following.
* Applies directionally; following the river can have different cost than crossing it.
* Does not negate the base terrain's effects.

Roads and rivers may coexist on the same tile without mutual exclusion.

### 2.4 Connectors
Connectors are explicit rule overrides that neutralize overlay restrictions locally.

#### Bridge Connector
* Allows crossing the river on that tile.
* Cancels river movement penalties only on the connector tile.
* Does not remove the river overlay.

Connectors are evaluated after overlays and before final movement validation.

## 3. Dice
The game uses a single standard six-sided die. Dice results resolve ranged fire, determine whether attacks hit, and adjudicate other action checks. Distance in grid cells (often Manhattan- or Chebyshev-based) determines the required die roll for success.

## 4. Cards
### 4.1 Deck structure
Two decks govern card play:
1. **Common Deck (60 or 90 cards total)**
   - **Bonus cards:** 36 or 56 cards (10 or 20 special, 26 or 36 generic). Players may keep up to six bonus cards face-down as tactical reserves. These cards cancel malus effects or grant advantages such as extra movement, stronger attacks, or resupply.
   - **Malus cards:** 24 or 34 cards (6 or 9 special, 18 or 25 generic). Malus cards must be played immediately and impose realistic penalties. Special malus cards produce rare or powerful consequences (e.g., air support denial, blackout, sabotage).
2. **Initial Tactical Deck (bonus cards only)** – Each player secretly selects six cards at the start of the match to define their command style and available tactical tools.

### 4.2 Bonus cards
- Serve a dual purpose: negate malus effects or grant positive rewards (movement boosts, face-saving cancellations, combat improvements).
- **Neutral cards** apply only when a specific malus is triggered (e.g., “Internal Discipline” counters internal discipline maluses).
- **Special cards** deliver powerful, rare interventions and may include unique effects such as international aid or electronic countermeasures.

### 4.3 Malus cards
- Represent operational difficulties such as logistics shortages, morale collapse, political interference, cyber warfare, or intelligence failures.
- Special maluses include UN ceasefire, sanctions, logistical blockades, and other systemic disruptions.
- Example: “Enemy Disinformation” allows the opponent to select a single unit that cannot move that turn.

### 4.4 Card handling
- Malus cards must be resolved immediately, unless a bonus card cancels them.
- Bonus cards may be played on the spot or stored face-down (maximum of six stored cards).
- Shuffle the relevant deck at the end of each turn to keep card order unpredictable.

## 5. Initial Deployment
Draw a front line one-third of the way from one edge of the board. Defender forces occupy the rear two-thirds of the map, while the Attacker deploys in the remaining one-third and initiates movement after deployment completes.

## 6. Movement Resolution
Movement resolves as a deterministic rule pipeline instead of terrain-specific exceptions. For each unit movement:
1. Start with the unit's base movement points.
2. For every step:
   * Apply the target tile's base terrain movement cost.
   * Apply overlay modifiers when the movement follows an overlay topology.
   * Apply connector overrides before river penalties are enforced.
   * Apply unit abilities that affect movement.
   * Apply card effects that alter costs or allow extra steps.
3. If the accumulated cost exceeds the remaining movement points, the unit stops before exceeding its allowance.

Modifiers from terrain, overlays, connectors, unit abilities, and cards all stack additively.

### 6.1 Combat and Terrain Interaction
Combat resolves via additive modifiers to the base hit chance:
* Defender base terrain
* Attacker base terrain (when relevant)
* Terrain overlays (dense urban cover, forest concealment, etc.)
* Card effects and unit abilities

There are no fixed terrain exceptions—only modifier stacking determines the final hit probability.

## 7. Tactical Concepts
### Movement dynamics
- Restricting which units move each turn forces careful management of rear lines, reserves, and covering fire.
- Gradual advancement makes it harder to isolate units and encourages cohesive maneuvers.

### Tactical realism
- The Attacker begins with fewer units but retains initiative, mirroring aggressive campaign tempo.
- The Defender starts with more units already deployed and leverages terrain for defensive advantages.
- Movement and card rules simulate operational constraints and introduce a measure of unpredictability that mirrors real-life campaigns.

## 8. Card-Unit Interaction
- **Bonus effects:** Increase movement, improve attack efficiency, or cancel maluses. Examples include Artillery Support, Extra Supplies, Troop Motivation, International Aid, Electronic Countermeasures, and Internal Discipline.
- **Neutral cards:** Become defensive tools while held, awaiting the right malus trigger.
- **Malus effects:** Generate hard tactical choices (Enemy Disinformation, Ammo Shortage, Mechanical Failure, International Pressure/ceasefire, Disrupted Supply Lines).
- Players must decide when to expend stored bonuses, cancel maluses, or accept penalties that shape the tactical landscape.

## 9. Specific Missions
- **Village Defense:** Defender must hold key units inside a village sector.
- **Coordinated Assault:** Attacker captures a critical quadrant while minimizing losses.
- **Convoy Protection:** Defender escorts a unit across the map.
- **Rapid Reconquest:** Attacker reclaims lost quadrants quickly.
- **Neutralize Special Unit:** Destroy or immobilize an enemy special unit.
- **Advanced Tactical Support:** Use at least two bonus cards in a coordinated sequence to gain an operational edge.

## 10. Common Deck — Bonus Cards (examples)
| Name | Category | Effect | Copies | Notes |
| --- | --- | --- | --- | --- |
| Rapid Supply Convoy | Logistics | +1 movement; cancels one malus | 2 | Always useful |
| Forward Supply Depot | Logistics | Infantry and vehicles gain +1 max movement; cancels one malus | 2 | Always useful |
| Special Supplies | Logistics | Restore one damaged unit | 2 | Neutral if no damaged unit |
| Advanced Recon | Support | Move one extra unit; cancels one malus | 2 | Always useful |
| Air Cover | Support | One blocked unit may move normally | 2 | Neutral if no malus is active |
| Internal Discipline | Morale | Keep one bonus card in hand; cancels one malus | 2 | Neutral if no corresponding malus drawn |

## 11. Common Deck — Malus Cards (examples)
| Name | Category | Effect | Copies | Notes |
| --- | --- | --- | --- | --- |
| Supply Interruption | Logistics | Reduces movement by 1–2 squares | 3 | Always active |
| Operational Funding Cut | Financial | Blocks logistics cards for one turn | 2 | Always active |
| Enemy Disinformation | Information | Opponent chooses one unit that cannot move | 2 | Always active |
| UN Ceasefire | Political | No attacks allowed for one turn | 1 | Special |
| Severe International Sanctions | Political | Cannot deploy new units for one turn | 1 | Special |

## 12. Turn Summary
1. Draw a card from the common deck.
2. If the draw is a malus, resolve it immediately unless canceled by a bonus card.
3. If the draw is a bonus, play it or replace one of your six face-down tactical cards.
4. Move up to five units, respecting their movement ratings and terrain modifiers.
5. Apply dice results, card effects, and resolve combat.

## 13. Additional Cards to Consider
| Type | Description | Effect |
| --- | --- | --- |
| **Bonus** | Artillery Support | Improves one unit's fire effectiveness for one turn. |
| **Bonus** | Extra Supplies | Allows a normally limited unit to move and attack in the same turn. |
| **Bonus** | Troop Motivation | Increases one unit's combat effectiveness for one turn. |
| **Bonus** | International Aid | Grants special support from an external reserve. |
| **Bonus** | Electronic Countermeasures | Blocks one enemy malus this turn. |
| **Bonus** | Internal Discipline | Prevents a specific malus from applying for one turn. |
| **Malus** | Enemy Disinformation | Opponent blocks one unit of their choice. |
| **Malus** | Ammunition Shortage | Reduces attack capability for one turn. |
| **Malus** | Mechanical Failure | A unit cannot move or attack for the turn. |
| **Malus** | International Pressure | Forces a ceasefire for one turn. |
| **Malus** | Disrupted Supply Lines | Limits movement and resupply on affected units. |
| **Tactic** | Dense Fog | All units suffer −1 chance to hit. |
| **Tactic** | Natural Cover | One enemy unit gains +1 defense. |
| **Tactic** | Clear Line of Fire | Ignores terrain obstacles when firing. |
| **Tactic** | Precision Shot | Doubles the attack effectiveness of one chosen unit. |
| **Tactic** | Suppressive Fire | Enemy movement is halved on their next turn. |
| **Tactic** | Coordinated Maneuver | Two units may attack the same tile, combining their attack strength. |
| **Tactic** | Commander’s Luck | Allows one die reroll. |
| **Tactic** | Favorable Weather | +1 to all ranged attacks. |
| **Tactic** | Expert Aim | +2 to hit a specific target. |
| **Tactic** | Tactical Block | Prevents an enemy unit from attacking. |
| **Tactic** | Enemy Recon Detection | Reveals enemy positions in one quadrant for targeted attacks. |

## 14. Design Contract — Extensibility
The terrain system must support:
* New terrains without changing core rules.
* Temporary terrain changes via cards.
* Unit-specific terrain interactions.
* Conditional effects (e.g., infantry-only bonuses).
* Future overlays (railways, trenches, supply lines).

Any rule that forces engine rewrites instead of configuration changes violates the contract.
