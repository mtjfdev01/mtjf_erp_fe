import React, { useEffect, useState } from 'react';
import axiosInstance from '../../../../../utils/axios';
import FormInput from '../../../../common/FormInput';
import FormSelect from '../../../../common/FormSelect';
import MultiSelect from '../../../../common/MultiSelect';
import '../../../../common/Modal.css';

const ROUTE_TYPE_OPTIONS = [
  { value: 'main', label: 'Main' },
  { value: 'secondary', label: 'Secondary' },
  { value: 'local', label: 'Local' },
  { value: 'highway', label: 'Highway' },
  { value: 'street', label: 'Street' },
  { value: 'other', label: 'Other' },
];

const EditRoute = ({ isOpen, id, onClose, onSuccess }) => {
  const [countries, setCountries] = useState([]);
  const [regions, setRegions] = useState([]);
  const [cities, setCities] = useState([]);
  const [form, setForm] = useState({
    name: '',
    code: '',
    route_type: 'street',
    country_id: '',
    region_id: '',
    city_ids: [],
    distance_km: '',
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

  const fetchCities = async (regionId) => {
    if (!regionId) {
      setCities([]);
      return;
    }
    try {
      const res = await axiosInstance.get(`/cities?region_id=${regionId}`);
      if (res.data.success) setCities(res.data.data || []);
    } catch {
      setCities([]);
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
          axiosInstance.get(`/routes/${id}`),
        ]);
        if (!cancelled && countriesRes.data?.success) setCountries(countriesRes.data.data || []);
        const data = rowRes.data?.data;
        if (!rowRes.data?.success || !data) {
          if (!cancelled) setError(rowRes.data?.message || 'Route not found');
          return;
        }
        const countryId = data.country_id ? String(data.country_id) : '';
        const regionId = data.region_id ? String(data.region_id) : '';
        const cityIds = Array.isArray(data.cities)
          ? data.cities.map((c) => String(c.id))
          : Array.isArray(data.city_ids)
            ? data.city_ids.map(String)
            : [];
        if (countryId) await fetchRegions(countryId);
        if (regionId) await fetchCities(regionId);
        if (!cancelled) {
          setForm({
            name: data.name || '',
            code: data.code || '',
            route_type: data.route_type || 'street',
            country_id: countryId,
            region_id: regionId,
            city_ids: cityIds,
            distance_km: data.distance_km != null ? String(data.distance_km) : '',
            is_active: data.is_active !== false,
            description: data.description || '',
          });
        }
      } catch (err) {
        if (!cancelled) setError(err.response?.data?.message || 'Failed to load route');
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
    else {
      setRegions([]);
      setCities([]);
    }
  }, [form.country_id, isOpen, loading]);

  useEffect(() => {
    if (!isOpen || loading) return;
    if (form.region_id) fetchCities(form.region_id);
    else setCities([]);
  }, [form.region_id, isOpen, loading]);

  if (!isOpen) return null;

  const handleChange = (e) => {
    const { name, value } = e.target;
    const val = name === 'is_active' ? e.target.checked : value;
    setForm((prev) => {
      const next = { ...prev, [name]: val };
      if (name === 'country_id') {
        next.region_id = '';
        next.city_ids = [];
      }
      if (name === 'region_id') next.city_ids = [];
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
    if (!form.city_ids?.length) {
      setError('Please select at least one city');
      return;
    }
    setIsSubmitting(true);
    try {
      await axiosInstance.patch(`/routes/${id}`, {
        name: form.name.trim(),
        code: form.code?.trim() || undefined,
        route_type: form.route_type,
        country_id: Number(form.country_id),
        region_id: Number(form.region_id),
        city_ids: form.city_ids.map((cid) => Number(cid)),
        distance_km: form.distance_km ? parseFloat(form.distance_km) : undefined,
        is_active: form.is_active,
        description: form.description?.trim() || undefined,
      });
      onSuccess?.();
      onClose?.();
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to update route');
    } finally {
      setIsSubmitting(false);
    }
  };

  const countryOptions = countries.map((c) => ({ value: String(c.id), label: c.name }));
  const regionOptions = regions.map((r) => ({ value: String(r.id), label: r.name }));
  const cityOptions = cities.map((c) => ({ value: String(c.id), label: c.name }));

  return (
    <div className="custom-modal-overlay" onClick={onClose} role="presentation">
      <div
        className="custom-modal-content geo-edit-modal"
        style={{ maxWidth: 760, width: '94%' }}
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-modal="true"
      >
        <button type="button" className="custom-modal-close" onClick={onClose} aria-label="Close">
          &times;
        </button>
        <h2>Edit Route</h2>
        {error && <div className="status-message status-message--error">{error}</div>}
        {loading ? (
          <p>Loading...</p>
        ) : (
          <form onSubmit={handleSubmit} className="form geo-edit-form">
            <div className="form-section">
              <div className="form-grid-2">
                <FormInput label="Name" name="name" value={form.name} onChange={handleChange} required maxLength={100} />
                <FormInput label="Code" name="code" value={form.code} onChange={handleChange} maxLength={20} />
                <FormSelect label="Route Type" name="route_type" value={form.route_type} onChange={handleChange} options={ROUTE_TYPE_OPTIONS} />
                <FormSelect label="Country" name="country_id" value={form.country_id} onChange={handleChange} options={countryOptions} required showDefaultOption defaultOptionText="Select country" />
                <FormSelect label="Region" name="region_id" value={form.region_id} onChange={handleChange} options={regionOptions} required showDefaultOption defaultOptionText="Select region" />
                <FormInput label="Distance (km)" type="number" name="distance_km" value={form.distance_km} onChange={handleChange} step="0.01" min="0" />
              </div>
            </div>
            <div className="form-section">
              <MultiSelect
                label="Cities"
                name="city_ids"
                options={cityOptions}
                value={form.city_ids}
                onChange={(selected) => {
                  setForm((prev) => ({ ...prev, city_ids: selected }));
                  if (error) setError('');
                }}
                required
                placeholder={form.region_id ? 'Select cities in this region' : 'Select a region first'}
                disabled={!form.region_id}
              />
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
                {isSubmitting ? 'Updating...' : 'Update Route'}
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

export default EditRoute;
