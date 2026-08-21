/**
 * Local Admin Dashboard — Member management GUI
 * Add, edit, delete team members with local storage (no Supabase needed)
 */

import {
  getAllMembers,
  getDepartments,
  createMember,
  updateMember,
  softDeleteMember,
  restoreMember,
  type LocalMember
} from './lib/local-members';

// ── DOM Elements ─────────────────────────────────────────

const membersList = document.getElementById('members-list') as HTMLElement;
const membersAlert = document.getElementById('members-alert') as HTMLElement;
const formAlert = document.getElementById('form-alert') as HTMLElement;
const searchInput = document.getElementById('search-input') as HTMLInputElement;
const filterDepartment = document.getElementById('filter-department') as HTMLSelectElement;
const filterStatus = document.getElementById('filter-status') as HTMLSelectElement;
const departmentSelect = document.getElementById('department-select') as HTMLSelectElement;
const addMemberForm = document.getElementById('add-member-form') as HTMLFormElement;
const photoUpload = document.getElementById('photo-upload') as HTMLElement;
const photoInput = document.getElementById('photo-input') as HTMLInputElement;
const photoPreview = document.getElementById('photo-preview') as HTMLElement;
const editModal = document.getElementById('edit-modal') as HTMLElement;
const editForm = document.getElementById('edit-member-form') as HTMLFormElement;
const editAlert = document.getElementById('edit-alert') as HTMLElement;

// Stats elements
const statTotal = document.getElementById('stat-total') as HTMLElement;
const statActive = document.getElementById('stat-active') as HTMLElement;
const statInactive = document.getElementById('stat-inactive') as HTMLElement;
const statDepartments = document.getElementById('stat-departments') as HTMLElement;

// ── State ─────────────────────────────────────────────

let allMembers: LocalMember[] = [];
let allDepartments: { short_name: string; name: string }[] = [];
let selectedPhotoFile: File | null = null;
let currentEditMember: LocalMember | null = null;

// ── Admin Session Check ─────────────────────────────────

function checkAdminAuth() {
  const adminId = localStorage.getItem('robocon_admin_id');
  const adminName = localStorage.getItem('robocon_admin_name');

  if (!adminId || !adminName) {
    alert('Admin access required. Please login with admin credentials.');
    window.location.href = 'portal.html';
    return false;
  }

  return true;
}

// ── UI Helpers ─────────────────────────────────────────

function showAlert(element: HTMLElement, message: string, type: 'success' | 'error' | 'info' = 'info') {
  element.textContent = message;
  element.className = `alert ${type} show`;

  setTimeout(() => {
    element.classList.remove('show');
  }, 5000);
}

function hideAlert(element: HTMLElement) {
  element.classList.remove('show');
}


function getDepartmentShortName(department: string): string {
  const deptMap: Record<string, string> = {
    'Embedded Coding': 'programming',
    'Image Processing & Matlab': 'image-processing',
    'Creative & Management': 'management',
  };

  for (const [full, short] of Object.entries(deptMap)) {
    if (department.includes(full)) return short;
  }

  return department.toLowerCase().replace(/[^a-z0-9]/g, '-');
}

// ── Load Data ───────────────────────────────────────────

function loadDepartments() {
  try {
    allDepartments = getDepartments();

    // Populate department dropdowns
    const options = allDepartments.map(dept =>
      `<option value="${dept.short_name}">${dept.name}</option>`
    ).join('');

    departmentSelect.innerHTML = '<option value="">Select Department</option>' + options;

    // Update filter dropdown
    const currentFilter = filterDepartment.value;
    filterDepartment.innerHTML = '<option value="">All Departments</option>' + options;
    filterDepartment.value = currentFilter;

    statDepartments.textContent = String(allDepartments.length);
  } catch (err) {
    console.error('Failed to load departments:', err);
  }
}

function loadMembers() {
  hideAlert(membersAlert);
  membersList.innerHTML = `
    <div class="alert info show">
      <i class="fas fa-spinner fa-spin"></i> Loading members...
    </div>
  `;

  try {
    allMembers = getAllMembers(true); // Include inactive members

    // Update stats
    const activeMembers = allMembers.filter(m => m.is_active !== false);
    statTotal.textContent = String(allMembers.length);
    statActive.textContent = String(activeMembers.length);
    statInactive.textContent = String(allMembers.length - activeMembers.length);

    renderMembers();
  } catch (err) {
    console.error('Failed to load members:', err);
    showAlert(membersAlert, 'Failed to load members. Please check your connection.', 'error');
  }
}

function renderMembers() {
  const searchTerm = searchInput.value.toLowerCase();
  const deptFilter = filterDepartment.value;
  const statusFilter = filterStatus.value;

  let filtered = allMembers;

  // Apply filters
  if (searchTerm) {
    filtered = filtered.filter(m =>
      m.name.toLowerCase().includes(searchTerm) ||
      (m.email && m.email.toLowerCase().includes(searchTerm))
    );
  }

  if (deptFilter) {
    filtered = filtered.filter(m => {
      const shortName = getDepartmentShortName(m.department);
      return shortName === deptFilter;
    });
  }

  if (statusFilter === 'active') {
    filtered = filtered.filter(m => m.is_active !== false);
  } else if (statusFilter === 'inactive') {
    filtered = filtered.filter(m => m.is_active === false);
  }

  if (filtered.length === 0) {
    membersList.innerHTML = `
      <div class="alert info show" style="text-align: center;">
        <i class="fas fa-search"></i> No members found matching your filters
      </div>
    `;
    return;
  }

  membersList.innerHTML = filtered.map(member => `
    <div class="member-item">
      <div class="member-photo">
        ${member.photo_url
          ? `<img src="${member.photo_url}" alt="${member.name}" onerror="this.parentElement.innerHTML='<i class=\\'fas fa-user\\'></i>'">`
          : `<i class="fas fa-user"></i>`
        }
      </div>
      <div class="member-info">
        <div class="member-name">
          ${member.name}
          ${member.role === 'head' ? '<span class="member-badge">Head</span>' : ''}
          ${member.role === 'captain' ? '<span class="member-badge">Captain</span>' : ''}
        </div>
        <div class="member-details">
          <span>${member.department}</span>
          ${member.email ? `<span>• ${member.email}</span>` : ''}
          ${member.year ? `<span>• Year ${member.year}</span>` : ''}
        </div>
      </div>
      <div class="member-actions">
        <button class="action-icon" onclick="window.editMember('${member.id}')" title="Edit">
          <i class="fas fa-pen"></i>
        </button>
        ${member.is_active === false
          ? `<button class="action-icon" onclick="window.restoreMember('${member.id}')" title="Restore">
              <i class="fas fa-undo"></i>
            </button>`
          : `<button class="action-icon delete" onclick="window.deleteMember('${member.id}')" title="Delete">
              <i class="fas fa-trash"></i>
            </button>`
        }
      </div>
    </div>
  `).join('');
}

// ── Photo Upload ────────────────────────────────────────

photoUpload.addEventListener('click', () => {
  photoInput.click();
});

photoInput.addEventListener('change', (e) => {
  const file = (e.target as HTMLInputElement).files?.[0];
  if (file) {
    handlePhotoFile(file);
  }
});

photoUpload.addEventListener('dragover', (e) => {
  e.preventDefault();
  photoUpload.classList.add('dragover');
});

photoUpload.addEventListener('dragleave', () => {
  photoUpload.classList.remove('dragover');
});

photoUpload.addEventListener('drop', (e) => {
  e.preventDefault();
  photoUpload.classList.remove('dragover');

  const file = e.dataTransfer?.files[0];
  if (file && file.type.startsWith('image/')) {
    handlePhotoFile(file);
  }
});

function handlePhotoFile(file: File) {
  if (file.size > 5 * 1024 * 1024) {
    showAlert(formAlert, 'Photo size must be less than 5MB', 'error');
    return;
  }

  selectedPhotoFile = file;

  // Show preview
  const reader = new FileReader();
  reader.onload = (e) => {
    photoPreview.innerHTML = `<img src="${e.target?.result}" alt="Preview">`;
  };
  reader.readAsDataURL(file);
}

// ── Add Member Form ──────────────────────────────────────

addMemberForm.addEventListener('submit', async (e) => {
  e.preventDefault();

  const formData = new FormData(addMemberForm);
  const memberData: Partial<LocalMember> = {
    name: formData.get('name') as string,
    department: formData.get('department') as string,
    pin: formData.get('pin') as string,
    email: formData.get('email') as string || undefined,
    year: formData.get('year') as string || undefined,
    about: formData.get('about') as string || undefined,
    role: (formData.get('role') as 'member' | 'head' | 'captain') || 'member',
    is_active: formData.get('is_active') === 'true',
  };

  // Validate PIN
  if (!/^\d{4}$/.test(memberData.pin || '')) {
    showAlert(formAlert, 'PIN must be exactly 4 digits', 'error');
    return;
  }

  hideAlert(formAlert);

  try {
    const submitBtn = addMemberForm.querySelector('button[type="submit"]') as HTMLButtonElement;
    submitBtn.disabled = true;
    submitBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Adding...';

    // For local storage, we'll use a data URL for photos
    if (selectedPhotoFile) {
      const reader = new FileReader();
      reader.onload = (e) => {
        memberData.photo_url = e.target?.result as string;
        completeMemberAdd(memberData);
      };
      reader.readAsDataURL(selectedPhotoFile);
    } else {
      completeMemberAdd(memberData);
    }

  } catch (err: any) {
    console.error('Failed to add member:', err);
    showAlert(formAlert, `Failed to add member: ${err.message || 'Unknown error'}`, 'error');
    const submitBtn = addMemberForm.querySelector('button[type="submit"]') as HTMLButtonElement;
    submitBtn.disabled = false;
    submitBtn.innerHTML = '<i class="fas fa-plus"></i> Add Member';
  }
});

function completeMemberAdd(memberData: Partial<LocalMember>) {
  try {
    createMember(memberData as Omit<LocalMember, 'id'>);

    showAlert(formAlert, `Successfully added ${memberData.name}!`, 'success');
    addMemberForm.reset();
    photoPreview.innerHTML = '<i class="fas fa-camera"></i>';
    selectedPhotoFile = null;

    // Reload members list
    loadMembers();

  } catch (err: any) {
    console.error('Failed to add member:', err);
    showAlert(formAlert, `Failed to add member: ${err.message || 'Unknown error'}`, 'error');
  } finally {
    const submitBtn = addMemberForm.querySelector('button[type="submit"]') as HTMLButtonElement;
    submitBtn.disabled = false;
    submitBtn.innerHTML = '<i class="fas fa-plus"></i> Add Member';
  }
}

// Reset form
document.getElementById('reset-form')?.addEventListener('click', () => {
  addMemberForm.reset();
  photoPreview.innerHTML = '<i class="fas fa-camera"></i>';
  selectedPhotoFile = null;
  hideAlert(formAlert);
});

// ── Edit Member Functions ────────────────────────────────

(window as any).editMember = (memberId: string) => {
  const member = allMembers.find(m => m.id === memberId);
  if (!member) return;

  currentEditMember = member;

  // Populate form
  (document.getElementById('edit-member-id') as HTMLInputElement).value = member.id;
  (document.getElementById('edit-name') as HTMLInputElement).value = member.name;
  (document.getElementById('edit-email') as HTMLInputElement).value = member.email || '';
  (document.getElementById('edit-pin') as HTMLInputElement).value = member.pin || '';
  (document.getElementById('edit-year') as HTMLSelectElement).value = member.year || '';
  (document.getElementById('edit-role') as HTMLSelectElement).value = member.role || 'member';
  (document.getElementById('edit-about') as HTMLTextAreaElement).value = member.about || '';
  (document.getElementById('edit-photo-url') as HTMLInputElement).value = member.photo_url || '';
  (document.getElementById('edit-is-active') as HTMLInputElement).checked = member.is_active !== false;

  // Set department
  const shortName = getDepartmentShortName(member.department);
  const deptSelect = document.getElementById('edit-department') as HTMLSelectElement;
  deptSelect.innerHTML = '<option value="">Select Department</option>' +
    allDepartments.map(d => `<option value="${d.short_name}">${d.name}</option>`).join('');
  deptSelect.value = shortName;

  hideAlert(editAlert);
  editModal.classList.add('active');
};

(window as any).deleteMember = (memberId: string) => {
  const member = allMembers.find(m => m.id === memberId);
  if (!member) return;

  if (!confirm(`Are you sure you want to remove ${member.name} from the team?`)) {
    return;
  }

  try {
    softDeleteMember(memberId);
    showAlert(membersAlert, `${member.name} has been removed from the team.`, 'success');
    loadMembers();
  } catch (err: any) {
    console.error('Failed to delete member:', err);
    showAlert(membersAlert, `Failed to remove ${member.name}: ${err.message || 'Unknown error'}`, 'error');
  }
};

(window as any).restoreMember = (memberId: string) => {
  const member = allMembers.find(m => m.id === memberId);
  if (!member) return;

  try {
    restoreMember(memberId);
    showAlert(membersAlert, `${member.name} has been restored to the team.`, 'success');
    loadMembers();
  } catch (err: any) {
    console.error('Failed to restore member:', err);
    showAlert(membersAlert, `Failed to restore ${member.name}: ${err.message || 'Unknown error'}`, 'error');
  }
};

// Edit modal controls
document.getElementById('close-edit-modal')?.addEventListener('click', () => {
  editModal.classList.remove('active');
  currentEditMember = null;
});

document.getElementById('cancel-edit')?.addEventListener('click', () => {
  editModal.classList.remove('active');
  currentEditMember = null;
});

// Edit form submission
editForm.addEventListener('submit', async (e) => {
  e.preventDefault();

  if (!currentEditMember) return;

  const formData = new FormData(editForm);
  const memberId = formData.get('member_id') as string;

  const updates: Partial<LocalMember> = {
    name: formData.get('name') as string,
    department: formData.get('department') as string,
    pin: formData.get('pin') as string || undefined,
    email: formData.get('email') as string || undefined,
    year: formData.get('year') as string || undefined,
    role: formData.get('role') as 'member' | 'head' | 'captain' | undefined,
    about: formData.get('about') as string || undefined,
    photo_url: formData.get('photo_url') as string || undefined,
    is_active: formData.get('is_active') === 'true',
  };

  // Validate PIN if provided
  if (updates.pin && !/^\d{4}$/.test(updates.pin)) {
    showAlert(editAlert, 'PIN must be exactly 4 digits', 'error');
    return;
  }

  try {
    const submitBtn = editForm.querySelector('button[type="submit"]') as HTMLButtonElement;
    submitBtn.disabled = true;
    submitBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Saving...';

    await updateMember(memberId, updates);

    showAlert(editAlert, 'Member updated successfully!', 'success');
    editModal.classList.remove('active');

    // Reload members list
    loadMembers();

  } catch (err: any) {
    console.error('Failed to update member:', err);
    showAlert(editAlert, `Failed to update: ${err.message || 'Unknown error'}`, 'error');
  } finally {
    const submitBtn = editForm.querySelector('button[type="submit"]') as HTMLButtonElement;
    submitBtn.disabled = false;
    submitBtn.innerHTML = '<i class="fas fa-save"></i> Save Changes';
  }
});

// ── Tab Switching ──────────────────────────────────────

const tabs = document.querySelectorAll('.admin-tab');
const panels = document.querySelectorAll('.admin-panel');

tabs.forEach(tab => {
  tab.addEventListener('click', () => {
    const target = tab.getAttribute('data-panel');
    if (!target) return;

    tabs.forEach(t => t.classList.remove('active'));
    panels.forEach(p => p.classList.remove('active'));

    tab.classList.add('active');
    document.getElementById(`${target}-panel`)?.classList.add('active');
  });
});

// ── Search & Filter ─────────────────────────────────────

searchInput.addEventListener('input', renderMembers);
filterDepartment.addEventListener('change', renderMembers);
filterStatus.addEventListener('change', renderMembers);

// ── Logout ──────────────────────────────────────────────

document.getElementById('logout-btn')?.addEventListener('click', () => {
  localStorage.removeItem('robocon_admin_id');
  localStorage.removeItem('robocon_admin_username');
  localStorage.removeItem('robocon_admin_name');

  window.location.href = 'portal.html';
});

// ── Hamburger Menu ─────────────────────────────────────

const hamburger = document.querySelector('.hamburger');
const navLinks = document.querySelector('.nav-links');
hamburger?.addEventListener('click', () => {
  hamburger.classList.toggle('active');
  navLinks?.classList.toggle('active');
});

// ── Init ────────────────────────────────────────────────

if (checkAdminAuth()) {
  loadDepartments();
  loadMembers();
}
