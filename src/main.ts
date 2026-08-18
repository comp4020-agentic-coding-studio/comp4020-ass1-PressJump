import { MAX_AGENTS, simulate, type Mode } from './model';
import { render, renderLegend } from './view';

const svg = document.querySelector<SVGSVGElement>('#timeline')!;
const chart = document.querySelector<HTMLElement>('figure.chart')!;
const slider = document.querySelector<HTMLInputElement>('#agents')!;
const agentsOut = document.querySelector<HTMLOutputElement>('#agents-out')!;
const clock = document.querySelector<HTMLElement>('#clock')!;

slider.max = String(MAX_AGENTS);

function currentMode(): Mode {
  const checked = document.querySelector<HTMLInputElement>(
    'input[name="mode"]:checked',
  )!;
  return checked.value as Mode;
}

function update(): void {
  const n = Number(slider.value);
  agentsOut.value = String(n);
  const result = simulate(n, currentMode());
  clock.textContent = String(result.wallClock);
  const styles = getComputedStyle(chart);
  const innerWidth =
    chart.clientWidth -
    parseFloat(styles.paddingLeft) -
    parseFloat(styles.paddingRight);
  render(svg, result, innerWidth);
}

slider.addEventListener('input', update);
for (const radio of document.querySelectorAll('input[name="mode"]')) {
  radio.addEventListener('change', update);
}
new ResizeObserver(update).observe(chart);

renderLegend(document.querySelector<HTMLElement>('#legend')!);
update();
