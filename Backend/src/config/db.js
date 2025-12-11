const { Pool } = require('pg');
const dotenv = require('dotenv');

dotenv.config();

// Konfigurasi koneksi database PostgreSQL
// Pastikan DATABASE_URL ada di .env: postgresql://user:password@host:port/database
// Fix for SSL error: strip query params (like sslmode=require) that might conflict with our config
const connectionString = process.env.DATABASE_URL ? process.env.DATABASE_URL.split('?')[0] : process.env.DATABASE_URL;

const pool = new Pool({
    connectionString: connectionString,
    // Fix for "self-signed certificate in certificate chain" error
    // Must set rejectUnauthorized: false for Supabase/Neon/Vercel Postgres
    ssl: { rejectUnauthorized: false }
});

pool.on('connect', () => {
    console.log('Connected to the PostgreSQL database.');
});

pool.on('error', (err) => {
    console.error('Unexpected error on idle client', err);
    process.exit(-1);
});

// Fungsi inisialisasi tabel (dipanggil di app.js atau script terpisah)
const initializeDatabase = async () => {
    const createTableQuery = `
        CREATE TABLE IF NOT EXISTS reports (
            id SERIAL PRIMARY KEY,
            nama VARCHAR(255) NOT NULL,
            nomor_hp VARCHAR(50) NOT NULL,
            email VARCHAR(255),
            lokasi_puskesmas VARCHAR(255),
            jenis_kelamin VARCHAR(20),
            deskripsi TEXT,
            unggah_gambar_luka TEXT,
            wound_score INTEGER,
            bukti_pendukung TEXT,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        );
    `;

    try {
        const client = await pool.connect();
        await client.query(createTableQuery);
        client.release();
        console.log('Table "reports" is ready/checked.');
    } catch (err) {
        console.error('Error initializing database:', err.message);
    }
};

// Jalankan inisialisasi jika file ini dijalankan langsung (opsional)
if (require.main === module) {
    initializeDatabase();
}

module.exports = {
    query: (text, params) => pool.query(text, params),
    pool,
    initializeDatabase
};