const axios = require('axios');
const FormData = require('form-data');
const fs = require('fs');

async function testEndpoint() {
    console.log("--- Testing Backend Endpoint (http://localhost:3000/reports/predict) ---");

    // Create a dummy image file (1x1 pixel PNG)
    const dummyImageBuffer = Buffer.from('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg==', 'base64');
    const form = new FormData();
    form.append('wound_image', dummyImageBuffer, 'test.png');

    try {
        const response = await axios.post('http://localhost:3000/reports/predict', form, {
            headers: {
                ...form.getHeaders()
            }
        });
        console.log("SUCCESS! Status:", response.status);
        console.log("Data:", response.data);
    } catch (error) {
        console.error("FAILED.");
        if (error.response) {
            console.error("Status:", error.response.status);
            console.error("Data:", JSON.stringify(error.response.data, null, 2));
        } else if (error.code === 'ECONNREFUSED') {
            console.error("Connection Refused. Is the server running on port 3000?");
        } else {
            console.error("Error:", error.message);
        }
    }
}

testEndpoint();
