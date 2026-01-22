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
          const { data, error } = await supabase.auth.signInWithPassword({ email, password });
          if (error) throw error;
          if (data.user) onLogin(data.user);
        } else {
          if (password !== confirmPassword) throw new Error("Security keys do not match.");
          if (!acceptTerms) throw new Error("You must accept the tactical protocols.");
