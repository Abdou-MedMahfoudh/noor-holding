const NEWS_JSON_PATH = './data/news.json';
let __newsCache = null ;
async function fetchNewsData(){
    if(__newsCache) return __newsCache ;
    const res = await fetch(NEWS_JSON_PATH);
    if(!res.ok) throw new Error('failed to load News');
    const data = await res.json();
    __newsCache = Array.isArray(data)? data : [] ;
    return __newsCache ;
}

function formatDate (dateStr){

    try {
        const d = new Date (dateStr);
        return d.toLocaleDateString("en-us", {month:"long", day : "numeric" , year: "numeric"})
    }
    catch(e){
        return dateStr ;
    }
}

/* Reusable card template — keep classes identical to your static markup */
function newsCardTemplate(item) {
  const imagePart = item.picture
    ? `<div class="h-48"><img src="${item.picture}" alt="${item.title}" class="w-full h-full object-cover"></div>`
    : `<div class="h-48 bg-gradient-to-br from-skyline to-gulf"></div>`;

  return `
  <article class="bg-white rounded-lg shadow-lg overflow-hidden hover:shadow-xl transition-shadow duration-300">
    ${imagePart}
    <div class="p-6">
      <div class="flex items-center space-x-2 mb-3">
        <svg class="w-3 h-3 text-skyline flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
            d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"></path>
        </svg>
        <span class="text-sm text-gray-500">
          ${formatDate(item.date)}
        </span>
      </div>
      <h3 class="text-xl font-medium text-midnight mb-3 hover:text-skyline transition-colors cursor-pointer">
        ${item.title}
      </h3>
      <p class="text-gray-600 leading-relaxed mb-4">
        ${item.description || ''}
      </p>
      <div class="flex items-center space-x-2">
        <a href="/news.html?id=${item.id}" class="text-sm text-gulf font-medium hover:text-midnight transition-colors">
          Read More
        </a>
        <svg class="w-3 h-3 text-gulf" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7"></path>
        </svg>
      </div>
    </div>
  </article>
  `;
}

/* render helpers */
function renderInto(container, html) {
  if (!container) return;
  container.innerHTML = html;
}


/* Render N latest news into containerId (defaults to 'news-container') */
async function renderLatestNews(containerId = 'news-container', count = 3) {
  const container = document.getElementById(containerId);
  if (!container) return;
  try {
    const data = await fetchNewsData();
    const sorted = data.slice().sort((a, b) => new Date(b.date) - new Date(a.date));
    const latest = sorted.slice(0, count);
    renderInto(container, latest.map(newsCardTemplate).join(''));
  } catch (err) {
    console.error(err);
    renderInto(container, `<div class="text-center text-gray-500">Unable to load news at the moment.</div>`);
  }
}



document.addEventListener("DOMContentLoaded", () => {
  if (document.getElementById("news-container")) {
    renderLatestNews("news-container", 3);
  }
  if (document.getElementById("all-news-container")) {
    renderAllNews("all-news-container");
  }
  if (document.getElementById("single-news")) {
    renderSingleNewsById();
  }
});