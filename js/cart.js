/* ==========================================================
   js/cart.js
   Cart state — add, remove, quantity, total.
   Persisted to sessionStorage so a page refresh keeps the cart.
   ========================================================== */

const CART_KEY = 'mn_cart';

/* Cart shape: [{ id, name, price, image_url, qty }] */

function getCart() {
  try {
    const raw = sessionStorage.getItem(CART_KEY);
    const parsed = raw ? JSON.parse(raw) : [];
    return Array.isArray(parsed) ? parsed : [];
  } catch (err) {
    console.error('Cart could not be read from sessionStorage:', err);
    return [];
  }
}

function saveCart(cart) {
  sessionStorage.setItem(CART_KEY, JSON.stringify(cart));
  renderCart();
}

function clearCart() {
  sessionStorage.removeItem(CART_KEY);
  renderCart();
}

function cartCount() {
  return getCart().reduce((sum, line) => sum + line.qty, 0);
}

function cartTotal() {
  return getCart().reduce((sum, line) => sum + line.price * line.qty, 0);
}

/* ---- Mutations ------------------------------------------------------ */

function addToCart(item) {
  const cart = getCart();
  const existing = cart.find((line) => line.id === item.id);

  if (existing) {
    existing.qty += 1;
  } else {
    cart.push({
      id: item.id,
      name: item.name,
      price: Number(item.price),
      image_url: item.image_url || '',
      qty: 1,
    });
  }

  saveCart(cart);
  showToast(`${item.name} added to cart`, 'success', 2000);
}

function changeQty(itemId, delta) {
  const cart = getCart();
  const line = cart.find((l) => l.id === itemId);
  if (!line) return;

  line.qty += delta;
  if (line.qty <= 0) {
    saveCart(cart.filter((l) => l.id !== itemId));
    return;
  }
  saveCart(cart);
}

function removeFromCart(itemId) {
  saveCart(getCart().filter((line) => line.id !== itemId));
}

/* ---- Rendering ------------------------------------------------------ */

function renderCart() {
  const list = document.getElementById('cartItems');
  const totalEl = document.getElementById('cartTotal');
  const badge = document.getElementById('cartBadge');
  const checkoutBtn = document.getElementById('checkoutBtn');
  if (!list) return;

  const cart = getCart();
  const count = cartCount();

  if (badge) {
    badge.textContent = count;
    badge.classList.toggle('d-none', count === 0);
  }

  if (cart.length === 0) {
    list.innerHTML = emptyState('🍽', 'Your cart is empty', 'Add something from the menu.');
    if (totalEl) totalEl.textContent = money(0);
    if (checkoutBtn) checkoutBtn.disabled = true;
    return;
  }

  list.innerHTML = cart.map((line) => `
    <div class="mn-cart-row">
      <img src="${escapeHtml(line.image_url || 'assets/placeholder.svg')}"
           alt="${escapeHtml(line.name)}" onerror="${IMG_FALLBACK}">
      <div class="flex-grow-1">
        <div class="text-truncate">${escapeHtml(line.name)}</div>
        <div class="mn-price small">${money(line.price)}</div>
      </div>
      <div class="text-end">
        <div class="mn-qty mb-1">
          <button type="button" data-cart-action="dec" data-id="${line.id}" aria-label="Decrease quantity">−</button>
          <span>${line.qty}</span>
          <button type="button" data-cart-action="inc" data-id="${line.id}" aria-label="Increase quantity">+</button>
        </div>
        <button type="button" class="btn btn-link btn-sm p-0 text-danger text-decoration-none"
                data-cart-action="remove" data-id="${line.id}">Remove</button>
      </div>
    </div>
  `).join('');

  if (totalEl) totalEl.textContent = money(cartTotal());
  if (checkoutBtn) checkoutBtn.disabled = false;
}

/* ---- Delegated click handling --------------------------------------- */

document.addEventListener('click', (e) => {
  const btn = e.target.closest('[data-cart-action]');
  if (!btn) return;

  const id = Number(btn.dataset.id);
  const action = btn.dataset.cartAction;

  if (action === 'inc') changeQty(id, 1);
  else if (action === 'dec') changeQty(id, -1);
  else if (action === 'remove') removeFromCart(id);
});
