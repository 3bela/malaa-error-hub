/**
 * Malaa Error Hub — Data Store & LocalStorage Persistence Manager
 * Handles local edits, CS requests, Product Responses, Approval confirmations,
 * return-to-ready recovery, and strict immutability of original values.
 * 4 valid statuses: not_reviewed, in_review, ready_for_engineering, approved
 * currentArMessage / currentEnMessage track the live baseline shown to Customer Support.
 */

var STORAGE_KEY_RECORDS = "malaa_error_hub_records_v4";
var STORAGE_KEY_POV = "malaa_error_hub_pov_v4";

function isCorruptedText(str) {
  if (!str || typeof str !== "string") return false;
  return /[\u00D8\u00D9\u00C3\u00C2\uFFFD]/.test(str);
}

function ErrorDataStore() {
  this.records = this.loadRecords();
}

// Derive the current live baseline message for a record.
// Approved records show clean corrected copy. All others show clean original copy.
// Called at load time when stored currentArMessage/currentEnMessage are absent or invalid.
function deriveCurrentMessages(record) {
  var isApproved = record.status === "approved";
  var ar = isApproved ? (record.correctedArMessage || record.originalArMessage) : record.originalArMessage;
  var en = isApproved ? (record.correctedEnMessage || record.originalEnMessage) : record.originalEnMessage;
  return {
    currentArMessage: isCorruptedText(ar) ? record.originalArMessage : ar,
    currentEnMessage: en
  };
}

ErrorDataStore.prototype.loadRecords = function() {
  try {
    var stored = localStorage.getItem(STORAGE_KEY_RECORDS);
    if (stored) {
      var parsed = JSON.parse(stored);

      // If stored data contains corrupted text in any record, discard and reset immediately!
      var hasCorruptedData = Array.isArray(parsed) && parsed.some(function(p) {
        return isCorruptedText(p.currentArMessage) ||
               isCorruptedText(p.originalArMessage) ||
               isCorruptedText(p.correctedArMessage) ||
               isCorruptedText(p.meaning) ||
               isCorruptedText(p.approvedTrigger);
      });

      if (hasCorruptedData) {
        console.warn("Detected corrupted Arabic text in localStorage. Purging and restoring clean seed dataset.");
        try { localStorage.removeItem(STORAGE_KEY_RECORDS); } catch (e) {}
        return SEED_ERRORS.map(function(s) {
          var r = Object.assign({}, s, { requestArchived: false });
          var derived = deriveCurrentMessages(r);
          r.currentArMessage = derived.currentArMessage;
          r.currentEnMessage = derived.currentEnMessage;
          return r;
        });
      }

      // Merge with immutable seed dataset to guarantee original values cannot be corrupted
      return SEED_ERRORS.map(function(seed) {
        var custom = parsed.find(function(p) {
          return p.id === seed.id || p.errorCode === seed.errorCode;
        });

        if (custom) {
          // Migrate legacy statuses: "implemented" -> "approved", "change_request_cs" -> "not_reviewed"
          var status = custom.status || custom.reviewStatus || seed.status;
          if (status === "implemented") status = "approved";
          if (status === "change_request_cs") status = "not_reviewed";
          var validStatuses = ["not_reviewed", "in_review", "ready_for_engineering", "approved"];
          if (validStatuses.indexOf(status) === -1) {
            status = seed.status;
          }

          var corrAr = custom.correctedArMessage;
          if (corrAr === undefined || corrAr === null || isCorruptedText(corrAr)) {
            corrAr = seed.correctedArMessage;
          }

          var merged = {
            id: seed.id,
            errorCode: seed.errorCode,
            service: seed.service,
            sourceReference: seed.sourceReference,
            originalArMessage: seed.originalArMessage,
            originalEnMessage: seed.originalEnMessage,
            aiSuggestedTrigger: seed.aiSuggestedTrigger,

            // User-editable fields
            correctedArMessage: corrAr,
            correctedEnMessage: (custom.correctedEnMessage !== undefined && custom.correctedEnMessage !== null) ? custom.correctedEnMessage : seed.correctedEnMessage,
            approvedTrigger: (custom.approvedTrigger !== undefined && custom.approvedTrigger !== null) ? custom.approvedTrigger : seed.approvedTrigger,
            meaning: (custom.meaning !== undefined && custom.meaning !== null) ? custom.meaning : seed.meaning,
            customerSupportAction: (custom.customerSupportAction !== undefined && custom.customerSupportAction !== null) ? custom.customerSupportAction : seed.customerSupportAction,
            customerSupportComment: (custom.customerSupportComment !== undefined && custom.customerSupportComment !== null) ? custom.customerSupportComment : (seed.customerSupportComment || ""),
            requestedField: (custom.requestedField !== undefined && custom.requestedField !== null) ? custom.requestedField : (seed.requestedField || ""),
            productResponse: (custom.productResponse !== undefined && custom.productResponse !== null) ? custom.productResponse : (seed.productResponse || ""),
            requestArchived: custom.requestArchived === true,
            status: status,
            saved: custom.saved !== undefined ? custom.saved : seed.saved,
            lastViewedAt: custom.lastViewedAt || undefined
          };

          // Restore stored current messages if available and uncorrupted, otherwise derive from clean values
          if (custom.currentArMessage && !isCorruptedText(custom.currentArMessage)) {
            merged.currentArMessage = custom.currentArMessage;
          } else {
            var derivedA = deriveCurrentMessages(merged);
            merged.currentArMessage = derivedA.currentArMessage;
          }
          if (custom.currentEnMessage !== undefined && custom.currentEnMessage !== null) {
            merged.currentEnMessage = custom.currentEnMessage;
          } else {
            var derivedE = deriveCurrentMessages(merged);
            merged.currentEnMessage = derivedE.currentEnMessage;
          }

          return merged;
        }

        // Fresh seed record — derive current messages from status
        var fresh = Object.assign({}, seed, { requestArchived: false });
        var derivedFresh = deriveCurrentMessages(fresh);
        fresh.currentArMessage = derivedFresh.currentArMessage;
        fresh.currentEnMessage = derivedFresh.currentEnMessage;
        return fresh;
      });
    }
  } catch (e) {
    console.warn("LocalStorage load error, using default seed:", e);
  }

  return SEED_ERRORS.map(function(s) {
    var r = Object.assign({}, s, { requestArchived: false });
    var derived = deriveCurrentMessages(r);
    r.currentArMessage = derived.currentArMessage;
    r.currentEnMessage = derived.currentEnMessage;
    return r;
  });
};

ErrorDataStore.prototype.save = function() {
  try {
    localStorage.setItem(STORAGE_KEY_RECORDS, JSON.stringify(this.records));
  } catch (e) {
    console.warn("Failed to persist records to localStorage:", e);
  }
};

ErrorDataStore.prototype.getAll = function() {
  return this.records.slice();
};

ErrorDataStore.prototype.getById = function(id) {
  if (!id) return null;
  var clean = id.trim().toUpperCase();
  return this.records.find(function(r) {
    return r.id === id || r.errorCode.toUpperCase() === clean;
  }) || null;
};

ErrorDataStore.prototype.getByCode = function(code) {
  return this.getById(code);
};

ErrorDataStore.prototype.updateRecord = function(id, updates) {
  var idx = this.records.findIndex(function(r) {
    return r.id === id || r.errorCode === id;
  });
  if (idx === -1) return null;

  var current = this.records[idx];
  var updated = Object.assign({}, current, {
    correctedArMessage: updates.correctedArMessage !== undefined ? updates.correctedArMessage : current.correctedArMessage,
    correctedEnMessage: updates.correctedEnMessage !== undefined ? updates.correctedEnMessage : current.correctedEnMessage,
    approvedTrigger: updates.approvedTrigger !== undefined ? updates.approvedTrigger : current.approvedTrigger,
    meaning: updates.meaning !== undefined ? updates.meaning : current.meaning,
    customerSupportAction: updates.customerSupportAction !== undefined ? updates.customerSupportAction : current.customerSupportAction,
    customerSupportComment: updates.customerSupportComment !== undefined ? updates.customerSupportComment : current.customerSupportComment,
    requestedField: updates.requestedField !== undefined ? updates.requestedField : current.requestedField,
    productResponse: updates.productResponse !== undefined ? updates.productResponse : current.productResponse,
    requestArchived: updates.requestArchived !== undefined ? updates.requestArchived : current.requestArchived,
    status: updates.status || current.status
    // currentArMessage and currentEnMessage are NOT updated here; only markApproved() changes them
  });

  this.records[idx] = updated;
  this.save();
  return updated;
};

ErrorDataStore.prototype.updateProductResponse = function(id, response) {
  return this.updateRecord(id, {
    productResponse: response
  });
};

// CS request submission:
// - sets status to "not_reviewed"
// - sets requestArchived to false
// - saves comment and requestedField
// - current live AR/EN messages remain unchanged
ErrorDataStore.prototype.submitCSRequest = function(id, requestedField, comment) {
  var record = this.getById(id);
  if (!record) return null;

  return this.updateRecord(record.id, {
    requestedField: requestedField,
    customerSupportComment: comment,
    requestArchived: false,
    status: "not_reviewed"
  });
};

// Archive CS requests for given IDs (sets requestArchived = true)
ErrorDataStore.prototype.archiveCSRequests = function(ids) {
  var count = 0;
  this.records = this.records.map(function(r) {
    if (ids.indexOf(r.id) !== -1 || ids.indexOf(r.errorCode) !== -1) {
      count++;
      return Object.assign({}, r, {
        requestArchived: true
      });
    }
    return r;
  });
  this.save();
  return count;
};

ErrorDataStore.prototype.updateOperationalFields = function(id, updates) {
  var record = this.getById(id);
  if (!record) return null;

  return this.updateRecord(record.id, {
    meaning: updates.meaning !== undefined ? updates.meaning : record.meaning,
    approvedTrigger: updates.approvedTrigger !== undefined ? updates.approvedTrigger : record.approvedTrigger,
    customerSupportAction: updates.customerSupportAction !== undefined ? updates.customerSupportAction : record.customerSupportAction
  });
};

ErrorDataStore.prototype.markViewed = function(id) {
  var record = this.getById(id);
  if (!record) return;
  record.lastViewedAt = new Date().toISOString();
  this.save();
};

ErrorDataStore.prototype.getRecentlyViewedRecords = function() {
  return this.records.filter(function(r) {
    return !!r.lastViewedAt;
  }).sort(function(a, b) {
    return new Date(b.lastViewedAt).getTime() - new Date(a.lastViewedAt).getTime();
  });
};

// markApproved: only valid from ready_for_engineering status.
// Sets status to "approved" and updates currentArMessage/currentEnMessage to corrected copy.
ErrorDataStore.prototype.markApproved = function(id) {
  var idx = this.records.findIndex(function(r) {
    return r.id === id || r.errorCode === id;
  });
  if (idx === -1) return null;

  var current = this.records[idx];
  if (current.status !== "ready_for_engineering") {
    console.warn("markApproved() rejected: status must be ready_for_engineering, got " + current.status);
    return null;
  }

  var updated = Object.assign({}, current, {
    status: "approved",
    currentArMessage: current.correctedArMessage || current.originalArMessage,
    currentEnMessage: current.correctedEnMessage || current.originalEnMessage
  });

  this.records[idx] = updated;
  this.save();
  return updated;
};

// returnToReady: sets status to ready_for_engineering.
// Preserves currentArMessage/currentEnMessage (last confirmed live baseline stays visible to CS).
ErrorDataStore.prototype.returnToReady = function(id) {
  var idx = this.records.findIndex(function(r) {
    return r.id === id || r.errorCode === id;
  });
  if (idx === -1) return null;

  var updated = Object.assign({}, this.records[idx], {
    status: "ready_for_engineering"
    // currentArMessage and currentEnMessage intentionally NOT changed
  });

  this.records[idx] = updated;
  this.save();
  return updated;
};

ErrorDataStore.prototype.bulkUpdateStatus = function(ids, newStatus) {
  var count = 0;
  this.records = this.records.map(function(r) {
    if (ids.indexOf(r.id) !== -1 || ids.indexOf(r.errorCode) !== -1) {
      count++;
      return Object.assign({}, r, {
        status: newStatus
      });
    }
    return r;
  });

  this.save();
  return count;
};

ErrorDataStore.prototype.toggleSaved = function(id) {
  var record = this.getById(id);
  if (!record) return false;

  record.saved = !record.saved;
  this.save();
  return record.saved;
};

ErrorDataStore.prototype.getSavedRecords = function() {
  return this.records.filter(function(r) {
    return r.saved;
  });
};

ErrorDataStore.prototype.getKPIs = function() {
  var all = this.records;
  return {
    total: all.length,
    csRequests: all.filter(function(r) { return !!r.customerSupportComment && !r.requestArchived; }).length,
    notReviewed: all.filter(function(r) { return r.status === "not_reviewed"; }).length,
    inReview: all.filter(function(r) { return r.status === "in_review"; }).length,
    readyForEngineering: all.filter(function(r) { return r.status === "ready_for_engineering"; }).length,
    approved: all.filter(function(r) { return r.status === "approved"; }).length
  };
};

ErrorDataStore.prototype.resetToDefaults = function() {
  try {
    localStorage.removeItem(STORAGE_KEY_RECORDS);
  } catch (e) {}
  this.records = SEED_ERRORS.map(function(s) {
    var r = Object.assign({}, s, { requestArchived: false });
    var derived = deriveCurrentMessages(r);
    r.currentArMessage = derived.currentArMessage;
    r.currentEnMessage = derived.currentEnMessage;
    return r;
  });
  return this.records;
};

// Global Store Instance
var errorStore = new ErrorDataStore();

function getStoredPOV() {
  try {
    return localStorage.getItem(STORAGE_KEY_POV) || "landing";
  } catch (e) {
    return "landing";
  }
}

function setStoredPOV(pov) {
  try {
    localStorage.setItem(STORAGE_KEY_POV, pov);
  } catch (e) {}
}
