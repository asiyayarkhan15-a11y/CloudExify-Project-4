/* ==========================================================
   js/boot.js
   Startup guard. Loaded in <head> before every other script.

   The page is hidden until the auth check finishes (so content
   doesn't flash). This file makes sure that if something throws,
   or a CDN fails, or Supabase never answers, you get a readable
   message instead of a blank screen.
   ========================================================== */

(function () {
  var reported = false;

  function esc(text) {
    return String(text).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
  }

  function report(title, detail) {
    if (reported) return;
    // If the app already started successfully, stay out of the way.
    if (document.body && document.body.classList.contains('mn-ready')) return;
    reported = true;

    function paint() {
      var gate = document.getElementById('authGate');
      if (!gate) {
        gate = document.createElement('div');
        gate.id = 'authGate';
        document.body.appendChild(gate);
      }
      gate.setAttribute('style',
        'position:fixed;inset:0;z-index:9999;background:#0d0d0f;display:flex;' +
        'align-items:center;justify-content:center;padding:2rem;');
      gate.innerHTML =
        '<div style="max-width:40rem;font:400 14px/1.65 system-ui,-apple-system,sans-serif;color:#f2f0ea">' +
          '<div style="color:#c9a227;letter-spacing:.22em;font-size:11px;margin-bottom:.9rem">' +
            'MAISON NOIR — STARTUP ERROR</div>' +
          '<div style="font-size:1.15rem;margin-bottom:.9rem">' + esc(title) + '</div>' +
          '<pre style="color:#ff6b7a;background:#1e1e24;border:1px solid #2b2b33;border-radius:8px;' +
            'padding:.9rem;white-space:pre-wrap;word-break:break-word;font-size:12.5px;margin:0">' +
            esc(detail) + '</pre>' +
          '<div style="color:#9b978d;margin-top:1rem">Press F12 → Console for the full trace.</div>' +
        '</div>';
    }

    if (document.body) paint();
    else document.addEventListener('DOMContentLoaded', paint);
  }

  // Uncaught exceptions, and failed <script>/<link> loads.
  window.addEventListener('error', function (e) {
    var el = e.target;

    if (el && el !== window && el.tagName) {
      var tag = el.tagName.toUpperCase();

      // Cosmetic only — a missing photo or webfont must never block the app.
      // Google Fonts in particular is blocked on some networks; the CSS
      // already falls back to Georgia / system-ui.
      if (tag === 'IMG' || tag === 'LINK') {
        console.warn('[Maison Noir] Optional asset failed to load:', el.src || el.href);
        return;
      }

      if (tag === 'SCRIPT') {
        report('A required script could not be loaded.',
               (el.src || '(inline script)') + '\n\nIf this is a CDN URL, check your ' +
               'internet connection or whether something is blocking it.');
      }
      return;
    }

    if (!e.message) return;
    report('A script error stopped the page from loading.',
           e.message + (e.filename ? '\n\nat ' + e.filename + ':' + e.lineno : ''));
  }, true);

  window.addEventListener('unhandledrejection', function (e) {
    var reason = e.reason;
    report('A request failed and was not handled.',
           (reason && reason.message) ? reason.message : String(reason));
  });

  // Nothing threw, but the app never finished starting.
  setTimeout(function () {
    report('Timed out waiting for Supabase.',
           'The page loaded but the session check never came back after 10 seconds.\n\n' +
           'Most likely causes:\n' +
           '  1. Wrong Project URL or anon key in js/supabase.js\n' +
           '  2. supabase/schema.sql has not been run yet\n' +
           '  3. The Supabase project is still provisioning or is paused');
  }, 10000);
})();
