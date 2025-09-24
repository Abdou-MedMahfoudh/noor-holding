// i18n.js - Internationalization Script for Noor Holding Website

class I18nManager {
  constructor() {
    this.currentLanguage = "fr"; // Default to French
    this.translations = {};
    this.supportedLanguages = ["en", "fr", "ar"];
    this.rtlLanguages = ["ar"];

    this.init();
  }

  async init() {
    try {
      // Load translations (assuming the JSON file is served as translations.json)
      const response = await fetch("./data/indextranslation.json");
      this.translations = await response.json();

      // Load news translations
      const newsResponse = await fetch("./data/news-translations.json");
      this.newsTranslations = await newsResponse.json();

      //   Detect browser language or use stored preference
      this.currentLanguage = this.detectLanguage();

      // Apply initial language
      this.setLanguage(this.currentLanguage);

      // Setup language switcher
      this.setupLanguageSwitcher();

      console.log("i18n initialized successfully");
    } catch (error) {
      console.error("Failed to initialize i18n:", error);
    }
  }

  detectLanguage() {
    // Check localStorage first
    const stored = localStorage.getItem("noor-language");
    if (stored && this.supportedLanguages.includes(stored)) {
      return stored;
    }

    // Check browser language
    const browserLang = navigator.language.split("-")[0];
    if (this.supportedLanguages.includes(browserLang)) {
      return browserLang;
    }

    // Default to French
    return "fr";
  }

  setLanguage(lang) {
    if (!this.supportedLanguages.includes(lang)) {
      console.warn(`Language ${lang} not supported`);
      return;
    }

    this.currentLanguage = lang;
    localStorage.setItem("noor-language", lang);

    // Update document attributes
    document.documentElement.lang = lang;
    document.documentElement.dir = this.rtlLanguages.includes(lang)
      ? "rtl"
      : "ltr";

    // Apply translations
    this.applyTranslations();

    // Update language switcher
    this.updateLanguageSwitcher();
  }

  t(key) {
    const keys = key.split(".");
    let value = this.translations[this.currentLanguage];

    for (const k of keys) {
      if (value && typeof value === "object" && k in value) {
        value = value[k];
      } else {
        console.warn(
          `Translation key not found: ${key} for language: ${this.currentLanguage}`
        );
        return key; // Return key as fallback
      }
    }

    return value || key;
  }

  tn(key) {
    const keys = key.split(".");
    let value = this.newsTranslations[this.currentLanguage];

    for (const k of keys) {
      if (value && typeof value === "object" && k in value) {
        value = value[k];
      } else {
        console.warn(
          `News translation key not found: ${key} for language: ${this.currentLanguage}`
        );
        return key; // Return key as fallback
      }
    }

    return value || key;
  }

  // Get translated article by ID
  getTranslatedArticle(articleId) {
    const article =
      this.newsTranslations[this.currentLanguage]?.articles?.[articleId];
    if (!article) {
      console.warn(
        `Article ${articleId} not found for language ${this.currentLanguage}`
      );
      return null;
    }
    return {
      id: articleId,
      ...article,
      date: this.getOriginalArticleData(articleId)?.date || "",
      picture: this.getOriginalArticleData(articleId)?.picture || "",
      featured: this.getOriginalArticleData(articleId)?.featured || false,
    };
  }

  // Get all translated articles
  getAllTranslatedArticles() {
    const articles = this.newsTranslations[this.currentLanguage]?.articles;
    if (!articles) return [];

    return Object.keys(articles)
      .map((id) => this.getTranslatedArticle(id))
      .filter(Boolean);
  }

  
  applyTranslations() {
    // Update page title
    document.title = this.t("meta.title");

    // Update meta description
    const metaDesc = document.querySelector('meta[name="description"]');
    if (metaDesc) {
      metaDesc.content = this.t("meta.description");
    }

    // Navigation
    this.updateElement('[data-i18n="nav.about"]', this.t("navigation.about"));
    this.updateElement('[data-i18n="nav.news"]', this.t("navigation.news"));
    this.updateElement(
      '[data-i18n="nav.subsidiaries"]',
      this.t("navigation.subsidiaries")
    );
    this.updateElement(
      '[data-i18n="nav.contact"]',
      this.t("navigation.contact")
    );

    // Hero Section
    this.updateElement('[data-i18n="hero.title"]', this.t("hero.title"));
    this.updateElement('[data-i18n="hero.subtitle"]', this.t("hero.subtitle"));
    this.updateElement(
      '[data-i18n="hero.description"]',
      this.t("hero.shortDescription")
    );
    this.updateElement(
      '[data-i18n="hero.btn.news"]',
      this.t("hero.buttons.latestNews")
    );
    this.updateElement(
      '[data-i18n="hero.btn.subsidiaries"]',
      this.t("hero.buttons.ourSubsidiaries")
    );

    // Hero Stats
    this.updateElement(
      '[data-i18n="hero.stats.subsidiaries"]',
      this.t("hero.stats.subsidiaries")
    );
    this.updateElement(
      '[data-i18n="hero.stats.sectors"]',
      this.t("hero.stats.keysectors")
    );
    this.updateElement(
      '[data-i18n="hero.stats.leader"]',
      this.t("hero.stats.marketLeader")
    );
    this.updateElement(
      '[data-i18n="hero.stats.based"]',
      this.t("hero.stats.basedIn")
    );

    this.updateElement('[data-i18n="hero.country"]', this.t("hero.country"));

    // CEO Message
    this.updateElement(
      '[data-i18n="ceo.title"]',
      this.t("ceoMessage.sectionTitle")
    );
    this.updateElement(
      '[data-i18n="ceo.greeting"]',
      this.t("ceoMessage.greeting")
    );
    this.updateElement('[data-i18n="ceo.intro"]', this.t("ceoMessage.intro"));
    this.updateElement(
      '[data-i18n="ceo.ambition"]',
      this.t("ceoMessage.ambition")
    );
    this.updateElement(
      '[data-i18n="ceo.entities.title"]',
      this.t("ceoMessage.entitiesTitle")
    );

    // CEO Message - Entities
    this.updateElement(
      '[data-i18n="ceo.entities.slmp"]',
      this.t("ceoMessage.entities.slmp")
    );
    this.updateElement(
      '[data-i18n="ceo.entities.afh"]',
      this.t("ceoMessage.entities.afh")
    );
    this.updateElement(
      '[data-i18n="ceo.entities.mines"]',
      this.t("ceoMessage.entities.mines")
    );
    this.updateElement(
      '[data-i18n="ceo.entities.itb"]',
      this.t("ceoMessage.entities.itb")
    );
    this.updateElement(
      '[data-i18n="ceo.entities.tbs1"]',
      this.t("ceoMessage.entities.tbs1")
    );
    this.updateElement(
      '[data-i18n="ceo.entities.tbs2"]',
      this.t("ceoMessage.entities.tbs2")
    );
    this.updateElement(
      '[data-i18n="ceo.entities.acg"]',
      this.t("ceoMessage.entities.acg")
    );
    this.updateElement(
      '[data-i18n="ceo.entities.fishing"]',
      this.t("ceoMessage.entities.fishing")
    );

    this.updateElement(
      '[data-i18n="ceo.vision.title"]',
      this.t("ceoMessage.visionTitle")
    );
    this.updateElement(
      '[data-i18n="ceo.vision.text"]',
      this.t("ceoMessage.vision")
    );
    this.updateElement(
      '[data-i18n="ceo.gratitude"]',
      this.t("ceoMessage.gratitude")
    );
    this.updateElement(
      '[data-i18n="ceo.regards"]',
      this.t("ceoMessage.signature.regards")
    );
    this.updateElement(
      '[data-i18n="ceo.name"]',
      this.t("ceoMessage.signature.name")
    );
    this.updateElement(
      '[data-i18n="ceo.title.sig"]',
      this.t("ceoMessage.signature.title")
    );

    this.updateElement(
      '[data-i18n="ceo.title.sig2"]',
      this.t("ceoMessage.signature.subtitle")
    );

    // About Section
    this.updateElement('[data-i18n="about.title"]', this.t("about.title"));
    this.updateElement(
      '[data-i18n="about.desc1"]',
      this.t("about.description1")
    );
    this.updateElement(
      '[data-i18n="about.desc2"]',
      this.t("about.description2")
    );

    // Subsidiaries Section
    this.updateElement(
      '[data-i18n="subs.featured"]',
      this.t("subsidiaries.featuredTitle")
    );
    this.updateElement(
      '[data-i18n="subs.title"]',
      this.t("subsidiaries.sectionTitle")
    );

    // Companies
    // AFH
    this.updateElement(
      '[data-i18n="subsidiaries.companies.afh.name"]',
      this.t("subsidiaries.companies.afh.name")
    );
    this.updateElement(
      '[data-i18n="subsidiaries.companies.afh.description"]',
      this.t("subsidiaries.companies.afh.description")
    );
    this.updateElement(
      '[data-i18n="subsidiaries.companies.afh.services.0"]',
      this.t("subsidiaries.companies.afh.services.0")
    );
    this.updateElement(
      '[data-i18n="subsidiaries.companies.afh.services.1"]',
      this.t("subsidiaries.companies.afh.services.1")
    );
    this.updateElement(
      '[data-i18n="subsidiaries.companies.afh.services.2"]',
      this.t("subsidiaries.companies.afh.services.2")
    );

    // SLMP
    this.updateElement(
      '[data-i18n="subsidiaries.companies.slmp.name"]',
      this.t("subsidiaries.companies.slmp.name")
    );
    this.updateElement(
      '[data-i18n="subsidiaries.companies.slmp.description"]',
      this.t("subsidiaries.companies.slmp.description")
    );
    this.updateElement(
      '[data-i18n="subsidiaries.companies.slmp.services.0"]',
      this.t("subsidiaries.companies.slmp.services.0")
    );
    this.updateElement(
      '[data-i18n="subsidiaries.companies.slmp.services.1"]',
      this.t("subsidiaries.companies.slmp.services.1")
    );
    this.updateElement(
      '[data-i18n="subsidiaries.companies.slmp.services.2"]',
      this.t("subsidiaries.companies.slmp.services.2")
    );

    // MINES
    this.updateElement(
      '[data-i18n="subsidiaries.companies.mines.name"]',
      this.t("subsidiaries.companies.mines.name")
    );
    this.updateElement(
      '[data-i18n="subsidiaries.companies.mines.description"]',
      this.t("subsidiaries.companies.mines.description")
    );
    this.updateElement(
      '[data-i18n="subsidiaries.companies.mines.services.0"]',
      this.t("subsidiaries.companies.mines.services.0")
    );
    this.updateElement(
      '[data-i18n="subsidiaries.companies.mines.services.1"]',
      this.t("subsidiaries.companies.mines.services.1")
    );
    this.updateElement(
      '[data-i18n="subsidiaries.companies.mines.services.2"]',
      this.t("subsidiaries.companies.mines.services.2")
    );

    // ITB
    this.updateElement(
      '[data-i18n="subsidiaries.companies.itb.name"]',
      this.t("subsidiaries.companies.itb.name")
    );
    this.updateElement(
      '[data-i18n="subsidiaries.companies.itb.description"]',
      this.t("subsidiaries.companies.itb.description")
    );
    this.updateElement(
      '[data-i18n="subsidiaries.companies.itb.services.0"]',
      this.t("subsidiaries.companies.itb.services.0")
    );
    this.updateElement(
      '[data-i18n="subsidiaries.companies.itb.services.1"]',
      this.t("subsidiaries.companies.itb.services.1")
    );
    this.updateElement(
      '[data-i18n="subsidiaries.companies.itb.services.2"]',
      this.t("subsidiaries.companies.itb.services.2")
    );

    // TBS1
    this.updateElement(
      '[data-i18n="subsidiaries.companies.tbs1.name"]',
      this.t("subsidiaries.companies.tbs1.name")
    );
    this.updateElement(
      '[data-i18n="subsidiaries.companies.tbs1.description"]',
      this.t("subsidiaries.companies.tbs1.description")
    );
    this.updateElement(
      '[data-i18n="subsidiaries.companies.tbs1.services.0"]',
      this.t("subsidiaries.companies.tbs1.services.0")
    );
    this.updateElement(
      '[data-i18n="subsidiaries.companies.tbs1.services.1"]',
      this.t("subsidiaries.companies.tbs1.services.1")
    );
    this.updateElement(
      '[data-i18n="subsidiaries.companies.tbs1.services.2"]',
      this.t("subsidiaries.companies.tbs1.services.2")
    );

    // ACG
    this.updateElement(
      '[data-i18n="subsidiaries.companies.acg.name"]',
      this.t("subsidiaries.companies.acg.name")
    );
    this.updateElement(
      '[data-i18n="subsidiaries.companies.acg.description"]',
      this.t("subsidiaries.companies.acg.description")
    );
    this.updateElement(
      '[data-i18n="subsidiaries.companies.acg.services.0"]',
      this.t("subsidiaries.companies.acg.services.0")
    );
    this.updateElement(
      '[data-i18n="subsidiaries.companies.acg.services.1"]',
      this.t("subsidiaries.companies.acg.services.1")
    );
    this.updateElement(
      '[data-i18n="subsidiaries.companies.acg.services.2"]',
      this.t("subsidiaries.companies.acg.services.2")
    );
    this.updateElement(
      '[data-i18n="subsidiaries.companies.acg.services.3"]',
      this.t("subsidiaries.companies.acg.services.3")
    );

    // TBS2
    this.updateElement(
      '[data-i18n="subsidiaries.companies.tbs2.name"]',
      this.t("subsidiaries.companies.tbs2.name")
    );
    this.updateElement(
      '[data-i18n="subsidiaries.companies.tbs2.description"]',
      this.t("subsidiaries.companies.tbs2.description")
    );
    this.updateElement(
      '[data-i18n="subsidiaries.companies.tbs2.services.0"]',
      this.t("subsidiaries.companies.tbs2.services.0")
    );
    this.updateElement(
      '[data-i18n="subsidiaries.companies.tbs2.services.1"]',
      this.t("subsidiaries.companies.tbs2.services.1")
    );
    this.updateElement(
      '[data-i18n="subsidiaries.companies.tbs2.services.2"]',
      this.t("subsidiaries.companies.tbs2.services.2")
    );

    // FISHING
    this.updateElement(
      '[data-i18n="subsidiaries.companies.fishing.name"]',
      this.t("subsidiaries.companies.fishing.name")
    );
    this.updateElement(
      '[data-i18n="subsidiaries.companies.fishing.description"]',
      this.t("subsidiaries.companies.fishing.description")
    );
    this.updateElement(
      '[data-i18n="subsidiaries.companies.fishing.services.0"]',
      this.t("subsidiaries.companies.fishing.services.0")
    );
    this.updateElement(
      '[data-i18n="subsidiaries.companies.fishing.services.1"]',
      this.t("subsidiaries.companies.fishing.services.1")
    );
    this.updateElement(
      '[data-i18n="subsidiaries.companies.fishing.services.2"]',
      this.t("subsidiaries.companies.fishing.services.2")
    );
    // News Section
    this.updateElement('[data-i18n="news.title"]', this.t("news.title"));
    this.updateElement('[data-i18n="news.viewall"]', this.t("news.viewAll"));

    // Contact Section
    this.updateElement('[data-i18n="contact.title"]', this.t("contact.title"));
    this.updateElement(
      '[data-i18n="contact.touch.title"]',
      this.t("contact.getInTouch")
    );
    this.updateElement(
      '[data-i18n="contact.touch.subtitle"]',
      this.t("contact.getInTouchSubtitle")
    );

    this.updateElement(
      '[data-i18n="contact.location.title"]',
      this.t("contact.location.title")
    );
    this.updateElement(
      '[data-i18n="contact.location.address"]',
      this.t("contact.location.address")
    );
    this.updateElement(
      '[data-i18n="contact.hours.title"]',
      this.t("contact.hours.title")
    );
    this.updateElement(
      '[data-i18n="contact.hours.weekdays"]',
      this.t("contact.hours.weekdays")
    );
    this.updateElement(
      '[data-i18n="contact.hours.friday"]',
      this.t("contact.hours.friday")
    );
    this.updateElement(
      '[data-i18n="contact.hours.weekend"]',
      this.t("contact.hours.weekend")
    );
    this.updateElement(
      '[data-i18n="contact.phone.title"]',
      this.t("contact.phone.title")
    );
    this.updateElement(
      '[data-i18n="contact.email.title"]',
      this.t("contact.email.title")
    );
    this.updateElement(
      '[data-i18n="contact.map.title"]',
      this.t("contact.map.title")
    );
    this.updateElement(
      '[data-i18n="contact.map.directions"]',
      this.t("contact.map.directions")
    );

    // Contact Form
    this.updateElement('[data-i18n="form.name"]', this.t("contact.form.name"));
    this.updateElement(
      '[data-i18n="form.email"]',
      this.t("contact.form.email")
    );
    this.updateElement(
      '[data-i18n="form.phone"]',
      this.t("contact.form.phone")
    );
    this.updateElement(
      '[data-i18n="form.subject"]',
      this.t("contact.form.subject")
    );
    this.updateElement(
      '[data-i18n="form.message"]',
      this.t("contact.form.message")
    );
    this.updateElement(
      '[data-i18n="form.submit"]',
      this.t("contact.form.submit")
    );

    // Update form placeholders
    this.updatePlaceholder(
      '[data-i18n-placeholder="form.name"]',
      this.t("contact.form.placeholders.name")
    );
    this.updatePlaceholder(
      '[data-i18n-placeholder="form.email"]',
      this.t("contact.form.placeholders.email")
    );
    this.updatePlaceholder(
      '[data-i18n-placeholder="form.phone"]',
      this.t("contact.form.placeholders.phone")
    );
    this.updatePlaceholder(
      '[data-i18n-placeholder="form.subject"]',
      this.t("contact.form.placeholders.subject")
    );
    this.updatePlaceholder(
      '[data-i18n-placeholder="form.message"]',
      this.t("contact.form.placeholders.message")
    );

    // Footer
    this.updateElement(
      '[data-i18n="footer.links"]',
      this.t("footer.quickLinks")
    );
    this.updateElement(
      '[data-i18n="footer.contact"]',
      this.t("footer.contact")
    );
    this.updateElement(
      '[data-i18n="footer.copyright"]',
      this.t("footer.copyright")
    );
    this.updateElement(
      '[data-i18n="footer.privacy"]',
      this.t("footer.privacy")
    );
    this.updateElement('[data-i18n="footer.terms"]', this.t("footer.terms"));

    this.updateElement('[data-i18n="footer.home"]', this.t("footer.home"));

    this.updateElement('[data-i18n="footer.subs"]', this.t("footer.subs"));

    // Apply RTL/LTR specific styles
    this.applyDirectionStyles();
  }

  // Method to render news in current language
  renderNewsSection(newsContainer) {
    const articles = this.getAllTranslatedArticles();

    if (!articles.length) {
      newsContainer.innerHTML = `<p data-i18n="news.no-news">${this.tn(
        "newsSection.noNews"
      )}</p>`;
      return;
    }

    let newsHTML = "";
    articles.forEach((article) => {
      newsHTML += `
        <article class="news-item" data-article-id="${article.id}">
          <img src="${article.picture}" alt="${
        article.title
      }" class="news-image">
          <div class="news-content">
            <span class="news-category">${article.category}</span>
            <h3 class="news-title">${article.title}</h3>
            <p class="news-description">${article.description}</p>
            <div class="news-meta">
              <span class="news-author">${this.tn("newsSection.by")} ${
        article.author
      }</span>
              <span class="news-date">${article.date}</span>
            </div>
            <button class="read-more-btn" onclick="window.i18n.openArticle(${
              article.id
            })">
              ${this.tn("newsSection.readMore")}
            </button>
          </div>
        </article>
      `;
    });

    newsContainer.innerHTML = newsHTML;
  }

  // Method to render single article page
  renderSingleArticle(articleId, articleContainer) {
    const article = this.getTranslatedArticle(articleId);

    if (!article) {
      articleContainer.innerHTML = `<p>Article not found</p>`;
      return;
    }

    articleContainer.innerHTML = `
      <article class="single-article">
        <header class="article-header">
          <button class="back-btn" onclick="window.i18n.goBackToNews()">
            ← ${this.tn("newsSection.backToNews")}
          </button>
          <span class="article-category">${article.category}</span>
          <h1 class="article-title">${article.title}</h1>
          <div class="article-meta">
            <span class="article-author">${this.tn("newsSection.by")} ${
      article.author
    }</span>
            <span class="article-date">${this.tn("newsSection.publishedOn")} ${
      article.date
    }</span>
          </div>
          <img src="${article.picture}" alt="${
      article.title
    }" class="article-featured-image">
        </header>
        <div class="article-content">
          ${article.content}
        </div>
        <footer class="article-footer">
          <button class="share-btn">
            ${this.tn("newsSection.shareArticle")}
          </button>
        </footer>
      </article>
    `;
  }

  // Utility methods for navigation
  openArticle(articleId) {
    // Implementation depends on your routing system
    console.log(`Opening article ${articleId}`);
  }

  goBackToNews() {
    // Implementation depends on your routing system
    console.log("Going back to news list");
  }

  updateElement(selector, text) {
    const elements = document.querySelectorAll(selector);
    elements.forEach((el) => {
      if (el) el.textContent = text;
    });
  }

  updatePlaceholder(selector, text) {
    const elements = document.querySelectorAll(selector);
    elements.forEach((el) => {
      if (el) el.placeholder = text;
    });
  }

  applyDirectionStyles() {
    const body = document.body;

    if (this.rtlLanguages.includes(this.currentLanguage)) {
      body.classList.add("rtl");
      body.classList.remove("ltr");
    } else {
      body.classList.add("ltr");
      body.classList.remove("rtl");
    }
  }

  setupLanguageSwitcher() {
    // Create language switcher if it doesn't exist
    let switcher = document.getElementById("language-switcher");

    if (!switcher) {
      switcher = this.createLanguageSwitcher();
      // Insert into navigation
      const nav = document.querySelector("nav ul");
      if (nav) {
        nav.appendChild(switcher);
      }
    }
    let mobileSwitcher = document.getElementById("mobile-language-switcher");
    if (!mobileSwitcher) {
      mobileSwitcher = this.createMobileLanguageSwitcher();
      // Insert after the logo in the nav
      const navContainer = document.querySelector("nav");
      const logo = navContainer.querySelector("img");
      if (logo && navContainer) {
        logo.insertAdjacentElement("afterend", mobileSwitcher);
      }
    }
  }
  createLanguageSwitcher() {
    const switcherContainer = document.createElement("li");
    switcherContainer.id = "language-switcher";
    switcherContainer.className = "relative flex items-center justify-center";

    // Language logos/icons (replace Saudi flag with "AR" logo)
    const languageLogos = {
      en: "https://flagcdn.com/us.svg",
      fr: "https://flagcdn.com/fr.svg",
      ar: "https://flagcdn.com/mr.svg",
    };

    const languageNames = {
      en: "English",
      fr: "Français",
      ar: "العربية",
    };

    const dropdown = document.createElement("div");
    dropdown.className = "relative inline-block text-left";

    const button = document.createElement("button");
    button.className =
      "flex items-center space-x-2 px-3 py-2 text-white hover:text-sand transition-colors";
    button.style.marginTop = "0"; // No top margin
    button.style.paddingTop = "0"; // No top padding
    button.innerHTML = `
        <img src="${
          languageLogos[this.currentLanguage]
        }" class="w-10 h-5 rounded-sm" alt="${this.currentLanguage}">
        <span id="current-lang">${languageNames[this.currentLanguage]}</span>
        <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7"></path>
        </svg>
    `;

    const menu = document.createElement("div");
    menu.className =
      "hidden absolute right-0 mt-0 w-48 bg-white rounded-md shadow-lg z-50";
    menu.id = "lang-menu";

    this.supportedLanguages.forEach((lang) => {
      const item = document.createElement("button");
      item.className =
        "flex items-center w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 transition-colors space-x-2";
      item.innerHTML = `
            <img src="${languageLogos[lang]}" class="w-5 h-5 rounded-sm" alt="${lang}">
            <span>${languageNames[lang]}</span>
        `;
      item.onclick = () => this.setLanguage(lang);
      menu.appendChild(item);
    });

    // Toggle dropdown
    button.onclick = (e) => {
      e.stopPropagation();
      menu.classList.toggle("hidden");
    };

    // Close dropdown when clicking outside
    document.addEventListener("click", () => {
      menu.classList.add("hidden");
    });

    dropdown.appendChild(button);
    dropdown.appendChild(menu);
    switcherContainer.appendChild(dropdown);

    // Center the switcher vertically with navbar
    switcherContainer.style.display = "flex";
    switcherContainer.style.alignItems = "center";
    switcherContainer.style.justifyContent = "center";

    return switcherContainer;
  }

  createMobileLanguageSwitcher() {
    const switcherContainer = document.createElement("div");
    switcherContainer.id = "mobile-language-switcher";
    switcherContainer.className = "block md:hidden relative";

    const languageLogos = {
      en: "https://flagcdn.com/us.svg",
      fr: "https://flagcdn.com/fr.svg",
      ar: "https://flagcdn.com/mr.svg",
    };

    const languageNames = {
      en: "EN",
      fr: "FR",
      ar: "AR",
    };

    const dropdown = document.createElement("div");
    dropdown.className = "relative inline-block text-left";

    const button = document.createElement("button");
    button.className =
      "group flex items-center space-x-2 px-2 py-1 text-white/90 hover:text-sand transition-all duration-300 bg-transparent rounded-md";
    button.innerHTML = `
    
    <span id="mobile-current-lang" class="font-medium text-sm tracking-wide text-kandura group-hover:text-sand transition-all duration-300">
      ${languageNames[this.currentLanguage]}
    </span>
    <svg class="w-3 h-3 transition-transform duration-300 group-hover:rotate-180 opacity-80 group-hover:opacity-100" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7"></path>
    </svg>
  `;

    const menu = document.createElement("div");
    menu.className =
      "hidden absolute left-0 mt-2 w-15 bg-black/20 backdrop-blur-sm rounded-lg shadow-lg border border-white/10 z-50 overflow-hidden";
    menu.id = "mobile-lang-menu";

    this.supportedLanguages.forEach((lang, index) => {
      const item = document.createElement("button");
      item.className = `group flex items-center w-full text-left px-3 py-2 text-white hover:bg-white/10 transition-all duration-300 space-x-2 text-xs ${
        index === 0 ? "rounded-t-lg" : ""
      } ${index === this.supportedLanguages.length - 1 ? "rounded-b-lg" : ""}`;
      item.innerHTML = `
      
      <span class="font-medium tracking-wide group-hover:text-sand transition-colors duration-300">
        ${languageNames[lang]}
      </span>
    `;
      item.onclick = () => this.setLanguage(lang);
      menu.appendChild(item);
    });

    button.onclick = (e) => {
      e.stopPropagation();
      menu.classList.toggle("hidden");
      // Close desktop menu if open
      const desktopMenu = document.getElementById("desktop-lang-menu");
      if (desktopMenu) desktopMenu.classList.add("hidden");
    };

    document.addEventListener("click", () => {
      menu.classList.add("hidden");
    });

    dropdown.appendChild(button);
    dropdown.appendChild(menu);
    switcherContainer.appendChild(dropdown);

    return switcherContainer;
  }

  updateLanguageSwitcher() {
    const languageNames = {
      en: "English",
      fr: "Français",
      ar: "العربية",
    };

    const mobileLanguageNames = {
      en: "EN",
      fr: "FR",
      ar: "AR",
    };

    const languageLogos = {
      en: "https://flagcdn.com/us.svg",
      fr: "https://flagcdn.com/fr.svg",
      ar: "https://flagcdn.com/mr.svg",
    };

    // Update desktop switcher
    // Find the desktop switcher button (containing #current-lang and <img>)
    const navSwitcher = document.getElementById("language-switcher");
    if (navSwitcher) {
      // Find the button inside the switcher
      const button = navSwitcher.querySelector("button");
      if (button) {
        // Update the <span id="current-lang">
        const desktopLangSpan = button.querySelector("#current-lang");
        if (desktopLangSpan) {
          desktopLangSpan.textContent = languageNames[this.currentLanguage];
        }
        // Update the <img> inside the button (the first img)
        const flagImg = button.querySelector("img");
        if (flagImg) {
          flagImg.src = languageLogos[this.currentLanguage];
          flagImg.alt = this.currentLanguage;
          // Responsive sizing for desktop
          flagImg.className = "w-10 h-5 rounded-sm";
        }
      }
    }

    // Update mobile switcher (unchanged)
    const mobileLangSpan = document.getElementById("mobile-current-lang");
    const mobileFlag = document.getElementById("mobile-current-flag");
    if (mobileLangSpan) {
      mobileLangSpan.textContent = mobileLanguageNames[this.currentLanguage];
    }
    // if (mobileFlag) {
    //   mobileFlag.src = languageLogos[this.currentLanguage];
    //   mobileFlag.alt = this.currentLanguage.toUpperCase();
    //   // Responsive sizing for mobile
    //   mobileFlag.className = "w-5 h-3 rounded-sm";
    // }
  }

  // Method to update specific subsidiary content dynamically
  updateSubsidiaryContent(companyKey) {
    const company = this.t(`subsidiaries.companies.${companyKey}`);

    if (company && typeof company === "object") {
      // Update company name
      this.updateElement(`[data-i18n="sub.${companyKey}.name"]`, company.name);
      // Update company description
      this.updateElement(
        `[data-i18n="sub.${companyKey}.desc"]`,
        company.description
      );
      // Update services
      if (company.services && Array.isArray(company.services)) {
        company.services.forEach((service, index) => {
          this.updateElement(
            `[data-i18n="sub.${companyKey}.service.${index}"]`,
            service
          );
        });
      }
    }
  }
}

// CSS for RTL support
const rtlStyles = `



/* Arabic font improvements */
.rtl #hero-title , .rtl  #desc  {
    font-family:  'Tajawal', Arial, sans-serif !important;
}
    
`;

// Inject RTL styles
const styleSheet = document.createElement("style");
styleSheet.textContent = rtlStyles;
document.head.appendChild(styleSheet);

// Initialize i18n when DOM is loaded
document.addEventListener("DOMContentLoaded", () => {
  window.i18n = new I18nManager();
});

// Export for module usage
if (typeof module !== "undefined" && module.exports) {
  module.exports = I18nManager;
}


// Initialize news on page load
document.addEventListener("DOMContentLoaded", () => {
  const newsContainer = document.getElementById("news-container");
  if (newsContainer) {
    window.i18n.renderNewsSection(newsContainer);
  }
});

// For single article page
function loadArticle(articleId) {
  const articleContainer = document.getElementById("article-content");
  window.i18n.renderSingleArticle(articleId, articleContainer);
}

// Get translated article data
const article = window.i18n.getTranslatedArticle("1");
console.log(article.title); // Will show title in current language

// Get all articles in current language
const allArticles = window.i18n.getAllTranslatedArticles();
