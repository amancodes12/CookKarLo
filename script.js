// DelishFinder — Tasty API version with simulated filters
const RAPIDAPI_KEY = '004a9c52e1msh38e3ff429952eb9p10920fjsne6fa7dad19b5'; // Replace with your Tasty API key
const RAPIDAPI_HOST = 'tasty.p.rapidapi.com';

const qs = s => document.querySelector(s);
const qsa = s => Array.from(document.querySelectorAll(s));

function showToast(msg, ms = 3000) {
  const t = qs('#toast');
  t.textContent = msg;
  t.classList.remove('hidden');
  setTimeout(() => t.classList.add('visible'), 20);
  setTimeout(() => t.classList.add('hidden'), ms);
  setTimeout(() => t.classList.remove('visible'), ms + 250);
}

async function apiFetch(endpoint, params = {}) {
  const url = new URL(`https://${RAPIDAPI_HOST}${endpoint}`);
  Object.keys(params).forEach(k => url.searchParams.append(k, params[k]));

  const res = await fetch(url, {
    method: 'GET',
    headers: {
      'x-rapidapi-key': RAPIDAPI_KEY,
      'x-rapidapi-host': RAPIDAPI_HOST,
      Accept: 'application/json'
    }
  });

  if (!res.ok) {
    const text = await res.text();
    throw new Error(`API error ${res.status}: ${text}`);
  }
  return res.json();
}

// add this helper to inject heart color styles
function injectHeartStyles() {
  if (document.getElementById('heart-style')) return;
  const style = document.createElement('style');
  style.id = 'heart-style';
  style.textContent = `
    .heart { color: #999; transition: color .18s ease; }
    .heart.active { color: #e11; } /* red when favorited */
  `;
  document.head.appendChild(style);
}

/* -------------------------
   State and DOM
   ------------------------- */
const state = {
  query: '',
  cuisine: '',
  maxTime: '',
  includeIngredients: [],
  results: [],
  favorites: JSON.parse(localStorage.getItem('rf_favorites') || '{}')
};

const el = {
  search: qs('#search'),
  btnSearch: qs('#btn-search'),
  cuisine: qs('#cuisine'),
  maxTime: qs('#max-time'),
  ingredientInput: qs('#ingredient-input'),
  addIngredientBtn: qs('#add-ingredient'),
  ingredientTags: qs('#ingredient-tags'),
  results: qs('#results'),
  resultsMeta: qs('#results-meta'),
  emptyState: qs('#empty-state'),
  modal: qs('#modal'),
  modalBody: qs('#modal-body'),
  modalClose: qs('#modal-close'),
  toggleFavs: qs('#toggle-favs'),
  favCount: qs('#fav-count')
};

/* -------------------------
   Ingredient tags
   ------------------------- */
function renderIngredientTags() {
  el.ingredientTags.innerHTML = state.includeIngredients.map((ing, i) => `
    <span class="tag">${ing} <button data-index="${i}">✕</button></span>
  `).join('');
  el.ingredientTags.querySelectorAll('button').forEach(btn =>
    btn.addEventListener('click', () => {
      const idx = Number(btn.dataset.index);
      state.includeIngredients.splice(idx, 1);
      renderIngredientTags();
    })
  );
}

/* -------------------------
   Search and Filter Logic
   ------------------------- */
async function searchRecipes() {
  const q = el.search.value.trim() || 'pasta';
  el.results.innerHTML = `<p class="muted">Loading recipes…</p>`;
  el.resultsMeta.textContent = 'Loading...';

  try {
    const data = await apiFetch('/recipes/list', { q, from: 0, size: 30 });
    let results = data.results || [];

    // --- Apply simulated filters ---
    if (state.cuisine) {
      results = results.filter(r =>
        (r.tags || []).some(t => t.display_name?.toLowerCase() === state.cuisine.toLowerCase())
      );
    }

    if (state.maxTime) {
      results = results.filter(r => r.total_time_minutes && r.total_time_minutes <= Number(state.maxTime));
    }

    if (state.includeIngredients.length) {
      results = results.filter(r => {
        const text = JSON.stringify(r).toLowerCase();
        return state.includeIngredients.every(ing => text.includes(ing.toLowerCase()));
      });
    }

    state.results = results;

    if (!results.length) {
      el.results.innerHTML = '';
      el.emptyState.classList.remove('hidden');
      el.resultsMeta.textContent = 'No recipes found';
      return;
    }

    el.emptyState.classList.add('hidden');
    el.resultsMeta.textContent = `Showing ${results.length} results for “${q}”`;
    el.results.innerHTML = results.map(r => renderCard(r)).join('');
    attachCardListeners();
  } catch (err) {
    el.resultsMeta.textContent = 'Error fetching recipes';
    showToast(err.message);
    console.error(err);
  }
}

/* -------------------------
   Render cards
   ------------------------- */
function renderCard(r) {
  const id = r.id;
  const title = r.name || 'Recipe';
  const img = r.thumbnail_url || 'https://via.placeholder.com/800x450?text=No+Image';
  const time = r.total_time_minutes ? `${r.total_time_minutes}m` : '—';
  const servings = r.num_servings ? `${r.num_servings} servings` : '';
  const isFav = Boolean(state.favorites[id]);

  return `
    <article class="card" data-id="${id}">
      <div class="media"><img src="${img}" alt="${title}" /></div>
      <div class="content">
        <h3>${title}</h3>
        <div class="meta-row"><div class="muted">${time} ${servings}</div></div>
      </div>
      <div class="controls-row">
        <button class="icon-btn btn-view" data-id="${id}">View</button>
        <button class="icon-btn btn-fav" data-id="${id}">
          <span class="heart ${isFav ? 'active' : ''}" data-id="${id}">❤</span>
        </button>
      </div>
    </article>
  `;
}

function attachCardListeners() {
  qsa('.btn-view').forEach(btn => btn.addEventListener('click', () => openRecipeModal(btn.dataset.id)));
  qsa('.btn-fav').forEach(btn => btn.addEventListener('click', () => toggleFavorite(btn.dataset.id)));
}

/* -------------------------
   Modal (details)
   ------------------------- */
async function openRecipeModal(id) {
  el.modal.classList.remove('hidden');
  el.modalBody.innerHTML = '<p class="muted">Loading recipe details...</p>';

  try {
    const info = await apiFetch('/recipes/get-more-info', { id });
    const title = info.name || 'Recipe';
    const img = info.thumbnail_url || '';
    const ingredients = info.sections
      ? info.sections.flatMap(sec => sec.components.map(c => c.raw_text))
      : [];
    const steps = info.instructions
      ? info.instructions.map((s, i) => `<div class="step"><strong>Step ${i + 1}:</strong> ${s.display_text}</div>`)
      : [];

    el.modalBody.innerHTML = `
      <div class="modal-media"><img src="${img}" alt="${title}"></div>
      <div class="modal-meta">
        <h2>${title}</h2>
        <h4>Ingredients</h4>
        <ul>${ingredients.map(i => `<li>${i}</li>`).join('')}</ul>
        <h4>Instructions</h4>
        ${steps.join('') || '<p>No instructions found.</p>'}
        <button id="modal-fav" class="btn">❤ Favorite</button>
      </div>
    `;
    qs('#modal-fav').addEventListener('click', () => toggleFavorite(id));
  } catch (err) {
    el.modalBody.innerHTML = `<p>Error: ${err.message}</p>`;
  }
}

/* -------------------------
   Favorites
   ------------------------- */
function toggleFavorite(id) {
  const existing = state.favorites[id];
  if (existing) {
    delete state.favorites[id];
    showToast('Removed from favorites');
  } else {
    const r = state.results.find(x => String(x.id) === String(id));
    if (r) state.favorites[id] = { id: r.id, title: r.name, image: r.thumbnail_url };
    showToast('Added to favorites');
  }
  localStorage.setItem('rf_favorites', JSON.stringify(state.favorites));
  el.favCount.textContent = Object.keys(state.favorites).length;
  qsa(`.heart[data-id="${id}"]`).forEach(h => h.classList.toggle('active', Boolean(state.favorites[id])));
}

/* -------------------------
   Events
   ------------------------- */
el.btnSearch.addEventListener('click', searchRecipes);
el.search.addEventListener('keydown', e => { if (e.key === 'Enter') searchRecipes(); });

el.cuisine.addEventListener('change', e => state.cuisine = e.target.value);
el.maxTime.addEventListener('change', e => state.maxTime = e.target.value);
el.addIngredientBtn.addEventListener('click', () => {
  const v = el.ingredientInput.value.trim();
  if (!v) return;
  const arr = v.split(',').map(x => x.trim()).filter(Boolean);
  for (const a of arr) if (!state.includeIngredients.includes(a)) state.includeIngredients.push(a);
  el.ingredientInput.value = '';
  renderIngredientTags();
});
el.ingredientInput.addEventListener('keydown', e => {
  if (e.key === 'Enter') {
    e.preventDefault();
    el.addIngredientBtn.click();
  }
});
el.modalClose.addEventListener('click', () => el.modal.classList.add('hidden'));
el.modal.addEventListener('click', e => { if (e.target === el.modal) el.modal.classList.add('hidden'); });

/* -------------------------
   Init
   ------------------------- */
(function init() {
  injectHeartStyles(); // ensure heart CSS is present
  el.favCount.textContent = Object.keys(state.favorites).length;
  renderIngredientTags();
  setTimeout(() => {
    el.search.value = 'pasta';
    searchRecipes();
  }, 700);
})();

(function openPendingRecipe() {
  const pendingId = localStorage.getItem('viewRecipeId');
  if (pendingId) {
    localStorage.removeItem('viewRecipeId');
    openRecipeModal(pendingId);
  }
})();
