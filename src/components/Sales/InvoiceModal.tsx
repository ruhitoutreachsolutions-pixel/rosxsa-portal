import React, { useState, useEffect } from 'react';
import {
  X,
  PoundSterling,
  Building,
  User,
  Calendar,
  Clock,
  FileText,
  CheckCircle2,
  AlertCircle,
  Video,
  Send,
  CreditCard,
  Sparkles,
} from 'lucide-react';
import { Deal, DealStage, TeamMember } from '../../types';
import { extractNormalizedDomain } from '../../lib/collisionEngine';

interface InvoiceModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSaveDeal: (deal: Deal) => void;
  dealToEdit?: Deal | null;
  teamMembers: TeamMember[];
}

export const InvoiceModal: React.FC<InvoiceModalProps> = ({
  isOpen,
  onClose,
  onSaveDeal,
  dealToEdit,
  teamMembers,
}) => {
  if (!isOpen) return null;

  const salesReps = teamMembers.filter((m) => m.role === 'sales');
  const leadGenReps = teamMembers.filter((m) => m.role === 'lead_gen');

  const todayStr = new Date().toISOString().split('T')[0];

  const [title, setTitle] = useState('');
  const [companyName, setCompanyName] = useState('');
  const [contactName, setContactName] = useState('');
  const [email, setEmail] = useState('');
  const [stage, setStage] = useState<DealStage>('discovery_pitch');
  const [hasPricingGiven, setHasPricingGiven] = useState(true);
  const [valueGbp, setValueGbp] = useState('2000');

  // Stage Specific Dates
  const [discoveryDate, setDiscoveryDate] = useState(todayStr);
  const [demoSentDate, setDemoSentDate] = useState(todayStr);
  const [invoiceDate, setInvoiceDate] = useState(todayStr);
  const [paidDate, setPaidDate] = useState(todayStr);

  const [invoiceNumber, setInvoiceNumber] = useState('');
  const [followUpDays, setFollowUpDays] = useState(7);
  const [salesRep, setSalesRep] = useState(salesReps[0]?.name || 'Farzan');
  const [leadGenRep, setLeadGenRep] = useState(leadGenReps[0]?.name || 'Ruhit');
  const [notes, setNotes] = useState('');

  useEffect(() => {
    if (dealToEdit) {
      setTitle(dealToEdit.title);
      setCompanyName(dealToEdit.companyName);
      setContactName(dealToEdit.contactName || '');
      setEmail(dealToEdit.email);
      setStage(dealToEdit.stage);
      setHasPricingGiven(dealToEdit.hasPricingGiven !== false && dealToEdit.valueGbp > 0);
      setValueGbp(dealToEdit.valueGbp ? dealToEdit.valueGbp.toString() : '');
      setDiscoveryDate(dealToEdit.discoveryDate || dealToEdit.meetingScheduledDate || todayStr);
      setDemoSentDate(dealToEdit.demoSentDate || todayStr);
      setInvoiceDate(dealToEdit.invoiceDate || todayStr);
      setPaidDate(dealToEdit.paidDate || todayStr);
      setInvoiceNumber(dealToEdit.invoiceNumber || '');
      setFollowUpDays(dealToEdit.followUpDays || 7);
      setSalesRep(dealToEdit.salesRep);
      setLeadGenRep(dealToEdit.leadGenRep || leadGenReps[0]?.name || 'Ruhit');
      setNotes(dealToEdit.notes || '');
    } else {
      setTitle('');
      setCompanyName('');
      setContactName('');
      setEmail('');
      setStage('discovery_pitch');
      setHasPricingGiven(false);
      setValueGbp('');
      setDiscoveryDate(todayStr);
      setDemoSentDate(todayStr);
      setInvoiceDate(todayStr);
      setPaidDate(todayStr);
      setInvoiceNumber(`INV-2025-${Math.floor(100 + Math.random() * 900)}`);
      setFollowUpDays(7);
      setSalesRep(salesReps[0]?.name || 'Farzan');
      setLeadGenRep(leadGenReps[0]?.name || 'Ruhit');
      setNotes('');
    }
  }, [dealToEdit]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!companyName.trim() || !email.trim()) return;

    const domain = extractNormalizedDomain(email);
    const parsedVal = hasPricingGiven ? parseFloat(valueGbp) || 0 : 0;

    const deal: Deal = {
      id: dealToEdit ? dealToEdit.id : `deal-${Date.now()}`,
      title: title.trim() || `${companyName} Partnership`,
      companyName: companyName.trim(),
      contactName: contactName.trim() || undefined,
      email: email.trim().toLowerCase(),
      domain: domain || 'unknown',
      valueGbp: parsedVal,
      stage,
      hasPricingGiven,
      discoveryDate: stage === 'discovery_pitch' ? discoveryDate : (dealToEdit?.discoveryDate || discoveryDate),
      demoSentDate: stage === 'demo_sent' ? demoSentDate : (dealToEdit?.demoSentDate || demoSentDate),
      invoiceDate: (stage === 'invoice_sent' || stage === 'payment_pending' || stage === 'closed_won') ? invoiceDate : undefined,
      invoiceNumber: (stage === 'invoice_sent' || stage === 'payment_pending' || stage === 'closed_won') ? invoiceNumber : undefined,
      paidDate: stage === 'closed_won' ? paidDate : undefined,
      meetingCompleted: true,
      followUpDays: followUpDays || 7,
      salesRep,
      leadGenRep,
      notes: notes.trim() || undefined,
      createdAt: dealToEdit ? dealToEdit.createdAt : new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    onSaveDeal(deal);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-brand-navy border border-brand-midnight rounded-2xl w-full max-w-2xl overflow-hidden shadow-2xl animate-scale-up">
        {/* Header */}
        <div className="px-6 py-4 bg-brand-black border-b border-brand-midnight flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-brand-cyan/10 border border-brand-cyan/30 flex items-center justify-center text-brand-cyan">
              <FileText className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-base font-bold text-brand-white">
                {dealToEdit ? 'Edit Sales Deal / Stage' : 'New Sales Opportunity / Stage'}
              </h3>
              <p className="text-xs text-brand-gray">
                Track client progress across Discovery, Demo, Invoice & Payment stages
              </p>
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
        <form onSubmit={handleSubmit} className="p-6 space-y-4 max-h-[80vh] overflow-y-auto">
          {/* Stage Selector */}
          <div className="p-4 rounded-xl bg-brand-black border border-brand-cyan/30 space-y-2">
            <label className="block text-xs font-mono uppercase text-brand-cyan font-bold">
              Current Sales Stage
            </label>
            <select
              value={stage}
              onChange={(e) => setStage(e.target.value as DealStage)}
              className="w-full px-3 py-2.5 rounded-xl bg-brand-navy border border-brand-midnight text-xs text-brand-white font-bold focus:outline-none focus:border-brand-cyan"
            >
              <option value="discovery_pitch">1. Discovery / Pitch Call (Meeting Done · Info Sent)</option>
              <option value="demo_sent">2. Demo Sent (Partnership Info Sent)</option>
              <option value="invoice_sent">3. Invoice & Agreement Sent</option>
              <option value="payment_pending">4. Payment Pending (Awaiting Transfer)</option>
              <option value="closed_won">5. Paid & Closed Won (Payment Confirmed)</option>
            </select>
          </div>

          {/* Stage-Specific Date & Pricing Controls */}
          {stage === 'discovery_pitch' && (
            <div className="p-4 rounded-xl bg-brand-navy border border-brand-cyan/20 space-y-3">
              <div className="flex items-center gap-2 text-xs font-bold text-brand-cyan">
                <Video className="w-4 h-4" />
                <span>Discovery / Pitch Call Details</span>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs text-brand-gray mb-1">Call Completed Date</label>
                  <input
                    type="date"
                    value={discoveryDate}
                    onChange={(e) => setDiscoveryDate(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl bg-brand-black border border-brand-midnight text-xs text-brand-white focus:outline-none focus:border-brand-cyan"
                  />
                </div>
                <div>
                  <label className="block text-xs text-brand-gray mb-1">Pricing Provided to Client?</label>
                  <div className="flex items-center gap-2 pt-1">
                    <button
                      type="button"
                      onClick={() => setHasPricingGiven(false)}
                      className={`px-3 py-1.5 rounded-lg text-xs font-semibold border transition-all ${
                        !hasPricingGiven
                          ? 'bg-brand-cyan/20 text-brand-cyan border-brand-cyan'
                          : 'bg-brand-black text-brand-gray border-white/10'
                      }`}
                    >
                      No (Info Sent)
                    </button>
                    <button
                      type="button"
                      onClick={() => setHasPricingGiven(true)}
                      className={`px-3 py-1.5 rounded-lg text-xs font-semibold border transition-all ${
                        hasPricingGiven
                          ? 'bg-brand-green/20 text-brand-green border-brand-green'
                          : 'bg-brand-black text-brand-gray border-white/10'
                      }`}
                    >
                      Yes (Add £ Value)
                    </button>
                  </div>
                </div>
              </div>

              {hasPricingGiven && (
                <div>
                  <label className="block text-xs text-brand-gray mb-1">Opportunity Value (£ GBP)</label>
                  <div className="relative">
                    <span className="absolute left-3 top-2 text-brand-green font-bold">£</span>
                    <input
                      type="number"
                      value={valueGbp}
                      onChange={(e) => setValueGbp(e.target.value)}
                      placeholder="2000"
                      className="w-full pl-7 pr-3 py-2 rounded-xl bg-brand-black border border-brand-midnight text-xs text-brand-white font-mono font-bold focus:outline-none focus:border-brand-green"
                    />
                  </div>
                </div>
              )}
            </div>
          )}

          {stage === 'demo_sent' && (
            <div className="p-4 rounded-xl bg-brand-navy border border-brand-cyan/20 space-y-3">
              <div className="flex items-center gap-2 text-xs font-bold text-brand-cyan">
                <Send className="w-4 h-4" />
                <span>Demo & Partnership Information Sent Details</span>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs text-brand-gray mb-1">Demo Sent Date</label>
                  <input
                    type="date"
                    value={demoSentDate}
                    onChange={(e) => setDemoSentDate(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl bg-brand-black border border-brand-midnight text-xs text-brand-white focus:outline-none focus:border-brand-cyan"
                  />
                </div>
                <div>
                  <label className="block text-xs text-brand-gray mb-1">Optional Proposed Value (£ GBP)</label>
                  <div className="relative">
                    <span className="absolute left-3 top-2 text-brand-green font-bold">£</span>
                    <input
                      type="number"
                      value={valueGbp}
                      onChange={(e) => {
                        setValueGbp(e.target.value);
                        setHasPricingGiven(Boolean(e.target.value));
                      }}
                      placeholder="Optional (e.g. 2500)"
                      className="w-full pl-7 pr-3 py-2 rounded-xl bg-brand-black border border-brand-midnight text-xs text-brand-white font-mono font-bold focus:outline-none focus:border-brand-green"
                    />
                  </div>
                </div>
              </div>
            </div>
          )}

          {(stage === 'invoice_sent' || stage === 'payment_pending') && (
            <div className="p-4 rounded-xl bg-brand-navy border border-brand-orange/30 space-y-3">
              <div className="flex items-center gap-2 text-xs font-bold text-brand-orange">
                <FileText className="w-4 h-4" />
                <span>Invoice & Agreement Tracking</span>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="block text-xs text-brand-gray mb-1">Invoice Number</label>
                  <input
                    type="text"
                    value={invoiceNumber}
                    onChange={(e) => setInvoiceNumber(e.target.value)}
                    placeholder="INV-2025-090"
                    className="w-full px-3 py-2 rounded-xl bg-brand-black border border-brand-midnight text-xs text-brand-white font-mono focus:outline-none focus:border-brand-orange"
                  />
                </div>
                <div>
                  <label className="block text-xs text-brand-gray mb-1">Invoice / Agreement Date</label>
                  <input
                    type="date"
                    value={invoiceDate}
                    onChange={(e) => setInvoiceDate(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl bg-brand-black border border-brand-midnight text-xs text-brand-white focus:outline-none focus:border-brand-orange"
                  />
                </div>
                <div>
                  <label className="block text-xs text-brand-gray mb-1">Invoice Amount (£ GBP)</label>
                  <div className="relative">
                    <span className="absolute left-3 top-2 text-brand-green font-bold">£</span>
                    <input
                      type="number"
                      required
                      value={valueGbp}
                      onChange={(e) => {
                        setValueGbp(e.target.value);
                        setHasPricingGiven(true);
                      }}
                      className="w-full pl-7 pr-3 py-2 rounded-xl bg-brand-black border border-brand-midnight text-xs text-brand-white font-mono font-bold focus:outline-none focus:border-brand-green"
                    />
                  </div>
                </div>
              </div>
            </div>
          )}

          {stage === 'closed_won' && (
            <div className="p-4 rounded-xl bg-brand-navy border border-brand-green/30 space-y-3">
              <div className="flex items-center gap-2 text-xs font-bold text-brand-green">
                <CreditCard className="w-4 h-4" />
                <span>Payment & Closed Won Details</span>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="block text-xs text-brand-gray mb-1">Paid Date</label>
                  <input
                    type="date"
                    value={paidDate}
                    onChange={(e) => setPaidDate(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl bg-brand-black border border-brand-midnight text-xs text-brand-white focus:outline-none focus:border-brand-green"
                  />
                </div>
                <div>
                  <label className="block text-xs text-brand-gray mb-1">Invoice Number</label>
                  <input
                    type="text"
                    value={invoiceNumber}
                    onChange={(e) => setInvoiceNumber(e.target.value)}
                    placeholder="INV-2025-080"
                    className="w-full px-3 py-2 rounded-xl bg-brand-black border border-brand-midnight text-xs text-brand-white font-mono focus:outline-none focus:border-brand-green"
                  />
                </div>
                <div>
                  <label className="block text-xs text-brand-gray mb-1">Paid Amount (£ GBP)</label>
                  <div className="relative">
                    <span className="absolute left-3 top-2 text-brand-green font-bold">£</span>
                    <input
                      type="number"
                      required
                      value={valueGbp}
                      onChange={(e) => {
                        setValueGbp(e.target.value);
                        setHasPricingGiven(true);
                      }}
                      className="w-full pl-7 pr-3 py-2 rounded-xl bg-brand-black border border-brand-midnight text-xs text-brand-white font-mono font-bold focus:outline-none focus:border-brand-green"
                    />
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Client Details */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs text-brand-gray mb-1">Company Name *</label>
              <input
                type="text"
                required
                value={companyName}
                onChange={(e) => setCompanyName(e.target.value)}
                placeholder="e.g. Synthex AI Lab"
                className="w-full px-3 py-2 rounded-xl bg-brand-black border border-brand-midnight text-xs text-brand-white focus:outline-none focus:border-brand-cyan"
              />
            </div>
            <div>
              <label className="block text-xs text-brand-gray mb-1">Contact Person Name</label>
              <input
                type="text"
                value={contactName}
                onChange={(e) => setContactName(e.target.value)}
                placeholder="e.g. Sarah Jenkins"
                className="w-full px-3 py-2 rounded-xl bg-brand-black border border-brand-midnight text-xs text-brand-white focus:outline-none focus:border-brand-cyan"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs text-brand-gray mb-1">Contact Email Address *</label>
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="e.g. sarah@synthex.ai"
              className="w-full px-3 py-2 rounded-xl bg-brand-black border border-brand-midnight text-xs text-brand-white focus:outline-none focus:border-brand-cyan font-mono"
            />
          </div>

          {/* Rep Attribution */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs text-brand-gray mb-1">Assigned Sales Closer</label>
              <select
                value={salesRep}
                onChange={(e) => setSalesRep(e.target.value)}
                className="w-full px-3 py-2 rounded-xl bg-brand-black border border-brand-midnight text-xs text-brand-white focus:outline-none focus:border-brand-cyan font-semibold"
              >
                {salesReps.map((rep) => (
                  <option key={rep.id} value={rep.name}>
                    {rep.name} (Sales)
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-xs text-brand-gray mb-1">Source Lead Gen Rep</label>
              <select
                value={leadGenRep}
                onChange={(e) => setLeadGenRep(e.target.value)}
                className="w-full px-3 py-2 rounded-xl bg-brand-black border border-brand-midnight text-xs text-brand-white focus:outline-none focus:border-brand-cyan font-semibold"
              >
                {leadGenReps.map((rep) => (
                  <option key={rep.id} value={rep.name}>
                    {rep.name} (Lead Gen)
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Notes */}
          <div>
            <label className="block text-xs text-brand-gray mb-1">Deal / Client Context Notes</label>
            <textarea
              rows={2}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="e.g. Sent partnership proposal with 3 month pilot scope..."
              className="w-full px-3 py-2 rounded-xl bg-brand-black border border-brand-midnight text-xs text-brand-white placeholder-brand-gray focus:outline-none focus:border-brand-cyan"
            />
          </div>

          {/* Footer Actions */}
          <div className="pt-3 border-t border-brand-midnight flex items-center justify-end gap-3">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl text-xs font-semibold text-brand-gray hover:text-brand-white"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-5 py-2.5 rounded-xl bg-brand-green text-brand-black font-bold text-xs hover:brightness-110 active:scale-95 transition-all shadow-green-glow"
            >
              Save Deal & Update Stage
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
