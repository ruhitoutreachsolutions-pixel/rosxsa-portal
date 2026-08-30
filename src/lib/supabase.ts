import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { UserAccount, TeamMember, MasterRecord, Deal, MonthlyQuotas, MeetingCountType, LeadStatus, DncReason, DealStage } from '../types';

const SUPABASE_URL_KEY = 'rosxsa_supabase_url';
const SUPABASE_ANON_KEY = 'rosxsa_supabase_anon_key';

let supabaseClient: SupabaseClient | null = null;

export function getStoredSupabaseConfig(): { url: string; anonKey: string } {
  const envUrl = (import.meta as any).env?.VITE_SUPABASE_URL || '';
  const envKey = (import.meta as any).env?.VITE_SUPABASE_ANON_KEY || '';

  const url = localStorage.getItem(SUPABASE_URL_KEY) || envUrl || '';
  const anonKey = localStorage.getItem(SUPABASE_ANON_KEY) || envKey || '';
  return { url, anonKey };
}

export function saveSupabaseConfig(url: string, anonKey: string): void {
  localStorage.setItem(SUPABASE_URL_KEY, url.trim());
  localStorage.setItem(SUPABASE_ANON_KEY, anonKey.trim());
  initSupabase();
}

export function initSupabase(): SupabaseClient | null {
  const { url, anonKey } = getStoredSupabaseConfig();
  if (url && anonKey) {
    try {
      supabaseClient = createClient(url.trim(), anonKey.trim());
      return supabaseClient;
    } catch (e) {
      console.error('Failed to initialize Supabase client:', e);
      supabaseClient = null;
    }
  }
  supabaseClient = null;
  return null;
}

export function getSupabase(): SupabaseClient | null {
  if (!supabaseClient) {
    return initSupabase();
  }
  return supabaseClient;
}

export async function testSupabaseConnection(
  url: string,
  anonKey: string
): Promise<{ success: boolean; message: string }> {
  try {
    const tempClient = createClient(url.trim(), anonKey.trim());
    const { error } = await tempClient.from('team_members').select('id').limit(1);
    if (error && error.code !== 'PGRST116') {
      if (error.message?.includes('relation "public.team_members" does not exist')) {
        return {
          success: true,
          message: 'Connected to Supabase! (Please run the SQL schema in the SQL Editor to create tables)',
        };
      }
      return { success: false, message: error.message };
    }
    return { success: true, message: 'Successfully connected to Supabase database!' };
  } catch (err: any) {
    return { success: false, message: err?.message || 'Connection failed. Check your URL and Key.' };
  }
}

// ---------------------------------------------------------------------------
// DIRECT CLOUD AUTH & USER MANAGEMENT
// ---------------------------------------------------------------------------
export async function authenticateWithSupabase(
  username: string,
  password: string
): Promise<UserAccount | null> {
  const client = getSupabase();
  if (!client) return null;

  try {
    const cleanUsername = username.trim().toLowerCase();
    const { data, error } = await client
      .from('user_accounts')
      .select('*')
      .ilike('username', cleanUsername)
      .eq('password', password.trim())
      .maybeSingle();

    if (error || !data) return null;

    return {
      id: data.id,
      fullName: data.full_name,
      username: data.username,
      password: data.password,
      role: data.role,
      avatarColor: data.avatar_color,
      createdAt: data.created_at,
    };
  } catch (e) {
    console.error('Error authenticating with Supabase:', e);
    return null;
  }
}

export async function saveUserToSupabase(user: UserAccount): Promise<boolean> {
  const client = getSupabase();
  if (!client) return false;

  try {
    const { error } = await client.from('user_accounts').upsert(
      {
        full_name: user.fullName,
        username: user.username.trim().toLowerCase(),
        password: user.password,
        role: user.role,
        avatar_color: user.avatarColor || '#00C2FF',
      },
      { onConflict: 'username' }
    );
    if (error) {
      console.warn('Supabase user upsert error:', error.message);
      return false;
    }
    return true;
  } catch (e) {
    console.error('Failed to save user to Supabase:', e);
    return false;
  }
}

// ---------------------------------------------------------------------------
// MASTER RECORDS (LEADS & DNC) CLOUD SYNC
// ---------------------------------------------------------------------------
export async function fetchMasterRecordsFromSupabase(): Promise<MasterRecord[] | null> {
  const client = getSupabase();
  if (!client) return null;

  try {
    const { data, error } = await client
      .from('master_records')
      .select('*')
      .order('created_at', { ascending: false });

    if (error || !data) return null;

    return data.map((r: any): MasterRecord => ({
      id: r.id,
      email: r.email,
      domain: r.domain,
      companyName: r.company_name,
      contactName: r.contact_name,
      website: r.website,
      country: r.country,
      jobTitle: r.job_title,
      phone: r.phone,
      linkedInUrl: r.linkedin_url,
      status: r.status as LeadStatus,
      dncReason: r.dnc_reason as DncReason,
      notes: r.notes,
      leadGenRep: r.lead_gen_rep,
      salesRep: r.sales_rep,
      meetingCountType: r.meeting_count_type as MeetingCountType,
      auditHistory: r.audit_history || [],
      createdBy: r.created_by,
      createdAt: r.created_at,
      updatedAt: r.updated_at,
    }));
  } catch (e) {
    console.error('Error fetching master records from Supabase:', e);
    return null;
  }
}

export async function saveMasterRecordToSupabase(rec: MasterRecord): Promise<boolean> {
  const client = getSupabase();
  if (!client) return false;

  try {
    const payload: any = {
      email: rec.email.toLowerCase().trim(),
      domain: rec.domain.toLowerCase().trim(),
      company_name: rec.companyName || null,
      contact_name: rec.contactName || null,
      website: rec.website || null,
      country: rec.country || null,
      job_title: rec.jobTitle || null,
      phone: rec.phone || null,
      linkedin_url: rec.linkedInUrl || null,
      status: rec.status,
      dnc_reason: rec.dncReason || null,
      notes: rec.notes || null,
      lead_gen_rep: rec.leadGenRep || null,
      sales_rep: rec.salesRep || null,
      meeting_count_type: rec.meetingCountType || null,
      audit_history: rec.auditHistory || [],
      created_by: rec.createdBy || null,
      updated_at: new Date().toISOString(),
    };

    // If ID is valid UUID, include it
    if (rec.id && !rec.id.startsWith('master-') && rec.id.length >= 32) {
      payload.id = rec.id;
    }

    const { error } = await client
      .from('master_records')
      .upsert(payload, { onConflict: 'email' });

    if (error) {
      console.warn('Supabase master record upsert error:', error.message);
      return false;
    }
    return true;
  } catch (e) {
    console.error('Failed to save master record to Supabase:', e);
    return false;
  }
}

export async function saveBulkMasterRecordsToSupabase(
  records: MasterRecord[],
  onProgress?: (completed: number, total: number) => void
): Promise<{ success: boolean; count: number }> {
  const client = getSupabase();
  if (!client || records.length === 0) return { success: false, count: 0 };

  const BATCH_SIZE = 500;
  let totalUploaded = 0;

  for (let i = 0; i < records.length; i += BATCH_SIZE) {
    const chunk = records.slice(i, i + BATCH_SIZE);
    const payloads = chunk.map((rec) => {
      const payload: any = {
        email: rec.email.toLowerCase().trim(),
        domain: rec.domain.toLowerCase().trim(),
        company_name: rec.companyName || null,
        contact_name: rec.contactName || null,
        website: rec.website || null,
        country: rec.country || null,
        job_title: rec.jobTitle || null,
        phone: rec.phone || null,
        linkedin_url: rec.linkedInUrl || null,
        status: rec.status,
        dnc_reason: rec.dncReason || null,
        notes: rec.notes || null,
        lead_gen_rep: rec.leadGenRep || null,
        sales_rep: rec.salesRep || null,
        meeting_count_type: rec.meetingCountType || null,
        audit_history: rec.auditHistory || [],
        created_by: rec.createdBy || null,
        updated_at: new Date().toISOString(),
      };
      if (rec.id && !rec.id.startsWith('master-') && !rec.id.startsWith('bulk-') && rec.id.length >= 32) {
        payload.id = rec.id;
      }
      return payload;
    });

    try {
      const { error } = await client
        .from('master_records')
        .upsert(payloads, { onConflict: 'email' });

      if (!error) {
        totalUploaded += chunk.length;
      } else {
        console.warn('Batch upsert error:', error.message);
      }
    } catch (e) {
      console.warn('Batch upload error:', e);
    }

    if (onProgress) {
      onProgress(Math.min(i + BATCH_SIZE, records.length), records.length);
    }

    // Yield control briefly between batches
    await new Promise((r) => setTimeout(r, 10));
  }

  return { success: true, count: totalUploaded };
}

export async function deleteMasterRecordFromSupabase(id: string, email?: string): Promise<boolean> {
  const client = getSupabase();
  if (!client) return false;

  try {
    let query = client.from('master_records').delete();
    if (id && !id.startsWith('master-') && id.length >= 32) {
      query = query.eq('id', id);
    } else if (email) {
      query = query.eq('email', email.toLowerCase().trim());
    } else {
      return false;
    }

    const { error } = await query;
    return !error;
  } catch (e) {
    console.error('Failed to delete master record from Supabase:', e);
    return false;
  }
}

// ---------------------------------------------------------------------------
// SALES DEALS & PIPELINE CLOUD SYNC
// ---------------------------------------------------------------------------
export async function fetchDealsFromSupabase(): Promise<Deal[] | null> {
  const client = getSupabase();
  if (!client) return null;

  try {
    const { data, error } = await client
      .from('deals')
      .select('*')
      .order('created_at', { ascending: false });

    if (error || !data) return null;

    return data.map((d: any): Deal => ({
      id: d.id,
      title: d.title,
      companyName: d.company_name,
      contactName: d.contact_name,
      email: d.email,
      domain: d.domain,
      valueGbp: parseFloat(d.value_gbp) || 0,
      stage: d.stage as DealStage,
      hasPricingGiven: d.has_pricing_given,
      discoveryDate: d.discovery_date,
      demoSentDate: d.demo_sent_date,
      invoiceNumber: d.invoice_number,
      invoiceDate: d.invoice_date,
      paymentPendingDate: d.payment_pending_date,
      followUpDays: d.follow_up_days || 7,
      lastFollowUpDate: d.last_follow_up_date,
      followUpHistory: d.follow_up_history || [],
      paidDate: d.paid_date,
      salesRep: d.sales_rep,
      leadGenRep: d.lead_gen_rep,
      notes: d.notes,
      meetingCompleted: d.meeting_completed,
      meetingCountType: d.meeting_count_type as MeetingCountType,
      createdAt: d.created_at,
      updatedAt: d.updated_at,
    }));
  } catch (e) {
    console.error('Error fetching deals from Supabase:', e);
    return null;
  }
}

export async function saveDealToSupabase(deal: Deal): Promise<boolean> {
  const client = getSupabase();
  if (!client) return false;

  try {
    const payload: any = {
      title: deal.title,
      company_name: deal.companyName,
      contact_name: deal.contactName || null,
      email: deal.email.toLowerCase().trim(),
      domain: deal.domain.toLowerCase().trim(),
      value_gbp: deal.valueGbp || 0,
      stage: deal.stage,
      has_pricing_given: deal.hasPricingGiven !== false,
      discovery_date: deal.discoveryDate || null,
      demo_sent_date: deal.demoSentDate || null,
      invoice_number: deal.invoiceNumber || null,
      invoice_date: deal.invoiceDate || null,
      payment_pending_date: deal.paymentPendingDate || null,
      follow_up_days: deal.followUpDays || 7,
      last_follow_up_date: deal.lastFollowUpDate || null,
      follow_up_history: deal.followUpHistory || [],
      paid_date: deal.paidDate || null,
      sales_rep: deal.salesRep,
      lead_gen_rep: deal.leadGenRep || null,
      notes: deal.notes || null,
      meeting_completed: deal.meetingCompleted !== false,
      meeting_count_type: deal.meetingCountType || null,
      updated_at: new Date().toISOString(),
    };

    if (deal.id && !deal.id.startsWith('deal-') && deal.id.length >= 32) {
      payload.id = deal.id;
    }

    const { error } = await client.from('deals').upsert(payload);
    if (error) {
      console.warn('Supabase deal upsert error:', error.message);
      return false;
    }
    return true;
  } catch (e) {
    console.error('Failed to save deal to Supabase:', e);
    return false;
  }
}

export async function deleteDealFromSupabase(id: string, email?: string): Promise<boolean> {
  const client = getSupabase();
  if (!client) return false;

  try {
    let query = client.from('deals').delete();
    if (id && !id.startsWith('deal-') && id.length >= 32) {
      query = query.eq('id', id);
    } else if (email) {
      query = query.eq('email', email.toLowerCase().trim());
    } else {
      return false;
    }

    const { error } = await query;
    return !error;
  } catch (e) {
    console.error('Failed to delete deal from Supabase:', e);
    return false;
  }
}

// ---------------------------------------------------------------------------
// TEAM MEMBERS CLOUD SYNC
// ---------------------------------------------------------------------------
export async function fetchTeamMembersFromSupabase(): Promise<TeamMember[] | null> {
  const client = getSupabase();
  if (!client) return null;

  try {
    const { data, error } = await client.from('team_members').select('*').order('name');
    if (error || !data) return null;

    return data.map((m: any): TeamMember => ({
      id: m.id,
      name: m.name,
      role: m.role,
      email: m.email,
      avatarColor: m.avatar_color,
    }));
  } catch (e) {
    console.error('Error fetching team members from Supabase:', e);
    return null;
  }
}

export async function saveTeamMemberToSupabase(member: TeamMember): Promise<boolean> {
  const client = getSupabase();
  if (!client) return false;

  try {
    const payload: any = {
      name: member.name.trim(),
      role: member.role,
      email: member.email || null,
      avatar_color: member.avatarColor || '#00C2FF',
    };

    if (member.id && !member.id.startsWith('member-') && member.id.length >= 32) {
      payload.id = member.id;
    }

    const { error } = await client
      .from('team_members')
      .upsert(payload, { onConflict: 'name' });

    return !error;
  } catch (e) {
    console.error('Failed to save team member to Supabase:', e);
    return false;
  }
}

// ---------------------------------------------------------------------------
// MONTHLY QUOTAS CLOUD SYNC
// ---------------------------------------------------------------------------
export async function fetchQuotasFromSupabase(): Promise<MonthlyQuotas | null> {
  const client = getSupabase();
  if (!client) return null;

  try {
    const now = new Date();
    const { data, error } = await client
      .from('monthly_quotas')
      .select('*')
      .eq('month', now.getMonth() + 1)
      .eq('year', now.getFullYear())
      .maybeSingle();

    if (error || !data) return null;

    return {
      month: data.month,
      year: data.year,
      companyTargetGbp:
        data.company_target_gbp !== undefined && data.company_target_gbp !== null && !isNaN(Number(data.company_target_gbp))
          ? Number(data.company_target_gbp)
          : 0,
      salesTargets: data.sales_targets || [],
      leadGenTargets: data.lead_gen_targets || [],
      holidays: data.holidays || [],
    };
  } catch (e) {
    console.error('Error fetching quotas from Supabase:', e);
    return null;
  }
}

export async function saveQuotasToSupabase(quotas: MonthlyQuotas): Promise<boolean> {
  const client = getSupabase();
  if (!client) return false;

  try {
    const { error } = await client.from('monthly_quotas').upsert(
      {
        month: quotas.month,
        year: quotas.year,
        company_target_gbp: quotas.companyTargetGbp,
        sales_targets: quotas.salesTargets,
        lead_gen_targets: quotas.leadGenTargets,
        holidays: quotas.holidays || [],
        updated_at: new Date().toISOString(),
      },
      { onConflict: 'month,year' }
    );
    return !error;
  } catch (e) {
    console.error('Failed to save quotas to Supabase:', e);
    return false;
  }
}
