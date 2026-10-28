# 0001 — Vanilla Three.js instead of React Three Fiber

The scene is one deterministic graph of procedurally generated parts, tuned every frame, with a DOM UI of roughly a dozen controls. React's reconciler would sit between the code and that graph for no benefit, so the project uses Three.js directly behind a small scene-controller module, with TypeScript and hand-wired DOM for the interface.

**Considered options:** React Three Fiber (familiar component model, `drei` helpers) and Babylon.js (batteries included). R3F's declarative layer is valuable when scene state is application state; here the scene is built once and mutated by a clock, and the extra runtime plus version-coupling is a cost. Babylon is heavier than the product needs.

**Consequences:** the UI module owns DOM updates; the scene controller exposes a small, testable command surface (`inspect`, `pin`, `setExplode`, `setSpeed`, `startTour`). No React dependency, smaller bundle, full control of the render loop.
