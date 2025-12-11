const multer = require('multer');
const path = require('path');
const fs = require('fs');

// Gunakan /tmp untuk Vercel (read-only filesystem), atau ./uploads untuk lokal
const uploadDir = process.env.VERCEL ? '/tmp' : path.join(process.env.UPLOAD_DIR || './uploads');

// Pastikan direktori upload ada
if (!fs.existsSync(uploadDir)) {
    fs.mkdirSync(uploadDir, { recursive: true });
}

const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, uploadDir);
    },
    filename: (req, file, cb) => {
        // Simpan nama file dengan timestamp
        cb(null, `${Date.now()}-${file.fieldname}-${file.originalname}`);
    }
});

// Multer instance untuk handle single file upload (field: wound_image)
const uploadWoundImageMiddleware = multer({
    storage: storage,
    limits: { fileSize: 5 * 1024 * 1024 },
    fileFilter: (req, file, cb) => {
        if (file.mimetype.startsWith('image/')) {
            cb(null, true);
        } else {
            // Menggunakan MulterError untuk konsistensi error handling
            cb(new multer.MulterError('FILE_TYPE_UNSUPPORTED', 'Only image files are allowed!'), false);
        }
    }
}).single('wound_image');

const handleWoundUpload = (req, res, next) => {
    uploadWoundImageMiddleware(req, res, (err) => {
        if (err instanceof multer.MulterError) {
            return res.status(400).json({ error: err.message });
        } else if (err) {
            return res.status(400).json({ error: err.message || 'Unknown file upload error.' });
        }

        if (req.path === '/predict' && !req.file) {
            return res.status(400).json({ error: 'Image file (wound_image) is required for prediction.' });
        }

        if (req.file) {
            req.woundImagePath = req.file.path;
        }

        next();
    });
};

module.exports = {
    handleWoundUpload,
    uploadWoundImageMiddleware
};