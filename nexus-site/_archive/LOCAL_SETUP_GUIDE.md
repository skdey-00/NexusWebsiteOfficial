# Local Team Members System - Setup Guide

This guide will help you set up and use the local team members management system without requiring a Supabase backend.

## 🎯 What This Does

- **Dynamic Member Loading**: Team members are loaded dynamically from localStorage instead of being hardcoded in HTML
- **Local Admin Dashboard**: Add, edit, delete team members through a web interface
- **Photo Management**: Upload and manage team member photos
- **No Backend Required**: Everything runs in the browser using localStorage

## 📁 Files Created

1. **`src/lib/local-members.ts`** - Core local members system
2. **`src/local-dynamic-members.ts`** - Dynamic member loading for website pages
3. **`src/local-admin-dashboard.ts`** - Admin dashboard functionality
4. **`src/local-portal.ts`** - Admin login system
5. **`local-portal.html`** - Admin login page
6. **`local-admin-dashboard.html`** - Admin dashboard interface
7. **`team-dynamic.html`** - Dynamic team page (replaces hardcoded team.html)

## 🚀 Quick Start

### 1. Access the Admin Portal

Navigate to:
```
http://localhost:5173/local-portal.html
```

**Default Login:**
- Password: `admin1234`

### 2. Manage Team Members

After logging in, you'll be redirected to the Admin Dashboard where you can:

- **View all members** with search and filter options
- **Add new members** with photo uploads
- **Edit existing members** (name, department, role, etc.)
- **Delete members** (soft delete - can be restored)

### 3. View on Website

Navigate to:
```
http://localhost:5173/team-dynamic.html
```

This page will dynamically load all members from your local storage.

## 📸 Photo Management

Photos are stored in:
```
public/Images/Team Members Photos/
```

When you upload a photo in the admin dashboard, it will be converted to a data URL and stored in localStorage along with the member data.

## 🔧 Admin Features

### Add New Member
1. Click "Add Member" tab
2. Fill in member details:
   - Full Name *
   - Department *
   - 4-Digit PIN *
   - Email (optional)
   - Year (optional)
   - Role (Member/Head/Captain)
   - About (optional)
   - Profile Photo (optional)
3. Click "Add Member"

### Edit Member
1. Find member in the list
2. Click the edit (pencil) icon
3. Make changes
4. Click "Save Changes"

### Delete Member
1. Find member in the list
2. Click the delete (trash) icon
3. Confirm deletion
4. Member will be marked as inactive (can be restored)

### Restore Member
1. Click "Inactive Only" in the status filter
2. Find the inactive member
3. Click the restore (undo) icon

## 🔄 Replace Current Team Page

To replace your current `team.html` with the dynamic version:

1. Backup your current `team.html`
2. Replace it with `team-dynamic.html` content
3. Or rename `team-dynamic.html` to `team.html`

## 🛡️ Security Notes

⚠️ **Important**: This is a local development system:
- Data is stored in browser localStorage (not persistent across devices)
- Default password is `admin1234` - change it after first login
- For production, use the Supabase backend system

## 💾 Data Management

### Export Data
The system includes export functionality to backup your members data as JSON.

### Import Data
You can import members from JSON if needed.

### Clear Data
To reset everything:
```javascript
// In browser console
localStorage.clear();
location.reload();
```

## 🎨 Customization

### Change Default Password
Edit `src/lib/local-members.ts`:
```typescript
const DEFAULT_ADMIN_PASSWORD = 'your-secure-password';
```

### Modify Member Data Structure
The `LocalMember` interface in `src/lib/local-members.ts` defines the structure:
```typescript
interface LocalMember {
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
```

## 🐛 Troubleshooting

### Members not loading
- Check browser console for errors
- Verify localStorage has data: `localStorage.getItem('robocon_members')`
- Try refreshing the page

### Can't login
- Clear localStorage and try again
- Check if password matches: default is `admin1234`

### Photos not showing
- Check photo URL format (should be `/Images/Team Members Photos/Name.png`)
- Verify file exists in the public directory

## 📞 Next Steps

Once you're ready to go live:
1. Export your members data from the local system
2. Set up Supabase backend
3. Import data to Supabase
4. Switch to the production admin dashboard

## 🎉 Tips

- Use the search bar to quickly find members
- Filter by department to see specific teams
- The system automatically initializes with your current team members
- Changes are saved instantly to localStorage
- Use browser dev tools to inspect localStorage data

---

**Need Help?** Check the console logs for detailed error messages and debugging information.
