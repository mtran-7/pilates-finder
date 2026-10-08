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
const CHAIN_OFFERS = [
    { pattern: /club pilates/i, label: 'Free Intro Class' },
    { pattern: /bodybar/i, label: 'First Class Free' },
    { pattern: /jetset/i, label: 'Intro Offer' }
];

// Returns the intro-offer label for a studio, or null if none is known.
// Precedence: offer text scraped from the studio's own website, then
// verified chain-wide offers, then a plain intro price, then the Free Trial flag.
function getStudioOffer(studio) {
    if (studio.intro_offer) return studio.intro_offer;
    for (const { pattern, label } of CHAIN_OFFERS) {
        if (pattern.test(studio.name || '')) return label;
    }
    if (studio.price_intro) return `Intro class $${studio.price_intro}`;
    if (studio.criteria?.Free_Trial) return 'Free Trial';
    return null;
}

export { loadStudiosData, getStudioOffer };