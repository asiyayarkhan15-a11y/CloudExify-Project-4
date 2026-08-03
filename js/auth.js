/* ==========================================================
   js/auth.js
   Register, login, logout, session guards and role checks.
   Also bootstraps each page based on <body data-page="...">.
   ========================================================== */

/* Cached profile of the signed-in user for the current page load. */
let currentUser = null;
let currentProfile = null;

/* ---- Session helpers ----------------------------------------------- */

async function getSession() {
  const { data, error } = await supabaseClient.auth.getSession();
  if (error) console.error('getSession failed:', error.message);
  return data?.session ?? null;
}

/** Fetch the profiles row (full_name + role) for a given user id. */
async function fetchProfile(userId) {
  const { data, error } = await supabaseClient
    .from('profiles')
    .select('id, full_name, role')
    .eq('id', userId)
    .maybeSingle();

  if (error) {
    console.error('Could not load profile:', error.message);
    return null;
  }
  return data;
}

/**
 * Guard for pages that require any signed-in user (index.html).
 * Redirects to login.html when there is no session.
 * Returns the profile on success, null if it redirected.
 */
async function requireAuth() {
  const session = await getSession();
  if (!session) {
    window.location.replace('login.html');
    return null;
  }
  currentUser = session.user;
  currentProfile = await fetchProfile(session.user.id);
  return currentProfile;
}

/**
 * Guard for admin.html — must be signed in AND have role 'admin'.
 * Regular users typing the admin URL directly get bounced to index.html.
 */
async function requireAdmin() {
  const session = await getSession();
  if (!session) {
    window.location.replace('login.html');
    return null;
  }

  const profile = await fetchProfile(session.user.id);
  if (!profile || profile.role !== 'admin') {
    window.location.replace('index.html');
    return null;
  }

  currentUser = session.user;
  currentProfile = profile;
  return profile;
}

/** If already signed in, skip login/register and go where you belong. */
async function redirectIfSignedIn() {
  const session = await getSession();
  if (!session) return false;

  const profile = await fetchProfile(session.user.id);
  window.location.replace(profile?.role === 'admin' ? 'admin.html' : 'index.html');
  return true;
}

/* ---- Register ------------------------------------------------------- */

async function handleRegister(event) {
  event.preventDefault();

  const form = event.target;
  const btn = form.querySelector('button[type="submit"]');
  const fullName = form.fullName.value.trim();
  const email = form.email.value.trim();
  const password = form.password.value;
  const confirm = form.confirmPassword.value;

  if (fullName.length < 2) return showError('Please enter your full name.');
  if (password.length < 6) return showError('Password must be at least 6 characters.');
  if (password !== confirm) return showError('Passwords do not match.');

  setButtonLoading(btn, true, 'Creating account…');

  // full_name is passed as user metadata; a database trigger copies it into
  // the profiles table with role 'customer'. See supabase/schema.sql.
  const { data, error } = await supabaseClient.auth.signUp({
    email,
    password,
    options: { data: { full_name: fullName } },
  });

  if (error) {
    setButtonLoading(btn, false);
    showError(error.message);
    return;
  }

  // Belt and braces: if the session exists immediately (email confirmation
  // disabled) make sure the profile row is there with the right name.
  if (data.session) {
    await supabaseClient
      .from('profiles')
      .upsert({ id: data.user.id, full_name: fullName, role: 'customer' }, { onConflict: 'id' });

    showSuccess('Welcome to Maison Noir.');
    setTimeout(() => window.location.replace('index.html'), 700);
    return;
  }

  // Email confirmation is switched on for this project.
  setButtonLoading(btn, false);
  form.reset();
  showSuccess('Account created. Check your inbox to confirm your email, then sign in.');
}

/* ---- Login ---------------------------------------------------------- */

async function handleLogin(event) {
  event.preventDefault();

  const form = event.target;
  const btn = form.querySelector('button[type="submit"]');
  const email = form.email.value.trim();
  const password = form.password.value;

  if (!email || !password) return showError('Enter your email and password.');

  setButtonLoading(btn, true, 'Signing in…');

  const { data, error } = await supabaseClient.auth.signInWithPassword({ email, password });

  if (error) {
    setButtonLoading(btn, false);
    showError(error.message);
    return;
  }

  // Admins land on the dashboard, customers on the menu.
  const profile = await fetchProfile(data.user.id);
  const destination = profile?.role === 'admin' ? 'admin.html' : 'index.html';
  showSuccess('Signed in. Redirecting…');
  setTimeout(() => window.location.replace(destination), 500);
}

/* ---- Logout --------------------------------------------------------- */

async function handleLogout() {
  const { error } = await supabaseClient.auth.signOut();
  if (error) {
    showError('Could not sign out: ' + error.message);
    return;
  }
  if (typeof CART_KEY !== 'undefined') sessionStorage.removeItem(CART_KEY);
  window.location.replace('login.html');
}

/* ---- Small UI helpers ----------------------------------------------- */

function setButtonLoading(btn, isLoading, loadingText = 'Please wait…') {
  if (!btn) return;
  if (isLoading) {
    btn.dataset.originalText = btn.innerHTML;
    btn.disabled = true;
    btn.innerHTML = `<span class="spinner-border spinner-border-sm me-2"></span>${loadingText}`;
  } else {
    btn.disabled = false;
    if (btn.dataset.originalText) btn.innerHTML = btn.dataset.originalText;
  }
}

/** Show the signed-in name in the navbar and reveal the Admin link if allowed. */
function renderNavForProfile(profile) {
  const nameEl = document.getElementById('navUserName');
  if (nameEl) nameEl.textContent = profile?.full_name || currentUser?.email || 'Guest';

  const adminLink = document.getElementById('navAdminLink');
  if (adminLink && profile?.role === 'admin') adminLink.classList.remove('d-none');

  document.querySelectorAll('[data-action="logout"]').forEach((btn) => {
    btn.addEventListener('click', (e) => {
      e.preventDefault();
      handleLogout();
    });
  });
}

/** Reveal the page once auth has been resolved (avoids a content flash). */
function markPageReady() {
  document.body.classList.add('mn-ready');
}

/* ---- Page bootstrap -------------------------------------------------
   Every page sets <body data-page="user|admin|login|register">.
   All other scripts are already parsed by the time DOMContentLoaded
   fires, so their functions are safe to call from here.
--------------------------------------------------------------------- */

document.addEventListener('DOMContentLoaded', async () => {
  const page = document.body.dataset.page;

  if (page === 'login' || page === 'register') {
    const alreadyIn = await redirectIfSignedIn();
    if (alreadyIn) return;

    const form = document.getElementById(page === 'login' ? 'loginForm' : 'registerForm');
    form?.addEventListener('submit', page === 'login' ? handleLogin : handleRegister);
    markPageReady();
    return;
  }

  if (page === 'user') {
    const profile = await requireAuth();
    if (!profile && !currentUser) return; // redirected to login
    renderNavForProfile(profile);
    markPageReady();
    initUserPanel();
    return;
  }

  if (page === 'admin') {
    const profile = await requireAdmin();
    if (!profile) return; // redirected away
    renderNavForProfile(profile);
    markPageReady();
    initAdminPanel();
  }
});
