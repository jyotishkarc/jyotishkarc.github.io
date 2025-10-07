/* /js/site-header.js */

/* Helpers */
function $(sel, root = document) { return root.querySelector(sel); }

/* Toggle menu state using ARIA + data attribute */
function setMenu(open) {
  const menu = $('#mobileMenu');       // your sliding/overlay menu panel
  const burger = $('#hamburgerBtn');   // the three-bars button
  const closeBtn = $('#closeMenuBtn'); // optional close “X” button

  if (!menu) return; // header not present yet on this page

  menu.setAttribute('aria-hidden', String(!open));
  document.documentElement.toggleAttribute('data-menu-open', open);

  if (burger) burger.setAttribute('aria-expanded', String(open));
  if (closeBtn) closeBtn.setAttribute('aria-expanded', String(open));
}

/* Public API (GLOBAL) — so inline onclick="showMenu()" works if you use it */
window.showMenu  = () => setMenu(true);
window.hideMenu  = () => setMenu(false);
window.toggleMenu = () => {
  const menu = $('#mobileMenu');
  const open = menu && menu.getAttribute('aria-hidden') === 'true';
  setMenu(open);
};

/* Safe event binding after DOM is ready (works even if header is injected) */
document.addEventListener('DOMContentLoaded', () => {
  const burger = $('#hamburgerBtn');
  const closeBtn = $('#closeMenuBtn');
  const overlay = $('#mobileMenuOverlay'); // optional translucent backdrop

  if (burger)  burger.addEventListener('click', e => { e.preventDefault(); window.toggleMenu(); });
  if (closeBtn) closeBtn.addEventListener('click', e => { e.preventDefault(); window.hideMenu(); });
  if (overlay)  overlay.addEventListener('click', () => window.hideMenu());
});

/* If your header HTML is injected dynamically (via fetch + innerHTML),
   rebinding once it arrives helps. You can dispatch this event after injecting. */
document.addEventListener('site-header:ready', () => {
  // re-run the same bindings if needed
  const burger = $('#hamburgerBtn');
  const closeBtn = $('#closeMenuBtn');
  const overlay = $('#mobileMenuOverlay');
  if (burger)  burger.onclick = e => { e.preventDefault(); window.toggleMenu(); };
  if (closeBtn) closeBtn.onclick = e => { e.preventDefault(); window.hideMenu(); };
  if (overlay)  overlay.onclick = () => window.hideMenu();
});
