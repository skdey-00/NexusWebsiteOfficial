/**
 * Admin Dashboard — Multiple Departments & Roles Support
 * Add, edit, delete team members with photo uploads
 */

import {
  getAllMembers,
  getDepartments,
  getRoles,
  createMember,
  updateMember,
  deleteMember,
  softDeleteMember,
  restoreMember,
  uploadMemberPhoto,
  type MemberWithDetails,
  type Department,
  type Role,
} from './lib/supabase-client';

// ── DOM Elements ─────────────────────────────────────────

const membersList = document.getElementById('members-list') as HTMLElement;
const membersAlert = document.getElementById('members-alert') as HTMLElement;
const formAlert = document.getElementById('form-alert') as HTMLElement;
const searchInput = document.getElementById('search-input') as HTMLInputElement;
const filterDepartment = document.getElementById('filter-department') as HTMLSelectElement;
const filterStatus = document.getElementById('filter-status') as HTMLSelectElement;
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

let allMembers: MemberWithDetails[] = [];
let allDepartments: Department[] = [];
let allRoles: Role[] = [];
let selectedPhotoFile: File | null = null;
let currentEditMember: MemberWithDetails | null = null;

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

function getMemberInitials(name: string): string {
  const parts = name.split(' ');
  if (parts.length === 1) return parts[0].charAt(0).toUpperCase();
  return (parts[0].charAt(0) + parts[parts.length - 1].charAt(0)).toUpperCase();
}

// ── Display Helpers ───────────────────────────────────────

function formatDepartments(member: MemberWithDetails): string {
  if (!member.departments || member.departments.length === 0) return 'No department';
  return member.departments.map(d => d.short_name).join(' + ');
}

function formatRoles(member: MemberWithDetails): string {
  if (!member.roles || member.roles.length === 0) return 'Member';
  return member.roles.map(r => r.display_name).join(' • ');
}

function getRoleBadges(member: MemberWithDetails): string {
  if (!member.roles || member.roles.length === 0) return '<span class="role-badge">Member</span>';

  return member.roles.map(role => {
    const priorityClass = role.priority >= 70 ? 'role-badge-high' : 'role-badge';
    return `<span class="${priorityClass}">${role.display_name}</span>`;
  }).join(' ');
}

// ── Load Data ───────────────────────────────────────────

async function loadDepartments() {
  try {
    allDepartments = await getDepartments();

    // Populate filter dropdown
    if (filterDepartment) {
      filterDepartment.innerHTML = '<option value="">All Departments</option>';
      allDepartments.forEach(dept => {
        const option = document.createElement('option');
        option.value = dept.id;
        option.textContent = dept.name;
        filterDepartment.appendChild(option);
      });
    }
  } catch (err) {
    console.error('Failed to load departments:', err);
  }
}

async function loadRoles() {
  try {
    allRoles = await getRoles();
  } catch (err) {
    console.error('Failed to load roles:', err);
  }
}

async function loadMembers() {
  try {
    membersList.innerHTML = '<div class="loading"><i class="fas fa-spinner fa-spin"></i> Loading members...</div>';

    allMembers = await getAllMembers(false);

    updateStats();
    renderMembersList(allMembers);
  } catch (err: any) {
    console.error('Failed to load members:', err);
    if (err.message === 'Supabase not configured') {
      showAlert(membersAlert, 'System not configured. Please set up Supabase.', 'error');
    }
  }
}

function renderMembersList(members: MemberWithDetails[]) {
  if (members.length === 0) {
    membersList.innerHTML = `
      <div class="empty-state">
        <i class="fas fa-users"></i>
        <p>No team members found.</p>
      </div>
    `;
    return;
  }

  membersList.innerHTML = members.map(member => {
    const initials = getMemberInitials(member.name);
    const photoSrc = member.photo_url || '';

    return `
      <div class="member-card ${!member.is_active ? 'inactive' : ''}" data-member-id="${member.id}">
        <div class="member-avatar">
          ${photoSrc
            ? `<img src="${photoSrc}" alt="${member.name}" onerror="this.parentElement.innerHTML='<span>${initials}</span>'">`
            : `<span>${initials}</span>`
          }
        </div>
        <div class="member-info">
          <div class="member-header">
            <h4 class="member-name">${member.name}</h4>
            <div class="member-actions">
              <button class="action-btn" onclick="window.openEditModal('${member.id}')" title="Edit">
                <i class="fas fa-edit"></i>
              </button>
              ${member.is_active
                ? `<button class="action-btn" onclick="window.softDeleteMember('${member.id}')" title="Remove">
                    <i class="fas fa-trash"></i>
                  </button>`
                : `<button class="action-btn" onclick="window.restoreMember('${member.id}')" title="Restore">
                    <i class="fas fa-undo"></i>
                  </button>`
              }
            </div>
          </div>
          <div class="member-details">
            <span class="member-dept">${formatDepartments(member)}</span>
          </div>
          <div class="member-roles">
            ${getRoleBadges(member)}
          </div>
          ${member.email ? `<div class="member-contact"><i class="fas fa-envelope"></i> ${member.email}</div>` : ''}
          ${member.year ? `<div class="member-year">Year ${member.year}</div>` : ''}
        </div>
      </div>
    `;
  }).join('');
}

// ── Stats ───────────────────────────────────────────────

function updateStats() {
  const total = allMembers.length;
  const active = allMembers.filter(m => m.is_active).length;
  const inactive = allMembers.filter(m => !m.is_active).length;
  const uniqueDepts = new Set();

  allMembers.forEach(m => {
    if (m.is_active && m.departments) {
      m.departments.forEach(d => uniqueDepts.add(d.id));
    }
  });

  statTotal.textContent = total.toString();
  statActive.textContent = active.toString();
  statInactive.textContent = inactive.toString();
  statDepartments.textContent = uniqueDepts.size.toString();
}

// ── Add Member ───────────────────────────────────────────

async function handleAddMember(e: SubmitEvent) {
  e.preventDefault();

  const formData = new FormData(addMemberForm);
  const name = formData.get('name') as string;
  const email = formData.get('email') as string;
  const year = formData.get('year') as string;
  const pin = formData.get('pin') as string;
  const about = formData.get('about') as string;

  // Get selected departments
  const deptCheckboxes = addMemberForm.querySelectorAll('input[name="departments"]:checked');
  const selectedDepts = Array.from(deptCheckboxes).map(cb => cb.value);

  // Get selected roles
  const roleCheckboxes = addMemberForm.querySelectorAll('input[name="roles"]:checked');
  const selectedRoles = Array.from(roleCheckboxes).map(cb => cb.value);

  // Validation
  if (!name || selectedDepts.length === 0 || selectedRoles.length === 0 || !pin) {
    showAlert(formAlert, 'Please fill in all required fields and select at least one department and role.', 'error');
    return;
  }

  if (!/^\d{4}$/.test(pin)) {
    showAlert(formAlert, 'PIN must be exactly 4 digits.', 'error');
    return;
  }

  try {
    setLoading(true);

    // Upload photo if selected
    let photoUrl = photoPreview.dataset.url || undefined;
    if (selectedPhotoFile && photoUrl === undefined) {
      photoUrl = await uploadMemberPhoto(selectedPhotoFile, 'temp-' + Date.now());
    }

    // Create member
    const newMember = await createMember(
      {
        name,
        email: email || null,
        year: year || null,
        pin,
        about: about || null,
        photo_url: photoUrl,
        is_active: true,
      },
      selectedDepts,
      selectedRoles
    );

    showAlert(formAlert, `Successfully added ${name}!`, 'success');
    addMemberForm.reset();
    resetPhotoUpload();

    // Reset checkboxes
    addMemberForm.querySelectorAll('input[type="checkbox"]').forEach(cb => cb.checked = false);

    await loadMembers();
  } catch (err: any) {
    console.error('Error adding member:', err);
    showAlert(formAlert, `Failed to add member: ${err.message || 'Unknown error'}`, 'error');
  } finally {
    setLoading(false);
  }
}

// ── Edit Member ─────────────────────────────────────────

async function handleUpdateMember(e: SubmitEvent) {
  e.preventDefault();

  if (!currentEditMember) return;

  const formData = new FormData(editForm);
  const memberId = formData.get('member_id') as string;
  const name = formData.get('name') as string;
  const email = formData.get('email') as string;
  const year = formData.get('year') as string;
  const pin = formData.get('pin') as string;
  const about = formData.get('about') as string;

  // Get selected departments
  const deptCheckboxes = editForm.querySelectorAll('input[name="edit_departments"]:checked');
  const selectedDepts = Array.from(deptCheckboxes).map(cb => cb.value);

  // Get selected roles
  const roleCheckboxes = editForm.querySelectorAll('input[name="edit_roles"]:checked');
  const selectedRoles = Array.from(roleCheckboxes).map(cb => cb.value);

  // Validation
  if (!name || selectedDepts.length === 0 || selectedRoles.length === 0) {
    showAlert(editAlert, 'Please fill in all required fields and select at least one department and role.', 'error');
    return;
  }

  if (pin && !/^\d{4}$/.test(pin)) {
    showAlert(editAlert, 'PIN must be exactly 4 digits.', 'error');
    return;
  }

  try {
    setLoading(true);

    await updateMember(
      memberId,
      {
        name,
        email: email || null,
        year: year || null,
        pin: pin || null,
        about: about || null,
      },
      selectedDepts,
      selectedRoles
    );

    showAlert(editAlert, 'Member updated successfully!', 'success');
    closeModal();
    await loadMembers();
  } catch (err: any) {
    console.error('Error updating member:', err);
    showAlert(editAlert, `Failed to update member: ${err.message || 'Unknown error'}`, 'error');
  } finally {
    setLoading(false);
  }
}

// ── Photo Upload ───────────────────────────────────────

function resetPhotoUpload() {
  selectedPhotoFile = null;
  photoPreview.innerHTML = '<i class="fas fa-user"></i><span>No photo selected</span>';
  delete photoPreview.dataset.url;
  if (photoInput) photoInput.value = '';
}

function handlePhotoSelect(e: Event) {
  const target = e.target as HTMLInputElement;
  const file = target.files?.[0];

  if (file) {
    selectedPhotoFile = file;

    // Show preview
    const reader = new FileReader();
    reader.onload = (e) => {
      const result = e.target?.result as string;
      photoPreview.innerHTML = `<img src="${result}" alt="Photo preview">`;
    };
    reader.readAsDataURL(file);
  }
}

// ── Modal ─────────────────────────────────────────────

async function openEditModal(memberId: string) {
  try {
    const member = allMembers.find(m => m.id === memberId);
    if (!member) {
      showAlert(editAlert, 'Member not found.', 'error');
      return;
    }

    currentEditMember = member;

    // Populate form fields
    (editForm.querySelector('[name="member_id"]') as HTMLInputElement).value = member.id;
    (editForm.querySelector('[name="name"]') as HTMLInputElement).value = member.name;
    (editForm.querySelector('[name="email"]') as HTMLInputElement).value = member.email || '';
    (editForm.querySelector('[name="year"]') as HTMLSelectElement).value = member.year || '';
    (editForm.querySelector('[name="pin"]') as HTMLInputElement).value = member.pin || '';
    (editForm.querySelector('[name="about"]') as HTMLTextAreaElement).value = member.about || '';

    // Populate department checkboxes
    const deptCheckboxes = editForm.querySelectorAll('input[name="edit_departments"]');
    deptCheckboxes.forEach(cb => {
      const checkbox = cb as HTMLInputElement;
      checkbox.checked = member.departments?.some(d => d.id === checkbox.value) || false;
    });

    // Populate role checkboxes
    const roleCheckboxes = editForm.querySelectorAll('input[name="edit_roles"]');
    roleCheckboxes.forEach(cb => {
      const checkbox = cb as HTMLInputElement;
      checkbox.checked = member.roles?.some(r => r.id === checkbox.value) || false;
    });

    hideAlert(editAlert);
    editModal.classList.add('show');
  } catch (err) {
    console.error('Error opening edit modal:', err);
  }
}

function closeModal() {
  editModal.classList.remove('show');
  currentEditMember = null;
  editForm.reset();
}

// ── Member Actions ───────────────────────────────────────

async function softDeleteMemberAction(memberId: string) {
  if (!confirm('Are you sure you want to remove this member?')) return;

  try {
    await softDeleteMember(memberId);
    showAlert(membersAlert, 'Member removed successfully.', 'success');
    await loadMembers();
  } catch (err: any) {
    console.error('Error removing member:', err);
    showAlert(membersAlert, `Failed to remove member: ${err.message || 'Unknown error'}`, 'error');
  }
}

async function restoreMemberAction(memberId: string) {
  try {
    await restoreMember(memberId);
    showAlert(membersAlert, 'Member restored successfully.', 'success');
    await loadMembers();
  } catch (err: any) {
    console.error('Error restoring member:', err);
    showAlert(membersAlert, `Failed to restore member: ${err.message || 'Unknown error'}`, 'error');
  }
}

// ── Search & Filter ───────────────────────────────────

function handleSearch() {
  const query = searchInput.value.trim().toLowerCase();

  const filtered = allMembers.filter(member => {
    const matchesSearch = !query ||
      member.name.toLowerCase().includes(query) ||
      member.email?.toLowerCase().includes(query) ||
      formatDepartments(member).toLowerCase().includes(query);

    const matchesDept = !filterDepartment.value ||
      member.departments?.some(d => d.id === filterDepartment.value);

    const matchesStatus = filterStatus.value === 'all' ||
      (filterStatus.value === 'active' && member.is_active) ||
      (filterStatus.value === 'inactive' && !member.is_active);

    return matchesSearch && matchesDept && matchesStatus;
  });

  renderMembersList(filtered);
}

function setLoading(loading: boolean) {
  const btns = document.querySelectorAll('.admin-btn');
  btns.forEach(btn => {
    (btn as HTMLButtonElement).disabled = loading;
  });
}

// ── Event Listeners ─────────────────────────────────────

// Tab switching functionality
const tabButtons = document.querySelectorAll('.admin-tab');
tabButtons.forEach(button => {
  button.addEventListener('click', () => {
    const targetPanel = button.getAttribute('data-panel');
    if (!targetPanel) return;

    // Remove active class from all tabs and panels
    document.querySelectorAll('.admin-tab').forEach(tab => tab.classList.remove('active'));
    document.querySelectorAll('.admin-panel').forEach(panel => panel.classList.remove('active'));

    // Add active class to clicked tab and target panel
    button.classList.add('active');
    const targetPanelElement = document.getElementById(`${targetPanel}-panel`);
    if (targetPanelElement) {
      targetPanelElement.classList.add('active');
    }
  });
});

addMemberForm.addEventListener('submit', handleAddMember);
editForm.addEventListener('submit', handleUpdateMember);

searchInput.addEventListener('input', handleSearch);
filterDepartment.addEventListener('change', handleSearch);
filterStatus.addEventListener('change', handleSearch);

photoInput?.addEventListener('change', handlePhotoSelect);

// Close modal handlers
document.getElementById('close-edit-modal')?.addEventListener('click', closeModal);
editModal.addEventListener('click', (e) => {
  if (e.target === editModal) closeModal();
});

// Make functions available globally for onclick handlers
(window as any).openEditModal = openEditModal;
(window as any).softDeleteMember = softDeleteMemberAction;
(window as any).restoreMember = restoreMemberAction;

// ── Init ─────────────────────────────────────────────────

document.addEventListener('DOMContentLoaded', async () => {
  if (!checkAdminAuth()) return;

  await Promise.all([
    loadDepartments(),
    loadRoles(),
    loadMembers(),
  ]);

  // Setup initial stats
  updateStats();
});
