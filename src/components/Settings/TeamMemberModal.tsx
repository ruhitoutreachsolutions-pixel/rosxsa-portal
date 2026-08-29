import React, { useState, useEffect } from 'react';
import {
  X,
  User,
  Mail,
  Shield,
  Palette,
  Check,
  KeyRound,
  ShieldCheck,
} from 'lucide-react';
import { TeamMember, TeamRole, UserAccount } from '../../types';

interface TeamMemberModalProps {
  isOpen: boolean;
  onClose: () => void;
  memberToEdit?: TeamMember | null;
  onSaveMember: (member: TeamMember, credentials?: { username: string; password?: string }) => void;
  existingUsers?: UserAccount[];
}

const AVATAR_COLORS = [
  '#00C2FF',
  '#00E5A0',
  '#F97316',
  '#8B5CF6',
  '#EC4899',
  '#3B82F6',
  '#10B981',
  '#F59E0B',
  '#6366F1',
  '#14B8A6',
  '#E11D48',
  '#84CC16',
];

export const TeamMemberModal: React.FC<TeamMemberModalProps> = ({
  isOpen,
  onClose,
  memberToEdit,
  onSaveMember,
  existingUsers = [],
}) => {
  if (!isOpen) return null;

  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [role, setRole] = useState<TeamRole>('sales');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [avatarColor, setAvatarColor] = useState(AVATAR_COLORS[0]);

  useEffect(() => {
    if (memberToEdit) {
      setName(memberToEdit.name);
      setEmail(memberToEdit.email || '');
      setRole(memberToEdit.role);
      setAvatarColor(memberToEdit.avatarColor || AVATAR_COLORS[0]);

      // Look up existing user
      const u = existingUsers.find(
        (x) => x.fullName.toLowerCase() === memberToEdit.name.toLowerCase() || x.id === memberToEdit.id
      );
      if (u) {
        setUsername(u.username);
        setPassword(u.password || '');
      } else {
        setUsername(memberToEdit.name.toLowerCase().replace(/\s+/g, ''));
        setPassword('');
      }
    } else {
      setName('');
      setEmail('');
      setRole('sales');
      setUsername('');
      setPassword('');
      setAvatarColor(AVATAR_COLORS[Math.floor(Math.random() * AVATAR_COLORS.length)]);
    }
  }, [memberToEdit, existingUsers]);

  const handleNameChange = (val: string) => {
    setName(val);
    if (!memberToEdit && !username) {
      setUsername(val.toLowerCase().replace(/\s+/g, ''));
    }
    if (!memberToEdit && !email) {
      setEmail(`${val.toLowerCase().replace(/\s+/g, '')}@staffasia.org`);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    const member: TeamMember = {
      id: memberToEdit ? memberToEdit.id : `member-${Date.now()}`,
      name: name.trim(),
      email: email.trim() || `${name.toLowerCase().replace(/\s+/g, '')}@staffasia.org`,
      role,
      avatarColor,
    };

    onSaveMember(member, {
      username: username.trim() || name.toLowerCase().replace(/\s+/g, ''),
      password: password.trim() || undefined,
    });
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-black/75 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-brand-navy border border-brand-midnight rounded-2xl w-full max-w-md overflow-hidden shadow-2xl animate-scale-up">
        {/* Header */}
        <div className="px-6 py-4 bg-brand-black border-b border-brand-midnight flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-brand-cyan/10 border border-brand-cyan/30 flex items-center justify-center text-brand-cyan">
              <User className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-base font-bold text-brand-white">
                {memberToEdit ? 'Edit Team Member & Credentials' : 'Add New Member / Admin'}
              </h3>
              <p className="text-xs text-brand-gray">Set portal access, roles, and login credentials</p>
            </div>
          </div>
          <button onClick={onClose} className="text-brand-gray hover:text-white p-1">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {/* Member Name */}
          <div>
            <label className="block text-xs font-mono uppercase text-brand-gray mb-1">
              Full Name <span className="text-brand-cyan">*</span>
            </label>
            <input
              type="text"
              required
              value={name}
              onChange={(e) => handleNameChange(e.target.value)}
              placeholder="e.g. Farzan Ahmed"
              className="w-full px-3.5 py-2 rounded-xl bg-brand-black border border-brand-midnight text-xs text-brand-white placeholder-brand-gray focus:outline-none focus:border-brand-cyan font-semibold"
            />
          </div>

          {/* Role (Admin / Sales / Lead Gen) - Only Admin can assign Admin role! */}
          <div>
            <label className="block text-xs font-mono uppercase text-brand-gray mb-1">
              Assigned Role <span className="text-brand-cyan">*</span>
            </label>
            <div className="grid grid-cols-3 gap-2">
              <button
                type="button"
                onClick={() => setRole('sales')}
                className={`py-2 rounded-xl border text-xs font-bold transition-all ${
                  role === 'sales'
                    ? 'bg-brand-green/20 text-brand-green border-brand-green shadow-green-glow'
                    : 'bg-brand-black text-brand-gray border-white/10'
                }`}
              >
                Sales (£)
              </button>

              <button
                type="button"
                onClick={() => setRole('lead_gen')}
                className={`py-2 rounded-xl border text-xs font-bold transition-all ${
                  role === 'lead_gen'
                    ? 'bg-brand-cyan/20 text-brand-cyan border-brand-cyan shadow-cyan-glow'
                    : 'bg-brand-black text-brand-gray border-white/10'
                }`}
              >
                Lead Gen
              </button>

              <button
                type="button"
                onClick={() => setRole('admin')}
                className={`py-2 rounded-xl border text-xs font-bold transition-all flex items-center justify-center gap-1 ${
                  role === 'admin'
                    ? 'bg-brand-orange/20 text-brand-orange border-brand-orange shadow-orange-glow'
                    : 'bg-brand-black text-brand-gray border-white/10'
                }`}
              >
                <ShieldCheck className="w-3.5 h-3.5" />
                <span>Admin</span>
              </button>
            </div>
          </div>

          {/* Login Credentials Section */}
          <div className="p-3 rounded-xl bg-brand-black border border-white/10 space-y-2.5">
            <div className="text-[11px] font-bold text-brand-cyan uppercase tracking-wider flex items-center gap-1.5">
              <KeyRound className="w-3.5 h-3.5" />
              <span>Portal Login Credentials</span>
            </div>

            <div>
              <label className="block text-[10px] text-brand-gray uppercase mb-1">
                Login Username
              </label>
              <input
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="e.g. farzan"
                className="w-full px-3 py-1.5 rounded-lg bg-brand-navy border border-brand-midnight text-xs text-brand-white focus:outline-none focus:border-brand-cyan font-mono"
              />
            </div>

            <div>
              <label className="block text-[10px] text-brand-gray uppercase mb-1">
                Password {memberToEdit && '(Leave blank to keep unchanged)'}
              </label>
              <input
                type="text"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder={memberToEdit ? 'Enter new password' : 'e.g. pass123'}
                className="w-full px-3 py-1.5 rounded-lg bg-brand-navy border border-brand-midnight text-xs text-brand-white focus:outline-none focus:border-brand-cyan font-mono"
              />
            </div>
          </div>

          {/* Email */}
          <div>
            <label className="block text-xs font-mono uppercase text-brand-gray mb-1">
              Email Address
            </label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="member@staffasia.org"
              className="w-full px-3.5 py-2 rounded-xl bg-brand-black border border-brand-midnight text-xs text-brand-white placeholder-brand-gray focus:outline-none focus:border-brand-cyan"
            />
          </div>

          {/* Avatar Color Picker */}
          <div>
            <label className="block text-xs font-mono uppercase text-brand-gray mb-1.5 flex items-center gap-1">
              <Palette className="w-3.5 h-3.5 text-brand-cyan" />
              <span>Avatar Theme Color</span>
            </label>
            <div className="flex flex-wrap gap-2">
              {AVATAR_COLORS.map((col) => (
                <button
                  key={col}
                  type="button"
                  onClick={() => setAvatarColor(col)}
                  className={`w-7 h-7 rounded-full transition-transform flex items-center justify-center ${
                    avatarColor === col ? 'scale-110 ring-2 ring-white' : 'hover:scale-105 opacity-70'
                  }`}
                  style={{ backgroundColor: col }}
                >
                  {avatarColor === col && <Check className="w-3.5 h-3.5 text-black stroke-[3]" />}
                </button>
              ))}
            </div>
          </div>

          {/* Actions */}
          <div className="pt-2 flex items-center justify-end gap-3">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl text-xs font-semibold text-brand-gray hover:text-brand-white"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-5 py-2.5 rounded-xl bg-brand-cyan text-brand-black font-bold text-xs hover:brightness-110 active:scale-95 transition-all shadow-cyan-glow"
            >
              {memberToEdit ? 'Save Member & Credentials' : 'Create Member'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
