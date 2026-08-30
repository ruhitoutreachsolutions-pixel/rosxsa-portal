import {
  TeamMember,
  MasterRecord,
  Deal,
  MonthlyQuotas,
  NotificationItem,
  ScrubBatchSummary,
  UserAccount,
  MeetingCountType,
} from '../types';
import { checkInvoiceAging } from './currency';

const STORAGE_KEYS = {
  USERS: 'rosxsa_user_accounts',
  SESSION: 'rosxsa_active_session',
  TEAM: 'rosxsa_team_members',
  MASTER: 'rosxsa_master_records',
  DEALS: 'rosxsa_deals',
  QUOTAS: 'rosxsa_monthly_quotas',
  NOTIFICATIONS_READ: 'rosxsa_notifications_read',
  SCRUB_HISTORY: 'rosxsa_scrub_history',
};

// Initial Seed Users with dedicated Owner credentials
export const INITIAL_USERS: UserAccount[] = [
  {
    id: 'user-owner',
    fullName: 'Ruhit (Owner)',
    username: 'ruhit',
    password: 'ROS@Owner2026!',
    role: 'admin',
    avatarColor: '#00C2FF',
    createdAt: new Date().toISOString(),
  }
];

// Initial Seed Team Members (12 Members)
export const INITIAL_TEAM_MEMBERS: TeamMember[] = [
  // 5 Sales Team Members
  { id: 'sales-1', name: 'Farzan', role: 'sales', email: 'farzan@staffasia.org', avatarColor: '#00C2FF' },
  { id: 'sales-2', name: 'Abrar', role: 'sales', email: 'abrar@staffasia.org', avatarColor: '#00E5A0' },
  { id: 'sales-3', name: 'Sagar', role: 'sales', email: 'sagar@staffasia.org', avatarColor: '#F97316' },
  { id: 'sales-4', name: 'Anis', role: 'sales', email: 'anis@staffasia.org', avatarColor: '#8B5CF6' },
  { id: 'sales-5', name: 'Shipu', role: 'sales', email: 'shipu@staffasia.org', avatarColor: '#EC4899' },
  // 7 Lead Gen Team Members
  { id: 'lead-1', name: 'Ruhit', role: 'lead_gen', email: 'ruhitahmed111@gmail.com', avatarColor: '#3B82F6' },
  { id: 'lead-2', name: 'Nayeem', role: 'lead_gen', email: 'nayeem@ruhitoutreach.com', avatarColor: '#10B981' },
  { id: 'lead-3', name: 'Tushar', role: 'lead_gen', email: 'tushar@ruhitoutreach.com', avatarColor: '#F59E0B' },
  { id: 'lead-4', name: 'Rafiq', role: 'lead_gen', email: 'rafiq@ruhitoutreach.com', avatarColor: '#6366F1' },
  { id: 'lead-5', name: 'Arshad', role: 'lead_gen', email: 'arshad@ruhitoutreach.com', avatarColor: '#14B8A6' },
  { id: 'lead-6', name: 'Azraf', role: 'lead_gen', email: 'azraf@ruhitoutreach.com', avatarColor: '#E11D48' },
  { id: 'lead-7', name: 'Shahin', role: 'lead_gen', email: 'shahin@ruhitoutreach.com', avatarColor: '#84CC16' },
];

export const INITIAL_QUOTAS: MonthlyQuotas = {
  month: new Date().getMonth() + 1,
  year: new Date().getFullYear(),
  companyTargetGbp: 25000,
  salesTargets: [
    { memberId: 'sales-1', memberName: 'Farzan', targetGbp: 5000 },
    { memberId: 'sales-2', memberName: 'Abrar', targetGbp: 5000 },
    { memberId: 'sales-3', memberName: 'Sagar', targetGbp: 5000 },
    { memberId: 'sales-4', memberName: 'Anis', targetGbp: 5000 },
    { memberId: 'sales-5', memberName: 'Shipu', targetGbp: 5000 },
  ],
  leadGenTargets: [
    { memberId: 'lead-1', memberName: 'Ruhit', targetMeetings: 16 },
    { memberId: 'lead-2', memberName: 'Nayeem', targetMeetings: 14 },
    { memberId: 'lead-3', memberName: 'Tushar', targetMeetings: 14 },
    { memberId: 'lead-4', memberName: 'Rafiq', targetMeetings: 12 },
    { memberId: 'lead-5', memberName: 'Arshad', targetMeetings: 12 },
    { memberId: 'lead-6', memberName: 'Azraf', targetMeetings: 10 },
    { memberId: 'lead-7', memberName: 'Shahin', targetMeetings: 10 },
  ],
};

const getPastDateString = (daysAgo: number) => {
  const d = new Date();
  d.setDate(d.getDate() - daysAgo);
  return d.toISOString().split('T')[0];
};

// Initial Deals (Empty for clean production start)
export const INITIAL_DEALS: Deal[] = [];

// Initial Master Records (Empty for clean production start)
export const INITIAL_MASTER_RECORDS: MasterRecord[] = [];

export class StorageService {
  private static load<T>(key: string, defaultVal: T): T {
    try {
      const data = localStorage.getItem(key);
      if (!data) return defaultVal;
      return JSON.parse(data);
    } catch (e) {
      console.warn(`Error loading storage key ${key}:`, e);
      return defaultVal;
    }
  }

  private static save<T>(key: string, value: T): void {
    try {
      localStorage.setItem(key, JSON.stringify(value));
    } catch (e) {
      console.error(`Error saving storage key ${key}:`, e);
    }
  }

  // Users & Authentication
  static getUsers(): UserAccount[] {
    const users = this.load<UserAccount[]>(STORAGE_KEYS.USERS, INITIAL_USERS);
    return users.map((u) => ({
      ...u,
      fullName: u.fullName.replace(' (Owner / Founder)', ' (Owner)'),
    }));
  }

  static saveUsers(users: UserAccount[]): void {
    this.save(STORAGE_KEYS.USERS, users);
  }

  static getActiveSession(): UserAccount | null {
    const session = this.load<UserAccount | null>(STORAGE_KEYS.SESSION, null);
    if (!session) return null;
    return {
      ...session,
      fullName: session.fullName.replace(' (Owner / Founder)', ' (Owner)'),
    };
  }

  static setActiveSession(user: UserAccount | null): void {
    if (user) {
      user.fullName = user.fullName.replace(' (Owner / Founder)', ' (Owner)');
    }
    this.save(STORAGE_KEYS.SESSION, user);
  }

  // Team Roster
  static getTeamMembers(): TeamMember[] {
    return this.load<TeamMember[]>(STORAGE_KEYS.TEAM, INITIAL_TEAM_MEMBERS);
  }

  static saveTeamMembers(members: TeamMember[]): void {
    this.save(STORAGE_KEYS.TEAM, members);
  }

  static addTeamMember(member: TeamMember): TeamMember[] {
    const members = this.getTeamMembers();
    const updated = [...members, member];
    this.saveTeamMembers(updated);

    // Also auto-create a User Account for this member
    const users = this.getUsers();
    const username = member.name.toLowerCase().replace(/\s+/g, '');
    if (!users.some((u) => u.username === username)) {
      users.push({
        id: `user-${Date.now()}`,
        fullName: member.name,
        username,
        password: '123',
        role: member.role,
        avatarColor: member.avatarColor || '#00C2FF',
        createdAt: new Date().toISOString(),
      });
      this.saveUsers(users);
    }

    return updated;
  }

  static updateTeamMember(member: TeamMember): TeamMember[] {
    const members = this.getTeamMembers();
    const index = members.findIndex((m) => m.id === member.id);
    if (index >= 0) {
      members[index] = member;
      this.saveTeamMembers(members);
    }
    return members;
  }

  static deleteTeamMember(id: string): TeamMember[] {
    const members = this.getTeamMembers().filter((m) => m.id !== id);
    this.saveTeamMembers(members);
    return members;
  }

  // Master Records & Deals
  static getMasterRecords(): MasterRecord[] {
    return this.load<MasterRecord[]>(STORAGE_KEYS.MASTER, INITIAL_MASTER_RECORDS);
  }

  static saveMasterRecords(records: MasterRecord[]): void {
    this.save(STORAGE_KEYS.MASTER, records);
  }

  static getDeals(): Deal[] {
    return this.load<Deal[]>(STORAGE_KEYS.DEALS, INITIAL_DEALS);
  }

  static saveDeals(deals: Deal[]): void {
    this.save(STORAGE_KEYS.DEALS, deals);
  }

  static getQuotas(): MonthlyQuotas {
    return this.load<MonthlyQuotas>(STORAGE_KEYS.QUOTAS, INITIAL_QUOTAS);
  }

  static saveQuotas(quotas: MonthlyQuotas): void {
    this.save(STORAGE_KEYS.QUOTAS, quotas);
  }

  static getDismissedNotificationIds(): string[] {
    return this.load<string[]>(STORAGE_KEYS.NOTIFICATIONS_READ, []);
  }

  static saveDismissedNotificationIds(ids: string[]): void {
    this.save(STORAGE_KEYS.NOTIFICATIONS_READ, ids);
  }

  // Follow-up on Deal
  static logDealFollowUp(dealId: string, followUpDate: string, note: string, repName: string): Deal[] {
    const deals = this.getDeals();
    const index = deals.findIndex((d) => d.id === dealId);

    if (index >= 0) {
      const deal = deals[index];
      const history = deal.followUpHistory || [];
      const newEntry = {
        date: followUpDate || new Date().toISOString().split('T')[0],
        note: note || 'Follow-up email sent regarding payment.',
        repName: repName || deal.salesRep,
      };

      deals[index] = {
        ...deal,
        lastFollowUpDate: followUpDate || new Date().toISOString().split('T')[0],
        followUpHistory: [newEntry, ...history],
        notes: `${deal.notes ? deal.notes + ' | ' : ''}Follow-up sent on ${followUpDate}: ${note}`,
        updatedAt: new Date().toISOString(),
      };
      this.saveDeals(deals);
    }
    return deals;
  }

  // Admin Approve Meeting Count (YES / NO)
  static approveMeetingCount(recordId: string, approvalType: MeetingCountType, adminName: string): MasterRecord[] {
    const records = this.getMasterRecords();
    const index = records.findIndex((r) => r.id === recordId);

    if (index >= 0) {
      const rec = records[index];
      const audit = rec.auditHistory || [];

      records[index] = {
        ...rec,
        meetingCountType: approvalType,
        updatedAt: new Date().toISOString(),
        auditHistory: [
          {
            timestamp: new Date().toISOString(),
            user: adminName,
            action: `Admin Approved Meeting Quota Count: ${approvalType.toUpperCase()}`,
          },
          ...audit,
        ],
      };
      this.saveMasterRecords(records);
    }
    return records;
  }

  // Upsert Deal
  static upsertDeal(deal: Deal): Deal[] {
    const deals = this.getDeals();
    const index = deals.findIndex((d) => d.id === deal.id);
    let updated: Deal[];

    if (index >= 0) {
      updated = [...deals];
      updated[index] = { ...deal, updatedAt: new Date().toISOString() };
    } else {
      updated = [{ ...deal, createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() }, ...deals];
    }

    this.saveDeals(updated);
    return updated;
  }

  // Mark Deal as Paid
  static markDealAsPaid(dealId: string, paidDate: string, notes?: string): { deals: Deal[]; masterRecords: MasterRecord[] } {
    const deals = this.getDeals();
    const masterRecords = this.getMasterRecords();

    const dealIndex = deals.findIndex((d) => d.id === dealId);
    if (dealIndex >= 0) {
      const deal = deals[dealIndex];
      const updatedDeal: Deal = {
        ...deal,
        stage: 'closed_won',
        paidDate: paidDate || new Date().toISOString().split('T')[0],
        notes: notes ? `${deal.notes ? deal.notes + ' | ' : ''}${notes}` : deal.notes,
        updatedAt: new Date().toISOString(),
      };
      deals[dealIndex] = updatedDeal;
      this.saveDeals(deals);

      // Protect domain in master records
      const existingMasterIndex = masterRecords.findIndex(
        (m) => m.email.toLowerCase() === deal.email.toLowerCase() || (m.domain && m.domain.toLowerCase() === deal.domain.toLowerCase())
      );

      if (existingMasterIndex >= 0) {
        masterRecords[existingMasterIndex] = {
          ...masterRecords[existingMasterIndex],
          status: 'paid_client',
          companyName: deal.companyName,
          salesRep: deal.salesRep,
          leadGenRep: deal.leadGenRep,
          updatedAt: new Date().toISOString(),
        };
      } else {
        masterRecords.unshift({
          id: `master-${Date.now()}`,
          email: deal.email,
          domain: deal.domain,
          companyName: deal.companyName,
          contactName: deal.contactName,
          status: 'paid_client',
          salesRep: deal.salesRep,
          leadGenRep: deal.leadGenRep,
          notes: `Paid client (£${deal.valueGbp}) - Closed by ${deal.salesRep}`,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        });
      }
      this.saveMasterRecords(masterRecords);
    }

    return { deals, masterRecords };
  }

  // Mark Deal as Lost & Automatically upload to Master Database as DNC
  static markDealAsLost(dealId: string, lostReason: string = 'Deal Lost', userNotes?: string, repName?: string): { deals: Deal[]; masterRecords: MasterRecord[] } {
    const deals = this.getDeals();
    const masterRecords = this.getMasterRecords();

    const dealIndex = deals.findIndex((d) => d.id === dealId);
    if (dealIndex >= 0) {
      const deal = deals[dealIndex];
      const updatedDeal: Deal = {
        ...deal,
        stage: 'closed_lost',
        notes: userNotes ? `${deal.notes ? deal.notes + ' | ' : ''}Lost: ${lostReason} - ${userNotes}` : (deal.notes || `Deal Lost (${lostReason})`),
        updatedAt: new Date().toISOString(),
      };
      deals[dealIndex] = updatedDeal;
      this.saveDeals(deals);

      // Look up corresponding Master Record or create DNC record
      const cleanEmail = deal.email.toLowerCase().trim();
      const cleanDomain = deal.domain.toLowerCase().trim();
      const masterIndex = masterRecords.findIndex(
        (m) => m.email.toLowerCase().trim() === cleanEmail || (cleanDomain !== 'unknown' && m.domain.toLowerCase().trim() === cleanDomain)
      );

      const dncNote = `❌ DEAL LOST: ${lostReason}${userNotes ? ' - ' + userNotes : ''} [Logged by ${repName || deal.salesRep} on ${new Date().toISOString().split('T')[0]}]`;

      if (masterIndex >= 0) {
        const rec = masterRecords[masterIndex];
        const audit = rec.auditHistory || [];
        masterRecords[masterIndex] = {
          ...rec,
          status: 'dnc',
          dncReason: 'other',
          notes: rec.notes ? `${rec.notes}\n${dncNote}` : dncNote,
          updatedAt: new Date().toISOString(),
          auditHistory: [
            {
              timestamp: new Date().toISOString(),
              user: repName || deal.salesRep,
              action: `Deal Lost -> Moved to DNC (${lostReason})`,
            },
            ...audit,
          ],
        };
      } else {
        // Create new Master Record as DNC
        masterRecords.unshift({
          id: `master-${Date.now()}`,
          email: cleanEmail,
          domain: cleanDomain || 'unknown',
          companyName: deal.companyName,
          contactName: deal.contactName,
          status: 'dnc',
          dncReason: 'other',
          notes: dncNote,
          leadGenRep: deal.leadGenRep,
          salesRep: deal.salesRep,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
          auditHistory: [
            {
              timestamp: new Date().toISOString(),
              user: repName || deal.salesRep,
              action: `Deal Lost -> Created as DNC (${lostReason})`,
            },
          ],
        });
      }

      this.saveMasterRecords(masterRecords);
    }

    return { deals, masterRecords };
  }

  // Upsert Master Record
  static upsertMasterRecord(record: MasterRecord): MasterRecord[] {
    const records = this.getMasterRecords();
    const index = records.findIndex((r) => r.email.toLowerCase() === record.email.toLowerCase());
    let updated: MasterRecord[];

    if (index >= 0) {
      updated = [...records];
      updated[index] = { ...record, updatedAt: new Date().toISOString() };
    } else {
      updated = [{ ...record, id: record.id || `master-${Date.now()}`, createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() }, ...records];
    }

    this.saveMasterRecords(updated);
    return updated;
  }

  // Dynamic system notifications (Overdue invoices + Meeting approvals for Admin)
  static getNotifications(): NotificationItem[] {
    const deals = this.getDeals();
    const masterRecords = this.getMasterRecords();
    const dismissed = new Set(this.getDismissedNotificationIds());
    const notifications: NotificationItem[] = [];

    // 1. Overdue Invoices
    deals.forEach((deal) => {
      if (deal.stage === 'invoice_sent' || deal.stage === 'payment_pending') {
        const aging = checkInvoiceAging(deal);
        if (aging.isOverdue) {
          const notifId = `notif-overdue-${deal.id}-${aging.baseDate}`;
          const isRead = dismissed.has(notifId);

          const followUpSubtitle = aging.isFollowUpActive
            ? `(Last Follow-up: ${aging.baseDate} - ${aging.daysElapsed} days ago)`
            : `(Sent: ${deal.invoiceDate} - ${aging.daysElapsed} days ago)`;

          notifications.push({
            id: notifId,
            type: 'invoice_overdue',
            title: `Overdue Invoice (£${deal.valueGbp.toLocaleString()}) - ${deal.salesRep}`,
            message: `${deal.companyName} invoice #${deal.invoiceNumber || 'N/A'} is ${aging.daysElapsed} days past threshold ${followUpSubtitle}.`,
            dealId: deal.id,
            date: aging.baseDate,
            isRead,
            severity: 'high',
          });
        }
      }
    });

    // 2. Pending Meeting Count Approvals (for Admin)
    masterRecords.forEach((rec) => {
      if (rec.status === 'meeting_done' && rec.meetingCountType === 'pending') {
        const notifId = `notif-meeting-approval-${rec.id}`;
        const isRead = dismissed.has(notifId);

        notifications.push({
          id: notifId,
          type: 'meeting_approval',
          title: `Meeting Quota Approval: ${rec.companyName || rec.domain}`,
          message: `${rec.leadGenRep || 'Lead Rep'} logged a completed meeting. Awaiting admin approval to add to monthly meeting quota count.`,
          masterRecordId: rec.id,
          leadGenRep: rec.leadGenRep,
          currentMeetingCountType: rec.meetingCountType,
          date: rec.updatedAt ? rec.updatedAt.split('T')[0] : 'Today',
          isRead,
          severity: 'medium',
        });
      }
    });

    return notifications;
  }

  static dismissNotification(id: string): void {
    const ids = this.getDismissedNotificationIds();
    if (!ids.includes(id)) {
      ids.push(id);
      this.saveDismissedNotificationIds(ids);
    }
  }

  // Reset to default
  static resetToDefaultData(): void {
    localStorage.setItem(STORAGE_KEYS.USERS, JSON.stringify(INITIAL_USERS));
    localStorage.setItem(STORAGE_KEYS.TEAM, JSON.stringify(INITIAL_TEAM_MEMBERS));
    localStorage.setItem(STORAGE_KEYS.MASTER, JSON.stringify(INITIAL_MASTER_RECORDS));
    localStorage.setItem(STORAGE_KEYS.DEALS, JSON.stringify(INITIAL_DEALS));
    localStorage.setItem(STORAGE_KEYS.QUOTAS, JSON.stringify(INITIAL_QUOTAS));
    localStorage.removeItem(STORAGE_KEYS.NOTIFICATIONS_READ);
  }

  static exportFullBackup(): string {
    const data = {
      version: '3.0.0',
      exportedAt: new Date().toISOString(),
      users: this.getUsers(),
      teamMembers: this.getTeamMembers(),
      masterRecords: this.getMasterRecords(),
      deals: this.getDeals(),
      quotas: this.getQuotas(),
    };
    return JSON.stringify(data, null, 2);
  }

  static clearAllLeadsAndDeals(): void {
    this.saveDeals([]);
    this.saveMasterRecords([]);
  }

  static importFullBackup(jsonString: string): boolean {
    try {
      const data = JSON.parse(jsonString);
      if (data.users) this.saveUsers(data.users);
      if (data.teamMembers) this.saveTeamMembers(data.teamMembers);
      if (data.masterRecords) this.saveMasterRecords(data.masterRecords);
      if (data.deals) this.saveDeals(data.deals);
      if (data.quotas) this.saveQuotas(data.quotas);
      return true;
    } catch (e) {
      console.error('Failed to import backup JSON:', e);
      return false;
    }
  }
}
