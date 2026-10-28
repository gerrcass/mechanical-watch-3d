# Review round 1 — two independent lenses

Date: 2026-10-28
Range reviewed: `main..feat/open-movement` plus the working tree at that point.
Reviewers: A (horology, geometry, materials) and B (interaction, accessibility, performance, delivery), each independent, each given the spec, the tickets, the ADRs, `CODING_STANDARDS.md` and the committed screenshots.

## What both found, independently

**The crystal ate every pick.** Both reviewers drove real pointer events over the built page and got `crystal` at the centre of the dial, not the part underneath. The hover screenshot passed only because the script calls `preview('balance-wheel')` directly. This is the product's primary verb; it was the first fix.

**The movement is not yet museum-grade.** A called it "a solid anthracite disc with white plastic worms"; B called out the milky crystal, the white clipped case edge and the dark, low-contrast dial. Both are right: the material hierarchy and the bridge silhouettes are the weakest part of the object, not the mechanism.

**The catalogue copy disagreed with the geometry.** Both flagged sapphire copy over a rhodium ring, "polished steel" over a gold case, 30 teeth over a 22-tooth ratchet, 21 jewels over 12 bearings, and hand lengths that had changed. The copy was written before the art direction settled.

## Contradictions and how they were resolved

- A said the ratio model is exact and the best part of the build; B did not contest it but found that the **visible readout** of that model (reserve, time) never updated while the clock ran. Both can be true: the model is right, the DOM was not subscribing to it. Fixed with a low-rate clock feed.
- A reported "193 scene draw calls, within budget"; B reported "406 idle / 797 selected" from the HUD. Both numbers are real: 193 is the scene, 406 includes the shadow pass and post-processing, 797 includes the outline pass while a part is selected. The README now states both, and the smoke test enforces the scene budget explicitly.
- A found the keyless works hidden under the bridge bosses; B found the labels did not follow the explosion. Different symptoms of the same missing scene/DOM coupling.

## Blind spots

- A did not test touch, focus or the reserve readout. B did not test the balance rate, the hairspring position or the pallet-stone geometry. Between them those were the most consequential defects: the balance was running at **8 Hz** (a double-rate cosine), the hairspring was modelled at the dial centre rather than on the balance staff, and one pallet stone floated 2 mm clear of the escape wheel.
- Neither reviewer noticed that the numerals were buried 0.02 mm inside the chapter ring's front face until A isolated the render. Both then agreed the hands were too short to read against a 13.15 mm ring.
- Neither checked the reset control's camera state; B caught it in a follow-up probe.

## Fixes applied before round 2

1. The sapphire dome is non-pickable; a real-pointer e2e check now hovers the balance and asserts it is not the crystal.
2. The balance runs at 4 Hz (`cos(π · beat)`), with a regression test at a quarter beat; the escape angle is wrapped before upload.
3. The hairspring is on the balance staff and its breathing shader rotates around its own origin.
4. Pallet stones sit on the escape wheel's pitch circle in the wheel plane; the impulse pin is on the fork side; the seconds hand steps eight times a second.
5. The keyless chain: ratchet and crown wheel share a module and a plausible centre distance; the stem, pinion, crown and neck are aligned; the click spring meets the click.
6. Numerals and applied indices sit above the chapter ring; hands reach the minute track; the balance moved inboard so its rim is not clipped by the ring.
7. Catalogue copy corrected for material, tooth counts, jewel count, hand lengths, case diameter and coil count.
8. Reset really flies home; the reserve/time/ARIA readouts update from the clock; the play control no longer uses an inverted `aria-pressed`; Locate uses `aria-disabled` so it cannot drop focus.
9. Touch no longer clears its preview on the synthetic `pointerleave`.
10. Labels follow the explosion and hide before the inspector; the explosion returns the keyless works clear of the plate.
11. `advanceClockMutable` and the grade uniform remove the steady-state allocations; auto-downgrade is wired after sustained slow frames.
12. The smoke test now enforces the draw-call and triangle budgets and verifies locate/reset.

## Carried into round 2

The object still needs a final art-direction pass: the bridges read as rounded lobes rather than shaped plates, the plate has empty quadrants, and the case's four lugs are simpler than the rest of the finishing. The reviewers will be asked whether those are release-blocking or polish.
