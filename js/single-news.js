import { i18n } from "./i18n.js";

// Enhanced Single News Page Handler
// Add this to your existing news.js or create a separate file

class SingleNewsHandler {
  constructor() {
    this.newsJsonPath = "./data/news.json";
    this.currentArticle = null;
  }

  // Fetch news data
  async fetchNewsData() {
    try {
      const response = await fetch(this.newsJsonPath);
      if (!response.ok) {
        throw new Error(`Failed to fetch news: ${response.status}`);
      }
      return await response.json();
    } catch (error) {
      console.error("Error fetching news:", error);
      throw error;
    }
  }

  // Get single article by ID
  async getArticleById(id) {
    try {
      const newsData = await this.fetchNewsData();
      const article = newsData.find((item) => item.id === parseInt(id));
      return article || null;
    } catch (error) {
      console.error("Error getting article:", error);
      return null;
    }
  }

  // Format date
  formatDate(dateString) {
    try {
      const date = new Date(dateString);
      return date.toLocaleDateString("en-US", {
        year: "numeric",
        month: "long",
        day: "numeric",
      });
    } catch (error) {
      return dateString;
    }
  }

  // Update page elements with article data using i18n.tn for translations
  updatePageContent(article) {
    // Use i18n.tn to get translated fields
  const translatedTitle = i18n.tn(`articles.${article.id}.title`);
  const translatedDescription = i18n.tn(`articles.${article.id}.description`);
  const translatedAuthor = i18n.tn(`articles.${article.id}.author`) || "Nour Holdings Team";
  const translatedContent = i18n.tn(`articles.${article.id}.content`);
    // Update page title
    document.title = `${translatedTitle} - Nour Holdings`;

    // Update hero image
    const heroImage = document.getElementById("hero-image");
    if (heroImage && article.picture) {
      heroImage.src = article.picture;
      heroImage.alt = translatedTitle;
    }

    // Update meta information
    const dateElement = document.getElementById("article-date");
    if (dateElement) {
      dateElement.textContent = this.formatDate(article.date);
    }

    const authorElement = document.getElementById("article-author");
    if (authorElement) {
      authorElement.textContent = translatedAuthor;
    }

    // Update article title
    const titleElement = document.getElementById("article-title");
    if (titleElement) {
      titleElement.textContent = translatedTitle;
    }

    // Update article description
    const descriptionElement = document.getElementById("article-description");
    if (descriptionElement) {
      descriptionElement.textContent = translatedDescription;
    }

    // Update article content
    const bodyElement = document.getElementById("article-body");
    if (bodyElement && article.content) {
      bodyElement.innerHTML = translatedContent;
    }

    // Store current article for sharing
    this.currentArticle = article;
  }

  // Setup social sharing
  setupSocialSharing() {
    if (!this.currentArticle) return;

    const currentUrl = window.location.href;
    const title = encodeURIComponent(this.currentArticle.title);
    const url = encodeURIComponent(currentUrl);

    // Twitter sharing
    const twitterBtn = document.getElementById("share-twitter");
    if (twitterBtn) {
      twitterBtn.onclick = () => {
        const twitterUrl = `https://twitter.com/intent/tweet?text=${title}&url=${url}`;
        window.open(twitterUrl, "_blank", "width=600,height=400");
      };
    }

    // Facebook sharing
    const facebookBtn = document.getElementById("share-facebook");
    if (facebookBtn) {
      facebookBtn.onclick = () => {
        const facebookUrl = `https://www.facebook.com/sharer/sharer.php?u=${url}`;
        window.open(facebookUrl, "_blank", "width=600,height=400");
      };
    }
  }

  // Show different states
  showLoadingState() {
    document.getElementById("loading-state")?.classList.remove("hidden");
    document.getElementById("error-state")?.classList.add("hidden");
    document.getElementById("article-content")?.classList.add("hidden");
  }

  showArticleContent() {
    document.getElementById("loading-state")?.classList.add("hidden");
    document.getElementById("error-state")?.classList.add("hidden");
    document.getElementById("article-content")?.classList.remove("hidden");
  }

  showErrorState() {
    document.getElementById("loading-state")?.classList.add("hidden");
    document.getElementById("article-content")?.classList.add("hidden");
    document.getElementById("error-state")?.classList.remove("hidden");
  }

  // Main initialization function
  async init() {
    // Get article ID from URL
    const urlParams = new URLSearchParams(window.location.search);
    const articleId = urlParams.get("id");

    if (!articleId) {
      this.showErrorState();
      return;
    }

    this.showLoadingState();

    try {
      // Fetch article data
      const article = await this.getArticleById(articleId);

      if (!article) {
        this.showErrorState();
        return;
      }

      // Update page content
      this.updatePageContent(article);

      // Setup social sharing
      this.setupSocialSharing();

      // Show the article
      this.showArticleContent();
    } catch (error) {
      console.error("Error initializing single news page:", error);
      this.showErrorState();
    }
  }
}

// Initialize when DOM is loaded
document.addEventListener("DOMContentLoaded", async () => {
  if (
    window.location.pathname.includes("news.html") &&
    window.location.search.includes("id=")
  ) {
    await i18n.init();

    const singleNewsHandler = new SingleNewsHandler();
    await singleNewsHandler.init(); // wait for article to load

    const languageButtons = document.querySelectorAll(
      "#language-switcher button, #mobile-language-switcher button"
    );

    languageButtons.forEach((btn) => {
      btn.addEventListener("click", () => {
        if (singleNewsHandler.currentArticle) {
          // re-render in the new language
          singleNewsHandler.updatePageContent(singleNewsHandler.currentArticle);
        }
      });
    });
  }
});
