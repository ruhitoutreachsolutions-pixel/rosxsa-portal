import React, { useState } from 'react';
import {
  X,
  AlertTriangle,
  Clock,
  CheckCircle2,
  Send,
  Check,
  Calendar,
  ArrowRight,
  ShieldCheck,
  CalendarCheck,
} from 'lucide-react';
import { NotificationItem, Deal, UserAccount, MasterRecord, MeetingCountType } from '../types';

interface NotificationDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  notifications: NotificationItem[];
  deals: Deal[];
  currentUser: UserAccount;
  onSelectDeal?: (dealId: string) => void;
  onDismissNotification: (id: string) => void;
  onLogFollowUp: (dealId: string, date: string, note: string) => void;
  onApproveMeetingCount?: (masterRecordId: string, approvalType: MeetingCountType) => void;
}

export const NotificationDrawer: React.FC<NotificationDrawerProps> = ({
  isOpen,
  onClose,
  notifications,
  deals,
  currentUser,
  onSelectDeal,
  onDismissNotification,
  onLogFollowUp,
  onApproveMeetingCount,
}) => {
  const [activeFollowUpDealId, setActiveFollowUpDealId] = useState<string | null>(null);
  const [followUpDate, setFollowUpDate] = useState(new Date().toISOString().split('T')[0]);
  const [followUpNote, setFollowUpNote] = useState('Payment reminder sent to client.');

  if (!isOpen) return null;

  const isAdmin = currentUser.role === 'admin';
  const isLeadGen = currentUser.role === 'lead_gen';

  // Role-based notification filtering:
  // Lead Team gets NO invoice overdue notifications!
  const visibleNotifications = notifications.filter((n) => {
    if (n.isRead) return false;
    if (isLeadGen && n.type === 'invoice_overdue') return false;
    if (!isAdmin && n.type === 'meeting_approval') return false;
    return true;
  });

  const handleSaveFollowUp = (dealId: string, notifId: string) => {
    onLogFollowUp(dealId, followUpDate, followUpNote);
    onDismissNotification(notifId);
    setActiveFollowUpDealId(null);
    setFollowUpNote('Payment reminder sent to client.');
  };

  return (
    <div className="fixed inset-0 z-50 overflow-hidden bg-black/60 backdrop-blur-sm animate-fade-in">
      <div className="absolute inset-y-0 right-0 max-w-full flex pl-10">
        <div className="w-screen max-w-md bg-brand-navy border-l border-brand-midnight shadow-2xl flex flex-col">
          {/* Header */}
          <div className="px-6 py-5 border-b border-brand-midnight flex items-center justify-between bg-brand-black/50">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-lg bg-brand-orange/20 border border-brand-orange/40 flex items-center justify-center text-brand-orange">
                <AlertTriangle className="w-4 h-4" />
              </div>
              <div>
                <h3 className="text-base font-bold text-brand-white">Action Alerts</h3>
                <p className="text-xs text-brand-gray">
                  {isAdmin
                    ? 'Invoice follow-ups & meeting quota approvals'
                    : isLeadGen
                    ? 'Lead notifications & meeting updates'
                    : '7-day invoice follow-ups & payment alerts'}
                </p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="p-2 rounded-lg text-brand-gray hover:text-brand-white hover:bg-brand-midnight transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Notifications List */}
          <div className="flex-1 overflow-y-auto p-6 space-y-4">
            {visibleNotifications.length === 0 ? (
              <div className="text-center py-16 text-brand-gray space-y-3">
                <CheckCircle2 className="w-12 h-12 text-brand-green mx-auto opacity-70" />
                <p className="text-sm font-medium text-brand-white">All Clear! No Pending Action Alerts</p>
                <p className="text-xs max-w-xs mx-auto">
                  {isLeadGen
                    ? 'All lead status records are up to date.'
                    : 'All invoices have been followed up and meetings approved.'}
                </p>
              </div>
            ) : (
              visibleNotifications.map((n) => {
                const isLoggingFollowUp = activeFollowUpDealId === n.dealId;

                return (
                  <div
                    key={n.id}
                    className={`p-4 rounded-xl bg-brand-black border transition-all space-y-3 relative group shadow-card-dark ${
                      n.type === 'meeting_approval'
                        ? 'border-yellow-400/40 hover:border-yellow-400/80'
                        : 'border-brand-orange/30 hover:border-brand-orange/60'
                    }`}
                  >
                    <div className="flex items-start justify-between gap-2 flex-wrap sm:flex-nowrap">
                      <div className="flex items-center gap-2 flex-wrap">
                        {n.type === 'meeting_approval' ? (
                          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider bg-yellow-400/20 text-yellow-300 border border-yellow-400/40 animate-pulse whitespace-nowrap shrink-0">
                            <Clock className="w-3 h-3 shrink-0" />
                            <span>Admin Approval Required</span>
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider bg-brand-orange/20 text-brand-orange border border-brand-orange/40 animate-pulse whitespace-nowrap shrink-0">
                            <AlertTriangle className="w-3 h-3 shrink-0" />
                            <span>Overdue &gt; 7 Days</span>
                          </span>
                        )}
                        <span className="text-xs text-brand-gray font-mono whitespace-nowrap">{n.date}</span>
                      </div>

                      {/* Dismiss */}
                      <button
                        onClick={() => onDismissNotification(n.id)}
                        className="text-[11px] text-brand-gray hover:text-brand-white transition-colors whitespace-nowrap shrink-0 ml-auto"
                        title="Dismiss notification"
                      >
                        Dismiss
                      </button>
                    </div>

                    <div>
                      <h4 className="text-sm font-semibold text-brand-white group-hover:text-brand-cyan transition-colors">
                        {n.title}
                      </h4>
                      <p className="text-xs text-gray-300 leading-relaxed mt-1">
                        {n.message}
                      </p>
                    </div>

                    {/* Admin Meeting Approval Action */}
                    {n.type === 'meeting_approval' && n.masterRecordId && onApproveMeetingCount && (
                      <div className="pt-2 border-t border-white/5 space-y-2">
                        <div className="text-[11px] text-brand-gray">
                          Approve quota count for <strong className="text-brand-cyan">{n.leadGenRep}</strong>:
                        </div>
                        <div className="grid grid-cols-2 gap-2">
                          <button
                            onClick={() => {
                              onApproveMeetingCount(n.masterRecordId!, 'yes');
                              onDismissNotification(n.id);
                            }}
                            className="py-1.5 px-2 rounded-lg bg-brand-green text-brand-black font-bold text-xs hover:brightness-110 flex items-center justify-center gap-1 shadow-green-glow"
                          >
                            <Check className="w-3.5 h-3.5 stroke-[3]" />
                            <span>Approve (Count YES)</span>
                          </button>
                          <button
                            onClick={() => {
                              onApproveMeetingCount(n.masterRecordId!, 'no');
                              onDismissNotification(n.id);
                            }}
                            className="py-1.5 px-2 rounded-lg bg-brand-midnight text-brand-white border border-white/10 hover:border-brand-cyan font-semibold text-xs flex items-center justify-center gap-1"
                          >
                            <X className="w-3.5 h-3.5" />
                            <span>Done Only (Count NO)</span>
                          </button>
                        </div>
                      </div>
                    )}

                    {/* Inline Follow-up Form for Overdue Invoices */}
                    {n.type === 'invoice_overdue' && (
                      isLoggingFollowUp ? (
                        <div className="p-3 rounded-lg bg-brand-navy border border-brand-cyan/30 space-y-2.5">
                          <div className="flex items-center justify-between">
                            <span className="text-[11px] font-bold text-brand-cyan uppercase">
                              Log Follow-Up Sent
                            </span>
                            <button
                              onClick={() => setActiveFollowUpDealId(null)}
                              className="text-[10px] text-brand-gray hover:text-white"
                            >
                              Cancel
                            </button>
                          </div>

                          <div className="space-y-1.5">
                            <label className="block text-[10px] text-brand-gray">Date Sent</label>
                            <input
                              type="date"
                              value={followUpDate}
                              onChange={(e) => setFollowUpDate(e.target.value)}
                              className="w-full px-2 py-1 rounded bg-brand-black border border-brand-midnight text-xs text-white"
                            />
                          </div>

                          <div className="space-y-1.5">
                            <label className="block text-[10px] text-brand-gray">Follow-up Notes</label>
                            <input
                              type="text"
                              value={followUpNote}
                              onChange={(e) => setFollowUpNote(e.target.value)}
                              placeholder="e.g. Sent email reminder & left voicemail"
                              className="w-full px-2 py-1 rounded bg-brand-black border border-brand-midnight text-xs text-white"
                            />
                          </div>

                          <button
                            onClick={() => handleSaveFollowUp(n.dealId!, n.id)}
                            className="w-full py-1.5 rounded-lg bg-brand-cyan text-brand-black font-bold text-xs hover:brightness-110 transition-all flex items-center justify-center gap-1"
                          >
                            <Check className="w-3.5 h-3.5 stroke-[3]" />
                            <span>Record Follow-Up & Reset 7-Day Timer</span>
                          </button>
                        </div>
                      ) : (
                        <div className="pt-2 flex items-center justify-between gap-2 border-t border-white/5">
                          <button
                            onClick={() => setActiveFollowUpDealId(n.dealId || null)}
                            className="flex items-center gap-1 text-xs font-semibold text-brand-green hover:underline"
                          >
                            <Send className="w-3.5 h-3.5" />
                            <span>+ Log Follow-Up Sent</span>
                          </button>

                          {n.dealId && onSelectDeal && (
                            <button
                              onClick={() => {
                                onSelectDeal(n.dealId!);
                                onClose();
                              }}
                              className="flex items-center gap-1 text-xs font-semibold text-brand-cyan hover:text-brand-white transition-colors"
                            >
                              <span>Open Deal</span>
                              <ArrowRight className="w-3.5 h-3.5" />
                            </button>
                          )}
                        </div>
                      )
                    )}
                  </div>
                );
              })
            )}
          </div>

          {/* Footer */}
          <div className="p-4 border-t border-brand-midnight bg-brand-black/60 text-center">
            <p className="text-xs text-brand-gray font-mono">
              ROSxSA Alert Engine · {currentUser.role.toUpperCase()} View
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
