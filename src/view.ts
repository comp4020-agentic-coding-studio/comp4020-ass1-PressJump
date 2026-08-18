/**
 * SVG timeline renderer. Pure presentation: takes a SimResult and a pixel
 * width, draws one row per agent. Colored blocks are the four phases,
 * hatched red blocks are wasted work (cold builds, branch switches), and
 * dotted gaps between an agent's blocks are blocked (waiting) time.
 */
import type { PhaseName, SimResult } from './model';

const PHASE_CLASS: Record<PhaseName, string> = {
  plan: 'plan',
  edit: 'edit',
  build: 'build',
  test: 'test',
  'cold-build': 'waste',
  'branch-switch': 'waste',
};

const PHASE_TITLE: Record<PhaseName, string> = {
  plan: 'plan',
  edit: 'edit',
  build: 'build (incremental)',
  test: 'test',
  'cold-build': 'cold build — wasted',
  'branch-switch': 'branch switch — wasted',
};

const ROW_H = 22;
const ROW_GAP = 10;
const PAD_TOP = 6;
const AXIS_H = 24;
const GUTTER = 34; // left space for agent labels
const PAD_RIGHT = 6;

function esc(s: string): string {
  return s.replace(/&/g, '&amp;').replace(/</g, '&lt;');
}

/** Pick a tick step of 1/2/5×10^k giving roughly five ticks. */
function tickStep(span: number): number {
  const raw = span / 5;
  const mag = 10 ** Math.floor(Math.log10(Math.max(raw, 1)));
  for (const m of [1, 2, 5, 10]) {
    if (m * mag >= raw) return m * mag;
  }
  return 10 * mag;
}

export function render(
  svg: SVGSVGElement,
  result: SimResult,
  widthPx: number,
  // Unique per SVG: several timelines share the page, and duplicate
  // pattern ids would make every one resolve to the first.
  patternId = 'hatch',
): void {
  const n = result.agentCount;
  const width = Math.max(widthPx, 240);
  const height = PAD_TOP + n * (ROW_H + ROW_GAP) - ROW_GAP + AXIS_H;
  const plotW = width - GUTTER - PAD_RIGHT;
  const scale = plotW / result.wallClock;
  const x = (t: number) => GUTTER + t * scale;
  const rowY = (a: number) => PAD_TOP + a * (ROW_H + ROW_GAP);

  const parts: string[] = [];
  parts.push(
    `<defs><pattern id="${patternId}" width="6" height="6" patternUnits="userSpaceOnUse" patternTransform="rotate(45)">` +
      `<rect width="6" height="6" fill="var(--c-waste)"/>` +
      `<line x1="1" y1="0" x2="1" y2="6" stroke="var(--c-waste-ink)" stroke-width="2"/>` +
      `</pattern></defs>`,
  );

  // Recessive grid + axis ticks.
  const step = tickStep(result.wallClock);
  const plotBottom = rowY(n - 1) + ROW_H;
  for (let t = 0; t <= result.wallClock; t += step) {
    const gx = x(t);
    parts.push(
      `<line x1="${gx}" y1="${PAD_TOP}" x2="${gx}" y2="${plotBottom}" stroke="var(--grid)" stroke-width="1"/>`,
      `<text x="${gx}" y="${plotBottom + 16}" text-anchor="middle" class="tick">${t}</text>`,
    );
  }
  parts.push(
    `<line x1="${GUTTER}" y1="${plotBottom + 1.5}" x2="${x(result.wallClock)}" y2="${plotBottom + 1.5}" stroke="var(--baseline)" stroke-width="1"/>`,
  );

  for (let a = 0; a < n; a++) {
    const spans = result.spans[a]!;
    const y = rowY(a);
    const mid = y + ROW_H / 2;
    parts.push(
      `<text x="${GUTTER - 6}" y="${mid + 4}" text-anchor="end" class="tick">A${a + 1}</text>`,
    );
    // Blocked time: dotted line through each gap between consecutive spans.
    for (let i = 1; i < spans.length; i++) {
      const gapStart = spans[i - 1]!.end;
      const gapEnd = spans[i]!.start;
      if (gapEnd > gapStart) {
        parts.push(
          `<line x1="${x(gapStart) + 1}" y1="${mid}" x2="${x(gapEnd) - 1}" y2="${mid}" ` +
            `stroke="var(--muted)" stroke-width="2" stroke-dasharray="2 4">` +
            `<title>A${a + 1} · blocked (waiting) · ${gapStart}–${gapEnd}</title></line>`,
        );
      }
    }
    for (const s of spans) {
      const cls = PHASE_CLASS[s.phase];
      const fill = cls === 'waste' ? `url(#${patternId})` : `var(--c-${cls})`;
      const w = Math.max((s.end - s.start) * scale - 1, 0.75);
      parts.push(
        `<rect x="${x(s.start) + 0.5}" y="${y}" width="${w}" height="${ROW_H}" rx="2" ` +
          `fill="${fill}" stroke="var(--surface)" stroke-width="1">` +
          `<title>${esc(`A${a + 1} · ${PHASE_TITLE[s.phase]} · ${s.start}–${s.end}`)}</title></rect>`,
      );
    }
  }

  svg.setAttribute('viewBox', `0 0 ${width} ${height}`);
  svg.setAttribute('width', String(width));
  svg.setAttribute('height', String(height));
  svg.innerHTML =
    `<style>.tick{font:11px system-ui,sans-serif;fill:var(--muted)}</style>` +
    parts.join('');
}

export function renderLegend(el: HTMLElement): void {
  const sw = (body: string) =>
    `<svg width="18" height="12" aria-hidden="true">${body}</svg>`;
  const box = (fill: string) =>
    sw(`<rect x="0.5" y="0.5" width="17" height="11" rx="2" fill="${fill}" stroke="var(--border)"/>`);
  const items: [string, string][] = [
    [box('var(--c-plan)'), 'plan'],
    [box('var(--c-edit)'), 'edit'],
    [box('var(--c-build)'), 'build'],
    [box('var(--c-test)'), 'test'],
    [
      sw(
        `<defs><pattern id="hatch-legend" width="6" height="6" patternUnits="userSpaceOnUse" patternTransform="rotate(45)">` +
          `<rect width="6" height="6" fill="var(--c-waste)"/>` +
          `<line x1="1" y1="0" x2="1" y2="6" stroke="var(--c-waste-ink)" stroke-width="2"/>` +
          `</pattern></defs>` +
          `<rect x="0.5" y="0.5" width="17" height="11" rx="2" fill="url(#hatch-legend)" stroke="var(--border)"/>`,
      ),
      'wasted — cold build / branch switch',
    ],
    [
      sw(
        `<line x1="1" y1="6" x2="17" y2="6" stroke="var(--muted)" stroke-width="2" stroke-dasharray="2 4"/>`,
      ),
      'blocked — waiting',
    ],
  ];
  el.innerHTML = items
    .map(([swatch, label]) => `<span class="item">${swatch}${label}</span>`)
    .join('');
}
