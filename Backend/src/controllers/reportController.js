const makeReportController = ({ reportService }) => {

    // Fungsi utilitas untuk menangani error AI yang dilempar
    const handleAiError = (error, res) => {
        console.error("Error memproses AI:", error.message);

        const errorMessage = error.message;
        let statusCode = 500;

        // Pengecekan status HTTP yang dilempar dari service (misalnya 400, 403)
        // Menggunakan case-insensitive regex untuk menangkap "Status 404" atau "status 404"
        const match = errorMessage.match(/Status (\d{3})/i);

        if (match) {
            statusCode = parseInt(match[1], 10);

            // Tangani error API Key (403)
            if (statusCode === 403 || errorMessage.includes('API Key')) {
                // DEBUG: Show which key is being used (masked) AND the real error
                const usedKey = process.env.AI_API_KEY ? `${process.env.AI_API_KEY.substring(0, 8)}...` : 'undefined';

                // Extract detailed message from Google if available
                const googleError = error.response?.data?.error?.message || error.message;

                return res.status(403).json({
                    error: `Akses Ditolak (${googleError}). Key used: ${usedKey}.`
                });
            }
        } else if (errorMessage.includes('ENOENT') || errorMessage.includes('no such file')) {
            statusCode = 400;
        } else if (errorMessage.includes('network') || errorMessage.includes('ETIMEDOUT')) {
            statusCode = 503;
        }

        return res.status(statusCode).json({ error: `Gagal memproses AI: ${errorMessage}` });
    };


    // Route: POST /reports/predict (Untuk AI scoring saja)
    const predictSeverity = async (req, res) => {
        // req.file didapatkan dari middleware handleWoundUpload (single file)
        const woundFile = req.file;

        if (!woundFile) {
            // Ini seharusnya ditangani oleh middleware, tapi ini adalah safety check
            return res.status(400).json({ error: 'Image file (wound_image) is missing.' });
        }

        try {
            // PERBAIKAN KRITIS: Panggil reportService.scoreOnly, BUKAN createReport.
            // scoreOnly hanya akan memproses AI dan mengembalikan skor, tanpa menyentuh DB.
            const score = await reportService.scoreOnly(woundFile);

            if (score === null) {
                return res.status(500).json({ error: 'Gagal mendapatkan skor keparahan dari AI.' });
            }

            // Mengembalikan skor yang berhasil didapat
            return res.status(200).json({
                severity_score: score
            });

        } catch (error) {
            return handleAiError(error, res);
        }
    };

    // Route: POST /reports (Untuk submission laporan penuh)
    const createReport = async (req, res) => {
        try {
            console.log("DEBUG: createReport req.body:", req.body);
            // req.files dari Multer.fields (multiple files)
            const files = {
                image: req.files?.bukti_pendukung, // Array
                wound: req.files?.wound_image // Array
            };

            // Karena ini adalah POST /reports, kita panggil createReport yang menyimpan ke DB.
            const created = await reportService.createReport(req.body, files);

            return res.status(201).json({
                message: 'Laporan kesehatan berhasil dibuat.',
                data: created
            });

        } catch (error) {
            console.error("Error creating report:", error);

            // Tangani error NOT NULL PostgreSQL (code '23502')
            if (error.code === '23502') {
                return res.status(400).json({ error: 'Data tidak lengkap. Harap isi semua kolom wajib.' });
            }
            if (error.message.includes('Gemini API returned status')) {
                // Jika error berasal dari AI Service
                return res.status(400).json({ error: error.message });
            }

            return res.status(500).json({ error: error.message || 'Gagal membuat laporan.' });
        }
    };

    // Route: GET /reports/:id/image
    const getReportImage = async (req, res) => {
        const reportId = parseInt(req.params.id);

        try {
            const report = await reportService.reportRepository.getById(reportId);

            if (!report) {
                return res.status(404).json({ error: 'Laporan tidak ditemukan.' });
            }

            const imageBuffer = await reportService.generateReportImage(report);

            res.setHeader('Content-Type', 'image/jpeg');
            res.setHeader('Content-Disposition', `attachment; filename="report-${reportId}.jpg"`);
            res.send(imageBuffer);

        } catch (error) {
            console.error("Error generating report image:", error);
            return res.status(500).json({ error: 'Gagal membuat gambar laporan.' });
        }
    };

    // Route: GET /reports/:id
    const getReportById = async (req, res) => {
        const reportId = parseInt(req.params.id);
        try {
            const report = await reportService.reportRepository.getById(reportId);
            if (!report) {
                return res.status(404).json({ error: 'Laporan tidak ditemukan.' });
            }
            return res.status(200).json({ data: report });
        } catch (error) {
            console.error("Error fetching report:", error);
            return res.status(500).json({ error: 'Gagal mengambil data laporan.' });
        }
    };

    return {
        predictSeverity,
        createReport,
        getReportImage,
        getReportById
    };
};

module.exports = { makeReportController };