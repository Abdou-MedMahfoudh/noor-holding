// news.js — shared helpers for news data (data/news.json + data/news-translations.json).
import { i18n } from "./i18n.js";

let cache = null;

/** All articles, newest first. Each item: { id, date, picture, featured }. */
export async function loadNews() {
  if (!cache) {
    const response = await fetch("./data/news.json");
    if (!response.ok) throw new Error(`Failed to load news (${response.status})`);
    const data = await response.json();
    cache = (Array.isArray(data) ? data : []).sort((a, b) => new Date(b.date) - new Date(a.date));
  }
  return cache;
}

/** Translated field of an article: title, description, author, category, content. */
export function articleText(id, field) {
  return i18n.tn(`articles.${id}.${field}`) || "";
}

const LOCALES = { fr: "fr-FR", en: "en-US", ar: "ar" };

/** Date in the visitor's language, e.g. "22 octobre 2026". */
export function formatDate(dateString) {
  const date = new Date(dateString);
  if (Number.isNaN(date.getTime())) return dateString;
  return date.toLocaleDateString(LOCALES[i18n.lang] || "fr-FR", { year: "numeric", month: "long", day: "numeric" });
}

export function escapeHtml(text) {
  return String(text).replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c]);
}

const CALENDAR_ICON = `<svg class="w-3 h-3 text-skyline flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"></path></svg>`;

/** Card used on the homepage "Latest news" section. */
export function newsCardHtml(item) {
  const title = escapeHtml(articleText(item.id, "title"));
  const image = item.picture
    ? `<div class="h-48"><img src="${item.picture}" alt="${title}" loading="lazy" decoding="async" class="w-full h-full object-cover"></div>`
    : `<div class="h-48 bg-gradient-to-br from-skyline to-gulf"></div>`;
  return `
  <article class="bg-white rounded-lg shadow-lg overflow-hidden hover:shadow-xl transition-shadow duration-300">
    ${image}
    <div class="p-6">
      <div class="flex items-center space-x-2 mb-3">
        ${CALENDAR_ICON}
        <span class="text-sm text-gray-500">${formatDate(item.date)}</span>
      </div>
      <h3 class="text-xl font-medium text-midnight mb-3 hover:text-skyline transition-colors">
        <a href="./news.html?id=${item.id}">${title}</a>
      </h3>
      <p class="text-gray-600 leading-relaxed mb-4 line-clamp-3">${escapeHtml(articleText(item.id, "description"))}</p>
      <div class="flex items-center space-x-2">
        <a href="./news.html?id=${item.id}" class="text-sm text-gulf font-medium hover:text-midnight transition-colors">${
          i18n.t("news.readMore") || "Voir plus"
        }</a>
        <svg class="w-3 h-3 text-gulf" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7"></path></svg>
      </div>
    </div>
  </article>`;
}

/** Card used on the "All news" page. */
export function newsListCardHtml(item) {
  const title = escapeHtml(articleText(item.id, "title"));
  const image = item.picture
    ? `<div class="relative h-48 overflow-hidden">
         <img src="${item.picture}" alt="${title}" loading="lazy" decoding="async" class="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105">
         <div class="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent"></div>
       </div>`
    : `<div class="h-48 bg-gradient-to-br from-sand/20 to-skyline/20"></div>`;
  return `
  <a href="./news.html?id=${item.id}" class="news-card block bg-white rounded-lg shadow-lg overflow-hidden group">
    ${image}
    <div class="p-6">
      <div class="flex items-center space-x-2 mb-3">
        ${CALENDAR_ICON}
        <span class="text-sm text-gray-500">${formatDate(item.date)}</span>
      </div>
      <h3 class="text-xl font-dm-serif text-midnight mb-3 group-hover:text-gulf transition-colors duration-300 line-clamp-2">${title}</h3>
      <p class="text-gray-600 leading-relaxed mb-4 line-clamp-3">${escapeHtml(articleText(item.id, "description"))}</p>
      <div class="flex items-center space-x-2 text-gulf group-hover:text-midnight transition-colors duration-300">
        <span class="text-sm font-medium">${i18n.t("news.readMore") || "Voir plus"}</span>
        <svg class="w-3 h-3 transform group-hover:translate-x-1 transition-transform duration-300" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7"></path></svg>
      </div>
    </div>
  </a>`;
}
