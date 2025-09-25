
        import { i18n } from "./i18n.js";

        // News management class
        class NewsManager {
          constructor() {
            this.allNews = [];
            this.filteredNews = [];
            this.currentPage = 1;
            this.itemsPerPage = 9;
            this.searchTerm = "";

            this.init();
          }

          async init() {
            await this.loadNews();
            this.setupEventListeners();
            this.renderNews();
            this.updateResultsCounter();
          }

          // Mock news data - replace with actual JSON loading
          async loadNews() {
            try {
              // Fetch news data from JSON file
              const response = await fetch("./data/news.json");

              if (!response.ok) {
                throw new Error(
                  `Failed to fetch news: ${response.status} ${response.statusText}`
                );
              }

              const newsData = await response.json();

              // Validate that we received an array
              if (!Array.isArray(newsData)) {
                throw new Error("Invalid news data format - expected an array");
              }

              // Store the news data
              this.allNews = newsData;
              this.filteredNews = [...this.allNews];

              console.log(
                `Successfully loaded ${this.allNews.length} news articles`
              );
            } catch (error) {
              console.error("Error loading news data:", error);

              // Fallback to empty array or show user-friendly error
              this.allNews = [];
              this.filteredNews = [];

              // You might want to show a user notification here
              this.showNewsLoadError();
            }
          }

          setupEventListeners() {
            // Mobile menu toggle
            const mobileMenuBtn = document.getElementById("mobile-menu-btn");
            const mobileMenu = document.getElementById("mobile-menu");
            const mobileBackdrop = document.getElementById("mobile-backdrop");
            const hamburgerIcon = document.getElementById("hamburger-icon");
            const closeIcon = document.getElementById("close-icon");

            mobileMenuBtn.addEventListener("click", () => {
              const isOpen =
                !mobileMenu.classList.contains("-translate-x-full");

              if (isOpen) {
                // Close menu
                mobileMenu.classList.add("-translate-x-full");
                mobileBackdrop.classList.add("hidden");
                hamburgerIcon.classList.remove("hidden");
                hamburgerIcon.classList.add("block");
                closeIcon.classList.add("hidden");
                closeIcon.classList.remove("block");
                document.body.classList.remove("overflow-hidden");
              } else {
                // Open menu
                mobileMenu.classList.remove("-translate-x-full");
                mobileBackdrop.classList.remove("hidden");
                hamburgerIcon.classList.add("hidden");
                hamburgerIcon.classList.remove("block");
                closeIcon.classList.remove("hidden");
                closeIcon.classList.add("block");
                document.body.classList.add("overflow-hidden");
              }
            });

            // Close menu when clicking backdrop
            mobileBackdrop.addEventListener("click", () => {
              mobileMenu.classList.add("-translate-x-full");
              mobileBackdrop.classList.add("hidden");
              hamburgerIcon.classList.remove("hidden");
              hamburgerIcon.classList.add("block");
              closeIcon.classList.add("hidden");
              closeIcon.classList.remove("block");
              document.body.classList.remove("overflow-hidden");
            });

            // Search functionality
            const searchInput = document.getElementById("search-input");
            searchInput.addEventListener("input", (e) => {
              this.searchTerm = e.target.value.toLowerCase();
              this.filterNews();
              this.currentPage = 1;
              this.renderNews();
              this.updateResultsCounter();
            });

            // Navbar scroll behavior
            this.setupNavbarScroll();
          }

          setupNavbarScroll() {
            const navbar = document.querySelector("nav");
            const showThreshold = 120;

            window.addEventListener("scroll", () => {
              if (window.scrollY < showThreshold) {
                navbar.classList.remove("-translate-y-full");
                navbar.classList.add("translate-y-0");
              } else {
                navbar.classList.add("-translate-y-full");
                navbar.classList.remove("translate-y-0");
              }
            });
          }

          filterNews() {
            if (!this.searchTerm) {
              this.filteredNews = [...this.allNews];
            } else {
              this.filteredNews = this.allNews.filter(
                (item) =>
                  item.title.toLowerCase().includes(this.searchTerm) ||
                  item.description.toLowerCase().includes(this.searchTerm)
              );
            }
          }

          formatDate(dateString) {
            const options = { year: "numeric", month: "long", day: "numeric" };
            return new Date(dateString).toLocaleDateString("en-US", options);
          }

          createNewsCard(item) {
            const imagePart = item.picture
              ? `<div class="relative h-48 overflow-hidden">
                        <img src="${item.picture}" alt="${item.title}" class="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105">
                        <div class="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent"></div>
                    </div>`
              : `<div class="h-48 bg-gradient-to-br from-sand/20 to-skyline/20 flex items-center justify-center">
                        <svg class="w-16 h-16 text-sand/40" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"></path>
                        </svg>
                    </div>`;

            return `
                   <article class="news-card bg-white rounded-lg shadow-lg overflow-hidden group cursor-pointer" onclick="window.location.href='./news.html?id=${
                     item.id
                   }'">
                        ${imagePart}
                        <div class="p-6">
                            <div class="flex items-center space-x-2 mb-3">
                                <svg class="w-3 h-3 text-skyline flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"></path>
                                </svg>
                                <span class="text-sm text-gray-500">${this.formatDate(
                                  item.date
                                )}</span>
                            </div>
                            <h3 class="text-xl font-dm-serif text-midnight mb-3 group-hover:text-gulf transition-colors duration-300 line-clamp-2">
                                ${i18n.tn(`articles.${item.id}.title`)}
                            </h3>
                            <p class="text-gray-600 leading-relaxed mb-4 line-clamp-3">
                                  ${
                                    i18n.tn(
                                      `articles.${item.id}.description`
                                    ) || ""
                                  }
                            </p>
                            <div class="flex items-center space-x-2 text-gulf group-hover:text-midnight transition-colors duration-300">
                                <span class="text-sm font-medium">Read More</span>
                                <svg class="w-3 h-3 transform group-hover:translate-x-1 transition-transform duration-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7"></path>
                                </svg>
                            </div>
                        </div>
                    </article>
                `;
          }

          renderNews() {
            const loadingState = document.getElementById("loading-state");
            const newsGrid = document.getElementById("news-grid");
            const noResults = document.getElementById("no-results");
            const pagination = document.getElementById("pagination");

            // Hide loading state
            loadingState.classList.add("hidden");

            if (this.filteredNews.length === 0) {
              newsGrid.classList.add("hidden");
              pagination.classList.add("hidden");
              noResults.classList.remove("hidden");
              return;
            }

            // Show results
            noResults.classList.add("hidden");
            newsGrid.classList.remove("hidden");

            // Calculate pagination
            const totalPages = Math.ceil(
              this.filteredNews.length / this.itemsPerPage
            );
            const startIndex = (this.currentPage - 1) * this.itemsPerPage;
            const endIndex = startIndex + this.itemsPerPage;
            const currentItems = this.filteredNews.slice(startIndex, endIndex);

            // Render news cards
            newsGrid.innerHTML = currentItems
              .map((item) => this.createNewsCard(item))
              .join("");

            // Render pagination if needed
            if (totalPages > 1) {
              this.renderPagination(totalPages);
              pagination.classList.remove("hidden");
            } else {
              pagination.classList.add("hidden");
            }

            // Scroll to top of results
            if (this.currentPage > 1) {
              document.getElementById("news-grid").scrollIntoView({
                behavior: "smooth",
                block: "start",
              });
            }
          }

          renderPagination(totalPages) {
            const pagination = document.getElementById("pagination");
            const maxVisiblePages = 5;

            let startPage = Math.max(
              1,
              this.currentPage - Math.floor(maxVisiblePages / 2)
            );
            let endPage = Math.min(totalPages, startPage + maxVisiblePages - 1);

            if (endPage - startPage + 1 < maxVisiblePages) {
              startPage = Math.max(1, endPage - maxVisiblePages + 1);
            }

            let paginationHTML = "";

            // Previous button
            if (this.currentPage > 1) {
              paginationHTML += `
                        <button onclick="newsManager.goToPage(${
                          this.currentPage - 1
                        })" 
                                class="px-3 py-2 text-sm font-medium text-gulf bg-white border border-gray-300 rounded-l-lg hover:bg-gray-50 hover:text-midnight transition-colors">
                            <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 19l-7-7 7-7"></path>
                            </svg>
                        </button>
                    `;
            }

            // Page numbers
            for (let i = startPage; i <= endPage; i++) {
              const isActive = i === this.currentPage;
              paginationHTML += `
                        <button onclick="newsManager.goToPage(${i})" 
                                class="px-4 py-2 text-sm font-medium transition-colors ${
                                  isActive
                                    ? "text-white bg-midnight border-midnight"
                                    : "text-gulf bg-white border-gray-300 hover:bg-gray-50 hover:text-midnight"
                                } border ${
                i === startPage && this.currentPage === 1 ? "rounded-l-lg" : ""
              } ${
                i === endPage && this.currentPage === totalPages
                  ? "rounded-r-lg"
                  : ""
              }">
                            ${i}
                        </button>
                    `;
            }

            // Next button
            if (this.currentPage < totalPages) {
              paginationHTML += `
                        <button onclick="newsManager.goToPage(${
                          this.currentPage + 1
                        })" 
                                class="px-3 py-2 text-sm font-medium text-gulf bg-white border border-gray-300 rounded-r-lg hover:bg-gray-50 hover:text-midnight transition-colors">
                            <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7"></path>
                            </svg>
                        </button>
                    `;
            }

            pagination.innerHTML = `<nav class="flex items-center">${paginationHTML}</nav>`;
          }

          goToPage(page) {
            this.currentPage = page;
            this.renderNews();
            this.updateResultsCounter();
          }

          updateResultsCounter() {
            const counter = document.getElementById("results-counter");
            const total = this.filteredNews.length;

            if (total === 0) {
              counter.textContent = "No articles found";
            } else if (total === this.allNews.length) {
              counter.textContent = `Showing ${total} article${
                total !== 1 ? "s" : ""
              }`;
            } else {
              counter.textContent = `Showing ${total} of ${this.allNews.length} articles`;
            }
          }
        }

        // Initialize the news manager when the page loads
        let newsManager;
       

        
        document.addEventListener("DOMContentLoaded", async () => {
          await i18n.init(); // wait for translations to load
        
          newsManager = new NewsManager();
        
          const languageButtons = document.querySelectorAll(
            "#language-switcher button, #mobile-language-switcher button"
          );
          languageButtons.forEach((btn) => {
            btn.addEventListener("click", async () => {
              await newsManager.renderNews(); // re-render news in new language
            });
          });
         
        });
    