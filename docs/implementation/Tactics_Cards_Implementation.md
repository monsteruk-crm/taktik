# Tactic Cards Implementation

## 1. What tactic cards are (manual reference)

Tactic cards represent moment-to-moment battlefield decisions that interrupt or reshape the current resolution. They are:

- timing-sensitive
- reactive
- high-impact (they shift outcomes rather than provide passive buffs)
- short-lived

They should be understood through `docs/Taktik_Manual_EN.md` entries such as `Precision Shot`, `Suppressive Fire`, `Commander’s Luck`, and `Tactical Block`.

Tactic cards are **not** draw-and-forget buffs; they are deliberately played to interrupt or modify a resolution in a specific reaction window.

## 2. When tactic cards can be used

By rule, tactic cards are reaction cards that execute only while an explicit reaction window is open. They:

- are never played during the draw step
- are never auto-resolved by the engine
- are played only when a matching reaction window is active

### Reaction windows

| Window | Meaning |
| --- | --- |
| `beforeMove` | Just before a unit begins movement |
| `afterMove` | Immediately after movement ends |
| `beforeAttackRoll` | Attack declared, dice not rolled yet |
| `afterAttackRoll` | Dice rolled, but result still mutable |
| `beforeDamage` | Hit confirmed, damage not yet applied |

If a card does not match the current window, it cannot be played—there is no free-form timing or nesting of reaction windows.

## 3. How this fits the current engine

The existing engine already provides explicit phases, deterministic resolution, and serialized state transitions (`lib/engine/gameState.ts` series). Reaction windows become **temporary sub-states** inside the normal phase flow rather than new phases of their own. This keeps the engine deterministic and UI-agnostic while still allowing precise interrupts.

## 4. Required `CardDefinition` extensions

Tactic cards must declare which reaction window they belong to. The minimal extension looks like:

```ts
type ReactionWindow =
  | "beforeMove"
  | "afterMove"
  | "beforeAttackRoll"
  | "afterAttackRoll"
  | "beforeDamage";

type CardDefinition = {
  ...
  kind: "bonus" | "malus" | "tactic";
  timing: "immediate" | "stored" | "reaction";
  // REQUIRED when kind === "tactic"
  reactionWindow?: ReactionWindow;
};
```

Rules derived from this extension:

- If `kind === "tactic"`, then `timing` **must** equal `reaction` and `reactionWindow` **must** be defined.
- Non-tactic cards must not define `reactionWindow`.

## 5. Engine flow (authoritative)

### Opening a reaction window

When the engine reaches a point where manual rules allow a tactic card, it should explicitly open that reaction window prior to continuing resolution. Example:

```ts
openReactionWindow("beforeAttackRoll");
```

Opening a window should:

1. Pause the ongoing resolution flow.
2. Allow only tactic cards whose `reactionWindow` matches the active window.
3. Limit plays to the player or entity entitled to react (usually the active player unless a card specifies otherwise).
4. Close automatically once the reaction resolves and the engine resumes.

### Playing a tactic card

The player submits a `PLAY_CARD` action. The engine verifies:

1. `card.kind === "tactic"`
2. `card.timing === "reaction"`
3. `card.reactionWindow` matches the currently open window
4. Targets (if any) are valid

Once the checks pass, the effect is instantiated, applied, and the engine continues the paused resolution.

## 6. Effect lifetime

Most tactic cards only last for the current resolution and expire immediately after use or when the phase ends. Implement this by chaining effects with `untilPhase` or a short `untilEndOfTurn`. Permanent tactics do not exist in the manual, so avoid creating linger effects.

## 7. Manual list of example tactic cards

The manual lists the following tactics, which should guide which cards to prioritize:

- Precision Shot
- Suppressive Fire
- Coordinated Maneuver
- Commander’s Luck
- Tactical Block
- Dense Fog
- Favorable Weather
- Expert Aim
- Clear Line of Fire
- Enemy Recon Detection

Start with a manageable subset that covers the key reaction windows rather than implementing every card upfront.

## 8. Non-negotiable rules

- A tactic card cannot be played outside a matching reaction window.
- No card may endlessly interrupt another tactic (reaction windows do not nest).
- The engine (not the UI) is solely responsible for judging legality and timing.

Violating these rules risks breaking multiplayer determinism and replay fidelity.

## 9. Summary

Tactic cards are reaction-only entries that the engine plays during clearly defined reaction windows. Their effects are short-lived, engine-determined, and meant to adjust the in-flight resolution rather than provide passive bonuses.
