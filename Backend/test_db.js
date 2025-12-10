const db = require('./src/config/db');
console.log('Testing Database Connection...');
console.log('DB Object Type:', typeof db);
console.log('Has close method?', typeof db.close);

if (typeof db.close === 'function') {
    console.log('Closing database...');
    db.close((err) => {
        if (err) console.error('Error closing:', err);
        else console.log('Database closed successfully.');
    });
} else {
    console.error('CRITICAL: db.close is NOT a function!');
}
