// site-nav.js — navbar on every page:
//   • slide-out mobile menu (#mobile-menu-btn, #mobile-menu, #mobile-backdrop)
//   • hides when scrolling down, comes back when scrolling up
//   • <nav data-solid-on-scroll>: transparent over the hero, solid once the page scrolls (homepage)

export function initSiteNav() {
  const nav = document.querySelector("nav");
  const menu = document.getElementById("mobile-menu");
  const menuButton = document.getElementById("mobile-menu-btn");
  const backdrop = document.getElementById("mobile-backdrop");
  const hamburger = document.getElementById("hamburger-icon");
  const close = document.getElementById("close-icon");
  if (!nav) return;

  const isOpen = () => menu && !menu.classList.contains("-translate-x-full");
  const setMenu = (open) => {
    if (!menu) return;
    menu.classList.toggle("-translate-x-full", !open);
    backdrop?.classList.toggle("hidden", !open);
    hamburger?.classList.toggle("hidden", open);
    close?.classList.toggle("hidden", !open);
    menuButton?.setAttribute("aria-expanded", String(open));
    document.body.classList.toggle("overflow-hidden", open);
    if (open) nav.classList.remove("-translate-y-full");
  };

  menuButton?.addEventListener("click", () => setMenu(!isOpen()));
  backdrop?.addEventListener("click", () => setMenu(false));
  menu?.querySelectorAll("a").forEach((link) => link.addEventListener("click", () => setMenu(false)));
  document.addEventListener("keydown", (e) => e.key === "Escape" && setMenu(false));
  window.matchMedia("(min-width: 768px)").addEventListener("change", (e) => e.matches && setMenu(false));

  const solidOnScroll = nav.hasAttribute("data-solid-on-scroll");
  let lastY = window.scrollY;
  let ticking = false;

  function update() {
    const y = window.scrollY;
    if (solidOnScroll) nav.classList.toggle("is-solid", y > 40);
    if (y < 120 || y < lastY - 4) nav.classList.remove("-translate-y-full");
    else if (y > lastY + 4 && !isOpen()) nav.classList.add("-translate-y-full");
    lastY = y;
    ticking = false;
  }

  window.addEventListener(
    "scroll",
    () => {
      if (!ticking) {
        ticking = true;
        requestAnimationFrame(update);
      }
    },
    { passive: true }
  );
  nav.addEventListener("focusin", () => nav.classList.remove("-translate-y-full"));
  update();
}
