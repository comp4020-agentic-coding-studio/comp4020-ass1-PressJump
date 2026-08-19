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

## 2. Timings

- Every timing constant lives in `src/model.ts` — nowhere else.
- Each constant carries a comment directly above it saying what it stands for.
- The page works in abstract time units by design. Do not convert them to
  seconds or dress them up as real-world durations anywhere on the page —
  the point is how the setups compare, not the magnitudes.

## 3. The timeline code stays deterministic

- The code in `src/model.ts` takes the settings in and gives the same
  timeline back every time. No randomness, no clocks, no reads from the
  environment.
- The property tests in `src/model.test.ts` must pass (`npx vitest run`)
  before any task is called done. No exceptions, including view-only
  changes.
- The site must still build (`npx vite build`) before a task is called
  done.

## 4. A new property test must first catch a deliberate bug

Green on first run proves nothing about a test's teeth. Before trusting a
new property test, break the scheduler on purpose in the way the test is
meant to forbid, watch it fail, then restore. Added after the original
four properties all stayed green while the cache-invalidation-on-handover
line, the central mechanic of shared-tree mode, was deleted.

## 5. The copy must not read as generated

- No em dashes and no colons in visible page copy. Use a comma, a
  semicolon or a full stop instead. The agent reaches for both by
  default. Code comments are exempt; visitors never read them.
- Carried forward from the crit-2 harness, where a test failed the
  build on a single em dash.

## 6. Small screens are proven on a real phone

- The page must work at a 390px phone viewport with no horizontal
  overflow, and under 44rem the tighter type scale applies (smaller
  root font, tighter hero and section padding).
- An emulated phone viewport is not proof on its own. Before a layout
  change is called done, open the dev server from a real phone over the
  LAN and look at it. Added after an emulated 375px check passed while
  a real phone showed a desktop page scaled up.

## 7. Scope

One idea, one mechanic. Do not add: a git graph, merge-conflict modelling,
agent output/logs, a settings panel, a landing page, extra pages, or any
feature not explicitly asked for.
