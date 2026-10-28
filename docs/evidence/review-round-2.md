# Review round 2 — sharper lenses, same two roles

Date: 2026-10-28
Range: after round-1 fixes (commit `94e5473` plus the follow-up changes).
Reviewers: two fresh independent subagents, A (horology, geometry, materials) and B (interaction, accessibility, performance, delivery), briefed with the round-1 log and asked to verify fixes rather than re-describe the product.

## What both found

**The mobile sheet was still the weakest interaction.** B drove a real touch at 360×800: a tap on the balance previewed `balance-cock`, the sheet grew and covered the point, and the second tap landed on the card. A's geometry review found the balance's outer rim still clipped by the chapter ring in the committed hero. Different lenses, same conclusion: the marquee part was not fully available or fully visible on the device the spec calls out.

**The delivery was not finished.** B confirmed that the branch was unpushed, the live URL 404s, and the workflow's Chromium step installed no browser. A confirmed the copy still contained an escape-wheel sentence ("one tooth per beat") that contradicted the animation it describes. Neither is a rendering defect; both would have shipped a lie.

**The bridges and the crystal remain the visual ceiling.** A's two highest-impact suggestions were to reshaped the bridges as pierced plates with real cutaways and to reduce the crystal's grey veil. B independently flagged the crystal smudges and the white-clipped bridge feet. The mechanism is now trusted; the metal still does not yet look photographed.

## Contradictions

- A judged the balance move "a nudge, still clipped"; B judged the mobile behaviour "release-blocking" but did not test the desktop rim. Both were right about their own seam. Fixed by shrinking the balance rim and moving it inboard, and by collapsing the mobile sheet to 12 rem so the lower half of the dial stays tappable.
- A reported the escapement banks at the balance's turning points rather than at centre. B's probes did not cover sub-beat timing. The escapement phase is a genuine remaining mechanism critique; the visual fix (stones parented to the fork so they travel with it) was applied, the half-beat unlock phase is recorded as follow-up rather than rushed.
- A found 154,982 scene triangles; B read 309,650 from the rendered pass. The README now states both and explains which one is the budget.

## Fixes applied after round 2

1. Catalogue: the escape wheel is described as half a tooth per beat (two beats per tooth, five seconds per revolution); the third wheel's 7.5:1 step; the minute hand's tail; the seconds hand's 4.3 mm.
2. Balance rim reduced to 3.55 + 0.30 mm and moved to y −8.9, so the chapter ring no longer cuts it in the hero; the impulse pin sits on the fork's side at the roller radius.
3. Pallet stones are a pivot that rotates with the fork, on the escape wheel's plane and pitch circle.
4. Mobile: the sheet is 12 rem with a two-line detail, so a 6 o'clock part stays above it and the second tap can pin; the inspector is hidden while the tour is open so the two cards cannot collide.
5. Auto-downgrade now evaluates a rolling FPS sample every two seconds instead of a one-shot frame count.
6. Stale hover is cleared when Escape returns the machine to idle; the inspector no longer re-renders on every explosion tick.
7. README and workflow: both triangle numbers, the scene-vs-pipeline draw-call distinction, the Playwright-managed Chromium step (`playwright install --with-deps chromium`), and Pages enablement on the configure step.
8. Round-2 evidence and ADR are committed with the screenshots.

## What is deliberately left

- **Bridge silhouettes.** They are shaped along their load paths and finished with Côtes de Genève, anglage, chatons and blued screws, but they read as rounded lobes rather than pierced plates. This is the top of the art-direction backlog, recorded here rather than hidden.
- **Half-beat unlock phase.** The fork banks with the beat; a lever escapement unlocks as the balance crosses centre. The balance rate, the escape step and the fork travel are correct; the phase relationship is the next mechanism refinement.
- **The live URL.** It cannot exist until this branch merges to `main` and the Pages workflow runs. The README says so; the PR carries the evidence that the artefact is the one the workflow will publish.

## Verdict

Both reviewers agreed the mechanism, the inspection contract, the reduced-motion path, the deterministic screenshots and the build/test/delivery scaffolding are ready for a PR. They disagreed on whether the object clears the "museum photograph" bar: A says not yet, B says the interaction does. That disagreement is recorded honestly; the remaining work is visual, not structural.
