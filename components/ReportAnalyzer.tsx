import React, { useState, useRef } from 'react';
import { FileImage, Loader2, Send, Trash2, ShieldCheck, Sword, PlusCircle, ExternalLink, Info } from 'lucide-react';
import { UserProfile, AnalysisResponse, ChatMessage, Language } from '../types';
import { translations } from '../translations';
// CHANGE 1: Update import to use our new aiService instead of geminiService
import { analyzeReports, chatWithAIStream } from '../services/aiService';

const ReportAnalyzer: React.FC<{ profile: UserProfile; lang: Language }> = ({ profile, lang }) => {
  const t = translations[lang];
  const [images, setImages] = useState<string[]>([]);
  const [analyzing, setAnalyzing] = useState(false);
  const [result, setResult] = useState<AnalysisResponse | null>(null);
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState('');
  const [chatting, setChatting] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

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
      
      // CHANGE 2: Update chatWithAIStream parameters
      // Removed 'profile' and 'result' parameters as our new function doesn't need them
      const stream = chatWithAIStream(chatMessages, userMsg);
      
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
      // Add error message to chat
      setChatMessages(prev => [...prev, { 
        role: 'model', 
        text: `Error: ${err instanceof Error ? err.message : 'Failed to get response'}` 
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
    try {
      // This now uses OCR + Groq AI
      const res = await analyzeReports(images, profile);
      setResult(res);
      
      // Optional: Add initial analysis message to chat
      if (res.summary) {
        setChatMessages([{ 
          role: 'model', 
          text: `Analysis complete! ${res.summary.substring(0, 200)}...` 
        }]);
      }
    } catch (e: any) {
      console.error("Analysis Failure:", e);
      alert(`Tactical Error: ${e.message || "Uplink disconnected during analysis."}`);
    } finally {
      setAnalyzing(false);
    }
  };

  // ADD THIS: Show OCR processing status
  const [ocrStatus, setOcrStatus] = useState<string>('');
  
  // Optional: Add OCR progress indicator
  const handleAnalysisWithOcrFeedback = async () => {
    if (images.length === 0 || analyzing) return;
    setAnalyzing(true);
    setOcrStatus('Extracting text from battle reports...');
    
    try {
      const res = await analyzeReports(images, profile);
      setResult(res);
      setOcrStatus('');
      
      if (res.summary) {
        setChatMessages([{ 
          role: 'model', 
          text: `✅ Analysis complete! ${res.summary.substring(0, 200)}...` 
        }]);
      }
    } catch (e: any) {
      console.error("Analysis Failure:", e);
      alert(`Tactical Error: ${e.message || "Uplink disconnected during analysis."}`);
    } finally {
      setAnalyzing(false);
      setOcrStatus('');
    }
  };

  // CHANGE 3: Update the analysis button to show OCR status
  return (
    <div className="space-y-6">
      <div className="bg-slate-900 border border-slate-800 p-6 rounded-2xl shadow-xl">
        <h3 className="text-xl font-bold mb-4 flex items-center gap-2 text-white">
          <FileImage className="text-amber-500" /> {t.addReport}
        </h3>
        
        {/* ADD OCR STATUS INDICATOR */}
        {ocrStatus && (
          <div className="mb-4 p-3 bg-blue-900/30 border border-blue-800 rounded-lg">
            <div className="flex items-center gap-2 text-blue-300 text-sm">
              <Loader2 className="animate-spin" size={16} />
              <span>{ocrStatus}</span>
            </div>
          </div>
        )}
        
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
        
        <button 
          disabled={images.length === 0 || analyzing} 
          onClick={handleAnalysisWithOcrFeedback} // Use the new function
          className="w-full bg-indigo-600 py-4 rounded-xl font-black flex items-center justify-center gap-2 hover:bg-indigo-500 disabled:bg-slate-800 transition-all shadow-lg overflow-hidden relative group"
        >
          <span className="relative z-10 flex items-center gap-2">
            {analyzing ? <Loader2 className="animate-spin" /> : <Sword size={20} />} 
            {analyzing ? (ocrStatus ? 'Processing OCR...' : t.strategizing) : t.runAnalysis}
          </span>
          {analyzing && <div className="absolute inset-0 bg-white/10 animate-pulse"></div>}
        </button>
        
        {/* ADD TIP ABOUT IMAGE QUALITY */}
        <div className="mt-4 text-xs text-slate-500 text-center">
          Tip: Use clear screenshots for better OCR results
        </div>
      </div>

      {/* The rest of your component remains exactly the same */}
      {result && (
        <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden shadow-2xl animate-in fade-in slide-in-from-bottom-4 duration-500">
          {/* ... rest of your existing JSX ... */}
        </div>
      )}
    </div>
  );
};

export default ReportAnalyzer;
