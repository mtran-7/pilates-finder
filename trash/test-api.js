const axios = require('axios');

async function testApi() {
    const apiUrl = 'https://api.example.com/search'; // Replace with the actual API URL
    const params = {
        location: 'New York, NY',
        query: 'Pilates studios'
    };

    try {
        const response = await axios.get(apiUrl, { params });
        console.log('API Response:', response);
    } catch (error) {
        if (error.response) {
            console.error('Error Response:', error.response.status, error.response.data);
        } else if (error.request) {
            console.error('No Response Received:', error.request);
        } else {
            console.error('Error:', error.message);
        }
    }
}

testApi();