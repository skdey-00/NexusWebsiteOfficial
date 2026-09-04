/**
 * NEXUS ROBOTICS INTERNAL PORTAL
 * Supabase Client Configuration
 */

import { createClient } from '@supabase/supabase-js';

// ============================================================
// CONFIGURATION
// ============================================================

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL || '';
const SUPABASE_ANON_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY || '';

if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
  console.warn('[Portal] Supabase credentials not configured. Portal features will be disabled.');
}

export const supabase = SUPABASE_URL && SUPABASE_ANON_KEY
  ? createClient(SUPABASE_URL, SUPABASE_ANON_KEY)
  : null;

// ============================================================
// TYPES
// ============================================================

export interface Member {
  id: string;
  name: string;
  email?: string;
  pin: string;
  is_active: boolean;
  created_at: string;
  departments?: Department[];
  roles?: Role[];
}

export interface Department {
  id: string;
  name: string;
  short_name: string;
}

export interface Role {
  id: string;
  name: string;
  display_name: string;
  priority: number;
}

export interface AdminUser {
  id: string;
  username: string;
  password_hash: string;
  name: string;
  created_at: string;
}

export interface AttendanceEvent {
  id: string;
  member_id: string;
  event_type: 'IN' | 'OUT';
  timestamp: string;
  created_at: string;
  member?: Member;
}

export interface AttendanceSession {
  member_id: string;
  member_name: string;
  department_name?: string;
  check_in: string;
  check_out?: string;
  duration_minutes?: number;
}

// ============================================================
// AUTHENTICATION
// ============================================================

export async function loginMember(name: string, pin: string): Promise<Member | null> {
  if (!supabase) throw new Error('Supabase not configured');

  const { data, error } = await supabase
    .from('members')
    .select(`
      *,
      departments:member_departments(
        department_id,
        departments(id, name, short_name)
      ),
      roles:member_roles(
        role_id,
        roles(id, name, display_name, priority)
      )
    `)
    .ilike('name', name)
    .eq('pin', pin)
    .eq('is_active', true)
    .limit(1);

  if (error) throw error;
  if (!data || data.length === 0) return null;

  const member = data[0];
  return {
    ...member,
    departments: member.departments?.map((md: any) => md.departments).filter(Boolean) || [],
    roles: member.roles?.map((mr: any) => mr.roles).filter(Boolean).sort((a: Role, b: Role) => b.priority - a.priority) || [],
  };
}

export async function loginAdmin(username: string, password: string): Promise<AdminUser | null> {
  if (!supabase) throw new Error('Supabase not configured');

  const { data, error } = await supabase
    .from('admin_users')
    .select('*')
    .eq('username', username)
    .eq('password_hash', password)
    .maybeSingle();

  if (error) throw error;
  return data;
}

// ============================================================
// ATTENDANCE FUNCTIONS
// ============================================================

export async function getLastAttendanceEvent(memberId: string): Promise<AttendanceEvent | null> {
  if (!supabase) throw new Error('Supabase not configured');

  const { data, error } = await supabase
    .from('attendance')
    .select('*')
    .eq('member_id', memberId)
    .order('timestamp', { ascending: false })
    .limit(1)
    .maybeSingle();

  if (error) throw error;
  return data;
}

export async function createAttendanceEvent(memberId: string, eventType: 'IN' | 'OUT'): Promise<AttendanceEvent> {
  if (!supabase) throw new Error('Supabase not configured');

  // Check for duplicate event within last 10 seconds
  const now = new Date();
  const tenSecondsAgo = new Date(now.getTime() - 10000);

  const lastEvent = await getLastAttendanceEvent(memberId);
  if (lastEvent && new Date(lastEvent.timestamp) > tenSecondsAgo) {
    return lastEvent; // Return existing event instead of creating duplicate
  }

  const { data, error } = await supabase
    .from('attendance')
    .insert({
      member_id: memberId,
      event_type: eventType,
      timestamp: now.toISOString(),
    })
    .select()
    .single();

  if (error) throw error;
  return data;
}

export async function getMemberAttendance(memberId: string, limit: number = 50): Promise<AttendanceEvent[]> {
  if (!supabase) throw new Error('Supabase not configured');

  const { data, error } = await supabase
    .from('attendance')
    .select('*')
    .eq('member_id', memberId)
    .order('timestamp', { ascending: false })
    .limit(limit);

  if (error) throw error;
  return data || [];
}

export async function getAllAttendance(
  startDate?: string,
  endDate?: string,
  departmentId?: string
): Promise<AttendanceEvent[]> {
  if (!supabase) throw new Error('Supabase not configured');

  let query = supabase
    .from('attendance')
    .select(`
      *,
      members(
        id,
        name,
        departments:member_departments(
          departments(id, name, short_name)
        )
      )
    `)
    .order('timestamp', { ascending: false });

  if (startDate) {
    query = query.gte('timestamp', startDate);
  }

  if (endDate) {
    query = query.lte('timestamp', endDate);
  }

  const { data, error } = await query;

  if (error) throw error;

  // Filter by department if specified
  let events = data || [];
  if (departmentId) {
    events = events.filter((event: any) => {
      const memberDepts = event.members?.departments?.map((d: any) => d.departments?.id) || [];
      return memberDepts.includes(departmentId);
    });
  }

  return events;
}

export async function getActiveSessions(): Promise<AttendanceEvent[]> {
  if (!supabase) throw new Error('Supabase not configured');

  // Get all IN events that don't have a corresponding OUT event
  const { data, error } = await supabase
    .from('attendance')
    .select('*')
    .eq('event_type', 'IN')
    .order('timestamp', { ascending: false });

  if (error) throw error;

  // Filter to only those without a corresponding OUT
  const inEvents = data || [];
  const activeSessions: AttendanceEvent[] = [];

  for (const inEvent of inEvents) {
    const { data: outEvents } = await supabase
      .from('attendance')
      .select('*')
      .eq('member_id', inEvent.member_id)
      .eq('event_type', 'OUT')
      .gt('timestamp', inEvent.timestamp)
      .limit(1);

    if (!outEvents || outEvents.length === 0) {
      activeSessions.push(inEvent);
    }
  }

  return activeSessions;
}

export async function getTodayStats(): Promise<{ checkIns: number; checkOuts: number; active: number }> {
  if (!supabase) throw new Error('Supabase not configured');

  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const tomorrow = new Date(today);
  tomorrow.setDate(tomorrow.getDate() + 1);

  const [checkInsResult, checkOutsResult, activeSessions] = await Promise.all([
    supabase
      .from('attendance')
      .select('id', { count: 'exact' })
      .eq('event_type', 'IN')
      .gte('timestamp', today.toISOString())
      .lt('timestamp', tomorrow.toISOString()),
    supabase
      .from('attendance')
      .select('id', { count: 'exact' })
      .eq('event_type', 'OUT')
      .gte('timestamp', today.toISOString())
      .lt('timestamp', tomorrow.toISOString()),
    getActiveSessions()
  ]);

  return {
    checkIns: checkInsResult.count || 0,
    checkOuts: checkOutsResult.count || 0,
    active: activeSessions.length
  };
}

// ============================================================
// SESSION CALCULATION
// ============================================================

export function calculateSessions(events: AttendanceEvent[]): AttendanceSession[] {
  const sessions: AttendanceSession[] = [];
  const memberMap = new Map<string, AttendanceEvent[]>();

  // Group events by member
  events.forEach(event => {
    if (!memberMap.has(event.member_id)) {
      memberMap.set(event.member_id, []);
    }
    memberMap.get(event.member_id)!.push(event);
  });

  // Calculate sessions for each member
  memberMap.forEach((memberEvents, memberId) => {
    memberEvents.sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime());

    for (let i = 0; i < memberEvents.length; i++) {
      const event = memberEvents[i];

      if (event.event_type === 'IN') {
        const nextEvent = memberEvents[i + 1];
        const checkOut = nextEvent?.event_type === 'OUT' ? nextEvent.timestamp : undefined;

        let durationMinutes;
        if (checkOut) {
          durationMinutes = Math.round(
            (new Date(checkOut).getTime() - new Date(event.timestamp).getTime()) / 60000
          );
        }

        sessions.push({
          member_id: memberId,
          member_name: event.member?.name || 'Unknown',
          department_name: (event as any).members?.departments?.[0]?.departments?.name,
          check_in: event.timestamp,
          check_out: checkOut,
          duration_minutes: durationMinutes,
        });
      }
    }
  });

  return sessions;
}

// ============================================================
// DEPARTMENTS
// ============================================================

export async function getDepartments(): Promise<Department[]> {
  if (!supabase) throw new Error('Supabase not configured');

  const { data, error } = await supabase
    .from('departments')
    .select('*')
    .order('name');

  if (error) throw error;
  return data || [];
}

// ============================================================
// MEMBERS
// ============================================================

export async function getAllMembers(includeInactive: boolean = false): Promise<Member[]> {
  if (!supabase) throw new Error('Supabase not configured');

  let query = supabase
    .from('members')
    .select(`
      *,
      departments:member_departments(
        department_id,
        departments(id, name, short_name)
      ),
      roles:member_roles(
        role_id,
        roles(id, name, display_name, priority)
      )
    `);

  if (!includeInactive) {
    query = query.eq('is_active', true);
  }

  const { data, error } = await query.order('name');

  if (error) throw error;

  return (data || []).map((member: any) => ({
    ...member,
    departments: member.departments?.map((md: any) => md.departments).filter(Boolean) || [],
    roles: member.roles?.map((mr: any) => mr.roles).filter(Boolean).sort((a: Role, b: Role) => b.priority - a.priority) || [],
  }));
}

export async function getMemberById(memberId: string): Promise<Member | null> {
  if (!supabase) throw new Error('Supabase not configured');

  const { data, error } = await supabase
    .from('members')
    .select(`
      *,
      departments:member_departments(
        department_id,
        departments(id, name, short_name)
      ),
      roles:member_roles(
        role_id,
        roles(id, name, display_name, priority)
      )
    `)
    .eq('id', memberId)
    .single();

  if (error) throw error;
  if (!data) return null;

  return {
    ...data,
    departments: data.departments?.map((md: any) => md.departments).filter(Boolean) || [],
    roles: data.roles?.map((mr: any) => mr.roles).filter(Boolean).sort((a: Role, b: Role) => b.priority - a.priority) || [],
  };
}
