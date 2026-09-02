/**
 * Malaa Error Hub — Main Application Controller (Vanilla JS)
 * Role-Tailored Perspectives: Product POV, Customer Care POV, Engineer POV
 * Zero-dependency, file:// compatible, LocalStorage persistence.
 */

var SERVICES = [
  "Auth Service",
  "Banks",
  "Custodian",
  "Investment",
  "Omnibus",
  "Payment Gateway",
  "Malaa",
  "Lending"
];

var AppState = {
  pov: getStoredPOV(), // "landing" | "product" | "support" | "engineering"
  productTab: "home",  // "home" | "all-errors" | "cs-requests" | "eng-export" | "review"
  supportTab: "home",  // "home" | "all-errors" | "saved" | "track-requests" | "details"
  engineeringTab: "queue", // legacy — unreachable; kept for dead code compatibility
  activeErrorId: null,
  returnTab: "all-errors",
  returnPov: "product",

  // Product Queue Filters (legacy state — kept to avoid breaking queue handler dead code)
  queueSearch: "",
  queueService: "All",
  queueStatus: "All",
  queueSelectedIds: [],

  // Product Error Catalog (All Errors) Filters & Sort
  allErrorsSearch: "",
  allErrorsService: "All",
  allErrorsStatus: "needs_review", // default: show Not Reviewed + In Review
  allErrorsSortField: "errorCode",
  allErrorsSortAsc: true,

  // CS Requests Filter & Selection (Product)
  csRequestsSearch: "",
  csRequestsService: "All",
  csRequestsSelectedIds: [],

  // Tracking Ready Engineering Filter (legacy — kept for dead code compatibility)
  trackReadySearch: "",
  trackReadyService: "All",
  trackReadyStatus: "ready_for_engineering",

  // Customer Care Catalog Filters
  supportSearch: "",
  supportService: "All",
  supportHomeSearch: "",

  // Customer Care Track Requests Search
  supportTrackSearch: "",

  // Support Request Modal State
  csModalErrorId: null,
  csModalRequestedField: "Both Arabic and English Messages",
  csModalComment: "",
  csModalValidationError: "",

  // CS Edit Operational State (in details page)
  csDetailsInitialMeaning: "",
  csDetailsInitialTrigger: "",
  csDetailsInitialAction: "",
  csDetailsMeaning: "",
  csDetailsTrigger: "",
  csDetailsAction: "",

  // Product Response Edit Buffer
  productResponseInput: "",

  // Engineering State (legacy — unreachable; kept for dead code compatibility)
  engSearch: "",
  engService: "All",
  engSelectedIds: [],
  engExportFormat: "csv",
  engModalErrorId: null,

  // Engineering Implemented Errors Filter (legacy)
  engImplSearch: "",
  engImplService: "All",

  // Export Center State (used by Engineering Export in Product nav)
  exportStatus: "ready_for_engineering", // defaults to ready_for_engineering
  exportService: "All",
  exportSearch: "",
  exportFormat: "csv", // "csv" | "md" | "html"
  exportSelectedIds: [],

  // Mark as Approved confirmation modal state (dedicated — do not reuse engModalErrorId)
  approveModalErrorId: null,

  // Product Review Page Buffer
  reviewForm: {
    correctedAr: "",
    correctedEn: "",
    approvedTrigger: "",
    meaning: "",
    supportAction: "",
    validationErrors: []
  },

  toastTimer: null
};

// --- Helper Utilities ---

function escapeHtml(str) {
  if (str === null || str === undefined) return "";
  return String(str)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

function showToast(message, type) {
  if (!type) type = "success";
  if (AppState.toastTimer) clearTimeout(AppState.toastTimer);

  var toastEl = document.getElementById("statusToast");
  if (!toastEl) return;

  toastEl.className = "status-toast " + type;
  toastEl.innerHTML = `
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
      ${type === "success" ? '<polyline points="20 6 9 17 4 12"></polyline>' : (type === "warning" ? '<path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"></path><line x1="12" y1="9" x2="12" y2="13"></line><line x1="12" y1="17" x2="12.01" y2="17"></line>' : '<circle cx="12" cy="12" r="10"></circle><line x1="12" y1="8" x2="12" y2="12"></line><line x1="12" y1="16" x2="12.01" y2="16"></line>')}
    </svg>
    <span>${escapeHtml(message)}</span>
  `;
  toastEl.style.display = "flex";

  AppState.toastTimer = setTimeout(function() {
    toastEl.style.display = "none";
  }, 3500);
}

function formatStatusLabel(status) {
  if (STATUS_CONFIG && STATUS_CONFIG[status]) {
    return STATUS_CONFIG[status].label;
  }
  switch (status) {
    case "not_reviewed": return "Not Reviewed";
    case "in_review": return "In Review";
    case "ready_for_engineering": return "Ready for Engineering";
    case "approved": return "Approved";
    default: return status || "Unknown";
  }
}

function renderStatusBadge(status) {
  var label = formatStatusLabel(status);
  var desc = STATUS_CONFIG && STATUS_CONFIG[status] ? STATUS_CONFIG[status].description : "";
  // Use badgeClass from STATUS_CONFIG so "approved" renders with existing .implemented CSS styling
  var badgeClass = STATUS_CONFIG && STATUS_CONFIG[status] ? STATUS_CONFIG[status].badgeClass : status;
  return '<span class="status-badge ' + escapeHtml(badgeClass) + '" title="' + escapeHtml(desc) + '">' + escapeHtml(label) + '</span>';
}

function renderStatusLegend() {
  return `
    <div class="status-legend-bar">
      <span class="status-legend-title">Error Workflow Status:</span>
      <div class="status-legend-item" title="Request received and awaiting Product review.">
        <span class="status-dot not_reviewed"></span>
        <span><strong>Not Reviewed</strong>: Request received and awaiting Product review</span>
      </div>
      <div class="status-legend-item" title="Product is reviewing or correcting the message.">
        <span class="status-dot in_review"></span>
        <span><strong>In Review</strong>: Product is reviewing or correcting the message</span>
      </div>
      <div class="status-legend-item" title="Product finalized the correction and it is waiting for Engineering implementation.">
        <span class="status-dot ready_for_engineering"></span>
        <span><strong>Ready for Engineering</strong>: Product finalized; awaiting Engineering</span>
      </div>
      <div class="status-legend-item" title="Engineering implemented the correction and Product confirmed it.">
        <span class="status-dot implemented"></span>
        <span><strong>Approved</strong>: Engineering implemented & Product confirmed</span>
      </div>
    </div>
  `;
}

function isCSOperationalChanged() {
  return (
    (AppState.csDetailsMeaning || "").trim() !== (AppState.csDetailsInitialMeaning || "").trim() ||
    (AppState.csDetailsTrigger || "").trim() !== (AppState.csDetailsInitialTrigger || "").trim() ||
    (AppState.csDetailsAction || "").trim() !== (AppState.csDetailsInitialAction || "").trim()
  );
}

// --- Navigation Controller ---

function setPOV(newPov) {
  if (AppState.pov === "support" && AppState.supportTab === "details" && isCSOperationalChanged()) {
    if (!confirm("You have unsaved operational guidance changes. Discard them and leave?")) {
      return;
    }
  }
  AppState.pov = newPov;
  setStoredPOV(newPov);
  if (newPov === "product") {
    AppState.productTab = "home";
  } else if (newPov === "support") {
    AppState.supportTab = "home";
  } else if (newPov === "engineering") {
    AppState.engineeringTab = "queue";
  }
  renderApp();
  window.scrollTo({ top: 0, behavior: "smooth" });
}

function setProductTab(tab) {
  AppState.productTab = tab;
  renderApp();
  window.scrollTo({ top: 0, behavior: "smooth" });
}

function setSupportTab(tab) {
  if (AppState.supportTab === "details" && isCSOperationalChanged()) {
    if (!confirm("You have unsaved operational guidance changes. Discard them and leave?")) {
      return;
    }
  }
  AppState.supportTab = tab;
  renderApp();
  window.scrollTo({ top: 0, behavior: "smooth" });
}

function setEngineeringTab(tab) {
  AppState.engineeringTab = tab;
  renderApp();
  window.scrollTo({ top: 0, behavior: "smooth" });
}

function openReviewPage(id, fromTab) {
  if (!fromTab) fromTab = "queue";
  AppState.activeErrorId = id;
  AppState.returnTab = fromTab;
  AppState.returnPov = "product";
  
  var record = errorStore.getById(id);
  if (record) {
    AppState.reviewForm = {
      correctedAr: record.correctedArMessage || "",
      correctedEn: record.correctedEnMessage || "",
      approvedTrigger: record.approvedTrigger || "",
      meaning: record.meaning || "",
      supportAction: record.customerSupportAction || "",
      validationErrors: []
    };
    AppState.productResponseInput = record.productResponse || "";
  }

  AppState.productTab = "review";
  renderApp();
  window.scrollTo({ top: 0, behavior: "smooth" });
}

function openSupportDetails(id, fromTab) {
  if (AppState.supportTab === "details" && isCSOperationalChanged()) {
    if (!confirm("You have unsaved operational guidance changes. Discard them and open this record?")) {
      return;
    }
  }
  if (!fromTab) fromTab = "home";
  AppState.activeErrorId = id;
  AppState.returnTab = fromTab;
  AppState.returnPov = "support";
  
  var record = errorStore.getById(id);
  if (record) {
    AppState.csDetailsInitialMeaning = record.meaning || "";
    AppState.csDetailsInitialTrigger = record.approvedTrigger || "";
    AppState.csDetailsInitialAction = record.customerSupportAction || "";
    AppState.csDetailsMeaning = record.meaning || "";
    AppState.csDetailsTrigger = record.approvedTrigger || "";
    AppState.csDetailsAction = record.customerSupportAction || "";
  }
  errorStore.markViewed(id);
  AppState.supportTab = "details";
  renderApp();
  window.scrollTo({ top: 0, behavior: "smooth" });
}

function openEngineeringDetails(id, fromTab) {
  if (!fromTab) fromTab = "queue";
  AppState.activeErrorId = id;
  AppState.returnTab = fromTab;
  AppState.returnPov = "engineering";
  AppState.engineeringTab = "details";
  renderApp();
  window.scrollTo({ top: 0, behavior: "smooth" });
}

function handleResetDemoData() {
  if (confirm("Reset demo data to initial mock seed? All edits and status changes will be restored to defaults.")) {
    try {
      localStorage.clear();
    } catch (e) {}
    errorStore.resetToDefaults();
    AppState.queueSelectedIds = [];
    AppState.engSelectedIds = [];
    AppState.exportSelectedIds = [];
    AppState.csRequestsSelectedIds = [];
    renderApp();
    showToast("Demo data restored to initial seed dataset.", "success");
  }
}

// ==========================================================================
// Main Application Renderer
// ==========================================================================

function renderApp() {
  var root = document.getElementById("root");
  if (!root) return;

  var pov = AppState.pov;
  var html = "";

  // 1. Header with 2 Perspectives (Product, Customer Care) & Tools
  html += `
    <header class="app-header">
      <div class="header-inner">
        <div class="brand-group" onclick="setPOV('landing')" role="button" tabindex="0" title="Go to Section Selection">
          <div class="brand-icon">M</div>
          <div class="brand-text">
            <div class="brand-badge-tag">Malaa Internal Platform</div>
            <h1 class="brand-title">Error Hub</h1>
          </div>
        </div>

        <div class="pov-switcher-container">
          <span class="pov-switcher-label">Section:</span>
          <button type="button" class="pov-toggle-btn ${pov === 'product' ? 'active product' : ''}" onclick="setPOV('product')">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <path d="M12 20h9"></path>
              <path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z"></path>
            </svg>
            Product
          </button>
          <button type="button" class="pov-toggle-btn ${pov === 'support' ? 'active support' : ''}" onclick="setPOV('support')">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z"></path>
            </svg>
            Customer Care
          </button>
        </div>

        <div class="header-right-tools">
          <button type="button" class="reset-demo-btn" onclick="handleResetDemoData()" title="Restore original seed errors">
            ↺ Reset Demo Data
          </button>
        </div>
      </div>
    </header>
  `;

  // 2. Sub-Navigation (if in Product or Customer Care POV)
  if (pov !== "landing") {
    html += '<nav class="sub-nav" aria-label="Secondary Navigation"><div class="sub-nav-inner"><ul class="nav-links-list">';
    if (pov === "product") {
      var kpis = errorStore.getKPIs();
      html += `
        <li><button type="button" class="nav-link-btn product ${AppState.productTab === 'home' ? 'active product' : ''}" onclick="setProductTab('home')">
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"></path><polyline points="9 22 9 12 15 12 15 22"></polyline></svg>
          Product Dashboard
        </button></li>
        <li><button type="button" class="nav-link-btn product ${AppState.productTab === 'all-errors' ? 'active product' : ''}" onclick="setProductTab('all-errors')">
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="3" width="18" height="18" rx="2" ry="2"></rect><line x1="3" y1="9" x2="21" y2="9"></line><line x1="9" y1="21" x2="9" y2="9"></line></svg>
          Error Catalog (${kpis.total})
        </button></li>
        <li><button type="button" class="nav-link-btn product ${AppState.productTab === 'cs-requests' ? 'active product' : ''}" onclick="setProductTab('cs-requests')">
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z"></path></svg>
          Customer Support Requests ${kpis.csRequests > 0 ? `<span style="background:#d97706;color:#ffffff;font-size:0.68rem;padding:0.1rem 0.4rem;border-radius:10px;font-weight:700;margin-left:0.25rem;">${kpis.csRequests}</span>` : ''}
        </button></li>
        <li><button type="button" class="nav-link-btn product ${AppState.productTab === 'eng-export' ? 'active product' : ''}" onclick="setProductTab('eng-export')">
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path><polyline points="7 10 12 15 17 10"></polyline><line x1="12" y1="15" x2="12" y2="3"></line></svg>
          Engineering Export
        </button></li>
      `;
    } else if (pov === "support") {
      var savedCount = errorStore.getSavedRecords().length;
      html += `
        <li><button type="button" class="nav-link-btn support ${AppState.supportTab === 'home' ? 'active support' : ''}" onclick="setSupportTab('home')">
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"></path><polyline points="9 22 9 12 15 12 15 22"></polyline></svg>
          Customer Care Home
        </button></li>
        <li><button type="button" class="nav-link-btn support ${AppState.supportTab === 'all-errors' ? 'active support' : ''}" onclick="setSupportTab('all-errors')">
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="11" cy="11" r="8"></circle><line x1="21" y1="21" x2="16.65" y2="16.65"></line></svg>
          All Errors
        </button></li>
        <li><button type="button" class="nav-link-btn support ${AppState.supportTab === 'saved' ? 'active support' : ''}" onclick="setSupportTab('saved')">
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z"></path></svg>
          Saved Errors (${savedCount})
        </button></li>
        <li><button type="button" class="nav-link-btn support ${AppState.supportTab === 'track-requests' ? 'active support' : ''}" onclick="setSupportTab('track-requests')">
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path><polyline points="14 2 14 8 20 8"></polyline><line x1="16" y1="13" x2="8" y2="13"></line><line x1="16" y1="17" x2="8" y2="17"></line><polyline points="10 9 9 9 8 9"></polyline></svg>
          Track Requests
        </button></li>
      `;
    }
    html += `
      </ul>
      <div class="pov-mode-indicator ${pov}">
        ${pov === 'product' ? 'Product Perspective' : 'Customer Care Perspective'}
      </div>
    </div></nav>
    `;
  }

  // 3. Main Content View
  html += '<main class="main-container">';
  if (pov === "landing") {
    html += renderLandingPage();
  } else if (pov === "product") {
    if (AppState.productTab === "home") html += renderProductHomePage();
    else if (AppState.productTab === "all-errors") html += renderProductAllErrorsPage();
    else if (AppState.productTab === "cs-requests") html += renderCSRequestsPage();
    else if (AppState.productTab === "eng-export") html += renderEngineeringExportPage();
    else if (AppState.productTab === "review") html += renderErrorReviewPage();
  } else if (pov === "support") {
    if (AppState.supportTab === "home") html += renderSupportHomePage();
    else if (AppState.supportTab === "all-errors") html += renderSupportCatalogPage();
    else if (AppState.supportTab === "details") html += renderSupportDetailsPage();
    else if (AppState.supportTab === "saved") html += renderSupportSavedPage();
    else if (AppState.supportTab === "track-requests") html += renderSupportTrackRequestsPage();
  }
  html += '</main>';

  // 4. Global Modals
  html += renderModals();

  // 5. Footer
  html += `
    <footer class="app-footer">
      <p>Malaa Error Hub &bull; 2 Perspectives (Product, Customer Care) &bull; 4 Workflow Statuses &bull; Local Storage</p>
    </footer>
  `;

  root.innerHTML = html;
}

// ==========================================================================
// 1. Role Selection Landing Page (2 Perspectives: Product, Customer Care)
// ==========================================================================

function renderLandingPage() {
  var kpis = errorStore.getKPIs();
  return `
    <div class="landing-container">
      <div class="landing-header">
        <span class="landing-badge">Malaa Error Hub MVP</span>
        <h2 class="landing-title">Select Your Section</h2>
        <p class="landing-subtitle">
          Experience role-tailored governance workflows designed for Product managers reviewing error copy and Customer Care agents assisting users.
        </p>
      </div>

      <div class="role-cards-grid-3">
        <!-- Product Section Card -->
        <div class="role-card product-card" onclick="setPOV('product')">
          <div class="role-card-icon">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <path d="M12 20h9"></path>
              <path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z"></path>
            </svg>
          </div>
          <div class="role-card-content">
            <h3 class="role-card-title">Product</h3>
            <p class="role-card-desc">
              Review error base, correct bilingual copy, respond to Customer Care requests, and approve errors for Engineering.
            </p>
            <div class="role-card-features">
              <div class="role-feature-item">&bull; Side-by-side Arabic & English diff comparisons</div>
              <div class="role-feature-item">&bull; Review and write real Product responses to CS requests</div>
              <div class="role-feature-item">&bull; Mandatory 5-field validation for Engineering approval</div>
              <div class="role-feature-item">&bull; Engineering Export Center (${kpis.readyForEngineering} Ready)</div>
            </div>
          </div>
          <div class="role-card-action">
            <button type="button" class="btn btn-primary" style="width:100%;">
              Enter Product Workspace &rarr;
            </button>
          </div>
        </div>

        <!-- Customer Care Section Card -->
        <div class="role-card support-card" onclick="setPOV('support')">
          <div class="role-card-icon">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z"></path>
            </svg>
          </div>
          <div class="role-card-content">
            <h3 class="role-card-title">Customer Care</h3>
            <p class="role-card-desc">
              Search live errors, follow resolution actions, edit operational guides with instant save/cancel, and submit change requests.
            </p>
            <div class="role-card-features">
              <div class="role-feature-item">&bull; Fast search across error codes, numbers & keywords</div>
              <div class="role-feature-item">&bull; View only current live application messages</div>
              <div class="role-feature-item">&bull; Edit Meaning, Trigger, and Support Action with Cancel</div>
              <div class="role-feature-item">&bull; Submit message requests and view Product responses</div>
            </div>
          </div>
          <div class="role-card-action">
            <button type="button" class="btn btn-success" style="width:100%;">
              Enter Customer Care Workspace &rarr;
            </button>
          </div>
        </div>
      </div>
    </div>
  `;
}

// ==========================================================================
// 2. Product POV — Dashboard View (6 Core Status KPI Cards, Prominent Status Workflow)
// ==========================================================================

function renderProductHomePage() {
  var kpis = errorStore.getKPIs();
  var records = errorStore.getAll();
  var recentActive = records.slice(0, 6);

  var html = `
    <div style="display:flex;flex-direction:column;gap:1.15rem;">
      <div>
        <h2 style="font-size:1.35rem;font-weight:800;color:var(--navy-dark);">Product Governance Dashboard</h2>
        <p style="font-size:0.85rem;color:var(--text-secondary);">
          Review AI-extracted errors, validate bilingual product copy, and approve errors for Engineering.
        </p>
      </div>

      <!-- 6 Compact Status KPI Summary Cards in 1 Row on Desktop -->
      <div class="kpi-grid">
        <div class="kpi-card kpi-total" onclick="handleKpiClick('all')" title="View all errors">
          <div class="kpi-content">
            <span class="kpi-label">Total Errors</span>
            <span class="kpi-value">${kpis.total}</span>
          </div>
          <div class="kpi-icon">
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="2" y="7" width="20" height="14" rx="2" ry="2"></rect><path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16"></path></svg>
          </div>
        </div>

        <div class="kpi-card kpi-change_request_cs" onclick="handleKpiClick('cs_requests')" title="View Customer Support requests">
          <div class="kpi-content">
            <span class="kpi-label">CS Requests</span>
            <span class="kpi-value" style="color:#b45309;">${kpis.csRequests}</span>
          </div>
          <div class="kpi-icon">
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"></path></svg>
          </div>
        </div>

        <div class="kpi-card kpi-not_reviewed" onclick="handleKpiClick('not_reviewed')" title="View unreviewed extracted errors">
          <div class="kpi-content">
            <span class="kpi-label">Not Reviewed</span>
            <span class="kpi-value" style="color:#475569;">${kpis.notReviewed}</span>
          </div>
          <div class="kpi-icon">
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"></circle><polyline points="12 6 12 12 14 14"></polyline></svg>
          </div>
        </div>

        <div class="kpi-card kpi-in_review" onclick="handleKpiClick('in_review')" title="View errors currently in review">
          <div class="kpi-content">
            <span class="kpi-label">In Review</span>
            <span class="kpi-value" style="color:#1d4ed8;">${kpis.inReview}</span>
          </div>
          <div class="kpi-icon">
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path></svg>
          </div>
        </div>

        <div class="kpi-card kpi-ready_for_engineering" onclick="handleKpiClick('ready_for_engineering')" title="View errors approved for Engineering">
          <div class="kpi-content">
            <span class="kpi-label">Ready for Eng</span>
            <span class="kpi-value" style="color:#4338ca;">${kpis.readyForEngineering}</span>
          </div>
          <div class="kpi-icon">
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="9 11 12 14 22 4"></polyline><path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11"></path></svg>
          </div>
        </div>

        <div class="kpi-card kpi-implemented" onclick="handleKpiClick('approved')" title="View errors confirmed approved">
          <div class="kpi-content">
            <span class="kpi-label">Approved</span>
            <span class="kpi-value" style="color:#047857;">${kpis.approved}</span>
          </div>
          <div class="kpi-icon">
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path><polyline points="22 4 12 14.01 9 11.01"></polyline></svg>
          </div>
        </div>
      </div>

      <!-- Prominent Status Explanation Bar -->
      ${renderStatusLegend()}

      <!-- Active Errors Table (Fits Desktop Width, No Scroll, Larger Review Buttons) -->
      <div class="table-card">
        <div style="padding:0.75rem 1rem;border-bottom:1px solid var(--border-subtle);display:flex;justify-content:space-between;align-items:center;">
          <h3 style="font-size:0.9rem;font-weight:700;">Active Error Catalog Preview</h3>
          <button type="button" class="btn btn-outline btn-sm" onclick="setProductTab('all-errors')">Open Full Error Catalog &rarr;</button>
        </div>
        <div class="table-responsive">
          <table class="data-table">
            <thead>
              <tr>
                <th style="width:95px;">Error Code</th>
                <th style="width:110px;">Service</th>
                <th style="width:140px;">Current Status</th>
                <th style="width:20%;">Original AR</th>
                <th style="width:20%;">Corrected AR</th>
                <th style="width:20%;">Original EN</th>
                <th style="width:20%;">Corrected EN</th>
                <th style="width:115px;text-align:right;">Action</th>
              </tr>
            </thead>
            <tbody>
              ${recentActive.map(function(r) {
                return `
                  <tr>
                    <td><span class="code-badge">${escapeHtml(r.errorCode)}</span></td>
                    <td><span class="service-badge">${escapeHtml(r.service)}</span></td>
                    <td>${renderStatusBadge(r.status)}</td>
                    <td><div class="cell-clamp arabic" title="${escapeHtml(r.originalArMessage)}">${escapeHtml(r.originalArMessage)}</div></td>
                    <td><div class="cell-clamp arabic" style="color:#047857;font-weight:600;" title="${escapeHtml(r.correctedArMessage || "—")}">${escapeHtml(r.correctedArMessage || "—")}</div></td>
                    <td><div class="cell-clamp" title="${escapeHtml(r.originalEnMessage)}">${escapeHtml(r.originalEnMessage)}</div></td>
                    <td><div class="cell-clamp" style="color:#047857;font-weight:600;" title="${escapeHtml(r.correctedEnMessage || "—")}">${escapeHtml(r.correctedEnMessage || "—")}</div></td>
                    <td style="text-align:right;">
                      <button type="button" class="btn-review" onclick="openReviewPage('${r.id}', 'home')">
                        Review &rarr;
                      </button>
                    </td>
                  </tr>
                `;
              }).join("")}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  `;

  return html;
}

function handleKpiClick(filterType) {
  if (filterType === "all") {
    AppState.allErrorsStatus = "All";
    setProductTab("all-errors");
  } else if (filterType === "cs_requests") {
    setProductTab("cs-requests");
  } else if (filterType === "not_reviewed" || filterType === "in_review" || filterType === "ready_for_engineering" || filterType === "approved") {
    AppState.allErrorsStatus = filterType;
    setProductTab("all-errors");
  } else {
    AppState.allErrorsStatus = "All";
    setProductTab("all-errors");
  }
}

// ==========================================================================
// 3. Product POV — Review Queue View (No Changed Fields, Larger Review Button, Fits Desktop)
// ==========================================================================

function getFilteredQueueRecords() {
  var records = errorStore.getAll();
  var search = AppState.queueSearch.trim().toUpperCase();
  var cleanSearch = search.replace(/[^A-Z0-9]/g, "");
  var selectedService = AppState.queueService;
  var selectedStatus = AppState.queueStatus;

  return records.filter(function(r) {
    if (selectedService !== "All" && r.service !== selectedService) return false;
    if (selectedStatus !== "All" && r.status !== selectedStatus) return false;

    if (search) {
      var itemCode = r.errorCode.toUpperCase();
      var cleanCode = itemCode.replace(/[^A-Z0-9]/g, "");
      var codeMatch = itemCode.indexOf(search) !== -1 || (cleanSearch && cleanCode.indexOf(cleanSearch) !== -1);
      var arMatch = (r.originalArMessage || "").indexOf(AppState.queueSearch.trim()) !== -1 || (r.correctedArMessage || "").indexOf(AppState.queueSearch.trim()) !== -1;
      var enMatch = (r.originalEnMessage || "").toUpperCase().indexOf(search) !== -1 || (r.correctedEnMessage || "").toUpperCase().indexOf(search) !== -1;
      var triggerMatch = (r.aiSuggestedTrigger || "").toUpperCase().indexOf(search) !== -1 || (r.approvedTrigger || "").toUpperCase().indexOf(search) !== -1;
      var meaningMatch = (r.meaning || "").toUpperCase().indexOf(search) !== -1;
      var actionMatch = (r.customerSupportAction || "").toUpperCase().indexOf(search) !== -1;
      var commentMatch = (r.customerSupportComment || "").toUpperCase().indexOf(search) !== -1;
      var responseMatch = (r.productResponse || "").toUpperCase().indexOf(search) !== -1;

      return codeMatch || arMatch || enMatch || triggerMatch || meaningMatch || actionMatch || commentMatch || responseMatch;
    }

    return true;
  });
}

function renderQueueTableRows(filtered) {
  if (filtered.length === 0) {
    return '<tr><td colspan="8" style="text-align:center;padding:2.5rem;color:var(--text-muted);">No error records matched your filter criteria.</td></tr>';
  }

  return filtered.map(function(r) {
    var isChecked = AppState.queueSelectedIds.indexOf(r.id) !== -1;
    return `
      <tr class="${isChecked ? 'selected' : ''}">
        <td style="text-align:center;">
          <input type="checkbox" ${isChecked ? 'checked' : ''} onchange="handleToggleQueueRowSelect('${r.id}')" aria-label="Select ${escapeHtml(r.errorCode)}" />
        </td>
        <td><span class="code-badge">${escapeHtml(r.errorCode)}</span></td>
        <td><span class="service-badge">${escapeHtml(r.service)}</span></td>
        <td>${renderStatusBadge(r.status)}</td>
        <td><div class="cell-clamp arabic" title="${escapeHtml(r.originalArMessage)}">${escapeHtml(r.originalArMessage)}</div></td>
        <td><div class="cell-clamp arabic" style="color:#047857;font-weight:600;" title="${escapeHtml(r.correctedArMessage || "—")}">${escapeHtml(r.correctedArMessage || "—")}</div></td>
        <td><div class="cell-clamp" title="${escapeHtml(r.originalEnMessage)}">${escapeHtml(r.originalEnMessage)}</div></td>
        <td><div class="cell-clamp" style="color:#047857;font-weight:600;" title="${escapeHtml(r.correctedEnMessage || "—")}">${escapeHtml(r.correctedEnMessage || "—")}</div></td>
        <td style="text-align:right;white-space:nowrap;">
          <button type="button" class="btn-review" onclick="openReviewPage('${r.id}', 'queue')">
            Review &rarr;
          </button>
        </td>
      </tr>
    `;
  }).join("");
}

function renderReviewQueuePage() {
  var records = errorStore.getAll();
  var filtered = getFilteredQueueRecords();
  var isAllSelected = filtered.length > 0 && AppState.queueSelectedIds.length === filtered.length;

  var html = `
    <div style="display:flex;flex-direction:column;gap:1.15rem;">
      <div>
        <h2 style="font-size:1.35rem;font-weight:800;color:var(--navy-dark);">Product Review Queue</h2>
        <p style="font-size:0.85rem;color:var(--text-secondary);">
          Review errors, verify side-by-side Arabic & English copy, and approve corrections for Engineering.
        </p>
      </div>

      <!-- Filter Controls (No Changed Fields Filter) -->
      <div class="filter-bar-card">
        <div class="search-input-row">
          <div class="search-box-wrapper">
            <svg class="search-box-icon" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="11" cy="11" r="8"></circle><line x1="21" y1="21" x2="16.65" y2="16.65"></line></svg>
            <input
              type="text"
              id="queueSearchInput"
              class="search-box-input"
              placeholder="Search by code, number, Arabic/English text, trigger, meaning, action..."
              value="${escapeHtml(AppState.queueSearch)}"
              oninput="handleQueueSearchInput(this.value)"
              autocomplete="off"
            />
            ${AppState.queueSearch ? `<button type="button" style="position:absolute;right:0.65rem;background:none;border:none;cursor:pointer;font-size:1.1rem;color:var(--text-muted);" onclick="handleClearQueueSearch()">&times;</button>` : ''}
          </div>

          <div class="filters-row">
            <select class="filter-select" onchange="handleQueueServiceChange(this.value)">
              <option value="All" ${AppState.queueService === 'All' ? 'selected' : ''}>All Services (${records.length})</option>
              ${SERVICES.map(function(s) {
                return `<option value="${escapeHtml(s)}" ${AppState.queueService === s ? 'selected' : ''}>${escapeHtml(s)}</option>`;
              }).join("")}
            </select>

            <select class="filter-select" onchange="handleQueueStatusChange(this.value)">
              <option value="All" ${AppState.queueStatus === 'All' ? 'selected' : ''}>All Statuses</option>
              <option value="change_request_cs" ${AppState.queueStatus === 'change_request_cs' ? 'selected' : ''}>Change Request CS</option>
              <option value="not_reviewed" ${AppState.queueStatus === 'not_reviewed' ? 'selected' : ''}>Not Reviewed</option>
              <option value="in_review" ${AppState.queueStatus === 'in_review' ? 'selected' : ''}>In Review</option>
              <option value="ready_for_engineering" ${AppState.queueStatus === 'ready_for_engineering' ? 'selected' : ''}>Ready for Engineering</option>
              <option value="implemented" ${AppState.queueStatus === 'implemented' ? 'selected' : ''}>Implemented</option>
            </select>

            ${(AppState.queueSearch || AppState.queueService !== 'All' || AppState.queueStatus !== 'All') ? `
              <button type="button" class="btn btn-secondary btn-sm" onclick="clearQueueFilters()">
                Clear Filters
              </button>
            ` : ''}
          </div>
        </div>

        <div style="display:flex;justify-content:space-between;align-items:center;font-size:0.8rem;color:var(--text-muted);">
          <span id="queueCounter">Showing <strong>${filtered.length}</strong> of ${records.length} errors</span>
        </div>
      </div>

      <!-- Prominent Status Explanation Info Bar -->
      ${renderStatusLegend()}

      <!-- Bulk Actions Bar -->
      <div id="queueBulkActionsBar" style="display:${AppState.queueSelectedIds.length > 0 ? 'block' : 'none'};">
        <div class="bulk-actions-bar">
          <div class="bulk-selection-count" id="queueBulkCount">${AppState.queueSelectedIds.length} error(s) selected</div>
          <div class="bulk-actions-group">
            <span style="font-size:0.75rem;color:#94a3b8;">Set Status:</span>
            <button type="button" class="btn btn-secondary btn-sm" onclick="handleBulkStatus('in_review')">Mark In Review</button>
            <button type="button" class="btn btn-outline btn-sm" onclick="handleDeselectAllQueue()">Deselect All</button>
          </div>
        </div>
      </div>

      <!-- Queue Table (Fits Desktop Width, Larger Review Buttons) -->
      <div class="table-card">
        <div class="table-responsive">
          <table class="data-table">
            <thead>
              <tr>
                <th style="width:36px;text-align:center;">
                  <input type="checkbox" id="queueSelectAllCheckbox" ${isAllSelected ? 'checked' : ''} onchange="handleToggleQueueSelectAll(this.checked)" aria-label="Select all" />
                </th>
                <th style="width:95px;">Error Code</th>
                <th style="width:110px;">Service</th>
                <th style="width:140px;">Status</th>
                <th style="width:20%;">Original AR</th>
                <th style="width:20%;">Corrected AR</th>
                <th style="width:20%;">Original EN</th>
                <th style="width:20%;">Corrected EN</th>
                <th style="width:115px;text-align:right;">Action</th>
              </tr>
            </thead>
            <tbody id="queueTableBody">
              ${renderQueueTableRows(filtered)}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  `;

  return html;
}

// Queue Handlers (Preserves Input Focus)
function handleQueueSearchInput(val) {
  AppState.queueSearch = val;
  var filtered = getFilteredQueueRecords();
  var tbody = document.getElementById("queueTableBody");
  if (tbody) {
    tbody.innerHTML = renderQueueTableRows(filtered);
  }
  var counter = document.getElementById("queueCounter");
  if (counter) {
    counter.innerHTML = "Showing <strong>" + filtered.length + "</strong> of " + errorStore.getAll().length + " errors";
  }
}

function handleClearQueueSearch() {
  AppState.queueSearch = "";
  var input = document.getElementById("queueSearchInput");
  if (input) input.value = "";
  handleQueueSearchInput("");
}

function handleQueueServiceChange(val) {
  AppState.queueService = val;
  renderApp();
}
function handleQueueStatusChange(val) {
  AppState.queueStatus = val;
  renderApp();
}
function clearQueueFilters() {
  AppState.queueSearch = "";
  AppState.queueService = "All";
  AppState.queueStatus = "All";
  renderApp();
}

function handleToggleQueueSelectAll(checked) {
  var filtered = getFilteredQueueRecords();
  if (checked) {
    AppState.queueSelectedIds = filtered.map(function(r) { return r.id; });
  } else {
    AppState.queueSelectedIds = [];
  }
  renderApp();
}

function handleToggleQueueRowSelect(id) {
  var idx = AppState.queueSelectedIds.indexOf(id);
  if (idx !== -1) {
    AppState.queueSelectedIds.splice(idx, 1);
  } else {
    AppState.queueSelectedIds.push(id);
  }
  renderApp();
}

function handleDeselectAllQueue() {
  AppState.queueSelectedIds = [];
  renderApp();
}

function handleBulkStatus(newStatus) {
  if (AppState.queueSelectedIds.length === 0) return;
  var count = errorStore.bulkUpdateStatus(AppState.queueSelectedIds, newStatus);
  AppState.queueSelectedIds = [];
  renderApp();
  showToast("Updated status to " + formatStatusLabel(newStatus) + " for " + count + " errors.");
}

// ==========================================================================
// 4. Product POV — All Errors Catalog View (Fits Desktop Width, Larger Review Buttons)
// ==========================================================================

function getFilteredProductAllErrors() {
  var records = errorStore.getAll();
  var search = AppState.allErrorsSearch.trim().toUpperCase();
  var cleanSearch = search.replace(/[^A-Z0-9]/g, "");
  var selectedService = AppState.allErrorsService;
  var selectedStatus = AppState.allErrorsStatus;

  var filtered = records.filter(function(r) {
    if (selectedService !== "All" && r.service !== selectedService) return false;
    if (selectedStatus === "needs_review") {
      if (r.status !== "not_reviewed" && r.status !== "in_review") return false;
    } else if (selectedStatus !== "All" && r.status !== selectedStatus) {
      return false;
    }

    if (search) {
      var itemCode = r.errorCode.toUpperCase();
      var cleanCode = itemCode.replace(/[^A-Z0-9]/g, "");
      var codeMatch = itemCode.indexOf(search) !== -1 || (cleanSearch && cleanCode.indexOf(cleanSearch) !== -1);
      var arMatch = (r.originalArMessage || "").indexOf(AppState.allErrorsSearch.trim()) !== -1 || (r.correctedArMessage || "").indexOf(AppState.allErrorsSearch.trim()) !== -1;
      var enMatch = (r.originalEnMessage || "").toUpperCase().indexOf(search) !== -1 || (r.correctedEnMessage || "").toUpperCase().indexOf(search) !== -1;
      var triggerMatch = (r.aiSuggestedTrigger || "").toUpperCase().indexOf(search) !== -1 || (r.approvedTrigger || "").toUpperCase().indexOf(search) !== -1;
      var meaningMatch = (r.meaning || "").toUpperCase().indexOf(search) !== -1;
      var actionMatch = (r.customerSupportAction || "").toUpperCase().indexOf(search) !== -1;
      var responseMatch = (r.productResponse || "").toUpperCase().indexOf(search) !== -1;
      return codeMatch || arMatch || enMatch || triggerMatch || meaningMatch || actionMatch || responseMatch;
    }
    return true;
  });

  // Sort
  var field = AppState.allErrorsSortField;
  var asc = AppState.allErrorsSortAsc;
  filtered.sort(function(a, b) {
    var valA = a[field] || "";
    var valB = b[field] || "";
    if (valA < valB) return asc ? -1 : 1;
    if (valA > valB) return asc ? 1 : -1;
    return 0;
  });

  return filtered;
}

function renderProductAllErrorsTableRows(filtered) {
  if (filtered.length === 0) {
    return '<tr><td colspan="8" style="text-align:center;padding:2.5rem;color:var(--text-muted);">No records found in catalog matching filters.</td></tr>';
  }

  return filtered.map(function(r) {
    return `
      <tr>
        <td><span class="code-badge">${escapeHtml(r.errorCode)}</span></td>
        <td><span class="service-badge">${escapeHtml(r.service)}</span></td>
        <td>${renderStatusBadge(r.status)}</td>
        <td><div class="cell-clamp arabic" title="${escapeHtml(r.originalArMessage)}">${escapeHtml(r.originalArMessage)}</div></td>
        <td><div class="cell-clamp arabic" style="color:#047857;font-weight:600;" title="${escapeHtml(r.correctedArMessage || "—")}">${escapeHtml(r.correctedArMessage || "—")}</div></td>
        <td><div class="cell-clamp" title="${escapeHtml(r.originalEnMessage)}">${escapeHtml(r.originalEnMessage)}</div></td>
        <td><div class="cell-clamp" style="color:#047857;font-weight:600;" title="${escapeHtml(r.correctedEnMessage || "—")}">${escapeHtml(r.correctedEnMessage || "—")}</div></td>
        <td style="text-align:right;">
          <button type="button" class="btn-review" onclick="openReviewPage('${r.id}', 'all-errors')">
            Review &rarr;
          </button>
        </td>
      </tr>
    `;
  }).join("");
}

function renderProductAllErrorsPage() {
  var records = errorStore.getAll();
  var filtered = getFilteredProductAllErrors();

  var html = `
    <div style="display:flex;flex-direction:column;gap:1.15rem;">
      <div>
        <h2 style="font-size:1.35rem;font-weight:800;color:var(--navy-dark);">Error Catalog</h2>
        <p style="font-size:0.85rem;color:var(--text-secondary);">
          Browse, search, and filter all errors. Open any row to review and edit copy and workflow status.
        </p>
      </div>

      <div class="filter-bar-card">
        <div class="search-input-row">
          <div class="search-box-wrapper">
            <svg class="search-box-icon" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="11" cy="11" r="8"></circle><line x1="21" y1="21" x2="16.65" y2="16.65"></line></svg>
            <input
              type="text"
              id="allErrorsSearchInput"
              class="search-box-input"
              placeholder="Search across all errors by code, number, message, or trigger..."
              value="${escapeHtml(AppState.allErrorsSearch)}"
              oninput="handleAllErrorsSearchInput(this.value)"
              autocomplete="off"
            />
          </div>

          <div class="filters-row">
            <select class="filter-select" onchange="handleAllErrorsService(this.value)">
              <option value="All" ${AppState.allErrorsService === 'All' ? 'selected' : ''}>All Services (${records.length})</option>
              ${SERVICES.map(function(s) {
                return `<option value="${escapeHtml(s)}" ${AppState.allErrorsService === s ? 'selected' : ''}>${escapeHtml(s)}</option>`;
              }).join("")}
            </select>

            <select class="filter-select" onchange="handleAllErrorsStatus(this.value)">
              <option value="needs_review" ${AppState.allErrorsStatus === 'needs_review' ? 'selected' : ''}>Needs Product Review</option>
              <option value="All" ${AppState.allErrorsStatus === 'All' ? 'selected' : ''}>All Statuses (${records.length})</option>
              <option value="not_reviewed" ${AppState.allErrorsStatus === 'not_reviewed' ? 'selected' : ''}>Not Reviewed</option>
              <option value="in_review" ${AppState.allErrorsStatus === 'in_review' ? 'selected' : ''}>In Review</option>
              <option value="ready_for_engineering" ${AppState.allErrorsStatus === 'ready_for_engineering' ? 'selected' : ''}>Ready for Engineering</option>
              <option value="approved" ${AppState.allErrorsStatus === 'approved' ? 'selected' : ''}>Approved</option>
            </select>
          </div>
        </div>

        <div style="font-size:0.8rem;color:var(--text-muted);">
          <span id="allErrorsCounter">Showing <strong>${filtered.length}</strong> of ${records.length} errors</span>
        </div>
      </div>

      <div class="table-card">
        <div class="table-responsive">
          <table class="data-table">
            <thead>
              <tr>
                <th class="sortable" style="width:95px;" onclick="handleSortAllErrors('errorCode')">
                  Error Code ${AppState.allErrorsSortField === 'errorCode' ? (AppState.allErrorsSortAsc ? '↑' : '↓') : ''}
                </th>
                <th class="sortable" style="width:110px;" onclick="handleSortAllErrors('service')">
                  Service ${AppState.allErrorsSortField === 'service' ? (AppState.allErrorsSortAsc ? '↑' : '↓') : ''}
                </th>
                <th class="sortable" style="width:140px;" onclick="handleSortAllErrors('status')">
                  Status ${AppState.allErrorsSortField === 'status' ? (AppState.allErrorsSortAsc ? '↑' : '↓') : ''}
                </th>
                <th style="width:20%;">Original AR</th>
                <th style="width:20%;">Corrected AR</th>
                <th style="width:20%;">Original EN</th>
                <th style="width:20%;">Corrected EN</th>
                <th style="width:115px;text-align:right;">Action</th>
              </tr>
            </thead>
            <tbody id="allErrorsTableBody">
              ${renderProductAllErrorsTableRows(filtered)}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  `;

  return html;
}

function handleAllErrorsSearchInput(val) {
  AppState.allErrorsSearch = val;
  var filtered = getFilteredProductAllErrors();
  var tbody = document.getElementById("allErrorsTableBody");
  if (tbody) tbody.innerHTML = renderProductAllErrorsTableRows(filtered);
  var counter = document.getElementById("allErrorsCounter");
  if (counter) counter.innerHTML = "Showing <strong>" + filtered.length + "</strong> of " + errorStore.getAll().length + " errors";
}
function handleAllErrorsService(val) {
  AppState.allErrorsService = val;
  renderApp();
}
function handleAllErrorsStatus(val) {
  AppState.allErrorsStatus = val;
  renderApp();
}
function handleSortAllErrors(field) {
  if (AppState.allErrorsSortField === field) {
    AppState.allErrorsSortAsc = !AppState.allErrorsSortAsc;
  } else {
    AppState.allErrorsSortField = field;
    AppState.allErrorsSortAsc = true;
  }
  renderApp();
}

// ==========================================================================
// 5. Product POV — Customer Support Requests (Active Inbox, Includes Product Response & Archiving)
// ==========================================================================

function getFilteredCSRequests() {
  var records = errorStore.getAll();
  // Show only active (unarchived) requests
  var requests = records.filter(function(r) {
    return !!r.customerSupportComment && !r.requestArchived;
  });

  var search = AppState.csRequestsSearch.trim().toUpperCase();
  var selectedService = AppState.csRequestsService;

  return requests.filter(function(r) {
    if (selectedService !== "All" && r.service !== selectedService) return false;
    if (search) {
      return (
        r.errorCode.toUpperCase().indexOf(search) !== -1 ||
        (r.customerSupportComment || "").toUpperCase().indexOf(search) !== -1 ||
        (r.productResponse || "").toUpperCase().indexOf(search) !== -1 ||
        (r.originalArMessage || "").indexOf(AppState.csRequestsSearch.trim()) !== -1 ||
        (r.originalEnMessage || "").toUpperCase().indexOf(search) !== -1
      );
    }
    return true;
  });
}

function renderCSRequestsTableRows(requests) {
  if (requests.length === 0) {
    return '<tr><td colspan="8" style="text-align:center;padding:2.5rem;color:var(--text-muted);">No active Customer Support requests pending review.</td></tr>';
  }

  return requests.map(function(r) {
    var isSelected = (AppState.csRequestsSelectedIds || []).indexOf(r.id) !== -1;
    return `
      <tr>
        <td style="text-align:center;" onclick="event.stopPropagation()">
          <input
            type="checkbox"
            ${isSelected ? 'checked' : ''}
            onchange="handleToggleCSRequestRowSelect('${r.id}')"
            aria-label="Select ${escapeHtml(r.errorCode)}"
          />
        </td>
        <td><span class="code-badge">${escapeHtml(r.errorCode)}</span></td>
        <td><span class="service-badge">${escapeHtml(r.service)}</span></td>
        <td><span style="font-weight:600;font-size:0.75rem;color:var(--brand-primary);">${escapeHtml(r.requestedField || "Both Arabic and English Messages")}</span></td>
        <td>
          <div style="background:#fffbeb;border:1px solid #fde68a;padding:0.35rem 0.55rem;border-radius:var(--radius-sm);font-size:0.775rem;color:#92400e;" title="${escapeHtml(r.customerSupportComment)}">
            <div class="cell-clamp" style="color:#92400e;">"${escapeHtml(r.customerSupportComment)}"</div>
          </div>
        </td>
        <td>
          <div class="cell-clamp" style="font-size:0.78rem;color:var(--text-secondary);" title="${escapeHtml(r.productResponse || "No response yet")}">
            ${r.productResponse ? escapeHtml(r.productResponse) : '<span style="color:var(--text-muted);font-style:italic;">No response yet</span>'}
          </div>
        </td>
        <td>${renderStatusBadge(r.status)}</td>
        <td style="text-align:right;">
          <button type="button" class="btn-review warning" onclick="openReviewPage('${r.id}', 'cs-requests')">
            Review Request &rarr;
          </button>
        </td>
      </tr>
    `;
  }).join("");
}

function renderCSRequestsPage() {
  var requests = getFilteredCSRequests();
  var selCount = (AppState.csRequestsSelectedIds || []).length;
  var isAllSelected = requests.length > 0 && requests.every(function(r) {
    return (AppState.csRequestsSelectedIds || []).indexOf(r.id) !== -1;
  });

  var html = `
    <div style="display:flex;flex-direction:column;gap:1.15rem;">
      <div style="display:flex;justify-content:space-between;align-items:flex-start;flex-wrap:wrap;gap:0.75rem;">
        <div>
          <h2 style="font-size:1.35rem;font-weight:800;color:var(--navy-dark);">Customer Support Requests</h2>
          <p style="font-size:0.85rem;color:var(--text-secondary);">
            Review active feedback submitted by Customer Support, write Product responses, and prepare approved corrections for Engineering.
          </p>
        </div>

        <div style="display:flex;align-items:center;gap:0.5rem;flex-wrap:wrap;">
          <button
            type="button"
            class="btn btn-secondary btn-sm"
            onclick="handleArchiveSelectedCSRequests()"
            ${selCount === 0 ? 'disabled' : ''}
            title="Archive selected requests linked to Approved errors"
          >
            Archive Selected (${selCount})
          </button>
          ${selCount > 0 ? `
            <button type="button" class="btn btn-outline btn-sm" onclick="handleClearCSRequestsSelection()">
              Clear
            </button>
          ` : ''}
        </div>
      </div>

      <div class="filter-bar-card">
        <div class="search-input-row">
          <div class="search-box-wrapper">
            <svg class="search-box-icon" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="11" cy="11" r="8"></circle><line x1="21" y1="21" x2="16.65" y2="16.65"></line></svg>
            <input
              type="text"
              id="csRequestsSearchInput"
              class="search-box-input"
              placeholder="Search CS requests by code, comment text, or response..."
              value="${escapeHtml(AppState.csRequestsSearch)}"
              oninput="handleCSRequestsSearchInput(this.value)"
              autocomplete="off"
            />
          </div>

          <div class="filters-row">
            <select class="filter-select" onchange="handleCSRequestsService(this.value)">
              <option value="All" ${AppState.csRequestsService === 'All' ? 'selected' : ''}>All Services</option>
              ${SERVICES.map(function(s) {
                return `<option value="${escapeHtml(s)}" ${AppState.csRequestsService === s ? 'selected' : ''}>${escapeHtml(s)}</option>`;
              }).join("")}
            </select>
          </div>
        </div>

        <div style="font-size:0.8rem;color:var(--text-muted);display:flex;justify-content:space-between;align-items:center;flex-wrap:wrap;gap:0.5rem;">
          <span id="csRequestsCounter">Active CS Requests: <strong>${requests.length}</strong> | Selected: <strong>${selCount}</strong></span>
          <span>Only requests linked to <strong>Approved</strong> errors can be archived.</span>
        </div>
      </div>

      <div class="table-card">
        <div class="table-responsive">
          <table class="data-table">
            <thead>
              <tr>
                <th style="width:36px;text-align:center;">
                  <input
                    type="checkbox"
                    ${isAllSelected ? 'checked' : ''}
                    onchange="handleToggleCSRequestsSelectAll(this.checked)"
                    aria-label="Select all"
                  />
                </th>
                <th style="width:95px;">Error Code</th>
                <th style="width:110px;">Service</th>
                <th style="width:135px;">Requested Field</th>
                <th style="width:24%;">Support Comment</th>
                <th style="width:24%;">Product Response</th>
                <th style="width:140px;">Error Workflow Status</th>
                <th style="width:125px;text-align:right;">Action</th>
              </tr>
            </thead>
            <tbody id="csRequestsTableBody">
              ${renderCSRequestsTableRows(requests)}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  `;

  return html;
}

function handleCSRequestsSearchInput(val) {
  AppState.csRequestsSearch = val;
  var requests = getFilteredCSRequests();
  var tbody = document.getElementById("csRequestsTableBody");
  if (tbody) tbody.innerHTML = renderCSRequestsTableRows(requests);
  var counter = document.getElementById("csRequestsCounter");
  var selCount = (AppState.csRequestsSelectedIds || []).length;
  if (counter) counter.innerHTML = "Active CS Requests: <strong>" + requests.length + "</strong> | Selected: <strong>" + selCount + "</strong>";
}

function handleCSRequestsService(val) {
  AppState.csRequestsService = val;
  var requests = getFilteredCSRequests();
  var reqIds = requests.map(function(r) { return r.id; });
  AppState.csRequestsSelectedIds = (AppState.csRequestsSelectedIds || []).filter(function(id) { return reqIds.indexOf(id) !== -1; });
  renderApp();
}

function handleToggleCSRequestsSelectAll(checked) {
  var requests = getFilteredCSRequests();
  if (checked) {
    AppState.csRequestsSelectedIds = requests.map(function(r) { return r.id; });
  } else {
    AppState.csRequestsSelectedIds = [];
  }
  renderApp();
}

function handleToggleCSRequestRowSelect(id) {
  if (!AppState.csRequestsSelectedIds) AppState.csRequestsSelectedIds = [];
  var idx = AppState.csRequestsSelectedIds.indexOf(id);
  if (idx !== -1) {
    AppState.csRequestsSelectedIds.splice(idx, 1);
  } else {
    AppState.csRequestsSelectedIds.push(id);
  }
  renderApp();
}

function handleClearCSRequestsSelection() {
  AppState.csRequestsSelectedIds = [];
  renderApp();
}

function handleArchiveSelectedCSRequests() {
  var selectedIds = AppState.csRequestsSelectedIds || [];
  if (selectedIds.length === 0) return;

  var allRecords = errorStore.getAll();
  var selectedRecords = allRecords.filter(function(r) {
    return selectedIds.indexOf(r.id) !== -1 || selectedIds.indexOf(r.errorCode) !== -1;
  });

  // Check rule: Only requests whose linked error status is approved can be archived
  var hasNonApproved = selectedRecords.some(function(r) {
    return r.status !== "approved";
  });

  if (hasNonApproved) {
    showToast("Only requests linked to Approved errors can be archived.", "error");
    return;
  }

  var count = errorStore.archiveCSRequests(selectedIds);
  AppState.csRequestsSelectedIds = [];
  renderApp();
  showToast("Archived " + count + " approved Customer Support request(s).", "success");
}

// ==========================================================================
// 6. Product POV — Tracking Ready Engineering View (Fits Desktop Width)
// ==========================================================================

function getFilteredTrackingReady() {
  var records = errorStore.getAll();
  var search = AppState.trackReadySearch.trim().toUpperCase();
  var selectedService = AppState.trackReadyService;
  var selectedStatus = AppState.trackReadyStatus;

  return records.filter(function(r) {
    if (selectedStatus === "ready_for_engineering" && r.status !== "ready_for_engineering") return false;
    if (selectedStatus === "implemented" && r.status !== "implemented") return false;
    if (selectedStatus === "All" && r.status !== "ready_for_engineering" && r.status !== "implemented") return false;
    if (selectedService !== "All" && r.service !== selectedService) return false;

    if (search) {
      return (
        r.errorCode.toUpperCase().indexOf(search) !== -1 ||
        (r.correctedArMessage || "").indexOf(AppState.trackReadySearch.trim()) !== -1 ||
        (r.correctedEnMessage || "").toUpperCase().indexOf(search) !== -1 ||
        (r.approvedTrigger || "").toUpperCase().indexOf(search) !== -1 ||
        (r.meaning || "").toUpperCase().indexOf(search) !== -1
      );
    }
    return true;
  });
}

function renderTrackingReadyTableRows(filtered) {
  if (filtered.length === 0) {
    return '<tr><td colspan="7" style="text-align:center;padding:2.5rem;color:var(--text-muted);">No records found in Ready / Implemented tracking.</td></tr>';
  }

  return filtered.map(function(r) {
    return `
      <tr>
        <td><span class="code-badge">${escapeHtml(r.errorCode)}</span></td>
        <td><span class="service-badge">${escapeHtml(r.service)}</span></td>
        <td>${renderStatusBadge(r.status)}</td>
        <td><div class="cell-clamp arabic" style="color:#047857;font-weight:600;" title="${escapeHtml(r.correctedArMessage)}">${escapeHtml(r.correctedArMessage)}</div></td>
        <td><div class="cell-clamp" style="color:#047857;font-weight:600;" title="${escapeHtml(r.correctedEnMessage)}">${escapeHtml(r.correctedEnMessage)}</div></td>
        <td><div class="cell-clamp" title="${escapeHtml(r.approvedTrigger)}">${escapeHtml(r.approvedTrigger)}</div></td>
        <td style="text-align:right;">
          <button type="button" class="btn-review" onclick="openReviewPage('${r.id}', 'tracking-ready')">
            View &rarr;
          </button>
        </td>
      </tr>
    `;
  }).join("");
}

function renderTrackingReadyPage() {
  var filtered = getFilteredTrackingReady();

  var html = `
    <div style="display:flex;flex-direction:column;gap:1.15rem;">
      <div>
        <h2 style="font-size:1.35rem;font-weight:800;color:var(--navy-dark);">Tracking Ready Engineering</h2>
        <p style="font-size:0.85rem;color:var(--text-secondary);">
          Track Product-approved corrections sent to Engineering and monitor code implementation progress.
        </p>
      </div>

      <div class="filter-bar-card">
        <div class="search-input-row">
          <div class="search-box-wrapper">
            <svg class="search-box-icon" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="11" cy="11" r="8"></circle><line x1="21" y1="21" x2="16.65" y2="16.65"></line></svg>
            <input
              type="text"
              id="trackReadySearchInput"
              class="search-box-input"
              placeholder="Search ready engineering fixes by code, message, or trigger..."
              value="${escapeHtml(AppState.trackReadySearch)}"
              oninput="handleTrackReadySearchInput(this.value)"
              autocomplete="off"
            />
          </div>

          <div class="filters-row">
            <select class="filter-select" onchange="handleTrackReadyStatus(this.value)">
              <option value="ready_for_engineering" ${AppState.trackReadyStatus === 'ready_for_engineering' ? 'selected' : ''}>Ready for Engineering</option>
              <option value="implemented" ${AppState.trackReadyStatus === 'implemented' ? 'selected' : ''}>Implemented in Code</option>
              <option value="All" ${AppState.trackReadyStatus === 'All' ? 'selected' : ''}>All Approved & Implemented</option>
            </select>

            <select class="filter-select" onchange="handleTrackReadyService(this.value)">
              <option value="All" ${AppState.trackReadyService === 'All' ? 'selected' : ''}>All Services</option>
              ${SERVICES.map(function(s) {
                return `<option value="${escapeHtml(s)}" ${AppState.trackReadyService === s ? 'selected' : ''}>${escapeHtml(s)}</option>`;
              }).join("")}
            </select>
          </div>
        </div>

        <div style="font-size:0.8rem;color:var(--text-muted);">
          <span id="trackReadyCounter">Records: <strong>${filtered.length}</strong></span>
        </div>
      </div>

      <div class="table-card">
        <div class="table-responsive">
          <table class="data-table">
            <thead>
              <tr>
                <th style="width:95px;">Error Code</th>
                <th style="width:110px;">Service</th>
                <th style="width:140px;">Status</th>
                <th style="width:26%;">Corrected Arabic Copy</th>
                <th style="width:26%;">Corrected English Copy</th>
                <th style="width:26%;">Approved Diagnostic Trigger</th>
                <th style="width:115px;text-align:right;">Action</th>
              </tr>
            </thead>
            <tbody id="trackReadyTableBody">
              ${renderTrackingReadyTableRows(filtered)}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  `;

  return html;
}

function handleTrackReadySearchInput(val) {
  AppState.trackReadySearch = val;
  var filtered = getFilteredTrackingReady();
  var tbody = document.getElementById("trackReadyTableBody");
  if (tbody) tbody.innerHTML = renderTrackingReadyTableRows(filtered);
  var counter = document.getElementById("trackReadyCounter");
  if (counter) counter.innerHTML = "Records: <strong>" + filtered.length + "</strong>";
}
function handleTrackReadyStatus(val) {
  AppState.trackReadyStatus = val;
  renderApp();
}
function handleTrackReadyService(val) {
  AppState.trackReadyService = val;
  renderApp();
}

// ==========================================================================
// 7. Product POV — Error Review Page (Editable Product Response, No Source Ref, Side-by-side Diffs)
// ==========================================================================

function renderErrorReviewPage() {
  var record = errorStore.getById(AppState.activeErrorId) || errorStore.getAll()[0];
  if (!record) {
    return `<div style="text-align:center;padding:3rem;"><h3>Error not found</h3><button type="button" class="btn btn-primary" onclick="setProductTab('queue')">Back to Queue</button></div>`;
  }

  var form = AppState.reviewForm;
  var isArChanged = (form.correctedAr || "").trim() !== (record.originalArMessage || "").trim();
  var isEnChanged = (form.correctedEn || "").trim() !== (record.originalEnMessage || "").trim();

  // Navigation within current queue
  var allRecords = errorStore.getAll();
  var currentIndex = allRecords.findIndex(function(r) { return r.id === record.id; });
  var prevRecord = currentIndex > 0 ? allRecords[currentIndex - 1] : null;
  var nextRecord = currentIndex < allRecords.length - 1 ? allRecords[currentIndex + 1] : null;

  return `
    <div style="display:flex;flex-direction:column;gap:1.15rem;max-width:1100px;margin:0 auto;width:100%;">
      <!-- Header Bar (No Source Ref) -->
      <div class="review-page-header">
        <div class="review-meta-group">
          <span class="code-badge" style="font-size:1rem;padding:0.25rem 0.65rem;">${escapeHtml(record.errorCode)}</span>
          <span class="service-badge">${escapeHtml(record.service)}</span>
          ${renderStatusBadge(record.status)}
        </div>

        <div style="display:flex;align-items:center;gap:0.4rem;">
          <button type="button" class="btn btn-secondary btn-sm" ${!prevRecord ? 'disabled' : ''} onclick="${prevRecord ? `openReviewPage('${prevRecord.id}', '${AppState.returnTab}')` : ''}">
            &larr; Prev
          </button>
          <span style="font-size:0.75rem;color:var(--text-muted);padding:0 0.25rem;">
            ${currentIndex + 1} of ${allRecords.length}
          </span>
          <button type="button" class="btn btn-secondary btn-sm" ${!nextRecord ? 'disabled' : ''} onclick="${nextRecord ? `openReviewPage('${nextRecord.id}', '${AppState.returnTab}')` : ''}">
            Next &rarr;
          </button>
          <button type="button" class="btn btn-outline btn-sm" onclick="setProductTab('${AppState.returnTab}')" style="margin-left:0.4rem;">
            &larr; Back
          </button>
        </div>
      </div>

      <!-- Customer Support Feedback & Product Response Section -->
      ${record.customerSupportComment ? `
        <div class="cs-request-card">
          <div style="display:flex;align-items:center;justify-content:space-between;flex-wrap:wrap;gap:0.4rem;">
            <div style="display:flex;align-items:center;gap:0.4rem;">
              <span style="font-size:0.7rem;font-weight:800;text-transform:uppercase;color:#92400e;background:#fde68a;padding:0.1rem 0.45rem;border-radius:3px;">Customer Care Request</span>
              <span style="font-size:0.8rem;font-weight:700;color:#92400e;">Requested Field: ${escapeHtml(record.requestedField || "Both Arabic and English Messages")}</span>
            </div>
            <div>
              <span style="font-size:0.75rem;color:#78350f;">Current Status: <strong>${formatStatusLabel(record.status)}</strong></span>
            </div>
          </div>
          
          <div>
            <label style="font-size:0.72rem;font-weight:700;text-transform:uppercase;color:#92400e;display:block;margin-bottom:0.2rem;">Customer Care Comment (Read-Only)</label>
            <div style="background:#ffffff;border:1px solid #fde68a;padding:0.5rem 0.75rem;border-radius:var(--radius-sm);font-size:0.85rem;color:#78350f;font-style:italic;">
              "${escapeHtml(record.customerSupportComment)}"
            </div>
          </div>

          <div>
            <label style="font-size:0.72rem;font-weight:700;text-transform:uppercase;color:#1e3a8a;display:block;margin-bottom:0.2rem;">Product Response (Editable by Product)</label>
            <textarea
              class="editable-textarea"
              rows="2"
              placeholder="Write a response or clarification to Customer Care regarding this error request..."
              oninput="AppState.productResponseInput = this.value"
              style="border-color:#bfdbfe;"
            >${escapeHtml(AppState.productResponseInput)}</textarea>
            <div style="display:flex;justify-content:flex-end;gap:0.5rem;margin-top:0.4rem;">
              <button type="button" class="btn btn-secondary btn-sm" onclick="handleCancelProductResponse('${record.id}')">Cancel</button>
              <button type="button" class="btn btn-primary btn-sm" onclick="handleSaveProductResponse('${record.id}')">Save Response</button>
            </div>
          </div>
        </div>
      ` : ''}

      <!-- Validation Error Alert Banner -->
      ${form.validationErrors.length > 0 ? `
        <div class="validation-alert-box">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"></circle><line x1="12" y1="8" x2="12" y2="12"></line><line x1="12" y1="16" x2="12.01" y2="16"></line></svg>
          <div>
            <strong>Ready for Engineering Blocked:</strong> All 5 fields below must contain values before approving:
            <ul style="padding-left:1.15rem;margin-top:0.2rem;font-size:0.78rem;">
              ${form.validationErrors.map(function(err) { return `<li>${escapeHtml(err)}</li>`; }).join("")}
            </ul>
          </div>
        </div>
      ` : ''}

      <!-- Arabic Message Side-by-Side Comparison -->
      <div class="diff-comparison-grid">
        <div class="diff-card original-card">
          <div class="diff-card-header">
            <span class="diff-card-title">Original Arabic Message (Immutable)</span>
            <span style="font-size:0.7rem;color:var(--text-muted);">Read-Only</span>
          </div>
          <div class="read-only-msg-box arabic">${escapeHtml(record.originalArMessage)}</div>
        </div>

        <div class="diff-card corrected-card">
          <div class="diff-card-header">
            <span class="diff-card-title">
              Corrected Arabic Message (Product) <span style="color:#dc2626;">*</span>
            </span>
            <div style="display:flex;align-items:center;gap:0.4rem;">
              ${isArChanged ? `
                <button type="button" class="btn btn-secondary btn-sm" onclick="handleResetAr('${record.id}')" title="Revert to original Arabic">Reset</button>
              ` : ''}
            </div>
          </div>
          <textarea
            class="editable-textarea arabic"
            rows="2"
            placeholder="أدخل نص رسالة الخطأ المصححة باللغة العربية..."
            oninput="AppState.reviewForm.correctedAr = this.value"
          >${escapeHtml(form.correctedAr)}</textarea>
        </div>
      </div>

      <!-- English Message Side-by-Side Comparison -->
      <div class="diff-comparison-grid">
        <div class="diff-card original-card">
          <div class="diff-card-header">
            <span class="diff-card-title">Original English Message (Immutable)</span>
            <span style="font-size:0.7rem;color:var(--text-muted);">Read-Only</span>
          </div>
          <div class="read-only-msg-box">${escapeHtml(record.originalEnMessage)}</div>
        </div>

        <div class="diff-card corrected-card">
          <div class="diff-card-header">
            <span class="diff-card-title">
              Corrected English Message (Product) <span style="color:#dc2626;">*</span>
            </span>
            <div style="display:flex;align-items:center;gap:0.4rem;">
              ${isEnChanged ? `
                <button type="button" class="btn btn-secondary btn-sm" onclick="handleResetEn('${record.id}')" title="Revert to original English">Reset</button>
              ` : ''}
            </div>
          </div>
          <textarea
            class="editable-textarea"
            rows="2"
            placeholder="Enter corrected English error message..."
            oninput="AppState.reviewForm.correctedEn = this.value"
          >${escapeHtml(form.correctedEn)}</textarea>
        </div>
      </div>

      <!-- Operational Information (AI Trigger, Approved Trigger, Meaning, Care Action) -->
      <div class="operational-info-card">
        <h3 style="font-size:0.95rem;font-weight:700;border-bottom:1px solid var(--border-subtle);padding-bottom:0.45rem;">
          Operational Diagnostics & Customer Support Information
        </h3>

        <div style="display:grid;grid-template-columns:1fr 1fr;gap:1rem;">
          <div>
            <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:0.25rem;">
              <label style="font-size:0.75rem;font-weight:700;text-transform:uppercase;color:var(--text-muted);">AI-Suggested Trigger</label>
              <span style="font-size:0.65rem;font-weight:700;color:#6366f1;background-color:#e0e7ff;padding:0.1rem 0.4rem;border-radius:3px;">Mock Extracted</span>
            </div>
            <div class="read-only-msg-box" style="font-size:0.825rem;min-height:48px;">${escapeHtml(record.aiSuggestedTrigger || "No AI suggestion recorded.")}</div>
          </div>

          <div>
            <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:0.25rem;">
              <label style="font-size:0.75rem;font-weight:700;text-transform:uppercase;color:var(--text-secondary);">Approved Diagnostic Trigger <span style="color:#dc2626;">*</span></label>
              <span style="font-size:0.65rem;font-weight:700;color:#166534;background-color:#dcfce7;padding:0.1rem 0.4rem;border-radius:3px;">Editable</span>
            </div>
            <textarea
              class="editable-textarea"
              rows="2"
              placeholder="Define exact trigger condition in code..."
              style="min-height:48px;"
              oninput="AppState.reviewForm.approvedTrigger = this.value"
            >${escapeHtml(form.approvedTrigger)}</textarea>
          </div>
        </div>

        <div>
          <label style="font-size:0.75rem;font-weight:700;text-transform:uppercase;color:var(--text-secondary);display:block;margin-bottom:0.25rem;">Meaning <span style="color:#dc2626;">*</span></label>
          <textarea
            class="editable-textarea"
            rows="2"
            placeholder="Explain functional meaning..."
            oninput="AppState.reviewForm.meaning = this.value"
          >${escapeHtml(form.meaning)}</textarea>
        </div>

        <div>
          <label style="font-size:0.75rem;font-weight:700;text-transform:uppercase;color:var(--text-secondary);display:block;margin-bottom:0.25rem;">Recommended Customer Support Action <span style="color:#dc2626;">*</span></label>
          <textarea
            class="editable-textarea"
            rows="2"
            placeholder="Instructions for Customer Support..."
            style="border-left:3.5px solid #059669;"
            oninput="AppState.reviewForm.supportAction = this.value"
          >${escapeHtml(form.supportAction)}</textarea>
        </div>
      </div>

      <!-- Sticky Review Actions Bar -->
      <div class="review-actions-bar">
        <button type="button" class="btn btn-secondary btn-sm" onclick="handleResetAllUnsaved('${record.id}')">Reset Unsaved Changes</button>

        <div style="display:flex;align-items:center;gap:0.5rem;flex-wrap:wrap;">
          <button type="button" class="btn btn-outline btn-sm" onclick="handleSaveDraft('${record.id}')">Save Draft</button>
          <button type="button" class="btn btn-secondary btn-sm" onclick="handleSetInReview('${record.id}')">Set In Review</button>
          <button type="button" class="btn btn-primary btn-sm" onclick="handleSetReadyForEngineering('${record.id}')">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="9 11 12 14 22 4"></polyline></svg>
            Approve: Ready for Engineering
          </button>
          ${record.status === 'ready_for_engineering' ? `
            <button type="button" class="btn btn-success btn-sm" onclick="openMarkApprovedModal('${record.id}')" title="Confirm Engineering implementation">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="20 6 9 17 4 12"></polyline></svg>
              Mark as Approved
            </button>
          ` : ''}
          ${record.status === 'approved' ? `
            <button type="button" class="btn btn-secondary btn-sm" onclick="handleReturnToReady('${record.id}')" title="Return to Ready for Engineering for further review">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="1 4 1 10 7 10"></polyline><path d="M3.51 15a9 9 0 1 0 2.13-9.36L1 10"></path></svg>
              Return to Ready for Engineering
            </button>
          ` : ''}
        </div>
      </div>
    </div>
  `;
}

function handleSaveProductResponse(id) {
  var record = errorStore.getById(id);
  if (!record) return;
  errorStore.updateProductResponse(id, AppState.productResponseInput);
  renderApp();
  showToast("Product response saved successfully.", "success");
}

function handleCancelProductResponse(id) {
  var record = errorStore.getById(id);
  if (record) {
    AppState.productResponseInput = record.productResponse || "";
    renderApp();
    showToast("Discarded unsaved Product response changes.", "warning");
  }
}

function handleResetAr(id) {
  var record = errorStore.getById(id);
  if (record) {
    AppState.reviewForm.correctedAr = record.originalArMessage;
    renderApp();
    showToast("Reset Arabic message to original copy.", "warning");
  }
}
function handleResetEn(id) {
  var record = errorStore.getById(id);
  if (record) {
    AppState.reviewForm.correctedEn = record.originalEnMessage;
    renderApp();
    showToast("Reset English message to original copy.", "warning");
  }
}
function handleResetAllUnsaved(id) {
  var record = errorStore.getById(id);
  if (record) {
    AppState.reviewForm = {
      correctedAr: record.correctedArMessage || "",
      correctedEn: record.correctedEnMessage || "",
      approvedTrigger: record.approvedTrigger || "",
      meaning: record.meaning || "",
      supportAction: record.customerSupportAction || "",
      validationErrors: []
    };
    AppState.productResponseInput = record.productResponse || "";
    renderApp();
    showToast("Reset unsaved changes to stored record.", "warning");
  }
}
function handleSaveDraft(id) {
  var form = AppState.reviewForm;
  var record = errorStore.getById(id);
  var nextStatus = record.status === "not_reviewed" ? "in_review" : record.status;
  errorStore.updateRecord(id, {
    correctedArMessage: form.correctedAr,
    correctedEnMessage: form.correctedEn,
    approvedTrigger: form.approvedTrigger,
    meaning: form.meaning,
    customerSupportAction: form.supportAction,
    status: nextStatus
  });
  AppState.reviewForm.validationErrors = [];
  renderApp();
  showToast("Draft saved for " + record.errorCode + ".");
}
function handleSetInReview(id) {
  var form = AppState.reviewForm;
  var record = errorStore.getById(id);
  errorStore.updateRecord(id, {
    correctedArMessage: form.correctedAr,
    correctedEnMessage: form.correctedEn,
    approvedTrigger: form.approvedTrigger,
    meaning: form.meaning,
    customerSupportAction: form.supportAction,
    status: "in_review"
  });
  AppState.reviewForm.validationErrors = [];
  renderApp();
  showToast(record.errorCode + " status updated to In Review.");
}
function handleSetReadyForEngineering(id) {
  var form = AppState.reviewForm;
  var record = errorStore.getById(id);
  var errors = [];

  if (!form.correctedAr || !form.correctedAr.trim()) errors.push("Corrected Arabic Message is required.");
  if (!form.correctedEn || !form.correctedEn.trim()) errors.push("Corrected English Message is required.");
  if (!form.approvedTrigger || !form.approvedTrigger.trim()) errors.push("Approved Diagnostic Trigger is required.");
  if (!form.meaning || !form.meaning.trim()) errors.push("Meaning is required.");
  if (!form.supportAction || !form.supportAction.trim()) errors.push("Recommended Customer Support Action is required.");

  if (errors.length > 0) {
    AppState.reviewForm.validationErrors = errors;
    renderApp();
    showToast("Cannot move to Ready for Engineering: 5 required fields must be completed.", "error");
    return;
  }

  errorStore.updateRecord(id, {
    correctedArMessage: form.correctedAr,
    correctedEnMessage: form.correctedEn,
    approvedTrigger: form.approvedTrigger,
    meaning: form.meaning,
    customerSupportAction: form.supportAction,
    status: "ready_for_engineering"
  });
  AppState.reviewForm.validationErrors = [];
  renderApp();
  showToast("Approved! " + record.errorCode + " is now Ready for Engineering.", "success");
}

function openMarkApprovedModal(id) {
  AppState.approveModalErrorId = id;
  renderApp();
}

function closeMarkApprovedModal() {
  AppState.approveModalErrorId = null;
  renderApp();
}

function handleConfirmApproved() {
  var id = AppState.approveModalErrorId;
  var updated = errorStore.markApproved(id);
  if (updated) {
    closeMarkApprovedModal();
    showToast(updated.errorCode + " marked as Approved and live copy updated for Customer Support.", "success");
  }
}

function handleReturnToReady(id) {
  var updated = errorStore.returnToReady(id);
  if (updated) {
    renderApp();
    showToast(updated.errorCode + " returned to Ready for Engineering. Last live copy preserved for Customer Support.", "warning");
  }
}

// ==========================================================================
// 8. Customer Support POV Views (Live Messages Only, Compact Details, Save/Cancel Operational)
// ==========================================================================

function renderSupportHomePage() {
  var allRecords = errorStore.getAll();
  var recents = errorStore.getRecentlyViewedRecords().slice(0, 6);
  var saved = errorStore.getSavedRecords();

  return `
    <div style="display:flex;flex-direction:column;gap:1.25rem;max-width:960px;margin:0 auto;width:100%;">
      <!-- Search Hero -->
      <div style="background:#ffffff;padding:1.5rem;border-radius:var(--radius-lg);border:1px solid var(--border-subtle);box-shadow:var(--shadow-xs);text-align:center;">
        <h2 style="font-size:1.5rem;font-weight:800;color:var(--navy-dark);margin-bottom:0.3rem;">
          Customer Care Error Guide
        </h2>
        <p style="font-size:0.875rem;color:var(--text-secondary);margin-bottom:1.15rem;">
          Search active application errors to find diagnostic triggers and exact resolution actions.
        </p>

        <div style="position:relative;max-width:640px;margin:0 auto;">
          <div style="display:flex;align-items:center;position:relative;">
            <svg style="position:absolute;left:1rem;color:var(--text-muted);" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="11" cy="11" r="8"></circle><line x1="21" y1="21" x2="16.65" y2="16.65"></line></svg>
            <input
              type="text"
              id="supportHomeSearchInput"
              class="search-box-input"
              style="padding:0.75rem 2.5rem 0.75rem 2.8rem;font-size:0.95rem;border-radius:var(--radius-md);"
              placeholder="Search by code (e.g. AUTH_009, 009) or error message keywords..."
              value="${escapeHtml(AppState.supportHomeSearch || '')}"
              oninput="handleSupportHomeSearchInput(this.value)"
              autocomplete="off"
            />
          </div>

          <div id="supportHomeSuggestions"></div>
        </div>

        <div style="margin-top:0.85rem;display:flex;align-items:center;justify-content:center;gap:0.5rem;font-size:0.8rem;color:var(--text-muted);">
          <span>Total Application Errors: <strong>${allRecords.length}</strong></span>
          <span>&bull;</span>
          <button type="button" style="background:none;border:none;color:var(--support-primary);cursor:pointer;font-weight:700;" onclick="setSupportTab('all-errors')">
            Browse All Errors &rarr;
          </button>
        </div>
      </div>

      <!-- Panels Grid: Recently Viewed & Saved Errors -->
      <div style="display:grid;grid-template-columns:1fr 1fr;gap:1rem;">
        <div style="background:#ffffff;padding:1rem 1.15rem;border-radius:var(--radius-md);border:1px solid var(--border-subtle);display:flex;flex-direction:column;gap:0.5rem;">
          <h3 style="font-size:0.85rem;font-weight:700;display:flex;align-items:center;gap:0.35rem;">
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"></circle><polyline points="12 6 12 12 16 14"></polyline></svg>
            Recently Viewed
          </h3>
          ${recents.length === 0 ? `
            <p style="font-size:0.78rem;color:var(--text-muted);font-style:italic;padding:0.5rem 0;">Your recently opened error guides will appear here.</p>
          ` : `
            <div style="display:flex;flex-wrap:wrap;gap:0.4rem;">
              ${recents.map(function(r) {
                return `<button type="button" class="code-badge" style="cursor:pointer;border:1px solid var(--border-strong);" onclick="openSupportDetails('${r.id}', 'home')">${escapeHtml(r.errorCode)}</button>`;
              }).join("")}
            </div>
          `}
        </div>

        <div style="background:#ffffff;padding:1rem 1.15rem;border-radius:var(--radius-md);border:1px solid var(--border-subtle);display:flex;flex-direction:column;gap:0.5rem;">
          <h3 style="font-size:0.85rem;font-weight:700;display:flex;align-items:center;gap:0.35rem;">
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z"></path></svg>
            Saved Bookmarks (${saved.length})
          </h3>
          ${saved.length === 0 ? `
            <p style="font-size:0.78rem;color:var(--text-muted);font-style:italic;padding:0.5rem 0;">No saved errors. Bookmark frequently referenced codes.</p>
          ` : `
            <div style="display:flex;flex-wrap:wrap;gap:0.4rem;">
              ${saved.map(function(r) {
                return `<button type="button" class="code-badge" style="cursor:pointer;border:1px solid var(--border-strong);" onclick="openSupportDetails('${r.id}', 'home')">${escapeHtml(r.errorCode)}</button>`;
              }).join("")}
            </div>
          `}
        </div>
      </div>

      <!-- Browse by Service Domain -->
      <div style="background:#ffffff;padding:1rem 1.15rem;border-radius:var(--radius-md);border:1px solid var(--border-subtle);">
        <h3 style="font-size:0.85rem;font-weight:700;margin-bottom:0.65rem;">Browse by Service Domain</h3>
        <div style="display:flex;flex-wrap:wrap;gap:0.4rem;">
          ${SERVICES.map(function(s) {
            var count = allRecords.filter(function(r) { return r.service === s; }).length;
            return `
              <button type="button" class="btn btn-outline btn-sm" onclick="handleSupportBrowseService('${escapeHtml(s)}')">
                ${escapeHtml(s)} (${count})
              </button>
            `;
          }).join("")}
        </div>
      </div>
    </div>
  `;
}

function handleSupportHomeSearchInput(val) {
  AppState.supportHomeSearch = val;
  var container = document.getElementById("supportHomeSuggestions");
  if (!container) return;

  if (!val.trim()) {
    container.innerHTML = "";
    return;
  }

  var q = val.trim().toUpperCase();
  var cleanQ = q.replace(/[^A-Z0-9]/g, "");
  var records = errorStore.getAll();

  var matches = records.filter(function(r) {
    var codeMatch = r.errorCode.toUpperCase().indexOf(q) !== -1 || (cleanQ && r.errorCode.replace(/[^A-Z0-9]/g, "").indexOf(cleanQ) !== -1);
    var meaningMatch = (r.meaning || "").toUpperCase().indexOf(q) !== -1;
    var enMsg = r.currentEnMessage || (r.status === "approved" ? r.correctedEnMessage : r.originalEnMessage) || "";
    var arMsg = r.currentArMessage || (r.status === "approved" ? r.correctedArMessage : r.originalArMessage) || "";
    var enMatch = enMsg.toUpperCase().indexOf(q) !== -1;
    var arMatch = arMsg.indexOf(val.trim()) !== -1;
    return codeMatch || meaningMatch || enMatch || arMatch;
  });

  if (matches.length === 0) {
    container.innerHTML = '<div style="position:absolute;top:calc(100% + 4px);left:0;right:0;background:#ffffff;border:1px solid var(--border-strong);border-radius:var(--radius-sm);box-shadow:var(--shadow-md);padding:0.75rem;z-index:100;color:var(--text-muted);font-size:0.85rem;">No matching errors found.</div>';
    return;
  }

  var html = '<ul style="position:absolute;top:calc(100% + 4px);left:0;right:0;background:#ffffff;border:1px solid var(--border-strong);border-radius:var(--radius-sm);box-shadow:var(--shadow-lg);list-style:none;z-index:100;max-height:240px;overflow-y:auto;padding:0.3rem;text-align:left;">';
  matches.forEach(function(s) {
    var displayMsg = s.currentEnMessage || (s.status === "approved" ? s.correctedEnMessage : s.originalEnMessage) || s.meaning;
    html += `
      <li style="display:flex;align-items:center;justify-content:space-between;padding:0.55rem 0.75rem;border-radius:var(--radius-sm);cursor:pointer;gap:0.5rem;" onmouseenter="this.style.backgroundColor='var(--surface-highlight)'" onmouseleave="this.style.backgroundColor='transparent'" onclick="openSupportDetails('${s.id}', 'home')">
        <span class="code-badge">${escapeHtml(s.errorCode)}</span>
        <span style="font-size:0.825rem;color:var(--text-primary);flex:1;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;">${escapeHtml(s.meaning || displayMsg)}</span>
        <span class="service-badge">${escapeHtml(s.service)}</span>
      </li>
    `;
  });
  html += '</ul>';
  container.innerHTML = html;
}

function handleSupportBrowseService(serviceName) {
  AppState.supportService = serviceName;
  AppState.supportSearch = "";
  setSupportTab("all-errors");
}

// 9. Customer Support POV — All Errors Catalog View (Fits Desktop Width)
function getFilteredSupportCatalog() {
  var records = errorStore.getAll();
  var search = AppState.supportSearch.trim().toUpperCase();
  var cleanSearch = search.replace(/[^A-Z0-9]/g, "");
  var selectedService = AppState.supportService;

  return records.filter(function(r) {
    if (selectedService !== "All" && r.service !== selectedService) return false;
    if (search) {
      var itemCode = r.errorCode.toUpperCase();
      var cleanCode = itemCode.replace(/[^A-Z0-9]/g, "");
      var codeMatch = itemCode.indexOf(search) !== -1 || (cleanSearch && cleanCode.indexOf(cleanSearch) !== -1);
      var meaningMatch = (r.meaning || "").toUpperCase().indexOf(search) !== -1;
      var triggerMatch = (r.approvedTrigger || "").toUpperCase().indexOf(search) !== -1;
      var actionMatch = (r.customerSupportAction || "").toUpperCase().indexOf(search) !== -1;
      var enMsg = r.currentEnMessage || (r.status === "approved" ? r.correctedEnMessage : r.originalEnMessage) || "";
      var arMsg = r.currentArMessage || (r.status === "approved" ? r.correctedArMessage : r.originalArMessage) || "";
      var enMatch = enMsg.toUpperCase().indexOf(search) !== -1;
      var arMatch = arMsg.indexOf(AppState.supportSearch.trim()) !== -1;

      return codeMatch || meaningMatch || triggerMatch || actionMatch || enMatch || arMatch;
    }
    return true;
  });
}

function renderSupportCatalogTableRows(filtered) {
  if (filtered.length === 0) {
    return '<tr><td colspan="6" style="text-align:center;padding:2.5rem;color:var(--text-muted);">No error records found matching search.</td></tr>';
  }

  return filtered.map(function(r) {
    return `
      <tr onclick="openSupportDetails('${r.id}', 'all-errors')" style="cursor:pointer;">
        <td><span class="code-badge">${escapeHtml(r.errorCode)}</span></td>
        <td style="font-weight:600;"><div class="cell-clamp" title="${escapeHtml(r.meaning || "—")}">${escapeHtml(r.meaning || "—")}</div></td>
        <td style="color:var(--text-secondary);"><div class="cell-clamp" title="${escapeHtml(r.approvedTrigger || "—")}">${escapeHtml(r.approvedTrigger || "—")}</div></td>
        <td>
          <div style="color:#065f46;background-color:#f0fdf4;padding:0.35rem 0.55rem;border-radius:var(--radius-sm);border-left:3px solid #10b981;font-size:0.775rem;line-height:1.4;" title="${escapeHtml(r.customerSupportAction || "Follow standard troubleshooting protocols.")}">
            <div class="cell-clamp" style="color:#065f46;">${escapeHtml(r.customerSupportAction || "Follow standard troubleshooting protocols.")}</div>
          </div>
        </td>
        <td><span class="service-badge">${escapeHtml(r.service)}</span></td>
        <td style="text-align:center;" onclick="event.stopPropagation()">
          <button type="button" class="support-save-btn ${r.saved ? 'saved' : 'unsaved'}" onclick="handleSupportToggleSave('${r.id}', '${escapeHtml(r.errorCode)}')">
            ${r.saved ? '★ Saved' : '☆ Save'}
          </button>
        </td>
      </tr>
    `;
  }).join("");
}

function renderSupportCatalogPage() {
  var records = errorStore.getAll();
  var filtered = getFilteredSupportCatalog();

  return `
    <div style="display:flex;flex-direction:column;gap:1.15rem;">
      <div>
        <h2 style="font-size:1.35rem;font-weight:800;color:var(--navy-dark);">Customer Care Error Catalog</h2>
        <p style="font-size:0.85rem;color:var(--text-secondary);">
          Official support reference guide containing verified error meanings, diagnostic triggers, and customer care actions.
        </p>
      </div>

      <div class="filter-bar-card">
        <div class="search-input-row">
          <div class="search-box-wrapper">
            <svg class="search-box-icon" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="11" cy="11" r="8"></circle><line x1="21" y1="21" x2="16.65" y2="16.65"></line></svg>
            <input
              type="text"
              id="supportCatalogSearchInput"
              class="search-box-input"
              placeholder="Search by code, meaning, diagnostic trigger, or support action..."
              value="${escapeHtml(AppState.supportSearch)}"
              oninput="handleSupportCatalogSearchInput(this.value)"
              autocomplete="off"
            />
          </div>

          <div class="filters-row">
            <select class="filter-select" onchange="handleSupportCatalogService(this.value)">
              <option value="All" ${AppState.supportService === 'All' ? 'selected' : ''}>All Services (${records.length})</option>
              ${SERVICES.map(function(s) {
                return `<option value="${escapeHtml(s)}" ${AppState.supportService === s ? 'selected' : ''}>${escapeHtml(s)}</option>`;
              }).join("")}
            </select>
          </div>
        </div>

        <div style="font-size:0.8rem;color:var(--text-muted);">
          <span id="supportCatalogCounter">Showing <strong>${filtered.length}</strong> of ${records.length} errors</span>
        </div>
      </div>

      <div class="table-card">
        <div class="table-responsive">
          <table class="data-table">
            <thead>
              <tr>
                <th style="width:95px;">Error Code</th>
                <th style="width:22%;">Meaning</th>
                <th style="width:26%;">Diagnostic Trigger</th>
                <th style="width:36%;">Recommended Support Action</th>
                <th style="width:110px;">Service</th>
                <th style="width:75px;text-align:center;">Save</th>
              </tr>
            </thead>
            <tbody id="supportCatalogTableBody">
              ${renderSupportCatalogTableRows(filtered)}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  `;
}

function handleSupportCatalogSearchInput(val) {
  AppState.supportSearch = val;
  var filtered = getFilteredSupportCatalog();
  var tbody = document.getElementById("supportCatalogTableBody");
  if (tbody) tbody.innerHTML = renderSupportCatalogTableRows(filtered);
  var counter = document.getElementById("supportCatalogCounter");
  if (counter) counter.innerHTML = "Showing <strong>" + filtered.length + "</strong> of " + errorStore.getAll().length + " errors";
}
function handleSupportCatalogService(val) {
  AppState.supportService = val;
  renderApp();
}
function handleSupportToggleSave(id, code) {
  var isSaved = errorStore.toggleSaved(id);
  renderApp();
  showToast(isSaved ? code + " saved to bookmarks." : code + " removed from bookmarks.");
}

// 10. Customer Support POV — Error Details View (Save Operational Guidance & Cancel, Live Messages Only)
function renderSupportDetailsPage() {
  var record = errorStore.getById(AppState.activeErrorId) || errorStore.getAll()[0];
  if (!record) {
    return `<div style="text-align:center;padding:3rem;"><h3>Error not found</h3><button type="button" class="btn btn-primary" onclick="setSupportTab('all-errors')">Back</button></div>`;
  }

  // Live messages use normalized current messages:
  var liveArMessage = record.currentArMessage || (record.status === "approved" ? record.correctedArMessage : record.originalArMessage);
  var liveEnMessage = record.currentEnMessage || (record.status === "approved" ? record.correctedEnMessage : record.originalEnMessage);

  var isOpChanged = isCSOperationalChanged();

  return `
    <div style="display:flex;flex-direction:column;gap:1.15rem;max-width:880px;margin:0 auto;width:100%;">
      <!-- Compact Header Card -->
      <div style="background:#ffffff;padding:0.85rem 1.15rem;border-radius:var(--radius-md);border:1px solid var(--border-subtle);display:flex;justify-content:space-between;align-items:center;flex-wrap:wrap;gap:0.75rem;">
        <div style="display:flex;align-items:center;gap:0.65rem;">
          <span class="code-badge" style="font-size:1.05rem;padding:0.25rem 0.65rem;">${escapeHtml(record.errorCode)}</span>
          <span class="service-badge">${escapeHtml(record.service)}</span>
        </div>
        <div style="display:flex;align-items:center;gap:0.4rem;flex-wrap:wrap;">
          <button type="button" class="btn btn-warning btn-sm" onclick="openCSRequestModal('${record.id}')">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path></svg>
            Request Message Change
          </button>
          <button type="button" class="support-save-btn ${record.saved ? 'saved' : 'unsaved'}" onclick="handleSupportToggleSave('${record.id}', '${escapeHtml(record.errorCode)}')">
            ${record.saved ? '★ Saved' : '☆ Save Error'}
          </button>
          <button type="button" class="btn btn-outline btn-sm" onclick="handleSupportBackNavigation()">
            &larr; Back
          </button>
        </div>
      </div>

      <!-- Feedback Request Card (If request exists) -->
      ${record.customerSupportComment ? `
        <div class="cs-request-card">
          <div style="display:flex;align-items:center;justify-content:space-between;flex-wrap:wrap;gap:0.4rem;">
            <div style="display:flex;align-items:center;gap:0.4rem;">
              <span style="font-size:0.7rem;font-weight:800;text-transform:uppercase;color:#92400e;background:#fde68a;padding:0.1rem 0.45rem;border-radius:3px;">Your Submitted Request</span>
              <span style="font-size:0.8rem;font-weight:700;color:#92400e;">Requested Field: ${escapeHtml(record.requestedField || "Both Arabic and English Messages")}</span>
            </div>
            <div>
              <span style="font-size:0.75rem;color:#78350f;">Current Status: <strong>${formatStatusLabel(record.status)}</strong></span>
            </div>
          </div>
          <div style="font-size:0.825rem;color:#78350f;font-style:italic;">
            "${escapeHtml(record.customerSupportComment)}"
          </div>
          <div style="background:#ffffff;padding:0.55rem 0.75rem;border-radius:var(--radius-sm);border:1px solid #fde68a;font-size:0.825rem;">
            <span style="font-size:0.7rem;font-weight:700;text-transform:uppercase;color:var(--brand-primary);display:block;margin-bottom:0.15rem;">Product Response:</span>
            ${record.productResponse ? `<span style="color:var(--text-primary);font-weight:600;">${escapeHtml(record.productResponse)}</span>` : '<span style="color:var(--text-muted);font-style:italic;">No response yet</span>'}
          </div>
        </div>
      ` : ''}

      <!-- Live User-Facing Messages Card (Compact, Side-by-Side) -->
      <div style="background:#ffffff;padding:1rem 1.15rem;border-radius:var(--radius-md);border:1px solid var(--border-subtle);display:flex;flex-direction:column;gap:0.65rem;">
        <div style="display:flex;align-items:center;justify-content:space-between;">
          <h3 style="font-size:0.85rem;font-weight:700;color:var(--text-secondary);text-transform:uppercase;letter-spacing:0.04em;">
            Current Live Application Messages
          </h3>
          <span style="font-size:0.7rem;color:var(--text-muted);background:#f1f5f9;padding:0.15rem 0.45rem;border-radius:3px;">
            ${record.status === 'approved' ? '✓ Approved Production Copy' : 'Current Production Baseline Copy'}
          </span>
        </div>

        <div style="display:grid;grid-template-columns:1fr 1fr;gap:0.75rem;">
          <div>
            <span style="font-size:0.72rem;font-weight:700;color:var(--text-muted);display:block;margin-bottom:0.2rem;">Arabic Message (Read-Only)</span>
            <div class="read-only-msg-box arabic" style="min-height:48px;padding:0.55rem 0.75rem;font-size:0.9rem;">${escapeHtml(liveArMessage)}</div>
          </div>
          <div>
            <span style="font-size:0.72rem;font-weight:700;color:var(--text-muted);display:block;margin-bottom:0.2rem;">English Message (Read-Only)</span>
            <div class="read-only-msg-box" style="min-height:48px;padding:0.55rem 0.75rem;font-size:0.85rem;">${escapeHtml(liveEnMessage)}</div>
          </div>
        </div>
      </div>

      <!-- Operational Guidance (Compact, Editable by CS, ~2-3 Lines Default, Save & Cancel Actions) -->
      <div style="background:#ffffff;padding:1.15rem;border-radius:var(--radius-md);border:1px solid var(--border-subtle);display:flex;flex-direction:column;gap:0.85rem;">
        <div style="display:flex;align-items:center;justify-content:space-between;">
          <h3 style="font-size:0.85rem;font-weight:700;color:var(--text-secondary);text-transform:uppercase;letter-spacing:0.04em;">
            Operational Guidance (Editable by Support)
          </h3>
          <span style="font-size:0.7rem;color:#047857;background:#ecfdf5;padding:0.15rem 0.45rem;border-radius:3px;font-weight:600;">
            Support Team Editable
          </span>
        </div>

        <div>
          <label style="font-size:0.75rem;font-weight:700;text-transform:uppercase;color:var(--text-secondary);display:block;margin-bottom:0.25rem;">Meaning</label>
          <textarea
            class="editable-textarea"
            rows="2"
            id="csMeaningInput"
            style="min-height:48px;"
            placeholder="Functional meaning of this error..."
            oninput="AppState.csDetailsMeaning = this.value; updateCSDetailsButtons();"
          >${escapeHtml(AppState.csDetailsMeaning)}</textarea>
        </div>

        <div>
          <label style="font-size:0.75rem;font-weight:700;text-transform:uppercase;color:var(--text-secondary);display:block;margin-bottom:0.25rem;">Diagnostic Trigger</label>
          <textarea
            class="editable-textarea"
            rows="2"
            id="csTriggerInput"
            style="min-height:48px;"
            placeholder="Circumstances that trigger this error..."
            oninput="AppState.csDetailsTrigger = this.value; updateCSDetailsButtons();"
          >${escapeHtml(AppState.csDetailsTrigger)}</textarea>
        </div>

        <div>
          <label style="font-size:0.75rem;font-weight:800;color:#065f46;text-transform:uppercase;display:block;margin-bottom:0.25rem;">
            Recommended Customer Support Action
          </label>
          <textarea
            class="editable-textarea"
            rows="2"
            id="csActionInput"
            style="border-left:3.5px solid #059669;min-height:48px;"
            placeholder="Actionable steps for support agents to guide the customer..."
            oninput="AppState.csDetailsAction = this.value; updateCSDetailsButtons();"
          >${escapeHtml(AppState.csDetailsAction)}</textarea>
        </div>

        <!-- Clearly Visible Save & Cancel Actions -->
        <div style="display:flex;align-items:center;justify-content:flex-end;gap:0.65rem;margin-top:0.35rem;">
          <button
            type="button"
            id="btnCancelCSOp"
            class="btn btn-secondary"
            style="padding:0.48rem 1.15rem;font-size:0.825rem;"
            ${!isOpChanged ? 'disabled' : ''}
            onclick="handleCancelCSOperationalGuidance('${record.id}')"
          >
            Cancel
          </button>
          <button
            type="button"
            id="btnSaveCSOp"
            class="btn btn-success"
            style="padding:0.48rem 1.25rem;font-size:0.825rem;"
            ${!isOpChanged ? 'disabled' : ''}
            onclick="handleSaveCSOperationalGuidance('${record.id}')"
          >
            Save Operational Guidance
          </button>
        </div>
      </div>
    </div>
  `;
}

function updateCSDetailsButtons() {
  var isChanged = isCSOperationalChanged();
  var btnSave = document.getElementById("btnSaveCSOp");
  var btnCancel = document.getElementById("btnCancelCSOp");
  if (btnSave) btnSave.disabled = !isChanged;
  if (btnCancel) btnCancel.disabled = !isChanged;
}

function handleSupportBackNavigation() {
  if (isCSOperationalChanged()) {
    if (!confirm("You have unsaved operational guidance changes. Discard them?")) {
      return;
    }
  }
  setSupportTab(AppState.returnTab);
}

function handleSaveCSOperationalGuidance(id) {
  errorStore.updateOperationalFields(id, {
    meaning: AppState.csDetailsMeaning,
    approvedTrigger: AppState.csDetailsTrigger,
    customerSupportAction: AppState.csDetailsAction
  });
  AppState.csDetailsInitialMeaning = AppState.csDetailsMeaning;
  AppState.csDetailsInitialTrigger = AppState.csDetailsTrigger;
  AppState.csDetailsInitialAction = AppState.csDetailsAction;
  renderApp();
  showToast("Operational guidance saved successfully.", "success");
}

function handleCancelCSOperationalGuidance(id) {
  AppState.csDetailsMeaning = AppState.csDetailsInitialMeaning;
  AppState.csDetailsTrigger = AppState.csDetailsInitialTrigger;
  AppState.csDetailsAction = AppState.csDetailsInitialAction;
  renderApp();
  showToast("Discarded unsaved operational guidance changes.", "warning");
}

// 11. Customer Support POV — Saved Errors
function renderSupportSavedPage() {
  var saved = errorStore.getSavedRecords();

  return `
    <div style="display:flex;flex-direction:column;gap:1.15rem;">
      <div>
        <h2 style="font-size:1.35rem;font-weight:800;color:var(--navy-dark);">Saved Errors</h2>
        <p style="font-size:0.85rem;color:var(--text-secondary);">Your bookmarked error codes for rapid customer troubleshooting.</p>
      </div>

      <div class="table-card">
        <div class="table-responsive">
          <table class="data-table">
            <thead>
              <tr>
                <th style="width:95px;">Error Code</th>
                <th style="width:110px;">Service</th>
                <th style="width:32%;">Meaning</th>
                <th style="width:48%;">Recommended Customer Support Action</th>
                <th style="width:90px;text-align:right;">Actions</th>
              </tr>
            </thead>
            <tbody>
              ${saved.length === 0 ? `
                <tr><td colspan="5" style="text-align:center;padding:2.5rem;color:var(--text-muted);">You have no saved errors. Bookmark frequently referenced errors from the catalog.</td></tr>
              ` : saved.map(function(r) {
                return `
                  <tr onclick="openSupportDetails('${r.id}', 'saved')" style="cursor:pointer;">
                    <td><span class="code-badge">${escapeHtml(r.errorCode)}</span></td>
                    <td><span class="service-badge">${escapeHtml(r.service)}</span></td>
                    <td style="font-weight:600;"><div class="cell-clamp" title="${escapeHtml(r.meaning || "—")}">${escapeHtml(r.meaning || "—")}</div></td>
                    <td><div class="cell-clamp" title="${escapeHtml(r.customerSupportAction || "—")}">${escapeHtml(r.customerSupportAction || "—")}</div></td>
                    <td style="text-align:right;" onclick="event.stopPropagation()">
                      <button type="button" class="btn btn-secondary btn-sm" onclick="handleSupportToggleSave('${r.id}', '${escapeHtml(r.errorCode)}')">
                        Remove
                      </button>
                    </td>
                  </tr>
                `;
              }).join("")}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  `;
}

// 12. Customer Support POV — Track Requests (Displays Product Response, Fits Desktop)
function getFilteredSupportTrackRequests() {
  var records = errorStore.getAll();
  var requests = records.filter(function(r) {
    return !!r.customerSupportComment;
  });

  var search = AppState.supportTrackSearch.trim().toUpperCase();
  if (!search) return requests;

  return requests.filter(function(r) {
    return (
      r.errorCode.toUpperCase().indexOf(search) !== -1 ||
      (r.customerSupportComment || "").toUpperCase().indexOf(search) !== -1 ||
      (r.productResponse || "").toUpperCase().indexOf(search) !== -1
    );
  });
}

function renderSupportTrackTableRows(requests) {
  if (requests.length === 0) {
    return '<tr><td colspan="6" style="text-align:center;padding:2.5rem;color:var(--text-muted);">No submitted change requests found.</td></tr>';
  }

  return requests.map(function(r) {
    return `
      <tr>
        <td><span class="code-badge">${escapeHtml(r.errorCode)}</span></td>
        <td><span style="font-weight:600;font-size:0.775rem;color:var(--brand-primary);">${escapeHtml(r.requestedField || "Both Arabic and English Messages")}</span></td>
        <td>
          <div style="background:#fffbeb;border:1px solid #fde68a;padding:0.35rem 0.55rem;border-radius:var(--radius-sm);font-size:0.775rem;color:#92400e;" title="${escapeHtml(r.customerSupportComment)}">
            <div class="cell-clamp" style="color:#92400e;">"${escapeHtml(r.customerSupportComment)}"</div>
          </div>
        </td>
        <td>${renderStatusBadge(r.status)}</td>
        <td>
          <div class="cell-clamp" style="font-size:0.78rem;" title="${escapeHtml(r.productResponse || "No response yet")}">
            ${r.productResponse ? `<span style="font-weight:600;color:var(--brand-primary);">${escapeHtml(r.productResponse)}</span>` : '<span style="color:var(--text-muted);font-style:italic;">No response yet</span>'}
          </div>
        </td>
        <td style="text-align:right;">
          <button type="button" class="btn btn-outline btn-sm" onclick="openSupportDetails('${r.id}', 'track-requests')">
            Open &rarr;
          </button>
        </td>
      </tr>
    `;
  }).join("");
}

function renderSupportTrackRequestsPage() {
  var requests = getFilteredSupportTrackRequests();

  return `
    <div style="display:flex;flex-direction:column;gap:1.15rem;">
      <div>
        <h2 style="font-size:1.35rem;font-weight:800;color:var(--navy-dark);">Track Requests</h2>
        <p style="font-size:0.85rem;color:var(--text-secondary);">
          Monitor the shared lifecycle status of your message improvement requests and view replies from Product.
        </p>
      </div>

      <div class="filter-bar-card">
        <div class="search-input-row">
          <div class="search-box-wrapper">
            <svg class="search-box-icon" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="11" cy="11" r="8"></circle><line x1="21" y1="21" x2="16.65" y2="16.65"></line></svg>
            <input
              type="text"
              id="supportTrackSearchInput"
              class="search-box-input"
              placeholder="Search your submitted requests by code, comment, or product response..."
              value="${escapeHtml(AppState.supportTrackSearch)}"
              oninput="handleSupportTrackSearchInput(this.value)"
              autocomplete="off"
            />
          </div>
        </div>
      </div>

      <!-- Prominent Status Explanation Bar -->
      ${renderStatusLegend()}

      <div class="table-card">
        <div class="table-responsive">
          <table class="data-table">
            <thead>
              <tr>
                <th style="width:95px;">Error Code</th>
                <th style="width:140px;">Requested Field</th>
                <th style="width:30%;">Submitted Comment</th>
                <th style="width:140px;">Current Status</th>
                <th style="width:30%;">Product Response</th>
                <th style="width:85px;text-align:right;">Action</th>
              </tr>
            </thead>
            <tbody id="supportTrackTableBody">
              ${renderSupportTrackTableRows(requests)}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  `;
}

function handleSupportTrackSearchInput(val) {
  AppState.supportTrackSearch = val;
  var requests = getFilteredSupportTrackRequests();
  var tbody = document.getElementById("supportTrackTableBody");
  if (tbody) tbody.innerHTML = renderSupportTrackTableRows(requests);
}

// ==========================================================================
// 9. Engineering POV — Ready Queue (No Source Ref, Implement Selected Only, Fits Desktop)
// ==========================================================================

function getFilteredEngQueue() {
  var records = errorStore.getAll();
  // Ready for Engineering ONLY
  var readyRecords = records.filter(function(r) {
    return r.status === "ready_for_engineering";
  });

  var search = AppState.engSearch.trim().toUpperCase();
  var cleanSearch = search.replace(/[^A-Z0-9]/g, "");
  var selectedService = AppState.engService;

  return readyRecords.filter(function(r) {
    if (selectedService !== "All" && r.service !== selectedService) return false;
    if (search) {
      var itemCode = r.errorCode.toUpperCase();
      var cleanCode = itemCode.replace(/[^A-Z0-9]/g, "");
      var codeMatch = itemCode.indexOf(search) !== -1 || (cleanSearch && cleanCode.indexOf(cleanSearch) !== -1);
      var arMatch = (r.originalArMessage || "").indexOf(AppState.engSearch.trim()) !== -1 || (r.correctedArMessage || "").indexOf(AppState.engSearch.trim()) !== -1;
      var enMatch = (r.originalEnMessage || "").toUpperCase().indexOf(search) !== -1 || (r.correctedEnMessage || "").toUpperCase().indexOf(search) !== -1;
      var triggerMatch = (r.approvedTrigger || "").toUpperCase().indexOf(search) !== -1;
      var meaningMatch = (r.meaning || "").toUpperCase().indexOf(search) !== -1;
      var actionMatch = (r.customerSupportAction || "").toUpperCase().indexOf(search) !== -1;
      var commentMatch = (r.customerSupportComment || "").toUpperCase().indexOf(search) !== -1;

      return codeMatch || arMatch || enMatch || triggerMatch || meaningMatch || actionMatch || commentMatch;
    }
    return true;
  });
}

function renderEngQueueTableRows(filtered) {
  if (filtered.length === 0) {
    return '<tr><td colspan="11" style="text-align:center;padding:2.5rem;color:var(--text-muted);">No errors currently in Ready for Engineering status.</td></tr>';
  }

  return filtered.map(function(r) {
    var isChecked = AppState.engSelectedIds.indexOf(r.id) !== -1;
    return `
      <tr class="${isChecked ? 'selected' : ''}">
        <td style="text-align:center;">
          <input type="checkbox" ${isChecked ? 'checked' : ''} onchange="handleToggleEngRowSelect('${r.id}')" aria-label="Select ${escapeHtml(r.errorCode)}" />
        </td>
        <td><span class="code-badge">${escapeHtml(r.errorCode)}</span></td>
        <td><span class="service-badge">${escapeHtml(r.service)}</span></td>
        <td><div class="cell-clamp arabic" title="${escapeHtml(r.originalArMessage)}">${escapeHtml(r.originalArMessage)}</div></td>
        <td><div class="cell-clamp arabic" style="color:#047857;font-weight:700;" title="${escapeHtml(r.correctedArMessage)}">${escapeHtml(r.correctedArMessage)}</div></td>
        <td><div class="cell-clamp" title="${escapeHtml(r.originalEnMessage)}">${escapeHtml(r.originalEnMessage)}</div></td>
        <td><div class="cell-clamp" style="color:#047857;font-weight:700;" title="${escapeHtml(r.correctedEnMessage)}">${escapeHtml(r.correctedEnMessage)}</div></td>
        <td><div class="cell-clamp" title="${escapeHtml(r.approvedTrigger)}">${escapeHtml(r.approvedTrigger)}</div></td>
        <td><div class="cell-clamp" title="${escapeHtml(r.meaning)}">${escapeHtml(r.meaning)}</div></td>
        <td><div class="cell-clamp" title="${escapeHtml(r.customerSupportAction)}">${escapeHtml(r.customerSupportAction)}</div></td>
        <td style="text-align:right;white-space:nowrap;">
          <button type="button" class="btn btn-success btn-sm" onclick="openEngConfirmModal('${r.id}')" style="margin-right:0.25rem;">
            Implement
          </button>
          <button type="button" class="btn btn-outline btn-sm" onclick="openEngineeringDetails('${r.id}', 'queue')">
            Details &rarr;
          </button>
        </td>
      </tr>
    `;
  }).join("");
}

function renderEngineeringQueuePage() {
  var filtered = getFilteredEngQueue();
  var isAllSelected = filtered.length > 0 && AppState.engSelectedIds.length === filtered.length;
  var selCount = AppState.engSelectedIds.length;

  return `
    <div style="display:flex;flex-direction:column;gap:1.15rem;">
      <div style="display:flex;justify-content:space-between;align-items:center;flex-wrap:wrap;gap:0.75rem;">
        <div>
          <h2 style="font-size:1.35rem;font-weight:800;color:var(--navy-dark);">Ready for Engineering Queue</h2>
          <p style="font-size:0.85rem;color:var(--text-secondary);">
            Product-approved bilingual error corrections ready for codebase deployment.
          </p>
        </div>
        <div style="display:flex;align-items:center;gap:0.4rem;flex-wrap:wrap;">
          <!-- Format Selector for Export -->
          <select class="filter-select" onchange="handleEngExportFormatChange(this.value)" style="font-weight:700;border-color:var(--brand-accent);" title="Select Export Format">
            <option value="csv" ${AppState.engExportFormat === 'csv' ? 'selected' : ''}>Format: CSV (.csv)</option>
            <option value="md" ${AppState.engExportFormat === 'md' ? 'selected' : ''}>Format: Markdown (.md)</option>
            <option value="html" ${AppState.engExportFormat === 'html' ? 'selected' : ''}>Format: HTML (.html)</option>
          </select>

          <!-- Export Selected Button (Disabled if 0) -->
          <button type="button" class="btn btn-engineering btn-sm" onclick="handleExportEngSelected()" ${selCount === 0 ? 'disabled' : ''}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path><polyline points="7 10 12 15 17 10"></polyline><line x1="12" y1="15" x2="12" y2="3"></line></svg>
            Export Selected (${selCount})
          </button>

          <!-- Implement Selected Button (Disabled if 0) -->
          <button type="button" class="btn btn-success btn-sm" onclick="handleImplementSelectedEngErrors()" ${selCount === 0 ? 'disabled' : ''} title="Mark only selected errors as Implemented in codebase">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="20 6 9 17 4 12"></polyline></svg>
            Implement Selected (${selCount})
          </button>
        </div>
      </div>

      <!-- Prominent Status Explanation Bar -->
      ${renderStatusLegend()}

      <div class="filter-bar-card">
        <div class="search-input-row">
          <div class="search-box-wrapper">
            <svg class="search-box-icon" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="11" cy="11" r="8"></circle><line x1="21" y1="21" x2="16.65" y2="16.65"></line></svg>
            <input
              type="text"
              id="engQueueSearchInput"
              class="search-box-input"
              placeholder="Search ready errors by code, message, trigger, meaning..."
              value="${escapeHtml(AppState.engSearch)}"
              oninput="handleEngQueueSearchInput(this.value)"
              autocomplete="off"
            />
          </div>

          <div class="filters-row">
            <select class="filter-select" onchange="handleEngServiceChange(this.value)">
              <option value="All" ${AppState.engService === 'All' ? 'selected' : ''}>All Services</option>
              ${SERVICES.map(function(s) {
                return `<option value="${escapeHtml(s)}" ${AppState.engService === s ? 'selected' : ''}>${escapeHtml(s)}</option>`;
              }).join("")}
            </select>
          </div>
        </div>

        <div style="display:flex;justify-content:space-between;align-items:center;font-size:0.8rem;color:var(--text-muted);flex-wrap:wrap;gap:0.4rem;">
          <span id="engQueueCounter">Pending Engineering Fixes: <strong>${filtered.length}</strong> | Selected: <strong>${selCount}</strong></span>
          <span>Status: <strong>Ready for Engineering</strong> &bull; 6 Core Columns</span>
        </div>
      </div>

      <div class="table-card">
        <div class="table-responsive">
          <table class="data-table">
            <thead>
              <tr>
                <th style="width:36px;text-align:center;">
                  <input type="checkbox" ${isAllSelected ? 'checked' : ''} onchange="handleToggleEngSelectAll(this.checked)" aria-label="Select all" />
                </th>
                <th style="width:90px;">Error Code</th>
                <th style="width:100px;">Service</th>
                <th style="width:12%;">Original AR</th>
                <th style="width:12%;">Corrected AR</th>
                <th style="width:12%;">Original EN</th>
                <th style="width:12%;">Corrected EN</th>
                <th style="width:13%;">Approved Trigger</th>
                <th style="width:13%;">Meaning</th>
                <th style="width:13%;">Support Action</th>
                <th style="width:140px;text-align:right;">Actions</th>
              </tr>
            </thead>
            <tbody id="engQueueTableBody">
              ${renderEngQueueTableRows(filtered)}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  `;
}

function handleEngQueueSearchInput(val) {
  AppState.engSearch = val;
  var filtered = getFilteredEngQueue();
  var tbody = document.getElementById("engQueueTableBody");
  if (tbody) tbody.innerHTML = renderEngQueueTableRows(filtered);
  var counter = document.getElementById("engQueueCounter");
  if (counter) counter.innerHTML = "Pending Engineering Fixes: <strong>" + filtered.length + "</strong> | Selected: <strong>" + AppState.engSelectedIds.length + "</strong>";
}
function handleEngServiceChange(val) {
  AppState.engService = val;
  var filtered = getFilteredEngQueue();
  var filteredIds = filtered.map(function(r) { return r.id; });
  AppState.engSelectedIds = AppState.engSelectedIds.filter(function(id) { return filteredIds.indexOf(id) !== -1; });
  renderApp();
}
function handleEngExportFormatChange(val) {
  AppState.engExportFormat = val;
  renderApp();
}
function handleToggleEngSelectAll(checked) {
  var filtered = getFilteredEngQueue();
  if (checked) {
    AppState.engSelectedIds = filtered.map(function(r) { return r.id; });
  } else {
    AppState.engSelectedIds = [];
  }
  renderApp();
}
function handleToggleEngRowSelect(id) {
  var idx = AppState.engSelectedIds.indexOf(id);
  if (idx !== -1) {
    AppState.engSelectedIds.splice(idx, 1);
  } else {
    AppState.engSelectedIds.push(id);
  }
  renderApp();
}
function handleExportEngSelected() {
  var allRecords = errorStore.getAll();
  var selected = allRecords.filter(function(r) {
    return AppState.engSelectedIds.indexOf(r.id) !== -1;
  });
  if (selected.length === 0) {
    showToast("Please select at least one error checkbox to export.", "warning");
    return;
  }
  var fmt = AppState.engExportFormat || "csv";
  downloadExport(selected, fmt, "malaa-engineering-selected-fixes");
  showToast("Exported " + selected.length + " selected error fixes to " + fmt.toUpperCase() + " (6 core columns).");
}
function handleImplementSelectedEngErrors() {
  var allRecords = errorStore.getAll();
  var selected = allRecords.filter(function(r) {
    return AppState.engSelectedIds.indexOf(r.id) !== -1 && r.status === "ready_for_engineering";
  });
  if (selected.length === 0) {
    showToast("No ready errors currently selected to implement.", "warning");
    return;
  }
  
  if (confirm("Confirm Implementation: Mark " + selected.length + " selected error fix(es) as Implemented in codebase? This will update their shared status to 'Implemented' and immediately display the corrected copy in Customer Care.")) {
    var ids = selected.map(function(r) { return r.id; });
    var count = errorStore.bulkUpdateStatus(ids, "implemented");
    AppState.engSelectedIds = [];
    renderApp();
    showToast("Successfully implemented " + count + " selected error fix(es) in codebase!", "success");
  }
}

// ==========================================================================
// 10. Engineering POV — Implemented Errors (Includes Return to Ready Action, Fits Desktop)
// ==========================================================================

function getFilteredEngImplemented() {
  var records = errorStore.getAll().filter(function(r) { return r.status === "implemented"; });
  var search = AppState.engImplSearch.trim().toUpperCase();
  var selectedService = AppState.engImplService;

  return records.filter(function(r) {
    if (selectedService !== "All" && r.service !== selectedService) return false;
    if (search) {
      return (
        r.errorCode.toUpperCase().indexOf(search) !== -1 ||
        (r.correctedArMessage || "").indexOf(AppState.engImplSearch.trim()) !== -1 ||
        (r.correctedEnMessage || "").toUpperCase().indexOf(search) !== -1 ||
        (r.meaning || "").toUpperCase().indexOf(search) !== -1
      );
    }
    return true;
  });
}

function renderEngImplTableRows(filtered) {
  if (filtered.length === 0) {
    return '<tr><td colspan="7" style="text-align:center;padding:2.5rem;color:var(--text-muted);">No implemented error records found.</td></tr>';
  }

  return filtered.map(function(r) {
    return `
      <tr>
        <td><span class="code-badge">${escapeHtml(r.errorCode)}</span></td>
        <td><span class="service-badge">${escapeHtml(r.service)}</span></td>
        <td><div class="cell-clamp arabic" style="color:#047857;font-weight:600;" title="${escapeHtml(r.correctedArMessage)}">${escapeHtml(r.correctedArMessage)}</div></td>
        <td><div class="cell-clamp" style="color:#047857;font-weight:600;" title="${escapeHtml(r.correctedEnMessage)}">${escapeHtml(r.correctedEnMessage)}</div></td>
        <td><div class="cell-clamp" title="${escapeHtml(r.meaning)}">${escapeHtml(r.meaning)}</div></td>
        <td>${renderStatusBadge(r.status)}</td>
        <td style="text-align:right;white-space:nowrap;">
          <button type="button" class="btn btn-warning btn-sm" onclick="handleReturnToReady('${r.id}')" title="Revert to Ready for Engineering queue" style="margin-right:0.25rem;">
            Return to Ready
          </button>
          <button type="button" class="btn btn-outline btn-sm" onclick="openEngineeringDetails('${r.id}', 'implemented')">
            Details &rarr;
          </button>
        </td>
      </tr>
    `;
  }).join("");
}

function renderEngineeringImplementedPage() {
  var filtered = getFilteredEngImplemented();

  return `
    <div style="display:flex;flex-direction:column;gap:1.15rem;">
      <div>
        <h2 style="font-size:1.35rem;font-weight:800;color:var(--navy-dark);">Implemented Errors</h2>
        <p style="font-size:0.85rem;color:var(--text-secondary);">
          Error corrections confirmed applied in source code. These live messages are now reflected in Customer Care.
        </p>
      </div>

      <!-- Prominent Status Explanation Bar -->
      ${renderStatusLegend()}

      <div class="filter-bar-card">
        <div class="search-input-row">
          <div class="search-box-wrapper">
            <svg class="search-box-icon" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="11" cy="11" r="8"></circle><line x1="21" y1="21" x2="16.65" y2="16.65"></line></svg>
            <input
              type="text"
              id="engImplSearchInput"
              class="search-box-input"
              placeholder="Search implemented errors by code, message, or meaning..."
              value="${escapeHtml(AppState.engImplSearch)}"
              oninput="handleEngImplSearchInput(this.value)"
              autocomplete="off"
            />
          </div>

          <div class="filters-row">
            <select class="filter-select" onchange="handleEngImplServiceChange(this.value)">
              <option value="All" ${AppState.engImplService === 'All' ? 'selected' : ''}>All Services</option>
              ${SERVICES.map(function(s) {
                return `<option value="${escapeHtml(s)}" ${AppState.engImplService === s ? 'selected' : ''}>${escapeHtml(s)}</option>`;
              }).join("")}
            </select>
          </div>
        </div>

        <div style="font-size:0.8rem;color:var(--text-muted);">
          <span id="engImplCounter">Total Implemented: <strong>${filtered.length}</strong></span>
        </div>
      </div>

      <div class="table-card">
        <div class="table-responsive">
          <table class="data-table">
            <thead>
              <tr>
                <th style="width:95px;">Error Code</th>
                <th style="width:110px;">Service</th>
                <th style="width:24%;">Corrected AR Message</th>
                <th style="width:24%;">Corrected EN Message</th>
                <th style="width:24%;">Meaning</th>
                <th style="width:140px;">Status</th>
                <th style="width:170px;text-align:right;">Actions</th>
              </tr>
            </thead>
            <tbody id="engImplTableBody">
              ${renderEngImplTableRows(filtered)}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  `;
}

function handleEngImplSearchInput(val) {
  AppState.engImplSearch = val;
  var filtered = getFilteredEngImplemented();
  var tbody = document.getElementById("engImplTableBody");
  if (tbody) tbody.innerHTML = renderEngImplTableRows(filtered);
  var counter = document.getElementById("engImplCounter");
  if (counter) counter.innerHTML = "Total Implemented: <strong>" + filtered.length + "</strong>";
}
function handleEngImplServiceChange(val) {
  AppState.engImplService = val;
  renderApp();
}

function handleReturnToReady(id) {
  var record = errorStore.getById(id);
  if (!record) return;

  if (confirm("Return error " + record.errorCode + " to Ready for Engineering queue? This will change status to 'Ready for Engineering' and move it back to the active Engineering queue.")) {
    errorStore.returnToReady(id);
    renderApp();
    showToast("Returned " + record.errorCode + " to Ready for Engineering queue.", "warning");
  }
}

// ==========================================================================
// 11. Engineering POV — Error Details Page (No Source Ref)
// ==========================================================================

function renderEngineeringDetailsPage() {
  var record = errorStore.getById(AppState.activeErrorId) || errorStore.getAll()[0];
  if (!record) {
    return `<div style="text-align:center;padding:3rem;"><h3>Error not found</h3><button type="button" class="btn btn-primary" onclick="setEngineeringTab('queue')">Back</button></div>`;
  }

  return `
    <div style="display:flex;flex-direction:column;gap:1.15rem;max-width:960px;margin:0 auto;width:100%;">
      <!-- Header (No Source Ref) -->
      <div style="background:#ffffff;padding:0.85rem 1.15rem;border-radius:var(--radius-md);border:1px solid var(--border-subtle);display:flex;justify-content:space-between;align-items:center;flex-wrap:wrap;gap:0.75rem;">
        <div style="display:flex;align-items:center;gap:0.65rem;">
          <span class="code-badge" style="font-size:1.05rem;padding:0.25rem 0.65rem;">${escapeHtml(record.errorCode)}</span>
          <span class="service-badge">${escapeHtml(record.service)}</span>
          ${renderStatusBadge(record.status)}
        </div>
        <div style="display:flex;align-items:center;gap:0.4rem;">
          ${record.status === 'ready_for_engineering' ? `
            <button type="button" class="btn btn-success btn-sm" onclick="openEngConfirmModal('${record.id}')">
              Mark as Implemented
            </button>
          ` : (record.status === 'implemented' ? `
            <button type="button" class="btn btn-warning btn-sm" onclick="handleReturnToReady('${record.id}')">
              Return to Ready for Engineering
            </button>
          ` : '')}
          <button type="button" class="btn btn-outline btn-sm" onclick="setEngineeringTab('${AppState.returnTab}')">
            &larr; Back to ${AppState.returnTab === 'implemented' ? 'Implemented' : 'Queue'}
          </button>
        </div>
      </div>

      <!-- Messages Comparison -->
      <div class="diff-comparison-grid">
        <div class="diff-card original-card">
          <div class="diff-card-header">
            <span class="diff-card-title">Original Arabic Message</span>
            <span style="font-size:0.7rem;color:var(--text-muted);">Original</span>
          </div>
          <div class="read-only-msg-box arabic">${escapeHtml(record.originalArMessage)}</div>
        </div>

        <div class="diff-card corrected-card">
          <div class="diff-card-header">
            <span class="diff-card-title">Corrected Arabic Message (To Apply in Code)</span>
            <span style="font-size:0.7rem;color:#047857;font-weight:700;">Approved Fix</span>
          </div>
          <div class="read-only-msg-box arabic" style="background:#ecfdf5;border-color:#a7f3d0;font-weight:600;">${escapeHtml(record.correctedArMessage)}</div>
        </div>
      </div>

      <div class="diff-comparison-grid">
        <div class="diff-card original-card">
          <div class="diff-card-header">
            <span class="diff-card-title">Original English Message</span>
            <span style="font-size:0.7rem;color:var(--text-muted);">Original</span>
          </div>
          <div class="read-only-msg-box">${escapeHtml(record.originalEnMessage)}</div>
        </div>

        <div class="diff-card corrected-card">
          <div class="diff-card-header">
            <span class="diff-card-title">Corrected English Message (To Apply in Code)</span>
            <span style="font-size:0.7rem;color:#047857;font-weight:700;">Approved Fix</span>
          </div>
          <div class="read-only-msg-box" style="background:#ecfdf5;border-color:#a7f3d0;font-weight:600;">${escapeHtml(record.correctedEnMessage)}</div>
        </div>
      </div>

      <!-- Operational Metadata -->
      <div class="operational-info-card">
        <h3 style="font-size:0.9rem;font-weight:700;border-bottom:1px solid var(--border-subtle);padding-bottom:0.4rem;">
          Diagnostic Specifications
        </h3>

        <div>
          <span style="font-size:0.72rem;font-weight:700;color:var(--text-muted);text-transform:uppercase;display:block;margin-bottom:0.2rem;">Approved Diagnostic Trigger</span>
          <div class="read-only-msg-box" style="min-height:auto;padding:0.55rem 0.75rem;font-size:0.85rem;">${escapeHtml(record.approvedTrigger)}</div>
        </div>

        <div>
          <span style="font-size:0.72rem;font-weight:700;color:var(--text-muted);text-transform:uppercase;display:block;margin-bottom:0.2rem;">Meaning</span>
          <div class="read-only-msg-box" style="min-height:auto;padding:0.55rem 0.75rem;font-size:0.85rem;">${escapeHtml(record.meaning)}</div>
        </div>

        <div>
          <span style="font-size:0.72rem;font-weight:700;color:var(--text-muted);text-transform:uppercase;display:block;margin-bottom:0.2rem;">Recommended Customer Support Action</span>
          <div class="read-only-msg-box" style="min-height:auto;padding:0.55rem 0.75rem;font-size:0.85rem;">${escapeHtml(record.customerSupportAction)}</div>
        </div>

        ${record.customerSupportComment ? `
          <div>
            <span style="font-size:0.72rem;font-weight:700;color:#92400e;text-transform:uppercase;display:block;margin-bottom:0.2rem;">Customer Support Comment</span>
            <div style="background:#fffbeb;border:1px solid #fde68a;padding:0.6rem 0.75rem;border-radius:var(--radius-sm);color:#92400e;font-size:0.85rem;">
              "${escapeHtml(record.customerSupportComment)}"
            </div>
          </div>
        ` : ''}
      </div>
    </div>
  `;
}

// ==========================================================================
// 12. Engineering Export Center (Right-Aligned Controls, 6 Core Columns, 3 Formats)
// ==========================================================================

function getFilteredExportRecords() {
  var records = errorStore.getAll();
  var search = AppState.exportSearch.trim().toUpperCase();
  var cleanSearch = search.replace(/[^A-Z0-9]/g, "");
  var selectedStatus = AppState.exportStatus;
  var selectedService = AppState.exportService;

  return records.filter(function(r) {
    if (selectedStatus !== "All" && r.status !== selectedStatus) return false;
    if (selectedService !== "All" && r.service !== selectedService) return false;

    if (search) {
      var itemCode = r.errorCode.toUpperCase();
      var cleanCode = itemCode.replace(/[^A-Z0-9]/g, "");
      var codeMatch = itemCode.indexOf(search) !== -1 || (cleanSearch && cleanCode.indexOf(cleanSearch) !== -1);
      var serviceMatch = r.service.toUpperCase().indexOf(search) !== -1;
      var origArMatch = (r.originalArMessage || "").indexOf(AppState.exportSearch.trim()) !== -1;
      var corrArMatch = (r.correctedArMessage || "").indexOf(AppState.exportSearch.trim()) !== -1;
      var origEnMatch = (r.originalEnMessage || "").toUpperCase().indexOf(search) !== -1;
      var corrEnMatch = (r.correctedEnMessage || "").toUpperCase().indexOf(search) !== -1;
      return codeMatch || serviceMatch || origArMatch || corrArMatch || origEnMatch || corrEnMatch;
    }

    return true;
  });
}

function renderExportTableRows(filtered) {
  if (filtered.length === 0) {
    return '<tr><td colspan="7" style="text-align:center;padding:2.5rem;color:var(--text-muted);">No records found matching export criteria.</td></tr>';
  }

  return filtered.map(function(r) {
    var isChecked = AppState.exportSelectedIds.indexOf(r.id) !== -1;
    return `
      <tr class="${isChecked ? 'selected' : ''}">
        <td style="text-align:center;">
          <input type="checkbox" ${isChecked ? 'checked' : ''} onchange="handleToggleExportRowSelect('${r.id}')" aria-label="Select ${escapeHtml(r.errorCode)}" />
        </td>
        <td><span class="code-badge">${escapeHtml(r.errorCode)}</span></td>
        <td><span class="service-badge">${escapeHtml(r.service)}</span></td>
        <td><div class="cell-clamp arabic" title="${escapeHtml(r.originalArMessage)}">${escapeHtml(r.originalArMessage)}</div></td>
        <td><div class="cell-clamp" title="${escapeHtml(r.originalEnMessage)}">${escapeHtml(r.originalEnMessage)}</div></td>
        <td><div class="cell-clamp arabic" style="color:#047857;font-weight:600;" title="${escapeHtml(r.correctedArMessage || "—")}">${escapeHtml(r.correctedArMessage || "—")}</div></td>
        <td><div class="cell-clamp" style="color:#047857;font-weight:600;" title="${escapeHtml(r.correctedEnMessage || "—")}">${escapeHtml(r.correctedEnMessage || "—")}</div></td>
      </tr>
    `;
  }).join("");
}

function renderEngineeringExportPage() {
  var records = errorStore.getAll();
  var filtered = getFilteredExportRecords();
  var isAllSelected = filtered.length > 0 && AppState.exportSelectedIds.length === filtered.length;
  var selCount = AppState.exportSelectedIds.length;

  return `
    <div style="display:flex;flex-direction:column;gap:1.15rem;">
      <!-- Export Header & Right-Aligned Controls -->
      <div style="display:flex;justify-content:space-between;align-items:center;flex-wrap:wrap;gap:0.75rem;">
        <div>
          <h2 style="font-size:1.35rem;font-weight:800;color:var(--navy-dark);">Engineering Export Center</h2>
          <p style="font-size:0.85rem;color:var(--text-secondary);">
            Export 6 core error copy columns into CSV, Markdown (.md), or HTML (.html) formats.
          </p>
        </div>

        <!-- Right-Aligned Export Controls Group -->
        <div class="export-toolbar-group">
          <!-- 1. Format Selector -->
          <select class="filter-select" onchange="handleExportFormatChange(this.value)" style="font-weight:700;border-color:var(--brand-accent);" title="Select Export Format">
            <option value="csv" ${AppState.exportFormat === 'csv' ? 'selected' : ''}>Format: CSV (.csv)</option>
            <option value="md" ${AppState.exportFormat === 'md' ? 'selected' : ''}>Format: Markdown (.md)</option>
            <option value="html" ${AppState.exportFormat === 'html' ? 'selected' : ''}>Format: HTML (.html)</option>
          </select>

          <!-- 2. Export Selected Button (Disabled if 0) -->
          <button type="button" class="btn btn-primary btn-sm" onclick="handleExportSelectedRecords()" ${selCount === 0 ? 'disabled' : ''}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path><polyline points="7 10 12 15 17 10"></polyline><line x1="12" y1="15" x2="12" y2="3"></line></svg>
            Export Selected (${selCount})
          </button>

          <!-- 3. Export All Filtered Button -->
          <button type="button" class="btn btn-outline btn-sm" onclick="handleExportAllFilteredRecords()">
            Export All Filtered (${filtered.length})
          </button>

          ${selCount > 0 ? `
            <button type="button" class="btn btn-secondary btn-sm" onclick="handleClearExportSelection()">
              Clear
            </button>
          ` : ''}
        </div>
      </div>

      <!-- Filter Controls: Status Filter is FIRST -->
      <div class="filter-bar-card">
        <div class="search-input-row">
          <div class="search-box-wrapper">
            <svg class="search-box-icon" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="11" cy="11" r="8"></circle><line x1="21" y1="21" x2="16.65" y2="16.65"></line></svg>
            <input
              type="text"
              id="exportSearchInput"
              class="search-box-input"
              placeholder="Search across code, number, service, messages..."
              value="${escapeHtml(AppState.exportSearch)}"
              oninput="handleExportSearchInput(this.value)"
              autocomplete="off"
            />
          </div>

          <div class="filters-row">
            <!-- STATUS FILTER (FIRST FILTER) -->
            <select class="filter-select" onchange="handleExportStatusChange(this.value)" style="border-color:var(--brand-accent);font-weight:600;">
              <option value="ready_for_engineering" ${AppState.exportStatus === 'ready_for_engineering' ? 'selected' : ''}>Status: Ready for Engineering (Default)</option>
              <option value="All" ${AppState.exportStatus === 'All' ? 'selected' : ''}>Status: All Statuses (${records.length})</option>
              <option value="not_reviewed" ${AppState.exportStatus === 'not_reviewed' ? 'selected' : ''}>Status: Not Reviewed</option>
              <option value="in_review" ${AppState.exportStatus === 'in_review' ? 'selected' : ''}>Status: In Review</option>
              <option value="approved" ${AppState.exportStatus === 'approved' ? 'selected' : ''}>Status: Approved</option>
            </select>

            <!-- SERVICE FILTER -->
            <select class="filter-select" onchange="handleExportServiceChange(this.value)">
              <option value="All" ${AppState.exportService === 'All' ? 'selected' : ''}>All Services</option>
              ${SERVICES.map(function(s) {
                return `<option value="${escapeHtml(s)}" ${AppState.exportService === s ? 'selected' : ''}>${escapeHtml(s)}</option>`;
              }).join("")}
            </select>
          </div>
        </div>

        <div style="display:flex;justify-content:space-between;align-items:center;font-size:0.8rem;color:var(--text-muted);flex-wrap:wrap;gap:0.4rem;">
          <span id="exportCounter">Matching Filtered Records: <strong>${filtered.length}</strong> | Selected: <strong>${selCount}</strong></span>
          <span>6 Core Columns: <strong>Code, Service, Orig AR, Orig EN, Corr AR, Corr EN</strong></span>
        </div>
      </div>

      <div class="table-card">
        <div style="padding:0.75rem 1rem;border-bottom:1px solid var(--border-subtle);display:flex;justify-content:space-between;align-items:center;">
          <h3 style="font-size:0.9rem;font-weight:700;">Catalog Preview (${filtered.length} Records — 6 Columns)</h3>
          <span style="font-size:0.75rem;color:var(--text-muted);">Exact 6 Core Columns for Engineering Source Code Updates</span>
        </div>

        <div class="table-responsive">
          <table class="data-table">
            <thead>
              <tr>
                <th style="width:36px;text-align:center;">
                  <input type="checkbox" ${isAllSelected ? 'checked' : ''} onchange="handleToggleExportSelectAll(this.checked)" aria-label="Select all" />
                </th>
                <th style="width:95px;">Error Code</th>
                <th style="width:110px;">Service</th>
                <th style="width:22%;">Original AR</th>
                <th style="width:22%;">Original EN</th>
                <th style="width:22%;">Corrected AR</th>
                <th style="width:22%;">Corrected EN</th>
              </tr>
            </thead>
            <tbody id="exportTableBody">
              ${renderExportTableRows(filtered)}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  `;
}

function handleExportSearchInput(val) {
  AppState.exportSearch = val;
  var filtered = getFilteredExportRecords();
  var tbody = document.getElementById("exportTableBody");
  if (tbody) tbody.innerHTML = renderExportTableRows(filtered);
  var counter = document.getElementById("exportCounter");
  if (counter) counter.innerHTML = "Matching Filtered Records: <strong>" + filtered.length + "</strong> | Selected: <strong>" + AppState.exportSelectedIds.length + "</strong>";
}
function handleExportFormatChange(val) {
  AppState.exportFormat = val;
  renderApp();
}
function handleExportStatusChange(val) {
  AppState.exportStatus = val;
  var filtered = getFilteredExportRecords();
  var filteredIds = filtered.map(function(r) { return r.id; });
  AppState.exportSelectedIds = AppState.exportSelectedIds.filter(function(id) { return filteredIds.indexOf(id) !== -1; });
  renderApp();
}
function handleExportServiceChange(val) {
  AppState.exportService = val;
  var filtered = getFilteredExportRecords();
  var filteredIds = filtered.map(function(r) { return r.id; });
  AppState.exportSelectedIds = AppState.exportSelectedIds.filter(function(id) { return filteredIds.indexOf(id) !== -1; });
  renderApp();
}
function handleToggleExportSelectAll(checked) {
  var filtered = getFilteredExportRecords();
  if (checked) {
    AppState.exportSelectedIds = filtered.map(function(r) { return r.id; });
  } else {
    AppState.exportSelectedIds = [];
  }
  renderApp();
}
function handleToggleExportRowSelect(id) {
  var idx = AppState.exportSelectedIds.indexOf(id);
  if (idx !== -1) {
    AppState.exportSelectedIds.splice(idx, 1);
  } else {
    AppState.exportSelectedIds.push(id);
  }
  renderApp();
}
function handleClearExportSelection() {
  AppState.exportSelectedIds = [];
  renderApp();
}
function handleExportSelectedRecords() {
  var allRecords = errorStore.getAll();
  var selected = allRecords.filter(function(r) {
    return AppState.exportSelectedIds.indexOf(r.id) !== -1;
  });
  if (selected.length === 0) {
    showToast("No records selected. Please check error boxes or click 'Export All Filtered'.", "warning");
    return;
  }
  var fmt = AppState.exportFormat || "csv";
  downloadExport(selected, fmt, "malaa-errors-selected-export");
  showToast("Exported " + selected.length + " selected records to " + fmt.toUpperCase() + " (6 core columns).");
}
function handleExportAllFilteredRecords() {
  var filtered = getFilteredExportRecords();
  if (filtered.length === 0) {
    showToast("No records available to export with current filters.", "warning");
    return;
  }
  var fmt = AppState.exportFormat || "csv";
  downloadExport(filtered, fmt, "malaa-errors-filtered-export");
  showToast("Exported " + filtered.length + " filtered records to " + fmt.toUpperCase() + " (6 core columns).");
}

// ==========================================================================
// 13. Modals (CS Request Modal with 'Other' Option & Engineering Confirm Implemented Modal)
// ==========================================================================

function openCSRequestModal(id) {
  AppState.csModalErrorId = id;
  AppState.csModalRequestedField = "Both Arabic and English Messages";
  AppState.csModalComment = "";
  AppState.csModalValidationError = "";
  renderApp();
}

function closeCSRequestModal() {
  AppState.csModalErrorId = null;
  AppState.csModalComment = "";
  AppState.csModalValidationError = "";
  renderApp();
}

function handleSubmitCSRequest() {
  var id = AppState.csModalErrorId;
  var comment = AppState.csModalComment.trim();
  var requestedField = AppState.csModalRequestedField;

  if (!comment) {
    AppState.csModalValidationError = requestedField === "Other" 
      ? "Comment is required to explain what needs to be reviewed for 'Other'." 
      : "Customer Support Comment is required.";
    renderApp();
    return;
  }

  var updated = errorStore.submitCSRequest(id, requestedField, comment);
  if (updated) {
    closeCSRequestModal();
    showToast("Change request submitted for " + updated.errorCode + ".");
  }
}

function openEngConfirmModal(id) {
  AppState.engModalErrorId = id;
  renderApp();
}

function closeEngConfirmModal() {
  AppState.engModalErrorId = null;
  renderApp();
}

function handleConfirmEngImplemented() {
  var id = AppState.engModalErrorId;
  var updated = errorStore.markApproved(id);
  if (updated) {
    closeEngConfirmModal();
    showToast(updated.errorCode + " marked as Approved in source code!");
  }
}

function renderModals() {
  var html = "";

  // 1. Customer Support Request Message Change Modal (Includes 'Other' Option)
  if (AppState.csModalErrorId) {
    var record = errorStore.getById(AppState.csModalErrorId);
    if (record) {
      html += `
        <div class="modal-overlay" onclick="closeCSRequestModal()">
          <div class="modal-dialog" onclick="event.stopPropagation()">
            <div class="modal-header">
              <h3 class="modal-title">Request User-Facing Message Change</h3>
              <button type="button" style="background:none;border:none;font-size:1.3rem;cursor:pointer;color:var(--text-muted);" onclick="closeCSRequestModal()">&times;</button>
            </div>
            <div class="modal-body">
              <p style="font-size:0.825rem;color:var(--text-secondary);">
                Submit feedback to Product to request message changes or operational clarifications. The request will appear in Product &gt; Customer Support Requests.
              </p>

              <div>
                <label style="font-size:0.75rem;font-weight:700;text-transform:uppercase;color:var(--text-muted);display:block;margin-bottom:0.25rem;">Error Code (Linked)</label>
                <div style="padding:0.5rem 0.75rem;background:#f1f5f9;border-radius:var(--radius-sm);font-family:var(--font-mono);font-weight:700;color:var(--brand-primary);font-size:0.85rem;">
                  ${escapeHtml(record.errorCode)} — ${escapeHtml(record.service)}
                </div>
              </div>

              <div>
                <label style="font-size:0.75rem;font-weight:700;text-transform:uppercase;color:var(--text-secondary);display:block;margin-bottom:0.25rem;">Requested Field <span style="color:#dc2626;">*</span></label>
                <select class="filter-select" style="width:100%;" onchange="AppState.csModalRequestedField = this.value">
                  <option value="Arabic Message" ${AppState.csModalRequestedField === 'Arabic Message' ? 'selected' : ''}>Arabic Message</option>
                  <option value="English Message" ${AppState.csModalRequestedField === 'English Message' ? 'selected' : ''}>English Message</option>
                  <option value="Both Arabic and English Messages" ${AppState.csModalRequestedField === 'Both Arabic and English Messages' ? 'selected' : ''}>Both Arabic and English Messages</option>
                  <option value="Other" ${AppState.csModalRequestedField === 'Other' ? 'selected' : ''}>Other</option>
                </select>
              </div>

              <div>
                <label style="font-size:0.75rem;font-weight:700;text-transform:uppercase;color:var(--text-secondary);display:block;margin-bottom:0.25rem;">Customer Support Comment <span style="color:#dc2626;">*</span></label>
                <textarea
                  class="editable-textarea"
                  rows="3"
                  placeholder="Explain why the message needs to be changed or what needs to be reviewed..."
                  oninput="AppState.csModalComment = this.value"
                >${escapeHtml(AppState.csModalComment)}</textarea>
                ${AppState.csModalValidationError ? `<p style="color:#dc2626;font-size:0.75rem;margin-top:0.25rem;">${escapeHtml(AppState.csModalValidationError)}</p>` : ''}
              </div>
            </div>
            <div class="modal-footer">
              <button type="button" class="btn btn-secondary btn-sm" onclick="closeCSRequestModal()">Cancel</button>
              <button type="button" class="btn btn-success btn-sm" onclick="handleSubmitCSRequest()">Submit Request</button>
            </div>
          </div>
        </div>
      `;
    }
  }

  // 2. Product Confirm Approved Modal
  if (AppState.approveModalErrorId) {
    var appRecord = errorStore.getById(AppState.approveModalErrorId);
    if (appRecord) {
      html += `
        <div class="modal-overlay" onclick="closeMarkApprovedModal()">
          <div class="modal-dialog" onclick="event.stopPropagation()">
            <div class="modal-header">
              <h3 class="modal-title">Confirm Error Approved</h3>
              <button type="button" style="background:none;border:none;font-size:1.3rem;cursor:pointer;color:var(--text-muted);" onclick="closeMarkApprovedModal()">&times;</button>
            </div>
            <div class="modal-body">
              <p style="font-size:0.85rem;color:var(--text-primary);line-height:1.45;">
                Confirm that Engineering has implemented the corrected bilingual copy for <strong>${escapeHtml(appRecord.errorCode)}</strong> (${escapeHtml(appRecord.service)}) and Product has verified it in the application.
              </p>

              <div style="background:#ecfdf5;border:1px solid #a7f3d0;padding:0.75rem 1rem;border-radius:var(--radius-sm);display:flex;flex-direction:column;gap:0.4rem;">
                <div>
                  <span style="font-size:0.7rem;font-weight:700;color:#047857;text-transform:uppercase;">Corrected Arabic (Live):</span>
                  <div class="arabic" style="font-weight:600;direction:rtl;text-align:right;font-size:0.95rem;">${escapeHtml(appRecord.correctedArMessage)}</div>
                </div>
                <div style="margin-top:0.35rem;">
                  <span style="font-size:0.7rem;font-weight:700;color:#047857;text-transform:uppercase;">Corrected English (Live):</span>
                  <div style="font-weight:600;font-size:0.85rem;">${escapeHtml(appRecord.correctedEnMessage)}</div>
                </div>
              </div>

              <p style="font-size:0.775rem;color:var(--text-muted);">
                This action will update the workflow status to <strong>Approved</strong> and immediately make the corrected copy live for Customer Support.
              </p>
            </div>
            <div class="modal-footer">
              <button type="button" class="btn btn-secondary btn-sm" onclick="closeMarkApprovedModal()">Cancel</button>
              <button type="button" class="btn btn-success btn-sm" onclick="handleConfirmApproved()">
                Confirm Approved
              </button>
            </div>
          </div>
        </div>
      `;
    }
  }

  // 3. Legacy Engineering Confirm Implemented Modal (kept for dead code safety)
  if (AppState.engModalErrorId && !AppState.approveModalErrorId) {
    var engRecord = errorStore.getById(AppState.engModalErrorId);
    if (engRecord) {
      html += `
        <div class="modal-overlay" onclick="closeEngConfirmModal()">
          <div class="modal-dialog" onclick="event.stopPropagation()">
            <div class="modal-header">
              <h3 class="modal-title">Confirm Implementation in Code</h3>
              <button type="button" style="background:none;border:none;font-size:1.3rem;cursor:pointer;color:var(--text-muted);" onclick="closeEngConfirmModal()">&times;</button>
            </div>
            <div class="modal-body">
              <p style="font-size:0.85rem;color:var(--text-primary);line-height:1.45;">
                Confirm that the corrected bilingual message for <strong>${escapeHtml(engRecord.errorCode)}</strong> (${escapeHtml(engRecord.service)}) has been applied in source code.
              </p>
            </div>
            <div class="modal-footer">
              <button type="button" class="btn btn-secondary btn-sm" onclick="closeEngConfirmModal()">Cancel</button>
              <button type="button" class="btn btn-success btn-sm" onclick="handleConfirmEngImplemented()">
                Confirm Implementation
              </button>
            </div>
          </div>
        </div>
      `;
    }
  }

  return html;
}

// Global initialization with error fallback
window.addEventListener("DOMContentLoaded", function() {
  try {
    renderApp();
  } catch (err) {
    console.error("Initialization error:", err);
    var fallback = document.getElementById("error-fallback");
    if (fallback) {
      fallback.style.display = "block";
      fallback.innerHTML = `
        <div style="max-width:600px;margin:3rem auto;padding:2rem;background:#fef2f2;border:2px solid #f87171;border-radius:8px;color:#991b1b;font-family:sans-serif;">
          <h2 style="margin-bottom:0.5rem;">Application Initialization Error</h2>
          <p style="margin-bottom:1rem;">Failed to initialize Malaa Error Hub:</p>
          <pre style="background:#fee2e2;padding:1rem;border-radius:4px;overflow-x:auto;font-size:0.85rem;">${escapeHtml(err.stack || err.message || err)}</pre>
        </div>
      `;
    }
  }
});
