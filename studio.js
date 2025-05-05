document.addEventListener('DOMContentLoaded', async () => {
    await loadStudiosData();

    // Get studio info from URL
    const pathParts = window.location.pathname.split('/').filter(Boolean);
    let stateParam, cityParam, studioParam;

    if (pathParts.length === 3) {
        [stateParam, cityParam, studioParam] = pathParts;
        stateParam = decodeURIComponent(stateParam);
        cityParam = decodeURIComponent(cityParam);
        studioParam = decodeURIComponent(studioParam);
    } else {
        const params = new URLSearchParams(window.location.search);
        stateParam = params.get('state');
        cityParam = params.get('city');
        studioParam = params.get('name');
    }

    console.log('Looking for studio:', { stateParam, cityParam, studioParam });
    console.log('Available data:', allStudiosData);

    // Find matching studio
    const stateData = allStudiosData.find(state => 
        state.state.toLowerCase() === stateParam.toLowerCase()
    );

    if (!stateData) {
        console.error('State not found:', stateParam);
        showError();
        return;
    }

    const studio = stateData.studios.find(s => 
        s.city.toLowerCase() === cityParam.toLowerCase() &&
        s.name.toLowerCase() === studioParam.toLowerCase()
    );

    if (!studio) {
        console.error('Studio not found:', { cityParam, studioParam });
        showError();
        return;
    }

    console.log('Found studio:', studio);

    // Update page content
    document.getElementById('studio-name').textContent = studio.name;
    document.getElementById('rating-value').textContent = studio.rating;
    document.getElementById('review-count').textContent = 
        studio.number_of_reviews ? ` (${studio.number_of_reviews} reviews)` : '';
    document.getElementById('studio-address').textContent = studio.address;
    
    // Update hours
    const hoursContainer = document.getElementById('studio-hours');
    if (studio.opening_hours) {
        const hours = studio.opening_hours
            .split('\n')
            .map(day => {
                const [dayName, time] = day.split(': ');
                return `<div class="hours-row">
                    <span class="day">${dayName}</span>
                    <span class="time">${time || 'Closed'}</span>
                </div>`;
            })
            .join('');
        hoursContainer.innerHTML = hours;
    }

    // Update breadcrumb
    document.getElementById('breadcrumb-path').innerHTML = `
        <a href="index.html">Home</a> <span>&nbsp;&gt;&nbsp;</span> 
        <a href="states.html">States</a> <span>&nbsp;&gt;&nbsp;</span> 
        <a href="cities.html?state=${encodeURIComponent(stateParam)}">${stateParam}</a> <span>&nbsp;&gt;&nbsp;</span>
        <a href="city.html?state=${encodeURIComponent(stateParam)}&city=${encodeURIComponent(cityParam)}">${cityParam}</a> <span>&nbsp;&gt;&nbsp;</span>
        ${studio.name}
    `;

    updateStudioContent(studio);
    
    // Update related studios to use same URL pattern
    const relatedStudios = stateData.studios
        .filter(s => s.city === cityParam && s.name !== studioParam)
        .slice(0, 3);
    updateRelatedStudios(relatedStudios, stateParam);
    
    document.getElementById('studio-content').hidden = false;
});

function showError() {
    document.getElementById('error-message').hidden = false;
    document.getElementById('studio-content').hidden = true;
}

function updateStudioContent(studio) {
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

    // Basic Info
    document.getElementById('studio-name').textContent = studio.name;
    
    // Determine studio type based on criteria
    const studioType = studio.criteria.Reformer ? 'Reformer Pilates' : 'Classical Pilates';
    document.getElementById('studio-type').textContent = studioType;
    
    // Rating and Reviews
    document.getElementById('rating-value').textContent = studio.rating || 'N/A';
    document.getElementById('review-count').textContent = 
        studio.number_of_reviews ? ` (${studio.number_of_reviews} reviews)` : '';

    // Features/Criteria
    const featuresContainer = document.getElementById('studio-features');
    featuresContainer.innerHTML = '';
    const activeCriteria = [];

    Object.entries(studio.criteria || {}).forEach(([key, value]) => {
        if (value) {
            const badge = document.createElement('div');
            badge.className = 'criteria-badge';
            badge.setAttribute('title', key); // This matches the CSS selector .criteria-badge[title="Reformer"]
            badge.innerHTML = `
                <span class="emoji">${criteriaEmojis[key]}</span>
            `;
            featuresContainer.appendChild(badge);
            activeCriteria.push(key.replace('_', ' '));
        }
    });

    // Phone number
    const phoneLink = document.getElementById('studio-phone');
    if (studio.phone) {
        const cleanPhone = studio.phone.replace(/\D/g, '');
        phoneLink.href = `tel:${cleanPhone}`;
        phoneLink.textContent = studio.phone;
        phoneLink.parentElement.style.display = 'block';
    } else {
        phoneLink.parentElement.style.display = 'none';
    }

    // Add About section
    const aboutSection = document.createElement('div');
    aboutSection.className = 'about-section';
    aboutSection.innerHTML = `
        <h2>About ${studio.name}</h2>
        <p>${studio.name} is a ${studioType} studio located in ${studio.city}, ${studio.state} 
           with a ${studio.rating || 'N/A'} star rating from ${studio.number_of_reviews || 0} reviews. 
           This establishment is offering ${activeCriteria.join(', ') || 'various pilates services'}.</p>
    `;
    
    // Insert About section after Features
    featuresContainer.parentNode.insertBefore(aboutSection, featuresContainer.nextSibling);

    // Contact Info
    if (studio.phone) {
        const phoneLink = document.getElementById('studio-phone');
        phoneLink.href = `tel:${studio.phone.replace(/\D/g, '')}`;
        phoneLink.textContent = studio.phone;
    }
    
    if (studio.website) {
        const websiteLink = document.getElementById('studio-website');
        websiteLink.href = studio.website;
        websiteLink.textContent = 'Visit Website';
    }

    // Hours formatting
    const hoursContainer = document.getElementById('studio-hours');
    
    if (studio.opening_hours) {  // Changed from "Opening Hours" to opening_hours
        const hours = studio.opening_hours
            .replace(/[\u202f\u2009\u2013]/g, ' ')
            .split('\n')
            .map(day => {
                const [dayName, time] = day.split(': ');
                return `<div class="hours-row">
                    <span class="day">${dayName}</span>
                    <span class="time">${time || 'Closed'}</span>
                </div>`;
            }).join('');
        hoursContainer.innerHTML = hours;
    } else {
        hoursContainer.innerHTML = '<p>Hours not available</p>';
    }

    // Generate formatted description
    const activeCriteriaDesc = Object.entries(studio.criteria || {})
        .filter(([_, value]) => value)
        .map(([key]) => key.replace('_', ' '))
        .join(', ');
    
    const description = `${studio.name} is a ${studioType} studio located in ${studio.city}, ${studio.state} ` +
        `with a ${studio.rating || 'N/A'} star rating from ${studio.number_of_reviews || 0} reviews. ` +
        `This establishment is offering ${activeCriteriaDesc || 'various pilates services'}.`;
    
    document.getElementById('studio-description').textContent = description;

    // Image - Fix photo_url property name
    const studioImage = document.getElementById('studio-image');
    studioImage.src = studio.photo_url || './assets/default-studio.jpg';
    studioImage.alt = studio.name;

    // Social Links
    if (studio.instagram) {
        document.getElementById('instagram-link').href = studio.instagram;
    } else {
        document.getElementById('instagram-link').style.display = 'none';
    }
    
    if (studio.facebook) {
        document.getElementById('facebook-link').href = studio.facebook;
    } else {
        document.getElementById('facebook-link').style.display = 'none';
    }

    updateMetadata(studio);
}

function updateRelatedStudios(studios, stateName) {
    const container = document.getElementById('related-studios');
    container.innerHTML = studios.map(studio => `
        <a href="/${encodeURIComponent(stateName)}/${encodeURIComponent(studio.city)}/${encodeURIComponent(studio.name)}" class="studio-card">
            <div class="studio-image">
                <img src="${studio.photo_url || './assets/default-studio.jpg'}" alt="${studio.name}">
                <div class="rating-container">
                    ⭐ ${studio.rating || "N/A"} (${studio.number_of_reviews || 0})
                </div>
            </div>
            <div class="studio-info">
                <h3>${studio.name}</h3>
                <div class="studio-type">${studio.type || 'Traditional Pilates'}</div>
                <div class="criteria">
                    ${Object.entries(studio.criteria || {})
                        .filter(([key, value]) => value)
                        .map(([key]) => `<span class="criteria-badge" title="${key}">${criteriaEmojis[key]}</span>`)
                        .join("")}
                </div>
                <p class="description">${studio.description || "No description available."}</p>
                <span class="view-details-link">View details</span>
            </div>
        </a>
    `).join('');
}

function addSchemaMarkup(studio) {
    const schema = {
        "@context": "https://schema.org",
        "@type": "FitnessCenter",
        "name": studio.name,
        "address": {
            "@type": "PostalAddress",
            "streetAddress": studio.address,
            "addressLocality": studio.city,
            "addressRegion": studio.state
        },
        "telephone": studio.phone,
        "url": studio.website,
        "aggregateRating": {
            "@type": "AggregateRating",
            "ratingValue": studio.rating || 4.5,
            "reviewCount": studio.reviewCount || 10
        }
    };

    const script = document.createElement('script');
    script.type = 'application/ld+json';
    script.text = JSON.stringify(schema);
    document.head.appendChild(script);
}

function updateMetadata(studio) {
    // Update page title and meta description
    document.title = `${studio.name} - Pilates Studio in ${studio.city} | Pilates Finder`;
    document.getElementById('meta-description').content = 
        `${studio.name} offers ${Object.keys(studio.criteria || {}).filter(k => studio.criteria[k]).join(', ')} ` +
        `Pilates classes in ${studio.city}. ${studio.rating} stars from ${studio.number_of_reviews} reviews.`;
    
    // Update Open Graph tags
    document.getElementById('og-title').content = `${studio.name} - Pilates Studio in ${studio.city}`;
    document.getElementById('og-description').content = document.getElementById('meta-description').content;
    document.getElementById('og-image').content = studio.photo_url;

    // Update Schema.org data
    const schemaData = {
        "@context": "https://schema.org",
        "@type": "FitnessCenter",
        "name": studio.name,
        "image": studio.photo_url,
        "address": {
            "@type": "PostalAddress",
            "streetAddress": studio.address,
            "addressLocality": studio.city,
            "addressRegion": studio.state
        },
        "aggregateRating": {
            "@type": "AggregateRating",
            "ratingValue": studio.rating,
            "reviewCount": studio.number_of_reviews
        }
    };
    document.getElementById('schema-data').textContent = JSON.stringify(schemaData);
}
