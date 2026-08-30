import React, { useState, useEffect } from 'react';
import { Header } from './components/Header';
import { Sidebar, TabType } from './components/Sidebar';
import { OverviewKPIs } from './components/Dashboard/OverviewKPIs';
import { TargetPacingCard } from './components/Dashboard/TargetPacingCard';
import { SalesLeaderboard } from './components/Dashboard/SalesLeaderboard';
import { LeadGenLeaderboard } from './components/Dashboard/LeadGenLeaderboard';
import { BulkScrubber } from './components/Scrubber/BulkScrubber';
import { DealPipeline } from './components/Sales/DealPipeline';
import { MasterRepository } from './components/MasterDatabase/MasterRepository';
import { SettingsView } from './components/Settings/SettingsView';

// Modals & Auth
import { LoginPage } from './components/Auth/LoginPage';
import { QuickLeadModal } from './components/QuickLeadModal';
import { InvoiceModal } from './components/Sales/InvoiceModal';
import { MarkPaidModal } from './components/Sales/MarkPaidModal';
import { TargetManagerModal } from './components/Settings/TargetManagerModal';
import { SupabaseConfigModal } from './components/Settings/SupabaseConfigModal';
import { DataManagementModal } from './components/Settings/DataManagementModal';
import { NotificationDrawer } from './components/NotificationDrawer';

// Storage & Types
import { StorageService } from './lib/storage';
import {
  getStoredSupabaseConfig,
  getSupabase,
  fetchMasterRecordsFromSupabase,
  saveMasterRecordToSupabase,
  deleteMasterRecordFromSupabase,
  fetchDealsFromSupabase,
  saveDealToSupabase,
  fetchTeamMembersFromSupabase,
  saveTeamMemberToSupabase,
  fetchQuotasFromSupabase,
  saveQuotasToSupabase,
  saveUserToSupabase,
} from './lib/supabase';
import { Deal, DealStage, MasterRecord, MonthlyQuotas, TeamMember, UserAccount, MeetingCountType } from './types';
import { checkInvoiceAging } from './lib/currency';

export function App() {
  // Authentication State
  const [currentUser, setCurrentUser] = useState<UserAccount | null>(StorageService.getActiveSession());
  const [users, setUsers] = useState<UserAccount[]>(StorageService.getUsers());

  // App Navigation State
  const [currentTab, setCurrentTab] = useState<TabType>('dashboard');
  const [teamMembers, setTeamMembers] = useState<TeamMember[]>([]);
  const [deals, setDeals] = useState<Deal[]>([]);
  const [masterRecords, setMasterRecords] = useState<MasterRecord[]>([]);
  const [quotas, setQuotas] = useState<MonthlyQuotas>(StorageService.getQuotas());
  const [isSupabaseConnected, setIsSupabaseConnected] = useState(false);

  // Modal visibility states
  const [isQuickLeadOpen, setIsQuickLeadOpen] = useState(false);
  const [isInvoiceModalOpen, setIsInvoiceModalOpen] = useState(false);
  const [dealToEdit, setDealToEdit] = useState<Deal | null>(null);
  const [dealToMarkPaid, setDealToMarkPaid] = useState<Deal | null>(null);
  const [isTargetManagerOpen, setIsTargetManagerOpen] = useState(false);
  const [isSupabaseConfigOpen, setIsSupabaseConfigOpen] = useState(false);
  const [isDataManagementOpen, setIsDataManagementOpen] = useState(false);
  const [isNotificationsOpen, setIsNotificationsOpen] = useState(false);

  // Load Initial Data & Sync Cloud in background
  const reloadData = () => {
    setUsers(StorageService.getUsers());
    setTeamMembers(StorageService.getTeamMembers());
    setDeals(StorageService.getDeals());
    setMasterRecords(StorageService.getMasterRecords());
    setQuotas(StorageService.getQuotas());

    const { url, anonKey } = getStoredSupabaseConfig();
    setIsSupabaseConnected(Boolean(url && anonKey));
  };

  const syncFromCloud = async () => {
    const { url, anonKey } = getStoredSupabaseConfig();
    if (!url || !anonKey) return;

    try {
      const [cloudRecords, cloudDeals, cloudMembers, cloudQuotas] = await Promise.all([
        fetchMasterRecordsFromSupabase(),
        fetchDealsFromSupabase(),
        fetchTeamMembersFromSupabase(),
        fetchQuotasFromSupabase(),
      ]);

      if (cloudRecords !== null) {
        StorageService.saveMasterRecords(cloudRecords);
        setMasterRecords(cloudRecords);
      }
      if (cloudDeals !== null) {
        StorageService.saveDeals(cloudDeals);
        setDeals(cloudDeals);
      }
      if (cloudMembers !== null && cloudMembers.length > 0) {
        StorageService.saveTeamMembers(cloudMembers);
        setTeamMembers(cloudMembers);
      }
      if (cloudQuotas !== null) {
        StorageService.saveQuotas(cloudQuotas);
        setQuotas(cloudQuotas);
      }
      setIsSupabaseConnected(true);
    } catch (e) {
      console.warn('Cloud sync background error:', e);
    }
  };

  // Multi-tab sync channel
  const broadcastLocalChange = () => {
    if (typeof window !== 'undefined' && 'BroadcastChannel' in window) {
      try {
        const bc = new BroadcastChannel('rosxsa_portal_live_channel');
        bc.postMessage({ type: 'SYNC', time: Date.now() });
        bc.close();
      } catch (e) {
        // ignore
      }
    }
  };

  useEffect(() => {
    reloadData();
    syncFromCloud();

    // 1. Listen for BroadcastChannel events (intra-browser tabs)
    let bc: BroadcastChannel | null = null;
    if (typeof window !== 'undefined' && 'BroadcastChannel' in window) {
      try {
        bc = new BroadcastChannel('rosxsa_portal_live_channel');
        bc.onmessage = () => {
          reloadData();
          syncFromCloud();
        };
      } catch (e) {
        // ignore
      }
    }

    // 2. Window Focus & Visibility Listener (instant sync on switching tabs)
    const handleFocus = () => {
      syncFromCloud();
    };
    window.addEventListener('focus', handleFocus);
    document.addEventListener('visibilitychange', handleFocus);

    // 3. Fast Background Polling Fallback (every 3.5s so users NEVER need to manually refresh)
    const pollInterval = setInterval(() => {
      syncFromCloud();
    }, 3500);

    // 4. Supabase Realtime Channel
    const client = getSupabase();
    let channel: any = null;
    if (client) {
      channel = client
        .channel('rosxsa-realtime-global')
        .on('postgres_changes', { event: '*', schema: 'public', table: 'master_records' }, () => {
          syncFromCloud();
        })
        .on('postgres_changes', { event: '*', schema: 'public', table: 'deals' }, () => {
          syncFromCloud();
        })
        .on('postgres_changes', { event: '*', schema: 'public', table: 'team_members' }, () => {
          syncFromCloud();
        })
        .on('postgres_changes', { event: '*', schema: 'public', table: 'monthly_quotas' }, () => {
          syncFromCloud();
        })
        .subscribe();
    }

    return () => {
      if (bc) bc.close();
      window.removeEventListener('focus', handleFocus);
      document.removeEventListener('visibilitychange', handleFocus);
      clearInterval(pollInterval);
      if (client && channel) {
        client.removeChannel(channel);
      }
    };
  }, []);

  // Login & Logout Handlers
  const handleLogin = (user: UserAccount) => {
    StorageService.setActiveSession(user);
    setCurrentUser(user);

    // If new user registered, save to accounts list
    const existing = StorageService.getUsers();
    if (!existing.some((u) => u.username === user.username)) {
      const updatedUsers = [...existing, user];
      StorageService.saveUsers(updatedUsers);
      setUsers(updatedUsers);
    }

    // Default landing tab
    setCurrentTab('dashboard');
    syncFromCloud();
    broadcastLocalChange();
  };

  const handleLogout = () => {
    StorageService.setActiveSession(null);
    setCurrentUser(null);
  };

  // If not logged in, show Login Screen
  if (!currentUser) {
    return <LoginPage onLogin={handleLogin} existingUsers={users} />;
  }

  // Notifications & Overdue Calculations
  const notifications = StorageService.getNotifications();
  const unreadNotifications = notifications.filter((n) => {
    if (n.isRead) return false;
    if (currentUser.role === 'lead_gen' && n.type === 'invoice_overdue') return false;
    if (currentUser.role !== 'admin' && n.type === 'meeting_approval') return false;
    return true;
  });

  const overdueDeals = deals.filter(
    (d) =>
      (d.stage === 'invoice_sent' || d.stage === 'payment_pending') &&
      checkInvoiceAging(d).isOverdue
  );

  const salesReps = teamMembers.filter((m) => m.role === 'sales');
  const leadGenReps = teamMembers.filter((m) => m.role === 'lead_gen');

  // Save / Update Handlers
  const handleSaveDeal = (deal: Deal) => {
    if (deal.stage === 'closed_lost') {
      const res = StorageService.markDealAsLost(deal.id, 'Closed Lost', deal.notes, currentUser.fullName);
      setDeals(res.deals);
      setMasterRecords(res.masterRecords);

      const lostDeal = res.deals.find((d) => d.id === deal.id);
      if (lostDeal) saveDealToSupabase(lostDeal);
      const lostMaster = res.masterRecords.find((m) => m.email.toLowerCase().trim() === deal.email.toLowerCase().trim());
      if (lostMaster) saveMasterRecordToSupabase(lostMaster);
    } else {
      const res = StorageService.upsertDeal(deal);
      setDeals(res.deals);
      setMasterRecords(res.masterRecords);

      saveDealToSupabase(deal);
      const matchingMaster = res.masterRecords.find((m) => m.email.toLowerCase().trim() === deal.email.toLowerCase().trim());
      if (matchingMaster) saveMasterRecordToSupabase(matchingMaster);
    }
    broadcastLocalChange();
  };

  const handleUpdateDealStage = (dealId: string, newStage: DealStage) => {
    if (newStage === 'closed_lost') {
      const res = StorageService.markDealAsLost(dealId, 'Closed Lost', 'Moved to Closed Lost via Pipeline', currentUser.fullName);
      setDeals(res.deals);
      setMasterRecords(res.masterRecords);

      const lostDeal = res.deals.find((d) => d.id === dealId);
      if (lostDeal) saveDealToSupabase(lostDeal);
      const lostMaster = res.masterRecords.find((m) => lostDeal && m.email.toLowerCase().trim() === lostDeal.email.toLowerCase().trim());
      if (lostMaster) saveMasterRecordToSupabase(lostMaster);
    } else {
      const deal = deals.find((d) => d.id === dealId);
      if (deal) {
        const updatedDeal: Deal = {
          ...deal,
          stage: newStage,
          updatedAt: new Date().toISOString(),
        };
        const res = StorageService.upsertDeal(updatedDeal);
        setDeals(res.deals);
        setMasterRecords(res.masterRecords);
        saveDealToSupabase(updatedDeal);
        const matchingMaster = res.masterRecords.find((m) => m.email.toLowerCase().trim() === updatedDeal.email.toLowerCase().trim());
        if (matchingMaster) saveMasterRecordToSupabase(matchingMaster);
      }
    }
    broadcastLocalChange();
  };

  const handleSaveMasterRecord = (record: MasterRecord) => {
    const updated = StorageService.upsertMasterRecord(record);
    setMasterRecords(updated);
    saveMasterRecordToSupabase(record);
    broadcastLocalChange();
  };

  const handleConfirmPaid = (dealId: string, paidDate: string, notes?: string) => {
    const res = StorageService.markDealAsPaid(dealId, paidDate, notes);
    setDeals(res.deals);
    setMasterRecords(res.masterRecords);

    const paidDeal = res.deals.find((d) => d.id === dealId);
    if (paidDeal) saveDealToSupabase(paidDeal);
    const paidMaster = res.masterRecords.find(
      (m) => paidDeal && (m.email.toLowerCase() === paidDeal.email.toLowerCase() || m.domain.toLowerCase() === paidDeal.domain.toLowerCase())
    );
    if (paidMaster) saveMasterRecordToSupabase(paidMaster);
    broadcastLocalChange();
  };

  const handleSaveQuotas = (newQuotas: MonthlyQuotas) => {
    StorageService.saveQuotas(newQuotas);
    setQuotas(newQuotas);
    saveQuotasToSupabase(newQuotas);
    broadcastLocalChange();
  };

  const handleDeleteMasterRecord = (id: string) => {
    const targetRec = masterRecords.find((r) => r.id === id);
    const updated = masterRecords.filter((r) => r.id !== id);
    StorageService.saveMasterRecords(updated);
    setMasterRecords(updated);
    deleteMasterRecordFromSupabase(id, targetRec?.email);
    broadcastLocalChange();
  };

  const handleBulkAddMasterRecords = (newRecords: MasterRecord[]) => {
    const merged = [...newRecords, ...masterRecords];
    StorageService.saveMasterRecords(merged);
    setMasterRecords(merged);
    newRecords.forEach((r) => saveMasterRecordToSupabase(r));
    broadcastLocalChange();
  };

  // Follow-up logging from Notifications
  const handleLogFollowUp = (dealId: string, date: string, note: string) => {
    const updatedDeals = StorageService.logDealFollowUp(dealId, date, note, currentUser.fullName);
    setDeals([...updatedDeals]);
    const deal = updatedDeals.find((d) => d.id === dealId);
    if (deal) saveDealToSupabase(deal);
    broadcastLocalChange();
  };

  // Admin Approve Meeting Count
  const handleApproveMeetingCount = (masterRecordId: string, approvalType: MeetingCountType) => {
    const updated = StorageService.approveMeetingCount(masterRecordId, approvalType, currentUser.fullName);
    setMasterRecords(updated);
    const rec = updated.find((r) => r.id === masterRecordId);
    if (rec) saveMasterRecordToSupabase(rec);
    broadcastLocalChange();
  };

  const handleDismissNotification = (id: string) => {
    StorageService.dismissNotification(id);
    reloadData();
  };

  // Team Member Management Handlers (Owner can provision roles and passwords)
  const handleSaveMember = (member: TeamMember, credentials?: { username: string; password?: string }) => {
    const exists = teamMembers.some((m) => m.id === member.id);
    let updated: TeamMember[];
    if (exists) {
      updated = StorageService.updateTeamMember(member);
    } else {
      updated = StorageService.addTeamMember(member);
    }
    setTeamMembers(updated);
    saveTeamMemberToSupabase(member);

    // Update or create User Account credentials
    const currentUsers = StorageService.getUsers();
    const cleanUsername = credentials?.username?.toLowerCase() || member.name.toLowerCase().replace(/\s+/g, '');
    const userIndex = currentUsers.findIndex((u) => u.fullName.toLowerCase() === member.name.toLowerCase() || u.username === cleanUsername);

    let savedUser: UserAccount;
    if (userIndex >= 0) {
      savedUser = {
        ...currentUsers[userIndex],
        fullName: member.name,
        username: cleanUsername,
        password: credentials?.password || currentUsers[userIndex].password || '123',
        role: member.role,
        avatarColor: member.avatarColor || currentUsers[userIndex].avatarColor,
      };
      currentUsers[userIndex] = savedUser;
    } else {
      savedUser = {
        id: `user-${Date.now()}`,
        fullName: member.name,
        username: cleanUsername,
        password: credentials?.password || '123',
        role: member.role,
        avatarColor: member.avatarColor || '#00C2FF',
        createdAt: new Date().toISOString(),
      };
      currentUsers.push(savedUser);
    }

    StorageService.saveUsers(currentUsers);
    setUsers([...currentUsers]);

    // Save to Supabase Cloud DB
    saveUserToSupabase(savedUser);
  };

  const handleDeleteMember = (id: string) => {
    const updated = StorageService.deleteTeamMember(id);
    setTeamMembers(updated);
  };

  const closedWonDeals = deals.filter((d) => d.stage === 'closed_won');
  const closedRevenueGbp = closedWonDeals.reduce((sum, d) => sum + (d.valueGbp || 0), 0);

  return (
    <div className="min-h-screen bg-brand-black text-brand-white flex flex-col font-sans selection:bg-brand-cyan selection:text-brand-black">
      {/* Top Header */}
      <Header
        notifications={notifications}
        unreadCount={unreadNotifications.length}
        onOpenNotifications={() => setIsNotificationsOpen(true)}
        onOpenQuickLead={() => setIsQuickLeadOpen(true)}
        onOpenNewDeal={() => {
          setDealToEdit(null);
          setIsInvoiceModalOpen(true);
        }}
        onOpenSupabaseConfig={() => setIsSupabaseConfigOpen(true)}
        isSupabaseConnected={isSupabaseConnected}
        currentUser={currentUser}
        onLogout={handleLogout}
      />

      {/* Main Container with Sidebar + Content */}
      <div className="flex-1 flex flex-col md:flex-row">
        {/* Navigation Sidebar */}
        <Sidebar
          currentTab={currentTab}
          onSelectTab={setCurrentTab}
          overdueInvoiceCount={overdueDeals.length}
          teamMembers={teamMembers}
          currentUser={currentUser}
          onLogout={handleLogout}
        />

        {/* Dynamic Tab Body */}
        <main className="flex-1 p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto w-full space-y-6">
          {/* TAB 1: EXECUTIVE DASHBOARD & LEADERBOARDS (Visible to all) */}
          {currentTab === 'dashboard' && (
            <div className="space-y-6 animate-fade-in">
              {/* Executive Overview KPI Cards */}
              <OverviewKPIs deals={deals} masterRecords={masterRecords} />

              {/* Day-by-Day Target Pacing in British Pounds */}
              <TargetPacingCard
                closedRevenueGbp={closedRevenueGbp}
                quotas={quotas}
                onOpenTargetManager={() => setIsTargetManagerOpen(true)}
              />

              {/* Dual Ranked Leaderboards (Highest to Lowest) */}
              <div className="grid grid-cols-1 gap-6">
                {/* 1. Sales Team Leaderboard (Ranked by Opportunity Value £ GBP) */}
                <SalesLeaderboard
                  deals={deals}
                  quotas={quotas}
                  salesReps={salesReps}
                  onSelectRep={() => {
                    if (currentUser.role !== 'lead_gen') {
                      setCurrentTab('sales');
                    }
                  }}
                />

                {/* 2. Lead Gen Leaderboard (Ranked by Total Meeting Count) */}
                <LeadGenLeaderboard
                  deals={deals}
                  masterRecords={masterRecords}
                  quotas={quotas}
                  leadGenReps={leadGenReps}
                  onSelectRep={() => {
                    if (currentUser.role !== 'lead_gen') {
                      setCurrentTab('sales');
                    }
                  }}
                />
              </div>
            </div>
          )}

          {/* TAB 2: CAMPAIGN LIST SCRUBBER ("REMOVE DUPLICATE") */}
          {currentTab === 'scrubber' && (
            <div className="animate-fade-in">
              <BulkScrubber
                masterRecords={masterRecords}
                deals={deals}
                teamMembers={teamMembers}
              />
            </div>
          )}

          {/* TAB 3: SALES PIPELINE & INVOICE TRACKING (Hidden for Lead Gen) */}
          {currentTab === 'sales' && currentUser.role !== 'lead_gen' && (
            <div className="animate-fade-in">
              <DealPipeline
                deals={deals}
                teamMembers={teamMembers}
                onOpenNewDeal={() => {
                  setDealToEdit(null);
                  setIsInvoiceModalOpen(true);
                }}
                onEditDeal={(deal) => {
                  setDealToEdit(deal);
                  setIsInvoiceModalOpen(true);
                }}
                onMarkPaid={(deal) => {
                  setDealToMarkPaid(deal);
                }}
                onUpdateDealStage={handleUpdateDealStage}
              />
            </div>
          )}

          {/* TAB 4: MASTER DNC & CLIENT REPOSITORY */}
          {currentTab === 'master' && (
            <div className="animate-fade-in">
              <MasterRepository
                records={masterRecords}
                teamMembers={teamMembers}
                currentUser={currentUser}
                onOpenQuickLead={() => setIsQuickLeadOpen(true)}
                onUpdateRecord={handleSaveMasterRecord}
                onDeleteRecord={handleDeleteMasterRecord}
                onBulkAddRecords={handleBulkAddMasterRecords}
              />
            </div>
          )}

          {/* TAB 5: SETTINGS & CLOUD DATABASE (Admin Only) */}
          {currentTab === 'settings' && currentUser.role === 'admin' && (
            <div className="animate-fade-in">
              <SettingsView
                teamMembers={teamMembers}
                quotas={quotas}
                isSupabaseConnected={isSupabaseConnected}
                onOpenTargetManager={() => setIsTargetManagerOpen(true)}
                onOpenSupabaseConfig={() => setIsSupabaseConfigOpen(true)}
                onOpenDataManagement={() => setIsDataManagementOpen(true)}
                onSaveMember={handleSaveMember}
                onDeleteMember={handleDeleteMember}
                users={users}
              />
            </div>
          )}
        </main>
      </div>

      {/* GLOBAL MODALS */}

      {/* Quick Lead & Reply Logger */}
      <QuickLeadModal
        isOpen={isQuickLeadOpen}
        onClose={() => setIsQuickLeadOpen(false)}
        teamMembers={teamMembers}
        onSaveMasterRecord={handleSaveMasterRecord}
        onSaveDeal={handleSaveDeal}
      />

      {/* Invoice & Deal Modal */}
      <InvoiceModal
        isOpen={isInvoiceModalOpen}
        onClose={() => {
          setIsInvoiceModalOpen(false);
          setDealToEdit(null);
        }}
        onSaveDeal={handleSaveDeal}
        dealToEdit={dealToEdit}
        teamMembers={teamMembers}
      />

      {/* Mark as Paid Modal */}
      <MarkPaidModal
        isOpen={Boolean(dealToMarkPaid)}
        onClose={() => setDealToMarkPaid(null)}
        deal={dealToMarkPaid}
        onConfirmPaid={handleConfirmPaid}
      />

      {/* Target Manager Modal */}
      <TargetManagerModal
        isOpen={isTargetManagerOpen}
        onClose={() => setIsTargetManagerOpen(false)}
        quotas={quotas}
        salesReps={salesReps}
        leadGenReps={leadGenReps}
        onSaveQuotas={handleSaveQuotas}
      />

      {/* Supabase Config Modal */}
      <SupabaseConfigModal
        isOpen={isSupabaseConfigOpen}
        onClose={() => setIsSupabaseConfigOpen(false)}
        onConnectionSuccess={() => {
          setIsSupabaseConnected(true);
          reloadData();
        }}
      />

      {/* Data Management & Backup Modal */}
      <DataManagementModal
        isOpen={isDataManagementOpen}
        onClose={() => setIsDataManagementOpen(false)}
        onDataResetOrImported={reloadData}
      />

      {/* Action Notification Drawer */}
      <NotificationDrawer
        isOpen={isNotificationsOpen}
        onClose={() => setIsNotificationsOpen(false)}
        notifications={notifications}
        deals={deals}
        currentUser={currentUser}
        onSelectDeal={(dealId) => {
          const d = deals.find((x) => x.id === dealId);
          if (d) {
            setDealToEdit(d);
            setIsInvoiceModalOpen(true);
          }
        }}
        onDismissNotification={handleDismissNotification}
        onLogFollowUp={handleLogFollowUp}
        onApproveMeetingCount={handleApproveMeetingCount}
      />
    </div>
  );
}

export default App;
