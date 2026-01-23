import React, { useState } from 'react';
import { 
  ShieldCheck, Mail, Lock, User, ArrowRight, AlertCircle, 
  LogIn, Loader2
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
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  const cleanRedirectUrl = window.location.origin;

  const handleAuthAction = async () => {
    setError(null);
    setSuccessMsg(null);
    setLoading(true);

    try {
      if (!email || !password) throw new Error("Security credentials required.");
      
      if (isLogin) {
        const { data, error: signInError } = await supabase.auth.signInWithPassword({ email, password });
        if (signInError) throw signInError;
        if (data.user) onLogin(data.user);
      } else {
        if (!isLogin && password !== confirmPassword) throw new Error("Verification keys do not match.");
        
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
          setSuccessMsg("Signal sent. Check your secure inbox to verify your account.");
        }
      }
    } catch (err: any) {
      setError(err.message || "Tactical deployment failed.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-950 p-6 relative overflow-hidden text-slate-100 font-sans">
      <div className="absolute -top-[10%] -left-[10%] w-[70%] h-[70%] bg-indigo-600/10 blur-[150px] rounded-full animate-pulse"></div>
      <div className="absolute -bottom-[10%] -right-[10%] w-[70%] h-[70%] bg-amber-500/5 blur-[150px] rounded-full"></div>
      
      <div className="w-full max-w-md bg-slate-900/60 backdrop-blur-3xl rounded-[3rem] border border-slate-800/50 p-8 sm:p-10 shadow-2xl relative z-10 border-t-amber-500/20 my-10 animate-in fade-in zoom-in-95 duration-500">
        <div className="flex flex-col items-center mb-10 text-center">
          <div className="w-16 h-16 bg-gradient-to-br from-amber-400 to-amber-600 rounded-2xl flex items-center justify-center mb-4 shadow-lg shadow-amber-500/20 transform hover:scale-110 transition-transform cursor-pointer">
            <ShieldCheck size={36} className="text-slate-950" />
          </div>
          <h1 className="text-3xl font-black text-white tracking-tighter uppercase italic leading-none">Evony AI</h1>
          <p className="text-slate-500 text-[10px] font-black uppercase tracking-[0.3em] mt-2">Tactical Command Access</p>
        </div>

        {error && (
          <div className="mb-6 p-4 bg-red-500/10 border border-red-500/20 rounded-xl text-red-400 text-[10px] font-bold text-center flex items-center justify-center gap-2 animate-in fade-in zoom-in-95">
            <AlertCircle size={16} /> <span>{error}</span>
          </div>
        )}

        {successMsg && (
          <div className="mb-6 p-4 bg-emerald-500/10 border border-emerald-500/20 rounded-xl text-emerald-400 text-[10px] font-bold text-center animate-in fade-in zoom-in-95">
            {successMsg}
          </div>
        )}

        <div className="space-y-4">
          {!isLogin && (
            <div className="relative group">
              <User className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500 group-focus-within:text-amber-500 transition-colors" size={18} />
              <input
                type="text"
                placeholder="COMMANDER NAME"
                className="w-full bg-slate-950 border border-slate-800 rounded-2xl py-4 pl-12 pr-4 text-white outline-none focus:ring-2 focus:ring-amber-500/50 transition-all placeholder:text-slate-700 text-sm font-bold uppercase"
                value={name}
                onChange={(e) => setName(e.target.value)}
              />
            </div>
          )}
          
          <div className="relative group">
            <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500 group-focus-within:text-amber-500 transition-colors" size={18} />
            <input
              type="email"
              placeholder="STRATEGIST EMAIL"
              className="w-full bg-slate-950 border border-slate-800 rounded-2xl py-4 pl-12 pr-4 text-white outline-none focus:ring-2 focus:ring-amber-500/50 transition-all placeholder:text-slate-700 text-sm font-bold"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
          </div>

          <div className="relative group">
            <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500 group-focus-within:text-amber-500 transition-colors" size={18} />
            <input
              type="password"
              placeholder="ACCESS KEY"
              className="w-full bg-slate-950 border border-slate-800 rounded-2xl py-4 pl-12 pr-4 text-white outline-none focus:ring-2 focus:ring-amber-500/50 transition-all placeholder:text-slate-700 text-sm font-bold"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
          </div>

          {!isLogin && (
            <div className="relative group">
              <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500 group-focus-within:text-amber-500 transition-colors" size={18} />
              <input
                type="password"
                placeholder="CONFIRM KEY"
                className="w-full bg-slate-950 border border-slate-800 rounded-2xl py-4 pl-12 pr-4 text-white outline-none focus:ring-2 focus:ring-amber-500/50 transition-all placeholder:text-slate-700 text-sm font-bold"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
              />
            </div>
          )}

          <button
            onClick={handleAuthAction}
            disabled={loading}
            className="w-full bg-amber-500 hover:bg-amber-400 text-slate-950 font-black py-5 rounded-2xl shadow-xl shadow-amber-500/20 flex items-center justify-center gap-2 transition-all active:scale-[0.98] mt-4 disabled:opacity-50"
          >
            {loading ? <Loader2 className="animate-spin" size={20} /> : (isLogin ? <LogIn size={20} /> : <ArrowRight size={20} />)}
            {isLogin ? 'AUTHORIZE UPLINK' : 'REGISTER COMMANDER'}
          </button>

          <div className="pt-6 text-center">
            <button
              onClick={() => setIsLogin(!isLogin)}
              className="text-[10px] font-black text-amber-500 uppercase tracking-widest hover:text-amber-400 transition-colors"
            >
              {isLogin ? "Request New ID? Sign Up" : "Recall Active ID? Login"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Auth;
