import React, { useEffect, useMemo, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import axiosInstance from '../../../../utils/axios';
import Navbar from '../../../Navbar';
import PageHeader from '../../../common/PageHeader';
import FormInput from '../../../common/FormInput';
import FormSelect from '../../../common/FormSelect';
import SearchableDropdown from '../../../common/SearchableDropdown';
import { projectCards } from '../../../../utils/program';
import { useAuth } from '../../../../context/AuthContext';
import { hasPermission } from '../../../../utils/permissions';

const INTERVAL_OPTIONS = [
  { value: 'day', label: 'Daily' },
  { value: 'week', label: 'Weekly' },
  { value: 'month', label: 'Monthly' },
  { value: 'year', label: 'Yearly' },
];

const STATUS_OPTIONS = [
  { value: 'active', label: 'Active' },
  { value: 'canceled', label: 'Canceled' },
  { value: 'past_due', label: 'Past due' },
  { value: 'failed', label: 'Failed' },
];

const START_MODE_OPTIONS = [
  { value: 'same_date', label: 'Same date each period' },
  { value: 'first_of_month', label: 'First of month' },
  { value: 'custom', label: 'Custom start date' },
];

const METHOD_OPTIONS = [
  { value: 'manual', label: 'Manual / remind' },
  { value: 'cash', label: 'Cash' },
  { value: 'bank_transfer', label: 'Bank transfer' },
  { value: 'cheque', label: 'Cheque' },
  { value: 'online', label: 'Online (non-Stripe)' },
];

const DONATION_TYPE_OPTIONS = [
  { value: '', label: '—' },
  { value: 'zakat', label: 'Zakat' },
  { value: 'sadqa', label: 'Sadqa' },
  { value: 'general', label: 'General' },
];

const emptyForm = {
  donor_id: '',
  amount: '',
  currency: 'PKR',
  billing_interval: 'month',
  billing_interval_count: '1',
  start_date_mode: 'same_date',
  start_date: '',
  consent: true,
  donation_method: 'manual',
  project_id: '',
  campaign_id: '',
  donation_type: 'general',
  prepaid_periods: '',
  initial_donation_id: '',
  status: 'active',
};

const RecurringDonationForm = ({ mode = 'add' }) => {
  const isEdit = mode === 'edit';
  const navigate = useNavigate();
  const { id } = useParams();
  const { permissions } = useAuth();
  const [form, setForm] = useState({ ...emptyForm });
  const [selectedDonor, setSelectedDonor] = useState(null);
  const [loading, setLoading] = useState(isEdit);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [isStripe, setIsStripe] = useState(false);

  const canAccess = useMemo(() => {
    if (!permissions) return null;
    if (permissions.super_admin === true || permissions.fund_raising_manager === true) {
      return true;
    }
    const action = isEdit ? 'update' : 'create';
    return hasPermission(permissions, 'fund_raising', 'recurring_donations', action);
  }, [permissions, isEdit]);

  const projectOptions = useMemo(
    () => [
      { value: '', label: '—' },
      ...(projectCards || []).map((p) => ({
        value: p.id,
        label: p.title || p.id,
      })),
    ],
    [],
  );

  useEffect(() => {
    if (!isEdit || !id) return;
    let cancelled = false;
    (async () => {
      try {
        setLoading(true);
        const res = await axiosInstance.get(`/recurring-donations/${id}`);
        const sub = res.data?.data?.subscription;
        const donor = res.data?.data?.donor;
        if (!res.data?.success || !sub) {
          throw new Error(res.data?.message || 'Failed to load');
        }
        if (cancelled) return;
        setIsStripe(!!sub.stripe_subscription_id);
        setForm({
          donor_id: sub.donor_id ? String(sub.donor_id) : '',
          amount: sub.amount != null ? String(sub.amount) : '',
          currency: sub.currency || 'PKR',
          billing_interval: sub.billing_interval || 'month',
          billing_interval_count: String(sub.billing_interval_count || 1),
          start_date_mode: sub.start_date_mode || 'same_date',
          start_date: sub.start_date ? String(sub.start_date).slice(0, 10) : '',
          consent: sub.consent !== false,
          donation_method: sub.donation_method || 'manual',
          project_id: sub.project_id || '',
          campaign_id: sub.campaign_id != null ? String(sub.campaign_id) : '',
          donation_type: sub.donation_type || '',
          prepaid_periods:
            sub.prepaid_periods != null ? String(sub.prepaid_periods) : '',
          initial_donation_id:
            sub.initial_donation_id != null
              ? String(sub.initial_donation_id)
              : '',
          status: sub.status || 'active',
        });
        if (donor) {
          setSelectedDonor({
            id: donor.id,
            name:
              donor.name ||
              [donor.first_name, donor.last_name].filter(Boolean).join(' ') ||
              donor.email,
            email: donor.email,
          });
        }
      } catch (err) {
        if (!cancelled) {
          setError(err.response?.data?.message || err.message || 'Failed to load');
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [isEdit, id]);

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setForm((prev) => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value,
    }));
    if (error) setError('');
  };

  const handleDonorSelect = (donor) => {
    setSelectedDonor(donor);
    setForm((prev) => ({
      ...prev,
      donor_id: donor?.id != null ? String(donor.id) : '',
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.donor_id) {
      setError('Please select a donor');
      return;
    }
    if (!form.amount || Number(form.amount) <= 0) {
      setError('Amount must be greater than 0');
      return;
    }

    setSaving(true);
    setError('');
    try {
      const payload = isStripe && isEdit
        ? { status: form.status }
        : {
            donor_id: Number(form.donor_id),
            amount: Number(form.amount),
            currency: form.currency || 'PKR',
            billing_interval: form.billing_interval,
            billing_interval_count: Number(form.billing_interval_count) || 1,
            start_date_mode: form.start_date_mode || 'same_date',
            start_date: form.start_date || undefined,
            consent: !!form.consent,
            donation_method: form.donation_method || 'manual',
            project_id: form.project_id || undefined,
            campaign_id: form.campaign_id
              ? Number(form.campaign_id)
              : undefined,
            donation_type: form.donation_type || undefined,
            prepaid_periods: form.prepaid_periods
              ? Number(form.prepaid_periods)
              : undefined,
            initial_donation_id: form.initial_donation_id
              ? Number(form.initial_donation_id)
              : undefined,
            status: form.status || 'active',
          };

      const res = isEdit
        ? await axiosInstance.patch(`/recurring-donations/${id}`, payload)
        : await axiosInstance.post('/recurring-donations', payload);

      if (!res.data?.success) {
        throw new Error(res.data?.message || 'Save failed');
      }
      const savedId = isEdit ? id : res.data?.data?.id;
      navigate(
        savedId
          ? `/dms/recurring-donations/view/${savedId}`
          : '/dms/recurring-donations/list',
      );
    } catch (err) {
      setError(err.response?.data?.message || err.message || 'Failed to save');
    } finally {
      setSaving(false);
    }
  };

  const handleBack = () =>
    navigate(
      isEdit
        ? `/dms/recurring-donations/view/${id}`
        : '/dms/recurring-donations/list',
    );

  if (canAccess === null || loading) {
    return (
      <>
        <Navbar />
        <div className="form-content">
          <PageHeader
            title={isEdit ? 'Update Recurring Donation' : 'Add Recurring Donation'}
            showBackButton
            onBackClick={handleBack}
          />
          <div className="loading">Loading...</div>
        </div>
      </>
    );
  }

  if (!canAccess) {
    return (
      <>
        <Navbar />
        <div className="form-content">
          <PageHeader
            title={isEdit ? 'Update Recurring Donation' : 'Add Recurring Donation'}
            showBackButton
            onBackClick={handleBack}
          />
          <div className="status-message status-message--error">
            You do not have permission to {isEdit ? 'update' : 'create'} recurring
            donations.
          </div>
        </div>
      </>
    );
  }

  const fieldsDisabled = isStripe && isEdit;

  return (
    <>
      <Navbar />
      <div className="form-content">
        <PageHeader
          title={isEdit ? 'Update Recurring Donation' : 'Add Recurring Donation'}
          showBackButton
          onBackClick={handleBack}
        />

        {isStripe && (
          <div className="status-message">
            Stripe subscription — only status can be changed here
          </div>
        )}

        {error && (
          <div className="status-message status-message--error">{error}</div>
        )}

        <form onSubmit={handleSubmit} className="form">
          <div className="form-section">
            <SearchableDropdown
              label="Donor"
              required
              apiEndpoint="/donors"
              value={selectedDonor}
              displayKey="name"
              valueKey="id"
              onSelect={handleDonorSelect}
              onClear={() => {
                setSelectedDonor(null);
                setForm((prev) => ({ ...prev, donor_id: '' }));
              }}
              placeholder="Search donor by name, email, phone..."
              disabled={fieldsDisabled}
              renderOption={(donor) => (
                <div>
                  <div>
                    {donor.name ||
                      [donor.first_name, donor.last_name].filter(Boolean).join(' ')}
                  </div>
                  <div style={{ fontSize: 12, color: '#666' }}>
                    {donor.email || donor.phone || `ID ${donor.id}`}
                  </div>
                </div>
              )}
            />
          </div>

          <div className="form-section">
            <div className="form-grid-2">
              <FormInput
                label="Amount"
                name="amount"
                type="number"
                min="1"
                value={form.amount}
                onChange={handleChange}
                required
                disabled={fieldsDisabled}
              />
              <FormInput
                label="Currency"
                name="currency"
                value={form.currency}
                onChange={handleChange}
                disabled={fieldsDisabled}
              />
              <FormSelect
                label="Billing interval"
                name="billing_interval"
                value={form.billing_interval}
                onChange={handleChange}
                options={INTERVAL_OPTIONS}
                disabled={fieldsDisabled}
              />
              <FormInput
                label="Interval count"
                name="billing_interval_count"
                type="number"
                min="1"
                value={form.billing_interval_count}
                onChange={handleChange}
                disabled={fieldsDisabled}
              />
              <FormSelect
                label="Start date mode"
                name="start_date_mode"
                value={form.start_date_mode}
                onChange={handleChange}
                options={START_MODE_OPTIONS}
                disabled={fieldsDisabled}
              />
              <FormInput
                label="Start date"
                name="start_date"
                type="date"
                value={form.start_date}
                onChange={handleChange}
                disabled={fieldsDisabled}
              />
              <FormSelect
                label="Payment method"
                name="donation_method"
                value={form.donation_method}
                onChange={handleChange}
                options={METHOD_OPTIONS}
                disabled={fieldsDisabled}
              />
              <FormSelect
                label="Donation type"
                name="donation_type"
                value={form.donation_type}
                onChange={handleChange}
                options={DONATION_TYPE_OPTIONS}
                disabled={fieldsDisabled}
              />
              <FormSelect
                label="Project"
                name="project_id"
                value={form.project_id}
                onChange={handleChange}
                options={projectOptions}
                disabled={fieldsDisabled}
              />
              <FormInput
                label="Campaign ID (optional)"
                name="campaign_id"
                type="number"
                value={form.campaign_id}
                onChange={handleChange}
                disabled={fieldsDisabled}
              />
              <FormInput
                label="Prepaid periods (optional)"
                name="prepaid_periods"
                type="number"
                min="1"
                value={form.prepaid_periods}
                onChange={handleChange}
                disabled={fieldsDisabled}
              />
              <FormInput
                label="Initial donation ID (optional)"
                name="initial_donation_id"
                type="number"
                value={form.initial_donation_id}
                onChange={handleChange}
                disabled={fieldsDisabled}
              />
              <FormSelect
                label="Status"
                name="status"
                value={form.status}
                onChange={handleChange}
                options={STATUS_OPTIONS}
              />
            </div>
          </div>

          <div className="form-section">
            <label style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
              <input
                type="checkbox"
                name="consent"
                checked={!!form.consent}
                onChange={handleChange}
                disabled={fieldsDisabled}
              />
              Donor consented to recurring donations
            </label>
          </div>

          <div className="form-actions">
            <button type="submit" className="btn btn-primary" disabled={saving}>
              {saving ? 'Saving...' : isEdit ? 'Save changes' : 'Create recurring donation'}
            </button>
            <button
              type="button"
              className="btn btn-secondary"
              onClick={() => navigate('/dms/recurring-donations/list')}
              disabled={saving}
            >
              Cancel
            </button>
          </div>
        </form>
      </div>
    </>
  );
};

export default RecurringDonationForm;
