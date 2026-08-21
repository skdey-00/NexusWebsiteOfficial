/**
 * Supabase client - Multiple Departments & Roles Support
 */

import { createClient } from '@supabase/supabase-js';

// Get Supabase credentials
const getSupabaseConfig = () => {
  if ((window as any).SUPABASE_URL && (window as any).SUPABASE_ANON_KEY) {
    return {
      url: (window as any).SUPABASE_URL,
      key: (window as any).SUPABASE_ANON_KEY,
    };
  }

  const url = import.meta.env.VITE_SUPABASE_URL || '';
  const key = import.meta.env.VITE_SUPABASE_ANON_KEY || '';

  return { url, key };
};

const { url: SUPABASE_URL, key: SUPABASE_KEY } = getSupabaseConfig();

if (!SUPABASE_URL || !SUPABASE_KEY) {
  console.error('Supabase credentials not found.');
}

export const supabase = SUPABASE_URL && SUPABASE_KEY
  ? createClient(SUPABASE_URL, SUPABASE_KEY)
  : null;

// ── Types ─────────────────────────────────────────────

export interface Member {
  id: string;
  name: string;
  pin: string;
  photo_url?: string;
  email?: string;
  year?: string;
  about?: string;
  is_active?: boolean;
  created_at: string;
  // New fields - populated by joins
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

export interface MemberWithDetails extends Member {
  departments: Department[];
  roles: Role[];
}

export interface AdminUser {
  id: string;
  username: string;
  name: string;
  created_at: string;
}

// ── Department Management ────────────────────────────────

export async function getDepartments(): Promise<Department[]> {
  if (!supabase) throw new Error('Supabase not configured');
  const { data, error } = await supabase
    .from('departments')
    .select('*')
    .order('name');
  if (error) throw error;
  return data || [];
}

export async function getDepartmentByShortName(shortName: string): Promise<Department | null> {
  if (!supabase) throw new Error('Supabase not configured');
  const { data, error } = await supabase
    .from('departments')
    .select('*')
    .eq('short_name', shortName)
    .maybeSingle();
  if (error) throw error;
  return data;
}

// ── Role Management ───────────────────────────────────────

export async function getRoles(): Promise<Role[]> {
  if (!supabase) throw new Error('Supabase not configured');
  const { data, error } = await supabase
    .from('roles')
    .select('*')
    .order('priority', { ascending: false });
  if (error) throw error;
  return data || [];
}

// ── Member API (with multiple departments/roles) ───────────

export async function getAllMembers(includeInactive: boolean = false): Promise<MemberWithDetails[]> {
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

  const { data, error } = query.order('name');

  if (error) throw error;

  // Transform the nested data
  return (data || []).map((member: any) => ({
    ...member,
    departments: member.departments?.map((md: any) => md.departments).filter(Boolean) || [],
    roles: member.roles?.map((mr: any) => mr.roles).filter(Boolean).sort((a: Role, b: Role) => b.priority - a.priority) || [],
  }));
}

export async function getMemberById(memberId: string): Promise<MemberWithDetails | null> {
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

export async function getMembersByDepartment(departmentId: string): Promise<MemberWithDetails[]> {
  if (!supabase) throw new Error('Supabase not configured');

  const { data, error } = await supabase
    .from('member_departments')
    .select(`
      member_id,
      members(
        id,
        name,
        pin,
        photo_url,
        email,
        year,
        about,
        is_active,
        departments:member_departments(
          department_id,
          departments(id, name, short_name)
        ),
        roles:member_roles(
          role_id,
          roles(id, name, display_name, priority)
        )
      )
    `)
    .eq('department_id', departmentId)
    .eq('members.is_active', true);

  if (error) throw error;

  return (data || []).map((item: any) => {
    const member = item.members;
    return {
      ...member,
      departments: member.departments?.map((md: any) => md.departments).filter(Boolean) || [],
      roles: member.roles?.map((mr: any) => mr.roles).filter(Boolean).sort((a: Role, b: Role) => b.priority - a.priority) || [],
    };
  });
}

// ── Create/Update Member (with multiple departments/roles) ─

export async function createMember(
  member: Omit<Member, 'id' | 'created_at'>,
  departmentIds: string[],
  roleIds: string[]
): Promise<MemberWithDetails> {
  if (!supabase) throw new Error('Supabase not configured');

  // Create the member
  const { data: memberData, error: memberError } = await supabase
    .from('members')
    .insert({
      name: member.name,
      pin: member.pin,
      photo_url: member.photo_url || null,
      email: member.email || null,
      year: member.year || null,
      about: member.about || null,
      is_active: member.is_active !== undefined ? member.is_active : true,
    })
    .select()
    .single();

  if (memberError) throw memberError;

  // Add department associations
  if (departmentIds.length > 0) {
    const deptAssociations = departmentIds.map(deptId => ({
      member_id: memberData.id,
      department_id: deptId,
    }));

    const { error: deptError } = await supabase
      .from('member_departments')
      .insert(deptAssociations);

    if (deptError) console.error('Error adding departments:', deptError);
  }

  // Add role associations
  if (roleIds.length > 0) {
    const roleAssociations = roleIds.map(roleId => ({
      member_id: memberData.id,
      role_id: roleId,
    }));

    const { error: roleError } = await supabase
      .from('member_roles')
      .insert(roleAssociations);

    if (roleError) console.error('Error adding roles:', roleError);
  }

  return getMemberById(memberData.id);
}

export async function updateMember(
  memberId: string,
  updates: Partial<Omit<Member, 'id' | 'created_at'>>,
  departmentIds?: string[],
  roleIds?: string[]
): Promise<MemberWithDetails> {
  if (!supabase) throw new Error('Supabase not configured');

  // Update member basic info
  const { error: updateError } = await supabase
    .from('members')
    .update({
      name: updates.name,
      pin: updates.pin,
      photo_url: updates.photo_url,
      email: updates.email,
      year: updates.year,
      about: updates.about,
      is_active: updates.is_active,
    })
    .eq('id', memberId);

  if (updateError) throw updateError;

  // Update departments if provided
  if (departmentIds !== undefined) {
    // Remove existing department associations
    await supabase
      .from('member_departments')
      .delete()
      .eq('member_id', memberId);

    // Add new associations
    if (departmentIds.length > 0) {
      const deptAssociations = departmentIds.map(deptId => ({
        member_id: memberId,
        department_id: deptId,
      }));

      await supabase
        .from('member_departments')
        .insert(deptAssociations);
    }
  }

  // Update roles if provided
  if (roleIds !== undefined) {
    // Remove existing role associations
    await supabase
      .from('member_roles')
      .delete()
      .eq('member_id', memberId);

    // Add new associations
    if (roleIds.length > 0) {
      const roleAssociations = roleIds.map(roleId => ({
        member_id: memberId,
        role_id: roleId,
      }));

      await supabase
        .from('member_roles')
        .insert(roleAssociations);
    }
  }

  return getMemberById(memberId);
}

export async function deleteMember(memberId: string): Promise<void> {
  if (!supabase) throw new Error('Supabase not configured');

  const { error } = await supabase
    .from('members')
    .delete()
    .eq('id', memberId);

  if (error) throw error;
}

export async function softDeleteMember(memberId: string): Promise<MemberWithDetails> {
  if (!supabase) throw new Error('Supabase not configured');

  const { data, error } = await supabase
    .from('members')
    .update({ is_active: false })
    .eq('id', memberId)
    .select()
    .single();

  if (error) throw error;

  return getMemberById(memberId);
}

export async function restoreMember(memberId: string): Promise<MemberWithDetails> {
  if (!supabase) throw new Error('Supabase not configured');

  const { data, error } = await supabase
    .from('members')
    .update({ is_active: true })
    .eq('id', memberId)
    .select()
    .single();

  if (error) throw error;

  return getMemberById(memberId);
}

// ── Member Authentication ───────────────────────────────────

export async function loginMember(pin: string, nameInput: string): Promise<MemberWithDetails | null> {
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
    .ilike('name', `%${nameInput}%`)
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

// ── Admin Authentication ─────────────────────────────────

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

// ── Scan Log API ───────────────────────────────────────────

export interface ScanLog {
  id: string;
  member_id: string;
  scan_type: 'entry' | 'exit';
  scanned_at: string;
}

export async function getLastScan(memberId: string): Promise<ScanLog | null> {
  if (!supabase) throw new Error('Supabase not configured');

  const { data, error } = await supabase
    .from('scan_log')
    .select('*')
    .eq('member_id', memberId)
    .order('scanned_at', { ascending: false })
    .limit(1)
    .maybeSingle();

  if (error) throw error;
  return data;
}

export async function createScanLog(memberId: string, scanType: 'entry' | 'exit'): Promise<ScanLog> {
  if (!supabase) throw new Error('Supabase not configured');

  const now = new Date();
  const tenSecondsAgo = new Date(now.getTime() - 10000);

  const lastScan = await getLastScan(memberId);

  if (lastScan && new Date(lastScan.scanned_at) > tenSecondsAgo) {
    return lastScan;
  }

  const { data, error } = await supabase
    .from('scan_log')
    .insert({
      member_id: memberId,
      scan_type: scanType,
      scanned_at: now.toISOString(),
    })
    .select()
    .single();

  if (error) throw error;
  return data;
}

export async function getAllScanLogs(limit?: number): Promise<ScanLog[]> {
  if (!supabase) throw new Error('Supabase not configured');

  let query = supabase
    .from('scan_log')
    .select('*, members(name, departments)')
    .order('scanned_at', { ascending: false });

  if (limit) {
    query = query.limit(limit);
  }

  const { data, error } = query;
  if (error) throw error;
  return data || [];
}
