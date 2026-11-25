// i18n.js — translations for the whole site (fr / en / ar).
//
// How it works
//   • Site texts live in data/site-translations.json, news texts in data/news-translations.json.
//   • Mark an element with the path of its text in site-translations.json:
//         <h2 data-i18n="about.title">Qui sommes-nous</h2>
//         <input data-i18n-placeholder="contact.form.placeholders.email">
//         <meta name="description" data-i18n-content="meta.description">
//     The text inside the element is the fallback shown before translations load.
//   • In JS:  await i18n.ready;  i18n.t("path")  /  i18n.tn("articles.3.title")
//             i18n.onChange(lang => …)  to re-render when the visitor switches language.

const SUPPORTED = ["fr", "en", "ar"];
const RTL = ["ar"];
const DEFAULT_LANG = "fr";
const STORAGE_KEY = "noor-language";
const LABELS = { fr: "Français", en: "English", ar: "العربية" };
const SHORT_LABELS = { fr: "FR", en: "EN", ar: "AR" };

function lookup(obj, path) {
  let value = obj;
  for (const key of path.split(".")) {
    if (value == null || typeof value !== "object" || !(key in value)) return undefined;
    value = value[key];
  }
  return value;
}

function safeStorage(action, value) {
  try {
    return action === "get" ? localStorage.getItem(STORAGE_KEY) : localStorage.setItem(STORAGE_KEY, value);
  } catch {
    return null;
  }
}

class I18n {
  constructor() {
    this.lang = DEFAULT_LANG;
    this.site = {};
    this.news = {};
    this.listeners = [];
    this.ready = this.load();
  }

  async load() {
    try {
      const [site, news] = await Promise.all([
        fetch("./data/site-translations.json").then((r) => r.json()),
        fetch("./data/news-translations.json").then((r) => r.json()),
      ]);
      this.site = site;
      this.news = news;
    } catch (error) {
      console.error("Could not load translations:", error);
    }
    if (document.readyState === "loading") {
      await new Promise((resolve) => document.addEventListener("DOMContentLoaded", resolve, { once: true }));
    }
    this.mountSwitchers();
    this.setLanguage(this.detectLanguage());
  }

  detectLanguage() {
    const stored = safeStorage("get");
    if (SUPPORTED.includes(stored)) return stored;
    const browser = (navigator.language || "").split("-")[0];
    return SUPPORTED.includes(browser) ? browser : DEFAULT_LANG;
  }

  /** Site text, e.g. t("navigation.news"). Returns undefined when missing. */
  t(path) {
    return lookup(this.site[this.lang], path);
  }

  /** News text, e.g. tn("articles.12.title"). */
  tn(path) {
    return lookup(this.news[this.lang], path);
  }

  onChange(callback) {
    this.listeners.push(callback);
  }

  setLanguage(lang) {
    if (!SUPPORTED.includes(lang)) return;
    this.lang = lang;
    safeStorage("set", lang);

    const root = document.documentElement;
    root.lang = lang;
    root.dir = RTL.includes(lang) ? "rtl" : "ltr";
    document.body.classList.toggle("rtl", RTL.includes(lang));
    document.body.classList.toggle("ltr", !RTL.includes(lang));

    this.apply();
    document.querySelectorAll("[data-lang-current]").forEach((el) => {
      el.textContent = el.dataset.langCurrent === "short" ? SHORT_LABELS[lang] : LABELS[lang];
    });
    this.listeners.forEach((cb) => cb(lang));
  }

  apply(root = document) {
    root.querySelectorAll("[data-i18n]").forEach((el) => {
      const value = this.t(el.dataset.i18n);
      if (typeof value === "string") el.textContent = value;
    });
    root.querySelectorAll("[data-i18n-placeholder]").forEach((el) => {
      const value = this.t(el.dataset.i18nPlaceholder);
      if (typeof value === "string") el.placeholder = value;
    });
    root.querySelectorAll("[data-i18n-content]").forEach((el) => {
      const value = this.t(el.dataset.i18nContent);
      if (typeof value === "string") el.content = value;
    });
  }

  // ---------- Language switchers (desktop list item + compact mobile button) ----------

  mountSwitchers() {
    const desktopList = document.querySelector("nav ul");
    if (desktopList && !document.getElementById("language-switcher")) {
      const li = document.createElement("li");
      li.id = "language-switcher";
      li.className = "relative flex items-center justify-center";
      li.appendChild(
        this.buildDropdown({
          buttonClass: "flex items-center space-x-2 px-3 py-0 text-white hover:text-sand transition-colors",
          labelHtml: `<span data-lang-current="long">${LABELS[this.lang]}</span>`,
          iconClass: "w-4 h-4",
          menuClass: "w-30",
          itemClass: "text-md",
        })
      );
      desktopList.appendChild(li);
    }

    // Compact switcher next to the logo, only on pages that opt in with data-mobile-lang on <nav>.
    const nav = document.querySelector("nav[data-mobile-lang]");
    if (nav && !document.getElementById("mobile-language-switcher")) {
      const wrapper = document.createElement("div");
      wrapper.id = "mobile-language-switcher";
      wrapper.className = "flex md:hidden relative";
      wrapper.appendChild(
        this.buildDropdown({
          buttonClass:
            "group flex items-center space-x-2 px-2 py-1 text-white/90 hover:text-sand transition-all duration-300 bg-transparent rounded-md",
          labelHtml: `<span data-lang-current="short" class="font-medium text-sm tracking-wide text-kandura group-hover:text-sand transition-all duration-300">${SHORT_LABELS[this.lang]}</span>`,
          iconClass: "w-3 h-3 transition-transform duration-300 group-hover:rotate-180 opacity-80 group-hover:opacity-100",
          menuClass: "w-15",
          itemClass: "text-xs",
          short: true,
        })
      );
      const menuButton = nav.querySelector("#mobile-menu-btn");
      if (menuButton) {
        // Language + menu button grouped on the right
        const group = document.createElement("div");
        group.className = "flex items-center gap-1 md:hidden";
        menuButton.replaceWith(group);
        group.append(wrapper, menuButton);
      } else {
        nav.firstElementChild?.insertAdjacentElement("afterend", wrapper);
      }
    }
  }

  buildDropdown({ buttonClass, labelHtml, iconClass, menuClass, itemClass, short = false }) {
    const dropdown = document.createElement("div");
    dropdown.className = "relative inline-block text-left";

    const button = document.createElement("button");
    button.type = "button";
    button.className = buttonClass;
    button.setAttribute("aria-label", "Language");
    button.innerHTML = `${labelHtml}
      <svg class="${iconClass}" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7"></path>
      </svg>`;

    const menu = document.createElement("div");
    menu.className = `hidden absolute left-0 mt-2 ${menuClass} bg-black/20 backdrop-blur-sm rounded-lg shadow-lg border border-white/10 z-50 overflow-hidden`;

    SUPPORTED.forEach((lang) => {
      const item = document.createElement("button");
      item.type = "button";
      item.className = `group flex items-center w-full text-left px-3 py-2 text-white hover:bg-white/10 transition-all duration-300 space-x-2 ${itemClass}`;
      item.innerHTML = `<span class="font-medium tracking-wide group-hover:text-sand transition-colors duration-300">${
        short ? SHORT_LABELS[lang] : LABELS[lang]
      }</span>`;
      item.addEventListener("click", () => {
        menu.classList.add("hidden");
        this.setLanguage(lang);
      });
      menu.appendChild(item);
    });

    button.addEventListener("click", (event) => {
      event.stopPropagation();
      document.querySelectorAll("#language-switcher .absolute, #mobile-language-switcher .absolute").forEach((m) => {
        if (m !== menu) m.classList.add("hidden");
      });
      menu.classList.toggle("hidden");
    });
    document.addEventListener("click", () => menu.classList.add("hidden"));

    dropdown.append(button, menu);
    return dropdown;
  }
}

export const i18n = new I18n();
