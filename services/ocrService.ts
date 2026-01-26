declare global {
  interface Window {
    Tesseract: any;
  }
}

/**
 * Extract text from Evony battle report screenshots
 * Optimized for game UI text, numbers, and battle stats
 */
export async function extractTextFromImage(imageDataUrl: string): Promise<string> {
  console.log('🔍 Starting OCR for battle report...');
  
  try {
    // Check if Tesseract.js is loaded from CDN
    if (typeof window === 'undefined' || !window.Tesseract) {
      throw new Error('❌ Tesseract.js not loaded. Make sure the CDN script is in index.html');
    }
    
    console.log('✅ Tesseract.js loaded successfully');
    
    // Use the global Tesseract from CDN
    const { createWorker } = window.Tesseract;
    
    console.log('⚙️ Initializing OCR worker...');
    
    // Initialize worker with optimized settings for game screenshots
    const worker = await createWorker({
      logger: (m: any) => {
        console.log(`📊 OCR Progress: ${m.status} - ${Math.round((m.progress || 0) * 100)}%`);
      },
      errorHandler: (err: any) => {
        console.error('❌ OCR Worker Error:', err);
      },
    });
    
    console.log('📥 Loading language data...');
    await worker.loadLanguage('eng');
    
    console.log('🚀 Initializing language...');
    await worker.initialize('eng');
    
    // Optimize for game numbers and text
    console.log('🎯 Configuring OCR parameters...');
    await worker.setParameters({
      tessedit_char_whitelist: '0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz:,.-/%()[] ',
      preserve_interword_spaces: '1',
      tessedit_pageseg_mode: '6', // Assume uniform block of text
    });
    
    // Process the image
    console.log('🖼️ Processing image...');
    const { data: { text } } = await worker.recognize(imageDataUrl);
    
    console.log('🧹 Terminating worker...');
    await worker.terminate();
    
    console.log('✅ OCR completed. Text length:', text?.length || 0);
    
    if (!text || text.trim().length === 0) {
      throw new Error('No text could be extracted. Image may be too blurry or low quality.');
    }
    
    return text.trim();
    
  } catch (error: any) {
    console.error('❌ OCR processing failed:', error);
    
    // Provide helpful error messages
    if (error.message?.includes('Tesseract.js not loaded')) {
      throw new Error('OCR library not loaded. Please refresh the page and try again.');
    }
    
    throw new Error(`Failed to extract text from battle report: ${error.message}`);
  }
}

/**
 * Process multiple battle report images
 */
export async function processBattleReports(images: string[]): Promise<string> {
  console.log(`📋 Processing ${images.length} battle report(s)...`);
  
  const extractedTexts: string[] = [];
  
  for (let i = 0; i < images.length; i++) {
    try {
      console.log(`\n--- Processing Report ${i + 1}/${images.length} ---`);
      const text = await extractTextFromImage(images[i]);
      extractedTexts.push(`--- Battle Report ${i + 1} ---\n${text}\n`);
    } catch (error: any) {
      console.error(`❌ Failed to process report ${i + 1}:`, error.message);
      extractedTexts.push(`--- Battle Report ${i + 1} [OCR Failed: ${error.message}] ---\n`);
    }
  }
  
  return extractedTexts.join('\n');
}
