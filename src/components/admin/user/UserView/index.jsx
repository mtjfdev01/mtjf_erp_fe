import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import axiosInstance from '../../../../utils/axios';
import { useAuth } from '../../../../context/AuthContext';
import { hasPermission } from '../../../../utils/permissions';
import Modal from '../../../common/Modal';
import { FiKey } from 'react-icons/fi';
import '../../../../styles/variables.css';
import '../../../../styles/components.css';
import Navbar from '../../../Navbar';
import PageHeader from '../../../common/PageHeader';
import { GEO_TYPE_LABELS } from '../../../../utils/geographicAssignment';
import '../GeographicAssignmentPicker/GeographicAssignmentPicker.css';
import './UserView.css';

const ViewField = ({ label, value, className = '' }) => (
  <div className={`view-item ${className}`.trim()}>
    <span className="view-item-label">{label}</span>
    <span className="view-item-value">{value ?? '—'}</span>
  </div>
);

const UserView = () => {
  const { id } = useParams();
  const { permissions } = useAuth();
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [revealModalOpen, setRevealModalOpen] = useState(false);
  const [revealedPassword, setRevealedPassword] = useState('');
  const [revealError, setRevealError] = useState('');
  const [revealLoading, setRevealLoading] = useState(false);

  const canRevealPassword =
    permissions?.super_admin === true ||
    permissions?.read_only_super_admin === true ||
    hasPermission(permissions, 'admin', 'users', 'update');

  useEffect(() => {
    fetchUser();
  }, [id]);

  const fetchUser = async () => {
    try {
      setLoading(true);
      const response = await axiosInstance.get(`/users/${id}`);
      setUser(response.data);
      setError('');
    } catch (err) {
      if (err.response?.status === 403) {
        setError('You do not have permission to view this user.');
      } else if (err.response?.status === 404) {
        setError('User not found.');
      } else {
        setError('Failed to fetch user data. Please try again.');
      }
      console.error('Error fetching user:', err);
    } finally {
      setLoading(false);
    }
  };

  const closeRevealModal = () => {
    setRevealModalOpen(false);
    setRevealedPassword('');
    setRevealError('');
    setRevealLoading(false);
  };

  const handleRevealPassword = async () => {
    try {
      setRevealError('');
      setRevealLoading(true);
      setRevealModalOpen(true);
      const res = await axiosInstance.get(`/users/${id}/reveal-password`);
      const password = res?.data?.data?.password || '';
      setRevealedPassword(password);
      if (!password) {
        setRevealError(res?.data?.message || 'No password returned.');
      }
    } catch (err) {
      setRevealError(err.response?.data?.message || 'Failed to reveal password');
    } finally {
      setRevealLoading(false);
    }
  };

  const formatDate = (dateString) => {
    if (!dateString) return '—';
    return new Date(dateString).toLocaleDateString();
  };

  const formatLabel = (value) => {
    if (!value) return '—';
    return value
      .split('_')
      .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
      .join(' ');
  };

  const formatGender = (gender) => {
    if (!gender) return '—';
    return gender.charAt(0).toUpperCase() + gender.slice(1);
  };

  const formatManagerName = (manager, managerId) => {
    if (manager) {
      const name = [manager.first_name, manager.last_name].filter(Boolean).join(' ');
      return name || manager.email || `User #${manager.id}`;
    }
    if (managerId) return `User #${managerId}`;
    return '—';
  };

  const getFullName = (userData) => {
    const name = [userData?.first_name, userData?.last_name].filter(Boolean).join(' ');
    return name || userData?.email || 'User Details';
  };

  const isFundRaising = user?.department === 'fund_raising';

  if (loading) {
    return (
      <>
        <Navbar />
        <div className="view-wrapper">
          <PageHeader title="User Details" backPath="/admin/users" />
          <div className="view-content">
            <div className="status-message">Loading user data...</div>
          </div>
        </div>
      </>
    );
  }

  if (error) {
    return (
      <>
        <Navbar />
        <div className="view-wrapper">
          <PageHeader title="User Details" backPath="/admin/users" />
          <div className="view-content">
            <div className="status-message status-message--error">{error}</div>
          </div>
        </div>
      </>
    );
  }

  if (!user) {
    return (
      <>
        <Navbar />
        <div className="view-wrapper">
          <PageHeader title="User Details" backPath="/admin/users" />
          <div className="view-content">
            <div className="status-message status-message--error">User not found</div>
          </div>
        </div>
      </>
    );
  }

  const geographicAssignments = user.geographic_assignments || [];

  return (
    <>
      <Navbar />
      <div className="view-wrapper">
        <PageHeader
          title={getFullName(user)}
          backPath="/admin/users"
          showEdit
          editPath={`/admin/users/edit/${user.id}`}
        />

        <div className="view-content">
          <div className="user-view-summary">
            <div className="user-view-summary-main">
              <h2 className="user-view-name">{getFullName(user)}</h2>
              <p className="user-view-email">{user.email || '—'}</p>
            </div>
            <div className="user-view-summary-badges">
              <span className="user-view-badge user-view-badge--department">
                {formatLabel(user.department)}
              </span>
              <span className="user-view-badge user-view-badge--role">
                {formatLabel(user.role)}
              </span>
              <span
                className={`user-view-badge ${
                  user.isActive ? 'user-view-badge--active' : 'user-view-badge--inactive'
                }`}
              >
                {user.isActive ? 'Active' : 'Inactive'}
              </span>
            </div>
          </div>

          <div className="view-section">
            <h3 className="view-section-title">Personal Information</h3>
            <div className="view-grid">
              <ViewField label="First Name" value={user.first_name || '—'} />
              <ViewField label="Last Name" value={user.last_name || '—'} />
              <ViewField label="Date of Birth" value={formatDate(user.dob)} />
              <ViewField label="Gender" value={formatGender(user.gender)} />
              <ViewField label="Blood Group" value={user.blood_group || '—'} />
              <ViewField label="CNIC" value={user.cnic || '—'} />
            </div>
          </div>

          <div className="view-section">
            <h3 className="view-section-title">Work Information</h3>
            <div className="view-grid">
              <ViewField label="Department" value={formatLabel(user.department)} />
              <ViewField label="Role" value={formatLabel(user.role)} />
              <ViewField label="Joining Date" value={formatDate(user.joining_date)} />
              <ViewField
                label="Manager"
                value={formatManagerName(user.manager, user.manager_id)}
              />
              <ViewField label="Account Status" value={user.isActive ? 'Active' : 'Inactive'} />
            </div>
          </div>

          <div className="view-section">
            <h3 className="view-section-title">Contact Information</h3>
            <div className="view-grid">
              <ViewField label="Email" value={user.email || '—'} />
              <ViewField label="Phone" value={user.phone || '—'} />
              <ViewField label="Emergency Contact" value={user.emergency_contact || '—'} />
              <ViewField label="Address" value={user.address || '—'} className="view-item--full" />
            </div>
          </div>

          {isFundRaising && (
            <div className="view-section">
              <h3 className="view-section-title">Geographic Assignment</h3>
              <div className="user-view-geo-panel">
                <div className="view-grid">
                  <ViewField
                    label="Geographic Filter"
                    value={
                      user.geographic_off ? (
                        <span className="user-view-badge user-view-badge--geo-off">Disabled</span>
                      ) : (
                        <span className="user-view-badge user-view-badge--geo-on">Enabled</span>
                      )
                    }
                  />
                  <ViewField
                    label="Assigned Areas"
                    value={
                      geographicAssignments.length > 0
                        ? `${geographicAssignments.length} location(s)`
                        : 'None assigned'
                    }
                  />
                </div>

                {geographicAssignments.length > 0 ? (
                  <div className="geo-assignment-chips user-view-geo-chips">
                    {geographicAssignments.map((item) => (
                      <span
                        key={`${item.type}:${item.id}`}
                        className="geo-assignment-chip user-view-geo-chip"
                      >
                        <span className="geo-assignment-chip-type">
                          {GEO_TYPE_LABELS[item.type] || item.type}
                        </span>
                        <span>{item.name}</span>
                        {item.breadcrumb ? (
                          <span className="user-view-geo-breadcrumb">({item.breadcrumb})</span>
                        ) : null}
                      </span>
                    ))}
                  </div>
                ) : (
                  <p className="geo-assignment-empty">
                    No geographic areas assigned to this user.
                  </p>
                )}
              </div>
            </div>
          )}

          {canRevealPassword && (
            <div className="form-actions" style={{ marginTop: '24px' }}>
              <button
                type="button"
                className="primary_btn"
                onClick={handleRevealPassword}
                style={{ backgroundColor: '#111827' }}
                title="Reveal user password (admin only)"
              >
                <FiKey style={{ marginRight: '8px' }} />
                Reveal Password
              </button>
            </div>
          )}
        </div>
      </div>

      <Modal
        open={revealModalOpen}
        onClose={closeRevealModal}
        title={`User Password — ${getFullName(user)}`}
        details={{
          Status: revealLoading ? 'Loading...' : revealError ? 'Error' : 'Success',
          ...(revealError ? { Message: revealError } : {}),
          ...(revealedPassword ? { Password: revealedPassword } : {}),
          Note: 'Password is shown for operational use only. Close this dialog when done.',
        }}
      />
    </>
  );
};

export default UserView;
