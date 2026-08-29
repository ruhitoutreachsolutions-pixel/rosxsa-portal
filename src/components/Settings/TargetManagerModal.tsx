import React, { useState } from 'react';
import {
  X,
  Target,
  PoundSterling,
  CalendarCheck,
  Save,
  RotateCcw,
  Sparkles,
  Calendar,
  Plus,
  Trash2,
  CalendarDays,
} from 'lucide-react';
import { MonthlyQuotas, TeamMember, CompanyHoliday } from '../../types';
import { formatGbp, calculateMonthlyPacing } from '../../lib/currency';

interface TargetManagerModalProps {
  isOpen: boolean;
  onClose: () => void;
  quotas: MonthlyQuotas;
  salesReps: TeamMember[];
  leadGenReps: TeamMember[];
  onSaveQuotas: (quotas: MonthlyQuotas) => void;
}

export const TargetManagerModal: React.FC<TargetManagerModalProps> = ({
  isOpen,
  onClose,
  quotas,
  salesReps,
  leadGenReps,
  onSaveQuotas,
}) => {
  if (!isOpen) return null;

  const [companyTarget, setCompanyTarget] = useState<number>(quotas.companyTargetGbp);
  const [salesTargets, setSalesTargets] = useState<{ [id: string]: number }>(() => {
    const map: { [id: string]: number } = {};
    salesReps.forEach((rep) => {
      const found = quotas.salesTargets.find((t) => t.memberId === rep.id || t.memberName === rep.name);
      map[rep.id] = found ? found.targetGbp : 5000;
    });
    return map;
  });

  const [leadGenTargets, setLeadGenTargets] = useState<{ [id: string]: number }>(() => {
    const map: { [id: string]: number } = {};
    leadGenReps.forEach((rep) => {
      const found = quotas.leadGenTargets.find((t) => t.memberId === rep.id || t.memberName === rep.name);
      map[rep.id] = found ? found.targetMeetings : 12;
    });
    return map;
  });

  // Company Holidays List
  const [holidays, setHolidays] = useState<CompanyHoliday[]>(quotas.holidays || []);
  const [newHolidayDate, setNewHolidayDate] = useState('');
  const [newHolidayTitle, setNewHolidayTitle] = useState('');

  const totalSalesAllocated = Object.values(salesTargets).reduce((a, b) => a + (b || 0), 0);
  const totalMeetingsAllocated = Object.values(leadGenTargets).reduce((a, b) => a + (b || 0), 0);

  // Live Working Days Calculation
  const pacingPreview = calculateMonthlyPacing(0, companyTarget, holidays);

  const handleAddHoliday = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newHolidayDate) return;

    const exists = holidays.some((h) => h.date === newHolidayDate);
    if (!exists) {
      const updated = [
        ...holidays,
        {
          date: newHolidayDate,
          title: newHolidayTitle.trim() || 'Company Bank Holiday',
        },
      ].sort((a, b) => a.date.localeCompare(b.date));
      setHolidays(updated);
      setNewHolidayDate('');
      setNewHolidayTitle('');
    }
  };

  const handleRemoveHoliday = (date: string) => {
    setHolidays(holidays.filter((h) => h.date !== date));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    const updatedQuotas: MonthlyQuotas = {
      ...quotas,
      companyTargetGbp: companyTarget,
      salesTargets: salesReps.map((rep) => ({
        memberId: rep.id,
        memberName: rep.name,
        targetGbp: salesTargets[rep.id] || 0,
      })),
      leadGenTargets: leadGenReps.map((rep) => ({
        memberId: rep.id,
        memberName: rep.name,
        targetMeetings: leadGenTargets[rep.id] || 0,
      })),
      holidays,
    };

    onSaveQuotas(updatedQuotas);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-black/75 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-brand-navy border border-brand-midnight rounded-2xl w-full max-w-3xl overflow-hidden shadow-2xl animate-scale-up">
        {/* Header */}
        <div className="px-6 py-4 bg-brand-black border-b border-brand-midnight flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-brand-green/10 border border-brand-green/30 flex items-center justify-center text-brand-green">
              <Target className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-base font-bold text-brand-white">Monthly Quotas & Holidays Management</h3>
              <p className="text-xs text-brand-gray">Set revenue targets in £ GBP and manage Mon-Fri working days</p>
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
        <form onSubmit={handleSubmit} className="p-6 space-y-6 max-h-[80vh] overflow-y-auto">
          {/* Company Target Section */}
          <div className="p-4 rounded-xl bg-brand-black border border-brand-green/30 space-y-3">
            <div className="flex items-center justify-between">
              <div>
                <label className="block text-xs font-mono uppercase text-brand-gray">
                  Overall Company Monthly Target (£ GBP)
                </label>
                <div className="text-xs text-brand-gray mt-0.5">
                  Working Days: <strong className="text-brand-cyan font-mono">{pacingPreview.totalWorkingDays} Mon-Fri Days</strong> ({pacingPreview.holidayCount} Holidays)
                </div>
              </div>
              <span className="text-xs font-mono px-2 py-0.5 rounded bg-brand-green/20 text-brand-green border border-brand-green/30 font-bold">
                Active Month
              </span>
            </div>

            <div className="relative">
              <span className="absolute left-3.5 top-2.5 text-brand-green font-bold">£</span>
              <input
                type="number"
                min="0"
                step="500"
                value={companyTarget}
                onChange={(e) => setCompanyTarget(parseFloat(e.target.value) || 0)}
                className="w-full pl-8 pr-4 py-2.5 rounded-xl bg-brand-navy border border-brand-midnight text-brand-white font-mono font-bold text-lg focus:outline-none focus:border-brand-green"
              />
            </div>
          </div>

          {/* COMPANY HOLIDAYS & WORKING DAYS MANAGER */}
          <div className="p-4 rounded-xl bg-brand-black border border-brand-cyan/30 space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <CalendarDays className="w-4 h-4 text-brand-cyan" />
                <h4 className="text-xs font-bold uppercase tracking-wider text-brand-cyan">
                  Company Holidays & Non-Working Days
                </h4>
              </div>
              <span className="text-xs font-mono text-brand-gray">
                Weekends (Sat/Sun) are automatically excluded
              </span>
            </div>

            {/* Add Holiday Form */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
              <input
                type="date"
                value={newHolidayDate}
                onChange={(e) => setNewHolidayDate(e.target.value)}
                className="px-3 py-1.5 rounded-lg bg-brand-navy border border-brand-midnight text-xs text-brand-white focus:outline-none focus:border-brand-cyan"
              />
              <input
                type="text"
                value={newHolidayTitle}
                onChange={(e) => setNewHolidayTitle(e.target.value)}
                placeholder="e.g. Summer Bank Holiday"
                className="px-3 py-1.5 rounded-lg bg-brand-navy border border-brand-midnight text-xs text-brand-white placeholder-brand-gray focus:outline-none focus:border-brand-cyan"
              />
              <button
                type="button"
                onClick={handleAddHoliday}
                className="px-3 py-1.5 rounded-lg bg-brand-cyan/20 text-brand-cyan border border-brand-cyan/40 hover:bg-brand-cyan hover:text-brand-black text-xs font-bold transition-all flex items-center justify-center gap-1"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>+ Add Holiday</span>
              </button>
            </div>

            {/* Holiday List */}
            <div className="space-y-1.5 max-h-32 overflow-y-auto">
              {holidays.length === 0 ? (
                <div className="text-[11px] text-brand-gray font-mono italic">
                  No public holidays added yet. Calculating strictly on standard Mon-Fri workdays ({pacingPreview.totalWorkingDays} days).
                </div>
              ) : (
                holidays.map((h) => (
                  <div
                    key={h.date}
                    className="flex items-center justify-between p-2 rounded-lg bg-brand-navy border border-white/5 text-xs font-mono"
                  >
                    <div className="flex items-center gap-2">
                      <span className="text-brand-cyan font-bold">{h.date}</span>
                      <span className="text-brand-white">{h.title}</span>
                    </div>
                    <button
                      type="button"
                      onClick={() => handleRemoveHoliday(h.date)}
                      className="text-brand-gray hover:text-red-400 p-1"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* Sales Rep Quotas */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <h4 className="text-xs font-bold uppercase tracking-wider text-brand-green flex items-center gap-1.5">
                <PoundSterling className="w-3.5 h-3.5" />
                Sales Team Individual Targets (£ GBP)
              </h4>
              <span className="text-xs font-mono text-brand-gray">
                Total: <strong className="text-brand-green font-mono">{formatGbp(totalSalesAllocated)}</strong>
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {salesReps.map((rep) => (
                <div
                  key={rep.id}
                  className="p-3 rounded-xl bg-brand-black border border-brand-midnight flex items-center justify-between"
                >
                  <div className="flex items-center gap-2">
                    <div
                      className="w-6 h-6 rounded-full flex items-center justify-center font-bold text-xs text-brand-black shadow-sm"
                      style={{ backgroundColor: rep.avatarColor || '#00C2FF' }}
                    >
                      {rep.name.charAt(0)}
                    </div>
                    <span className="font-semibold text-xs text-brand-white">{rep.name}</span>
                  </div>

                  <div className="relative w-32">
                    <span className="absolute left-2.5 top-1.5 text-xs text-brand-green font-bold">£</span>
                    <input
                      type="number"
                      min="0"
                      step="250"
                      value={salesTargets[rep.id] || 0}
                      onChange={(e) =>
                        setSalesTargets({
                          ...salesTargets,
                          [rep.id]: parseFloat(e.target.value) || 0,
                        })
                      }
                      className="w-full pl-6 pr-2 py-1.5 rounded-lg bg-brand-navy border border-brand-midnight text-xs text-brand-white font-mono font-bold text-right focus:outline-none focus:border-brand-green"
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Lead Gen Rep Targets */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <h4 className="text-xs font-bold uppercase tracking-wider text-brand-cyan flex items-center gap-1.5">
                <CalendarCheck className="w-3.5 h-3.5" />
                Lead Gen Team Targets (Total Meeting Count)
              </h4>
              <span className="text-xs font-mono text-brand-gray">
                Total: <strong className="text-brand-cyan font-mono">{totalMeetingsAllocated} Meetings</strong>
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {leadGenReps.map((rep) => (
                <div
                  key={rep.id}
                  className="p-3 rounded-xl bg-brand-black border border-brand-midnight flex items-center justify-between"
                >
                  <div className="flex items-center gap-2">
                    <div
                      className="w-6 h-6 rounded-full flex items-center justify-center font-bold text-xs text-brand-black shadow-sm"
                      style={{ backgroundColor: rep.avatarColor || '#3B82F6' }}
                    >
                      {rep.name.charAt(0)}
                    </div>
                    <span className="font-semibold text-xs text-brand-white">{rep.name}</span>
                  </div>

                  <div className="flex items-center gap-1 w-28">
                    <input
                      type="number"
                      min="0"
                      step="1"
                      value={leadGenTargets[rep.id] || 0}
                      onChange={(e) =>
                        setLeadGenTargets({
                          ...leadGenTargets,
                          [rep.id]: parseInt(e.target.value, 10) || 0,
                        })
                      }
                      className="w-full px-2 py-1.5 rounded-lg bg-brand-navy border border-brand-midnight text-xs text-brand-white font-mono font-bold text-right focus:outline-none focus:border-brand-cyan"
                    />
                    <span className="text-[10px] text-brand-gray font-mono">mtgs</span>
                  </div>
                </div>
              ))}
            </div>
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
              className="px-5 py-2.5 rounded-xl bg-brand-green text-brand-black font-bold text-xs hover:brightness-110 active:scale-95 transition-all shadow-green-glow flex items-center gap-1.5"
            >
              <Save className="w-4 h-4 stroke-[2.5]" />
              <span>Save Quotas & Holidays</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
