// ==========================
// STATES.HTML
// ==========================
import { loadStudiosData } from './global.js';

// Add utility function for URL formatting
function toKebabCase(str) {
    return str.toLowerCase()
              .replace(/\s+/g, '-')
              .replace(/[^a-z0-9-]/g, '');
}

document.addEventListener("DOMContentLoaded", async () => {
    // Remove any history or location manipulation

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
    if (!statesContainer) return;

    // Load the studios data
    const data = await loadStudiosData();
    if (!data || !Array.isArray(data)) {
        console.error("Failed to load studios data");
        statesContainer.innerHTML = "<p>Error loading states data. Please try again later.</p>";
        return;
    }

    // Group studios by state and sort alphabetically
    const groupedByState = {};
    data.forEach(state => {
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
            stateCard.href = `/${toKebabCase(state)}`; // Changed URL format
            
            const criteriaWithCounts = Object.entries(criteriaCounts)
                .sort((a, b) => b[1] - a[1])
                .slice(0, 3)
                .map(([key, count]) => ({
                    name: key,
                    count,
                    emoji: criteriaEmojis[key]
                }));

            stateCard.innerHTML = `
                <h3>${state.replace(/[\[\]]/g, '')}</h3>
                <p>${studios.length} pilates studios</p>
                <div class="criteria">
                    ${criteriaWithCounts
                        .map(({ emoji, name, count }) => `
                            <div class="criteria-item">
                                <span class="emoji">${emoji}</span>
                                <span class="name">${name.replace('_', ' ')}</span>
                                <span class="count">(${count})</span>
                            </div>
                        `)
                        .join("")}
                </div>
            `;

            // Append the state card to the container
            statesContainer.appendChild(stateCard);
        });
});

function getStudioUrl(studio) {
    return `/${encodeURIComponent(studio.state)}/${encodeURIComponent(studio.city)}/${encodeURIComponent(studio.name)}`;
}
