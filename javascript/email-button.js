const emailIcon   = document.getElementById("email-icon");
const emailReveal = document.getElementById("email-reveal");
const emailImg    = emailReveal.querySelector("img");

// Toggle on icon click
emailIcon.addEventListener("click", (e) => {
  e.preventDefault();
  e.stopPropagation(); // important: don't let document click close it immediately
  emailReveal.classList.toggle("show");
});

// Clicking the image should NOT close it
emailImg.addEventListener("click", (e) => {
  e.stopPropagation();
});

// Click anywhere else closes it
document.addEventListener("click", () => {
  emailReveal.classList.remove("show");
});


// Close email reveal on Escape key
document.addEventListener("keydown", function (e) {
    if (e.key === "Escape") {
        document.getElementById("email-reveal").classList.remove("show");
    }
});

