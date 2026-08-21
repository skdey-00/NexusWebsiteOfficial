/**
 * Runtime Configuration for Attendance System
 * Add your Supabase credentials here to test without environment variables
 *
 * INSTRUCTIONS:
 * 1. Create a Supabase project at https://supabase.com
 * 2. Go to Settings > API to get your credentials
 * 3. Fill in the values below
 * 4. For production, use environment variables instead
 */

// ⚠️ DEVELOPMENT ONLY - Don't commit real credentials to git!
window.SUPABASE_CONFIG = {
  // Your Supabase project URL (e.g., "https://xxxxx.supabase.co")
  url: "https://mowkmkvejtjwwnhvartz.supabase.co",

  // Your Supabase anon/public key
  anonKey: "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im1vd2tta3ZlanRqd3duaHZhcnR6Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODUzMTEyMDcsImV4cCI6MjEwMDg4NzIwN30.7_HIIBr_FM99sPH-nEUU7aF3KMmQDrt84CV35TIxRHs",
};

// Auto-inject configuration
if (window.SUPABASE_CONFIG.url && window.SUPABASE_CONFIG.anonKey) {
  window.SUPABASE_URL = window.SUPABASE_CONFIG.url;
  window.SUPABASE_ANON_KEY = window.SUPABASE_CONFIG.anonKey;
  console.log('✅ Supabase configuration loaded from config.js');
} else {
  console.warn('⚠️ Supabase credentials not configured. Please edit config.js or set environment variables.');
}
