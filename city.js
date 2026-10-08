import { loadStudiosData, getStudioOffer } from './global.js';

const criteriaEmojis = {
    Reformer: "🏋️‍♀️",
    Mat: "🟦",
    Private: "🔒",
    Group: "👥",
    Online: "🌐",
    Barre: "🩰",
    Tower: "🗼",
    Free_Trial: "🎟️"
};

function normalizeString(str) {
    return str ? str.toLowerCase().trim() : '';
}

async function populateCityStudios() {
    const container = document.getElementById("city-studios");

    const urlParams = new URLSearchParams(window.location.search);
    const stateName = urlParams.get("state");
    const cityName = urlParams.get("city");

    if (!stateName || !cityName) {
        window.location.href = '/';
        return;
    }

    // Update city name in all places including hero section
    document.querySelectorAll('.city-name').forEach(el => {
        el.textContent = cityName;
    });
    document.title = `Pilates Studios in ${cityName} | Pilates Finder`;

    const data = await loadStudiosData();
    if (!data || !Array.isArray(data)) {
        container.innerHTML = "<p>Error loading data. Please try again later.</p>";
        return;
    }

    const stateData = data.find(state => normalizeString(state.state) === normalizeString(stateName));
    if (!stateData) {
        container.innerHTML = `<p>${stateName} not found.</p>`;
        return;
    }

    const cityStudios = stateData.studios.filter(
        studio => normalizeString(studio.city) === normalizeString(cityName)
    );

    if (cityStudios.length === 0) {
        container.innerHTML = "<p>No studios found for this city.</p>";
        return;
    }

    renderStudioCards(cityStudios, stateData.state);
    setupFilters();
}

function renderStudioCards(cityStudios, stateName) {
    const cityStudiosContainer = document.getElementById("city-studios");

    // Count studios for each criteria
    const criteriaCounts = {};
    cityStudios.forEach(studio => {
        Object.entries(studio.criteria || {}).forEach(([key, value]) => {
            if (value) {
                criteriaCounts[key] = (criteriaCounts[key] || 0) + 1;
            }
        });
    });

    // Update filter buttons with counts
    document.querySelectorAll('.filter-btn').forEach(button => {
        const criteria = button.dataset.criteria;
        const count = criteriaCounts[criteria] || 0;
        const [emoji, ...nameParts] = button.textContent.trim().split(' ');
        button.innerHTML = `
            ${emoji}
            <span class="filter-name">${nameParts.join(' ')}</span>
            <span class="filter-count">(${count})</span>
        `;
    });

    cityStudios.forEach(studio => {
        const studioCard = document.createElement("a");
        studioCard.classList.add("studio-card");
        studioCard.href = `/studio?state=${encodeURIComponent(stateName)}&city=${encodeURIComponent(studio.city)}&name=${encodeURIComponent(studio.name)}`;

        const studioType = studio.criteria?.Reformer ? 'Reformer Pilates' : 'Classical Pilates';
        const reviews = studio.number_of_reviews || 0;

        const activeCriteria = Object.entries(studio.criteria || {})
            .filter(([_, value]) => value)
            .map(([key]) => key.replace('_', ' '))
            .join(', ');

        const fullDescription = `${studio.name} is a ${studioType} studio located in ${studio.city}, ${stateName} ` +
            `with a ${studio.rating || 'N/A'} star rating from ${reviews} reviews. ` +
            `This establishment is offering ${activeCriteria || 'various pilates services'}.`;

        const truncatedDescription = fullDescription.length > 110
            ? fullDescription.substring(0, 109) + '...'
            : fullDescription;

        const offer = getStudioOffer(studio);

        studioCard.innerHTML = `
            <div class="studio-image">
                ${offer ? `<span class="offer-badge">✦ ${offer}</span>` : ''}
                <img src="${studio.photo_url || '/assets/default-studio.jpg'}" alt="${studio.name}"
                     onerror="this.onerror=null;this.src='/assets/default-studio.jpg'">
                <div class="rating-container">
                    ⭐ ${studio.rating || "N/A"} (${reviews})
                </div>
            </div>
            <div class="studio-info">
                <h3>${studio.name}</h3>
                <div class="studio-type">${studioType}</div>
                <div class="criteria">
                    ${Object.entries(studio.criteria || {})
                    .filter(([key, value]) => value)
                    .map(([key]) => `<span class="criteria-badge city-criteria" title="${key}">${criteriaEmojis[key]}</span>`)
                    .join("")}
                </div>
                <p class="description">${truncatedDescription}</p>
                <span class="view-details-link">View details</span>
            </div>
        `;
        cityStudiosContainer.appendChild(studioCard);
    });
}

function setupFilters() {
    document.querySelectorAll('.filter-btn').forEach(button => {
        button.addEventListener('click', function () {
            this.classList.toggle('active');
            filterStudios();
        });
    });
}

function filterStudios() {
    const activeFilters = Array.from(document.querySelectorAll('.filter-btn.active'))
        .map(btn => btn.dataset.criteria);

    document.querySelectorAll('.studio-card').forEach(card => {
        if (activeFilters.length === 0) {
            card.style.display = 'flex';
            return;
        }

        const hasAllFilters = activeFilters.every(filter =>
            card.querySelector(`.criteria-badge[title="${filter}"]`)
        );
        card.style.display = hasAllFilters ? 'flex' : 'none';
    });
}

document.addEventListener("DOMContentLoaded", () => {
    populateCityStudios();
});
