import React, { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import axiosInstance from '../../../../utils/axios';
import { useAuth } from '../../../../context/AuthContext';
import { hasPermission } from '../../../../utils/permissions';
import Navbar from '../../../Navbar';
import PageHeader from '../../../common/PageHeader';
import { PrimaryButton } from '../../../common/buttons';
import Pagination from '../../../common/Pagination';
import { formatActivityType, formatDateTime } from '../shared/constants';
import '../donor-relationship.css';

const BUCKETS = [
  { id: 'today', label: 'Today' },
  { id: 'overdue', label: 'Overdue' },
  { id: 'upcoming', label: 'Upcoming' },
  { id: 'completed', label: 'Completed' },
];

const FollowUpsList = () => {
  const navigate = useNavigate();
  const { permissions } = useAuth();
  const canViewOverview = useMemo(
    () =>
      permissions?.super_admin === true ||
      permissions?.fund_raising_manager === true ||
      hasPermission(permissions, 'fund_raising', 'donor_relationship', 'manage_overview'),
    [permissions],
  );
  const [bucket, setBucket] = useState('today');
  const [records, setRecords] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [totalPages, setTotalPages] = useState(1);
  const [totalItems, setTotalItems] = useState(0);

  useEffect(() => {
    fetchFollowups();
  }, [bucket, page, pageSize]);

  const fetchFollowups = async () => {
    try {
      setLoading(true);
      setError('');
      const response = await axiosInstance.get('/donor-relationship/follow-ups', {
        params: { bucket, page, pageSize },
      });
      if (response.data.success) {
        setRecords(response.data.data || []);
        setTotalItems(response.data.pagination?.total || 0);
        setTotalPages(response.data.pagination?.totalPages || 1);
      } else {
        setError(response.data.message || 'Failed to load follow-ups');
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to load follow-ups');
    } finally {
      setLoading(false);
    }
  };

  const completeFollowup = async (id) => {
    try {
      await axiosInstance.patch(`/donor-relationship/follow-ups/${id}/complete`);
      fetchFollowups();
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to complete follow-up');
    }
  };

  const openAddInteraction = (donorId) => {
    navigate(`/dms/donor-relationship/add${donorId ? `?donor_id=${donorId}` : ''}`);
  };

  return (
    <>
      <Navbar />
      <div className="view-wrapper">
        <PageHeader
          title="My Donor Follow-ups"
          showBackButton={false}
          showAdd
          addPath="/dms/donor-relationship/add"
          addTitle="Add interaction"
        />

        {canViewOverview && (
          <div style={{ marginBottom: 16 }}>
            <button
              type="button"
              className="primary_btn"
              onClick={() => navigate('/dms/donor-relationship/overview')}
            >
              Management overview
            </button>
          </div>
        )}

        <div className="donor-relationship-tabs">
          {BUCKETS.map((b) => (
            <button
              key={b.id}
              type="button"
              className={bucket === b.id ? 'active' : ''}
              onClick={() => {
                setBucket(b.id);
                setPage(1);
              }}
            >
              {b.label}
            </button>
          ))}
        </div>

        {error && <div className="error-message">{error}</div>}

        {loading ? (
          <p>Loading…</p>
        ) : records.length === 0 ? (
          <p>No follow-ups in this bucket.</p>
        ) : (
          records.map((row) => (
            <div key={row.id} className="donor-relationship-card">
              <div className="donor-relationship-card__header">
                <div>
                  <div className="donor-relationship-card__title">
                    {row.donor?.name || `Donor #${row.donor_id}`}
                  </div>
                  <div className="donor-relationship-card__meta">
                    {row.followup_title} · Due {formatDateTime(row.due_datetime)}
                  </div>
                </div>
                <span className={`donor-relationship-status ${row.status}`}>
                  {row.status?.replace(/_/g, ' ')}
                </span>
              </div>
              {row.followup_reason && (
                <div className="donor-relationship-card__section">
                  <div className="donor-relationship-card__label">Reason</div>
                  <div>{row.followup_reason}</div>
                </div>
              )}
              {row.interaction && (
                <div className="donor-relationship-card__section">
                  <div className="donor-relationship-card__label">Last activity</div>
                  <div>
                    {formatActivityType(row.interaction.activity_type)} —{' '}
                    {row.interaction.user_action_text?.slice(0, 120)}
                  </div>
                </div>
              )}
              <div className="donor-relationship-actions">
                <PrimaryButton type="button" onClick={() => openAddInteraction(row.donor_id)}>
                  Add interaction
                </PrimaryButton>
                {row.status !== 'completed' && (
                  <button
                    type="button"
                    className="primary_btn"
                    onClick={() => completeFollowup(row.id)}
                  >
                    Mark completed
                  </button>
                )}
                <button
                  type="button"
                  className="primary_btn"
                  onClick={() => navigate(`/dms/donors/view/${row.donor_id}`)}
                >
                  View donor
                </button>
              </div>
            </div>
          ))
        )}

        <Pagination
          currentPage={page}
          totalPages={totalPages}
          totalItems={totalItems}
          pageSize={pageSize}
          onPageChange={setPage}
          onPageSizeChange={(size) => {
            setPageSize(size);
            setPage(1);
          }}
        />
      </div>
    </>
  );
};

export default FollowUpsList;
