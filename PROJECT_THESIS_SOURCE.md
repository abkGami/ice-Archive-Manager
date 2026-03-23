# PROJECT THESIS SOURCE

## ICT Department E-Archive Management System

This document is a chapter-ready source pack you can feed into an AI writing assistant to generate your final year project report (Chapter 1 to Chapter 5).

Use this document as:
- an academic narrative base
- a structured implementation reference
- a methodology and analysis source
- a prompt-ready data pack for AI chapter generation

---

## How To Use This File With AI

1. Copy one chapter section at a time.
2. Add your institution details (department, school, supervisor, session).
3. Ask AI to convert to your required academic style (APA/IEEE/MLA).
4. Add citations from real journal articles before final submission.
5. Edit generated text to match your actual results and screenshots.

Recommended prompt when using AI:

"Using the chapter source below, write a formal final-year project chapter in clear academic English. Keep the content faithful to provided implementation details, do not invent tools or features, and include logical transitions, headings, and scholarly tone."

---

## A. Project Identity Block (Fill This First)

- Project Title: ICT Department E-Archive Management System
- Student Name: [YOUR NAME]
- Matric Number: [YOUR MATRIC NUMBER]
- Department: [YOUR DEPARTMENT]
- Faculty/School: [YOUR FACULTY]
- Institution: [YOUR INSTITUTION]
- Supervisor: [SUPERVISOR NAME]
- Academic Session: [E.G., 2025/2026]
- Project Type: Final Year Undergraduate Project
- Domain: Web-Based Information Management System / Educational Technology

---

## B. Abstract Source (Draft Base)

The ICT Department E-Archive Management System is a web-based, role-driven platform designed to digitize the storage, approval, retrieval, and management of departmental documents in an academic environment. Traditional document handling methods in many institutions rely on fragmented physical filing, inconsistent email chains, and ad-hoc sharing channels, resulting in poor accessibility, weak accountability, and high retrieval latency. This project addresses these limitations by implementing a centralized archive system with role-based access control for administrators, lecturers, and students.

The system was built using React and TypeScript for the frontend, Express and TypeScript for the backend, and Supabase for authentication, storage, and data persistence. Key features include user onboarding with administrative approval, secure login and session management, document upload workflows, document approval pipelines, access visibility controls, dashboard analytics, and audit logging. The design emphasizes maintainability through shared typed API contracts and schema validation.

The implementation supports deployment in modern split-hosting architecture, where frontend and backend can run on separate cloud platforms while maintaining secure cookie-based sessions and controlled CORS settings. The result is a practical and scalable departmental solution that improves document governance, transparency, and operational efficiency. The project demonstrates the feasibility and institutional value of role-aware digital archive systems in higher education.

Keywords: E-Archive, Role-Based Access Control, Document Management, Academic Information System, Supabase, React, Express.

---

## C. Chapter 1 Source (Introduction)

### 1.1 Background of the Study

Information is a strategic asset in educational institutions, and the efficiency of academic administration depends heavily on how institutional records are managed. In many departments, especially in developing digital environments, critical documents such as lecture notes, departmental circulars, administrative memos, policy documents, student-facing records, and audit traces are still managed through manual or semi-manual approaches. These approaches often include physical file storage, peer-to-peer sharing through instant messaging platforms, and unstructured email distribution.

Such methods introduce recurring challenges: records become difficult to retrieve, accountability is unclear, access control is weak, and document version consistency is difficult to enforce. As departmental activities scale, these weaknesses become operational bottlenecks and can undermine service delivery, compliance, and continuity.

This study presents the design and implementation of the ICT Department E-Archive Management System, a role-based digital platform created to centralize document operations. The system is intended to provide structured document lifecycle management from creation to approval to controlled access, while preserving traceability through audit logs.

### 1.2 Statement of the Problem

The core problems addressed by this project are:
- Document fragmentation across multiple unofficial channels.
- Absence of a controlled and transparent approval workflow.
- Limited role-based access enforcement for sensitive records.
- Slow document discovery and retrieval processes.
- Poor accountability due to missing audit trails.
- Inconsistent onboarding and activation process for users.

### 1.3 Aim and Objectives of the Study

#### Aim
To develop a robust, role-based web application for centralized document archive management in an academic department.

#### Objectives
- To design a centralized repository for departmental documents.
- To implement secure authentication and session management.
- To enforce role-based access for administrators, lecturers, and students.
- To provide a document approval workflow for governance.
- To implement user registration and administrative approval processes.
- To provide downloadable and viewable file access through secure links.
- To implement audit logging for key system activities.
- To deliver dashboard analytics for operational visibility.

### 1.4 Research Questions

- How can a role-based e-archive platform improve document governance in a department?
- What architecture supports secure and scalable academic document workflows?
- How can approval pipelines and audit logs improve accountability?
- What practical deployment model enables reliable access in real-world institutional settings?

### 1.5 Significance of the Study

The study is significant to:
- Departmental administrators: through improved control, transparency, and faster decision support.
- Lecturers/staff: through streamlined upload and retrieval workflows.
- Students: through consistent access to approved academic materials.
- Institutions: through improved compliance posture and archival governance.
- Researchers/developers: as a reproducible implementation of role-aware educational information systems.

### 1.6 Scope of the Study

#### Covered Scope
- Multi-role authentication and authorization.
- User onboarding and admin approval.
- Document upload, update, approval, view, download, and deletion.
- Audit logging and role-specific dashboards.
- Web deployment architecture (frontend and backend cloud hosting).

#### Delimitations
- No native mobile app.
- No OCR or full-text semantic search.
- No advanced document version branching.
- Forgot-password currently informational rather than automated reset.

### 1.7 Definition of Terms

- E-Archive: A digital system for structured record storage and retrieval.
- RBAC: Role-Based Access Control, where permissions depend on user role.
- Audit Log: Chronological record of user/system actions.
- Signed URL: Time-limited secure URL to private storage files.
- Session Cookie: Browser cookie used for maintaining authenticated user state.

---

## D. Chapter 2 Source (Literature Review)

### 2.1 Conceptual Review

This project intersects the following conceptual areas:
- Document Management Systems (DMS)
- Role-Based Access Control in web systems
- Educational information management platforms
- Cloud-based authentication and storage
- Data governance and auditability

### 2.2 Document Management in Academic Environments

Academic departments generate high-frequency, multi-format records. Effective document management must support:
- indexing and categorization
- reliable access controls
- status and approval workflows
- lifecycle traceability

Without these, institutions face delays, duplication, and governance risks.

### 2.3 Role-Based Access Control (RBAC)

RBAC is a proven model in enterprise and educational systems for reducing unauthorized access and simplifying permission administration. In this project, three core roles are implemented:
- Administrator: full management and approval authority.
- Lecturer: content contribution and controlled management of own uploads.
- Student: constrained read access to approved and allowed documents.

### 2.4 Workflow Governance and Audit Trails

Approval gates prevent the publication of unverified records. Audit logging supports:
- accountability
- incident tracing
- institutional compliance
- process transparency

### 2.5 Cloud-Native Academic Systems

Cloud-backed systems offer:
- better availability
- easier deployment and updates
- centralized storage and access
- reduced infrastructure overhead

This project leverages cloud services (Supabase + hosted frontend/backend) to realize these benefits.

### 2.6 Theoretical Framework (Suggested)

You can frame this project with:
- Information Systems Success Model (quality, use, user satisfaction)
- Access Control Theory (least privilege, role assignment)
- Socio-Technical Systems perspective (people + process + technology)

### 2.7 Empirical Review Guidance

For your final draft, include 8-20 relevant sources on:
- digital archives in higher institutions
- web-based DMS implementation studies
- RBAC effectiveness studies
- cloud adoption in educational systems

Then identify the gap your project closes:
- practical, deployable departmental-level archive with approval and audit features.

### 2.8 Summary of Literature Gap

Existing studies often discuss conceptual models but provide limited end-to-end implementation detail in a department-specific context. This project contributes a concrete, role-aware, cloud-deployed implementation with typed contracts, auditability, and production-minded architecture.

---

## E. Chapter 3 Source (Methodology and System Design)

### 3.1 Research Design

This work follows a design-and-implementation methodology (applied software engineering research), focused on translating domain problems into a functional software artifact and validating it through implementation outcomes.

### 3.2 Requirements Elicitation Summary

Functional requirements implemented:
- User signup/login/logout
- Role-based route protection
- Admin user approval workflow
- Document upload and metadata capture
- Document approval and status transitions
- Controlled access to files
- Audit logging and dashboard stats

Non-functional requirements addressed:
- Security (role checks, cookie auth, env-based secrets)
- Maintainability (shared schemas/contracts)
- Usability (modals, loaders, toasts, clear flows)
- Deployability (split-hosting support)

### 3.3 System Architecture

#### Frontend Layer
- React + TypeScript SPA
- Wouter-based routing
- TanStack Query for server-state
- Tailwind + Radix UI component system

#### Backend Layer
- Express + TypeScript API server
- Route handlers for auth, documents, users, logs, stats
- Middleware for JSON parsing, cookie parsing, CORS, error handling

#### Data and Storage Layer
- Supabase Postgres for entity persistence
- Supabase Auth for identity/session operations
- Supabase Storage for file objects

### 3.4 Design Decisions

- Shared API contracts in shared/routes.ts for consistency.
- Shared schema validation in shared/schema.ts via Zod.
- Storage abstraction in server/storage.ts for cleaner data access.
- Role checks enforced at backend route level (authoritative gate).
- Signed URLs used for secure file access.
- Frontend absolute API URL helper supports same-origin and split deployments.

### 3.5 Security Model

- Role-based access checks per endpoint.
- HttpOnly authentication cookies.
- CORS allowlist for cross-origin requests.
- Cookie SameSite policy configurable for deployment scenarios.
- Input validation before business logic execution.

### 3.6 Database Design Summary

Core tables:
- users
- documents
- audit_logs

Relational behavior:
- documents linked to uploader users
- audit logs linked to acting users and optional documents

Policy layer:
- RLS/policy migration file provided in supabase/migrations/0002_policies.sql

### 3.7 Implementation Tools

- Frontend: React, TypeScript, Vite, Tailwind, Radix
- Backend: Express, TypeScript, Zod
- Data/Auth/Storage: Supabase
- Build: esbuild + tsx

### 3.8 Deployment Method

Observed practical deployment model:
- Frontend hosted on Vercel
- Backend hosted on Render
- Cross-domain auth resolved via CORS and cookie policies

### 3.9 Validation Approach

- Type-level validation: npm run check
- Runtime validation: Zod request/response parsing
- Feature-level verification through end-user flow tests

---

## F. Chapter 4 Source (Implementation, Testing, and Results)

### 4.1 Implementation Overview

The system was implemented as a full-stack web application with a shared contract model. Frontend modules consume typed endpoint contracts while backend route handlers enforce domain rules and permissions.

### 4.2 Implemented Modules

#### Authentication Module
- Login and logout endpoints
- Session check endpoint
- Signup flow with pending approval
- Modal-based forgot password guidance

#### User Administration Module
- User list and management interface
- Pending user approval page
- ID card preview workflow
- Account status updates and deletion controls

#### Document Module
- Upload interface and metadata capture
- List and detail view (drawer)
- Approval flow for pending documents
- Signed URL generation for view/download

#### Audit and Analytics Module
- Audit log retrieval endpoint and admin view
- Stats endpoints for each role dashboard

### 4.3 UI/UX Outcomes

- Sign out confirmation modal prevents accidental logout.
- Forgot-password modal provides clear recovery path.
- Internal server error toast transformed into user-friendly animated feedback.
- Consistent loading states improve perceived responsiveness.

### 4.4 Testing Notes

Functional flow tests performed:
- login and redirect by role
- signup and pending approval behavior
- document upload and approval
- view/download access control
- user management actions
- signout confirmation behavior

Build and type checks:
- npm run check passed after feature changes.

### 4.5 Deployment Outcome

Key outcomes from deployment process:
- Split-hosting architecture successfully configured.
- API base URL externalization resolved frontend-backend decoupling.
- Render build issue (tsx not found) diagnosed and fixed via dev dependency install strategy.
- Cross-origin session behavior stabilized through CORS and cookie policy settings.

### 4.6 Performance and Reliability Observations

- Adequate responsiveness for departmental scale operations.
- Contract-driven validation reduced runtime mismatch errors.
- Cloud storage and signed URLs simplified secure file operations.

### 4.7 Result Discussion

The implemented system achieved its core objective of creating a practical departmental e-archive platform with governance-friendly workflows. Compared with unmanaged document sharing, the system introduces structure, control, and accountability while remaining operationally feasible in a cloud-hosted educational environment.

---

## G. Chapter 5 Source (Conclusion and Recommendations)

### 5.1 Conclusion

This project successfully designed and implemented a role-based ICT Department E-Archive Management System that addresses major limitations of traditional departmental document handling. The system centralizes records, enforces access control, supports approval workflows, and improves accountability through audit logs.

The implementation demonstrates that modern web technologies, combined with cloud-based authentication and storage services, can deliver scalable and maintainable information systems suitable for real institutional use.

### 5.2 Contributions

- Practical full-stack implementation of a departmental archive system.
- End-to-end role-based workflows for users and documents.
- Typed contract architecture reducing integration errors.
- Deployment-ready architecture for split hosting.
- Improved user experience through focused interaction patterns and error messaging.

### 5.3 Limitations

- No built-in automated password reset flow yet.
- Limited advanced search and indexing features.
- No native mobile application.
- No deep analytics/report exports beyond current dashboard scope.

### 5.4 Recommendations

- Implement full password reset pipeline (email/token-based).
- Add document version history and rollback.
- Add full-text and semantic search support.
- Introduce automated testing suite (unit/integration/e2e).
- Add exportable reports for compliance and departmental review.
- Extend to multi-department/multi-tenant architecture.

### 5.5 Future Work

Future research and development can explore:
- AI-assisted document classification and tagging.
- Role-adaptive recommendation of relevant documents.
- Workflow notifications (email/SMS/in-app).
- Access anomaly detection using audit log patterns.

---

## H. Prompt Pack For AI Chapter Generation

### Prompt 1: Chapter 1 Generator

"Using the Chapter 1 source below, write a complete Chapter One for a final year project report. Include: background, problem statement, aim and objectives, research questions, significance, scope, and definition of terms. Use formal academic style and avoid fabricated implementation details."

### Prompt 2: Chapter 2 Generator

"Using the Chapter 2 source below, write a complete literature review chapter. Include conceptual review, theoretical framework, empirical review guidance, research gap, and chapter summary. Keep placeholders where external citations are required."

### Prompt 3: Chapter 3 Generator

"Using the Chapter 3 source below, write a complete methodology and system design chapter. Include architecture, tools, database design, security model, deployment method, and validation approach. Keep explanation technically accurate and institution-friendly."

### Prompt 4: Chapter 4 Generator

"Using the Chapter 4 source below, write implementation and results chapter with module-by-module narrative, test outcomes, deployment experience, and technical discussion. Keep it aligned with provided features and flows only."

### Prompt 5: Chapter 5 Generator

"Using the Chapter 5 source below, write conclusion and recommendations chapter with key findings, limitations, recommendations, and future work. Ensure coherence with earlier chapters."

### Prompt 6: Full Report Assembler

"Combine the generated Chapters 1 to 5 into a coherent final-year report draft. Maintain consistent terminology and avoid contradictions. Create smooth transitions between chapters and keep all claims grounded in the provided source content."

---

## I. Supervisor-Defense Quick Notes (Optional)

Use this section to prepare for oral defense:

- Why this project matters: solves real departmental record management inefficiencies.
- Why these technologies: strong developer productivity + cloud readiness.
- Security strategy: role checks + cookie sessions + CORS control + validated inputs.
- What is unique: deployment-backed practical implementation with approval and audit workflows.
- What you would improve next: password reset, automated tests, better search, analytics exports.

---

## J. Appendix Pointers

For your final submission package, append:
- API screenshots / Postman collection
- database table screenshots from Supabase
- key UI screenshots by role
- deployment screenshots (Render/Vercel)
- selected code snippets from critical modules

---

## K. Final Editing Checklist Before Submission

- Replace all placeholders in Section A.
- Add real literature citations in Chapter 2.
- Insert your own screenshots in Chapter 4.
- Ensure chapter numbering matches your department format.
- Ensure citation style matches your departmental requirement.
- Run plagiarism and grammar checks on final text.
