/**
 * Malaa Error Hub — Data Store & LocalStorage Persistence Manager
 * Handles local edits, CS requests, Engineering implementation confirmations,
 * diff derivation, and strict immutability of original values.
 */

var STORAGE_KEY_RECORDS = "malaa_error_hub_records_v3";
var STORAGE_KEY_POV = "malaa_error_hub_pov_v3";

function ErrorDataStore() {
  this.records = this.loadRecords();
}

ErrorDataStore.prototype.loadRecords = function() {
  try {
    var stored = localStorage.getItem(STORAGE_KEY_RECORDS);
    if (stored) {
      var parsed = JSON.parse(stored);
      
      // Merge with immutable seed dataset to guarantee original values cannot be corrupted
      return SEED_ERRORS.map(function(seed) {
        var custom = parsed.find(function(p) {
          return p.id === seed.id || p.errorCode === seed.errorCode;
        });

        if (custom) {
          var validStatuses = ["change_request_cs", "not_reviewed", "in_review", "ready_for_engineering", "implemented"];
          var status = custom.status || custom.reviewStatus || seed.status;
          if (validStatuses.indexOf(status) === -1) {
            status = seed.status;
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
            correctedArMessage: (custom.correctedArMessage !== undefined && custom.correctedArMessage !== null) ? custom.correctedArMessage : seed.correctedArMessage,
            correctedEnMessage: (custom.correctedEnMessage !== undefined && custom.correctedEnMessage !== null) ? custom.correctedEnMessage : seed.correctedEnMessage,
            approvedTrigger: (custom.approvedTrigger !== undefined && custom.approvedTrigger !== null) ? custom.approvedTrigger : seed.approvedTrigger,
            meaning: (custom.meaning !== undefined && custom.meaning !== null) ? custom.meaning : seed.meaning,
            customerSupportAction: (custom.customerSupportAction !== undefined && custom.customerSupportAction !== null) ? custom.customerSupportAction : seed.customerSupportAction,
            customerSupportComment: (custom.customerSupportComment !== undefined && custom.customerSupportComment !== null) ? custom.customerSupportComment : (seed.customerSupportComment || ""),
            requestedField: (custom.requestedField !== undefined && custom.requestedField !== null) ? custom.requestedField : (seed.requestedField || ""),
            productResponse: (custom.productResponse !== undefined && custom.productResponse !== null) ? custom.productResponse : (seed.productResponse || ""),
            status: status,
            saved: custom.saved !== undefined ? custom.saved : seed.saved
          };
          merged.changedFields = deriveChangedFields(merged);
          return merged;
        }

        var fresh = Object.assign({}, seed);
        fresh.changedFields = deriveChangedFields(fresh);
        return fresh;
      });
    }
  } catch (e) {
    console.warn("LocalStorage load error, using default seed:", e);
  }

  return SEED_ERRORS.map(function(s) {
    var copy = Object.assign({}, s);
    copy.changedFields = deriveChangedFields(copy);
    return copy;
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
    status: updates.status || current.status
  });

  // Recompute changed fields
  updated.changedFields = deriveChangedFields(updated);

  this.records[idx] = updated;
  this.save();
  return updated;
};

ErrorDataStore.prototype.submitCSRequest = function(id, requestedField, comment) {
  var record = this.getById(id);
  if (!record) return null;

  return this.updateRecord(record.id, {
    requestedField: requestedField,
    customerSupportComment: comment,
    status: "change_request_cs"
  });
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

ErrorDataStore.prototype.markImplemented = function(id) {
  return this.updateRecord(id, {
    status: "implemented"
  });
};

ErrorDataStore.prototype.bulkUpdateStatus = function(ids, newStatus) {
  var count = 0;
  this.records = this.records.map(function(r) {
    if (ids.indexOf(r.id) !== -1 || ids.indexOf(r.errorCode) !== -1) {
      count++;
      var updated = Object.assign({}, r, {
        status: newStatus
      });
      updated.changedFields = deriveChangedFields(updated);
      return updated;
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
    changeRequestCS: all.filter(function(r) { return r.status === "change_request_cs"; }).length,
    notReviewed: all.filter(function(r) { return r.status === "not_reviewed"; }).length,
    inReview: all.filter(function(r) { return r.status === "in_review"; }).length,
    readyForEngineering: all.filter(function(r) { return r.status === "ready_for_engineering"; }).length,
    implemented: all.filter(function(r) { return r.status === "implemented"; }).length,
    arChanges: all.filter(function(r) { return r.changedFields.indexOf("AR Message") !== -1; }).length,
    enChanges: all.filter(function(r) { return r.changedFields.indexOf("EN Message") !== -1; }).length
  };
};

ErrorDataStore.prototype.resetToDefaults = function() {
  try {
    localStorage.removeItem(STORAGE_KEY_RECORDS);
  } catch (e) {}
  this.records = SEED_ERRORS.map(function(s) {
    var copy = Object.assign({}, s);
    copy.changedFields = deriveChangedFields(copy);
    return copy;
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
