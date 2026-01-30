interface OCRResult {
  text: string;
  confidence: number;
}

class OCRService {
  private static instance: OCRService;
  private readonly API_KEY = 'K87899142388957'; // Free public key
  
  private constructor() {}

  static getInstance(): OCRService {
    if (!OCRService.instance) {
      OCRService.instance = new OCRService();
    }
    return OCRService.instance;
  }

  async initialize(): Promise<void> {
    console.log('✅ OCR.space service ready (25,000 free requests/month)');
  }

  async recognizeText(imageData: string | HTMLImageElement | HTMLCanvasElement): Promise<OCRResult> {
    try {
      // Convert to base64 if needed
      let base64Image: string;
      
      if (typeof imageData === 'string') {
        base64Image = imageData;
      } else if (imageData instanceof HTMLImageElement) {
        const canvas = document.createElement('canvas');
        canvas.width = imageData.width;
        canvas.height = imageData.height;
        const ctx = canvas.getContext('2d');
        ctx?.drawImage(imageData, 0, 0);
        base64Image = canvas.toDataURL('image/jpeg', 0.95);
      } else {
        base64Image = imageData.toDataURL('image/jpeg', 0.95);
      }

      console.log('🔍 Processing with OCR.space...');

      const formData = new FormData();
      formData.append('base64Image', base64Image);
      formData.append('language', 'eng');
      formData.append('isOverlayRequired', 'false');
      formData.append('detectOrientation', 'true');
      formData.append('scale', 'true');
      formData.append('OCREngine', '2'); // Engine 2 is better for game screenshots

      const response = await fetch('https://api.ocr.space/parse/image', {
        method: 'POST',
        headers: {
          'apikey': this.API_KEY
        },
        body: formData
      });

      const data = await response.json();
      
      if (data.ParsedResults && data.ParsedResults[0]) {
        const text = data.ParsedResults[0].ParsedText || '';
        const confidence = data.ParsedResults[0].TextOverlay ? 95 : 85;
        
        console.log('✅ OCR complete - extracted', text.length, 'characters');
        return { text, confidence };
      }

      if (data.IsErroredOnProcessing) {
        throw new Error(data.ErrorMessage || 'OCR processing failed');
      }

      throw new Error('No text detected in image');
    } catch (error) {
      console.error('OCR.space error:', error);
      throw new Error(`OCR failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  async terminate(): Promise<void> {
    console.log('OCR service terminated');
  }
}

export const ocrService = OCRService.getInstance();
