import { loadStudiosData } from './global.js';

function toKebabCase(str) {
    return str ? str.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '') : '';
}

async function populateStudioDetails() {
    const data = await loadStudiosData();
    if (!data || !Array.isArray(data)) {
        document.getElementById("city-studios").innerHTML = "<p>Error loading data. Please try again later.</p>";
        return;
    }

    let stateName = '';
    let cityName = '';

    // Check path parameters first
    const pathParts = window.location.pathname.split('/').filter(Boolean);
    if (pathParts.length >= 2) {
        stateName = decodeURIComponent(pathParts[0]);
        cityName = decodeURIComponent(pathParts[1]);
    }

    // Fall back to query parameters if path parameters are not found
    const urlParams = new URLSearchParams(window.location.search);
    if (!stateName && urlParams.get('state')) {
        stateName = decodeURIComponent(urlParams.get('state'));
    }
    if (!cityName && urlParams.get('city')) {
        cityName = decodeURIComponent(urlParams.get('city'));
    }

    // Update city name in all places including hero section
    document.querySelectorAll('.city-name').forEach(el => {
        el.textContent = cityName || '[City Name]';
    });

    // Find the state data, handling case mismatch
    const stateData = data.find(state => toKebabCase(state.state) === toKebabCase(stateName));
    if (!stateData) {
        document.getElementById("city-studios").innerHTML = `<p>${stateName || 'State'} not found.</p>`;
        return;
    }

    const cityStudiosContainer = document.getElementById("city-studios");
    const cityStudios = stateData.studios.filter(studio => toKebabCase(studio.city) === toKebabCase(cityName));

    if (cityStudios.length === 0) {
        cityStudiosContainer.innerHTML = `<p>No studios found in ${cityName || 'this city'}.</p>`;
        return;
    }

    renderStudioCards(cityStudios, stateName);
    setupFilters();
}

function renderStudioCards(cityStudios, stateName) {
    const cityStudiosContainer = document.getElementById("city-studios");
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

    const criteriaCounts = {};
    cityStudios.forEach(studio => {
        Object.entries(studio.criteria || {}).forEach(([key, value]) => {
            if (value) {
                criteriaCounts[key] = (criteriaCounts[key] || 0) + 1;
            }
        });
    });

    document.querySelectorAll('.filter-btn').forEach(button => {
        const criteria = button.dataset.criteria;
        const count = criteriaCounts[criteria] || 0;
        const [emoji, name] = button.textContent.split(' ');
        button.innerHTML = `
            ${emoji}
            <span class="filter-name">${name}</span>
            <span class="filter-count">(${count})</span>
        `;
    });

    cityStudios.forEach(studio => {
        const studioCard = document.createElement("a");
        studioCard.classList.add("studio-card");
        studioCard.href = `/${toKebabCase(stateName)}/${toKebabCase(studio.city)}/${toKebabCase(studio.name)}`;

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

        studioCard.innerHTML = `
            <div class="studio-image">
                <img src="${studio.photo_url || './assets/default-studio.jpg'}" alt="${studio.name}" 
                     onerror="this.src='./assets/default-studio.jpg'">
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
                    .map(([key]) => `<span class="criteria-badge city-criteria">${criteriaEmojis[key]}</span>`)
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
    const filterButtons = document.querySelectorAll('.filter-btn');
    filterButtons.forEach(button => {
        button.addEventListener('click', function() {
            this.classList.toggle('active');
            filterStudios();
        });
    });
}

function filterStudios() {
    const activeFilters = Array.from(document.querySelectorAll('.filter-btn.active'))
        .map(btn => btn.dataset.criteria);

    const studioCards = document.querySelectorAll('.studio-card');
    studioCards.forEach(card => {
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
    populateStudioDetails();
});