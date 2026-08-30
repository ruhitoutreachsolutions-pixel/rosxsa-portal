import React, { useState } from 'react';
import {
  Database,
  Search,
  Plus,
  Upload,
  Download,
  CalendarCheck,
  Trash2,
  Edit2,
  Check,
  X,
  History,
  Clock,
  User,
  ShieldCheck,
  ThumbsUp,
  ShieldBan,
  MessageSquare,
  Send,
  FileText,
  Filter,
  FilterX,
  MapPin,
  Mail,
  Building,
  Globe,
} from 'lucide-react';
import Papa from 'papaparse';
import { MasterRecord, LeadStatus, TeamMember, UserAccount, MeetingCountType } from '../../types';
import { BulkDncModal } from './BulkDncModal';

interface MasterRepositoryProps {
  records: MasterRecord[];
  teamMembers: TeamMember[];
  currentUser: UserAccount;
  onOpenQuickLead: () => void;
  onUpdateRecord: (record: MasterRecord) => void;
  onDeleteRecord: (id: string) => void;
  onBulkAddRecords: (records: MasterRecord[]) => void;
}

export const MasterRepository: React.FC<MasterRepositoryProps> = ({
  records,
  teamMembers,
  currentUser,
  onOpenQuickLead,
  onUpdateRecord,
  onDeleteRecord,
  onBulkAddRecords,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [isBulkModalOpen, setIsBulkModalOpen] = useState(false);
  const [editingRecord, setEditingRecord] = useState<MasterRecord | null>(null);
  const [viewHistoryRecord, setViewHistoryRecord] = useState<MasterRecord | null>(null);
  const [showColFilters, setShowColFilters] = useState(true);

  // Per-column filter states (matching user request)
  const [colFilters, setColFilters] = useState({
    status: 'all',
    email: '',
    contactName: '',
    city: '',
    companyName: '',
    leadGenRep: 'all',
    salesRep: 'all',
    date: '',
  });

  const leadGenReps = teamMembers.filter((m) => m.role === 'lead_gen');
  const salesReps = teamMembers.filter((m) => m.role === 'sales');
  const isAdmin = currentUser.role === 'admin';
  const isSales = currentUser.role === 'sales';
  const isLeadGen = currentUser.role === 'lead_gen';

  const isAnyColFilterActive = Object.entries(colFilters).some(
    ([k, v]) => v !== '' && v !== 'all'
  );

  const resetAllFilters = () => {
    setColFilters({
      status: 'all',
      email: '',
      contactName: '',
      city: '',
      companyName: '',
      leadGenRep: 'all',
      salesRep: 'all',
      date: '',
    });
    setSearchQuery('');
    setStatusFilter('all');
  };

  // Filtered records
  const filtered = records.filter((rec) => {
    if (statusFilter !== 'all' && rec.status !== statusFilter) return false;
    if (colFilters.status !== 'all' && rec.status !== colFilters.status) return false;

    if (colFilters.email) {
      const q = colFilters.email.toLowerCase();
      const matchPrimary = rec.email.toLowerCase().includes(q) || rec.domain.toLowerCase().includes(q);
      const matchAlt = rec.alternateEmails?.some((alt) => alt.toLowerCase().includes(q));
      if (!matchPrimary && !matchAlt) return false;
    }

    if (colFilters.contactName && (!rec.contactName || !rec.contactName.toLowerCase().includes(colFilters.contactName.toLowerCase()))) {
      return false;
    }

    if (colFilters.companyName && (!rec.companyName || !rec.companyName.toLowerCase().includes(colFilters.companyName.toLowerCase()))) {
      return false;
    }

    if (colFilters.city) {
      const q = colFilters.city.toLowerCase();
      const matchCity = rec.city && rec.city.toLowerCase().includes(q);
      const matchCountry = rec.country && rec.country.toLowerCase().includes(q);
      if (!matchCity && !matchCountry) return false;
    }

    if (colFilters.leadGenRep !== 'all') {
      if (colFilters.leadGenRep === 'None') {
        if (rec.leadGenRep && rec.leadGenRep !== 'None' && rec.leadGenRep !== 'Unassigned') {
          return false;
        }
      } else if (rec.leadGenRep !== colFilters.leadGenRep) {
        return false;
      }
    }
    if (colFilters.salesRep !== 'all' && rec.salesRep !== colFilters.salesRep) return false;
    if (colFilters.date && !rec.createdAt.includes(colFilters.date)) return false;

    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      return (
        rec.email.toLowerCase().includes(q) ||
        rec.domain.toLowerCase().includes(q) ||
        (rec.companyName && rec.companyName.toLowerCase().includes(q)) ||
        (rec.contactName && rec.contactName.toLowerCase().includes(q)) ||
        (rec.city && rec.city.toLowerCase().includes(q)) ||
        (rec.country && rec.country.toLowerCase().includes(q)) ||
        (rec.leadGenRep && rec.leadGenRep.toLowerCase().includes(q)) ||
        (rec.salesRep && rec.salesRep.toLowerCase().includes(q)) ||
        (rec.alternateEmails && rec.alternateEmails.some((alt) => alt.toLowerCase().includes(q)))
      );
    }
    return true;
  });

  // Quick Inline Approval for Admins & Sales Reps
  const handleQuickApproveMeeting = (record: MasterRecord, approval: MeetingCountType) => {
    const audit = record.auditHistory || [];
    const updated: MasterRecord = {
      ...record,
      meetingCountType: approval,
      updatedAt: new Date().toISOString(),
      auditHistory: [
        {
          timestamp: new Date().toISOString(),
          user: `${currentUser.fullName} (${currentUser.role.toUpperCase()})`,
          action: `Meeting Quota Count Approved as: ${approval.toUpperCase()}`,
        },
        ...audit,
      ],
    };
    onUpdateRecord(updated);
  };

  // Quick Status Change Handler
  const handleQuickStatusChange = (record: MasterRecord, newStatus: LeadStatus) => {
    if (newStatus === 'meeting_done') {
      const defaultCountType: MeetingCountType = isLeadGen ? 'pending' : record.meetingCountType || 'yes';
      setEditingRecord({
        ...record,
        status: newStatus,
        meetingCompleted: true,
        meetingCountType: defaultCountType,
      });
    } else {
      const audit = record.auditHistory || [];
      const isPipelineLead =
        newStatus === 'in_conversation' ||
        newStatus === 'paid_client' ||
        newStatus === 'demo_sent' ||
        newStatus === 'invoice_sent';
      const updated: MasterRecord = {
        ...record,
        status: newStatus,
        meetingCompleted: isPipelineLead ? true : record.meetingCompleted,
        meetingCountType: isPipelineLead ? 'yes' : record.meetingCountType,
        updatedAt: new Date().toISOString(),
        auditHistory: [
          {
            timestamp: new Date().toISOString(),
            user: currentUser.fullName,
            action: `Status changed to ${newStatus.toUpperCase()}`,
          },
          ...audit,
        ],
      };
      onUpdateRecord(updated);
    }
  };

  const handleSaveStatusModal = (e: React.FormEvent) => {
    e.preventDefault();
    if (editingRecord) {
      const audit = editingRecord.auditHistory || [];
      let countType = editingRecord.meetingCountType || 'pending';
      let auditAction = `Updated to ${editingRecord.status.toUpperCase()} (Count: ${countType.toUpperCase()})`;

      if (editingRecord.status === 'meeting_done') {
        if (!isAdmin && countType === 'yes') {
          countType = 'pending';
          auditAction = `Meeting Done submitted as YES by ${currentUser.fullName} (Awaiting Admin Approval)`;
        }
      }

      const updated: MasterRecord = {
        ...editingRecord,
        meetingCountType: countType,
        updatedAt: new Date().toISOString(),
        auditHistory: [
          {
            timestamp: new Date().toISOString(),
            user: `${currentUser.fullName} (${currentUser.role.toUpperCase()})`,
            action: auditAction,
            details: editingRecord.notes,
          },
          ...audit,
        ],
      };
      onUpdateRecord(updated);
      setEditingRecord(null);
    }
  };

  // Export Master List CSV
  const handleExportCsv = () => {
    const csv = Papa.unparse(
      records.map((r) => ({
        Email: r.email,
        Domain: r.domain,
        Company: r.companyName || '',
        ContactPerson: r.contactName || '',
        Status: r.status.toUpperCase(),
        MeetingCountQuota:
          r.meetingCountType === 'yes'
            ? 'YES'
            : r.meetingCountType === 'no'
            ? 'NO'
            : r.meetingCountType === 'pending'
            ? 'PENDING'
            : 'N/A',
        DncReason: r.dncReason || '',
        LeadGenRep: r.leadGenRep || '',
        SalesRep: r.salesRep || '',
        CreatedBy: r.createdBy || r.leadGenRep || '',
        DateLogged: r.createdAt,
        LastUpdated: r.updatedAt,
      }))
    );
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.setAttribute('download', `ROSxSA_Master_Repository_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="space-y-6">
      {/* Top Banner & Actions */}
      <div className="p-6 rounded-2xl bg-brand-navy border border-brand-midnight shadow-card-dark flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-2xl bg-brand-black border border-brand-cyan/30 flex items-center justify-center text-brand-cyan shadow-cyan-glow shrink-0">
            <Database className="w-6 h-6" />
          </div>
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <h2 className="text-xl font-bold text-brand-white whitespace-nowrap">Master Lead & DNC Repository</h2>
              <span className="text-xs font-mono px-2 py-0.5 rounded bg-brand-cyan/10 text-brand-cyan border border-brand-cyan/20 whitespace-nowrap">
                {records.length} Records
              </span>
            </div>
            <p className="text-xs text-brand-gray">
              Manage DNCs, Interested leads, and Meeting Done status with Admin & Sales Quota Validation.
            </p>
          </div>
        </div>

        {/* Top Buttons */}
        <div className="flex flex-wrap items-center gap-2.5 shrink-0">
          <button
            onClick={() => setIsBulkModalOpen(true)}
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-brand-black border border-white/10 hover:border-brand-cyan/40 text-brand-white text-xs font-semibold transition-colors whitespace-nowrap shrink-0"
          >
            <Upload className="w-4 h-4 text-brand-cyan shrink-0" />
            <span>Bulk Import</span>
          </button>

          <button
            onClick={handleExportCsv}
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-brand-black border border-white/10 hover:border-brand-green/40 text-brand-white text-xs font-semibold transition-colors whitespace-nowrap shrink-0"
          >
            <Download className="w-4 h-4 text-brand-green shrink-0" />
            <span>Export CSV</span>
          </button>

          <button
            onClick={onOpenQuickLead}
            className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-brand-cyan text-brand-black font-bold text-xs hover:brightness-110 active:scale-95 transition-all shadow-cyan-glow whitespace-nowrap shrink-0"
          >
            <Plus className="w-4 h-4 shrink-0" />
            <span>+ Log Single Lead</span>
          </button>
        </div>
      </div>

      {/* Filter & Search Bar */}
      <div className="p-4 rounded-xl bg-brand-navy border border-brand-midnight flex flex-col sm:flex-row items-center justify-between gap-3">
        {/* Search */}
        <div className="relative w-full sm:w-80 shrink-0">
          <Search className="w-4 h-4 text-brand-gray absolute left-3 top-2.5" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search email, company, rep, domain..."
            className="w-full pl-9 pr-3 py-2 rounded-xl bg-brand-black border border-brand-midnight text-xs text-brand-white placeholder-brand-gray focus:outline-none focus:border-brand-cyan"
          />
        </div>

        {/* Status Filter Pills (Clean non-breaking badges) */}
        <div className="flex flex-wrap items-center gap-1.5 w-full sm:w-auto">
          <button
            onClick={() => setStatusFilter('all')}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all whitespace-nowrap shrink-0 ${
              statusFilter === 'all'
                ? 'bg-brand-cyan text-brand-black shadow-cyan-glow'
                : 'bg-brand-black text-brand-gray hover:text-brand-white'
            }`}
          >
            All ({records.length})
          </button>
          <button
            onClick={() => setStatusFilter('interested')}
            className={`inline-flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all whitespace-nowrap shrink-0 ${
              statusFilter === 'interested'
                ? 'bg-brand-cyan text-brand-black'
                : 'bg-brand-black text-brand-cyan hover:bg-brand-cyan/20'
            }`}
          >
            <ThumbsUp className="w-3.5 h-3.5 shrink-0" />
            <span>Interested ({records.filter((r) => r.status === 'interested').length})</span>
          </button>
          <button
            onClick={() => setStatusFilter('meeting_scheduled')}
            className={`inline-flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all whitespace-nowrap shrink-0 ${
              statusFilter === 'meeting_scheduled'
                ? 'bg-yellow-400 text-brand-black'
                : 'bg-brand-black text-yellow-400 hover:bg-yellow-400/20'
            }`}
          >
            <CalendarCheck className="w-3.5 h-3.5 shrink-0" />
            <span>Scheduled ({records.filter((r) => r.status === 'meeting_scheduled').length})</span>
          </button>
          <button
            onClick={() => setStatusFilter('meeting_done')}
            className={`inline-flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all whitespace-nowrap shrink-0 ${
              statusFilter === 'meeting_done'
                ? 'bg-brand-green text-brand-black'
                : 'bg-brand-black text-brand-green hover:bg-brand-green/20'
            }`}
          >
            <Check className="w-3.5 h-3.5 stroke-[3] shrink-0" />
            <span>Meeting Done ({records.filter((r) => r.status === 'meeting_done').length})</span>
          </button>
          <button
            onClick={() => setStatusFilter('dnc')}
            className={`inline-flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all whitespace-nowrap shrink-0 ${
              statusFilter === 'dnc'
                ? 'bg-red-500 text-white'
                : 'bg-brand-black text-red-400 hover:bg-red-500/20'
            }`}
          >
            <ShieldBan className="w-3.5 h-3.5 shrink-0" />
            <span>DNC ({records.filter((r) => r.status === 'dnc').length})</span>
          </button>
          <button
            onClick={() => setStatusFilter('paid_client')}
            className={`inline-flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all whitespace-nowrap shrink-0 ${
              statusFilter === 'paid_client'
                ? 'bg-brand-green text-brand-black'
                : 'bg-brand-black text-brand-green hover:bg-brand-green/20'
            }`}
          >
            <Check className="w-3.5 h-3.5 stroke-[3] shrink-0" />
            <span>Paid Clients ({records.filter((r) => r.status === 'paid_client').length})</span>
          </button>
        </div>
      </div>

      {/* Main Database Table Container */}
      <div className="p-6 rounded-2xl bg-brand-navy border border-brand-midnight shadow-card-dark overflow-x-auto">
        <div className="flex items-center justify-between pb-3 border-b border-brand-midnight">
          <div className="flex items-center gap-2">
            <span className="text-xs font-mono font-bold text-brand-white uppercase">
              Master Lead & Client Database ({filtered.length} of {records.length})
            </span>
            {isAnyColFilterActive && (
              <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-brand-cyan/20 text-brand-cyan border border-brand-cyan/30 animate-pulse">
                Filtered Active
              </span>
            )}
          </div>
          {isAnyColFilterActive && (
            <button
              onClick={resetAllFilters}
              className="text-xs text-red-400 hover:text-red-300 font-semibold flex items-center gap-1 transition-colors"
            >
              <FilterX className="w-3.5 h-3.5" />
              <span>Clear Column Filters</span>
            </button>
          )}
        </div>

        <table className="w-full text-left text-xs min-w-[1100px]">
          <thead>
            {/* Column Header Titles with Filter Icons (matching user screenshot) */}
            <tr className="border-b border-brand-midnight text-brand-gray font-mono uppercase tracking-wider">
              <th className="py-3 px-3 w-36 whitespace-nowrap">
                <div className="flex items-center gap-1.5 text-brand-cyan">
                  <span>PIPELINE STAGE</span>
                  <Filter className="w-3 h-3 text-brand-cyan/70" />
                </div>
              </th>
              <th className="py-3 px-3 min-w-[220px] whitespace-nowrap">
                <div className="flex items-center gap-1.5 text-brand-cyan">
                  <span>EMAIL ADDRESS</span>
                  <Filter className="w-3 h-3 text-brand-cyan/70" />
                </div>
              </th>
              <th className="py-3 px-3 min-w-[160px] whitespace-nowrap">
                <div className="flex items-center gap-1.5 text-brand-cyan">
                  <span>COMPANY NAME</span>
                  <Filter className="w-3 h-3 text-brand-cyan/70" />
                </div>
              </th>
              <th className="py-3 px-3 min-w-[160px] whitespace-nowrap">
                <div className="flex items-center gap-1.5 text-brand-cyan">
                  <span>CONTACT / NAME</span>
                  <Filter className="w-3 h-3 text-brand-cyan/70" />
                </div>
              </th>
              <th className="py-3 px-3 min-w-[130px] whitespace-nowrap">
                <div className="flex items-center gap-1.5 text-brand-cyan">
                  <span>CITY / REGION</span>
                  <Filter className="w-3 h-3 text-brand-cyan/70" />
                </div>
              </th>
              <th className="py-3 px-3 w-32 whitespace-nowrap">
                <div className="flex items-center gap-1.5 text-brand-cyan">
                  <span>LEAD GEN REP</span>
                  <Filter className="w-3 h-3 text-brand-cyan/70" />
                </div>
              </th>
              <th className="py-3 px-3 min-w-[220px] whitespace-nowrap">
                <div className="flex items-center gap-1 text-brand-gray">
                  <span>MEETING QUOTA COUNT</span>
                </div>
              </th>
              <th className="py-3 px-3 w-32 whitespace-nowrap">
                <div className="flex items-center gap-1.5 text-brand-cyan">
                  <span>DATE ADDED</span>
                  <Filter className="w-3 h-3 text-brand-cyan/70" />
                </div>
              </th>
              <th className="py-3 px-3 w-40 text-right whitespace-nowrap">ACTIONS</th>
            </tr>

            {/* Inline Column Filter Inputs Row */}
            <tr className="border-b border-brand-midnight/80 bg-brand-black/40">
              {/* Stage Filter */}
              <th className="py-2 px-2.5">
                <select
                  value={colFilters.status}
                  onChange={(e) => setColFilters({ ...colFilters, status: e.target.value })}
                  className="w-full px-2 py-1 rounded-lg bg-brand-midnight border border-white/10 text-[11px] text-brand-white focus:outline-none focus:border-brand-cyan"
                >
                  <option value="all">All Stages</option>
                  <option value="interested">Interested</option>
                  <option value="meeting_scheduled">Scheduled</option>
                  <option value="meeting_done">Meeting Done</option>
                  <option value="in_conversation">In Dialogue</option>
                  <option value="demo_sent">Demo Sent</option>
                  <option value="invoice_sent">Invoice Sent</option>
                  <option value="paid_client">Paid Client</option>
                  <option value="dnc">DNC</option>
                </select>
              </th>

              {/* Email Filter */}
              <th className="py-2 px-2.5">
                <input
                  type="text"
                  value={colFilters.email}
                  onChange={(e) => setColFilters({ ...colFilters, email: e.target.value })}
                  placeholder="Filter email/domain..."
                  className="w-full px-2 py-1 rounded-lg bg-brand-midnight border border-white/10 text-[11px] text-brand-white placeholder-brand-gray focus:outline-none focus:border-brand-cyan font-mono"
                />
              </th>

              {/* Company Filter */}
              <th className="py-2 px-2.5">
                <input
                  type="text"
                  value={colFilters.companyName}
                  onChange={(e) => setColFilters({ ...colFilters, companyName: e.target.value })}
                  placeholder="Filter company..."
                  className="w-full px-2 py-1 rounded-lg bg-brand-midnight border border-white/10 text-[11px] text-brand-white placeholder-brand-gray focus:outline-none focus:border-brand-cyan"
                />
              </th>

              {/* Contact Filter */}
              <th className="py-2 px-2.5">
                <input
                  type="text"
                  value={colFilters.contactName}
                  onChange={(e) => setColFilters({ ...colFilters, contactName: e.target.value })}
                  placeholder="Filter name..."
                  className="w-full px-2 py-1 rounded-lg bg-brand-midnight border border-white/10 text-[11px] text-brand-white placeholder-brand-gray focus:outline-none focus:border-brand-cyan"
                />
              </th>

              {/* City Filter */}
              <th className="py-2 px-2.5">
                <input
                  type="text"
                  value={colFilters.city}
                  onChange={(e) => setColFilters({ ...colFilters, city: e.target.value })}
                  placeholder="City / Country..."
                  className="w-full px-2 py-1 rounded-lg bg-brand-midnight border border-white/10 text-[11px] text-brand-white placeholder-brand-gray focus:outline-none focus:border-brand-cyan"
                />
              </th>

              {/* Lead Rep Filter */}
              <th className="py-2 px-2.5">
                <select
                  value={colFilters.leadGenRep}
                  onChange={(e) => setColFilters({ ...colFilters, leadGenRep: e.target.value })}
                  className="w-full px-2 py-1 rounded-lg bg-brand-midnight border border-white/10 text-[11px] text-brand-white focus:outline-none focus:border-brand-cyan"
                >
                  <option value="all">All Reps</option>
                  <option value="None">None (Unassigned)</option>
                  {leadGenReps.map((r) => (
                    <option key={r.id} value={r.name}>
                      {r.name}
                    </option>
                  ))}
                </select>
              </th>

              {/* Meeting Count */}
              <th className="py-2 px-2.5 text-center text-brand-gray font-mono text-[10px]">
                —
              </th>

              {/* Date Filter */}
              <th className="py-2 px-2.5">
                <input
                  type="text"
                  value={colFilters.date}
                  onChange={(e) => setColFilters({ ...colFilters, date: e.target.value })}
                  placeholder="YYYY-MM-DD"
                  className="w-full px-2 py-1 rounded-lg bg-brand-midnight border border-white/10 text-[11px] text-brand-white placeholder-brand-gray focus:outline-none focus:border-brand-cyan font-mono"
                />
              </th>

              {/* Reset Action */}
              <th className="py-2 px-2.5 text-right">
                {isAnyColFilterActive && (
                  <button
                    onClick={resetAllFilters}
                    className="p-1 rounded bg-red-500/20 text-red-300 hover:bg-red-500 hover:text-white transition-all text-[10px] font-bold"
                    title="Clear All Filters"
                  >
                    Clear
                  </button>
                )}
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-brand-midnight/60">
            {filtered.length === 0 ? (
              <tr>
                <td colSpan={9} className="text-center py-12 text-brand-gray">
                  No records matching your filter.
                </td>
              </tr>
            ) : (
              filtered.map((rec) => (
                <tr key={rec.id} className="hover:bg-brand-black/50 transition-colors">
                  {/* Status Badge (Guaranteed 1-Line with Icon) */}
                  <td className="py-3 px-3">
                    {rec.status === 'dnc' && (
                      <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded text-[11px] font-bold bg-red-500/20 text-red-400 border border-red-500/30 whitespace-nowrap shrink-0">
                        <ShieldBan className="w-3.5 h-3.5 shrink-0" />
                        <span>DNC ({rec.dncReason || 'Unsub'})</span>
                      </span>
                    )}
                    {rec.status === 'interested' && (
                      <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded text-[11px] font-bold bg-brand-cyan/20 text-brand-cyan border border-brand-cyan/30 whitespace-nowrap shrink-0">
                        <ThumbsUp className="w-3.5 h-3.5 shrink-0" />
                        <span>Interested</span>
                      </span>
                    )}
                    {rec.status === 'meeting_scheduled' && (
                      <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded text-[11px] font-bold bg-yellow-400/20 text-yellow-400 border border-yellow-400/30 whitespace-nowrap shrink-0">
                        <CalendarCheck className="w-3.5 h-3.5 shrink-0" />
                        <span>Scheduled</span>
                      </span>
                    )}
                    {rec.status === 'meeting_done' && (
                      <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded text-[11px] font-bold bg-brand-green/20 text-brand-green border border-brand-green/30 whitespace-nowrap shrink-0">
                        <Check className="w-3.5 h-3.5 stroke-[3] shrink-0" />
                        <span>Meeting Done</span>
                      </span>
                    )}
                    {rec.status === 'in_conversation' && (
                      <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded text-[11px] font-bold bg-blue-500/20 text-blue-400 border border-blue-500/30 whitespace-nowrap shrink-0">
                        <MessageSquare className="w-3.5 h-3.5 shrink-0" />
                        <span>In Dialogue</span>
                      </span>
                    )}
                    {rec.status === 'demo_sent' && (
                      <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded text-[11px] font-bold bg-blue-400/20 text-blue-400 border border-blue-400/30 whitespace-nowrap shrink-0">
                        <Send className="w-3.5 h-3.5 shrink-0" />
                        <span>Demo Sent</span>
                      </span>
                    )}
                    {rec.status === 'invoice_sent' && (
                      <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded text-[11px] font-bold bg-brand-orange/20 text-brand-orange border border-brand-orange/30 whitespace-nowrap shrink-0">
                        <FileText className="w-3.5 h-3.5 shrink-0" />
                        <span>Invoice Sent</span>
                      </span>
                    )}
                    {rec.status === 'paid_client' && (
                      <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded text-[11px] font-bold bg-brand-green/20 text-brand-green border border-brand-green/40 shadow-green-glow whitespace-nowrap shrink-0">
                        <Check className="w-3.5 h-3.5 stroke-[3] shrink-0" />
                        <span>Paid Client</span>
                      </span>
                    )}
                    {rec.status === 'cold_lead' && (
                      <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded text-[11px] font-bold bg-gray-500/20 text-gray-400 border border-gray-500/30 whitespace-nowrap shrink-0">
                        <span>Cold Lead</span>
                      </span>
                    )}
                  </td>

                  {/* Email & Alternative Emails */}
                  <td className="py-3 px-3">
                    <div className="font-semibold text-brand-white break-all">{rec.email}</div>
                    <div className="text-[11px] text-brand-gray font-mono whitespace-nowrap">@{rec.domain}</div>
                    {rec.alternateEmails && rec.alternateEmails.length > 0 && (
                      <div className="mt-1 flex flex-wrap gap-1">
                        {rec.alternateEmails.map((alt, i) => (
                          <span key={i} className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-brand-black text-brand-cyan border border-brand-cyan/30">
                            Alt: {alt}
                          </span>
                        ))}
                      </div>
                    )}
                  </td>

                  {/* Company Name */}
                  <td className="py-3 px-3">
                    <div className="font-bold text-brand-white">{rec.companyName || '—'}</div>
                    {rec.website && (
                      <div className="text-[11px] text-brand-cyan font-mono truncate max-w-[150px]">
                        {rec.website.replace('https://', '').replace('http://', '')}
                      </div>
                    )}
                  </td>

                  {/* Contact Person */}
                  <td className="py-3 px-3">
                    <div className="font-semibold text-brand-white">{rec.contactName || '—'}</div>
                    <div className="text-[11px] text-brand-gray">
                      {rec.jobTitle ? (
                        <span className="opacity-80 font-mono">({rec.jobTitle})</span>
                      ) : (
                        '—'
                      )}
                    </div>
                  </td>

                  {/* City / Country */}
                  <td className="py-3 px-3 text-brand-gray font-medium">
                    <div className="flex items-center gap-1 text-xs">
                      <MapPin className="w-3 h-3 text-brand-gray shrink-0" />
                      <span className="text-brand-white">{rec.city || rec.country || '—'}</span>
                    </div>
                    {rec.city && rec.country && (
                      <div className="text-[10px] text-brand-gray ml-4">{rec.country}</div>
                    )}
                  </td>

                  {/* Lead Gen Rep */}
                  <td className="py-3 px-3">
                    <span className="inline-flex items-center px-2.5 py-1 rounded bg-brand-black border border-brand-cyan/30 text-xs font-semibold text-brand-cyan font-mono whitespace-nowrap shrink-0">
                      {rec.leadGenRep || 'Unassigned'}
                    </span>
                  </td>

                  {/* Meeting Quota Count & Approvals */}
                  <td className="py-3 px-3">
                    {rec.status === 'in_conversation' ? (
                      <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded bg-blue-500/20 text-blue-400 border border-blue-500/40 font-mono text-[11px] font-bold whitespace-nowrap shrink-0">
                        <Check className="w-3.5 h-3.5 stroke-[3] shrink-0" />
                        <span>Count: YES (In Dialogue)</span>
                      </span>
                    ) : rec.status === 'paid_client' ? (
                      <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded bg-brand-green/20 text-brand-green border border-brand-green/40 font-mono text-[11px] font-bold whitespace-nowrap shrink-0">
                        <Check className="w-3.5 h-3.5 stroke-[3] shrink-0" />
                        <span>Count: YES (Paid Client)</span>
                      </span>
                    ) : rec.status === 'demo_sent' || rec.status === 'invoice_sent' ? (
                      <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded bg-brand-cyan/20 text-brand-cyan border border-brand-cyan/40 font-mono text-[11px] font-bold whitespace-nowrap shrink-0">
                        <Check className="w-3.5 h-3.5 stroke-[3] shrink-0" />
                        <span>Count: YES (Pipeline)</span>
                      </span>
                    ) : rec.status === 'meeting_done' ? (
                      rec.meetingCountType === 'pending' ? (
                        <div className="space-y-1.5">
                          <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded bg-yellow-400/20 text-yellow-300 border border-yellow-400/40 font-mono text-[11px] font-bold animate-pulse whitespace-nowrap shrink-0">
                            <Clock className="w-3.5 h-3.5 shrink-0" />
                            <span>Pending Review</span>
                          </span>

                          {/* Quick Inline Approval for Sales Team & Admins */}
                          {(isAdmin || isSales) && (
                            <div className="flex items-center gap-1.5 pt-0.5">
                              <button
                                onClick={() => handleQuickApproveMeeting(rec, 'yes')}
                                className="px-2.5 py-1 rounded bg-brand-green text-brand-black font-bold text-xs hover:brightness-110 flex items-center gap-1 shadow-sm whitespace-nowrap shrink-0"
                                title="Approve meeting to be added to lead gen quota"
                              >
                                <Check className="w-3.5 h-3.5 stroke-[3] shrink-0" />
                                <span>Approve (YES)</span>
                              </button>
                              <button
                                onClick={() => handleQuickApproveMeeting(rec, 'no')}
                                className="px-2 py-1 rounded bg-brand-midnight text-brand-gray hover:text-white border border-white/10 text-xs font-semibold whitespace-nowrap shrink-0"
                                title="Done only, do not count in quota"
                              >
                                <span>Set NO</span>
                              </button>
                            </div>
                          )}
                        </div>
                      ) : rec.meetingCountType === 'yes' ? (
                        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded bg-brand-green/20 text-brand-green border border-brand-green/40 font-mono text-[11px] font-bold whitespace-nowrap shrink-0">
                          <Check className="w-3.5 h-3.5 stroke-[3] shrink-0" />
                          <span>Count: YES (Quota)</span>
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded bg-brand-midnight text-brand-gray border border-white/10 font-mono text-[11px] whitespace-nowrap shrink-0">
                          <X className="w-3.5 h-3.5 shrink-0" />
                          <span>Count: NO (Done Only)</span>
                        </span>
                      )
                    ) : rec.status === 'dnc' ? (
                      (rec.meetingCompleted || rec.notes?.includes('DEAL LOST') || rec.auditHistory?.some((a) => a.action?.includes('Deal Lost'))) ? (
                        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded bg-orange-500/15 text-orange-400 border border-orange-500/30 font-mono text-[10px] font-semibold whitespace-nowrap shrink-0" title="Meeting was completed in Sales, but deal was lost">
                          <span>Meeting Done · Lost (Done Only)</span>
                        </span>
                      ) : (
                        <span className="text-brand-gray font-mono text-[11px] opacity-60">— Direct DNC</span>
                      )
                    ) : (
                      <span className="text-brand-gray text-xs font-mono">—</span>
                    )}
                  </td>

                  {/* Added Date */}
                  <td className="py-3 px-3">
                    <div className="text-[11px] text-brand-white font-mono whitespace-nowrap">
                      {rec.createdAt ? rec.createdAt.split('T')[0] : 'Historical'}
                    </div>
                    <div className="text-[10px] text-brand-gray truncate max-w-[100px]">
                      {rec.createdBy || rec.leadGenRep || 'Outbound'}
                    </div>
                  </td>

                  {/* Actions & History View */}
                  <td className="py-3 px-3 text-right">
                    <div className="flex items-center justify-end gap-1.5 shrink-0">
                      <select
                        value={rec.status}
                        onChange={(e) => handleQuickStatusChange(rec, e.target.value as LeadStatus)}
                        className="px-2 py-1 rounded-lg bg-brand-black border border-brand-midnight text-xs text-brand-white focus:outline-none focus:border-brand-cyan font-semibold whitespace-nowrap"
                      >
                        <option value="interested">Interested</option>
                        <option value="meeting_scheduled">Scheduled</option>
                        <option value="meeting_done">Done</option>
                        <option value="in_conversation">Dialogue</option>
                        <option value="dnc">DNC</option>
                        <option value="paid_client">Paid</option>
                      </select>

                      {/* Admin View History Button */}
                      {isAdmin && (
                        <button
                          onClick={() => setViewHistoryRecord(rec)}
                          className="p-1.5 rounded-lg text-brand-gray hover:text-brand-cyan hover:bg-brand-black transition-colors shrink-0"
                          title="View Edit History & Audit Logs"
                        >
                          <History className="w-3.5 h-3.5" />
                        </button>
                      )}

                      <button
                        onClick={() => setEditingRecord(rec)}
                        className="p-1.5 rounded-lg text-brand-gray hover:text-brand-cyan hover:bg-brand-black transition-colors shrink-0"
                        title="Edit Details & Meeting Count"
                      >
                        <Edit2 className="w-3.5 h-3.5" />
                      </button>

                      <button
                        onClick={() => onDeleteRecord(rec.id)}
                        className="p-1.5 rounded-lg text-brand-gray hover:text-red-400 hover:bg-red-950/30 transition-colors shrink-0"
                        title="Delete record"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Edit Record & Meeting Count Modal */}
      {editingRecord && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-brand-navy border border-brand-midnight rounded-2xl w-full max-w-lg overflow-hidden shadow-2xl animate-scale-up">
            <div className="px-6 py-4 bg-brand-black border-b border-brand-midnight flex items-center justify-between">
              <div className="flex items-center gap-2">
                <CalendarCheck className="w-4 h-4 text-brand-green shrink-0" />
                <h4 className="text-sm font-bold text-brand-white whitespace-nowrap">
                  Update Meeting & Lead Status
                </h4>
              </div>
              <button
                onClick={() => setEditingRecord(null)}
                className="text-brand-gray hover:text-white p-1"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSaveStatusModal} className="p-6 space-y-4 max-h-[80vh] overflow-y-auto">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-mono uppercase text-brand-gray mb-1">
                    Company Name
                  </label>
                  <input
                    type="text"
                    value={editingRecord.companyName || ''}
                    onChange={(e) =>
                      setEditingRecord({ ...editingRecord, companyName: e.target.value })
                    }
                    placeholder="e.g. Acme Corp"
                    className="w-full px-3 py-2 rounded-xl bg-brand-black border border-brand-midnight text-xs text-brand-white focus:outline-none focus:border-brand-cyan"
                  />
                </div>
                <div>
                  <label className="block text-xs font-mono uppercase text-brand-gray mb-1">
                    Contact Person Name
                  </label>
                  <input
                    type="text"
                    value={editingRecord.contactName || ''}
                    onChange={(e) =>
                      setEditingRecord({ ...editingRecord, contactName: e.target.value })
                    }
                    placeholder="e.g. John Smith"
                    className="w-full px-3 py-2 rounded-xl bg-brand-black border border-brand-midnight text-xs text-brand-white focus:outline-none focus:border-brand-cyan"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-mono uppercase text-brand-gray mb-1">
                    City
                  </label>
                  <input
                    type="text"
                    value={editingRecord.city || ''}
                    onChange={(e) =>
                      setEditingRecord({ ...editingRecord, city: e.target.value })
                    }
                    placeholder="e.g. London"
                    className="w-full px-3 py-2 rounded-xl bg-brand-black border border-brand-midnight text-xs text-brand-white focus:outline-none focus:border-brand-cyan"
                  />
                </div>
                <div>
                  <label className="block text-xs font-mono uppercase text-brand-gray mb-1">
                    Country
                  </label>
                  <input
                    type="text"
                    value={editingRecord.country || ''}
                    onChange={(e) =>
                      setEditingRecord({ ...editingRecord, country: e.target.value })
                    }
                    placeholder="United Kingdom"
                    className="w-full px-3 py-2 rounded-xl bg-brand-black border border-brand-midnight text-xs text-brand-white focus:outline-none focus:border-brand-cyan"
                  />
                </div>
              </div>

              {/* Alternative Email Addresses */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-mono uppercase text-brand-gray mb-1">
                    Alternative Email 1
                  </label>
                  <input
                    type="email"
                    value={editingRecord.alternateEmails?.[0] || ''}
                    onChange={(e) => {
                      const currentAlts = [...(editingRecord.alternateEmails || [])];
                      currentAlts[0] = e.target.value;
                      const cleaned = currentAlts.map((a) => a.trim()).filter(Boolean);
                      setEditingRecord({ ...editingRecord, alternateEmails: cleaned });
                    }}
                    placeholder="alternate@company.co.uk"
                    className="w-full px-3 py-2 rounded-xl bg-brand-black border border-brand-midnight text-xs text-brand-white focus:outline-none focus:border-brand-cyan font-mono"
                  />
                </div>
                <div>
                  <label className="block text-xs font-mono uppercase text-brand-gray mb-1">
                    Alternative Email 2
                  </label>
                  <input
                    type="email"
                    value={editingRecord.alternateEmails?.[1] || ''}
                    onChange={(e) => {
                      const currentAlts = [...(editingRecord.alternateEmails || [])];
                      currentAlts[1] = e.target.value;
                      const cleaned = currentAlts.map((a) => a.trim()).filter(Boolean);
                      setEditingRecord({ ...editingRecord, alternateEmails: cleaned });
                    }}
                    placeholder="personal@gmail.com"
                    className="w-full px-3 py-2 rounded-xl bg-brand-black border border-brand-midnight text-xs text-brand-white focus:outline-none focus:border-brand-cyan font-mono"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-mono uppercase text-brand-gray mb-1">
                  Lead Status
                </label>
                <select
                  value={editingRecord.status}
                  onChange={(e) =>
                    setEditingRecord({
                      ...editingRecord,
                      status: e.target.value as LeadStatus,
                    })
                  }
                  className="w-full px-3 py-2 rounded-xl bg-brand-black border border-brand-midnight text-xs text-brand-white focus:outline-none focus:border-brand-cyan font-semibold"
                >
                  <option value="interested">Interested</option>
                  <option value="meeting_scheduled">Meeting Scheduled</option>
                  <option value="meeting_done">Meeting Done</option>
                  <option value="in_conversation">In-Conversation</option>
                  <option value="dnc">Do Not Contact (DNC)</option>
                  <option value="paid_client">Paid Client</option>
                </select>
              </div>

              {/* 3-WAY MEETING QUOTA ATTRIBUTION */}
              {editingRecord.status === 'meeting_done' && (
                <div className="p-4 rounded-xl bg-brand-black border border-brand-green/30 space-y-3">
                  <div className="flex items-center justify-between">
                    <label className="text-xs font-bold uppercase tracking-wider text-brand-green whitespace-nowrap">
                      Meeting Quota Attribution Rule
                    </label>
                    <span className="text-[10px] text-brand-gray font-mono whitespace-nowrap">
                      Admin / Sales Approval
                    </span>
                  </div>

                  <div className="grid grid-cols-3 gap-2">
                    {/* YES */}
                    <button
                      type="button"
                      onClick={() =>
                        setEditingRecord({ ...editingRecord, meetingCountType: 'yes' })
                      }
                      className={`p-2.5 rounded-xl border text-xs font-bold transition-all flex flex-col items-center gap-1 ${
                        editingRecord.meetingCountType === 'yes'
                          ? 'bg-brand-green/20 text-brand-green border-brand-green shadow-green-glow'
                          : 'bg-brand-navy text-brand-gray border-white/10'
                      }`}
                    >
                      <Check className="w-4 h-4 shrink-0" />
                      <span className="whitespace-nowrap">Meeting YES</span>
                      <span className="text-[9px] font-normal opacity-80 whitespace-nowrap">
                        Awaiting Review
                      </span>
                    </button>

                    {/* NO */}
                    <button
                      type="button"
                      onClick={() =>
                        setEditingRecord({ ...editingRecord, meetingCountType: 'no' })
                      }
                      className={`p-2.5 rounded-xl border text-xs font-bold transition-all flex flex-col items-center gap-1 ${
                        editingRecord.meetingCountType === 'no'
                          ? 'bg-red-500/20 text-red-400 border-red-500'
                          : 'bg-brand-navy text-brand-gray border-white/10'
                      }`}
                    >
                      <X className="w-4 h-4 shrink-0" />
                      <span className="whitespace-nowrap">Meeting NO</span>
                      <span className="text-[9px] font-normal opacity-80 whitespace-nowrap">Done Only</span>
                    </button>

                    {/* PENDING */}
                    <button
                      type="button"
                      onClick={() =>
                        setEditingRecord({ ...editingRecord, meetingCountType: 'pending' })
                      }
                      className={`p-2.5 rounded-xl border text-xs font-bold transition-all flex flex-col items-center gap-1 ${
                        editingRecord.meetingCountType === 'pending'
                          ? 'bg-yellow-400/20 text-yellow-300 border-yellow-400 shadow-orange-glow'
                          : 'bg-brand-navy text-brand-gray border-white/10'
                      }`}
                    >
                      <Clock className="w-4 h-4 shrink-0" />
                      <span className="whitespace-nowrap">Pending</span>
                      <span className="text-[9px] font-normal opacity-80 whitespace-nowrap">Awaiting Review</span>
                    </button>
                  </div>

                  <p className="text-[10px] text-brand-gray font-mono">
                    💡 "Pending" or "Meeting YES" counts as Meeting Done today. Approving as "YES" by Admin / Sales will count towards the lead gen rep monthly quota.
                  </p>
                </div>
              )}

              {/* Lead Gen Rep Attribution */}
              <div>
                <label className="block text-xs font-mono uppercase text-brand-gray mb-1">
                  Lead Gen Rep
                </label>
                <select
                  value={editingRecord.leadGenRep || 'None'}
                  onChange={(e) =>
                    setEditingRecord({ ...editingRecord, leadGenRep: e.target.value })
                  }
                  className="w-full px-3 py-2 rounded-xl bg-brand-black border border-brand-midnight text-xs text-brand-white focus:outline-none focus:border-brand-cyan"
                >
                  <option value="None">None (Unassigned / General)</option>
                  {leadGenReps.map((rep) => (
                    <option key={rep.id} value={rep.name}>
                      {rep.name} (Lead Gen)
                    </option>
                  ))}
                </select>
              </div>

              {/* Notes */}
              <div>
                <label className="block text-xs font-mono uppercase text-brand-gray mb-1">
                  Context / Outcome Notes
                </label>
                <textarea
                  rows={2}
                  value={editingRecord.notes || ''}
                  onChange={(e) =>
                    setEditingRecord({ ...editingRecord, notes: e.target.value })
                  }
                  placeholder="e.g. Discovery meeting completed successfully..."
                  className="w-full px-3 py-2 rounded-xl bg-brand-black border border-brand-midnight text-xs text-brand-white placeholder-brand-gray focus:outline-none focus:border-brand-cyan"
                />
              </div>

              {/* Actions */}
              <div className="pt-2 flex items-center justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setEditingRecord(null)}
                  className="px-4 py-2 rounded-xl text-xs font-semibold text-brand-gray hover:text-brand-white whitespace-nowrap"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2.5 rounded-xl bg-brand-green text-brand-black font-bold text-xs hover:brightness-110 shadow-green-glow whitespace-nowrap"
                >
                  Save Status
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Edit History Audit Drawer Modal */}
      {viewHistoryRecord && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-brand-navy border border-brand-midnight rounded-2xl w-full max-w-lg overflow-hidden shadow-2xl animate-scale-up">
            <div className="px-6 py-4 bg-brand-black border-b border-brand-midnight flex items-center justify-between">
              <div className="flex items-center gap-2">
                <History className="w-4 h-4 text-brand-cyan shrink-0" />
                <h4 className="text-sm font-bold text-brand-white whitespace-nowrap">
                  Audit Log & Edit History
                </h4>
              </div>
              <button
                onClick={() => setViewHistoryRecord(null)}
                className="text-brand-gray hover:text-white p-1"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="p-6 space-y-4">
              {/* Record Summary Box */}
              <div className="p-4 rounded-xl bg-brand-black border border-white/10 space-y-2 text-xs">
                <div className="flex justify-between items-center">
                  <span className="text-brand-gray">Email:</span>
                  <strong className="text-brand-white font-mono">{viewHistoryRecord.email}</strong>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-brand-gray">Company:</span>
                  <strong className="text-brand-white">{viewHistoryRecord.companyName || '—'}</strong>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-brand-gray">Added By:</span>
                  <strong className="text-brand-cyan">{viewHistoryRecord.createdBy || viewHistoryRecord.leadGenRep || 'Staff Rep'}</strong>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-brand-gray">Creation Date:</span>
                  <span className="font-mono text-brand-white">{viewHistoryRecord.createdAt}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-brand-gray">Last Modified:</span>
                  <span className="font-mono text-brand-white">{viewHistoryRecord.updatedAt}</span>
                </div>
              </div>

              {/* History Timeline */}
              <div className="space-y-2">
                <h5 className="text-xs font-bold uppercase tracking-wider text-brand-gray">
                  Change Log Timeline
                </h5>
                <div className="space-y-2 max-h-60 overflow-y-auto">
                  {viewHistoryRecord.auditHistory && viewHistoryRecord.auditHistory.length > 0 ? (
                    viewHistoryRecord.auditHistory.map((item, idx) => (
                      <div
                        key={idx}
                        className="p-3 rounded-lg bg-brand-black border border-brand-midnight text-xs space-y-1"
                      >
                        <div className="flex items-center justify-between">
                          <span className="font-bold text-brand-white">{item.action}</span>
                          <span className="text-[10px] text-brand-gray font-mono whitespace-nowrap">
                            {item.timestamp ? item.timestamp.split('T')[0] : ''}
                          </span>
                        </div>
                        <div className="text-[11px] text-brand-gray">
                          Modified by: <strong className="text-brand-cyan">{item.user}</strong>
                        </div>
                        {item.details && (
                          <div className="text-[11px] text-gray-300 italic">{item.details}</div>
                        )}
                      </div>
                    ))
                  ) : (
                    <div className="p-4 text-center text-xs text-brand-gray bg-brand-black rounded-lg border border-brand-midnight">
                      Record created on {viewHistoryRecord.createdAt.split('T')[0]} by {viewHistoryRecord.createdBy || viewHistoryRecord.leadGenRep || 'Staff Rep'}. No subsequent modifications logged.
                    </div>
                  )}
                </div>
              </div>

              <div className="pt-2 flex justify-end">
                <button
                  onClick={() => setViewHistoryRecord(null)}
                  className="px-4 py-2 rounded-xl bg-brand-black border border-white/10 text-xs font-semibold text-brand-white hover:border-brand-cyan whitespace-nowrap"
                >
                  Close History
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Bulk Importer Modal */}
      <BulkDncModal
        isOpen={isBulkModalOpen}
        onClose={() => setIsBulkModalOpen(false)}
        teamMembers={teamMembers}
        onBulkAdd={onBulkAddRecords}
      />
    </div>
  );
};
