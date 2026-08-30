import React from 'react';
import {
  PoundSterling,
  TrendingUp,
  Clock,
  AlertTriangle,
  CalendarCheck,
  CheckCircle2,
  Users,
} from 'lucide-react';
import { Deal, MasterRecord } from '../../types';
import { formatGbp, checkInvoiceAging } from '../../lib/currency';

interface OverviewKPIsProps {
  deals: Deal[];
  masterRecords: MasterRecord[];
}

export const OverviewKPIs: React.FC<OverviewKPIsProps> = ({ deals, masterRecords }) => {
  // 1. Closed Won Revenue
  const closedWonDeals = deals.filter((d) => d.stage === 'closed_won');
  const closedRevenueGbp = closedWonDeals.reduce((sum, d) => sum + (d.valueGbp || 0), 0);

  // 2. Active Pipeline Value
  const activePipelineDeals = deals.filter((d) => d.stage !== 'closed_lost');
  const totalPipelineGbp = activePipelineDeals.reduce((sum, d) => sum + (d.valueGbp || 0), 0);

  // 3. Pending & Overdue Invoices
  const pendingInvoiceDeals = deals.filter(
    (d) => d.stage === 'invoice_sent' || d.stage === 'payment_pending'
  );
  const pendingInvoicedGbp = pendingInvoiceDeals.reduce((sum, d) => sum + (d.valueGbp || 0), 0);

  const overdueDeals = pendingInvoiceDeals.filter((d) => checkInvoiceAging(d).isOverdue);
  const overdueGbp = overdueDeals.reduce((sum, d) => sum + (d.valueGbp || 0), 0);

  // 4. Meetings & Leads Calculations
  const totalInterested = masterRecords.filter((r) => r.status === 'interested').length;

  const totalScheduled =
    masterRecords.filter((r) => r.status === 'meeting_scheduled').length +
    deals.filter((d) => d.stage === 'discovery_pitch' && !d.meetingCompleted).length;

  // 1. All Completed Meetings (Meeting Done, In Conversation, Paid Client, Pipeline, and Sales Deal Lost DNC)
  const isMeetingDoneRecord = (r: MasterRecord) =>
    r.status === 'meeting_done' ||
    r.status === 'in_conversation' ||
    r.status === 'paid_client' ||
    r.status === 'demo_sent' ||
    r.status === 'invoice_sent' ||
    (r.status === 'dnc' && (r.meetingCompleted || r.notes?.includes('DEAL LOST') || r.auditHistory?.some((a) => a.action?.includes('Deal Lost'))));

  const doneEmails = new Set<string>();
  masterRecords.filter(isMeetingDoneRecord).forEach((r) => doneEmails.add(r.email.toLowerCase().trim()));
  deals.filter((d) => d.meetingCompleted).forEach((d) => doneEmails.add(d.email.toLowerCase().trim()));
  const totalMeetingDone = doneEmails.size;

  // 2. Quota-Eligible Meeting Score (Scheduled + Approved YES + In Conversation + Paid Client + Pipeline)
  const isCountYesRecord = (r: MasterRecord) =>
    r.status === 'in_conversation' ||
    r.status === 'paid_client' ||
    r.status === 'demo_sent' ||
    r.status === 'invoice_sent' ||
    (r.status === 'meeting_done' && r.meetingCountType === 'yes');

  const countYesEmails = new Set<string>();
  masterRecords.filter(isCountYesRecord).forEach((r) => countYesEmails.add(r.email.toLowerCase().trim()));
  deals.filter((d) => d.stage === 'closed_won' || (d.meetingCompleted && d.meetingCountType === 'yes')).forEach((d) => countYesEmails.add(d.email.toLowerCase().trim()));
  const totalMeetingCount = countYesEmails.size + totalScheduled;

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
      {/* KPI 1: Closed Won Revenue */}
      <div className="p-5 rounded-2xl bg-brand-navy border border-brand-green/30 shadow-card-dark relative overflow-hidden group hover:border-brand-green/60 transition-all flex flex-col justify-between">
        <div>
          <div className="flex items-center justify-between">
            <span className="text-xs font-mono uppercase tracking-wider text-brand-gray whitespace-nowrap">
              Closed Won Revenue
            </span>
            <div className="p-2 rounded-xl bg-brand-green/10 text-brand-green shrink-0">
              <PoundSterling className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-3">
            <div className="text-3xl font-bold font-sans text-brand-green tracking-tight whitespace-nowrap">
              {formatGbp(closedRevenueGbp)}
            </div>
          </div>
        </div>
        <div className="mt-2 pt-2 border-t border-white/5 flex items-center gap-1.5 text-xs text-brand-gray flex-wrap">
          <span className="text-brand-green font-semibold whitespace-nowrap">
            {closedWonDeals.length} Won Deals
          </span>
          <span className="whitespace-nowrap">· Paid in Full</span>
        </div>
      </div>

      {/* KPI 2: Total Opportunity Pipeline */}
      <div className="p-5 rounded-2xl bg-brand-navy border border-brand-cyan/30 shadow-card-dark relative overflow-hidden group hover:border-brand-cyan/60 transition-all flex flex-col justify-between">
        <div>
          <div className="flex items-center justify-between">
            <span className="text-xs font-mono uppercase tracking-wider text-brand-gray whitespace-nowrap">
              Active Pipeline Value
            </span>
            <div className="p-2 rounded-xl bg-brand-cyan/10 text-brand-cyan shrink-0">
              <TrendingUp className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-3">
            <div className="text-3xl font-bold font-sans text-brand-cyan tracking-tight whitespace-nowrap">
              {formatGbp(totalPipelineGbp)}
            </div>
          </div>
        </div>
        <div className="mt-2 pt-2 border-t border-white/5 flex items-center gap-1.5 text-xs text-brand-gray flex-wrap">
          <span className="text-brand-cyan font-semibold whitespace-nowrap">
            {activePipelineDeals.length} Active Deals
          </span>
          <span className="whitespace-nowrap">across Sales Team</span>
        </div>
      </div>

      {/* KPI 3: Invoices Pending & Overdue */}
      <div className="p-5 rounded-2xl bg-brand-navy border border-brand-orange/30 shadow-card-dark relative overflow-hidden group hover:border-brand-orange/60 transition-all flex flex-col justify-between">
        <div>
          <div className="flex items-center justify-between">
            <span className="text-xs font-mono uppercase tracking-wider text-brand-gray whitespace-nowrap">
              Invoiced Pending
            </span>
            <div className="p-2 rounded-xl bg-brand-orange/10 text-brand-orange shrink-0">
              {overdueDeals.length > 0 ? (
                <AlertTriangle className="w-5 h-5 animate-pulse" />
              ) : (
                <Clock className="w-5 h-5" />
              )}
            </div>
          </div>
          <div className="mt-3">
            <div className="text-3xl font-bold font-sans text-brand-white tracking-tight flex items-baseline gap-2 flex-wrap">
              <span className="whitespace-nowrap">{formatGbp(pendingInvoicedGbp)}</span>
              {overdueGbp > 0 && (
                <span className="text-xs font-mono font-semibold px-2 py-0.5 rounded bg-brand-orange/20 text-brand-orange border border-brand-orange/30 whitespace-nowrap shrink-0">
                  {formatGbp(overdueGbp)} Overdue
                </span>
              )}
            </div>
          </div>
        </div>
        <div className="mt-2 pt-2 border-t border-white/5 flex items-center gap-1.5 text-xs text-brand-gray flex-wrap">
          <span className="text-brand-orange font-semibold whitespace-nowrap">
            {pendingInvoiceDeals.length} Invoices Sent
          </span>
          <span className="whitespace-nowrap">({overdueDeals.length} &gt; 7 days)</span>
        </div>
      </div>

      {/* KPI 4: Meetings & Leads */}
      <div className="p-5 rounded-2xl bg-brand-navy border border-brand-cyan/20 shadow-card-dark relative overflow-hidden group hover:border-brand-cyan/40 transition-all flex flex-col justify-between">
        <div>
          <div className="flex items-center justify-between">
            <span className="text-xs font-mono uppercase tracking-wider text-brand-gray whitespace-nowrap">
              Meetings & Leads
            </span>
            <div className="p-2 rounded-xl bg-brand-cyan/10 text-brand-cyan shrink-0">
              <CalendarCheck className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-3">
            <div className="text-3xl font-bold font-sans text-brand-cyan tracking-tight flex items-baseline gap-2 flex-wrap">
              <span className="whitespace-nowrap">{totalMeetingCount}</span>
              <span className="text-xs font-mono font-semibold text-brand-gray whitespace-nowrap">Total Meeting Count</span>
            </div>
          </div>
        </div>
        <div className="mt-2 pt-2 border-t border-white/5 flex items-center gap-2 text-xs text-brand-gray font-mono flex-wrap">
          <span className="text-brand-cyan font-medium whitespace-nowrap shrink-0">{totalInterested} Interested</span>
          <span>·</span>
          <span className="text-yellow-400 font-medium whitespace-nowrap shrink-0">{totalScheduled} Scheduled</span>
          <span>·</span>
          <span className="text-brand-green font-semibold whitespace-nowrap shrink-0">{totalMeetingDone} Done</span>
        </div>
      </div>
    </div>
  );
};
