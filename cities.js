import { loadStudiosData } from './global.js';

function toKebabCase(str) {
    return str ? str.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '') : '';
}

function getUrlParameters() {
    const urlParams = new URLSearchParams(window.location.search);
    const state = urlParams.get('state');
    return { state };
}

async function populateStateCities() {
    const data = await loadStudiosData();
    if (!data || !Array.isArray(data)) {
        document.getElementById("state-cities").innerHTML = "<p>Error loading data. Please try again later.</p>";
        return;
    }

    // Get state from URL query parameters
    const { state: stateName } = getUrlParameters();

    if (!stateName) {
        console.error('State parameter missing');
        window.location.href = '/states';
        return;
    }

    // Update all elements with the state-name class
    document.querySelectorAll('.state-name').forEach(el => {
        el.textContent = stateName;
    });

    // Update page title
    document.title = `Pilates Finder - ${stateName}`;

    // Process and display city data
    const stateData = data.find(state => toKebabCase(state.state) === toKebabCase(stateName));
    if (!stateData) {
        document.getElementById("state-cities").innerHTML = `<p>${stateName} not found.</p>`;
        return;
    }

    // Get unique cities from the studios
    const uniqueCities = [...new Set(stateData.studios.map(studio => studio.city))];
    
    // Create city objects with studio counts
    const cities = uniqueCities.map(cityName => {
        const studioCount = stateData.studios.filter(studio => studio.city === cityName).length;
        return {
            name: cityName,
            studioCount: studioCount,
            imageUrl: `/assets/cities/${toKebabCase(cityName)}.jpg` 
        };
    });

    renderCities(cities, stateName);
}

function renderCities(cities, stateName) {
    const stateContainer = document.getElementById('state-cities');
    stateContainer.innerHTML = '';

    if (!cities || cities.length === 0) {
        stateContainer.innerHTML = `
            <div class="no-cities">
                <p>No cities with studios found in ${stateName}.</p>
            </div>
        `;
        return;
    }

    cities.forEach(city => {
        const cityElement = document.createElement('div');
        cityElement.className = 'city-card';
        
        // Build the city URL using query parameters
        const cityUrl = `/city?state=${encodeURIComponent(stateName)}&city=${encodeURIComponent(city.name)}`;

        cityElement.innerHTML = `
            <div class="city-image">
                <img src="${city.imageUrl || '/assets/city-placeholder.jpg'}" alt="${city.name}"
                     onerror="this.src='/assets/city-placeholder.jpg'">
            </div>
            <div class="city-info">
                <h3><a href="${cityUrl}">${city.name}</a></h3>
                <p>${city.studioCount} Pilates ${city.studioCount === 1 ? 'studio' : 'studios'}</p>
                <a href="${cityUrl}" class="btn-view">Explore Studios</a>
            </div>
        `;
        
        stateContainer.appendChild(cityElement);
    });
}

document.addEventListener("DOMContentLoaded", () => {
    populateStateCities();
});