import React, { useState, useEffect } from 'react';
import { UserProfile, AuthState, Language } from './types';
import { translations } from './translations';
import Auth from './components/Auth';
import ProfileSetup from './components/ProfileSetup';
import ReportAnalyzer from './components/ReportAnalyzer';
import { LogOut, Settings, BarChart3, Loader2 } from 'lucide-react';
import { supabase } from './services/supabaseClient';

const App: React.FC = () => {
  const [lang, setLang] = useState<Language>('EN');
  const [auth, setAuth] = useState<AuthState>({ isAuthenticated: false, user: null });
  const [isAuthLoading, setIsAuthLoading] = useState(true);
  const [profile, setProfile] = useState<UserProfile>({ highestTiers: { Ground: 1, Ranged: 1, Mounted: 1, Siege: 1 }, marchSize: 0, embassyCapacity: 0, isSetup: false });

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session) setAuth({ isAuthenticated: true, user: { email: session.user.email } });
      setIsAuthLoading(false);
    });
    supabase.auth.onAuthStateChange((_event, session) => {
      setAuth(session ? { isAuthenticated: true, user: { email: session.user.email } } : { isAuthenticated: false, user: null });
    });
  }, []);

  if (isAuthLoading) return <div className="min-h-screen bg-slate-950 flex items-center justify-center"><Loader2 className="animate-spin text-amber-500" /></div>;
  if (!auth.isAuthenticated) return <Auth onLogin={user => setAuth({ isAuthenticated: true, user: { email: user.email } })} />;

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100">
      <header className="h-20 bg-slate-900 border-b border-slate-800 flex items-center px-6 justify-between">
        <div className="flex items-center gap-3"><BarChart3 className="text-amber-500" /><h1 className="font-black italic">EVONY AI</h1></div>
        <div className="flex gap-4 items-center">
          <button onClick={() => setProfile({ ...profile, isSetup: false })}><Settings size={20} /></button>
          <button onClick={() => supabase.auth.signOut()}><LogOut size={20} /></button>
        </div>
      </header>
      <main className="max-w-6xl mx-auto p-6">
        {!profile.isSetup ? <ProfileSetup initialProfile={profile} onSave={setProfile} lang={lang} /> : <ReportAnalyzer profile={profile} lang={lang} />}
      </main>
    </div>
  );
};

export default App;
