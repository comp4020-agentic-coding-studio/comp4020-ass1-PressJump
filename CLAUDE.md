# CLAUDE.md — harness rules for this repo

This is the COMP4020 Assignment 1 prototype: a static, client-side interactive
explainer. These rules are the standards the work runs against. They are not
suggestions.

## 1. Static and client-side, always

- No server, no backend, no API routes.
- No runtime `fetch`, `XMLHttpRequest`, `WebSocket`, or any other network call.
- No network dependencies at all in the built page: no CDN scripts, no remote
  fonts, no remote images. Everything ships in the bundle.
- The build target is a static site deployable to GitHub Pages.

## 2. Simulation constants

- Every simulation constant lives in `src/model.ts` — nowhere else.
- Each constant carries a comment directly above it naming where the number
  came from.
- **Never invent a plausible-looking timing constant.** If a real measured
  value is not available, the constant stays in obviously-abstract units,
  is clearly marked `// TODO(measure): ...`, and the human is told it needs
  measuring. Do not dress placeholders up as realistic seconds.

## 3. Tests gate "done"

- The property tests in `src/model.test.ts` must pass (`npx vitest run`)
  before any task is called done. No exceptions, including view-only changes.
- The model is a pure, deterministic function. Any change that introduces
  randomness, wall-clock reads, or environment dependence into `src/model.ts`
  is wrong by definition.

## 4. A new property test must first catch a deliberate bug

Green on first run proves nothing about a test's teeth. Before trusting a
new property test, break the scheduler on purpose in the way the test is
meant to forbid, watch it fail, then restore. Added after the original
four properties all stayed green while the cache-invalidation-on-handover
line — the central mechanic of shared-tree mode — was deleted.

## 5. Scope

One idea, one mechanic. Do not add: a git graph, merge-conflict modelling,
agent output/logs, a settings panel, a landing page, extra pages, or any
feature not explicitly asked for.
