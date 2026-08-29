import React, { useState } from 'react';
import {
  Sliders,
  Users,
  Target,
  Cloud,
  Database,
  PoundSterling,
  Plus,
  Edit2,
  Trash2,
  CalendarCheck,
  ShieldCheck,
  Sparkles,
  KeyRound,
  Lock,
} from 'lucide-react';
import { TeamMember, MonthlyQuotas, UserAccount } from '../../types';
import { formatGbp } from '../../lib/currency';
import { TeamMemberModal } from './TeamMemberModal';

interface SettingsViewProps {
  teamMembers: TeamMember[];
  quotas: MonthlyQuotas;
  isSupabaseConnected: boolean;
  onOpenTargetManager: () => void;
  onOpenSupabaseConfig: () => void;
  onOpenDataManagement: () => void;
  onSaveMember: (member: TeamMember, credentials?: { username: string; password?: string }) => void;
  onDeleteMember: (id: string) => void;
  users?: UserAccount[];
}

export const SettingsView: React.FC<SettingsViewProps> = ({
  teamMembers,
  quotas,
  isSupabaseConnected,
  onOpenTargetManager,
  onOpenSupabaseConfig,
  onOpenDataManagement,
  onSaveMember,
  onDeleteMember,
  users = [],
}) => {
  const adminReps = teamMembers.filter((m) => m.role === 'admin');
  const salesReps = teamMembers.filter((m) => m.role === 'sales');
  const leadGenReps = teamMembers.filter((m) => m.role === 'lead_gen');

  const [isMemberModalOpen, setIsMemberModalOpen] = useState(false);
  const [memberToEdit, setMemberToEdit] = useState<TeamMember | null>(null);

  const handleOpenAddMember = () => {
    setMemberToEdit(null);
    setIsMemberModalOpen(true);
  };

  const handleOpenEditMember = (member: TeamMember) => {
    setMemberToEdit(member);
    setIsMemberModalOpen(true);
  };

  const handleDelete = (id: string, name: string) => {
    if (window.confirm(`Are you sure you want to remove ${name} from the team roster and revoke their access?`)) {
      onDeleteMember(id);
    }
  };

  return (
    <div className="space-y-6">
      {/* Title */}
      <div className="p-6 rounded-2xl bg-brand-navy border border-brand-midnight shadow-card-dark flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-2xl bg-brand-black border border-brand-cyan/30 flex items-center justify-center text-brand-cyan shadow-cyan-glow">
            <Sliders className="w-6 h-6" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-xl font-bold text-brand-white">Owner & Admin Control Hub</h2>
              <span className="text-xs font-mono px-2 py-0.5 rounded bg-brand-orange/20 text-brand-orange border border-brand-orange/40 font-bold">
                Owner Access
              </span>
            </div>
            <p className="text-xs text-brand-gray">
              Manage team rosters, create admin/member accounts, edit quotas in £ GBP, and sync Supabase cloud DB.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2.5">
          <button
            onClick={handleOpenAddMember}
            className="px-4 py-2 rounded-xl bg-brand-cyan text-brand-black font-bold text-xs hover:brightness-110 active:scale-95 transition-all shadow-cyan-glow flex items-center gap-1.5"
          >
            <Plus className="w-4 h-4" />
            <span>+ Add Member / Admin</span>
          </button>

          <button
            onClick={onOpenTargetManager}
            className="px-4 py-2 rounded-xl bg-brand-green text-brand-black font-bold text-xs hover:brightness-110 active:scale-95 transition-all shadow-green-glow flex items-center gap-1.5"
          >
            <Target className="w-4 h-4" />
            <span>Edit Quotas (£)</span>
          </button>
        </div>
      </div>

      {/* Settings Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Card 1: Cloud DB */}
        <div className="p-5 rounded-2xl bg-brand-navy border border-brand-midnight shadow-card-dark space-y-3 flex flex-col justify-between">
          <div className="space-y-2">
            <div className="w-10 h-10 rounded-xl bg-brand-black border border-brand-cyan/20 flex items-center justify-center text-brand-cyan">
              <Cloud className="w-5 h-5" />
            </div>
            <h3 className="text-sm font-bold text-brand-white">Supabase Cloud Sync</h3>
            <p className="text-xs text-brand-gray">
              Connect a free PostgreSQL database from Supabase for real-time cloud data sync across all 12 reps.
            </p>
          </div>

          <div className="pt-2 border-t border-brand-midnight flex items-center justify-between">
            <span
              className={`text-[11px] font-mono font-semibold px-2 py-0.5 rounded border ${
                isSupabaseConnected
                  ? 'bg-brand-green/10 text-brand-green border-brand-green/30'
                  : 'bg-brand-midnight text-brand-gray border-white/10'
              }`}
            >
              {isSupabaseConnected ? '● Cloud Connected' : '○ Local Storage'}
            </span>
            <button
              onClick={onOpenSupabaseConfig}
              className="text-xs font-semibold text-brand-cyan hover:underline"
            >
              Configure
            </button>
          </div>
        </div>

        {/* Card 2: Revenue Quotas */}
        <div className="p-5 rounded-2xl bg-brand-navy border border-brand-green/30 shadow-card-dark space-y-3 flex flex-col justify-between">
          <div className="space-y-2">
            <div className="w-10 h-10 rounded-xl bg-brand-black border border-brand-green/20 flex items-center justify-center text-brand-green">
              <PoundSterling className="w-5 h-5" />
            </div>
            <h3 className="text-sm font-bold text-brand-white">Revenue & Meeting Targets</h3>
            <p className="text-xs text-brand-gray">
              Company Target: <strong className="text-brand-green font-mono">{formatGbp(quotas.companyTargetGbp)}</strong>. Individual quotas for {salesReps.length} sales reps and {leadGenReps.length} lead gen reps.
            </p>
          </div>

          <div className="pt-2 border-t border-brand-midnight flex items-center justify-between">
            <span className="text-[11px] font-mono text-brand-gray">
              Month {quotas.month} / {quotas.year}
            </span>
            <button
              onClick={onOpenTargetManager}
              className="text-xs font-semibold text-brand-green hover:underline"
            >
              Manage Quotas
            </button>
          </div>
        </div>

        {/* Card 3: Data Backup */}
        <div className="p-5 rounded-2xl bg-brand-navy border border-brand-midnight shadow-card-dark space-y-3 flex flex-col justify-between">
          <div className="space-y-2">
            <div className="w-10 h-10 rounded-xl bg-brand-black border border-brand-orange/20 flex items-center justify-center text-brand-orange">
              <Database className="w-5 h-5" />
            </div>
            <h3 className="text-sm font-bold text-brand-white">Backup & Data Management</h3>
            <p className="text-xs text-brand-gray">
              Export full JSON backups, restore historical data, or reset to default mock records.
            </p>
          </div>

          <div className="pt-2 border-t border-brand-midnight flex items-center justify-between">
            <span className="text-[11px] font-mono text-brand-gray">JSON / CSV</span>
            <button
              onClick={onOpenDataManagement}
              className="text-xs font-semibold text-brand-cyan hover:underline"
            >
              Manage Backups
            </button>
          </div>
        </div>
      </div>

      {/* Team & User Accounts Management Roster */}
      <div className="p-6 rounded-2xl bg-brand-navy border border-brand-midnight shadow-card-dark space-y-5">
        <div className="flex items-center justify-between pb-3 border-b border-brand-midnight">
          <div className="flex items-center gap-2">
            <Users className="w-5 h-5 text-brand-cyan" />
            <h3 className="text-base font-bold text-brand-white">
              Team Roster & Portal Credentials ({teamMembers.length} Members)
            </h3>
          </div>
          <button
            onClick={handleOpenAddMember}
            className="flex items-center gap-1 text-xs font-semibold text-brand-cyan hover:underline"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Add Member / Admin</span>
          </button>
        </div>

        {/* ADMINS SECTION */}
        {adminReps.length > 0 && (
          <div className="space-y-3 p-4 rounded-xl bg-brand-black/40 border border-brand-orange/30">
            <div className="flex items-center justify-between text-xs font-mono uppercase text-brand-orange font-bold pb-1 border-b border-white/5">
              <span className="flex items-center gap-1.5">
                <ShieldCheck className="w-4 h-4" />
                <span>Portal Owners & Administrators ({adminReps.length})</span>
              </span>
              <span>Access Level: Full Admin</span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {adminReps.map((admin) => {
                const userObj = users.find((u) => u.fullName === admin.name || u.id === admin.id);

                return (
                  <div
                    key={admin.id}
                    className="p-3 rounded-xl bg-brand-black border border-brand-orange/40 flex items-center justify-between hover:border-brand-orange transition-colors group"
                  >
                    <div className="flex items-center gap-2.5">
                      <div
                        className="w-7 h-7 rounded-full flex items-center justify-center font-bold text-xs text-brand-black shadow-sm"
                        style={{ backgroundColor: admin.avatarColor || '#00C2FF' }}
                      >
                        {admin.name.charAt(0)}
                      </div>
                      <div>
                        <div className="font-bold text-xs text-brand-white flex items-center gap-1.5">
                          <span>{admin.name}</span>
                          <span className="text-[9px] px-1.5 py-0.5 rounded bg-brand-orange/20 text-brand-orange border border-brand-orange/40 font-mono font-bold">
                            Owner / Admin
                          </span>
                        </div>
                        <div className="text-[10px] text-brand-gray font-mono">
                          Username: <strong className="text-brand-white">{userObj?.username || admin.name.toLowerCase()}</strong>
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-1 opacity-80 group-hover:opacity-100">
                      <button
                        onClick={() => handleOpenEditMember(admin)}
                        className="p-1.5 rounded-lg text-brand-gray hover:text-brand-cyan hover:bg-brand-midnight transition-colors"
                        title="Edit Admin & Password"
                      >
                        <Edit2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Sales Team */}
          <div className="space-y-3">
            <div className="flex items-center justify-between text-xs font-mono uppercase text-brand-green font-bold pb-1 border-b border-white/5">
              <span>Sales Team ({salesReps.length} Reps)</span>
              <span>Quota (£ GBP)</span>
            </div>
            <div className="space-y-2">
              {salesReps.map((rep, idx) => {
                const targetObj = quotas.salesTargets.find((t) => t.memberName === rep.name);
                const targetGbp = targetObj ? targetObj.targetGbp : 5000;
                const userObj = users.find((u) => u.fullName === rep.name || u.id === rep.id);

                return (
                  <div
                    key={rep.id}
                    className="p-3 rounded-xl bg-brand-black border border-brand-midnight flex items-center justify-between hover:border-brand-green/40 transition-colors group"
                  >
                    <div className="flex items-center gap-2.5">
                      <div
                        className="w-7 h-7 rounded-full flex items-center justify-center font-bold text-xs text-brand-black shadow-sm"
                        style={{ backgroundColor: rep.avatarColor || '#00C2FF' }}
                      >
                        {rep.name.charAt(0)}
                      </div>
                      <div>
                        <div className="font-bold text-xs text-brand-white flex items-center gap-1.5">
                          <span>{idx + 1}. {rep.name}</span>
                        </div>
                        <div className="text-[10px] text-brand-gray font-mono">
                          User: <span className="text-brand-white">{userObj?.username || rep.name.toLowerCase()}</span>
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-3">
                      <div className="text-right">
                        <div className="text-xs font-bold font-mono text-brand-green">
                          {formatGbp(targetGbp)}
                        </div>
                        <div className="text-[10px] text-brand-gray font-mono">Revenue Goal</div>
                      </div>

                      {/* Edit / Delete */}
                      <div className="flex items-center gap-1 opacity-80 group-hover:opacity-100">
                        <button
                          onClick={() => handleOpenEditMember(rep)}
                          className="p-1.5 rounded-lg text-brand-gray hover:text-brand-cyan hover:bg-brand-midnight transition-colors"
                          title="Edit Credentials & Target"
                        >
                          <Edit2 className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => handleDelete(rep.id, rep.name)}
                          className="p-1.5 rounded-lg text-brand-gray hover:text-red-400 hover:bg-red-950/30 transition-colors"
                          title="Remove Member"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Lead Gen Team */}
          <div className="space-y-3">
            <div className="flex items-center justify-between text-xs font-mono uppercase text-brand-cyan font-bold pb-1 border-b border-white/5">
              <span>Lead Generation Team ({leadGenReps.length} Reps)</span>
              <span>Quota (Meetings)</span>
            </div>
            <div className="space-y-2 max-h-96 overflow-y-auto pr-1">
              {leadGenReps.map((rep, idx) => {
                const targetObj = quotas.leadGenTargets.find((t) => t.memberName === rep.name);
                const targetMeetings = targetObj ? targetObj.targetMeetings : 12;
                const userObj = users.find((u) => u.fullName === rep.name || u.id === rep.id);

                return (
                  <div
                    key={rep.id}
                    className="p-2.5 rounded-xl bg-brand-black border border-brand-midnight flex items-center justify-between hover:border-brand-cyan/40 transition-colors group"
                  >
                    <div className="flex items-center gap-2.5">
                      <div
                        className="w-6 h-6 rounded-full flex items-center justify-center font-bold text-xs text-brand-black shadow-sm"
                        style={{ backgroundColor: rep.avatarColor || '#3B82F6' }}
                      >
                        {rep.name.charAt(0)}
                      </div>
                      <div>
                        <div className="font-bold text-xs text-brand-white">
                          {idx + 1}. {rep.name}
                        </div>
                        <div className="text-[10px] text-brand-gray font-mono">
                          User: <span className="text-brand-white">{userObj?.username || rep.name.toLowerCase()}</span>
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-3">
                      <div className="text-right">
                        <div className="text-xs font-bold font-mono text-brand-cyan">
                          {targetMeetings} Meetings
                        </div>
                        <div className="text-[10px] text-brand-gray font-mono">Monthly Target</div>
                      </div>

                      {/* Edit / Delete */}
                      <div className="flex items-center gap-1 opacity-80 group-hover:opacity-100">
                        <button
                          onClick={() => handleOpenEditMember(rep)}
                          className="p-1.5 rounded-lg text-brand-gray hover:text-brand-cyan hover:bg-brand-midnight transition-colors"
                          title="Edit Credentials & Target"
                        >
                          <Edit2 className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => handleDelete(rep.id, rep.name)}
                          className="p-1.5 rounded-lg text-brand-gray hover:text-red-400 hover:bg-red-950/30 transition-colors"
                          title="Remove Member"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>

      {/* Member Edit / Add Modal */}
      <TeamMemberModal
        isOpen={isMemberModalOpen}
        onClose={() => setIsMemberModalOpen(false)}
        memberToEdit={memberToEdit}
        onSaveMember={onSaveMember}
        existingUsers={users}
      />
    </div>
  );
};
