import React, { useState } from 'react';
import { ShieldCheck, UserPlus, LogIn, Chrome, Facebook } from 'lucide-react';

interface AuthProps {
  onLogin: (user: any) => void;
}

const Auth: React.FC<AuthProps> = ({ onLogin }) => {
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');

  const handleAuthAction = (provider: 'google' | 'facebook' | 'email') => {
    onLogin({ 
      email: email || 'commander@evony.com', 
      name: name || 'Tactician',
      provider 
    });
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-950 p-6 relative">
      <div className="w-full max-w-md bg-slate-900/50 backdrop-blur-xl rounded-3xl border border-slate-800 p-8 shadow-2xl relative z-10">
        <div className="flex flex-col items-center mb-8">
          <div className="w-16 h-16 bg-amber-500 rounded-2xl flex items-center justify-center mb-4">
            <ShieldCheck size={32} className="text-slate-900" />
          </div>
          <h1 className="text-3xl font-black text-white">Evony AI</h1>
          <p className="text-slate-400 text-sm mt-2">{isLogin ? 'Welcome back, Commander.' : 'Create your tactician account.'}</p>
        </div>

        <div className="space-y-4">
          {!isLogin && (
            <input 
              type="text" 
              className="w-full bg-slate-800 border border-slate-700 rounded-xl px-4 py-3 text-white focus:ring-2 focus:ring-amber-500 outline-none"
              placeholder="Full Name"
              value={name}
              onChange={(e) => setName(e.target.value)}
            />
          )}
          <input 
            type="email" 
            className="w-full bg-slate-800 border border-slate-700 rounded-xl px-4 py-3 text-white focus:ring-2 focus:ring-amber-500 outline-none"
            placeholder="Email Address"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />
          <input 
            type="password" 
            className="w-full bg-slate-800 border border-slate-700 rounded-xl px-4 py-3 text-white focus:ring-2 focus:ring-amber-500 outline-none"
            placeholder="Password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />

          <button 
            onClick={() => handleAuthAction('email')}
            className="w-full bg-amber-500 hover:bg-amber-400 text-slate-900 font-black py-4 rounded-xl transition-all"
          >
            {isLogin ? 'Log In' : 'Sign Up'}
          </button>

          <div className="relative my-6 text-center">
            <span className="text-[10px] uppercase font-bold text-slate-500 bg-slate-900 px-2 relative z-10">Social Login</span>
            <div className="absolute top-1/2 w-full h-px bg-slate-800"></div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <button onClick={() => handleAuthAction('google')} className="flex items-center justify-center gap-2 bg-slate-800 py-3 rounded-xl border border-slate-700 hover:bg-slate-700">
              <Chrome size={18} /> <span className="text-xs font-bold">Google</span>
            </button>
            <button onClick={() => handleAuthAction('facebook')} className="flex items-center justify-center gap-2 bg-slate-800 py-3 rounded-xl border border-slate-700 hover:bg-slate-700">
              <Facebook size={18} className="text-blue-500" /> <span className="text-xs font-bold">Facebook</span>
            </button>
          </div>

          <button onClick={() => setIsLogin(!isLogin)} className="w-full text-xs text-slate-500 hover:text-amber-500 font-bold mt-4 uppercase">
            {isLogin ? "Need an account? Sign Up" : "Already a member? Log In"}
          </button>
        </div>
      </div>
    </div>
  );
};

export default Auth;
