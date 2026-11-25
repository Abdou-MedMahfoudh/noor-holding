// home.js — homepage: intro sequence, hero slideshow, subsidiaries carousel, latest news.
import { i18n } from "../lib/i18n.js";
import { loadNews, newsCardHtml } from "../lib/news.js";
import { initSiteNav } from "../lib/site-nav.js";
import { mountNetwork } from "../lib/network.js";


const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

/* ---------- Intro: the one orchestrated moment (wheel → title → stats → buttons) ---------- */
function playIntro() {
  const items = [
    ...document.querySelectorAll("#spider-web, #spider-web-mobile"),
    ...document.querySelectorAll("h1.fade-item, p.fade-item"),
    ...document.querySelectorAll(".grid.fade-item"),
    ...document.querySelectorAll("a.fade-item, button.fade-item"),
  ];
  items.forEach((el, i) => {
    setTimeout(() => el.classList.add("visible"), reduceMotion ? 0 : i * 70);
    // Once in place, drop the intro classes so hover/press states work normally.
    el.addEventListener("transitionend", () => el.classList.remove("fade-item", "visible"), { once: true });
  });
  // Elements hidden at this screen size never fire transitionend.
  setTimeout(() => items.forEach((el) => el.classList.remove("fade-item", "visible")), 2500);
}

/* ---------- Hero background slideshow (slow crossfade + zoom) ---------- */
function initHeroSlideshow() {
  const slides = document.querySelectorAll(".hero-slide");
  const dots = document.querySelectorAll(".indicators button");
  if (!slides.length) return;
  let current = 0;
  let timer;

  // Slides 2 and 3 load once the page is up, so they don't compete with the first one.
  const loadLazySlides = () =>
    slides.forEach((slide) => {
      if (slide.dataset.bg) slide.style.backgroundImage = `url('${slide.dataset.bg}')`;
    });
  if (document.readyState === "complete") loadLazySlides();
  else window.addEventListener("load", loadLazySlides, { once: true });

  const show = (index) => {
    slides[current].classList.remove("active");
    dots[current]?.classList.remove("active");
    current = index;
    slides[current].classList.add("active");
    dots[current]?.classList.add("active");
  };
  const restart = () => {
    clearInterval(timer);
    timer = setInterval(() => show((current + 1) % slides.length), 7000);
  };
  dots.forEach((dot, i) =>
    dot.addEventListener("click", () => {
      show(i);
      restart();
    })
  );
  // Don't advance while the tab is hidden.
  document.addEventListener("visibilitychange", () => (document.hidden ? clearInterval(timer) : restart()));
  restart();
}

/* ---------- Subsidiaries carousel: buttons, dots, keyboard, drag/swipe ---------- */
function initSubsidiariesCarousel() {
  const track = document.getElementById("carouselTrack");
  const viewport = track?.parentElement;
  const dotsContainer = document.getElementById("carouselDots");
  const counter = document.getElementById("carouselCount");
  if (!track) return;
  const slides = [...track.children];
  const total = slides.length;
  let current = 0;

  const dots = slides.map((_, i) => {
    const dot = document.createElement("button");
    dot.type = "button";
    dot.className = "carousel-dot";
    dot.setAttribute("aria-label", `${i + 1} / ${total}`);
    dot.addEventListener("click", () => goTo(i));
    dotsContainer.appendChild(dot);
    return dot;
  });

  function setPosition(offsetPx = 0) {
    track.style.transform = `translate3d(calc(${-current * 100}% + ${offsetPx}px), 0, 0)`;
  }

  function goTo(index) {
    current = (index + total) % total;
    setPosition();
    slides.forEach((slide, i) => {
      const active = i === current;
      slide.classList.toggle("is-active", active);
      slide.setAttribute("aria-hidden", String(!active));
      slide.inert = !active;
    });
    dots.forEach((dot, i) => dot.setAttribute("aria-current", String(i === current)));
    if (counter) counter.textContent = `${current + 1} / ${total}`;
  }

  document.getElementById("prevBtn")?.addEventListener("click", () => goTo(current - 1));
  document.getElementById("nextBtn")?.addEventListener("click", () => goTo(current + 1));

  viewport.tabIndex = 0;
  viewport.addEventListener("keydown", (e) => {
    if (e.key === "ArrowLeft") goTo(current - 1);
    if (e.key === "ArrowRight") goTo(current + 1);
  });

  // Drag with mouse or finger. A quick flick is enough (velocity), no need to drag halfway.
  let start = null;
  viewport.addEventListener("pointerdown", (e) => {
    if (e.button !== 0 || start) return; // ignore extra fingers mid-drag
    start = { x: e.clientX, y: e.clientY, t: performance.now(), id: e.pointerId, dragging: false };
  });
  viewport.addEventListener("pointermove", (e) => {
    if (!start || e.pointerId !== start.id) return;
    const dx = e.clientX - start.x;
    const dy = e.clientY - start.y;
    if (!start.dragging) {
      if (Math.abs(dx) < 8 || Math.abs(dx) < Math.abs(dy)) return; // let vertical scrolling happen
      start.dragging = true;
      viewport.setPointerCapture(e.pointerId);
      track.classList.add("is-dragging");
    }
    // Friction past the first and last card instead of a hard stop.
    const atEdge = (current === 0 && dx > 0) || (current === total - 1 && dx < 0);
    setPosition(atEdge ? dx * 0.3 : dx);
  });
  const end = (e) => {
    if (!start || e.pointerId !== start.id) return;
    const dx = e.clientX - start.x;
    const wasDragging = start.dragging;
    const velocity = Math.abs(dx) / (performance.now() - start.t);
    start = null;
    track.classList.remove("is-dragging");
    if (!wasDragging) return;
    track.classList.add("was-dragged");
    setTimeout(() => track.classList.remove("was-dragged"), 0);
    const far = Math.abs(dx) > viewport.clientWidth * 0.2;
    if ((far || velocity > 0.4) && dx < 0 && current < total - 1) goTo(current + 1);
    else if ((far || velocity > 0.4) && dx > 0 && current > 0) goTo(current - 1);
    else setPosition();
  };
  viewport.addEventListener("pointerup", end);
  viewport.addEventListener("pointercancel", end);
  // A drag should not count as a click on a link inside the card.
  viewport.addEventListener("click", (e) => track.classList.contains("was-dragged") && e.preventDefault(), true);

  // Clicking a logo in the hero network opens that company's card.
  document.addEventListener("subsidiary:show", (e) => {
    const index = slides.findIndex((slide) => slide.dataset.key === e.detail.slide);
    if (index < 0) return;
    goTo(index);
    document.getElementById("subsidiaries")?.scrollIntoView({ behavior: reduceMotion ? "auto" : "smooth" });
  });

  goTo(0);
}

/* ---------- Latest news (3 cards) ---------- */
async function renderLatestNews() {
  const container = document.getElementById("news-container");
  if (!container) return;
  try {
    const latest = (await loadNews()).slice(0, 3);
    container.innerHTML = latest.map(newsCardHtml).join("");
  } catch (error) {
    console.error(error);
    container.innerHTML = `<div class="text-center text-gray-500">Unable to load news at the moment.</div>`;
  }
}

/* ---------- CEO message: company names in bold ("SLMP SA : …" → <strong>SLMP SA :</strong> …) ---------- */
function boldEntityNames() {
  document.querySelectorAll('[data-i18n^="ceoMessage.entities."]').forEach((p) => {
    const text = p.textContent.trim();
    // Prefer the colon ("AFH – Africaine des Hydrocarbures : …"), else the first dash ("CASA – …").
    const match = text.match(/^(.{2,90}?)(\s?[:：]\s)/) || text.match(/^(.{2,90}?)(\s?[–-]\s)/);
    if (!match) return;
    const strong = document.createElement("strong");
    strong.className = "text-executive-navy font-semibold";
    strong.textContent = match[1] + match[2].trimEnd();
    p.replaceChildren(strong, document.createTextNode(" " + text.slice(match[0].length)));
  });
}

/* ---------- Start ---------- */
document.addEventListener("DOMContentLoaded", () => {
  initSiteNav();
  initHeroSlideshow();
  initSubsidiariesCarousel();

  // Draw the network graphic, then play the intro (1.2 s at most).
  let started = false;
  const start = () => !started && (started = true) && playIntro();
  mountNetwork().then(start, start);
  setTimeout(start, 1200);
});

i18n.onChange(renderLatestNews);
i18n.onChange(boldEntityNames);
