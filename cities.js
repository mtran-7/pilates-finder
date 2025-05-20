import { loadStudiosData } from './global.js';

function normalizeString(str) {
    return str ? str.toLowerCase().trim() : '';
}

function getUrlParameters() {
    const urlParams = new URLSearchParams(window.location.search);
    const state = urlParams.get('state');
    console.log('URL Parameters - State:', state);
    return { state };
}

async function populateStateCities() {
    console.log('Starting to populate state cities...');
    const data = await loadStudiosData();
    console.log('Data received from loadStudiosData:', data);
    if (!data || !Array.isArray(data)) {
        console.error('No valid data received');
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
    console.log('Looking for state:', stateName);
    const stateData = data.find(state => normalizeString(state.state) === normalizeString(stateName));
    console.log('State data found:', stateData);
    if (!stateData) {
        document.getElementById("state-cities").innerHTML = `<p>${stateName} not found.</p>`;
        return;
    }

    // Get unique cities from the studios
    const uniqueCities = [...new Set(stateData.studios.map(studio => studio.city))];
    console.log('Unique cities:', uniqueCities);
    
    // Create city objects with studio counts
    const cities = uniqueCities.map(cityName => {
        const studioCount = stateData.studios.filter(studio => studio.city === cityName).length;
        return {
            name: cityName,
            studioCount: studioCount,
            imageUrl: `/assets/cities/${normalizeString(cityName).replace(/\s+/g, '-')}.jpg`
        };
    });
    console.log('Cities to render:', cities);

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