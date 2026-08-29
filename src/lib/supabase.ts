import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { UserAccount, TeamMember, MasterRecord, Deal, MonthlyQuotas } from '../types';

const SUPABASE_URL_KEY = 'rosxsa_supabase_url';
const SUPABASE_ANON_KEY = 'rosxsa_supabase_anon_key';

let supabaseClient: SupabaseClient | null = null;

export function getStoredSupabaseConfig(): { url: string; anonKey: string } {
  // Support both Environment variables (Vercel) and LocalStorage
  const envUrl = (import.meta as any).env?.VITE_SUPABASE_URL || '';
  const envKey = (import.meta as any).env?.VITE_SUPABASE_ANON_KEY || '';

  const url = localStorage.getItem(SUPABASE_URL_KEY) || envUrl || '';
  const anonKey = localStorage.getItem(SUPABASE_ANON_KEY) || envKey || '';
  return { url, anonKey };
}

export function saveSupabaseConfig(url: string, anonKey: string): void {
  localStorage.setItem(SUPABASE_URL_KEY, url.trim());
  localStorage.setItem(SUPABASE_ANON_KEY, anonKey.trim());
  // Re-initialize client
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

// Direct Cloud Auth & User Sync
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
        id: user.id.includes('-') && user.id.length > 30 ? user.id : undefined,
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
