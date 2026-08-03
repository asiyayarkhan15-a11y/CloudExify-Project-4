/* ==========================================================
   js/menu.js
   Fetch the menu from Supabase and render it as cards, with
   category filtering, live search and price sorting.
   ========================================================== */

let allMenuItems = [];      // everything fetched from Supabase
let activeCategory = 'all';
let searchTerm = '';
let sortMode = 'default';   // 'default' | 'price-asc' | 'price-desc'

/**
 * Load available menu items once, then filter/sort locally so that
 * typing in the search box does not hit the network on every keystroke.
 */
async function loadMenu() {
  const grid = document.getElementById('menuGrid');
  renderCardSkeletons(grid, 8);

  const { data, error } = await supabaseClient
    .from('menu_items')
    .select('*')
    .eq('available', true)
    .order('name');

  if (error) {
    console.error('Menu load failed:', error.message);
    grid.innerHTML = `<div class="col-12">${emptyState('⚠', 'Could not load the menu', error.message)}</div>`;
    showError('Could not load the menu. Please refresh.');
    return;
  }

  allMenuItems = data || [];
  renderCategoryPills();
  renderMenu();
}

/* ---- Filtering + rendering ------------------------------------------ */

function visibleMenuItems() {
  let items = allMenuItems.slice();

  if (activeCategory !== 'all') {
    items = items.filter((item) => (item.category || 'Other') === activeCategory);
  }

  if (searchTerm) {
    const q = searchTerm.toLowerCase();
    items = items.filter((item) =>
      item.name.toLowerCase().includes(q) ||
      (item.description || '').toLowerCase().includes(q)
    );
  }

  if (sortMode === 'price-asc') items.sort((a, b) => a.price - b.price);
  else if (sortMode === 'price-desc') items.sort((a, b) => b.price - a.price);

  return items;
}

function renderCategoryPills() {
  const wrap = document.getElementById('categoryFilters');
  if (!wrap) return;

  const categories = [...new Set(allMenuItems.map((i) => i.category || 'Other'))].sort();
  const all = ['all', ...categories];

  wrap.innerHTML = all.map((cat) => `
    <button type="button" class="mn-pill ${cat === activeCategory ? 'active' : ''}" data-category="${escapeHtml(cat)}">
      ${cat === 'all' ? 'All Dishes' : escapeHtml(cat)}
    </button>
  `).join('');
}

function renderMenu() {
  const grid = document.getElementById('menuGrid');
  const countEl = document.getElementById('menuCount');
  if (!grid) return;

  const items = visibleMenuItems();

  if (countEl) {
    countEl.textContent = items.length === 1 ? '1 dish' : `${items.length} dishes`;
  }

  if (items.length === 0) {
    grid.innerHTML = `<div class="col-12">${emptyState('🔍', 'No dishes match your search', 'Try a different word or category.')}</div>`;
    return;
  }

  grid.innerHTML = items.map((item) => `
    <div class="col-6 col-md-4 col-lg-3 mb-4">
      <article class="mn-card">
        <img class="mn-card-img" loading="lazy"
             src="${escapeHtml(item.image_url || 'assets/placeholder.svg')}"
             alt="${escapeHtml(item.name)}" onerror="${IMG_FALLBACK}">
        <div class="mn-card-body">
          <div class="mn-eyebrow mb-1">${escapeHtml(item.category || 'Other')}</div>
          <h3 class="mn-card-title">${escapeHtml(item.name)}</h3>
          <p class="mn-card-desc">${escapeHtml(item.description || '')}</p>
          <div class="d-flex align-items-center justify-content-between gap-2">
            <span class="mn-price">${money(item.price)}</span>
            <button type="button" class="btn btn-gold btn-sm add-to-cart" data-id="${item.id}">Add</button>
          </div>
        </div>
      </article>
    </div>
  `).join('');
}

/* ---- Controls -------------------------------------------------------- */

function wireMenuControls() {
  // Category pills (delegated — pills are re-rendered after fetch)
  document.getElementById('categoryFilters')?.addEventListener('click', (e) => {
    const pill = e.target.closest('[data-category]');
    if (!pill) return;
    activeCategory = pill.dataset.category;
    renderCategoryPills();
    renderMenu();
  });

  // Live search
  document.getElementById('menuSearch')?.addEventListener('input', (e) => {
    searchTerm = e.target.value.trim();
    renderMenu();
  });

  // Price sort
  document.getElementById('menuSort')?.addEventListener('change', (e) => {
    sortMode = e.target.value;
    renderMenu();
  });

  // Add to cart (delegated)
  document.getElementById('menuGrid')?.addEventListener('click', (e) => {
    const btn = e.target.closest('.add-to-cart');
    if (!btn) return;
    const item = allMenuItems.find((i) => i.id === Number(btn.dataset.id));
    if (item) addToCart(item);
  });
}
