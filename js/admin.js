// js/admin.js
// Powers admin.html: login, list, create/edit/delete posts, image upload.
// Talks only to /api/* (Vercel functions) — never touches GitHub directly
// from the browser, so no token is ever exposed client-side.

const LANGS = [
  { code: "fr", label: "Français" },
  { code: "en", label: "English" },
  { code: "ar", label: "العربية" },
];

const SESSION_KEY = "noor_admin_token";

let currentPosts = [];
let editingId = null; // null = creating a new post
let uploadedPicturePath = null;

// ---------- auth ----------

function getToken() {
  return sessionStorage.getItem(SESSION_KEY);
}

function setToken(token) {
  sessionStorage.setItem(SESSION_KEY, token);
}

function clearToken() {
  sessionStorage.removeItem(SESSION_KEY);
}

async function apiFetch(path, options = {}) {
  const token = getToken();
  const res = await fetch(path, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...(options.headers || {}),
    },
  });
  if (res.status === 401) {
    clearToken();
    showLogin();
    throw new Error("Session expirée, merci de vous reconnecter.");
  }
  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    throw new Error(data.error || `Erreur (${res.status})`);
  }
  return data;
}

function showLogin() {
  document.getElementById("login-screen").classList.remove("hidden");
  document.getElementById("admin-app").classList.add("hidden");
}

function showApp() {
  document.getElementById("login-screen").classList.add("hidden");
  document.getElementById("admin-app").classList.remove("hidden");
  showListView();
  loadPosts();
}

document.getElementById("login-form").addEventListener("submit", async (e) => {
  e.preventDefault();
  const password = document.getElementById("login-password").value;
  const errorEl = document.getElementById("login-error");
  errorEl.classList.add("hidden");
  try {
    const res = await fetch("/api/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ password }),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || "Erreur de connexion");
    setToken(data.token);
    showApp();
  } catch (err) {
    errorEl.textContent = err.message;
    errorEl.classList.remove("hidden");
  }
});

document.getElementById("logout-btn").addEventListener("click", () => {
  clearToken();
  showLogin();
});

// ---------- list view ----------

function showListView() {
  document.getElementById("list-view").classList.remove("hidden");
  document.getElementById("form-view").classList.add("hidden");
}

function showFormView() {
  document.getElementById("list-view").classList.add("hidden");
  document.getElementById("form-view").classList.remove("hidden");
}

async function loadPosts() {
  const loadingEl = document.getElementById("posts-loading");
  const errorEl = document.getElementById("posts-error");
  const listEl = document.getElementById("posts-list");
  loadingEl.classList.remove("hidden");
  errorEl.classList.add("hidden");
  listEl.innerHTML = "";
  try {
    const data = await apiFetch("/api/posts");
    currentPosts = data.posts;
    renderPostsList();
  } catch (err) {
    errorEl.textContent = err.message;
    errorEl.classList.remove("hidden");
  } finally {
    loadingEl.classList.add("hidden");
  }
}

function renderPostsList() {
  const listEl = document.getElementById("posts-list");
  if (currentPosts.length === 0) {
    listEl.innerHTML = `<p class="text-gray-500 text-sm">Aucun article pour le moment.</p>`;
    return;
  }
  listEl.innerHTML = currentPosts
    .map(
      (post) => `
    <div class="bg-white rounded-lg shadow p-4 flex items-center gap-4">
      <img src="${post.picture}" class="h-16 w-24 object-cover rounded-md flex-shrink-0 bg-gray-100">
      <div class="flex-1 min-w-0">
        <p class="font-medium text-skyline truncate">${escapeHtml(post.title)}</p>
        <p class="text-sm text-gray-500">${post.date}${post.featured ? " · À la une" : ""}</p>
      </div>
      <button data-edit-id="${post.id}" class="text-sm text-gulf hover:text-midnight font-medium">Modifier</button>
      <button data-delete-id="${post.id}" class="text-sm text-red-600 hover:text-red-800 font-medium">Supprimer</button>
    </div>
  `
    )
    .join("");

  listEl.querySelectorAll("[data-edit-id]").forEach((btn) => {
    btn.addEventListener("click", () => openEditForm(Number(btn.dataset.editId)));
  });
  listEl.querySelectorAll("[data-delete-id]").forEach((btn) => {
    btn.addEventListener("click", () => deletePost(Number(btn.dataset.deleteId)));
  });
}

async function deletePost(id) {
  const post = currentPosts.find((p) => p.id === id);
  const confirmed = confirm(
    `Supprimer l'article "${post?.title || id}" ? Cette action est irréversible.`
  );
  if (!confirmed) return;
  try {
    await apiFetch(`/api/posts?id=${id}`, { method: "DELETE" });
    await loadPosts();
  } catch (err) {
    alert(`Erreur lors de la suppression : ${err.message}`);
  }
}

document.getElementById("new-post-btn").addEventListener("click", () => openNewForm());
document.getElementById("back-to-list-btn").addEventListener("click", () => showListView());

// ---------- form view ----------

function buildLangPanels() {
  const container = document.getElementById("lang-panels");
  container.innerHTML = LANGS.map(
    (lang) => `
    <div class="lang-panel ${lang.code !== "fr" ? "hidden" : ""}" data-lang-panel="${lang.code}"
      dir="${lang.code === "ar" ? "rtl" : "ltr"}">
      <div class="space-y-4">
        <div>
          <label class="block text-sm text-gray-600 mb-1">Titre</label>
          <input type="text" data-field="title" data-lang="${lang.code}" required
            class="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-gulf">
        </div>
        <div>
          <label class="block text-sm text-gray-600 mb-1">Description (résumé court)</label>
          <textarea data-field="description" data-lang="${lang.code}" rows="2" required
            class="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-gulf"></textarea>
        </div>
        <div class="grid grid-cols-2 gap-4">
          <div>
            <label class="block text-sm text-gray-600 mb-1">Auteur</label>
            <input type="text" data-field="author" data-lang="${lang.code}" required
              class="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-gulf">
          </div>
          <div>
            <label class="block text-sm text-gray-600 mb-1">Catégorie</label>
            <input type="text" data-field="category" data-lang="${lang.code}" required
              class="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-gulf">
          </div>
        </div>
        <div>
          <div class="flex items-center justify-between mb-1">
            <label class="block text-sm text-gray-600">Contenu de l'article</label>
            <div class="flex items-center gap-4" dir="ltr">
              <button type="button" data-copy-prompt="${lang.code}"
                class="text-xs text-gulf hover:text-midnight"
                title="Copie un prompt à coller dans ChatGPT / Claude pour obtenir un article au bon format">
                ${lang.code === "fr" ? "Copier le prompt IA" : "Copier le prompt de traduction IA"}
              </button>
              <button type="button" data-toggle-source="${lang.code}"
                class="text-xs text-gulf hover:text-midnight">Afficher le code HTML</button>
            </div>
          </div>
          <div class="border border-gray-300 rounded-md overflow-hidden focus-within:ring-2 focus-within:ring-gulf">
            <div data-toolbar="${lang.code}" class="flex flex-wrap gap-1 border-b border-gray-200 bg-gray-50 px-2 py-2" dir="ltr">
              ${TOOLBAR.map(
                (b) => `<button type="button" class="editor-btn" data-cmd="${b.cmd}" title="${b.title}">${b.label}</button>`
              ).join("")}
            </div>
            <div class="bg-white px-5 sm:px-8 py-6 max-h-[70vh] overflow-y-auto">
              <div data-editor="${lang.code}" contenteditable="true"
                data-placeholder="Commencez à écrire l'article…"
                class="article-editor relative min-h-[20rem] text-lg sm:text-xl md:text-xl text-skyline leading-relaxed font-light break-words"></div>
            </div>
            <textarea data-field="content" data-lang="${lang.code}" rows="18" dir="ltr"
              class="hidden w-full px-3 py-2 font-mono text-sm focus:outline-none"></textarea>
          </div>
          <p class="text-xs text-gray-500 mt-1">
            Collez directement le texte d'une IA (ChatGPT, Claude, Gemini…) ou de Word : titres, gras et listes
            sont convertis automatiquement au style du site, et un « # Titre » remplit le champ Titre.
            L'aperçu ci-dessus correspond au rendu sur le site.
          </p>
        </div>
      </div>
    </div>
  `
  ).join("");

  for (const lang of LANGS) loadEditor(lang.code, "");
}

// ---------- article content editor ----------
// A WYSIWYG editor styled like #article-body on news.html. Its output uses the
// same HTML/classes as the existing articles so new posts look identical.

const TOOLBAR = [
  { cmd: "p", label: "¶ Paragraphe", title: "Texte normal" },
  { cmd: "h2", label: "Titre de section", title: "Intertitre (grand, police serif)" },
  { cmd: "h3", label: "Sous-titre", title: "Petit titre" },
  { cmd: "bold", label: "<b>Gras</b>", title: "Mettre en avant un nom (gras, couleur Gulf)" },
  { cmd: "lead", label: "Lieu", title: "Ex : « NOUAKCHOTT, Mauritanie » en début d'article" },
  { cmd: "ul", label: "• Liste", title: "Liste à puces" },
  { cmd: "quote", label: "❝ Citation", title: "Citation" },
  { cmd: "image", label: "🖼 Image", title: "Insérer une image dans l'article" },
  { cmd: "clear", label: "Effacer le format", title: "Revenir au texte normal" },
];

function blockClasses(tag, lang) {
  const rtl = lang === "ar";
  switch (tag) {
    case "H2": return "text-2xl font-dm-serif text-midnight mt-12 mb-6";
    case "H3": return "text-xl font-semibold text-midnight mt-8 mb-3";
    case "UL": return `list-disc list-inside space-y-3 ${rtl ? "mr-4" : "ml-4"} my-8`;
    case "OL": return `list-decimal list-inside space-y-3 ${rtl ? "mr-4" : "ml-4"} my-8`;
    case "BLOCKQUOTE":
      return rtl ? "border-r-4 border-sand pr-4 italic my-8" : "border-l-4 border-sand pl-4 italic my-8";
  }
  return "";
}

const IMAGE_WRAPPER_CLASS = "flex justify-center my-8 w-full";
const IMAGE_CLASS = "rounded-lg shadow-md max-w-full";

function getEditor(lang) {
  return document.querySelector(`[data-editor="${lang}"]`);
}

function getSourceArea(lang) {
  return document.querySelector(`[data-field="content"][data-lang="${lang}"]`);
}

function isSourceMode(lang) {
  return !getSourceArea(lang).classList.contains("hidden");
}

function loadEditor(lang, html) {
  const editor = getEditor(lang);
  editor.innerHTML = html && html.trim() ? html : "<p><br></p>";
  getSourceArea(lang).value = html || "";
  normalizeEditor(editor, lang);
}

// Light, selection-safe cleanup applied while typing: only touches attributes.
function normalizeEditor(editor, lang) {
  editor.querySelectorAll("h2, h3, ul, ol, blockquote").forEach((el) => {
    if (!el.className.trim()) el.className = blockClasses(el.tagName, lang);
  });
  editor.querySelectorAll("[style]").forEach((el) => el.removeAttribute("style"));
  editor.querySelectorAll("img").forEach((img) => {
    if (!img.className.trim()) img.className = IMAGE_CLASS;
  });
  editor.classList.toggle("is-empty", !editor.textContent.trim() && !editor.querySelector("img"));
}

// Full cleanup run when saving / switching to HTML: produces the final HTML.
function serializeEditor(lang) {
  const editor = getEditor(lang);
  normalizeEditor(editor, lang);
  const root = editor.cloneNode(true);
  const altFallback = getFieldValue("title", lang);

  const unwrap = (el) => el.replaceWith(...el.childNodes);
  const rename = (el, tag, className) => {
    const replacement = document.createElement(tag);
    if (className) replacement.className = className;
    replacement.append(...el.childNodes);
    el.replaceWith(replacement);
    return replacement;
  };

  root.querySelectorAll("span, font").forEach(unwrap);
  // Browsers sometimes nest lists/headings inside a <p>, which is invalid HTML
  root.querySelectorAll("p").forEach((p) => {
    if (p.querySelector("ul, ol, h2, h3, blockquote, div, p")) unwrap(p);
  });
  root.querySelectorAll("b").forEach((el) => rename(el, "strong", "text-gulf"));
  root.querySelectorAll("i").forEach((el) => rename(el, "em"));

  root.querySelectorAll("img").forEach((img) => {
    if (img.dataset.src) {
      img.setAttribute("src", img.dataset.src);
      img.removeAttribute("data-src");
    }
    if (!img.getAttribute("alt")) img.setAttribute("alt", altFallback);
    const parent = img.parentElement;
    const wrapped = parent && parent !== root && parent.classList.contains("flex");
    if (!wrapped) {
      const wrapper = document.createElement("div");
      wrapper.className = IMAGE_WRAPPER_CLASS;
      // Lift the image out of any paragraph it was typed into
      const block = img.closest("p, h2, h3, li, blockquote") || img;
      if (block !== img && block.parentElement === root) block.after(wrapper);
      else img.before(wrapper);
      wrapper.appendChild(img);
    }
  });

  // Every top-level piece of content must be a block element
  const blocks = [];
  let looseInline = null;
  for (const node of [...root.childNodes]) {
    const isBlock =
      node.nodeType === Node.ELEMENT_NODE &&
      /^(P|H2|H3|UL|OL|BLOCKQUOTE|DIV)$/.test(node.tagName);
    if (isBlock) {
      looseInline = null;
      let el = node;
      if (el.tagName === "DIV" && !el.className.trim()) el = rename(el, "p");
      blocks.push(el);
    } else if (node.nodeType === Node.TEXT_NODE && !node.textContent.trim()) {
      continue;
    } else {
      if (!looseInline) {
        looseInline = document.createElement("p");
        blocks.push(looseInline);
      }
      looseInline.appendChild(node);
    }
  }

  return blocks
    .filter((el) => el.textContent.trim() || el.querySelector("img"))
    .map((el) => {
      // Drop trailing <br> left behind by the browser
      el.querySelectorAll("br").forEach((br) => {
        if (!br.nextSibling) br.remove();
      });
      return el.outerHTML;
    })
    .join("\n\n");
}

// Copy every editor's content into its textarea (the value that gets saved)
function syncEditorsToSource() {
  for (const lang of LANGS) {
    if (!isSourceMode(lang.code)) getSourceArea(lang.code).value = serializeEditor(lang.code);
  }
}

function toggleSource(lang) {
  const editor = getEditor(lang);
  const source = getSourceArea(lang);
  const toolbar = document.querySelector(`[data-toolbar="${lang}"]`);
  const btn = document.querySelector(`[data-toggle-source="${lang}"]`);
  if (isSourceMode(lang)) {
    loadEditor(lang, source.value);
    source.classList.add("hidden");
    editor.parentElement.classList.remove("hidden");
    toolbar.classList.remove("hidden");
    btn.textContent = "Afficher le code HTML";
  } else {
    source.value = serializeEditor(lang);
    source.classList.remove("hidden");
    editor.parentElement.classList.add("hidden");
    toolbar.classList.add("hidden");
    btn.textContent = "Revenir à l'éditeur visuel";
  }
}

function selectionInside(editor) {
  const sel = window.getSelection();
  return sel.rangeCount > 0 && editor.contains(sel.getRangeAt(0).commonAncestorContainer);
}

function placeCaretAtEnd(editor) {
  editor.focus();
  const range = document.createRange();
  range.selectNodeContents(editor);
  range.collapse(false);
  const sel = window.getSelection();
  sel.removeAllRanges();
  sel.addRange(range);
}

function runEditorCommand(lang, cmd) {
  const editor = getEditor(lang);
  if (!selectionInside(editor)) placeCaretAtEnd(editor);
  editor.focus();

  switch (cmd) {
    case "p": document.execCommand("formatBlock", false, "<p>"); break;
    case "h2": document.execCommand("formatBlock", false, "<h2>"); break;
    case "h3": document.execCommand("formatBlock", false, "<h3>"); break;
    case "quote": document.execCommand("formatBlock", false, "<blockquote>"); break;
    case "bold": document.execCommand("bold"); break;
    case "ul": document.execCommand("insertUnorderedList"); break;
    case "clear":
      document.execCommand("removeFormat");
      document.execCommand("formatBlock", false, "<p>");
      break;
    case "lead": {
      const range = window.getSelection().getRangeAt(0);
      if (range.collapsed) {
        alert("Sélectionnez d'abord le texte (ex : « NOUAKCHOTT, Mauritanie »).");
        return;
      }
      const strong = document.createElement("strong");
      strong.className = "text-midnight";
      strong.appendChild(range.extractContents());
      range.insertNode(strong);
      break;
    }
    case "image":
      pickInlineImage(lang);
      return;
  }
  normalizeEditor(editor, lang);
}

function pickInlineImage(lang) {
  const editor = getEditor(lang);
  const savedRange = window.getSelection().getRangeAt(0).cloneRange();
  const input = document.createElement("input");
  input.type = "file";
  input.accept = "image/*";
  input.addEventListener("change", async () => {
    const file = input.files[0];
    if (!file) return;
    const statusEl = document.getElementById("save-status");
    statusEl.textContent = "Téléversement de l'image…";
    try {
      const base64 = await fileToBase64(file);
      const data = await apiFetch("/api/upload-image", {
        method: "POST",
        body: JSON.stringify({ filename: file.name, base64 }),
      });
      editor.focus();
      const sel = window.getSelection();
      sel.removeAllRanges();
      sel.addRange(savedRange);
      // Show the local file now (the uploaded one is only live after the site rebuilds);
      // data-src holds the real path that gets saved.
      document.execCommand(
        "insertHTML",
        false,
        `<div class="${IMAGE_WRAPPER_CLASS}"><img src="${URL.createObjectURL(file)}" data-src="${data.path}" alt="" class="${IMAGE_CLASS}"></div><p><br></p>`
      );
      normalizeEditor(editor, lang);
      statusEl.textContent = "Image ajoutée ✓";
    } catch (err) {
      statusEl.textContent = `Erreur image : ${err.message}`;
    }
  });
  input.click();
}

function escapeText(str) {
  return escapeHtml(str).replace(/ /g, " ");
}

const langPanels = document.getElementById("lang-panels");

// Keep the text selection when clicking toolbar buttons
langPanels.addEventListener("mousedown", (e) => {
  if (e.target.closest("[data-cmd]")) e.preventDefault();
});

langPanels.addEventListener("click", (e) => {
  const cmdBtn = e.target.closest("[data-cmd]");
  if (cmdBtn) {
    const lang = cmdBtn.closest("[data-toolbar]").dataset.toolbar;
    runEditorCommand(lang, cmdBtn.dataset.cmd);
    return;
  }
  const toggleBtn = e.target.closest("[data-toggle-source]");
  if (toggleBtn) toggleSource(toggleBtn.dataset.toggleSource);
});

langPanels.addEventListener("input", (e) => {
  const editor = e.target.closest("[data-editor]");
  if (editor) normalizeEditor(editor, editor.dataset.editor);
});

// ---------- paste (built for copy/paste from ChatGPT, Claude, Gemini, Word…) ----------
// Rich HTML (text selected in the chat) and Markdown (the chat's "copy" button)
// are both converted to the article format; foreign styles are dropped.

const BOLD = (inner) => `<strong class="text-gulf">${inner}</strong>`;

// "# Title" from the AI fills the title field when it is still empty
function takeTitle(lang, text) {
  const input = document.querySelector(`[data-field="title"][data-lang="${lang}"]`);
  if (input && !input.value.trim()) {
    input.value = text;
    return true;
  }
  return false;
}

// AIs often use "###" for sections, so levels 1–3 all become section headings
function headingBlock(level, plainText, lang) {
  const text = plainText.replace(/\s+/g, " ").trim();
  if (!text) return null;
  if (level === 1 && takeTitle(lang, text)) return null;
  return level <= 3 ? `<h2>${escapeText(text)}</h2>` : `<h3>${escapeText(text)}</h3>`;
}

function markdownInline(text) {
  return escapeText(text)
    .replace(/\[([^\]]+)\]\([^)]+\)/g, "$1")
    .replace(/`([^`]+)`/g, "$1")
    .replace(/\*\*(.+?)\*\*|__(.+?)__/g, (_, a, b) => BOLD(a || b))
    .replace(/(^|[^*])\*(?!\s)([^*]+?)\*(?!\*)/g, "$1<em>$2</em>");
}

function markdownToBlocks(text, lang) {
  const blocks = [];
  let list = null;
  const closeList = () => {
    if (list) blocks.push(`<${list.tag}>${list.items.map((i) => `<li>${i}</li>`).join("")}</${list.tag}>`);
    list = null;
  };
  for (const raw of text.split(/\r?\n/)) {
    const line = raw.trim();
    let m;
    if (!line) { closeList(); continue; }
    if (/^([-*_])\1{2,}$/.test(line)) { closeList(); continue; }
    if ((m = line.match(/^(#{1,6})\s+(.*?)\s*#*$/))) {
      closeList();
      const block = headingBlock(m[1].length, m[2].replace(/[*_`]/g, ""), lang);
      if (block) blocks.push(block);
    } else if ((m = line.match(/^(?:[-*+•]|(\d+)[.)])\s+(.*)$/))) {
      const tag = m[1] ? "ol" : "ul";
      if (!list || list.tag !== tag) { closeList(); list = { tag, items: [] }; }
      list.items.push(markdownInline(m[2]));
    } else if ((m = line.match(/^>\s?(.*)$/))) {
      closeList();
      blocks.push(`<blockquote>${markdownInline(m[1])}</blockquote>`);
    } else {
      closeList();
      blocks.push(`<p>${markdownInline(line)}</p>`);
    }
  }
  closeList();
  return blocks;
}

function htmlToBlocks(html, lang) {
  const doc = new DOMParser().parseFromString(html, "text/html");
  const blocks = [];
  let pending = "";
  const flush = () => {
    if (pending.trim()) blocks.push(`<p>${pending.trim()}</p>`);
    pending = "";
  };
  const SKIP = /^(SCRIPT|STYLE|META|LINK|TITLE|BUTTON|SVG|IMG|HR|TABLE|FORM|INPUT|NAV|HEADER|FOOTER)$/;

  const inline = (node) =>
    [...node.childNodes]
      .map((n) => {
        if (n.nodeType === Node.TEXT_NODE) return escapeText(n.textContent.replace(/\s+/g, " "));
        if (n.nodeType !== Node.ELEMENT_NODE || SKIP.test(n.tagName)) return "";
        if (/^(UL|OL)$/.test(n.tagName)) return "";
        const inner = inline(n);
        if (/^(STRONG|B)$/.test(n.tagName)) return inner.trim() ? BOLD(inner) : inner;
        if (/^(EM|I)$/.test(n.tagName)) return inner.trim() ? `<em>${inner}</em>` : inner;
        if (n.tagName === "BR") return "<br>";
        if (n.tagName === "P" || n.tagName === "DIV") return ` ${inner} `;
        return inner;
      })
      .join("");

  const listItems = (listEl) =>
    [...listEl.children].flatMap((li) => {
      const own = inline(li).trim();
      const nested = [...li.querySelectorAll(":scope > ul, :scope > ol")].flatMap(listItems);
      return own ? [own, ...nested] : nested;
    });

  const walk = (container) => {
    for (const n of container.childNodes) {
      if (n.nodeType === Node.TEXT_NODE) { pending += escapeText(n.textContent.replace(/\s+/g, " ")); continue; }
      if (n.nodeType !== Node.ELEMENT_NODE || SKIP.test(n.tagName)) continue;
      const tag = n.tagName;
      if (/^H[1-6]$/.test(tag)) {
        flush();
        const block = headingBlock(Number(tag[1]), n.textContent, lang);
        if (block) blocks.push(block);
      } else if (tag === "P") {
        flush();
        const inner = inline(n).trim();
        if (inner) blocks.push(`<p>${inner}</p>`);
      } else if (tag === "UL" || tag === "OL") {
        flush();
        const items = listItems(n);
        if (items.length) blocks.push(`<${tag.toLowerCase()}>${items.map((i) => `<li>${i}</li>`).join("")}</${tag.toLowerCase()}>`);
      } else if (tag === "BLOCKQUOTE") {
        flush();
        const inner = inline(n).trim();
        if (inner) blocks.push(`<blockquote>${inner}</blockquote>`);
      } else if (/^(DIV|SECTION|ARTICLE|MAIN|BODY|SPAN)$/.test(tag) && n.querySelector("p, h1, h2, h3, h4, h5, h6, ul, ol, blockquote, div")) {
        flush();
        walk(n);
        flush();
      } else if (tag === "DIV") {
        flush();
        const inner = inline(n).trim();
        if (inner) blocks.push(`<p>${inner}</p>`);
      } else {
        pending += inline({ childNodes: [n] });
      }
    }
  };
  walk(doc.body);
  flush();
  return blocks;
}

const plainOf = (html) => {
  const div = document.createElement("div");
  div.innerHTML = html;
  return div.textContent.trim();
};

// For plain text without any formatting: does this line read like a heading?
// e.g. "Une Synergie d'Expertises pour une Dynamique Multisectorielle"
function looksLikeHeading(text, nextText) {
  const words = text.split(/\s+/);
  if (text.length > 110 || words.length > 15 || words.length < 2) return false;
  if (/^[«"“—–\-]/.test(text) || /[,;:»"”]$/.test(text)) return false;
  if (nextText !== undefined && nextText.length < text.length) return false;
  const capitalized = words.filter((w) => /^[A-ZÀ-ÖØ-Þ]/.test(w)).length;
  const hasLatin = /[A-Za-zÀ-ÿ]/.test(text);
  if (/[.!?]$/.test(text)) return hasLatin && capitalized / words.length >= 0.5;
  return true;
}

// Like the existing articles: the group's name and people's names in bold Gulf
// e.g. "M. Ahmed Salem Ely", "Mr. Ayari Khaled", "Noor Holding", "نور القابضة"
const NAME_WORD = "[A-ZÀ-ÖØ-Þ][\\wÀ-ÿ'’\\-]+";
const NAME_PATTERN = new RegExp(
  `\\b(?:Noor|Nour) Holdings?\\b|NOOR HOLDING|نور القابضة|` +
    `(?:\\b(?:M|Mr|Mme|Mrs|Ms|Dr|Pr)\\.|\\b(?:Monsieur|Madame|Son Excellence|His Excellency|Her Excellency)\\b)\\s+(?:${NAME_WORD}\\s+){0,3}${NAME_WORD}|` +
    `(?:(?:ال|لل)سيدة?|معالي|سعادة)\\s+(?:[^\\s،,.<]+\\s+){0,2}[^\\s،,.<]+`,
  "g"
);

function highlightNames(block) {
  return block.replace(NAME_PATTERN, (m) => BOLD(m));
}

// Final touches so pasted AI text looks like the existing articles
function polishBlocks(blocks, isArticleStart, lang) {
  const plainPara = (b) => /^<p>[^<]*<\/p>$/.test(b);
  const hasFormatting = blocks.some((b) => !plainPara(b));
  let result = blocks.map((b) => {
    // A short paragraph that is only bold text is really a section heading
    const m = b.match(/^<p><strong class="text-gulf">([^<]{2,90})<\/strong>:?<\/p>$/);
    if (m && !/[.!?]$/.test(m[1].trim())) return `<h2>${m[1].trim().replace(/:$/, "")}</h2>`;
    return b;
  });

  if (!hasFormatting) {
    // Plain text: the first line is the title, short title-like lines are headings
    if (isArticleStart && result.length > 1 && looksLikeHeading(plainOf(result[0]))) {
      if (takeTitle(lang, plainOf(result[0]).replace(/[.]$/, ""))) result.shift();
    }
    result = result.map((b, i) => {
      const text = plainOf(b);
      const next = result[i + 1] && plainOf(result[i + 1]);
      if (i > 0 && next !== undefined && looksLikeHeading(text, next)) {
        return `<h2>${escapeText(text.replace(/[.]$/, ""))}</h2>`;
      }
      return b;
    });
    result = result.map((b) => (/^<(p|blockquote)>/.test(b) ? highlightNames(b) : b));
  }

  // « Quote » followed by "— Name" → one styled quote block
  result = result.flatMap((b, i) => {
    const text = plainOf(b);
    if (!/^<p>/.test(b) || !/^[«"“].{20,}[»"”]$/.test(text)) return [b];
    const next = result[i + 1];
    const author = next && /^<p>\s*[—–-]\s*[^<]{2,150}<\/p>$/.test(next) ? next.slice(3, -4).trim() : null;
    if (author) result[i + 1] = null;
    return [`<blockquote>${b.slice(3, -4)}${author ? `<br>${author}` : ""}</blockquote>`];
  }).filter(Boolean);

  if (isArticleStart) {
    // "NOUAKCHOTT, Mauritanie – Le 6 octobre…" → dateline styled like the other articles
    const i = result.findIndex((b) => b.startsWith("<p>"));
    if (i !== -1 && /^<p><strong class="text-gulf">[^<]{3,45}<\/strong>\s*[–—]/.test(result[i])) {
      result[i] = result[i].replace('class="text-gulf"', 'class="text-midnight"');
    } else if (i !== -1 && !result[i].startsWith("<p><strong")) {
      result[i] = result[i].replace(
        /^<p>([^<–—]{3,45}?)\s+([–—])\s/,
        (_, place, dash) => `<p><strong class="text-midnight">${place}</strong> ${dash} `
      );
    }
  }
  return result;
}

function looksLikeMarkdown(text) {
  return /^\s*(#{1,6}\s|[-*+]\s|\d+[.)]\s|>\s)|\*\*[^*]+\*\*/m.test(text);
}

langPanels.addEventListener("paste", (e) => {
  const editor = e.target.closest("[data-editor]");
  if (!editor) return;
  e.preventDefault();
  const lang = editor.dataset.editor;
  const html = e.clipboardData.getData("text/html");
  const text = e.clipboardData.getData("text/plain");

  const richHtml = html && /<(h[1-6]|ul|ol|strong|b|p|blockquote)\b/i.test(html);
  const htmlHasStructure = html && /<(h[1-6]|ul|ol|strong|b)\b/i.test(html);
  const useHtml = richHtml && (htmlHasStructure || !looksLikeMarkdown(text));

  let blocks = useHtml ? htmlToBlocks(html, lang) : markdownToBlocks(text, lang);

  // A short inline snippet: just insert the text where the cursor is
  if (blocks.length <= 1 && !/\n/.test(text.trim()) && !/^<(h2|h3|ul|ol|blockquote)/.test(blocks[0] || "")) {
    document.execCommand("insertText", false, text.trim());
    normalizeEditor(editor, lang);
    return;
  }

  const wasEmpty = editor.classList.contains("is-empty");
  blocks = polishBlocks(blocks, wasEmpty, lang);
  if (wasEmpty) {
    editor.innerHTML = blocks.join("");
    placeCaretAtEnd(editor);
  } else {
    document.execCommand("insertHTML", false, blocks.join(""));
  }
  normalizeEditor(editor, lang);
});

// ---------- AI prompt helper ----------

const AI_PROMPTS = {
  fr: `Rédige un article d'actualité professionnel en français pour le site du groupe Noor Holding (Mauritanie), à partir des informations ci-dessous.

Format obligatoire (Markdown) :
- Première ligne : le titre, précédé de "# ".
- Le premier paragraphe commence par le lieu suivi d'un tiret long, par exemple : "NOUAKCHOTT, Mauritanie – Le 6 octobre 2026, …".
- 2 à 4 intertitres précédés de "## ".
- Mets en **gras** les noms de personnes, d'entreprises et d'institutions.
- Utilise des listes à puces "- " pour énumérer des points, avec un début en **gras** si utile.
- Paragraphes courts, ton institutionnel. Pas d'emojis, pas de tableaux, pas de lignes "---".
- Réponds uniquement avec l'article.

Informations :
`,
  en: `Translate the following Noor Holding news article into English. Keep exactly the same Markdown structure: "# " title on the first line, the opening dateline ("NOUAKCHOTT, Mauritania – …"), "## " section headings, **bold** names and "- " bullet lists. No emojis, no tables. Reply with the article only.

Article:
`,
  ar: `ترجم مقال الأخبار التالي الخاص بمجموعة نور القابضة إلى اللغة العربية الفصحى. حافظ على نفس بنية Markdown تمامًا: العنوان في السطر الأول بعد "# "، ثم المكان في بداية الفقرة الأولى ("نواكشوط، موريتانيا – ...")، والعناوين الفرعية بعد "## "، والأسماء بخط **عريض**، والقوائم بعد "- ". بدون رموز تعبيرية أو جداول. أجب بالمقال فقط.

المقال:
`,
};

langPanels.addEventListener("click", async (e) => {
  const btn = e.target.closest("[data-copy-prompt]");
  if (!btn) return;
  const original = btn.textContent;
  try {
    await navigator.clipboard.writeText(AI_PROMPTS[btn.dataset.copyPrompt]);
    btn.textContent = "Prompt copié ✓";
  } catch {
    btn.textContent = "Copie impossible";
  }
  setTimeout(() => (btn.textContent = original), 2000);
});

document.querySelectorAll("[data-lang-tab]").forEach((tab) => {
  tab.addEventListener("click", () => {
    document.querySelectorAll("[data-lang-tab]").forEach((t) => {
      t.classList.remove("border-gulf", "text-gulf");
      t.classList.add("border-transparent", "text-gray-500");
    });
    tab.classList.add("border-gulf", "text-gulf");
    tab.classList.remove("border-transparent", "text-gray-500");

    const lang = tab.dataset.langTab;
    document.querySelectorAll("[data-lang-panel]").forEach((panel) => {
      panel.classList.toggle("hidden", panel.dataset.langPanel !== lang);
    });
  });
});

function resetForm() {
  document.getElementById("post-form").reset();
  document.getElementById("field-picture-path").value = "";
  document.getElementById("image-preview").classList.add("hidden");
  document.getElementById("image-upload-status").textContent = "";
  document.getElementById("form-error").classList.add("hidden");
  uploadedPicturePath = null;
  buildLangPanels();
}

function openNewForm() {
  editingId = null;
  resetForm();
  document.getElementById("form-title").textContent = "Nouvel article";
  document.getElementById("field-date").value = new Date().toISOString().slice(0, 10);
  showFormView();
}

function openEditForm(id) {
  editingId = id;
  resetForm();
  document.getElementById("form-title").textContent = "Modifier l'article";
  showFormView();

  try {
    const post = currentPosts.find((p) => p.id === id);
    if (!post) throw new Error("Article introuvable.");

    document.getElementById("field-date").value = post.date;
    document.getElementById("field-featured").checked = !!post.featured;
    document.getElementById("field-picture-path").value = post.picture;
    uploadedPicturePath = post.picture;
    const preview = document.getElementById("image-preview");
    preview.src = post.picture;
    preview.classList.remove("hidden");

    if (post.translations) {
      for (const lang of LANGS) {
        const t = post.translations[lang.code] || {};
        for (const field of ["title", "description", "author", "category", "content"]) {
          const input = document.querySelector(
            `[data-field="${field}"][data-lang="${lang.code}"]`
          );
          if (field === "content") loadEditor(lang.code, t.content || "");
          else if (input) input.value = t[field] || "";
        }
      }
    }
  } catch (err) {
    document.getElementById("form-error").textContent = err.message;
    document.getElementById("form-error").classList.remove("hidden");
  }
}

// ---------- image upload ----------

document.getElementById("field-image-file").addEventListener("change", async (e) => {
  const file = e.target.files[0];
  if (!file) return;

  const statusEl = document.getElementById("image-upload-status");
  statusEl.textContent = "Téléversement en cours…";

  try {
    const base64 = await fileToBase64(file);
    const data = await apiFetch("/api/upload-image", {
      method: "POST",
      body: JSON.stringify({ filename: file.name, base64 }),
    });
    uploadedPicturePath = data.path;
    document.getElementById("field-picture-path").value = data.path;
    const preview = document.getElementById("image-preview");
    preview.src = URL.createObjectURL(file);
    preview.classList.remove("hidden");
    statusEl.textContent = "Image téléversée ✓";
  } catch (err) {
    statusEl.textContent = `Erreur : ${err.message}`;
  }
});

function fileToBase64(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      // result is "data:image/jpeg;base64,XXXX" — strip the prefix
      const base64 = reader.result.split(",")[1];
      resolve(base64);
    };
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

// ---------- save ----------

document.getElementById("post-form").addEventListener("submit", async (e) => {
  e.preventDefault();
  const errorEl = document.getElementById("form-error");
  const statusEl = document.getElementById("save-status");
  errorEl.classList.add("hidden");

  const picture = document.getElementById("field-picture-path").value || uploadedPicturePath;
  if (!picture) {
    errorEl.textContent = "Merci d'ajouter une image.";
    errorEl.classList.remove("hidden");
    return;
  }

  syncEditorsToSource();
  const missing = LANGS.find((lang) => !getFieldValue("content", lang.code));
  if (missing) {
    errorEl.textContent = `Le contenu de l'article est vide (${missing.label}).`;
    errorEl.classList.remove("hidden");
    return;
  }

  const translations = {};
  for (const lang of LANGS) {
    translations[lang.code] = {
      title: getFieldValue("title", lang.code),
      description: getFieldValue("description", lang.code),
      author: getFieldValue("author", lang.code),
      category: getFieldValue("category", lang.code),
      content: getFieldValue("content", lang.code),
    };
  }

  const payload = {
    date: document.getElementById("field-date").value,
    featured: document.getElementById("field-featured").checked,
    picture,
    translations,
  };

  statusEl.textContent = "Enregistrement…";
  try {
    if (editingId) {
      await apiFetch(`/api/posts?id=${editingId}`, {
        method: "PUT",
        body: JSON.stringify(payload),
      });
    } else {
      await apiFetch("/api/posts", {
        method: "POST",
        body: JSON.stringify(payload),
      });
    }
    statusEl.textContent = "Enregistré ✓ Le site se mettra à jour dans quelques instants.";
    await loadPosts();
    setTimeout(() => {
      showListView();
      statusEl.textContent = "";
    }, 1200);
  } catch (err) {
    statusEl.textContent = "";
    errorEl.textContent = err.message;
    errorEl.classList.remove("hidden");
  }
});

function getFieldValue(field, lang) {
  const el = document.querySelector(`[data-field="${field}"][data-lang="${lang}"]`);
  return el ? el.value.trim() : "";
}

function escapeHtml(str) {
  const div = document.createElement("div");
  div.textContent = str || "";
  return div.innerHTML;
}

// ---------- boot ----------

document.execCommand("defaultParagraphSeparator", false, "p");
buildLangPanels();
if (getToken()) {
  showApp();
} else {
  showLogin();
}
