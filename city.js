import { loadStudiosData, studioCardHtml } from './global.js';

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

    cityStudiosContainer.innerHTML = cityStudios
        .map(studio => studioCardHtml(studio, stateName))
        .join('');
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
