/* ==========================================================
   js/admin.js
   Admin dashboard — live stats, order management, menu CRUD.
   The role check itself lives in auth.js (requireAdmin) and runs
   before initAdminPanel() is ever called.
   ========================================================== */

let adminOrders = [];      // last fetched orders, used by the CSV export
let adminMenuItems = [];
let statsTimer = null;

/* ---- 1. Dashboard stats --------------------------------------------- */

async function loadStats() {
  const since = startOfTodayISO();

  const [todayOrders, pending, menuCount] = await Promise.all([
    supabaseClient.from('orders').select('total').gte('created_at', since),
    supabaseClient.from('orders').select('id', { count: 'exact', head: true }).eq('status', 'Pending'),
    supabaseClient.from('menu_items').select('id', { count: 'exact', head: true }),
  ]);

  if (todayOrders.error) {
    console.error('Stats (today) failed:', todayOrders.error.message);
  } else {
    const rows = todayOrders.data || [];
    const revenue = rows.reduce((sum, r) => sum + Number(r.total), 0);
    setStat('statOrdersToday', rows.length);
    setStat('statRevenueToday', money(revenue));
  }

  if (!pending.error) setStat('statPending', pending.count ?? 0);
  if (!menuCount.error) setStat('statMenuItems', menuCount.count ?? 0);

  const stamp = document.getElementById('statsUpdatedAt');
  if (stamp) stamp.textContent = 'Updated ' + new Date().toLocaleTimeString('en-GB');
}

function setStat(id, value) {
  const el = document.getElementById(id);
  if (el) el.textContent = value;
}

/* ---- 2. Orders dashboard --------------------------------------------- */

async function loadAllOrders() {
  const tbody = document.getElementById('ordersTableBody');
  if (!tbody) return;
  tbody.innerHTML = spinnerRow(7);

  const { data: orders, error } = await supabaseClient
    .from('orders')
    .select('*')
    .order('created_at', { ascending: false });

  if (error) {
    console.error('Admin orders failed:', error.message);
    tbody.innerHTML = `<tr><td colspan="7" class="text-center py-4 text-danger">${escapeHtml(error.message)}</td></tr>`;
    return;
  }

  adminOrders = orders || [];

  if (adminOrders.length === 0) {
    tbody.innerHTML = `<tr><td colspan="7" class="text-center py-5 text-muted-gold">No orders yet.</td></tr>`;
    return;
  }

  // Resolve customer names in one extra query, then map them onto the orders.
  const userIds = [...new Set(adminOrders.map((o) => o.user_id).filter(Boolean))];
  const names = {};
  if (userIds.length) {
    const { data: profiles } = await supabaseClient
      .from('profiles')
      .select('id, full_name')
      .in('id', userIds);
    (profiles || []).forEach((p) => { names[p.id] = p.full_name; });
  }

  tbody.innerHTML = adminOrders.map((order) => {
    const items = Array.isArray(order.items) ? order.items : [];
    const summary = items.map((i) => `${escapeHtml(i.name)} × ${i.qty}`).join(', ') || '—';
    const options = ORDER_STATUSES.map((s) =>
      `<option value="${s}" ${s === order.status ? 'selected' : ''}>${s}</option>`
    ).join('');

    return `
      <tr>
        <td class="mn-price">#${order.id}</td>
        <td>${escapeHtml(names[order.user_id] || 'Unknown')}</td>
        <td class="small" style="max-width: 280px;">${summary}</td>
        <td class="mn-price">${money(order.total)}</td>
        <td class="small text-muted-gold text-nowrap">${formatDate(order.created_at)}</td>
        <td>${statusBadge(order.status)}</td>
        <td>
          <select class="form-select form-select-sm status-select" data-order-id="${order.id}"
                  style="min-width: 130px;">${options}</select>
        </td>
      </tr>
    `;
  }).join('');
}

async function updateOrderStatus(orderId, newStatus) {
  const { error } = await supabaseClient
    .from('orders')
    .update({ status: newStatus })
    .eq('id', orderId);

  if (error) {
    console.error('Status update failed:', error.message);
    showError('Could not update the order status.');
    loadAllOrders();
    return;
  }

  showSuccess(`Order #${orderId} set to ${newStatus}.`);
  loadAllOrders();
  loadStats();
}

/* ---- 3. Menu management ---------------------------------------------- */

async function loadMenuAdmin() {
  const tbody = document.getElementById('menuTableBody');
  if (!tbody) return;
  tbody.innerHTML = spinnerRow(7);

  const { data, error } = await supabaseClient
    .from('menu_items')
    .select('*')
    .order('category')
    .order('name');

  if (error) {
    console.error('Admin menu failed:', error.message);
    tbody.innerHTML = `<tr><td colspan="7" class="text-center py-4 text-danger">${escapeHtml(error.message)}</td></tr>`;
    return;
  }

  adminMenuItems = data || [];

  if (adminMenuItems.length === 0) {
    tbody.innerHTML = `<tr><td colspan="7" class="text-center py-5 text-muted-gold">No menu items yet. Add your first dish.</td></tr>`;
    return;
  }

  tbody.innerHTML = adminMenuItems.map((item) => `
    <tr>
      <td>
        <img src="${escapeHtml(item.image_url || 'assets/placeholder.svg')}" alt=""
             onerror="${IMG_FALLBACK}"
             style="width:52px;height:52px;object-fit:cover;border-radius:8px;">
      </td>
      <td>${escapeHtml(item.name)}</td>
      <td class="small text-muted-gold" style="max-width: 260px;">${escapeHtml(item.description || '—')}</td>
      <td>${escapeHtml(item.category || '—')}</td>
      <td class="mn-price">${money(item.price)}</td>
      <td>
        <div class="form-check form-switch m-0">
          <input class="form-check-input availability-toggle" type="checkbox"
                 data-item-id="${item.id}" ${item.available ? 'checked' : ''}
                 aria-label="Toggle availability">
        </div>
      </td>
      <td class="text-nowrap">
        <button class="btn btn-ghost btn-sm me-1" data-menu-action="edit" data-id="${item.id}">Edit</button>
        <button class="btn btn-ghost btn-sm text-danger" data-menu-action="delete" data-id="${item.id}">Delete</button>
      </td>
    </tr>
  `).join('');
}

/** Open the add/edit modal. Pass an id to edit, or nothing to create. */
function openMenuModal(itemId = null) {
  const form = document.getElementById('menuItemForm');
  const title = document.getElementById('menuModalTitle');
  form.reset();
  form.itemId.value = '';

  if (itemId) {
    const item = adminMenuItems.find((i) => i.id === itemId);
    if (!item) return;
    title.textContent = 'Edit Dish';
    form.itemId.value = item.id;
    // NB: the field is called itemName, not name — form.name would return
    // the <form> element's own name attribute instead of the input.
    form.itemName.value = item.name;
    form.description.value = item.description || '';
    form.price.value = item.price;
    form.category.value = item.category || '';
    form.image_url.value = item.image_url || '';
    form.available.checked = !!item.available;
  } else {
    title.textContent = 'Add Dish';
    form.available.checked = true;
  }

  bootstrap.Modal.getOrCreateInstance(document.getElementById('menuItemModal')).show();
}

async function saveMenuItem(event) {
  event.preventDefault();
  const form = event.target;
  const btn = form.querySelector('button[type="submit"]');

  const payload = {
    name: form.itemName.value.trim(),
    description: form.description.value.trim() || null,
    price: Number(form.price.value),
    category: form.category.value.trim() || null,
    image_url: form.image_url.value.trim() || null,
    available: form.available.checked,
  };

  if (!payload.name) return showError('Dish name is required.');
  if (!Number.isFinite(payload.price) || payload.price < 0) return showError('Enter a valid price.');

  const editingId = form.itemId.value;
  setButtonLoading(btn, true, 'Saving…');

  const { error } = editingId
    ? await supabaseClient.from('menu_items').update(payload).eq('id', Number(editingId))
    : await supabaseClient.from('menu_items').insert([payload]);

  setButtonLoading(btn, false);

  if (error) {
    console.error('Menu save failed:', error.message);
    showError('Could not save the dish: ' + error.message);
    return;
  }

  bootstrap.Modal.getInstance(document.getElementById('menuItemModal'))?.hide();
  showSuccess(editingId ? 'Dish updated.' : 'Dish added to the menu.');
  loadMenuAdmin();
  loadStats();
}

async function deleteMenuItem(itemId) {
  const item = adminMenuItems.find((i) => i.id === itemId);
  if (!confirm(`Delete "${item?.name ?? 'this dish'}" from the menu? This cannot be undone.`)) return;

  const { error } = await supabaseClient.from('menu_items').delete().eq('id', itemId);

  if (error) {
    console.error('Delete failed:', error.message);
    showError('Could not delete the dish: ' + error.message);
    return;
  }

  showSuccess('Dish deleted.');
  loadMenuAdmin();
  loadStats();
}

async function toggleAvailability(itemId, available) {
  const { error } = await supabaseClient
    .from('menu_items')
    .update({ available })
    .eq('id', itemId);

  if (error) {
    console.error('Availability toggle failed:', error.message);
    showError('Could not change availability.');
    loadMenuAdmin();
    return;
  }
  showSuccess(available ? 'Dish is now available.' : 'Dish hidden from the menu.');
}

/* ---- 4. Export orders to CSV (bonus) --------------------------------- */

function exportOrdersCsv() {
  if (adminOrders.length === 0) {
    showError('There are no orders to export.');
    return;
  }

  const header = ['Order ID', 'Placed At', 'Status', 'Total (AED)', 'Items'];
  const rows = adminOrders.map((order) => {
    const items = Array.isArray(order.items) ? order.items : [];
    return [
      order.id,
      new Date(order.created_at).toISOString(),
      order.status,
      Number(order.total).toFixed(2),
      items.map((i) => `${i.name} x${i.qty}`).join('; '),
    ];
  });

  const csv = [header, ...rows]
    .map((row) => row.map((cell) => `"${String(cell).replace(/"/g, '""')}"`).join(','))
    .join('\r\n');

  const blob = new Blob(['﻿' + csv], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = `maison-noir-orders-${new Date().toISOString().slice(0, 10)}.csv`;
  link.click();
  URL.revokeObjectURL(url);

  showSuccess(`Exported ${adminOrders.length} orders.`);
}

/* ---- 5. Realtime: new orders appear instantly ------------------------ */

function subscribeToAllOrders() {
  supabaseClient
    .channel('admin-orders')
    .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'orders' }, (payload) => {
      showToast(`New order #${payload.new.id} received`, 'success', 5000);
      loadAllOrders();
      loadStats();
    })
    .subscribe();
}

/* ---- 6. Bootstrap ----------------------------------------------------
   Called by auth.js after requireAdmin() has passed.
--------------------------------------------------------------------- */

function initAdminPanel() {
  const nameEl = document.getElementById('adminGreeting');
  if (nameEl) nameEl.textContent = currentProfile?.full_name || 'Administrator';

  loadStats();
  loadAllOrders();
  loadMenuAdmin();
  subscribeToAllOrders();

  // Live stats without a reload — refreshed every 30 seconds.
  statsTimer = setInterval(loadStats, 30000);
  window.addEventListener('beforeunload', () => clearInterval(statsTimer));

  document.getElementById('refreshOrdersBtn')?.addEventListener('click', () => {
    loadAllOrders();
    loadStats();
  });
  document.getElementById('exportCsvBtn')?.addEventListener('click', exportOrdersCsv);
  document.getElementById('addMenuItemBtn')?.addEventListener('click', () => openMenuModal());
  document.getElementById('menuItemForm')?.addEventListener('submit', saveMenuItem);

  // Status dropdowns (delegated — rows are re-rendered on every refresh)
  document.addEventListener('change', (e) => {
    if (e.target.classList.contains('status-select')) {
      updateOrderStatus(Number(e.target.dataset.orderId), e.target.value);
    }
    if (e.target.classList.contains('availability-toggle')) {
      toggleAvailability(Number(e.target.dataset.itemId), e.target.checked);
    }
  });

  // Edit / delete buttons in the menu table
  document.getElementById('menuTableBody')?.addEventListener('click', (e) => {
    const btn = e.target.closest('[data-menu-action]');
    if (!btn) return;
    const id = Number(btn.dataset.id);
    if (btn.dataset.menuAction === 'edit') openMenuModal(id);
    else if (btn.dataset.menuAction === 'delete') deleteMenuItem(id);
  });
}
