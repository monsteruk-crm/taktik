## **MILESTONE 0 — Project Skeleton (No Game Yet)**

### **Goal**

Boot a Next.js app with a visible placeholder screen.

### **Codex Instructions**

* Create a Next.js (App Router) project

* Use TypeScript

* Single route: `/`

* Render a full-screen placeholder UI

### **Must Include**

* Header: `TAKTIK MVP`

* Subtext: `Placeholder UI`

* No game logic

### **Definition of Done**

* App runs

* White screen with text

* No errors

---

## **MILESTONE 1 — Core Types & State Shape**

### **Goal**

Define the **entire game state**, but do not render anything yet.

### **Codex Instructions**

* Create `/lib/engine/gameState.ts`

* Define:

  * `GamePhase`

  * `Player`

  * `Unit`

  * `Card`

  * `GameState`

### **Must Include**

* All fields serializable

* No functions yet

### **Definition of Done**

* Types compile

* No UI dependency

* State can be logged to console

---

## **MILESTONE 2 — Phase State Machine**

### **Goal**

Enforce **explicit turn phases**.

### **Codex Instructions**

* Create `/lib/engine/reducer.ts`

* Implement:

  * `NEXT_PHASE`

  * Phase enum

* Phases must advance in fixed order

### **Must Include**

* Reducer is pure

* Illegal transitions are rejected

### **Definition of Done**

* Dispatching `NEXT_PHASE` cycles correctly

* Phase shown as text on screen

---

## **MILESTONE 3 — Placeholder Board Rendering**

### **Goal**

See the board, nothing else.

### **Codex Instructions**

* Create `Board.tsx`

* Render a **20×30 grid**

* Each tile:

  * shows `(x,y)`

  * is a simple `<div>`

### **Must Include**

* No units

* No interaction

* Grid scrolls if needed

### **Definition of Done**

* Board visible

* Coordinates readable

---

## **MILESTONE 4 — Units on Board (Static)**

### **Goal**

Place units on the grid.

### **Codex Instructions**

* Add a few hardcoded units to state

* Render unit IDs as text inside tiles

### **Must Include**

* At least:

  * 3 units per player

* No movement yet

### **Definition of Done**

* Units appear at correct coordinates

* Ownership visible (text)

---

## **MILESTONE 5 — Movement (No Combat)**

### **Goal**

Move units according to rules.

### **Codex Instructions**

* Add `MOVE_UNIT` action

* Enforce:

  * movement range

  * max 5 units per turn

* Reset movement on new turn

### **Must Include**

* Click unit → click destination (simple)

Text feedback:

 `Unit A moved to (4,7)`

* 

### **Definition of Done**

* Units move

* Illegal moves blocked

* Move count enforced

---

## **MILESTONE 6 — Turn Start & End**

### **Goal**

Players can complete a turn.

### **Codex Instructions**

* Add:

  * `END_TURN`

  * `TURN_START`

* Switch active player

* Reset per-turn flags

### **Must Include**

* Button: `End Turn`

* Current player displayed

### **Definition of Done**

* Turns alternate correctly

* State resets as expected

---

## **MILESTONE 7 — Cards (Text Only)**

### **Goal**

Card draw & resolution.

### **Codex Instructions**

* Add deck to state

* Add `DRAW_CARD`

* Implement:

  * malus (auto-resolve)

  * bonus (store or play)

### **Must Include**

* Card panel with text

* Max 6 stored bonuses

### **Definition of Done**

* Cards drawn

* Rules enforced

* Visible text output

---

## **MILESTONE 8 — Combat Selection (No Dice Yet)**

### **Goal**

Select and confirm attacks.

### **Codex Instructions**

* Add `ATTACK_SELECT`

* Select attacker \+ target

* Validate range

### **Must Include**

* No damage yet

* No randomness yet

### **Definition of Done**

* Attack intent logged

* Invalid attacks blocked

---

## **MILESTONE 9 — Dice Resolution**

### **Goal**

Resolve combat deterministically.

### **Codex Instructions**

* Implement seeded RNG

* Add `ROLL_DICE`

* Resolve hit/miss

### **Must Include**

* Display roll result

* Append to log

### **Definition of Done**

* Dice rolls deterministic

* Results visible

---

## **MILESTONE 10 — Full Turn Loop Lock-In**

### **Goal**

Make it impossible to break turn order.

### **Codex Instructions**

* Enforce phase gating for:

  * movement

  * attacks

  * dice

* Disable buttons in wrong phase

### **Must Include**

* Phase shown at all times

* UI reflects allowed actions

### **Definition of Done**

* Cannot cheat the system

* Full turn playable end-to-end

---

## **MILESTONE 11 — Minimal Victory Condition**

### **Goal**

End the game.

### **Codex Instructions**

* Add one condition:

  * Annihilation

* Detect and stop game

### **Must Include**

* `VICTORY` state

* Winner text only

### **Definition of Done**

* Game ends correctly

* No further actions allowed

---

# **🔒 FINAL RULE FOR CODEX**

**Do NOT jump milestones.**  
 **Do NOT refactor previous milestones.**  
 **If a feature is not in the current milestone, omit it.**

