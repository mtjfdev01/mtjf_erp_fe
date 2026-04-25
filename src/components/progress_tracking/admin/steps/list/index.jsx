import React, { useEffect, useMemo, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import axiosInstance from '../../../../../utils/axios';
import Navbar from '../../../../Navbar';
import PageHeader from '../../../../common/PageHeader';
import ActionMenu from '../../../../common/ActionMenu';
import { FiEye, FiList } from 'react-icons/fi';

const StepsList = () => {
  const { trackerId } = useParams();
  const navigate = useNavigate();
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const run = async () => {
      setLoading(true);
      setError('');
      try {
        const res = await axiosInstance.get(`/progress/trackers/${trackerId}/steps`);
        if (res.data?.success) setRows(res.data.data || []);
        else setError(res.data?.message || 'Failed to load steps');
      } catch (e) {
        setError(e.response?.data?.message || 'Failed to load steps');
      } finally {
        setLoading(false);
      }
    };
    if (trackerId) run();
  }, [trackerId]);

  const actionsFor = (s) => [
    {
      icon: <FiEye />,
      label: 'View',
      color: '#4CAF50',
      onClick: () => navigate(`/progress/trackers/${trackerId}/steps/${s.id}`),
      visible: true,
    },
  ];

  const evidenceCount = useMemo(
    () => rows.reduce((sum, s) => sum + ((s.evidence || []).length || 0), 0),
    [rows],
  );

  if (loading) {
    return (
      <>
        <Navbar />
        <div className="list-wrapper">
          <PageHeader title="Tracker Steps" showBackButton={true} backPath={`/progress/trackers/${trackerId}`} />
          <div className="loading">Loading...</div>
        </div>
      </>
    );
  }

  return (
    <>
      <Navbar />
      <div className="list-wrapper">
        <PageHeader title="Tracker Steps" showBackButton={true} backPath={`/progress/trackers/${trackerId}`} />
        <div className="list-content">
          {error && <div className="status-message status-message--error">{error}</div>}

          <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap', marginBottom: 12 }}>
            <div className="status-message" style={{ display: 'inline-flex', alignItems: 'center', gap: 8 }}>
              <FiList /> Total steps: {rows.length} • Evidence: {evidenceCount}
            </div>
          </div>

          <div className="table-container">
            <table className="data-table">
              <thead>
                <tr>
                  <th>ID</th>
                  <th>Order</th>
                  <th>Title</th>
                  <th>Status</th>
                  <th className="hide-on-mobile">Donor Visible</th>
                  <th className="hide-on-mobile">Evidence</th>
                  <th className="table-actions">Actions</th>
                </tr>
              </thead>
              <tbody>
                {rows.map((s) => (
                  <tr key={s.id}>
                    <td>{s.id}</td>
                    <td>{s.step_order}</td>
                    <td>{s.title}</td>
                    <td>{s.status}</td>
                    <td className="hide-on-mobile">{s.donor_visible ? 'Yes' : 'No'}</td>
                    <td className="hide-on-mobile">{(s.evidence || []).length}</td>
                    <td className="table-actions">
                      <ActionMenu actions={actionsFor(s)} />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {rows.length === 0 && (
            <div className="empty-state" style={{ padding: 20 }}>
              No steps found.
            </div>
          )}
        </div>
      </div>
    </>
  );
};

export default StepsList;

