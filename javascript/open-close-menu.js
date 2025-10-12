// mobile-menu.js
document.addEventListener('DOMContentLoaded', () => {
  const btn = document.getElementById('mobileMenuToggle');
  const panel = document.getElementById('navLinks');
  const header = document.querySelector('.site-header');
  if (!btn || !panel || !header) return;

  // Toggle whether opening should push content (false = overlay below header)
  const PUSH_CONTENT = false;

  let isOpen = false;
  let animating = false;

  function setPanelTop() {
    // Place the panel right below the header, even if header height changes
    const h = header.getBoundingClientRect().height;
    panel.style.top = `${Math.max(0, Math.round(h))}px`;
  }

  function setBodyPush(heightPx) {
    if (!PUSH_CONTENT) return;
    document.documentElement.style.setProperty('--menu-push-offset', `${heightPx}px`);
    document.body.style.marginTop = `${heightPx}px`;
  }

  function openPanel() {
    if (animating || isOpen) return;
    animating = true;

    setPanelTop(); // compute exact offset below header

    panel.classList.add('is-open');
    panel.setAttribute('aria-hidden', 'false');
    btn.setAttribute('aria-expanded', 'true');

    // Animate to content height
    panel.style.maxHeight = panel.scrollHeight + 'px';
    setBodyPush(panel.scrollHeight);

    panel.addEventListener('transitionend', function onEnd(e) {
      if (e.propertyName === 'max-height') {
        panel.style.maxHeight = 'none'; // allow internal changes without snapping
        panel.removeEventListener('transitionend', onEnd);
        animating = false; isOpen = true;
      }
    });
  }

  function closePanel() {
    if (animating || !isOpen) return;
    animating = true;

    // Lock to current height then animate to 0
    const currentHeight = panel.scrollHeight;
    panel.style.maxHeight = currentHeight + 'px';
    void panel.offsetHeight; // reflow

    panel.classList.remove('is-open');
    panel.setAttribute('aria-hidden', 'true');
    btn.setAttribute('aria-expanded', 'false');

    panel.style.maxHeight = '0px';
    setBodyPush(0);

    panel.addEventListener('transitionend', function onEnd(e) {
      if (e.propertyName === 'max-height') {
        panel.removeEventListener('transitionend', onEnd);
        animating = false; isOpen = false;
      }
    });
  }

  btn.addEventListener('click', () => {
    isOpen ? closePanel() : openPanel();
  });

  // Recalculate when resizing or changing orientation
  const onViewportChange = () => { if (isOpen) setPanelTop(); };
  window.addEventListener('resize', onViewportChange);
  window.addEventListener('orientationchange', onViewportChange);

  // Close on ESC
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && isOpen) closePanel();
  });

  // Close when clicking outside header + panel
  document.addEventListener('click', (e) => {
    if (!isOpen) return;
    const inHeader = e.target.closest('.site-header');
    const inPanel  = e.target.closest('#navLinks');
    if (!inHeader && !inPanel) closePanel();
  });

  // Close after selecting a link
  panel.addEventListener('click', (e) => {
    if (e.target.closest('a')) closePanel();
  });

  // Reset across breakpoint
  const mq = window.matchMedia('(min-width: 900px)');
  mq.addEventListener('change', () => {
    panel.style.maxHeight = '';
    panel.classList.remove('is-open');
    panel.setAttribute('aria-hidden', 'true');
    btn.setAttribute('aria-expanded', 'false');
    animating = false; isOpen = false;
    setBodyPush(0);
  });
});
