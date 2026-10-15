import { loadStudiosData, getStudioOffer, studioCardHtml, CRITERIA_EMOJIS, formatCount } from './global.js';

const criteriaEmojis = CRITERIA_EMOJIS;

document.addEventListener('DOMContentLoaded', async () => {
    const allStudiosData = await loadStudiosData();

    // Get studio info from URL query parameters
    const params = new URLSearchParams(window.location.search);
    const stateParam = params.get('state');
    const cityParam = params.get('city');
    const studioParam = params.get('name');

    if (!allStudiosData || !stateParam || !cityParam || !studioParam) {
        console.error('Missing data or URL parameters:', { stateParam, cityParam, studioParam });
        showError();
        return;
    }

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
        studio.number_of_reviews ? ` (${formatCount(studio.number_of_reviews)} reviews)` : '';

    // Update breadcrumb
    document.getElementById('breadcrumb-path').innerHTML = `
        <a href="/">Home</a> <span> > </span>
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
});

function showError() {
    document.getElementById('error-message').hidden = false;
    document.querySelector('.studio-grid')?.setAttribute('hidden', '');
    document.querySelector('.related-studios-section')?.setAttribute('hidden', '');
}

function updateStudioContent(studio) {
    // Basic Info
    document.getElementById('studio-name').textContent = studio.name;

    // Address links to directions (the raw string is often a Google plus-code)
    const addressLink = document.getElementById('studio-address');
    addressLink.textContent = studio.address || '';
    addressLink.href = (studio.latitude && studio.longitude)
        ? `https://www.google.com/maps/search/?api=1&query=${studio.latitude},${studio.longitude}`
        : `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(`${studio.name} ${studio.city}`)}`;

    // Rating and Reviews
    document.getElementById('rating-value').textContent = studio.rating || 'N/A';
    document.getElementById('review-count').textContent = 
        studio.number_of_reviews ? ` (${formatCount(studio.number_of_reviews)} reviews)` : '';

    // Features/Criteria
    const featuresContainer = document.getElementById('studio-features');
    featuresContainer.innerHTML = '';
    const activeCriteria = [];

    Object.entries(studio.criteria || {}).forEach(([key, value]) => {
        if (value) {
            const badge = document.createElement('div');
            badge.className = 'criteria-badge';
            badge.setAttribute('title', key.replace('_', ' '));
            badge.innerHTML = `
                <span class="emoji">${criteriaEmojis[key]}</span>
            `;
            featuresContainer.appendChild(badge);
        }
    });

    // Pricing: intro offer plus any scraped prices; section stays hidden when nothing is known
    const offer = getStudioOffer(studio);
    const pricingRows = [];
    if (offer) {
        pricingRows.push(`<div class="pricing-offer">✦ ${offer}</div>`);
    }
    // "Rp 570K · 5-pack Rp 2.6M" -> one pill per price point, lead price emphasized
    const priceChips = value => value.split(' · ')
        .map((part, i) => `<span class="price-chip${i === 0 ? ' price-chip-main' : ''}">${part}</span>`)
        .join('');
    const priceRow = (label, value) =>
        `<div class="pricing-row"><span class="pricing-label">${label}</span><span class="pricing-chips">${priceChips(value)}</span></div>`;

    if (Array.isArray(studio.price_details) && studio.price_details.length) {
        // Studios with a full menu carry their breakdown (tiers, packs, memberships)
        studio.price_details.forEach(row => pricingRows.push(priceRow(row.label, row.value)));
    } else {
        // Skip the intro-price row when the offer label already states that price
        const introLabel = studio.price_intro_local || `$${studio.price_intro}`;
        if (studio.price_intro && !(offer && offer.includes(introLabel))) {
            pricingRows.push(priceRow('Intro price', introLabel));
        }
        if (studio.price_single) {
            pricingRows.push(priceRow('Single class', studio.price_single_local || `$${studio.price_single}`));
        }
        if (studio.price_monthly) {
            pricingRows.push(priceRow('Membership', `from $${studio.price_monthly}/month`));
        }
    }
    if (studio.price_source_url && pricingRows.length) {
        pricingRows.push(`<a class="pricing-source" href="${studio.price_source_url}" target="_blank" rel="noopener">See current prices →</a>`);
    }
    if (pricingRows.length) {
        document.getElementById('studio-pricing').innerHTML = pricingRows.join('');
        document.getElementById('pricing-section').hidden = false;
    }

    // Contact: website button, Instagram, WhatsApp (Bali books via WhatsApp), phone
    const isInstagram = url => /instagram\.com/i.test(url || '');
    const instagram = studio.instagram || (isInstagram(studio.website) ? studio.website : null);
    const website = isInstagram(studio.website) ? null : studio.website;

    const websiteBtn = document.getElementById('studio-website');
    if (website || instagram) {
        websiteBtn.href = website || instagram;
        websiteBtn.textContent = website ? 'Visit Website' : 'View Instagram';
        websiteBtn.hidden = false;
    }
    if (instagram && website) {
        document.getElementById('studio-instagram').href = instagram;
        document.getElementById('instagram-item').hidden = false;
    }

    const phoneLink = document.getElementById('studio-phone');
    if (studio.phone) {
        const cleanPhone = studio.phone.replace(/\D/g, '');
        phoneLink.href = `tel:+${cleanPhone}`;
        phoneLink.textContent = studio.phone;
        phoneLink.parentElement.style.display = '';
        // Indonesian mobile numbers (+62 8xx) are WhatsApp numbers in practice
        if (/^628/.test(cleanPhone)) {
            document.getElementById('studio-whatsapp').href = `https://wa.me/${cleanPhone}`;
            document.getElementById('whatsapp-item').hidden = false;
        }
    } else {
        phoneLink.parentElement.style.display = 'none';
    }

    // Image
    const studioImage = document.getElementById('studio-image');
    studioImage.src = studio.photo_url || '/assets/default-studio.jpg';
    studioImage.alt = studio.name;

    updateMetadata(studio);
}

function updateRelatedStudios(studios, stateName) {
    const container = document.getElementById('related-studios');
    container.innerHTML = studios.map(studio => studioCardHtml(studio, stateName)).join('');
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