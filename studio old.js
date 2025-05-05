document.addEventListener("DOMContentLoaded", async () => {
    // Extract studio ID from query params
    const urlParams = new URLSearchParams(window.location.search);
    const studioId = urlParams.get('studio');

    if (studioId) {
        // Load studios data
        await loadStudiosData();
        
        // Find studio data
        let foundStudio = null;
        let foundState = null;

        for (const state of allStudiosData) {
            const studio = state.studios.find(s => s.id === studioId);
            if (studio) {
                foundStudio = studio;
                foundState = state;
                break;
            }
        }

        if (foundStudio) {
            // Create URL-friendly names
            const stateSlug = foundState.state.toLowerCase().replace(/\s+/g, '-');
            const citySlug = foundStudio.city.toLowerCase().replace(/\s+/g, '-');
            const studioSlug = foundStudio.name.toLowerCase().replace(/\s+/g, '-');
            
            // Construct new URL
            const newPath = `/${stateSlug}/${citySlug}/${studioSlug}`;
            
            // Update URL without reloading the page
            window.history.replaceState(
                { studioId },
                '',
                newPath
            );

            // Continue with normal page rendering
            renderStudioPage(foundStudio);
        }
    } else {
        // Handle direct access to pretty URL
        const pathParts = window.location.pathname.split('/').filter(Boolean);
        if (pathParts.length === 3) {
            // Find studio by matching slugs
            const [stateSlug, citySlug, studioSlug] = pathParts;
            
            await loadStudiosData();
            
            // Find matching studio
            for (const state of allStudiosData) {
                const stateMatches = state.state.toLowerCase().replace(/\s+/g, '-') === stateSlug;
                if (stateMatches) {
                    const studio = state.studios.find(s => 
                        s.city.toLowerCase().replace(/\s+/g, '-') === citySlug &&
                        s.name.toLowerCase().replace(/\s+/g, '-') === studioSlug
                    );
                    if (studio) {
                        renderStudioPage(studio);
                        return;
                    }
                }
            }
        }
        
        // Show error if studio not found
        document.getElementById('error-message').hidden = false;
        document.querySelector('.studio-content').hidden = true;
    }
});