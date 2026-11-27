import React, { useState } from 'react';
import SearchableDropdown from '../../../common/SearchableDropdown';
import FormTextarea from '../../../common/FormTextarea';
import FormInput from '../../../common/FormInput';
import { PrimaryButton } from '../../../common/buttons';

const userLabel = (user) => {
  if (!user) return '';
  const name = `${user.first_name || ''} ${user.last_name || ''}`.trim();
  return name || user.email || `User #${user.id}`;
};

/**
 * Modal to collect reason + approver before submitting a status change
 * as an Operational Query (does not apply the change immediately).
 */
const StatusChangeRequestModal = ({
  open,
  currentStatus,
  nextStatus,
  removalDate,
  onRemovalDateChange,
  onClose,
  onSubmit,
  submitting = false,
}) => {
  const [reason, setReason] = useState('');
  const [approver, setApprover] = useState(null);
  const [error, setError] = useState('');

  if (!open) return null;

  const needsRemovalDate = nextStatus === 'removed';

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!reason.trim() || reason.trim().length < 3) {
      setError('Please enter a reason (at least 3 characters).');
      return;
    }
    if (!approver?.id) {
      setError('Please select who will approve this query.');
      return;
    }
    if (needsRemovalDate && !removalDate) {
      setError('Removal date is required when status is Removed.');
      return;
    }
    setError('');
    await onSubmit({
      reason: reason.trim(),
      approver_id: approver.id,
      removal_date: needsRemovalDate ? removalDate : null,
    });
  };

  const searchUsers = async (term) => {
    try {
      const { default: axiosInstance } = await import('../../../../utils/axios');
      const res = await axiosInstance.get('/users/options', {
        params: { search: term, active: 'true' },
      });
      const data = Array.isArray(res.data)
        ? res.data
        : res.data?.data || [];
      return Array.isArray(data) ? data : [];
    } catch {
      return [];
    }
  };

  return (
    <div
      className="donor-relationship-modal-overlay"
      style={{ zIndex: 1200 }}
      onClick={onClose}
    >
      <div
        className="donor-relationship-modal"
        style={{ width: 'min(520px, 95vw)' }}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="donor-relationship-modal__header">
          <div>
            <h3>Request status change</h3>
            <p className="donor-relationship-modal__subtitle">
              Status will not change until the selected person approves this
              operational query.
            </p>
          </div>
          <button
            type="button"
            className="donor-relationship-modal__close"
            onClick={onClose}
            aria-label="Close"
          >
            &times;
          </button>
        </div>

        <div
          style={{
            marginBottom: 14,
            padding: '10px 12px',
            background: '#f8fafc',
            borderRadius: 8,
            border: '1px solid #e2e8f0',
            fontSize: 14,
          }}
        >
          <strong>{currentStatus || '—'}</strong>
          <span style={{ margin: '0 8px', color: '#64748b' }}>→</span>
          <strong>{nextStatus || '—'}</strong>
        </div>

        {error && (
          <div className="status-message status-message--error" style={{ marginBottom: 12 }}>
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="form">
          {needsRemovalDate && (
            <FormInput
              label="Removal date"
              type="date"
              name="removal_date"
              value={removalDate || ''}
              onChange={(e) => onRemovalDateChange?.(e.target.value)}
              required
            />
          )}

          <FormTextarea
            label="Reason"
            name="reason"
            value={reason}
            onChange={(e) => {
              setReason(e.target.value);
              if (error) setError('');
            }}
            rows={3}
            required
            placeholder="Why should this status change?"
          />

          <SearchableDropdown
            label="Who will approve?"
            placeholder="Search user by name or email..."
            onSearch={searchUsers}
            onSelect={(user) => {
              setApprover({
                ...user,
                name: userLabel(user),
              });
              if (error) setError('');
            }}
            onClear={() => setApprover(null)}
            value={approver}
            displayKey="name"
            debounceDelay={300}
            minSearchLength={1}
            allowResearch
            renderOption={(user) => (
              <div style={{ padding: '4px 0' }}>
                <div style={{ fontWeight: 600 }}>{userLabel(user)}</div>
                {user.email && (
                  <div style={{ fontSize: 12, color: '#64748b' }}>{user.email}</div>
                )}
              </div>
            )}
          />

          <div
            className="form-actions"
            style={{ display: 'flex', gap: 10, justifyContent: 'flex-end', marginTop: 16 }}
          >
            <button type="button" className="secondary_btn" onClick={onClose} disabled={submitting}>
              Cancel
            </button>
            <PrimaryButton type="submit" loading={submitting} loadingText="Submitting…">
              Submit for approval
            </PrimaryButton>
          </div>
        </form>
      </div>
    </div>
  );
};

export default StatusChangeRequestModal;
