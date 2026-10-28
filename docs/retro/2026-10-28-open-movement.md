# Retro — The Open Movement, 2026-10-28

A retrospective on the build session, following the `retro` skill's categories. The environment changes below are ordered by severity; two were applied in this pass.

## 1. Navigation — the integration worktree was not discoverable

**What happened.** The planning session created `feat/open-movement` on `origin`, then the implementation delegate checked it out in `/home/gerrcass/.t3/worktrees/mechanical-watch-3d/t3-2a0eb6d1`. The parent session's first `git checkout` failed with "already checked out at …", and the parent had to discover the worktree path from the error. A fresh agent could waste a lot of context looking for the code it was told to review.

**Fix.** Add `git worktree list` to the navigation pointers in `AGENTS.md`, and record the integration branch's worktree in the delivery section. The worktree is temporary, but the *habit* is the durable improvement: a branch that is already checked out is a pointer, not an error.

## 2. Automated checks — the black-frame bug was invisible to every test

**What happened.** The UnrealBloom pass turned the composer output black. All 39 unit tests and the draw-call/triangle assertions passed because the scene still had 228 calls and 154k triangles; only the screenshot showed the failure. The bloom removal is now recorded in ADR-0008.

**Fix.** Treat a deterministic screenshot as a test artefact, not just evidence. `npm run shot` is deterministic; the next step is a cheap luminance-variance assertion on `hero.png` (reject an image that is >98% near-black or has no warm pixels). That single check would have caught the bloom regression before the PR.

## 3. Automated checks — the phone blocker needed a phone test

**What happened.** The inspector was capped at `12rem` with `overflow: hidden`; the detail and the `Locate` button were clipped at 390×844. The desktop tests passed. Two reviewers found it by driving a real touch viewport.

**Fix (applied).** The e2e suite now has a 390×844 touch page that previews, pins, switches the pin, checks the card and Locate bounds, and checks internal scrolling. It also verifies the no-JS page. Keep that seam; it is the cheapest defence against a desktop-only composition.

## 4. Coding standards — layer order is a cross-file invariant

**What happened.** The bridges, hands and chapter ring were each internally plausible, but their Z layers contradicted each other; the bridge feet crossed the chapter ring and the escapement pivots missed their jewels. The type checker cannot see a 3D assembly.

**Fix.** Add one review rule to `CODING_STANDARDS.md`: every assembly layer must be checked at the hero and the exploded views, and every jewel must have an arbor that reaches it. The reviewer should assert the *relationship*, not the individual part. The visual evidence is the test; the rule tells the reviewer what to look for.

## 5. Tool economy — a dangling preview server poisons the next run

**What happened.** A failed screenshot run left two `vite preview` processes on port 4173. The next `npm run shot` attached to the stale server and timed out waiting for a debug API that the old build did not expose. Killing the orphans fixed it immediately.

**Fix (applied).** `scripts/shot.mjs` now awaits `server.stop()` in `finally`, and the preview helper's port is part of the failure output. The broader habit: when a browser-based check times out, check the port before debugging the app. The deterministic screenshot is only deterministic if it owns its server.

## Non-findings

- The calibre seam is strong: 39 pure tests cover ratios, beat scheduling, motion works, reserve, explosion order, catalogue integrity and the DOM contract. Do not weaken it.
- `window.__openMovement` earned its place: the e2e, the capture and the manual QA all use it. Keep it behind the page, not in the product UI.
- The no-WebGL fallback and the `lite` tier are real paths, not decoration; the 390px and JS-disabled checks keep them honest.

## Next

The remaining visual gap is art direction, not architecture: bridge silhouettes, crystal refraction and a photographed surface. The next session should start from `docs/evidence/hero.png` and a single reference photograph, and change one material family at a time.
