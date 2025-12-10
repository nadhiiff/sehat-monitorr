// test/unit/aiService.test.js
const AIService = require('../../src/services/aiService');
const axios = require('axios');

// Mock modul axios
jest.mock('axios');

describe('AIService', () => {
    // Inisialisasi service dengan parameter dummy
    const mockApiUrl = 'https://mock.ai.api/v1beta/models/gemini-2.5-flash:generateContent';
    const mockApiKey = 'MOCK_API_KEY';
    const aiService = new AIService({ apiUrl: mockApiUrl, apiKey: mockApiKey });

    // Data gambar dummy yang akan dikirim ke fungsi
    const mockImageData = {
        data: 'MOCK_BASE64_STRING_GAMBAR',
        mimeType: 'image/jpeg'
    };
    
    // Response palsu yang akan kita terima dari AI (sesuai JSON Mode)
    const mockApiResponse = (score) => ({
        data: {
            candidates: [{
                content: {
                    parts: [{
                        // Simulasi AI mengembalikan string JSON
                        text: JSON.stringify({ severity_score: score }) 
                    }]
                },
                finishReason: 'STOP'
            }],
        },
        status: 200
    });
    
    beforeEach(() => {
        // Bersihkan mock axios sebelum setiap test
        axios.post.mockClear();
    });

    it('✅ harus mengembalikan skor keparahan yang benar (angka 0-100)', async () => {
        const expectedScore = 85;
        
        // Atur mock agar axios.post mengembalikan skor 85
        axios.post.mockResolvedValue(mockApiResponse(expectedScore));

        const score = await aiService.scoreWound(mockImageData);

        // 1. Verifikasi skor yang dikembalikan
        expect(score).toBe(expectedScore);

        // 2. Verifikasi panggilan axios
        expect(axios.post).toHaveBeenCalledTimes(1);
        
        // 3. Verifikasi format request ke API (PENTING: Cek 'inlineData' dan 'responseMimeType')
        const requestBody = axios.post.mock.calls[0][1];
        expect(requestBody.contents[0].parts[1].inlineData.data).toBe(mockImageData.data);
        expect(requestBody.config.responseMimeType).toBe("application/json");
        expect(requestBody.config.responseSchema).toBeDefined();
    });

    it('✅ harus mengembalikan 0 jika AI mengembalikan skor terendah', async () => {
        const expectedScore = 0;
        
        axios.post.mockResolvedValue(mockApiResponse(expectedScore));

        const score = await aiService.scoreWound(mockImageData);
        expect(score).toBe(expectedScore);
    });
    
    it('❌ harus mengembalikan null ketika panggilan API gagal', async () => {
        // Atur mock agar axios melempar error (misalnya 500)
        axios.post.mockRejectedValue({
            response: { 
                data: { error: 'Gemini rate limit exceeded' },
                status: 500
            }
        });

        // Mock console.error agar tidak berantakan
        const consoleErrorMock = jest.spyOn(console, 'error').mockImplementation(() => {});

        const score = await aiService.scoreWound(mockImageData);
        
        // Memastikan fungsi mengembalikan null
        expect(score).toBeNull();
        
        // Memastikan error dicatat di console
        expect(consoleErrorMock).toHaveBeenCalled();
        
        consoleErrorMock.mockRestore(); // Kembalikan fungsi console.error
    });
});