# COMMAND UI — Overlay-First Wireframes (ASCII)

Goal: keep the isometric board dominant, while surfacing **Cards / Tactics / Log** only as needed.
On desktop, panels are a **right-side overlay slab** (does not shrink the board). On mobile, panels are a **bottom drawer**.

---

## Desktop (≥ md)

### COMMAND (default)

+----------------------------------------------------------------------------------+
| TAKTIK MVP   Placeholder UI                                                      |
| Current Player: PLAYER_A   Phase: MOVEMENT   Winner: -      [Show/Hide Panels]    |
|----------------------------------------------------------------------------------|
| [Move] [Attack] [Next Phase] [Turn Start] [End Turn] [Roll Dice] [Resolve Attack]|
|----------------------------------------------------------------------------------|
| Mode: MOVE | Selected: A1 | Pending Attack: - | Last Roll: -                      |
+----------------------------------------------------------------------------------+

+----------------------------------------------------------------------------------+
|                                                                                  |
|  BOARD VIEWPORT (pan/zoom)                                                       |
|  - click unit to select                                                          |
|  - click tile to move (when MOVE)                                                |
|  - click enemy to target (when ATTACK)                                           |
|                                                                                  |
|                                                     +------------------------+   |
|                                                     | OPS PANEL (overlay)    |   |
|                                                     |------------------------|   |
|                                                     | Cards / Pending Card   |   |
|                                                     | Stored Bonuses         |   |
|                                                     | Tactics + windows      |   |
|                                                     |------------------------|   |
|                                                     | Log (auto-scroll)      |   |
|                                                     +------------------------+   |
|                                                                                  |
+----------------------------------------------------------------------------------+

Notes:
- When targeting a card/tactic (unit targeting), the board click behavior switches to "select valid units".
- The OPS panel is scrollable and can be hidden without affecting the board layout.

---

## Mobile (< md)

### COMMAND (default)

+--------------------------------------------------------------+
| TAKTIK MVP  | Player: A | Phase: MOVEMENT | [Panels]          |
| [Move] [Attack] [Next] [End] [Roll] [Resolve]                 |
| Mode/Selected/Pending/Last (wraps to 2 lines if needed)       |
+--------------------------------------------------------------+

+--------------------------------------------------------------+
|                                                              |
|  BOARD VIEWPORT (pan/zoom)                                   |
|                                                              |
|                                   [ Open Panels ]            |
+--------------------------------------------------------------+

### PANELS (bottom drawer)

+--------------------------------------------------------------+
|  PANELS (drawer)                                             |
|  Cards / Pending Card / Stored Bonuses                        |
|  Tactics + Open windows + Armed tactic state                  |
|  Log (auto-scroll)                                           |
|  [Close]                                                     |
+--------------------------------------------------------------+

---

## “Multi-screen” behavior (without routes)

- COMMAND = board-first surface (always visible)
- PANELS = cards/tactics/log overlay (desktop slab or mobile drawer)
- The top bar remains persistent across all interactions.
