document.addEventListener('DOMContentLoaded', async () => {
    await loadStudiosData();

    // Get studio info from URL query parameters
    const params = new URLSearchParams(window.location.search);
    const stateParam = params.get('state');
    const cityParam = params.get('city');
    const studioParam = params.get('name');

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
        <a href="/">Home</a> <span> > </span> 
        <a href="/states">States</a> <span> > </span> 
        <a href="/cities?state=${encodeURIComponent(stateParam)}">${stateParam}</a> <span> > </span>
        <a href="/city?state=${encodeURIComponent(stateParam)}&city=${encodeURIComponent(cityParam)}">${cityParam}</a> <span> > </span>
        ${studio.name}
    `;

    updateStudioContent(studio);
    
    // Update related studios to use query parameters
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
            badge.setAttribute('title', key);
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
    
    featuresContainer.parentNode.insertBefore(aboutSection, featuresContainer.nextSibling);

    // Contact Info
    if (studio.website) {
        const websiteLink = document.getElementById('studio-website');
        websiteLink.href = studio.website;
        websiteLink.textContent = 'Visit Website';
    }

    // Hours formatting
    const hoursContainer = document.getElementById('studio-hours');
    if (studio.opening_hours) {
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

    // Image
    const studioImage = document.getElementById('studio-image');
    studioImage.src = studio.photo_url || '/assets/default-studio.jpg';
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
        <a href="/studio?state=${encodeURIComponent(stateName)}&city=${encodeURIComponent(studio.city)}&name=${encodeURIComponent(studio.name)}" class="studio-card">
            <div class="studio-image">
                <img src="${studio.photo_url || '/assets/default-studio.jpg'}" alt="${studio.name}">
                <div class="rating-container">
                    ⭐ ${studio.rating || "N/A"} (${studio.number_of_reviews || 0})
                </div>
            </div>
            <div class="studio-info">
                <h3>${studio.name}</h3>
                <div class="studio-type">${studio.criteria?.Reformer ? 'Reformer Pilates' : 'Traditional Pilates'}</div>
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

function updateMetadata(studio) {
    // Update page title and meta description
    document.title = `${studio.name} - Pilates Studio in ${studio.city} | Pilates Finder`;
    const metaDescription = document.querySelector('meta[name="description"]');
    if (metaDescription) {
        metaDescription.content = 
            `${studio.name} offers ${Object.keys(studio.criteria || {}).filter(k => studio.criteria[k]).join(', ')} ` +
            `Pilates classes in ${studio.city}. ${studio.rating} stars from ${studio.number_of_reviews} reviews.`;
    }

    // Update Open Graph tags
    const ogTitle = document.querySelector('meta[property="og:title"]');
    if (ogTitle) ogTitle.content = `${studio.name} - Pilates Studio in ${studio.city}`;
    
    const ogDescription = document.querySelector('meta[property="og:description"]');
    if (ogDescription) ogDescription.content = metaDescription?.content;
    
    const ogImage = document.querySelector('meta[property="og:image"]');
    if (ogImage) ogImage.content = studio.photo_url || '/assets/default-studio.jpg';

    // Update Schema.org data
    const schemaScript = document.createElement('script');
    schemaScript.type = 'application/ld+json';
    const schemaData = {
        "@context": "https://schema.org",
        "@type": "FitnessCenter",
        "name": studio.name,
        "image": studio.photo_url || '/assets/default-studio.jpg',
        "address": {
            "@type": "PostalAddress",
            "streetAddress": studio.address,
            "addressLocality": studio.city,
            "addressRegion": studio.state
        },
        "aggregateRating": {
            "@type": "AggregateRating",
            "ratingValue": studio.rating || 0,
            "reviewCount": studio.number_of_reviews || 0
        }
    };
    schemaScript.textContent = JSON.stringify(schemaData);
    document.head.appendChild(schemaScript);
}