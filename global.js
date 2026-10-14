let allStudiosData = null;

async function loadStudiosData() {
    try {
        const response = await fetch("/pilates_studios.json");
        if (!response.ok) throw new Error("Failed to load data");
        const data = await response.json();
        
        // Group studios by state
        const groupedData = {};
        data.forEach(studio => {
            if (!groupedData[studio.State]) {
                groupedData[studio.State] = {
                    state: studio.State,
                    studios: []
                };
            }
            
            // Transform studio data with correct property names
            const studioData = {
                name: studio.Name,
                city: studio.City,
                state: studio.State,
                rating: studio.Rating,
                number_of_reviews: studio["Number of Reviews"], // Changed to match expected property
                phone: studio.Phone,
                opening_hours: studio["Opening Hours"],
                website: studio.Website,
                photo_url: studio["Photo URL"], // Changed to match expected property
                address: studio.Address,
                district: studio.District || '',
                latitude: studio.Latitude ?? null,
                longitude: studio.Longitude ?? null,
                price_single: studio["Price Single"] || null,
                price_intro: studio["Price Intro"] || null,
                intro_offer: studio["Intro Offer"] || null,
                criteria: {
                    Reformer: Boolean(studio.Reformer),
                    Mat: Boolean(studio.Mat),
                    Barre: Boolean(studio.Barre),
                    Online: Boolean(studio.Online),
                    Private: Boolean(studio.Private),
                    Group: Boolean(studio.Group),
                    Tower: Boolean(studio.Tower),
                    Free_Trial: Boolean(studio["Free Trial"]) // Changed to match expected property
                }
            };
            
            groupedData[studio.State].studios.push(studioData);
        });
        
        allStudiosData = Object.values(groupedData);
        return allStudiosData;
    } catch (error) {
        console.error("Error loading studios data:", error);
        return null;
    }
}

// Header location picker: replaces the old States page with a dropdown of states
function initLocationPicker() {
    const mount = document.getElementById('nav-location');
    if (!mount) return;

    mount.innerHTML = `
        <button type="button" class="location-btn" aria-haspopup="true" aria-expanded="false">
            📍 Location <span class="location-caret">▾</span>
        </button>
        <div class="location-panel" hidden>
            <input type="text" class="location-search" placeholder="Search states..." aria-label="Search states">
            <div class="location-list"><p class="location-loading">Loading locations…</p></div>
        </div>
    `;

    const btn = mount.querySelector('.location-btn');
    const panel = mount.querySelector('.location-panel');
    const list = mount.querySelector('.location-list');
    const search = mount.querySelector('.location-search');
    let loaded = false;

    async function open() {
        panel.hidden = false;
        btn.setAttribute('aria-expanded', 'true');
        search.focus();
        if (loaded) return;
        loaded = true;
        const data = await loadStudiosData();
        if (!data || !Array.isArray(data)) {
            list.innerHTML = '<p class="location-loading">Could not load locations.</p>';
            loaded = false;
            return;
        }
        const states = data
            .map(s => ({ name: s.state, count: s.studios.length }))
            .sort((a, b) => a.name.localeCompare(b.name));
        list.innerHTML = states.map(s => `
            <a href="/cities?state=${encodeURIComponent(s.name)}" class="location-item">
                <span>${s.name}</span><span class="location-count">${s.count}</span>
            </a>`).join('');
    }

    function close() {
        panel.hidden = true;
        btn.setAttribute('aria-expanded', 'false');
    }

    btn.addEventListener('click', () => (panel.hidden ? open() : close()));
    document.addEventListener('click', (e) => {
        if (!mount.contains(e.target)) close();
    });
    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape') close();
    });
    search.addEventListener('input', () => {
        const q = search.value.toLowerCase();
        list.querySelectorAll('.location-item').forEach(el => {
            el.hidden = !el.textContent.toLowerCase().includes(q);
        });
    });

    // Buttons elsewhere on the page (e.g. "Find a Studio") open the picker
    document.querySelectorAll('[data-open-location]').forEach(el => {
        el.addEventListener('click', (e) => {
            e.preventDefault();
            window.scrollTo({ top: 0, behavior: 'smooth' });
            open();
        });
    });
}

// Update all navigation links to use clean URLs
document.addEventListener('DOMContentLoaded', () => {
    // Update nav menu links
    document.querySelectorAll('.nav-menu .nav-link, .footer-links a').forEach(link => {
        const href = link.getAttribute('href');
        if (href === 'about.html') {
            link.setAttribute('href', '/about-pilates-finder');
        } else if (href === 'contact.html') {
            link.setAttribute('href', '/contact-us');
        }
    });

    initLocationPicker();

    // Hamburger menu (shared across all pages)
    const hamburger = document.querySelector('.hamburger');
    const navMenu = document.querySelector('.nav-menu');

    if (hamburger && navMenu) {
        hamburger.addEventListener('click', () => {
            navMenu.classList.toggle('active');
        });

        document.addEventListener('click', (e) => {
            if (!e.target.closest('.nav-container')) {
                navMenu.classList.remove('active');
            }
        });
    }
});

// Known chain-wide intro offers (verified Oct 2026):
// - Club Pilates: free 30-min intro class at participating studios (clubpilates.com)
// - BODYBAR Pilates: first class free (bodybarpilates.com/first-time)
// - JETSET Pilates: discounted new-client intro offers, price varies by studio (jetsetpilates.com/new)
// - BODYROK: $20 first class intro offer (bodyrok.com studio pages)
// - HOTWORX: one complimentary session for local first-time guests (hotworx.net studio pages)
const CHAIN_OFFERS = [
    { pattern: /club pilates/i, label: 'Free Intro Class' },
    { pattern: /bodybar/i, label: 'First Class Free' },
    { pattern: /jetset/i, label: 'Intro Offer' },
    { pattern: /bodyrok/i, label: 'First Class $20' },
    { pattern: /hotworx/i, label: 'Free First Session' }
];

// Returns the intro-offer label for a studio, or null if none is known.
// Precedence: offer text scraped from the studio's own website, then
// verified chain-wide offers, then a plain intro price, then the Free Trial flag.
function getStudioOffer(studio) {
    if (studio.intro_offer) return studio.intro_offer;
    for (const { pattern, label } of CHAIN_OFFERS) {
        if (pattern.test(studio.name || '')) return label;
    }
    if (studio.price_intro) return `New client intro offer for $${studio.price_intro}`;
    if (studio.criteria?.Free_Trial) return 'Free trial for new clients';
    return null;
}

// ===== Shared studio card (used on home, browse, city and studio pages) =====

const CRITERIA_EMOJIS = {
    Reformer: "🏋️‍♀️", Mat: "🟦", Private: "🔒", Group: "👥",
    Online: "🌐", Barre: "🩰", Tower: "🗼", Free_Trial: "🎟️"
};

const FAVORITES_KEY = 'pf-favorites';

function loadFavorites() {
    try {
        return new Set(JSON.parse(localStorage.getItem(FAVORITES_KEY)) || []);
    } catch {
        return new Set();
    }
}

function favoriteId(stateName, studio) {
    return `${stateName}|${studio.city}|${studio.name}`;
}

const PIN_ICON = `<svg viewBox="0 0 24 24" width="15" height="15" fill="none" stroke="currentColor" stroke-width="1.8" aria-hidden="true"><path d="M12 21s-7-5.75-7-11a7 7 0 1 1 14 0c0 5.25-7 11-7 11z"/><circle cx="12" cy="10" r="2.6"/></svg>`;
const HEART_ICON = `<svg viewBox="0 0 24 24" width="20" height="20" aria-hidden="true"><path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z"/></svg>`;

function escapeHtml(str) {
    return String(str ?? '').replace(/&/g, '&amp;').replace(/</g, '&lt;')
        .replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}

function studioCardHtml(studio, stateName) {
    const offer = getStudioOffer(studio);
    const reviews = studio.number_of_reviews || 0;
    const favId = favoriteId(stateName, studio);
    const isFav = loadFavorites().has(favId);

    const metaParts = [];
    if (studio.rating) metaParts.push(`<span class="studio-rating">★ ${studio.rating} <span class="review-count">(${reviews})</span></span>`);
    if (studio.price_single) metaParts.push(`<span class="studio-price">From $${studio.price_single}/class</span>`);

    const chips = Object.entries(studio.criteria || {})
        .filter(([key, value]) => value && CRITERIA_EMOJIS[key])
        .map(([key]) => `<span class="criteria-badge" title="${key}" data-label="${key.replace('_', ' ')}">${CRITERIA_EMOJIS[key]}</span>`)
        .join('');

    // Within a big city the district beats repeating the state ("SoHo, New York City")
    const locationLabel = studio.district
        ? `${studio.district}, ${studio.city}`
        : `${studio.city}, ${stateName}`;

    return `
        <a class="studio-card" href="/studio?state=${encodeURIComponent(stateName)}&city=${encodeURIComponent(studio.city)}&name=${encodeURIComponent(studio.name)}" data-district="${escapeHtml(studio.district)}">
            <div class="studio-image">
                <img src="${escapeHtml(studio.photo_url) || '/assets/default-studio.jpg'}" alt="${escapeHtml(studio.name)}" loading="lazy"
                     onerror="this.onerror=null;this.src='/assets/default-studio.jpg'">
                ${offer ? `<span class="offer-banner" title="${escapeHtml(offer)}"><span class="offer-plus">+</span><span class="offer-text">${escapeHtml(offer)}</span></span>` : ''}
                <button type="button" class="fav-btn${isFav ? ' active' : ''}" data-fav-id="${escapeHtml(favId)}"
                        aria-label="${isFav ? 'Remove' : 'Save'} ${escapeHtml(studio.name)}" aria-pressed="${isFav}">${HEART_ICON}</button>
            </div>
            <div class="studio-info">
                <h3 class="studio-name">${escapeHtml(studio.name)}</h3>
                <p class="studio-location">${PIN_ICON}<span>${escapeHtml(locationLabel)}</span></p>
                ${metaParts.length ? `<div class="studio-meta">${metaParts.join('<span class="meta-dot">·</span>')}</div>` : ''}
                ${chips ? `<div class="criteria">${chips}</div>` : ''}
            </div>
        </a>`;
}

// One delegated listener covers hearts on every card, including ones rendered later
document.addEventListener('click', (e) => {
    const btn = e.target.closest('.fav-btn');
    if (!btn) return;
    e.preventDefault();
    e.stopPropagation();

    const favorites = loadFavorites();
    const id = btn.dataset.favId;
    const nowFav = !favorites.has(id);
    if (nowFav) favorites.add(id); else favorites.delete(id);
    try { localStorage.setItem(FAVORITES_KEY, JSON.stringify([...favorites])); } catch { /* ignore */ }

    // Keep every rendered copy of this studio's heart in sync
    document.querySelectorAll('.fav-btn').forEach(el => {
        if (el.dataset.favId !== id) return;
        el.classList.toggle('active', nowFav);
        el.setAttribute('aria-pressed', String(nowFav));
    });
});

export { loadStudiosData, getStudioOffer, studioCardHtml, CRITERIA_EMOJIS };