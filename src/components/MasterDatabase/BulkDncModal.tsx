import React, { useState, useRef } from 'react';
import {
  X,
  ShieldBan,
  Upload,
  FileText,
  Sparkles,
  CheckCircle2,
  AlertCircle,
  Loader2,
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
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [rawText, setRawText] = useState('');
  const [targetStatus, setTargetStatus] = useState<LeadStatus>('dnc');
  const [dncReason, setDncReason] = useState<DncReason>('unsubscribed');
  const [selectedRep, setSelectedRep] = useState('None');
  const [notes, setNotes] = useState('Bulk imported list');

  const [isProcessing, setIsProcessing] = useState(false);
  const [progress, setProgress] = useState({ current: 0, total: 0, percent: 0 });
  const [fileName, setFileName] = useState<string | null>(null);

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setFileName(file.name);
    const reader = new FileReader();
    reader.onload = (event) => {
      const content = event.target?.result as string;
      if (content) {
        setRawText(content);
      }
    };
    reader.readAsText(file);
  };

  const handleProcess = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!rawText.trim() || isProcessing) return;

    setIsProcessing(true);
    setProgress({ current: 0, total: 0, percent: 0 });

    // Yield to allow UI to render the loading state
    await new Promise((r) => setTimeout(r, 20));

    const lines = rawText
      .split(/\r?\n/)
      .map((l) => l.trim())
      .filter((l) => l.length > 0);

    const totalLines = lines.length;
    const newRecords: MasterRecord[] = [];
    const seen = new Set<string>();
    const CHUNK_SIZE = 3000;
    const nowIso = new Date().toISOString();

    for (let i = 0; i < totalLines; i += CHUNK_SIZE) {
      const chunkEnd = Math.min(i + CHUNK_SIZE, totalLines);

      for (let j = i; j < chunkEnd; j++) {
        const line = lines[j];
        let email = line;
        let company = '';

        if (line.includes(',')) {
          const parts = line.split(',').map((p) => p.trim());
          email = parts[0];
          if (parts.length > 1) company = parts[1];
        } else if (line.includes('\t')) {
          const parts = line.split('\t').map((p) => p.trim());
          email = parts[0];
          if (parts.length > 1) company = parts[1];
        }

        if (email.includes('@')) {
          const norm = email.toLowerCase().trim();
          if (!seen.has(norm)) {
            seen.add(norm);
            const domain = extractNormalizedDomain(norm);
            newRecords.push({
              id: `bulk-${Date.now()}-${Math.random().toString(36).substr(2, 6)}`,
              email: norm,
              domain: domain || 'unknown',
              companyName: company || undefined,
              status: targetStatus,
              dncReason: targetStatus === 'dnc' ? dncReason : undefined,
              leadGenRep: selectedRep,
              notes: notes.trim() || undefined,
              createdAt: nowIso,
              updatedAt: nowIso,
            });
          }
        }
      }

      setProgress({
        current: chunkEnd,
        total: totalLines,
        percent: Math.round((chunkEnd / totalLines) * 100),
      });

      // Yield event loop so browser stays 100% responsive and renders progress bar
      await new Promise((r) => setTimeout(r, 0));
    }

    if (newRecords.length > 0) {
      onBulkAdd(newRecords);
    }

    setIsProcessing(false);
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
              <p className="text-xs text-brand-gray">Import 10k–100k opt-outs or replies in bulk</p>
            </div>
          </div>
          {!isProcessing && (
            <button onClick={onClose} className="text-brand-gray hover:text-white p-1">
              <X className="w-5 h-5" />
            </button>
          )}
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
                disabled={isProcessing}
                className="w-full px-3 py-2 rounded-xl bg-brand-black border border-brand-midnight text-xs text-brand-white focus:outline-none focus:border-brand-cyan disabled:opacity-50"
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
                disabled={isProcessing}
                className="w-full px-3 py-2 rounded-xl bg-brand-black border border-brand-midnight text-xs text-brand-white focus:outline-none focus:border-brand-cyan disabled:opacity-50"
              >
                <option value="None">None (Unassigned / General)</option>
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
                disabled={isProcessing}
                className="w-full px-3 py-2 rounded-xl bg-brand-black border border-brand-midnight text-xs text-brand-white focus:outline-none focus:border-brand-cyan disabled:opacity-50"
              >
                <option value="unsubscribed">Unsubscribed</option>
                <option value="hostile">Hostile / Strict Domain Blacklist</option>
                <option value="bounced">Bounced / Bad Mailbox</option>
                <option value="wrong_person">Wrong Person</option>
                <option value="other">Other</option>
              </select>
            </div>
          )}

          {/* Upload or Paste Choice */}
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="text-xs font-mono uppercase text-brand-gray">
                Paste Emails or Upload CSV/TXT
              </label>
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                disabled={isProcessing}
                className="text-[11px] text-brand-cyan hover:underline flex items-center gap-1 font-semibold"
              >
                <Upload className="w-3 h-3" />
                <span>{fileName ? `File: ${fileName}` : 'Choose CSV / TXT File'}</span>
              </button>
              <input
                ref={fileInputRef}
                type="file"
                accept=".csv,.txt"
                onChange={handleFileUpload}
                className="hidden"
              />
            </div>

            <textarea
              rows={5}
              value={rawText}
              onChange={(e) => setRawText(e.target.value)}
              disabled={isProcessing}
              placeholder="unsub1@company.com
unsub2@example.co.uk
hostile@domain.com, Domain Corp"
              className="w-full p-3 rounded-xl bg-brand-black border border-brand-midnight text-xs font-mono text-brand-white placeholder-brand-gray focus:outline-none focus:border-brand-cyan disabled:opacity-50"
            />
            {rawText && (
              <div className="mt-1 text-[11px] text-brand-gray font-mono">
                Detected: ~{rawText.split('\n').filter((l) => l.trim().length > 0).length.toLocaleString()} rows
              </div>
            )}
          </div>

          {/* Progress Indicator when Processing */}
          {isProcessing && (
            <div className="p-3.5 rounded-xl bg-brand-black border border-brand-cyan/30 space-y-2">
              <div className="flex items-center justify-between text-xs font-mono">
                <span className="text-brand-cyan flex items-center gap-1.5 font-bold">
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  Processing Leads Safely...
                </span>
                <span className="text-brand-white font-bold">
                  {progress.current.toLocaleString()} / {progress.total.toLocaleString()} ({progress.percent}%)
                </span>
              </div>
              <div className="w-full h-2 rounded-full bg-brand-midnight overflow-hidden">
                <div
                  className="h-full bg-gradient-to-r from-brand-cyan to-brand-green transition-all duration-100"
                  style={{ width: `${progress.percent}%` }}
                />
              </div>
            </div>
          )}

          {/* Actions */}
          <div className="pt-2 flex items-center justify-end gap-3">
            <button
              type="button"
              onClick={onClose}
              disabled={isProcessing}
              className="px-4 py-2 rounded-xl text-xs font-semibold text-brand-gray hover:text-brand-white hover:bg-brand-midnight transition-colors disabled:opacity-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={!rawText.trim() || isProcessing}
              className="px-5 py-2.5 rounded-xl bg-brand-cyan text-brand-black font-bold text-xs hover:brightness-110 active:scale-95 transition-all shadow-cyan-glow disabled:opacity-50 flex items-center gap-1.5"
            >
              {isProcessing ? (
                <>
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  <span>Importing...</span>
                </>
              ) : (
                <span>Import Leads into Database</span>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
