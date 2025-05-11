import { loadStudiosData } from '/global.js';

function toKebabCase(str) {
    return str ? str.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '') : '';
}

document.addEventListener("DOMContentLoaded", async () => {
    // Load the studios data
    const data = await loadStudiosData();
    console.log('Loaded data:', data); // Debug
    if (!data || !Array.isArray(data)) {
        document.getElementById("cities-list").innerHTML = "<p>Error loading data. Please try again later.</p>";
        return;
    }

    // Get state from URL path
    const stateName = window.location.pathname.split('/')[1] || '';
    const cleanStateName = decodeURIComponent(stateName).replace(/[\[\]]/g, '');
    console.log('Extracted stateName:', stateName, 'Clean stateName:', cleanStateName); // Debug

    // Update page titles
    if (cleanStateName) {
        document.querySelector('.hero-content h1').textContent = `Pilates Studios in ${cleanStateName}`;
        document.querySelector('.hero-content p').textContent = `Discover the best pilates studios in ${cleanStateName} with our comprehensive directory`;
        document.querySelector('.section-header h2').textContent = `Cities in ${cleanStateName}`;
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

    const citiesList = document.getElementById("cities-list");
    if (!citiesList) {
        console.error("Cities list container not found.");
        return;
    }

    // Find the state data, handling case mismatch
    const stateData = data.find(state => toKebabCase(state.state) === toKebabCase(stateName));
    console.log('State data found:', stateData); // Debug
    if (!stateData) {
        citiesList.innerHTML = `<p>${cleanStateName || 'State'} not found.</p>`;
        return;
    }

    const cities = {};
    stateData.studios.forEach(studio => {
        if (!cities[studio.city]) {
            cities[studio.city] = {
                name: studio.city,
                totalStudios: 0,
                criteria: new Set()
            };
        }
        cities[studio.city].totalStudios++;
        Object.entries(studio.criteria).forEach(([key, value]) => {
            if (value) cities[studio.city].criteria.add(key);
        });
    });

    const totalCities = Object.keys(cities).length;
    document.querySelector('.section-header p').textContent = 
        `Explore pilates locations across ${totalCities} cities in ${cleanStateName || 'this state'}`;

    Object.values(cities).forEach(city => {
        const cityCard = document.createElement("a");
        cityCard.classList.add("city-card");
        cityCard.href = `/${toKebabCase(stateName)}/${toKebabCase(city.name)}`;

        const cityStudios = stateData.studios.filter(s => s.city === city.name);
        
        const criteriaWithCounts = Array.from(city.criteria).map(criterion => ({
            name: criterion,
            count: cityStudios.filter(studio => studio.criteria[criterion]).length
        }));

        cityCard.innerHTML = `
            <div class="city-card-inner">
                <h3>${city.name}</h3>
                <p>${city.totalStudios} pilates locations</p>
                <div class="criteria">
                    ${criteriaWithCounts
                        .slice(0, 3)
                        .map(({name, count}) => 
                            `<div class="criteria-item">
                                <span class="emoji">${criteriaEmojis[name] || ''}</span>
                                <span class="name">${name.replace('_', ' ')}</span>
                                <span class="count">(${count})</span>
                            </div>`
                        )
                        .join("")}
                </div>
            </div>
        `;
        citiesList.appendChild(cityCard);
    });
});