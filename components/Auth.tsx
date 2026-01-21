import React, { useState } from 'react';
import { ShieldCheck, Chrome, Facebook, Mail, Lock, User, ArrowRight, CheckCircle2 } from 'lucide-react';

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

  const handleAuthAction = (provider: 'google' | 'facebook' | 'email') => {
    setError(null);
    
    if (provider === 'email') {
      if (!email || !password) {
        setError("Missing tactical credentials.");
        return;
      }
      if (!isLogin && password !== confirmPassword) {
        setError("Authorization secrets do not match.");
        return;
      }
      if (!isLogin && !acceptTerms) {
        setError("Protocols require agreement to Terms.");
        return;
      }
    }

    setLoading(true);
    // Simulate tactical synchronization with the server
    setTimeout(() => {
      onLogin({ 
        email: email || 'commander@evony.com', 
        name: name || 'Tactician',
        provider 
      });
      setLoading(false);
    }, 1500);
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-950 p-6 relative overflow-hidden">
      {/* Background Ambience / Tactical Grid feel */}
      <div className="absolute top-[-10%] left-[-10%] w-[50%] h-[50%] bg-amber-500/5 blur-[120px] rounded-full"></div>
      <div className="absolute bottom-[-10%] right-[-10%] w-[50%] h-[50%] bg-indigo-600/5 blur-[120px] rounded-full"></div>
      <div className="absolute inset-0 opacity-[0.03] pointer-events-none" style={{ backgroundImage: 'radial-gradient(#ffffff 1px, transparent 1px)', backgroundSize: '40px 40px' }}></div>

      <div className="w-full max-w-md bg-slate-900/40 backdrop-blur-2xl rounded-[2.5rem] border border-slate-800 p-8 sm:p-10 shadow-2xl relative z-10 transition-all duration-300">
        <div className="flex flex-col items-center mb-10">
          <div className="w-16 h-16 bg-gradient-to-br from-amber-400 to-amber-600 rounded-2xl flex items-center justify-center mb-4 shadow-lg shadow-amber-500/20 transform hover:scale-110 transition-transform cursor-default">
            <ShieldCheck size={36} className="text-slate-950" />
          </div>
          <h1 className="text-3xl font-black text-white tracking-tighter uppercase italic">Evony AI</h1>
          <p className="text-slate-500 text-[10px] font-bold uppercase tracking-[0.3em] mt-1 text-center">
            {isLogin ? 'Tactical Entry Portal' : 'New Commander Registration'}
          </p>
        </div>

        {error && (
          <div className="mb-6 p-4 bg-red-500/10 border border-red-500/20 rounded-xl text-red-400 text-xs font-bold text-center animate-in fade-in slide-in-from-top-1">
            {error}
          </div>
        )}

        <div className="space-y-4">
          {!isLogin && (
            <div className="relative group">
              <User className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500 group-focus-within:text-amber-500 transition-colors" size={18} />
              <input 
                type="text" 
                className="w-full bg-slate-950 border border-slate-800 rounded-2xl pl-12 pr-4 py-4 text-white focus:ring-2 focus:ring-amber-500/50 outline-none transition-all placeholder:text-slate-700 text-sm"
                placeholder="Commander Name"
                value={name}
                onChange={(e) => setName(e.target.value)}
              />
            </div>
          )}
          
          <div className="relative group">
            <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500 group-focus-within:text-amber-500 transition-colors" size={18} />
            <input 
              type="email" 
              className="w-full bg-slate-950 border border-slate-800 rounded-2xl pl-12 pr-4 py-4 text-white focus:ring-2 focus:ring-amber-500/50 outline-none transition-all placeholder:text-slate-700 text-sm"
              placeholder="Email Intelligence"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
          </div>

          <div className="relative group">
            <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500 group-focus-within:text-amber-500 transition-colors" size={18} />
            <input 
              type="password" 
              className="w-full bg-slate-950 border border-slate-800 rounded-2xl pl-12 pr-4 py-4 text-white focus:ring-2 focus:ring-amber-500/50 outline-none transition-all placeholder:text-slate-700 text-sm"
              placeholder="Tactical Secret"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
          </div>

          {!isLogin && (
            <div className="relative group animate-in fade-in slide-in-from-top-1">
              <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500 group-focus-within:text-amber-500 transition-colors" size={18} />
              <input 
                type="password" 
                className="w-full bg-slate-950 border border-slate-800 rounded-2xl pl-12 pr-4 py-4 text-white focus:ring-2 focus:ring-amber-500/50 outline-none transition-all placeholder:text-slate-700 text-sm"
                placeholder="Confirm Secret"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
              />
            </div>
          )}

          {!isLogin && (
            <div className="flex items-start gap-3 px-1 py-1">
              <button 
                type="button"
                onClick={() => setAcceptTerms(!acceptTerms)}
                className={`mt-1 w-5 h-5 rounded-lg border transition-all flex items-center justify-center ${acceptTerms ? 'bg-amber-500 border-amber-500' : 'bg-slate-950 border-slate-700 hover:border-slate-500'}`}
              >
                {acceptTerms && <CheckCircle2 size={14} className="text-slate-950" />}
              </button>
              <label className="text-[10px] text-slate-500 font-medium cursor-pointer leading-tight select-none" onClick={() => setAcceptTerms(!acceptTerms)}>
                I accept the Battle Protocols, General Terms, and Data Intelligence Privacy Agreement.
              </label>
            </div>
          )}

          <button 
            onClick={() => handleAuthAction('email')}
            disabled={loading}
            className="w-full bg-amber-500 hover:bg-amber-400 disabled:bg-slate-800 disabled:text-slate-600 text-slate-950 font-black py-4 rounded-2xl transition-all shadow-xl shadow-amber-500/5 flex items-center justify-center gap-2 group active:scale-[0.97]"
          >
            {loading ? (
              <div className="w-5 h-5 border-2 border-slate-950/20 border-t-slate-950 rounded-full animate-spin"></div>
            ) : (
              <>
                <span className="tracking-widest">{isLogin ? 'SYNC PORTAL' : 'ENLIST COMMANDER'}</span>
                <ArrowRight size={18} className="group-hover:translate-x-1 transition-transform" />
              </>
            )}
          </button>

          <div className="relative my-8 text-center">
            <span className="text-[9px] uppercase font-black tracking-widest text-slate-600 bg-transparent px-3 relative z-10">Cross-Platform Sync</span>
            <div className="absolute top-1/2 w-full h-[1px] bg-slate-800"></div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <button 
              onClick={() => handleAuthAction('google')} 
              disabled={loading}
              className="flex items-center justify-center gap-3 bg-slate-950 py-4 rounded-2xl border border-slate-800 hover:bg-slate-800 hover:border-slate-700 transition-all text-slate-300 active:scale-95 group"
            >
              <Chrome size={18} className="text-white group-hover:scale-110 transition-transform" /> 
              <span className="text-[10px] font-black uppercase tracking-wider">Google</span>
            </button>
            <button 
              onClick={() => handleAuthAction('facebook')} 
              disabled={loading}
              className="flex items-center justify-center gap-3 bg-slate-950 py-4 rounded-2xl border border-slate-800 hover:bg-slate-800 hover:border-slate-700 transition-all text-slate-300 active:scale-95 group"
            >
              <Facebook size={18} className="text-[#1877F2] group-hover:scale-110 transition-transform" /> 
              <span className="text-[10px] font-black uppercase tracking-wider">Facebook</span>
            </button>
          </div>

          <div className="pt-8 text-center">
            <button 
              onClick={() => { setIsLogin(!isLogin); setError(null); }} 
              className="text-xs text-slate-500 hover:text-amber-500 font-bold transition-colors"
            >
              {isLogin ? (
                <>New Strategist? <span className="text-amber-500 underline underline-offset-4 ml-1">Enlist Here</span></>
              ) : (
                <>Existing Intel? <span className="text-amber-500 underline underline-offset-4 ml-1">Portal Login</span></>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Auth;
