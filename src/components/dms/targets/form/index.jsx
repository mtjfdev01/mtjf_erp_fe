import React, { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { toast } from 'react-toastify';
import axiosInstance from '../../../../utils/axios';
import Navbar from '../../../Navbar';
import PageHeader from '../../../common/PageHeader';
import FormInput from '../../../common/FormInput';
import FormSelect from '../../../common/FormSelect';
import FormTextarea from '../../../common/FormTextarea';
import SearchableDropdown from '../../../common/SearchableDropdown';
import { TARGET_TYPES, MONTH_OPTIONS, userDisplayName } from '../constants';

const now = new Date();

const emptyForm = {
  user_id: '',
  target_type: 'donation_amount',
  target_amount: '',
  period_year: String(now.getFullYear()),
  period_month: String(now.getMonth() + 1),
  notes: '',
};

const TargetForm = () => {
  const navigate = useNavigate();
  const { id } = useParams();
  const isEdit = !!id;

  const [form, setForm] = useState({ ...emptyForm });
  const [selectedUser, setSelectedUser] = useState(null);
  const [loading, setLoading] = useState(isEdit);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!isEdit) return undefined;
    let cancelled = false;
    (async () => {
      try {
        setLoading(true);
        const res = await axiosInstance.get(`/dms/targets/${id}`);
        const row = res.data?.data;
        if (!row || cancelled) return;
        setForm({
          user_id: String(row.user_id || row.user?.id || ''),
          target_type: row.target_type || 'donation_amount',
          target_amount: String(row.target_amount ?? ''),
          period_year: String(row.period_year || now.getFullYear()),
          period_month: String(row.period_month || now.getMonth() + 1),
          notes: row.notes || '',
        });
        if (row.user) {
          setSelectedUser({
            ...row.user,
            id: row.user.id,
            first_name: row.user.first_name,
            last_name: row.user.last_name,
            name: userDisplayName(row.user),
          });
        }
      } catch (err) {
        if (!cancelled) {
          setError(err?.response?.data?.message || 'Failed to load target');
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [id, isEdit]);

  const yearOptions = Array.from({ length: 6 }, (_, i) => {
    const y = now.getFullYear() - i + 1;
    return { value: String(y), label: String(y) };
  });

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (!form.user_id) {
      setError('Please select a user');
      return;
    }
    const amount = Number(form.target_amount);
    if (!Number.isFinite(amount) || amount < 0) {
      setError('Enter a valid target amount');
      return;
    }

    const payload = {
      user_id: Number(form.user_id),
      target_type: form.target_type,
      target_amount: amount,
      period_year: Number(form.period_year),
      period_month: Number(form.period_month),
      notes: form.notes?.trim() || undefined,
    };

    try {
      setSaving(true);
      if (isEdit) {
        await axiosInstance.patch(`/dms/targets/${id}`, payload);
        toast.success('Target updated');
      } else {
        await axiosInstance.post('/dms/targets', payload);
        toast.success('Target assigned');
      }
      navigate('/dms/targets/list');
    } catch (err) {
      const msg = err?.response?.data?.message || 'Failed to save target';
      setError(msg);
      toast.error(msg);
    } finally {
      setSaving(false);
    }
  };

  return (
    <>
      <Navbar />
      <div className="form-wrapper">
        <PageHeader
          title={isEdit ? 'Edit Target' : 'Assign Target'}
          backPath="/dms/targets/list"
        />

        {loading ? (
          <div className="loading">Loading…</div>
        ) : (
          <div className="form-container" style={{ maxWidth: 720 }}>
            <form onSubmit={handleSubmit}>
              {error ? <div className="error-message">{error}</div> : null}

              <div className="form-grid">
                <SearchableDropdown
                  label="User *"
                  placeholder="Search fundraising users…"
                  apiEndpoint="/users/options"
                  apiParams={{ department: 'fund_raising' }}
                  value={selectedUser}
                  displayKey="first_name"
                  onSelect={(user) => {
                    setSelectedUser(user);
                    setForm((p) => ({
                      ...p,
                      user_id: user?.id ? String(user.id) : '',
                    }));
                  }}
                  onClear={() => {
                    setSelectedUser(null);
                    setForm((p) => ({ ...p, user_id: '' }));
                  }}
                  debounceDelay={300}
                  minSearchLength={1}
                  allowResearch
                />

                <FormSelect
                  label="Target Type"
                  required
                  value={form.target_type}
                  onChange={(e) =>
                    setForm((p) => ({ ...p, target_type: e.target.value }))
                  }
                  options={TARGET_TYPES}
                />

                <FormInput
                  label="Target Amount (PKR)"
                  required
                  type="number"
                  min="0"
                  step="1"
                  value={form.target_amount}
                  onChange={(e) =>
                    setForm((p) => ({ ...p, target_amount: e.target.value }))
                  }
                  placeholder="e.g. 20000"
                />

                <FormSelect
                  label="Year"
                  required
                  value={form.period_year}
                  onChange={(e) =>
                    setForm((p) => ({ ...p, period_year: e.target.value }))
                  }
                  options={yearOptions}
                />

                <FormSelect
                  label="Month"
                  required
                  value={form.period_month}
                  onChange={(e) =>
                    setForm((p) => ({ ...p, period_month: e.target.value }))
                  }
                  options={MONTH_OPTIONS.map((m) => ({
                    value: String(m.value),
                    label: m.label,
                  }))}
                />
              </div>

              <FormTextarea
                label="Notes"
                value={form.notes}
                onChange={(e) =>
                  setForm((p) => ({ ...p, notes: e.target.value }))
                }
                placeholder="Optional"
                rows={3}
              />

              <div className="form-actions" style={{ marginTop: 20 }}>
                <button
                  type="button"
                  className="secondary-button"
                  onClick={() => navigate('/dms/targets/list')}
                  disabled={saving}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="primary-button"
                  disabled={saving}
                >
                  {saving
                    ? 'Saving…'
                    : isEdit
                      ? 'Update Target'
                      : 'Assign Target'}
                </button>
              </div>
            </form>
          </div>
        )}
      </div>
    </>
  );
};

export default TargetForm;
