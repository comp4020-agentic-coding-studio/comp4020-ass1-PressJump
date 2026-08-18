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
- The site must still build (`npx vite build`) before a task is called
  done.

## 4. Scope

One idea, one mechanic. Do not add: a git graph, merge-conflict modelling,
agent output/logs, a settings panel, a landing page, extra pages, or any
feature not explicitly asked for.
