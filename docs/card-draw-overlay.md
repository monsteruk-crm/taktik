# Card Draw Overlay

## What this feature does
- When a new pending card is drawn, the UI renders a floating command-console header and a huge centered card render without wiping the underlying interface.
- After a short hold, the card art tweens into the pending card slot in the Ops Console, reinforcing where the card lives.
- The overlay uses the command-console visual language (flat fills, hard edges, plate headers) and respects reduced-motion preferences.
- While the overlay is active, the pending card art is replaced with a blank placeholder to avoid duplicate images.
- A 300ms flat-color flash runs at the start (black → white → red) to punctuate the reveal.

## Why it exists (rule source / manual reference)
- The rules manual does not mandate a draw animation; this is a UX clarity feature that makes card acquisition legible.
- The implementation follows `docs/design/UI_GLOBAL_RULES.md` for overlay behavior and motion constraints.

## Constraints
- Header/plates must be fully opaque (no transparency) and use flat fills only.
- No gradients, glow, blur, or rounded corners.
- Motion is limited to CSS transitions (snap/slide); no layout shifts.
- The board must not move, and the overlay must not reflow or replace existing UI.
- The overlay is visual-only; it should not capture pointer input unless explicitly added later.
- Timing is configurable via `cardDrawOverlayTiming` in `src/lib/settings.ts`.
- The card must scale uniformly during the tween (no aspect squeeze).
- Flash timing is fixed at 0.1s per color (total 0.3s) and is skipped when reduced motion is enabled.
- Reduced motion disables transforms and keeps only a short static reveal.

## Edge cases
- If the pending card slot is not visible (e.g., mobile console closed), the overlay clears without a tween target.
- If a pending card changes again quickly, the overlay always binds to the latest card id.
- Reduced-motion environments show a brief reveal and then clear with no movement.

## How to test it manually
1. Start a match and draw a card on desktop. Confirm the overlay appears centered and the card snaps into the pending card slot.
2. Close the mobile console drawer, draw a card, and confirm the overlay appears and clears without a slide target.
3. Enable "Reduce motion" in the OS, draw a card, and confirm there is no translation or scaling.
