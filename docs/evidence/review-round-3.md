# Review round 3 — after the art-direction pass

Date: 2026-10-28
Range: the uncommitted art-direction pass on top of `3c56210` (bridges, balance, case, hands, inspection highlight, mobile sheet, no-JS, explosion, compositor).
Reviewers: two fresh independent subagents, A (horology, geometry, materials, visual fidelity) and B (interaction, accessibility, performance, delivery, code quality). Both ran against the current worktree, the built site and the committed evidence.

## What both found

**The movement was structurally wrong, not just styled wrongly.** A traced the escape wheel, fork and balance roller to three different Z planes and showed that the train/barrel/balance jewels sat several millimetres above their arbors. B independently found the bridge layer crossing the chapter ring and the hands, and the top-down camera framing that made the stack impossible to read. Different lenses, same conclusion: the object needed a layer-order fix before any more polish.

**The mobile inspector was a release blocker.** B measured a 12 rem sheet with `overflow: hidden` at 390×844: the detail was clipped and `Locate` sat outside the card. A's evidence review had already flagged that the balance was clipped by the chapter ring; both are the same class of bug — a composition that was checked at 1440×900 and not at the edges.

**The camera/explosion interaction was hostile.** B measured a locate at 52 mm becoming 153 mm after `setExplode(0.5)`; A found the exploded stack read as a sandwich because the chapter ring was in front of the hands and the crown floated with the keyless layer. The slider was writing a fixed oblique camera pose over the user's orbit.

**The interaction still had touch holes.** B reproduced a pinned part that could not be replaced by tapping another part, touch drags that hovered every part they crossed, a camera lift that changed the part under the finger, and a no-JS page stuck on the loading veil. A did not test those seams; B's findings stood alone.

## Contradictions

- A said the selection outline was not readable; B's pixel diff said the outline and dim render. Both were right: the outline pass was being handed a `Group`, which it ignores. Flattening the selected part into its meshes made the outline real; the hover evidence now shows the balance ring lit.
- A called the visual bar unmet; B called the interaction ready. That disagreement survives and is recorded rather than papered over: the mechanism and the contract are ready; the object is a stylised skeleton watch, not a macro photograph.
- A wanted the keyless contact geometry solved exactly; B did not test it. The click spring was moved onto the click and the crown was put back in the case layer, but the full keyless train is still a presentation concession (ADR-0007), not a claim of physical contact.

## Fixes applied after round 3

1. Re-layered the movement: bridges at 0.35 mm (train/center), 2.35 mm (barrel), −1.5 mm (pallet); balance cock at 2.92 mm. The chapter ring, subdial and hands now sit above every bridge.
2. Aligned the escapement: escape wheel, fork and pallet stones share −1.95 mm; the balance roller, impulse pin and staff were extended to the fork plane; the balance moved to y = −8.0 with a 4.0 mm rim so the chapter ring no longer clips it.
3. Extended the third, escape and barrel arbors to their bridge jewels; the train bridge gained an escape-wheel arm.
4. Moved the crown to the case layer and the chapter ring below the hands in the explosion; the case back is its own part on the rear layer, so it no longer covers the dial.
5. Replaced the camera-hijacking explosion frame with a stable orbit; the capture uses an explicit debug view. The slider now separates the object without moving the camera.
6. Fixed touch: drags no longer hover-pick, a pinned part can be replaced by tapping another, empty taps clear a preview, and the mobile camera no longer jumps on preview.
7. Mobile sheet: 40 vh with internal scrolling and a sticky action row; a drag handle; the 390×844 browser test asserts the card and Locate stay in the viewport.
8. Added a no-JS stylesheet that hides the app and renders the static calibre/list; the browser test disables JavaScript.
9. Moved the live announcement to a dedicated `role="status"` element; the inspector is a labelled region and the tour mutes the duplicate announcement.
10. Removed the per-frame `URLSearchParams` allocation, removed the dead bloom config, and recorded the black-frame bloom removal in ADR-0008.
11. Made auto-demote time-based (two seconds of slow frames) instead of frame-counted; contrast and status type were raised.
12. Locate now includes the exploded group offset; `reset` clears the stale hover; Enter from idle pins the first part.
13. Reconciled copy with geometry: 34.84 mm case, 8.1 mm barrel, six-coil hairspring, 8.55/11.95 mm hands, 1.05 mm crystal, engraved case back; removed the unbuilt lugs and added the small-seconds subdial as its own inspectable part.
14. Strengthened the browser test: mobile touch preview/pin/switch, sheet bounds, no-JS fallback, and a 38-part catalogue.

## What is deliberately left

- **The visual bar.** The object is a clean, legible stylised skeleton watch; it is not photoreal. The remaining gap is art direction (bridge silhouettes, crystal refraction, a photographed surface), not a missing feature.
- **Keyless contact.** The click, spring, crown wheel and stem are presented and animated, but the tooth-level contact is illustrative. ADR-0007 owns that concession.
- **The exploded view** is a side-on assembly stack for capture and inspection, not a guided 3D animation. The camera no longer moves on its own.

## Verification

- `npm test`: 39 passed.
- `npm run lint`: 0 errors (12 script console warnings).
- `npm run build`: clean, 775 kB / 224 kB gzip.
- `npm run test:e2e`: 24 checks passed, including mobile touch, sheet bounds, no-JS and the 38-part catalogue.
- Scene budget: 235 draw calls, 157,446 triangles.
- Evidence: `hero.png`, `hover.png`, `exploded.png` regenerated from the current tree.
