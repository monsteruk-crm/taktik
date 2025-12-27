# **CODEX MVP GENERATION INSTRUCTIONS (AUTHORITATIVE)**

## **ROLE**

**You are a senior software engineer implementing an MVP for a turn-based, grid-based tactical strategy game.**

**Your job is to build the minimal correct system, not a polished game.**

---

## **GLOBAL RULES (NON-NEGOTIABLE)**

1. **USE PLACEHOLDERS FOR EVERYTHING VISUAL**

   * **No real art**

   * **No icons**

   * **No animations**

   * **No styling beyond simple boxes and text**

   * **No external assets**

2. **CORRECTNESS \> COMPLETENESS \> POLISH**

   * **The game must be playable**

   * **The rules must be explicit**

   * **The UI may be ugly**

3. **NO PREMATURE ABSTRACTION**

   * **No ECS**

   * **No complex inheritance**

   * **No plugin systems**

   * **Prefer plain objects and functions**

4. **ALL GAME LOGIC MUST BE UI-AGNOSTIC**

   * **Rules engine must be pure logic**

   * **No DOM, no React, no canvas in the engine**

---

## **TECH STACK (FIXED)**

* **Frontend: React \+ Next.js (App Router)**

* **Language: TypeScript**

* **State: Reducer or explicit state machine**

* **Rendering: HTML \+ CSS only**

* **No Canvas, WebGL, Pixi, Three, etc.**

---

## **PROJECT STRUCTURE (MANDATORY)**

**`/app`**

  **`/page.tsx            // main game screen`**

  **`/layout.tsx`**

**`/lib`**

  **`/engine`**

    **`gameState.ts       // core types`**

    **`reducer.ts         // state transitions`**

    **`rules.ts           // movement, combat, cards`**

    **`rng.ts             // deterministic dice`**

  **`/ui`**

    **`Board.tsx          // placeholder grid`**

    **`Controls.tsx       // buttons only`**

    **`CardPanel.tsx      // placeholder cards`**

---

## **GAME CONSTRAINTS (MVP)**

### **Board**

* **Grid: 20 × 30**

* **Coordinate system: `{ x: number; y: number }`**

* **Tiles are rectangular placeholders, not isometric art**

### **Units**

**Each unit must have:**

**`{`**

  **`id: string`**

  **`owner: "PLAYER_A" | "PLAYER_B"`**

  **`type: "INFANTRY" | "VEHICLE" | "SPECIAL"`**

  **`position: { x: number; y: number }`**

  **`movement: number`**

  **`attack: number`**

  **`hasMoved: boolean`**

**`}`**

**Use text labels only to display units.**

---

## **TURN STRUCTURE (MUST BE EXPLICIT)**

**The game MUST enforce this exact sequence:**

**`TURN_START`**

**`→ CARD_DRAW`**

**`→ CARD_RESOLUTION`**

**`→ MOVEMENT`**

**`→ ATTACK`**

**`→ DICE_RESOLUTION`**

**`→ END_TURN`**

* **Represent phases as a string enum**

* **The UI must clearly show the current phase**

* **No skipping, no combining phases**

---

## **CARDS (SIMPLIFIED MVP)**

* **One common deck**

* **Card type:**

**`{`**

  **`id: string`**

  **`kind: "BONUS" | "MALUS"`**

  **`description: string`**

**`}`**

**Rules:**

* **Malus resolves immediately**

* **Bonus can be:**

  * **played immediately, or**

  * **stored (max 6\)**

**Use text-only cards.**

---

## **COMBAT & DICE**

* **Dice: `d6`**

* **Dice rolls must be:**

  * **deterministic**

  * **seeded**

  * **logged**

**Example:**

**`rollDie(): number // returns 1–6`**

**Display results as plain text:**

**`Rolled: 5 → HIT`**

---

## **UI REQUIREMENTS (PLACEHOLDERS ONLY)**

### **Board**

* **Render grid using `<div>`s**

* **Each tile shows:**

  * **coordinates**

  * **unit ID if present**

### **Controls**

* **Buttons only:**

  * **Move**

  * **Attack**

  * **End Turn**

  * **Draw Card**

* **No gestures**

* **No drag & drop**

### **Feedback**

* **Every action must produce visible text output**

* **Use a simple log:**

**`> Unit A moved to (4,7)`**

**`> Rolled 3 → MISS`**

---

## **STATE MANAGEMENT**

* **Entire game state must be serializable**

* **One reducer handling:**

  * **phase changes**

  * **movement**

  * **attacks**

  * **card resolution**

**Example:**

**`dispatch({ type: "MOVE_UNIT", unitId, to })`**

---

## **WHAT NOT TO DO (IMPORTANT)**

**❌ Do NOT:**

* **Add animations**

* **Add sound**

* **Add AI**

* **Add multiplayer**

* **Add persistence**

* **Add fancy UI**

* **Add art placeholders beyond text/boxes**

**If unsure, do less.**

---

## **DEFINITION OF DONE (MVP)**

**The MVP is complete when:**

* **Two players can:**

  * **take turns**

  * **draw cards**

  * **move up to 5 units**

  * **attack**

  * **roll dice**

  * **end the turn**

* **The phase order is enforced**

* **The UI clearly shows:**

  * **current phase**

  * **active player**

  * **results of actions**

**Visual quality is irrelevant.**

---

## **FINAL INSTRUCTION TO CODEX**

**Build the smallest possible implementation that satisfies all rules above.**  
 **Use placeholders everywhere.**  
 **Prefer boring, explicit code over cleverness.**  
 **If a feature is not required for the MVP, omit it.**

