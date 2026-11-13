export const AID_AUDIT_ACTION_LABELS = {
  created: 'Application created',
  updated: 'Application updated',
  status_changed: 'Status changed',
  draft_approved: 'Draft approved (to verification)',
  assignee_changed: 'Assignee changed',
  marked_incomplete: 'Marked incomplete',
  resumed: 'Resumed to verification',
  rejected: 'Rejected',
  verified: 'Investigation verified',
  verification_completed: 'Verification completed',
  manager_forwarded: 'Forwarded to MEAL',
  meal_forwarded: 'Submitted for CEO (MEAL)',
  ceo_decided: 'CEO decision',
  delivery_updated: 'Delivery updated',
  meal_updated: 'MEAL review updated',
  preview_approval_updated: 'Preview approval updated',
  attachment_uploaded: 'Attachment uploaded',
  attachment_deleted: 'Attachment deleted',
  attachment_missing_set: 'Attachment missing flag',
  missing_docs_set: 'Missing documents updated',
  archived: 'Application archived',
  leakage_override: 'Leakage override recorded',
};

export const AID_AUDIT_SOURCE_LABELS = {
  staff_ui: 'Staff UI',
  offline_sync: 'Offline sync',
  system: 'System',
};

export const AID_AUDIT_FIELD_LABELS = {
  status: 'Status',
  application_no: 'Application no.',
  assigned_to_user_id: 'Assigned to',
  verification_notes: 'Verification notes',
  rejection_reason: 'Rejection reason',
  leakage_override_reason: 'Leakage override reason',
  delivery_status: 'Delivery status',
  ceo_approval_status: 'CEO approval status',
  is_archived: 'Archived',
  attachment: 'Attachment',
  'recommendation.decision': 'Recommendation decision',
  'meal_review.verification_status': 'MEAL verification',
  'meal_review.recommendation_status': 'MEAL recommendation',
  'meal_review.remarks': 'MEAL remarks',
  'meal_review.locked': 'MEAL locked',
  'preview_approval.decision': 'Preview approval decision',
  'preview_approval.remarks': 'Preview approval remarks',
  'preview_approval.locked': 'Preview approval locked',
};

export function aidAuditFieldLabel(field) {
  if (!field) return '—';
  if (AID_AUDIT_FIELD_LABELS[field]) return AID_AUDIT_FIELD_LABELS[field];
  if (String(field).startsWith('checklist.')) {
    const parts = String(field).split('.');
    const key = parts[1] || '';
    const prop = parts[2] || '';
    const niceKey = key.replace(/_/g, ' ');
    if (prop === 'status') return `Checklist · ${niceKey} · status`;
    if (prop === 'note') return `Checklist · ${niceKey} · found note`;
    if (prop === 'gps_coordinates') return `Checklist · ${niceKey} · GPS`;
    return `Checklist · ${niceKey}`;
  }
  return String(field).replace(/_/g, ' ');
}
