// Contact form: submits via FormSubmit's AJAX endpoint, which emails the
// message to the address in the URL. No API key is needed; the first
// submission triggers a one-time activation email to that inbox.
const ENDPOINT = 'https://formsubmit.co/ajax/pilatesfinderinfo@gmail.com';

document.addEventListener('DOMContentLoaded', () => {
    const form = document.getElementById('contact-form');
    if (!form) return;

    const status = document.getElementById('contact-status');
    const submitBtn = form.querySelector('button[type="submit"]');

    function setStatus(message, isError = false) {
        status.textContent = message;
        status.classList.toggle('error', isError);
    }

    form.addEventListener('submit', async (e) => {
        e.preventDefault();
        submitBtn.disabled = true;
        setStatus('Sending…');
        try {
            const resp = await fetch(ENDPOINT, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
                body: JSON.stringify(Object.fromEntries(new FormData(form))),
            });
            const data = await resp.json().catch(() => ({}));
            if (!resp.ok || data.success === 'false') {
                throw new Error(data.message || `FormSubmit responded with ${resp.status}`);
            }
            form.reset();
            setStatus("Thanks — your message is on its way. We'll reply within 24-48 hours.");
        } catch (err) {
            console.error('Contact form submission failed', err);
            setStatus('Something went wrong — please email info@pilatesfinder.org directly.', true);
        } finally {
            submitBtn.disabled = false;
        }
    });
});
