# 🔄 Authentication Flow Diagram

## Complete Authentication Flow

```
┌─────────────────────────────────────────────────────────────────────┐
│                        USER AUTHENTICATION FLOW                      │
└─────────────────────────────────────────────────────────────────────┘

┌──────────────┐         ┌──────────────┐         ┌──────────────┐
│              │         │              │         │              │
│   Browser    │────────▶│   Frontend   │────────▶│   Backend    │
│              │         │   (React)    │         │   (Express)  │
└──────────────┘         └──────────────┘         └──────────────┘
                                                           │
                                                           │
                                                           ▼
                                                   ┌──────────────┐
                                                   │   Supabase   │
                                                   │     Auth     │
                                                   └──────────────┘

═══════════════════════════════════════════════════════════════════════

1️⃣  INITIAL PAGE LOAD (Unauthenticated)
════════════════════════════════════════

Browser                Frontend                Backend
   │                       │                       │
   │──── Opens /admin ────▶│                       │
   │                       │                       │
   │                       │─── GET /api/auth/me ──▶│
   │                       │    (with cookies)     │
   │                       │                       │
   │                       │◀───── 401 ────────────│
   │                       │    Not authenticated  │
   │                       │                       │
   │◀─ Redirect /login ───│                       │
   │                       │                       │

═══════════════════════════════════════════════════════════════════════

2️⃣  LOGIN PROCESS
═══════════════════

Browser                Frontend                Backend              Supabase
   │                       │                       │                    │
   │─── Enter creds ─────▶│                       │                    │
   │    Submit form        │                       │                    │
   │                       │                       │                    │
   │                       │── POST /api/auth/login ▶│                  │
   │                       │   {uniqueId, password}│                    │
   │                       │                       │                    │
   │                       │                       │─── Validate ─────▶│
   │                       │                       │   credentials      │
   │                       │                       │                    │
   │                       │                       │◀── JWT tokens ────│
   │                       │                       │  (access+refresh)  │
   │                       │                       │                    │
   │                       │◀────── Response ──────│                    │
   │                       │   Set-Cookie headers: │                    │
   │                       │   sb-access-token     │                    │
   │                       │   sb-refresh-token    │                    │
   │                       │   + User object       │                    │
   │◀─ Store in ──────────│                       │                    │
   │   localStorage        │                       │                    │
   │   (cache)             │                       │                    │
   │                       │                       │                    │
   │◀─ Redirect ──────────│                       │                    │
   │   to dashboard        │                       │                    │
   │                       │                       │                    │

═══════════════════════════════════════════════════════════════════════

3️⃣  AUTHENTICATED API CALLS
════════════════════════════════

Browser                Frontend                Backend              Supabase
   │                       │                       │                    │
   │── Action (view doc) ─▶│                       │                    │
   │                       │                       │                    │
   │                       │── GET /api/documents ─▶│                   │
   │                       │   Cookie: sb-access-  │                    │
   │                       │   token=xxx           │                    │
   │                       │                       │                    │
   │                       │                       │── Verify token ──▶│
   │                       │                       │                    │
   │                       │                       │◀── Valid ─────────│
   │                       │                       │                    │
   │                       │◀──── Documents ───────│                    │
   │◀─── Display ─────────│                       │                    │
   │                       │                       │                    │

═══════════════════════════════════════════════════════════════════════

4️⃣  TOKEN REFRESH (Automatic)
═══════════════════════════════

Browser                Frontend                Backend              Supabase
   │                       │                       │                    │
   │── API request ───────▶│                       │                    │
   │   (access token       │                       │                    │
   │    expired)           │                       │                    │
   │                       │                       │                    │
   │                       │──── GET /api/xxx ────▶│                    │
   │                       │   Cookie: expired     │                    │
   │                       │   access token        │                    │
   │                       │                       │                    │
   │                       │                       │─── Verify ───────▶│
   │                       │                       │   access token     │
   │                       │                       │                    │
   │                       │                       │◀── Expired ───────│
   │                       │                       │                    │
   │                       │                       │─── Refresh ──────▶│
   │                       │                       │   using refresh    │
   │                       │                       │   token            │
   │                       │                       │                    │
   │                       │                       │◀── New tokens ────│
   │                       │                       │                    │
   │                       │◀──── Response ────────│                    │
   │                       │   Set-Cookie: new     │                    │
   │                       │   access token        │                    │
   │◀─── Success ─────────│                       │                    │
   │                       │                       │                    │

═══════════════════════════════════════════════════════════════════════

5️⃣  SESSION EXPIRATION
════════════════════════

Browser                Frontend                Backend              Supabase
   │                       │                       │                    │
   │── API request ───────▶│                       │                    │
   │                       │                       │                    │
   │                       │──── GET /api/xxx ────▶│                    │
   │                       │                       │                    │
   │                       │                       │─── Verify ───────▶│
   │                       │                       │   refresh token    │
   │                       │                       │                    │
   │                       │                       │◀── Expired ───────│
   │                       │                       │                    │
   │                       │◀────── 401 ───────────│                    │
   │                       │   Unauthorized        │                    │
   │                       │                       │                    │
   │◀─ Clear localStorage ─│                       │                    │
   │   Clear cookies       │                       │                    │
   │                       │                       │                    │
   │◀─ Redirect /login ────│                       │                    │
   │                       │                       │                    │

═══════════════════════════════════════════════════════════════════════

6️⃣  LOGOUT PROCESS
═══════════════════

Browser                Frontend                Backend
   │                       │                       │
   │─── Click logout ─────▶│                       │
   │                       │                       │
   │                       │─ POST /api/auth/logout ▶│
   │                       │   (with cookies)      │
   │                       │                       │
   │                       │◀─── Clear cookies ────│
   │                       │   Set-Cookie: (empty) │
   │                       │                       │
   │◀─ Clear localStorage ─│                       │
   │   Clear query cache   │                       │
   │                       │                       │
   │◀─ Redirect /login ────│                       │
   │                       │                       │

═══════════════════════════════════════════════════════════════════════
```

## 🔑 Key Components

### Browser Storage

```
┌──────────────────────────────────────┐
│           BROWSER STORAGE            │
├──────────────────────────────────────┤
│                                      │
│  Cookies (HTTP-only, Secure):        │
│  • sb-access-token (1 hour)          │
│  • sb-refresh-token (30 days)        │
│                                      │
│  localStorage (Cache only):          │
│  • ice-archive-user (user profile)   │
│                                      │
└──────────────────────────────────────┘
```

### Authentication Route Protection

```
User tries to access protected route
         │
         ▼
    ┌─────────┐
    │ Is User │
    │ Logged  │───── NO ────▶ Redirect to /login
    │   In?   │
    └─────────┘
         │
        YES
         │
         ▼
    ┌─────────┐
    │ Has     │
    │ Required│───── NO ────▶ Redirect to user's dashboard
    │  Role?  │
    └─────────┘
         │
        YES
         │
         ▼
    Allow Access
```

## 🛡️ Security Layers

```
1. HTTP-Only Cookies
   └─▶ Cannot be accessed by JavaScript
       └─▶ Protected from XSS attacks

2. Secure Flag (Production)
   └─▶ Only sent over HTTPS
       └─▶ Protected from man-in-the-middle attacks

3. SameSite Protection
   └─▶ Prevents CSRF attacks
       └─▶ Cookies only sent to same-origin requests

4. Token Expiration
   └─▶ Access token: 1 hour
   └─▶ Refresh token: 30 days
       └─▶ Limited window for stolen tokens

5. Role-Based Access Control
   └─▶ Server-side validation
       └─▶ Even with valid token, users can only access authorized routes
```

## 📊 Session Lifecycle

```
Login
  │
  ├─▶ Create session (access + refresh tokens)
  │
  ├─▶ Store in HTTP-only cookies
  │
  ├─▶ Cache user profile in localStorage
  │
  └─▶ Valid for 1 hour (access token)

    │
    │  ⏰ After 1 hour
    │
    ▼

Access Token Expires
  │
  ├─▶ Frontend makes API call
  │
  ├─▶ Backend detects expired access token
  │
  ├─▶ Backend uses refresh token automatically
  │
  ├─▶ New access token issued
  │
  └─▶ User continues without interruption

    │
    │  ⏰ After 30 days
    │
    ▼

Refresh Token Expires
  │
  ├─▶ Backend cannot refresh session
  │
  ├─▶ Returns 401 Unauthorized
  │
  ├─▶ Frontend detects 401
  │
  ├─▶ Clears all local data
  │
  └─▶ Redirects to /login
```

## 🌐 Multi-Tab Synchronization

```
Tab 1              Cookies (Shared)         Tab 2
  │                      │                    │
Login ──────────▶  Set cookies  ◀────────────│
  │                      │                    │
  │                 Stored in                 │
  │                  Browser                  │
  │                      │                    │
  │────── API call ─────▶│◀──── API call ────│
  │    (auto-includes    │   (auto-includes  │
  │      cookies)        │     cookies)      │
  │                      │                    │
  │────── Logout ───────▶│◀──────────────────│
  │                 Clear cookies             │
  │                      │                    │
  │                  Logged out               │
  │                      │                    │
  │◀──── 401 ───────────┼────── 401 ────────▶│
  │                      │                    │
Both tabs redirect to /login
```

---

**This visual guide shows exactly how authentication works in your application!**
