/**
 * The simulation model: a pure, deterministic function from
 * (agentCount, mode) to per-agent scheduled spans plus a total wall clock.
 *
 * No randomness, no clocks, no environment reads. Same inputs, same output.
 *
 * Each agent runs ITERATIONS tasks of the same shape:
 *   plan -> edit -> build -> test
 * Edit and test need exclusive access to a working tree. Build needs
 * exclusive access to a build output, and a core from a shared pool.
 *
 * Every build is modelled as an incremental base cost (busy: work the change
 * genuinely requires) plus, when the relevant cache is cold, a separate
 * cold-penalty span (overhead: work the mode wastes). Busy time is therefore
 * conserved across modes and agent counts; modes differ only in overhead and
 * blocked (waiting) time. Blocked time is the gap between an agent's spans.
 */

// ---------------------------------------------------------------------------
// Constants. ALL simulation constants live here (see CLAUDE.md rule 2).
//
// Units are abstract "time units", deliberately not seconds: none of these
// have been measured, and per CLAUDE.md we do not invent plausible-looking
// timings. What the model demonstrates is the *structure* of the contention,
// which holds for any positive values with COLD > incremental.
// ---------------------------------------------------------------------------

// TODO(measure): time an agent spends planning before touching the tree.
export const PLAN = 2;
// TODO(measure): time an agent holds the working tree making its edits.
export const EDIT = 4;
// TODO(measure): incremental build with a warm cache (the irreducible part).
export const BUILD_INCREMENTAL = 2;
// TODO(measure): EXTRA time a cold-cache build costs beyond incremental.
export const COLD_PENALTY = 6;
// TODO(measure): running the test suite in the tree.
export const TEST = 3;
// TODO(measure): switching branches when a different agent takes the tree.
export const BRANCH_SWITCH = 1;
// TODO(measure): concurrent builds the machine can sustain.
export const CORES = 4;
// Tasks per agent. >1 so warm-vs-cold caches matter within a single agent.
export const ITERATIONS = 3;
// UI/test bound on the agent-count control.
export const MAX_AGENTS = 8;

/** The busy time every agent does in every mode — the conserved quantity. */
export const BUSY_PER_AGENT =
  ITERATIONS * (PLAN + EDIT + BUILD_INCREMENTAL + TEST);

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export const MODES = ['shared-tree', 'worktree-cold', 'worktree-shared'] as const;
export type Mode = (typeof MODES)[number];

export type PhaseName =
  | 'plan'
  | 'edit'
  | 'build'
  | 'test'
  | 'branch-switch'
  | 'cold-build';

export interface Span {
  phase: PhaseName;
  start: number;
  end: number;
  /** busy = irreducible work; overhead = waste the mode creates. */
  kind: 'busy' | 'overhead';
  /**
   * Exclusive resources held for the whole span. Capacity 1 each, except
   * 'cores' which admits CORES concurrent holders.
   */
  resources: string[];
}

export interface SimResult {
  mode: Mode;
  agentCount: number;
  /** spans[i] = agent i's spans, ordered by start; gaps are blocked time. */
  spans: Span[][];
  wallClock: number;
}

// ---------------------------------------------------------------------------
// Entry point
// ---------------------------------------------------------------------------

export function simulate(agentCount: number, mode: Mode): SimResult {
  if (
    !Number.isInteger(agentCount) ||
    agentCount < 1 ||
    agentCount > MAX_AGENTS
  ) {
    throw new RangeError(`agentCount must be an integer in 1..${MAX_AGENTS}`);
  }
  const spans =
    mode === 'shared-tree'
      ? simulateSharedTree(agentCount)
      : simulateWorktrees(agentCount, mode === 'worktree-shared');
  const wallClock = Math.max(
    0,
    ...spans.flatMap((agent) => agent.map((s) => s.end)),
  );
  return { mode, agentCount, spans, wallClock };
}

function span(
  phase: PhaseName,
  start: number,
  duration: number,
  kind: Span['kind'],
  resources: string[],
): Span {
  return { phase, start, end: start + duration, kind, resources };
}

// ---------------------------------------------------------------------------
// Mode 1: one shared working tree.
//
// An agent must hold the tree from edit through test: the build reads the
// tree and the tests run in it, so releasing it mid-task would let another
// agent switch branches underneath. Whole tasks therefore serialise; only
// planning overlaps. Every handover is a branch switch (overhead) that
// invalidates the single build cache, so the next build pays the cold
// penalty. The tree is granted FIFO by (arrival time, agent index).
// ---------------------------------------------------------------------------

function simulateSharedTree(n: number): Span[][] {
  const spans: Span[][] = Array.from({ length: n }, () => []);
  const requests: { time: number; agent: number; iter: number }[] = [];
  for (let a = 0; a < n; a++) {
    spans[a]!.push(span('plan', 0, PLAN, 'busy', []));
    requests.push({ time: PLAN, agent: a, iter: 0 });
  }
  let treeFree = 0;
  let lastHolder = -1;
  let cacheValid = false; // nothing has ever been built

  while (requests.length > 0) {
    requests.sort((p, q) => p.time - q.time || p.agent - q.agent);
    const r = requests.shift()!;
    const out = spans[r.agent]!;
    let t = Math.max(r.time, treeFree);
    if (lastHolder !== -1 && lastHolder !== r.agent) {
      out.push(span('branch-switch', t, BRANCH_SWITCH, 'overhead', ['tree']));
      t += BRANCH_SWITCH;
      cacheValid = false; // the switch dirtied the build cache
    }
    out.push(span('edit', t, EDIT, 'busy', ['tree']));
    t += EDIT;
    const buildRes = ['tree', 'build-output', 'cores'];
    if (!cacheValid) {
      out.push(span('cold-build', t, COLD_PENALTY, 'overhead', buildRes));
      t += COLD_PENALTY;
    }
    out.push(span('build', t, BUILD_INCREMENTAL, 'busy', buildRes));
    t += BUILD_INCREMENTAL;
    cacheValid = true;
    out.push(span('test', t, TEST, 'busy', ['tree']));
    t += TEST;
    treeFree = t;
    lastHolder = r.agent;
    if (r.iter + 1 < ITERATIONS) {
      // Planning the next task doesn't need the tree, so it happens while
      // others hold it; the agent rejoins the queue when its plan is done.
      out.push(span('plan', t, PLAN, 'busy', []));
      requests.push({ time: t + PLAN, agent: r.agent, iter: r.iter + 1 });
    }
  }
  return spans;
}

// ---------------------------------------------------------------------------
// Modes 2 and 3: a worktree per agent.
//
// No tree contention: each agent edits and tests in its own tree with its own
// build output. Builds contend only for the core pool (FIFO by arrival time,
// then agent index; a core freed at time t goes to the earliest waiter).
//
// Cold cache (mode 2): each worktree starts cold, so every agent's first
// build pays the cold penalty; its own cache is warm afterwards.
//
// Shared cache (mode 3): one cache for everyone. The first build to be
// granted a core warms it and pays the one cold penalty. A build that runs
// before the warming build has finished still only does its own incremental
// work, but cannot complete until the cache entries it needs exist — it
// releases its core and blocks until the warming build completes.
// ---------------------------------------------------------------------------

function simulateWorktrees(n: number, sharedCache: boolean): Span[][] {
  const spans: Span[][] = Array.from({ length: n }, () => []);
  type Ev = { time: number; rank: 0 | 1; agent: number; iter: number };
  const events: Ev[] = []; // rank 0 = core release, rank 1 = core request
  const waiting: { time: number; agent: number; iter: number }[] = [];
  let coresFree = CORES;
  let cacheWarmAt: number | null = null; // mode 3: null until a build starts
  const worktreeWarm: boolean[] = new Array(n).fill(false); // mode 2

  const grant = (agent: number, iter: number, g: number): void => {
    const out = spans[agent]!;
    const buildRes = [`build-output:${agent}`, 'cores'];
    let t = g;
    let proceedAt: number;
    if (sharedCache) {
      if (cacheWarmAt === null) {
        // This build warms the shared cache for everyone.
        out.push(span('cold-build', t, COLD_PENALTY, 'overhead', buildRes));
        t += COLD_PENALTY;
        out.push(span('build', t, BUILD_INCREMENTAL, 'busy', buildRes));
        t += BUILD_INCREMENTAL;
        cacheWarmAt = t;
        proceedAt = t;
      } else {
        out.push(span('build', t, BUILD_INCREMENTAL, 'busy', buildRes));
        t += BUILD_INCREMENTAL;
        // Started before the cache was warm: blocked until it is.
        proceedAt = Math.max(t, cacheWarmAt);
      }
    } else {
      if (!worktreeWarm[agent]) {
        out.push(span('cold-build', t, COLD_PENALTY, 'overhead', buildRes));
        t += COLD_PENALTY;
        worktreeWarm[agent] = true;
      }
      out.push(span('build', t, BUILD_INCREMENTAL, 'busy', buildRes));
      t += BUILD_INCREMENTAL;
      proceedAt = t;
    }
    coresFree--;
    events.push({ time: t, rank: 0, agent, iter }); // core released at build end
    // Deterministic continuation: test, then next task's plan+edit, then the
    // next build request. Only the build needs shared resources.
    const tree = [`tree:${agent}`];
    out.push(span('test', proceedAt, TEST, 'busy', tree));
    let u = proceedAt + TEST;
    if (iter + 1 < ITERATIONS) {
      out.push(span('plan', u, PLAN, 'busy', []));
      u += PLAN;
      out.push(span('edit', u, EDIT, 'busy', tree));
      u += EDIT;
      events.push({ time: u, rank: 1, agent, iter: iter + 1 });
    }
  };

  const grantWhilePossible = (now: number): void => {
    while (coresFree > 0 && waiting.length > 0) {
      waiting.sort((p, q) => p.time - q.time || p.agent - q.agent);
      const w = waiting.shift()!;
      grant(w.agent, w.iter, now);
    }
  };

  for (let a = 0; a < n; a++) {
    const out = spans[a]!;
    out.push(span('plan', 0, PLAN, 'busy', []));
    out.push(span('edit', PLAN, EDIT, 'busy', [`tree:${a}`]));
    events.push({ time: PLAN + EDIT, rank: 1, agent: a, iter: 0 });
  }

  while (events.length > 0) {
    // Releases before requests at the same instant, then by agent index.
    events.sort(
      (p, q) => p.time - q.time || p.rank - q.rank || p.agent - q.agent,
    );
    const ev = events.shift()!;
    if (ev.rank === 0) {
      coresFree++;
    } else {
      waiting.push({ time: ev.time, agent: ev.agent, iter: ev.iter });
    }
    grantWhilePossible(ev.time);
  }
  return spans;
}
