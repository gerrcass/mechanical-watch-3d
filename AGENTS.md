# AGENTS.md — The Open Movement

An interactive, procedurally modelled 3D skeleton watch (Calibre MW-01) that explains itself on hover. Static site, no backend.

## Read these first

- **Spec:** `docs/spec.md` (mirror of issue #1). It is the product contract.
- **Tickets:** `docs/tickets.md`, then `gh issue view <n>` for the ticket being worked. GitHub issues are the tracker; close each with a comment when its acceptance criteria pass.
- **Vocabulary:** `GLOSSARY.md`. Use its terms in code, copy and commits.
- **Decisions:** `docs/adr/`. Respect them; supersede with a new ADR rather than silently diverging.
- **Design session:** `docs/grill/2026-10-28-open-movement.md` explains *why* the product is shaped this way.

## Architecture pointers

```
src/
├── calibre/     # pure TypeScript: ratios, beat, hands, reserve, catalogue, tour reducer
├── core/        # engine, materials, textures, geometry factories, interaction, animation
├── watch/       # part factories and the assembly (barrel, train, escapement, display, keyless, case)
├── ui/          # DOM inspector, controls, tour UI, fallback, debug HUD
└── styles/
tests/           # Vitest: pure model + DOM contract
e2e/             # Playwright smoke + deterministic screenshots
docs/            # spec, grill, ADRs, evidence
```

`calibre/` must not import Three.js. Every rotation, ratio and time value comes from it; scene code never recomputes one.

## Invariants

- **Procedural only.** No external models, textures, HDRs or runtime font fetches. Finishes are canvas-generated maps.
- **One inspection state.** Hover previews, click pins, Escape clears, brackets cycle. The DOM inspector is the only description surface.
- **DOM accessibility.** The canvas is focusable; information lives in an `aria-live` region; all controls are real elements.
- **Performance budget.** ≤ 250 draw calls, ≤ 350k triangles, 60 fps at 1440×900. No per-frame allocation in the loop; merge static geometry; instance repeats.
- **Reduced motion is a first-class path.** It disables auto-orbit and camera flights, not the escapement.

## Commands

```sh
npm run dev        # Vite dev server
npm run build      # production build into dist/
npm run preview    # serve the production build
npm run test       # Vitest (model + DOM)
npm run test:e2e   # Playwright smoke against the built site
npm run lint       # tsc --noEmit + eslint
npm run shot       # deterministic hero + hover screenshots into docs/evidence/
```

## Delivery

- Integration branch `feat/open-movement`; one PR into `main` when all tickets pass. If it is already checked out, `git worktree list` is the map.
- Before the PR: two independent review subagents on different lenses (horology/geometry and interaction/performance), compare findings, refine the dispatch, run a second round. Fix what survives.
- Use the `/pr` skill template (`~/.config/opencode/skills/pr/SKILL.md`). Commit screenshots to `docs/evidence/`, embed them, and upload the same files with `gh pr create --attach` / `gh pr edit --attach`; attach the test log as a fenced block.
- Merge only with green tests/build and a verified screenshot. Then deploy `main` to Pages and confirm the live URL.
- Do not leave a ticket, issue or PR open without a stated reason.
- Review standards: `CODING_STANDARDS.md`.
