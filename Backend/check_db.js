const sqlite3 = require('sqlite3').verbose();
const path = require('path');

const dbPath = path.resolve(__dirname, 'database.sqlite');
const db = new sqlite3.Database(dbPath);

db.serialize(() => {
    db.all("SELECT * FROM reports ORDER BY id DESC LIMIT 1", (err, rows) => {
        if (err) {
            console.error(err);
        } else {
            console.log("Latest Report:", rows[0]);
        }
    });
});

db.close();
