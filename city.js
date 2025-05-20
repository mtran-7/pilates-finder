import { loadStudiosData } from './global.js';

function toKebabCase(str) {
    return str ? str.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '') : '';
}

function getUrlParameters() {
    // Check query parameters first
    const urlParams = new URLSearchParams(window.location.search);
    let state = urlParams.get('state');

    // If not found in query params, try to extract from path
    if (!state) {
        const pathParts = window.location.pathname.split('/').filter(Boolean);
        if (pathParts.length >= 1) {
            state = decodeURIComponent(pathParts[0]);
        }
    }

    return { state };
}

async function populateStateCities() {
    const data = await loadStudiosData();
    if (!data || !Array.isArray(data)) {
        document.getElementById("state-cities").innerHTML = "<p>Error loading data. Please try again later.</p>";
        return;
    }

    // Get state from URL
    const { state: stateName } = getUrlParameters();

    if (!stateName) {
        console.error('State parameter missing');
        // Redirect to states page
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
            // You might want to add city images later
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
        
        // Build the city URL using clean URLs
        const cityUrl = `/${toKebabCase(stateName)}/${toKebabCase(city.name)}`;

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

document.addEventListener("DOMContentLoaded", async () => {
    // Get state and city from URL query parameters instead of path
    const urlParams = new URLSearchParams(window.location.search);
    const state = urlParams.get('state');
    const city = urlParams.get('city');
    
    console.log('State:', state, 'City:', city);

    // Load the studios data
    const data = await loadStudiosData();
    
    if (!data || !Array.isArray(data)) {
        document.getElementById("studios-list").innerHTML = "<p>Error loading data</p>";
        return;
    }

    // Find matching state and city
    const stateData = data.find(s => s.state === state);
    if (!stateData) {
        document.getElementById("studios-list").innerHTML = `<p>No studios found in ${state}</p>`;
        return;
    }

    populateStateCities();
});