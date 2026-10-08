// ==========================
// GLOBAL VARIABLES & FUNCTIONS
// ==========================
let allStudiosData = null; // Global variable to store the data

// Function to load data from pilates_studios.json
async function loadStudiosData() {
    try {
        const response = await fetch("pilates_studios.json");
        if (!response.ok) throw new Error("Failed to load data");
        const flatData = await response.json();

        // Group studios by state
        const groupedData = flatData.reduce((acc, studio) => {
            const state = studio.State;
            if (!acc[state]) {
                acc[state] = { state, studios: [] };
            }
            acc[state].studios.push({
                name: studio.Name,
                city: studio.City,
                address: studio.Address,
                rating: studio.Rating,
                number_of_reviews: studio["Number of Reviews"],
                phone: studio.Phone,
                opening_hours: studio["Opening Hours"].split("\n"), // Convert string to array
                website: studio.Website,
                photo_url: studio["Photo URL"],
                criteria: {
                    Reformer: studio.Reformer,
                    Mat: studio.Mat,
                    Barre: studio.Barre,
                    Online: studio.Online,
                    Private: studio.Private,
                    Group: studio.Group,
                    Tower: studio.Tower,
                    Free_Trial: studio["Free Trial"]
                }
            });
            return acc;
        }, {});

        // Convert grouped data to an array
        allStudiosData = Object.values(groupedData);
        console.log("Data loaded and grouped successfully:", allStudiosData);
    } catch (error) {
        console.error("Error loading pilates_studios.json:", error);
        document.body.innerHTML = "<p>Unable to load studio data. Please try again later.</p>";
    }
}

// Helper function to map criteria to emojis
function getEmojiForCriteria(criteria) {
    const emojiMap = {
        Reformer: "🏋️‍♀️",
        Mat: "🟦",
        Private: "🔒",
        Group: "👥",
        Online: "🌐",
        Free_Trial: "🎟️"
    };
    return emojiMap[criteria] || "✔️"; // Default icon if not found
}

// Function to populate criteria with icons and counts
function populateCriteria(criteriaCounts, container) {
    container.innerHTML = ""; // Clear existing content
    Object.entries(criteriaCounts).forEach(([criterion, count]) => {
        const criteriaItem = document.createElement("div");
        criteriaItem.classList.add("criteria-item");
        criteriaItem.innerHTML = `
            <span class="criteria-icon">${getEmojiForCriteria(criterion)}</span>
            ${criterion} (${count})
        `;
        container.appendChild(criteriaItem);
    });
}

// Function to update the hero section header and validate state data
function updateHeroAndValidateState(stateName, cityName = null) {
    const page = document.body.getAttribute("data-page"); // Get the current page type
    const heroHeader = document.querySelector(".hero-section h1");
    const heroSubheader = document.querySelector(".hero-section p");

    if (heroHeader) {
        // Update the hero section header based on the page type
        if (page === "cities") {
            heroHeader.textContent = `Pilates Studios in ${stateName}`;
            if (heroSubheader) {
                heroSubheader.textContent = `Discover the best pilates studios in ${stateName} with our comprehensive directory`;
            }
        } else if (page === "city") {
            heroHeader.textContent = `Pilates Studios in ${cityName}`;
            if (heroSubheader) {
                heroSubheader.textContent = `Explore the top pilates studios in ${cityName} and find your perfect fit`;
            }
        }
    }

    const stateData = allStudiosData.find(state => state.state === stateName);
    if (!stateData) {
        const errorContainer = cityName
            ? document.querySelector(".studio-details")
            : document.getElementById("cities-list");
        if (errorContainer) {
            errorContainer.innerHTML = "<p>State not found.</p>";
        } else {
            console.error("Error: .studio-details element not found in the DOM.");
        }
        return null; // Return null to indicate that state data is invalid
    }

    if (cityName) {
        const cityStudios = stateData.studios.filter(studio => studio.city === cityName);
        if (cityStudios.length === 0) {
            const errorContainer = document.querySelector(".studio-details");
            if (errorContainer) {
                errorContainer.innerHTML = "<p>No studios found for this city.</p>";
            }
            return null; // Return null to indicate that city data is invalid
        }
        return { stateData, cityStudios }; // Return both state and city data
    }

    return { stateData }; // Return only state data if cityName is not provided
}

// ==========================
// INDEX.HTML
// ==========================
function filterStudios() {
    const input = document.querySelector(".search-bar").value.toLowerCase();
    console.log("Search input:", input); // Log the input value
    const filtered = studios.filter(studio =>
        studio.city.toLowerCase().includes(input) ||
        studio.type.toLowerCase().includes(input) ||
        studio.name.toLowerCase().includes(input)
    );
    displayResults(filtered);
}

function displayResults(results) {
    console.log("Filtered results:", results); // Log the filtered results
    const resultsSection = document.getElementById("results");
    resultsSection.innerHTML = ""; // Clear previous results

    if (results.length === 0) {
        resultsSection.innerHTML = "<p>No results found. Please try again.</p>";
        return;
    }

    results.forEach(studio => {
        const card = document.createElement("div");
        card.className = "studio-card";

        card.innerHTML = `
            <h3>${studio.name}</h3>
            <p><strong>City:</strong> ${studio.city}</p>
            <p><strong>Type:</strong> ${studio.type}</p>
            <p><strong>Price:</strong> ${studio.price}</p>
            <p><strong>Free Trial:</strong> ${studio.freeTrial ? "Yes" : "No"}</p>
        `;

        resultsSection.appendChild(card);
    });
}

document.addEventListener("DOMContentLoaded", () => {
    const searchBar = document.querySelector(".search-bar");
    const searchButton = document.querySelector(".search-button");

    if (searchBar) {
        searchBar.addEventListener("input", filterStudios);
    } else {
        console.log("No .search-bar element found. Skipping search functionality.");
    }

    if (searchButton) {
        searchButton.addEventListener("click", filterStudios);
    }
});

// ==========================
// STATES.HTML
// ==========================
document.addEventListener("DOMContentLoaded", async () => {
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

    // Load the studios data
    let allStudiosData = [];
    try {
        const response = await fetch("pilates_studios.json");
        allStudiosData = await response.json();
    } catch (error) {
        console.error("Failed to load pilates_studios.json:", error);
        return;
    }

    // Group studios by state
    const groupedByState = allStudiosData.reduce((acc, studio) => {
        const state = studio.State;
        if (!acc[state]) {
            acc[state] = [];
        }
        acc[state].push(studio);
        return acc;
    }, {});

    // Process each state
    Object.entries(groupedByState).forEach(([state, studios]) => {
        // Count occurrences of each criterion
        const criteriaCounts = {};
        studios.forEach(studio => {
            Object.entries(studio).forEach(([key, value]) => {
                if (criteriaEmojis[key] && value) {
                    criteriaCounts[key] = (criteriaCounts[key] || 0) + 1;
                }
            });
        });

        // Sort criteria by count and select the top 3
        const topCriteria = Object.entries(criteriaCounts)
            .sort((a, b) => b[1] - a[1]) // Sort by count in descending order
            .slice(0, 3) // Take the top 3
            .map(([criterion, count]) => ({
                criterion,
                count,
                emoji: criteriaEmojis[criterion] || ""
            }));

        // Create the state card
        const stateCard = document.createElement("a");
        stateCard.classList.add("state-card");
        stateCard.href = `cities.html?state=${encodeURIComponent(state)}`;
        stateCard.innerHTML = `
            <h3>${state}</h3>
            <p>${studios.length} pilates studios</p>
            <div class="criteria">
                ${topCriteria
                    .map(
                        ({ emoji, criterion, count }) =>
                            `<div class="criteria-item">${emoji} ${criterion} (${count})</div>`
                    )
                    .join("")}
            </div>
        `;

        // Append the state card to the container
        statesContainer.appendChild(stateCard);
    });
});

// ==========================
// CITIES.HTML
// ==========================
async function populateCityStudios() {
    await loadStudiosData();
    
    const urlParams = new URLSearchParams(window.location.search);
    const stateName = urlParams.get("state");
    const cityName = urlParams.get("city");

    // Validate state and city data
    const result = updateHeroAndValidateState(stateName, cityName);
    if (!result) return;

    const { stateData, cityStudios } = result;

    // Add filter buttons
    const filtersSection = document.createElement('div');
    filtersSection.className = 'filters-section';
    filtersSection.innerHTML = `
        <h3>Filter by Features</h3>
        <div class="criteria-filters">
            <button class="filter-btn" data-criteria="Reformer">🏋️‍♀️ Reformer</button>
            <button class="filter-btn" data-criteria="Mat">🟦 Mat</button>
            <button class="filter-btn" data-criteria="Private">🔒 Private</button>
            <button class="filter-btn" data-criteria="Group">👥 Group</button>
            <button class="filter-btn" data-criteria="Online">🌐 Online</button>
            <button class="filter-btn" data-criteria="Free_Trial">🎟️ Free Trial</button>
            <button class="filter-btn" data-criteria="Barre">🩰 Barre</button>
            <button class="filter-btn" data-criteria="Tower">🗼 Tower</button>
        </div>
    `;

    const studioListSection = document.querySelector('.studio-list');
    studioListSection.parentNode.insertBefore(filtersSection, studioListSection);

    // Create studio cards
    cityStudios.forEach(studio => {
        const studioCard = document.createElement('div');
        studioCard.className = 'studio-card';
        
        const activeCriteria = Object.entries(studio.criteria)
            .filter(([_, value]) => value)
            .map(([key]) => key);

        studioCard.innerHTML = `
            <div class="rating-container">${studio.rating} ★ (${studio.number_of_reviews} reviews)</div>
            <h3>${studio.name}</h3>
            <div class="criteria">
                ${activeCriteria.map(criterion => 
                    `<div class="criteria-item" data-criteria="${criterion}">
                        ${getEmojiForCriteria(criterion)} ${criterion}
                    </div>`
                ).join('')}
            </div>
        `;
        
        studioListSection.appendChild(studioCard);
    });

    // Set up filtering
    let activeFilters = new Set();
    
    const filterButtons = document.querySelectorAll('.filter-btn');
    filterButtons.forEach(button => {
        button.addEventListener('click', () => {
            const criteria = button.dataset.criteria;
            
            button.classList.toggle('active');
            
            if (activeFilters.has(criteria)) {
                activeFilters.delete(criteria);
            } else {
                activeFilters.add(criteria);
            }
            
            filterStudios();
        });
    });

    function filterStudios() {
        const studioCards = document.querySelectorAll('.studio-card');
        
        studioCards.forEach(card => {
            if (activeFilters.size === 0) {
                card.style.display = '';
                return;
            }

            const studioCriteria = Array.from(card.querySelectorAll('.criteria-item'))
                .map(item => item.dataset.criteria);

            const matchesAllFilters = Array.from(activeFilters)
                .every(filter => studioCriteria.includes(filter));

            card.style.display = matchesAllFilters ? '' : 'none';
        });

        updateVisibleStudiosCount();
    }

    function updateVisibleStudiosCount() {
        const visibleStudios = document.querySelectorAll('.studio-card:not([style*="display: none"])').length;
        const subheader = document.querySelector('.section-header p');
        if (subheader) {
            subheader.textContent = `Showing ${visibleStudios} pilates studios in ${cityName}`;
        }
    }
}

// Update the event listener to use the new function
document.addEventListener("DOMContentLoaded", () => {
    const page = document.body.getAttribute("data-page");
    if (page === "city") {
        populateCityStudios();
    }
});

// ==========================
// CITY.HTML
// ==========================
async function populateStudioDetails() {
    await loadStudiosData(); // Ensure the data is loaded from pilates_studios.json
    const urlParams = new URLSearchParams(window.location.search);
    const stateName = urlParams.get("state");
    const studioCity = decodeURIComponent(urlParams.get("city"));
    const studioName = decodeURIComponent(urlParams.get("name"));
    // Find the state and studio data
    const stateData = allStudiosData.find(state => state.state === stateName);
    if (!stateData) {
        const errorContainer = document.querySelector(".studio-details");
        if (errorContainer) {
            errorContainer.innerHTML = "<p>State not found.</p>";
        } else {
            console.error("Error: .studio-details element not found in the DOM.");
        }
        return;
    }
    const studioData = stateData.studios.find(
        studio => studio.name === studioName && studio.city === studioCity
    );
    if (!studioData) {
        document.querySelector(".studio-details").innerHTML = "<p>Studio not found.</p>";
        return;
    }
    // Update breadcrumb links
    document.getElementById("state-link").textContent = stateName;
    document.getElementById("state-link").href = `cities.html?state=${encodeURIComponent(stateName)}`;
    document.getElementById("city-link").textContent = studioCity;
    document.getElementById("city-link").href = `city.html?state=${encodeURIComponent(stateName)}&city=${encodeURIComponent(studioCity)}`;
    document.getElementById("studio-name-breadcrumb").textContent = studioData.name;
    // Update studio details
    document.getElementById("studio-name").textContent = studioData.name;
    document.getElementById("studio-rating").textContent = `Rating: ${studioData.rating || "Not available"}`;
    document.getElementById("studio-address").textContent = `${studioData.city}, ${studioData.state}`;
    document.getElementById("studio-about").textContent = `${studioData.name} is a Pilates studio located in ${studioData.city}, ${studioData.state}.`;
    // Populate criteria
    const criteriaContainer = document.getElementById("studio-criteria");
    Object.entries(studioData.criteria).forEach(([key, value]) => {
        if (value) {
            const criteriaItem = document.createElement("div");
            criteriaItem.classList.add("criteria-item");
            criteriaItem.textContent = key;
            criteriaContainer.appendChild(criteriaItem);
        }
    });
    // Populate opening hours
    const hoursList = document.getElementById("hours-list");
    studioData.opening_hours.forEach(hour => {
        const li = document.createElement("li");
        li.textContent = hour;
        hoursList.appendChild(li);
    });
    // Populate contact information
    document.getElementById("studio-phone").textContent = studioData.phone || "Not available";
    document.getElementById("studio-phone").href = `tel:${studioData.phone || ""}`;
    document.getElementById("studio-website").href = studioData.website || "#";
    // Populate reviews
    const reviewsList = document.getElementById("reviews-list");
    studioData.reviews.forEach(review => {
        const li = document.createElement("li");
        li.innerHTML = `
            <strong>${review.author_name || "Anonymous"}</strong> (${review.rating || "N/A"}/5): ${review.text}
        `;
        reviewsList.appendChild(li);
    });
    const studioPhoto = document.getElementById("studio-photo");
    if (studioData.photo_url) {
        studioPhoto.src = studioData.photo_url;
        studioPhoto.alt = `${studioData.name} Photo`;
    } else {
        studioPhoto.style.display = "none"; // Hide photo if not available
    }
}

// Event listeners for different pages
document.addEventListener("DOMContentLoaded", () => {
    const page = document.body.getAttribute("data-page");
    if (page === "states") {
        populateStatesList();
    } else if (page === "city") {
        populateCityStudios();
    } else if (page === "studio") {
        populateStudioDetails();
    }
});

document.addEventListener("DOMContentLoaded", async () => {
    await loadStudiosData();
    const urlParams = new URLSearchParams(window.location.search);
    const stateName = urlParams.get("state");
    const cityName = urlParams.get("city");
    const stateData = allStudiosData.find(state => state.state === stateName);
    if (!stateData) {
        document.querySelector(".studio-details").innerHTML = "<p>State not found.</p>";
        return;
    }
    const cityStudios = stateData.studios.filter(studio => studio.city === cityName);
    if (cityStudios.length === 0) {
        document.querySelector(".studio-details").innerHTML = "<p>No studios found for this city.</p>";
        return;
    }
    // Populate studio details (existing logic remains unchanged)
});

document.addEventListener("DOMContentLoaded", async () => {
    const featuredCities = [
        { city: "San Diego", state: "California" },
        { city: "Reno", state: "Nevada" },
        { city: "Los Angeles", state: "California" },
        { city: "Miami", state: "Florida" },
        { city: "Wilmington", state: "Delaware" },
        { city: "New York", state: "New York" }
    ];

    const featuredCitiesContainer = document.getElementById("featured-cities-list");
    if (!featuredCitiesContainer) {
        console.error("Error: #featured-cities-list element not found in the DOM.");
        return;
    }

    featuredCities.forEach(({ city, state }) => {
        const cityCard = document.createElement("a");
        cityCard.classList.add("city-card");
        cityCard.href = `city.html?state=${encodeURIComponent(state)}&city=${encodeURIComponent(city)}`;
        cityCard.innerHTML = `
            <h3>${city}</h3>
            <p>Explore Pilates Studios</p>
        `;
        featuredCitiesContainer.appendChild(cityCard);
    });
});

// Example usage for states
document.addEventListener("DOMContentLoaded", async () => {
    await loadStudiosData();

    const statesList = document.getElementById("states-list");
    allStudiosData.forEach(state => {
        const totalStudios = state.studios.length;
        const totalCities = new Set(state.studios.map(studio => studio.city)).size;

        // Calculate criteria counts for the state
        const criteriaCounts = {};
        state.studios.forEach(studio => {
            const studioCriteria = studio.criteria || {}; // Fallback to an empty object if criteria is null or undefined
            Object.entries(studioCriteria).forEach(([criterion, value]) => {
                if (value) {
                    criteriaCounts[criterion] = (criteriaCounts[criterion] || 0) + 1;
                }
            });
        });

        // Create the state card
        const stateCard = document.createElement("div");
        stateCard.classList.add("state-card");
        stateCard.innerHTML = `
            <h3>${state.name}</h3>
            <p>${state.totalStudios} Pilates locations</p>
            <div class="criteria"></div>
        `;
        const criteriaContainer = stateCard.querySelector(".criteria");
        populateCriteria(state.criteriaCounts, criteriaContainer); // Populate criteria with icons and counts
        statesList.appendChild(stateCard);
    });
});

// Example usage for cities
const citiesList = document.querySelector("#cities-list");
allCitiesData.forEach(city => {
    const cityCard = document.createElement("div");
    cityCard.classList.add("city-card");
    cityCard.innerHTML = `
        <h3>${city.name}</h3>
        <p>${city.totalStudios} Pilates locations</p>
        <div class="criteria"></div>
    `;
    const criteriaContainer = cityCard.querySelector(".criteria");
    populateCriteria(city.criteriaCounts, criteriaContainer); // Populate criteria with icons and counts
    citiesList.appendChild(cityCard);
});

// Warn about missing criteria for studios
studios.forEach(studio => {
    const studioCriteria = studio.criteria || {}; // Fallback to an empty object if criteria is null or undefined
    Object.entries(studioCriteria).forEach(([criterion, value]) => {
        if (value) {
            criteriaCounts[criterion] = (criteriaCounts[criterion] || 0) + 1;
        }
    });
});

// ==========================
// STUDIO LIST
// ==========================
document.addEventListener("DOMContentLoaded", async () => {
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

    const studioList = document.querySelector(".studio-list");

    // Example data for studios
    const studios = [
        {
            name: "Studio A",
            criteria: ["Reformer", "Mat", "Online"]
        },
        {
            name: "Studio B",
            criteria: ["Private", "Group", "Barre"]
        }
    ];

    // Populate studio cards
    studios.forEach(studio => {
        const studioCard = document.createElement("div");
        studioCard.classList.add("studio-card");

        studioCard.innerHTML = `
            <h3>${studio.name}</h3>
            <div class="criteria">
                ${studio.criteria
                    .map(
                        criterion =>
                            `<div class="criteria-item">${criteriaEmojis[criterion] || ""} ${criterion}</div>`
                    )
                    .join("")}
            </div>
        `;

        studioList.appendChild(studioCard);
    });
});