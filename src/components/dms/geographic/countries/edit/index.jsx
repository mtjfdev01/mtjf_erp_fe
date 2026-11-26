import React, { useEffect, useState } from 'react';
import axiosInstance from '../../../../../utils/axios';
import FormInput from '../../../../common/FormInput';
import '../../../../common/Modal.css';

const EditCountry = ({ isOpen, id, onClose, onSuccess }) => {
  const [form, setForm] = useState({
    name: '',
    code: '',
    currency: 'PKR',
    currency_symbol: 'Rs',
    phone_code: '+92',
    is_active: true,
    description: '',
  });
  const [loading, setLoading] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!isOpen || !id) return;
    let cancelled = false;
    const load = async () => {
      try {
        setLoading(true);
        setError('');
        const res = await axiosInstance.get(`/countries/${id}`);
        const data = res.data?.data;
        if (!res.data?.success || !data) {
          if (!cancelled) setError(res.data?.message || 'Country not found');
          return;
        }
        if (!cancelled) {
          setForm({
            name: data.name || '',
            code: data.code || '',
            currency: data.currency || 'PKR',
            currency_symbol: data.currency_symbol || '',
            phone_code: data.phone_code || '',
            is_active: data.is_active !== false,
            description: data.description || '',
          });
        }
      } catch (err) {
        if (!cancelled) setError(err.response?.data?.message || 'Failed to load country');
      } finally {
        if (!cancelled) setLoading(false);
      }
    };
    load();
    return () => {
      cancelled = true;
    };
  }, [isOpen, id]);

  if (!isOpen) return null;

  const handleChange = (e) => {
    const { name, value } = e.target;
    const val = name === 'is_active' ? e.target.checked : value;
    setForm((prev) => ({ ...prev, [name]: val }));
    if (error) setError('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      const payload = {
        ...form,
        currency: form.currency?.trim() || 'PKR',
        currency_symbol: form.currency_symbol?.trim() || undefined,
        phone_code: form.phone_code?.trim() || undefined,
        description: form.description?.trim() || undefined,
      };
      await axiosInstance.patch(`/countries/${id}`, payload);
      onSuccess?.();
      onClose?.();
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to update country');
    } finally {
      setIsSubmitting(false);
    }
  };

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
        <h2>Edit Country</h2>
        {error && <div className="status-message status-message--error">{error}</div>}
        {loading ? (
          <p>Loading...</p>
        ) : (
          <form onSubmit={handleSubmit} className="form geo-edit-form">
            <div className="form-section">
              <div className="form-grid-2">
                <FormInput label="Name" name="name" value={form.name} onChange={handleChange} required maxLength={100} />
                <FormInput label="Code" name="code" value={form.code} onChange={handleChange} required maxLength={3} />
                <FormInput label="Currency" name="currency" value={form.currency} onChange={handleChange} required maxLength={3} />
                <FormInput label="Currency Symbol" name="currency_symbol" value={form.currency_symbol} onChange={handleChange} maxLength={2} />
                <FormInput label="Phone Code" name="phone_code" value={form.phone_code} onChange={handleChange} maxLength={10} />
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
                {isSubmitting ? 'Updating...' : 'Update Country'}
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

export default EditCountry;
