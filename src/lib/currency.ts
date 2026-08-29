import { Deal, CompanyHoliday } from '../types';

/**
 * Formats a number into British Pounds (£ GBP)
 */
export function formatGbp(amount: number, includeDecimals: boolean = false): string {
  if (isNaN(amount) || amount === null || amount === undefined) {
    return '£0';
  }
  return new Intl.NumberFormat('en-GB', {
    style: 'currency',
    currency: 'GBP',
    minimumFractionDigits: includeDecimals ? 2 : 0,
    maximumFractionDigits: includeDecimals ? 2 : 0,
  }).format(amount);
}

/**
 * Calculates day-by-day pacing for monthly revenue quotas strictly using WORKING DAYS (Mon-Fri)
 * excluding weekends (Saturday/Sunday) and custom company holidays.
 */
export interface PacingCalculation {
  dayOfMonth: number;
  daysInMonth: number;
  totalWorkingDays: number;
  workingDaysElapsed: number;
  workingDaysRemaining: number;
  holidayCount: number;
  monthProgressPct: number;
  targetToDateGbp: number;
  actualGbp: number;
  targetGbp: number;
  achievementPct: number;
  varianceGbp: number; // Positive = ahead, negative = behind
  isAhead: boolean;
  requiredDailyRunRateGbp: number;
  projectedMonthEndGbp: number;
}

export function calculateMonthlyPacing(
  actualGbp: number,
  monthlyTargetGbp: number,
  holidays: CompanyHoliday[] = [],
  referenceDate: Date = new Date()
): PacingCalculation {
  const now = referenceDate;
  const year = now.getFullYear();
  const month = now.getMonth(); // 0-indexed
  const currentDay = now.getDate();

  // Total calendar days in month
  const daysInMonth = new Date(year, month + 1, 0).getDate();

  // Helper set of holiday date strings for this month
  const holidayDateSet = new Set(
    holidays.map((h) => h.date.trim())
  );

  let totalWorkingDays = 0;
  let workingDaysElapsed = 0;
  let holidayCount = 0;

  for (let day = 1; day <= daysInMonth; day++) {
    const d = new Date(year, month, day);
    const dayOfWeek = d.getDay(); // 0 = Sun, 6 = Sat
    const isWeekend = dayOfWeek === 0 || dayOfWeek === 6;

    const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
    const isHoliday = holidayDateSet.has(dateStr);

    if (isHoliday && !isWeekend) {
      holidayCount++;
    }

    // Working Day: Monday to Friday and not a registered company holiday
    const isWorkingDay = !isWeekend && !isHoliday;

    if (isWorkingDay) {
      totalWorkingDays++;
      if (day <= currentDay) {
        workingDaysElapsed++;
      }
    }
  }

  // Ensure minimum 1 working day to avoid division by zero
  totalWorkingDays = Math.max(1, totalWorkingDays);
  const workingDaysRemaining = Math.max(1, totalWorkingDays - workingDaysElapsed);

  const monthProgressPct = Math.round((workingDaysElapsed / totalWorkingDays) * 100);

  // Expected linear target based on working days elapsed
  const targetToDateGbp = (monthlyTargetGbp / totalWorkingDays) * workingDaysElapsed;
  const varianceGbp = actualGbp - targetToDateGbp;
  const isAhead = varianceGbp >= 0;

  const achievementPct = monthlyTargetGbp > 0 ? Math.round((actualGbp / monthlyTargetGbp) * 100) : 0;

  // Remaining revenue needed divided by remaining working days
  const remainingNeeded = Math.max(0, monthlyTargetGbp - actualGbp);
  const requiredDailyRunRateGbp = remainingNeeded / workingDaysRemaining;

  // Linear projection to month-end based on current average working-day rate
  const currentWorkingDailyRate = workingDaysElapsed > 0 ? actualGbp / workingDaysElapsed : 0;
  const projectedMonthEndGbp = currentWorkingDailyRate * totalWorkingDays;

  return {
    dayOfMonth: currentDay,
    daysInMonth,
    totalWorkingDays,
    workingDaysElapsed,
    workingDaysRemaining,
    holidayCount,
    monthProgressPct,
    targetToDateGbp,
    actualGbp,
    targetGbp: monthlyTargetGbp,
    achievementPct,
    varianceGbp,
    isAhead,
    requiredDailyRunRateGbp,
    projectedMonthEndGbp,
  };
}

/**
 * Checks if an invoice is overdue (7 days without payment, or 7 days since last follow-up)
 */
export interface InvoiceAgingInfo {
  isOverdue: boolean;
  daysElapsed: number;
  daysRemaining: number;
  statusLabel: 'on_track' | 'due_today' | 'overdue' | 'paid';
  followUpThreshold: number;
  baseDate: string;
  isFollowUpActive: boolean;
}

export function checkInvoiceAging(deal: Deal, referenceDate: Date = new Date()): InvoiceAgingInfo {
  if (deal.stage === 'closed_won' || deal.paidDate) {
    return {
      isOverdue: false,
      daysElapsed: 0,
      daysRemaining: 0,
      statusLabel: 'paid',
      followUpThreshold: deal.followUpDays || 7,
      baseDate: deal.paidDate || deal.invoiceDate || '',
      isFollowUpActive: false,
    };
  }

  const baseDateStr = deal.lastFollowUpDate || deal.invoiceDate;
  const isFollowUpActive = Boolean(deal.lastFollowUpDate);

  if (!baseDateStr) {
    return {
      isOverdue: false,
      daysElapsed: 0,
      daysRemaining: deal.followUpDays || 7,
      statusLabel: 'on_track',
      followUpThreshold: deal.followUpDays || 7,
      baseDate: '',
      isFollowUpActive: false,
    };
  }

  const baseDate = new Date(baseDateStr);
  const now = referenceDate;
  const threshold = deal.followUpDays || 7;

  const diffTime = now.getTime() - baseDate.getTime();
  const daysElapsed = Math.max(0, Math.floor(diffTime / (1000 * 60 * 60 * 24)));
  const daysRemaining = threshold - daysElapsed;

  if (daysRemaining < 0) {
    return {
      isOverdue: true,
      daysElapsed,
      daysRemaining: 0,
      statusLabel: 'overdue',
      followUpThreshold: threshold,
      baseDate: baseDateStr,
      isFollowUpActive,
    };
  } else if (daysRemaining === 0) {
    return {
      isOverdue: true,
      daysElapsed,
      daysRemaining: 0,
      statusLabel: 'due_today',
      followUpThreshold: threshold,
      baseDate: baseDateStr,
      isFollowUpActive,
    };
  } else {
    return {
      isOverdue: false,
      daysElapsed,
      daysRemaining,
      statusLabel: 'on_track',
      followUpThreshold: threshold,
      baseDate: baseDateStr,
      isFollowUpActive,
    };
  }
}
