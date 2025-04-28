import studiosData from '../studios.json';

document.addEventListener('DOMContentLoaded', async () => {
    await loadStudiosData();

    const params = new URLSearchParams(window.location.search);
    const stateName = params.get('state');
    const cityName = params.get('city');
    const studioName = params.get('name');
    
    if (!stateName || !cityName || !studioName) {
        showError();
        return;
    }

    // Find the studio from allStudiosData
    const stateData = allStudiosData.find(state => state.state === stateName);
    if (!stateData) {
        showError();
        return;
    }

    const studio = stateData.studios.find(s => 
        s.city === cityName && s.name === studioName
    );

    if (!studio) {
        showError();
        return;
    }

    // Update breadcrumb
    document.getElementById('breadcrumb-path').innerHTML = `
        <a href="index.html">Home</a> <span>&nbsp;&gt;&nbsp;</span> 
        <a href="states.html">States</a> <span>&nbsp;&gt;&nbsp;</span> 
        <a href="cities.html?state=${encodeURIComponent(stateName)}">${stateName}</a> <span>&nbsp;&gt;&nbsp;</span>
        <a href="city.html?state=${encodeURIComponent(stateName)}&city=${encodeURIComponent(cityName)}">${cityName}</a> <span>&nbsp;&gt;&nbsp;</span>
        ${studio.name}
    `;

    updateStudioContent(studio);
    
    // Update related studios to use same URL pattern
    const relatedStudios = stateData.studios
        .filter(s => s.city === cityName && s.name !== studioName)
        .slice(0, 3);
    updateRelatedStudios(relatedStudios, stateName);
    
    document.getElementById('studio-content').hidden = false;
});

function showError() {
    document.getElementById('error-message').hidden = false;
    document.getElementById('studio-content').hidden = true;
}

function updateStudioContent(studio) {
    // Basic Info
    document.getElementById('studio-name').textContent = studio.name;
    
    // Determine studio type based on criteria
    const studioType = studio.criteria?.Reformer ? 'Reformer Pilates' : 'Classical Pilates';
    document.getElementById('studio-type').textContent = studioType;
    document.querySelector('.studio-name-inline').textContent = studio.name;
    
    // Rating and Reviews
    const ratingValue = document.getElementById('rating-value');
    const reviewCount = document.getElementById('review-count');
    ratingValue.textContent = studio.rating || 'N/A';
    reviewCount.textContent = studio.number_of_reviews ? 
        `(${studio.number_of_reviews} reviews)` : '';

    // Location and Contact
    document.getElementById('studio-address').textContent = studio.address;
    if (studio.phone) {
        const phoneLink = document.getElementById('studio-phone');
        phoneLink.href = `tel:${studio.phone}`;
        phoneLink.textContent = studio.phone;
    }
    
    if (studio.website) {
        document.getElementById('studio-website').href = studio.website;
    }

    // Features/Criteria with emojis
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

    const featuresContainer = document.getElementById('studio-features');
    featuresContainer.innerHTML = '';
    Object.entries(studio.criteria || {}).forEach(([key, value]) => {
        if (value) {
            const badge = document.createElement('div');
            badge.className = 'criteria-badge';
            badge.title = key;
            badge.textContent = criteriaEmojis[key] || '';
            featuresContainer.appendChild(badge);
        }
    });

    // Hours formatting
    const hoursContainer = document.getElementById('studio-hours');
    
    if (studio["Opening Hours"] && typeof studio["Opening Hours"] === 'string') {
        const hours = studio["Opening Hours"]
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
    const activeCriteria = Object.entries(studio.criteria || {})
        .filter(([_, value]) => value)
        .map(([key]) => key.replace('_', ' '))
        .join(', ');
    
    const description = `${studio.name} is a ${studioType} studio located in ${studio.city}, ${studio.state} ` +
        `with a ${studio.rating || 'N/A'} star rating from ${studio.number_of_reviews || 0} reviews. ` +
        `This establishment is offering ${activeCriteria || 'various pilates services'}.`;
    
    document.getElementById('studio-description').textContent = description;

    // Image
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
        <a href="studio.html?state=${encodeURIComponent(stateName)}&city=${encodeURIComponent(studio.city)}&name=${encodeURIComponent(studio.name)}" class="studio-card">
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

async function loadStudioPhoto(photoUrl) {
    const heroImage = document.getElementById('studio-image');
    const placeholder = '/public/images/placeholder.webp';
    
    try {
        // Try to get from cache first
        const cache = await caches.open('photo-cache-v1');
        const cachedResponse = await cache.match(photoUrl);
        
        if (cachedResponse) {
            const blob = await cachedResponse.blob();
            heroImage.src = URL.createObjectURL(blob);
        } else {
            // Fallback to network request
            const response = await fetch(photoUrl);
            const blob = await response.blob();
            heroImage.src = URL.createObjectURL(blob);
        }
    } catch (error) {
        console.error('Error loading studio photo:', error);
        heroImage.src = placeholder;
    }
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