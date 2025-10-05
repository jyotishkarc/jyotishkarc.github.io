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

    // Safety: if load never fires (CDN hiccup), bail out anyway
    const failSafe = setTimeout(finishPreload, 5000);

    window.addEventListener('load', function() {
        clearTimeout(failSafe);
        // A tiny delay feels nicer than an abrupt cut
        setTimeout(finishPreload, 150);
    });
})();

