// Preloader intentionally disabled.
// Keeping this file as a no-op to avoid breaking any references/bookmarks.
(function() {
    // Prevent scroll while preloading (optional)
    document.documentElement.classList.add('is-preloading');

    // Reveal logic after all assets are loaded
    function finishPreload() {
        const pre = document.getElementById('preloader');
        if (!pre) return;
        pre.classList.add('is-hidden');
        document.documentElement.classList.remove('is-preloading');
        document.documentElement.classList.add('is-revealed');
        // Clean up after transition
        setTimeout(() => pre.remove(), 700);
    }

    // Safety: if any event never fires, bail out anyway.
    const failSafe = setTimeout(finishPreload, 2500);

    function revealSoon() {
        clearTimeout(failSafe);
        // Small delay to avoid abrupt flash
        setTimeout(finishPreload, 120);
    }

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', revealSoon, { once: true });
    } else {
        revealSoon();
    }
})();
