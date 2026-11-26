import React, { useEffect, useState } from 'react';
import axiosInstance from '../../../../../utils/axios';
import FormInput from '../../../../common/FormInput';
import FormSelect from '../../../../common/FormSelect';
import '../../../../common/Modal.css';

const EditSubRegion = ({ isOpen, id, onClose, onSuccess }) => {
  const [countries, setCountries] = useState([]);
  const [regions, setRegions] = useState([]);
  const [form, setForm] = useState({
    name: '',
    code: '',
    country_id: '',
    region_id: '',
    is_active: true,
    description: '',
  });
  const [loading, setLoading] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');

  const fetchRegions = async (countryId) => {
    if (!countryId) {
      setRegions([]);
      return;
    }
    try {
      const res = await axiosInstance.get(`/regions?country_id=${countryId}`);
      if (res.data.success) setRegions(res.data.data || []);
    } catch {
      setRegions([]);
    }
  };

  useEffect(() => {
    if (!isOpen || !id) return;
    let cancelled = false;
    const load = async () => {
      try {
        setLoading(true);
        setError('');
        const [countriesRes, rowRes] = await Promise.all([
          axiosInstance.get('/countries'),
          axiosInstance.get(`/sub-regions/${id}`),
        ]);
        if (!cancelled && countriesRes.data?.success) setCountries(countriesRes.data.data || []);
        const data = rowRes.data?.data;
        if (!rowRes.data?.success || !data) {
          if (!cancelled) setError(rowRes.data?.message || 'Sub region not found');
          return;
        }
        const countryId = data.country_id ? String(data.country_id) : '';
        const regionId = data.region_id ? String(data.region_id) : '';
        if (countryId) await fetchRegions(countryId);
        if (!cancelled) {
          setForm({
            name: data.name || '',
            code: data.code || '',
            country_id: countryId,
            region_id: regionId,
            is_active: data.is_active !== false,
            description: data.description || '',
          });
        }
      } catch (err) {
        if (!cancelled) setError(err.response?.data?.message || 'Failed to load sub region');
      } finally {
        if (!cancelled) setLoading(false);
      }
    };
    load();
    return () => {
      cancelled = true;
    };
  }, [isOpen, id]);

  useEffect(() => {
    if (!isOpen || loading) return;
    if (form.country_id) fetchRegions(form.country_id);
    else setRegions([]);
  }, [form.country_id, isOpen, loading]);

  if (!isOpen) return null;

  const handleChange = (e) => {
    const { name, value } = e.target;
    const val = name === 'is_active' ? e.target.checked : value;
    setForm((prev) => {
      const next = { ...prev, [name]: val };
      if (name === 'country_id') next.region_id = '';
      return next;
    });
    if (error) setError('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.country_id || !form.region_id) {
      setError('Please select country and region');
      return;
    }
    setIsSubmitting(true);
    try {
      await axiosInstance.patch(`/sub-regions/${id}`, {
        name: form.name.trim(),
        code: form.code?.trim() || undefined,
        country_id: Number(form.country_id),
        region_id: Number(form.region_id),
        is_active: form.is_active,
        description: form.description?.trim() || undefined,
      });
      onSuccess?.();
      onClose?.();
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to update sub region');
    } finally {
      setIsSubmitting(false);
    }
  };

  const countryOptions = countries.map((c) => ({ value: String(c.id), label: c.name }));
  const regionOptions = regions.map((r) => ({ value: String(r.id), label: r.name }));

  return (
    <div className="custom-modal-overlay" onClick={onClose} role="presentation">
      <div
        className="custom-modal-content geo-edit-modal"
        style={{ maxWidth: 720, width: '92%' }}
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-modal="true"
      >
        <button type="button" className="custom-modal-close" onClick={onClose} aria-label="Close">
          &times;
        </button>
        <h2>Edit Sub Region</h2>
        {error && <div className="status-message status-message--error">{error}</div>}
        {loading ? (
          <p>Loading...</p>
        ) : (
          <form onSubmit={handleSubmit} className="form geo-edit-form">
            <div className="form-section">
              <div className="form-grid-2">
                <FormInput label="Name" name="name" value={form.name} onChange={handleChange} required maxLength={100} />
                <FormInput label="Code" name="code" value={form.code} onChange={handleChange} maxLength={10} />
                <FormSelect
                  label="Country"
                  name="country_id"
                  value={form.country_id}
                  onChange={handleChange}
                  options={countryOptions}
                  required
                  showDefaultOption
                  defaultOptionText="Select country"
                />
                <FormSelect
                  label="Region"
                  name="region_id"
                  value={form.region_id}
                  onChange={handleChange}
                  options={regionOptions}
                  required
                  showDefaultOption
                  defaultOptionText="Select region"
                />
              </div>
            </div>
            <div className="form-section">
              <FormInput label="Description" type="textarea" name="description" value={form.description} onChange={handleChange} rows={3} />
            </div>
            <div className="form-section form-section--compact">
              <label className="form-label geo-edit-active">
                <input type="checkbox" name="is_active" checked={form.is_active} onChange={handleChange} /> Active
              </label>
            </div>
            <div className="form-actions">
              <button type="submit" className="primary_btn" disabled={isSubmitting}>
                {isSubmitting ? 'Updating...' : 'Update Sub Region'}
              </button>
              <button type="button" className="secondary_btn" onClick={onClose} disabled={isSubmitting}>
                Cancel
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
};

export default EditSubRegion;
