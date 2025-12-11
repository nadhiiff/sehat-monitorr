import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios'; // Import axios
import groupImage from '../Asset/backgroundReport.png';
import ellipseImage from '../Asset/Ellipse 1.png';

// Asumsi backend berjalan di port 3000
const API_BASE_URL = process.env.REACT_APP_API_BASE_URL || '/api';

const ReportForm = () => {
  const navigate = useNavigate();

  const [formData, setFormData] = useState({
    nama: '',
    nomorHp: '',
    email: '',
    lokasi: '',
    tanggal: '',
    gender: 'pria',
    deskripsi: '',
    gambarLuka: null,       // File object
    buktiPendukung: null    // File object
  });

  // State untuk melacak AI score, loading, dan error
  const [woundScore, setWoundScore] = useState(null);
  const [loadingAi, setLoadingAi] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submissionError, setSubmissionError] = useState(null);

  // --- FUNGSI UTAMA: SUBMISSION LAPORAN PENUH ---
  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    setSubmissionError(null);

    // --- CUSTOM VALIDATION ---
    // Kita validasi manual karena 'gambarLuka' bersifat opsional tapi yang lain wajib.
    // List field yang WAJIB diisi:
    const requiredFields = [
      { key: 'nama', label: 'Nama' },
      { key: 'nomorHp', label: 'Nomor HP' },
      { key: 'email', label: 'Email' },
      { key: 'lokasi', label: 'Lokasi' },
      { key: 'tanggal', label: 'Tanggal' },
      { key: 'gender', label: 'Gender' },
      { key: 'deskripsi', label: 'Deskripsi' },
      { key: 'buktiPendukung', label: 'Bukti Pendukung' }
    ];

    // Cek apakah ada field wajib yang kosong
    const missingFields = requiredFields.filter(field => {
      const value = formData[field.key];
      return !value || value === '';
    });

    if (missingFields.length > 0) {
      const missingLabels = missingFields.map(f => f.label).join(', ');
      setSubmissionError(`Harap lengkapi data berikut: ${missingLabels}. (Foto luka bersifat opsional)`);
      setIsSubmitting(false);
      // Scroll ke atas agar user melihat error
      window.scrollTo({ top: 0, behavior: 'smooth' });
      return;
    }
    // --- END CUSTOM VALIDATION ---

    // 1. Buat FormData untuk mengirim file dan data teks
    const data = new FormData();

    // Tambahkan field teks
    for (const key in formData) {
      if (key !== 'gambarLuka' && key !== 'buktiPendukung' && formData[key] !== null) {
        data.append(key, formData[key]);
      }
    }

    // Tambahkan file
    if (formData.gambarLuka) {
      // PENTING: Kunci harus 'wound_image' sesuai backend/Multer
      data.append('wound_image', formData.gambarLuka);
    }
    if (formData.buktiPendukung) {
      // PENTING: Kunci harus 'image' atau 'bukti_pendukung'. Kita gunakan 'bukti_pendukung'
      // Jika backend hanya menerima satu field untuk bukti pendukung, kita gunakan nama field yang sama.
      // Kita asumsikan backend menerima 'bukti_pendukung' untuk gambar umum.
      data.append('bukti_pendukung', formData.buktiPendukung);
    }

    // Tambahkan skor AI yang sudah dihitung
    if (woundScore !== null) {
      data.append('wound_score', woundScore);
    } else if (formData.gambarLuka) {
      // Jika ada gambar luka tapi skor belum dihitung (user tidak menunggu), ini bisa jadi error
      setSubmissionError("Tolong tunggu hingga skor AI selesai dihitung.");
      setIsSubmitting(false);
      return;
    }

    try {
      const response = await axios.post(`${API_BASE_URL}/reports`, data, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });

      setIsSubmitting(false);

      // Asumsi backend mengembalikan { data: { laporan_id: 101, ... } }
      // Kita perlu tahu nama field ID yang benar (laporan_id atau id). Asumsi laporan_id.
      const reportId = response.data.data.laporan_id || response.data.data.id;

      // Redirect ke halaman sukses setelah submission nyata
      navigate('/report-berhasil', { state: { reportId: reportId } });

    } catch (err) {
      setIsSubmitting(false);
      // Tangani error dari backend
      const errorMessage = err.response?.data?.error || "Gagal mengirim laporan. Cek server/network.";
      setSubmissionError(errorMessage);
      console.error("Submission Error:", err.response?.data || err);
    }
  };

  // --- FUNGSI 2: SCORING AI SAAT GAMBAR LUKA BERUBAH ---
  const handleFileChange = async (e) => {
    const { name, files } = e.target;
    const file = files[0];

    // Update state form (file object)
    setFormData(prev => ({ ...prev, [name]: file }));

    if (name === 'gambarLuka' && file) {
      setWoundScore(null);
      setSubmissionError(null);
      setLoadingAi(true);

      const data = new FormData();
      data.append('wound_image', file); // Kunci harus 'wound_image' sesuai backend

      try {
        const response = await axios.post(`${API_BASE_URL}/reports/predict`, data, {
          headers: {
            'Content-Type': 'multipart/form-data',
          },
        });

        // Asumsi backend mengembalikan { severity_score: 75 }
        const score = response.data.severity_score;
        setWoundScore(score);
        setLoadingAi(false);

      } catch (err) {
        setLoadingAi(false);
        setWoundScore("Error");
        const detail = err.response ? `${err.response.status} ${JSON.stringify(err.response.data)}` : err.message;
        setSubmissionError(`Debug Error: URL=${API_BASE_URL} Detail=${detail}`);
        console.error("AI Scoring Error:", err.response?.data || err);
      }
    }
  };

  // Fungsi untuk input teks biasa
  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };


  // Menentukan warna skor
  const getScoreColor = (score) => {
    if (score === "Error") return 'text-red-600';
    if (score > 70) return 'text-red-700';
    if (score > 40) return 'text-yellow-600';
    return 'text-green-700';
  };

  // UI (Tidak Berubah, hanya menambahkan logika display)
  return (
    <div className="min-h-screen bg-custom-green text-white font-sans relative animate-fadeIn">
      <div className="absolute inset-0 z-0 overflow-hidden">
        <img src={groupImage} alt="Group" className="w-full h-full object-cover opacity-100" />
      </div>

      {/* Main Content */}
      <main className="py-12 px-6">
        <div className="container mx-auto relative z-10">
          <h1 className="text-3xl md:text-4xl font-bold text-white text-center mb-8">
            <span className="text-pink-300">Laporkan</span> Keluhan Anda!
          </h1>

          <div className="max-w-4xl mx-auto bg-green-50 rounded-xl p-8 shadow-lg">

            {/* Area Error dan Loading Global */}
            {(submissionError || loadingAi || isSubmitting) && (
              <div className="mb-6 p-3 rounded-lg text-center font-semibold 
                                 bg-pink-100 border border-pink-300 text-pink-700">
                {submissionError && <p>{submissionError}</p>}
                {loadingAi && <p>Menganalisis gambar dengan AI...</p>}
                {isSubmitting && <p>Mengirim data laporan...</p>}
              </div>
            )}

            <form onSubmit={handleSubmit} noValidate>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">

                {/* Left Column (Input Data Pelapor) */}
                <div className="space-y-6">
                  <div>
                    <label className="block text-green-900 font-semibold mb-2">Nama</label>
                    <input
                      type="text"
                      name="nama"
                      value={formData.nama}
                      onChange={handleChange}
                      className="w-full px-4 py-2 border-2 border-green-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-pink-300 bg-white text-black"
                      placeholder="nama"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-green-900 font-semibold mb-2">Nomor Hp</label>
                    <input
                      type="tel"
                      name="nomorHp"
                      value={formData.nomorHp}
                      onChange={handleChange}
                      className="w-full px-4 py-2 border-2 border-green-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-pink-300 bg-white text-black"
                      placeholder="nomor hp"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-green-900 font-semibold mb-2">Email</label>
                    <input
                      type="email"
                      name="email"
                      value={formData.email}
                      onChange={handleChange}
                      className="w-full px-4 py-2 border-2 border-green-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-pink-300 bg-white text-black"
                      placeholder="setor@example.com"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-green-900 font-semibold mb-2">Lokasi Puskesmas/Klinik/RS</label>
                    <input
                      type="text"
                      name="lokasi"
                      value={formData.lokasi}
                      onChange={handleChange}
                      className="w-full px-4 py-2 border-2 border-green-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-pink-300 bg-white text-black"
                      placeholder="Sulawesi Selatan, Makassar, RS..."
                      required
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-green-900 font-semibold mb-2">Tanggal</label>
                      <div className="relative">
                        <input
                          type="date" // Mengganti type="text" menjadi type="date" untuk UX yang lebih baik
                          name="tanggal"
                          value={formData.tanggal}
                          onChange={handleChange}
                          className="w-full px-4 py-2 border-2 border-green-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-pink-300 bg-white text-black"
                          required
                        />
                        {/* Menghapus ikon calendar karena input type=date sudah memiliki native ikon */}
                      </div>
                      <p className="text-xs text-green-700 mt-1">Tanggal Kejadian</p>
                    </div>

                    <div>
                      <label className="block text-green-900 font-semibold mb-2">Gender</label>
                      <div className="flex items-center space-x-4 pt-3">
                        <label className="flex items-center">
                          <input
                            type="radio"
                            name="gender"
                            value="pria"
                            checked={formData.gender === 'pria'}
                            onChange={handleChange}
                            className="mr-2"
                            required
                          />
                          <span className="text-black">Pria</span>
                        </label>
                        <label className="flex items-center">
                          <input
                            type="radio"
                            name="gender"
                            value="wanita"
                            checked={formData.gender === 'wanita'}
                            onChange={handleChange}
                            className="mr-2"
                            required
                          />
                          <span className="text-black">Wanita</span>
                        </label>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Right Column (Upload dan Deskripsi) */}
                <div className="space-y-6">

                  {/* Unggah Gambar Luka (AI Scoring) */}
                  <div>
                    <label className="block text-green-900 font-semibold mb-2">Unggah Gambar Luka</label>
                    <div className="border-2 border-green-700 rounded-lg p-4 bg-white">
                      <input
                        type="file"
                        name="gambarLuka" // Digunakan untuk menyimpan file di state
                        onChange={handleFileChange} // Diubah ke handleFileChange
                        accept="image/*"
                        className="w-full text-green-700"
                      />
                      <div className="mt-2 text-xs text-green-700">
                        Pastikan area luka/penanganan terlihat dengan baik
                      </div>

                      {/* Tampilkan Skor AI dan Loading */}
                      {(loadingAi || woundScore !== null) && (
                        <div className="mt-4 p-3 rounded-lg border border-pink-300 bg-pink-50 text-center">
                          {loadingAi && <p className="font-semibold text-pink-500">Menganalisis...</p>}
                          {woundScore !== null && !loadingAi && (
                            <div>
                              <p className="text-sm text-green-900">Skor Keparahan AI:</p>
                              <span className={`text-2xl font-bold ${getScoreColor(woundScore)}`}>
                                {woundScore === "Error" ? 'Gagal' : `${woundScore}/100`}
                              </span>
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Bukti Pendukung */}
                  <div>
                    <label className="block text-green-900 font-semibold mb-2">Bukti Pendukung</label>
                    <div className="border-2 border-green-700 rounded-lg p-4 bg-white">
                      <input
                        type="file"
                        name="buktiPendukung" // Digunakan untuk menyimpan file di state
                        onChange={handleFileChange} // Diubah ke handleFileChange
                        className="w-full text-green-700"
                        required
                      />
                      <div className="mt-2 text-xs text-green-700">
                        Foto Lokasi, Dokumen rekam medis, hasil pemeriksaan, atau kwitansi.
                      </div>
                    </div>
                  </div>

                  {/* Deskripsi */}
                  <div>
                    <label className="block text-green-900 font-semibold mb-2">Deskripsi</label>
                    <textarea
                      name="deskripsi"
                      value={formData.deskripsi}
                      onChange={handleChange}
                      rows={6}
                      className="w-full px-4 py-2 border-2 border-green-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-pink-300 bg-white text-black"
                      placeholder="Deskripsikan pengalaman anda"
                      required
                    ></textarea>
                  </div>
                </div>
              </div>

              <div className="mt-8 text-center">
                <button
                  type="submit"
                  disabled={isSubmitting || loadingAi}
                  className={`px-8 py-3 rounded-full font-bold text-lg ${isSubmitting || loadingAi
                    ? 'bg-gray-400 cursor-not-allowed'
                    : 'bg-pink-300 text-white hover:bg-pink-400'
                    } transition-colors`}
                >
                  {isSubmitting ? 'Mengirim...' : 'Kirim'}
                </button>
              </div>
            </form>
          </div>
        </div>
      </main>
    </div>
  );
};

export default ReportForm;