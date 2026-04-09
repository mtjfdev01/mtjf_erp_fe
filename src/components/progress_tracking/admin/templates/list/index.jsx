import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import axiosInstance from '../../../../../utils/axios';
import Navbar from '../../../../Navbar';
import PageHeader from '../../../../common/PageHeader';
import ActionMenu from '../../../../common/ActionMenu';

const TemplatesList = () => {
  const navigate = useNavigate();
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const fetchData = async () => {
    setLoading(true);
    setError('');
    try {
      const res = await axiosInstance.get('/progress/workflow-templates');
      if (res.data?.success) {
        setItems(res.data.data || []);
      } else {
        setError(res.data?.message || 'Failed to load templates');
      }
    } catch (e) {
      setError(e.response?.data?.message || 'Failed to load templates');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const actionsFor = (t) => [
    {
      label: 'View/Edit',
      visible: true,
      onClick: () => navigate(`/progress/templates/${t.id}`),
    },
  ];

  if (loading) {
    return (
      <>
        <Navbar />
        <div className="list-wrapper">
          <PageHeader title="Workflow Templates" showBackButton={false} />
          <div className="loading">Loading...</div>
        </div>
      </>
    );
  }

  return (
    <>
      <Navbar />
      <div className="list-wrapper">
        <PageHeader title="Workflow Templates" showBackButton={false} />
        <div className="list-content">
          {error && <div className="status-message status-message--error">{error}</div>}
          <div className="table-container">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Name</th>
                  <th>Code</th>
                  <th className="hide-on-mobile">Active</th>
                  <th className="table-actions">Actions</th>
                </tr>
              </thead>
              <tbody>
                {items.map((t) => (
                  <tr key={t.id}>
                    <td>{t.name}</td>
                    <td>{t.code}</td>
                    <td className="hide-on-mobile">{t.is_active ? 'Yes' : 'No'}</td>
                    <td className="table-actions">
                      <ActionMenu actions={actionsFor(t)} />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          {items.length === 0 && (
            <div className="empty-state" style={{ padding: '20px' }}>
              No templates found.
            </div>
          )}
        </div>
      </div>
    </>
  );
};

export default TemplatesList;

