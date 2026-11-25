// home.js — homepage behaviour: intro animation, hero slideshow, subsidiaries carousel, latest news.
import { i18n } from "../lib/i18n.js";
import { loadNews, newsCardHtml } from "../lib/news.js";

/* ---------- Intro animation (wheel → titles → stats → buttons) ---------- */
function playIntro() {
  const wheels = document.querySelectorAll("#spider-web, #spider-web-mobile");
  const texts = document.querySelectorAll("h1.fade-item, p.fade-item");
  const stats = document.querySelectorAll(".grid.fade-item");
  const buttons = document.querySelectorAll("button.fade-item");
  const show = (els, step, delay) => els.forEach((el, i) => setTimeout(() => el.classList.add("visible"), delay + i * step));

  wheels.forEach((el) => el.classList.add("visible"));
  show(texts, 150, 500);
  const statsDelay = 500 + texts.length * 150;
  show(stats, 200, statsDelay);
  show(buttons, 200, statsDelay + stats.length * 200 + 400);
}

/* ---------- Hero background slideshow ---------- */
function initHeroSlideshow() {
  const slides = document.querySelectorAll(".hero-slide");
  const dots = document.querySelectorAll(".indicators button");
  if (!slides.length) return;
  let current = 0;

  // Slides 2 and 3 are loaded only after the page is up, so they don't compete with the first one.
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
  dots.forEach((dot, i) => dot.addEventListener("click", () => show(i)));
  setInterval(() => show((current + 1) % slides.length), 5000);
}

/* ---------- Subsidiaries carousel ---------- */
function initSubsidiariesCarousel() {
  const track = document.getElementById("carouselTrack");
  const dotsContainer = document.getElementById("carouselDots");
  if (!track) return;
  const total = track.children.length;
  let current = 0;

  const dots = Array.from({ length: total }, (_, i) => {
    const dot = document.createElement("button");
    dot.type = "button";
    dot.setAttribute("aria-label", `Slide ${i + 1}`);
    dot.className = "w-3 h-3 rounded-full transition-all duration-300 hover:bg-executive-gold";
    dot.addEventListener("click", () => goTo(i));
    dotsContainer.appendChild(dot);
    return dot;
  });

  function goTo(index) {
    current = (index + total) % total;
    track.style.transform = `translateX(-${current * 100}%)`;
    dots.forEach((dot, i) => {
      dot.classList.toggle("bg-executive-gold", i === current);
      dot.classList.toggle("bg-gray-300", i !== current);
    });
  }

  document.getElementById("prevBtn")?.addEventListener("click", () => goTo(current - 1));
  document.getElementById("nextBtn")?.addEventListener("click", () => goTo(current + 1));

  // Swipe on touch screens
  let startX = null;
  const area = track.parentElement;
  area.addEventListener("touchstart", (e) => (startX = e.touches[0].clientX), { passive: true });
  area.addEventListener("touchend", (e) => {
    if (startX === null) return;
    const diff = startX - e.changedTouches[0].clientX;
    if (Math.abs(diff) > 50) goTo(current + (diff > 0 ? 1 : -1));
    startX = null;
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

/* ---------- Start ---------- */
document.addEventListener("DOMContentLoaded", () => {
  initHeroSlideshow();
  initSubsidiariesCarousel();

  // Start the intro as soon as the wheel image is ready (or after 1.5 s at most).
  const wheel = document.querySelector("#spider-web img");
  let started = false;
  const start = () => !started && (started = true) && playIntro();
  if (!wheel || wheel.complete) start();
  else {
    wheel.addEventListener("load", start, { once: true });
    wheel.addEventListener("error", start, { once: true });
    setTimeout(start, 1500);
  }
});

i18n.onChange(renderLatestNews);
