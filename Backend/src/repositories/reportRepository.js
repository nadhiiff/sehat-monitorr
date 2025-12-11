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
                // Self-healing: If table missing (42P01), create it and retry
                if (err.code === '42P01') {
                    console.log("Table missing. Attempting to create table and retry...");
                    try {
                        await this.db.initializeDatabase();
                        // Retry the insert
                        const res = await this.db.query(query, values);
                        const newReportId = res.rows[0].id;
                        resolve({ id: newReportId, ...reportData });
                        return;
                    } catch (retryErr) {
                        console.error("Retry failed:", retryErr);
                        reject(new Error(`Gagal menyimpan (Retry failed): ${retryErr.message}`));
                        return;
                    }
                }

                console.error("Repository Error creating report:", err);
                reject(new Error(`DB ERROR: ${err.message}`));
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