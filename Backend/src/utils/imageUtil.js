const sharp = require('sharp');
const fs = require('fs');

// Fungsi untuk membuat gambar laporan (Fitur 6)
async function generateReportImage(report, { width = 1080, height = 1920, format = 'jpeg' } = {}) {
    // Escape XML characters from report data to prevent SVG injection issues
    const safeReport = {};
    for (const key in report) {
        safeReport[key] = escapeXml(report[key] || '');
    }

    // Buat SVG overlay dengan data laporan (otomatis word-wrap)
    // Desain disesuaikan dengan FormDownload.jsx
    // Warna: Background #1A472B, Text Pink #F9A8D4, Text White #FFFFFF

    const svg = `
    <svg width="${width}" height="${height}">
        <style>
            .bg { fill: #1A472B; }
            .card-bg { fill: rgba(0, 0, 0, 0.4); rx: 20; }
            .label { font-size: 24px; fill: #F9A8D4; font-family: Arial, sans-serif; }
            .value { font-size: 40px; font-weight: bold; fill: #FFFFFF; font-family: Arial, sans-serif; }
            .desc-text { font-size: 30px; fill: #FFFFFF; font-family: Arial, sans-serif; }
            .footer { font-size: 24px; fill: #F9A8D4; font-family: Arial, sans-serif; text-anchor: middle; }
            .header-title { font-size: 48px; font-weight: bold; fill: #F9A8D4; font-family: Arial, sans-serif; text-anchor: middle; }
            .line { stroke: #FFFFFF; stroke-width: 2; }
        </style>
        
        <!-- Background -->
        <rect width="100%" height="100%" class="bg"/>
        
        <!-- Header -->
        <text x="${width / 2}" y="100" class="header-title">SETOR</text>
        
        <!-- Main Content Card -->
        <rect x="50" y="150" width="${width - 100}" height="${height - 300}" class="card-bg"/>
        
        <!-- Nama -->
        <text x="100" y="220" class="label">Halo! nama saya</text>
        <text x="100" y="270" class="value">${safeReport.nama || safeReport.name}</text>
        <line x1="100" y1="290" x2="${width - 100}" y2="290" class="line"/>
        
        <!-- Fasilitas -->
        <text x="100" y="350" class="label">Saya mendapatkan pelayanan kesehatan yang buruk di</text>
        <text x="100" y="400" class="value">${safeReport.lokasi_puskesmas || safeReport.facility}</text>
        <line x1="100" y1="420" x2="${width - 100}" y2="420" class="line"/>
        
        <!-- Wound Score -->
        <text x="100" y="480" class="label">Wound Score</text>
        <text x="100" y="530" class="value">${report.wound_score ?? report.woundScore ?? 'N/A'}</text>
        
        <!-- Deskripsi -->
        <text x="100" y="600" class="label">Deskripsi</text>
        <foreignObject x="100" y="630" width="${width - 200}" height="400">
            <body xmlns="http://www.w3.org/1999/xhtml">
                <div style="font-size:30px;color:#fff;font-family:Arial;line-height:1.4">${safeReport.deskripsi || safeReport.description || '-'}</div>
            </body>
        </foreignObject>
        
        <!-- Footer -->
        <text x="${width / 2}" y="${height - 50}" class="footer">reported via www.sehatmonitor.xyz</text>
    </svg>`;

    const svgBuffer = Buffer.from(svg);

    let base = sharp({
        create: {
            width,
            height,
            channels: 3,
            background: '#1A472B' // Match background color
        }
    });

    let finalBuffer;

    // Konversi output berdasarkan format yang diminta
    if (format === 'png') {
        finalBuffer = await base
            .composite([{ input: svgBuffer, top: 0, left: 0 }])
            .png()
            .toBuffer();
    } else {
        // Default ke JPEG
        finalBuffer = await base
            .composite([{ input: svgBuffer, top: 0, left: 0 }])
            .jpeg({ quality: 90 })
            .toBuffer();
    }


    return finalBuffer;
}

// Fungsi untuk konversi gambar ke Base64 (untuk AI Scoring)
function convertImageToBase64(filePath, mimeType) {
    if (!fs.existsSync(filePath)) {
        throw new Error(`File not found at path: ${filePath}`);
    }
    // Baca file secara sinkron 
    const fileBuffer = fs.readFileSync(filePath);

    // Konversi ke Base64 string
    const base64String = fileBuffer.toString('base64');

    // Mengembalikan format yang dibutuhkan oleh Gemini API
    return {
        data: base64String,
        mimeType: mimeType
    };
}


function escapeXml(str) {
    return String(str || '')
        .replace(/&/g, '&amp;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&apos;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;');
}

module.exports = {
    generateReportImage,
    convertImageToBase64
};