# ICT Department E-Archive Management System

A full-stack, role-based departmental e-archive platform for managing academic and administrative documents in a university environment.

This document is intentionally extensive. It is written so you can reuse it as high-quality source material for AI-assisted final year project writing (Chapter 1 to Chapter 5).

## 1. Project Summary

The ICT Department E-Archive Management System digitizes document handling in a department by replacing ad-hoc paper or unmanaged file-sharing workflows with a centralized archive platform.

The system supports:

- secure authentication and session management
- role-based access control for Administrators, Lecturers, and Students
- document upload, approval, browsing, and access control
- user onboarding and approval workflow
- audit trail logging for accountability
- Supabase-backed data and file storage

## 2. Problem Context

Many departmental document processes are fragmented:

- files are scattered across personal devices, messaging apps, and email threads
- there is no clear approval pipeline for official files
- user access is not consistently controlled by role
- retrieving old records is slow
- no audit trail exists for who uploaded, viewed, approved, or deleted files

This project solves those problems with a centralized web application and role-aware operations.

## 3. Project Goals and Objectives

### 3.1 General Goal

Build a robust departmental digital archive platform for secure document lifecycle management.

### 3.2 Specific Objectives

- Provide role-based login and protected routes
- Enable verified user onboarding and approval
- Support document upload with metadata
- Implement document approval workflows
- Enforce access visibility rules per role
- Provide download and view links for approved files
- Track major activities in audit logs
- Expose analytics for admin, lecturer, and student dashboards
- Support cloud deployment for frontend and backend

## 4. Scope of the System

### 4.1 In Scope

- Role-based web portal
- User account creation and admin approval
- Document CRUD and approval flow
- Audit logs and summary stats
- Cloud integration (Supabase + hosted frontend/backend)

### 4.2 Out of Scope

- Native mobile app
- Multi-tenant institutional support
- Offline mode
- Advanced search indexing (OCR/full-text)

## 5. High-Level Architecture

The repository follows a monorepo style:

- client: React frontend
- server: Express backend
- shared: type-safe contracts and schemas
- supabase/migrations: SQL schema and policy files

Data flow:

1. Frontend sends API requests with credentials
2. Backend validates auth and role
3. Backend performs business logic and storage operations
4. Supabase stores relational data and files
5. Backend returns typed responses for UI rendering

## 6. Core Features

### 6.1 Authentication and Session

- Login, signup, logout, current-user session check
- Supabase auth integration
- HttpOnly cookie-based token management
- Role-aware redirects after login

### 6.2 User Management

- Admin can create users
- Admin can view all users
- Admin can approve pending accounts
- Admin can update status and delete users
- ID card preview and validation support

### 6.3 Document Management

- Upload documents with metadata
- Assign document category and visibility permissions
- Approve pending documents
- Delete documents (role-restricted)
- Generate signed URLs for download and view

### 6.4 Dashboards and Reporting

- Admin stats: totals, pending approvals, uploads
- Lecturer stats: own uploads and approvals
- Student stats: available/recent documents
- Activity audit listing

### 6.5 UX Enhancements

- Sign out confirmation modal
- Forgot password informational modal
- Animated internal-server-error toast: "It's not you, It's me!"
- Loading states and empty states

## 7. Technology Stack

### 7.1 Frontend

- React 18
- TypeScript
- Vite
- Wouter (routing)
- TanStack Query (server-state management)
- Tailwind CSS
- Radix UI primitives (shadcn-style components)
- Lucide icons

### 7.2 Backend

- Node.js
- Express 5
- TypeScript
- Zod validation
- Cookie parser

### 7.3 Data and Storage

- Supabase Postgres (structured data)
- Supabase Auth (identity/session integration)
- Supabase Storage (document and ID-card files)

### 7.4 Build and Tooling

- esbuild (server bundling)
- tsx (TypeScript execution in scripts/dev)
- PostCSS + Tailwind

## 8. Data Model Overview

Primary entities in shared schema:

- User
- Document
- AuditLog

### 8.1 User fields

- id
- authUserId
- uniqueId
- password marker
- name
- role
- department
- level
- idCardImage
- status
- createdAt

### 8.2 Document fields

- id
- title
- category
- uploadedBy
- uploadedByName
- date
- fileType
- fileName
- filePath
- allowStaffAccess
- allowStudentAccess
- size
- status
- description

### 8.3 AuditLog fields

- id
- userId
- userName
- action
- documentId
- documentTitle
- ipAddress
- date

## 9. API Surface (Summary)

Auth:

- POST /api/auth/login
- POST /api/auth/signup
- POST /api/auth/logout
- GET /api/auth/me

Documents:

- GET /api/documents
- GET /api/documents/:id
- POST /api/documents
- PUT /api/documents/:id
- DELETE /api/documents/:id
- POST /api/documents/:id/approve
- GET /api/documents/:id/download-url
- GET /api/documents/:id/view-url

Users:

- GET /api/users
- POST /api/users
- GET /api/users/pending
- POST /api/users/:id/approve
- PUT /api/users/:id
- DELETE /api/users/:id
- GET /api/users/:id/id-card-url
- GET /api/users/:id/id-card-preview

Audit and Stats:

- GET /api/audit-logs
- GET /api/stats/admin
- GET /api/stats/lecturer
- GET /api/stats/student

## 10. Environment Variables

### 10.1 Server

- NODE_ENV
- PORT
- CORS_ALLOWED_ORIGINS
- COOKIE_SAME_SITE
- SUPABASE_URL
- SUPABASE_ANON_KEY
- SUPABASE_SERVICE_ROLE_KEY
- SUPABASE_ID_CARD_BUCKET
- SUPABASE_DOCUMENT_BUCKET

### 10.2 Frontend

- VITE_API_BASE_URL

Notes:

- Keep VITE_API_BASE_URL empty for same-origin API
- Set VITE_API_BASE_URL when frontend and backend are hosted separately

## 11. Local Development

### 11.1 Prerequisites

- Node.js 20+
- npm
- Supabase project configured

### 11.2 Install

- npm install

### 11.3 Run in dev

- npm run dev

### 11.4 Type check

- npm run check

### 11.5 Build and start

- npm run build
- npm run start

## 12. Deployment Notes

### 12.1 Split deployment pattern

Recommended pattern used in this project:

- Frontend hosted on Vercel
- Backend hosted on Render

### 12.2 Render build caveat

If build fails with "tsx: not found", install dev dependencies in build step:

- npm install --include=dev && npm run build

### 12.3 Cross-domain auth

For frontend-backend on different domains:

- configure CORS_ALLOWED_ORIGINS to include frontend URL
- set COOKIE_SAME_SITE=none
- ensure secure cookies in production
- frontend must use credentials-included requests

## 13. Security Considerations

- Never commit real secrets in .env
- Rotate leaked keys immediately
- Restrict CORS origins in production
- Use HttpOnly and Secure cookies
- Enforce role checks on backend routes
- Validate all inputs with Zod

## 14. Known Limitations

- No advanced full-text search
- No document versioning workflow yet
- Forgot password currently informational, not transactional
- Mock modules exist but production uses Supabase storage implementation

## 15. Suggested Future Improvements

- Add real forgot-password workflow
- Add email notifications on approvals/rejections
- Add advanced filtering and full-text indexing
- Add document version control and rollback
- Add comprehensive automated tests (unit, integration, e2e)
- Add analytics export and reports

## 16. Testing and Quality Status

Current quality checks include:

- TypeScript validation via npm run check
- Runtime form/schema validation via Zod
- React Query cache invalidation patterns on mutations

Recommended additions:

- API integration tests
- role-access regression tests
- e2e flows for signup and approval lifecycle

## 17. Folder-by-Folder and File-by-File Purpose Index

This section maps each tracked source/config file to its responsibility.

### 17.1 Root Files

- .env.example: sample env configuration for local and hosted usage
- .gitignore: ignored files and folders
- .replit: Replit environment metadata
- components.json: UI component generator/config mapping
- package.json: scripts, dependencies, runtime metadata
- package-lock.json: lockfile for deterministic installs
- postcss.config.js: PostCSS plugin configuration
- tailwind.config.ts: Tailwind theme and plugin configuration
- tsconfig.json: TypeScript compiler options and paths
- vite.config.ts: Vite app config, aliases, and output location

### 17.2 attached_assets

- attached_assets/Pasted--REPLIT-PROMPT-AFIT-DEPARTMENTAL-E-ARCHIVE-MANAGEMENT-S_1772647409839.txt: original product/design prompt reference

### 17.3 client root

- client/index.html: SPA HTML template
- client/requirements.md: design/requirements note for UI
- client/public/favicon.png: browser favicon
- client/public/logo.png: app logo used in auth/layout views
- client/public/assets/.gitkeep: keeps empty assets folder in git

### 17.4 client/src core

- client/src/main.tsx: React bootstrap entry
- client/src/App.tsx: route definitions and providers
- client/src/index.css: global styles, theme variables, and animations

### 17.5 client/src/lib

- client/src/lib/api.ts: absolute/same-origin API URL builder
- client/src/lib/queryClient.ts: React Query default configuration and request helpers
- client/src/lib/utils.ts: utility helpers (cn and similar)

### 17.6 client/src/hooks

- client/src/hooks/use-audit.ts: audit log data hook
- client/src/hooks/use-auth.ts: auth/session hooks
- client/src/hooks/use-documents.ts: document CRUD and actions hooks
- client/src/hooks/use-mobile.tsx: mobile breakpoint utility hook
- client/src/hooks/use-stats.ts: dashboard stats hooks
- client/src/hooks/use-toast.ts: toast state manager hook
- client/src/hooks/use-users.ts: user management hooks

### 17.7 client/src/components/common

- client/src/components/common/Badges.tsx: reusable status/role/category badges
- client/src/components/common/Button.tsx: app-level button wrapper
- client/src/components/common/EmptyState.tsx: reusable empty-state UI block
- client/src/components/common/PageLoader.tsx: full-page loading component
- client/src/components/common/SignOutConfirmDialog.tsx: signout confirmation modal

### 17.8 client/src/components/layout

- client/src/components/layout/AppHeader.tsx: top nav/header and user controls
- client/src/components/layout/AppShell.tsx: authenticated layout and route guard
- client/src/components/layout/AppSidebar.tsx: side navigation and signout trigger

### 17.9 client/src/components/documents

- client/src/components/documents/ConfirmActionDialog.tsx: generic destructive-action confirmation
- client/src/components/documents/DocumentDrawer.tsx: document detail side panel
- client/src/components/documents/DocumentTable.tsx: document listing table with actions

### 17.10 client/src/components/ui

- client/src/components/ui/accordion.tsx: accordion primitive wrapper
- client/src/components/ui/alert-dialog.tsx: alert dialog primitive wrapper
- client/src/components/ui/alert.tsx: alert UI wrapper
- client/src/components/ui/aspect-ratio.tsx: aspect-ratio wrapper
- client/src/components/ui/avatar.tsx: avatar wrapper
- client/src/components/ui/badge.tsx: badge wrapper
- client/src/components/ui/breadcrumb.tsx: breadcrumb wrapper
- client/src/components/ui/button.tsx: base UI button primitive
- client/src/components/ui/calendar.tsx: calendar/date UI component
- client/src/components/ui/card.tsx: card wrapper
- client/src/components/ui/carousel.tsx: carousel wrapper
- client/src/components/ui/chart.tsx: chart wrapper/helpers
- client/src/components/ui/checkbox.tsx: checkbox wrapper
- client/src/components/ui/collapsible.tsx: collapsible wrapper
- client/src/components/ui/command.tsx: command palette wrapper
- client/src/components/ui/context-menu.tsx: context menu wrapper
- client/src/components/ui/dialog.tsx: dialog wrapper
- client/src/components/ui/drawer.tsx: drawer wrapper
- client/src/components/ui/dropdown-menu.tsx: dropdown menu wrapper
- client/src/components/ui/form.tsx: form helpers and wrappers
- client/src/components/ui/hover-card.tsx: hover card wrapper
- client/src/components/ui/input-otp.tsx: otp input wrapper
- client/src/components/ui/input.tsx: input wrapper
- client/src/components/ui/label.tsx: label wrapper
- client/src/components/ui/menubar.tsx: menu bar wrapper
- client/src/components/ui/navigation-menu.tsx: navigation menu wrapper
- client/src/components/ui/pagination.tsx: pagination wrapper
- client/src/components/ui/popover.tsx: popover wrapper
- client/src/components/ui/progress.tsx: progress wrapper
- client/src/components/ui/radio-group.tsx: radio-group wrapper
- client/src/components/ui/resizable.tsx: resizable panel wrapper
- client/src/components/ui/scroll-area.tsx: scroll area wrapper
- client/src/components/ui/select.tsx: select wrapper
- client/src/components/ui/separator.tsx: separator wrapper
- client/src/components/ui/sheet.tsx: sheet wrapper
- client/src/components/ui/sidebar.tsx: sidebar primitive and provider
- client/src/components/ui/skeleton.tsx: skeleton loading wrapper
- client/src/components/ui/slider.tsx: slider wrapper
- client/src/components/ui/switch.tsx: switch wrapper
- client/src/components/ui/table.tsx: table wrapper
- client/src/components/ui/tabs.tsx: tabs wrapper
- client/src/components/ui/textarea.tsx: textarea wrapper
- client/src/components/ui/toast.tsx: toast primitive wrapper
- client/src/components/ui/toaster.tsx: global toast renderer (includes internal-error animated variant)
- client/src/components/ui/toggle-group.tsx: toggle group wrapper
- client/src/components/ui/toggle.tsx: toggle wrapper
- client/src/components/ui/tooltip.tsx: tooltip wrapper

### 17.11 client/src/pages

- client/src/pages/not-found.tsx: 404 fallback page

### 17.12 client/src/pages/auth

- client/src/pages/auth/Login.tsx: login view with forgot-password modal and redirect logic
- client/src/pages/auth/Signup.tsx: signup view with account type and ID-card flow

### 17.13 client/src/pages/admin

- client/src/pages/admin/Audit.tsx: audit log interface
- client/src/pages/admin/Dashboard.tsx: admin dashboard and metrics
- client/src/pages/admin/Documents.tsx: admin documents page with controls
- client/src/pages/admin/PendingApprovals.tsx: pending account approvals page
- client/src/pages/admin/Upload.tsx: upload form and submission workflow
- client/src/pages/admin/Users.tsx: user management CRUD and status actions

### 17.14 client/src/pages/lecturer

- client/src/pages/lecturer/Dashboard.tsx: lecturer dashboard

### 17.15 client/src/pages/student

- client/src/pages/student/Dashboard.tsx: student dashboard
- client/src/pages/student/Documents.tsx: student document browsing page

### 17.16 server

- server/index.ts: express app bootstrap, middleware, CORS, startup
- server/mock-db.ts: optional mock db utilities
- server/mock-storage.ts: optional mock storage implementation
- server/routes.ts: full API route handlers and business logic
- server/static.ts: static build serving for production
- server/storage.ts: storage abstraction and Supabase-backed implementation
- server/supabase-client.ts: Supabase clients and auth cookie helpers
- server/vite.ts: Vite middleware integration for development

### 17.17 server/config

- server/config/env.ts: env schema parsing and typed exports

### 17.18 shared

- shared/routes.ts: shared API contract declarations and typed route helpers
- shared/schema.ts: shared domain schemas and inferred TypeScript types

### 17.19 script

- script/build.ts: combined build orchestration for client and server outputs

### 17.20 supabase/migrations

- supabase/migrations/0001_initial.sql: base relational schema setup
- supabase/migrations/0002_policies.sql: RLS/policy setup

## 18. How to Use This README for Final Year Project Chapters

The sections above can be mapped directly into academic chapters.

### Chapter 1 (Introduction)

Use:

- Section 1 (Project Summary)
- Section 2 (Problem Context)
- Section 3 (Goals and Objectives)
- Section 4 (Scope)

### Chapter 2 (Literature Review)

Use this project context to compare:

- digital archive systems
- role-based document management platforms
- cloud-native authentication approaches
- audit/compliance logging in information systems

### Chapter 3 (Methodology and System Design)

Use:

- Section 5 (Architecture)
- Section 7 (Technology Stack)
- Section 8 (Data Model)
- Section 9 (API Surface)
- Section 17 (file-level implementation map)

### Chapter 4 (Implementation and Results)

Use:

- Sections 6, 11, 12, 16, and 17
- Include screenshots for each role dashboard and key workflows
- Include deployment observations and hosted behavior

### Chapter 5 (Conclusion and Recommendations)

Use:

- Section 14 (Limitations)
- Section 15 (Future Improvements)
- practical lessons from deployment and cross-origin auth integration

## 19. Suggested Evidence to Capture for Academic Submission

- Login, signup, and approval flow screenshots
- Admin dashboard metrics screenshots
- Document approval lifecycle screenshots
- Audit log entries screenshots
- Deployment screenshots (frontend + backend)
- API test samples (request/response)
- ER-style table relationship diagram from schema

## 20. Maintainer Notes

- Prefer shared contract updates in shared/routes.ts and shared/schema.ts first, then implement server/client changes
- Keep env schema in server/config/env.ts synchronized with .env.example
- Keep VITE_API_BASE_URL configured for split hosting setups
- Rotate secrets immediately if exposed

## 21. License and Ownership

This repository is currently marked with MIT license in package metadata. Confirm institutional ownership and supervision requirements before final submission or public release.
