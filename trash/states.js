import { loadStudiosData } from '/global.js';

// Add utility function for URL formatting
function toKebabCase(str) {
    return str.toLowerCase()
        .replace(/\s+/g, '-')
        .replace(/[^a-z0-9-]/g, '');
}

document.addEventListener("DOMContentLoaded", async () => {
    // Load the studios data
    const data = await loadStudiosData();
    console.log('Loaded data:', data);
    if (!data || !Array.isArray(data)) {
        const statesContainer = document.getElementById("states-list");
        if (statesContainer) {
            statesContainer.innerHTML = "<p>Error loading states data. Please try again later.</p>";
        }
        return;
    }

    const statesContainer = document.getElementById("states-list");
    if (!statesContainer) {
        console.error("States list container not found.");
        return;
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

    // Update total states count
    const totalStates = data.length;
    const statesCountElement = document.querySelector('.section-header p');
    if (statesCountElement) {
        statesCountElement.textContent = `Explore pilates locations across ${totalStates} states`;
    }

    // Sort states alphabetically and build cards
    data.sort((a, b) => a.state.localeCompare(b.state)).forEach(state => {
        // Count occurrences of each criterion
        const criteriaCounts = {};
        state.studios.forEach(studio => {
            Object.entries(studio.criteria).forEach(([key, value]) => {
                if (criteriaEmojis[key] && value) {
                    criteriaCounts[key] = (criteriaCounts[key] || 0) + 1;
                }
            });
        });

        // Sort criteria by count and select the top 3
        const criteriaWithCounts = Object.entries(criteriaCounts)
            .sort((a, b) => b[1] - a[1])
            .slice(0, 3)
            .map(([key, count]) => ({
                name: key,
                count,
                emoji: criteriaEmojis[key]
            }));

        // Create the state card
        const stateCard = document.createElement("a");
        stateCard.classList.add("state-card");
        stateCard.href = `/cities?state=${encodeURIComponent(state.state)}`;
        stateCard.innerHTML = `
            <h3>${state.state.replace(/[\\[\\]]/g, '')}</h3>
            <p>${state.studios.length} pilates studios</p>
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