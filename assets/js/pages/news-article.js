// news-article.js — single article page (news.html?id=N).
import { i18n } from "../lib/i18n.js";
import { loadNews, articleText, formatDate } from "../lib/news.js";
import { initSiteNav } from "../lib/site-nav.js";

const $ = (id) => document.getElementById(id);

function showState(name) {
  for (const id of ["loading-state", "error-state", "article-content"]) $(id)?.classList.toggle("hidden", id !== name);
}

function renderArticle(article) {
  const title = articleText(article.id, "title");
  document.title = `${title} - Noor Holding`;

  const hero = $("hero-image");
  if (article.picture) {
    hero.src = article.picture;
    hero.alt = title;
  }
  $("article-date").textContent = formatDate(article.date);
  $("article-author").textContent = articleText(article.id, "author") || "Noor Holding";
  $("article-title").textContent = title;
  // Content is HTML written by the site admin (admin panel).
  $("article-body").innerHTML = articleText(article.id, "content");
}

function setupSharing() {
  const open = (url) => window.open(url, "_blank", "noopener,width=600,height=400");
  $("share-twitter")?.addEventListener("click", () =>
    open(`https://twitter.com/intent/tweet?text=${encodeURIComponent(document.title)}&url=${encodeURIComponent(location.href)}`)
  );
  $("share-facebook")?.addEventListener("click", () =>
    open(`https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(location.href)}`)
  );
}

document.addEventListener("DOMContentLoaded", async () => {
  initSiteNav();
  setupSharing();

  const id = Number(new URLSearchParams(location.search).get("id"));
  if (!id) return showState("error-state");

  try {
    const article = (await loadNews()).find((item) => item.id === id);
    await i18n.ready;
    if (!article || !i18n.tn(`articles.${id}.title`)) return showState("error-state");
    renderArticle(article);
    showState("article-content");
    i18n.onChange(() => renderArticle(article));
  } catch (error) {
    console.error(error);
    showState("error-state");
  }
});
