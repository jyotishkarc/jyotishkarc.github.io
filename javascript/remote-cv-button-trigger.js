document.addEventListener("DOMContentLoaded", () => {
  const navCV = document.getElementById("nav-cv");
  const mainCV = document.getElementById("main-cv-btn");
  if (!navCV || !mainCV) return;

  const on = () => mainCV.classList.add("is-hover");
  const off = () => mainCV.classList.remove("is-hover");

  navCV.addEventListener("mouseenter", on);
  navCV.addEventListener("mouseleave", off);

  // keyboard users: focus behaves like hover
  navCV.addEventListener("focus", on);
  navCV.addEventListener("blur", off);
});