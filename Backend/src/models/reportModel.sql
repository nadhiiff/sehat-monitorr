DO $$ BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'jenis_kelamin_enum') THEN
        CREATE TYPE jenis_kelamin_enum AS ENUM ('pria', 'wanita');
    END IF;
END $$;

DROP TABLE IF EXISTS reports;

CREATE TABLE reports (
    laporan_id SERIAL PRIMARY KEY,
    nama VARCHAR(100) NOT NULL,
    nomor_hp VARCHAR(20),
    email VARCHAR(100) NOT NULL,
    lokasi_puskesmas VARCHAR(255) NOT NULL,
    tanggal DATE NOT NULL CHECK (tanggal <= CURRENT_DATE),
    jenis_kelamin jenis_kelamin_enum NOT NULL,
    unggah_gambar_luka VARCHAR(255),
    bukti_pendukung VARCHAR(255) NOT NULL,
    deskripsi VARCHAR(100) NOT NULL,
    wound_score INTEGER,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);