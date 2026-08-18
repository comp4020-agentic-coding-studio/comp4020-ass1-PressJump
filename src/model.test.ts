/**
 * Property tests for the scheduler. The input space is finite
 * (agentCount 1..MAX_AGENTS x 3 modes = 24 points), so every property is
 * checked exhaustively rather than sampled.
 */
import { describe, expect, it } from 'vitest';
import {
  BUSY_PER_AGENT,
  CORES,
  ITERATIONS,
  MAX_AGENTS,
  MODES,
  simulate,
  type Mode,
  type SimResult,
  type Span,
} from './model';

const COUNTS = Array.from({ length: MAX_AGENTS }, (_, i) => i + 1);

const everyCase: [number, Mode][] = COUNTS.flatMap((n) =>
  MODES.map((m): [number, Mode] => [n, m]),
);

function allSpans(r: SimResult): Span[] {
  return r.spans.flat();
}

describe('determinism and shape', () => {
  it('same inputs give deeply identical output', () => {
    for (const [n, mode] of everyCase) {
      expect(simulate(n, mode)).toEqual(simulate(n, mode));
    }
  });

  it('an agent never does two things at once, and spans are ordered', () => {
    for (const [n, mode] of everyCase) {
      for (const agent of simulate(n, mode).spans) {
        for (let i = 1; i < agent.length; i++) {
          expect(agent[i]!.start).toBeGreaterThanOrEqual(agent[i - 1]!.end);
        }
      }
    }
  });
});

describe('property 1: single agent, identical wall clock in every mode', () => {
  it('with one agent there is nobody to contend with', () => {
    const clocks = MODES.map((m) => simulate(1, m).wallClock);
    expect(new Set(clocks).size).toBe(1);
  });
});

describe('property 2: busy time is conserved', () => {
  it('every agent, in every mode at every count, does exactly BUSY_PER_AGENT of busy work', () => {
    for (const [n, mode] of everyCase) {
      for (const agent of simulate(n, mode).spans) {
        const busy = agent
          .filter((s) => s.kind === 'busy')
          .reduce((sum, s) => sum + (s.end - s.start), 0);
        expect(busy, `mode=${mode} n=${n}`).toBe(BUSY_PER_AGENT);
      }
    }
  });
});

describe('property 3: wall clock is monotone across modes', () => {
  it('shared tree >= cold worktrees >= shared cache, at every agent count', () => {
    for (const n of COUNTS) {
      const shared = simulate(n, 'shared-tree').wallClock;
      const cold = simulate(n, 'worktree-cold').wallClock;
      const cache = simulate(n, 'worktree-shared').wallClock;
      expect(shared, `n=${n} shared-tree vs worktree-cold`).toBeGreaterThanOrEqual(cold);
      expect(cold, `n=${n} worktree-cold vs worktree-shared`).toBeGreaterThanOrEqual(cache);
    }
  });
});

describe('property 5: cold builds happen exactly as often as each mode dictates', () => {
  // Added after mutation testing: deleting the cache invalidation on tree
  // handover passed properties 1-4, because nothing pinned how many builds
  // are cold. This is the page's whole story, so it gets its own invariant.
  it('shared tree: every post-handover build is cold; worktrees: one per agent; shared cache: one total', () => {
    for (const n of COUNTS) {
      const coldCount = (mode: Mode) =>
        allSpans(simulate(n, mode)).filter((s) => s.phase === 'cold-build')
          .length;
      // n=1: no handovers, so only the first build is cold. n>=2: FIFO makes
      // the tree round-robin, so every turn follows a handover and is cold.
      expect(coldCount('shared-tree'), `n=${n} shared-tree`).toBe(
        n === 1 ? 1 : n * ITERATIONS,
      );
      expect(coldCount('worktree-cold'), `n=${n} worktree-cold`).toBe(n);
      expect(coldCount('worktree-shared'), `n=${n} worktree-shared`).toBe(1);
    }
  });
});

describe('property 4: exclusive resources never overlap', () => {
  it('capacity-1 resources have no overlapping holders', () => {
    for (const [n, mode] of everyCase) {
      const byResource = new Map<string, Span[]>();
      for (const s of allSpans(simulate(n, mode))) {
        for (const res of s.resources) {
          if (res === 'cores') continue; // capacity CORES, checked below
          if (!byResource.has(res)) byResource.set(res, []);
          byResource.get(res)!.push(s);
        }
      }
      for (const [res, holders] of byResource) {
        const sorted = [...holders].sort((a, b) => a.start - b.start);
        for (let i = 1; i < sorted.length; i++) {
          expect(
            sorted[i]!.start,
            `mode=${mode} n=${n} resource=${res}`,
          ).toBeGreaterThanOrEqual(sorted[i - 1]!.end);
        }
      }
    }
  });

  it('never more than CORES concurrent builds', () => {
    for (const [n, mode] of everyCase) {
      const holders = allSpans(simulate(n, mode)).filter((s) =>
        s.resources.includes('cores'),
      );
      // Sweep: +1 at each start, -1 at each end; ends before starts on ties.
      const edges = holders
        .flatMap((s) => [
          { t: s.start, d: +1 },
          { t: s.end, d: -1 },
        ])
        .sort((a, b) => a.t - b.t || a.d - b.d);
      let inUse = 0;
      for (const e of edges) {
        inUse += e.d;
        expect(inUse, `mode=${mode} n=${n}`).toBeLessThanOrEqual(CORES);
      }
    }
  });
});
