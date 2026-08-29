import React, { useState } from 'react';
import {
  X,
  Zap,
  ShieldBan,
  ThumbsUp,
  CalendarCheck,
  MessageSquare,
  Building,
  User,
  Globe,
  MapPin,
  Briefcase,
  Phone,
  Link2,
} from 'lucide-react';
import {
  TeamMember,
  LeadStatus,
  DncReason,
  MasterRecord,
  Deal,
} from '../types';
import { extractNormalizedDomain } from '../lib/collisionEngine';

interface QuickLeadModalProps {
  isOpen: boolean;
  onClose: () => void;
  teamMembers: TeamMember[];
  onSaveMasterRecord: (record: MasterRecord) => void;
  onSaveDeal: (deal: Deal) => void;
}

export const QuickLeadModal: React.FC<QuickLeadModalProps> = ({
  isOpen,
  onClose,
  teamMembers,
  onSaveMasterRecord,
  onSaveDeal,
}) => {
  if (!isOpen) return null;

  const salesReps = teamMembers.filter((m) => m.role === 'sales');
  const leadGenReps = teamMembers.filter((m) => m.role === 'lead_gen');

  const [email, setEmail] = useState('');
  const [status, setStatus] = useState<LeadStatus>('interested');
  const [dncReason, setDncReason] = useState<DncReason>('unsubscribed');
  const [leadGenRep, setLeadGenRep] = useState(leadGenReps[0]?.name || 'Ruhit');
  const [assignedSalesRep, setAssignedSalesRep] = useState(salesReps[0]?.name || 'Farzan');

  // Enriched optional fields
  const [contactName, setContactName] = useState('');
  const [companyName, setCompanyName] = useState('');
  const [website, setWebsite] = useState('');
  const [country, setCountry] = useState('United Kingdom');
  const [jobTitle, setJobTitle] = useState('');
  const [phone, setPhone] = useState('');
  const [linkedInUrl, setLinkedInUrl] = useState('');
  const [notes, setNotes] = useState('');

  // Meeting specific fields
  const [meetingDate, setMeetingDate] = useState(
    new Date(Date.now() + 86400000).toISOString().split('T')[0]
  );
  const [estimatedValueGbp, setEstimatedValueGbp] = useState('2000');
  const [meetingCountType, setMeetingCountType] = useState<'yes' | 'no'>('yes');

  const handleEmailChange = (val: string) => {
    setEmail(val);
    const domain = extractNormalizedDomain(val);
    if (domain && !website && !domain.includes('gmail') && !domain.includes('yahoo')) {
      setWebsite(`https://${domain}`);
      if (!companyName) {
        const inferred = domain.split('.')[0];
        setCompanyName(inferred.charAt(0).toUpperCase() + inferred.slice(1));
      }
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim()) return;

    const domain = extractNormalizedDomain(email);

    const masterRecord: MasterRecord = {
      id: `lead-${Date.now()}`,
      email: email.trim().toLowerCase(),
      domain: domain || website || 'unknown',
      companyName: companyName.trim() || undefined,
      contactName: contactName.trim() || undefined,
      website: website.trim() || undefined,
      country: country.trim() || undefined,
      jobTitle: jobTitle.trim() || undefined,
      phone: phone.trim() || undefined,
      linkedInUrl: linkedInUrl.trim() || undefined,
      status,
      dncReason: status === 'dnc' ? dncReason : undefined,
      notes: notes.trim() || undefined,
      leadGenRep,
      salesRep: status === 'meeting_scheduled' || status === 'meeting_done' ? assignedSalesRep : undefined,
      meetingScheduledDate: status === 'meeting_scheduled' ? meetingDate : undefined,
      meetingCountType: status === 'meeting_scheduled' || status === 'meeting_done' ? meetingCountType : undefined,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    onSaveMasterRecord(masterRecord);

    // If meeting scheduled, create a deal in discovery_pitch stage for the sales rep
    if (status === 'meeting_scheduled') {
      const newDeal: Deal = {
        id: `deal-${Date.now()}`,
        title: `${companyName || domain || 'Client'} Discovery Pitch`,
        companyName: companyName.trim() || domain || 'New Client',
        contactName: contactName.trim() || undefined,
        email: email.trim().toLowerCase(),
        domain: domain || 'unknown',
        valueGbp: parseFloat(estimatedValueGbp) || 2000,
        stage: 'discovery_pitch',
        salesRep: assignedSalesRep,
        leadGenRep,
        notes: `Meeting booked by ${leadGenRep}. ${notes}`,
        meetingScheduledDate: meetingDate,
        meetingCompleted: false,
        meetingCountType,
        followUpDays: 7,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };
      onSaveDeal(newDeal);
    }

    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-black/75 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-brand-navy border border-brand-midnight rounded-2xl w-full max-w-2xl overflow-hidden shadow-2xl animate-scale-up">
        {/* Header */}
        <div className="px-6 py-4 bg-brand-black border-b border-brand-midnight flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-brand-cyan/10 border border-brand-cyan/30 flex items-center justify-center text-brand-cyan">
              <Zap className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-base font-bold text-brand-white">Log Lead / Campaign Reply</h3>
              <p className="text-xs text-brand-gray">Update DNC, Interested, or book a meeting for the sales team</p>
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
        <form onSubmit={handleSubmit} className="p-6 space-y-5">
          {/* Status Selector Pill Buttons */}
          <div>
            <label className="block text-xs font-mono uppercase tracking-wider text-brand-gray mb-2">
              Select Response / Status <span className="text-brand-cyan">*</span>
            </label>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              <button
                type="button"
                onClick={() => setStatus('dnc')}
                className={`flex items-center justify-center gap-1.5 p-2.5 rounded-xl border text-xs font-semibold transition-all ${
                  status === 'dnc'
                    ? 'bg-red-500/20 text-red-400 border-red-500/50 shadow-orange-glow'
                    : 'bg-brand-black text-brand-gray border-white/10 hover:border-white/20'
                }`}
              >
                <ShieldBan className="w-4 h-4 text-red-400" />
                <span>Do Not Contact</span>
              </button>

              <button
                type="button"
                onClick={() => setStatus('interested')}
                className={`flex items-center justify-center gap-1.5 p-2.5 rounded-xl border text-xs font-semibold transition-all ${
                  status === 'interested'
                    ? 'bg-brand-cyan/20 text-brand-cyan border-brand-cyan/50 shadow-cyan-glow'
                    : 'bg-brand-black text-brand-gray border-white/10 hover:border-white/20'
                }`}
              >
                <ThumbsUp className="w-4 h-4 text-brand-cyan" />
                <span>Interested</span>
              </button>

              <button
                type="button"
                onClick={() => setStatus('meeting_scheduled')}
                className={`flex items-center justify-center gap-1.5 p-2.5 rounded-xl border text-xs font-semibold transition-all ${
                  status === 'meeting_scheduled'
                    ? 'bg-brand-green/20 text-brand-green border-brand-green/50 shadow-green-glow'
                    : 'bg-brand-black text-brand-gray border-white/10 hover:border-white/20'
                }`}
              >
                <CalendarCheck className="w-4 h-4 text-brand-green" />
                <span>Book Meeting</span>
              </button>

              <button
                type="button"
                onClick={() => setStatus('in_conversation')}
                className={`flex items-center justify-center gap-1.5 p-2.5 rounded-xl border text-xs font-semibold transition-all ${
                  status === 'in_conversation'
                    ? 'bg-blue-500/20 text-blue-400 border-blue-500/50'
                    : 'bg-brand-black text-brand-gray border-white/10 hover:border-white/20'
                }`}
              >
                <MessageSquare className="w-4 h-4 text-blue-400" />
                <span>In-Conversation</span>
              </button>
            </div>
          </div>

          {/* DNC Reason Conditional */}
          {status === 'dnc' && (
            <div className="p-3.5 rounded-xl bg-red-950/20 border border-red-500/30 space-y-2">
              <label className="block text-xs font-semibold text-red-300">
                DNC Classification Reason
              </label>
              <select
                value={dncReason}
                onChange={(e) => setDncReason(e.target.value as DncReason)}
                className="w-full px-3 py-2 rounded-lg bg-brand-black border border-red-500/30 text-white text-xs focus:outline-none focus:border-red-400"
              >
                <option value="unsubscribed">Unsubscribed (Standard opt-out)</option>
                <option value="hostile">Hostile / Angry Reply (Strict Domain Blacklist)</option>
                <option value="wrong_person">Wrong Person / Left Company</option>
                <option value="bounced">Hard Bounced / Invalid Inbox</option>
                <option value="competitor">Competitor / Internal</option>
                <option value="other">Other / Not Specified</option>
              </select>
              <p className="text-[11px] text-red-400/80">
                ⚠️ Adding this will instantly block this email and company domain for all lead generation members.
              </p>
            </div>
          )}

          {/* Primary Lead Fields */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-mono uppercase text-brand-gray mb-1.5">
                Lead / Client Email <span className="text-brand-cyan">*</span>
              </label>
              <input
                type="email"
                required
                value={email}
                onChange={(e) => handleEmailChange(e.target.value)}
                placeholder="client@company.co.uk"
                className="w-full px-3.5 py-2.5 rounded-xl bg-brand-black border border-brand-midnight text-brand-white placeholder-brand-gray text-sm focus:outline-none focus:border-brand-cyan"
              />
            </div>

            <div>
              <label className="block text-xs font-mono uppercase text-brand-gray mb-1.5">
                Logged By (Lead Gen Rep) <span className="text-brand-cyan">*</span>
              </label>
              <select
                value={leadGenRep}
                onChange={(e) => setLeadGenRep(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl bg-brand-black border border-brand-midnight text-brand-white text-sm focus:outline-none focus:border-brand-cyan"
              >
                {leadGenReps.map((rep) => (
                  <option key={rep.id} value={rep.name}>
                    {rep.name} (Lead Gen)
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Meeting Specific Section */}
          {status === 'meeting_scheduled' && (
            <div className="p-4 rounded-xl bg-brand-green/10 border border-brand-green/30 space-y-3">
              <h4 className="text-xs font-bold uppercase tracking-wider text-brand-green flex items-center gap-2">
                <CalendarCheck className="w-4 h-4" />
                Meeting Booking & Sales Rep Handoff
              </h4>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="block text-xs text-brand-gray mb-1">Assign to Sales Rep</label>
                  <select
                    value={assignedSalesRep}
                    onChange={(e) => setAssignedSalesRep(e.target.value)}
                    className="w-full px-3 py-2 rounded-lg bg-brand-black border border-brand-green/30 text-brand-white text-xs font-medium focus:outline-none focus:border-brand-green"
                  >
                    {salesReps.map((rep) => (
                      <option key={rep.id} value={rep.name}>
                        {rep.name} (Sales)
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-xs text-brand-gray mb-1">Scheduled Date</label>
                  <input
                    type="date"
                    value={meetingDate}
                    onChange={(e) => setMeetingDate(e.target.value)}
                    className="w-full px-3 py-2 rounded-lg bg-brand-black border border-brand-green/30 text-brand-white text-xs focus:outline-none focus:border-brand-green"
                  />
                </div>
                <div>
                  <label className="block text-xs text-brand-gray mb-1">Estimated Value (£ GBP)</label>
                  <input
                    type="number"
                    value={estimatedValueGbp}
                    onChange={(e) => setEstimatedValueGbp(e.target.value)}
                    placeholder="2000"
                    className="w-full px-3 py-2 rounded-lg bg-brand-black border border-brand-green/30 text-brand-white text-xs focus:outline-none focus:border-brand-green"
                  />
                </div>
              </div>

              {/* Meeting Count Rule (Yes/No) */}
              <div className="pt-2 border-t border-brand-green/20">
                <label className="block text-xs font-semibold text-brand-white mb-1.5">
                  Quota Count Attribution:
                </label>
                <div className="flex items-center gap-4">
                  <label className="flex items-center gap-1.5 text-xs text-brand-green cursor-pointer">
                    <input
                      type="radio"
                      name="quotaRule"
                      checked={meetingCountType === 'yes'}
                      onChange={() => setMeetingCountType('yes')}
                    />
                    <span>Meeting Count (YES) - Awaiting Review</span>
                  </label>
                  <label className="flex items-center gap-1.5 text-xs text-brand-gray cursor-pointer">
                    <input
                      type="radio"
                      name="quotaRule"
                      checked={meetingCountType === 'no'}
                      onChange={() => setMeetingCountType('no')}
                    />
                    <span>Meeting Count (NO) - Done Only</span>
                  </label>
                </div>
              </div>
            </div>
          )}

          {/* Optional Enriched Metadata Section */}
          <div className="pt-2 border-t border-brand-midnight">
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs font-semibold text-brand-white flex items-center gap-1.5">
                <Building className="w-3.5 h-3.5 text-brand-cyan" />
                Company & Contact Details (Optional - Enhances Duplicate Matching)
              </span>
              <span className="text-[10px] text-brand-gray font-mono">Recommended</span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div>
                <label className="block text-[11px] text-brand-gray mb-1">Contact Person Name</label>
                <div className="relative">
                  <User className="w-3.5 h-3.5 text-brand-gray absolute left-2.5 top-2.5" />
                  <input
                    type="text"
                    value={contactName}
                    onChange={(e) => setContactName(e.target.value)}
                    placeholder="e.g. John Doe"
                    className="w-full pl-8 pr-3 py-1.5 rounded-lg bg-brand-black border border-brand-midnight text-xs text-brand-white placeholder-brand-gray focus:outline-none focus:border-brand-cyan"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[11px] text-brand-gray mb-1">Company Name</label>
                <div className="relative">
                  <Building className="w-3.5 h-3.5 text-brand-gray absolute left-2.5 top-2.5" />
                  <input
                    type="text"
                    value={companyName}
                    onChange={(e) => setCompanyName(e.target.value)}
                    placeholder="e.g. Acme Corp Ltd"
                    className="w-full pl-8 pr-3 py-1.5 rounded-lg bg-brand-black border border-brand-midnight text-xs text-brand-white placeholder-brand-gray focus:outline-none focus:border-brand-cyan"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[11px] text-brand-gray mb-1">Website / Domain</label>
                <div className="relative">
                  <Globe className="w-3.5 h-3.5 text-brand-gray absolute left-2.5 top-2.5" />
                  <input
                    type="text"
                    value={website}
                    onChange={(e) => setWebsite(e.target.value)}
                    placeholder="https://acme.co.uk"
                    className="w-full pl-8 pr-3 py-1.5 rounded-lg bg-brand-black border border-brand-midnight text-xs text-brand-white placeholder-brand-gray focus:outline-none focus:border-brand-cyan"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[11px] text-brand-gray mb-1">Country / Region</label>
                <div className="relative">
                  <MapPin className="w-3.5 h-3.5 text-brand-gray absolute left-2.5 top-2.5" />
                  <input
                    type="text"
                    value={country}
                    onChange={(e) => setCountry(e.target.value)}
                    placeholder="United Kingdom"
                    className="w-full pl-8 pr-3 py-1.5 rounded-lg bg-brand-black border border-brand-midnight text-xs text-brand-white placeholder-brand-gray focus:outline-none focus:border-brand-cyan"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[11px] text-brand-gray mb-1">Job Title</label>
                <div className="relative">
                  <Briefcase className="w-3.5 h-3.5 text-brand-gray absolute left-2.5 top-2.5" />
                  <input
                    type="text"
                    value={jobTitle}
                    onChange={(e) => setJobTitle(e.target.value)}
                    placeholder="Managing Director"
                    className="w-full pl-8 pr-3 py-1.5 rounded-lg bg-brand-black border border-brand-midnight text-xs text-brand-white placeholder-brand-gray focus:outline-none focus:border-brand-cyan"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[11px] text-brand-gray mb-1">Phone / LinkedIn</label>
                <div className="relative">
                  <Phone className="w-3.5 h-3.5 text-brand-gray absolute left-2.5 top-2.5" />
                  <input
                    type="text"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder="+44 20 7946 0991"
                    className="w-full pl-8 pr-3 py-1.5 rounded-lg bg-brand-black border border-brand-midnight text-xs text-brand-white placeholder-brand-gray focus:outline-none focus:border-brand-cyan"
                  />
                </div>
              </div>
            </div>

            <div className="mt-3">
              <label className="block text-[11px] text-brand-gray mb-1">Notes / Context</label>
              <textarea
                rows={2}
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Details from the reply or next follow-up action..."
                className="w-full px-3 py-2 rounded-lg bg-brand-black border border-brand-midnight text-xs text-brand-white placeholder-brand-gray focus:outline-none focus:border-brand-cyan"
              />
            </div>
          </div>

          {/* Footer Actions */}
          <div className="pt-3 border-t border-brand-midnight flex items-center justify-end gap-3">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl text-xs font-semibold text-brand-gray hover:text-brand-white hover:bg-brand-midnight transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-5 py-2.5 rounded-xl bg-brand-cyan text-brand-black font-bold text-xs hover:brightness-110 active:scale-95 transition-all shadow-cyan-glow"
            >
              Save & Update Repository
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
