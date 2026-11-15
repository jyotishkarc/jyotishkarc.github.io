// nav-name-icon-info.js
// Toggles the name-pronunciation box next to the name in the header.
// The header is injected asynchronously (fetch + innerHTML), so the elements
// usually don't exist yet when this script runs. Event delegation on the
// document makes this work no matter when the header arrives.

(function () {
  function parts() {
    return {
      box: document.getElementById("info-box"),
      icon: document.getElementById("info-icon"),
      trigger: document.querySelector(".info-trigger"),
    };
  }

  function setOpen(open) {
    const { box, icon, trigger } = parts();
    if (!box) return;
    box.classList.toggle("show", open);
    if (icon) icon.classList.toggle("active", open);
    if (trigger) trigger.setAttribute("aria-expanded", String(open));
  }

  document.addEventListener("click", (e) => {
    const trigger = e.target.closest(".info-trigger");
    if (trigger) {
      e.preventDefault();
      const { box } = parts();
      setOpen(!(box && box.classList.contains("show")));
      return;
    }
    // Clicks inside the box keep it open; anywhere else closes it.
    if (e.target.closest("#info-box")) return;
    setOpen(false);
  });

  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape") setOpen(false);
  });
})();
