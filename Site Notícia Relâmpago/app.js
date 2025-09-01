// Seletores
const FEED = document.getElementById('feed');
const TOPICS = document.querySelector('.nr-topics');
const SEARCH_FORM = document.querySelector('.nr-search');
const SEARCH_INPUT = SEARCH_FORM?.querySelector('input');

let POSTS = [];
let CURRENT_FILTER = null; // categoria atual
let CURRENT_QUERY = "";

// Carrega posts
fetch('posts.json')
  .then(r => r.json())
  .then(data => {
    POSTS = (data.posts || []).sort((a,b)=> new Date(b.date) - new Date(a.date));
    render(POSTS);
  })
  .catch(err => {
    FEED.innerHTML = `<p style="color:#900">Erro ao carregar posts.json: ${err}</p>`;
  });

// Renderiza cards
function render(list){
  if(!list.length){
    FEED.innerHTML = `<p style="padding:16px">Nenhuma matéria encontrada.</p>`;
    return;
  }
  FEED.innerHTML = list.map(p => `
    <article class="nr-card">
      <a href="#" class="nr-card__media" aria-label="${escapeHtml(p.title)}">
        <img src="${p.cover}" alt="${escapeHtml(p.title)}"/>
      </a>
      <div class="nr-card__body">
        <span class="nr-card__cat">${p.category}</span>
        <h3 class="nr-card__title">${escapeHtml(p.title)}</h3>
        <p class="nr-card__excerpt">${escapeHtml(p.excerpt)}</p>
        <div class="nr-card__meta">
          <span>${formatDate(p.date)}</span> • <span>${escapeHtml(p.author || 'Redação')}</span>
        </div>
      </div>
    </article>
  `).join('');
}

// Filtro por tópico
TOPICS?.addEventListener('click', (e) => {
  const link = e.target.closest('a');
  if(!link) return;
  e.preventDefault();
  const cat = link.textContent.trim().toUpperCase();
  CURRENT_FILTER = cat;
  marcarTopicoAtivo(cat);
  filtrar();
});

// Busca
SEARCH_FORM?.addEventListener('submit', (e) => {
  e.preventDefault();
  CURRENT_QUERY = (SEARCH_INPUT.value || '').trim().toLowerCase();
  filtrar();
});
SEARCH_INPUT?.addEventListener('input', () => {
  CURRENT_QUERY = (SEARCH_INPUT.value || '').trim().toLowerCase();
  filtrar();
});

function filtrar(){
  let list = POSTS.slice();

  if (CURRENT_FILTER) {
    list = list.filter(p => p.category === CURRENT_FILTER);
  }
  if (CURRENT_QUERY) {
    list = list.filter(p =>
      (p.title || '').toLowerCase().includes(CURRENT_QUERY) ||
      (p.excerpt || '').toLowerCase().includes(CURRENT_QUERY) ||
      (p.author || '').toLowerCase().includes(CURRENT_QUERY)
    );
  }
  render(list);
}

function marcarTopicoAtivo(cat){
  document.querySelectorAll('.nr-topics a').forEach(a => a.classList.remove('is-active-topic'));
  const target = Array.from(document.querySelectorAll('.nr-topics a'))
    .find(a => a.textContent.trim().toUpperCase() === cat);
  if (target) target.classList.add('is-active-topic');
}

// Utils
function formatDate(iso){
  try{
    const d = new Date(iso);
    return d.toLocaleDateString('pt-BR', { day:'2-digit', month:'short' }).replace('.', '');
  }catch{ return ''; }
}
function escapeHtml(str=''){
  return str.replace(/[&<>"']/g, m => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[m]));
}
