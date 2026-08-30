export type TeamRole = 'sales' | 'lead_gen' | 'admin';

export interface TeamMember {
  id: string;
  name: string;
  role: TeamRole;
  email?: string;
  avatarColor?: string;
}

export interface UserAccount {
  id: string;
  fullName: string;
  username: string;
  password?: string;
  role: TeamRole;
  avatarColor?: string;
  createdAt: string;
}

export type LeadStatus =
  | 'dnc'
  | 'interested'
  | 'in_conversation'
  | 'meeting_scheduled'
  | 'meeting_done'
  | 'demo_sent'
  | 'invoice_sent'
  | 'paid_client'
  | 'cold_lead';

export type DncReason =
  | 'unsubscribed'
  | 'hostile'
  | 'wrong_person'
  | 'bounced'
  | 'competitor'
  | 'other';

export type MeetingCountType = 'yes' | 'no' | 'pending';

export interface AuditLogEntry {
  timestamp: string;
  user: string;
  action: string;
  details?: string;
}

export interface MasterRecord {
  id: string;
  email: string;
  domain: string;
  companyName?: string;
  contactName?: string;
  website?: string;
  country?: string;
  jobTitle?: string;
  phone?: string;
  linkedInUrl?: string;
  status: LeadStatus;
  dncReason?: DncReason;
  notes?: string;
  leadGenRep?: string;
  salesRep?: string;
  meetingScheduledDate?: string;
  meetingCompletedDate?: string;
  meetingCompleted?: boolean;
  meetingCountType?: MeetingCountType;
  lastFollowUpDate?: string;
  createdBy?: string;
  createdAt: string;
  updatedAt: string;
  auditHistory?: AuditLogEntry[];
}

export type DealStage =
  | 'discovery_pitch'
  | 'demo_sent'
  | 'invoice_sent'
  | 'payment_pending'
  | 'closed_won'
  | 'closed_lost';

export interface Deal {
  id: string;
  title: string;
  companyName: string;
  contactName?: string;
  email: string;
  domain: string;
  valueGbp: number;
  stage: DealStage;
  hasPricingGiven?: boolean;
  discoveryDate?: string;
  demoSentDate?: string;
  invoiceDate?: string;
  invoiceNumber?: string;
  paymentPendingDate?: string;
  followUpDays?: number;
  lastFollowUpDate?: string;
  followUpHistory?: { date: string; note: string; repName: string }[];
  dueAlertDate?: string;
  paidDate?: string;
  salesRep: string; // Farzan, Abrar, Sagar, Anis, Shipu
  leadGenRep?: string; // Ruhit, Nayeem, Tushar, Rafiq, Arshad, Azraf, Shahin
  notes?: string;
  meetingScheduledDate?: string;
  meetingCompleted?: boolean;
  meetingCompletedDate?: string;
  meetingCountType?: MeetingCountType;
  createdAt: string;
  updatedAt: string;
}

export interface SalesTarget {
  memberId: string;
  memberName: string;
  targetGbp: number;
}

export interface LeadGenTarget {
  memberId: string;
  memberName: string;
  targetMeetings: number;
}

export interface CompanyHoliday {
  date: string; // YYYY-MM-DD
  title: string; // e.g. "Summer Bank Holiday"
}

export interface MonthlyQuotas {
  month: number;
  year: number;
  companyTargetGbp: number;
  salesTargets: SalesTarget[];
  leadGenTargets: LeadGenTarget[];
  holidays?: CompanyHoliday[];
}

export type ScrubStatus =
  | 'safe'
  | 'dnc_block'
  | 'sales_conflict'
  | 'interested_conflict'
  | 'in_conversation_conflict'
  | 'intra_batch_dup'
  | 'freemail_warning';

export interface ScrubResultItem {
  id: string;
  rawEmail: string;
  normalizedEmail: string;
  domain: string;
  companyName?: string;
  contactName?: string;
  status: ScrubStatus;
  reason: string;
  ownerRep?: string;
  matchedRecord?: MasterRecord | Deal;
  isFlagged: boolean;
}

export interface ScrubBatchSummary {
  batchId: string;
  processedAt: string;
  repName: string;
  totalSubmitted: number;
  totalSafe: number;
  totalDncBlocked: number;
  totalSalesConflict: number;
  totalInterestedConflict: number;
  totalDuplicates: number;
  results: ScrubResultItem[];
}

export interface NotificationItem {
  id: string;
  type: 'invoice_overdue' | 'deal_collision' | 'target_milestone' | 'meeting_booked' | 'meeting_approval' | 'info';
  title: string;
  message: string;
  dealId?: string;
  masterRecordId?: string;
  leadGenRep?: string;
  currentMeetingCountType?: MeetingCountType;
  date: string;
  isRead: boolean;
  severity: 'high' | 'medium' | 'low';
}
