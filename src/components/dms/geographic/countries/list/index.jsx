import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axiosInstance from '../../../../../utils/axios';
import Navbar from '../../../../Navbar';
import PageHeader from '../../../../common/PageHeader'
import { RefreshButton } from '../../../../common/filters';
import ConfirmationModal from '../../../../common/ConfirmationModal';
import { FiEdit2, FiTrash2 } from 'react-icons/fi';
import EditCountry from '../edit';

const CountriesList = () => {
  const navigate = useNavigate();
  const [countries, setCountries] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [editId, setEditId] = useState(null);
  const [countryToDelete, setCountryToDelete] = useState(null);

  const fetchCountries = async () => {
    try {
      setLoading(true);
      const res = await axiosInstance.get('/countries');
      if (res.data.success) setCountries(res.data.data || []);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to load countries');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchCountries(); }, []);

  const handleBack = () => navigate('/dms/geographic/countries/list');
  const handleAdd = () => navigate('/dms/geographic/countries/add');

  const handleDeleteClick = (row) => {
    setCountryToDelete(row);
    setShowDeleteModal(true);
  };

  const handleConfirmDelete = async () => {
    if (!countryToDelete) return;
    try {
      await axiosInstance.delete(`/countries/${countryToDelete.id}`);
      setShowDeleteModal(false);
      setCountryToDelete(null);
      fetchCountries();
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to delete country');
    }
  };

  return (
    <>
      <Navbar />
      <div className="form-content">
        <PageHeader
          title="Countries"
          onBack={handleBack}
          showAdd
          addPath="/dms/geographic/countries/add"
        />
        {error && <div className="status-message status-message--error">{error}</div>}
        {loading ? (
          <p>Loading...</p>
        ) : (
          <>
            <div className="list-refresh-bar">
              <RefreshButton onClick={fetchCountries} loading={loading} />
            </div>

            <div className="table-container">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Name</th>
                  <th>Code</th>
                  <th>Currency</th>
                  <th>Phone Code</th>
                  <th>Active</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {countries.map((row) => (
                  <tr key={row.id}>
                    <td>{row.name}</td>
                    <td>{row.code}</td>
                    <td>{row.currency}</td>
                    <td>{row.phone_code || '—'}</td>
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
      <EditCountry
        isOpen={!!editId}
        id={editId}
        onClose={() => setEditId(null)}
        onSuccess={fetchCountries}
      />
      <ConfirmationModal
        isOpen={showDeleteModal}
        title="Delete Country"
        message={`Are you sure you want to delete "${countryToDelete?.name}"?`}
        onConfirm={handleConfirmDelete}
        onCancel={() => { setShowDeleteModal(false); setCountryToDelete(null); }}
      />
    </>
  );
};

export default CountriesList;
