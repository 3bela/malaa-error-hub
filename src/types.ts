/**
 * Malaa Error Hub — TypeScript Type Definitions
 */

export type ServiceType = 
  | "Auth Service"
  | "Banks"
  | "Custodian"
  | "Investment"
  | "Omnibus"
  | "Payment Gateway"
  | "Malaa"
  | "Lending";

export type ReviewStatus = 
  | "not_reviewed"
  | "in_review"
  | "needs_clarification"
  | "approved";

export type ChangedFieldType = 
  | "AR Message"
  | "EN Message"
  | "Trigger"
  | "Meaning"
  | "Action";

export type POVType = "landing" | "product" | "support";

export interface ErrorRecord {
  id: string;
  errorCode: string;
  service: ServiceType;
  sourceReference: string;
  originalArMessage: string;
  correctedArMessage: string;
  originalEnMessage: string;
  correctedEnMessage: string;
  aiSuggestedTrigger: string;
  approvedTrigger: string;
  meaning: string;
  customerSupportAction: string;
  reviewStatus: ReviewStatus;
  changedFields: string[];
  lastEditedAt: string;
  saved: boolean;
  lastViewedAt?: string;
}

export interface SummaryKPIs {
  total: number;
  notReviewed: number;
  inReview: number;
  needsClarification: number;
  approved: number;
  arChanges: number;
  enChanges: number;
  readyForExport: number;
}
