const infoIcon = document.getElementById("info-icon");
const infoBox = document.getElementById("info-box");
const icon = infoIcon.querySelector("a"); // Select the icon element

// Toggle the info box and style the icon when the icon is clicked
infoIcon.addEventListener("click", function(event) {
    event.stopPropagation(); // Prevent the document click event from firing

    // Check if the info box is currently visible
    const isVisible = infoBox.classList.contains("show");
    
    // If the info box is not visible, show it
    if (!isVisible) {
        infoBox.classList.add("show"); // Show the info box
        icon.classList.add('active'); // Add active class to apply styles
    } else {
        infoBox.classList.remove("show"); // Hide the info box
        icon.classList.remove('active'); // Remove active class if box is closed
    }
});

// Close the info box and reset icon style when clicking outside of it
document.addEventListener("click", function(event) {
    // Check if the click is outside the info box
    if (!infoBox.contains(event.target) && !infoIcon.contains(event.target)) {
        infoBox.classList.remove("show"); // Hide the info box
        icon.classList.remove('active'); // Remove active class
    }
});

// Prevent the info box from closing when clicked inside it
infoBox.addEventListener("click", function(event) {
    event.stopPropagation(); // Prevent click from bubbling up to the document
});


