import { loadStudiosData, getStudioOffer } from './global.js';

const PAGE_SIZE = 24;

const criteriaEmojis = {
    Reformer: "🏋️‍♀️", Mat: "🟦", Private: "🔒", Group: "👥",
    Online: "🌐", Barre: "🩰", Tower: "🗼", Free_Trial: "🎟️"
};

// Price buckets from price_single: 1 = under $25, 2 = $25–40, 3 = over $40
function priceBucket(studio) {
    const p = studio.price_single;
    if (!p) return null;
    if (p < 25) return 1;
    if (p <= 40) return 2;
    return 3;
}

const state = {
    types: new Set(),
    price: null,
    offer: false,
    state: '',
    city: '',
    sort: 'rating',
    shown: PAGE_SIZE
};

let allStudios = []; // flat: { studio, stateName, offer }

function readUrlState() {
    const params = new URLSearchParams(window.location.search);
    (params.get('type') || '').split(',').filter(Boolean).forEach(t => state.types.add(t));
    state.price = params.get('price') ? Number(params.get('price')) : null;
    state.offer = params.get('offer') === '1';
    state.state = params.get('state') || '';
    state.city = params.get('city') || '';
    state.sort = params.get('sort') || 'rating';
}

function writeUrlState() {
    const params = new URLSearchParams();
    if (state.types.size) params.set('type', [...state.types].join(','));
    if (state.price) params.set('price', String(state.price));
    if (state.offer) params.set('offer', '1');
    if (state.state) params.set('state', state.state);
    if (state.city) params.set('city', state.city);
    if (state.sort !== 'rating') params.set('sort', state.sort);
    const qs = params.toString();
    history.replaceState(null, '', qs ? `?${qs}` : window.location.pathname);
}

function hasAnyFilter() {
    return state.types.size > 0 || state.price !== null || state.offer || !!state.state;
}

function applyFilters() {
    let results = allStudios.filter(({ studio, stateName, offer }) => {
        for (const t of state.types) {
            if (!studio.criteria?.[t]) return false;
        }
        if (state.price && priceBucket(studio) !== state.price) return false;
        if (state.offer && !offer) return false;
        if (state.state && stateName !== state.state) return false;
        if (state.city && studio.city !== state.city) return false;
        return true;
    });

    if (state.sort === 'reviews') {
        results.sort((a, b) => (b.studio.number_of_reviews || 0) - (a.studio.number_of_reviews || 0));
    } else if (state.sort === 'price') {
        results.sort((a, b) => (a.studio.price_single || Infinity) - (b.studio.price_single || Infinity));
    } else {
        results.sort((a, b) =>
            (b.studio.rating || 0) - (a.studio.rating || 0) ||
            (b.studio.number_of_reviews || 0) - (a.studio.number_of_reviews || 0)
        );
    }
    return results;
}

function studioCardHtml({ studio, stateName, offer }) {
    const studioType = studio.criteria?.Reformer ? 'Reformer Pilates' : 'Classical Pilates';
    const reviews = studio.number_of_reviews || 0;
    const activeCriteria = Object.entries(studio.criteria || {})
        .filter(([_, v]) => v)
        .map(([key]) => key.replace('_', ' '))
        .join(', ');
    const fullDescription = `${studio.name} is a ${studioType} studio located in ${studio.city}, ${stateName} ` +
        `with a ${studio.rating || 'N/A'} star rating from ${reviews} reviews. ` +
        `This establishment is offering ${activeCriteria || 'various pilates services'}.`;
    const description = fullDescription.length > 110 ? fullDescription.substring(0, 109) + '...' : fullDescription;

    const priceLine = studio.price_single
        ? `<p class="price-line">From $${studio.price_single}/class</p>`
        : (studio.price_intro ? `<p class="price-line">Intro from $${studio.price_intro}</p>` : '');

    return `
        <a class="studio-card" href="/studio?state=${encodeURIComponent(stateName)}&city=${encodeURIComponent(studio.city)}&name=${encodeURIComponent(studio.name)}">
            <div class="studio-image">
                ${offer ? `<span class="offer-badge">✦ ${offer}</span>` : ''}
                <img src="${studio.photo_url || '/assets/default-studio.jpg'}" alt="${studio.name}" loading="lazy"
                     onerror="this.onerror=null;this.src='/assets/default-studio.jpg'">
                <div class="rating-container">⭐ ${studio.rating || "N/A"} (${reviews})</div>
            </div>
            <div class="studio-info">
                <h3>${studio.name}</h3>
                <p class="offer-location">📍 ${studio.city}, ${stateName}</p>
                ${priceLine}
                <div class="criteria">
                    ${Object.entries(studio.criteria || {})
                        .filter(([_, v]) => v)
                        .map(([key]) => `<span class="criteria-badge city-criteria" title="${key}">${criteriaEmojis[key]}</span>`)
                        .join('')}
                </div>
                <p class="description">${description}</p>
                <span class="view-details-link">View details</span>
            </div>
        </a>`;
}

function render() {
    const chooser = document.getElementById('type-chooser');
    const browse = document.getElementById('browse-section');
    const resultsEl = document.getElementById('studios-results');
    const countEl = document.getElementById('results-count');
    const showMoreBtn = document.getElementById('show-more');

    writeUrlState();

    if (!hasAnyFilter()) {
        chooser.hidden = false;
        browse.hidden = true;
        return;
    }
    chooser.hidden = true;
    browse.hidden = false;

    // Sync filter button/select UI with state
    document.querySelectorAll('#type-filters .filter-btn').forEach(btn => {
        btn.classList.toggle('active', state.types.has(btn.dataset.criteria));
    });
    document.querySelectorAll('#price-filters .price-btn').forEach(btn => {
        btn.classList.toggle('active', Number(btn.dataset.price) === state.price);
    });
    document.getElementById('offer-filter').classList.toggle('active', state.offer);
    document.getElementById('state-filter').value = state.state;
    document.getElementById('city-filter').value = state.city;
    document.getElementById('sort-select').value = state.sort;

    const results = applyFilters();
    countEl.textContent = `${results.length} ${results.length === 1 ? 'studio' : 'studios'} found`;
    resultsEl.innerHTML = results.slice(0, state.shown).map(studioCardHtml).join('');
    showMoreBtn.hidden = results.length <= state.shown;
}

function populateCityFilter(data) {
    const citySelect = document.getElementById('city-filter');
    citySelect.innerHTML = '<option value="">All cities</option>';
    if (!state.state) {
        citySelect.disabled = true;
        return;
    }
    const stateData = data.find(s => s.state === state.state);
    if (!stateData) return;
    const cities = [...new Set(stateData.studios.map(s => s.city))].sort();
    cities.forEach(c => {
        const opt = document.createElement('option');
        opt.value = c;
        opt.textContent = c;
        citySelect.appendChild(opt);
    });
    citySelect.disabled = false;
}

document.addEventListener('DOMContentLoaded', async () => {
    readUrlState();

    const data = await loadStudiosData();
    if (!data || !Array.isArray(data)) {
        document.getElementById('studios-results').innerHTML = '<p>Error loading data. Please try again later.</p>';
        document.getElementById('browse-section').hidden = false;
        document.getElementById('type-chooser').hidden = true;
        return;
    }

    data.forEach(s => {
        s.studios.forEach(studio => {
            allStudios.push({ studio, stateName: s.state, offer: getStudioOffer(studio) });
        });
    });

    // Type-chooser counts
    document.querySelectorAll('[data-count-for]').forEach(el => {
        const key = el.dataset.countFor;
        const n = allStudios.filter(({ studio }) => studio.criteria?.[key]).length;
        el.textContent = `${n} studios`;
    });

    // State select options
    const stateSelect = document.getElementById('state-filter');
    data.map(s => s.state).sort().forEach(name => {
        const opt = document.createElement('option');
        opt.value = name;
        opt.textContent = name;
        stateSelect.appendChild(opt);
    });
    populateCityFilter(data);

    // Price filters & sort option appear only when the data actually has prices
    const hasPrices = allStudios.some(({ studio }) => studio.price_single);
    if (hasPrices) {
        document.getElementById('price-filters').hidden = false;
        const opt = document.createElement('option');
        opt.value = 'price';
        opt.textContent = 'Price: low to high';
        document.getElementById('sort-select').appendChild(opt);
    }

    // --- events ---
    document.querySelectorAll('.type-choice').forEach(btn => {
        btn.addEventListener('click', () => {
            state.types.add(btn.dataset.type);
            state.shown = PAGE_SIZE;
            render();
            window.scrollTo({ top: 0, behavior: 'smooth' });
        });
    });

    document.querySelectorAll('#type-filters .filter-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            const t = btn.dataset.criteria;
            state.types.has(t) ? state.types.delete(t) : state.types.add(t);
            state.shown = PAGE_SIZE;
            render();
        });
    });

    document.querySelectorAll('#price-filters .price-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            const p = Number(btn.dataset.price);
            state.price = state.price === p ? null : p;
            state.shown = PAGE_SIZE;
            render();
        });
    });

    document.getElementById('offer-filter').addEventListener('click', () => {
        state.offer = !state.offer;
        state.shown = PAGE_SIZE;
        render();
    });

    stateSelect.addEventListener('change', () => {
        state.state = stateSelect.value;
        state.city = '';
        populateCityFilter(data);
        state.shown = PAGE_SIZE;
        render();
    });

    document.getElementById('city-filter').addEventListener('change', (e) => {
        state.city = e.target.value;
        state.shown = PAGE_SIZE;
        render();
    });

    document.getElementById('sort-select').addEventListener('change', (e) => {
        state.sort = e.target.value;
        state.shown = PAGE_SIZE;
        render();
    });

    document.getElementById('clear-filters').addEventListener('click', () => {
        state.types.clear();
        state.price = null;
        state.offer = false;
        state.state = '';
        state.city = '';
        state.sort = 'rating';
        state.shown = PAGE_SIZE;
        populateCityFilter(data);
        render();
    });

    document.getElementById('show-more').addEventListener('click', () => {
        state.shown += PAGE_SIZE;
        render();
    });

    render();
});
