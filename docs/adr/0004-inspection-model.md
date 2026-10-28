# 0004 — Hover previews, click pins, one part at a time

Inspection follows a two-stage model. Hovering a part previews it in the inspector and outlines it; clicking (or Enter, or tapping) pins it so the camera can move and the copy can be read. Escape clears. The inspector describes exactly one part at a time, and non-selected parts dim slightly rather than disappearing.

**Why:** the requested behaviour is hover-to-learn, but a hover-only design fails keyboard users, touch users and anyone who wants to read while orbiting. A single-focus model also keeps the copy honest: components overlap, and describing "the thing under the cursor" is ambiguous once two parts occupy the same pixel. The raycaster picks the nearest interactive mesh, and the inspector is the single source of truth for what is being described.

**Consequences:** interaction state is a small finite machine (`idle → preview → pinned`). The DOM inspector, the 3D outline and the accessible live region all derive from that one state. Tests target the machine and the DOM contract, not pixel colour.
