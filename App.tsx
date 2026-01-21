import React, { useState, useEffect } from 'react';
import { UserProfile, AuthState, Language } from './types';
import { ACCESS_CODE } from './constants';
import { translations } from './translations';
import Auth from './components/Auth';
import ProfileSetup from './components/ProfileSetup';
import ReportAnalyzer from './components/ReportAnalyzer';
import { LogOut, Settings, BarChart3, ShieldAlert } from 'lucide-react';
import { supabase } from './services/supabaseClient';

const App: React.FC = () => {
  const [lang, setLang] = useState<Language>(() => (localStorage.getItem('evony_lang') as Language) || 'EN');
  const [auth, setAuth] = useState<AuthState>({ isAuthenticated: false, user: null });
  const [profile, setProfile] = useState<UserProfile>(() => {
    const saved = localStorage.getItem('evony_profile');
    return saved ? JSON.parse(saved) : { highestTiers: { Ground: 1, Ranged: 1, Mounted: 1, Siege: 1 }, marchSize: 0, embassyCapacity: 0, isSetup: false };
  });
  const [accessGranted, setAccessGranted] = useState(() => localStorage.getItem('evony_access') === 'true');
  const [inputCode, setInputCode] = useState('');
  const t = translations[lang];

  useEffect(() => {
    // Check initial session on load
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session) {
        setAuth({ 
          isAuthenticated: true, 
          user: { 
            email: session.user.email, 
            name: session.user.user_metadata?.display_name || session.user.email 
          } 
        });
      }
    });

    // Listen for real-time auth changes (Sign in, Sign out)
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      if (session) {
        setAuth({ 
          isAuthenticated: true, 
          user: { 
            email: session.user.email, 
            name: session.user.user_metadata?.display_name || session.user.email 
          } 
        });
      } else {
        setAuth({ isAuthenticated: false, user: null });
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  useEffect(() => { localStorage.setItem('evony_profile', JSON.stringify(profile)); }, [profile]);
  useEffect(() => { 
    localStorage.setItem('evony_lang', lang);
    document.documentElement.dir = t.isRTL ? 'rtl' : 'ltr';
  }, [lang, t.isRTL]);

  const handleLogout = async () => {
    await supabase.auth.signOut();
    setAuth({ isAuthenticated: false, user: null });
  };

  if (!accessGranted) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center p-6">
        <div className="max-w-md w-full bg-slate-900 border border-slate-800 p-10 rounded-3xl text-center shadow-2xl">
          <ShieldAlert size={48} className="mx-auto text-amber-500 mb-4" />
          <h1 className="text-3xl font-black text-white mb-2">Access Code</h1>
          <p className="text-slate-500 text-sm mb-6">Enter the tactical authorization code.</p>
          <input type="password" placeholder="••••••••" className="w-full bg-slate-950 border border-slate-700 rounded-xl p-4 text-center text-white mb-4 outline-none font-mono" value={inputCode} onChange={(e) => setInputCode(e.target.value)} />
          <button onClick={() => { if(inputCode === ACCESS_CODE) { setAccessGranted(true); localStorage.setItem('evony_access', 'true'); } else alert("Denied"); }} className="w-full bg-amber-500 py-4 rounded-xl font-black text-slate-950">Authenticate</button>
        </div>
      </div>
    );
  }

  if (!auth.isAuthenticated) return <Auth onLogin={(user) => setAuth({ isAuthenticated: true, user })} />;

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 pb-20">
      <header className="h-20 bg-slate-950/80 backdrop-blur-xl border-b border-slate-900 flex items-center px-6 sticky top-0 z-50">
        <div className="max-w-6xl mx-auto w-full flex justify-between items-center">
          <div className="flex items-center gap-3">
            <BarChart3 className="text-amber-500" />
            <h1 className="font-black text-xl tracking-tight hidden sm:block">EVONY AI</h1>
          </div>
          <div className="flex gap-2">
            <select className="bg-slate-900 border border-slate-800 rounded-lg p-2 text-xs font-bold" value={lang} onChange={(e) => setLang(e.target.value as Language)}>
              {['EN', 'AR', 'FR', 'JA', 'ES', 'RU', 'ZH'].map(l => <option key={l} value={l}>{l}</option>)}
            </select>
            <button onClick={() => setProfile({...profile, isSetup: false})} className="p-2 bg-slate-900 border border-slate-800 rounded-lg text-slate-400 hover:text-white"><Settings size={20} /></button>
            <button onClick={handleLogout} className="p-2 bg-slate-900 border border-slate-800 rounded-lg text-slate-400 hover:text-red-400"><LogOut size={20} /></button>
          </div>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-6 py-10">
        {!profile.isSetup ? (
          <ProfileSetup initialProfile={profile} onSave={setProfile} lang={lang} />
        ) : (
          <>
            <div className="mb-10">
              <h2 className="text-4xl font-black text-white mb-2">{t.battleCenter}</h2>
              <div className="flex gap-4">
                <div className="bg-slate-900 p-4 rounded-xl border border-slate-800"><span className="text-xs text-slate-500 uppercase font-bold block">{t.marchSize}</span><span className="text-amber-500 font-mono text-xl">{profile.marchSize.toLocaleString()}</span></div>
                <div className="bg-slate-900 p-4 rounded-xl border border-slate-800"><span className="text-xs text-slate-500 uppercase font-bold block">{t.embassyCap}</span><span className="text-amber-500 font-mono text-xl">{profile.embassyCapacity.toLocaleString()}</span></div>
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
