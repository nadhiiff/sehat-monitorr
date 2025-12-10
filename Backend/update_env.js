const fs = require('fs');
const path = require('path');

const envPath = path.resolve(__dirname, '.env');
const envContent = `PORT=3000
DATABASE_URL=postgresql://postgres:psnCJpyrRWqdVMDBtDrZqUIDuVRleWpl@postgres.railway.internal:5432/railway
UPLOAD_DIR=./uploads

AI_API_URL=https://generativelanguage.googleapis.com/v1beta/models/gemini-flash-latest:generateContent
AI_API_KEY=AIzaSyAgmXqu9wXqCi0WVPexXLaINV1aETksc8Q

REPORT_IMAGE_WIDTH=1080
REPORT_IMAGE_HEIGHT=1920
`;

try {
    fs.writeFileSync(envPath, envContent);
    console.log('Successfully updated .env file at:', envPath);
    console.log('New Content:');
    console.log(fs.readFileSync(envPath, 'utf8'));
} catch (err) {
    console.error('Error writing .env file:', err);
}
