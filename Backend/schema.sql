-- Skema database untuk PostgreSQL
-- Jalankan ini di phpMyAdmin / pgAdmin atau CLI cPanel jika tabel tidak terbuat otomatis

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
