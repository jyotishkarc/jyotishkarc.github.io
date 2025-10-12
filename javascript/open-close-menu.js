// open-close-menu.js
(function () {
  let wired = false; // prevent double-wiring

  function wire() {
    if (wired) return; // idempotent
    const header = document.querySelector('.site-header');
    const pane   = document.getElementById('navLinks');
    const btn    = document.getElementById('mobileMenuToggle');
    if (!header || !pane || !btn) return; // header not injected yet

    wired = true;

    let isOpen = false, animating = false;
    const EXTRA_OFFSET = 24.5; // your tuned gap

    function setPaneTop() {
      const rs = getComputedStyle(document.documentElement);
      const off = parseFloat(rs.getPropertyValue('--header-offset')) || 0;
      const hh  = parseFloat(rs.getPropertyValue('--site-header-height')) || 0;
      pane.style.top = `calc(${off}px + ${hh}px + ${EXTRA_OFFSET}px)`;
    }

    function openPane() {
      if (animating || isOpen) return;
      animating = true;
      setPaneTop();
      pane.classList.add('is-open');
      pane.setAttribute('aria-hidden', 'false');
      btn.setAttribute('aria-expanded', 'true');
      pane.style.maxHeight = pane.scrollHeight + 'px';
      pane.addEventListener('transitionend', function onEnd(e){
        if (e.propertyName === 'max-height') {
          pane.style.maxHeight = 'none';
          pane.removeEventListener('transitionend', onEnd);
          animating = false; isOpen = true;
        }
      });
    }

    function closePane() {
      if (animating || !isOpen) return;
      animating = true;
      pane.style.maxHeight = pane.scrollHeight + 'px';
      void pane.offsetHeight;
      pane.classList.remove('is-open');
      pane.setAttribute('aria-hidden', 'true');
      btn.setAttribute('aria-expanded', 'false');
      pane.style.maxHeight = '0px';
      pane.addEventListener('transitionend', function onEnd(e){
        if (e.propertyName === 'max-height') {
          pane.removeEventListener('transitionend', onEnd);
          animating = false; isOpen = false;
        }
      });
    }

    btn.addEventListener('click', () => (isOpen ? closePane() : openPane()));
    document.addEventListener('keydown', (e) => { if (e.key === 'Escape' && isOpen) closePane(); });

    // Click outside (not header, not pane, not toggle)
    document.addEventListener('click', (e) => {
      if (!isOpen) return;
      const inHeader = e.target.closest('.site-header');
      const inPane   = e.target.closest('#navLinks');
      const isToggle = e.target.closest('#mobileMenuToggle');
      if (!inHeader && !inPane && !isToggle) closePane();
    });

    // Keep top aligned on resize/orientation
    const recalc = () => { if (isOpen) setPaneTop(); };
    window.addEventListener('resize', recalc);
    window.addEventListener('orientationchange', recalc);
  }

  // Expose an init you can call after you inject the header
  window.initMobileMenu = wire;

  // Also try to wire on DOM ready (works for pages that inline the header)
  document.addEventListener('DOMContentLoaded', wire);
})();
