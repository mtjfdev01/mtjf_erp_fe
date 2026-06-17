import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import axiosInstance from '../../../../utils/axios';
import { useAuth } from '../../../../context/AuthContext';
import { hasPermission } from '../../../../utils/permissions';
import { PrimaryButton } from '../../../common/buttons';
import InteractionEditModal from './InteractionEditModal';
import {
  formatActivityType,
  formatDateTime,
  canMutateInteraction,
} from './constants';
import '../donor-relationship.css';

const formatAssignedTo = (assigned) => {
  if (!assigned) return 'Unassigned';
  if (typeof assigned === 'object') {
    return assigned.name || assigned.email || `User #${assigned.id}`;
  }
  return `User #${assigned}`;
};

const formatCurrency = (value) => {
  const amount = Number(value);
  if (Number.isNaN(amount)) return '—';
  return `PKR ${amount.toLocaleString()}`;
};

const DonorCommunication = ({ donorId, donor }) => {
  const navigate = useNavigate();
  const { permissions } = useAuth();
  const donorName = donor?.name;
  const canCreate = useMemo(
    () => hasPermission(permissions, 'fund_raising', 'donor_relationship', 'create'),
    [permissions],
  );
  const [interactions, setInteractions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [editingInteraction, setEditingInteraction] = useState(null);

  const loadInteractions = useCallback(async () => {
    if (!donorId) return;
    try {
      setLoading(true);
      setError('');
      const res = await axiosInstance.get('/donor-relationship/interactions', {
        params: { donor_id: donorId },
      });
      if (res.data.success) {
        setInteractions(res.data.data || []);
      } else {
        setError(res.data.message || 'Failed to load relationship journey');
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to load relationship journey');
    } finally {
      setLoading(false);
    }
  }, [donorId]);

  useEffect(() => {
    loadInteractions();
  }, [loadInteractions]);

  const nextFollowupAt = useMemo(() => {
    const open = interactions.filter(
      (item) =>
        item.next_followup_datetime &&
        ['need_followup', 'pending', 'rescheduled'].includes(item.status),
    );
    if (!open.length) return null;
    return open
      .map((item) => new Date(item.next_followup_datetime))
      .filter((date) => !Number.isNaN(date.getTime()))
      .sort((a, b) => a.getTime() - b.getTime())[0];
  }, [interactions]);

  const handleDelete = async (item) => {
    const { canDelete } = canMutateInteraction(permissions, item);
    if (!canDelete) return;
    if (!window.confirm('Delete this interaction? Linked open follow-ups will also be removed.')) {
      return;
    }
    try {
      setError('');
      await axiosInstance.delete(`/donor-relationship/interactions/${item.id}`);
      await loadInteractions();
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to delete interaction');
    }
  };

  return (
    <div className="view-section" style={{ marginTop: '8px' }}>
      <div className="donor-journey-header">
        <div>
          <h3 className="view-section-title">Donor Relationship Journey</h3>
          <p className="donor-journey-subtitle">
            Interaction history, follow-ups, and next steps for {donorName || 'this donor'}.
          </p>
        </div>
        {canCreate && (
          <PrimaryButton
            type="button"
            onClick={() => navigate(`/dms/donor-relationship/add?donor_id=${donorId}`)}
          >
            Add interaction
          </PrimaryButton>
        )}
      </div>

      <div className="donor-relationship-summary">
        <div className="donor-relationship-summary__item">
          <strong>{formatAssignedTo(donor?.assigned_to)}</strong>
          <span>Assigned to</span>
        </div>
        <div className="donor-relationship-summary__item">
          <strong>{nextFollowupAt ? formatDateTime(nextFollowupAt) : '—'}</strong>
          <span>Next follow-up</span>
        </div>
        <div className="donor-relationship-summary__item">
          <strong>{formatCurrency(donor?.total_donated)}</strong>
          <span>Total donated</span>
        </div>
        <div className="donor-relationship-summary__item">
          <strong>{donor?.donation_count ?? 0}</strong>
          <span>Donations</span>
        </div>
      </div>

      {error && <div className="error-message">{error}</div>}
      {loading && <p>Loading relationship journey…</p>}

      {!loading && interactions.length === 0 && !error && (
        <p>No interactions recorded yet. Use &quot;Add interaction&quot; to log the first contact.</p>
      )}

      {interactions.map((item) => {
        const { canEdit, canDelete, locked } = canMutateInteraction(permissions, item);
        return (
          <div key={item.id} className="donor-relationship-card">
            <div className="donor-relationship-card__header">
              <div>
                <div className="donor-relationship-card__title">
                  {formatActivityType(item.activity_type)}
                  {item.custom_activity_title ? ` — ${item.custom_activity_title}` : ''}
                </div>
                <div className="donor-relationship-card__meta">
                  {formatDateTime(item.activity_datetime)} ·{' '}
                  {item.created_by?.name || item.created_by?.email || 'Staff'}
                  {locked && !permissions?.super_admin ? ' · Locked after completion' : ''}
                </div>
              </div>
              <span className={`donor-relationship-status ${item.status}`}>
                {item.status?.replace(/_/g, ' ')}
              </span>
            </div>

            <div className="donor-journey-dialogue">
              <div className="donor-journey-dialogue__panel donor-journey-dialogue__panel--donor">
                <div className="donor-relationship-card__label">Donor response</div>
                <div className="donor-journey-dialogue__content">
                  {item.donor_response_text || (
                    <span className="donor-journey-dialogue__empty">No response recorded</span>
                  )}
                </div>
                {item.donor_response_type && (
                  <div className="donor-journey-dialogue__tag">
                    {item.donor_response_type.replace(/_/g, ' ')}
                  </div>
                )}
              </div>

              <div className="donor-journey-dialogue__panel donor-journey-dialogue__panel--team">
                <div className="donor-relationship-card__label">Team activity</div>
                <div className="donor-journey-dialogue__content">
                  {item.user_action_text}
                </div>
                <div className="donor-journey-dialogue__tag">
                  {item.created_by?.name || item.created_by?.email || 'Staff'}
                </div>
              </div>
            </div>

            {(item.next_action_text || item.next_followup_datetime) && (
              <div className="donor-journey-footer">
                {item.next_action_text && (
                  <div className="donor-relationship-card__section">
                    <div className="donor-relationship-card__label">Next step</div>
                    <div>{item.next_action_text}</div>
                  </div>
                )}
                {item.next_followup_datetime && (
                  <div className="donor-relationship-card__section">
                    <div className="donor-relationship-card__label">Follow-up</div>
                    <div>{formatDateTime(item.next_followup_datetime)}</div>
                  </div>
                )}
              </div>
            )}

            {(canEdit || canDelete) && (
              <div className="donor-relationship-actions">
                {canEdit && (
                  <button
                    type="button"
                    className="primary_btn"
                    onClick={() => setEditingInteraction(item)}
                  >
                    Edit
                  </button>
                )}
                {canDelete && (
                  <button
                    type="button"
                    className="primary_btn"
                    style={{ backgroundColor: '#b91c1c' }}
                    onClick={() => handleDelete(item)}
                  >
                    Delete
                  </button>
                )}
              </div>
            )}
          </div>
        );
      })}

      <InteractionEditModal
        open={!!editingInteraction}
        interaction={editingInteraction}
        onClose={() => setEditingInteraction(null)}
        onSaved={() => loadInteractions()}
      />
    </div>
  );
};

export default DonorCommunication;
