// Notícia Relâmpago — app.js (versão consolidada)
// - Lista posts do posts/index.json no #feed
// - Abre um post em post.html?slug=... lendo posts/<slug>.json
// - Normaliza caminhos de imagem (Windows "\" -> "/" e "public/img/" -> "public/")
// - Fallback automático para public/placeholder.jpg

// ===== Helpers =====
const fmtData = (iso) => {
  if (!iso) return "";
  const d = new Date(iso);
  return d.toLocaleDateString("pt-BR", { day: "2-digit", month: "short", year: "numeric" }).replace(".", "");
};
const byDateDesc = (a, b) => new Date(b.date) - new Date(a.date);

// Normaliza caminho para web
const fixPath = (s) => {
  let x = (s || "public/placeholder.jpg").replace(/\\/g, "/");
  x = x.replace(/^public\/img\//, "public/"); // se veio "public/img/..." troca para "public/..."
  return x;
};

// ===== Feed (home) =====
function cardHTML(p) {
  const date = p.date ? fmtData(p.date) : "";
  const cat  = p.category || "";
  const exc  = p.excerpt || "";
  const imgPath = fixPath(p.image);

  return `
    <article class="nr-card">
      <a class="nr-card__link" href="post.html?slug=${encodeURIComponent(p.slug)}" aria-label="${p.title}">
        <figure class="nr-card__media">
          <img src="${imgPath}" alt="${p.title}" loading="lazy"
               onerror="this.onerror=null;this.src='public/placeholder.jpg'">
          ${cat ? `<span class="nr-badge">${cat}</span>` : ""}
        </figure>
        <div class="nr-card__body">
          <h2 class="nr-card__title">${p.title}</h2>
          ${exc ? `<p class="nr-card__excerpt">${exc}</p>` : ""}
          <div class="nr-card__meta">
            ${cat ? `<span class="nr-card__cat">${cat}</span>` : ""}
            ${date ? ` · <time datetime="${p.date}">${date}</time>` : ""}
          </div>
        </div>
      </a>
    </article>
  `;
}

function renderFeed(posts) {
  const feed = document.getElementById("feed");
  if (!feed) return;
  feed.innerHTML = posts.length
    ? posts.map(cardHTML).join("")
    : `<p>Sem matérias por enquanto.</p>`;
}

async function loadAndRender() {
  const feed = document.getElementById("feed");
  if (!feed) return; // estamos no post.html

  try {
    const res = await fetch("posts/index.json", { cache: "no-store" });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const data = await res.json();
    const posts = (data.posts || []).sort(byDateDesc);
    renderFeed(posts);

    // Busca
    const searchInput = document.querySelector(".nr-search input[type='search']");
    if (searchInput) {
      searchInput.addEventListener("input", () => {
        const term = searchInput.value.trim().toLowerCase();
        const filtered = posts.filter(p =>
          [p.title, p.excerpt, p.category].join(" ").toLowerCase().includes(term)
        );
        renderFeed(filtered);
      });
    }
  } catch (err) {
    feed.innerHTML = `<p class="nr-erro">Não consegui carregar <code>posts/index.json</code>.<br><small>${err.message}</small></p>`;
  }
}

// ===== Página da matéria =====
const qs = (k) => new URLSearchParams(location.search).get(k);

function renderSinglePost(p) {
  const el = document.getElementById("post");
  if (!el) return;

  const date = p.date
    ? new Date(p.date).toLocaleDateString("pt-BR", { day: "2-digit", month: "long", year: "numeric" })
    : "";

  el.innerHTML = `
    <header class="nr-article-header" style="margin:8px 0 16px">
      ${p.category ? `<span class="nr-badge">${p.category}</span>` : ""}
      <h1 class="nr-article-title" style="margin:8px 0 6px">${p.title || "Sem título"}</h1>
      ${p.date ? `<time datetime="${p.date}" class="nr-article-date" style="opacity:.8">${date}</time>` : ""}
    </header>

    ${p.image ? `
      <figure class="nr-article-cover" style="margin:12px 0">
        <img src="${fixPath(p.image)}" alt="${p.title || ""}" style="width:100%;border-radius:12px"
             loading="lazy"
             onerror="this.onerror=null;this.src='public/placeholder.jpg'">
        ${p.caption ? `<figcaption style="opacity:.8;margin-top:6px">${p.caption}</figcaption>` : ""}
      </figure>
    ` : ""}

    <div class="nr-article-content">
      ${p.content || "<p>(sem conteúdo)</p>"}
    </div>
  `;
}

async function loadSinglePost() {
  const postWrap = document.getElementById("post");
  if (!postWrap) return; // estamos na home

  const slug = qs("slug");
  if (!slug) {
    postWrap.innerHTML = `<p>Matéria não encontrada (slug ausente).</p>`;
    return;
  }

  try {
    const res = await fetch(`posts/${slug}.json`, { cache: "no-store" });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const data = await res.json();
    document.title = `${data.title || "Matéria"} • Notícia Relâmpago`;
    renderSinglePost(data);
  } catch (e) {
    postWrap.innerHTML = `<p>Matéria não encontrada.</p><small>${e.message}</small>`;
  }
}

// ===== Boot =====
document.addEventListener("DOMContentLoaded", () => {
  loadAndRender();   // se estiver na home, carrega feed
  loadSinglePost();  // se estiver no post.html, carrega a matéria
});
