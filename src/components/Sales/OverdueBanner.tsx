import React, { useState } from 'react';
import {
  AlertTriangle,
  Clock,
  Send,
  Copy,
  Check,
  ChevronDown,
  ChevronUp,
  X,
  FileText,
} from 'lucide-react';
import { Deal } from '../../types';
import { formatGbp, checkInvoiceAging } from '../../lib/currency';

interface OverdueBannerProps {
  overdueDeals: Deal[];
  onOpenDeal: (deal: Deal) => void;
  onMarkPaid: (deal: Deal) => void;
}

export const OverdueBanner: React.FC<OverdueBannerProps> = ({
  overdueDeals,
  onOpenDeal,
  onMarkPaid,
}) => {
  if (overdueDeals.length === 0) return null;

  const [expanded, setExpanded] = useState(false);
  const [selectedTemplateDeal, setSelectedTemplateDeal] = useState<Deal | null>(null);
  const [copied, setCopied] = useState(false);

  const totalOverdueGbp = overdueDeals.reduce((sum, d) => sum + (d.valueGbp || 0), 0);

  const generateFollowUpEmail = (deal: Deal) => {
    const aging = checkInvoiceAging(deal);
    return `Subject: Follow-up regarding invoice ${deal.invoiceNumber || 'payment'} - ${deal.companyName}

Hi ${deal.contactName || 'there'},

I hope this email finds you well.

I am following up regarding invoice ${deal.invoiceNumber || 'reference'} for ${formatGbp(deal.valueGbp)}, which was sent on ${deal.invoiceDate || 'recently'} (${aging.daysElapsed} days ago).

Could you please confirm if this has been processed by your finance department, or if you require any additional details from our end?

Thank you,
${deal.salesRep}
Staff Asia / Ruhit Outreach Solutions`;
  };

  return (
    <div className="rounded-2xl bg-brand-orange/10 border border-brand-orange/40 shadow-orange-glow overflow-hidden transition-all">
      {/* Banner Top Row */}
      <div className="p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-brand-orange/20 border border-brand-orange/40 flex items-center justify-center text-brand-orange shrink-0 animate-pulse">
            <AlertTriangle className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-sm sm:text-base font-bold text-brand-white">
                {overdueDeals.length} Unpaid Invoices Exceed 7-Day Window ({formatGbp(totalOverdueGbp)})
              </h3>
              <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-brand-orange/20 text-brand-orange border border-brand-orange/40 animate-pulse">
                ACTION REQUIRED
              </span>
            </div>
            <p className="text-xs text-gray-300">
              Invoices have passed the sales team follow-up limit. Follow up with clients to expedite payment.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 self-end sm:self-auto">
          <button
            onClick={() => setExpanded(!expanded)}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-brand-black/60 border border-brand-orange/30 hover:border-brand-orange/60 text-xs font-semibold text-brand-orange hover:text-brand-white transition-colors"
          >
            <span>{expanded ? 'Hide Invoices' : `View ${overdueDeals.length} Invoices`}</span>
            {expanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
          </button>
        </div>
      </div>

      {/* Expanded List of Overdue Deals */}
      {expanded && (
        <div className="p-4 sm:p-5 bg-brand-black/60 border-t border-brand-orange/20 space-y-3">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
            {overdueDeals.map((deal) => {
              const aging = checkInvoiceAging(deal);
              return (
                <div
                  key={deal.id}
                  className="p-3.5 rounded-xl bg-brand-navy border border-brand-midnight hover:border-brand-orange/50 transition-all space-y-2 relative group"
                >
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <h4 className="text-xs font-bold text-brand-white group-hover:text-brand-cyan transition-colors">
                        {deal.companyName}
                      </h4>
                      <p className="text-[11px] text-brand-gray font-mono">
                        {deal.invoiceNumber || 'No Ref'} · Sent {deal.invoiceDate}
                      </p>
                    </div>
                    <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-red-500/20 text-red-400 border border-red-500/30">
                      {aging.daysElapsed} days ({aging.daysElapsed - 7}d overdue)
                    </span>
                  </div>

                  <div className="flex items-center justify-between text-xs pt-1 border-t border-white/5 font-mono">
                    <span className="text-brand-gray">Rep: <strong className="text-brand-white">{deal.salesRep}</strong></span>
                    <span className="text-brand-green font-bold text-sm">{formatGbp(deal.valueGbp)}</span>
                  </div>

                  {/* Actions */}
                  <div className="pt-2 flex items-center justify-between gap-2">
                    <button
                      onClick={() => setSelectedTemplateDeal(deal)}
                      className="flex items-center gap-1 text-[11px] font-medium text-brand-cyan hover:underline"
                    >
                      <Send className="w-3 h-3" />
                      <span>Follow-up Script</span>
                    </button>

                    <div className="flex items-center gap-1.5">
                      <button
                        onClick={() => onOpenDeal(deal)}
                        className="px-2 py-1 rounded bg-brand-black border border-white/10 text-[11px] text-brand-white hover:border-brand-cyan/40 transition-colors"
                      >
                        Edit
                      </button>
                      <button
                        onClick={() => onMarkPaid(deal)}
                        className="px-2.5 py-1 rounded bg-brand-green text-brand-black font-bold text-[11px] hover:brightness-110 transition-colors"
                      >
                        Mark Paid
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Follow-up Email Template Preview Modal */}
      {selectedTemplateDeal && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-brand-navy border border-brand-midnight rounded-2xl w-full max-w-lg overflow-hidden shadow-2xl animate-scale-up">
            <div className="px-5 py-4 bg-brand-black border-b border-brand-midnight flex items-center justify-between">
              <div className="flex items-center gap-2">
                <FileText className="w-4 h-4 text-brand-cyan" />
                <h4 className="text-sm font-bold text-brand-white">
                  Payment Reminder Email Template ({selectedTemplateDeal.companyName})
                </h4>
              </div>
              <button
                onClick={() => setSelectedTemplateDeal(null)}
                className="text-brand-gray hover:text-white p-1"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="p-5 space-y-4">
              <textarea
                readOnly
                rows={10}
                value={generateFollowUpEmail(selectedTemplateDeal)}
                className="w-full p-3.5 rounded-xl bg-brand-black border border-brand-midnight text-xs font-mono text-brand-white focus:outline-none"
              />

              <div className="flex items-center justify-between">
                <span className="text-[11px] text-brand-gray font-mono">
                  Ready to copy and send via Gmail / Outlook
                </span>
                <button
                  onClick={() => {
                    navigator.clipboard.writeText(generateFollowUpEmail(selectedTemplateDeal));
                    setCopied(true);
                    setTimeout(() => setCopied(false), 2000);
                  }}
                  className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-brand-cyan text-brand-black font-bold text-xs hover:brightness-110 active:scale-95 transition-all shadow-cyan-glow"
                >
                  {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                  <span>{copied ? 'Copied to Clipboard!' : 'Copy Template'}</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
