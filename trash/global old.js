// ...existing code...

function getStudioUrl(studio) {
    const stateSlug = studio.state.toLowerCase().replace(/\s+/g, '-');
    const citySlug = studio.city.toLowerCase().replace(/\s+/g, '-');
    const studioSlug = studio.name.toLowerCase().replace(/\s+/g, '-');
    return `/${stateSlug}/${citySlug}/${studioSlug}`;
}

// ...existing code...
