# Grill session — The Open Movement

**Date:** 2026-10-28
**Mode:** autonomous. The user delegated every decision and asked for the recommended answer, so each round is answered in place. The design tree is still worked in dependency order: later rounds only ask what earlier answers unlocked.

**Attendees:** product, horology, rendering, interaction, delivery.

---

## The objective, sharpened

> Build **The Open Movement** — a museum-grade, real-time 3D skeleton watch that explains a mechanical calibre by inspection, not by diagram. Every visible component is a real, procedurally modelled part with a name and a job; hovering reveals both. The movement runs on a 4 Hz Swiss lever escapement with a coherent gear train, can be exploded, slowed, toured and read, and still holds 60 fps on a mid-range laptop. It ships as a static site on GitHub Pages, fully offline after load, with no external 3D assets.

The hard part is not "draw gears in Three.js". The hard part is the collision of four constraints:

1. **Horological coherence** — wheel ratios, beat rate, motion works and power path must agree with each other.
2. **Material realism** — polished steel, grained brass, ruby jewels and anglage must read as physical objects under a studio light, without downloaded models or textures.
3. **Inspection UX** — the information layer must never obscure the object it explains, and must work with mouse, keyboard, touch and reduced motion.
4. **Performance** — dozens of animated, beveled, reflective parts at high pixel density, in a browser, on integrated graphics.

Every decision below is in service of that collision.

---

## Round 1 — Product and fidelity

### ❓ Q1 — What exactly is the artifact? A watch, a diagram, or a toy?

Options: (a) a product-style watch configurator, (b) a labelled diagram with 3D styling, (c) an interactive instrument that treats the movement itself as the exhibit.

➡️ **(c) An interactive instrument.** The movement is the hero: no product options, no cart, no fake brand marketing. The page opens like a museum vitrine, and the primary verb is *inspect*. This keeps every pixel and every interaction pointed at the mechanism, which is what the user asked to understand.

**Decision:** an interactive exhibit. One calibre, one composition, no configuration.

### ❓ Q2 — Who is the audience, and what should they know after 60 seconds?

Options: (a) children, (b) curious adults with no watch knowledge, (c) watch enthusiasts.

➡️ **(b) Curious adults**, with a rewarding second layer for enthusiasts. The first hover explains a part in plain language ("The mainspring stores the energy…"). The inspector card adds a one-line technical spec (teeth, rate, material) for readers who want it. We never write down to the audience and never assume the vocabulary.

**Decision:** plain-language first sentence, technical second sentence, always visible.

### ❓ Q3 — "Hyper realistic" with no downloadable models. What does that mean concretely?

Options: (a) photogrammetry assets, (b) hand-authored procedural geometry with a strong material system, (c) stylised low-poly.

➡️ **(b) Procedural, physically based, art-directed.** Every mesh is generated from parameters — teeth count, module, bevel width, plate radius. Realism comes from silhouette, bevels, layered materials and lighting, not texture count. We explicitly reject (a): external assets add licence risk, network weight, and a look that breaks when the camera gets close. We reject (c): a low-poly look would fail the brief.

Concretely: PBR metals with measured roughness ranges, procedural perlage and Côtes de Genève, real bevels on every bridge, ruby transmission, a studio HDRI built at runtime, bloom and a soft contact shadow. The bar is "a jeweller would believe it at arm's length", not "indistinguishable from a macro photograph".

**Decision:** procedural geometry plus a shared, physically based material system. No external meshes or texture files.

### ❓ Q4 — Which movement, and which side of it do we show?

Options: (a) a faithful clone of a named commercial calibre, (b) an original illustrative calibre shown skeletonised from the dial side, (c) an abstract machine.

➡️ **(b) An original calibre, shown skeletonised.** A real watch hides its most interesting parts: the motion works sit under the dial and the balance usually sits under the back. A skeletonised presentation is the honest way to show everything at once, and it is a real genre of watchmaking. We will call it **Calibre MW-01**, state its illustrative nature in the README, and keep its ratios internally consistent.

**Decision:** original 4 Hz manual-wind calibre, skeletonised, hands and chapter ring on the viewer's side.

### ❓ Q5 — State the challenge as a single falsifiable sentence.

➡️ "A first-time visitor can hover any of at least 20 named components, read what it does, and then correctly explain the path from mainspring to balance wheel — without leaving the page — while the scene sustains 60 fps."

**Decision:** this is the acceptance bar for the experience, and the source of the hover-catalogue test.

---

## Round 2 — Interaction, motion and information

### ❓ Q6 — Hover, click, or both?

Options: (a) hover only, (b) click only, (c) hover previews, click pins.

➡️ **(c) Hover previews, click pins.** Hover is the requested behaviour and the fastest path to information. Pinning exists because a moving camera plus a tooltip is hostile to reading, and because keyboard and touch users cannot hover. One part is inspected at a time; the selected part gets an outline and the rest dims slightly.

**Decision:** hover/tap previews, click/Enter pins, Escape clears, `[` and `]` cycle parts.

### ❓ Q7 — Where does the information live: a floating tooltip, a fixed card, or labels in 3D?

➡️ **A fixed inspector card, with optional 3D labels.** Floating tooltips chase the cursor and cover the object. A fixed card is readable, accessible, and gives the copy room to breathe. 3D labels are a toggle for orientation, not the primary channel. The card has a stable layout: category, name, one-line job, longer explanation, technical spec, and a "locate" affordance that eases the camera to the part.

**Decision:** fixed inspector panel on desktop, bottom sheet on mobile, 3D labels optional.

### ❓ Q8 — How does the watch move? Real time is boring; slow motion is fast.

➡️ **Three coupled clocks.** (1) The *escapement clock* runs at 4 Hz and always animates the balance, fork and escape wheel. (2) The *display clock* drives the hands and can run at 1×, 60× or 600×. (3) The *train clock* is derived from the display clock through the gear ratios, so the wheels visibly turn in time-lapse. A separate slow-motion multiplier (1×, 0.1×, 0.02×) scales all three without changing the ratios. Ratios are computed, never hand-animated per wheel.

**Decision:** one simulation clock with a speed multiplier; every rotation is derived from a single `trainAngle` function.

### ❓ Q9 — What does "exploded view" mean here?

➡️ **A layered vertical separation along the watch axis, not a random scatter.** Groups separate in assembly order: case and crystal, hands and chapter ring, motion works, bridges, wheel train, escapement and balance, main plate, keyless works. Each layer moves a fixed distance with a slight stagger, so the viewer reads assembly order. A slider controls the amount; the tour can drive it.

**Decision:** deterministic layered explosion, driven by one 0–1 scalar.

### ❓ Q10 — Is there a guided tour? How long?

➡️ **Yes: six stops, about 90 seconds, skippable and resumable.** Stops: power (mainspring and barrel), transmission (gear train), regulation (escapement and balance), display (motion works and hands), winding (keyless works), and assembly (exploded view). Each stop moves the camera, pins the relevant part, and writes a two-sentence narration. The tour is a state machine, not a video.

**Decision:** six-stop tour, keyboard accessible, reduced-motion aware.

### ❓ Q11 — Mobile and accessibility: an afterthought or a constraint?

➡️ **A constraint.** The scene is capped at 1.5 DPR on mobile and reduces bloom; the inspector becomes a bottom sheet; tap selects, drag orbits, and a dedicated "inspect" mode prevents accidental camera moves. Keyboard: Tab reaches the canvas, arrows orbit, `+`/`-` zoom, `[`/`]` cycle parts, Enter pins, Escape clears. All copy is in the DOM, not in WebGL, so screen readers can read it. `prefers-reduced-motion` disables auto-orbit, camera flights and the tour's animated transitions.

**Decision:** input parity across mouse, touch and keyboard; DOM-based information layer.

---

## Round 3 — Engineering and delivery

### ❓ Q12 — React Three Fiber or vanilla Three.js?

➡️ **Vanilla Three.js with TypeScript and a thin DOM UI.** The scene is a deterministic graph of generated parts, not a reactive component tree; React would add a reconciler between us and the thing we are tuning. A vanilla build is smaller, starts faster, and lets the render loop stay allocation-free. The cost is manual DOM wiring, which is contained in a small UI module. Recorded as ADR-0001.

**Decision:** Vite + TypeScript + Three.js, no UI framework.

### ❓ Q13 — What is the performance budget, exactly?

➡️ **60 fps at 1440×900 on an integrated GPU; 30 fps floor on a 2021 mid-range phone.** Budget: ≤ 250 draw calls, ≤ 350k triangles, ≤ 1.5 DPR on mobile, one directional shadow map at 2048², bloom at half resolution, no per-frame geometry creation, no per-frame material compilation. Geometry is merged per material where parts do not animate independently; repeated screws and jewels are instanced.

**Decision:** the budget is a testable acceptance criterion; a debug HUD reports fps, calls and triangles.

### ❓ Q14 — Where are the seams for tests?

➡️ **Pure logic first, pixels second.** The highest seam is the **calibre model**: gear ratios, beat scheduling, motion-works ratios, power reserve, explode interpolation, tour transitions, and the part catalogue. All of it is plain TypeScript with no Three.js import, tested with Vitest. The second seam is the **DOM contract**: the inspector renders the part that interaction selects, which we test with Testing Library on a jsdom harness. A Playwright smoke test proves the WebGL scene boots, a part can be hovered, and the card updates. Prior art: none in this repo yet; these become the patterns.

**Decision:** logic unit tests, DOM contract tests, one browser smoke test. Recorded in the spec's Testing Decisions.

### ❓ Q15 — How is it delivered?

➡️ **Static GitHub Pages, built by GitHub Actions.** Vite with a relative base so the artefact works at any path. No server, no analytics, no runtime network calls. A single workflow builds, tests, uploads the Pages artefact and deploys on `main`. Fonts are self-hosted for offline integrity.

**Decision:** GitHub Pages via Actions; relative asset base; self-hosted fonts.

### ❓ Q16 — How do we prove the PR is good?

➡️ **Evidence before prose.** Before the PR: two independent review subagents receive the same brief but different lenses (horology/geometry and interaction/performance), their findings are compared, the dispatch is refined, and a second round runs. The PR carries before/after screenshots, a hover evidence shot, test output, and the bundle/perf numbers. The `/pr` skill's template is mandatory.

**Decision:** two dual-review rounds minimum; PR with attached screenshots and test evidence.

### ❓ Q17 — Definition of done?

➡️ All tickets closed; tests green; build green; screenshot in README; live Pages URL verified; no open issues or PRs left behind; `retro` notes committed.

**Decision:** this is the release gate.

### ❓ Q18 — Explicit non-goals?

➡️ No date/time setting interaction, no alarms, no chronograph, no tourbillon, no strap customiser, no account system, no server-side anything, no claim that MW-01 is a replica of a commercial calibre. No audio.

**Decision:** recorded in the spec's Out of Scope.

---

## Where the design landed

The tree is exhausted. The frontier is empty: every branch — product, fidelity, interaction, motion, engineering, delivery — has a decision, and every decision has a recorded consequence. The spec synthesises these answers; the tickets cut them into demoable slices.

**One sentence to carry into implementation:** *Make the mechanism legible, then make it beautiful — never the other way round.*
