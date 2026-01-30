import React, { useState, useEffect } from 'react';
import { UserProfile, AuthState, Language } from './types';
import { ACCESS_CODE } from './constants';
import { translations } from './translations';
import Auth from './components/Auth';
import ProfileSetup from './components/ProfileSetup';
import ReportAnalyzer from './components/ReportAnalyzer';
import { LogOut, Settings, BarChart3, BarChart3, Loader2, Globe } from 'lucide-react';
import { supabase, isSupabaseConfigured } from './services/supabaseClient';

const App: React.FC = () => {
  const [lang, setLang] = useState<Language>(() => (localStorage.getItem('evony_lang') as Language) || 'EN');
  const [auth, setAuth] = useState<AuthState>({ isAuthenticated: false, user: null });
  const [isAuthLoading, setIsAuthLoading] = useState(true);
  const [profile, setProfile] = useState<UserProfile>(() => {
    const saved = localStorage.getItem('evony_profile');
    return saved ? JSON.parse(saved) : { highestTiers: { Ground: 1, Ranged: 1, Mounted: 1, Siege: 1 }, marchSize: 0, embassyCapacity: 0, isSetup: false };
  });
  
  const t = translations[lang];

  useEffect(() => {
    const initAuth = async () => {
      if (!isSupabaseConfigured) {
        console.warn('Supabase not configured - skipping auth');
        setIsAuthLoading(false);
        return;
      }
      
      try {
        const { data: { session } } = await supabase.auth.getSession();
        setAuth(mapSessionToAuth(session));
      } catch (error) {
        console.error('Auth initialization error:', error);
      } finally {
        setIsAuthLoading(false);
      }
    };
    
    initAuth();
    
    if (isSupabaseConfigured) {
      const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
        setAuth(mapSessionToAuth(session));
      });
      return () => subscription.unsubscribe();
    }
  }, []);

  const mapSessionToAuth = (session: any): AuthState => {
    if (!session) return { isAuthenticated: false, user: null };
    const { user } = session;
    return {
      isAuthenticated: true,
      user: {
        email: user?.email,
        name: user?.user_metadata?.display_name || user?.email || 'Commander',
        provider: 'email'
      }
    };
  };

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
    if (isSupabaseConfigured) {
      await supabase.auth.signOut();
    }
    setAuth({ isAuthenticated: false, user: null });
  };

  if (isAuthLoading) {
    return (
      <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center p-6 text-slate-100">
        <Loader2 className="w-12 h-12 text-amber-500 animate-spin mb-4" />
        <p className="text-[10px] font-black uppercase tracking-[0.3em] text-amber-500">Establishing Secure Uplink</p>
      </div>
    );
  }

  // Show warning if Supabase not configured but allow bypass
  if (!isSupabaseConfigured) {
    return (
      <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center p-6 text-slate-100">
        <div className="bg-slate-900 border border-amber-500 rounded-2xl p-8 max-w-md text-center">
          <h2 className="text-2xl font-black text-amber-500 mb-4">⚠️ Configuration Required</h2>
          <p className="text-slate-300 mb-6">Supabase credentials are not configured. Please set VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY in your Vercel environment variables.</p>
          <button 
            onClick={() => {
              setAuth({ isAuthenticated: true, user: { email: 'demo@test.com', name: 'Demo User', provider: 'bypass' }});
            }}
            className="bg-amber-500 text-slate-950 px-6 py-3 rounded-xl font-black hover:bg-amber-400 transition-colors"
          >
            Continue in Demo Mode
          </button>
        </div>
      </div>
    );
  }

  if (!auth.isAuthenticated) {
    return <Auth onLogin={async () => {
      const { data: { session } } = await supabase.auth.getSession();
      setAuth(mapSessionToAuth(session));
    }} />;
  }

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 pb-20">
      <header className="h-20 bg-slate-950/80 backdrop-blur-xl border-b border-slate-900 flex items-center px-6 sticky top-0 z-50">
        <div className="max-w-6xl mx-auto w-full flex justify-between items-center">
          <div className="flex items-center gap-3">
            <BarChart3 className="text-amber-500" />
            <h1 className="font-black text-xl tracking-tight hidden sm:block italic uppercase">EVONY AI</h1>
          </div>
          <div className="flex gap-3 items-center">
            <div className="relative group flex items-center gap-2 bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 transition-all hover:border-amber-500/50">
              <Globe size={14} className="text-slate-500 group-hover:text-amber-500" />
              <select 
                className="bg-transparent text-[11px] font-black focus:outline-none cursor-pointer text-slate-300 group-hover:text-white uppercase" 
                value={lang} 
                onChange={(e) => setLang(e.target.value as Language)}
              >
                {['EN', 'AR', 'FR', 'JA', 'ES', 'IT', 'RU', 'PT', 'ZH', 'DE'].map(l => <option key={l} value={l} className="bg-slate-900 text-white">{l}</option>)}
              </select>
            </div>
            
            <button onClick={() => setProfile({...profile, isSetup: false})} className="p-2.5 bg-slate-900 border border-slate-800 rounded-xl text-slate-400 hover:text-white transition-colors">
              <Settings size={18} />
            </button>
            <button onClick={handleLogout} className="p-2.5 bg-slate-900 border border-slate-800 rounded-xl text-slate-400 hover:text-red-400 transition-colors">
              <LogOut size={18} />
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
