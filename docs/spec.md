# Spec — The Open Movement

**Status:** ready-for-agent
**Calibre:** MW-01 (illustrative)
**Seams:** calibre model (pure logic) → DOM inspector contract → browser smoke test. Approved by delegation.

---

## Problem Statement

A mechanical watch is one of the few everyday objects whose working principle is invisible to its owner. The parts that make it keep time — the mainspring, the gear train, the escapement, the balance — are sealed behind a case back. Static cutaway diagrams flatten a three-dimensional, moving system into a picture, and they cannot answer the question a curious person actually has: *what is that piece, and what is it doing right now?*

The user wants a 3D mechanical watch diagram that is both **hyper-realistic and beautiful** and **explanatory**: hovering any piece should name it and say what it is used for. The result must be good enough to sit on a gallery page, not a technical demo with grey primitives.

## Solution

**The Open Movement** is a single-page, real-time 3D exhibit of **Calibre MW-01**, an illustrative 4 Hz manual-wind skeleton movement. It is rendered with physically based materials, procedural finishing and studio lighting, and it is fully inspectable:

- Hovering (or tapping) any named component previews it in an inspector card with its name, category, plain-language job, a longer explanation and a technical specification.
- Clicking pins the inspection; Escape clears it. Keyboard and touch have parity with the mouse.
- The movement runs: the balance beats at 4 Hz, the pallet fork releases the escape wheel, the train turns at computed ratios, the hands keep time, and the power reserve drains and rewinds.
- An exploded view separates the assembly in layer order; a six-stop tour explains the power path; speed controls range from slow motion to a 600× time-lapse.
- 3D labels, camera presets and a reset control support orientation.
- The page is responsive, reduced-motion aware, usable without a mouse, and degrades to a readable fallback if WebGL is unavailable.
- It deploys to GitHub Pages with a screenshot and live link in the README.

## User Stories

1. As a first-time visitor, I want the page to open on a beautifully lit, fully assembled movement, so that I immediately understand this is a crafted object and not a chart.
2. As a first-time visitor, I want a short line of orientation copy that tells me what I am looking at and what to do, so that I do not have to guess the interaction.
3. As a curious visitor, I want to hover any component and see its name, so that I can attach vocabulary to the shape I am looking at.
4. As a curious visitor, I want the inspector to explain what the component does in plain language, so that I understand its role without prior watch knowledge.
5. As a curious visitor, I want a second, more technical sentence and a specification line, so that I can go deeper once the basics make sense.
6. As a curious visitor, I want the hovered component to be visibly outlined, so that I know exactly which piece the card is describing.
7. As a curious visitor, I want non-inspected parts to recede slightly, so that the selected part stands out without the rest of the movement disappearing.
8. As a reader, I want to click a part to pin it, so that I can orbit the camera and read the card without the selection changing under my cursor.
9. As a reader, I want to press Escape or click empty space to clear the pin, so that I can return to the full composition.
10. As a keyboard user, I want to reach the canvas by Tab and orbit and zoom with the arrow and plus/minus keys, so that I can explore without a mouse.
11. As a keyboard user, I want bracket keys to cycle through every named part and Enter to pin, so that inspection is fully operable from the keyboard.
12. As a screen-reader user, I want the inspected part's name and description announced in a live region, so that the information is not trapped in a canvas.
13. As a touch user, I want to tap a part to inspect it and drag to orbit, so that the experience works on a phone.
14. As a touch user, I want the inspector to become a bottom sheet that does not cover the part I selected, so that I can read and see at the same time.
15. As a watch enthusiast, I want to identify the mainspring, barrel, ratchet wheel, click, crown wheel, center wheel, third wheel, fourth wheel, escape wheel, pallet fork, pallet stones, balance wheel, hairspring, shock spring, jewels, cannon pinion, minute wheel, hour wheel, winding stem, crown, setting lever, yoke, hands, chapter ring, plate, bridges and screws, so that the exhibit rewards existing knowledge.
16. As a watch enthusiast, I want the train ratios to be internally consistent and the beat rate stated, so that the animation does not lie about how a movement works.
17. As a watch enthusiast, I want the escapement visible and slowed down, so that I can see the lock, impulse and unlock sequence rather than a blur.
18. As a learner, I want a guided tour that follows energy from the mainspring to the balance, so that I build a mental model of the whole system in order.
19. As a learner, I want the tour to move the camera and pin the relevant part at each stop, so that narration and object stay connected.
20. As a learner, I want to leave the tour at any time and keep the current selection, so that I can explore a detail without losing my place.
21. As a learner, I want an exploded view, so that I can see how the layers stack and which parts sit above which.
22. As a learner, I want the explosion to follow assembly order rather than scattering parts randomly, so that the separation teaches construction.
23. As a learner, I want to adjust the explosion with a slider, so that I can choose the amount of separation that makes sense to me.
24. As a visitor, I want speed controls for the hands and train, so that I can watch a time-lapse without waiting an hour to see the minute hand move.
25. As a visitor, I want a slow-motion control, so that I can watch the escapement at a human timescale.
26. As an observer, I want a power-reserve indicator and a winding interaction, so that I understand where the energy comes from and that it is finite.
27. As an observer, I want the crown, stem, ratchet and click to move when I wind, so that the keyless works are explained by motion, not just text.
28. As a visitor, I want optional 3D labels for major components, so that I can orient myself before I start hovering.
29. As a visitor, I want camera presets for the full watch, the escapement and the motion works, so that I can get to the interesting details quickly.
30. As a visitor, I want a reset control, so that I can recover the composed hero view after exploring.
31. As a visitor on a laptop, I want the scene to hold 60 fps, so that the object feels solid and the interaction feels immediate.
32. As a visitor on a phone, I want a lighter quality tier that still looks good, so that the page does not melt my battery or stutter.
33. As a visitor with reduced-motion preferences, I want auto-orbit, camera flights and continuous decorative motion disabled, so that I can use the page comfortably.
34. As a visitor without WebGL, I want a clear, styled fallback that still names the calibre and explains what the page needs, so that I am not left with a blank rectangle.
35. As a visitor, I want a loading state that resolves into the scene rather than a flash of empty background, so that the first impression is deliberate.
36. As a visitor, I want to read the time on the chapter ring and hands, so that the exhibit is recognisably a watch and not only a mechanism.
37. As a visitor, I want the model to be labelled as an illustrative calibre, so that I know it is an explanation and not a replica.
38. As a maintainer, I want the part catalogue, ratios, beat schedule, power reserve and tour defined as pure data and functions, so that tests can prove the mechanism agrees with itself.
39. As a maintainer, I want a debug API and HUD behind a query flag, so that I can inspect performance and drive end-to-end tests without pixel-hunting.
40. As a maintainer, I want a deterministic screenshot script, so that the README and every PR carry the same representative view.
41. As a maintainer, I want a CI workflow that runs tests and builds on every push, and deploys `main` to Pages, so that the live link cannot drift from the source.
42. As a maintainer, I want the README to show the live link, a hero screenshot, the controls and the honesty note about MW-01, so that the repository explains itself.

## Implementation Decisions

### Product shape

- One calibre, one composition, no configuration, no accounts, no backend. The primary verb is **inspect**.
- Presentation is a **skeletonised dial-side calibre**: hands and chapter ring on the viewer's side, balance at six o'clock, bridges cut away. The README states the artistic licence (ADR-0005).
- The visual language is a dark museum vitrine: obsidian background, warm brass and champagne highlights, rhodium plate, ruby accents, a serif display face and a mono technical face. No decorative chrome competes with the movement.

### Scene and rendering

- Three.js with TypeScript and Vite. No React, no UI framework (ADR-0001).
- One `Engine` owns renderer, camera, orbit controls, environment, composer, resize and the RAF loop. The scene graph is built once; the frame loop mutates transforms and uniforms only.
- Materials are a shared library: polished steel, brushed steel, rhodium, yellow gold, rose gold, blued steel, ruby (transmissive), sapphire, leather-free dark metal. Metals use metalness 1, roughness in a narrow measured band, and an environment map generated at runtime from an emissive studio rig.
- Procedural surface finishes are canvas-generated roughness/bump maps: perlage on the main plate, Côtes de Genève on bridges, circular graining on wheels, sunray brushing on the chapter ring. No external image assets.
- Post-processing: ACES tone mapping, half-resolution UnrealBloom, SMAA, a subtle vignette and film grain. A soft contact shadow grounds the watch. Shadows use one directional map at 2048².
- All geometry is procedural. A gear builder takes tooth count, module, thickness, spokes and bevel and returns a beveled extruded wheel plus an arbor and pinion. A bridge builder takes a closed spline and returns a beveled plate with screw and jewel holes. Screws, jewels, hands and the case are parameterised factories.
- Quality tiers: `high` and `lite`. `lite` caps DPR at 1.5, halves bloom, disables grain and uses a smaller shadow map. Auto-select by viewport and device, with a manual override in the debug HUD; automatic downgrade if the measured frame time stays above budget.

### The calibre (single source of truth)

- Beat rate 28,800 vph = 4 Hz = 8 beats per second. Balance amplitude 270°. Escape wheel 20 teeth; half-tooth advance per beat = 9°, so the escape wheel turns once per 5 seconds.
- Chain: barrel wheel 72T → center pinion 12L (6:1); center wheel 64T → third pinion 8L (8:1); third wheel 60T → fourth pinion 8L (7.5:1); fourth wheel 72T → escape pinion 6L (12:1). Center at 1 rev/hour gives fourth at 1 rev/minute and escape at 12 rev/minute, matching the 20-tooth, 8-beat-per-second escape wheel.
- Motion works: cannon pinion 12T → minute wheel 36T (3:1); minute pinion 10T → hour wheel 40T (4:1); combined 12:1, so the hour hand turns once per 12 display hours.
- Power reserve 42 hours. The barrel turns once per 6 hours of display time, so a full wind is seven barrel revolutions.
- The crown winds through the stem, crown wheel, ratchet wheel and click. Winding adds reserve; the click prevents unwind; the ratchet turns only while winding.
- `Calibre` exposes `beatAt(t)`, `trainAngle(part, t)`, `handAngles(t)`, `powerReserveAt(t)`, and the ratio table. No consumer computes a ratio locally.
- The simulation has three clocks: the escapement clock (always 4 Hz scaled by the slow-motion factor), the display clock (1×, 60×, 600×), and the train clock (display clock through the ratios). Slow-motion factors are 1×, 0.1× and 0.02× and apply to all three, preserving ratios.

### Layout and assembly

- The watch plane is XY; the viewer looks down +Z; the case is a ring about 40 units across (1 unit = 1 mm). Movement radius 15 units.
- Parts are registered with metadata: `id`, `name`, `category`, `job`, `detail`, `spec`, assembly layer, explosion vector, and pick targets. The catalogue is data-only and testable without Three.js.
- Assembly layers, back to front: keyless, main plate, train, escapement and oscillator, motion works, bridges, hands, chapter ring, case and crystal. The exploded view separates these layers along the watch axis with a small per-part stagger, driven by one 0–1 scalar.
- At least 24 distinct inspectable parts, each with a real name and a job. Decorative screws and repeated jewels may share one catalogue entry but remain visually distinct.

### Interaction

- State machine: `idle → preview → pinned`. Hover previews; click or Enter pins; Escape clears; bracket keys cycle; tap previews on touch and a second tap pins.
- Raycasting runs against registered pick targets only, at most once per frame and only when the pointer moved. The outline uses a single selection outline pass, not per-part clones.
- The inspector is DOM, always mounted, and updates from a single render function. It is an `aria-live="polite"` region. Focus is never stolen from the canvas.
- The inspector card shows category, name, job, detail, spec, and a "locate" action that flies the camera to the part.
- Mobile: bottom sheet with a drag handle, maximum 45% viewport height, and camera framing that keeps the selected part in the upper half.
- 3D labels are toggled, anchored to part positions, and hidden behind geometry only if cheap; otherwise always on top. They are decorative and duplicated in the DOM list.

### Motion and tour

- The tour is a six-stop reducer: power, transmission, regulation, display, winding, assembly. Each stop has a camera pose, a pinned part, a narration paragraph and an optional explosion value. Next/previous/skip are explicit.
- Camera flights use a critically damped interpolation, complete in 900 ms, and snap under reduced motion. Orbit controls are disabled only during a flight.
- Auto-orbit is a slow two-degree-per-second drift, disabled on interaction, on reduced motion, and when a part is pinned. It resumes after eight seconds of idle.

### Accessibility and resilience

- The canvas is focusable with a visible focus ring and a keyboard help line. All controls are real buttons and sliders with labels.
- `prefers-reduced-motion` disables auto-orbit, flights and the tour's interpolated transitions; the escapement still runs because it is the subject, but starts in slow motion.
- A no-WebGL fallback renders the calibre name, a short explanation, the part list as a definition list, and the live link. It must not be a bare error string.
- The page works without JavaScript for the fallback copy, and without a network after the first load (fonts self-hosted, no runtime fetches).

### Delivery

- Vite relative base, static build, GitHub Actions for test + build + Pages deploy on `main`.
- A Playwright screenshot script drives the built preview at a fixed viewport, waits for a `data-ready` signal, disables auto-orbit, and writes the hero shot and a hover shot. These are the PR evidence and the README image.
- The README carries the live URL, hero screenshot, what it is, controls, the illustrative-calibre note and how to run/test.

## Testing Decisions

A good test here asserts externally observable behaviour: a ratio, a rendered label, a state transition, a boot signal. It never asserts a mesh's vertex count or a material's hex value. The calibre is the primary seam because it is where a wrong number would make the exhibit teach something false.

**Unit tests (Vitest, no DOM, no Three.js):**

- Ratio chain: center wheel one revolution per display hour; fourth wheel one per minute; escape wheel one per five seconds; barrel one per six hours.
- Beat schedule: 8 beats per second; the escape wheel advances exactly half a tooth per beat and returns to its starting angle after 20 beats; beat index is monotonic across large times.
- Motion works: hour hand 30° per display hour, minute hand 6° per minute, seconds hand 6° per second; 12:1 hour reduction.
- Power reserve: full wind = 42 h, drains monotonically with display time, winds add and clamp, unwinding stops the train.
- Explosion: scalar is clamped, layer order is preserved, zero means assembled, one means fully separated.
- Tour reducer: six stops in order, next/previous clamp, skip returns to idle, selected part matches the stop.
- Catalogue integrity: at least 24 entries, unique ids, every entry has a non-empty name, job, detail and spec, every category is known, every layer is known, every entry has at least one pick target id.
- DOM/state reducer: hover produces preview, click pins, Escape clears, cycling wraps; pinned selection survives camera movement.

**DOM contract tests (Vitest + jsdom):**

- The inspector renders the selected part's name, job and spec, and updates when the selection changes.
- Pin and clear update the card's pinned affordance and the live-region text.
- The fallback renders when the engine reports unsupported WebGL.

**Browser smoke test (Playwright):**

- The page boots, sets `data-ready`, and the canvas has a non-zero drawing buffer.
- `window.__openMovement.inspect('balance-wheel')` updates the inspector text and the outline state.
- A screenshot of the hero view and a hover view can be captured deterministically.

Prior art: there is no test suite in the repository yet. These tests establish the patterns: pure model tests beside the model, DOM tests against the inspector's public attributes, one browser test at the top seam.

## Out of Scope

- A faithful replica of a commercial calibre; MW-01 is illustrative and labelled as such.
- Date, chronograph, tourbillon, perpetual calendar or any complication beyond hours, minutes, seconds and power reserve.
- Setting the time by hand, hacking seconds, or a functional crown pull-piece.
- A strap or bracelet, product configuration, pricing, checkout or brand fiction beyond the calibre name.
- User accounts, saved views, sharing, analytics, server APIs, audio.
- Mobile-native apps or WebGPU-only features.
- Photoreal scanned assets or external 3D/texture/HDR downloads.

## Further Notes

- The hero shot should be composed at a three-quarter angle with the balance and escapement legible, not a flat top-down. The camera should never clip the case.
- The award for the work is legibility: at any moment a viewer should be able to answer "what am I looking at, and what is it doing?" Hover is the contract; beauty is the reason to stay.
- The screenshot must be committed and linked in the README; evidence in the PR uses the same script but a hover state.
- The site must remain readable and navigable at 360 px wide.
