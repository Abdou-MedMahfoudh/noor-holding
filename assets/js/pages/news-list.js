// news-list.js — "All news" page (Allnews.html): search + pagination.
import { i18n } from "../lib/i18n.js";
import { loadNews, articleText, newsListCardHtml } from "../lib/news.js";
import { initSiteNav } from "../lib/site-nav.js";

const PER_PAGE = 9;
const state = { all: [], filtered: [], page: 1, search: "" };

const $ = (id) => document.getElementById(id);

function applyFilter() {
  const term = state.search.trim().toLowerCase();
  state.filtered = !term
    ? state.all
    : state.all.filter((item) =>
        `${articleText(item.id, "title")} ${articleText(item.id, "description")}`.toLowerCase().includes(term)
      );
}

function render({ scroll = false } = {}) {
  $("loading-state").classList.add("hidden");
  const grid = $("news-grid");
  const pagination = $("pagination");

  if (!state.filtered.length) {
    grid.classList.add("hidden");
    pagination.classList.add("hidden");
    $("no-results").classList.remove("hidden");
    updateCounter();
    return;
  }

  $("no-results").classList.add("hidden");
  grid.classList.remove("hidden");

  const pages = Math.ceil(state.filtered.length / PER_PAGE);
  state.page = Math.min(state.page, pages);
  const start = (state.page - 1) * PER_PAGE;
  grid.innerHTML = state.filtered.slice(start, start + PER_PAGE).map(newsListCardHtml).join("");

  if (pages > 1) {
    pagination.innerHTML = paginationHtml(pages);
    pagination.classList.remove("hidden");
  } else {
    pagination.classList.add("hidden");
  }
  updateCounter();
  if (scroll) grid.scrollIntoView({ behavior: "smooth", block: "start" });
}

function paginationHtml(pages) {
  const base = "px-3 py-2 text-sm font-medium border transition-colors";
  const idle = "text-gulf bg-white border-gray-300 hover:bg-gray-50 hover:text-midnight";
  const active = "text-white bg-midnight border-midnight";
  const arrow = (d) =>
    `<svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="${d}"></path></svg>`;

  let first = Math.max(1, state.page - 2);
  const last = Math.min(pages, first + 4);
  first = Math.max(1, last - 4);

  let html = "";
  if (state.page > 1)
    html += `<button type="button" data-page="${state.page - 1}" aria-label="Previous" class="${base} ${idle} rounded-l-lg">${arrow("M15 19l-7-7 7-7")}</button>`;
  for (let i = first; i <= last; i++) {
    const rounded = (i === first && state.page === 1 ? " rounded-l-lg" : "") + (i === last && state.page === pages ? " rounded-r-lg" : "");
    html += `<button type="button" data-page="${i}" class="${base} px-4 ${i === state.page ? active : idle}${rounded}">${i}</button>`;
  }
  if (state.page < pages)
    html += `<button type="button" data-page="${state.page + 1}" aria-label="Next" class="${base} ${idle} rounded-r-lg">${arrow("M9 5l7 7-7 7")}</button>`;
  return `<nav class="flex items-center">${html}</nav>`;
}

function updateCounter() {
  const counter = $("results-counter");
  const shown = state.filtered.length;
  const total = state.all.length;
  if (!shown) counter.textContent = "No articles found";
  else if (shown === total) counter.textContent = `Showing ${total} article${total !== 1 ? "s" : ""}`;
  else counter.textContent = `Showing ${shown} of ${total} articles`;
}

document.addEventListener("DOMContentLoaded", async () => {
  initSiteNav();

  $("search-input").addEventListener("input", (e) => {
    state.search = e.target.value;
    state.page = 1;
    applyFilter();
    render();
  });

  $("pagination").addEventListener("click", (e) => {
    const button = e.target.closest("[data-page]");
    if (!button) return;
    state.page = Number(button.dataset.page);
    render({ scroll: true });
  });

  try {
    state.all = await loadNews();
  } catch (error) {
    console.error(error);
  }
  await i18n.ready;
  applyFilter();
  render();
  i18n.onChange(() => {
    applyFilter();
    render();
  });
});
