# Malaa Error Hub — Dual-Role MVP

A responsive, zero-dependency internal web platform designed for fintech operational error governance. It demonstrates two distinct role-based perspectives using a unified, immutable bilingual error dataset:

1. **Product POV**: Review AI-extracted errors, correct Arabic and English user copy, validate operational triggers, complete Customer Support actions, approve records, and export CSVs for Engineering.
2. **Customer Support POV**: Search and browse approved errors, reference verified triggers, and follow step-by-step resolution actions without internal product clutter.

---

## Key Features & Architecture

### 1. Role Selection & Persistent Switcher
- **POV Entry Landing Page**: Two large interactive cards directing users to their respective operational workspace.
- **Header Switcher**: Persistent role toggle in the header allowing instantaneous context switching without page reload.
- Role preferences and state are maintained in `localStorage`.

### 2. Product POV Experience
- **Product Home**: 8 KPI summary cards tracking Total Extracted, Not Reviewed, In Review, Needs Clarification, Approved, AR Changes, EN Changes, and Ready for Export.
- **Review Queue**:
  - Dense table with checkboxes, code, service domain, original AR/EN previews, changed fields badges, review status, and last edited dates.
  - Multi-field search across code, number, original/corrected copy, triggers, meaning, and care action.
  - Granular filters by Service Domain (8 approved domains), Review Status (4 states), and Changed-Field type (`AR Message`, `EN Message`, `Trigger`, `Meaning`, `Action`).
  - Bulk actions for batch status transitions.
- **All Errors Catalog**: Complete sortable table browser.
- **Focused Error Review**:
  - Side-by-side **Arabic Message Comparison**: Original immutable Arabic (`dir="rtl"`) vs. Corrected editable Arabic (`dir="rtl"`) with diff highlights and "Reset to Original" button.
  - Side-by-side **English Message Comparison**: Original immutable English (`dir="ltr"`) vs. Corrected editable English (`dir="ltr"`) with diff highlights and "Reset to Original" button.
  - **Operational Information**: AI-Suggested Trigger (read-only), Approved Trigger (editable), Meaning (editable), Customer Support Action (editable).
  - **Approval Validation**: Blocks approval if any required field is missing.
  - Actions: *Save Draft*, *Needs Clarification*, *Approve Error*, *Reset Unsaved Changes*, *Next/Previous Navigation*.
- **Engineering Export**:
  - Previews Approved errors only (excludes draft/unreviewed/clarification by default).
  - Real CSV download with exact 14 columns in required schema.

### 3. Customer Support POV Experience
- **Customer Support Home**: Prominent error search with live dropdown suggestions, total approved count, Recently Viewed chips, Saved Errors chips, and Browse by Service sections.
- **Approved Catalog**: Read-only table showing **approved records only** with full untruncated Customer Support Action text and inline bookmarking.
- **Error Details**: Read-only display of approved Arabic/English messages, meaning, trigger, and highlighted care instructions with zero leak of internal notes or original copy diffs.
- **Saved Errors & Recently Viewed**: Instant filtering and bookmark management.

---

## 8 Approved Service Domains

1. **Auth Service**
2. **Banks**
3. **Custodian**
4. **Investment**
5. **Omnibus**
6. **Payment Gateway**
7. **Malaa**
8. **Lending**

---

## Exact Engineering CSV Schema

The exported CSV generated in browser adheres strictly to this column order:
1. `Error Code`
2. `Service`
3. `Source Reference`
4. `Original AR Message`
5. `Corrected AR Message`
6. `Original EN Message`
7. `Corrected EN Message`
8. `AI-Suggested Trigger`
9. `Approved Trigger`
10. `Meaning`
11. `Customer Support Action`
12. `Review Status`
13. `Changed Fields`
14. `Last Edited`

*(Includes UTF-8 BOM `\uFEFF` for flawless Arabic text rendering in Microsoft Excel).*

---

## Running the Application Locally

### Option 1: Direct in Browser
Simply double-click [`index.html`](file:///C:/Users/Product%20Intern/.gemini/antigravity/scratch/malaa-error-hub/index.html) to open in Chrome, Edge, Safari, or Firefox.

### Option 2: Local PowerShell Server
Run:
```powershell
powershell -ExecutionPolicy Bypass -File run_server.ps1
```
Navigate to `http://localhost:8080/`.

---

## Automated Verification Suite

Run the PowerShell test suite to verify data models, immutability, approval validation, and CSV formatting:
```powershell
powershell -ExecutionPolicy Bypass -File verify_suite.ps1
```
