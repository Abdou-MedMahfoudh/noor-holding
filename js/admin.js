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
          <label class="block text-sm text-gray-600 mb-1">
            Contenu (HTML autorisé — identique au format existant des articles)
          </label>
          <textarea data-field="content" data-lang="${lang.code}" rows="12" required
            class="w-full border border-gray-300 rounded-md px-3 py-2 font-mono text-sm focus:outline-none focus:ring-2 focus:ring-gulf"></textarea>
        </div>
      </div>
    </div>
  `
  ).join("");
}

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
          if (input) input.value = t[field] || "";
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

buildLangPanels();
if (getToken()) {
  showApp();
} else {
  showLogin();
}
