import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';
import {
  FiUser,
  FiMail,
  FiPhone,
  FiMapPin,
  FiKey,
  FiBriefcase,
  FiShield,
  FiEye,
  FiEyeOff,
} from 'react-icons/fi';
import axiosInstance from '../../utils/axios';
import { useAuth } from '../../context/AuthContext';
import Navbar from '../Navbar';
import PageHeader from '../common/PageHeader';
import '../dms/donors/view/index.css';
import './UserProfile.css';

const formatLabel = (value) => {
  if (!value) return '—';
  return String(value)
    .replace(/_/g, ' ')
    .replace(/\b\w/g, (c) => c.toUpperCase());
};

const formatShortDate = (value) => {
  if (!value) return '—';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '—';
  return date.toLocaleDateString('en-GB', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  });
};

const getInitials = (firstName, lastName, email) => {
  const parts = [firstName, lastName].filter(Boolean);
  if (parts.length >= 2) {
    return `${parts[0][0] || ''}${parts[1][0] || ''}`.toUpperCase();
  }
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  if (email) return email.slice(0, 2).toUpperCase();
  return '?';
};

const UserProfile = () => {
  const navigate = useNavigate();
  const { user: authUser } = useAuth();
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);
  const [passwords, setPasswords] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
  });
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  useEffect(() => {
    const loadProfile = async () => {
      try {
        setLoading(true);
        setError('');
        const res = await axiosInstance.get('/auth/me');
        setProfile(res.data?.user || null);
      } catch (err) {
        setError(err.response?.data?.message || 'Failed to load profile');
      } finally {
        setLoading(false);
      }
    };
    loadProfile();
  }, []);

  const handlePasswordChange = (e) => {
    const { name, value } = e.target;
    setPasswords((prev) => ({ ...prev, [name]: value }));
  };

  const handleChangePassword = async (e) => {
    e.preventDefault();
    if (passwords.newPassword !== passwords.confirmPassword) {
      toast.error('New password and confirm password do not match');
      return;
    }
    try {
      setSaving(true);
      const res = await axiosInstance.post('/auth/change-password', passwords);
      toast.success(res.data?.message || 'Password changed successfully');
      setPasswords({
        currentPassword: '',
        newPassword: '',
        confirmPassword: '',
      });
    } catch (err) {
      toast.error(
        err.response?.data?.message || 'Failed to change password',
      );
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <>
        <Navbar />
        <div className="list-wrapper">
          <div className="loading-container">
            <div className="loading-spinner" />
            <p>Loading profile...</p>
          </div>
        </div>
      </>
    );
  }

  if (error || !profile) {
    return (
      <>
        <Navbar />
        <div className="list-wrapper">
          <div className="error-container">
            <div className="status-message status-message--error">
              {error || 'Profile not found'}
            </div>
            <button type="button" className="primary_btn" onClick={() => navigate('/welcome')}>
              Back
            </button>
          </div>
        </div>
      </>
    );
  }

  const displayName =
    [profile.first_name, profile.last_name].filter(Boolean).join(' ') ||
    profile.email ||
    authUser?.name ||
    'User';

  return (
    <>
      <Navbar />
      <div className="list-wrapper">
        <PageHeader title="My Profile" backPath="/welcome" showAdd={false} />

        <div className="list-content donor-profile-page user-profile-page">
          <div className="donor-crm-layout donor-crm-layout--info-expanded">
            <aside className="donor-crm-aside">
              <section className="donor-crm-card donor-crm-identity">
                <div className="donor-crm-identity__top">
                  <span className="donor-crm-identity__eyebrow">User Profile</span>
                </div>

                <div className="donor-crm-identity__hero">
                  <div className="donor-crm-identity__avatar" aria-hidden="true">
                    {getInitials(profile.first_name, profile.last_name, profile.email)}
                  </div>
                  <div className="donor-crm-identity__intro">
                    <h2 className="donor-crm-identity__name">{displayName}</h2>
                    <span className="donor-profile-type-badge">
                      <FiShield />
                      {formatLabel(profile.role)}
                    </span>
                  </div>
                </div>

                <ul className="donor-crm-contact-list">
                  <li>
                    <FiMail />
                    <span className="donor-crm-contact-list__value">
                      {profile.email || 'Not provided'}
                    </span>
                  </li>
                  <li>
                    <FiPhone />
                    <span className="donor-crm-contact-list__value">
                      {profile.phone || 'Not provided'}
                    </span>
                  </li>
                  <li>
                    <FiMapPin />
                    <span className="donor-crm-contact-list__value">
                      {profile.address || 'Not provided'}
                    </span>
                  </li>
                </ul>
              </section>

              <section className="donor-crm-card">
                <h3 className="donor-crm-card__title">Profile Summary</h3>
                <div className="donor-crm-summary-list">
                  <div className="donor-crm-summary-row">
                    <span>First Name</span>
                    <strong>{profile.first_name || '—'}</strong>
                  </div>
                  <div className="donor-crm-summary-row">
                    <span>Last Name</span>
                    <strong>{profile.last_name || '—'}</strong>
                  </div>
                  <div className="donor-crm-summary-row">
                    <span>Role</span>
                    <strong>{formatLabel(profile.role)}</strong>
                  </div>
                  <div className="donor-crm-summary-row">
                    <span>Department</span>
                    <strong>
                      <span className="donor-crm-pill donor-crm-pill--info">
                        <FiBriefcase style={{ marginRight: 4 }} />
                        {formatLabel(profile.department)}
                      </span>
                    </strong>
                  </div>
                  <div className="donor-crm-summary-row">
                    <span>Gender</span>
                    <strong>{formatLabel(profile.gender)}</strong>
                  </div>
                  <div className="donor-crm-summary-row">
                    <span>Date of Birth</span>
                    <strong>{formatShortDate(profile.dob)}</strong>
                  </div>
                  <div className="donor-crm-summary-row">
                    <span>CNIC</span>
                    <strong>{profile.cnic || '—'}</strong>
                  </div>
                  <div className="donor-crm-summary-row">
                    <span>Joining Date</span>
                    <strong>{formatShortDate(profile.joining_date)}</strong>
                  </div>
                  <div className="donor-crm-summary-row">
                    <span>Blood Group</span>
                    <strong>{profile.blood_group || '—'}</strong>
                  </div>
                  <div className="donor-crm-summary-row">
                    <span>Emergency Contact</span>
                    <strong>{profile.emergency_contact || '—'}</strong>
                  </div>
                </div>
              </section>

              <section className="donor-crm-card user-profile-password-card">
                <h3 className="donor-crm-card__title">
                  <FiKey /> Change Password
                </h3>
                <form className="user-profile-password-form" onSubmit={handleChangePassword}>
                  <div className="form-group">
                    <label htmlFor="currentPassword">Current password</label>
                    <div className="user-profile-password-input-wrap">
                      <input
                        id="currentPassword"
                        type={showCurrentPassword ? 'text' : 'password'}
                        name="currentPassword"
                        value={passwords.currentPassword}
                        onChange={handlePasswordChange}
                        autoComplete="current-password"
                        required
                        minLength={8}
                      />
                      <button
                        type="button"
                        className="user-profile-password-toggle"
                        onClick={() => setShowCurrentPassword((v) => !v)}
                        aria-label={showCurrentPassword ? 'Hide password' : 'Show password'}
                      >
                        {showCurrentPassword ? <FiEyeOff /> : <FiEye />}
                      </button>
                    </div>
                  </div>
                  <div className="form-group">
                    <label htmlFor="newPassword">New password</label>
                    <div className="user-profile-password-input-wrap">
                      <input
                        id="newPassword"
                        type={showNewPassword ? 'text' : 'password'}
                        name="newPassword"
                        value={passwords.newPassword}
                        onChange={handlePasswordChange}
                        autoComplete="new-password"
                        required
                        minLength={8}
                      />
                      <button
                        type="button"
                        className="user-profile-password-toggle"
                        onClick={() => setShowNewPassword((v) => !v)}
                        aria-label={showNewPassword ? 'Hide password' : 'Show password'}
                      >
                        {showNewPassword ? <FiEyeOff /> : <FiEye />}
                      </button>
                    </div>
                  </div>
                  <div className="form-group">
                    <label htmlFor="confirmPassword">Confirm new password</label>
                    <div className="user-profile-password-input-wrap">
                      <input
                        id="confirmPassword"
                        type={showConfirmPassword ? 'text' : 'password'}
                        name="confirmPassword"
                        value={passwords.confirmPassword}
                        onChange={handlePasswordChange}
                        autoComplete="new-password"
                        required
                        minLength={8}
                      />
                      <button
                        type="button"
                        className="user-profile-password-toggle"
                        onClick={() => setShowConfirmPassword((v) => !v)}
                        aria-label={showConfirmPassword ? 'Hide password' : 'Show password'}
                      >
                        {showConfirmPassword ? <FiEyeOff /> : <FiEye />}
                      </button>
                    </div>
                  </div>
                  <p className="user-profile-password-hint">
                    Use at least 8 characters with uppercase, lowercase, a number, and a special character.
                  </p>
                  <button type="submit" className="primary_btn" disabled={saving}>
                    <FiKey />
                    {saving ? 'Updating...' : 'Update password'}
                  </button>
                </form>
              </section>
            </aside>
          </div>
        </div>
      </div>
    </>
  );
};

export default UserProfile;
