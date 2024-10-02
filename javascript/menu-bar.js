
var navLinks = document.getElementById("navLinks")

function showMenu() {
    navLinks.style.right = "0";

    // navLinks.style.height = document.body.scrollHeight;
    // navLinks.style.height = window.innerHeight;
    navLinks.style.height = document.documentElement.scrollHeight;
}

function hideMenu() {
    navLinks.style.right = "-200px";
    // navLinks.style.height=window.innerHeight;
    navLinks.style.height = document.body.scrollHeight;
}