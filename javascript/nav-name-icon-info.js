// document.addEventListener("DOMContentLoaded", function() {
//     const infoIcon = document.getElementById("info-icon");
//     const infoBox = document.getElementById("info-box");

//     // Show the info box with transition
//     function showInfoBox() {
//         infoBox.style.display = "block";
//         infoIcon.querySelector('a').classList.add('active');
//         setTimeout(() => {
//             infoBox.classList.add('transition');
//         }, 10); // Small delay to trigger the transition
//     }

//     // Hide the info box with transition
//     function hideInfoBox() {
//         infoBox.classList.remove('transition');
//         setTimeout(() => {
//             infoBox.style.display = "none";
//         }, 300); // Matches the transition duration
//         infoIcon.querySelector('a').classList.remove('active');
//     }

//     // Toggle info box visibility on click
//     infoIcon.addEventListener("click", function(event) {
//         if (infoBox.style.display === "block") {
//             hideInfoBox();
//         } else {
//             showInfoBox();
//         }
//         event.stopPropagation(); // Prevent event bubbling
//     });

//     // Close info box when clicking outside
//     document.addEventListener("click", function(event) {
//         if (!infoIcon.contains(event.target)) {
//             hideInfoBox();
//         }
//     });
// });


const infoIcon = document.getElementById("info-icon");
const infoBox = document.getElementById("info-box");
const icon = infoIcon.querySelector("i"); // Select the icon element

// Toggle the info box and style the icon when the icon is clicked
infoIcon.addEventListener("click", function(event) {
    event.stopPropagation(); // Prevent the document click event from firing
    infoBox.style.display = (infoBox.style.display === "block") ? "none" : "block"; // Toggle display
    
    // Set icon style for active state
    icon.classList.add('active'); // Add active class to apply styles
});

// Close the info box and reset icon style when clicking outside of it
document.addEventListener("click", function(event) {
    // Check if the click is outside the info box
    if (!infoBox.contains(event.target) && !infoIcon.contains(event.target)) {
        infoBox.style.display = "none"; // Hide the info box
        
        // Reset icon style
        icon.classList.remove('active'); // Remove active class
    }
});

// Prevent the info box from closing when clicked inside it
infoBox.addEventListener("click", function(event) {
    event.stopPropagation(); // Prevent click from bubbling up to the document
});
