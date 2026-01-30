import Tesseract from 'tesseract.js';

interface OCRResult {
  text: string;
  confidence: number;
}

class OCRService {
  private static instance: OCRService;
  private worker: Tesseract.Worker | null = null;
  private isInitialized: boolean = false;
  private initPromise: Promise<void> | null = null;

  private constructor() {}

  static getInstance(): OCRService {
    if (!OCRService.instance) {
      OCRService.instance = new OCRService();
    }
    return OCRService.instance;
  }

  async initialize(): Promise<void> {
    // If already initialized, return immediately
    if (this.isInitialized && this.worker) {
      return;
    }

    // If initialization is in progress, wait for it
    if (this.initPromise) {
      return this.initPromise;
    }

    // Start new initialization
    this.initPromise = (async () => {
      try {
        console.log('Starting OCR worker initialization...');
        
        // Create worker
        this.worker = await Tesseract.createWorker('eng', 1, {
          logger: (m) => {
            if (m.status === 'recognizing text') {
              console.log(`OCR Progress: ${Math.round(m.progress * 100)}%`);
            }
          }
        });

        console.log('Tesseract.js loaded successfully');
        this.isInitialized = true;
      } catch (error) {
        console.error('Failed to initialize OCR worker:', error);
        this.worker = null;
        this.isInitialized = false;
        this.initPromise = null;
        throw error;
      }
    })();

    return this.initPromise;
  }

  async recognizeText(imageData: string | HTMLImageElement | HTMLCanvasElement): Promise<OCRResult> {
    try {
      // Ensure worker is initialized
      if (!this.isInitialized || !this.worker) {
        console.log('Initializing OCR worker...');
        await this.initialize();
      }

      if (!this.worker) {
        throw new Error('OCR worker failed to initialize');
      }

      console.log('Starting OCR for battle report...');
      
      // Perform recognition
      const result = await this.worker.recognize(imageData);
      
      console.log('OCR completed successfully');
      
      return {
        text: result.data.text,
        confidence: result.data.confidence
      };
    } catch (error) {
      console.error('OCR recognition error:', error);
      
      // Try to reinitialize on error
      this.isInitialized = false;
      this.initPromise = null;
      
      throw new Error(`Failed to recognize text: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  async terminate(): Promise<void> {
    if (this.worker) {
      try {
        await this.worker.terminate();
        console.log('OCR worker terminated');
      } catch (error) {
        console.error('Error terminating OCR worker:', error);
      } finally {
        this.worker = null;
        this.isInitialized = false;
        this.initPromise = null;
      }
    }
  }
}

export const ocrService = OCRService.getInstance();
