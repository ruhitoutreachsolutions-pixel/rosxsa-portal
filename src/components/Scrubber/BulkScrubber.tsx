import React, { useState } from 'react';
import {
  ShieldAlert,
  Upload,
  Copy,
  Check,
  Download,
  AlertTriangle,
  CheckCircle2,
  ShieldBan,
  Users,
  FileSpreadsheet,
  Trash2,
  Sparkles,
  Search,
  Filter,
} from 'lucide-react';
import Papa from 'papaparse';
import {
  MasterRecord,
  Deal,
  TeamMember,
  ScrubResultItem,
  ScrubBatchSummary,
} from '../../types';
import { scanCampaignList, CollisionScanResult } from '../../lib/collisionEngine';

interface BulkScrubberProps {
  masterRecords: MasterRecord[];
  deals: Deal[];
  teamMembers: TeamMember[];
  onSaveBatchSummary?: (summary: ScrubBatchSummary) => void;
}

export const BulkScrubber: React.FC<BulkScrubberProps> = ({
  masterRecords,
  deals,
  teamMembers,
  onSaveBatchSummary,
}) => {
  const leadGenReps = teamMembers.filter((m) => m.role === 'lead_gen');

  const [rawInput, setRawInput] = useState('');
  const [selectedRep, setSelectedRep] = useState(leadGenReps[0]?.name || 'Ruhit');
  const [isScanning, setIsScanning] = useState(false);
  const [scanResult, setScanResult] = useState<CollisionScanResult | null>(null);
  const [copied, setCopied] = useState(false);
  const [filterType, setFilterType] = useState<'all' | 'safe' | 'flagged' | 'sales' | 'dnc'>('all');
  const [searchFilter, setSearchFilter] = useState('');

  // Handle File Upload (.csv or .txt)
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const text = event.target?.result as string;
      if (text) {
        setRawInput(text);
      }
    };
    reader.readAsText(file);
  };

  // Run the Scrubber Engine
  const handleRunScrub = () => {
    if (!rawInput.trim()) return;

    setIsScanning(true);

    setTimeout(() => {
      // Split by line
      const lines = rawInput
        .split(/\r?\n/)
        .map((l) => l.trim())
        .filter((l) => l.length > 0);

      const result = scanCampaignList(lines, masterRecords, deals, selectedRep);
      setScanResult(result);
      setIsScanning(false);

      if (onSaveBatchSummary) {
        onSaveBatchSummary({
          batchId: `batch-${Date.now()}`,
          processedAt: new Date().toISOString(),
          repName: selectedRep,
          totalSubmitted: result.stats.total,
          totalSafe: result.stats.safe,
          totalDncBlocked: result.stats.dncBlocked,
          totalSalesConflict: result.stats.salesConflicts,
          totalInterestedConflict: result.stats.interestedConflicts,
          totalDuplicates: result.stats.duplicates,
          results: result.items,
        });
      }
    }, 250);
  };

  // Copy Clean Emails to Clipboard
  const handleCopyToClipboard = () => {
    if (!scanResult) return;
    const safeEmails = scanResult.items
      .filter((item) => item.status === 'safe')
      .map((item) => item.normalizedEmail)
      .join('\n');

    navigator.clipboard.writeText(safeEmails).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    });
  };

  // Download Clean CSV
  const handleDownloadCleanCsv = () => {
    if (!scanResult) return;
    const safeItems = scanResult.items
      .filter((item) => item.status === 'safe')
      .map((item) => ({
        Email: item.normalizedEmail,
        Domain: item.domain,
        Company: item.companyName || '',
        ContactPerson: item.contactName || '',
        Status: 'CLEAN_VERIFIED',
      }));

    const csv = Papa.unparse(safeItems);
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.setAttribute('download', `ROSxSA_Clean_Outreach_${selectedRep}_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Download Full Conflict Audit Report
  const handleDownloadFullAuditCsv = () => {
    if (!scanResult) return;
    const allItems = scanResult.items.map((item) => ({
      RawInput: item.rawEmail,
      NormalizedEmail: item.normalizedEmail,
      Domain: item.domain,
      Company: item.companyName || '',
      Classification: item.status.toUpperCase(),
      Reason: item.reason,
      OwnerRep: item.ownerRep || '',
      IsSafe: item.status === 'safe' ? 'YES' : 'NO',
    }));

    const csv = Papa.unparse(allItems);
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.setAttribute('download', `ROSxSA_Collision_Audit_${selectedRep}_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Filtered Table Items
  const filteredItems = scanResult
    ? scanResult.items.filter((item) => {
        if (filterType === 'safe' && item.status !== 'safe') return false;
        if (filterType === 'flagged' && item.status === 'safe') return false;
        if (filterType === 'sales' && item.status !== 'sales_conflict') return false;
        if (filterType === 'dnc' && item.status !== 'dnc_block') return false;

        if (searchFilter) {
          const s = searchFilter.toLowerCase();
          return (
            item.normalizedEmail.toLowerCase().includes(s) ||
            item.domain.toLowerCase().includes(s) ||
            (item.companyName && item.companyName.toLowerCase().includes(s)) ||
            (item.ownerRep && item.ownerRep.toLowerCase().includes(s))
          );
        }
        return true;
      })
    : [];

  return (
    <div className="space-y-6">
      {/* Title & Introduction */}
      <div className="p-6 rounded-2xl bg-brand-navy border border-brand-midnight shadow-card-dark space-y-4">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-brand-black border border-brand-cyan/30 flex items-center justify-center text-brand-cyan shadow-cyan-glow">
              <ShieldAlert className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-xl font-bold text-brand-white">Campaign List Scrubber & Collision Guard</h2>
                <span className="text-[10px] font-mono uppercase px-2 py-0.5 rounded bg-brand-green/10 text-brand-green border border-brand-green/20">
                  50k+ Capacity
                </span>
              </div>
              <p className="text-xs text-brand-gray">
                Cross-references Master DNC, Active Sales Rep Deals, and Ongoing Leads to prevent outreach collisions.
              </p>
            </div>
          </div>

          {/* Rep Selector */}
          <div className="flex items-center gap-2">
            <label className="text-xs font-mono text-brand-gray whitespace-nowrap">Running as:</label>
            <select
              value={selectedRep}
              onChange={(e) => setSelectedRep(e.target.value)}
              className="px-3 py-2 rounded-xl bg-brand-black border border-brand-midnight text-brand-white text-xs font-medium focus:outline-none focus:border-brand-cyan"
            >
              {leadGenReps.map((rep) => (
                <option key={rep.id} value={rep.name}>
                  {rep.name} (Lead Gen)
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Input Area */}
        <div className="space-y-3 pt-2">
          <div className="flex items-center justify-between text-xs">
            <span className="font-mono text-brand-gray">
              Paste email list (one per line, or CSV formatted with Email, Company, Name):
            </span>
            <label className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-brand-black border border-white/10 hover:border-brand-cyan/40 text-brand-cyan cursor-pointer text-xs font-semibold transition-colors">
              <Upload className="w-3.5 h-3.5" />
              <span>Upload CSV / TXT</span>
              <input
                type="file"
                accept=".csv,.txt"
                onChange={handleFileUpload}
                className="hidden"
              />
            </label>
          </div>

          <div className="relative">
            <textarea
              rows={6}
              value={rawInput}
              onChange={(e) => setRawInput(e.target.value)}
              placeholder="Paste leads here, e.g.:
dennis@savannahtraining.co.ke
j.henderson@vortexlogistics.co.uk
ceo@techfirm.co.uk, TechFirm UK, Michael Scott
sjenkins@apexcloudsystems.io"
              className="w-full p-4 rounded-xl bg-brand-black border border-brand-midnight text-xs font-mono text-brand-white placeholder-brand-gray focus:outline-none focus:border-brand-cyan transition-colors"
            />
            {rawInput && (
              <button
                onClick={() => {
                  setRawInput('');
                  setScanResult(null);
                }}
                className="absolute top-3 right-3 p-1.5 rounded-lg bg-brand-navy/80 text-brand-gray hover:text-red-400 hover:bg-brand-midnight transition-colors"
                title="Clear input"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            )}
          </div>

          {/* Action Row */}
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="text-xs text-brand-gray font-mono">
              {rawInput
                ? `${rawInput.split(/\r?\n/).filter((l) => l.trim().length > 0).length.toLocaleString()} leads detected`
                : 'Ready to scrub'}
            </div>

            <button
              onClick={handleRunScrub}
              disabled={!rawInput.trim() || isScanning}
              className="px-6 py-2.5 rounded-xl bg-brand-cyan text-brand-black font-bold text-xs sm:text-sm hover:brightness-110 active:scale-95 transition-all shadow-cyan-glow disabled:opacity-50 disabled:pointer-events-none flex items-center gap-2"
            >
              <Sparkles className="w-4 h-4 fill-current" />
              <span>{isScanning ? 'Deep Scanning Engine...' : '⚡ Run Deep Scrub & Deduplicate'}</span>
            </button>
          </div>
        </div>
      </div>

      {/* Results View */}
      {scanResult && (
        <div className="space-y-5 animate-fade-in">
          {/* Summary KPI Cards */}
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
            {/* Total */}
            <div className="p-4 rounded-xl bg-brand-navy border border-brand-midnight shadow-card-dark">
              <span className="text-[10px] font-mono uppercase text-brand-gray">Submitted</span>
              <div className="text-2xl font-bold font-mono text-brand-white mt-1">
                {scanResult.stats.total.toLocaleString()}
              </div>
            </div>

            {/* Safe */}
            <div className="p-4 rounded-xl bg-brand-navy border border-brand-green/30 shadow-card-dark">
              <span className="text-[10px] font-mono uppercase text-brand-green font-semibold flex items-center gap-1">
                <CheckCircle2 className="w-3 h-3" />
                Safe to Outreach
              </span>
              <div className="text-2xl font-bold font-mono text-brand-green mt-1">
                {scanResult.stats.safe.toLocaleString()}
              </div>
            </div>

            {/* Sales Conflict */}
            <div className="p-4 rounded-xl bg-brand-navy border border-brand-orange/30 shadow-card-dark">
              <span className="text-[10px] font-mono uppercase text-brand-orange font-semibold flex items-center gap-1">
                <AlertTriangle className="w-3 h-3" />
                Sales Conflict
              </span>
              <div className="text-2xl font-bold font-mono text-brand-orange mt-1">
                {scanResult.stats.salesConflicts.toLocaleString()}
              </div>
            </div>

            {/* DNC Blocked */}
            <div className="p-4 rounded-xl bg-brand-navy border border-red-500/30 shadow-card-dark">
              <span className="text-[10px] font-mono uppercase text-red-400 font-semibold flex items-center gap-1">
                <ShieldBan className="w-3 h-3" />
                DNC Blacklist
              </span>
              <div className="text-2xl font-bold font-mono text-red-400 mt-1">
                {scanResult.stats.dncBlocked.toLocaleString()}
              </div>
            </div>

            {/* Interested Conflicts */}
            <div className="p-4 rounded-xl bg-brand-navy border border-yellow-500/30 shadow-card-dark">
              <span className="text-[10px] font-mono uppercase text-yellow-400 font-semibold flex items-center gap-1">
                <Users className="w-3 h-3" />
                Lead Rep Active
              </span>
              <div className="text-2xl font-bold font-mono text-yellow-400 mt-1">
                {scanResult.stats.interestedConflicts.toLocaleString()}
              </div>
            </div>

            {/* Duplicates */}
            <div className="p-4 rounded-xl bg-brand-navy border border-purple-500/30 shadow-card-dark">
              <span className="text-[10px] font-mono uppercase text-purple-400 font-semibold flex items-center gap-1">
                <FileSpreadsheet className="w-3 h-3" />
                Duplicates
              </span>
              <div className="text-2xl font-bold font-mono text-purple-400 mt-1">
                {scanResult.stats.duplicates.toLocaleString()}
              </div>
            </div>
          </div>

          {/* Clean Results & 1-Click Export Bar (With Copy to Clipboard!) */}
          <div className="p-5 rounded-2xl bg-brand-navy border border-brand-green/40 shadow-green-glow flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div>
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-5 h-5 text-brand-green" />
                <h3 className="text-base font-bold text-brand-white">Clean Results Ready for Outreach</h3>
              </div>
              <p className="text-xs text-brand-gray mt-0.5">
                <strong className="text-brand-green font-mono">{scanResult.stats.safe} verified leads</strong> ready to be copied or exported into Instantly / Smartlead.
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-2.5 w-full sm:w-auto">
              {/* COPY TO CLIPBOARD BUTTON */}
              <button
                onClick={handleCopyToClipboard}
                className={`flex-1 sm:flex-initial flex items-center justify-center gap-1.5 px-4 py-2.5 rounded-xl font-bold text-xs transition-all shadow-md active:scale-95 ${
                  copied
                    ? 'bg-brand-green text-brand-black shadow-green-glow'
                    : 'bg-brand-black border border-brand-cyan/40 text-brand-cyan hover:bg-brand-cyan hover:text-brand-black'
                }`}
              >
                {copied ? <Check className="w-4 h-4 stroke-[3]" /> : <Copy className="w-4 h-4" />}
                <span>{copied ? 'Copied to Clipboard!' : '📋 Copy to Clipboard'}</span>
              </button>

              {/* DOWNLOAD CLEAN CSV */}
              <button
                onClick={handleDownloadCleanCsv}
                className="flex-1 sm:flex-initial flex items-center justify-center gap-1.5 px-4 py-2.5 rounded-xl bg-brand-green text-brand-black font-bold text-xs hover:brightness-110 transition-all shadow-green-glow active:scale-95"
              >
                <Download className="w-4 h-4" />
                <span>📥 Download Clean CSV</span>
              </button>

              {/* AUDIT REPORT */}
              <button
                onClick={handleDownloadFullAuditCsv}
                className="flex-1 sm:flex-initial flex items-center justify-center gap-1.5 px-3 py-2.5 rounded-xl bg-brand-midnight text-brand-white hover:bg-brand-midnight/80 border border-white/10 text-xs font-semibold transition-colors"
                title="Download full report including blocked reasons"
              >
                <span>Full Audit CSV</span>
              </button>
            </div>
          </div>

          {/* Detailed Conflict Breakdown Table */}
          <div className="p-6 rounded-2xl bg-brand-navy border border-brand-midnight shadow-card-dark space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-brand-midnight">
              <h3 className="text-sm font-bold text-brand-white">Detailed Collision & Clearance Breakdown</h3>

              {/* Filters & Search */}
              <div className="flex flex-wrap items-center gap-2">
                {/* Search */}
                <div className="relative">
                  <Search className="w-3.5 h-3.5 text-brand-gray absolute left-2.5 top-2.5" />
                  <input
                    type="text"
                    value={searchFilter}
                    onChange={(e) => setSearchFilter(e.target.value)}
                    placeholder="Search results..."
                    className="pl-8 pr-3 py-1.5 rounded-lg bg-brand-black border border-brand-midnight text-xs text-brand-white placeholder-brand-gray focus:outline-none focus:border-brand-cyan"
                  />
                </div>

                {/* Status Filter */}
                <div className="flex items-center gap-1 bg-brand-black p-1 rounded-lg border border-brand-midnight text-xs">
                  <button
                    onClick={() => setFilterType('all')}
                    className={`px-2 py-1 rounded ${filterType === 'all' ? 'bg-brand-cyan text-brand-black font-bold' : 'text-brand-gray'}`}
                  >
                    All ({scanResult.items.length})
                  </button>
                  <button
                    onClick={() => setFilterType('safe')}
                    className={`px-2 py-1 rounded ${filterType === 'safe' ? 'bg-brand-green text-brand-black font-bold' : 'text-brand-gray'}`}
                  >
                    Safe ({scanResult.stats.safe})
                  </button>
                  <button
                    onClick={() => setFilterType('flagged')}
                    className={`px-2 py-1 rounded ${filterType === 'flagged' ? 'bg-brand-orange text-brand-black font-bold' : 'text-brand-gray'}`}
                  >
                    Blocked ({scanResult.items.length - scanResult.stats.safe})
                  </button>
                </div>
              </div>
            </div>

            {/* Results Table */}
            <div className="overflow-x-auto max-h-96 overflow-y-auto">
              <table className="w-full text-left text-xs min-w-[850px]">
                <thead className="sticky top-0 bg-brand-navy z-10">
                  <tr className="border-b border-brand-midnight text-brand-gray font-mono uppercase tracking-wider">
                    <th className="py-2.5 px-3 w-36 whitespace-nowrap">Status</th>
                    <th className="py-2.5 px-3 min-w-[200px] whitespace-nowrap">Email Address</th>
                    <th className="py-2.5 px-3 min-w-[150px] whitespace-nowrap">Company / Domain</th>
                    <th className="py-2.5 px-3 min-w-[240px] whitespace-nowrap">Collision Analysis / Reason</th>
                    <th className="py-2.5 px-3 w-28 text-right whitespace-nowrap">Owner Rep</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-brand-midnight/60 font-mono">
                  {filteredItems.map((item) => {
                    const isSafe = item.status === 'safe';
                    const isSales = item.status === 'sales_conflict';
                    const isDnc = item.status === 'dnc_block';
                    const isDup = item.status === 'intra_batch_dup';

                    return (
                      <tr
                        key={item.id}
                        className={`hover:bg-brand-black/50 transition-colors ${
                          isSales ? 'bg-brand-orange/5' : isDnc ? 'bg-red-500/5' : ''
                        }`}
                      >
                        {/* Status Badge */}
                        <td className="py-2.5 px-3 whitespace-nowrap">
                          {isSafe && (
                            <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-brand-green/20 text-brand-green border border-brand-green/40">
                              ✓ SAFE
                            </span>
                          )}
                          {isSales && (
                            <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-brand-orange/20 text-brand-orange border border-brand-orange/40 animate-pulse">
                              ⚠️ SALES COLLISION
                            </span>
                          )}
                          {isDnc && (
                            <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-red-500/20 text-red-400 border border-red-500/40">
                              ⛔ DNC BLOCKED
                            </span>
                          )}
                          {isDup && (
                            <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-purple-500/20 text-purple-400 border border-purple-500/40">
                              DUPLICATE
                            </span>
                          )}
                          {item.status === 'interested_conflict' && (
                            <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-yellow-500/20 text-yellow-400 border border-yellow-500/40">
                              LEAD ACTIVE
                            </span>
                          )}
                          {item.status === 'in_conversation_conflict' && (
                            <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-blue-500/20 text-blue-400 border border-blue-500/40">
                              IN DIALOGUE
                            </span>
                          )}
                        </td>

                        {/* Email */}
                        <td className="py-2.5 px-3 font-semibold text-brand-white">
                          {item.normalizedEmail}
                        </td>

                        {/* Domain / Company */}
                        <td className="py-2.5 px-3 text-brand-gray">
                          <div>{item.domain}</div>
                          {item.companyName && (
                            <div className="text-[10px] text-brand-cyan">{item.companyName}</div>
                          )}
                        </td>

                        {/* Reason */}
                        <td className="py-2.5 px-3 font-sans text-xs">
                          <span
                            className={
                              isSafe
                                ? 'text-brand-green'
                                : isSales
                                ? 'text-brand-orange font-medium'
                                : isDnc
                                ? 'text-red-400'
                                : 'text-brand-gray'
                            }
                          >
                            {item.reason}
                          </span>
                        </td>

                        {/* Owner Rep */}
                        <td className="py-2.5 px-3 text-right whitespace-nowrap">
                          {item.ownerRep ? (
                            <span className="px-2 py-0.5 rounded bg-brand-black border border-white/10 text-[11px] font-semibold text-brand-white">
                              {item.ownerRep}
                            </span>
                          ) : (
                            <span className="text-brand-gray text-[11px]">—</span>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
