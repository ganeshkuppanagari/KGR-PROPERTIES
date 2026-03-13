/* =====================================================
   KGR PROPERTIES – Admin Authentication Module
   =====================================================
   SECURITY: Change these credentials before going live.
   For production, replace with server-side authentication.
   ===================================================== */

const KGR_ADMIN_CREDENTIALS = [
  { username: 'kgradmin', password: 'kgr@admin345', role: 'superadmin', name: 'KGR Admin' },
];

/**
 * Validates login credentials.
 * Returns true if valid, false otherwise.
 */
function adminAuth(username, password) {
  const u = username.trim().toLowerCase();
  const p = password;
  return KGR_ADMIN_CREDENTIALS.some(c =>
    c.username.toLowerCase() === u && c.password === p
  );
}

/**
 * Gets logged-in admin info.
 */
function getAdminInfo() {
  const u = sessionStorage.getItem('kgr_admin_user') || '';
  return KGR_ADMIN_CREDENTIALS.find(c => c.username.toLowerCase() === u.toLowerCase())
    || { name: 'Admin', role: 'admin' };
}

/**
 * Guards a page – redirects to login if not authenticated.
 * Call this at the top of every admin page.
 */
function requireAdminAuth() {
  if (sessionStorage.getItem('kgr_admin_auth') !== '1') {
    window.location.href = 'admin-login.html';
    return false;
  }
  return true;
}

/**
 * Logout – clears session and redirects.
 */
function adminLogout() {
  if (confirm('Are you sure you want to sign out?')) {
    sessionStorage.removeItem('kgr_admin_auth');
    sessionStorage.removeItem('kgr_admin_user');
    window.location.href = 'admin-login.html';
  }
}
