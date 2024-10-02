
// Function to add authors dynamically from data-authors attribute
function populateAuthors() {
    // Get all publication divs
    const publications = document.querySelectorAll('.publication-card');

    publications.forEach(publication => {
        // Extract the data-authors attribute
        const authorKeys = publication.getAttribute('data-authors').split(',').map(a => a.trim());

        // Prepare an array for author links and a set for uniqueness
        const authorLinks = [];
        const uniqueAuthorsSet = new Set(); // To ensure unique authors

        // Loop through author keys
        authorKeys.forEach(key => {
            // Check if the key ends with an asterisk for equal contribution
            const isEqualContribution = key.endsWith('*');
            const authorKey = isEqualContribution ? key.slice(0, -1).trim() : key; // Remove asterisk if present
            
            // Get the author link
            const link = collaborators[authorKey];
            if (link) {
                // Only add if not already in the set
                if (!uniqueAuthorsSet.has(link)) {
                    uniqueAuthorsSet.add(link); // Add link to the set
                    authorLinks.push(isEqualContribution ? link + '*' : link);
                }
            } else {
                // If the author key is a manual note, add it directly
                authorLinks.push(key);
            }
        });

        // Check for alphabetical order attribute
        const isAlphabetical = publication.getAttribute('data-alphabetical') === "true";
        
        // Construct the authors string
        let authorsString = authorLinks.join(", ");
        if (isAlphabetical) {
            authorsString += " (in alphabetical order)"; // Just append without worrying about commas
        }

        // Set the author list in the HTML
        publication.querySelector('.author-list').innerHTML = authorsString;
    });
}
