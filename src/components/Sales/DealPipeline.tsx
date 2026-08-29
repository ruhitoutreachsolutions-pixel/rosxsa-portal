import React, { useState } from 'react';
import {
  Kanban,
  List,
  Plus,
  PoundSterling,
  AlertTriangle,
  Search,
  GripVertical,
  Calendar,
  Send,
  Video,
  FileText,
  CreditCard,
  Clock,
  Sparkles,
} from 'lucide-react';
import { Deal, DealStage, TeamMember } from '../../types';
import { formatGbp, checkInvoiceAging } from '../../lib/currency';
import { OverdueBanner } from './OverdueBanner';

interface DealPipelineProps {
  deals: Deal[];
  teamMembers: TeamMember[];
  onOpenNewDeal: () => void;
  onEditDeal: (deal: Deal) => void;
  onMarkPaid: (deal: Deal) => void;
  onUpdateDealStage?: (dealId: string, newStage: DealStage) => void;
}

// Compact date formatting helper (e.g. 2026-08-17 -> 17 Aug)
const formatDateCompact = (dateStr?: string): string => {
  if (!dateStr) return '';
  const parts = dateStr.split('T')[0].split('-');
  if (parts.length === 3) {
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    const mIndex = parseInt(parts[1], 10) - 1;
    const day = parseInt(parts[2], 10);
    if (!isNaN(mIndex) && mIndex >= 0 && mIndex < 12 && !isNaN(day)) {
      return `${day} ${months[mIndex]}`;
    }
  }
  return dateStr;
};

export const DealPipeline: React.FC<DealPipelineProps> = ({
  deals,
  teamMembers,
  onOpenNewDeal,
  onEditDeal,
  onMarkPaid,
  onUpdateDealStage,
}) => {
  const salesReps = teamMembers.filter((m) => m.role === 'sales');

  const [selectedRepFilter, setSelectedRepFilter] = useState<string>('all');
  const [viewMode, setViewMode] = useState<'kanban' | 'table'>('kanban');
  const [searchQuery, setSearchQuery] = useState('');
  const [stageFilter, setStageFilter] = useState<string>('all');
  const [draggedDealId, setDraggedDealId] = useState<string | null>(null);
  const [dragOverStage, setDragOverStage] = useState<DealStage | null>(null);

  // ALL 5 STAGES OF SALES LIFECYCLE
  const stages: {
    id: DealStage;
    label: string;
    icon: React.ElementType;
    color: string;
    borderHover: string;
  }[] = [
    {
      id: 'discovery_pitch',
      label: 'Discovery / Pitch Call',
      icon: Video,
      color: 'border-brand-cyan/40 text-brand-cyan',
      borderHover: 'border-brand-cyan bg-brand-cyan/5',
    },
    {
      id: 'demo_sent',
      label: 'Demo Sent',
      icon: Send,
      color: 'border-blue-400/40 text-blue-400',
      borderHover: 'border-blue-400 bg-blue-400/5',
    },
    {
      id: 'invoice_sent',
      label: 'Invoice & Agreement Sent',
      icon: FileText,
      color: 'border-brand-orange/40 text-brand-orange',
      borderHover: 'border-brand-orange bg-brand-orange/5',
    },
    {
      id: 'payment_pending',
      label: 'Payment Pending',
      icon: Clock,
      color: 'border-yellow-400/40 text-yellow-400',
      borderHover: 'border-yellow-400 bg-yellow-400/5',
    },
    {
      id: 'closed_won',
      label: 'Paid & Closed Won',
      icon: CreditCard,
      color: 'border-brand-green/40 text-brand-green',
      borderHover: 'border-brand-green bg-brand-green/5',
    },
  ];

  // Overdue deals calculation (for invoices sent / payment pending > 7 days)
  const overdueDeals = deals.filter(
    (d) =>
      (d.stage === 'invoice_sent' || d.stage === 'payment_pending') &&
      checkInvoiceAging(d).isOverdue
  );

  // Filtered Deals
  const filteredDeals = deals.filter((deal) => {
    if (selectedRepFilter !== 'all' && deal.salesRep !== selectedRepFilter) return false;
    if (stageFilter === 'overdue') {
      return (
        (deal.stage === 'invoice_sent' || deal.stage === 'payment_pending') &&
        checkInvoiceAging(deal).isOverdue
      );
    } else if (stageFilter === 'invoices') {
      return deal.stage === 'invoice_sent' || deal.stage === 'payment_pending';
    } else if (stageFilter !== 'all' && deal.stage !== stageFilter) {
      return false;
    }

    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      return (
        deal.companyName.toLowerCase().includes(q) ||
        deal.title.toLowerCase().includes(q) ||
        deal.email.toLowerCase().includes(q) ||
        deal.salesRep.toLowerCase().includes(q) ||
        (deal.invoiceNumber && deal.invoiceNumber.toLowerCase().includes(q))
      );
    }
    return true;
  });

  // DRAG & DROP HANDLERS
  const handleDragStart = (e: React.DragEvent, dealId: string) => {
    e.dataTransfer.setData('text/plain', dealId);
    setDraggedDealId(dealId);
  };

  const handleDragOver = (e: React.DragEvent, stageId: DealStage) => {
    e.preventDefault();
    if (dragOverStage !== stageId) {
      setDragOverStage(stageId);
    }
  };

  const handleDragLeave = () => {
    setDragOverStage(null);
  };

  const handleDrop = (e: React.DragEvent, targetStage: DealStage) => {
    e.preventDefault();
    setDragOverStage(null);
    const dealId = e.dataTransfer.getData('text/plain') || draggedDealId;

    if (dealId) {
      const deal = deals.find((d) => d.id === dealId);
      if (deal && deal.stage !== targetStage) {
        if (targetStage === 'closed_won') {
          onMarkPaid(deal);
        } else if (onUpdateDealStage) {
          onUpdateDealStage(dealId, targetStage);
        }
      }
    }
    setDraggedDealId(null);
  };

  // Helper to format relevant stage date with compact non-overflowing text
  const getStageDateLabel = (deal: Deal) => {
    if (deal.stage === 'discovery_pitch') {
      const d = deal.discoveryDate || deal.meetingScheduledDate;
      return {
        label: d ? `Call: ${formatDateCompact(d)}` : 'Call Done',
        fullDate: d || '',
        tagColor: 'text-brand-cyan bg-brand-cyan/10 border-brand-cyan/30',
      };
    }
    if (deal.stage === 'demo_sent') {
      const d = deal.demoSentDate;
      return {
        label: d ? `Demo: ${formatDateCompact(d)}` : 'Demo Sent',
        fullDate: d || '',
        tagColor: 'text-blue-400 bg-blue-500/10 border-blue-400/30',
      };
    }
    if (deal.stage === 'invoice_sent') {
      const d = deal.invoiceDate;
      return {
        label: d ? `Sent: ${formatDateCompact(d)}` : 'Invoice Sent',
        fullDate: d || '',
        tagColor: 'text-brand-orange bg-brand-orange/10 border-brand-orange/30',
      };
    }
    if (deal.stage === 'payment_pending') {
      const aging = checkInvoiceAging(deal);
      return {
        label: aging.isOverdue
          ? `⚠️ ${aging.daysElapsed}d overdue`
          : `Due: ${formatDateCompact(deal.invoiceDate)}`,
        fullDate: deal.invoiceDate || '',
        tagColor: aging.isOverdue
          ? 'text-brand-orange bg-brand-orange/20 border-brand-orange/40 font-bold'
          : 'text-yellow-400 bg-yellow-400/10 border-yellow-400/30',
      };
    }
    if (deal.stage === 'closed_won') {
      const d = deal.paidDate;
      return {
        label: d ? `Paid: ${formatDateCompact(d)}` : 'Paid & Won',
        fullDate: d || '',
        tagColor: 'text-brand-green bg-brand-green/10 border-brand-green/30 font-bold',
      };
    }
    return {
      label: formatDateCompact(deal.createdAt),
      fullDate: deal.createdAt,
      tagColor: 'text-brand-gray bg-white/5 border-white/10',
    };
  };

  return (
    <div className="space-y-6">
      {/* 7-Day Overdue Banner */}
      <OverdueBanner
        overdueDeals={overdueDeals}
        onOpenDeal={onEditDeal}
        onMarkPaid={onMarkPaid}
      />

      {/* Controls & Filter Bar */}
      <div className="p-5 rounded-2xl bg-brand-navy border border-brand-midnight shadow-card-dark flex flex-col md:flex-row md:items-center justify-between gap-4">
        {/* Left: Title & Quick Stats */}
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-xl font-bold text-brand-white">Sales Pipeline & Stage Tracking</h2>
            <span className="text-xs font-mono px-2 py-0.5 rounded bg-brand-cyan/10 text-brand-cyan border border-brand-cyan/20">
              {filteredDeals.length} Deals
            </span>
          </div>
          <p className="text-xs text-brand-gray mt-0.5">
            5 Stages: Discovery Call ➔ Demo Sent ➔ Invoice & Agreement ➔ Payment Pending ➔ Paid & Won
          </p>
        </div>

        {/* Right: Filters, Search & Action Button */}
        <div className="flex flex-wrap items-center gap-2.5">
          {/* Search */}
          <div className="relative">
            <Search className="w-3.5 h-3.5 text-brand-gray absolute left-2.5 top-2.5" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search deals, clients..."
              className="pl-8 pr-3 py-1.5 rounded-xl bg-brand-black border border-brand-midnight text-xs text-brand-white placeholder-brand-gray focus:outline-none focus:border-brand-cyan"
            />
          </div>

          {/* Rep Filter */}
          <select
            value={selectedRepFilter}
            onChange={(e) => setSelectedRepFilter(e.target.value)}
            className="px-3 py-1.5 rounded-xl bg-brand-black border border-brand-midnight text-xs text-brand-white font-medium focus:outline-none focus:border-brand-cyan"
          >
            <option value="all">All Sales Reps ({salesReps.length})</option>
            {salesReps.map((rep) => (
              <option key={rep.id} value={rep.name}>
                {rep.name}
              </option>
            ))}
          </select>

          {/* Stage Filter */}
          <select
            value={stageFilter}
            onChange={(e) => setStageFilter(e.target.value)}
            className="px-3 py-1.5 rounded-xl bg-brand-black border border-brand-midnight text-xs text-brand-white font-medium focus:outline-none focus:border-brand-cyan"
          >
            <option value="all">All Stages</option>
            <option value="discovery_pitch">Discovery / Pitch</option>
            <option value="demo_sent">Demo Sent</option>
            <option value="invoice_sent">Invoice & Agreement Sent</option>
            <option value="payment_pending">Payment Pending</option>
            <option value="overdue">⚠️ Overdue Invoices ({overdueDeals.length})</option>
            <option value="closed_won">Paid & Closed Won</option>
          </select>

          {/* View Mode Toggle */}
          <div className="flex items-center bg-brand-black p-1 rounded-xl border border-brand-midnight">
            <button
              onClick={() => setViewMode('kanban')}
              className={`p-1.5 rounded-lg transition-colors ${
                viewMode === 'kanban'
                  ? 'bg-brand-cyan text-brand-black font-bold'
                  : 'text-brand-gray hover:text-brand-white'
              }`}
              title="Kanban Board View (Drag & Drop)"
            >
              <Kanban className="w-4 h-4" />
            </button>
            <button
              onClick={() => setViewMode('table')}
              className={`p-1.5 rounded-lg transition-colors ${
                viewMode === 'table'
                  ? 'bg-brand-cyan text-brand-black font-bold'
                  : 'text-brand-gray hover:text-brand-white'
              }`}
              title="List Table View"
            >
              <List className="w-4 h-4" />
            </button>
          </div>

          {/* Add Deal Button */}
          <button
            onClick={onOpenNewDeal}
            className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-brand-green text-brand-black font-bold text-xs hover:brightness-110 active:scale-95 transition-all shadow-green-glow whitespace-nowrap"
          >
            <Plus className="w-4 h-4" />
            <span>+ Add Deal / Stage</span>
          </button>
        </div>
      </div>

      {/* Pipeline Content */}
      {viewMode === 'kanban' ? (
        /* KANBAN BOARD WITH 5 DRAG & DROP STAGES WRAPPED IN HORIZONTAL SCROLLER */
        <div className="overflow-x-auto pb-4">
          <div className="grid grid-cols-1 md:grid-cols-3 xl:grid-cols-5 gap-3.5 min-w-[1150px]">
            {stages.map((stg) => {
              const stageDeals = filteredDeals.filter((d) => d.stage === stg.id);
              const totalStageGbp = stageDeals.reduce((sum, d) => sum + (d.valueGbp || 0), 0);
              const isDragOver = dragOverStage === stg.id;
              const StageIcon = stg.icon;

              return (
                <div
                  key={stg.id}
                  onDragOver={(e) => handleDragOver(e, stg.id)}
                  onDragLeave={handleDragLeave}
                  onDrop={(e) => handleDrop(e, stg.id)}
                  className={`rounded-2xl bg-brand-navy border p-3.5 flex flex-col justify-between shadow-card-dark space-y-3 min-h-[480px] transition-all min-w-[220px] ${
                    isDragOver
                      ? `${stg.borderHover} shadow-cyan-glow scale-[1.01]`
                      : 'border-brand-midnight'
                  }`}
                >
                  {/* Column Header */}
                  <div className="space-y-1 pb-2 border-b border-brand-midnight">
                    <div className="flex items-center justify-between gap-1.5">
                      <div className="flex items-center gap-1.5 min-w-0">
                        <StageIcon className="w-3.5 h-3.5 shrink-0" />
                        <span className={`text-[11px] font-bold font-mono uppercase tracking-wider whitespace-nowrap truncate ${stg.color}`}>
                          {stg.label}
                        </span>
                      </div>
                      <span className="text-xs font-mono font-semibold px-2 py-0.5 rounded-full bg-brand-black border border-white/10 text-brand-white shrink-0">
                        {stageDeals.length}
                      </span>
                    </div>
                    <div className="text-xs font-bold font-mono text-brand-gray">
                      {formatGbp(totalStageGbp)}
                    </div>
                  </div>

                  {/* Deal Cards Container */}
                  <div className="flex-1 space-y-2.5 overflow-y-auto max-h-[640px] pr-1">
                    {stageDeals.length === 0 ? (
                      <div className="text-center py-20 text-brand-gray text-xs border border-dashed border-white/5 rounded-xl">
                        Drop deals here
                      </div>
                    ) : (
                      stageDeals.map((deal) => {
                        const isDragging = draggedDealId === deal.id;
                        const dateInfo = getStageDateLabel(deal);
                        const hasPrice = deal.valueGbp > 0;

                        return (
                          <div
                            key={deal.id}
                            draggable={true}
                            onDragStart={(e) => handleDragStart(e, deal.id)}
                            className={`p-3 rounded-xl bg-brand-black border border-brand-midnight hover:border-brand-cyan/50 transition-all space-y-2 group relative shadow-sm cursor-grab active:cursor-grabbing w-full max-w-full overflow-hidden ${
                              isDragging ? 'opacity-40 scale-95' : 'hover:-translate-y-0.5'
                            }`}
                          >
                            {/* Top Row: Rep Tag + Stage Date Tag (100% Inside Container) */}
                            <div className="flex items-center justify-between gap-1.5 min-w-0 w-full">
                              <div className="flex items-center gap-1 min-w-0 shrink">
                                <GripVertical className="w-3.5 h-3.5 text-brand-gray opacity-40 group-hover:opacity-100 shrink-0" />
                                <span className="text-[10px] font-semibold px-2 py-0.5 rounded bg-brand-navy border border-white/10 text-brand-cyan font-mono truncate">
                                  {deal.salesRep}
                                </span>
                              </div>

                              {/* Stage Date (Guaranteed Inside Container) */}
                              <span
                                title={dateInfo.fullDate}
                                className={`text-[10px] font-mono px-2 py-0.5 rounded border whitespace-nowrap shrink-0 text-right ${dateInfo.tagColor}`}
                              >
                                {dateInfo.label}
                              </span>
                            </div>

                            {/* Company Name & Context */}
                            <div>
                              <h4 className="text-xs font-bold text-brand-white group-hover:text-brand-cyan transition-colors truncate">
                                {deal.companyName}
                              </h4>
                              <p className="text-[11px] text-brand-gray truncate">
                                {deal.title}
                              </p>
                            </div>

                            {/* Pricing / Info Sent Badge */}
                            <div className="flex items-center justify-between pt-1 border-t border-white/5">
                              {hasPrice ? (
                                <span className="text-xs font-bold font-mono text-brand-green whitespace-nowrap">
                                  {formatGbp(deal.valueGbp)}
                                </span>
                              ) : (
                                <span className="text-[10px] font-mono font-semibold px-2 py-0.5 rounded bg-brand-cyan/15 text-brand-cyan border border-brand-cyan/30 whitespace-nowrap">
                                  ℹ️ Info Sent (Pricing TBD)
                                </span>
                              )}

                              {deal.invoiceNumber && (
                                <span className="text-[10px] text-brand-gray font-mono whitespace-nowrap">
                                  #{deal.invoiceNumber}
                                </span>
                              )}
                            </div>

                            {/* Actions */}
                            <div className="pt-1.5 flex items-center justify-between gap-1 border-t border-white/5">
                              <button
                                onClick={() => onEditDeal(deal)}
                                className="text-[11px] text-brand-gray hover:text-brand-white transition-colors whitespace-nowrap"
                              >
                                Edit Details
                              </button>

                              {deal.stage !== 'closed_won' && (
                                <button
                                  onClick={() => onMarkPaid(deal)}
                                  className="px-2 py-0.5 rounded bg-brand-green/20 text-brand-green hover:bg-brand-green hover:text-brand-black text-[10px] font-bold transition-all whitespace-nowrap"
                                >
                                  Mark Paid
                                </button>
                              )}
                            </div>
                          </div>
                        );
                      })
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      ) : (
        /* TABLE VIEW WITH ALL 5 STAGES & DATES */
        <div className="p-6 rounded-2xl bg-brand-navy border border-brand-midnight shadow-card-dark overflow-x-auto">
          <table className="w-full text-left text-xs min-w-[950px]">
            <thead>
              <tr className="border-b border-brand-midnight text-brand-gray font-mono uppercase tracking-wider">
                <th className="py-3 px-3.5 min-w-[200px] whitespace-nowrap">Company / Client</th>
                <th className="py-3 px-3.5 w-32 whitespace-nowrap">Sales Rep</th>
                <th className="py-3 px-3.5 w-48 whitespace-nowrap">Stage</th>
                <th className="py-3 px-3.5 w-36 whitespace-nowrap">Opportunity / Value</th>
                <th className="py-3 px-3.5 min-w-[180px] whitespace-nowrap">Tracked Stage Date</th>
                <th className="py-3 px-3.5 min-w-[140px] whitespace-nowrap">Aging / Invoicing</th>
                <th className="py-3 px-3.5 w-40 text-right whitespace-nowrap">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-brand-midnight/60">
              {filteredDeals.map((deal) => {
                const aging = checkInvoiceAging(deal);
                const dateInfo = getStageDateLabel(deal);

                return (
                  <tr key={deal.id} className="hover:bg-brand-black/50 transition-colors">
                    <td className="py-3 px-3.5">
                      <div className="font-bold text-brand-white">{deal.companyName}</div>
                      <div className="text-[11px] text-brand-gray font-mono">{deal.email}</div>
                    </td>
                    <td className="py-3 px-3.5 font-semibold text-brand-cyan whitespace-nowrap">
                      {deal.salesRep}
                    </td>
                    <td className="py-3 px-3.5">
                      <select
                        value={deal.stage}
                        onChange={(e) =>
                          onUpdateDealStage &&
                          onUpdateDealStage(deal.id, e.target.value as DealStage)
                        }
                        className="px-2.5 py-1 rounded-lg bg-brand-midnight text-brand-white border border-white/10 text-xs font-semibold focus:outline-none focus:border-brand-cyan whitespace-nowrap"
                      >
                        <option value="discovery_pitch">1. Discovery / Pitch Call</option>
                        <option value="demo_sent">2. Demo Sent</option>
                        <option value="invoice_sent">3. Invoice & Agreement Sent</option>
                        <option value="payment_pending">4. Payment Pending</option>
                        <option value="closed_won">5. Paid & Closed Won</option>
                        <option value="closed_lost">Closed Lost</option>
                      </select>
                    </td>
                    <td className="py-3 px-3.5 font-mono whitespace-nowrap">
                      {deal.valueGbp > 0 ? (
                        <span className="font-bold text-brand-green text-sm">
                          {formatGbp(deal.valueGbp)}
                        </span>
                      ) : (
                        <span className="text-[11px] text-brand-cyan font-semibold">
                          Info Sent
                        </span>
                      )}
                    </td>
                    <td className="py-3 px-3.5 whitespace-nowrap">
                      <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-mono ${dateInfo.tagColor}`}>
                        {dateInfo.label}
                      </span>
                    </td>
                    <td className="py-3 px-3.5 whitespace-nowrap">
                      {deal.stage === 'invoice_sent' || deal.stage === 'payment_pending' ? (
                        aging.statusLabel === 'overdue' ? (
                          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded bg-brand-orange/20 text-brand-orange border border-brand-orange/40 font-mono font-bold text-[10px] animate-pulse">
                            <AlertTriangle className="w-3 h-3 shrink-0" />
                            <span>{aging.daysElapsed}d ({aging.daysElapsed - 7}d overdue)</span>
                          </span>
                        ) : (
                          <span className="text-brand-gray font-mono text-xs">
                            #{deal.invoiceNumber || 'INV'} · {aging.daysElapsed}d elapsed
                          </span>
                        )
                      ) : deal.stage === 'closed_won' ? (
                        <span className="text-brand-green font-mono font-semibold text-xs">
                          ✓ Paid in Full
                        </span>
                      ) : (
                        <span className="text-brand-gray font-mono text-xs">—</span>
                      )}
                    </td>
                    <td className="py-3 px-3.5 text-right space-x-2 whitespace-nowrap">
                      <button
                        onClick={() => onEditDeal(deal)}
                        className="px-2.5 py-1 rounded-lg bg-brand-black border border-white/10 text-brand-white hover:border-brand-cyan text-xs font-semibold whitespace-nowrap"
                      >
                        Edit
                      </button>
                      {deal.stage !== 'closed_won' && (
                        <button
                          onClick={() => onMarkPaid(deal)}
                          className="px-2.5 py-1 rounded-lg bg-brand-green text-brand-black font-bold text-xs hover:brightness-110 whitespace-nowrap"
                        >
                          Mark Paid
                        </button>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};
