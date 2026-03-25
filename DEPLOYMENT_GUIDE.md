# Authentication Implementation & Deployment Guide

## 🔐 What's Been Implemented

Your application now has **complete session-based authentication** using:

- **JWT tokens** stored in HTTP-only cookies (secure, protected from XSS attacks)
- **Automatic redirect** to login for unauthenticated users
- **Token refresh** mechanism via Supabase
- **Persistent user sessions** using browser storage as cache
- **Global authentication context** for consistent auth state

---

## ✅ Changes Made

### 1. **Fixed Route Protection** (`client/src/components/auth/RouteProtection.tsx`)

- Changed default redirect from `/` to `/login` for unauthenticated users
- Direct redirect to login page without unnecessary intermediate redirects

### 2. **Enhanced User Session Hook** (`client/src/hooks/use-auth.ts`)

- Now handles 401 AND 403 status codes
- Automatic cleanup of stale localStorage data
- Added `refetchOnMount` and `refetchOnWindowFocus` for better session validation

### 3. **Created Global Auth Context** (`client/src/contexts/AuthContext.tsx`)

- Manages authentication state across the entire app
- Automatically redirects unauthenticated users to login
- Prevents access to protected routes

### 4. **Created Fetch Wrapper** (`client/src/lib/fetch.ts`)

- Centralized authentication error handling
- Automatic logout and redirect on 401 errors
- Prevents redirect loops

### 5. **Updated App.tsx**

- Wrapped the app with `AuthProvider` for global auth state management

### 6. **Fixed TypeScript Error**

- Fixed type error in `AppHeader.tsx`

---

## 🚀 Deployment Instructions

### **Prerequisites**

1. Active Supabase project
2. Hosting platforms ready (e.g., Vercel, Netlify, Railway, Render)

---

## 📦 **Backend Deployment**

### **Option 1: Deploy to Render (Recommended for Node.js)**

1. **Create a Render account** at https://render.com

2. **Create a new Web Service**:
   - Connect your GitHub repository
   - Select the repository: `ice-Archive-Manager`
   - Configure the service:
     ```
     Name: ice-archive-backend
     Environment: Node
     Build Command: npm install && npm run build
     Start Command: npm start
     ```

3. **Add Environment Variables** in Render Dashboard:

   ```bash
   NODE_ENV=production
   PORT=5000

   # IMPORTANT: Replace with your actual frontend URL after deploying frontend
   CORS_ALLOWED_ORIGINS=https://your-frontend-url.vercel.app

   # Cookie settings - CRITICAL FOR AUTHENTICATION
   COOKIE_SAME_SITE=none

   # Supabase Configuration (Get these from your Supabase project)
   SUPABASE_URL=https://your-project-id.supabase.co
   SUPABASE_ANON_KEY=your-supabase-anon-key-here
   SUPABASE_SERVICE_ROLE_KEY=your-supabase-service-role-key-here
   SUPABASE_ID_CARD_BUCKET=id-card-images
   SUPABASE_DOCUMENT_BUCKET=documents
   ```

4. **Deploy** - Render will automatically deploy your backend

5. **Get your backend URL** (e.g., `https://ice-archive-backend.onrender.com`)

---

### **Option 2: Deploy to Railway**

1. **Create a Railway account** at https://railway.app

2. **Create a new project**:
   - Click "New Project" → "Deploy from GitHub repo"
   - Select your repository

3. **Add Environment Variables**:
   - Same as Render above

4. **Deploy** - Railway will auto-deploy

---

## 🌐 **Frontend Deployment**

### **Deploy to Vercel (Recommended for React)**

1. **Create a Vercel account** at https://vercel.com

2. **Import your project**:
   - Click "Add New" → "Project"
   - Import from GitHub: `ice-Archive-Manager`

3. **Configure Build Settings**:

   ```
   Framework Preset: Vite
   Build Command: npm run build
   Output Directory: dist
   Install Command: npm install
   Root Directory: ./
   ```

4. **Add Environment Variable**:

   ```bash
   # Replace with your actual backend URL from Render/Railway
   VITE_API_BASE_URL=https://ice-archive-backend.onrender.com
   ```

5. **Deploy** - Vercel will build and deploy

6. **Get your frontend URL** (e.g., `https://ice-archive.vercel.app`)

---

## 🔄 **Update CORS After Deployment**

**CRITICAL STEP**: After deploying frontend, update backend CORS settings

1. Go to your backend hosting platform (Render/Railway)
2. Update the `CORS_ALLOWED_ORIGINS` environment variable:
   ```bash
   CORS_ALLOWED_ORIGINS=https://ice-archive.vercel.app,https://www.ice-archive.vercel.app
   ```
3. Redeploy the backend to apply changes

---

## 🗄️ **Supabase Setup**

### **Required Configuration**

1. **Storage Buckets** - Create these in Supabase Dashboard → Storage:
   - `id-card-images` (for user ID cards during signup)
   - `documents` (for uploaded documents)

2. **Storage Policies** - Set public read access for authenticated users:

   ```sql
   -- For id-card-images bucket
   CREATE POLICY "Allow authenticated users to read"
   ON storage.objects FOR SELECT
   TO authenticated
   USING (bucket_id = 'id-card-images');

   -- For documents bucket
   CREATE POLICY "Allow authenticated users to read"
   ON storage.objects FOR SELECT
   TO authenticated
   USING (bucket_id = 'documents');
   ```

3. **Auth Settings** in Supabase Dashboard → Authentication → Settings:
   - Enable "Email" provider (already enabled by default)
   - **JWT Expiry**: 3600 seconds (1 hour) - Recommended
   - **Refresh Token Expiry**: 2592000 seconds (30 days) - Recommended

---

## 🧪 **Testing Authentication**

### **Local Testing**

1. **Create `.env` file** in project root:

   ```bash
   NODE_ENV=development
   PORT=5000
   CORS_ALLOWED_ORIGINS=http://localhost:5173
   COOKIE_SAME_SITE=lax
   VITE_API_BASE_URL=

   # Add your Supabase credentials
   SUPABASE_URL=https://your-project.supabase.co
   SUPABASE_ANON_KEY=your-anon-key
   SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
   SUPABASE_ID_CARD_BUCKET=id-card-images
   SUPABASE_DOCUMENT_BUCKET=documents
   ```

2. **Start development server**:

   ```bash
   npm run dev
   ```

3. **Test these scenarios**:
   - ✅ Try to access `/admin/dashboard` without logging in → Should redirect to `/login`
   - ✅ Login with valid credentials → Should store session and access dashboard
   - ✅ Refresh the page → Should stay logged in
   - ✅ Close browser and reopen → Should stay logged in (until token expires)
   - ✅ Open different tabs → Session should persist across tabs
   - ✅ Logout → Should clear session and redirect to login

---

### **Production Testing**

After deployment, test:

1. **Login** on your production site
2. **Check browser cookies** (DevTools → Application → Cookies):
   - Should see `sb-access-token`
   - Should see `sb-refresh-token`
   - Both should be `HttpOnly` and `Secure` (in production)
3. **Close and reopen browser** → Should still be logged in
4. **Try accessing protected routes** without being logged in → Should redirect to login

---

## 🔧 **Troubleshooting**

### **Issue: "Not authenticated" errors**

**Cause**: CORS or cookie settings misconfigured

**Solution**:

1. Verify `CORS_ALLOWED_ORIGINS` includes your frontend URL (no trailing slash)
2. Check `COOKIE_SAME_SITE` is set to `none` in production
3. Ensure frontend URL uses HTTPS (required for SameSite=none cookies)

---

### **Issue: Cookies not being set**

**Cause**: Browser blocking third-party cookies

**Solution**:

1. **For production**:
   - Use `COOKIE_SAME_SITE=none`
   - Ensure both frontend and backend use HTTPS
2. **For local development**:
   - Use `COOKIE_SAME_SITE=lax`
   - Run frontend and backend on same domain (current setup works)

---

### **Issue: Session expires too quickly**

**Cause**: JWT expiry is too short

**Solution**:

1. Go to Supabase Dashboard → Authentication → Settings
2. Increase "JWT expiry" to 3600 seconds (1 hour)
3. Keep "Refresh token expiry" at 2592000 seconds (30 days)

---

### **Issue: Redirect loops**

**Cause**: Auth state not updating properly

**Solution**:

1. Clear browser cache and cookies
2. Clear localStorage: Open DevTools → Application → Local Storage → Clear
3. Force refresh (Ctrl + Shift + R)

---

## 📊 **How It Works**

### **Authentication Flow**:

```
1. User enters credentials on /login
   ↓
2. Frontend sends POST to /api/auth/login
   ↓
3. Backend validates credentials with Supabase
   ↓
4. Backend sets HTTP-only cookies (sb-access-token & sb-refresh-token)
   ↓
5. Frontend stores user object in localStorage (as cache)
   ↓
6. User is redirected to their dashboard
   ↓
7. All subsequent API calls include cookies automatically
   ↓
8. When access token expires, backend uses refresh token automatically
   ↓
9. If refresh token expires, user is redirected to /login
```

### **Session Persistence**:

- **Short-term**: HTTP-only cookies (access token - 1 hour)
- **Long-term**: HTTP-only cookies (refresh token - 30 days)
- **Cache**: LocalStorage (user profile for instant UI load)

---

## 🎯 **Security Features**

✅ **HTTP-only cookies** - Cannot be accessed by JavaScript (XSS protection)
✅ **Secure flag** - Cookies only sent over HTTPS in production
✅ **SameSite protection** - CSRF attack prevention
✅ **Automatic token refresh** - Seamless session extension
✅ **Centralized auth handling** - Consistent logout on token expiry
✅ **Role-based access control** - Different permissions per user type

---

## 📝 **Summary**

Your authentication system now:

- ✅ Stores sessions securely in HTTP-only cookies
- ✅ Persists user sessions across browser restarts
- ✅ Automatically redirects unauthenticated users to login
- ✅ Handles token expiration gracefully
- ✅ Works across multiple tabs
- ✅ Ready for production deployment

---

## 🆘 **Need Help?**

If you encounter issues:

1. Check browser console for errors
2. Check network tab for API responses
3. Verify environment variables are set correctly
4. Ensure Supabase storage buckets exist
5. Confirm CORS settings match your frontend URL

---

**You're all set! 🚀 Your authentication system is production-ready.**
