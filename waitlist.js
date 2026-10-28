// Waitlist signups for coming-soon regions, stored in Supabase.
// The anon key is public by design; row-level security only permits inserts.
const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL;
const SUPABASE_ANON_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY;

// Same shape as the check constraint on waitlist_signups.email
const EMAIL_RE = /^[^@\s]+@[^@\s]+\.[^@\s]+$/;

document.addEventListener('DOMContentLoaded', () => {
    const form = document.getElementById('waitlist-form');
    if (!form) return;

    const status = document.getElementById('waitlist-status');
    const emailInput = form.querySelector('input[type="email"]');
    const cityInput = form.querySelector('input[name="city"]');
    const countryInput = form.querySelector('input[name="country"]');
    const submitBtn = form.querySelector('button[type="submit"]');

    // Known coming-soon regions prefill both fields from the card's label
    const REGION_PREFILL = { London: { city: 'London', country: 'United Kingdom' } };

    function setStatus(message, isError = false) {
        status.textContent = message;
        status.classList.toggle('error', isError);
    }

    if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
        console.error('Waitlist: VITE_SUPABASE_URL and/or VITE_SUPABASE_ANON_KEY are not set');
        submitBtn.disabled = true;
        setStatus('Signups are temporarily unavailable — email pilatesfinderinfo@gmail.com and we\'ll add you.', true);
        return;
    }

    // Coming-soon city cards link to #waitlist; prefill the city they clicked
    document.addEventListener('click', (e) => {
        const link = e.target.closest('a[data-waitlist-region]');
        if (!link) return;
        const region = link.dataset.waitlistRegion;
        const prefill = REGION_PREFILL[region] || { city: region, country: '' };
        cityInput.value = prefill.city;
        countryInput.value = prefill.country;
    });

    form.addEventListener('submit', async (e) => {
        e.preventDefault();
        const email = emailInput.value.trim();
        const city = cityInput.value.trim();
        const country = countryInput.value.trim();
        if (!city || !country) {
            setStatus('Please tell us the city and country.', true);
            return;
        }
        if (!EMAIL_RE.test(email)) {
            setStatus('Please enter a valid email address.', true);
            return;
        }

        submitBtn.disabled = true;
        setStatus('Signing you up…');
        try {
            const resp = await fetch(`${SUPABASE_URL}/rest/v1/waitlist_signups`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    apikey: SUPABASE_ANON_KEY,
                    Authorization: `Bearer ${SUPABASE_ANON_KEY}`,
                },
                body: JSON.stringify({ email, region: `${city}, ${country}` }),
            });
            if (resp.ok) {
                form.reset();
                setStatus("You're on the list — we'll email you as soon as it's ready!");
            } else if (resp.status === 409) {
                // Unique index hit: this email already signed up for this region
                setStatus("You're already on the list — we'll be in touch soon!");
            } else {
                throw new Error(`Supabase responded with ${resp.status}`);
            }
        } catch (err) {
            console.error('Waitlist signup failed', err);
            setStatus('Something went wrong — please try again in a moment.', true);
        } finally {
            submitBtn.disabled = false;
        }
    });
});
