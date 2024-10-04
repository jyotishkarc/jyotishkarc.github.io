
(function() {
    const allowedDomains = ['jyotishkarc.github.io', 'https://jyotishkarc.github.io/','http://127.0.0.1:5500'];
    const currentDomain = window.location.hostname;

    if (!allowedDomains.includes(currentDomain)) {
        document.body.innerHTML = ""; // Clears the page
        throw new Error("Unauthorized website - content removed.");
    }
})();