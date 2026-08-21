/**
 * Local Members System
 * Loads and manages team members from local JSON storage
 * This allows the website to work without Supabase backend
 */

export interface LocalMember {
  id: string;
  name: string;
  department: string;
  role: 'member' | 'head' | 'captain';
  year?: string;
  email?: string;
  about?: string;
  photo_url?: string;
  is_active?: boolean;
  pin?: string;
}

// Local members storage key
const MEMBERS_STORAGE_KEY = 'robocon_members';
const ADMIN_PASSWORD_KEY = 'robocon_admin_password';

// Default admin password (can be changed)
const DEFAULT_ADMIN_PASSWORD = 'admin1234';

// ── Initialize Admin Password ────────────────────────────────

export function initializeAdminPassword() {
  if (!localStorage.getItem(ADMIN_PASSWORD_KEY)) {
    localStorage.setItem(ADMIN_PASSWORD_KEY, DEFAULT_ADMIN_PASSWORD);
    console.log('Admin password initialized with default:', DEFAULT_ADMIN_PASSWORD);
  }
}

export function verifyAdminPassword(password: string): boolean {
  const storedPassword = localStorage.getItem(ADMIN_PASSWORD_KEY) || DEFAULT_ADMIN_PASSWORD;
  return password === storedPassword;
}

export function setAdminPassword(newPassword: string): void {
  localStorage.setItem(ADMIN_PASSWORD_KEY, newPassword);
}

// ── Initialize Members from Photos ───────────────────────────

export function initializeMembersFromPhotos(): LocalMember[] {
  // Check if we already have members stored
  const existingMembers = localStorage.getItem(MEMBERS_STORAGE_KEY);
  if (existingMembers) {
    try {
      const parsed = JSON.parse(existingMembers);
      if (Array.isArray(parsed) && parsed.length > 0) {
        console.log('Loaded existing members from storage:', parsed.length);
        return parsed;
      }
    } catch (e) {
      console.error('Failed to parse existing members, creating new ones');
    }
  }

  // Create initial members from the team photos
  const initialMembers: LocalMember[] = [
    // Leadership
    { id: '1', name: 'Mayank Verma', department: 'Embedded Coding', role: 'captain', year: '4', photo_url: '/Images/Team Members Photos/Mayank Verma.png', is_active: true, pin: '1234' },
    { id: '2', name: 'Aryan Nair', department: 'Mechanical', role: 'head', year: '4', photo_url: '/Images/Team Members Photos/Aryan Nair.png', is_active: true, pin: '1234' },
    { id: '3', name: 'S. K. Ukrande', department: 'Creative & Management', role: 'head', year: '4', photo_url: '/Images/Team Members Photos/S. K. Ukrande.png', is_active: true, pin: '1234' },
    { id: '4', name: 'Harsh Sharma', department: 'Image Processing & Matlab', role: 'head', year: '4', photo_url: '/Images/Team Members Photos/Harsh Sharma.png', is_active: true, pin: '1234' },
    { id: '5', name: 'Yash Thakkar', department: 'Image Processing & Matlab', role: 'head', year: '4', photo_url: '/Images/Team Members Photos/Yash Thakkar.png', is_active: true, pin: '1234' },
    { id: '6', name: 'Tanisha Shah', department: 'Creative & Management', role: 'head', year: '3', photo_url: '/Images/Team Members Photos/Tanisha Shah.png', is_active: true, pin: '1234' },

    // Mechanical
    { id: '7', name: 'Rutambhar Gada', department: 'Mechanical', role: 'member', year: '3', photo_url: '/Images/Team Members Photos/Rutambhar Gada.png', is_active: true, pin: '1234' },
    { id: '8', name: 'Shubham Mehta', department: 'Mechanical', role: 'member', year: '3', photo_url: '/Images/Team Members Photos/Shubham Mehta.png', is_active: true, pin: '1234' },
    { id: '9', name: 'Sanmeet Dey', department: 'Mechanical', role: 'member', year: '2', photo_url: '/Images/Team Members Photos/Sanmeet Dey.png', is_active: true, pin: '1234' },
    { id: '10', name: 'Tushar Pawar', department: 'Mechanical', role: 'member', year: '2', photo_url: '/Images/Team Members Photos/Tushar Pawar.png', is_active: true, pin: '1234' },
    { id: '11', name: 'Atharva Singh', department: 'Mechanical', role: 'member', year: '2', photo_url: '/Images/Team Members Photos/Atharva Singh.png', is_active: true, pin: '1234' },
    { id: '12', name: 'Anurag Rai', department: 'Mechanical', role: 'member', year: '2', photo_url: '/Images/Team Members Photos/Anurag Rai.png', is_active: true, pin: '1234' },
    { id: '13', name: 'Atharv Chavan', department: 'Mechanical', role: 'member', year: '2', photo_url: '/Images/Team Members Photos/Atharv Chavan.png', is_active: true, pin: '1234' },
    { id: '14', name: 'Dhairya Doshi', department: 'Mechanical', role: 'member', year: '2', photo_url: '/Images/Team Members Photos/Dhairya Doshi.png', is_active: true, pin: '1234' },
    { id: '15', name: 'Ansh Dsouza', department: 'Mechanical', role: 'member', year: '2', photo_url: '/Images/Team Members Photos/Ansh Dsouza.png', is_active: true, pin: '1234' },
    { id: '16', name: 'Swaraj Gite', department: 'Mechanical', role: 'member', year: '2', photo_url: '/Images/Team Members Photos/Swaraj Gite.png', is_active: true, pin: '1234' },
    { id: '17', name: 'Avika Bhagwat', department: 'Mechanical', role: 'member', year: '2', photo_url: '/Images/Team Members Photos/Avika Bhagwat.png', is_active: true, pin: '1234' },
    { id: '18', name: 'Sneha Bhat', department: 'Mechanical', role: 'member', year: '2', photo_url: '/Images/Team Members Photos/Sneha Bhat.png', is_active: true, pin: '1234' },
    { id: '19', name: 'Samruddhi Bhilare', department: 'Mechanical', role: 'member', year: '2', photo_url: '/Images/Team Members Photos/Samruddhi Bhilare.png', is_active: true, pin: '1234' },
    { id: '20', name: 'Soham Jadhav', department: 'Mechanical', role: 'member', year: '2', photo_url: '/Images/Team Members Photos/Soham Jadhav.png', is_active: true, pin: '1234' },

    // Electronics
    { id: '21', name: 'Aditya Anchan', department: 'Electronics', role: 'head', year: '4', photo_url: '/Images/Team Members Photos/Aditya Anchan.png', is_active: true, pin: '1234' },
    { id: '22', name: 'Paarth Mehta', department: 'Electronics', role: 'member', year: '3', photo_url: '/Images/Team Members Photos/Paarth Mehta.png', is_active: true, pin: '1234' },
    { id: '23', name: 'Arpita Bhalekar', department: 'Electronics', role: 'member', year: '2', photo_url: '/Images/Team Members Photos/Arpita Bhalekar.png', is_active: true, pin: '1234' },
    { id: '24', name: 'Rishabh Jain', department: 'Electronics', role: 'member', year: '3', photo_url: '/Images/Team Members Photos/Rishabh Jain.png', is_active: true, pin: '1234' },
    { id: '25', name: 'Prit Khanolkar', department: 'Electronics', role: 'member', year: '2', photo_url: '/Images/Team Members Photos/Prit Khanolkar.png', is_active: true, pin: '1234' },
    { id: '26', name: 'Ishwar Vijayakumar', department: 'Electronics', role: 'member', year: '2', photo_url: '/Images/Team Members Photos/Ishwar Vijayakumar.png', is_active: true, pin: '1234' },

    // Programming (Embedded Coding)
    { id: '27', name: 'Daksh Mishra', department: 'Embedded Coding', role: 'member', year: '3', photo_url: '/Images/Team Members Photos/Daksh Mishra.png', is_active: true, pin: '1234' },
    { id: '28', name: 'Hrishikesh Samant', department: 'Embedded Coding', role: 'member', year: '3', photo_url: '/Images/Team Members Photos/Hrishikesh Samant.png', is_active: true, pin: '1234' },
    { id: '29', name: 'Himanshu Chavan', department: 'Embedded Coding', role: 'member', year: '2', photo_url: '/Images/Team Members Photos/Himanshu Chavan.png', is_active: true, pin: '1234' },
    { id: '30', name: 'Sonam Sinha', department: 'Embedded Coding', role: 'member', year: '2', photo_url: '/Images/Team Members Photos/Sonam Sinha.png', is_active: true, pin: '1234' },

    // Image Processing
    { id: '31', name: 'Tashi Shrivastava', department: 'Image Processing & Matlab', role: 'member', year: '3', photo_url: '/Images/Team Members Photos/Tashi Shrivastava.png', is_active: true, pin: '1234' },
    { id: '32', name: 'Rohini Vemula', department: 'Image Processing & Matlab', role: 'member', year: '2', photo_url: '/Images/Team Members Photos/Rohini Vemula.png', is_active: true, pin: '1234' },
    { id: '33', name: 'Bhumesh Dhadwal', department: 'Image Processing & Matlab', role: 'member', year: '2', photo_url: '/Images/Team Members Photos/Bhumesh Dhadwal.png', is_active: true, pin: '1234' },
    { id: '34', name: 'Neeshna Patel', department: 'Image Processing & Matlab', role: 'member', year: '2', photo_url: '/Images/Team Members Photos/Neeshna Patel.png', is_active: true, pin: '1234' },
    { id: '35', name: 'Tirth Vora', department: 'Image Processing & Matlab', role: 'member', year: '2', photo_url: '/Images/Team Members Photos/Tirth Vora.png', is_active: true, pin: '1234' },
    { id: '36', name: 'Kanishk Thacker', department: 'Image Processing & Matlab', role: 'member', year: '2', photo_url: '/Images/Team Members Photos/Kanishk Thacker.png', is_active: true, pin: '1234' },
    { id: '37', name: 'Siddharth Ganguly', department: 'Image Processing & Matlab', role: 'member', year: '2', photo_url: '/Images/Team Members Photos/Siddharth Ganguly.png', is_active: true, pin: '1234' },
    { id: '38', name: 'Omkar Ghosh', department: 'Image Processing & Matlab', role: 'member', year: '2', photo_url: '/Images/Team Members Photos/Omkar Ghosh.png', is_active: true, pin: '1234' },
    { id: '39', name: 'Avani Mantri', department: 'Image Processing & Matlab', role: 'member', year: '2', photo_url: '/Images/Team Members Photos/Avani Mantri.png', is_active: true, pin: '1234' },

    // Management
    { id: '40', name: 'Nidhi Bhatkar', department: 'Creative & Management', role: 'member', year: '3', photo_url: '/Images/Team Members Photos/Nidhi Bhatkar.png', is_active: true, pin: '1234' },
    { id: '41', name: 'Mohammad Haris Khan', department: 'Creative & Management', role: 'member', year: '2', photo_url: '/Images/Team Members Photos/Mohammad Haris Khan.png', is_active: true, pin: '1234' },

    // Faculty
    { id: '42', name: 'Vijay Bhosle', department: 'Mechanical', role: 'member', year: '4', photo_url: '/Images/Team Members Photos/Vijay Bhosle.png', is_active: true, pin: '1234' },
  ];

  // Save to localStorage
  localStorage.setItem(MEMBERS_STORAGE_KEY, JSON.stringify(initialMembers));
  console.log('Initialized members with', initialMembers.length, 'members');

  return initialMembers;
}

// ── Member CRUD Operations ─────────────────────────────────────

export function getAllMembers(includeInactive: boolean = false): LocalMember[] {
  const members = initializeMembersFromPhotos();
  if (includeInactive) {
    return members;
  }
  return members.filter(m => m.is_active !== false);
}

export function getMembersByDepartment(department: string): LocalMember[] {
  const members = getAllMembers(true);
  return members.filter(m =>
    m.is_active !== false &&
    (m.department === department || m.department.includes(department))
  );
}

export function createMember(member: Omit<LocalMember, 'id'>): LocalMember {
  const members = getAllMembers(true);
  const newMember: LocalMember = {
    ...member,
    id: Date.now().toString(),
  };
  members.push(newMember);
  saveMembers(members);
  return newMember;
}

export function updateMember(id: string, updates: Partial<LocalMember>): LocalMember | null {
  const members = getAllMembers(true);
  const index = members.findIndex(m => m.id === id);
  if (index === -1) return null;

  members[index] = { ...members[index], ...updates };
  saveMembers(members);
  return members[index];
}

export function deleteMember(id: string): boolean {
  let members = getAllMembers(true);
  const initialLength = members.length;
  members = members.filter(m => m.id !== id);
  saveMembers(members);
  return members.length < initialLength;
}

export function softDeleteMember(id: string): LocalMember | null {
  return updateMember(id, { is_active: false });
}

export function restoreMember(id: string): LocalMember | null {
  return updateMember(id, { is_active: true });
}

function saveMembers(members: LocalMember[]): void {
  localStorage.setItem(MEMBERS_STORAGE_KEY, JSON.stringify(members));
}

// ── Department Helper ─────────────────────────────────────────

export function getDepartments(): { short_name: string; name: string }[] {
  return [
    { short_name: 'mechanical', name: 'Mechanical' },
    { short_name: 'electronics', name: 'Electronics' },
    { short_name: 'programming', name: 'Embedded Coding' },
    { short_name: 'image-processing', name: 'Image Processing & Matlab' },
    { short_name: 'management', name: 'Creative & Management' },
  ];
}

// ── Export Members as JSON (for backup) ──────────────────────

export function exportMembersAsJSON(): string {
  const members = getAllMembers(true);
  return JSON.stringify(members, null, 2);
}

export function importMembersFromJSON(jsonString: string): number {
  const members = JSON.parse(jsonString) as LocalMember[];
  localStorage.setItem(MEMBERS_STORAGE_KEY, JSON.stringify(members));
  return members.length;
}
