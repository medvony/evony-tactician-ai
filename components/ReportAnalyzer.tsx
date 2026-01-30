import React, { useState, useRef, useEffect } from 'react';
import { FileImage, Loader2, Send, Trash2, ShieldCheck, Sword, PlusCircle, Info } from 'lucide-react';
import { UserProfile, AnalysisResponse, ChatMessage, Language } from '../types';
import { translations } from '../translations';
import { analyzeReports, chatWithAIStream } from '../services/aiService';
import { ocrService } from '../services/ocrService';

const ReportAnalyzer: React.FC<{ profile: UserProfile; lang: Language }> = ({ profile, lang }) => {
  const t = translations[lang];
  const [images, setImages] = useState<string[]>([]);
  const [analyzing, setAnalyzing] = useState(false);
  const [ocrStatus, setOcrStatus] = useState<string>('');
  const [result, setResult] = useState<AnalysisResponse | null>(null);
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState('');
  const [chatting, setChatting] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Initialize OCR on component mount
  useEffect(() => {
    const initOCR = async () => {
      try {
        console.log('Initializing OCR service...');
        await ocrService.initialize();
        console.log('OCR service ready');
      } catch (error) {
        console.error('Failed to initialize OCR:', error);
      }
    };
    
    initOCR();
    
    // Cleanup on unmount
    return () => {
      ocrService.terminate().catch(console.error);
    };
  }, []);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []) as File[];
    files.forEach(file => {
      const reader = new FileReader();
      reader.onloadend = () => setImages(prev => [...prev, reader.result as string]);
      reader.readAsDataURL(file);
    });
  };

  const handleSendMessage = async () => {
  if (!input.trim() || chatting) return;
  const userMsg = input;
  setInput('');
  setChatMessages(prev => [...prev, { role: 'user', text: userMsg }]);
  setChatting(true);
  
  try {
    let fullResponse = "";
    setChatMessages(prev => [...prev, { role: 'model', text: "" }]);
    
    // Create battle context from the analysis result
    const battleContext = result ? `
Battle Report Summary:
${result.summary}

Recommendations:
${result.recommendations}

Extracted Data:
${result.anonymizedData || 'No data available'}
    `.trim() : undefined;
    
    const stream = chatWithAIStream(chatMessages, userMsg, battleContext);
    
    for await (const chunk of stream) {
      fullResponse += chunk;
      setChatMessages(prev => {
        const newMsgs = [...prev];
        newMsgs[newMsgs.length - 1].text = fullResponse;
        return newMsgs;
      });
    }
  } catch (err) { 
    console.error("Chat error:", err);
    setChatMessages(prev => [...prev, { 
      role: 'model', 
      text: `❌ Error: ${err instanceof Error ? err.message : 'Failed to get response'}` 
    }]);
  } finally { 
    setChatting(false); 
  }
};

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const handleAnalysis = async () => {
  if (images.length === 0 || analyzing) return;
  
  setAnalyzing(true);
  setOcrStatus('🔍 Initializing OCR engine...');
  
  try {
    await ocrService.initialize();
    
    setOcrStatus(`📸 Processing ${images.length} battle reports in parallel...`);
    
    // Process all images in parallel (much faster!)
    const ocrPromises = images.map(async (imgSrc, i) => {
      try {
        const img = new Image();
        await new Promise((resolve, reject) => {
          img.onload = resolve;
          img.onerror = () => reject(new Error(`Failed to load image ${i + 1}`));
          img.src = imgSrc;
        });
        
        const result = await ocrService.recognizeText(img);
        console.log(`✅ Report ${i + 1}/${images.length} complete (${result.confidence}% confidence)`);
        return result.text;
      } catch (error) {
        console.error(`❌ Failed to process image ${i + 1}:`, error);
        return `[OCR failed for image ${i + 1}]`;
      }
    });
    
    const ocrResults = await Promise.all(ocrPromises);
    
    setOcrStatus('🤖 AI analyzing battle tactics...');
    const res = await analyzeReports(images, profile, ocrResults);
    
    setResult(res);
    setOcrStatus('✅ Analysis complete!');
    setTimeout(() => setOcrStatus(''), 2000);
    
    if (res.summary) {
      setChatMessages([{ 
        role: 'model', 
        text: `✅ Analysis complete!\n\n${res.summary.substring(0, 300)}...` 
      }]);
    }
  } catch (e: any) {
    console.error("❌ Analysis Failure:", e);
    setOcrStatus('');
    alert(`⚠️ Analysis Failed\n\n${e.message}\n\nTips:\n• Ensure images are clear\n• Check internet connection\n• Try with fewer images first`);
  } finally {
    setAnalyzing(false);
    setOcrStatus('');
  }
};

  return (
    <div className="space-y-6">
      <div className="bg-slate-900 border border-slate-800 p-6 rounded-2xl shadow-xl">
        <h3 className="text-xl font-bold mb-4 flex items-center gap-2 text-white">
          <FileImage className="text-amber-500" /> {t.addReport}
        </h3>
        
        {/* OCR Status Indicator */}
        {ocrStatus && (
          <div className="mb-4 p-3 bg-blue-900/30 border border-blue-800 rounded-lg animate-pulse">
            <div className="flex items-center gap-2 text-blue-300 text-sm">
              <Loader2 className="animate-spin" size={16} />
              <span>{ocrStatus}</span>
            </div>
          </div>
        )}
        
        {/* Image Grid */}
        <div className="grid grid-cols-3 gap-4 mb-4">
          {images.map((img, i) => (
            <div key={i} className="aspect-[3/4] rounded-lg overflow-hidden relative group border border-slate-700">
              <img src={img} className="w-full h-full object-cover" alt={`Battle Report ${i + 1}`} />
              <button 
                onClick={() => setImages(prev => prev.filter((_, idx) => idx !== i))} 
                className="absolute top-1 right-1 p-1 bg-red-500/90 hover:bg-red-400 text-white rounded-full opacity-0 group-hover:opacity-100 transition-opacity shadow-lg"
              >
                <Trash2 size={12} />
              </button>
            </div>
          ))}
          <button 
            onClick={() => fileInputRef.current?.click()} 
            className="aspect-[3/4] border-2 border-dashed border-slate-700 rounded-lg flex flex-col items-center justify-center text-slate-500 hover:text-amber-500 hover:border-amber-500 bg-slate-950 transition-colors"
          >
            <PlusCircle size={24} /> 
            <span className="text-[10px] mt-2 font-black uppercase tracking-widest text-center px-2">
              Gallery / Files
            </span>
          </button>
        </div>
        
        <input 
          type="file" 
          multiple 
          hidden 
          ref={fileInputRef} 
          onChange={handleFileChange} 
          accept="image/*" 
        />
        
        {/* Analysis Button */}
        <button 
          disabled={images.length === 0 || analyzing} 
          onClick={handleAnalysis}
          className="w-full bg-indigo-600 py-4 rounded-xl font-black flex items-center justify-center gap-2 hover:bg-indigo-500 disabled:bg-slate-800 disabled:cursor-not-allowed transition-all shadow-lg overflow-hidden relative group"
        >
          <span className="relative z-10 flex items-center gap-2">
            {analyzing ? <Loader2 className="animate-spin" /> : <Sword size={20} />} 
            {analyzing ? (ocrStatus || t.strategizing || 'Processing...') : (t.runAnalysis || 'Analyze Reports')}
          </span>
          {analyzing && <div className="absolute inset-0 bg-white/10 animate-pulse"></div>}
        </button>
        
        {/* Help Text */}
        <div className="mt-4 p-3 bg-slate-950/50 border border-slate-800 rounded-lg">
          <div className="flex items-start gap-2 text-xs text-slate-400">
            <Info size={14} className="mt-0.5 flex-shrink-0 text-amber-500" />
            <div>
              <p className="font-semibold text-slate-300 mb-1">For best OCR results:</p>
              <ul className="list-disc list-inside space-y-1">
                <li>Use clear, high-resolution screenshots</li>
                <li>Ensure text is readable and not blurry</li>
                <li>Crop to show only the battle report</li>
                <li>Wait for OCR initialization on first load</li>
              </ul>
            </div>
          </div>
        </div>
      </div>

      {/* Analysis Results */}
      {result && (
        <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden shadow-2xl animate-in fade-in slide-in-from-bottom-4 duration-500">
          <div className="bg-gradient-to-r from-indigo-600 to-purple-600 p-6">
            <h3 className="text-2xl font-black flex items-center gap-2">
              <ShieldCheck /> {t.tacticalAnalysis || 'Tactical Analysis'}
            </h3>
            <p className="text-sm text-indigo-100 mt-1 opacity-90">
              {result.reportType} Report • AI-Powered Strategy
            </p>
          </div>
          
          <div className="p-6 space-y-6">
            {/* Enemy Intel */}
            <div>
              <h4 className="text-sm font-black text-amber-500 uppercase tracking-widest mb-3">
                {t.enemyIntel || 'Enemy Intel'}
              </h4>
              <p className="text-slate-300 leading-relaxed whitespace-pre-wrap">{result.summary}</p>
            </div>
            
            {/* Recommendations */}
            <div className="border-t border-slate-800 pt-6">
              <h4 className="text-sm font-black text-green-500 uppercase tracking-widest mb-3">
                {t.recommendations || 'Recommended Counter'}
              </h4>
              <p className="text-slate-300 leading-relaxed whitespace-pre-wrap">{result.recommendations}</p>
            </div>
          </div>
        </div>
      )}

      {/* Chat Interface */}
      {result && (
        <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden shadow-xl">
          <div className="bg-slate-950 p-4 border-b border-slate-800">
            <h3 className="font-black text-sm uppercase tracking-widest text-amber-500">
              {t.askQuestions || 'Ask Follow-up Questions'}
            </h3>
          </div>
          
          <div className="p-4 h-64 overflow-y-auto space-y-3">
            {chatMessages.map((msg, i) => (
              <div key={i} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                <div className={`max-w-[80%] p-3 rounded-lg ${
                  msg.role === 'user' 
                    ? 'bg-indigo-600 text-white' 
                    : 'bg-slate-800 text-slate-200'
                }`}>
                  <p className="text-sm whitespace-pre-wrap">{msg.text}</p>
                </div>
              </div>
            ))}
            {chatting && (
              <div className="flex justify-start">
                <div className="bg-slate-800 p-3 rounded-lg">
                  <Loader2 className="animate-spin text-amber-500" size={16} />
                </div>
              </div>
            )}
          </div>
          
          <div className="p-4 border-t border-slate-800 bg-slate-950">
            <div className="flex gap-2">
              <textarea
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder={t.askSomething || "Ask about the battle..."}
                className="flex-1 bg-slate-900 border border-slate-700 rounded-lg p-3 text-sm resize-none focus:outline-none focus:border-indigo-500"
                rows={2}
                disabled={chatting}
              />
              <button
                onClick={handleSendMessage}
                disabled={!input.trim() || chatting}
                className="bg-indigo-600 px-4 rounded-lg hover:bg-indigo-500 disabled:bg-slate-800 disabled:cursor-not-allowed transition-colors"
              >
                <Send size={18} />
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ReportAnalyzer;
