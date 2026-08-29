import React, { useState } from 'react';
import {
  Lock,
  User,
  Shield,
  ArrowRight,
  Sparkles,
  KeyRound,
  AlertCircle,
  Eye,
  EyeOff,
  Loader2,
} from 'lucide-react';
import { UserAccount, TeamRole } from '../../types';
import { authenticateWithSupabase, saveUserToSupabase } from '../../lib/supabase';

interface LoginPageProps {
  onLogin: (user: UserAccount) => void;
  existingUsers: UserAccount[];
}

export const LoginPage: React.FC<LoginPageProps> = ({ onLogin, existingUsers }) => {
  const [isRegisterMode, setIsRegisterMode] = useState(false);
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [fullName, setFullName] = useState('');
  const [role, setRole] = useState<'sales' | 'lead_gen'>('sales');
  const [errorMessage, setErrorMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleLoginSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage('');

    const cleanUsername = username.trim().toLowerCase();
    const cleanPassword = password.trim();

    if (isRegisterMode) {
      if (!fullName.trim() || !cleanUsername || !cleanPassword) {
        setErrorMessage('Please fill in all required fields to create your account.');
        return;
      }

      setIsLoading(true);

      // Check if username already exists locally
      const found = existingUsers.find(
        (u) => u.username.toLowerCase() === cleanUsername
      );

      // If user exists and already has a customized non-default password
      if (found && found.password !== '123' && found.username !== 'ruhit') {
        setIsLoading(false);
        setErrorMessage('This username is already registered. Please click "Sign In" with your password.');
        return;
      }

      // Create or activate member account
      const newUser: UserAccount = {
        id: found ? found.id : `user-${Date.now()}`,
        fullName: fullName.trim(),
        username: cleanUsername,
        password: cleanPassword,
        role: found ? found.role : role,
        avatarColor: (found && found.avatarColor) || (role === 'sales' ? '#00E5A0' : '#3B82F6'),
        createdAt: found ? found.createdAt : new Date().toISOString(),
      };

      // Save to Supabase in background
      await saveUserToSupabase(newUser);
      setIsLoading(false);
      onLogin(newUser);
    } else {
      if (!cleanUsername || !cleanPassword) {
        setErrorMessage('Please enter both your username and password.');
        return;
      }

      setIsLoading(true);

      // 1. Check Dedicated Owner credentials
      if (cleanUsername === 'ruhit' && cleanPassword === 'ROS@Owner2026!') {
        const ownerUser = existingUsers.find((u) => u.username === 'ruhit') || {
          id: 'user-owner',
          fullName: 'Ruhit (Owner)',
          username: 'ruhit',
          password: 'ROS@Owner2026!',
          role: 'admin' as TeamRole,
          avatarColor: '#00C2FF',
          createdAt: new Date().toISOString(),
        };
        setIsLoading(false);
        onLogin(ownerUser);
        return;
      }

      // 2. Check local accounts list (matching by username or matching by prefix)
      const localUser = existingUsers.find(
        (u) =>
          (u.username.toLowerCase() === cleanUsername ||
           u.username.toLowerCase() === cleanUsername.split('@')[0]) &&
          u.password === cleanPassword
      );

      if (localUser) {
        setIsLoading(false);
        onLogin(localUser);
        return;
      }

      // 3. Check Supabase Cloud DB directly (for accounts created on other browsers / devices)
      try {
        const cloudUser = await authenticateWithSupabase(cleanUsername, cleanPassword);
        if (cloudUser) {
          setIsLoading(false);
          onLogin(cloudUser);
          return;
        }
      } catch (err) {
        console.warn('Supabase auth check skipped:', err);
      }

      setIsLoading(false);
      setErrorMessage('Invalid username or password. Please verify your credentials or click "Create Account".');
    }
  };

  return (
    <div className="min-h-screen bg-brand-black text-brand-white flex flex-col justify-center items-center p-4 relative overflow-hidden font-sans">
      {/* Background glow effects */}
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[550px] h-[550px] bg-brand-cyan/10 rounded-full blur-[140px] pointer-events-none" />
      <div className="absolute bottom-1/4 right-1/4 w-[400px] h-[400px] bg-brand-green/10 rounded-full blur-[120px] pointer-events-none" />

      {/* Main Login Card */}
      <div className="w-full max-w-md bg-brand-navy/95 backdrop-blur-xl border border-brand-midnight rounded-3xl p-8 shadow-2xl relative z-10 space-y-6 animate-scale-up">
        {/* Brand Logo & Title */}
        <div className="text-center space-y-2">
          <div className="w-14 h-14 rounded-2xl bg-brand-black border border-brand-cyan/40 flex items-center justify-center mx-auto shadow-cyan-glow relative">
            <span className="font-bold text-xl tracking-tighter text-brand-cyan">ROS</span>
            <div className="absolute top-1.5 right-1.5 w-2.5 h-2.5 rounded-full bg-brand-orange animate-pulse" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-brand-white tracking-wide">
              ROS<span className="text-brand-cyan font-light">x</span>SA <span className="text-xs font-mono text-brand-cyan px-2 py-0.5 rounded bg-brand-cyan/10 border border-brand-cyan/20">Portal</span>
            </h1>
            <p className="text-xs text-brand-gray mt-1">
              Outbound Collision Guard & Sales CRM
            </p>
          </div>
        </div>

        {/* Mode Switcher Tabs */}
        <div className="grid grid-cols-2 p-1 bg-brand-black rounded-xl border border-brand-midnight text-xs font-bold">
          <button
            type="button"
            onClick={() => {
              setIsRegisterMode(false);
              setErrorMessage('');
            }}
            className={`py-2 rounded-lg transition-all ${
              !isRegisterMode
                ? 'bg-brand-cyan text-brand-black shadow-cyan-glow'
                : 'text-brand-gray hover:text-brand-white'
            }`}
          >
            Sign In
          </button>
          <button
            type="button"
            onClick={() => {
              setIsRegisterMode(true);
              setErrorMessage('');
            }}
            className={`py-2 rounded-lg transition-all ${
              isRegisterMode
                ? 'bg-brand-cyan text-brand-black shadow-cyan-glow'
                : 'text-brand-gray hover:text-brand-white'
            }`}
          >
            Create Account
          </button>
        </div>

        {/* Error Feedback */}
        {errorMessage && (
          <div className="p-3 rounded-xl bg-red-500/10 border border-red-500/30 text-red-400 text-xs flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{errorMessage}</span>
          </div>
        )}

        {/* Login / Register Form */}
        <form onSubmit={handleLoginSubmit} className="space-y-4">
          {isRegisterMode && (
            <div>
              <label className="block text-xs font-mono uppercase text-brand-gray mb-1">
                Full Name <span className="text-brand-cyan">*</span>
              </label>
              <div className="relative">
                <User className="w-4 h-4 text-brand-gray absolute left-3.5 top-3" />
                <input
                  type="text"
                  required
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  placeholder="e.g. Nayeem Ahmed"
                  className="w-full pl-10 pr-3.5 py-2.5 rounded-xl bg-brand-black border border-brand-midnight text-xs text-brand-white placeholder-brand-gray focus:outline-none focus:border-brand-cyan font-medium"
                />
              </div>
            </div>
          )}

          <div>
            <label className="block text-xs font-mono uppercase text-brand-gray mb-1">
              Username or Email <span className="text-brand-cyan">*</span>
            </label>
            <div className="relative">
              <User className="w-4 h-4 text-brand-gray absolute left-3.5 top-3" />
              <input
                type="text"
                required
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="Enter username (e.g. nayeem)"
                className="w-full pl-10 pr-3.5 py-2.5 rounded-xl bg-brand-black border border-brand-midnight text-xs text-brand-white placeholder-brand-gray focus:outline-none focus:border-brand-cyan font-medium"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-mono uppercase text-brand-gray mb-1">
              Password <span className="text-brand-cyan">*</span>
            </label>
            <div className="relative">
              <KeyRound className="w-4 h-4 text-brand-gray absolute left-3.5 top-3" />
              <input
                type={showPassword ? 'text' : 'password'}
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full pl-10 pr-10 py-2.5 rounded-xl bg-brand-black border border-brand-midnight text-xs text-brand-white placeholder-brand-gray focus:outline-none focus:border-brand-cyan"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-3 text-brand-gray hover:text-brand-white"
              >
                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>

          {/* Create Account: ONLY Sales & Lead Gen (Admin option removed) */}
          {isRegisterMode && (
            <div>
              <label className="block text-xs font-mono uppercase text-brand-gray mb-1">
                Account Type <span className="text-brand-cyan">*</span>
              </label>
              <select
                value={role}
                onChange={(e) => setRole(e.target.value as 'sales' | 'lead_gen')}
                className="w-full px-3.5 py-2.5 rounded-xl bg-brand-black border border-brand-midnight text-xs text-brand-white focus:outline-none focus:border-brand-cyan font-medium"
              >
                <option value="lead_gen">Lead Generation Member (Scrubber & Meetings)</option>
                <option value="sales">Sales Team Member (Invoices & Deals)</option>
              </select>
              <p className="text-[10px] text-brand-gray mt-1 font-mono">
                🔒 Admin/Owner accounts can only be provisioned by the Portal Owner in Settings.
              </p>
            </div>
          )}

          <button
            type="submit"
            disabled={isLoading}
            className="w-full py-3 rounded-xl bg-brand-cyan text-brand-black font-bold text-xs sm:text-sm hover:brightness-110 active:scale-95 transition-all shadow-cyan-glow flex items-center justify-center gap-2 mt-2 disabled:opacity-50"
          >
            {isLoading ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <>
                <span>{isRegisterMode ? 'Create Account & Sign In' : 'Sign In to Portal'}</span>
                <ArrowRight className="w-4 h-4 stroke-[3]" />
              </>
            )}
          </button>
        </form>

        {/* Security Footer */}
        <div className="pt-2 border-t border-brand-midnight text-center">
          <p className="text-[11px] text-brand-gray font-mono">
            Protected by ROS Anti-Collision System · Enterprise Outbound
          </p>
        </div>
      </div>
    </div>
  );
};
