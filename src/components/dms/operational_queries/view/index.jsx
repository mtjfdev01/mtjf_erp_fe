import React, { useCallback, useEffect, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import axiosInstance from '../../../../utils/axios';
import { useAuth } from '../../../../context/AuthContext';
import Navbar from '../../../Navbar';
import PageHeader from '../../../common/PageHeader';
import FormTextarea from '../../../common/FormTextarea';
import { PrimaryButton } from '../../../common/buttons';

const formatUser = (user) => {
  if (!user) return '—';
  const name = `${user.first_name || ''} ${user.last_name || ''}`.trim();
  return name || user.email || `User #${user.id}`;
};

const formatDate = (value) => {
  if (!value) return '—';
  return new Date(value).toLocaleString('en-GB', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
};

const OperationalQueryView = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [row, setRow] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [reviewNote, setReviewNote] = useState('');
  const [acting, setActing] = useState(false);

  const fetchRow = useCallback(async () => {
    try {
      setLoading(true);
      setError('');
      const res = await axiosInstance.get(`/operational-queries/${id}`);
      if (!res.data?.success) {
        throw new Error(res.data?.message || 'Failed to load query');
      }
      setRow(res.data.data);
    } catch (err) {
      setError(err.response?.data?.message || err.message || 'Failed to load query');
      setRow(null);
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    fetchRow();
  }, [fetchRow]);

  const isApprover = user?.id && row?.approver_id === user.id;
  const isRequester = user?.id && row?.requested_by_id === user.id;
  const isPending = row?.status === 'pending';

  const runAction = async (action) => {
    setActing(true);
    setError('');
    setSuccess('');
    try {
      const res = await axiosInstance.post(`/operational-queries/${id}/${action}`, {
        review_note: reviewNote.trim() || undefined,
      });
      if (!res.data?.success) {
        throw new Error(res.data?.message || `Failed to ${action}`);
      }
      setSuccess(res.data.message || `Query ${action}d`);
      setRow(res.data.data);
    } catch (err) {
      setError(err.response?.data?.message || err.message || `Failed to ${action}`);
    } finally {
      setActing(false);
    }
  };

  const subjectLink =
    row?.subject_type === 'donation_box'
      ? `/dms/donation_box/view/${row.subject_id}`
      : null;

  if (loading) {
    return (
      <>
        <Navbar />
        <div className="form-content">
          <PageHeader title="Operational Query" onBack={() => navigate('/dms/operational-queries/list')} />
          <div className="loading">Loading...</div>
        </div>
      </>
    );
  }

  if (!row) {
    return (
      <>
        <Navbar />
        <div className="form-content">
          <PageHeader title="Operational Query" onBack={() => navigate('/dms/operational-queries/list')} />
          <div className="status-message status-message--error">
            {error || 'Query not found'}
          </div>
        </div>
      </>
    );
  }

  return (
    <>
      <Navbar />
      <div className="form-content">
        <PageHeader
          title={`Operational Query #${row.id}`}
          onBack={() => navigate('/dms/operational-queries/list')}
        />

        {error && <div className="status-message status-message--error">{error}</div>}
        {success && <div className="status-message status-message--success">{success}</div>}

        <div className="form-section">
          <h3 className="form-section-heading">{row.title}</h3>
          <div className="view-grid">
            <div className="view-item">
              <span className="view-item-label">Status</span>
              <span className="view-item-value">
                <span className={`status-badge status-${row.status}`}>{row.status}</span>
              </span>
            </div>
            <div className="view-item">
              <span className="view-item-label">Action</span>
              <span className="view-item-value">{row.action}</span>
            </div>
            <div className="view-item">
              <span className="view-item-label">Subject</span>
              <span className="view-item-value">
                {subjectLink ? (
                  <Link to={subjectLink}>
                    {row.subject_meta?.label ||
                      `${row.subject_type} #${row.subject_id}`}
                  </Link>
                ) : (
                  `${row.subject_type} #${row.subject_id}`
                )}
              </span>
            </div>
            <div className="view-item">
              <span className="view-item-label">Requested by</span>
              <span className="view-item-value">{formatUser(row.requested_by)}</span>
            </div>
            <div className="view-item">
              <span className="view-item-label">Approver</span>
              <span className="view-item-value">{formatUser(row.approver)}</span>
            </div>
            <div className="view-item">
              <span className="view-item-label">Created</span>
              <span className="view-item-value">{formatDate(row.created_at)}</span>
            </div>
            <div className="view-item" style={{ gridColumn: '1 / -1' }}>
              <span className="view-item-label">Reason</span>
              <span className="view-item-value">{row.reason}</span>
            </div>
          </div>
        </div>

        <div className="form-section">
          <h3 className="form-section-heading">Requested change</h3>
          <pre
            style={{
              margin: 0,
              padding: 12,
              background: '#f8fafc',
              borderRadius: 8,
              border: '1px solid #e2e8f0',
              overflow: 'auto',
            }}
          >
            {JSON.stringify(row.payload, null, 2)}
          </pre>
        </div>

        <div className="form-section">
          <h3 className="form-section-heading">Previous values (preserved)</h3>
          <pre
            style={{
              margin: 0,
              padding: 12,
              background: '#fff7ed',
              borderRadius: 8,
              border: '1px solid #fed7aa',
              overflow: 'auto',
            }}
          >
            {JSON.stringify(row.previous_payload, null, 2)}
          </pre>
        </div>

        {(row.decided_at || row.review_note) && (
          <div className="form-section">
            <h3 className="form-section-heading">Decision</h3>
            <div className="view-grid">
              <div className="view-item">
                <span className="view-item-label">Decided by</span>
                <span className="view-item-value">{formatUser(row.decided_by)}</span>
              </div>
              <div className="view-item">
                <span className="view-item-label">Decided at</span>
                <span className="view-item-value">{formatDate(row.decided_at)}</span>
              </div>
              <div className="view-item">
                <span className="view-item-label">Applied at</span>
                <span className="view-item-value">{formatDate(row.applied_at)}</span>
              </div>
              <div className="view-item" style={{ gridColumn: '1 / -1' }}>
                <span className="view-item-label">Review note</span>
                <span className="view-item-value">{row.review_note || '—'}</span>
              </div>
            </div>
          </div>
        )}

        {isPending && (isApprover || isRequester) && (
          <div className="form-section">
            <h3 className="form-section-heading">
              {isApprover ? 'Approve or reject' : 'Cancel request'}
            </h3>
            {isApprover && (
              <FormTextarea
                label="Review note (optional)"
                name="review_note"
                value={reviewNote}
                onChange={(e) => setReviewNote(e.target.value)}
                rows={3}
                placeholder="Optional note for the requester"
              />
            )}
            <div className="form-actions" style={{ display: 'flex', gap: 10 }}>
              {isApprover && (
                <>
                  <PrimaryButton
                    type="button"
                    loading={acting}
                    loadingText="Approving…"
                    onClick={() => runAction('approve')}
                  >
                    Approve & apply
                  </PrimaryButton>
                  <button
                    type="button"
                    className="secondary_btn"
                    disabled={acting}
                    onClick={() => runAction('reject')}
                    style={{ borderColor: '#dc2626', color: '#dc2626' }}
                  >
                    Reject
                  </button>
                </>
              )}
              {isRequester && (
                <button
                  type="button"
                  className="secondary_btn"
                  disabled={acting}
                  onClick={() => runAction('cancel')}
                >
                  Cancel my request
                </button>
              )}
            </div>
          </div>
        )}
      </div>
    </>
  );
};

export default OperationalQueryView;
