import React, { useState } from 'react';
import { ShieldCheck, Mail, Lock, User, ArrowRight, CheckCircle2, MessageSquare } from 'lucide-react';
import { supabase } from '../services/supabaseClient';

interface AuthProps {
  onLogin: (user: any) => void;
}

const Auth: React.FC<AuthProps> = ({ onLogin }) => {
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [name, setName] = useState('');
  const [acceptTerms, setAcceptTerms] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleAuthAction = async (provider: 'discord' | 'email') => {
    setError(null);
    setLoading(true);

    try {
      if (provider === 'email') {
        if (!email || !password) throw new Error("Tactical credentials required.");
        
        if (isLogin) {
          const { data, error: signInError } = await supabase.auth.signInWithPassword({ email, password });
          if (signInError) throw signInError;
          if (data.user) onLogin(data.user);
        } else {
          if (password !== confirmPassword) throw new Error("Security keys do not match.");
          if (!acceptTerms) throw new Error("You must accept the tactical protocols.");
          
          const { data, error: signUpError } = await supabase.auth.signUp({
            email,
            password,
            options: { data: { display_name: name } }
          });
          if (signUpError) throw signUpError;
          
          if (data.user && data.session) {
            onLogin(data.user);
          } else {
            alert("Verification signal transmitted! Check your email to activate your command link.");
          }
        }
      } else {
        const { error: oauthError } = await supabase.auth.signInWithOAuth({
          provider,
          options: { 
            redirectTo: window.location.origin
          }
        });
        if (oauthError) throw oauthError;
      }
    } catch (err: any) {
      console.error('Auth failure:', err);
      setError(err.message || "A tactical failure occurred. Verify your uplink.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-950 p-6 relative overflow-hidden text-slate-100">
      <div className="absolute -top-[10%] -left-[10%] w-[60%] h-[60%] bg-indigo-600/10 blur-[120px] rounded-full"></div>
      <div className="absolute -bottom-[10%] -right-[10%] w-[60%] h-[60%] bg-amber-500/5 blur-[120px] rounded-full"></div>
      
      <div className="w-full max-w-md bg-slate-900/40 backdrop-blur-2xl rounded-[3rem] border border-slate-800/50 p-8 sm:p-10 shadow-2xl relative z-10">
        <div className="flex flex-col items-center mb-8 text-center">
          <div className="w-16 h-16 bg-gradient-to-br from-amber-400 to-amber-600 rounded-2xl flex items-center justify-center mb-4 shadow-lg shadow-amber-500/20 transform hover:scale-110 rotate-3 transition-transform">
            <ShieldCheck size={36} className="text-slate-950" />
          </div>
          <h1 className="text-3xl font-black text-white tracking-tighter uppercase italic">Evony AI</h1>
          <p className="text-slate-500 text-[10px] font-black uppercase tracking-[0.3em] mt-1">
            {isLogin ? 'Tactical Entry Portal' : 'Strategist Registration'}
          </p>
        </div>

        {error && (
          <div className="mb-6 p-4 bg-red-500/10 border border-red-500/20 rounded-xl text-red-400 text-[10px] font-bold text-center animate-pulse">
            {error}
          </div>
        )}

        <div className="space-y-4">
          <div className="space-y-3">
            {!isLogin && (
              <div className="relative group">
                <User className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-600 group-focus-within:text-amber-500 transition-colors" size={18} />
                <input 
                  type="text" 
                  className="w-full bg-slate-950/50 border border-slate-800 rounded-2xl pl-12 pr-4 py-3.5 text-white focus:ring-2 focus:ring-amber-500/50 outline-none transition-all placeholder:text-slate-700 text-sm"
                  placeholder="Commander Name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                />
              </div>
            )}
            
            <div className="relative group">
              <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-600 group-focus-within:text-amber-500 transition-colors" size={18} />
              <input 
                type="email" 
                className="w-full bg-slate-950/50 border border-slate-800 rounded-2xl pl-12 pr-4 py-3.5 text-white focus:ring-2 focus:ring-amber-500/50 outline-none transition-all placeholder:text-slate-700 text-sm"
                placeholder="Intelligence Email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </div>

            <div className="relative group">
              <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-600 group-focus-within:text-amber-500 transition-colors" size={18} />
              <input 
                type="password" 
                className="w-full bg-slate-950/50 border border-slate-800 rounded-2xl pl-12 pr-4 py-3.5 text-white focus:ring-2 focus:ring-amber-500/50 outline-none transition-all placeholder:text-slate-700 text-sm"
                placeholder="Tactical Secret"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
            </div>

            {!isLogin && (
              <>
                <div className="relative group">
                  <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-600 group-focus-within:text-amber-500 transition-colors" size={18} />
                  <input 
                    type="password" 
                    className="w-full bg-slate-950/50 border border-slate-800 rounded-2xl pl-12 pr-4 py-3.5 text-white focus:ring-2 focus:ring-amber-500/50 outline-none transition-all placeholder:text-slate-700 text-sm"
                    placeholder="Confirm Secret"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                  />
                </div>
                <div className="flex items-start gap-3 px-1 py-1">
                  <button 
                    type="button"
                    onClick={() => setAcceptTerms(!acceptTerms)}
                    className={`mt-1 w-5 h-5 rounded-lg border transition-all flex items-center justify-center flex-shrink-0 ${acceptTerms ? 'bg-amber-500 border-amber-500 shadow-md shadow-amber-500/20' : 'bg-slate-950 border-slate-700 hover:border-slate-500'}`}
                  >
                    {acceptTerms && <CheckCircle2 size={14} className="text-slate-950" />}
                  </button>
                  <label className="text-[10px] text-slate-500 font-bold cursor-pointer leading-tight select-none pt-0.5" onClick={() => setAcceptTerms(!acceptTerms)}>
                    I accept the Battle Protocols and Privacy Agreement.
                  </label>
                </div>
              </>
            )}

            <button 
              onClick={() => handleAuthAction('email')}
              disabled={loading}
              className="w-full bg-amber-500 hover:bg-amber-400 disabled:bg-slate-800 disabled:text-slate-600 text-slate-950 font-black py-4 rounded-2xl transition-all shadow-xl shadow-amber-500/10 flex items-center justify-center gap-2 group mt-2"
            >
              {loading ? (
                <div className="w-5 h-5 border-2 border-slate-950/20 border-t-slate-950 rounded-full animate-spin"></div>
              ) : (
                <>
                  <span className="tracking-widest uppercase text-xs">{isLogin ? 'SYNC PORTAL' : 'ENLIST NOW'}</span>
                  <ArrowRight size={18} className="group-hover:translate-x-1 transition-transform" />
                </>
              )}
            </button>
          </div>

          <div className="relative my-8 text-center">
            <span className="text-[9px] uppercase font-black tracking-[0.4em] text-slate-600 bg-[#0f172a] px-4 relative z-10">SECURE UPLINK</span>
            <div className="absolute top-1/2 w-full h-[1px] bg-slate-800/30"></div>
          </div>

          <button 
            onClick={() => handleAuthAction('discord')} 
            disabled={loading}
            className="w-full flex items-center justify-center gap-3 bg-[#5865F2] hover:bg-[#4752c4] py-4 rounded-2xl transition-all shadow-xl active:scale-95 text-white font-black text-xs uppercase tracking-widest border-b-4 border-[#3e48ae]"
          >
            <MessageSquare size={18} fill="currentColor" />
            Connect via Discord
          </button>

          <div className="pt-8 text-center border-t border-slate-800/50 mt-6">
            <button 
              onClick={() => { setIsLogin(!isLogin); setError(null); }} 
              className="text-[10px] text-slate-500 hover:text-amber-500 font-black transition-colors underline underline-offset-8 decoration-slate-800 hover:decoration-amber-500/30 uppercase tracking-widest block w-full"
            >
              {isLogin ? "NEW STRATEGIST? ENLIST HERE" : "EXISTING INTEL? RETURN TO PORTAL"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Auth;
