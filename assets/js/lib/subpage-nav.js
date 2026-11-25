// subpage-nav.js — navbar for the inner pages (news list, article):
// slide-out mobile menu + hide the bar when scrolling down, show it when scrolling up.

export function initSubpageNav() {
  const nav = document.querySelector("nav");
  const menu = document.getElementById("mobile-menu");
  const menuButton = document.getElementById("mobile-menu-btn");
  const backdrop = document.getElementById("mobile-backdrop");
  const hamburger = document.getElementById("hamburger-icon");
  const close = document.getElementById("close-icon");

  const isOpen = () => menu && !menu.classList.contains("-translate-x-full");
  const setMenu = (open) => {
    if (!menu) return;
    menu.classList.toggle("-translate-x-full", !open);
    backdrop?.classList.toggle("hidden", !open);
    hamburger?.classList.toggle("hidden", open);
    close?.classList.toggle("hidden", !open);
    document.body.classList.toggle("overflow-hidden", open);
    if (open) showNav();
  };

  menuButton?.addEventListener("click", () => setMenu(!isOpen()));
  backdrop?.addEventListener("click", () => setMenu(false));
  document.addEventListener("keydown", (e) => e.key === "Escape" && setMenu(false));

  // Hide on scroll down, show on scroll up / near the top.
  let lastY = window.scrollY;
  let ticking = false;
  function showNav() {
    nav?.classList.remove("-translate-y-full");
  }
  function hideNav() {
    nav?.classList.add("-translate-y-full");
  }
  window.addEventListener(
    "scroll",
    () => {
      if (ticking) return;
      ticking = true;
      requestAnimationFrame(() => {
        const y = window.scrollY;
        if (y < 120 || y < lastY) showNav();
        else if (y > lastY + 5 && !isOpen()) hideNav();
        lastY = y;
        ticking = false;
      });
    },
    { passive: true }
  );
  nav?.addEventListener("focusin", showNav);
}
