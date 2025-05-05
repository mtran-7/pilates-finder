let allStudiosData = null;

async function loadStudiosData() {
    try {
        const response = await fetch("pilates_studios.json");
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

// Helper function to generate clean URLs
function getStudioUrl(studio) {
    return `/${encodeURIComponent(studio.state)}/${encodeURIComponent(studio.city)}/${encodeURIComponent(studio.name)}`;
}

// Helper function to generate city URLs
function getCityUrl(state, city) {
    return `/${encodeURIComponent(state)}/${encodeURIComponent(city)}`;
}

// Helper function to get state path
function getStatePath(state) {
    return `/${encodeURIComponent(state)}`;
}

// Helper function to get city path
function getCityPath(state, city) {
    return `/${encodeURIComponent(state)}/${encodeURIComponent(city)}`;
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
        // Remove states.html transformation
    });
    document.querySelectorAll('a[href="states.html"]').forEach(link => {
        link.href = '/states';
    });
});

// Function to get path parameters
function getPathParams() {
    const parts = window.location.pathname.split('/').filter(Boolean);
    return {
        state: parts[0] ? decodeURIComponent(parts[0]) : null,
        city: parts[1] ? decodeURIComponent(parts[1]) : null
    };
}

// Add export statement for loadStudiosData
export { loadStudiosData };
