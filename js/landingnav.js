class MobileMenuManager {
  constructor() {
    this.mobileMenuBtn = document.getElementById("mobile-menu-btn");
    this.mobileMenu = document.getElementById("mobile-menu");
    this.mobileBackdrop = document.getElementById("mobile-backdrop");
    this.hamburgerIcon = document.getElementById("hamburger-icon");
    this.closeIcon = document.getElementById("close-icon");
    this.body = document.body;

    this.isOpen = false;

    this.init();
  }

  init() {
    if (!this.mobileMenuBtn || !this.mobileMenu) {
      console.error("Mobile menu elements not found");
      return;
    }

    // Menu button click
    this.mobileMenuBtn.addEventListener("click", (e) => {
      e.preventDefault();
      e.stopPropagation();
      this.toggleMenu();
    });

    // Backdrop click to close menu
    if (this.mobileBackdrop) {
      this.mobileBackdrop.addEventListener("click", (e) => {
        e.preventDefault();
        this.closeMenu();
      });
    }

    // Close menu when clicking menu links
    const menuLinks = this.mobileMenu.querySelectorAll("a");
    menuLinks.forEach((link) => {
      link.addEventListener("click", () => {
        // Small delay to allow navigation to start
        setTimeout(() => this.closeMenu(), 150);
      });
    });

    // Escape key to close menu
    document.addEventListener("keydown", (e) => {
      if (e.key === "Escape" && this.isOpen) {
        this.closeMenu();
      }
    });

    // Prevent menu from closing when clicking inside it
    this.mobileMenu.addEventListener("click", (e) => {
      e.stopPropagation();
    });

    // Handle window resize
    window.addEventListener("resize", () => {
      if (window.innerWidth >= 768 && this.isOpen) {
        this.closeMenu();
      }
    });
  }

  toggleMenu() {
    if (this.isOpen) {
      this.closeMenu();
    } else {
      this.openMenu();
    }
  }

  openMenu() {
    this.isOpen = true;

    // Show and animate backdrop
    if (this.mobileBackdrop) {
      this.mobileBackdrop.classList.remove("invisible", "opacity-0");
      this.mobileBackdrop.classList.add("visible", "opacity-100");
    }

    // Show and animate menu
    this.mobileMenu.classList.remove("-translate-x-full");
    this.mobileMenu.classList.add("translate-x-0");

    // Switch icons
    if (this.hamburgerIcon && this.closeIcon) {
      this.hamburgerIcon.classList.remove("block");
      this.hamburgerIcon.classList.add("hidden");
      this.closeIcon.classList.remove("hidden");
      this.closeIcon.classList.add("block");
    }

    // Prevent body scroll
    this.body.classList.add("menu-open");

    console.log("Mobile menu opened");
  }

  closeMenu() {
    this.isOpen = false;

    // Hide and animate backdrop
    if (this.mobileBackdrop) {
      this.mobileBackdrop.classList.remove("visible", "opacity-100");
      this.mobileBackdrop.classList.add("invisible", "opacity-0");
    }

    // Hide and animate menu
    this.mobileMenu.classList.remove("translate-x-0");
    this.mobileMenu.classList.add("-translate-x-full");

    // Switch icons back
    if (this.hamburgerIcon && this.closeIcon) {
      this.hamburgerIcon.classList.remove("hidden");
      this.hamburgerIcon.classList.add("block");
      this.closeIcon.classList.remove("block");
      this.closeIcon.classList.add("hidden");
    }

    // Allow body scroll
    this.body.classList.remove("menu-open");

    console.log("Mobile menu closed");
  }
}

// Initialize when DOM is ready
document.addEventListener("DOMContentLoaded", () => {
  new MobileMenuManager();
  console.log("MobileMenuManager initialized");
});
