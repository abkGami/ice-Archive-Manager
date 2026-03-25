# ICE Archive Manager - System Flowcharts 🔄

Visual representation of critical system flows for authentication, authorization, document access, and downloads.

---

## Table of Contents

1. [Authentication Flow](#1-authentication-flow)
2. [Authorization Flow](#2-authorization-flow)
3. [Document Access Flow](#3-document-access-flow)
4. [Document Download Flow](#4-document-download-flow)
5. [User Registration Flow](#5-user-registration-flow-bonus)
6. [Document Upload Flow](#6-document-upload-flow-bonus)

---

## 1. Authentication Flow

### Overview

This flow shows how users authenticate with the system, from initial page load to successful login.

### Key Points

- **Session persistence** via HTTP-only cookies
- **Automatic token refresh** when access token expires
- **Case-insensitive** unique ID matching
- **Account status validation** before authentication
- **Audit logging** for security tracking

### Flowchart

```mermaid
flowchart TD
    Start([User Opens App]) --> CheckSession{Session Valid?}

    CheckSession -->|Yes| LoadUser[Load User from Cache]
    CheckSession -->|No| RedirectLogin[Redirect to /login]

    LoadUser --> ValidateSession{Validate with Server}
    ValidateSession -->|Valid| Dashboard[Show Dashboard]
    ValidateSession -->|Expired| RefreshToken{Has Refresh Token?}

    RefreshToken -->|Yes| GetNewToken[Get New Access Token]
    RefreshToken -->|No| RedirectLogin

    GetNewToken --> Dashboard

    RedirectLogin --> LoginForm[Show Login Form]
    LoginForm --> EnterCreds[User Enters Credentials]
    EnterCreds --> NormalizeID[Normalize Unique ID]

    NormalizeID --> DBLookup{User Exists in DB?}
    DBLookup -->|No| ShowError1[Show: Invalid Credentials]
    DBLookup -->|Yes| CheckStatus{Account Active?}

    CheckStatus -->|Pending| ShowError2[Show: Pending Approval]
    CheckStatus -->|Inactive| ShowError3[Show: Account Inactive]
    CheckStatus -->|Active| SupabaseAuth[Authenticate with Supabase]

    SupabaseAuth --> ValidatePassword{Password Correct?}
    ValidatePassword -->|No| ShowError4[Show: Invalid Credentials]
    ValidatePassword -->|Yes| GenerateTokens[Generate JWT Tokens]

    GenerateTokens --> SetCookies[Set HTTP-Only Cookies]
    SetCookies --> SaveToCache[Save User to LocalStorage]
    SaveToCache --> AuditLog[Create Login Audit Log]
    AuditLog --> RedirectDashboard[Redirect to Dashboard]

    RedirectDashboard --> Dashboard
    Dashboard --> End([Authenticated Session])

    ShowError1 --> LoginForm
    ShowError2 --> LoginForm
    ShowError3 --> LoginForm
    ShowError4 --> LoginForm

    style Start fill:#e1f5e1
    style End fill:#e1f5e1
    style Dashboard fill:#cfe2ff
    style ShowError1 fill:#ffe1e1
    style ShowError2 fill:#ffe1e1
    style ShowError3 fill:#ffe1e1
    style ShowError4 fill:#ffe1e1
```

### Technical Details

| Step             | Technology                 | Time                |
| ---------------- | -------------------------- | ------------------- |
| Session check    | React Query + localStorage | ~5ms                |
| Token validation | Supabase Auth SDK          | ~100ms              |
| Password hashing | bcrypt (cost 10-12)        | ~1-2s               |
| Cookie setting   | Express cookie-parser      | ~1ms                |
| Audit logging    | Supabase insert (async)    | ~0ms (non-blocking) |

---

## 2. Authorization Flow

### Overview

This flow demonstrates how the system validates user permissions for protected resources and actions.

### Key Points

- **JWT token validation** on every request
- **Automatic token refresh** mechanism
- **Role-based access control** (Administrator, Lecturer, Student)
- **Resource-level permissions** checking
- **Comprehensive audit trail** logging

### Flowchart

```mermaid
flowchart TD
    Start([User Accesses Route]) --> ExtractCookies[Extract Access Token from Cookie]

    ExtractCookies --> HasToken{Token Exists?}
    HasToken -->|No| CheckRefresh{Has Refresh Token?}
    HasToken -->|Yes| ValidateToken[Validate JWT Token]

    ValidateToken --> TokenValid{Token Valid?}
    TokenValid -->|No| CheckRefresh
    TokenValid -->|Yes| GetUser[Get User from Database]

    CheckRefresh -->|No| Unauthorized[Return 401 Unauthorized]
    CheckRefresh -->|Yes| RefreshSession[Refresh Access Token]
    RefreshSession --> RefreshSuccess{Refresh Success?}

    RefreshSuccess -->|No| Unauthorized
    RefreshSuccess -->|Yes| SetNewCookie[Set New Access Token Cookie]
    SetNewCookie --> GetUser

    GetUser --> UserExists{User Found?}
    UserExists -->|No| Unauthorized
    UserExists -->|Yes| CheckRole{Check Required Role}

    CheckRole --> HasRole{User Has Role?}
    HasRole -->|No| Forbidden[Return 403 Forbidden]
    HasRole -->|Yes| CheckPermission{Check Resource Permission}

    CheckPermission --> HasPermission{Has Permission?}
    HasPermission -->|No| Forbidden
    HasPermission -->|Yes| GrantAccess[Grant Access]

    GrantAccess --> ExecuteAction[Execute Requested Action]
    ExecuteAction --> LogAction[Log to Audit Trail]
    LogAction --> ReturnResponse[Return Success Response]

    ReturnResponse --> End([Authorization Complete])
    Unauthorized --> Redirect[Redirect to /login]
    Forbidden --> ShowError[Show: Access Denied]

    Redirect --> End
    ShowError --> End

    style Start fill:#e1f5e1
    style End fill:#e1f5e1
    style GrantAccess fill:#cfe2ff
    style Unauthorized fill:#ffe1e1
    style Forbidden fill:#ffe1e1
```

### Role-Permission Matrix

| Action              | Administrator | Lecturer           | Student                        |
| ------------------- | ------------- | ------------------ | ------------------------------ |
| View All Documents  | ✅            | ✅ (Approved only) | ✅ (Approved + Student Access) |
| Upload Documents    | ✅            | ✅                 | ❌                             |
| Approve Documents   | ✅            | ❌                 | ❌                             |
| Delete Any Document | ✅            | ❌                 | ❌                             |
| Delete Own Document | ✅            | ✅                 | ❌                             |
| Manage Users        | ✅            | ❌                 | ❌                             |
| View Audit Logs     | ✅            | ❌                 | ❌                             |
| Approve Users       | ✅            | ❌                 | ❌                             |

---

## 3. Document Access Flow

### Overview

This flow illustrates how the system determines whether a user can access a specific document based on their role and document settings.

### Key Points

- **Multi-level access control** (role + ownership + document settings)
- **Status-based visibility** (approved vs pending)
- **Granular permissions** (staff-only vs student-accessible)
- **Automatic audit logging** of document views

### Flowchart

```mermaid
flowchart TD
    Start([User Requests Document]) --> AuthCheck{User Authenticated?}

    AuthCheck -->|No| Return401[Return 401: Not Authenticated]
    AuthCheck -->|Yes| GetDoc[Fetch Document from Database]

    GetDoc --> DocExists{Document Exists?}
    DocExists -->|No| Return404[Return 404: Not Found]
    DocExists -->|Yes| GetRole[Get User Role]

    GetRole --> CheckRole{What is User Role?}

    CheckRole -->|Administrator| GrantAccess[Grant Full Access]
    CheckRole -->|Lecturer| CheckOwnership{Is Document Owner?}
    CheckRole -->|Student| CheckDocStatus{Document Approved?}

    CheckOwnership -->|Yes| GrantAccess
    CheckOwnership -->|No| CheckApprovalLecturer{Document Approved?}

    CheckApprovalLecturer -->|No| Return403L[Return 403: Access Denied]
    CheckApprovalLecturer -->|Yes| CheckStaffAccess{Staff Access Allowed?}

    CheckStaffAccess -->|No| Return403L
    CheckStaffAccess -->|Yes| GrantAccess

    CheckDocStatus -->|No| Return403S[Return 403: Not Approved]
    CheckDocStatus -->|Yes| CheckStudentAccess{Student Access Allowed?}

    CheckStudentAccess -->|No| Return403S
    CheckStudentAccess -->|Yes| GrantAccess

    GrantAccess --> ReturnDoc[Return Document Metadata]
    ReturnDoc --> LogView[Create View Audit Log]
    LogView --> End([Document Accessed])

    Return401 --> End
    Return404 --> End
    Return403L --> End
    Return403S --> End

    style Start fill:#e1f5e1
    style End fill:#e1f5e1
    style GrantAccess fill:#cfe2ff
    style Return401 fill:#ffe1e1
    style Return404 fill:#ffe1e1
    style Return403L fill:#ffe1e1
    style Return403S fill:#ffe1e1
```

### Access Control Logic

```plaintext
ADMINISTRATOR:
  ├─ Full access to all documents
  └─ No restrictions

LECTURER:
  ├─ Own uploaded documents (any status)
  ├─ Approved documents with staff access enabled
  └─ Cannot access:
      ├─ Pending documents (not owned)
      └─ Documents with staff access disabled

STUDENT:
  ├─ Only approved documents
  ├─ Only documents with student access enabled
  └─ Cannot access:
      ├─ Any pending documents
      ├─ Staff-only documents
      └─ Rejected documents
```

---

## 4. Document Download Flow

### Overview

This flow details the entire process from clicking download to the file being saved on the user's device.

### Key Points

- **Signed URL generation** for secure, time-limited access
- **Automatic file naming** with original filename
- **Browser-native download** (no custom handlers needed)
- **Download activity tracking** in audit logs
- **Error handling** with user-friendly messages

### Flowchart

```mermaid
flowchart TD
    Start([User Clicks Download]) --> GetDocID[Extract Document ID]

    GetDocID --> AuthCheck{User Authenticated?}
    AuthCheck -->|No| ShowLoginPrompt[Show: Please Login]
    AuthCheck -->|Yes| FetchDoc[Fetch Document from DB]

    FetchDoc --> DocExists{Document Exists?}
    DocExists -->|No| ShowError1[Show: Document Not Found]
    DocExists -->|Yes| CheckAccess{User Can Access?}

    CheckAccess -->|No| ShowError2[Show: Access Denied]
    CheckAccess -->|Yes| HasFile{Has File Path?}

    HasFile -->|No| ShowError3[Show: No File Available]
    HasFile -->|Yes| GenerateURL[Generate Signed URL]

    GenerateURL --> SupabaseStorage[Request from Supabase Storage]
    SupabaseStorage --> URLGenerated{URL Generated?}

    URLGenerated -->|No| ShowError4[Show: Unable to Generate URL]
    URLGenerated -->|Yes| CreateAnchor[Create Download Anchor]

    CreateAnchor --> SetDownloadAttr[Set download attribute with filename]
    SetDownloadAttr --> TriggerClick[Trigger automatic click]

    TriggerClick --> BrowserDownload[Browser initiates download]
    BrowserDownload --> LogDownload[Create Download Audit Log]

    LogDownload --> UpdateStats[Update Download Statistics]
    UpdateStats --> ShowSuccess[Show: Download Started]

    ShowSuccess --> End([Download Complete])

    ShowLoginPrompt -->|User Logs In| GetDocID
    ShowLoginPrompt -->|User Cancels| End

    ShowError1 --> End
    ShowError2 --> End
    ShowError3 --> End
    ShowError4 --> End

    style Start fill:#e1f5e1
    style End fill:#e1f5e1
    style ShowSuccess fill:#d4edda
    style BrowserDownload fill:#cfe2ff
    style ShowError1 fill:#ffe1e1
    style ShowError2 fill:#ffe1e1
    style ShowError3 fill:#ffe1e1
    style ShowError4 fill:#ffe1e1
    style ShowLoginPrompt fill:#fff3cd
```

### Signed URL Details

```javascript
// Supabase generates time-limited download URLs
const { data, error } = await supabaseAdmin.storage
  .from('documents')
  .createSignedUrl(filePath, 600); // 10 minutes expiry

// URL format
https://project.supabase.co/storage/v1/object/sign/documents/file.pdf
  ?token=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
  &exp=1234567890
```

### Download Statistics

| Metric                  | Tracked  | Location          |
| ----------------------- | -------- | ----------------- |
| **Download count**      | Yes      | Document metadata |
| **Download timestamp**  | Yes      | Audit logs        |
| **User who downloaded** | Yes      | Audit logs        |
| **IP address**          | Optional | Audit logs        |
| **File size**           | Yes      | Document metadata |

---

## 5. User Registration Flow (Bonus)

### Overview

Step-by-step process for new users to create an account and get approved.

### Flowchart

```mermaid
flowchart TD
    Start([User Visits Signup]) --> FillForm[Fill Registration Form]

    FillForm --> SelectType{Select Account Type}
    SelectType -->|Staff| SetLecturer[Role: Lecturer]
    SelectType -->|Student| SetStudent[Role: Student]

    SetLecturer --> UploadID[Upload ID Card Image]
    SetStudent --> UploadID

    UploadID --> ValidateForm{Form Valid?}
    ValidateForm -->|No| ShowFormErrors[Show Validation Errors]
    ShowFormErrors --> FillForm

    ValidateForm -->|Yes| CheckDuplicate{Unique ID Exists?}
    CheckDuplicate -->|Yes| ShowError[Show: Already Registered]
    CheckDuplicate -->|No| CreateSupabaseAuth[Create Supabase Auth User]

    CreateSupabaseAuth --> AuthSuccess{Auth Created?}
    AuthSuccess -->|No| ShowError2[Show: Unable to Create Account]
    AuthSuccess -->|Yes| UploadIDCard[Upload ID Card to Storage]

    UploadIDCard --> UploadSuccess{Upload Success?}
    UploadSuccess -->|No| DeleteAuth[Delete Auth User]
    DeleteAuth --> ShowError3[Show: Upload Failed]

    UploadSuccess -->|Yes| CreateUserRecord[Create User in Database]
    CreateUserRecord --> SetPending[Set Status: Pending Approval]
    SetPending --> AuditLog[Create Account Created Log]

    AuditLog --> ShowSuccess[Show: Registration Successful]
    ShowSuccess --> Notify[Notify Admin of Pending Approval]
    Notify --> RedirectLogin[Redirect to Login]

    RedirectLogin --> WaitApproval[User Waits for Admin Approval]
    WaitApproval --> End([Registration Complete])

    ShowError --> End
    ShowError2 --> End
    ShowError3 --> End

    style Start fill:#e1f5e1
    style End fill:#e1f5e1
    style ShowSuccess fill:#d4edda
    style ShowError fill:#ffe1e1
    style ShowError2 fill:#ffe1e1
    style ShowError3 fill:#ffe1e1
```

---

## 6. Document Upload Flow (Bonus)

### Overview

Process for lecturers and administrators to upload new documents to the system.

### Flowchart

```mermaid
flowchart TD
    Start([User Navigates to Upload]) --> CheckRole{User Role?}

    CheckRole -->|Student| ShowError1[Show: Access Denied]
    CheckRole -->|Lecturer/Admin| ShowForm[Show Upload Form]

    ShowForm --> FillMetadata[Fill Document Metadata]
    FillMetadata --> SelectFile[Select File to Upload]
    SelectFile --> SetPermissions[Set Access Permissions]

    SetPermissions --> ValidateForm{Form Valid?}
    ValidateForm -->|No| ShowValidationErrors[Show Validation Errors]
    ShowValidationErrors --> FillMetadata

    ValidateForm -->|Yes| ValidateFile{File Valid?}
    ValidateFile -->|No| ShowFileError[Show: Invalid File Type/Size]
    ShowFileError --> SelectFile

    ValidateFile -->|Yes| ConvertToBase64[Convert File to Base64]
    ConvertToBase64 --> SendToServer[Send to Backend API]

    SendToServer --> ServerValidation{Server Validation?}
    ServerValidation -->|No| ShowServerError[Show: Validation Failed]

    ServerValidation -->|Yes| UploadToStorage[Upload to Supabase Storage]
    UploadToStorage --> UploadSuccess{Upload Success?}

    UploadSuccess -->|No| ShowUploadError[Show: Upload Failed]
    UploadSuccess -->|Yes| CreateDBRecord[Create Document Record]

    CreateDBRecord --> SetStatus{Set Document Status}
    SetStatus -->|Auto-Approve| StatusApproved[Status: Approved]
    SetStatus -->|Needs Approval| StatusPending[Status: Pending]

    StatusApproved --> AuditLog[Create Upload Audit Log]
    StatusPending --> AuditLog

    AuditLog --> InvalidateCache[Invalidate Document Cache]
    InvalidateCache --> ShowSuccess[Show:Upload Successful]

    ShowSuccess --> RedirectDocs[Redirect to Documents]
    RedirectDocs --> End([Upload Complete])

    ShowError1 --> End
    ShowServerError --> End
    ShowUploadError --> End

    style Start fill:#e1f5e1
    style End fill:#e1f5e1
    style ShowSuccess fill:#d4edda
    style ShowError1 fill:#ffe1e1
    style ShowServerError fill:#ffe1e1
    style ShowUploadError fill:#ffe1e1
```

---

## Quick Reference

### Color Legend

- 🟢 **Green**: Start/End points
- 🔵 **Blue**: Success states
- 🔴 **Red**: Error states
- 🟡 **Yellow**: Warning/Info states
- ⚪ **White**: Process steps

### Common Patterns

#### Authentication Check

```
User Action → Auth Check → {Authenticated?}
  ├─ No → Redirect to Login
  └─ Yes → Continue
```

#### Permission Check

```
Auth Check → Get User Role → {Has Permission?}
  ├─ No → Return 403 Forbidden
  └─ Yes → Grant Access
```

#### Error Handling

```
Operation → {Success?}
  ├─ No → Show Error → Retry/Cancel
  └─ Yes → Continue → Success
```

---

## Integration Points

### Frontend → Backend

- REST API calls with JWT cookies
- Automatic error handling and retries
- Optimistic updates with React Query

### Backend → Supabase

- SQL queries via Supabase client
- Storage operations for files
- Auth operations for sessions

### Backend → Client

- JSON responses
- HTTP status codes
- Set-Cookie headers for tokens

---

## Performance Metrics

| Operation            | Average Time | Notes                 |
| -------------------- | ------------ | --------------------- |
| **Login**            | 1-2 seconds  | Mostly bcrypt hashing |
| **Token validation** | 50-100ms     | JWT verification      |
| **Document list**    | 100-200ms    | Database query        |
| **File download**    | 200-500ms    | Signed URL generation |
| **Upload (5MB)**     | 2-5 seconds  | Network dependent     |

---

## Error Codes Reference

| Code    | Meaning      | Common Cause             |
| ------- | ------------ | ------------------------ |
| **401** | Unauthorized | Missing/invalid token    |
| **403** | Forbidden    | Insufficient permissions |
| **404** | Not Found    | Resource doesn't exist   |
| **409** | Conflict     | Duplicate unique ID      |
| **500** | Server Error | Internal server issue    |

---

**For more details, see the main [README.md](./README.md)**
