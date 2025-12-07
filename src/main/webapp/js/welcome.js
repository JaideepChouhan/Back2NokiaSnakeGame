// js/welcome.js
// Show centered "Welcome, <username>" under the main title and a fixed Logout button at bottom-left.
// Place this file at js/welcome.js and include it in game.html BEFORE js/game.js
// It reads ?user=... from the URL (LoginServlet redirects with ?user=...).
// When Logout clicked it POSTs to /logout and then redirects to index.html.

document.addEventListener('DOMContentLoaded', function () {
  try {
    const params = new URLSearchParams(window.location.search);
    let userParam = params.get('user');
    if (!userParam) return;

    // URLEncoder.encode may have converted spaces to '+'
    userParam = userParam.replace(/\+/g, ' ');
    const username = decodeURIComponent(userParam);

    // --- Centered welcome under main title ---
    const siteTitle = document.querySelector('.site-title') || document.getElementById('siteHeader');
    if (siteTitle) {
      let el = document.getElementById('welcomeUser');
      if (!el) {
        el = document.createElement('div');
        el.id = 'welcomeUser';
        el.style.cssText = [
          'text-align:center',
          'color:var(--neon,#bfffd6)',
          'font-family:monospace',
          'font-size:18px',
          'margin-top:10px',
          'letter-spacing:0.4px'
        ].join(';');
        const h1 = siteTitle.querySelector('h1');
        if (h1 && h1.parentNode) h1.parentNode.insertBefore(el, h1.nextSibling);
        else siteTitle.appendChild(el);
      }
      el.textContent = 'Welcome, ' + username;
    }

    // --- Fixed Logout button at bottom-left ---
    let logoutBtn = document.getElementById('logoutBtnFloating');
    if (!logoutBtn) {
      logoutBtn = document.createElement('button');
      logoutBtn.id = 'logoutBtnFloating';
      logoutBtn.type = 'button';
      logoutBtn.setAttribute('aria-label', 'Logout');
      logoutBtn.textContent = 'Logout';
      // Fixed bottom-left neon style
      logoutBtn.style.cssText = [
        'position:fixed',
        'left:12px',
        'bottom:12px',
        'z-index:1300',
        'background:transparent',
        'color:var(--neon,#bfffd6)',
        'border:2px solid rgba(0,255,51,0.85)',
        'padding:8px 12px',
        'border-radius:6px',
        'cursor:pointer',
        'font-family:monospace',
        'font-size:14px',
        'box-shadow:0 6px 18px rgba(0,255,51,0.04)'
      ].join(';');
      document.body.appendChild(logoutBtn);
    }

    logoutBtn.addEventListener('click', async function () {
      try {
        await fetch('logout', { method: 'POST', credentials: 'same-origin' });
      } catch (e) {
        // ignore network error
      } finally {
        // redirect to menu/home
        window.location.href = 'index.html';
      }
    });

  } catch (e) {
    // silent fail for safety
    // console.warn('welcome.js error', e);
  }
});