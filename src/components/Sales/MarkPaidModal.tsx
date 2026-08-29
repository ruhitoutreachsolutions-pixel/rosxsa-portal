import React, { useState } from 'react';
import {
  X,
  CheckCircle2,
  PoundSterling,
  Calendar,
  Sparkles,
  ShieldCheck,
} from 'lucide-react';
import confetti from 'canvas-confetti';
import { Deal } from '../../types';
import { formatGbp } from '../../lib/currency';

interface MarkPaidModalProps {
  isOpen: boolean;
  onClose: () => void;
  deal: Deal | null;
  onConfirmPaid: (dealId: string, paidDate: string, notes?: string) => void;
}

export const MarkPaidModal: React.FC<MarkPaidModalProps> = ({
  isOpen,
  onClose,
  deal,
  onConfirmPaid,
}) => {
  if (!isOpen || !deal) return null;

  const [paidDate, setPaidDate] = useState(
    new Date().toISOString().split('T')[0]
  );
  const [receivedNotes, setReceivedNotes] = useState('Payment received in full via UK bank transfer.');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    // Trigger celebratory confetti effect
    try {
      confetti({
        particleCount: 80,
        spread: 70,
        origin: { y: 0.6 },
        colors: ['#00C2FF', '#00E5A0', '#F97316', '#FFFFFF'],
      });
    } catch (e) {
      // ignore
    }

    onConfirmPaid(deal.id, paidDate, receivedNotes);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-black/75 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-brand-navy border border-brand-green/40 rounded-2xl w-full max-w-md overflow-hidden shadow-green-glow animate-scale-up">
        {/* Header */}
        <div className="px-6 py-4 bg-brand-black border-b border-brand-midnight flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-brand-green/20 border border-brand-green/40 flex items-center justify-center text-brand-green">
              <CheckCircle2 className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-base font-bold text-brand-white">Mark Invoice as Paid</h3>
              <p className="text-xs text-brand-gray">Confirm receipt and record closed revenue</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-brand-gray hover:text-brand-white hover:bg-brand-midnight transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {/* Deal Summary Box */}
          <div className="p-4 rounded-xl bg-brand-black border border-white/10 space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs text-brand-gray">Client / Company</span>
              <span className="text-xs font-bold text-brand-white">{deal.companyName}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-xs text-brand-gray">Sales Rep</span>
              <span className="text-xs font-semibold text-brand-cyan">{deal.salesRep}</span>
            </div>
            <div className="flex items-center justify-between pt-2 border-t border-white/5">
              <span className="text-xs font-mono uppercase text-brand-green font-bold">Total Closed Value</span>
              <span className="text-xl font-bold font-mono text-brand-green">
                {formatGbp(deal.valueGbp)}
              </span>
            </div>
          </div>

          {/* Paid Date */}
          <div>
            <label className="block text-xs font-mono uppercase text-brand-gray mb-1.5">
              Payment Received Date <span className="text-brand-green">*</span>
            </label>
            <div className="relative">
              <Calendar className="w-4 h-4 text-brand-gray absolute left-3 top-2.5" />
              <input
                type="date"
                required
                value={paidDate}
                onChange={(e) => setPaidDate(e.target.value)}
                className="w-full pl-9 pr-3 py-2 rounded-xl bg-brand-black border border-brand-midnight text-xs text-brand-white font-mono focus:outline-none focus:border-brand-green"
              />
            </div>
          </div>

          {/* Payment Notes */}
          <div>
            <label className="block text-xs font-mono uppercase text-brand-gray mb-1.5">
              Receipt Notes / Method
            </label>
            <textarea
              rows={2}
              value={receivedNotes}
              onChange={(e) => setReceivedNotes(e.target.value)}
              placeholder="e.g. Paid via Stripe / Bank Transfer ref: SA-9021"
              className="w-full px-3 py-2 rounded-xl bg-brand-black border border-brand-midnight text-xs text-brand-white placeholder-brand-gray focus:outline-none focus:border-brand-green"
            />
          </div>

          {/* Automatic Client Protection Notice */}
          <div className="p-3 rounded-xl bg-brand-cyan/10 border border-brand-cyan/20 flex items-start gap-2.5">
            <ShieldCheck className="w-4 h-4 text-brand-cyan shrink-0 mt-0.5" />
            <p className="text-[11px] text-gray-300 leading-relaxed">
              <strong>Automatic Protection:</strong> Upon marking as paid, <span className="text-brand-cyan font-mono">{deal.domain}</span> will be permanently locked in the Master Database as an Active Paid Client.
            </p>
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
              className="px-5 py-2.5 rounded-xl bg-brand-green text-brand-black font-bold text-xs hover:brightness-110 active:scale-95 transition-all shadow-green-glow flex items-center gap-1.5"
            >
              <Sparkles className="w-4 h-4 fill-current" />
              <span>Confirm Payment & Close Won</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
