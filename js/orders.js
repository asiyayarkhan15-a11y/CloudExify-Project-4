/* ==========================================================
   js/orders.js
   Place an order to Supabase and show the customer's order history.
   Also subscribes to Supabase Realtime so a status change made by
   the admin appears on the customer's screen without a refresh.
   ========================================================== */

/* ---- Place order ----------------------------------------------------- */

async function placeOrder() {
  const cart = getCart();
  const total = cartTotal();
  const btn = document.getElementById('checkoutBtn');

  if (cart.length === 0) {
    showError('Your cart is empty.');
    return;
  }

  const { data: { user } } = await supabaseClient.auth.getUser();
  if (!user) {
    showError('Please log in to place an order.');
    setTimeout(() => window.location.replace('login.html'), 1200);
    return;
  }

  setButtonLoading(btn, true, 'Placing order…');

  const { data, error } = await supabaseClient
    .from('orders')
    .insert([{
      user_id: user.id,
      items: cart,
      total: Number(total.toFixed(2)),
      status: 'Pending',
    }])
    .select();

  setButtonLoading(btn, false);

  if (error) {
    console.error('Order insert failed:', error);
    showError('Could not place order. Please try again.');
    return;
  }

  clearCart();
  showSuccess(`Order placed. Your order number is #${data[0].id}.`);

  // Close the cart drawer and refresh the history list.
  const offcanvasEl = document.getElementById('cartOffcanvas');
  if (offcanvasEl) bootstrap.Offcanvas.getInstance(offcanvasEl)?.hide();

  loadMyOrders();

  // Bring the confirmation into view.
  document.getElementById('orders')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
}

/* ---- Order history --------------------------------------------------- */

async function loadMyOrders() {
  const list = document.getElementById('ordersList');
  if (!list) return;

  list.innerHTML = `<div class="text-center py-5"><div class="mn-spinner mx-auto"></div></div>`;

  const { data: { user } } = await supabaseClient.auth.getUser();
  if (!user) return;

  const { data, error } = await supabaseClient
    .from('orders')
    .select('*')
    .eq('user_id', user.id)
    .order('created_at', { ascending: false });

  if (error) {
    console.error('Order history failed:', error.message);
    list.innerHTML = emptyState('⚠', 'Could not load your orders', error.message);
    return;
  }

  if (!data || data.length === 0) {
    list.innerHTML = emptyState('🧾', 'No orders yet', 'Your past orders will appear here.');
    return;
  }

  list.innerHTML = data.map(renderOrderCard).join('');
}

function renderOrderCard(order) {
  const items = Array.isArray(order.items) ? order.items : [];
  const lines = items.map((line) => `
    <div class="d-flex justify-content-between small py-1">
      <span class="text-muted-gold">${escapeHtml(line.name)} × ${line.qty}</span>
      <span>${money(line.price * line.qty)}</span>
    </div>
  `).join('');

  return `
    <div class="mn-panel p-3 p-md-4 mb-3" data-order-id="${order.id}">
      <div class="d-flex flex-wrap justify-content-between align-items-start gap-2 mb-2">
        <div>
          <div class="mn-serif fs-5">Order #${order.id}</div>
          <div class="small text-muted-gold">${formatDate(order.created_at)}</div>
        </div>
        ${statusBadge(order.status)}
      </div>
      <div class="border-top pt-2" style="border-color: var(--mn-border) !important;">
        ${lines || '<div class="small text-muted-gold">No item details saved.</div>'}
      </div>
      <div class="d-flex justify-content-between align-items-center border-top mt-2 pt-2"
           style="border-color: var(--mn-border) !important;">
        <span class="small text-muted-gold">Total</span>
        <span class="mn-price fs-6">${money(order.total)}</span>
      </div>
    </div>
  `;
}

/* ---- Realtime status updates (bonus) ---------------------------------
   When the admin changes a status, Supabase pushes the updated row here.
   Row Level Security still applies, so a customer only receives their own.
--------------------------------------------------------------------- */

function subscribeToMyOrders(userId) {
  supabaseClient
    .channel('customer-orders')
    .on(
      'postgres_changes',
      { event: 'UPDATE', schema: 'public', table: 'orders', filter: `user_id=eq.${userId}` },
      (payload) => {
        showToast(`Order #${payload.new.id} is now ${payload.new.status}`, 'success', 4000);
        loadMyOrders();
      }
    )
    .subscribe();
}

/* ---- Panel bootstrap -------------------------------------------------
   Called by auth.js once the session and profile are confirmed.
--------------------------------------------------------------------- */

function initUserPanel() {
  wireMenuControls();
  loadMenu();
  renderCart();
  loadMyOrders();

  document.getElementById('checkoutBtn')?.addEventListener('click', placeOrder);
  document.getElementById('refreshOrdersBtn')?.addEventListener('click', loadMyOrders);

  if (currentUser) subscribeToMyOrders(currentUser.id);
}
