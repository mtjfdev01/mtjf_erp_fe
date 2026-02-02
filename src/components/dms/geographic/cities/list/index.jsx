import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axiosInstance from '../../../../../utils/axios';
import Navbar from '../../../../Navbar';
import PageHeader from '../../../../common/PageHeader';
import ConfirmationModal from '../../../../common/ConfirmationModal';
import FormSelect from '../../../../common/FormSelect';
import { FiTrash2 } from 'react-icons/fi';

const CitiesList = () => {
  const navigate = useNavigate();
  const [cities, setCities] = useState([]);
  const [countries, setCountries] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [cityToDelete, setCityToDelete] = useState(null);
  const [regionFilter, setRegionFilter] = useState('');
  const [countryFilter, setCountryFilter] = useState('');
  const [regions, setRegions] = useState([]);

  const fetchCountries = async () => {
    try {
      const res = await axiosInstance.get('/countries');
      if (res.data.success) setCountries(res.data.data || []);
    } catch (err) {
      console.error('Failed to load countries', err);
    }
  };

  const fetchRegions = async (countryId) => {
    if (!countryId) {
      setRegions([]);
      return;
    }
    try {
      const res = await axiosInstance.get(`/regions?country_id=${countryId}`);
      if (res.data.success) setRegions(res.data.data || []);
    } catch (err) {
      setRegions([]);
    }
  };

  const fetchCities = async () => {
    try {
      setLoading(true);
      let url = '/cities';
      const params = [];
      if (regionFilter) params.push(`region_id=${regionFilter}`);
      if (countryFilter) params.push(`country_id=${countryFilter}`);
      if (params.length) url += '?' + params.join('&');
      const res = await axiosInstance.get(url);
      if (res.data.success) setCities(res.data.data || []);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to load cities');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchCountries(); }, []);
  useEffect(() => {
    if (countryFilter) fetchRegions(countryFilter);
    else setRegions([]);
  }, [countryFilter]);
  useEffect(() => { fetchCities(); }, [regionFilter, countryFilter]);

  const handleBack = () => navigate('/dms/geographic/cities/list');
  const handleAdd = () => navigate('/dms/geographic/cities/add');

  const countryOptions = [
    { value: '', label: 'All countries' },
    ...(countries.map((c) => ({ value: String(c.id), label: c.name })))
  ];
  const regionOptions = [
    { value: '', label: 'All regions' },
    ...(regions.map((r) => ({ value: String(r.id), label: r.name })))
  ];

  const handleDeleteClick = (row) => {
    setCityToDelete(row);
    setShowDeleteModal(true);
  };

  const handleConfirmDelete = async () => {
    if (!cityToDelete) return;
    try {
      await axiosInstance.delete(`/cities/${cityToDelete.id}`);
      setShowDeleteModal(false);
      setCityToDelete(null);
      fetchCities();
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to delete city');
    }
  };

  const getRegionName = (row) => row.region ? row.region.name : (row.region_id ? '—' : '—');
  const getCountryName = (row) => row.country ? row.country.name : (row.country_id ? '—' : '—');

  return (
    <>
      <Navbar />
      <div className="form-content">
        <PageHeader title="Cities" onBack={handleBack} showAdd addPath="/dms/geographic/cities/add" />
        {error && <div className="status-message status-message--error">{error}</div>}
        <div className="form-section form-grid-2">
          <FormSelect label="Filter by country" name="countryFilter" value={countryFilter} onChange={(e) => { setCountryFilter(e.target.value); setRegionFilter(''); }} options={countryOptions} showDefaultOption defaultOptionText="All countries" />
          <FormSelect label="Filter by region" name="regionFilter" value={regionFilter} onChange={(e) => setRegionFilter(e.target.value)} options={regionOptions} showDefaultOption defaultOptionText="All regions" />
        </div>
        {loading ? (
          <p>Loading...</p>
        ) : (
          <div className="table-container">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Name</th>
                  <th>Code</th>
                  <th>Region</th>
                  <th>Country</th>
                  <th>Active</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {cities.map((row) => (
                  <tr key={row.id}>
                    <td>{row.name}</td>
                    <td>{row.code || '—'}</td>
                    <td>{getRegionName(row)}</td>
                    <td>{getCountryName(row)}</td>
                    <td>{row.is_active ? 'Yes' : 'No'}</td>
                    <td>
                      <button type="button" className="icon-btn danger" onClick={() => handleDeleteClick(row)} title="Delete">
                        <FiTrash2 />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
      <ConfirmationModal
        isOpen={showDeleteModal}
        title="Delete City"
        message={`Are you sure you want to delete "${cityToDelete?.name}"?`}
        onConfirm={handleConfirmDelete}
        onCancel={() => { setShowDeleteModal(false); setCityToDelete(null); }}
      />
    </>
  );
};

export default CitiesList;
