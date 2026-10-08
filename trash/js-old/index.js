document.addEventListener('DOMContentLoaded', () => {
    // Hamburger menu functionality
    const hamburger = document.querySelector('.hamburger');
    const navMenu = document.querySelector('.nav-menu');

    if (hamburger && navMenu) {
        hamburger.addEventListener('click', () => {
            navMenu.classList.toggle('active');
        });
    }

    // Close menu when clicking outside
    document.addEventListener('click', (e) => {
        if (!e.target.closest('.nav-container')) {
            navMenu.classList.remove('active');
        }
    });

    // Types of Pilates scroll functionality
    const typesLink = document.querySelector('a[href="#types-of-pilates"]');
    if (typesLink) {
        typesLink.addEventListener('click', (e) => {
            e.preventDefault();
            const typesSection = document.querySelector('#types-of-pilates');
            if (typesSection) {
                typesSection.scrollIntoView({ behavior: 'smooth' });
            } else {
                window.location.href = 'index.html#types-of-pilates';
            }
        });
    }
});
