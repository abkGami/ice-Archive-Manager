# 🧪 Authentication Testing Checklist

## Quick Start (Local Testing)

1. **Start the development server**:

   ```bash
   npm run dev
   ```

2. **Open your browser** to `http://localhost:5173`

---

## ✅ Test Scenarios

### 1. **Unauthenticated Access Protection**

- [ ] Try to open `http://localhost:5173/admin/dashboard` directly
- [ ] Expected: Should redirect to `/login`
- [ ] Try to open `http://localhost:5173/student/documents`
- [ ] Expected: Should redirect to `/login`

### 2. **Login Flow**

- [ ] Go to `/login`
- [ ] Enter credentials (use seed data):
  - Admin: `ADMIN-001` / `Admin@2024`
  - Lecturer: `SS/CE/0042` / `Staff@2024`
  - Student: `U21ICT1014` / `Student@2026`
- [ ] Click "Sign In"
- [ ] Expected: Should redirect to appropriate dashboard based on role

### 3. **Session Persistence**

- [ ] After logging in, check browser DevTools → Application → Cookies
- [ ] Expected cookies:
  - `sb-access-token` (HttpOnly: true, Secure: false in dev)
  - `sb-refresh-token` (HttpOnly: true, Secure: false in dev)
- [ ] Refresh the page (F5)
- [ ] Expected: Should stay logged in
- [ ] Close the browser completely
- [ ] Reopen and go to the dashboard URL
- [ ] Expected: Should still be logged in

### 4. **LocalStorage Cache**

- [ ] After logging in, open DevTools → Application → Local Storage
- [ ] Find key: `ice-archive-user`
- [ ] Expected: Contains user profile data (name, role, etc.)

### 5. **Multi-Tab Sync**

- [ ] Login in one tab
- [ ] Open a new tab and go to the same site
- [ ] Expected: Should already be logged in

### 6. **Logout**

- [ ] Click on your profile avatar (top right)
- [ ] Click "Sign Out"
- [ ] Expected:
  - Cookies should be cleared
  - LocalStorage should be cleared
  - Should redirect to `/login`
- [ ] Try to go back to dashboard
- [ ] Expected: Should redirect to `/login`

### 7. **Role-Based Access**

- [ ] Login as Student
- [ ] Try to access `/admin/dashboard` directly
- [ ] Expected: Should redirect to `/student/dashboard`
- [ ] Login as Admin
- [ ] Try to access `/student/documents`
- [ ] Expected: Should stay on or redirect to `/admin/dashboard`

### 8. **API Authentication**

- [ ] Login to the application
- [ ] Open DevTools → Network tab
- [ ] Navigate to different pages
- [ ] Click on any API request to `/api/*`
- [ ] Check Request Headers
- [ ] Expected: Should see `Cookie: sb-access-token=...` automatically

### 9. **Token Expiration Handling** (Manual Test)

- [ ] Login to the application
- [ ] Open DevTools → Application → Cookies
- [ ] Delete the `sb-access-token` cookie manually
- [ ] Try to access a protected page or make an API call
- [ ] Expected: Should redirect to `/login`

---

## 🔍 Debugging Tips

### Check Authentication State

Open browser console and run:

```javascript
// Check localStorage
console.log("User:", localStorage.getItem("ice-archive-user"));

// Check cookies (won't show httpOnly cookies)
console.log("Cookies:", document.cookie);
```

### Check API Calls

1. Open DevTools → Network tab
2. Filter by "Fetch/XHR"
3. Click on `/api/auth/me` request
4. Check Response - should show user object if authenticated

### Clear Everything (Reset State)

```javascript
// Clear localStorage
localStorage.clear();

// Clear session storage
sessionStorage.clear();

// Cookies will be cleared on logout
```

---

## 🐛 Common Issues & Solutions

### Issue: "Not Authenticated" after login

**Solution**:

1. Check browser console for errors
2. Verify `.env` file has correct Supabase credentials
3. Check that Supabase Auth is enabled

### Issue: Redirect loop between login and dashboard

**Solution**:

1. Clear browser cache: Ctrl + Shift + Delete
2. Clear localStorage: DevTools → Application → Local Storage → Delete
3. Hard refresh: Ctrl + Shift + R

### Issue: Session not persisting across tabs

**Solution**:

1. Check that cookies are being set (DevTools → Application → Cookies)
2. Verify `credentials: "include"` is in all fetch calls
3. Check CORS_ALLOWED_ORIGINS in `.env`

### Issue: Can access protected routes without login (in dev)

**Solution**:

1. Stop the dev server
2. Run `npm run check` to ensure no TypeScript errors
3. Clear browser cache and cookies
4. Restart dev server

---

## ✨ What Should Work Now

✅ Login stores session in HTTP-only cookies
✅ User data cached in localStorage for fast UI
✅ Unauthenticated users redirected to login
✅ Sessions persist across page refreshes
✅ Sessions persist across browser restarts
✅ Sessions work across multiple tabs
✅ Automatic logout when tokens expire
✅ Role-based access control enforced
✅ API calls automatically include authentication

---

## 📝 Quick Reference

### Test User Credentials (from seed data)

```
Administrator:
  ID: ADMIN-001
  Password: Admin@2024

Lecturer:
  ID: SS/CE/0042
  Password: Staff@2024

Student:
  ID: U21ICT1014
  Password: Student@2026
```

### Important URLs (Local Development)

- Frontend: http://localhost:5173
- Backend API: http://localhost:5000
- Login: http://localhost:5173/login
- Admin Dashboard: http://localhost:5173/admin/dashboard

### Environment Files

- `.env` - Backend and general environment variables
- Make sure CORS_ALLOWED_ORIGINS includes "http://localhost:5173"

---

**Happy Testing! 🚀**

If all tests pass, your authentication system is working correctly and ready for production deployment!
