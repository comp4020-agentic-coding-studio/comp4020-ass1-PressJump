import { MAX_AGENTS, simulate, type Mode } from './model';
import { render, renderLegend } from './view';

const svg = document.querySelector<SVGSVGElement>('#timeline')!;
const chart = document.querySelector<HTMLElement>('figure.chart')!;
const slider = document.querySelector<HTMLInputElement>('#agents')!;
const agentsOut = document.querySelector<HTMLOutputElement>('#agents-out')!;
const clock = document.querySelector<HTMLElement>('#clock')!;
const minis = [...document.querySelectorAll<HTMLElement>('figure.mini')];

slider.max = String(MAX_AGENTS);

function currentMode(): Mode {
  const checked = document.querySelector<HTMLInputElement>(
    'input[name="mode"]:checked',
  )!;
  return checked.value as Mode;
}

function innerWidth(el: HTMLElement): number {
  const styles = getComputedStyle(el);
  return (
    el.clientWidth -
    parseFloat(styles.paddingLeft) -
    parseFloat(styles.paddingRight)
  );
}

function update(): void {
  const n = Number(slider.value);
  agentsOut.value = String(n);
  const result = simulate(n, currentMode());
  clock.textContent = String(result.wallClock);
  render(svg, result, innerWidth(chart));
}

/** The static illustrations in the prose sections, one per figure.mini. */
function renderMinis(): void {
  for (const fig of minis) {
    const result = simulate(Number(fig.dataset.n), fig.dataset.mode as Mode);
    render(
      fig.querySelector('svg')!,
      result,
      innerWidth(fig),
      `hatch-${fig.id}`,
    );
    const out = fig.querySelector('[data-clock]');
    if (out) out.textContent = String(result.wallClock);
  }
}

slider.addEventListener('input', update);
for (const radio of document.querySelectorAll('input[name="mode"]')) {
  radio.addEventListener('change', update);
}

const ro = new ResizeObserver(() => {
  update();
  renderMinis();
});
ro.observe(chart);
for (const fig of minis) ro.observe(fig);

renderLegend(document.querySelector<HTMLElement>('#legend')!);
update();
renderMinis();
