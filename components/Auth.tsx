import React, { useState } from 'react';
import { ShieldCheck, Mail, Lock, User, ArrowRight, AlertCircle, LogIn, Loader2 } from 'lucide-react';
import { supabase } from '../services/supabaseClient';

const Auth: React.FC<{ onLogin: (user: any) => void }> = ({ onLogin }) => {
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [name, setName] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleAuthAction = async () => {
    setError(null);
    setLoading(true);
    try {
      if (isLogin) {
        const { data, error: err } = await supabase.auth.signInWithPassword({ email, password });
        if (err) throw err;
        onLogin(data.user);
      } else {
        if (password !== confirmPassword) throw new Error("Keys do not match.");
        const { data, error: err } = await supabase.auth.signUp({ email, password, options: { data: { display_name: name } } });
        if (err) throw err;
        if (data.user && data.session) onLogin(data.user);
        else alert("Verification email sent.");
      }
    } catch (err: any) { setError(err.message); } finally { setLoading(false); }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-950 p-6 text-slate-100 font-sans">
      <div className="w-full max-w-md bg-slate-900 border border-slate-800 p-10 rounded-[3rem] shadow-2xl">
        <div className="flex flex-col items-center mb-10 text-center">
          <ShieldCheck size={48} className="text-amber-500 mb-4" />
          <h1 className="text-3xl font-black italic uppercase">Evony AI</h1>
          <p className="text-slate-500 text-[10px] uppercase tracking-widest mt-2">Tactical Command Access</p>
        </div>

        {error && <div className="mb-6 p-4 bg-red-500/10 border border-red-500/20 rounded-xl text-red-400 text-xs text-center">{error}</div>}

        <div className="space-y-4">
          {!isLogin && <input type="text" placeholder="COMMANDER NAME" className="w-full bg-slate-950 border border-slate-800 rounded-2xl p-4 text-white" value={name} onChange={e => setName(e.target.value)} />}
          <input type="email" placeholder="EMAIL" className="w-full bg-slate-950 border border-slate-800 rounded-2xl p-4 text-white" value={email} onChange={e => setEmail(e.target.value)} />
          <input type="password" placeholder="PASSWORD" className="w-full bg-slate-950 border border-slate-800 rounded-2xl p-4 text-white" value={password} onChange={e => setPassword(e.target.value)} />
          {!isLogin && <input type="password" placeholder="CONFIRM PASSWORD" className="w-full bg-slate-950 border border-slate-800 rounded-2xl p-4 text-white" value={confirmPassword} onChange={e => setConfirmPassword(e.target.value)} />}
          
          <button onClick={handleAuthAction} disabled={loading} className="w-full bg-amber-500 text-slate-950 font-black py-5 rounded-2xl flex items-center justify-center gap-2 mt-4">
            {loading ? <Loader2 className="animate-spin" /> : (isLogin ? <LogIn /> : <ArrowRight />)}
            {isLogin ? 'LOGIN' : 'SIGN UP'}
          </button>

          <button onClick={() => setIsLogin(!isLogin)} className="w-full text-[10px] font-black text-amber-500 uppercase tracking-widest mt-6">
            {isLogin ? "Need an account? Sign Up" : "Have an account? Login"}
          </button>
        </div>
      </div>
    </div>
  );
};

export default Auth;
