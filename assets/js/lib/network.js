// network.js — the group's network in the hero: the Noor Holding logo with its companies in a circle around it.
// Drawn from data/subsidiaries.json, so the graphic grows with the group:
//   • add a company → one entry in "companies" (+ its logo). Spacing and sizes recalculate by themselves;
//     past ~20 companies a second, inner circle opens.
// Clicking a company fires "subsidiary:show" (the carousel listens and opens its card).
import { i18n } from "./i18n.js";

const IMG = "./assets/images/subsidiaries/";
const CENTER_LOGO = "./assets/images/brand/logo-dark.svg";

let dataPromise;
const loadData = () => (dataPromise ??= fetch("./data/subsidiaries.json").then((r) => r.json()));
const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

const polar = (radius, angleDeg) => {
  const a = ((angleDeg - 90) * Math.PI) / 180; // 0° = top, clockwise
  return { x: +(50 + radius * Math.cos(a)).toFixed(3), y: +(50 + radius * Math.sin(a)).toFixed(3) };
};
const clamp = (min, value, max) => Math.min(max, Math.max(min, value));

function render(data) {
  const companies = data.companies;
  const n = Math.max(companies.length, 1);
  const chord = (radius, deg) => 2 * radius * Math.sin((deg * Math.PI) / 360); // distance, in % of the width

  // One circle of logos around the group, like the original wheel. If the group grows past ~20 companies,
  // every other logo moves to an inner circle so the logos stay large enough.
  const R_OUT = 40;
  const R_IN = 27;
  const twoRings = n > 20;
  const outer = twoRings ? companies.filter((_, i) => i % 2 === 0) : companies;
  const inner = twoRings ? companies.filter((_, i) => i % 2 === 1) : [];
  const size = Math.min(13.5, chord(R_OUT, 360 / outer.length) * 0.8, twoRings ? chord(R_IN, 360 / inner.length) * 0.8 : 99);

  const lines = [];
  const pulses = [];
  const nodes = [];
  const place = (list, radius, offset) =>
    list.forEach((c, i) => {
      const angle = (360 / list.length) * i + offset;
      const p = polar(radius, angle);
      const index = nodes.length;
      lines.push(`<line x1="50" y1="50" x2="${p.x}" y2="${p.y}" />`);
      if (!reduceMotion) {
        // A small light travelling from the group to each company, one after another around the circle.
        const begin = ((index / n) * 4.5).toFixed(2);
        pulses.push(`<circle class="net-pulse" r="0.6" cx="50" cy="50">
            <animate attributeName="cx" values="50;${p.x}" dur="4.5s" begin="${begin}s" repeatCount="indefinite" />
            <animate attributeName="cy" values="50;${p.y}" dur="4.5s" begin="${begin}s" repeatCount="indefinite" />
            <animate attributeName="opacity" values="0;1;1;0" keyTimes="0;0.15;0.75;1" dur="4.5s" begin="${begin}s" repeatCount="indefinite" />
          </circle>`);
      }
      const tag = c.slide ? "button" : "div";
      nodes.push(`<${tag} ${c.slide ? 'type="button"' : 'tabindex="0"'} class="net-node net-company"
          style="--x:${p.x}%;--y:${p.y}%;--size:${size.toFixed(2)}%;--i:${index}"
          ${c.slide ? `data-slide="${c.slide}"` : ""} aria-label="${c.name}">
          <img src="${IMG}${c.logo}" alt="" loading="lazy" decoding="async" draggable="false" />
          <span class="net-tip" role="tooltip">${c.name}</span>
        </${tag}>`);
    });
  place(outer, R_OUT, 0);
  place(inner, R_IN, 180 / Math.max(inner.length, 1));

  return `
    <div class="net-orbit">
      <svg class="net-lines" viewBox="0 0 100 100" aria-hidden="true">
        <circle class="net-ring" cx="50" cy="50" r="${R_OUT}" />
        ${twoRings ? `<circle class="net-ring" cx="50" cy="50" r="${R_IN}" />` : ""}
        ${lines.join("")}
        ${pulses.join("")}
      </svg>
      ${nodes.join("")}
    </div>
    <div class="net-node net-center" style="--x:50%;--y:50%;--size:28%">
      <img src="${CENTER_LOGO}" alt="Noor Holding" decoding="async" />
    </div>`;
}

export async function mountNetwork() {
  const containers = document.querySelectorAll("[data-network]");
  if (!containers.length) return;
  const data = await loadData();
  await i18n.ready;

  containers.forEach((el) => {
    el.classList.add("network");
    el.innerHTML = render(data);

    el.addEventListener("click", (e) => {
      const slide = e.target.closest("[data-slide]")?.dataset.slide;
      if (slide) document.dispatchEvent(new CustomEvent("subsidiary:show", { detail: { slide } }));
    });
    el.addEventListener("keydown", (e) => {
      if (e.key === "Enter" && e.target.matches("[data-slide]")) e.target.click();
    });

  });

  // Hero figures follow the data.
  document.querySelectorAll("[data-count='companies']").forEach((n) => (n.textContent = data.companies.length));
  document.querySelectorAll("[data-count='sectors']").forEach((n) => (n.textContent = new Set(data.companies.map((c) => c.sector)).size));

  requestAnimationFrame(() => containers.forEach((el) => el.classList.add("is-in")));
  // After the entrance: hover/press respond without the stagger delay, and the slow rotation starts.
  setTimeout(() => containers.forEach((el) => el.classList.add("is-settled")), 1600);
}
