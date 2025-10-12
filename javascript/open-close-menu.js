// open-close-menu.js
(function () {
  let wired = false; // prevent double-wiring

  function wire() {
    // only proceed if header markup exists (works with async-injected header)
    const header = document.querySelector('.site-header');
    const pane   = document.getElementById('navLinks');
    const btn    = document.getElementById('mobileMenuToggle');
    if (!header || !pane || !btn) return; // header not injected yet

    if (wired) return; // idempotent after successful wiring
    wired = true;

    let isOpen = false, animating = false;

    // Read gap from CSS var (fallback to 12px if not set)
    function getPaneGap() {
      const v = getComputedStyle(document.documentElement).getPropertyValue('--pane-gap');
      const n = parseFloat(v);
      return Number.isFinite(n) ? n : 12;
    }

    // Place the pane exactly below the visible header bottom (+ gap)
    function setPaneTop() {
      const rect = header.getBoundingClientRect(); // includes padding; excludes pseudo ring
      const topPx = Math.round(rect.bottom + getPaneGap());
      pane.style.top = topPx + 'px';
    }

    function openPane() {
      if (animating || isOpen) return;
      animating = true;

      setPaneTop(); // compute exact position now

      pane.classList.add('is-open');
      pane.setAttribute('aria-hidden', 'false');
      btn.setAttribute('aria-expanded', 'true');

      // animate height
      pane.style.maxHeight = pane.scrollHeight + 'px';
      pane.addEventListener('transitionend', function onEnd(e) {
        if (e.propertyName === 'max-height') {
          pane.style.maxHeight = 'none'; // allow internal changes without snapping
          pane.removeEventListener('transitionend', onEnd);
          animating = false; isOpen = true;
        }
      });
    }

    function closePane() {
      if (animating || !isOpen) return;
      animating = true;

      pane.style.maxHeight = pane.scrollHeight + 'px';
      void pane.offsetHeight; // reflow to apply starting height
      pane.classList.remove('is-open');
      pane.setAttribute('aria-hidden', 'true');
      btn.setAttribute('aria-expanded', 'false');
      pane.style.maxHeight = '0px';

      pane.addEventListener('transitionend', function onEnd(e) {
        if (e.propertyName === 'max-height') {
          pane.removeEventListener('transitionend', onEnd);
          animating = false; isOpen = false;
        }
      });
    }

    // Toggle
    btn.addEventListener('click', () => (isOpen ? closePane() : openPane()));

    // ESC to close
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape' && isOpen) closePane();
    });

    // Click outside (not header, not pane, not toggle)
    document.addEventListener('click', (e) => {
      if (!isOpen) return;
      const inHeader = e.target.closest('.site-header');
      const inPane   = e.target.closest('#navLinks');
      const isToggle = e.target.closest('#mobileMenuToggle');
      if (!inHeader && !inPane && !isToggle) closePane();
    });

    // Keep top aligned on resize/orientation while open
    const recalcIfOpen = () => { if (isOpen) setPaneTop(); };
    window.addEventListener('resize', recalcIfOpen);
    window.addEventListener('orientationchange', recalcIfOpen);

    // Optional: keep aligned while scrolling (throttled with rAF)
    let scrolling = false;
    window.addEventListener('scroll', () => {
      if (!isOpen || scrolling) return;
      scrolling = true;
      requestAnimationFrame(() => { setPaneTop(); scrolling = false; });
    }, { passive: true });

    // Reset if we cross back to desktop
    const mq = window.matchMedia('(min-width: 1000px)');
    mq.addEventListener('change', () => {
      if (mq.matches) {
        pane.style.maxHeight = '';
        pane.classList.remove('is-open');
        pane.setAttribute('aria-hidden', 'true');
        btn.setAttribute('aria-expanded', 'false');
        isOpen = false; animating = false;
      }
    });
  }

  // Expose an init to call AFTER injecting header HTML
  window.initMobileMenu = wire;

  // Also try to wire on DOM ready (works if header is inline)
  document.addEventListener('DOMContentLoaded', wire);
})();
