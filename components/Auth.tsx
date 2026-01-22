import React, { useState } from 'react';
import { 
  ShieldCheck, Mail, Lock, User, ArrowRight, AlertCircle, 
  LogIn, ServerOff
} from 'lucide-react';
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
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  const cleanRedirectUrl = window.location.origin.replace(/\/$/, "");

  // Detect if Supabase configuration is present
  const isSupabaseConfigured = !supabase.auth.getSession ? false : !window.location.origin.includes('missing-url');

  const handleAuthAction = async () => {
    setError(null);
    setSuccessMsg(null);
    setLoading(true);

    try {
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
          options: { 
            data: { display_name: name }, 
            emailRedirectTo: cleanRedirectUrl
          }
        });
        if (signUpError) throw signUpError;
        
        if (data.user && data.session) {
          onLogin(data.user);
        } else {
          setSuccessMsg("Signal transmitted! Check your email to verify your account.");
        }
      }
    } catch (err: any) {
      console.error('Auth failure:', err);
      if (err.message === 'Failed to fetch' || err.name === 'TypeError') {
        setError("UPLINK FAILURE: Could not connect to the auth server. Check environment variables.");
      } else {
        setError(err.message || "A tactical failure occurred. Verify your credentials.");
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-950 p-6 relative overflow-hidden text-slate-100 font-sans">
      <div className="absolute -top-[10%] -left-[10%] w-[60%] h-[60%] bg-indigo-600/10 blur-[120px] rounded-full"></div>
      <div className="absolute -bottom-[10%] -right-[10%] w-[60%] h-[60%] bg-amber-500/5 blur-[120px] rounded-full"></div>
      
      <div className="w-full max-w-md bg-slate-900/40 backdrop-blur-2xl rounded-[3rem] border border-slate-800/50 p-8 sm:p-10 shadow-2xl relative z-10 my-10 border-t-amber-500/20">
        <div className="flex flex-col items-center mb-8 text-center">
          <div className="w-16 h-16 bg-gradient-to-br from-amber-400 to-amber-600 rounded-2xl flex items-center justify-center mb-4 shadow-lg shadow-amber-500/20 transform hover:scale-110 rotate-3 transition-transform cursor-pointer">
            <ShieldCheck size={36} className="text-slate-950" />
          </div>
          <h1 className="text-3xl font-black text-white tracking-tighter uppercase italic">Evony AI</h1>
          <p className="text-slate-500 text-[10px] font-black uppercase tracking-[0.3em] mt-1">
            {isLogin ? 'Tactical Entry Portal' : 'Strategist Registration'}
          </p>
        </div>

        {error && (
          <div className="mb-6 p-4 bg-red-500/10 border border-red-500/20 rounded-xl text-red-400 text-[10px] font-bold text-center flex flex-col items-center gap-2">
            <AlertCircle size={16} className="flex-shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {successMsg && (
          <div className="mb-6 p-4 bg-emerald-500/10 border border-emerald-500/20 rounded-xl text-emerald-400 text-[10px] font-bold text-center">
            {successMsg}
          </div>
        )}

        <div className="space-y-4">
          <div className="space-y-3">
            {!isLogin && (
              <div className="relative">
                <User className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500" size={18} />
                <input
                  type="text"
                  placeholder="COMMANDER NAME"
                  className="w-full bg-slate-950 border border-slate-800 rounded-2xl py-4 pl-12 pr-4 text-white outline-none focus:ring-2 focus:ring-amber-500/50 transition-all placeholder:text-slate-700 text-sm font-bold"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                />
              </div>
            )}
            
            <div className="relative">
              <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500" size={18} />
              <input
                type="email"
                placeholder="SECURE EMAIL"
                className="w-full bg-slate-950 border border-slate-800 rounded-2xl py-4 pl-12 pr-4 text-white outline-none focus:ring-2 focus:ring-amber-500/50 transition-all placeholder:text-slate-700 text-sm font-bold"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </div>

            <div className="relative">
              <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500" size={18} />
              <input
                type="password"
                placeholder="ACCESS KEY"
                className="w-full bg-slate-950 border border-slate-800 rounded-2xl py-4 pl-12 pr-4 text-white outline-none focus:ring-2 focus:ring-amber-500/50 transition-all placeholder:text-slate-700 text-sm font-bold"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
            </div>

            {!isLogin && (
              <div className="relative">
                <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500" size={18} />
                <input
                  type="password"
                  placeholder="CONFIRM ACCESS KEY"
                  className="w-full bg-slate-950 border border-slate-800 rounded-2xl py-4 pl-12 pr-4 text-white outline-none focus:ring-2 focus:ring-amber-500/50 transition-all placeholder:text-slate-700 text-sm font-bold"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                />
              </div>
            )}

            {!isLogin && (
              <div className="flex items-center gap-3 px-2">
                <input
                  type="checkbox"
                  id="terms"
                  className="w-4 h-4 rounded border-slate-800 bg-slate-950 text-amber-500 focus:ring-amber-500/50"
                  checked={acceptTerms}
                  onChange={(e) => setAcceptTerms(e.target.checked)}
                />
                <label htmlFor="terms" className="text-[10px] font-bold text-slate-500 uppercase cursor-pointer">
                  I accept the tactical protocols
                </label>
              </div>
            )}
          </div>

          <button
            onClick={handleAuthAction}
            disabled={loading}
            className="w-full bg-amber-500 hover:bg-amber-400 text-slate-950 font-black py-4 rounded-2xl shadow-xl shadow-amber-500/20 flex items-center justify-center gap-2 transition-all active:scale-[0.98] disabled:opacity-50 mt-4"
          >
            {loading ? <ShieldCheck className="animate-spin" /> : (isLogin ? <LogIn size={18} /> : <ArrowRight size={18} />)}
            {isLogin ? 'AUTHORIZE UPLINK' : 'REGISTER STRATEGIST'}
          </button>

          <div className="pt-6 text-center">
            <button
              onClick={() => setIsLogin(!isLogin)}
              className="text-[10px] font-black text-amber-500 uppercase tracking-widest hover:text-amber-400 transition-colors"
            >
              {isLogin ? "Need a Strategist ID? Register" : "Have credentials? Return to login"}
            </button>
          </div>
          
          {!isSupabaseConfigured && (
            <div className="mt-8 p-4 bg-amber-500/5 border border-amber-500/20 rounded-2xl flex items-start gap-3">
              <ServerOff size={16} className="text-amber-500 mt-0.5 flex-shrink-0" />
              <div className="space-y-1">
                <p className="text-[9px] font-black text-amber-500 uppercase tracking-widest">Backend Connection Pending</p>
                <p className="text-[8px] text-slate-400 leading-relaxed uppercase">Supabase environment variables are missing. Authentication is currently offline.</p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Auth;
