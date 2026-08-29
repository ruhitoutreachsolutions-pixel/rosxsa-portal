import React, { useState } from 'react';
import {
  X,
  ShieldBan,
  Upload,
  Sparkles,
  CheckCircle2,
  AlertCircle,
} from 'lucide-react';
import { MasterRecord, DncReason, LeadStatus, TeamMember } from '../../types';
import { extractNormalizedDomain } from '../../lib/collisionEngine';

interface BulkDncModalProps {
  isOpen: boolean;
  onClose: () => void;
  teamMembers: TeamMember[];
  onBulkAdd: (records: MasterRecord[]) => void;
}

export const BulkDncModal: React.FC<BulkDncModalProps> = ({
  isOpen,
  onClose,
  teamMembers,
  onBulkAdd,
}) => {
  if (!isOpen) return null;

  const leadGenReps = teamMembers.filter((m) => m.role === 'lead_gen');

  const [rawText, setRawText] = useState('');
  const [targetStatus, setTargetStatus] = useState<LeadStatus>('dnc');
  const [dncReason, setDncReason] = useState<DncReason>('unsubscribed');
  const [selectedRep, setSelectedRep] = useState(leadGenReps[0]?.name || 'Ruhit');
  const [notes, setNotes] = useState('Bulk imported list');

  const handleProcess = (e: React.FormEvent) => {
    e.preventDefault();
    if (!rawText.trim()) return;

    const lines = rawText
      .split(/\r?\n/)
      .map((l) => l.trim())
      .filter((l) => l.length > 0);

    const newRecords: MasterRecord[] = [];
    const seen = new Set<string>();

    lines.forEach((line) => {
      let email = line;
      let company = '';
      if (line.includes(',')) {
        const parts = line.split(',').map((p) => p.trim());
        email = parts[0];
        if (parts.length > 1) company = parts[1];
      }

      if (email.includes('@')) {
        const norm = email.toLowerCase().trim();
        if (!seen.has(norm)) {
          seen.add(norm);
          const domain = extractNormalizedDomain(norm);
          newRecords.push({
            id: `bulk-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`,
            email: norm,
            domain: domain || 'unknown',
            companyName: company || undefined,
            status: targetStatus,
            dncReason: targetStatus === 'dnc' ? dncReason : undefined,
            leadGenRep: selectedRep,
            notes: notes.trim() || undefined,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
          });
        }
      }
    });

    if (newRecords.length > 0) {
      onBulkAdd(newRecords);
    }
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-black/75 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-brand-navy border border-brand-midnight rounded-2xl w-full max-w-lg overflow-hidden shadow-2xl animate-scale-up">
        {/* Header */}
        <div className="px-6 py-4 bg-brand-black border-b border-brand-midnight flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-red-500/20 border border-red-500/40 flex items-center justify-center text-red-400">
              <ShieldBan className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-base font-bold text-brand-white">Bulk DNC & Reply Importer</h3>
              <p className="text-xs text-brand-gray">Import hundreds of opt-outs or replies in bulk</p>
            </div>
          </div>
          <button onClick={onClose} className="text-brand-gray hover:text-white p-1">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleProcess} className="p-6 space-y-4">
          {/* Target Status */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-mono uppercase text-brand-gray mb-1">
                Assign Status
              </label>
              <select
                value={targetStatus}
                onChange={(e) => setTargetStatus(e.target.value as LeadStatus)}
                className="w-full px-3 py-2 rounded-xl bg-brand-black border border-brand-midnight text-xs text-brand-white focus:outline-none focus:border-brand-cyan"
              >
                <option value="dnc">Do Not Contact (DNC)</option>
                <option value="interested">Interested Leads</option>
                <option value="in_conversation">In-Conversation</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-mono uppercase text-brand-gray mb-1">
                Imported By
              </label>
              <select
                value={selectedRep}
                onChange={(e) => setSelectedRep(e.target.value)}
                className="w-full px-3 py-2 rounded-xl bg-brand-black border border-brand-midnight text-xs text-brand-white focus:outline-none focus:border-brand-cyan"
              >
                {leadGenReps.map((rep) => (
                  <option key={rep.id} value={rep.name}>
                    {rep.name}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {targetStatus === 'dnc' && (
            <div>
              <label className="block text-xs font-mono uppercase text-brand-gray mb-1">
                DNC Classification
              </label>
              <select
                value={dncReason}
                onChange={(e) => setDncReason(e.target.value as DncReason)}
                className="w-full px-3 py-2 rounded-xl bg-brand-black border border-brand-midnight text-xs text-brand-white focus:outline-none focus:border-brand-cyan"
              >
                <option value="unsubscribed">Unsubscribed</option>
                <option value="hostile">Hostile / Strict Domain Blacklist</option>
                <option value="bounced">Bounced / Bad Mailbox</option>
                <option value="wrong_person">Wrong Person</option>
                <option value="other">Other</option>
              </select>
            </div>
          )}

          {/* Paste Area */}
          <div>
            <label className="block text-xs font-mono uppercase text-brand-gray mb-1">
              Paste Emails (one per line, or Email, Company)
            </label>
            <textarea
              rows={6}
              value={rawText}
              onChange={(e) => setRawText(e.target.value)}
              placeholder="unsub1@company.com
unsub2@example.co.uk
hostile@domain.com, Domain Corp"
              className="w-full p-3 rounded-xl bg-brand-black border border-brand-midnight text-xs font-mono text-brand-white placeholder-brand-gray focus:outline-none focus:border-brand-cyan"
            />
          </div>

          {/* Actions */}
          <div className="pt-2 flex items-center justify-end gap-3">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl text-xs font-semibold text-brand-gray hover:text-brand-white hover:bg-brand-midnight transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={!rawText.trim()}
              className="px-5 py-2.5 rounded-xl bg-brand-cyan text-brand-black font-bold text-xs hover:brightness-110 active:scale-95 transition-all shadow-cyan-glow disabled:opacity-50"
            >
              Import Leads into Database
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
