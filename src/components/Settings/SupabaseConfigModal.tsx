import React, { useState, useEffect } from 'react';
import {
  X,
  Cloud,
  CheckCircle2,
  AlertCircle,
  Database,
  Copy,
  Check,
  ExternalLink,
  ShieldCheck,
} from 'lucide-react';
import {
  getStoredSupabaseConfig,
  saveSupabaseConfig,
  testSupabaseConnection,
} from '../../lib/supabase';

interface SupabaseConfigModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConnectionSuccess: () => void;
}

export const SupabaseConfigModal: React.FC<SupabaseConfigModalProps> = ({
  isOpen,
  onClose,
  onConnectionSuccess,
}) => {
  if (!isOpen) return null;

  const [url, setUrl] = useState('');
  const [anonKey, setAnonKey] = useState('');
  const [isTesting, setIsTesting] = useState(false);
  const [testResult, setTestResult] = useState<{ success: boolean; message: string } | null>(null);
  const [copiedSchema, setCopiedSchema] = useState(false);

  useEffect(() => {
    const stored = getStoredSupabaseConfig();
    setUrl(stored.url);
    setAnonKey(stored.anonKey);
  }, []);

  const handleTestAndSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!url.trim() || !anonKey.trim()) return;

    setIsTesting(true);
    setTestResult(null);

    const res = await testSupabaseConnection(url, anonKey);
    setIsTesting(false);
    setTestResult(res);

    if (res.success) {
      saveSupabaseConfig(url, anonKey);
      onConnectionSuccess();
    }
  };

  const handleCopySqlSchema = () => {
    const sql = `-- ROSxSA Schema Migration for Supabase Free Tier
CREATE TABLE IF NOT EXISTS team_members (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  role TEXT NOT NULL CHECK (role IN ('sales', 'lead_gen', 'manager')),
  email TEXT,
  avatar_color TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE IF NOT EXISTS master_records (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email TEXT NOT NULL UNIQUE,
  domain TEXT NOT NULL,
  company_name TEXT,
  contact_name TEXT,
  website TEXT,
  country TEXT,
  job_title TEXT,
  phone TEXT,
  linkedin_url TEXT,
  status TEXT NOT NULL,
  dnc_reason TEXT,
  notes TEXT,
  lead_gen_rep TEXT,
  sales_rep TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE IF NOT EXISTS deals (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  company_name TEXT NOT NULL,
  contact_name TEXT,
  email TEXT NOT NULL,
  domain TEXT NOT NULL,
  value_gbp NUMERIC(12, 2) NOT NULL DEFAULT 0.00,
  stage TEXT NOT NULL,
  invoice_number TEXT,
  invoice_date DATE,
  follow_up_days INT DEFAULT 7,
  due_alert_date DATE,
  paid_date DATE,
  sales_rep TEXT NOT NULL,
  lead_gen_rep TEXT,
  notes TEXT,
  meeting_completed BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE IF NOT EXISTS monthly_quotas (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  month INT NOT NULL,
  year INT NOT NULL,
  company_target_gbp NUMERIC(12, 2) NOT NULL DEFAULT 25000.00,
  sales_targets JSONB NOT NULL DEFAULT '[]'::jsonb,
  lead_gen_targets JSONB NOT NULL DEFAULT '[]'::jsonb,
  created_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(month, year)
);

ALTER TABLE team_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE master_records ENABLE ROW LEVEL SECURITY;
ALTER TABLE deals ENABLE ROW LEVEL SECURITY;
ALTER TABLE monthly_quotas ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow anon access" ON team_members FOR ALL USING (true);
CREATE POLICY "Allow anon access" ON master_records FOR ALL USING (true);
CREATE POLICY "Allow anon access" ON deals FOR ALL USING (true);
CREATE POLICY "Allow anon access" ON monthly_quotas FOR ALL USING (true);
`;
    navigator.clipboard.writeText(sql).then(() => {
      setCopiedSchema(true);
      setTimeout(() => setCopiedSchema(false), 2000);
    });
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-black/75 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-brand-navy border border-brand-midnight rounded-2xl w-full max-w-xl overflow-hidden shadow-2xl animate-scale-up">
        {/* Header */}
        <div className="px-6 py-4 bg-brand-black border-b border-brand-midnight flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-brand-cyan/10 border border-brand-cyan/30 flex items-center justify-center text-brand-cyan">
              <Cloud className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-base font-bold text-brand-white">Supabase Cloud Database Sync</h3>
              <p className="text-xs text-brand-gray">Connect your free Supabase project for real-time cloud data</p>
            </div>
          </div>
          <button onClick={onClose} className="text-brand-gray hover:text-white p-1">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body */}
        <form onSubmit={handleTestAndSave} className="p-6 space-y-4">
          <div className="p-3.5 rounded-xl bg-brand-black border border-brand-cyan/20 flex items-start gap-2.5 text-xs text-gray-300">
            <Database className="w-4 h-4 text-brand-cyan shrink-0 mt-0.5" />
            <div>
              <span>You can use the </span>
              <strong className="text-brand-white">Supabase Free Plan (100% Free)</strong>.
              <span> Create a free project at </span>
              <a
                href="https://supabase.com"
                target="_blank"
                rel="noreferrer"
                className="text-brand-cyan underline inline-flex items-center gap-0.5"
              >
                supabase.com <ExternalLink className="w-3 h-3" />
              </a>
              <span> and paste your Project URL & Anon Key below.</span>
            </div>
          </div>

          <div>
            <label className="block text-xs font-mono uppercase text-brand-gray mb-1">
              Project URL <span className="text-brand-cyan">*</span>
            </label>
            <input
              type="url"
              required
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              placeholder="https://xyzcompany.supabase.co"
              className="w-full px-3 py-2 rounded-xl bg-brand-black border border-brand-midnight text-xs text-brand-white placeholder-brand-gray focus:outline-none focus:border-brand-cyan"
            />
          </div>

          <div>
            <label className="block text-xs font-mono uppercase text-brand-gray mb-1">
              Anon Public API Key <span className="text-brand-cyan">*</span>
            </label>
            <input
              type="password"
              required
              value={anonKey}
              onChange={(e) => setAnonKey(e.target.value)}
              placeholder="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
              className="w-full px-3 py-2 rounded-xl bg-brand-black border border-brand-midnight text-xs text-brand-white placeholder-brand-gray focus:outline-none focus:border-brand-cyan font-mono"
            />
          </div>

          {/* Test Feedback */}
          {testResult && (
            <div
              className={`p-3 rounded-xl border text-xs flex items-center gap-2 ${
                testResult.success
                  ? 'bg-brand-green/10 text-brand-green border-brand-green/30'
                  : 'bg-red-500/10 text-red-400 border-red-500/30'
              }`}
            >
              {testResult.success ? (
                <CheckCircle2 className="w-4 h-4 shrink-0" />
              ) : (
                <AlertCircle className="w-4 h-4 shrink-0" />
              )}
              <span>{testResult.message}</span>
            </div>
          )}

          {/* SQL Migration Copy Button */}
          <div className="pt-2 border-t border-brand-midnight flex items-center justify-between">
            <div className="text-[11px] text-brand-gray">
              Need to create the PostgreSQL tables in Supabase?
            </div>
            <button
              type="button"
              onClick={handleCopySqlSchema}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-brand-black border border-white/10 hover:border-brand-cyan/40 text-brand-cyan text-xs font-semibold transition-colors"
            >
              {copiedSchema ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
              <span>{copiedSchema ? 'SQL Copied!' : 'Copy SQL Schema'}</span>
            </button>
          </div>

          {/* Actions */}
          <div className="pt-2 flex items-center justify-end gap-3">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl text-xs font-semibold text-brand-gray hover:text-brand-white hover:bg-brand-midnight transition-colors"
            >
              Close
            </button>
            <button
              type="submit"
              disabled={isTesting}
              className="px-5 py-2.5 rounded-xl bg-brand-cyan text-brand-black font-bold text-xs hover:brightness-110 active:scale-95 transition-all shadow-cyan-glow disabled:opacity-50"
            >
              {isTesting ? 'Connecting...' : 'Test & Connect Supabase'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
