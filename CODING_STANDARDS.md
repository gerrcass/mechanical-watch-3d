# Coding standards — The Open Movement

Reviewed, not implemented. These are the judgement calls a reviewer enforces that the type checker and linter cannot.

## Reality

- The calibre is the single source of truth. If a scene module divides a ratio, hard-codes a beat rate, or advances a wheel by a delta, reject it.
- The movement must agree with the copy. A part's spec line and its geometry, teeth count and motion must describe the same object.
- MW-01 is illustrative. Copy may say "in this calibre" or "represented here"; it may not imply a commercial replica.
- Finishing follows real practice: anglage on exposed bridge edges, perlage on the plate, Côtes de Genève on bridges, circular graining on wheels, blued screws, ruby jewels with chatons where visible.

## Visual

- The palette is obsidian, champagne, rhodium, ruby and ivory. No primary colours, no neon, no gradient text.
- Materials are shared and physically plausible. A new material is justified by a visible difference, not by convenience.
- Every part reads at the hero camera distance. If a detail is only visible in a close-up, it still must not look wrong when the camera gets there.
- Composition is asymmetric; the balance and escapement are the visual anchor. The camera must never clip the case.
- Motion is continuous and eased. Nothing pops, snaps or teleports except the escapement, where snapping is the physical truth.

## Code

- Strict TypeScript. No `any` on a public surface; no non-null assertions for scene lookups where a typed registry can answer.
- The render loop allocates nothing: preallocate vectors, quaternions, matrices and raycast targets.
- Geometry and materials are disposed when a rebuilt scene replaces them. Dev hot reload must not leak GPU resources.
- DOM writes are `textContent` and attributes, never interpolated HTML from catalogue data.
- State transitions are explicit. The inspection machine and tour reducer are pure and tested; the scene subscribes, it does not own the state.
- A visual feature without a reduced-motion path is incomplete.
- Comments explain why a number or shape is what it is, especially horological constants and composition hacks. Do not narrate the obvious.

## Tests

- Test behaviour at the calibre seam first. Pixel or geometry snapshots are forbidden: they are brittle and assert the implementation.
- A test that cannot fail when the mechanism is wrong is not a test. Assert 60 revolutions, half-tooth advances, 12:1 reductions and clamped ranges.
- Browser tests use the debug API and stable data attributes; they never hunt coordinates.
- Every bug fixed gets a regression test unless the fix is purely visual; visual fixes get a screenshot in evidence.

## Review

- Findings are ranked by user impact: wrong mechanism, unusable interaction, visual break, performance regression, polish.
- A reviewer must state the file and the observable consequence. "Looks off" is not a finding.
- Reviewers do not rewrite the diff. They report; the implementer fixes.
