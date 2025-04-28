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

document.addEventListener("DOMContentLoaded", async () => {
    await loadStudiosData();

    const urlParams = new URLSearchParams(window.location.search);
    const stateName = urlParams.get("state");
    const cleanStateName = decodeURIComponent(stateName).replace(/[\[\]]/g, '');

    // Update page titles
    document.querySelector('.hero-content h1').textContent = `Pilates Studios in ${cleanStateName}`;
    document.querySelector('.hero-content p').textContent = `Discover the best pilates studios in ${cleanStateName} with our comprehensive directory`;
    document.querySelector('.section-header h2').textContent = `Cities in ${cleanStateName}`;

    const stateData = allStudiosData.find(state => state.state === stateName);
    if (!stateData) {
        document.getElementById("cities-list").innerHTML = "<p>State not found.</p>";
        return;
    }

    const citiesList = document.getElementById("cities-list");
    const cities = {};

    // Group studios by city
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

    // Update total cities count
    const totalCities = Object.keys(cities).length;
    document.querySelector('.section-header p').textContent = 
        `Explore pilates locations across ${totalCities} cities in ${cleanStateName}`;

    // Update the city card creation part
    Object.values(cities).forEach(city => {
        const cityCard = document.createElement("a");
        cityCard.classList.add("city-card");
        cityCard.href = `city.html?state=${encodeURIComponent(stateName)}&city=${encodeURIComponent(city.name)}`;
        
        // Convert criteria Set to array and count occurrences
        const criteriaWithCounts = Array.from(city.criteria).map(criterion => ({
            name: criterion,
            count: stateData.studios.filter(studio => 
                studio.city === city.name && studio.criteria[criterion]
            ).length
        }));

        cityCard.innerHTML = `
            <h3>${city.name}</h3>
            <p>${city.totalStudios} pilates locations</p>
            <div class="criteria">
                ${criteriaWithCounts
                    .slice(0, 3)
                    .map(({name, count}) => 
                        `<div class="criteria-item">${criteriaEmojis[name] || ''} ${name.replace('_', ' ')} (${count})</div>`
                    )
                    .join("")}
            </div>
        `;
        citiesList.appendChild(cityCard);
    });
});
