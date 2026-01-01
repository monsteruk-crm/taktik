You are working in the Taktik Next.js repo. Your task is to improve the UX for TACTIC (reaction) cards.

Context / Docs (read first)
- docs/tactics-cards.md
- docs/implementation/Tactics_Cards_Implementation.md
- docs/cards-system.md (for general card handling)
- docs/mui_index.md (MUI conventions)
- Current UI issue: lib/ui/CardPanel.tsx renders ALL tactics (and lots of card metadata) directly in the side panel; it’s cluttered and not how reaction tactics should feel.

Constraints
- Do NOT change engine rules or determinism.
- Do NOT add new dependencies. Use existing MUI components.
- Keep current state flow: app/page.tsx owns targetingContext, queuedTactic, openReactionWindows, etc.
- Goal: tactics should be accessed via a modal/drawer and only feel “available” when a reaction window is open.

Deliverables
1) Replace the current “Tactics” list in lib/ui/CardPanel.tsx with a compact Tactical HUD + Modal/Drawer:
    - In the side panel, show only:
        - A “TACTICS” button (with badge count of playable tactics for currently open windows)
        - A short label for open windows (e.g., “Open windows: beforeMove, afterAttackRoll”)
        - If a tactic is armed, show: “ARMED: <name> (<window>)” + “CLEAR”
    - No more full list of tactic cards permanently rendered.

2) Add a new component for the modal UI (choose name: lib/ui/TacticsModal.tsx or similar):
    - Use MUI Dialog on desktop.
    - Use MUI Drawer (bottom sheet) on mobile (useMediaQuery / theme breakpoints).
    - The modal lists tactic cards grouped by reactionWindow, with these rules:
        - A tactic is “playable” only if its reactionWindow is currently open AND the pending targeting mode doesn’t conflict.
        - Non-playable cards are shown but disabled (low emphasis), so players learn the deck but can’t misplay.
        - For each card, show: thumbnail (CardArt), name, short summary. Hide verbose debug fields.
        - Actions:
            - If card.targeting.type === "unit":
                - Button: “SELECT TARGETS” -> calls existing onStartTacticTargeting(card.id, card.reactionWindow)
                - After user selects targets on map and confirms (existing flow), the card becomes armed (queuedTactic set in app/page.tsx).
            - If card.targeting.type === "none":
                - Button: “ARM” -> calls existing onQueueTactic(card.id, card.reactionWindow)
        - Close behavior:
            - When “SELECT TARGETS” is pressed, close the modal automatically so the player can click units on the board.
            - Provide a clear in-panel status while targeting: “Selecting targets for <card>” + Confirm/Cancel (already exists in CardPanel props; keep it).
    - Add ESC handling: if targeting is active, ESC cancels targeting; otherwise closes modal.

3) Minimal refactor of CardPanel API:
    - Keep existing props as much as possible to avoid ripples.
    - It’s OK to add:
        - `isTacticsModalOpen`, `onOpenTacticsModal`, `onCloseTacticsModal`
          OR manage modal state internally in CardPanel (preferred if it stays UI-local).

4) Integrate in app/page.tsx:
    - Update CardPanel usage if needed (e.g., pass callbacks).
    - Ensure current logic for:
        - queued tactic (queuedTactic / queuedTacticCard)
        - tactic targeting (targetingContext.source === "tactic")
        - confirm/cancel targeting
          remains intact.

UX Acceptance Criteria (must satisfy)
- The side panel no longer shows the full tactic list at all times.
- When no reaction window is open, the TACTICS button is disabled or shows “No reaction window”.
- When a window opens, the badge shows count of playable tactics for that window.
- Player can open modal, arm a non-targeting tactic in 1 click.
- Player can start targeting a tactic, modal closes, player selects unit(s), confirms, then tactic shows as ARMED.
- ARMED tactic can be cleared via CLEAR.
- No changes to engine legality rules; UI only reflects them.

Implementation Notes
- Reuse existing CardArt logic (fallback image) from CardPanel.tsx; extract into a shared small component if needed.
- Use MUI components: Dialog, Drawer, Badge, Button, Paper, Stack, Typography, Divider.
- Keep brutalist UI cues (hard borders, no gradients, no playful animations). Prefer border: 1px solid #000 style consistent with existing code.

Manual Test Checklist
- Open a reaction window (move/attack flow) and confirm TACTICS becomes available.
- Arm a non-targeting tactic and ensure Resolve Attack uses the queued tactic reaction (existing code path).
- Start targeting a tactic: modal closes, board click selects targets, confirm arms the tactic.
- Confirm ESC cancels targeting.
- Confirm tactics cannot be armed outside their reaction window (button disabled).

After implementing
- Update docs/progress.md with a short note: “Tactics UI moved to modal/drawer; side panel now compact.”
