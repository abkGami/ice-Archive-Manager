# 🚀 Quick Start Guide - ICE Archive Manager

Get your ICE Archive Manager up and running in 10 minutes!

---

## ⚡ Prerequisites Checklist

Before you begin, make sure you have:

- [ ] **Node.js 20+** installed ([Download](https://nodejs.org/))
- [ ] **npm** (comes with Node.js)
- [ ] **Supabase account** ([Sign up free](https://supabase.com))
- [ ] **Git** installed ([Download](https://git-scm.com/))
- [ ] **Code editor** (VS Code recommended)

---

## 📥 Step 1: Clone & Install (2 minutes)

```bash
# Clone the repository
git clone https://github.com/yourusername/ice-archive-manager.git
cd ice-archive-manager

# Install dependencies
npm install
```

**Expected output:** Package installation without errors

---

## 🗄️ Step 2: Set Up Supabase (5 minutes)

### 2.1 Create Supabase Project

1. Go to [https://supabase.com](https://supabase.com)
2. Click "New Project"
3. Fill in:
   - **Name**: ice-archive
   - **Database Password**: [Choose a strong password]
   - **Region**: Choose closest to you
4. Click "Create Project" (takes ~2 minutes)

### 2.2 Get API Keys

Once project is ready:

1. Go to **Settings** → **API**
2. Copy these values:
   - **Project URL**: `https://xxxxx.supabase.co`
   - **anon public key**: `eyJhbGciOiJI...`
   - **service_role key**: `eyJhbGciOiJI...` (keep this secret!)

### 2.3 Run Database Migrations

1. Go to **SQL Editor** in Supabase Dashboard
2. Click "New Query"
3. Copy and run each migration file in order:

**Migration 1:** `supabase/migrations/0001_initial.sql`

```sql
-- Copy entire contents and run
```

**Migration 2:** `supabase/migrations/0002_policies.sql`

```sql
-- Copy entire contents and run
```

**Migration 3:** `supabase/migrations/0003_optimize_login.sql`

```sql
-- Copy entire contents and run
```

### 2.4 Create Storage Buckets

1. Go to **Storage** in Supabase Dashboard
2. Click "Create Bucket"
   - **Name**: `id-card-images`
   - **Public**: No (private)
   - Click "Create"
3. Repeat for second bucket:
   - **Name**: `documents`
   - **Public**: No (private)
   - Click "Create"

---

## 🔐 Step 3: Configure Environment (1 minute)

Create a `.env` file in the project root:

```bash
# Copy from example
cp .env.example .env
```

Edit `.env` with your values:

```env
# Server Configuration
NODE_ENV=development
PORT=5000
CORS_ALLOWED_ORIGINS=http://localhost:5173
COOKIE_SAME_SITE=lax

# Frontend Configuration
VITE_API_BASE_URL=

# Supabase Configuration (REPLACE WITH YOUR VALUES)
SUPABASE_URL=https://YOUR-PROJECT-ID.supabase.co
SUPABASE_ANON_KEY=YOUR-ANON-KEY-HERE
SUPABASE_SERVICE_ROLE_KEY=YOUR-SERVICE-ROLE-KEY-HERE
SUPABASE_ID_CARD_BUCKET=id-card-images
SUPABASE_DOCUMENT_BUCKET=documents
```

**⚠️ Important:** Replace `YOUR-PROJECT-ID`, `YOUR-ANON-KEY`, and `YOUR-SERVICE-ROLE-KEY` with actual values from Step 2.2!

---

## 🎬 Step 4: Start the Application (1 minute)

```bash
# Start development server
npm run dev
```

**Expected output:**

```
> ice-archive-manager@1.0.0 dev
> cross-env NODE_ENV=development tsx server/index.ts

3:15:54 PM [express] serving on port 5000
```

---

## 🎉 Step 5: Access & Test (1 minute)

1. **Open your browser** to: [http://localhost:5173](http://localhost:5173)

2. **You should see** the login page

3. **Enable seed data** (optional, for testing):

   ```env
   # Add to .env
   ENABLE_SEED_DATA=true
   ```

4. **Restart server** (Ctrl+C, then `npm run dev` again)

5. **Test login** with these accounts:

   | Role              | Unique ID  | Password     |
   | ----------------- | ---------- | ------------ |
   | **Administrator** | ADMIN-001  | Admin@2024   |
   | **Lecturer**      | SS/CE/0042 | Staff@2024   |
   | **Student**       | U21ICT1014 | Student@2026 |

---

## ✅ Verification Checklist

Test these to confirm everything works:

### Authentication

- [ ] Login with admin account (ADMIN-001)
- [ ] See admin dashboard
- [ ] Logout
- [ ] Login with different account

### Documents

- [ ] Navigate to Documents page
- [ ] See list of documents (if seed data enabled)
- [ ] Click on a document to view details

### Authorization

- [ ] Try accessing `/admin/dashboard` as student → Should redirect
- [ ] Try accessing admin features as student → Should show "Access Denied"

### Session Persistence

- [ ] Login
- [ ] Refresh page (F5) → Should stay logged in
- [ ] Close browser
- [ ] Reopen → Should still be logged in

---

## 🐛 Troubleshooting

### Issue: "Connection refused" or "Cannot connect"

**Solution:**

```bash
# Check if port 5000 is already in use
netstat -ano | findstr :5000    # Windows
lsof -i :5000                    # Mac/Linux

# Kill process if needed
taskkill /PID <PID> /F          # Windows
kill -9 <PID>                    # Mac/Linux

# Restart server
npm run dev
```

### Issue: "Not authenticated" after login

**Possible causes:**

1. **Wrong Supabase credentials** - Double-check `.env` file
2. **Database not set up** - Run migrations again
3. **Browser blocking cookies** - Check browser settings

**Solution:**

```bash
# Verify environment variables are loaded
node -e "console.log(process.env.SUPABASE_URL)"

# Should print your Supabase URL, not "undefined"
```

### Issue: "Table users does not exist"

**Solution:**

```bash
# You forgot to run database migrations!
# Go to Supabase Dashboard → SQL Editor
# Run 0001_initial.sql
```

### Issue: "Unable to upload file"

**Solution:**

1. Check storage buckets exist in Supabase
2. Verify bucket names match `.env` configuration
3. Check browser console for specific error

---

## 📚 Next Steps

Now that you have the app running:

1. **📖 Read the Documentation**
   - [README.md](./README.md) - Full documentation
   - [SYSTEM_FLOWCHARTS.md](./SYSTEM_FLOWCHARTS.md) - Visual flowcharts
   - [DEPLOYMENT_GUIDE.md](./DEPLOYMENT_GUIDE.md) - Production deployment

2. **🎨 Customize the App**
   - Change logo: Replace `client/public/logo.png`
   - Update branding: Edit `client/src/index.css`
   - Modify seed data: Edit `server/routes.ts`

3. **🧪 Test Features**
   - Create a new user account
   - Upload a document as lecturer
   - Approve document as administrator
   - Download document as student

4. **🚀 Deploy to Production**
   - Follow [DEPLOYMENT_GUIDE.md](./DEPLOYMENT_GUIDE.md)
   - Deploy backend to Render
   - Deploy frontend to Vercel

---

## 📖 Useful Commands

```bash
# Development
npm run dev              # Start dev server

# Type checking
npm run check            # Check TypeScript errors

# Build for production
npm run build            # Build client and server

# Run production build
npm start                # Start production server

# Clean install
rm -rf node_modules package-lock.json
npm install
```

---

## 🎯 Development Workflow

### Making Changes

1. **Edit files** in `client/src/` (frontend) or `server/` (backend)
2. **Save** - Vite will auto-reload
3. **Test** in browser
4. **Commit changes**:
   ```bash
   git add .
   git commit -m "Add: feature description"
   git push
   ```

### Adding New Features

1. **Backend API Route:**
   - Add route handler in `server/routes.ts`
   - Add type definition in `shared/routes.ts`

2. **Frontend Component:**
   - Create component in `client/src/components/`
   - Create page in `client/src/pages/`
   - Add route in `client/src/App.tsx`

3. **Database Changes:**
   - Create new migration file: `supabase/migrations/000X_name.sql`
   - Run in Supabase SQL Editor

---

## 🆘 Get Help

### Documentation

- **Full README**: [README.md](./README.md)
- **Flowcharts**: [SYSTEM_FLOWCHARTS.md](./SYSTEM_FLOWCHARTS.md)
- **Authentication**: [AUTHENTICATION_FLOW.md](./AUTHENTICATION_FLOW.md)
- **Deployment**: [DEPLOYMENT_GUIDE.md](./DEPLOYMENT_GUIDE.md)

### External Resources

- [Supabase Docs](https://supabase.com/docs)
- [React Docs](https://react.dev)
- [Vite Docs](https://vitejs.dev)
- [TypeScript Docs](https://www.typescriptlang.org/docs)

### Common Issues

- [TESTING_CHECKLIST.md](./TESTING_CHECKLIST.md) - Test scenarios
- [LOGIN_PERFORMANCE.md](./LOGIN_PERFORMANCE.md) - Performance guide

---

## 🎊 You're All Set!

Your ICE Archive Manager is now running locally. Explore the features, customize it to your needs, and deploy to production when ready!

**Happy Coding! 🚀**

---

<div align="center">

**Need help?** Open an issue on [GitHub](https://github.com/yourusername/ice-archive-manager/issues)

[⬆ Back to Top](#-quick-start-guide---ice-archive-manager)

</div>
