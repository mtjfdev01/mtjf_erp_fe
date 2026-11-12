import React, { useState } from 'react';
import {
  FiX,
  FiCheck,
  FiAlertTriangle,
  FiFileText,
  FiExternalLink,
  FiEye,
} from 'react-icons/fi';

const ReconciliationWorkbenchReviewModal = ({
  isOpen,
  onClose,
  item,
  onApprove,
  onReject,
  onViewSlip,
}) => {
  const [notes, setNotes] = useState('');
  const [actionLoading, setActionLoading] = useState(false);
  const [rejectMode, setRejectMode] = useState(false);

  if (!isOpen || !item) return null;

  const handleApprove = async () => {
    setActionLoading(true);
    try {
      await onApprove(item, notes);
      setNotes('');
      setRejectMode(false);
      onClose();
    } catch (err) {
      // Handled in parent
    } finally {
      setActionLoading(false);
    }
  };

  const handleReject = async () => {
    if (!notes.trim()) {
      alert('Please provide a reason or note for rejecting this record.');
      return;
    }
    setActionLoading(true);
    try {
      await onReject(item, notes);
      setNotes('');
      setRejectMode(false);
      onClose();
    } catch (err) {
      // Handled in parent
    } finally {
      setActionLoading(false);
    }
  };

  // Determine link to full record view
  let fullRecordUrl = '';
  if (item.type === 'offline') {
    fullRecordUrl = `/donations/offline_donations/view/${item.id}`;
  } else if (item.type === 'online') {
    fullRecordUrl = `/donations/online_donations/view/${item.id}`;
  } else if (item.type === 'donation_box') {
    fullRecordUrl = `/dms/donation-box-donations/view/${item.id}`;
  } else if (item.type === 'recurring_subscription') {
    fullRecordUrl = `/dms/recurring-donations/view/${item.id}`;
  } else if (item.type === 'recurring_installment') {
    const parentId = item.raw_data?.subscription_id || item.id;
    fullRecordUrl = `/dms/recurring-donations/view/${parentId}`;
  }

  const primaryAttachment = item.attachments && item.attachments.length > 0 ? item.attachments[0] : null;
  const isImageSlip =
    primaryAttachment &&
    (primaryAttachment.type === 'image' ||
      /\.(jpg|jpeg|png|webp|gif|bmp)$/i.test(primaryAttachment.url));

  return (
    <div className="rw-modal-overlay" onClick={onClose}>
      <div className="rw-modal" onClick={(e) => e.stopPropagation()}>
        <div className="rw-modal-header">
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <h3 className="rw-modal-title">Review Record &mdash; {item.reference}</h3>
            <span className="rw-status-pill" style={{ fontSize: 11.5, padding: '3px 10px' }}>
              Pending Reconciliation
            </span>
          </div>
          <button type="button" className="rw-modal-close" onClick={onClose}>
            <FiX />
          </button>
        </div>

        <div className="rw-modal-body">
          {/* Left Column: Details */}
          <div className="rw-review-info-col">
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px' }}>
              <div className="rw-detail-row">
                <span className="rw-detail-label">Reference</span>
                <span className="rw-detail-val" style={{ color: '#2563eb', fontWeight: 600 }}>
                  {item.reference}
                </span>
              </div>
              <div className="rw-detail-row">
                <span className="rw-detail-label">Logged Date</span>
                <span className="rw-detail-val">{item.logged_at || '—'}</span>
              </div>
            </div>

            <div className="rw-detail-row">
              <span className="rw-detail-label">Donor / Entity</span>
              <span className="rw-detail-val" style={{ fontWeight: 600 }}>
                {item.donor_name}
              </span>
              <span style={{ fontSize: 12.5, color: '#64748b' }}>{item.donor_contact}</span>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px' }}>
              <div className="rw-detail-row">
                <span className="rw-detail-label">Amount</span>
                <span className="rw-detail-val bold" style={{ color: '#16a34a' }}>
                  {item.currency || 'PKR'} {Number(item.amount).toLocaleString()}
                </span>
              </div>
              <div className="rw-detail-row">
                <span className="rw-detail-label">Context / Method</span>
                <span className="rw-detail-val">{item.context_info || '—'}</span>
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px' }}>
              <div className="rw-detail-row">
                <span className="rw-detail-label">Bank Reference</span>
                <span className="rw-detail-val">{item.bank_reference || '—'}</span>
              </div>
              <div className="rw-detail-row">
                <span className="rw-detail-label">Created By</span>
                <span className="rw-detail-val" style={{ fontWeight: 600, color: '#0f172a' }}>
                  {item.created_by_name || '—'}
                </span>
              </div>
            </div>

            <div className="rw-detail-row" style={{ marginTop: 6 }}>
              <label className="rw-detail-label">
                {rejectMode ? 'Rejection Reason (Required)' : 'Reconciliation Notes / Remarks (Optional)'}
              </label>
              <textarea
                className="rw-notes-textarea"
                placeholder={
                  rejectMode
                    ? 'Enter reason for rejection (e.g. invalid receipt slip, mismatch amount)...'
                    : 'Add verification notes or cheque clearing reference...'
                }
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
              />
            </div>
          </div>

          {/* Right Column: Slip Attachment Preview */}
          <div className="rw-review-slip-col">
            <span
              className="rw-detail-label"
              style={{ alignSelf: 'flex-start', marginBottom: 10 }}
            >
              Slip / Attached Document
            </span>

            {primaryAttachment ? (
              <div
                style={{
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  justifyContent: 'center',
                  width: '100%',
                  height: '100%',
                }}
              >
                {isImageSlip ? (
                  <div
                    style={{
                      position: 'relative',
                      width: '100%',
                      maxHeight: '260px',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      cursor: 'pointer',
                      borderRadius: 6,
                      overflow: 'hidden',
                      backgroundColor: '#e2e8f0',
                    }}
                    onClick={() => onViewSlip && onViewSlip(primaryAttachment, item.reference)}
                    title="Click to enlarge"
                  >
                    <img
                      src={primaryAttachment.url}
                      alt="Slip preview"
                      style={{
                        maxWidth: '100%',
                        maxHeight: '260px',
                        objectFit: 'contain',
                      }}
                    />
                    <div
                      style={{
                        position: 'absolute',
                        bottom: 8,
                        right: 8,
                        background: 'rgba(15, 23, 42, 0.75)',
                        color: '#fff',
                        padding: '4px 8px',
                        borderRadius: 4,
                        fontSize: 11,
                        display: 'flex',
                        alignItems: 'center',
                        gap: 4,
                      }}
                    >
                      <FiEye /> Click to expand
                    </div>
                  </div>
                ) : (
                  <div style={{ textAlign: 'center', padding: '30px 10px' }}>
                    <FiFileText style={{ fontSize: 44, color: '#3b82f6', marginBottom: 8 }} />
                    <p style={{ fontSize: 13, fontWeight: 500, color: '#334155' }}>
                      {primaryAttachment.name || 'Slip Document'}
                    </p>
                  </div>
                )}

                <div style={{ marginTop: 12, display: 'flex', gap: 10 }}>
                  <button
                    type="button"
                    className="rw-btn-outline"
                    style={{ fontSize: 12, padding: '5px 12px' }}
                    onClick={() => onViewSlip && onViewSlip(primaryAttachment, item.reference)}
                  >
                    <FiEye /> View Slip
                  </button>
                  {primaryAttachment.url && (
                    <a
                      href={primaryAttachment.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="rw-btn-outline"
                      style={{ fontSize: 12, padding: '5px 12px', textDecoration: 'none' }}
                    >
                      <FiExternalLink /> Open
                    </a>
                  )}
                </div>
              </div>
            ) : (
              <div style={{ textAlign: 'center', color: '#94a3b8', margin: 'auto' }}>
                <FiFileText style={{ fontSize: 36, marginBottom: 8, opacity: 0.5 }} />
                <p style={{ fontSize: 13 }}>No attachment uploaded</p>
              </div>
            )}
          </div>
        </div>

        <div className="rw-modal-footer">
          {fullRecordUrl && (
            <a
              href={fullRecordUrl}
              target="_blank"
              rel="noopener noreferrer"
              style={{
                marginRight: 'auto',
                fontSize: 13,
                color: '#2563eb',
                textDecoration: 'underline',
                display: 'inline-flex',
                alignItems: 'center',
                gap: 4,
              }}
            >
              Open Full Record <FiExternalLink />
            </a>
          )}

          <button
            type="button"
            className="rw-btn-cancel"
            onClick={onClose}
            disabled={actionLoading}
          >
            Cancel
          </button>

          {!rejectMode ? (
            <>
              <button
                type="button"
                className="rw-btn-reject"
                onClick={() => setRejectMode(true)}
                disabled={actionLoading}
              >
                Reject
              </button>
              <button
                type="button"
                className="rw-btn-approve"
                onClick={handleApprove}
                disabled={actionLoading}
              >
                <FiCheck /> {actionLoading ? 'Approving...' : 'Approve'}
              </button>
            </>
          ) : (
            <>
              <button
                type="button"
                className="rw-btn-cancel"
                onClick={() => setRejectMode(false)}
                disabled={actionLoading}
              >
                Back
              </button>
              <button
                type="button"
                className="rw-btn-reject"
                style={{ backgroundColor: '#dc2626', color: '#ffffff' }}
                onClick={handleReject}
                disabled={actionLoading}
              >
                <FiAlertTriangle /> {actionLoading ? 'Rejecting...' : 'Confirm Reject'}
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default ReconciliationWorkbenchReviewModal;
