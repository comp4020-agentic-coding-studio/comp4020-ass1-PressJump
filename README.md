# Eight agents, one repo

An interactive explainer: running N coding agents on one repository does
not give you N× the throughput — they serialise on the working directory.
And isolating them into worktrees isn't enough either, because every cold
worktree pays a cold build. Isolation *plus a shared build cache* is the
part nobody talks about; the page lets you discover it.

A static, client-side build. The visitor drives the page with an
agent-count slider (1–8) and three setups (one shared checkout / a
worktree each / worktrees + shared build cache), rendered as a
per-agent timeline with a wall-clock readout.

```sh
npm install
npm test        # exhaustive property suite over all 24 (count, mode) pairs
npm run dev     # local dev server
npm run build   # static build to dist/
```

- `src/model.ts` — the pure scheduler model; every constant lives here.
- `src/model.test.ts` — the property tests that gate "done" (CLAUDE.md).
- `src/view.ts`, `src/main.ts`, `index.html` — the SVG timeline view.
- `PROCESS.md`, `reflections/assignment-1.md` — process evidence.
