import { loadStudiosData, getStudioOffer } from './global.js';

const OFFER_CRITERIA_EMOJIS = {
    Reformer: "🏋️‍♀️", Mat: "🟦", Private: "🔒", Group: "👥",
    Online: "🌐", Free_Trial: "🎟️", Barre: "🩰", Tower: "🗼"
};

function populateIntroOffers(allStudiosData) {
    const container = document.getElementById('intro-offers-list');
    if (!container) return;

    // Collect studios with a known intro offer, best-rated first, max one per city
    const candidates = [];
    allStudiosData.forEach(state => {
        state.studios.forEach(studio => {
            const offer = getStudioOffer(studio);
            if (offer && studio.rating && studio.photo_url) {
                candidates.push({ studio, offer, state: state.state });
            }
        });
    });

    candidates.sort((a, b) =>
        (b.studio.rating * Math.log10((b.studio.number_of_reviews || 0) + 1)) -
        (a.studio.rating * Math.log10((a.studio.number_of_reviews || 0) + 1))
    );

    const seenCities = new Set();
    const picks = [];
    for (const c of candidates) {
        const cityKey = `${c.state}|${c.studio.city}`;
        if (seenCities.has(cityKey)) continue;
        seenCities.add(cityKey);
        picks.push(c);
        if (picks.length === 8) break;
    }

    picks.forEach(({ studio, offer, state }) => {
        const studioUrl = `/studio?state=${encodeURIComponent(state)}&city=${encodeURIComponent(studio.city)}&name=${encodeURIComponent(studio.name)}`;
        const tags = Object.entries(studio.criteria || {})
            .filter(([key, value]) => value && OFFER_CRITERIA_EMOJIS[key])
            .slice(0, 3)
            .map(([key]) => `<span class="offer-tag">${OFFER_CRITERIA_EMOJIS[key]} ${key.replace('_', ' ')}</span>`)
            .join('');

        const card = document.createElement('a');
        card.className = 'studio-card offer-card';
        card.href = studioUrl;
        card.innerHTML = `
            <div class="studio-image">
                <span class="offer-badge">✦ ${offer}</span>
                <img src="${studio.photo_url}" alt="${studio.name}" loading="lazy"
                     onerror="this.onerror=null;this.src='/assets/default-studio.jpg'">
                <div class="rating-container">⭐ ${studio.rating} (${studio.number_of_reviews || 0})</div>
            </div>
            <div class="studio-info">
                <h3>${studio.name}</h3>
                <p class="offer-location">📍 ${studio.city}, ${state}</p>
                <div class="offer-tags">${tags}</div>
                <span class="btn-view">View Studio</span>
            </div>
        `;
        container.appendChild(card);
    });

    // Hide the section if nothing qualified
    if (!picks.length) {
        document.querySelector('.offers-section')?.setAttribute('hidden', '');
    }
}

let allStudiosData = null;

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

    // Load studios data first
    allStudiosData = await loadStudiosData();
    if (!allStudiosData) {
        console.error('Failed to load studios data');
        return;
    }

    const searchBar = document.querySelector(".search-bar");

    // First-Timer Offers section (homepage only)
    populateIntroOffers(allStudiosData);

    // Load studios data and populate featured cities, grouped by region
    const featuredCitiesContainer = document.getElementById("featured-cities-list");

    // Regions with no studios in the data yet render a "coming soon" card
    const featuredRegions = [
        {
            region: "USA",
            cities: [
                { city: "San Diego", state: "California" },
                { city: "Reno", state: "Nevada" },
                { city: "Los Angeles", state: "California" },
                { city: "Miami", state: "Florida" },
                { city: "Wilmington", state: "Delaware" },
                { city: "New York City", state: "New York" }
            ]
        },
        { region: "Bali", cities: [] },
        { region: "London", cities: [] }
    ];

    function cityCardHtml({ city, state }) {
        const stateData = allStudiosData.find(s => s.state === state);
        if (!stateData) return "";

        const cityStudios = stateData.studios.filter(studio => studio.city === city);
        if (!cityStudios.length) return "";

        // Count occurrences of each criterion and keep the top 3
        const criteriaCounts = {};
        cityStudios.forEach(studio => {
            Object.entries(studio.criteria).forEach(([key, value]) => {
                if (criteriaEmojis[key] && value) {
                    criteriaCounts[key] = (criteriaCounts[key] || 0) + 1;
                }
            });
        });
        const topCriteria = Object.entries(criteriaCounts)
            .sort((a, b) => b[1] - a[1])
            .slice(0, 3)
            .map(([criterion, count]) =>
                `<div class="criteria-item">${criteriaEmojis[criterion] || ""} ${criterion.replace('_', ' ')} (${count})</div>`
            )
            .join("");

        return `
            <a class="city-card" href="/city?state=${encodeURIComponent(state)}&city=${encodeURIComponent(city)}">
                <h3>${city}</h3>
                <p>${cityStudios.length} pilates locations</p>
                <div class="criteria">${topCriteria}</div>
            </a>`;
    }

    if (featuredCitiesContainer) {
        featuredRegions.forEach(({ region, cities }) => {
            const cards = cities.map(cityCardHtml).filter(Boolean).join("");
            const group = document.createElement("div");
            group.classList.add("region-group");
            group.innerHTML = `
                <h3 class="region-title">${region}</h3>
                <div class="cities-list">
                    ${cards || `<div class="city-card coming-soon"><h3>${region}</h3><p>Studios coming soon</p></div>`}
                </div>`;
            featuredCitiesContainer.appendChild(group);
        });
    }

    // "Find Studios Near Me" functionality
    const findNearMeButton = document.querySelector(".find-near-me");
    if (findNearMeButton) {
        findNearMeButton.addEventListener("click", () => {
            if (!navigator.geolocation) {
                alert("Geolocation is not supported by your browser.");
                return;
            }

            navigator.geolocation.getCurrentPosition(position => {
                const { latitude, longitude } = position.coords;
                let nearestStudio = null;
                let minDistance = Infinity;

                allStudiosData.forEach(state => {
                    state.studios.forEach(studio => {
                        if (studio.latitude && studio.longitude) {
                            const distance = Math.sqrt(
                                Math.pow(latitude - studio.latitude, 2) +
                                Math.pow(longitude - studio.longitude, 2)
                            );
                            if (distance < minDistance) {
                                minDistance = distance;
                                nearestStudio = studio;
                            }
                        }
                    });
                });

                if (nearestStudio) {
                    window.location.href = `/city?state=${encodeURIComponent(nearestStudio.state)}&city=${encodeURIComponent(nearestStudio.city)}`;
                } else {
                    alert("No nearby studios found.");
                }
            });
        });
    }

    // CTA Button ripple effect
    document.querySelector('.cta-button')?.addEventListener('click', function(e) {
        const button = this;
        const ripple = document.createElement('span');
        const rect = button.getBoundingClientRect();
        const x = e.clientX - rect.left;
        const y = e.clientY - rect.top;
        
        ripple.style.cssText = `
            position: absolute;
            background: rgba(255, 255, 255, 0.7);
            border-radius: 50%;
            width: 20px;
            height: 20px;
            left: ${x}px;
            top: ${y}px;
            transform: scale(0);
            pointer-events: none;
        `;
        
        button.appendChild(ripple);
        
        requestAnimationFrame(() => {
            ripple.style.transform = 'scale(10)';
            ripple.style.opacity = '0';
            ripple.style.transition = 'transform 0.6s, opacity 0.6s';
            
            setTimeout(() => {
                ripple.remove();
            }, 600);
        });
    });

    // FAQ Accordion functionality
    const faqQuestions = document.querySelectorAll('.faq-question');
    
    faqQuestions.forEach(question => {
        question.addEventListener('click', () => {
            const isExpanded = question.getAttribute('aria-expanded') === 'true';
            const answer = question.nextElementSibling;
            
            // Close all other FAQs
            faqQuestions.forEach(q => {
                if (q !== question) {
                    q.setAttribute('aria-expanded', 'false');
                    q.querySelector('i').className = 'fas fa-plus';
                    const otherAnswer = q.nextElementSibling;
                    otherAnswer.hidden = true;
                }
            });
            
            // Toggle current FAQ
            question.setAttribute('aria-expanded', !isExpanded);
            question.querySelector('i').className = !isExpanded ? 'fas fa-minus' : 'fas fa-plus';
            answer.hidden = isExpanded;
            
            // Force reflow for animation
            if (!isExpanded) {
                answer.style.display = 'block';
                setTimeout(() => {
                    answer.style.maxHeight = answer.scrollHeight + 'px';
                    answer.style.opacity = '1';
                }, 10);
            } else {
                answer.style.maxHeight = '0';
                answer.style.opacity = '0';
                setTimeout(() => {
                    answer.style.display = 'none';
                }, 300);
            }
        });
    });

    // Enhanced Search functionality with Fuse.js (homepage only)
    if (searchBar && typeof Fuse !== 'undefined') {
    const searchDropdown = document.createElement('div');
    searchDropdown.className = 'search-results-dropdown';
    searchBar.parentNode.appendChild(searchDropdown);

    // Prepare data for Fuse.js from the already-loaded studios data
    const searchData = allStudiosData.flatMap(state => {
        const cityNames = [...new Set(state.studios.map(studio => studio.city))];
        return [
            // Add cities
            ...cityNames.map(city => ({
                type: 'city',
                city,
                state: state.state,
                url: `/city?state=${encodeURIComponent(state.state)}&city=${encodeURIComponent(city)}`
            })),
            // Add studios
            ...state.studios.map(studio => ({
                type: 'studio',
                name: studio.name,
                city: studio.city,
                state: state.state,
                url: `/studio?state=${encodeURIComponent(state.state)}&city=${encodeURIComponent(studio.city)}&name=${encodeURIComponent(studio.name)}`
            }))
        ];
    });

    const fuseOptions = {
        keys: ['name', 'city', 'state'],
        threshold: 0.3,
        distance: 100
    };

    const fuse = new Fuse(searchData, fuseOptions);

    searchBar.addEventListener('input', (e) => {
        const query = e.target.value;
        if (query.length < 2) {
            searchDropdown.classList.remove('active');
            return;
        }

        const results = fuse.search(query).slice(0, 6);
        if (results.length > 0) {
            searchDropdown.innerHTML = results.map(({item}) => `
                <a href="${item.url}" class="search-result-item" role="option">
                    <span class="search-result-icon">
                        <i class="fas ${item.type === 'city' ? 'fa-city' : 'fa-dumbbell'}"></i>
                    </span>
                    <div class="search-result-content">
                        <div class="search-result-title">${item.name || item.city}</div>
                        <div class="search-result-subtitle">
                            ${item.type === 'studio' ? `${item.city}, ${item.state}` : item.state}
                        </div>
                    </div>
                </a>
            `).join('');
            searchDropdown.classList.add('active');
        } else {
            searchDropdown.innerHTML = '<div class="search-result-item">No results found</div>';
            searchDropdown.classList.add('active');
        }
    });

    // Close dropdown when clicking outside
    document.addEventListener('click', (e) => {
        if (!searchBar.contains(e.target) && !searchDropdown.contains(e.target)) {
            searchDropdown.classList.remove('active');
        }
    });

    // Keyboard navigation
    searchBar.addEventListener('keydown', (e) => {
        if (!searchDropdown.classList.contains('active')) return;
        
        const items = searchDropdown.querySelectorAll('.search-result-item');
        const current = searchDropdown.querySelector('.search-result-item:focus');
        
        if (e.key === 'ArrowDown') {
            e.preventDefault();
            if (!current) {
                items[0]?.focus();
            } else {
                current.nextElementSibling?.focus();
            }
        } else if (e.key === 'ArrowUp') {
            e.preventDefault();
            if (!current) {
                items[items.length - 1]?.focus();
            } else {
                current.previousElementSibling?.focus();
            }
        }
    });
    }

    // Intersection Observer for fade-in animations
    const observerOptions = {
        root: null,
        rootMargin: '0px',
        threshold: 0.1
    };

    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.classList.add('fade-in');
                observer.unobserve(entry.target);
            }
        });
    }, observerOptions);

    document.querySelectorAll('.type-card, .why-pilates-content, .faq-item').forEach(el => {
        observer.observe(el);
    });
    
});