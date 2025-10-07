(function () {
    const set = () => {
    document.body.classList.toggle('scrolled', window.scrollY > 10);
    };
    set(); // initialize on load
    window.addEventListener('scroll', set, { passive: true });
})();