import { loadStudiosData } from './global.js';

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

    // Search functionality
    const searchBar = document.querySelector(".search-bar");
    const resultsSection = document.getElementById("results");

    if (searchBar) {
        searchBar.addEventListener("input", () => {
            const query = searchBar.value.toLowerCase();
            const results = [];

            allStudiosData.forEach(state => {
                state.studios.forEach(studio => {
                    if (
                        studio.name.toLowerCase().includes(query) ||
                        studio.city.toLowerCase().includes(query) ||
                        state.state.toLowerCase().includes(query)
                    ) {
                        results.push(studio);
                    }
                });
            });

            if (resultsSection) {
                resultsSection.innerHTML = results.length
                    ? results.map(studio => `
                        <div class="studio-card">
                            <h3>${studio.name}</h3>
                            <p>${studio.city}, ${studio.state}</p>
                            <a href="studios.html?id=${studio.id}" class="view-details-link">View Details</a>
                        </div>
                    `).join("")
                    : "<p>No results found.</p>";
            }
        });
    }

    // Load studios data and populate featured cities
    const featuredCitiesContainer = document.getElementById("featured-cities-list");

    // Define featured cities (limit to 6)
    const featuredCities = [
        { city: "San Diego", state: "California" },
        { city: "Reno", state: "Nevada" },
        { city: "Los Angeles", state: "California" },
        { city: "Miami", state: "Florida" },
        { city: "Wilmington", state: "Delaware" },
        { city: "New York City", state: "New York" }
    ].slice(0, 6); // Ensure only 6 cities are displayed

    // Process each featured city
    featuredCities.forEach(({ city, state }) => {
        // Find the state data first
        const stateData = allStudiosData.find(s => s.state === state);
        if (!stateData) return;

        // Filter studios for this city
        const cityStudios = stateData.studios.filter(studio => studio.city === city);
        const totalStudios = cityStudios.length;

        // Count occurrences of each criterion
        const criteriaCounts = {};
        cityStudios.forEach(studio => {
            Object.entries(studio.criteria).forEach(([key, value]) => {
                if (criteriaEmojis[key] && value) {
                    criteriaCounts[key] = (criteriaCounts[key] || 0) + 1;
                }
            });
        });

        // Sort criteria by count and select the top 3
        const topCriteria = Object.entries(criteriaCounts)
            .sort((a, b) => b[1] - a[1])
            .slice(0, 3)
            .map(([criterion, count]) => ({
                criterion: criterion.replace('_', ' '),
                count,
                emoji: criteriaEmojis[criterion] || ""
            }));

        // Create and append the city card
        const cityCard = document.createElement("a");
        cityCard.classList.add("city-card");
        cityCard.href = `city.html?state=${encodeURIComponent(state)}&city=${encodeURIComponent(city)}`;
        cityCard.innerHTML = `
            <h3>${city}</h3>
            <p>${totalStudios} pilates locations</p>
            <div class="criteria">
                ${topCriteria
                    .map(({ emoji, criterion, count }) =>
                        `<div class="criteria-item">${emoji} ${criterion} (${count})</div>`
                    )
                    .join("")}
            </div>
        `;
        
        if (featuredCitiesContainer) {
            featuredCitiesContainer.appendChild(cityCard);
        }
    });

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
                    window.location.href = `city.html?state=${nearestStudio.state}&city=${nearestStudio.city}`;
                } else {
                    alert("No nearby studios found.");
                }
            });
        });
    }

    // CTA Button ripple effect
    document.querySelector('.cta-button').addEventListener('click', function(e) {
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

    // Enhanced Search functionality with Fuse.js
    const searchDropdown = document.createElement('div');
    searchDropdown.className = 'search-results-dropdown';
    searchBar.parentNode.appendChild(searchDropdown);

    // Load and initialize Fuse.js
    const response = await fetch('/pilates_studios.json');
    const studiosData = await response.json();
    
    // Prepare data for Fuse.js
    const searchData = studiosData.flatMap(state => [
        // Add cities
        { 
            type: 'city',
            city: state.city,
            state: state.state,
            url: `cities.html?state=${encodeURIComponent(state.state)}&city=${encodeURIComponent(state.city)}`
        },
        // Add studios
        ...state.studios.map(studio => ({
            type: 'studio',
            name: studio.name,
            city: state.city,
            state: state.state,
            url: `studio.html?studio=${studio.id}`
        }))
    ]);

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
    
    // Add the new section header
    const sectionHeader = document.createElement('div');
    sectionHeader.className = 'section-header index-page';
    sectionHeader.innerHTML = `
        <h2>Explore Pilates by Location</h2>
        <a href="/states" class="view-all-link">Explore Pilates Studios by States -></a>
    `;
    document.body.insertBefore(sectionHeader, document.body.firstChild);
});