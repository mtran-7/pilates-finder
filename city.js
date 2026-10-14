import { loadStudiosData, studioCardHtml } from './global.js';

function normalizeString(str) {
    return str ? str.toLowerCase().trim() : '';
}

async function populateCityStudios() {
    const container = document.getElementById("city-studios");

    const urlParams = new URLSearchParams(window.location.search);
    const stateName = urlParams.get("state");
    const cityName = urlParams.get("city");

    if (!stateName || !cityName) {
        window.location.href = '/';
        return;
    }

    // Update city name in all places including hero section
    document.querySelectorAll('.city-name').forEach(el => {
        el.textContent = cityName;
    });
    document.title = `Pilates Studios in ${cityName} | Pilates Finder`;

    const data = await loadStudiosData();
    if (!data || !Array.isArray(data)) {
        container.innerHTML = "<p>Error loading data. Please try again later.</p>";
        return;
    }

    const stateData = data.find(state => normalizeString(state.state) === normalizeString(stateName));
    if (!stateData) {
        container.innerHTML = `<p>${stateName} not found.</p>`;
        return;
    }

    const cityStudios = stateData.studios.filter(
        studio => normalizeString(studio.city) === normalizeString(cityName)
    );

    if (cityStudios.length === 0) {
        container.innerHTML = "<p>No studios found for this city.</p>";
        return;
    }

    renderStudioCards(cityStudios, stateData.state);
    renderDistrictFilters(cityStudios, urlParams.get("district"));
    setupFilters();
}

// NYC boroughs always get their own chip, however few studios they hold
const NYC_BOROUGHS = ["Manhattan", "Brooklyn", "Queens", "The Bronx", "Staten Island"];
const MIN_CHIP_STUDIOS = 3;

// Group a city's studios into chip buckets: named districts big enough to
// stand alone, everything else (small or unknown) pooled as "Other areas".
function buildDistrictBuckets(cityStudios) {
    const counts = {};
    cityStudios.forEach(studio => {
        const district = studio.district || '';
        counts[district] = (counts[district] || 0) + 1;
    });

    const named = Object.keys(counts).filter(Boolean)
        .sort((a, b) => counts[b] - counts[a] || a.localeCompare(b));
    if (!named.length) return [];

    const buckets = [];
    const other = { label: 'Other areas', districts: [], count: 0 };
    named.forEach(district => {
        if (counts[district] >= MIN_CHIP_STUDIOS || NYC_BOROUGHS.includes(district)) {
            buckets.push({ label: district, districts: [district], count: counts[district] });
        } else {
            other.districts.push(district);
            other.count += counts[district];
        }
    });
    if (counts['']) {
        other.districts.push('');
        other.count += counts[''];
    }
    if (other.count) buckets.push(other);

    return buckets.length >= 2 ? buckets : [];
}

function renderDistrictFilters(cityStudios, districtParam) {
    const buckets = buildDistrictBuckets(cityStudios);
    if (!buckets.length) return;

    const row = document.getElementById('district-filters');
    // districts joined with "|" (never part of a name); a trailing "" marks
    // the unknown-district studios pooled into "Other areas"
    row.innerHTML = [
        `<button class="district-btn active">All areas <span class="filter-count">(${cityStudios.length})</span></button>`,
        ...buckets.map(b => `
            <button class="district-btn" data-label="${b.label}" data-districts="${b.districts.join('|')}">
                ${b.label} <span class="filter-count">(${b.count})</span>
            </button>`)
    ].join('');
    document.getElementById('district-filter-group').hidden = false;

    row.addEventListener('click', (e) => {
        const btn = e.target.closest('.district-btn');
        if (!btn) return;
        row.querySelectorAll('.district-btn').forEach(b => b.classList.toggle('active', b === btn));

        const params = new URLSearchParams(window.location.search);
        if (btn.dataset.label) params.set('district', btn.dataset.label);
        else params.delete('district');
        history.replaceState(null, '', `${window.location.pathname}?${params}`);

        filterStudios();
    });

    // Deep link: /city?...&district=Brooklyn preselects that chip
    if (districtParam) {
        const match = Array.from(row.querySelectorAll('.district-btn'))
            .find(btn => normalizeString(btn.dataset.label) === normalizeString(districtParam));
        if (match) {
            row.querySelectorAll('.district-btn').forEach(b => b.classList.toggle('active', b === match));
            filterStudios();
        }
    }
}

function renderStudioCards(cityStudios, stateName) {
    const cityStudiosContainer = document.getElementById("city-studios");

    // Count studios for each criteria
    const criteriaCounts = {};
    cityStudios.forEach(studio => {
        Object.entries(studio.criteria || {}).forEach(([key, value]) => {
            if (value) {
                criteriaCounts[key] = (criteriaCounts[key] || 0) + 1;
            }
        });
    });

    // Update filter buttons with counts
    document.querySelectorAll('.criteria-filters .filter-btn').forEach(button => {
        const criteria = button.dataset.criteria;
        const count = criteriaCounts[criteria] || 0;
        const [emoji, ...nameParts] = button.textContent.trim().split(' ');
        button.innerHTML = `
            ${emoji}
            <span class="filter-name">${nameParts.join(' ')}</span>
            <span class="filter-count">(${count})</span>
        `;
    });

    cityStudiosContainer.innerHTML = cityStudios
        .map(studio => studioCardHtml(studio, stateName))
        .join('');
}

function setupFilters() {
    document.querySelectorAll('.criteria-filters .filter-btn').forEach(button => {
        button.addEventListener('click', function () {
            this.classList.toggle('active');
            filterStudios();
        });
    });
}

function filterStudios() {
    const activeFilters = Array.from(document.querySelectorAll('.criteria-filters .filter-btn.active'))
        .map(btn => btn.dataset.criteria);

    const activeDistrictBtn = document.querySelector('.district-btn.active[data-districts]');
    const allowedDistricts = activeDistrictBtn
        ? new Set(activeDistrictBtn.dataset.districts.split('|'))
        : null;

    document.querySelectorAll('.studio-card').forEach(card => {
        const inDistrict = !allowedDistricts || allowedDistricts.has(card.dataset.district || '');
        const hasAllFilters = activeFilters.every(filter =>
            card.querySelector(`.criteria-badge[title="${filter}"]`)
        );
        card.style.display = (inDistrict && hasAllFilters) ? 'flex' : 'none';
    });
}

document.addEventListener("DOMContentLoaded", () => {
    populateCityStudios();
});
