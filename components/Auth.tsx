import React, { useState } from 'react';
import { ShieldCheck, Mail, Lock, User, ArrowRight, CheckCircle2, MessageSquare, Facebook } from 'lucide-react';
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

  const handleAuthAction = async (provider: 'discord' | 'email' | 'google' | 'facebook') => {
    setError(null);
    setLoading(true);

    try {
      if (provider === 'email') {
        if (!email || !password) throw new Error("Tactical credentials required.");
        
        if (isLogin) {
          const { data, error } = await supabase.auth.signInWithPassword({ email, password });
          if (error) throw error;
          if (data.user) onLogin(data.user);
        } else {
          if (password !== confirmPassword) throw new Error("Security keys do not match.");
          if (!acceptTerms) throw new Error("You must accept the tactical protocols.");
          
          const { data, error } = await supabase.auth.signUp({
            email,
            password,
            options: {
              data: { display_name: name }
            }
          });
          if (error) throw error;
          
          if (data.user && data.session) {
            onLogin(data.user);
          } else {
            alert("Verification signal transmitted! Check your email to activate your command link.");
          }
        }
      } else {
        const { error } = await supabase.auth.signInWithOAuth({
          provider,
          options: {
            redirectTo: window.location.origin
          }
        });
        if (error) throw error;
      }
    } catch (err: any) {
      console.error(err);
      setError(err.message || "A tactical failure occurred. Verify your uplink.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-950 p-6 relative overflow-hidden text-slate-100">
      {/* Dynamic Background Elements */}
      <div className="absolute -top-[10%] -left-[10%] w-[60%] h-[60%] bg-indigo-600/10 blur-[120px] rounded-full"></div>
      <div className="absolute -bottom-[10%] -right-[10%] w-[60%] h-[60%] bg-amber-500/5 blur-[120px] rounded-full"></div>
      
      <div className="w-full max-w-md bg-slate-900/40 backdrop-blur-2xl rounded-[3rem] border border-slate-800/50 p-8 sm:p-10 shadow-
