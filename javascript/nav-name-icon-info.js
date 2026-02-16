// nav-name-icon-info.js

// const infoIcon = document.getElementById("info-trigger");
// const infoBox = document.getElementById("info-box");
// const icon = infoIcon.querySelector("a"); // Select the icon element

// // Toggle the info box and style the icon when the icon is clicked
// infoIcon.addEventListener("click", function(event) {
//     event.stopPropagation(); // Prevent the document click event from firing

//     // Check if the info box is currently visible
//     const isVisible = infoBox.classList.contains("show");
    
//     // If the info box is not visible, show it
//     if (!isVisible) {
//         infoBox.classList.add("show"); // Show the info box
//         icon.classList.add('active'); // Add active class to apply styles
//     } else {
//         infoBox.classList.remove("show"); // Hide the info box
//         icon.classList.remove('active'); // Remove active class if box is closed
//     }
// });

// // Close the info box and reset icon style when clicking outside of it
// document.addEventListener("click", function(event) {
//     // Check if the click is outside the info box
//     if (!infoBox.contains(event.target) && !infoIcon.contains(event.target)) {
//         infoBox.classList.remove("show"); // Hide the info box
//         icon.classList.remove('active'); // Remove active class
//     }
// });

// // Prevent the info box from closing when clicked inside it
// infoBox.addEventListener("click", function(event) {
//     event.stopPropagation(); // Prevent click from bubbling up to the document
// });


// document.addEventListener("DOMContentLoaded", () => {
//   const root = document.querySelector(".nav-name-details"); // or whatever your first selector is
//   if (!root) return; // fails silently instead of crashing

//   const icon = root.querySelector("i");          // example
//   const box  = document.querySelector("#info-box"); // example
//   if (!icon || !box) return;

//   icon.addEventListener("click", (e) => {
//     e.preventDefault();
//     box.classList.toggle("open");
//   });
// });

document.addEventListener("DOMContentLoaded", () => {
  const trigger = document.querySelector(".info-trigger");
  const box = document.getElementById("info-box");
  const icon = document.getElementById("info-icon");

  if (!trigger || !box || !icon) return;

  trigger.addEventListener("click", (e) => {
    e.preventDefault();
    e.stopPropagation();

    const isOpen = box.classList.toggle("show");
    icon.classList.toggle("active", isOpen);
  });

  box.addEventListener("click", (e) => e.stopPropagation());

  document.addEventListener("click", () => {
    box.classList.remove("show");
    icon.classList.remove("active");
  });
});
