// src/services/reportService.js
class ReportService {
    constructor({ reportRepository, aiService, imageUtil }) {
        this.reportRepository = reportRepository;
        this.aiService = aiService;
        this.imageUtil = imageUtil;
    }

    // Fungsi utama: Membuat dan menyimpan laporan (Dipanggil oleh POST /reports)
    async createReport(payload, files) {
        // Ambil objek file lengkap dari Multer.fields (files.image dan files.wound adalah array)
        const imageUrl = files.image?.[0]?.path || null; // Bukti pendukung
        const woundFile = files.wound?.[0] || null;      // Objek file lengkap gambar luka
        const woundImageUrl = woundFile?.path || null;

        let woundScore = null;

        // Prioritaskan score dari frontend jika ada (untuk konsistensi)
        if (payload.wound_score) {
            woundScore = parseInt(payload.wound_score, 10);
        }
        // Jika tidak ada dari frontend, baru hitung ulang di backend
        else if (woundImageUrl) {
            try {
                // Gunakan fungsi scoreOnly yang baru untuk konsistensi
                woundScore = await this.scoreOnly(woundFile);
            } catch (error) {
                console.error(`Error during AI scoring during report creation:`, error.message);
                // Melempar error untuk ditangkap oleh controller
                throw error;
            }
        }

        // 2. Simpan ke DB (Mapping data dari payload ke nama kolom DB)
        // Perhatikan bahwa key di payload (nama, email, nomorHp) harus disesuaikan dengan skema DB (nama, email, nomor_hp)
        const report = {
            // Field dari frontend (payload)
            name: payload.nama,
            phone: payload.nomorHp,
            email: payload.email,
            facility: payload.lokasi_puskesmas || payload.lokasi,
            gender: payload.jenis_kelamin || payload.gender,
            description: payload.deskripsi,
            date: payload.tanggal, // Tanggal kejadian

            // Field dari files & score
            imageUrl: imageUrl,
            woundImageUrl: woundImageUrl,
            woundScore: woundScore,
        };

        const created = await this.reportRepository.create(report);
        return created;
    }

    // FUNGSI BARU: HANYA UNTUK SCORING (Dipanggil oleh POST /reports/predict)
    async scoreOnly(woundFile) {
        // Pastikan file object Multer memiliki path
        if (!woundFile || !woundFile.path) {
            throw new Error("File gambar luka tidak ditemukan.");
        }

        try {
            // Ambil mimeType dari objek Multer
            const mimeType = woundFile.mimetype || 'image/jpeg';

            const base64Data = this.imageUtil.convertImageToBase64(woundFile.path, mimeType);
            const woundScore = await this.aiService.scoreWound(base64Data);

            return woundScore;
        } catch (error) {
            console.error(`Error during AI scoring:`, error.message);
            // Lempar error agar controller bisa menangani status HTTP-nya
            throw error;
        }
    }

    async generateReportImage(report, options = { width: 1080, height: 1920 }) {
        return this.imageUtil.generateReportImage(report, options);
    }
}

module.exports = ReportService;