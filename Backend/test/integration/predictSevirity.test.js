const request = require('supertest');
const fs = require('fs');
const createApp = require('../../src/app');

jest.mock('fs', () => ({
    ...jest.requireActual('fs'), 
    readFileSync: jest.fn((path) => {
        if (path.includes('reportModel.sql')) {
            return 'SELECT 1;'; 
        }
        return jest.requireActual('fs').readFileSync(path);
    }),
    existsSync: jest.fn((path) => {
        if (path.includes('reportModel.sql')) {
             return true; 
        }
        return jest.requireActual('fs').existsSync(path);
    }),
}));



// 1. MOCK UTAMA: AIService
jest.mock('../../src/services/aiService');
const AIService = require('../../src/services/aiService');

// 2. MOCK BARU: ReportRepository
jest.mock('../../src/repositories/reportRepository');
const ReportRepository = require('../../src/repositories/reportRepository'); 


const MOCK_SCORE = 75; 
let mockCreateFunction;     
let mockScoreWoundFunction; 

// Mock Implementasi AIService
AIService.mockImplementation(() => {
    mockScoreWoundFunction = jest.fn().mockResolvedValue(MOCK_SCORE);
    return { scoreWound: mockScoreWoundFunction };
});

// Mock Implementasi ReportRepository
ReportRepository.mockImplementation(() => {
    mockCreateFunction = jest.fn().mockResolvedValue({ 
        id: 999, 
        woundScore: MOCK_SCORE, 
        name: 'Temp Test' 
    });
    return { create: mockCreateFunction };
});


// --- Persiapan File Dummy ---
const DUMMY_IMAGE_PATH = './tests/dummy-image.jpg'; 

if (!fs.existsSync('./tests')) {
    fs.mkdirSync('./tests');
}
if (!fs.existsSync(DUMMY_IMAGE_PATH)) {
    const dummyImageBuffer = Buffer.from('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg==', 'base64');
    jest.requireActual('fs').writeFileSync(DUMMY_IMAGE_PATH, dummyImageBuffer); 
}
// --- Akhir Persiapan File Dummy ---


describe('POST /reports/predict', () => {
    let app;

    beforeAll(() => {
        app = createApp(); 
    });
    
    beforeEach(() => {
        mockCreateFunction.mockClear(); 
        mockScoreWoundFunction.mockClear();
    });
    
    test('✅ returns severity from AI service', async () => {
        const res = await request(app)
            .post('/reports/predict')
            .attach('wound_image', DUMMY_IMAGE_PATH); 
            
        expect(mockCreateFunction).toHaveBeenCalledTimes(1); 
        
        expect(mockScoreWoundFunction).toHaveBeenCalledTimes(1);
        
        expect(res.statusCode).toBe(200);
        
        expect(res.body).toHaveProperty('severity_score');
        expect(res.body.severity_score).toBe(MOCK_SCORE);
    });

    test('✅ fails when no image uploaded', async () => {
        const res = await request(app)
            .post('/reports/predict');

        expect(res.statusCode).toBe(400); 
        expect(res.body).toHaveProperty('error');
    });
});