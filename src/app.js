/**
 * Malaa Error Hub — Main Application Controller (Vanilla JS)
 * Role-Tailored Perspectives: Product POV, Customer Support POV, Engineering POV
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
  productTab: "home",  // "home" | "queue" | "all-errors" | "cs-requests" | "tracking-ready" | "review"
  supportTab: "home",  // "home" | "all-errors" | "saved" | "track-requests" | "details"
  engineeringTab: "queue", // "queue" | "implemented" | "export" | "details"
  activeErrorId: null,
  returnTab: "queue",
  returnPov: "product",
  
  // Product Queue Filters
  queueSearch: "",
  queueService: "All",
  queueStatus: "All",
  queueChangeType: "All",
  queueSelectedIds: [],

  // Product All Errors Filters & Sort
  allErrorsSearch: "",
  allErrorsService: "All",
  allErrorsStatus: "All",
  allErrorsSortField: "errorCode",
  allErrorsSortAsc: true,

  // CS Requests Filter (Product)
  csRequestsSearch: "",
  csRequestsService: "All",

  // Tracking Ready Engineering Filter (Product)
  trackReadySearch: "",
  trackReadyService: "All",
  trackReadyStatus: "ready_for_engineering", // "ready_for_engineering" | "implemented" | "All"

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
  csDetailsMeaning: "",
  csDetailsTrigger: "",
  csDetailsAction: "",

  // Engineering State
  engSearch: "",
  engService: "All",
  engSelectedIds: [],
  engExportFormat: "csv", // "csv" | "md" | "html"
  engModalErrorId: null, // For mark as implemented confirmation modal

  // Engineering Implemented Errors Filter
  engImplSearch: "",
  engImplService: "All",

  // Export Center State
  exportStatus: "ready_for_engineering", // Status filter FIRST, defaults to ready_for_engineering
  exportService: "All",
  exportSearch: "",
  exportFormat: "csv", // "csv" | "md" | "html"
  exportSelectedIds: [],

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
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
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
    case "change_request_cs": return "Change Request CS";
    case "not_reviewed": return "Not Reviewed";
    case "in_review": return "In Review";
    case "ready_for_engineering": return "Ready for Engineering";
    case "implemented": return "Implemented";
    default: return status || "Unknown";
  }
}

function renderStatusBadge(status) {
  var label = formatStatusLabel(status);
  var desc = STATUS_CONFIG && STATUS_CONFIG[status] ? STATUS_CONFIG[status].description : "";
  return '<span class="status-badge ' + escapeHtml(status) + '" title="' + escapeHtml(desc) + '">' + escapeHtml(label) + '</span>';
}

function renderStatusLegend() {
  return `
    <div class="status-legend-bar">
      <span style="font-weight:700;color:var(--text-primary);font-size:0.75rem;text-transform:uppercase;letter-spacing:0.04em;">Status Workflow:</span>
      <div class="status-legend-item" title="Customer Support submitted a new request related to an error.">
        <span class="status-dot change_request_cs"></span>
        <span><strong>Change Request CS</strong>: CS submitted improvement request</span>
      </div>
      <div class="status-legend-item" title="An error was extracted from the code but Product has not reviewed it.">
        <span class="status-dot not_reviewed"></span>
        <span><strong>Not Reviewed</strong>: Extracted from code; unreviewed</span>
      </div>
      <div class="status-legend-item" title="Product is currently reviewing or correcting the error.">
        <span class="status-dot in_review"></span>
        <span><strong>In Review</strong>: Product refining copy & diagnostics</span>
      </div>
      <div class="status-legend-item" title="Product approved the corrections and the error is ready for Engineering.">
        <span class="status-dot ready_for_engineering"></span>
        <span><strong>Ready for Engineering</strong>: Approved for code updates</span>
      </div>
      <div class="status-legend-item" title="Engineering confirmed that the correction was applied in the code.">
        <span class="status-dot implemented"></span>
        <span><strong>Implemented</strong>: Applied in source code</span>
      </div>
    </div>
  `;
}

function renderChangedBadges(changedFields) {
  if (!changedFields || changedFields.length === 0) {
    return '<span style="font-size:0.75rem;color:var(--text-muted);">None</span>';
  }
  var html = '<div class="changed-badges-container">';
  changedFields.forEach(function(field) {
    var cls = "field-change-badge";
    if (field === "AR Message") cls += " ar";
    else if (field === "EN Message") cls += " en";
    else if (field === "Trigger") cls += " trigger";
    else if (field === "Meaning") cls += " meaning";
    else if (field === "Action") cls += " action";
    html += '<span class="' + cls + '">' + escapeHtml(field) + '</span>';
  });
  html += '</div>';
  return html;
}

// --- Navigation Controller ---

function setPOV(newPov) {
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
  }

  AppState.productTab = "review";
  renderApp();
  window.scrollTo({ top: 0, behavior: "smooth" });
}

function openSupportDetails(id, fromTab) {
  if (!fromTab) fromTab = "home";
  AppState.activeErrorId = id;
  AppState.returnTab = fromTab;
  AppState.returnPov = "support";
  
  var record = errorStore.getById(id);
  if (record) {
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
    errorStore.resetToDefaults();
    AppState.queueSelectedIds = [];
    AppState.engSelectedIds = [];
    AppState.exportSelectedIds = [];
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

  // 1. Header with 3 Renamed Roles (Product, Engineer, Customer Care) & Tools
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
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <path d="M12 20h9"></path>
              <path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z"></path>
            </svg>
            Product
          </button>
          <button type="button" class="pov-toggle-btn ${pov === 'support' ? 'active support' : ''}" onclick="setPOV('support')">
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z"></path>
            </svg>
            Customer Care
          </button>
          <button type="button" class="pov-toggle-btn ${pov === 'engineering' ? 'active engineering' : ''}" onclick="setPOV('engineering')">
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <polyline points="16 18 22 12 16 6"></polyline>
              <polyline points="8 6 2 12 8 18"></polyline>
            </svg>
            Engineer
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

  // 2. Sub-Navigation (if in Product, Customer Care, or Engineer POV)
  if (pov !== "landing") {
    html += '<nav class="sub-nav" aria-label="Secondary Navigation"><div class="sub-nav-inner"><ul class="nav-links-list">';
    if (pov === "product") {
      var kpis = errorStore.getKPIs();
      html += `
        <li><button type="button" class="nav-link-btn product ${AppState.productTab === 'home' ? 'active product' : ''}" onclick="setProductTab('home')">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"></path><polyline points="9 22 9 12 15 12 15 22"></polyline></svg>
          Product Dashboard
        </button></li>
        <li><button type="button" class="nav-link-btn product ${AppState.productTab === 'queue' ? 'active product' : ''}" onclick="setProductTab('queue')">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="8" y1="6" x2="21" y2="6"></line><line x1="8" y1="12" x2="21" y2="12"></line><line x1="8" y1="18" x2="21" y2="18"></line><line x1="3" y1="6" x2="3.01" y2="6"></line><line x1="3" y1="12" x2="3.01" y2="12"></line><line x1="3" y1="18" x2="3.01" y2="18"></line></svg>
          Review Queue (${kpis.notReviewed + kpis.inReview})
        </button></li>
        <li><button type="button" class="nav-link-btn product ${AppState.productTab === 'all-errors' ? 'active product' : ''}" onclick="setProductTab('all-errors')">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="3" width="18" height="18" rx="2" ry="2"></rect><line x1="3" y1="9" x2="21" y2="9"></line><line x1="9" y1="21" x2="9" y2="9"></line></svg>
          All Errors (${kpis.total})
        </button></li>
        <li><button type="button" class="nav-link-btn product ${AppState.productTab === 'cs-requests' ? 'active product' : ''}" onclick="setProductTab('cs-requests')">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z"></path></svg>
          Customer Care Requests ${kpis.changeRequestCS > 0 ? `<span style="background:#d97706;color:#ffffff;font-size:0.7rem;padding:0.1rem 0.45rem;border-radius:10px;font-weight:700;margin-left:0.25rem;">${kpis.changeRequestCS}</span>` : ''}
        </button></li>
        <li><button type="button" class="nav-link-btn product ${AppState.productTab === 'tracking-ready' ? 'active product' : ''}" onclick="setProductTab('tracking-ready')">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="9 11 12 14 22 4"></polyline><path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11"></path></svg>
          Tracking Ready Engineering (${kpis.readyForEngineering})
        </button></li>
      `;
    } else if (pov === "support") {
      var savedCount = errorStore.getSavedRecords().length;
      html += `
        <li><button type="button" class="nav-link-btn support ${AppState.supportTab === 'home' ? 'active support' : ''}" onclick="setSupportTab('home')">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"></path><polyline points="9 22 9 12 15 12 15 22"></polyline></svg>
          Customer Care Home
        </button></li>
        <li><button type="button" class="nav-link-btn support ${AppState.supportTab === 'all-errors' ? 'active support' : ''}" onclick="setSupportTab('all-errors')">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="11" cy="11" r="8"></circle><line x1="21" y1="21" x2="16.65" y2="16.65"></line></svg>
          All Errors
        </button></li>
        <li><button type="button" class="nav-link-btn support ${AppState.supportTab === 'saved' ? 'active support' : ''}" onclick="setSupportTab('saved')">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z"></path></svg>
          Saved Errors (${savedCount})
        </button></li>
        <li><button type="button" class="nav-link-btn support ${AppState.supportTab === 'track-requests' ? 'active support' : ''}" onclick="setSupportTab('track-requests')">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path><polyline points="14 2 14 8 20 8"></polyline><line x1="16" y1="13" x2="8" y2="13"></line><line x1="16" y1="17" x2="8" y2="17"></line><polyline points="10 9 9 9 8 9"></polyline></svg>
          Track Requests
        </button></li>
      `;
    } else if (pov === "engineering") {
      var readyCount = errorStore.getAll().filter(function(r) { return r.status === 'ready_for_engineering'; }).length;
      var implCount = errorStore.getAll().filter(function(r) { return r.status === 'implemented'; }).length;
      html += `
        <li><button type="button" class="nav-link-btn engineering ${AppState.engineeringTab === 'queue' ? 'active engineering' : ''}" onclick="setEngineeringTab('queue')">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="9 11 12 14 22 4"></polyline><path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11"></path></svg>
          Ready for Engineering (${readyCount})
        </button></li>
        <li><button type="button" class="nav-link-btn engineering ${AppState.engineeringTab === 'implemented' ? 'active engineering' : ''}" onclick="setEngineeringTab('implemented')">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path><polyline points="22 4 12 14.01 9 11.01"></polyline></svg>
          Implemented Errors (${implCount})
        </button></li>
        <li><button type="button" class="nav-link-btn engineering ${AppState.engineeringTab === 'export' ? 'active engineering' : ''}" onclick="setEngineeringTab('export')">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path><polyline points="7 10 12 15 17 10"></polyline><line x1="12" y1="15" x2="12" y2="3"></line></svg>
          Export Center
        </button></li>
      `;
    }
    html += `
      </ul>
      <div class="pov-mode-indicator ${pov}">
        ${pov === 'product' ? 'Product Perspective' : (pov === 'support' ? 'Customer Care Perspective' : 'Engineer Perspective')}
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
    else if (AppState.productTab === "queue") html += renderReviewQueuePage();
    else if (AppState.productTab === "all-errors") html += renderProductAllErrorsPage();
    else if (AppState.productTab === "cs-requests") html += renderCSRequestsPage();
    else if (AppState.productTab === "tracking-ready") html += renderTrackingReadyPage();
    else if (AppState.productTab === "review") html += renderErrorReviewPage();
  } else if (pov === "support") {
    if (AppState.supportTab === "home") html += renderSupportHomePage();
    else if (AppState.supportTab === "all-errors") html += renderSupportCatalogPage();
    else if (AppState.supportTab === "details") html += renderSupportDetailsPage();
    else if (AppState.supportTab === "saved") html += renderSupportSavedPage();
    else if (AppState.supportTab === "track-requests") html += renderSupportTrackRequestsPage();
  } else if (pov === "engineering") {
    if (AppState.engineeringTab === "queue") html += renderEngineeringQueuePage();
    else if (AppState.engineeringTab === "implemented") html += renderEngineeringImplementedPage();
    else if (AppState.engineeringTab === "details") html += renderEngineeringDetailsPage();
    else if (AppState.engineeringTab === "export") html += renderEngineeringExportPage();
  }
  html += '</main>';

  // 4. Global Modals
  html += renderModals();

  // 5. Footer
  html += `
    <footer class="app-footer">
      <p>Malaa Error Hub &bull; 3-Role Governance (Product, Support, Engineering) &bull; 5 Final Statuses &bull; Local Storage</p>
    </footer>
  `;

  root.innerHTML = html;
}

// ==========================================================================
// 1. Role Selection Landing Page (3 Sections: Product, Customer Care, Engineer)
// ==========================================================================

function renderLandingPage() {
  var kpis = errorStore.getKPIs();
  return `
    <div class="landing-container">
      <div class="landing-header">
        <span class="landing-badge">Malaa Error Hub MVP</span>
        <h2 class="landing-title">Select Your Section</h2>
        <p class="landing-subtitle">
          Experience role-tailored governance workflows designed for Product managers reviewing error copy, Customer Care agents assisting users, and Engineers applying approved fixes.
        </p>
      </div>

      <div class="role-cards-grid-3">
        <!-- Product Section Card -->
        <div class="role-card product-card" onclick="setPOV('product')">
          <div class="role-card-icon">
            <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <path d="M12 20h9"></path>
              <path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z"></path>
            </svg>
          </div>
          <div class="role-card-content">
            <h3 class="role-card-title">Product</h3>
            <p class="role-card-desc">
              Review error base, correct bilingual copy, track ready engineering items, and approve for implementation.
            </p>
            <div class="role-card-features">
              <div class="role-feature-item">&bull; Side-by-side Arabic & English diff comparisons</div>
              <div class="role-feature-item">&bull; Review Customer Care feedback requests</div>
              <div class="role-feature-item">&bull; Mandatory 5-field validation for Engineering approval</div>
              <div class="role-feature-item">&bull; Track Ready Engineering fixes (${kpis.readyForEngineering} Ready)</div>
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
            <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z"></path>
            </svg>
          </div>
          <div class="role-card-content">
            <h3 class="role-card-title">Customer Care</h3>
            <p class="role-card-desc">
              Search live errors, follow resolution actions, edit operational guides, and submit change requests.
            </p>
            <div class="role-card-features">
              <div class="role-feature-item">&bull; Fast search across error codes, numbers & keywords</div>
              <div class="role-feature-item">&bull; View only current implemented application messages</div>
              <div class="role-feature-item">&bull; Edit Meaning, Trigger, and Support Action</div>
              <div class="role-feature-item">&bull; Submit message change requests & track status</div>
            </div>
          </div>
          <div class="role-card-action">
            <button type="button" class="btn btn-success" style="width:100%;">
              Enter Customer Care Workspace &rarr;
            </button>
          </div>
        </div>

        <!-- Engineer Section Card -->
        <div class="role-card engineering-card" onclick="setPOV('engineering')">
          <div class="role-card-icon">
            <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <polyline points="16 18 22 12 16 6"></polyline>
              <polyline points="8 6 2 12 8 18"></polyline>
            </svg>
          </div>
          <div class="role-card-content">
            <h3 class="role-card-title">Engineer</h3>
            <p class="role-card-desc">
              Receive Product-approved corrections, export 7-column CSVs, and confirm code implementation.
            </p>
            <div class="role-card-features">
              <div class="role-feature-item">&bull; Dedicated Ready for Engineering Queue</div>
              <div class="role-feature-item">&bull; Confirm code implementation manually</div>
              <div class="role-feature-item">&bull; Multi-select & Filtered CSV Export (7 Core Columns)</div>
              <div class="role-feature-item">&bull; Track Implemented vs Pending code changes</div>
            </div>
          </div>
          <div class="role-card-action">
            <button type="button" class="btn btn-engineering" style="width:100%;">
              Enter Engineer Workspace &rarr;
            </button>
          </div>
        </div>
      </div>
    </div>
  `;
}

// ==========================================================================
// 2. Product POV — Dashboard View
// ==========================================================================

function renderProductHomePage() {
  var kpis = errorStore.getKPIs();
  var records = errorStore.getAll();
  var recentActive = records.slice(0, 6);

  var html = `
    <div style="display:flex;flex-direction:column;gap:1.5rem;">
      <div style="display:flex;justify-content:space-between;align-items:center;flex-wrap:wrap;gap:1rem;">
        <div>
          <h2 style="font-size:1.5rem;font-weight:800;color:var(--navy-dark);">Product Governance Dashboard</h2>
          <p style="font-size:0.9rem;color:var(--text-secondary);">
            Review AI-extracted errors, validate bilingual product copy, and approve errors for Engineering.
          </p>
        </div>
        <div style="display:flex;gap:0.5rem;flex-wrap:wrap;">
          <button type="button" class="btn btn-primary" onclick="setProductTab('queue')">
            Review Queue &rarr;
          </button>
          <button type="button" class="btn btn-outline" onclick="setProductTab('tracking-ready')">
            Tracking Ready Engineering (${kpis.readyForEngineering}) &rarr;
          </button>
        </div>
      </div>

      <!-- 8 Clickable KPI Summary Cards Grid -->
      <div class="kpi-grid">
        <div class="kpi-card kpi-total" onclick="handleKpiClick('all')" title="View all errors">
          <div class="kpi-content">
            <span class="kpi-label">Total Errors</span>
            <span class="kpi-value">${kpis.total}</span>
          </div>
          <div class="kpi-icon">
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="2" y="7" width="20" height="14" rx="2" ry="2"></rect><path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16"></path></svg>
          </div>
        </div>

        <div class="kpi-card kpi-change_request_cs" onclick="handleKpiClick('change_request_cs')" title="View Customer Care Requests">
          <div class="kpi-content">
            <span class="kpi-label">Change Request CS</span>
            <span class="kpi-value">${kpis.changeRequestCS}</span>
          </div>
          <div class="kpi-icon">
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z"></path></svg>
          </div>
        </div>

        <div class="kpi-card kpi-not_reviewed" onclick="handleKpiClick('not_reviewed')" title="View errors not yet reviewed">
          <div class="kpi-content">
            <span class="kpi-label">Not Reviewed</span>
            <span class="kpi-value">${kpis.notReviewed}</span>
          </div>
          <div class="kpi-icon">
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"></circle><line x1="12" y1="8" x2="12" y2="12"></line><line x1="12" y1="16" x2="12.01" y2="16"></line></svg>
          </div>
        </div>

        <div class="kpi-card kpi-in_review" onclick="handleKpiClick('in_review')" title="View errors currently in review">
          <div class="kpi-content">
            <span class="kpi-label">In Review</span>
            <span class="kpi-value">${kpis.inReview}</span>
          </div>
          <div class="kpi-icon">
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"></circle><polyline points="12 6 12 12 16 14"></polyline></svg>
          </div>
        </div>

        <div class="kpi-card kpi-ready_for_engineering" onclick="handleKpiClick('ready_for_engineering')" title="View errors ready for Engineering">
          <div class="kpi-content">
            <span class="kpi-label">Ready for Eng</span>
            <span class="kpi-value">${kpis.readyForEngineering}</span>
          </div>
          <div class="kpi-icon">
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="9 11 12 14 22 4"></polyline><path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11"></path></svg>
          </div>
        </div>

        <div class="kpi-card kpi-implemented" onclick="handleKpiClick('implemented')" title="View implemented errors">
          <div class="kpi-content">
            <span class="kpi-label">Implemented</span>
            <span class="kpi-value">${kpis.implemented}</span>
          </div>
          <div class="kpi-icon">
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path><polyline points="22 4 12 14.01 9 11.01"></polyline></svg>
          </div>
        </div>

        <div class="kpi-card kpi-ar_changes" onclick="handleKpiClick('ar')" title="View errors with Arabic copy changes">
          <div class="kpi-content">
            <span class="kpi-label">Arabic Changes</span>
            <span class="kpi-value">${kpis.arChanges}</span>
          </div>
          <div class="kpi-icon"><span style="font-weight:800;font-size:1.1rem;">ع</span></div>
        </div>

        <div class="kpi-card kpi-en_changes" onclick="handleKpiClick('en')" title="View errors with English copy changes">
          <div class="kpi-content">
            <span class="kpi-label">English Changes</span>
            <span class="kpi-value">${kpis.enChanges}</span>
          </div>
          <div class="kpi-icon"><span style="font-weight:800;font-size:1.1rem;">EN</span></div>
        </div>
      </div>

      <!-- Status Explanation Bar -->
      ${renderStatusLegend()}

      <!-- Active Errors Table -->
      <div class="table-card">
        <div style="padding:1rem 1.25rem;border-bottom:1px solid var(--border-subtle);display:flex;justify-content:space-between;align-items:center;">
          <h3 style="font-size:0.95rem;font-weight:700;">Active Error Catalog Preview</h3>
          <button type="button" class="btn btn-outline btn-sm" onclick="setProductTab('queue')">Open Full Review Queue &rarr;</button>
        </div>
        <div class="table-responsive">
          <table class="data-table">
            <thead>
              <tr>
                <th>Error Code</th>
                <th>Service</th>
                <th>Current Status</th>
                <th>Original AR Preview</th>
                <th>Corrected AR Preview</th>
                <th>Original EN Preview</th>
                <th>Corrected EN Preview</th>
                <th>Changed Fields</th>
                <th style="text-align:right;">Action</th>
              </tr>
            </thead>
            <tbody>
              ${recentActive.map(function(r) {
                return `
                  <tr>
                    <td><span class="code-badge">${escapeHtml(r.errorCode)}</span></td>
                    <td><span class="service-badge">${escapeHtml(r.service)}</span></td>
                    <td>${renderStatusBadge(r.status)}</td>
                    <td class="preview-cell arabic-preview">${escapeHtml(r.originalArMessage)}</td>
                    <td class="preview-cell arabic-preview" style="color:#047857;">${escapeHtml(r.correctedArMessage || "—")}</td>
                    <td class="preview-cell">${escapeHtml(r.originalEnMessage)}</td>
                    <td class="preview-cell" style="color:#047857;">${escapeHtml(r.correctedEnMessage || "—")}</td>
                    <td>${renderChangedBadges(r.changedFields)}</td>
                    <td style="text-align:right;">
                      <button type="button" class="btn btn-outline btn-sm" onclick="openReviewPage('${r.id}', 'home')">
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
    AppState.queueStatus = "All";
    AppState.queueChangeType = "All";
    setProductTab("queue");
  } else if (filterType === "change_request_cs") {
    setProductTab("cs-requests");
  } else if (filterType === "ready_for_engineering") {
    setProductTab("tracking-ready");
  } else if (filterType === "ar" || filterType === "en") {
    AppState.queueStatus = "All";
    AppState.queueChangeType = filterType;
    setProductTab("queue");
  } else {
    AppState.queueStatus = filterType;
    AppState.queueChangeType = "All";
    setProductTab("queue");
  }
}

// ==========================================================================
// 3. Product POV — Review Queue View
// ==========================================================================

function getFilteredQueueRecords() {
  var records = errorStore.getAll();
  var search = AppState.queueSearch.trim().toUpperCase();
  var cleanSearch = search.replace(/[^A-Z0-9]/g, "");
  var selectedService = AppState.queueService;
  var selectedStatus = AppState.queueStatus;
  var selectedChangeType = AppState.queueChangeType;

  return records.filter(function(r) {
    if (selectedService !== "All" && r.service !== selectedService) return false;
    if (selectedStatus !== "All" && r.status !== selectedStatus) return false;

    if (selectedChangeType !== "All") {
      if (selectedChangeType === "ar" && r.changedFields.indexOf("AR Message") === -1) return false;
      if (selectedChangeType === "en" && r.changedFields.indexOf("EN Message") === -1) return false;
      if (selectedChangeType === "trigger" && r.changedFields.indexOf("Trigger") === -1) return false;
      if (selectedChangeType === "meaning" && r.changedFields.indexOf("Meaning") === -1) return false;
      if (selectedChangeType === "action" && r.changedFields.indexOf("Action") === -1) return false;
    }

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

      return codeMatch || arMatch || enMatch || triggerMatch || meaningMatch || actionMatch || commentMatch;
    }

    return true;
  });
}

function renderQueueTableRows(filtered) {
  if (filtered.length === 0) {
    return '<tr><td colspan="10" style="text-align:center;padding:3rem;color:var(--text-muted);">No error records matched your filter criteria.</td></tr>';
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
        <td class="preview-cell arabic-preview">${escapeHtml(r.originalArMessage)}</td>
        <td class="preview-cell arabic-preview" style="color:#047857;">${escapeHtml(r.correctedArMessage || "—")}</td>
        <td class="preview-cell">${escapeHtml(r.originalEnMessage)}</td>
        <td class="preview-cell" style="color:#047857;">${escapeHtml(r.correctedEnMessage || "—")}</td>
        <td>${renderChangedBadges(r.changedFields)}</td>
        <td style="text-align:right;white-space:nowrap;">
          <button type="button" class="btn btn-outline btn-sm" onclick="openReviewPage('${r.id}', 'queue')">
            Open Review &rarr;
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
    <div style="display:flex;flex-direction:column;gap:1.25rem;">
      <div>
        <h2 style="font-size:1.4rem;font-weight:800;color:var(--navy-dark);">Product Review Queue</h2>
        <p style="font-size:0.875rem;color:var(--text-secondary);">
          Review errors, verify side-by-side Arabic & English copy, and approve corrections for Engineering.
        </p>
      </div>

      <!-- Filter Controls -->
      <div class="filter-bar-card">
        <div class="search-input-row">
          <div class="search-box-wrapper">
            <svg class="search-box-icon" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="11" cy="11" r="8"></circle><line x1="21" y1="21" x2="16.65" y2="16.65"></line></svg>
            <input
              type="text"
              id="queueSearchInput"
              class="search-box-input"
              placeholder="Search by code, number, Arabic/English text, trigger, meaning, action..."
              value="${escapeHtml(AppState.queueSearch)}"
              oninput="handleQueueSearchInput(this.value)"
              autocomplete="off"
            />
            ${AppState.queueSearch ? `<button type="button" style="position:absolute;right:0.75rem;background:none;border:none;cursor:pointer;font-size:1.2rem;color:var(--text-muted);" onclick="handleClearQueueSearch()">&times;</button>` : ''}
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

            <select class="filter-select" onchange="handleQueueChangeTypeChange(this.value)">
              <option value="All" ${AppState.queueChangeType === 'All' ? 'selected' : ''}>All Changes</option>
              <option value="ar" ${AppState.queueChangeType === 'ar' ? 'selected' : ''}>AR Changed</option>
              <option value="en" ${AppState.queueChangeType === 'en' ? 'selected' : ''}>EN Changed</option>
              <option value="trigger" ${AppState.queueChangeType === 'trigger' ? 'selected' : ''}>Trigger Changed</option>
              <option value="meaning" ${AppState.queueChangeType === 'meaning' ? 'selected' : ''}>Meaning Added</option>
              <option value="action" ${AppState.queueChangeType === 'action' ? 'selected' : ''}>Action Added</option>
            </select>

            ${(AppState.queueSearch || AppState.queueService !== 'All' || AppState.queueStatus !== 'All' || AppState.queueChangeType !== 'All') ? `
              <button type="button" class="btn btn-secondary btn-sm" onclick="clearQueueFilters()">
                Clear Filters
              </button>
            ` : ''}
          </div>
        </div>

        <div style="display:flex;justify-content:space-between;align-items:center;font-size:0.85rem;color:var(--text-muted);">
          <span id="queueCounter">Showing <strong>${filtered.length}</strong> of ${records.length} errors</span>
        </div>
      </div>

      <!-- Status Explanation Info Bar -->
      ${renderStatusLegend()}

      <!-- Bulk Actions Bar -->
      <div id="queueBulkActionsBar" style="display:${AppState.queueSelectedIds.length > 0 ? 'block' : 'none'};">
        <div class="bulk-actions-bar">
          <div class="bulk-selection-count" id="queueBulkCount">${AppState.queueSelectedIds.length} error(s) selected</div>
          <div class="bulk-actions-group">
            <span style="font-size:0.8rem;color:#94a3b8;">Set Status:</span>
            <button type="button" class="btn btn-secondary btn-sm" onclick="handleBulkStatus('in_review')">Mark In Review</button>
            <button type="button" class="btn btn-outline btn-sm" onclick="handleDeselectAllQueue()">Deselect All</button>
          </div>
        </div>
      </div>

      <!-- Queue Table -->
      <div class="table-card">
        <div class="table-responsive">
          <table class="data-table">
            <thead>
              <tr>
                <th style="width:40px;text-align:center;">
                  <input type="checkbox" id="queueSelectAllCheckbox" ${isAllSelected ? 'checked' : ''} onchange="handleToggleQueueSelectAll(this.checked)" aria-label="Select all" />
                </th>
                <th>Error Code</th>
                <th>Service</th>
                <th>Status</th>
                <th>Original AR Preview</th>
                <th>Corrected AR Preview</th>
                <th>Original EN Preview</th>
                <th>Corrected EN Preview</th>
                <th>Changed Fields</th>
                <th style="text-align:right;">Action</th>
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
function handleQueueChangeTypeChange(val) {
  AppState.queueChangeType = val;
  renderApp();
}
function clearQueueFilters() {
  AppState.queueSearch = "";
  AppState.queueService = "All";
  AppState.queueStatus = "All";
  AppState.queueChangeType = "All";
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
  showToast("Updated " + count + " error(s) to " + formatStatusLabel(newStatus) + ".");
}

// ==========================================================================
// 4. Product POV — All Errors Catalog View (Sortable, No Dates)
// ==========================================================================

function getFilteredAllErrorsRecords() {
  var records = errorStore.getAll();
  var search = AppState.allErrorsSearch.trim().toUpperCase();
  var cleanSearch = search.replace(/[^A-Z0-9]/g, "");
  var selectedService = AppState.allErrorsService;
  var selectedStatus = AppState.allErrorsStatus;
  var sortField = AppState.allErrorsSortField;
  var sortAsc = AppState.allErrorsSortAsc;

  var filtered = records.filter(function(r) {
    if (selectedService !== "All" && r.service !== selectedService) return false;
    if (selectedStatus !== "All" && r.status !== selectedStatus) return false;
    if (search) {
      var itemCode = r.errorCode.toUpperCase();
      var cleanCode = itemCode.replace(/[^A-Z0-9]/g, "");
      var codeMatch = itemCode.indexOf(search) !== -1 || (cleanSearch && cleanCode.indexOf(cleanSearch) !== -1);
      var arMatch = (r.originalArMessage || "").indexOf(AppState.allErrorsSearch.trim()) !== -1 || (r.correctedArMessage || "").indexOf(AppState.allErrorsSearch.trim()) !== -1;
      var enMatch = (r.originalEnMessage || "").toUpperCase().indexOf(search) !== -1 || (r.correctedEnMessage || "").toUpperCase().indexOf(search) !== -1;
      var meaningMatch = (r.meaning || "").toUpperCase().indexOf(search) !== -1;
      var triggerMatch = (r.approvedTrigger || "").toUpperCase().indexOf(search) !== -1;
      return codeMatch || arMatch || enMatch || meaningMatch || triggerMatch;
    }
    return true;
  });

  filtered.sort(function(a, b) {
    var valA = a[sortField] || "";
    var valB = b[sortField] || "";
    if (valA < valB) return sortAsc ? -1 : 1;
    if (valA > valB) return sortAsc ? 1 : -1;
    return 0;
  });

  return filtered;
}

function renderAllErrorsTableRows(filtered) {
  if (filtered.length === 0) {
    return '<tr><td colspan="7" style="text-align:center;padding:3rem;color:var(--text-muted);">No errors found matching criteria.</td></tr>';
  }
  return filtered.map(function(r) {
    return `
      <tr>
        <td><span class="code-badge">${escapeHtml(r.errorCode)}</span></td>
        <td><span class="service-badge">${escapeHtml(r.service)}</span></td>
        <td>${renderStatusBadge(r.status)}</td>
        <td style="max-width:220px;font-size:0.85rem;">${escapeHtml(r.meaning || "—")}</td>
        <td style="max-width:240px;font-size:0.85rem;color:var(--text-secondary);">${escapeHtml(r.approvedTrigger || "—")}</td>
        <td>${renderChangedBadges(r.changedFields)}</td>
        <td style="text-align:right;">
          <button type="button" class="btn btn-outline btn-sm" onclick="openReviewPage('${r.id}', 'all-errors')">
            Review &rarr;
          </button>
        </td>
      </tr>
    `;
  }).join("");
}

function renderProductAllErrorsPage() {
  var records = errorStore.getAll();
  var filtered = getFilteredAllErrorsRecords();
  var sortField = AppState.allErrorsSortField;
  var sortAsc = AppState.allErrorsSortAsc;

  return `
    <div style="display:flex;flex-direction:column;gap:1.25rem;">
      <div>
        <h2 style="font-size:1.4rem;font-weight:800;color:var(--navy-dark);">All Errors Catalog</h2>
        <p style="font-size:0.875rem;color:var(--text-secondary);">
          Complete error catalog with sortable columns across code, service, and status.
        </p>
      </div>

      <div class="filter-bar-card">
        <div class="search-input-row">
          <div class="search-box-wrapper">
            <svg class="search-box-icon" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="11" cy="11" r="8"></circle><line x1="21" y1="21" x2="16.65" y2="16.65"></line></svg>
            <input
              type="text"
              id="allErrorsSearchInput"
              class="search-box-input"
              placeholder="Search error catalog by code, meaning, trigger, message..."
              value="${escapeHtml(AppState.allErrorsSearch)}"
              oninput="handleAllErrorsSearchInput(this.value)"
              autocomplete="off"
            />
          </div>

          <div class="filters-row">
            <select class="filter-select" onchange="handleAllErrorsServiceChange(this.value)">
              <option value="All" ${AppState.allErrorsService === 'All' ? 'selected' : ''}>All Services (${records.length})</option>
              ${SERVICES.map(function(s) {
                return `<option value="${escapeHtml(s)}" ${AppState.allErrorsService === s ? 'selected' : ''}>${escapeHtml(s)}</option>`;
              }).join("")}
            </select>

            <select class="filter-select" onchange="handleAllErrorsStatusChange(this.value)">
              <option value="All" ${AppState.allErrorsStatus === 'All' ? 'selected' : ''}>All Statuses</option>
              <option value="change_request_cs" ${AppState.allErrorsStatus === 'change_request_cs' ? 'selected' : ''}>Change Request CS</option>
              <option value="not_reviewed" ${AppState.allErrorsStatus === 'not_reviewed' ? 'selected' : ''}>Not Reviewed</option>
              <option value="in_review" ${AppState.allErrorsStatus === 'in_review' ? 'selected' : ''}>In Review</option>
              <option value="ready_for_engineering" ${AppState.allErrorsStatus === 'ready_for_engineering' ? 'selected' : ''}>Ready for Engineering</option>
              <option value="implemented" ${AppState.allErrorsStatus === 'implemented' ? 'selected' : ''}>Implemented</option>
            </select>
          </div>
        </div>

        <div style="font-size:0.85rem;color:var(--text-muted);">
          <span id="allErrorsCounter">Showing <strong>${filtered.length}</strong> of ${records.length} errors</span>
        </div>
      </div>

      <div class="table-card">
        <div class="table-responsive">
          <table class="data-table">
            <thead>
              <tr>
                <th class="sortable" onclick="handleAllErrorsSort('errorCode')">
                  Error Code ${sortField === 'errorCode' ? (sortAsc ? '▲' : '▼') : ''}
                </th>
                <th class="sortable" onclick="handleAllErrorsSort('service')">
                  Service ${sortField === 'service' ? (sortAsc ? '▲' : '▼') : ''}
                </th>
                <th class="sortable" onclick="handleAllErrorsSort('status')">
                  Status ${sortField === 'status' ? (sortAsc ? '▲' : '▼') : ''}
                </th>
                <th>Meaning</th>
                <th>Approved Trigger</th>
                <th>Changed Fields</th>
                <th style="text-align:right;">Action</th>
              </tr>
            </thead>
            <tbody id="allErrorsTableBody">
              ${renderAllErrorsTableRows(filtered)}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  `;
}

function handleAllErrorsSearchInput(val) {
  AppState.allErrorsSearch = val;
  var filtered = getFilteredAllErrorsRecords();
  var tbody = document.getElementById("allErrorsTableBody");
  if (tbody) tbody.innerHTML = renderAllErrorsTableRows(filtered);
  var counter = document.getElementById("allErrorsCounter");
  if (counter) counter.innerHTML = "Showing <strong>" + filtered.length + "</strong> of " + errorStore.getAll().length + " errors";
}
function handleAllErrorsServiceChange(val) {
  AppState.allErrorsService = val;
  renderApp();
}
function handleAllErrorsStatusChange(val) {
  AppState.allErrorsStatus = val;
  renderApp();
}
function handleAllErrorsSort(field) {
  if (AppState.allErrorsSortField === field) {
    AppState.allErrorsSortAsc = !AppState.allErrorsSortAsc;
  } else {
    AppState.allErrorsSortField = field;
    AppState.allErrorsSortAsc = true;
  }
  renderApp();
}

// ==========================================================================
// 5. Product POV — Customer Support Requests Section
// ==========================================================================

function getFilteredCSRequests() {
  var records = errorStore.getAll();
  // Filter active requests submitted by CS (status == "change_request_cs" or having comment while in review)
  var requests = records.filter(function(r) {
    return r.status === "change_request_cs" || (r.status === "in_review" && r.customerSupportComment);
  });

  var search = AppState.csRequestsSearch.trim().toUpperCase();
  var selectedService = AppState.csRequestsService;

  return requests.filter(function(r) {
    if (selectedService !== "All" && r.service !== selectedService) return false;
    if (search) {
      return (
        r.errorCode.toUpperCase().indexOf(search) !== -1 ||
        (r.customerSupportComment || "").toUpperCase().indexOf(search) !== -1 ||
        (r.originalArMessage || "").indexOf(AppState.csRequestsSearch.trim()) !== -1 ||
        (r.originalEnMessage || "").toUpperCase().indexOf(search) !== -1
      );
    }
    return true;
  });
}

function renderCSRequestsTableRows(filtered) {
  if (filtered.length === 0) {
    return '<tr><td colspan="8" style="text-align:center;padding:3rem;color:var(--text-muted);">No active Customer Support requests in inbox.</td></tr>';
  }

  return filtered.map(function(r) {
    return `
      <tr>
        <td><span class="code-badge">${escapeHtml(r.errorCode)}</span></td>
        <td><span class="service-badge">${escapeHtml(r.service)}</span></td>
        <td><span style="font-size:0.8rem;font-weight:600;color:var(--brand-primary);">${escapeHtml(r.requestedField || "Messages")}</span></td>
        <td style="max-width:280px;">
          <div style="background:#fffbeb;border:1px solid #fde68a;padding:0.4rem 0.65rem;border-radius:var(--radius-sm);font-size:0.85rem;color:#92400e;">
            "${escapeHtml(r.customerSupportComment)}"
          </div>
        </td>
        <td class="preview-cell arabic-preview">${escapeHtml(r.originalArMessage)}</td>
        <td class="preview-cell">${escapeHtml(r.originalEnMessage)}</td>
        <td>${renderStatusBadge(r.status)}</td>
        <td style="text-align:right;">
          <button type="button" class="btn btn-outline btn-sm" onclick="openReviewPage('${r.id}', 'cs-requests')">
            Open Review &rarr;
          </button>
        </td>
      </tr>
    `;
  }).join("");
}

function renderCSRequestsPage() {
  var filtered = getFilteredCSRequests();

  return `
    <div style="display:flex;flex-direction:column;gap:1.25rem;">
      <div>
        <h2 style="font-size:1.4rem;font-weight:800;color:var(--navy-dark);">Customer Support Requests</h2>
        <p style="font-size:0.875rem;color:var(--text-secondary);">
          Review feedback submitted by Customer Support and prepare approved corrections for Engineering.
        </p>
      </div>

      <div class="filter-bar-card">
        <div class="search-input-row">
          <div class="search-box-wrapper">
            <svg class="search-box-icon" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="11" cy="11" r="8"></circle><line x1="21" y1="21" x2="16.65" y2="16.65"></line></svg>
            <input
              type="text"
              id="csRequestsSearchInput"
              class="search-box-input"
              placeholder="Search CS requests by code, comment, or message..."
              value="${escapeHtml(AppState.csRequestsSearch)}"
              oninput="handleCSRequestsSearchInput(this.value)"
              autocomplete="off"
            />
          </div>

          <div class="filters-row">
            <select class="filter-select" onchange="handleCSRequestsServiceChange(this.value)">
              <option value="All" ${AppState.csRequestsService === 'All' ? 'selected' : ''}>All Services</option>
              ${SERVICES.map(function(s) {
                return `<option value="${escapeHtml(s)}" ${AppState.csRequestsService === s ? 'selected' : ''}>${escapeHtml(s)}</option>`;
              }).join("")}
            </select>
          </div>
        </div>

        <div style="font-size:0.85rem;color:var(--text-muted);">
          <span id="csRequestsCounter">Active Requests: <strong>${filtered.length}</strong></span>
        </div>
      </div>

      <div class="table-card">
        <div class="table-responsive">
          <table class="data-table">
            <thead>
              <tr>
                <th>Error Code</th>
                <th>Service</th>
                <th>Requested Field</th>
                <th>Customer Support Comment</th>
                <th>Current AR Message</th>
                <th>Current EN Message</th>
                <th>Current Status</th>
                <th style="text-align:right;">Action</th>
              </tr>
            </thead>
            <tbody id="csRequestsTableBody">
              ${renderCSRequestsTableRows(filtered)}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  `;
}

function handleCSRequestsSearchInput(val) {
  AppState.csRequestsSearch = val;
  var filtered = getFilteredCSRequests();
  var tbody = document.getElementById("csRequestsTableBody");
  if (tbody) tbody.innerHTML = renderCSRequestsTableRows(filtered);
  var counter = document.getElementById("csRequestsCounter");
  if (counter) counter.innerHTML = "Active Requests: <strong>" + filtered.length + "</strong>";
}
function handleCSRequestsServiceChange(val) {
  AppState.csRequestsService = val;
  renderApp();
}

// ==========================================================================
// 6. Product POV — Tracking Ready Engineering (New Dedicated Section)
// ==========================================================================

function getFilteredTrackingReadyRecords() {
  var records = errorStore.getAll();
  var statusFilter = AppState.trackReadyStatus;
  var serviceFilter = AppState.trackReadyService;
  var search = AppState.trackReadySearch.trim().toUpperCase();
  var cleanSearch = search.replace(/[^A-Z0-9]/g, "");

  return records.filter(function(r) {
    if (statusFilter === "ready_for_engineering" && r.status !== "ready_for_engineering") return false;
    if (statusFilter === "implemented" && r.status !== "implemented") return false;
    if (statusFilter === "All" && r.status !== "ready_for_engineering" && r.status !== "implemented") return false;

    if (serviceFilter !== "All" && r.service !== serviceFilter) return false;

    if (search) {
      var itemCode = r.errorCode.toUpperCase();
      var cleanCode = itemCode.replace(/[^A-Z0-9]/g, "");
      var codeMatch = itemCode.indexOf(search) !== -1 || (cleanSearch && cleanCode.indexOf(cleanSearch) !== -1);
      var arMatch = (r.originalArMessage || "").indexOf(AppState.trackReadySearch.trim()) !== -1 || (r.correctedArMessage || "").indexOf(AppState.trackReadySearch.trim()) !== -1;
      var enMatch = (r.originalEnMessage || "").toUpperCase().indexOf(search) !== -1 || (r.correctedEnMessage || "").toUpperCase().indexOf(search) !== -1;
      var meaningMatch = (r.meaning || "").toUpperCase().indexOf(search) !== -1;
      return codeMatch || arMatch || enMatch || meaningMatch;
    }
    return true;
  });
}

function renderTrackingReadyTableRows(filtered) {
  if (filtered.length === 0) {
    return '<tr><td colspan="8" style="text-align:center;padding:3rem;color:var(--text-muted);">No records found in tracking queue.</td></tr>';
  }

  return filtered.map(function(r) {
    return `
      <tr>
        <td><span class="code-badge">${escapeHtml(r.errorCode)}</span></td>
        <td><span class="service-badge">${escapeHtml(r.service)}</span></td>
        <td style="font-family:var(--font-mono);font-size:0.75rem;color:var(--text-muted);">${escapeHtml(r.sourceReference)}</td>
        <td class="preview-cell arabic-preview" style="color:#047857;font-weight:600;">${escapeHtml(r.correctedArMessage || "—")}</td>
        <td class="preview-cell" style="color:#047857;font-weight:600;">${escapeHtml(r.correctedEnMessage || "—")}</td>
        <td style="max-width:220px;font-size:0.85rem;">${escapeHtml(r.meaning || "—")}</td>
        <td>${renderStatusBadge(r.status)}</td>
        <td style="text-align:right;white-space:nowrap;">
          <button type="button" class="btn btn-outline btn-sm" onclick="openReviewPage('${r.id}', 'tracking-ready')">
            Review Details &rarr;
          </button>
        </td>
      </tr>
    `;
  }).join("");
}

function renderTrackingReadyPage() {
  var records = errorStore.getAll();
  var readyCount = records.filter(function(r) { return r.status === "ready_for_engineering"; }).length;
  var implCount = records.filter(function(r) { return r.status === "implemented"; }).length;
  var filtered = getFilteredTrackingReadyRecords();

  return `
    <div style="display:flex;flex-direction:column;gap:1.25rem;">
      <div style="display:flex;justify-content:space-between;align-items:center;flex-wrap:wrap;gap:1rem;">
        <div>
          <h2 style="font-size:1.4rem;font-weight:800;color:var(--navy-dark);">Tracking Ready Engineering</h2>
          <p style="font-size:0.875rem;color:var(--text-secondary);">
            Track Product-approved bilingual error fixes awaiting codebase implementation by Engineering.
          </p>
        </div>
      </div>

      <!-- Quick Metrics Summary -->
      <div style="display:grid;grid-template-columns:repeat(auto-fit, minmax(240px, 1fr));gap:1rem;">
        <div style="background:#ffffff;padding:1rem 1.25rem;border-radius:var(--radius-md);border:1px solid #bfdbfe;border-left:4px solid #2563eb;">
          <div style="font-size:0.75rem;font-weight:700;text-transform:uppercase;color:#1e40af;">Pending Engineering Implementation</div>
          <div style="font-size:1.6rem;font-weight:800;color:#1e3a8a;">${readyCount}</div>
        </div>
        <div style="background:#ffffff;padding:1rem 1.25rem;border-radius:var(--radius-md);border:1px solid #bbf7d0;border-left:4px solid #16a34a;">
          <div style="font-size:0.75rem;font-weight:700;text-transform:uppercase;color:#166534;">Implemented in Code</div>
          <div style="font-size:1.6rem;font-weight:800;color:#14532d;">${implCount}</div>
        </div>
      </div>

      <!-- Filter Controls -->
      <div class="filter-bar-card">
        <div class="search-input-row">
          <div class="search-box-wrapper">
            <svg class="search-box-icon" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="11" cy="11" r="8"></circle><line x1="21" y1="21" x2="16.65" y2="16.65"></line></svg>
            <input
              type="text"
              id="trackReadySearchInput"
              class="search-box-input"
              placeholder="Search approved errors by code, message, or meaning..."
              value="${escapeHtml(AppState.trackReadySearch)}"
              oninput="handleTrackReadySearchInput(this.value)"
              autocomplete="off"
            />
          </div>

          <div class="filters-row">
            <select class="filter-select" onchange="handleTrackReadyStatusChange(this.value)" style="font-weight:600;">
              <option value="ready_for_engineering" ${AppState.trackReadyStatus === 'ready_for_engineering' ? 'selected' : ''}>Status: Ready for Engineering (${readyCount})</option>
              <option value="implemented" ${AppState.trackReadyStatus === 'implemented' ? 'selected' : ''}>Status: Implemented (${implCount})</option>
              <option value="All" ${AppState.trackReadyStatus === 'All' ? 'selected' : ''}>Status: All Approved (${readyCount + implCount})</option>
            </select>

            <select class="filter-select" onchange="handleTrackReadyServiceChange(this.value)">
              <option value="All" ${AppState.trackReadyService === 'All' ? 'selected' : ''}>All Services</option>
              ${SERVICES.map(function(s) {
                return `<option value="${escapeHtml(s)}" ${AppState.trackReadyService === s ? 'selected' : ''}>${escapeHtml(s)}</option>`;
              }).join("")}
            </select>
          </div>
        </div>

        <div style="font-size:0.85rem;color:var(--text-muted);">
          <span id="trackReadyCounter">Showing <strong>${filtered.length}</strong> tracked error fixes</span>
        </div>
      </div>

      <!-- Tracking Table -->
      <div class="table-card">
        <div class="table-responsive">
          <table class="data-table">
            <thead>
              <tr>
                <th>Error Code</th>
                <th>Service</th>
                <th>Source Reference</th>
                <th>Corrected AR (Live When Implemented)</th>
                <th>Corrected EN (Live When Implemented)</th>
                <th>Meaning</th>
                <th>Current Status</th>
                <th style="text-align:right;">Action</th>
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
}

function handleTrackReadySearchInput(val) {
  AppState.trackReadySearch = val;
  var filtered = getFilteredTrackingReadyRecords();
  var tbody = document.getElementById("trackReadyTableBody");
  if (tbody) tbody.innerHTML = renderTrackingReadyTableRows(filtered);
  var counter = document.getElementById("trackReadyCounter");
  if (counter) counter.innerHTML = "Showing <strong>" + filtered.length + "</strong> tracked error fixes";
}
function handleTrackReadyStatusChange(val) {
  AppState.trackReadyStatus = val;
  renderApp();
}
function handleTrackReadyServiceChange(val) {
  AppState.trackReadyService = val;
  renderApp();
}

// ==========================================================================
// 7. Product POV — Error Review Page (Diffs, CS Feedback, Strict Validation)
// ==========================================================================

function renderErrorReviewPage() {
  var allRecords = errorStore.getAll();
  var record = errorStore.getById(AppState.activeErrorId) || allRecords[0];
  var currentIndex = allRecords.findIndex(function(r) { return r.id === record.id; });
  var prevRecord = currentIndex > 0 ? allRecords[currentIndex - 1] : null;
  var nextRecord = currentIndex < allRecords.length - 1 ? allRecords[currentIndex + 1] : null;

  var form = AppState.reviewForm;
  var isArChanged = (form.correctedAr || "").trim() !== (record.originalArMessage || "").trim();
  var isEnChanged = (form.correctedEn || "").trim() !== (record.originalEnMessage || "").trim();

  return `
    <div style="display:flex;flex-direction:column;gap:1.5rem;">
      <!-- Header Bar -->
      <div class="review-page-header">
        <div style="display:flex;flex-direction:column;gap:0.4rem;">
          <div class="review-meta-group">
            <span class="code-badge" style="font-size:1.1rem;">${escapeHtml(record.errorCode)}</span>
            <span class="service-badge">${escapeHtml(record.service)}</span>
            ${renderStatusBadge(record.status)}
            <span class="source-ref-badge" title="Source code reference">📁 ${escapeHtml(record.sourceReference)}</span>
          </div>
        </div>

        <div style="display:flex;align-items:center;gap:0.5rem;">
          <button type="button" class="btn btn-secondary btn-sm" ${!prevRecord ? 'disabled' : ''} onclick="${prevRecord ? `openReviewPage('${prevRecord.id}', '${AppState.returnTab}')` : ''}">
            &larr; Previous
          </button>
          <span style="font-size:0.8rem;color:var(--text-muted);padding:0 0.25rem;">
            ${currentIndex + 1} of ${allRecords.length}
          </span>
          <button type="button" class="btn btn-secondary btn-sm" ${!nextRecord ? 'disabled' : ''} onclick="${nextRecord ? `openReviewPage('${nextRecord.id}', '${AppState.returnTab}')` : ''}">
            Next &rarr;
          </button>
          <button type="button" class="btn btn-outline btn-sm" onclick="setProductTab('${AppState.returnTab}')" style="margin-left:0.5rem;">
            &larr; Back to ${AppState.returnTab === 'all-errors' ? 'All Errors' : (AppState.returnTab === 'cs-requests' ? 'Customer Care Requests' : (AppState.returnTab === 'tracking-ready' ? 'Tracking Ready' : (AppState.returnTab === 'home' ? 'Dashboard' : 'Queue')))}
          </button>
        </div>
      </div>

      <!-- Customer Support Request Banner (If feedback exists) -->
      ${record.customerSupportComment ? `
        <div class="cs-request-banner">
          <div style="display:flex;align-items:center;justify-content:space-between;flex-wrap:wrap;gap:0.5rem;">
            <div style="display:flex;align-items:center;gap:0.5rem;">
              <span style="font-size:0.75rem;font-weight:800;text-transform:uppercase;color:#92400e;background:#fde68a;padding:0.15rem 0.5rem;border-radius:4px;">Customer Support Request</span>
              <span style="font-size:0.85rem;font-weight:700;color:#92400e;">Requested Field: ${escapeHtml(record.requestedField || "Messages")}</span>
            </div>
            <div>
              <span style="font-size:0.78rem;color:#78350f;">Current Status: <strong>${formatStatusLabel(record.status)}</strong></span>
            </div>
          </div>
          <div style="font-size:0.9rem;color:#78350f;margin-top:0.25rem;font-style:italic;">
            "${escapeHtml(record.customerSupportComment)}"
          </div>
        </div>
      ` : ''}

      <!-- Validation Error Alert Banner -->
      ${form.validationErrors.length > 0 ? `
        <div class="validation-alert-box">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"></circle><line x1="12" y1="8" x2="12" y2="12"></line><line x1="12" y1="16" x2="12.01" y2="16"></line></svg>
          <div>
            <strong>Ready for Engineering Blocked:</strong> All 5 fields below must contain values before approving:
            <ul style="padding-left:1.25rem;margin-top:0.25rem;font-size:0.825rem;">
              ${form.validationErrors.map(function(err) { return `<li>${escapeHtml(err)}</li>`; }).join("")}
            </ul>
          </div>
        </div>
      ` : ''}

      <!-- Arabic Message Side-by-Side Comparison -->
      <div class="diff-comparison-grid">
        <div class="diff-card original-card">
          <div class="diff-card-header">
            <span class="diff-card-title">
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="11" width="18" height="11" rx="2" ry="2"></rect><path d="M7 11V7a5 5 0 0 1 10 0v4"></path></svg>
              Original Arabic Message (Immutable)
            </span>
            <span class="diff-changed-tag unchanged">Read-Only</span>
          </div>
          <div class="read-only-msg-box arabic">${escapeHtml(record.originalArMessage)}</div>
        </div>

        <div class="diff-card corrected-card">
          <div class="diff-card-header">
            <span class="diff-card-title">
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path></svg>
              Corrected Arabic Message (Product) <span style="color:#dc2626;">*</span>
            </span>
            <div style="display:flex;align-items:center;gap:0.5rem;">
              <span class="diff-changed-tag ${isArChanged ? 'changed' : 'unchanged'}">
                ${isArChanged ? 'Changed' : 'Unchanged'}
              </span>
              ${isArChanged ? `
                <button type="button" class="btn btn-secondary btn-sm" onclick="handleResetAr('${record.id}')" title="Revert to original Arabic">Reset</button>
              ` : ''}
            </div>
          </div>
          <textarea
            class="editable-textarea arabic"
            rows="3"
            placeholder="أدخل نص رسالة الخطأ المصححة باللغة العربية..."
            oninput="AppState.reviewForm.correctedAr = this.value"
          >${escapeHtml(form.correctedAr)}</textarea>
        </div>
      </div>

      <!-- English Message Side-by-Side Comparison -->
      <div class="diff-comparison-grid">
        <div class="diff-card original-card">
          <div class="diff-card-header">
            <span class="diff-card-title">
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="11" width="18" height="11" rx="2" ry="2"></rect><path d="M7 11V7a5 5 0 0 1 10 0v4"></path></svg>
              Original English Message (Immutable)
            </span>
            <span class="diff-changed-tag unchanged">Read-Only</span>
          </div>
          <div class="read-only-msg-box">${escapeHtml(record.originalEnMessage)}</div>
        </div>

        <div class="diff-card corrected-card">
          <div class="diff-card-header">
            <span class="diff-card-title">
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path></svg>
              Corrected English Message (Product) <span style="color:#dc2626;">*</span>
            </span>
            <div style="display:flex;align-items:center;gap:0.5rem;">
              <span class="diff-changed-tag ${isEnChanged ? 'changed' : 'unchanged'}">
                ${isEnChanged ? 'Changed' : 'Unchanged'}
              </span>
              ${isEnChanged ? `
                <button type="button" class="btn btn-secondary btn-sm" onclick="handleResetEn('${record.id}')" title="Revert to original English">Reset</button>
              ` : ''}
            </div>
          </div>
          <textarea
            class="editable-textarea"
            rows="3"
            placeholder="Enter corrected English error message..."
            oninput="AppState.reviewForm.correctedEn = this.value"
          >${escapeHtml(form.correctedEn)}</textarea>
        </div>
      </div>

      <!-- Operational Information (AI Trigger, Approved Trigger, Meaning, Care Action) -->
      <div class="operational-info-card">
        <h3 style="font-size:1.1rem;font-weight:700;border-bottom:1px solid var(--border-subtle);padding-bottom:0.6rem;">
          Operational Diagnostics & Customer Support Information
        </h3>

        <div style="display:grid;grid-template-columns:1fr 1fr;gap:1.25rem;">
          <div>
            <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:0.35rem;">
              <label style="font-size:0.8rem;font-weight:700;text-transform:uppercase;color:var(--text-muted);">AI-Suggested Trigger</label>
              <span style="font-size:0.7rem;font-weight:700;color:#6366f1;background-color:#e0e7ff;padding:0.15rem 0.5rem;border-radius:4px;">Mock Extracted (Read-Only)</span>
            </div>
            <div class="read-only-msg-box" style="font-size:0.9rem;min-height:80px;">${escapeHtml(record.aiSuggestedTrigger || "No AI suggestion recorded.")}</div>
          </div>

          <div>
            <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:0.35rem;">
              <label style="font-size:0.8rem;font-weight:700;text-transform:uppercase;color:var(--text-secondary);">Approved Diagnostic Trigger <span style="color:#dc2626;">*</span></label>
              <span style="font-size:0.7rem;font-weight:700;color:#166534;background-color:#dcfce7;padding:0.15rem 0.5rem;border-radius:4px;">Editable</span>
            </div>
            <textarea
              class="editable-textarea"
              rows="3"
              placeholder="Define the exact condition that triggers this error in application code..."
              style="min-height:80px;"
              oninput="AppState.reviewForm.approvedTrigger = this.value"
            >${escapeHtml(form.approvedTrigger)}</textarea>
          </div>
        </div>

        <div>
          <label style="font-size:0.8rem;font-weight:700;text-transform:uppercase;color:var(--text-secondary);display:block;margin-bottom:0.35rem;">Meaning <span style="color:#dc2626;">*</span></label>
          <textarea
            class="editable-textarea"
            rows="2"
            placeholder="Explain the functional meaning and diagnostic context..."
            oninput="AppState.reviewForm.meaning = this.value"
          >${escapeHtml(form.meaning)}</textarea>
        </div>

        <div>
          <label style="font-size:0.8rem;font-weight:700;text-transform:uppercase;color:var(--text-secondary);display:block;margin-bottom:0.35rem;">Recommended Customer Support Action <span style="color:#dc2626;">*</span></label>
          <textarea
            class="editable-textarea"
            rows="3"
            placeholder="Step-by-step instructions for Customer Support handling this error..."
            style="border-left:4px solid #059669;"
            oninput="AppState.reviewForm.supportAction = this.value"
          >${escapeHtml(form.supportAction)}</textarea>
        </div>
      </div>

      <!-- Sticky Review Actions Bar -->
      <div class="review-actions-bar">
        <button type="button" class="btn btn-secondary" onclick="handleResetAllUnsaved('${record.id}')">Reset Unsaved Changes</button>

        <div style="display:flex;align-items:center;gap:0.75rem;flex-wrap:wrap;">
          <button type="button" class="btn btn-outline" onclick="handleSaveDraft('${record.id}')">Save Draft</button>
          <button type="button" class="btn btn-secondary" onclick="handleSetInReview('${record.id}')">Set In Review</button>
          <button type="button" class="btn btn-primary" onclick="handleSetReadyForEngineering('${record.id}')">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="9 11 12 14 22 4"></polyline></svg>
            Approve: Ready for Engineering
          </button>
        </div>
      </div>
    </div>
  `;
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
    renderApp();
    showToast("Reset unsaved changes to stored record.", "warning");
  }
}
function handleSaveDraft(id) {
  var form = AppState.reviewForm;
  var record = errorStore.getById(id);
  var nextStatus = (record.status === "not_reviewed" || record.status === "change_request_cs") ? "in_review" : record.status;
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

// ==========================================================================
// 7. Customer Support POV Views (Live Messages, Guided Edits, Request Changes)
// ==========================================================================

function renderSupportHomePage() {
  var allRecords = errorStore.getAll();
  var recents = errorStore.getRecentlyViewedRecords().slice(0, 6);
  var saved = errorStore.getSavedRecords();

  return `
    <div style="display:flex;flex-direction:column;gap:1.75rem;max-width:1000px;margin:0 auto;width:100%;">
      <!-- Search Hero -->
      <div style="background:#ffffff;padding:2rem;border-radius:var(--radius-lg);border:1px solid var(--border-subtle);box-shadow:var(--shadow-sm);text-align:center;">
        <h2 style="font-size:1.75rem;font-weight:800;color:var(--navy-dark);margin-bottom:0.4rem;">
          Customer Support Error Guide
        </h2>
        <p style="font-size:0.95rem;color:var(--text-secondary);margin-bottom:1.5rem;">
          Search active application errors to find diagnostic triggers and exact resolution actions.
        </p>

        <div style="position:relative;max-width:680px;margin:0 auto;">
          <div style="display:flex;align-items:center;position:relative;">
            <svg style="position:absolute;left:1.1rem;color:var(--text-muted);" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="11" cy="11" r="8"></circle><line x1="21" y1="21" x2="16.65" y2="16.65"></line></svg>
            <input
              type="text"
              id="supportHomeSearchInput"
              class="search-box-input"
              style="padding:0.95rem 3rem 0.95rem 3.2rem;font-size:1.05rem;border-radius:var(--radius-md);"
              placeholder="Search by code (e.g. AUTH_009, 009) or error message keywords..."
              value="${escapeHtml(AppState.supportHomeSearch || '')}"
              oninput="handleSupportHomeSearchInput(this.value)"
              autocomplete="off"
            />
          </div>

          <div id="supportHomeSuggestions"></div>
        </div>

        <div style="margin-top:1rem;display:flex;align-items:center;justify-content:center;gap:0.5rem;font-size:0.85rem;color:var(--text-muted);">
          <span>Total Application Errors: <strong>${allRecords.length}</strong></span>
          <span>&bull;</span>
          <button type="button" style="background:none;border:none;color:var(--support-primary);cursor:pointer;font-weight:700;" onclick="setSupportTab('all-errors')">
            Browse All Errors &rarr;
          </button>
        </div>
      </div>

      <!-- Panels Grid: Recently Viewed & Saved Errors -->
      <div style="display:grid;grid-template-columns:1fr 1fr;gap:1.25rem;">
        <div style="background:#ffffff;padding:1.25rem;border-radius:var(--radius-lg);border:1px solid var(--border-subtle);display:flex;flex-direction:column;gap:0.75rem;">
          <h3 style="font-size:0.95rem;font-weight:700;display:flex;align-items:center;gap:0.4rem;">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"></circle><polyline points="12 6 12 12 16 14"></polyline></svg>
            Recently Viewed
          </h3>
          ${recents.length === 0 ? `
            <p style="font-size:0.85rem;color:var(--text-muted);font-style:italic;padding:1rem 0;">Your recently opened error guides will appear here.</p>
          ` : `
            <div style="display:flex;flex-wrap:wrap;gap:0.5rem;">
              ${recents.map(function(r) {
                return `<button type="button" class="code-badge" style="cursor:pointer;border:1.5px solid var(--border-strong);" onclick="openSupportDetails('${r.id}', 'home')">${escapeHtml(r.errorCode)}</button>`;
              }).join("")}
            </div>
          `}
        </div>

        <div style="background:#ffffff;padding:1.25rem;border-radius:var(--radius-lg);border:1px solid var(--border-subtle);display:flex;flex-direction:column;gap:0.75rem;">
          <h3 style="font-size:0.95rem;font-weight:700;display:flex;align-items:center;gap:0.4rem;">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z"></path></svg>
            Saved Bookmarks (${saved.length})
          </h3>
          ${saved.length === 0 ? `
            <p style="font-size:0.85rem;color:var(--text-muted);font-style:italic;padding:1rem 0;">No saved errors. Bookmark frequently referenced codes.</p>
          ` : `
            <div style="display:flex;flex-wrap:wrap;gap:0.5rem;">
              ${saved.map(function(r) {
                return `<button type="button" class="code-badge" style="cursor:pointer;border:1.5px solid var(--border-strong);" onclick="openSupportDetails('${r.id}', 'home')">${escapeHtml(r.errorCode)}</button>`;
              }).join("")}
            </div>
          `}
        </div>
      </div>

      <!-- Browse by Service Domain -->
      <div style="background:#ffffff;padding:1.25rem;border-radius:var(--radius-lg);border:1px solid var(--border-subtle);">
        <h3 style="font-size:0.95rem;font-weight:700;margin-bottom:0.85rem;">Browse by Service Domain</h3>
        <div style="display:flex;flex-wrap:wrap;gap:0.5rem;">
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
    // Check current implemented message
    var enMsg = (r.status === "implemented" ? r.correctedEnMessage : r.originalEnMessage) || "";
    var arMsg = (r.status === "implemented" ? r.correctedArMessage : r.originalArMessage) || "";
    var enMatch = enMsg.toUpperCase().indexOf(q) !== -1;
    var arMatch = arMsg.indexOf(val.trim()) !== -1;
    return codeMatch || meaningMatch || enMatch || arMatch;
  });

  if (matches.length === 0) {
    container.innerHTML = '<div style="position:absolute;top:calc(100% + 6px);left:0;right:0;background:#ffffff;border:1.5px solid var(--border-strong);border-radius:var(--radius-md);box-shadow:var(--shadow-lg);padding:1rem;z-index:100;color:var(--text-muted);">No matching errors found.</div>';
    return;
  }

  var html = '<ul style="position:absolute;top:calc(100% + 6px);left:0;right:0;background:#ffffff;border:1.5px solid var(--border-strong);border-radius:var(--radius-md);box-shadow:var(--shadow-lg);list-style:none;z-index:100;max-height:280px;overflow-y:auto;padding:0.4rem;text-align:left;">';
  matches.forEach(function(s) {
    var displayMsg = s.status === "implemented" ? (s.correctedEnMessage || s.meaning) : (s.originalEnMessage || s.meaning);
    html += `
      <li style="display:flex;align-items:center;justify-content:space-between;padding:0.75rem 1rem;border-radius:var(--radius-sm);cursor:pointer;gap:0.75rem;" onmouseenter="this.style.backgroundColor='var(--surface-highlight)'" onmouseleave="this.style.backgroundColor='transparent'" onclick="openSupportDetails('${s.id}', 'home')">
        <span class="code-badge">${escapeHtml(s.errorCode)}</span>
        <span style="font-size:0.9rem;color:var(--text-primary);flex:1;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;">${escapeHtml(s.meaning || displayMsg)}</span>
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

// 8. Customer Support POV — All Errors Catalog View
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
      var enMsg = (r.status === "implemented" ? r.correctedEnMessage : r.originalEnMessage) || "";
      var arMsg = (r.status === "implemented" ? r.correctedArMessage : r.originalArMessage) || "";
      var enMatch = enMsg.toUpperCase().indexOf(search) !== -1;
      var arMatch = arMsg.indexOf(AppState.supportSearch.trim()) !== -1;

      return codeMatch || meaningMatch || triggerMatch || actionMatch || enMatch || arMatch;
    }
    return true;
  });
}

function renderSupportCatalogTableRows(filtered) {
  if (filtered.length === 0) {
    return '<tr><td colspan="6" style="text-align:center;padding:3rem;color:var(--text-muted);">No error records found matching search.</td></tr>';
  }

  return filtered.map(function(r) {
    return `
      <tr onclick="openSupportDetails('${r.id}', 'all-errors')" style="cursor:pointer;">
        <td><span class="code-badge">${escapeHtml(r.errorCode)}</span></td>
        <td style="font-weight:600;">${escapeHtml(r.meaning || "—")}</td>
        <td style="color:var(--text-secondary);font-size:0.85rem;">${escapeHtml(r.approvedTrigger || "—")}</td>
        <td>
          <div style="color:#065f46;background-color:#f0fdf4;padding:0.5rem 0.75rem;border-radius:var(--radius-sm);border-left:3px solid #10b981;font-size:0.85rem;line-height:1.5;">
            ${escapeHtml(r.customerSupportAction || "Follow standard troubleshooting protocols.")}
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
    <div style="display:flex;flex-direction:column;gap:1.25rem;">
      <div>
        <h2 style="font-size:1.4rem;font-weight:800;color:var(--navy-dark);">Customer Support Error Catalog</h2>
        <p style="font-size:0.875rem;color:var(--text-secondary);">
          Official support reference guide containing verified error meanings, diagnostic triggers, and customer care actions.
        </p>
      </div>

      <div class="filter-bar-card">
        <div class="search-input-row">
          <div class="search-box-wrapper">
            <svg class="search-box-icon" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="11" cy="11" r="8"></circle><line x1="21" y1="21" x2="16.65" y2="16.65"></line></svg>
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

        <div style="font-size:0.85rem;color:var(--text-muted);">
          <span id="supportCatalogCounter">Showing <strong>${filtered.length}</strong> of ${records.length} errors</span>
        </div>
      </div>

      <div class="table-card">
        <div class="table-responsive">
          <table class="data-table">
            <thead>
              <tr>
                <th style="width:120px;">Error Code</th>
                <th style="width:20%;">Meaning</th>
                <th style="width:20%;">Diagnostic Trigger</th>
                <th style="width:35%;">Recommended Support Action</th>
                <th style="width:120px;">Service</th>
                <th style="width:90px;text-align:center;">Save</th>
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

// 9. Customer Support POV — Error Details View (Live Messages Only, Operational Editable, Request Change)
function renderSupportDetailsPage() {
  var record = errorStore.getById(AppState.activeErrorId) || errorStore.getAll()[0];
  if (!record) {
    return `<div style="text-align:center;padding:3rem;"><h3>Error not found</h3><button type="button" class="btn btn-primary" onclick="setSupportTab('all-errors')">Back</button></div>`;
  }

  // Error Visibility Rule:
  // If status !== "implemented", show original AR/EN copy.
  // If status === "implemented", show corrected AR/EN copy.
  var liveArMessage = record.status === "implemented" ? record.correctedArMessage : record.originalArMessage;
  var liveEnMessage = record.status === "implemented" ? record.correctedEnMessage : record.originalEnMessage;

  return `
    <div style="display:flex;flex-direction:column;gap:1.5rem;max-width:900px;margin:0 auto;width:100%;">
      <!-- Header -->
      <div style="background:#ffffff;padding:1.35rem 1.5rem;border-radius:var(--radius-lg);border:1px solid var(--border-subtle);display:flex;justify-content:space-between;align-items:center;flex-wrap:wrap;gap:1rem;">
        <div style="display:flex;align-items:center;gap:0.85rem;">
          <span class="code-badge" style="font-size:1.25rem;padding:0.3rem 0.85rem;">${escapeHtml(record.errorCode)}</span>
          <span class="service-badge">${escapeHtml(record.service)}</span>
        </div>
        <div style="display:flex;align-items:center;gap:0.5rem;flex-wrap:wrap;">
          <button type="button" class="btn btn-warning btn-sm" onclick="openCSRequestModal('${record.id}')">
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path></svg>
            Request Message Change
          </button>
          <button type="button" class="support-save-btn ${record.saved ? 'saved' : 'unsaved'}" onclick="handleSupportToggleSave('${record.id}', '${escapeHtml(record.errorCode)}')">
            ${record.saved ? '★ Saved in Bookmarks' : '☆ Save Error'}
          </button>
          <button type="button" class="btn btn-outline btn-sm" onclick="setSupportTab('${AppState.returnTab}')">
            &larr; Back
          </button>
        </div>
      </div>

      <!-- Live User-Facing Messages Card (Read-Only to CS) -->
      <div style="background:#ffffff;padding:1.5rem;border-radius:var(--radius-lg);border:1px solid var(--border-subtle);display:flex;flex-direction:column;gap:1rem;">
        <div style="display:flex;align-items:center;justify-content:space-between;">
          <h3 style="font-size:0.95rem;font-weight:700;color:var(--text-secondary);text-transform:uppercase;letter-spacing:0.04em;">
            Current Live Application Messages
          </h3>
          <span style="font-size:0.75rem;color:var(--text-muted);background:#f1f5f9;padding:0.2rem 0.5rem;border-radius:4px;">
            ${record.status === 'implemented' ? '✓ Implemented Production Copy' : 'Current Production Baseline Copy'}
          </span>
        </div>

        <div style="display:grid;grid-template-columns:1fr 1fr;gap:1rem;">
          <div>
            <span style="font-size:0.75rem;font-weight:700;color:var(--text-muted);display:block;margin-bottom:0.3rem;">Arabic Application Message (Read-Only)</span>
            <div class="read-only-msg-box arabic">${escapeHtml(liveArMessage)}</div>
          </div>
          <div>
            <span style="font-size:0.75rem;font-weight:700;color:var(--text-muted);display:block;margin-bottom:0.3rem;">English Application Message (Read-Only)</span>
            <div class="read-only-msg-box">${escapeHtml(liveEnMessage)}</div>
          </div>
        </div>
      </div>

      <!-- Operational Meaning, Trigger & Action (Editable by CS) -->
      <div style="background:#ffffff;padding:1.5rem;border-radius:var(--radius-lg);border:1px solid var(--border-subtle);display:flex;flex-direction:column;gap:1.25rem;">
        <div style="display:flex;align-items:center;justify-content:space-between;">
          <h3 style="font-size:0.95rem;font-weight:700;color:var(--text-secondary);text-transform:uppercase;letter-spacing:0.04em;">
            Operational Guidance (Editable by Support)
          </h3>
          <span style="font-size:0.75rem;color:#047857;background:#ecfdf5;padding:0.2rem 0.5rem;border-radius:4px;font-weight:600;">
            Support Team Editable
          </span>
        </div>

        <div>
          <label style="font-size:0.8rem;font-weight:700;text-transform:uppercase;color:var(--text-secondary);display:block;margin-bottom:0.35rem;">Meaning</label>
          <textarea
            class="editable-textarea"
            rows="2"
            id="csMeaningInput"
            placeholder="Functional meaning of this error..."
            oninput="AppState.csDetailsMeaning = this.value"
          >${escapeHtml(AppState.csDetailsMeaning)}</textarea>
        </div>

        <div>
          <label style="font-size:0.8rem;font-weight:700;text-transform:uppercase;color:var(--text-secondary);display:block;margin-bottom:0.35rem;">Diagnostic Trigger</label>
          <textarea
            class="editable-textarea"
            rows="2"
            id="csTriggerInput"
            placeholder="Circumstances that trigger this error..."
            oninput="AppState.csDetailsTrigger = this.value"
          >${escapeHtml(AppState.csDetailsTrigger)}</textarea>
        </div>

        <div>
          <label style="font-size:0.85rem;font-weight:800;color:#065f46;text-transform:uppercase;display:block;margin-bottom:0.4rem;">
            Recommended Customer Support Action
          </label>
          <textarea
            class="editable-textarea"
            rows="3"
            id="csActionInput"
            style="border-left:4px solid #059669;"
            placeholder="Actionable steps for support agents to guide the customer..."
            oninput="AppState.csDetailsAction = this.value"
          >${escapeHtml(AppState.csDetailsAction)}</textarea>
        </div>

        <div style="display:flex;justify-content:flex-end;">
          <button type="button" class="btn btn-success" onclick="handleSaveCSOperationalGuidance('${record.id}')">
            Save Operational Guidance
          </button>
        </div>
      </div>
    </div>
  `;
}

function handleSaveCSOperationalGuidance(id) {
  errorStore.updateOperationalFields(id, {
    meaning: AppState.csDetailsMeaning,
    approvedTrigger: AppState.csDetailsTrigger,
    customerSupportAction: AppState.csDetailsAction
  });
  renderApp();
  showToast("Operational guidance saved successfully.");
}

// 10. Customer Support POV — Saved Errors
function renderSupportSavedPage() {
  var saved = errorStore.getSavedRecords();

  return `
    <div style="display:flex;flex-direction:column;gap:1.25rem;">
      <div>
        <h2 style="font-size:1.4rem;font-weight:800;color:var(--navy-dark);">Saved Errors</h2>
        <p style="font-size:0.875rem;color:var(--text-secondary);">Your bookmarked error codes for rapid customer troubleshooting.</p>
      </div>

      <div class="table-card">
        <div class="table-responsive">
          <table class="data-table">
            <thead>
              <tr>
                <th>Error Code</th>
                <th>Service</th>
                <th>Meaning</th>
                <th>Recommended Customer Support Action</th>
                <th style="text-align:right;">Actions</th>
              </tr>
            </thead>
            <tbody>
              ${saved.length === 0 ? `
                <tr><td colspan="5" style="text-align:center;padding:3rem;color:var(--text-muted);">You have no saved errors. Bookmark frequently referenced errors from the catalog.</td></tr>
              ` : saved.map(function(r) {
                return `
                  <tr onclick="openSupportDetails('${r.id}', 'saved')" style="cursor:pointer;">
                    <td><span class="code-badge">${escapeHtml(r.errorCode)}</span></td>
                    <td><span class="service-badge">${escapeHtml(r.service)}</span></td>
                    <td style="font-weight:600;">${escapeHtml(r.meaning || "—")}</td>
                    <td style="max-width:320px;font-size:0.85rem;">${escapeHtml(r.customerSupportAction || "—")}</td>
                    <td style="text-align:right;" onclick="event.stopPropagation()">
                      <button type="button" class="btn btn-secondary btn-sm" onclick="handleSupportToggleSave('${r.id}', '${escapeHtml(r.errorCode)}')">
                        Remove Bookmark
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

// 11. Customer Support POV — Track Requests
function getFilteredSupportTrackRequests() {
  var records = errorStore.getAll();
  // Records with CS feedback
  var requests = records.filter(function(r) {
    return !!r.customerSupportComment;
  });

  var search = AppState.supportTrackSearch.trim().toUpperCase();
  if (!search) return requests;

  return requests.filter(function(r) {
    return (
      r.errorCode.toUpperCase().indexOf(search) !== -1 ||
      (r.customerSupportComment || "").toUpperCase().indexOf(search) !== -1
    );
  });
}

function renderSupportTrackTableRows(requests) {
  if (requests.length === 0) {
    return '<tr><td colspan="6" style="text-align:center;padding:3rem;color:var(--text-muted);">No submitted change requests found.</td></tr>';
  }

  return requests.map(function(r) {
    return `
      <tr>
        <td><span class="code-badge">${escapeHtml(r.errorCode)}</span></td>
        <td><span style="font-weight:600;font-size:0.85rem;color:var(--brand-primary);">${escapeHtml(r.requestedField || "Both Arabic and English Messages")}</span></td>
        <td style="max-width:300px;">
          <div style="background:#fffbeb;border:1px solid #fde68a;padding:0.4rem 0.65rem;border-radius:var(--radius-sm);font-size:0.85rem;color:#92400e;">
            "${escapeHtml(r.customerSupportComment)}"
          </div>
        </td>
        <td>${renderStatusBadge(r.status)}</td>
        <td style="font-size:0.85rem;color:var(--text-secondary);">${escapeHtml(r.productResponse || "Under Product Review")}</td>
        <td style="text-align:right;">
          <button type="button" class="btn btn-outline btn-sm" onclick="openSupportDetails('${r.id}', 'track-requests')">
            Open Error &rarr;
          </button>
        </td>
      </tr>
    `;
  }).join("");
}

function renderSupportTrackRequestsPage() {
  var requests = getFilteredSupportTrackRequests();

  return `
    <div style="display:flex;flex-direction:column;gap:1.25rem;">
      <div>
        <h2 style="font-size:1.4rem;font-weight:800;color:var(--navy-dark);">Track Requests</h2>
        <p style="font-size:0.875rem;color:var(--text-secondary);">
          Monitor the shared lifecycle status of your message improvement requests submitted to Product and Engineering.
        </p>
      </div>

      <div class="filter-bar-card">
        <div class="search-input-row">
          <div class="search-box-wrapper">
            <svg class="search-box-icon" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="11" cy="11" r="8"></circle><line x1="21" y1="21" x2="16.65" y2="16.65"></line></svg>
            <input
              type="text"
              id="supportTrackSearchInput"
              class="search-box-input"
              placeholder="Search your submitted requests by code or comment..."
              value="${escapeHtml(AppState.supportTrackSearch)}"
              oninput="handleSupportTrackSearchInput(this.value)"
              autocomplete="off"
            />
          </div>
        </div>
      </div>

      <!-- Status Explanation Bar -->
      ${renderStatusLegend()}

      <div class="table-card">
        <div class="table-responsive">
          <table class="data-table">
            <thead>
              <tr>
                <th>Error Code</th>
                <th>Requested Field</th>
                <th>Submitted Comment</th>
                <th>Current Status</th>
                <th>Product Response</th>
                <th style="text-align:right;">Action</th>
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
// 8. Engineering POV Views (Ready Queue, Confirm Implemented, Export Center)
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
    return '<tr><td colspan="12" style="text-align:center;padding:3rem;color:var(--text-muted);">No errors currently in Ready for Engineering status.</td></tr>';
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
        <td class="preview-cell arabic-preview">${escapeHtml(r.originalArMessage)}</td>
        <td class="preview-cell arabic-preview" style="color:#047857;font-weight:700;">${escapeHtml(r.correctedArMessage)}</td>
        <td class="preview-cell">${escapeHtml(r.originalEnMessage)}</td>
        <td class="preview-cell" style="color:#047857;font-weight:700;">${escapeHtml(r.correctedEnMessage)}</td>
        <td class="preview-cell">${escapeHtml(r.approvedTrigger)}</td>
        <td class="preview-cell">${escapeHtml(r.meaning)}</td>
        <td class="preview-cell">${escapeHtml(r.customerSupportAction)}</td>
        <td style="max-width:180px;font-size:0.8rem;color:#92400e;">${escapeHtml(r.customerSupportComment || "—")}</td>
        <td style="text-align:right;white-space:nowrap;">
          <button type="button" class="btn btn-success btn-sm" onclick="openEngConfirmModal('${r.id}')" style="margin-right:0.35rem;">
            Mark as Implemented
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

  return `
    <div style="display:flex;flex-direction:column;gap:1.25rem;">
      <div style="display:flex;justify-content:space-between;align-items:center;flex-wrap:wrap;gap:1rem;">
        <div>
          <h2 style="font-size:1.4rem;font-weight:800;color:var(--navy-dark);">Ready for Engineering Queue</h2>
          <p style="font-size:0.875rem;color:var(--text-secondary);">
            Product-approved bilingual error corrections ready for codebase deployment.
          </p>
        </div>
        <div style="display:flex;align-items:center;gap:0.5rem;flex-wrap:wrap;">
          <!-- Format Selector for Export -->
          <select class="filter-select" onchange="handleEngExportFormatChange(this.value)" style="font-weight:700;border-color:var(--brand-accent);" title="Select Export Format">
            <option value="csv" ${AppState.engExportFormat === 'csv' ? 'selected' : ''}>Format: CSV (.csv)</option>
            <option value="md" ${AppState.engExportFormat === 'md' ? 'selected' : ''}>Format: Markdown (.md)</option>
            <option value="html" ${AppState.engExportFormat === 'html' ? 'selected' : ''}>Format: HTML (.html)</option>
          </select>

          <!-- Export Selected Button -->
          <button type="button" class="btn btn-engineering" onclick="handleExportEngSelected()">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path><polyline points="7 10 12 15 17 10"></polyline><line x1="12" y1="15" x2="12" y2="3"></line></svg>
            Export Selected (${AppState.engSelectedIds.length})
          </button>

          <!-- Implement All Button -->
          <button type="button" class="btn btn-success" onclick="handleImplementAllEngErrors()" title="Mark all ready errors as Implemented in code">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="20 6 9 17 4 12"></polyline></svg>
            Implement All (${filtered.length})
          </button>

          ${AppState.engSelectedIds.length > 0 ? `
            <button type="button" class="btn btn-outline btn-sm" onclick="handleImplementSelectedEngErrors()" title="Mark only selected errors as Implemented">
              Implement Selected (${AppState.engSelectedIds.length})
            </button>
          ` : ''}
        </div>
      </div>

      <div class="filter-bar-card">
        <div class="search-input-row">
          <div class="search-box-wrapper">
            <svg class="search-box-icon" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="11" cy="11" r="8"></circle><line x1="21" y1="21" x2="16.65" y2="16.65"></line></svg>
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

        <div style="display:flex;justify-content:space-between;align-items:center;font-size:0.85rem;color:var(--text-muted);flex-wrap:wrap;gap:0.5rem;">
          <span id="engQueueCounter">Pending Engineering Fixes: <strong>${filtered.length}</strong> | Selected: <strong>${AppState.engSelectedIds.length}</strong></span>
          <span>Status: <strong>Ready for Engineering</strong> &bull; Formats: <strong>CSV, MD, HTML</strong></span>
        </div>
      </div>

      <div class="table-card">
        <div class="table-responsive">
          <table class="data-table">
            <thead>
              <tr>
                <th style="width:40px;text-align:center;">
                  <input type="checkbox" ${isAllSelected ? 'checked' : ''} onchange="handleToggleEngSelectAll(this.checked)" aria-label="Select all" />
                </th>
                <th>Error Code</th>
                <th>Service</th>
                <th>Original AR</th>
                <th>Corrected AR</th>
                <th>Original EN</th>
                <th>Corrected EN</th>
                <th>Approved Trigger</th>
                <th>Meaning</th>
                <th>Customer Support Action</th>
                <th>CS Comment</th>
                <th style="text-align:right;">Actions</th>
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
  showToast("Exported " + selected.length + " selected error fixes to " + fmt.toUpperCase() + " (7 core columns).");
}
function handleImplementAllEngErrors() {
  var readyErrors = errorStore.getAll().filter(function(r) {
    return r.status === "ready_for_engineering";
  });
  if (readyErrors.length === 0) {
    showToast("No errors currently in Ready for Engineering queue.", "info");
    return;
  }
  if (confirm("Mark all " + readyErrors.length + " error fixes as Implemented in codebase? This will update their status to 'Implemented' and make their corrected messages live immediately.")) {
    var ids = readyErrors.map(function(r) { return r.id; });
    var count = errorStore.bulkUpdateStatus(ids, "implemented");
    AppState.engSelectedIds = [];
    renderApp();
    showToast("Successfully implemented all " + count + " error fixes in codebase!", "success");
  }
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
  if (confirm("Mark " + selected.length + " selected error fix(es) as Implemented in codebase?")) {
    var ids = selected.map(function(r) { return r.id; });
    var count = errorStore.bulkUpdateStatus(ids, "implemented");
    AppState.engSelectedIds = [];
    renderApp();
    showToast("Successfully implemented " + count + " selected error fixes in codebase!", "success");
  }
}

// 12. Engineering POV — Implemented Errors View
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
    return '<tr><td colspan="7" style="text-align:center;padding:3rem;color:var(--text-muted);">No implemented error records found.</td></tr>';
  }

  return filtered.map(function(r) {
    return `
      <tr>
        <td><span class="code-badge">${escapeHtml(r.errorCode)}</span></td>
        <td><span class="service-badge">${escapeHtml(r.service)}</span></td>
        <td class="preview-cell arabic-preview" style="color:#047857;font-weight:600;">${escapeHtml(r.correctedArMessage)}</td>
        <td class="preview-cell" style="color:#047857;font-weight:600;">${escapeHtml(r.correctedEnMessage)}</td>
        <td class="preview-cell">${escapeHtml(r.meaning)}</td>
        <td>${renderStatusBadge(r.status)}</td>
        <td style="text-align:right;">
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
    <div style="display:flex;flex-direction:column;gap:1.25rem;">
      <div>
        <h2 style="font-size:1.4rem;font-weight:800;color:var(--navy-dark);">Implemented Errors</h2>
        <p style="font-size:0.875rem;color:var(--text-secondary);">
          Error corrections confirmed applied in source code. These live messages are now reflected in Customer Support.
        </p>
      </div>

      <div class="filter-bar-card">
        <div class="search-input-row">
          <div class="search-box-wrapper">
            <svg class="search-box-icon" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="11" cy="11" r="8"></circle><line x1="21" y1="21" x2="16.65" y2="16.65"></line></svg>
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

        <div style="font-size:0.85rem;color:var(--text-muted);">
          <span id="engImplCounter">Total Implemented: <strong>${filtered.length}</strong></span>
        </div>
      </div>

      <div class="table-card">
        <div class="table-responsive">
          <table class="data-table">
            <thead>
              <tr>
                <th>Error Code</th>
                <th>Service</th>
                <th>Corrected AR Message</th>
                <th>Corrected EN Message</th>
                <th>Meaning</th>
                <th>Status</th>
                <th style="text-align:right;">Action</th>
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

// 13. Engineering POV — Error Details Page
function renderEngineeringDetailsPage() {
  var record = errorStore.getById(AppState.activeErrorId) || errorStore.getAll()[0];
  if (!record) {
    return `<div style="text-align:center;padding:3rem;"><h3>Error not found</h3><button type="button" class="btn btn-primary" onclick="setEngineeringTab('queue')">Back</button></div>`;
  }

  return `
    <div style="display:flex;flex-direction:column;gap:1.5rem;max-width:960px;margin:0 auto;width:100%;">
      <!-- Header -->
      <div style="background:#ffffff;padding:1.35rem 1.5rem;border-radius:var(--radius-lg);border:1px solid var(--border-subtle);display:flex;justify-content:space-between;align-items:center;flex-wrap:wrap;gap:1rem;">
        <div style="display:flex;align-items:center;gap:0.85rem;">
          <span class="code-badge" style="font-size:1.25rem;padding:0.3rem 0.85rem;">${escapeHtml(record.errorCode)}</span>
          <span class="service-badge">${escapeHtml(record.service)}</span>
          ${renderStatusBadge(record.status)}
          <span class="source-ref-badge">📁 ${escapeHtml(record.sourceReference)}</span>
        </div>
        <div style="display:flex;align-items:center;gap:0.5rem;">
          ${record.status === 'ready_for_engineering' ? `
            <button type="button" class="btn btn-success" onclick="openEngConfirmModal('${record.id}')">
              Mark as Implemented
            </button>
          ` : ''}
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
            <span class="diff-changed-tag unchanged">Original</span>
          </div>
          <div class="read-only-msg-box arabic">${escapeHtml(record.originalArMessage)}</div>
        </div>

        <div class="diff-card corrected-card">
          <div class="diff-card-header">
            <span class="diff-card-title">Corrected Arabic Message (To Apply in Code)</span>
            <span class="diff-changed-tag changed">Approved Fix</span>
          </div>
          <div class="read-only-msg-box arabic" style="background:#ecfdf5;border-color:#a7f3d0;font-weight:600;">${escapeHtml(record.correctedArMessage)}</div>
        </div>
      </div>

      <div class="diff-comparison-grid">
        <div class="diff-card original-card">
          <div class="diff-card-header">
            <span class="diff-card-title">Original English Message</span>
            <span class="diff-changed-tag unchanged">Original</span>
          </div>
          <div class="read-only-msg-box">${escapeHtml(record.originalEnMessage)}</div>
        </div>

        <div class="diff-card corrected-card">
          <div class="diff-card-header">
            <span class="diff-card-title">Corrected English Message (To Apply in Code)</span>
            <span class="diff-changed-tag changed">Approved Fix</span>
          </div>
          <div class="read-only-msg-box" style="background:#ecfdf5;border-color:#a7f3d0;font-weight:600;">${escapeHtml(record.correctedEnMessage)}</div>
        </div>
      </div>

      <!-- Operational Metadata -->
      <div class="operational-info-card">
        <h3 style="font-size:1rem;font-weight:700;border-bottom:1px solid var(--border-subtle);padding-bottom:0.5rem;">
          Diagnostic Specifications
        </h3>

        <div>
          <span style="font-size:0.75rem;font-weight:700;color:var(--text-muted);text-transform:uppercase;display:block;margin-bottom:0.25rem;">Approved Diagnostic Trigger</span>
          <div class="read-only-msg-box" style="min-height:auto;">${escapeHtml(record.approvedTrigger)}</div>
        </div>

        <div>
          <span style="font-size:0.75rem;font-weight:700;color:var(--text-muted);text-transform:uppercase;display:block;margin-bottom:0.25rem;">Meaning</span>
          <div class="read-only-msg-box" style="min-height:auto;">${escapeHtml(record.meaning)}</div>
        </div>

        <div>
          <span style="font-size:0.75rem;font-weight:700;color:var(--text-muted);text-transform:uppercase;display:block;margin-bottom:0.25rem;">Recommended Customer Support Action</span>
          <div class="read-only-msg-box" style="min-height:auto;">${escapeHtml(record.customerSupportAction)}</div>
        </div>

        ${record.customerSupportComment ? `
          <div>
            <span style="font-size:0.75rem;font-weight:700;color:#92400e;text-transform:uppercase;display:block;margin-bottom:0.25rem;">Customer Support Comment</span>
            <div style="background:#fffbeb;border:1px solid #fde68a;padding:0.75rem;border-radius:var(--radius-md);color:#92400e;font-size:0.9rem;">
              "${escapeHtml(record.customerSupportComment)}"
            </div>
          </div>
        ` : ''}
      </div>
    </div>
  `;
}

// ==========================================================================
// 14. Engineering Export Center (Full Page, 7 Core Columns Only)
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
    return '<tr><td colspan="8" style="text-align:center;padding:3rem;color:var(--text-muted);">No records found matching export criteria.</td></tr>';
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
        <td style="font-size:0.75rem;font-family:var(--font-mono);color:var(--text-muted);">${escapeHtml(r.sourceReference)}</td>
        <td class="preview-cell arabic-preview">${escapeHtml(r.originalArMessage)}</td>
        <td class="preview-cell arabic-preview" style="color:#047857;font-weight:600;">${escapeHtml(r.correctedArMessage || "—")}</td>
        <td class="preview-cell">${escapeHtml(r.originalEnMessage)}</td>
        <td class="preview-cell" style="color:#047857;font-weight:600;">${escapeHtml(r.correctedEnMessage || "—")}</td>
      </tr>
    `;
  }).join("");
}

function renderEngineeringExportPage() {
  var records = errorStore.getAll();
  var filtered = getFilteredExportRecords();
  var isAllSelected = filtered.length > 0 && AppState.exportSelectedIds.length === filtered.length;

  return `
    <div style="display:flex;flex-direction:column;gap:1.5rem;">
      <div style="display:flex;justify-content:space-between;align-items:center;flex-wrap:wrap;gap:1rem;">
        <div>
          <h2 style="font-size:1.4rem;font-weight:800;color:var(--navy-dark);">Engineering Export Center</h2>
          <p style="font-size:0.875rem;color:var(--text-secondary);">
            Export 7 core columns (Error Code, Service, Source Reference, Original AR/EN, Corrected AR/EN) into 3 formats: CSV, Markdown (.md), and HTML (.html).
          </p>
        </div>
        <div style="display:flex;align-items:center;gap:0.5rem;flex-wrap:wrap;">
          <select class="filter-select" onchange="handleExportFormatChange(this.value)" style="font-weight:700;border-color:var(--brand-accent);" title="Select Export Format">
            <option value="csv" ${AppState.exportFormat === 'csv' ? 'selected' : ''}>Format: CSV (.csv)</option>
            <option value="md" ${AppState.exportFormat === 'md' ? 'selected' : ''}>Format: Markdown (.md)</option>
            <option value="html" ${AppState.exportFormat === 'html' ? 'selected' : ''}>Format: HTML (.html)</option>
          </select>
          <button type="button" class="btn btn-primary" onclick="handleExportSelectedRecords()">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path><polyline points="7 10 12 15 17 10"></polyline><line x1="12" y1="15" x2="12" y2="3"></line></svg>
            Export Selected (${AppState.exportSelectedIds.length})
          </button>
          <button type="button" class="btn btn-outline" onclick="handleExportAllFilteredRecords()">
            Export All Filtered (${filtered.length})
          </button>
          ${AppState.exportSelectedIds.length > 0 ? `
            <button type="button" class="btn btn-secondary btn-sm" onclick="handleClearExportSelection()">
              Clear Selection
            </button>
          ` : ''}
        </div>
      </div>

      <!-- Filter Controls: Status Filter is FIRST -->
      <div class="filter-bar-card">
        <div class="search-input-row">
          <div class="search-box-wrapper">
            <svg class="search-box-icon" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="11" cy="11" r="8"></circle><line x1="21" y1="21" x2="16.65" y2="16.65"></line></svg>
            <input
              type="text"
              id="exportSearchInput"
              class="search-box-input"
              placeholder="Search across code, number, service, original & corrected messages..."
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
              <option value="change_request_cs" ${AppState.exportStatus === 'change_request_cs' ? 'selected' : ''}>Status: Change Request CS</option>
              <option value="not_reviewed" ${AppState.exportStatus === 'not_reviewed' ? 'selected' : ''}>Status: Not Reviewed</option>
              <option value="in_review" ${AppState.exportStatus === 'in_review' ? 'selected' : ''}>Status: In Review</option>
              <option value="implemented" ${AppState.exportStatus === 'implemented' ? 'selected' : ''}>Status: Implemented</option>
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

        <div style="display:flex;justify-content:space-between;align-items:center;font-size:0.85rem;color:var(--text-muted);flex-wrap:wrap;gap:0.5rem;">
          <span id="exportCounter">Matching Filtered Records: <strong>${filtered.length}</strong> | Selected: <strong>${AppState.exportSelectedIds.length}</strong></span>
          <span>Available Formats: <strong>CSV (.csv), Markdown (.md), HTML (.html)</strong> &bull; UTF-8</span>
        </div>
      </div>

      <div class="table-card">
        <div style="padding:1rem 1.25rem;border-bottom:1px solid var(--border-subtle);display:flex;justify-content:space-between;align-items:center;">
          <h3 style="font-size:0.95rem;font-weight:700;">Catalog Preview (${filtered.length} Records — 7 Columns)</h3>
          <span style="font-size:0.78rem;color:var(--text-muted);">Original & Corrected Messages for Engineering Fixes</span>
        </div>

        <div class="table-responsive">
          <table class="data-table">
            <thead>
              <tr>
                <th style="width:40px;text-align:center;">
                  <input type="checkbox" ${isAllSelected ? 'checked' : ''} onchange="handleToggleExportSelectAll(this.checked)" aria-label="Select all" />
                </th>
                <th>Error Code</th>
                <th>Service</th>
                <th>Source Reference</th>
                <th>Original AR</th>
                <th>Corrected AR</th>
                <th>Original EN</th>
                <th>Corrected EN</th>
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
  renderApp();
}
function handleExportServiceChange(val) {
  AppState.exportService = val;
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
  showToast("Exported " + selected.length + " selected records to " + fmt.toUpperCase() + " (7 core columns).");
}
function handleExportAllFilteredRecords() {
  var filtered = getFilteredExportRecords();
  if (filtered.length === 0) {
    showToast("No records available to export with current filters.", "warning");
    return;
  }
  var fmt = AppState.exportFormat || "csv";
  downloadExport(filtered, fmt, "malaa-errors-filtered-export");
  showToast("Exported " + filtered.length + " filtered records to " + fmt.toUpperCase() + " (7 core columns).");
}

// ==========================================================================
// 15. Modals (CS Request Modal & Engineering Confirm Implemented Modal)
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
    AppState.csModalValidationError = "Customer Support Comment is required.";
    renderApp();
    return;
  }

  var updated = errorStore.submitCSRequest(id, requestedField, comment);
  if (updated) {
    closeCSRequestModal();
    showToast("Change request submitted for " + updated.errorCode + ". Status changed to Change Request CS.");
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
  var updated = errorStore.markImplemented(id);
  if (updated) {
    closeEngConfirmModal();
    showToast(updated.errorCode + " marked as Implemented in source code!");
  }
}

function renderModals() {
  var html = "";

  // 1. Customer Support Request Message Change Modal
  if (AppState.csModalErrorId) {
    var record = errorStore.getById(AppState.csModalErrorId);
    if (record) {
      html += `
        <div class="modal-overlay" onclick="closeCSRequestModal()">
          <div class="modal-dialog" onclick="event.stopPropagation()">
            <div class="modal-header">
              <h3 class="modal-title">Request User-Facing Message Change</h3>
              <button type="button" style="background:none;border:none;font-size:1.4rem;cursor:pointer;color:var(--text-muted);" onclick="closeCSRequestModal()">&times;</button>
            </div>
            <div class="modal-body">
              <p style="font-size:0.875rem;color:var(--text-secondary);">
                Submit feedback to Product to update the user-facing Arabic or English error message. This will set the error status to <strong>Change Request CS</strong>.
              </p>

              <div>
                <label style="font-size:0.8rem;font-weight:700;text-transform:uppercase;color:var(--text-muted);display:block;margin-bottom:0.3rem;">Error Code (Linked)</label>
                <div style="padding:0.6rem 0.85rem;background:#f1f5f9;border-radius:var(--radius-md);font-family:var(--font-mono);font-weight:700;color:var(--brand-primary);">
                  ${escapeHtml(record.errorCode)} — ${escapeHtml(record.service)}
                </div>
              </div>

              <div>
                <label style="font-size:0.8rem;font-weight:700;text-transform:uppercase;color:var(--text-secondary);display:block;margin-bottom:0.3rem;">Requested Field <span style="color:#dc2626;">*</span></label>
                <select class="filter-select" style="width:100%;" onchange="AppState.csModalRequestedField = this.value">
                  <option value="Both Arabic and English Messages" ${AppState.csModalRequestedField === 'Both Arabic and English Messages' ? 'selected' : ''}>Both Arabic and English Messages</option>
                  <option value="Arabic Message" ${AppState.csModalRequestedField === 'Arabic Message' ? 'selected' : ''}>Arabic Message</option>
                  <option value="English Message" ${AppState.csModalRequestedField === 'English Message' ? 'selected' : ''}>English Message</option>
                </select>
              </div>

              <div>
                <label style="font-size:0.8rem;font-weight:700;text-transform:uppercase;color:var(--text-secondary);display:block;margin-bottom:0.3rem;">Customer Support Comment <span style="color:#dc2626;">*</span></label>
                <textarea
                  class="editable-textarea"
                  rows="3"
                  placeholder="Explain why the message needs to be changed based on customer feedback..."
                  oninput="AppState.csModalComment = this.value"
                >${escapeHtml(AppState.csModalComment)}</textarea>
                ${AppState.csModalValidationError ? `<p style="color:#dc2626;font-size:0.8rem;margin-top:0.3rem;">${escapeHtml(AppState.csModalValidationError)}</p>` : ''}
              </div>
            </div>
            <div class="modal-footer">
              <button type="button" class="btn btn-secondary" onclick="closeCSRequestModal()">Cancel</button>
              <button type="button" class="btn btn-success" onclick="handleSubmitCSRequest()">Submit Request</button>
            </div>
          </div>
        </div>
      `;
    }
  }

  // 2. Engineering Confirm Implemented Modal
  if (AppState.engModalErrorId) {
    var engRecord = errorStore.getById(AppState.engModalErrorId);
    if (engRecord) {
      html += `
        <div class="modal-overlay" onclick="closeEngConfirmModal()">
          <div class="modal-dialog" onclick="event.stopPropagation()">
            <div class="modal-header">
              <h3 class="modal-title">Confirm Implementation in Code</h3>
              <button type="button" style="background:none;border:none;font-size:1.4rem;cursor:pointer;color:var(--text-muted);" onclick="closeEngConfirmModal()">&times;</button>
            </div>
            <div class="modal-body">
              <p style="font-size:0.9rem;color:var(--text-primary);line-height:1.5;">
                Confirm that the corrected bilingual message for <strong>${escapeHtml(engRecord.errorCode)}</strong> has been applied in source code (<code>${escapeHtml(engRecord.sourceReference)}</code>).
              </p>

              <div style="background:#ecfdf5;border:1px solid #a7f3d0;padding:1rem;border-radius:var(--radius-md);display:flex;flex-direction:column;gap:0.5rem;">
                <div>
                  <span style="font-size:0.75rem;font-weight:700;color:#047857;text-transform:uppercase;">Corrected Arabic (Live):</span>
                  <div class="arabic" style="font-weight:600;direction:rtl;text-align:right;">${escapeHtml(engRecord.correctedArMessage)}</div>
                </div>
                <div style="margin-top:0.5rem;">
                  <span style="font-size:0.75rem;font-weight:700;color:#047857;text-transform:uppercase;">Corrected English (Live):</span>
                  <div style="font-weight:600;">${escapeHtml(engRecord.correctedEnMessage)}</div>
                </div>
              </div>

              <p style="font-size:0.825rem;color:var(--text-muted);">
                This action will update the shared status to <strong>Implemented</strong> and immediately display the corrected copy in Customer Support.
              </p>
            </div>
            <div class="modal-footer">
              <button type="button" class="btn btn-secondary" onclick="closeEngConfirmModal()">Cancel</button>
              <button type="button" class="btn btn-success" onclick="handleConfirmEngImplemented()">
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
