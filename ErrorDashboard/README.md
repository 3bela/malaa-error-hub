# Error Dashboard — Customer Care

A lightweight, zero-dependency internal web application designed for Customer Care teams to quickly search application error codes or browse errors by service section, understand diagnostic triggers and meanings, view user-facing Arabic and English messages, and reference or edit recommended care actions.

## Main Navigation & Features

- **Home Page**:
  - Search by full error code (`AUTH_018`, `BANK_011`, `CST_011`), partial code (`AUTH`), or number only (`018`).
  - Live search suggestions dropdown as you type.
  - Multiple match disambiguation when multiple errors share a number (e.g. `011` matches `BANK_011`, `CST_011`, `OMN_011`, and `ST_011`).
  - **Recently Viewed**: Compact, clean error-code chips (e.g. `AUTH_018`, `BANK_011`).
  - **Saved Errors**: Compact, clean error-code chips with instant local persistence.
  - **Quick Access**: Error-code chips for rapid lookup (`AUTH_018`, `BANK_011`, `CST_011`, `INV_026`, `PAY_000`).
- **All Errors Page**:
  - Complete error catalog displayed in an easy-to-scan 5-column table (`Error Code`, `Meaning`, `Trigger`, `Customer Care Action`, `Save`).
  - **Full Customer Care Action Text**: Displayed completely without truncation.
  - **Inline Save Error Action**: Save or remove errors directly from the table (`☆ Save Error` $\leftrightarrow$ `★ Saved`) without opening Error Details.
  - **8 Approved Service Sections** navigation with dynamic error count calculation:
    - **All**
    - **Auth Service**
    - **Banks**
    - **Custodian**
    - **Investment**
    - **Omnibus**
    - **Payment Gateway**
    - **MyMalaa**
    - **Lending**
  - **Multi-Field Table Search**: Real-time filtering across Error Code, Number, Meaning, Trigger, Arabic Error Message, English Error Message, and Customer Care Action.
  - Standardized Back navigation (`← Back to Errors`).
- **Error Details Page**:
  - **User-Facing Information** (Read-Only): Arabic error message (`dir="rtl"`, Cairo font) and English message.
  - **Customer Care Information** (Editable): Meaning, Trigger, and Customer Care Action with supporting text.
  - Edit Information / Save Changes / Cancel controls with instant local browser persistence.
- **Pure Client-Side Static Architecture**:
  - 100% self-contained in `index.html`, `style.css`, and `app.js`.
  - Zero external frameworks, zero remote database overhead, instant local loading.
  - Priority has been completely removed.

---

## Live Deployment & GitHub Pages

This repository is ready for instant static deployment on **GitHub Pages**, **Vercel**, **Netlify**, or any internal web server.

### Deploying to GitHub Pages:
1. Create a new repository on GitHub (e.g. `error-dashboard`).
2. Upload the project files:
   - `index.html`
   - `style.css`
   - `app.js`
   - `README.md`
3. Go to **Settings** → **Pages**.
4. Under **Branch**, select `main` (or `master`) and folder `/ (root)`.
5. Click **Save**. Your site will be live at:
   `https://<your-username>.github.io/error-dashboard/`

---

## Baseline Error Dataset

| Error Code | Section | Meaning | Trigger | Customer Care Action |
|---|---|---|---|---|
| `AUTH_009` | Auth Service | The entered phone number is not valid | User enters an invalid phone number | Ask the user to check the phone number and try again. |
| `AUTH_013` | Auth Service | The verification code entered is incorrect | User enters an incorrect OTP | Ask the user to check the OTP and try again. |
| `AUTH_018` | Auth Service | The verification code is no longer valid | The OTP has expired | Ask the user to request a new OTP. |
| `AUTH_046` | Auth Service | The entered PIN is incorrect | User enters an incorrect PIN | Ask the user to try the PIN again. |
| `BANK_011` | Banks | The application could not establish a connection with the user's bank. | App attempts bank connection but fails or times out. | Ask user to wait a few minutes and retry; confirm bank and escalate if needed. |
| `CST_011` | Custodian | The requested action cannot be completed because the current transaction or withdrawal status does not allow it. | User attempts withdrawal/transaction while current status is not eligible. | Ask user to retry; check status and escalate if necessary. |
| `INV_026` | Investment | The requested withdrawal amount is not available for withdrawal. | User attempts to withdraw amount greater than withdrawable balance. | Ask user to check available withdrawable amount and retry within limit. |
| `INV_018` | Investment | The user's identity verification cannot continue because some required KYC information is missing or incomplete. | User reaches identity verification with incomplete details. | Ask user to return to identity verification page and complete missing details. |
| `OMN_011` | Omnibus | The payment could not be completed successfully. | Payment attempt is submitted but fails during processing. | Ask user to retry payment; confirm details and escalate if needed. |
| `PAY_000` | Payment Gateway | The payment amount does not match expected amount. | Amount received/processed does not match expected amount. | Ask user to retry; capture details and escalate mismatch. |
| `ST_011` | *Pending Confirmation* | The requested action cannot be performed in current status. | Withdrawal attempted while status prevents it. | Ask user to retry; check status and escalate for investigation. |
| `PFM_004` | *Pending Confirmation* | A category or subcategory already exists with same name. | Attempt to create/rename category to existing name. | Ask user to choose different name and try again. |

---

## Local Testing

Double-click `index.html` to open directly in any web browser.
