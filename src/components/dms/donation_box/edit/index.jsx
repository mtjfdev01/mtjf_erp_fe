import React, { useCallback, useEffect, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import axiosInstance from '../../../../utils/axios';
import FormInput from '../../../common/FormInput';
import FormSelect from '../../../common/FormSelect';
import Navbar from '../../../Navbar';
import PageHeader from '../../../common/PageHeader';
import DonationBoxAuditHistory from '../shared/DonationBoxAuditHistory';
import StatusChangeRequestModal from '../../operational_queries/shared/StatusChangeRequestModal';
import { COLLECTION_UNIT_TYPES, DEFAULT_COLLECTION_UNIT_TYPE } from '../../../../config/collectionUnits';
import {
  DEFAULT_COLLECTION_RADIUS_METERS,
  metersToRadiusForm,
  radiusFormToMeters,
  validateCollectionRadiusMeters,
} from '../../../../utils/geolocation';
import {
  getDonationBoxCityName,
  toDateInputValue,
} from '../shared/donationBoxFormUtils';

const EditDonationBox = () => {
  const navigate = useNavigate();
  const { id } = useParams();

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [auditRefreshKey, setAuditRefreshKey] = useState(0);
  const [donationBox, setDonationBox] = useState(null);
  const [savingSettings, setSavingSettings] = useState(false);
  const [statusModalOpen, setStatusModalOpen] = useState(false);
  const [submittingStatusQuery, setSubmittingStatusQuery] = useState(false);
  const [pendingNonStatusPayload, setPendingNonStatusPayload] = useState(null);

  const [settingsForm, setSettingsForm] = useState({
    type: DEFAULT_COLLECTION_UNIT_TYPE,
    name: '',
    key_no: '',
    box_type: 'medium',
    status: 'active',
    removal_date: '',
    collection_frequency: 'weekly',
    landmark_marketplace: '',
    location_radius_value: String(DEFAULT_COLLECTION_RADIUS_METERS),
    location_radius_unit: 'm',
  });

  const fetchDonationBox = useCallback(async () => {
    try {
      setLoading(true);
      setError('');
      const response = await axiosInstance.get(`/donation-box/${id}`);
      if (!response.data?.success) {
        throw new Error(response.data?.message || 'Failed to load donation box');
      }

      const box = response.data.data;
      setDonationBox(box);

      const radiusForm = metersToRadiusForm(
        box.location_radius_meters || DEFAULT_COLLECTION_RADIUS_METERS,
      );
      setSettingsForm({
        type: box.type || DEFAULT_COLLECTION_UNIT_TYPE,
        name: box.name || box.shop_name || '',
        key_no: box.key_no || '',
        box_type: box.box_type || 'medium',
        status: box.status || 'active',
        removal_date: toDateInputValue(box.removal_date),
        collection_frequency: box.collection_frequency || box.frequency || 'weekly',
        landmark_marketplace: box.landmark_marketplace || '',
        location_radius_value: String(radiusForm.value),
        location_radius_unit: radiusForm.unit,
      });
    } catch (err) {
      setError(err.response?.data?.message || err.message || 'Failed to load donation box');
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    fetchDonationBox();
  }, [fetchDonationBox]);

  const handleBack = () => navigate(`/dms/donation_box/view/${id}`);

  const handleSettingsChange = (e) => {
    const { name, value, type, checked } = e.target;
    const nextValue = type === 'checkbox' ? checked : value;
    setSettingsForm((prev) => {
      const next = { ...prev, [name]: nextValue };
      if (name === 'status' && nextValue === 'removed' && !prev.removal_date) {
        next.removal_date = new Date().toISOString().split('T')[0];
      }
      if (name === 'status' && nextValue !== 'removed') {
        next.removal_date = '';
      }
      return next;
    });
    if (error) setError('');
    if (success) setSuccess('');
  };

  const buildSettingsPayload = (includeStatus) => {
    const hasCoords =
      donationBox?.registration_latitude != null &&
      donationBox?.registration_longitude != null;
    const locationRadiusMeters = radiusFormToMeters(
      settingsForm.location_radius_value,
      settingsForm.location_radius_unit,
    );
    const radiusError = hasCoords
      ? validateCollectionRadiusMeters(locationRadiusMeters)
      : null;
    if (radiusError) {
      throw new Error(radiusError);
    }

    const unitName = settingsForm.name?.trim() || donationBox?.shop_name || '';
    const isDonationBox = settingsForm.type === 'Donation Boxes';
    const payload = {
      type: settingsForm.type || DEFAULT_COLLECTION_UNIT_TYPE,
      name: unitName,
      shop_name: unitName,
      key_no: isDonationBox ? (settingsForm.key_no || null) : null,
      box_type: isDonationBox ? settingsForm.box_type : 'custom',
      frequency: settingsForm.collection_frequency,
      landmark_marketplace: settingsForm.landmark_marketplace?.trim() || null,
      require_collection_location: hasCoords,
      ...(hasCoords ? { location_radius_meters: locationRadiusMeters } : {}),
    };

    if (includeStatus) {
      if (settingsForm.status === 'removed' && !settingsForm.removal_date) {
        throw new Error('Removal date is required when status is Removed.');
      }
      payload.status = settingsForm.status;
      payload.removal_date =
        settingsForm.status === 'removed' ? settingsForm.removal_date : null;
    }

    return payload;
  };

  const handleSaveSettings = async (e) => {
    e.preventDefault();
    setSavingSettings(true);
    setError('');
    setSuccess('');
    try {
      const currentStatus = donationBox?.status || 'active';
      const statusChanged = settingsForm.status !== currentStatus;

      if (statusChanged) {
        if (settingsForm.status === 'removed' && !settingsForm.removal_date) {
          throw new Error('Removal date is required when status is Removed.');
        }
        // Save non-status fields immediately; status waits for operational query approval.
        const nonStatusPayload = buildSettingsPayload(false);
        setPendingNonStatusPayload(nonStatusPayload);
        setStatusModalOpen(true);
        setSavingSettings(false);
        return;
      }

      const payload = buildSettingsPayload(true);
      const response = await axiosInstance.patch(`/donation-box/${id}`, payload);
      if (!response.data?.success) {
        throw new Error(response.data?.message || 'Failed to update donation box');
      }
      setSuccess('Box settings updated successfully.');
      setAuditRefreshKey((k) => k + 1);
      await fetchDonationBox();
    } catch (err) {
      setError(err.response?.data?.message || err.message || 'Failed to update donation box');
    } finally {
      setSavingSettings(false);
    }
  };

  const handleStatusQuerySubmit = async ({ reason, approver_id, removal_date }) => {
    setSubmittingStatusQuery(true);
    setError('');
    setSuccess('');
    try {
      if (pendingNonStatusPayload) {
        const settingsRes = await axiosInstance.patch(
          `/donation-box/${id}`,
          pendingNonStatusPayload,
        );
        if (!settingsRes.data?.success) {
          throw new Error(
            settingsRes.data?.message || 'Failed to update box settings',
          );
        }
      }

      const queryRes = await axiosInstance.post('/operational-queries', {
        subject_type: 'donation_box',
        subject_id: Number(id),
        action: 'change_status',
        reason,
        approver_id,
        payload: {
          status: settingsForm.status,
          removal_date:
            settingsForm.status === 'removed'
              ? removal_date || settingsForm.removal_date
              : null,
        },
      });
      if (!queryRes.data?.success) {
        throw new Error(queryRes.data?.message || 'Failed to submit status change request');
      }

      setStatusModalOpen(false);
      setPendingNonStatusPayload(null);
      setSuccess(
        `Settings saved. Status change submitted for approval (Query #${queryRes.data.data?.id}).`,
      );
      setAuditRefreshKey((k) => k + 1);
      await fetchDonationBox();
    } catch (err) {
      setError(
        err.response?.data?.message ||
          err.message ||
          'Failed to submit status change request',
      );
    } finally {
      setSubmittingStatusQuery(false);
    }
  };

  const boxTypeOptions = [
    { value: 'small', label: 'Small' },
    { value: 'medium', label: 'Medium' },
    { value: 'large', label: 'Large' },
    { value: 'medium_star', label: 'Medium/Star' },
    { value: 'premium', label: 'Premium' },
    { value: 'standard', label: 'Standard' },
  ];

  const statusOptions = [
    { value: 'active', label: 'Active' },
    { value: 'inactive', label: 'In Active' },
    { value: 'removed', label: 'Removed' },
    { value: 'broken', label: 'Broken' },
    { value: 'snr', label: 'SNR' },
    { value: 'misplaced_stolen', label: 'Misplaced/Stolen' },
  ];

  const collectionFrequencyOptions = [
    { value: 'weekly', label: 'Weekly' },
    { value: 'biweekly', label: 'Bi-Weekly' },
    { value: 'monthly', label: 'Monthly' },
    { value: 'yearly', label: 'Yearly' },
  ];

  if (loading) {
    return (
      <>
        <Navbar />
        <div className="form-content">
          <PageHeader title="Update Collection Unit" onBack={handleBack} />
          <div className="loading">Loading...</div>
        </div>
      </>
    );
  }

  if (!donationBox) {
    return (
      <>
        <Navbar />
        <div className="form-content">
          <PageHeader title="Update Collection Unit" onBack={handleBack} />
          <div className="status-message status-message--error">
            {error || 'Donation box not found'}
          </div>
        </div>
      </>
    );
  }

  const unitLabel =
    donationBox.name || donationBox.shop_name || donationBox.key_no || donationBox.id;

  return (
    <>
      <Navbar />
      <div className="form-content">
        <PageHeader title={`Update Collection Unit — ${unitLabel}`} onBack={handleBack} />

        {error && <div className="status-message status-message--error">{error}</div>}
        {success && <div className="status-message status-message--success">{success}</div>}

        <div className="form-section">
          <div
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'flex-start',
              gap: '12px',
              flexWrap: 'wrap',
              marginBottom: '12px',
            }}
          >
            <div>
              <h3 className="form-section-heading" style={{ marginBottom: '4px' }}>
                Current shop placement
              </h3>
              <p className="form-section-hint" style={{ margin: 0, color: '#6b7280' }}>
                Read-only placement summary. Use Relocate to move this unit to a new shop.
              </p>
            </div>
            <Link
              to={`/dms/donation_box/relocate/${id}`}
              className="secondary_btn"
              style={{ textDecoration: 'none', whiteSpace: 'nowrap' }}
            >
              Relocate unit
            </Link>
          </div>
          <div className="view-grid">
            <div className="view-item">
              <span className="view-item-label">Region</span>
              <span className="view-item-value">
                {donationBox.city?.region?.name || donationBox.route?.region?.name || '—'}
              </span>
            </div>
            <div className="view-item">
              <span className="view-item-label">City</span>
              <span className="view-item-value">{getDonationBoxCityName(donationBox)}</span>
            </div>
            <div className="view-item">
              <span className="view-item-label">Route</span>
              <span className="view-item-value">{donationBox.route?.name || '—'}</span>
            </div>
            <div className="view-item">
              <span className="view-item-label">Shop name</span>
              <span className="view-item-value">{donationBox.shop_name || '—'}</span>
            </div>
            <div className="view-item">
              <span className="view-item-label">Shopkeeper</span>
              <span className="view-item-value">{donationBox.shopkeeper || '—'}</span>
            </div>
            <div className="view-item">
              <span className="view-item-label">Cell number</span>
              <span className="view-item-value">{donationBox.cell_no || '—'}</span>
            </div>
            <div className="view-item">
              <span className="view-item-label">Landmark</span>
              <span className="view-item-value">{donationBox.landmark_marketplace || '—'}</span>
            </div>
            <div className="view-item">
              <span className="view-item-label">Active since</span>
              <span className="view-item-value">
                {toDateInputValue(donationBox.active_since || donationBox.created_at) || '—'}
              </span>
            </div>
            <div className="view-item">
              <span className="view-item-label">FRD officers</span>
              <span className="view-item-value">
                {donationBox.assignedUsers?.map((u) => `${u.first_name} ${u.last_name}`).join(', ') ||
                  '—'}
              </span>
            </div>
          </div>
        </div>

        <form onSubmit={handleSaveSettings} className="form">
          <div className="form-section">
            <h3 className="form-section-heading">Collection Unit Settings</h3>
            <div className="form-grid-2">
              <FormSelect
                label="Collection Unit Type"
                name="type"
                value={settingsForm.type}
                onChange={handleSettingsChange}
                options={COLLECTION_UNIT_TYPES.map((t) => ({ value: t, label: t }))}
                required
              />

              <FormInput
                label={settingsForm.type === 'Mosques' ? 'Mosque Name' : 'Name'}
                type="text"
                name="name"
                value={settingsForm.name}
                onChange={handleSettingsChange}
                placeholder="Unit / Mosque Name"
                required
              />

              {settingsForm.type === 'Donation Boxes' && (
                <FormInput
                  label="Key number"
                  type="text"
                  name="key_no"
                  value={settingsForm.key_no}
                  onChange={handleSettingsChange}
                />
              )}

              {settingsForm.type === 'Donation Boxes' && (
                <FormSelect
                  label="Box type"
                  name="box_type"
                  value={settingsForm.box_type}
                  onChange={handleSettingsChange}
                  options={boxTypeOptions}
                  required
                />
              )}

              <FormSelect
                label="Status"
                name="status"
                value={settingsForm.status}
                onChange={handleSettingsChange}
                options={statusOptions}
                required
              />
              <p style={{ margin: '-4px 0 8px', fontSize: 12, color: '#64748b', gridColumn: '1 / -1' }}>
                Changing status creates an Operational Query. It applies only after the
                selected person approves it — current status stays until then.
              </p>

              {settingsForm.status === 'removed' && (
                <FormInput
                  label="Donation Box Removal Date"
                  type="date"
                  name="removal_date"
                  value={settingsForm.removal_date}
                  onChange={handleSettingsChange}
                  required
                />
              )}

              <FormSelect
                label="Collection frequency"
                name="collection_frequency"
                value={settingsForm.collection_frequency}
                onChange={handleSettingsChange}
                options={collectionFrequencyOptions}
                required
              />

              <FormInput
                label="Landmark / Marketplace"
                type="text"
                name="landmark_marketplace"
                value={settingsForm.landmark_marketplace}
                onChange={handleSettingsChange}
                placeholder="e.g., Millat Road, Green Town, Satyana Road"
              />

              {donationBox?.registration_latitude != null &&
                donationBox?.registration_longitude != null && (
                  <>
                    <FormInput
                      label="Collection margin"
                      type="number"
                      name="location_radius_value"
                      value={settingsForm.location_radius_value}
                      onChange={handleSettingsChange}
                      min={settingsForm.location_radius_unit === 'km' ? '0.01' : '10'}
                      max={settingsForm.location_radius_unit === 'km' ? '10' : '10000'}
                      step={settingsForm.location_radius_unit === 'km' ? '0.1' : '1'}
                      placeholder={
                        settingsForm.location_radius_unit === 'km' ? 'e.g. 0.1' : 'e.g. 100'
                      }
                    />
                    <FormSelect
                      label="Margin unit"
                      name="location_radius_unit"
                      value={settingsForm.location_radius_unit}
                      onChange={handleSettingsChange}
                      options={[
                        { value: 'm', label: 'Meters (m)' },
                        { value: 'km', label: 'Kilometers (km)' },
                      ]}
                    />
                  </>
                )}
            </div>
          </div>

          <div className="form-actions">
            <button type="submit" className="primary_btn" disabled={savingSettings}>
              {savingSettings ? 'Saving...' : 'Save box settings'}
            </button>
          </div>
        </form>

        <div className="form-section" style={{ marginTop: '32px' }}>
          <h3 className="form-section-heading">Change history</h3>
          <DonationBoxAuditHistory donationBoxId={id} refreshKey={auditRefreshKey} />
        </div>
      </div>

      <StatusChangeRequestModal
        open={statusModalOpen}
        currentStatus={donationBox?.status}
        nextStatus={settingsForm.status}
        removalDate={settingsForm.removal_date}
        onRemovalDateChange={(value) =>
          setSettingsForm((prev) => ({ ...prev, removal_date: value }))
        }
        onClose={() => {
          setStatusModalOpen(false);
          setPendingNonStatusPayload(null);
        }}
        onSubmit={handleStatusQuerySubmit}
        submitting={submittingStatusQuery}
      />
    </>
  );
};

export default EditDonationBox;
