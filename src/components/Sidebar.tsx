import React from 'react';
import {
  LayoutDashboard,
  ShieldAlert,
  Kanban,
  Database,
  Sliders,
  LogOut,
  UserCheck,
} from 'lucide-react';
import { TeamMember, UserAccount } from '../types';

export type TabType = 'dashboard' | 'scrubber' | 'sales' | 'master' | 'settings';

interface SidebarProps {
  currentTab: TabType;
  onSelectTab: (tab: TabType) => void;
  overdueInvoiceCount: number;
  teamMembers: TeamMember[];
  currentUser: UserAccount;
  onLogout: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({
  currentTab,
  onSelectTab,
  overdueInvoiceCount,
  teamMembers,
  currentUser,
  onLogout,
}) => {
  const salesCount = teamMembers.filter((m) => m.role === 'sales').length;
  const leadGenCount = teamMembers.filter((m) => m.role === 'lead_gen').length;
  const totalCount = teamMembers.length;

  const isAdmin = currentUser.role === 'admin';
  const isSales = currentUser.role === 'sales';
  const isLeadGen = currentUser.role === 'lead_gen';

  const menuItems = [
    {
      id: 'dashboard' as TabType,
      label: 'Performance Dashboard',
      subtitle: 'Leaderboards & Targets',
      icon: LayoutDashboard,
      badge: null,
      visible: true,
    },
    {
      id: 'scrubber' as TabType,
      label: 'List Scrubber',
      subtitle: 'Remove Duplicate & DNC',
      icon: ShieldAlert,
      badge: null,
      visible: true, // Available to Sales, Lead Gen, and Admin
    },
    {
      id: 'sales' as TabType,
      label: 'Sales & Invoices',
      subtitle: 'Ongoing Leads & Invoices',
      icon: Kanban,
      badge: !isLeadGen && overdueInvoiceCount > 0 ? `${overdueInvoiceCount} Overdue` : null,
      badgeColor: 'bg-brand-orange/20 text-brand-orange border-brand-orange/40 font-bold animate-pulse',
      visible: !isLeadGen,
    },
    {
      id: 'master' as TabType,
      label: 'Master Database',
      subtitle: 'DNC & Active Clients',
      icon: Database,
      badge: null,
      visible: true,
    },
    {
      id: 'settings' as TabType,
      label: 'Settings & Cloud DB',
      subtitle: 'Supabase & Targets',
      icon: Sliders,
      badge: null,
      visible: isAdmin,
    },
  ];

  return (
    <aside className="w-full md:w-64 lg:w-72 bg-brand-navy border-r border-brand-midnight flex flex-col justify-between shrink-0 select-none">
      {/* Navigation Links */}
      <div className="p-4 space-y-1.5">
        <div className="px-3 py-2 text-[11px] font-mono uppercase tracking-widest text-brand-gray flex items-center justify-between">
          <span>Main Navigation</span>
          <span className="text-[10px] text-brand-cyan capitalize">{currentUser.role} View</span>
        </div>

        {menuItems
          .filter((item) => item.visible)
          .map((item) => {
            const Icon = item.icon;
            const isActive = currentTab === item.id;

            return (
              <button
                key={item.id}
                onClick={() => onSelectTab(item.id)}
                className={`w-full flex items-center justify-between px-3.5 py-3 rounded-xl text-left transition-all group ${
                  isActive
                    ? 'bg-brand-midnight text-brand-white border border-brand-cyan/40 shadow-cyan-glow'
                    : 'text-brand-gray hover:text-brand-white hover:bg-brand-black/40 border border-transparent'
                }`}
              >
                <div className="flex items-center gap-3">
                  <div
                    className={`p-2 rounded-lg transition-colors ${
                      isActive
                        ? 'bg-brand-cyan text-brand-black'
                        : 'bg-brand-black text-brand-gray group-hover:text-brand-cyan'
                    }`}
                  >
                    <Icon className="w-5 h-5" />
                  </div>
                  <div>
                    <div className={`text-sm font-semibold ${isActive ? 'text-brand-white' : 'text-gray-200'}`}>
                      {item.label}
                    </div>
                    <div className="text-[11px] text-brand-gray line-clamp-1">
                      {item.subtitle}
                    </div>
                  </div>
                </div>

                {item.badge && (
                  <span className={`text-[11px] px-2.5 py-1 rounded-lg border font-mono whitespace-nowrap shrink-0 ${item.badgeColor}`}>
                    {item.badge}
                  </span>
                )}
              </button>
            );
          })}
      </div>

      {/* Footer Team Info & Log Out Button */}
      <div className="p-4 border-t border-brand-midnight bg-brand-black/30 space-y-3">
        <div className="p-3 rounded-xl bg-brand-black border border-white/5 space-y-2">
          <div className="flex items-center justify-between text-xs">
            <span className="text-brand-gray">Active Teams</span>
            <span className="text-brand-cyan font-mono font-bold">{totalCount} Reps</span>
          </div>
          <div className="flex items-center justify-between text-xs">
            <span className="text-brand-gray">Sales Team</span>
            <span className="text-brand-green font-mono font-medium">{salesCount} Reps (£)</span>
          </div>
          <div className="flex items-center justify-between text-xs">
            <span className="text-brand-gray">Lead Gen</span>
            <span className="text-brand-cyan font-mono font-medium">{leadGenCount} Reps (Meetings)</span>
          </div>
        </div>

        {/* Sidebar Direct Log Out Button */}
        <button
          onClick={onLogout}
          className="w-full flex items-center justify-center gap-2 py-2 px-3 rounded-xl bg-red-500/10 hover:bg-red-500/20 text-red-400 border border-red-500/30 text-xs font-semibold transition-all group"
        >
          <LogOut className="w-3.5 h-3.5 group-hover:-translate-x-0.5 transition-transform" />
          <span>Log Out ({currentUser.username})</span>
        </button>

        <div className="text-[10px] text-brand-gray text-center font-mono">
          &copy; 2026 ROSxSA Hub
        </div>
      </div>
    </aside>
  );
};
