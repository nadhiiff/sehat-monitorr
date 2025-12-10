const ReportService = require('../../src/services/reportService'); 

describe('ReportService', () => {
    // --- Data Mock Umum ---
    const mockPayload = {
        name: 'John Doe',
        phone: '08123',
        email: 'john@example.com',
        facility: 'RS Sehat',
        gender: 'L',
        description: 'Luka ringan di lengan.'
    };
    const mockWoundScore = 75;

    // --- Mock Dependencies ---
    const mockReportRepository = {
        // Semua skenario akan menggunakan mock ini, nilai return akan diatur per tes
        create: jest.fn() 
    };
    const mockAIService = {
        scoreWound: jest.fn().mockResolvedValue(mockWoundScore) 
    };
    const mockImageUtil = {
        convertImageToBase64: jest.fn().mockReturnValue({
            data: 'BASE64_ABC',
            mimeType: 'image/jpeg'
        }),
        generateReportImage: jest.fn(), 
    };

    // Inisialisasi Service
    const service = new ReportService({
        reportRepository: mockReportRepository,
        aiService: mockAIService,
        imageUtil: mockImageUtil
    });
    
    // Clear mocks sebelum setiap test
    beforeEach(() => {
        jest.clearAllMocks();
    });
    

    it('✅ harus memanggil AI Service dan menyimpan skor luka saat ada wound image', async () => {
        const woundImagePath = '/uploads/wound_img.jpg';
        const mockFiles = {
            image: { path: '/uploads/img_general.jpg' },
            wound: { path: woundImagePath }
        };
        const mockCreatedReport = { id: 101, ...mockPayload, woundScore: mockWoundScore, woundImageUrl: woundImagePath };

        // Atur mock repository untuk skenario sukses
        mockReportRepository.create.mockResolvedValue(mockCreatedReport);

        const result = await service.createReport(mockPayload, mockFiles);
        
        // 1. Verifikasi Panggilan Base64 Utility
        expect(mockImageUtil.convertImageToBase64).toHaveBeenCalledWith(woundImagePath, expect.any(String));

        // 2. Verifikasi Panggilan AI Service (menggunakan output dari imageUtil)
        const expectedBase64Output = mockImageUtil.convertImageToBase64();
        expect(mockAIService.scoreWound).toHaveBeenCalledWith(expectedBase64Output);

        // 3. Verifikasi Panggilan Repository
        expect(mockReportRepository.create).toHaveBeenCalledWith(expect.objectContaining({
            woundImageUrl: woundImagePath,
            woundScore: mockWoundScore // Memastikan skor AI tersimpan
        }));
        
        // 4. Verifikasi Hasil Akhir
        expect(result.woundScore).toBe(mockWoundScore);
    });


    it('✅ harus menyimpan laporan tanpa memanggil AI Service jika tidak ada wound image', async () => {
        const filesWithoutWound = { image: { path: '/uploads/img_general.jpg' } };
        
        const mockReportWithoutWound = { 
            id: 102, 
            ...mockPayload, 
            woundScore: null, 
            woundImageUrl: null 
        };
        mockReportRepository.create.mockResolvedValue(mockReportWithoutWound);

        const result = await service.createReport(mockPayload, filesWithoutWound);

        // 1. Verifikasi bahwa AI Service TIDAK dipanggil
        expect(mockAIService.scoreWound).not.toHaveBeenCalled();
        expect(mockImageUtil.convertImageToBase64).not.toHaveBeenCalled();
        
        // 2. Verifikasi repository dipanggil tanpa skor luka
        expect(mockReportRepository.create).toHaveBeenCalledWith(expect.objectContaining({
            woundImageUrl: null,
            woundScore: null
        }));

        // 3. Verifikasi Hasil Akhir
        expect(result.woundScore).toBeNull(); 
    });
    

    it('✅ harus memanggil imageUtil.generateReportImage dengan opsi yang benar', async () => {
        const mockReport = { name: 'Test', woundScore: 50 };
        const mockBuffer = Buffer.from('image buffer');
        const options = { width: 800, height: 1600 };
        
        // Mock implementasi generateReportImage
        mockImageUtil.generateReportImage.mockResolvedValue(mockBuffer);

        const result = await service.generateReportImage(mockReport, options);

        // Verifikasi Panggilan
        expect(mockImageUtil.generateReportImage).toHaveBeenCalledWith(mockReport, options);
        
        // Verifikasi Hasil
        expect(result).toBe(mockBuffer);
    });
});