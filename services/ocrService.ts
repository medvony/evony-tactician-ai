import { createWorker } from 'tesseract.js';

/**
 * Extract text from Evony battle report screenshots
 * Optimized for game UI text, numbers, and battle stats
 */
export async function extractTextFromImage(imageDataUrl: string): Promise<string> {
  console.log('Starting OCR for battle report...');
  
  try {
    // Initialize worker with optimized settings for game screenshots
    const worker = await createWorker({
      logger: (m) => console.log(`OCR: ${m.status}`),
      errorHandler: (err) => console.error('OCR Error:', err),
    });
    
    await worker.loadLanguage('eng');
    await worker.initialize('eng');
    
    // Optimize for game numbers and text
    await worker.setParameters({
      tessedit_char_whitelist: '0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz:,.-/%()[] ',
      preserve_interword_spaces: '1',
      tessedit_pageseg_mode: '6', // Assume uniform block of text
    });
    
    // Process the image
    const { data: { text } } = await worker.recognize(imageDataUrl);
    await worker.terminate();
    
    console.log('OCR completed. Text length:', text?.length || 0);
    return text?.trim() || 'No text could be extracted from the image.';
    
  } catch (error: any) {
    console.error('OCR processing failed:', error);
    throw new Error(`Failed to extract text from battle report: ${error.message}`);
  }
}

/**
 * Process multiple battle report images
 */
export async function processBattleReports(images: string[]): Promise<string> {
  console.log(`Processing ${images.length} battle report(s)...`);
  
  const extractedTexts = await Promise.all(
    images.map(async (img, index) => {
      try {
        const text = await extractTextFromImage(img);
        return `--- Battle Report ${index + 1} ---\n${text}\n`;
      } catch (error) {
        return `--- Battle Report ${index + 1} [OCR Failed] ---\n`;
      }
    })
  );
  
  return extractedTexts.join('\n');
}
