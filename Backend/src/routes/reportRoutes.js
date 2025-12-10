const express = require('express');
const { handleWoundUpload } = require('../middleware/uploadMiddleware');
const multer = require('multer');


const uploadDir = process.env.UPLOAD_DIR || './uploads';

const fullReportUpload = multer({ dest: uploadDir }).fields([
    { name: 'bukti_pendukung', maxCount: 1 },
    { name: 'wound_image', maxCount: 1 }
]);


function reportRoutesFactory(controller) {
    const router = express.Router();

    router.post('/predict', handleWoundUpload, controller.predictSeverity);

    router.post('/', fullReportUpload, controller.createReport);

    router.get('/:id/image', controller.getReportImage);
    router.get('/:id', controller.getReportById);

    return router;
}

module.exports = reportRoutesFactory;