// netlify/functions/posts.js
// CRUD for news articles. Keeps data/news.json (metadata) and
// data/news-translations.json (fr/en/ar text) in sync on every write.
//
// GET    /api/posts          -> list all posts (metadata + fr title/description + full translations)
// POST   /api/posts          -> create a new post
// PUT    /api/posts?id=5     -> update an existing post
// DELETE /api/posts?id=5     -> delete a post

const { isAuthenticated } = require("./_auth");
const { getJsonFile, putFile } = require("./_github");

const NEWS_PATH = "data/news.json";
const TRANSLATIONS_PATH = "data/news-translations.json";
const LANGS = ["fr", "en", "ar"];

function json(statusCode, payload) {
  return {
    statusCode,
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  };
}

function validateArticleText(text, lang) {
  const required = ["title", "description", "author", "category", "content"];
  for (const field of required) {
    if (!text || typeof text[field] !== "string" || !text[field].trim()) {
      throw new Error(`Missing "${field}" for language "${lang}"`);
    }
  }
}

exports.handler = async function (event) {
  if (!isAuthenticated(event)) {
    return json(401, { error: "Not authenticated. Please log in again." });
  }

  const method = event.httpMethod;
  const id = event.queryStringParameters?.id
    ? Number(event.queryStringParameters.id)
    : null;

  let body = {};
  if (event.body) {
    try {
      body = JSON.parse(event.body);
    } catch (e) {
      return json(400, { error: "Invalid JSON body" });
    }
  }

  try {
    if (method === "GET") {
      const { json: news } = await getJsonFile(NEWS_PATH);
      const { json: translations } = await getJsonFile(TRANSLATIONS_PATH);

      const merged = news.map((article) => {
        const fr = translations.fr?.articles?.[String(article.id)] || {};
        const articleTranslations = {};
        for (const lang of LANGS) {
          articleTranslations[lang] =
            translations[lang]?.articles?.[String(article.id)] || {};
        }
        return {
          ...article,
          title: fr.title || "(untitled)",
          description: fr.description || "",
          translations: articleTranslations,
        };
      });

      merged.sort((a, b) => new Date(b.date) - new Date(a.date));
      return json(200, { posts: merged });
    }

    if (method === "POST") {
      const { date, picture, featured, translations: incomingTranslations } = body;

      if (!date || !picture) {
        return json(400, { error: "date and picture are required" });
      }
      for (const lang of LANGS) {
        validateArticleText(incomingTranslations?.[lang], lang);
      }

      const { json: news, sha: newsSha } = await getJsonFile(NEWS_PATH);
      const { json: translations, sha: transSha } = await getJsonFile(TRANSLATIONS_PATH);

      const nextId = news.length > 0 ? Math.max(...news.map((a) => a.id)) + 1 : 1;

      news.push({ id: nextId, date, picture, featured: !!featured });

      for (const lang of LANGS) {
        translations[lang].articles[String(nextId)] = {
          title: incomingTranslations[lang].title,
          description: incomingTranslations[lang].description,
          author: incomingTranslations[lang].author,
          category: incomingTranslations[lang].category,
          content: incomingTranslations[lang].content,
        };
      }

      await putFile(
        NEWS_PATH,
        JSON.stringify(news, null, 2),
        `Add article #${nextId} via admin panel`,
        newsSha
      );
      await putFile(
        TRANSLATIONS_PATH,
        JSON.stringify(translations, null, 2),
        `Add translations for article #${nextId} via admin panel`,
        transSha
      );

      return json(201, { id: nextId });
    }

    if (method === "PUT") {
      if (!id) return json(400, { error: "id is required" });

      const { date, picture, featured, translations: incomingTranslations } = body;
      for (const lang of LANGS) {
        validateArticleText(incomingTranslations?.[lang], lang);
      }

      const { json: news, sha: newsSha } = await getJsonFile(NEWS_PATH);
      const { json: translations, sha: transSha } = await getJsonFile(TRANSLATIONS_PATH);

      const idx = news.findIndex((a) => a.id === id);
      if (idx === -1) return json(404, { error: "Post not found" });

      news[idx] = {
        ...news[idx],
        date: date || news[idx].date,
        picture: picture || news[idx].picture,
        featured: featured !== undefined ? !!featured : news[idx].featured,
      };

      for (const lang of LANGS) {
        translations[lang].articles[String(id)] = {
          title: incomingTranslations[lang].title,
          description: incomingTranslations[lang].description,
          author: incomingTranslations[lang].author,
          category: incomingTranslations[lang].category,
          content: incomingTranslations[lang].content,
        };
      }

      await putFile(
        NEWS_PATH,
        JSON.stringify(news, null, 2),
        `Update article #${id} via admin panel`,
        newsSha
      );
      await putFile(
        TRANSLATIONS_PATH,
        JSON.stringify(translations, null, 2),
        `Update translations for article #${id} via admin panel`,
        transSha
      );

      return json(200, { id });
    }

    if (method === "DELETE") {
      if (!id) return json(400, { error: "id is required" });

      const { json: news, sha: newsSha } = await getJsonFile(NEWS_PATH);
      const { json: translations, sha: transSha } = await getJsonFile(TRANSLATIONS_PATH);

      const idx = news.findIndex((a) => a.id === id);
      if (idx === -1) return json(404, { error: "Post not found" });

      news.splice(idx, 1);
      for (const lang of LANGS) {
        delete translations[lang].articles[String(id)];
      }

      await putFile(
        NEWS_PATH,
        JSON.stringify(news, null, 2),
        `Delete article #${id} via admin panel`,
        newsSha
      );
      await putFile(
        TRANSLATIONS_PATH,
        JSON.stringify(translations, null, 2),
        `Delete translations for article #${id} via admin panel`,
        transSha
      );

      return json(200, { id });
    }

    return json(405, { error: "Method not allowed" });
  } catch (err) {
    console.error(err);
    return json(500, { error: err.message || "Server error" });
  }
};
