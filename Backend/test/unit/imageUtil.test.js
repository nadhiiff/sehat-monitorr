// test/unit/imageUtil.test.js
const { convertImageToBase64 } = require('../../src/utils/imageUtil');
const fs = require('fs');

// Mock modul fs secara keseluruhan
jest.mock('fs');

describe('Image Utility (convertImageToBase64)', () => {
    // Data dummy untuk simulasi konten file
    const dummyFileData = Buffer.from('INI_ADALAH_KONTEN_GAMBAR_DUMMY');
    const expectedBase64 = dummyFileData.toString('base64');
    const mockFilePath = '/dummy/path/uploads/wound.jpg';
    const mockMimeType = 'image/jpeg';

    beforeAll(() => {
        // Atur mock untuk fs.readFileSync dan fs.existsSync
        fs.readFileSync.mockReturnValue(dummyFileData);
        fs.existsSync = jest.fn().mockReturnValue(true); 
    });

    afterEach(() => {
        jest.clearAllMocks();
        // Setel ulang existsSync ke true untuk test case sukses berikutnya
        fs.existsSync.mockReturnValue(true); 
    });

    it('✅ harus mengkonversi buffer file menjadi Base64 string dengan benar', () => {
        const result = convertImageToBase64(mockFilePath, mockMimeType);

        expect(fs.existsSync).toHaveBeenCalledWith(mockFilePath);
        expect(fs.readFileSync).toHaveBeenCalledWith(mockFilePath);
        
        expect(result).toEqual({
            inlineData: {
                data: expectedBase64,
                mimeType: mockMimeType
            }
        });
    });

    it('✅ harus menggunakan mimeType yang disediakan', () => {
        const customMimeType = 'image/png';
        const result = convertImageToBase64(mockFilePath, customMimeType);
        
        expect(result.inlineData.mimeType).toBe(customMimeType);
    });
    
    it('❌ harus melempar error jika file tidak ditemukan', () => {
        // Hanya untuk test case ini, atur existsSync ke false
        fs.existsSync.mockReturnValue(false); 
        
        // Memastikan fungsi melempar error yang diharapkan
        expect(() => {
            convertImageToBase64(mockFilePath, mockMimeType);
        }).toThrow('File not found at path: /dummy/path/uploads/wound.jpg'); 
        
        // Memastikan readFileSync TIDAK dipanggil karena existsSync mengembalikan false
        expect(fs.readFileSync).not.toHaveBeenCalled();
    });
}); 