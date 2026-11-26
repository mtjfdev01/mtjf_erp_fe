import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axiosInstance from '../../../../../utils/axios';
import Navbar from '../../../../Navbar';
import PageHeader from '../../../../common/PageHeader'
import { RefreshButton } from '../../../../common/filters';
import ConfirmationModal from '../../../../common/ConfirmationModal';
import FormSelect from '../../../../common/FormSelect';
import { FiEdit2, FiTrash2 } from 'react-icons/fi';
import EditRegion from '../edit';

const RegionsList = () => {
  const navigate = useNavigate();
  const [regions, setRegions] = useState([]);
  const [countries, setCountries] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [editId, setEditId] = useState(null);
  const [regionToDelete, setRegionToDelete] = useState(null);
  const [countryFilter, setCountryFilter] = useState('');

  const fetchCountries = async () => {
    try {
      const res = await axiosInstance.get('/countries');
      if (res.data.success) setCountries(res.data.data || []);
    } catch (err) {
      console.error('Failed to load countries', err);
    }
  };

  const fetchRegions = async () => {
    try {
      setLoading(true);
      const url = countryFilter ? `/regions?country_id=${countryFilter}` : '/regions';
      const res = await axiosInstance.get(url);
      if (res.data.success) setRegions(res.data.data || []);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to load regions');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchCountries(); }, []);
  useEffect(() => { fetchRegions(); }, [countryFilter]);

  const handleBack = () => navigate('/dms/geographic/regions/list');
  const handleAdd = () => navigate('/dms/geographic/regions/add');

  const countryOptions = [
    { value: '', label: 'All countries' },
    ...(countries.map((c) => ({ value: String(c.id), label: c.name })))
  ];

  const handleDeleteClick = (row) => {
    setRegionToDelete(row);
    setShowDeleteModal(true);
  };

  const handleConfirmDelete = async () => {
    if (!regionToDelete) return;
    try {
      await axiosInstance.delete(`/regions/${regionToDelete.id}`);
      setShowDeleteModal(false);
      setRegionToDelete(null);
      fetchRegions();
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to delete region');
    }
  };

  const getCountryName = (countryId) => {
    const c = countries.find((x) => x.id === countryId);
    return c ? c.name : '—';
  };

  return (
    <>
      <Navbar />
      <div className="form-content">
        <PageHeader title="Regions" onBack={handleBack} showAdd addPath="/dms/geographic/regions/add" />
        {error && <div className="status-message status-message--error">{error}</div>}
        <div className="form-section">
          <FormSelect
            label="Filter by country"
            name="countryFilter"
            value={countryFilter}
            onChange={(e) => setCountryFilter(e.target.value)}
            options={countryOptions}
            showDefaultOption
            defaultOptionText="All countries"
          />
        </div>
        {loading ? (
          <p>Loading...</p>
        ) : (
          <>
            <div className="list-refresh-bar">
              <RefreshButton onClick={fetchRegions} loading={loading} />
            </div>

            <div className="table-container">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Name</th>
                  <th>Code</th>
                  <th>Country</th>
                  <th>Active</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {regions.map((row) => (
                  <tr key={row.id}>
                    <td>{row.name}</td>
                    <td>{row.code || '—'}</td>
                    <td>{row.country ? row.country.name : getCountryName(row.country_id)}</td>
                    <td>{row.is_active ? 'Yes' : 'No'}</td>
                    <td className="geo-list-actions-cell">
                      <div className="geo-list-actions">
                        <button type="button" className="icon-btn icon-btn--edit" onClick={() => setEditId(row.id)} title="Edit" aria-label="Edit">
                          <FiEdit2 />
                        </button>
                        <button type="button" className="icon-btn icon-btn--danger" onClick={() => handleDeleteClick(row)} title="Delete" aria-label="Delete">
                          <FiTrash2 />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          </>
        )}
      </div>
      <EditRegion
        isOpen={!!editId}
        id={editId}
        onClose={() => setEditId(null)}
        onSuccess={fetchRegions}
      />
      <ConfirmationModal
        isOpen={showDeleteModal}
        title="Delete Region"
        message={`Are you sure you want to delete "${regionToDelete?.name}"?`}
        onConfirm={handleConfirmDelete}
        onCancel={() => { setShowDeleteModal(false); setRegionToDelete(null); }}
      />
    </>
  );
};

export default RegionsList;
