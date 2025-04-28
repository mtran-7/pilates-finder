// ==========================
// STATES.HTML
// ==========================
document.addEventListener("DOMContentLoaded", async () => {
    // Get state from URL parameters
    const urlParams = new URLSearchParams(window.location.search);
    const stateName = urlParams.get('state');

    // Update page titles if state is specified
    if (stateName) {
        document.getElementById('hero-title').textContent = `Pilates in ${stateName}`;
        document.getElementById('hero-subtitle').textContent = `Explore pilates studios across ${stateName}`;
        document.getElementById('explore-title').textContent = `Browse ${stateName}`;
    }

    const criteriaEmojis = {
        Reformer: "🏋️‍♀️",
        Mat: "🟦",
        Private: "🔒",
        Group: "👥",
        Online: "🌐",
        Free_Trial: "🎟️",
        Barre: "🩰",
        Tower: "🗼"
    };

    const statesContainer = document.getElementById("states-list");

    // Load the studios data
    await loadStudiosData();

    // Group studios by state and sort alphabetically
    const groupedByState = {};
    allStudiosData.forEach(state => {
        groupedByState[state.state] = state.studios;
    });
    
    // Convert to array, sort, and build cards
    Object.entries(groupedByState)
        .sort(([a], [b]) => a.localeCompare(b))
        .forEach(([state, studios]) => {
            // Count occurrences of each criterion
            const criteriaCounts = {};
            studios.forEach(studio => {
                Object.entries(studio.criteria).forEach(([key, value]) => {
                    if (criteriaEmojis[key] && value) {
                        criteriaCounts[key] = (criteriaCounts[key] || 0) + 1;
                    }
                });
            });

            // Sort criteria by count and select the top 3
            const topCriteria = Object.entries(criteriaCounts)
                .sort((a, b) => b[1] - a[1])
                .slice(0, 3)
                .map(([criterion, count]) => ({
                    criterion: criterion.replace('_', ' '), // Replace underscores with spaces
                    count,
                    emoji: criteriaEmojis[criterion] || ""
                }));

            // Create the state card
            const stateCard = document.createElement("a");
            stateCard.classList.add("state-card");
            stateCard.href = `cities.html?state=${encodeURIComponent(state)}`;
            stateCard.innerHTML = `
                <h3>${state.replace(/[\[\]]/g, '')}</h3>
                <p>${studios.length} pilates studios</p>
                <div class="criteria">
                    ${topCriteria
                        .map(
                            ({ emoji, criterion, count }) =>
                                `<div class="criteria-item">${emoji} ${criterion} (${count})</div>`
                        )
                        .join("")}
                </div>
            `;

            // Append the state card to the container
            statesContainer.appendChild(stateCard);
        });
});
