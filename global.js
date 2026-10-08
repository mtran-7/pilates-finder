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
    document.querySelectorAll('a[href="states.html"]').forEach(link => {
        link.href = '/states';
    });

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

// Add export statement for loadStudiosData
export { loadStudiosData };