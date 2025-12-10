// Menggunakan db wrapper dari pg (src/config/db.js)
class ReportRepository {
    constructor(db) {
        this.db = db;
    }

    create(reportData) {
        return new Promise(async (resolve, reject) => {
            const query = `
                INSERT INTO reports 
                (nama, nomor_hp, email, lokasi_puskesmas, jenis_kelamin, deskripsi, unggah_gambar_luka, wound_score, bukti_pendukung) 
                VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
                RETURNING id
            `;

            const values = [
                reportData.name,
                reportData.phone,
                reportData.email,
                reportData.facility,
                reportData.gender,
                reportData.description,
                reportData.woundImageUrl,
                reportData.woundScore,
                reportData.imageUrl
            ];

            try {
                // this.db.query mengembalikan result object dari pg
                const res = await this.db.query(query, values);
                // Postgres mengembalikan baris yang dimasukkan jika menggunakan RETURNING
                const newReportId = res.rows[0].id;

                resolve({
                    id: newReportId,
                    ...reportData
                });
            } catch (err) {
                console.error("Repository Error creating report:", err);
                reject(new Error("Gagal menyimpan laporan ke database."));
            }
        });
    }

    getById(id) {
        return new Promise(async (resolve, reject) => {
            const query = `SELECT * FROM reports WHERE id = $1`;
            try {
                const res = await this.db.query(query, [id]);
                if (res.rows.length > 0) {
                    resolve(res.rows[0]);
                } else {
                    resolve(null);
                }
            } catch (err) {
                reject(err);
            }
        });
    }
}

module.exports = ReportRepository;