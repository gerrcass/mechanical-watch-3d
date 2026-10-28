# 0006 — Static GitHub Pages, built in CI

The site is a static Vite build deployed to GitHub Pages by a GitHub Actions workflow on every push to `main`. Assets use a relative base so the same artefact works at a project path or a custom domain. Fonts are self-hosted; there are no runtime network requests, analytics or server components.

**Why:** the deliverable is a single-page exhibit with no user data and no backend. Pages is free, colocated with the source, and its Actions deployment gives an auditable build. Relative bases avoid the classic project-page 404 on nested assets and keep the build portable.

**Consequences:** the only environment-specific behaviour is the deploy workflow. Tests and screenshots run against the local preview server, which is the same artefact CI publishes.
