import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import axios from 'axios';
import groupImage from '../Asset/backgroundBerhasil.png';

// Asumsi backend berjalan di port 3000
const API_BASE_URL = process.env.REACT_APP_API_BASE_URL || 'http://localhost:3000';

const ReportBerhasil = () => {
  const [isExporting, setIsExporting] = useState(false);
  const [reportData, setReportData] = useState(null);
  const navigate = useNavigate();
  const location = useLocation();

  // Ambil reportId dari state navigasi yang dikirim oleh ReportForm
  const reportId = location.state?.reportId;

  // Jika reportId tidak ada, arahkan kembali ke form atau beranda
  useEffect(() => {
    if (!reportId) {
      navigate('/report-form', { replace: true });
    } else {
      // Fetch report data
      axios.get(`${API_BASE_URL}/reports/${reportId}`)
        .then(response => {
          setReportData(response.data.data);
        })
        .catch(err => {
          console.error("Error fetching report:", err);
        });
    }
  }, [reportId, navigate]);

  // Mengubah handleExport menjadi fungsi navigasi ke FormDownload
  const handleExport = () => {
    if (reportData) {
      setIsExporting(true);
      // Navigasi ke FormDownload dengan data yang diambil dari backend
      // Kita perlu mapping key dari backend (snake_case) ke yang diharapkan FormDownload (camelCase/custom)
      const formDataForDownload = {
        nama: reportData.nama,
        lokasi: reportData.lokasi_puskesmas,
        deskripsi: reportData.deskripsi,
        // Kirim URL gambar (string)
        buktiPendukung: reportData.bukti_pendukung ? `${API_BASE_URL}/${reportData.bukti_pendukung.replace(/\\/g, '/')}` : null,
        gambarLuka: reportData.unggah_gambar_luka ? `${API_BASE_URL}/${reportData.unggah_gambar_luka.replace(/\\/g, '/')}` : null,
        woundScore: reportData.wound_score
      };

      navigate('/form-download', { state: formDataForDownload });
      setTimeout(() => setIsExporting(false), 1000);
    }
  };

  // Logika tampilan untuk ID Laporan
  const reportIdDisplay = reportId || 'Loading...';

  return (
    <div className="relative min-h-screen bg-[#1A472B] text-white font-sans animate-fadeIn">

      <div className="absolute inset-0 z-0 overflow-hidden">
        <img src={groupImage}
          alt=""
          className="w-full h-full object-cover opacity-90" />
      </div>

      {/* Main Content */}
      <main className="py-12 px-6 relative z-20">
        <div className="container mx-auto">
          <h1 className="text-3xl md:text-4xl text-white font-bold text-center mb-8">
            <span className="text-pink-300">Terima Kasih</span> telah menggunakan <span className="text-pink-300">SETOR</span>
          </h1>

          <div className="max-w-md mx-auto bg-green-50 rounded-xl p-8 shadow-lg">
            <div className="text-center">
              <div className="mb-6">
                <div className="inline-flex items-center justify-center w-24 h-24 bg-green-500 rounded-full">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-12 w-12 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                </div>
              </div>

              <h2 className="text-2xl font-bold text-green-900 mb-4">
                Laporan berhasil dikirim!
              </h2>

              {/* Tampilkan ID Laporan */}
              <p className="text-green-800 mb-2 font-semibold">
                ID Laporan Anda:
              </p>
              <p className="text-2xl font-extrabold text-pink-500 mb-6">
                {reportIdDisplay}
              </p>

              <p className="text-green-800 mb-6">
                Kami akan mengirimkan email kepada anda untuk status verifikasi dan informasi selanjutnya.
              </p>

              {/* Tombol Unduh Laporan (Navigasi ke FormDownload) */}
              <button
                onClick={handleExport}
                disabled={isExporting || !reportData}
                className={`inline-block px-6 py-3 rounded-full font-semibold ${isExporting || !reportData
                  ? 'bg-gray-400 cursor-not-allowed'
                  : 'bg-pink-300 text-green-900 hover:bg-pink-400'
                  } transition-colors mb-4`}
              >
                {isExporting ? 'Mempersiapkan...' : '⬇ Export Image'}
              </button>

              {/* Tombol Share */}
              <button
                disabled={!reportId}
                className={`inline-block px-6 py-3 rounded-full font-semibold ${!reportId ? 'bg-gray-400 cursor-not-allowed' : 'bg-pink-300 text-green-900 hover:bg-pink-400'
                  } transition-colors mb-4 ml-2`}
              >
                🔗 Share Laporan
              </button>

              <p className="text-sm text-green-700">
                Bagikan laporan Anda ke media sosial untuk meningkatkan kesadaran publik.
              </p>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
};

export default ReportBerhasil;