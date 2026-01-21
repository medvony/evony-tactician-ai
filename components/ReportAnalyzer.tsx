import React, { useState, useRef, useEffect } from 'react';
import { FileImage, Loader2, Send, Trash2, ShieldCheck, Sword, PlusCircle, ExternalLink } from 'lucide-react';
import { UserProfile, AnalysisResponse, ChatMessage, Language } from '../types';
import { translations } from '../translations';
import { analyzeReports, chatWithAIStream } from '../services/geminiService';

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
      const stream = chatWithAIStream(chatMessages, userMsg, profile, result);
      for await (const chunk of stream) {
        fullResponse += chunk;
        setChatMessages(prev => {
          const newMsgs = [...prev];
          newMsgs[newMsgs.length - 1].text = fullResponse;
          return newMsgs;
        });
      }
    } catch (err) { console.error(err); } finally { setChatting(false); }
  };

  return (
    <div className="space-y-6">
      <div className="bg-slate-900 border border-slate-800 p-6 rounded-2xl">
        <h3 className="text-xl font-bold mb-4 flex items-center gap-2 text-white"><FileImage className="text-amber-500" /> {t.addReport}</h3>
        <div className="grid grid-cols-3 gap-4 mb-4">
          {images.map((img, i) => (
            <div key={i} className="aspect-[3/4] rounded-lg overflow-hidden relative group border border-slate-700">
              <img src={img} className="w-full h-full object-cover" alt={`Report ${i}`} />
              <button onClick={() => setImages(prev => prev.filter((_, idx) => idx !== i))} className="absolute top-1 right-1 p-1 bg-red-500 rounded-full opacity-0 group-hover:opacity-100 transition-opacity"><Trash2 size={12} /></button>
            </div>
          ))}
          <button onClick={() => fileInputRef.current?.click()} className="aspect-[3/4] border-2 border-dashed border-slate-700 rounded-lg flex flex-col items-center justify-center text-slate-500 hover:text-amber-500 hover:border-amber-500 bg-slate-950">
            <PlusCircle size={24} /> <span className="text-xs mt-1">Upload</span>
          </button>
        </div>
        <input type="file" multiple hidden ref={fileInputRef} onChange={handleFileChange} />
        <button disabled={images.length === 0 || analyzing} onClick={async () => { setAnalyzing(true); try { const res = await analyzeReports(images, profile); setResult(res); } catch(e) { alert("Error"); } finally { setAnalyzing(false); } }} className="w-full bg-indigo-600 py-4 rounded-xl font-black flex items-center justify-center gap-2 hover:bg-indigo-500 disabled:bg-slate-800">
          {analyzing ? <Loader2 className="animate-spin" /> : <Sword size={20} />} {analyzing ? t.strategizing : t.runAnalysis}
        </button>
      </div>

      {result && (
        <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden shadow-2xl">
          <div className="p-6 space-y-6">
            <section className="bg-slate-950 p-5 rounded-xl border border-slate-800">
              <h5 className="text-[10px] font-black uppercase text-amber-500 mb-2 flex items-center gap-2"><ShieldCheck size={14} /> {t.intelHeader}</h5>
              <div className="text-slate-300 whitespace-pre-wrap text-sm">{result.summary}</div>
            </section>
            
            {result.sources && result.sources.length > 0 && (
              <div className="px-5">
                <h6 className="text-[10px] font-black uppercase text-slate-500 mb-2">Sources</h6>
                <div className="flex flex-wrap gap-x-4 gap-y-2">
                  {result.sources.map((source, idx) => (
                    <a key={idx} href={source.uri} target="_blank" rel="noopener noreferrer" className="text-xs text-amber-500 flex items-center gap-1 hover:underline">
                      <ExternalLink size={10} /> {source.title}
                    </a>
                  ))}
                </div>
              </div>
            )}

            <section className="bg-emerald-500/5 border border-emerald-500/20 p-5 rounded-xl">
              <h5 className="text-xs font-black text-emerald-400 uppercase mb-2">{t.marchHeader}</h5>
              <div className="text-white font-mono text-sm whitespace-pre-wrap">{result.recommendations}</div>
            </section>
            <div className="border-t border-slate-800 pt-6">
              <div className="space-y-4 max-h-[400px] overflow-y-auto mb-4 bg-slate-950 p-4 rounded-xl">
                {chatMessages.map((msg, i) => (
                  <div key={i} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                    <div className={`p-3 rounded-xl text-sm max-w-[80%] ${msg.role === 'user' ? 'bg-amber-500 text-slate-950 font-bold' : 'bg-slate-800 text-white border border-slate-700'}`}>{msg.text || "..."}</div>
                  </div>
                ))}
              </div>
              <div className="flex gap-2">
                <input type="text" className="flex-1 bg-slate-800 border border-slate-700 rounded-xl px-4 py-3 text-white outline-none" placeholder="Ask follow-up..." value={input} onChange={(e) => setInput(e.target.value)} onKeyPress={(e) => e.key === 'Enter' && handleSendMessage()} />
                <button onClick={handleSendMessage} className="bg-amber-500 p-3 rounded-xl text-slate-950"><Send size={20} /></button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ReportAnalyzer;
