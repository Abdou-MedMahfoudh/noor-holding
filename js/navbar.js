// navbar.js - Standalone navigation handler
// Use this for pages that don't need the full NewsManager functionality

class NavbarManager {
  constructor() {
    this.navbar = document.querySelector("nav");
    this.lastScrollY = 0;
    this.ticking = false;

    this.init();
  }

  init() {
    this.setupMobileMenu();
    this.setupNavbarScroll();
  }

  setupMobileMenu() {
    // Mobile menu toggle functionality
    const mobileMenuBtn = document.getElementById("mobile-menu-btn");
    const mobileMenu = document.getElementById("mobile-menu");
    const mobileBackdrop = document.getElementById("mobile-backdrop");
    const hamburgerIcon = document.getElementById("hamburger-icon");
    const closeIcon = document.getElementById("close-icon");

    if (!mobileMenuBtn || !mobileMenu) return; // Exit if elements don't exist

    mobileMenuBtn.addEventListener("click", () => {
      const isOpen = !mobileMenu.classList.contains("-translate-x-full");

      if (isOpen) {
        // Close menu
        this.closeMobileMenu();
      } else {
        // Open menu
        this.openMobileMenu();
      }
    });

    // Close menu when clicking backdrop
    if (mobileBackdrop) {
      mobileBackdrop.addEventListener("click", () => {
        this.closeMobileMenu();
      });
    }

    // Close menu on escape key
    document.addEventListener("keydown", (e) => {
      if (
        e.key === "Escape" &&
        !mobileMenu.classList.contains("-translate-x-full")
      ) {
        this.closeMobileMenu();
      }
    });
  }

  openMobileMenu() {
    const mobileMenu = document.getElementById("mobile-menu");
    const mobileBackdrop = document.getElementById("mobile-backdrop");
    const hamburgerIcon = document.getElementById("hamburger-icon");
    const closeIcon = document.getElementById("close-icon");

    mobileMenu.classList.remove("-translate-x-full");
    if (mobileBackdrop) mobileBackdrop.classList.remove("hidden");

    if (hamburgerIcon && closeIcon) {
      hamburgerIcon.classList.add("hidden");
      hamburgerIcon.classList.remove("block");
      closeIcon.classList.remove("hidden");
      closeIcon.classList.add("block");
    }

    document.body.classList.add("overflow-hidden");
  }

  closeMobileMenu() {
    const mobileMenu = document.getElementById("mobile-menu");
    const mobileBackdrop = document.getElementById("mobile-backdrop");
    const hamburgerIcon = document.getElementById("hamburger-icon");
    const closeIcon = document.getElementById("close-icon");

    mobileMenu.classList.add("-translate-x-full");
    if (mobileBackdrop) mobileBackdrop.classList.add("hidden");

    if (hamburgerIcon && closeIcon) {
      hamburgerIcon.classList.remove("hidden");
      hamburgerIcon.classList.add("block");
      closeIcon.classList.add("hidden");
      closeIcon.classList.remove("block");
    }

    document.body.classList.remove("overflow-hidden");
  }

  setupNavbarScroll() {
    if (!this.navbar) return; // Exit if navbar doesn't exist

    const showThreshold = 120; // Show navbar when within 100px of top

    window.addEventListener("scroll", () => {
      if (!this.ticking) {
        requestAnimationFrame(() => {
          this.updateNavbar(showThreshold);
          this.ticking = false;
        });

        this.ticking = true;
      }
    });
  }

  updateNavbar(showThreshold) {
    const currentScrollY = window.scrollY;

    // Always show when near top
    if (currentScrollY < showThreshold) {
      this.showNavbar();
    }
    // Hide when scrolling down, show when scrolling up
    else if (
      currentScrollY > this.lastScrollY &&
      currentScrollY > showThreshold
    ) {
      // Scrolling down - hide navbar
      this.hideNavbar();
    } else if (currentScrollY < this.lastScrollY) {
      // Scrolling up - show navbar
      this.showNavbar();
    }

   
  }

  showNavbar() {
    this.navbar.classList.remove("-translate-y-full");
    this.navbar.classList.add("translate-y-0");
  }

  hideNavbar() {
    this.navbar.classList.add("-translate-y-full");
    this.navbar.classList.remove("translate-y-0");
  }
}

// Initialize navbar manager when DOM is loaded
document.addEventListener("DOMContentLoaded", () => {
  new NavbarManager();
});
console.log("NavbarManager initialized");