import { loadStudiosData } from './global.js';

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

function normalizeString(str) {
    return str ? str.toLowerCase().trim() : '';
}

document.addEventListener("DOMContentLoaded", async () => {
    const container = document.getElementById("cities-list");
    const stateName = new URLSearchParams(window.location.search).get('state');

    if (!stateName) {
        window.location.href = '/states';
        return;
    }

    const data = await loadStudiosData();
    if (!data || !Array.isArray(data)) {
        container.innerHTML = "<p>Error loading data. Please try again later.</p>";
        return;
    }

    const stateData = data.find(s => normalizeString(s.state) === normalizeString(stateName));
    if (!stateData) {
        container.innerHTML = `<p>${stateName} not found.</p>`;
        return;
    }

    const displayName = stateData.state;
    document.title = `Pilates Finder - ${displayName}`;
    document.querySelector('.hero-content h1').textContent = `Pilates Studios in ${displayName}`;
    document.querySelector('.hero-content p').textContent =
        `Discover the best pilates studios in ${displayName} with our comprehensive directory`;
    document.querySelector('.section-header h2').textContent = `Cities in ${displayName}`;

    // Group studios by city and tally criteria
    const cityMap = {};
    stateData.studios.forEach(studio => {
        if (!cityMap[studio.city]) {
            cityMap[studio.city] = { name: studio.city, totalStudios: 0, criteriaCounts: {} };
        }
        const entry = cityMap[studio.city];
        entry.totalStudios++;
        Object.entries(studio.criteria || {}).forEach(([key, value]) => {
            if (value && criteriaEmojis[key]) {
                entry.criteriaCounts[key] = (entry.criteriaCounts[key] || 0) + 1;
            }
        });
    });

    const cities = Object.values(cityMap).sort((a, b) => a.name.localeCompare(b.name));
    document.querySelector('.section-header p').textContent =
        `Explore pilates locations across ${cities.length} cities in ${displayName}`;

    cities.forEach(city => {
        const topCriteria = Object.entries(city.criteriaCounts)
            .sort((a, b) => b[1] - a[1])
            .slice(0, 3);

        const card = document.createElement('a');
        card.classList.add('city-card');
        card.href = `/city?state=${encodeURIComponent(displayName)}&city=${encodeURIComponent(city.name)}`;
        card.innerHTML = `
            <h3>${city.name}</h3>
            <p>${city.totalStudios} pilates ${city.totalStudios === 1 ? 'location' : 'locations'}</p>
            <div class="criteria">
                ${topCriteria.map(([key, count]) => `
                    <div class="criteria-item">
                        <span class="emoji">${criteriaEmojis[key]}</span>
                        <span class="name">${key.replace('_', ' ')}</span>
                        <span class="count">(${count})</span>
                    </div>`).join('')}
            </div>
        `;
        container.appendChild(card);
    });
});
