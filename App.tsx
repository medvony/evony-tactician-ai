import React, { useState, useEffect } from 'react';
import { UserProfile, AuthState, Language } from './types';
import { ACCESS_CODE } from './constants';
import { translations } from './translations';
import Auth from './components/Auth';
import ProfileSetup from './components/ProfileSetup';
import ReportAnalyzer from './components/ReportAnalyzer';
import { LogOut, Settings, BarChart3, ShieldAlert, Loader2 } from 'lucide-react';
import { supabase } from './services/supabaseClient';

const App: React.FC = () => {
  const [lang, setLang] = useState<Language>(() => (localStorage.getItem('evony_lang') as Language) || 'EN');
  const [auth, setAuth] = useState<AuthState>({ isAuthenticated: false, user: null });
  const [isAuthLoading, setIsAuthLoading] = useState(true);
  const [profile, setProfile] = useState<UserProfile>(() => {
    const saved = localStorage.getItem('evony_profile');
    return saved ? JSON.parse(saved) : { highestTiers: { Ground: 1, Ranged: 1, Mounted: 1, Siege: 1 }, marchSize: 0, embassyCapacity: 0, isSetup: false };
  });
  
  const [accessGranted, setAccessGranted] = useState(() => localStorage.getItem('evony_access') === 'true');
  const [inputCode, setInputCode] = useState('');
  const t = translations[lang];

  const mapSessionToAuth = (session: any): AuthState => {
    if (!session) return { isAuthenticated: false, user: null };
    const { user } = session;
    const metadata = user?.user_metadata || {};
    
    return {
      isAuthenticated: true,
      user: {
        email: user?.email,
        name: metadata?.full_name || metadata?.display_name || user?.email || 'Commander',
        avatar: metadata?.avatar_url || metadata?.picture,
        provider: user?.app_metadata?.provider || 'email'
      }
    };
  };

  useEffect(() => {
    const initAuth = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      setAuth(mapSessionToAuth(session));
      setIsAuthLoading(false);
    };
    initAuth();

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setAuth(mapSessionToAuth(session));
    });
    return () => subscription.unsubscribe();
  }, []);

  useEffect(() => { 
    localStorage.setItem('evony_profile', JSON.stringify(profile)); 
  }, [profile]);
  
  useEffect(() => { 
    localStorage.setItem('evony_lang', lang);
    if (document.documentElement) {
      document.documentElement.dir = t.isRTL ? 'rtl' : 'ltr';
    }
  }, [lang, t.isRTL]);

  const handleLogout = async () => {
    await supabase.auth.signOut();
    setAuth({ isAuthenticated: false, user: null });
  };

  const handleAccessCodeSubmit = () => {
    if (inputCode.trim() === ACCESS_CODE) {
      setAccessGranted(true);
      localStorage.setItem('evony_access', 'true');
    } else {
      alert("Unauthorized entry. Access denied.");
    }
  };

  if (isAuthLoading) {
    return (
      <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center p-6 text-slate-100">
        <Loader2 className="w-12 h-12 text-amber-500 animate-spin mb-4" />
        <p className="text-[10px] font-black uppercase tracking-[0.3em] text-amber-500">Establishing Secure Uplink</p>
      </div>
    );
  }

  if (!auth.isAuthenticated) {
    return <Auth onLogin={async () => {
      const { data: { session } } = await supabase.auth.getSession();
      setAuth(mapSessionToAuth(session));
    }} />;
  }

  if (!accessGranted) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center p-6 relative overflow-hidden">
        <div className="absolute -top-[10%] -left-[10%] w-[60%] h-[60%] bg-amber-500/5 blur-[120px] rounded-full"></div>
        <div className="max-w-md w-full bg-slate-900/60 backdrop-blur-3xl border border-slate-800/50 p-10 rounded-[2.5rem] text-center shadow-2xl relative z-10">
          <div className="w-20 h-20 bg-amber-500/10 border border-amber-500/20 rounded-3xl flex items-center justify-center mx-auto mb-6">
            <ShieldAlert size={40} className="text-amber-500" />
          </div>
          <h1 className="text-3xl font-black text-white mb-2 italic tracking-tighter uppercase">Clearance Required</h1>
          <p className="text-slate-500 text-[10px] font-bold uppercase tracking-widest mb-8">Strategist ID Verification</p>
          <input 
            type="password" 
            placeholder="ACCESS TOKEN" 
            className="w-full bg-slate-950/50 border border-slate-800 rounded-2xl p-4 text-center text-white mb-4 outline-none font-mono focus:ring-2 focus:ring-amber-500/50 transition-all placeholder:text-slate-800" 
            value={inputCode} 
            onChange={(e) => setInputCode(e.target.value)} 
            onKeyDown={(e) => e.key === 'Enter' && handleAccessCodeSubmit()} 
          />
          <button onClick={handleAccessCodeSubmit} className="w-full bg-amber-500 py-4 rounded-2xl font-black text-slate-950 hover:bg-amber-400 transition-all shadow-xl shadow-amber-500/20 active:scale-95">
            DECRYPT & ENTER
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 pb-20">
      <header className="h-20 bg-slate-950/80 backdrop-blur-xl border-b border-slate-900 flex items-center px-6 sticky top-0 z-50">
        <div className="max-w-6xl mx-auto w-full flex justify-between items-center">
          <div className="flex items-center gap-3">
            <BarChart3 className="text-amber-500" />
            <h1 className="font-black text-xl tracking-tight hidden sm:block italic uppercase">EVONY AI</h1>
          </div>
          <div className="flex gap-2 items-center">
            <div className="flex flex-col items-end mr-4 hidden xs:flex">
              <span className="text-[10px] font-black text-white leading-none uppercase tracking-tighter truncate max-w-[120px]">{auth.user?.name}</span>
              <span className="text-[8px] text-slate-500 uppercase tracking-widest">Authorized Strategist</span>
            </div>
            <select 
              className="bg-slate-900 border border-slate-800 rounded-lg p-2 text-xs font-bold focus:outline-none focus:ring-1 focus:ring-amber-500/50 cursor-pointer" 
              value={lang} 
              onChange={(e) => setLang(e.target.value as Language)}
            >
              {['EN', 'AR', 'FR', 'JA', 'ES', 'IT', 'RU', 'PT', 'ZH', 'DE'].map(l => <option key={l} value={l}>{l}</option>)}
            </select>
            <button onClick={() => setProfile({...profile, isSetup: false})} className="p-2 bg-slate-900 border border-slate-800 rounded-lg text-slate-400 hover:text-white transition-colors">
              <Settings size={20} />
            </button>
            <button onClick={handleLogout} className="p-2 bg-slate-900 border border-slate-800 rounded-lg text-slate-400 hover:text-red-400 transition-colors">
              <LogOut size={20} />
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-6 py-10">
        {!profile.isSetup ? (
          <ProfileSetup initialProfile={profile} onSave={setProfile} lang={lang} />
        ) : (
          <>
            <div className="mb-10">
              <h2 className="text-4xl font-black text-white mb-4 tracking-tighter italic uppercase">{t.battleCenter}</h2>
              <div className="flex flex-wrap gap-4">
                <div className="bg-slate-900/50 p-6 rounded-2xl border border-slate-800 flex-1 min-w-[200px] backdrop-blur-sm">
                  <span className="text-[10px] text-slate-500 uppercase font-black tracking-widest block mb-2">{t.marchSize}</span>
                  <span className="text-amber-500 font-mono text-2xl font-bold">{profile.marchSize.toLocaleString()}</span>
                </div>
                <div className="bg-slate-900/50 p-6 rounded-2xl border border-slate-800 flex-1 min-w-[200px] backdrop-blur-sm">
                  <span className="text-[10px] text-slate-500 uppercase font-black tracking-widest block mb-2">{t.embassyCap}</span>
                  <span className="text-amber-500 font-mono text-2xl font-bold">{profile.embassyCapacity.toLocaleString()}</span>
                </div>
              </div>
            </div>
            <ReportAnalyzer profile={profile} lang={lang} />
          </>
        )}
      </main>
    </div>
  );
};

export default App;
