/**
 * Error Dashboard — Application Logic
 * Customer Care Operations: 8 Service Sections Catalog & Enhanced UX
 */

// 8 Approved Service Sections
const SERVICE_SECTIONS = [
  'Auth Service',
  'Banks',
  'Custodian',
  'Investment',
  'Omnibus',
  'Payment Gateway',
  'MyMalaa',
  'Lending'
];

// Initial Test Data Dataset (Standard dataset available to all users)
const DEFAULT_ERRORS = {
  'AUTH_009': {
    code: 'AUTH_009',
    section: 'Auth Service',
    meaning: 'The entered phone number is not valid',
    trigger: 'User enters an invalid phone number',
    arabicMsg: 'رقم الهاتف غير صحيح. تحقق منه وحاول مرة أخرى.',
    englishMsg: 'The phone number is invalid. Check it and try again.',
    careAction: 'Ask the user to check the phone number and try again.'
  },
  'AUTH_013': {
    code: 'AUTH_013',
    section: 'Auth Service',
    meaning: 'The verification code entered is incorrect',
    trigger: 'User enters an incorrect OTP',
    arabicMsg: 'رمز التحقق غير صحيح. تحقق منه وحاول مرة أخرى.',
    englishMsg: 'The OTP is incorrect. Check it and try again.',
    careAction: 'Ask the user to check the OTP and try again.'
  },
  'AUTH_018': {
    code: 'AUTH_018',
    section: 'Auth Service',
    meaning: 'The verification code is no longer valid',
    trigger: 'The OTP has expired',
    arabicMsg: 'انتهت صلاحية رمز التحقق. اطلب رمزًا جديدًا.',
    englishMsg: 'The OTP has expired. Request a new one.',
    careAction: 'Ask the user to request a new OTP.'
  },
  'AUTH_046': {
    code: 'AUTH_046',
    section: 'Auth Service',
    meaning: 'The entered PIN is incorrect',
    trigger: 'User enters an incorrect PIN',
    arabicMsg: 'رمز الدخول غير صحيح. حاول مرة أخرى.',
    englishMsg: 'The PIN is incorrect. Try again.',
    careAction: 'Ask the user to try the PIN again.'
  },
  'BANK_011': {
    code: 'BANK_011',
    section: 'Banks',
    meaning: "The application could not establish a connection with the user's bank.",
    trigger: "The app attempts to connect to the user's bank, but the bank connection fails, the bank service is unavailable, or the connection times out.",
    arabicMsg: 'فشل في الاتصال بالبنك، الرجاء المحاولة لاحقاً',
    englishMsg: 'Failed connecting to the bank, please try again later',
    careAction: 'Ask the user to wait a few minutes and try connecting to the bank again. If the issue continues, confirm which bank the user is trying to connect to and escalate the issue if necessary.'
  },
  'CST_011': {
    code: 'CST_011',
    section: 'Custodian',
    meaning: 'The requested action cannot be completed because the current transaction or withdrawal status does not allow it.',
    trigger: 'The user attempts to perform a withdrawal or related transaction while its current status is not eligible for that action.',
    arabicMsg: 'تعذر تنفيذ طلب السحب، يرجى المحاولة مرة أخرى',
    englishMsg: "We couldn't process your withdrawal request. Please try again.",
    careAction: 'Ask the user to retry the withdrawal. If the issue continues, check whether the transaction or withdrawal is still being processed or is in a status that prevents the action, then escalate if necessary.'
  },
  'INV_026': {
    code: 'INV_026',
    section: 'Investment',
    meaning: 'The requested withdrawal amount is not available for withdrawal.',
    trigger: 'The user attempts to withdraw an amount greater than the currently available withdrawable amount.',
    arabicMsg: 'مبلغ السحب غير كافي',
    englishMsg: 'Insufficient Withdraw Amount',
    careAction: 'Ask the user to check the available withdrawable amount and retry using an amount within the available balance.'
  },
  'INV_018': {
    code: 'INV_018',
    section: 'Investment',
    meaning: "The user's identity verification cannot continue because some required KYC information is missing or incomplete.",
    trigger: 'The error appears when the user reaches the identity verification step but has not completed all required information. The user needs to complete the missing details so the verification can continue.',
    arabicMsg: 'لم يكتمل التحقق من هويتك، يرجى استكمال بياناتك للمتابعة',
    englishMsg: 'Your identity verification is incomplete. Please complete your details to continue.',
    careAction: 'Ask the user to return to the identity verification page and complete the missing required information. After completing the details, ask the user to try again.'
  },
  'OMN_011': {
    code: 'OMN_011',
    section: 'Omnibus',
    meaning: 'The payment could not be completed successfully.',
    trigger: 'A payment attempt is submitted but fails during payment processing.',
    arabicMsg: 'فشلت عملية الدفع',
    englishMsg: 'The payment was failed',
    careAction: 'Ask the user to retry the payment. If the payment continues to fail, confirm the transaction details and escalate the issue if required.'
  },
  'PAY_000': {
    code: 'PAY_000',
    section: 'Payment Gateway',
    meaning: 'The payment amount does not match the amount expected by the payment process.',
    trigger: 'The payment amount received or processed does not match the expected payment amount.',
    arabicMsg: 'المبلغ غير متطابق',
    englishMsg: 'New payment mismatch amount',
    careAction: 'Ask the user to retry the payment. If the issue continues, capture the relevant payment details and escalate the mismatch for investigation.'
  },
  'ST_011': {
    code: 'ST_011',
    section: 'Pending Confirmation',
    meaning: 'The requested action cannot be performed because the current status does not allow it.',
    trigger: 'The user attempts to perform a withdrawal while the current account, investment, or transaction status does not allow the withdrawal action.',
    arabicMsg: 'تعذر تنفيذ طلب السحب، يرجى المحاولة مرة أخرى',
    englishMsg: "We couldn't process your withdrawal request. Please try again.",
    careAction: 'Ask the user to retry the withdrawal. If the error continues, check the relevant account or transaction status and escalate the case for investigation.'
  },
  'PFM_004': {
    code: 'PFM_004',
    section: 'Pending Confirmation',
    meaning: 'A category or subcategory already exists with the same name.',
    trigger: 'The user attempts to create or rename a category or subcategory using a name that already exists.',
    arabicMsg: 'اسم التصنيف الرئيسي او الفرعي مكرر، يرجى تجربة اسم مختلف',
    englishMsg: 'Category or subcategory name is duplicate, please try a different name',
    careAction: 'Ask the user to choose a different category or subcategory name and try again.'
  }
};

const STORAGE_KEY_ERRORS = 'error_dashboard_errors_v7';
const STORAGE_KEY_RECENTS = 'error_dashboard_recents_v7';
const STORAGE_KEY_SAVED = 'error_dashboard_saved_v7';
const MAX_RECENTS = 5;

// Data Store (Local Browser Storage)
class ErrorStore {
  constructor() {
    this.errors = this.loadErrors();
    this.recents = this.loadRecents();
    this.saved = this.loadSaved();
  }

  loadErrors() {
    try {
      const stored = localStorage.getItem(STORAGE_KEY_ERRORS);
      if (stored) {
        const parsed = JSON.parse(stored);
        const merged = Object.assign({}, DEFAULT_ERRORS, parsed);
        Object.keys(merged).forEach(k => {
          if (!merged[k].section && DEFAULT_ERRORS[k]) {
            merged[k].section = DEFAULT_ERRORS[k].section;
          }
        });
        return merged;
      }
    } catch (e) {
      console.warn('LocalStorage unavailable, using default error dataset:', e);
    }
    return JSON.parse(JSON.stringify(DEFAULT_ERRORS));
  }

  saveErrors() {
    try {
      localStorage.setItem(STORAGE_KEY_ERRORS, JSON.stringify(this.errors));
    } catch (e) {
      console.warn('Failed to save errors to localStorage:', e);
    }
  }

  // --- Local-Only Saved Errors (Browser-Specific) ---

  loadSaved() {
    try {
      const stored = localStorage.getItem(STORAGE_KEY_SAVED);
      if (stored) return JSON.parse(stored);
    } catch (e) {
      console.warn('Failed to load saved errors from localStorage:', e);
    }
    return [];
  }

  saveSaved() {
    try {
      localStorage.setItem(STORAGE_KEY_SAVED, JSON.stringify(this.saved));
    } catch (e) {
      console.warn('Failed to save saved errors to localStorage:', e);
    }
  }

  isSaved(code) {
    if (!code) return false;
    return this.saved.includes(code.trim().toUpperCase());
  }

  toggleSaved(code) {
    if (!code || !this.errors[code]) return false;
    const normalized = code.trim().toUpperCase();
    let isNowSaved = false;

    if (this.saved.includes(normalized)) {
      this.saved = this.saved.filter(c => c !== normalized);
      isNowSaved = false;
    } else {
      this.saved.unshift(normalized);
      isNowSaved = true;
    }

    this.saveSaved();
    return isNowSaved;
  }

  getSaved() {
    return this.saved
      .map(code => this.errors[code])
      .filter(Boolean);
  }

  // --- Local-Only Recently Viewed (Browser-Specific) ---

  loadRecents() {
    try {
      const stored = localStorage.getItem(STORAGE_KEY_RECENTS);
      if (stored) return JSON.parse(stored);
    } catch (e) {
      console.warn('Failed to load recents from localStorage:', e);
    }
    return [];
  }

  saveRecents() {
    try {
      localStorage.setItem(STORAGE_KEY_RECENTS, JSON.stringify(this.recents));
    } catch (e) {
      console.warn('Failed to save recents to localStorage:', e);
    }
  }

  addRecent(code) {
    if (!this.errors[code]) return;
    this.recents = this.recents.filter(c => c !== code);
    this.recents.unshift(code);
    if (this.recents.length > MAX_RECENTS) {
      this.recents = this.recents.slice(0, MAX_RECENTS);
    }
    this.saveRecents();
  }

  getRecents() {
    return this.recents
      .map(code => this.errors[code])
      .filter(Boolean);
  }

  // --- Error Queries & Updates ---

  getAllErrors() {
    return Object.values(this.errors);
  }

  getError(code) {
    if (!code) return null;
    const normalizedKey = code.trim().toUpperCase();
    return this.errors[normalizedKey] || null;
  }

  searchErrors(query) {
    if (!query) return [];
    const raw = query.trim().toUpperCase();
    const cleanQuery = raw.replace(/[^A-Z0-9]/g, '');

    const all = Object.values(this.errors);

    return all.filter(item => {
      const itemCode = item.code.toUpperCase();
      const cleanCode = itemCode.replace(/[^A-Z0-9]/g, '');
      const meaning = (item.meaning || '').toUpperCase();
      const trigger = (item.trigger || '').toUpperCase();
      const englishMsg = (item.englishMsg || '').toUpperCase();
      const careAction = (item.careAction || '').toUpperCase();
      const arabicMsg = item.arabicMsg || '';

      // 1. Match code (exact, substring, or alphanumeric)
      if (itemCode.includes(raw)) return true;
      if (cleanQuery && cleanCode.includes(cleanQuery)) return true;

      // 2. Match Meaning, Trigger, English Message, Customer Care Action
      if (meaning.includes(raw) || trigger.includes(raw) || englishMsg.includes(raw) || careAction.includes(raw)) return true;

      // 3. Match in Arabic Message
      if (arabicMsg.includes(query.trim())) return true;

      return false;
    });
  }

  filterCatalog(section, query) {
    let list = Object.values(this.errors);

    // 1. Filter by Section
    if (section && section !== 'All') {
      list = list.filter(item => item.section === section);
    }

    // 2. Filter by Search Query (Code, Number, Meaning, Trigger, User Messages, Care Action)
    if (query && query.trim()) {
      const raw = query.trim().toUpperCase();
      const cleanQuery = raw.replace(/[^A-Z0-9]/g, '');
      const queryTrimmed = query.trim();

      list = list.filter(item => {
        const itemCode = item.code.toUpperCase();
        const cleanCode = itemCode.replace(/[^A-Z0-9]/g, '');
        const meaning = (item.meaning || '').toUpperCase();
        const trigger = (item.trigger || '').toUpperCase();
        const englishMsg = (item.englishMsg || '').toUpperCase();
        const careAction = (item.careAction || '').toUpperCase();
        const arabicMsg = item.arabicMsg || '';

        if (itemCode.includes(raw)) return true;
        if (cleanQuery && cleanCode.includes(cleanQuery)) return true;
        if (meaning.includes(raw)) return true;
        if (trigger.includes(raw)) return true;
        if (englishMsg.includes(raw)) return true;
        if (careAction.includes(raw)) return true;
        if (arabicMsg.includes(queryTrimmed)) return true;

        return false;
      });
    }

    return list;
  }

  getSectionCounts() {
    const counts = { All: 0 };
    SERVICE_SECTIONS.forEach(s => {
      counts[s] = 0;
    });

    const all = Object.values(this.errors);
    counts['All'] = all.length;

    all.forEach(item => {
      if (item.section && counts.hasOwnProperty(item.section)) {
        counts[item.section]++;
      }
    });

    return counts;
  }

  updateError(code, meaning, trigger, careAction) {
    const normalizedKey = code.trim().toUpperCase();
    if (this.errors[normalizedKey]) {
      this.errors[normalizedKey].meaning = meaning;
      this.errors[normalizedKey].trigger = trigger;
      this.errors[normalizedKey].careAction = careAction;
      this.saveErrors();
      return this.errors[normalizedKey];
    }
    return null;
  }
}

// Application Controller
class DashboardApp {
  constructor() {
    this.store = new ErrorStore();
    this.currentPage = 'home'; // 'home' | 'all-errors'
    this.navigationOrigin = 'home'; // 'home' | 'all-errors'
    this.selectedSection = 'All';
    this.currentErrorCode = null;
    this.isEditing = false;
    this.toastTimer = null;
    this.activeSuggestionIndex = -1;

    this.cacheDom();
    this.bindEvents();
    this.init();
  }

  cacheDom() {
    // Navigation & Tabs
    this.brandLogo = document.getElementById('brandLogo');
    this.navHomeBtn = document.getElementById('navHomeBtn');
    this.navAllErrorsBtn = document.getElementById('navAllErrorsBtn');

    // Page Containers
    this.homePageContainer = document.getElementById('homePageContainer');
    this.allErrorsPageContainer = document.getElementById('allErrorsPageContainer');

    // Home Page Elements
    this.searchForm = document.getElementById('searchForm');
    this.searchInput = document.getElementById('errorSearchInput');
    this.clearSearchBtn = document.getElementById('clearSearchBtn');
    this.searchSuggestions = document.getElementById('searchSuggestions');
    this.homeState = document.getElementById('homeState');
    this.browseAllErrorsBtn = document.getElementById('browseAllErrorsBtn');

    // Home panels
    this.noRecentMsg = document.getElementById('noRecentMsg');
    this.recentList = document.getElementById('recentList');
    this.noSavedMsg = document.getElementById('noSavedMsg');
    this.savedList = document.getElementById('savedList');
    this.quickChips = document.querySelectorAll('.quick-chip-btn');

    // All Errors Page Elements
    this.catalogCountBadge = document.getElementById('catalogCountBadge');
    this.sectionPillsContainer = document.getElementById('sectionPillsContainer');
    this.tableSearchInput = document.getElementById('tableSearchInput');
    this.clearTableSearchBtn = document.getElementById('clearTableSearchBtn');
    this.filteredCountText = document.getElementById('filteredCountText');
    this.errorsTableBody = document.getElementById('errorsTableBody');
    this.tableEmptyState = document.getElementById('tableEmptyState');
    this.resetTableFiltersBtn = document.getElementById('resetTableFiltersBtn');

    // Shared States
    this.multipleMatchesState = document.getElementById('multipleMatchesState');
    this.matchesList = document.getElementById('matchesList');
    this.backFromMatchesBtn = document.getElementById('backFromMatchesBtn');

    this.notFoundState = document.getElementById('notFoundState');
    this.backToHomeFromNotFoundBtn = document.getElementById('backToHomeFromNotFoundBtn');

    this.errorDetailsCard = document.getElementById('errorDetailsCard');
    this.statusToast = document.getElementById('statusToast');

    // Error Detail Elements (Read-only)
    this.detailErrorCode = document.getElementById('detailErrorCode');
    this.detailSectionBadge = document.getElementById('detailSectionBadge');
    this.detailBackBtn = document.getElementById('detailBackBtn');
    this.detailBackBtnText = document.getElementById('detailBackBtnText');
    this.toggleSaveErrorBtn = document.getElementById('toggleSaveErrorBtn');
    this.saveErrorBtnText = document.getElementById('saveErrorBtnText');
    this.viewArabicMsg = document.getElementById('viewArabicMsg');
    this.viewEnglishMsg = document.getElementById('viewEnglishMsg');

    // Customer Care Information & Edit Controls
    this.careEditBtn = document.getElementById('careEditBtn');
    this.careEditControls = document.getElementById('careEditControls');
    this.careCancelBtn = document.getElementById('careCancelBtn');
    this.careSaveBtn = document.getElementById('careSaveBtn');
    this.careEditNotice = document.getElementById('careEditNotice');

    // Customer Care Editable Fields
    this.viewMeaning = document.getElementById('viewMeaning');
    this.editMeaningContainer = document.getElementById('editMeaningContainer');
    this.editMeaningInput = document.getElementById('editMeaningInput');

    this.viewTrigger = document.getElementById('viewTrigger');
    this.editTriggerContainer = document.getElementById('editTriggerContainer');
    this.editTriggerInput = document.getElementById('editTriggerInput');

    this.viewAction = document.getElementById('viewAction');
    this.editActionContainer = document.getElementById('editActionContainer');
    this.editActionInput = document.getElementById('editActionInput');
  }

  bindEvents() {
    // Primary Tab Navigation
    this.navHomeBtn.addEventListener('click', () => this.switchPage('home'));
    this.navAllErrorsBtn.addEventListener('click', () => this.switchPage('all-errors'));
    this.brandLogo.addEventListener('click', () => this.switchPage('home'));
    this.brandLogo.addEventListener('keydown', (e) => {
      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        this.switchPage('home');
      }
    });

    this.browseAllErrorsBtn.addEventListener('click', () => this.switchPage('all-errors'));

    // Contextual Back Buttons (Standardized: Back to Errors or Back to Home)
    this.detailBackBtn.addEventListener('click', () => this.handleDetailBack());
    this.backFromMatchesBtn.addEventListener('click', () => this.switchPage(this.navigationOrigin));
    this.backToHomeFromNotFoundBtn.addEventListener('click', () => this.switchPage('home'));

    // Home Search Input & Suggestions
    this.searchInput.addEventListener('input', () => this.handleSearchInput());
    this.searchInput.addEventListener('keydown', (e) => this.handleSearchKeydown(e));

    // Clear Home Search
    this.clearSearchBtn.addEventListener('click', () => {
      this.searchInput.value = '';
      this.clearSearchBtn.style.display = 'none';
      this.hideSuggestions();
      this.searchInput.focus();
    });

    // Dismiss suggestions on outside click
    document.addEventListener('click', (e) => {
      if (!this.searchForm.contains(e.target)) {
        this.hideSuggestions();
      }
    });

    // Home Search Form Submit
    this.searchForm.addEventListener('submit', (e) => {
      e.preventDefault();
      this.handleSearchSubmit();
    });

    // Quick Access Chips (Code-Only)
    this.quickChips.forEach(btn => {
      btn.addEventListener('click', () => {
        const code = btn.getAttribute('data-code');
        this.openErrorDetails(code, 'home');
      });
    });

    // Saved Errors Toggle on Error Details Card
    this.toggleSaveErrorBtn.addEventListener('click', () => this.handleToggleSaveError());

    // Customer Care Edit, Cancel, Save
    this.careEditBtn.addEventListener('click', () => this.enterEditMode());
    this.careCancelBtn.addEventListener('click', () => this.cancelEditMode());
    this.careSaveBtn.addEventListener('click', () => this.handleSaveChanges());

    // All Errors Table Search & Filter
    this.tableSearchInput.addEventListener('input', () => this.handleTableSearch());
    this.clearTableSearchBtn.addEventListener('click', () => {
      this.tableSearchInput.value = '';
      this.clearTableSearchBtn.style.display = 'none';
      this.handleTableSearch();
      this.tableSearchInput.focus();
    });

    this.resetTableFiltersBtn.addEventListener('click', () => {
      this.selectedSection = 'All';
      this.tableSearchInput.value = '';
      this.clearTableSearchBtn.style.display = 'none';
      this.renderSectionPills();
      this.renderAllErrorsTable();
    });
  }

  init() {
    this.renderHomeScreen();
    this.renderSectionPills();
    this.renderAllErrorsTable();
  }

  // --- Page & View Switching ---

  switchPage(page) {
    if (this.isEditing) {
      this.cancelEditMode();
    }

    this.currentPage = page;
    this.navigationOrigin = page;

    // Update Nav Tab UI
    this.navHomeBtn.classList.toggle('active', page === 'home');
    this.navHomeBtn.setAttribute('aria-current', page === 'home' ? 'page' : 'false');
    this.navAllErrorsBtn.classList.toggle('active', page === 'all-errors');
    this.navAllErrorsBtn.setAttribute('aria-current', page === 'all-errors' ? 'page' : 'false');

    // Hide Details, Multi-Matches, Not Found
    this.errorDetailsCard.style.display = 'none';
    this.multipleMatchesState.style.display = 'none';
    this.notFoundState.style.display = 'none';

    // Toggle Page Visibility
    this.homePageContainer.style.display = page === 'home' ? 'block' : 'none';
    this.allErrorsPageContainer.style.display = page === 'all-errors' ? 'block' : 'none';

    if (page === 'home') {
      this.renderHomeScreen();
    } else {
      this.renderSectionPills();
      this.renderAllErrorsTable();
    }

    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  handleDetailBack() {
    if (this.isEditing) {
      this.cancelEditMode();
    }
    this.switchPage(this.navigationOrigin);
  }

  // --- All Errors Table & Section Navigation ---

  renderSectionPills() {
    const counts = this.store.getSectionCounts();
    this.catalogCountBadge.textContent = `${counts.All} Total Errors`;

    this.sectionPillsContainer.innerHTML = '';

    // 'All' Pill
    const allPill = document.createElement('button');
    allPill.type = 'button';
    allPill.className = `category-pill ${this.selectedSection === 'All' ? 'active' : ''}`;
    allPill.innerHTML = `<span>All</span> <span class="pill-count">(${counts.All})</span>`;
    allPill.addEventListener('click', () => {
      this.selectedSection = 'All';
      this.renderSectionPills();
      this.renderAllErrorsTable();
    });
    this.sectionPillsContainer.appendChild(allPill);

    // 8 Approved Service Sections (including MyMalaa)
    SERVICE_SECTIONS.forEach(sec => {
      const count = counts[sec] || 0;
      const pill = document.createElement('button');
      pill.type = 'button';
      pill.className = `category-pill ${this.selectedSection === sec ? 'active' : ''}`;
      pill.innerHTML = `<span>${this.escapeHtml(sec)}</span> <span class="pill-count">(${count})</span>`;

      pill.addEventListener('click', () => {
        this.selectedSection = sec;
        this.renderSectionPills();
        this.renderAllErrorsTable();
      });

      this.sectionPillsContainer.appendChild(pill);
    });
  }

  handleTableSearch() {
    const query = this.tableSearchInput.value;
    this.clearTableSearchBtn.style.display = query.length > 0 ? 'block' : 'none';
    this.renderAllErrorsTable();
  }

  renderAllErrorsTable() {
    const query = this.tableSearchInput.value;
    const filtered = this.store.filterCatalog(this.selectedSection, query);

    this.filteredCountText.textContent = filtered.length;
    this.errorsTableBody.innerHTML = '';

    if (filtered.length === 0) {
      this.tableEmptyState.style.display = 'flex';
      return;
    }

    this.tableEmptyState.style.display = 'none';

    filtered.forEach(item => {
      const tr = document.createElement('tr');
      tr.setAttribute('tabindex', '0');
      tr.setAttribute('role', 'button');
      tr.setAttribute('title', `Click to view details for ${item.code}`);

      const isSaved = this.store.isSaved(item.code);
      const saveBtnClass = isSaved ? 'row-save-btn saved' : 'row-save-btn unsaved';
      const saveIcon = isSaved ? '&starf;' : '&star;';
      const saveText = isSaved ? 'Saved' : 'Save Error';
      const saveTitle = isSaved ? 'Click to remove from Saved Errors' : 'Click to save this error';
      
      tr.innerHTML = `
        <td class="col-code"><span class="cell-code-badge">${this.escapeHtml(item.code)}</span></td>
        <td class="col-meaning">${this.escapeHtml(item.meaning)}</td>
        <td class="col-trigger">${this.escapeHtml(item.trigger)}</td>
        <td class="col-action"><div class="cell-full-action">${this.escapeHtml(item.careAction)}</div></td>
        <td class="col-save">
          <button type="button" class="${saveBtnClass}" data-code="${this.escapeHtml(item.code)}" title="${saveTitle}">
            <span class="save-icon-symbol">${saveIcon}</span>
            <span class="save-btn-label">${saveText}</span>
          </button>
        </td>
      `;

      // Save Button Click Handler (Prevents row click navigation)
      const saveBtn = tr.querySelector('.row-save-btn');
      saveBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        this.handleRowSaveToggle(item.code, saveBtn);
      });

      // Row Click (Open Details)
      tr.addEventListener('click', () => {
        this.openErrorDetails(item.code, 'all-errors');
      });

      tr.addEventListener('keydown', (e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          if (e.target !== saveBtn) {
            e.preventDefault();
            this.openErrorDetails(item.code, 'all-errors');
          }
        }
      });

      this.errorsTableBody.appendChild(tr);
    });
  }

  handleRowSaveToggle(code, btn) {
    const isNowSaved = this.store.toggleSaved(code);
    
    // Update button in row immediately
    if (btn) {
      btn.className = isNowSaved ? 'row-save-btn saved' : 'row-save-btn unsaved';
      const icon = btn.querySelector('.save-icon-symbol');
      const label = btn.querySelector('.save-btn-label');
      if (icon) icon.innerHTML = isNowSaved ? '&starf;' : '&star;';
      if (label) label.textContent = isNowSaved ? 'Saved' : 'Save Error';
      btn.title = isNowSaved ? 'Click to remove from Saved Errors' : 'Click to save this error';
    }

    // Sync Home Saved Errors panel
    this.renderSavedErrors();

    // Sync Details view save button if open for this code
    if (this.currentErrorCode === code) {
      this.updateSavedErrorButton(code);
    }

    if (isNowSaved) {
      this.showToast(`${code} added to Saved Errors.`, 'success');
    } else {
      this.showToast(`${code} removed from Saved Errors.`, 'success');
    }
  }

  // --- Home Search & Suggestions Handling ---

  handleSearchInput() {
    const val = this.searchInput.value;
    this.clearSearchBtn.style.display = val.length > 0 ? 'block' : 'none';

    const trimmed = val.trim();
    if (!trimmed) {
      this.hideSuggestions();
      return;
    }

    const matches = this.store.searchErrors(trimmed);
    this.renderSuggestions(matches);
  }

  renderSuggestions(matches) {
    this.activeSuggestionIndex = -1;
    this.searchSuggestions.innerHTML = '';

    if (matches.length === 0) {
      this.hideSuggestions();
      return;
    }

    matches.forEach((item) => {
      const li = document.createElement('li');
      li.className = 'suggestion-item';
      li.setAttribute('role', 'option');
      li.setAttribute('data-code', item.code);
      li.innerHTML = `
        <span class="suggestion-code">${this.escapeHtml(item.code)}</span>
        <span class="suggestion-meaning">${this.escapeHtml(item.meaning)}</span>
        <span class="suggestion-arrow">&rarr;</span>
      `;

      li.addEventListener('click', () => {
        this.searchInput.value = item.code;
        this.clearSearchBtn.style.display = 'block';
        this.hideSuggestions();
        this.openErrorDetails(item.code, 'home');
      });

      this.searchSuggestions.appendChild(li);
    });

    this.searchSuggestions.style.display = 'block';
  }

  hideSuggestions() {
    this.searchSuggestions.style.display = 'none';
    this.activeSuggestionIndex = -1;
  }

  handleSearchKeydown(e) {
    const items = this.searchSuggestions.querySelectorAll('.suggestion-item');
    if (this.searchSuggestions.style.display === 'none' || items.length === 0) {
      return;
    }

    if (e.key === 'ArrowDown') {
      e.preventDefault();
      this.activeSuggestionIndex = (this.activeSuggestionIndex + 1) % items.length;
      this.updateActiveSuggestion(items);
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      this.activeSuggestionIndex = (this.activeSuggestionIndex - 1 + items.length) % items.length;
      this.updateActiveSuggestion(items);
    } else if (e.key === 'Escape') {
      this.hideSuggestions();
    } else if (e.key === 'Enter') {
      if (this.activeSuggestionIndex >= 0 && this.activeSuggestionIndex < items.length) {
        e.preventDefault();
        const selectedCode = items[this.activeSuggestionIndex].getAttribute('data-code');
        this.searchInput.value = selectedCode;
        this.hideSuggestions();
        this.openErrorDetails(selectedCode, 'home');
      }
    }
  }

  updateActiveSuggestion(items) {
    items.forEach((item, idx) => {
      if (idx === this.activeSuggestionIndex) {
        item.classList.add('active');
        item.scrollIntoView({ block: 'nearest' });
      } else {
        item.classList.remove('active');
      }
    });
  }

  handleSearchSubmit() {
    this.hideSuggestions();
    const query = this.searchInput.value.trim();

    if (!query) {
      this.showToast('Please enter an error code, number, or keyword to search.', 'warning');
      this.searchInput.focus();
      return;
    }

    // Check for exact code match first
    const exactMatch = this.store.getError(query);
    if (exactMatch) {
      this.openErrorDetails(exactMatch.code, 'home');
      return;
    }

    // Search matches across all fields
    const matches = this.store.searchErrors(query);

    if (matches.length === 0) {
      this.showSearchState('not-found');
    } else if (matches.length === 1) {
      this.openErrorDetails(matches[0].code, 'home');
    } else {
      this.renderMultipleMatches(matches);
      this.showSearchState('multiple-matches');
    }
  }

  renderMultipleMatches(matches) {
    this.matchesList.innerHTML = '';

    matches.forEach(item => {
      const card = document.createElement('div');
      card.className = 'match-card';
      card.innerHTML = `
        <div class="match-card-top">
          <span class="match-code-badge">${this.escapeHtml(item.code)}</span>
          <div class="match-card-meaning">${this.escapeHtml(item.meaning)}</div>
          <div class="match-card-msg">${this.escapeHtml(item.englishMsg)}</div>
        </div>
        <button type="button" class="btn btn-outline btn-sm match-select-btn" data-code="${this.escapeHtml(item.code)}">
          View Error Details &rarr;
        </button>
      `;

      const selectBtn = card.querySelector('.match-select-btn');
      selectBtn.addEventListener('click', () => {
        this.openErrorDetails(item.code, 'home');
      });

      this.matchesList.appendChild(card);
    });
  }

  showSearchState(viewName) {
    this.homePageContainer.style.display = 'none';
    this.allErrorsPageContainer.style.display = 'none';
    this.errorDetailsCard.style.display = 'none';

    this.multipleMatchesState.style.display = viewName === 'multiple-matches' ? 'flex' : 'none';
    this.notFoundState.style.display = viewName === 'not-found' ? 'flex' : 'none';
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  // --- Saved Errors Handling ---

  handleToggleSaveError() {
    if (!this.currentErrorCode) return;
    const isNowSaved = this.store.toggleSaved(this.currentErrorCode);
    this.updateSavedErrorButton(this.currentErrorCode);
    this.renderSavedErrors();
    this.renderAllErrorsTable();

    if (isNowSaved) {
      this.showToast('Error added to Saved Errors.', 'success');
    } else {
      this.showToast('Error removed from Saved Errors.', 'success');
    }
  }

  updateSavedErrorButton(code) {
    const isSaved = this.store.isSaved(code);
    const icon = this.toggleSaveErrorBtn.querySelector('.save-icon-symbol');
    if (isSaved) {
      this.toggleSaveErrorBtn.className = 'btn save-error-btn saved';
      if (icon) icon.innerHTML = '&starf;';
      this.saveErrorBtnText.textContent = 'Saved';
      this.toggleSaveErrorBtn.title = 'Click to remove from Saved Errors';
    } else {
      this.toggleSaveErrorBtn.className = 'btn save-error-btn unsaved';
      if (icon) icon.innerHTML = '&star;';
      this.saveErrorBtnText.textContent = 'Save Error';
      this.toggleSaveErrorBtn.title = 'Click to save this error';
    }
  }

  // --- Error Details Rendering ---

  openErrorDetails(code, fromOrigin = 'home') {
    if (this.isEditing) {
      this.cancelEditMode();
    }

    const error = this.store.getError(code);
    if (!error) {
      this.showSearchState('not-found');
      return;
    }

    this.currentErrorCode = error.code;
    this.navigationOrigin = fromOrigin;
    this.store.addRecent(error.code);
    this.renderHomeScreen();

    // Populate Read-Only Fields
    this.detailErrorCode.textContent = error.code;
    this.detailSectionBadge.textContent = error.section || 'General';
    this.viewArabicMsg.textContent = error.arabicMsg;
    this.viewEnglishMsg.textContent = error.englishMsg;

    // Standardized Back Button Label
    if (fromOrigin === 'all-errors') {
      this.detailBackBtnText.innerHTML = '&larr; Back to Errors';
    } else {
      this.detailBackBtnText.innerHTML = '&larr; Back to Home';
    }

    // Update Saved Error Toggle Button
    this.updateSavedErrorButton(error.code);

    // Populate Editable Fields
    this.viewMeaning.textContent = error.meaning;
    this.viewTrigger.textContent = error.trigger;
    this.viewAction.textContent = error.careAction;

    // Ensure edit mode is inactive
    this.setEditMode(false);

    // Show Details View
    this.homePageContainer.style.display = 'none';
    this.allErrorsPageContainer.style.display = 'none';
    this.multipleMatchesState.style.display = 'none';
    this.notFoundState.style.display = 'none';
    this.errorDetailsCard.style.display = 'block';

    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  renderHomeScreen() {
    this.renderRecentErrors();
    this.renderSavedErrors();
  }

  // --- Code-Only Compact Chips Rendering (Recently Viewed & Saved Errors) ---

  renderRecentErrors() {
    const recents = this.store.getRecents();

    if (recents.length === 0) {
      this.noRecentMsg.style.display = 'block';
      this.recentList.style.display = 'none';
      this.recentList.innerHTML = '';
      return;
    }

    this.noRecentMsg.style.display = 'none';
    this.recentList.style.display = 'flex';
    this.recentList.innerHTML = '';

    recents.forEach(item => {
      const btn = document.createElement('button');
      btn.type = 'button';
      btn.className = 'error-chip-btn';
      btn.textContent = item.code;
      btn.title = `View details for ${item.code}`;
      btn.addEventListener('click', () => {
        this.openErrorDetails(item.code, 'home');
      });
      this.recentList.appendChild(btn);
    });
  }

  renderSavedErrors() {
    const saved = this.store.getSaved();

    if (saved.length === 0) {
      this.noSavedMsg.style.display = 'block';
      this.savedList.style.display = 'none';
      this.savedList.innerHTML = '';
      return;
    }

    this.noSavedMsg.style.display = 'none';
    this.savedList.style.display = 'flex';
    this.savedList.innerHTML = '';

    saved.forEach(item => {
      const btn = document.createElement('button');
      btn.type = 'button';
      btn.className = 'error-chip-btn';
      btn.textContent = item.code;
      btn.title = `View details for ${item.code}`;
      btn.addEventListener('click', () => {
        this.openErrorDetails(item.code, 'home');
      });
      this.savedList.appendChild(btn);
    });
  }

  // --- Customer Care Edit / Save / Cancel Flow ---

  enterEditMode() {
    if (!this.currentErrorCode) return;
    const error = this.store.getError(this.currentErrorCode);
    if (!error) return;

    this.editMeaningInput.value = error.meaning;
    this.editTriggerInput.value = error.trigger;
    this.editActionInput.value = error.careAction;

    this.setEditMode(true);
    this.editMeaningInput.focus();
  }

  cancelEditMode() {
    this.setEditMode(false);
  }

  handleSaveChanges() {
    if (!this.currentErrorCode) return;

    const newMeaning = this.editMeaningInput.value.trim();
    const newTrigger = this.editTriggerInput.value.trim();
    const newAction = this.editActionInput.value.trim();

    if (!newMeaning) {
      this.showToast('Meaning field cannot be empty.', 'warning');
      this.editMeaningInput.focus();
      return;
    }

    if (!newTrigger) {
      this.showToast('Trigger field cannot be empty.', 'warning');
      this.editTriggerInput.focus();
      return;
    }

    if (!newAction) {
      this.showToast('Customer Care Action field cannot be empty.', 'warning');
      this.editActionInput.focus();
      return;
    }

    const updated = this.store.updateError(
      this.currentErrorCode,
      newMeaning,
      newTrigger,
      newAction
    );

    if (updated) {
      // Update DOM view values
      this.viewMeaning.textContent = updated.meaning;
      this.viewTrigger.textContent = updated.trigger;
      this.viewAction.textContent = updated.careAction;

      this.setEditMode(false);
      this.renderHomeScreen();
      this.renderAllErrorsTable();
      this.showToast('Changes saved locally.', 'success');
    }
  }

  setEditMode(enabled) {
    this.isEditing = enabled;

    // Meaning
    this.viewMeaning.style.display = enabled ? 'none' : 'block';
    this.editMeaningContainer.style.display = enabled ? 'block' : 'none';

    // Trigger
    this.viewTrigger.style.display = enabled ? 'none' : 'block';
    this.editTriggerContainer.style.display = enabled ? 'block' : 'none';

    // Action
    this.viewAction.style.display = enabled ? 'none' : 'block';
    this.editActionContainer.style.display = enabled ? 'block' : 'none';

    // Section Action Controls & Notice
    this.careEditBtn.style.display = enabled ? 'none' : 'inline-flex';
    this.careEditControls.style.display = enabled ? 'flex' : 'none';
    this.careEditNotice.style.display = enabled ? 'flex' : 'none';
  }

  showToast(message, type = 'success') {
    if (this.toastTimer) {
      clearTimeout(this.toastTimer);
    }

    this.statusToast.textContent = message;
    this.statusToast.className = `status-toast ${type}`;
    this.statusToast.style.display = 'flex';

    this.toastTimer = setTimeout(() => {
      this.statusToast.style.display = 'none';
    }, 3500);
  }

  escapeHtml(str) {
    if (!str) return '';
    return str
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#039;');
  }
}

// Initialize on DOM ready
document.addEventListener('DOMContentLoaded', () => {
  window.app = new DashboardApp();
});
