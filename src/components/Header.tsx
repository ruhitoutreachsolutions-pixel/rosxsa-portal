import React from 'react';
import {
  Bell,
  Cloud,
  CloudOff,
  PlusCircle,
  Zap,
  LogOut,
  ShieldCheck,
} from 'lucide-react';
import { NotificationItem, UserAccount } from '../types';

interface HeaderProps {
  notifications: NotificationItem[];
  unreadCount: number;
  onOpenNotifications: () => void;
  onOpenQuickLead: () => void;
  onOpenNewDeal: () => void;
  onOpenSupabaseConfig: () => void;
  isSupabaseConnected: boolean;
  currentUser: UserAccount;
  onLogout: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  notifications,
  unreadCount,
  onOpenNotifications,
  onOpenQuickLead,
  onOpenNewDeal,
  onOpenSupabaseConfig,
  isSupabaseConnected,
  currentUser,
  onLogout,
}) => {
  const isLeadGen = currentUser.role === 'lead_gen';
  const isAdmin = currentUser.role === 'admin';

  return (
    <header className="sticky top-0 z-30 bg-brand-navy/90 backdrop-blur-md border-b border-brand-midnight px-4 lg:px-8 py-3.5 flex items-center justify-between transition-all">
      {/* Brand & Identity */}
      <div className="flex items-center gap-3">
        <div className="flex items-center gap-2.5">
          {/* Logo Mark */}
          <div className="w-10 h-10 rounded-xl bg-brand-black border border-brand-cyan/30 flex items-center justify-center relative overflow-hidden shadow-cyan-glow">
            <span className="font-bold text-base tracking-tighter text-brand-cyan">ROS</span>
            <div className="absolute top-1 right-1 w-2 h-2 rounded-full bg-brand-orange animate-pulse" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-bold text-lg tracking-wider text-brand-white">
                ROS<span className="text-brand-cyan font-light">x</span>SA
              </span>
              <span className="text-[10px] uppercase font-mono tracking-widest px-2 py-0.5 rounded bg-brand-cyan/10 text-brand-cyan border border-brand-cyan/20">
                v2.0
              </span>
            </div>
            <p className="text-[11px] text-brand-gray hidden sm:block">
              Outbound Collision Guard & Sales CRM
            </p>
          </div>
        </div>
      </div>

      {/* Center Currency & Status Badges */}
      <div className="hidden md:flex items-center gap-3">
        <div className="flex items-center gap-1.5 px-3 py-1 rounded-lg bg-brand-black border border-white/10 text-xs text-brand-gray">
          <span className="w-2 h-2 rounded-full bg-brand-green"></span>
          <span>Currency:</span>
          <strong className="text-brand-white font-mono">£ GBP (British Pounds)</strong>
        </div>

        {/* Cloud Connection Badge */}
        <button
          onClick={isAdmin ? onOpenSupabaseConfig : undefined}
          className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs transition-colors border ${
            isSupabaseConnected
              ? 'bg-brand-green/10 text-brand-green border-brand-green/30'
              : 'bg-brand-midnight/40 text-brand-gray border-brand-midnight'
          }`}
          title={isAdmin ? 'Configure Supabase Cloud Sync' : 'Cloud Status'}
        >
          {isSupabaseConnected ? <Cloud className="w-3.5 h-3.5" /> : <CloudOff className="w-3.5 h-3.5" />}
          <span>{isSupabaseConnected ? 'Cloud Active' : 'Local Storage'}</span>
        </button>
      </div>

      {/* Actions, User Profile & Prominent Logout */}
      <div className="flex items-center gap-2 sm:gap-3">
        {/* Quick Log Lead / Reply */}
        <button
          onClick={onOpenQuickLead}
          className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-brand-cyan text-brand-black font-semibold text-xs sm:text-sm hover:brightness-110 active:scale-95 transition-all shadow-cyan-glow"
        >
          <Zap className="w-4 h-4 fill-current" />
          <span className="hidden sm:inline">+ Log Reply / Lead</span>
          <span className="sm:hidden">+ Reply</span>
        </button>

        {/* Quick New Deal (Hidden for lead team) */}
        {!isLeadGen && (
          <button
            onClick={onOpenNewDeal}
            className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-brand-midnight text-brand-white hover:bg-brand-midnight/80 border border-brand-cyan/20 font-medium text-xs sm:text-sm active:scale-95 transition-all"
          >
            <PlusCircle className="w-4 h-4 text-brand-green" />
            <span className="hidden sm:inline">+ New Invoice</span>
            <span className="sm:hidden">+ Deal</span>
          </button>
        )}

        {/* Notification Bell */}
        <button
          onClick={onOpenNotifications}
          className="relative p-2 rounded-xl bg-brand-black border border-white/10 hover:border-brand-cyan/40 text-brand-white transition-colors"
          aria-label="View notifications"
        >
          <Bell className="w-5 h-5 text-brand-gray hover:text-brand-cyan transition-colors" />
          {unreadCount > 0 && (
            <span className="absolute -top-1 -right-1 w-5 h-5 bg-brand-orange text-brand-black font-bold text-[10px] rounded-full flex items-center justify-center animate-bounce shadow-orange-glow">
              {unreadCount}
            </span>
          )}
        </button>

        {/* Current User Profile */}
        <div className="flex items-center gap-2.5 pl-2.5 border-l border-brand-midnight">
          <div className="flex items-center gap-2">
            <div
              className="w-8 h-8 rounded-xl flex items-center justify-center font-bold text-xs text-brand-black shadow-sm"
              style={{ backgroundColor: currentUser.avatarColor || '#00C2FF' }}
            >
              {currentUser.fullName.charAt(0)}
            </div>
            <div className="hidden lg:block text-left">
              <div className="text-xs font-bold text-brand-white line-clamp-1">
                {currentUser.fullName}
              </div>
              <div className="text-[10px] font-mono text-brand-cyan capitalize flex items-center gap-1">
                {currentUser.role === 'admin' && <ShieldCheck className="w-2.5 h-2.5 text-brand-orange" />}
                {currentUser.role}
              </div>
            </div>
          </div>

          {/* PROMINENT LOGOUT BUTTON */}
          <button
            onClick={onLogout}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-red-500/15 hover:bg-red-500/30 text-red-400 border border-red-500/40 text-xs font-bold transition-all active:scale-95 shadow-sm"
            title="Log Out of your account"
          >
            <LogOut className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Log Out</span>
          </button>
        </div>
      </div>
    </header>
  );
};
