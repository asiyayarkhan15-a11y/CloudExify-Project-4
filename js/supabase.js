/* ==========================================================
   js/supabase.js
   Supabase client init + small shared helpers used everywhere.
   Loaded first on every page, before any other app script.
   ========================================================== */

/* ---- 1. Config -------------------------------------------------------
   Replace these two values with your own project's credentials from
   Supabase Dashboard > Project Settings > API.

   ONLY ever put the "anon public" key here. Never the service_role key —
   this file is shipped to the browser and is readable by anyone.
--------------------------------------------------------------------- */
const SUPABASE_URL = 'https://fqlqukasiztxwfjkbtiz.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZxbHF1a2FzaXp0eHdmamtidGl6Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODU3NzgwNTAsImV4cCI6MjEwMTM1NDA1MH0.i4tkbPtazC6YivSpjudVhHUFtmPSaHSrHWyyKc0DXS8';

/* ---- 2. Client ----------------------------------------------------
   NOTE ON THE NAME: the CDN bundle publishes the SDK as the global
   `window.supabase`. Writing `const supabase = window.supabase.createClient(...)`
   — as most tutorials do — throws:

       Uncaught SyntaxError: Identifier 'supabase' has already been declared

   because a top-level `const` cannot reuse a name the global object has
   already taken. The whole script then dies before anything runs. Calling
   our client `supabaseClient` sidesteps the clash entirely.
--------------------------------------------------------------------- */
const supabaseClient = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
  },
});

/* Fail loudly (once) if the credentials were never filled in. */
if (SUPABASE_URL.includes('YOUR-PROJECT-ID')) {
  console.warn(
    '[Maison Noir] Supabase credentials are still placeholders. ' +
    'Edit js/supabase.js and paste your Project URL + anon public key.'
  );
}

/* ---- 3. Shared helpers -------------------------------------------- */

const CURRENCY = 'PKR';

/** Format a number as a price string, e.g. money(24.5) -> "PKR 24.50" */
function money(value) {
  return CURRENCY + ' ' + Number(value || 0).toFixed(2);
}

/** Escape user/DB supplied text before putting it into innerHTML. */
function escapeHtml(value) {
  return String(value ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

/** Human readable date, e.g. "3 Aug 2026, 14:05" */
function formatDate(value) {
  if (!value) return '—';
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return '—';
  return d.toLocaleString('en-GB', {
    day: 'numeric', month: 'short', year: 'numeric',
    hour: '2-digit', minute: '2-digit',
  });
}

/** Midnight today, as an ISO string — used for "today" stat queries. */
function startOfTodayISO() {
  const d = new Date();
  d.setHours(0, 0, 0, 0);
  return d.toISOString();
}

/* ---- 4. Toasts ----------------------------------------------------- */

function toastZone() {
  let zone = document.getElementById('toastZone');
  if (!zone) {
    zone = document.createElement('div');
    zone.id = 'toastZone';
    document.body.appendChild(zone);
  }
  return zone;
}

/**
 * Show a small toast in the bottom-right corner.
 * type: 'success' | 'error' | 'info'
 */
function showToast(message, type = 'info', duration = 3200) {
  const el = document.createElement('div');
  el.className = 'mn-toast' + (type === 'error' ? ' is-error' : type === 'success' ? ' is-success' : '');
  el.setAttribute('role', type === 'error' ? 'alert' : 'status');
  el.textContent = message;
  toastZone().appendChild(el);

  setTimeout(() => {
    el.classList.add('is-hiding');
    setTimeout(() => el.remove(), 240);
  }, duration);
}

function showSuccess(message) { showToast(message, 'success'); }
function showError(message) { showToast(message, 'error', 4600); }

/* ---- 5. Loading states --------------------------------------------- */

/** Fill a container with shimmering skeleton cards while data loads. */
function renderCardSkeletons(container, count = 8) {
  if (!container) return;
  container.innerHTML = Array.from({ length: count }).map(() => `
    <div class="col-6 col-md-4 col-lg-3 mb-4">
      <div class="mn-skeleton" style="height: 290px;"></div>
    </div>
  `).join('');
}

/** Centered spinner markup for table bodies / lists. */
function spinnerRow(colspan = 6) {
  return `<tr><td colspan="${colspan}" class="text-center py-5">
            <div class="mn-spinner mx-auto"></div>
          </td></tr>`;
}

function emptyState(icon, title, subtitle = '') {
  return `<div class="mn-empty">
            <div class="mn-empty-icon">${icon}</div>
            <div class="mn-serif fs-5">${escapeHtml(title)}</div>
            ${subtitle ? `<div class="small mt-1">${escapeHtml(subtitle)}</div>` : ''}
          </div>`;
}

/* ---- 6. Status badge ------------------------------------------------ */

const ORDER_STATUSES = ['Pending', 'Preparing', 'Ready', 'Completed', 'Cancelled'];

function statusBadge(status) {
  const safe = ORDER_STATUSES.includes(status) ? status : 'Pending';
  return `<span class="mn-status mn-status-${safe.toLowerCase()}">${safe}</span>`;
}

/** Swap a broken remote food image for the bundled placeholder. */
const IMG_FALLBACK = "this.onerror=null;this.src='assets/placeholder.svg';";
