import React, { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import axiosInstance from '../../../../../utils/axios';
import Navbar from '../../../../Navbar';
import PageHeader from '../../../../common/PageHeader';
import { formatFiltersSummary } from '../../communicationAudience';

const formatDateTime = (value) => {
  if (!value) return '—';
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return '—';
  return d.toLocaleString();
};

const CommunicationBatchView = () => {
  const { batchId } = useParams();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [batch, setBatch] = useState(null);
  const [logs, setLogs] = useState([]);

  useEffect(() => {
    fetchBatch();
  }, [batchId]);

  const fetchBatch = async () => {
    try {
      setLoading(true);
      const res = await axiosInstance.get(
        `/email-templates/communication-batches/${batchId}`,
      );
      if (res.data.success) {
        setBatch(res.data.data.batch);
        setLogs(res.data.data.logs || []);
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to load batch details');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <>
        <Navbar />
        <div className="form-content"><div className="loading">Loading...</div></div>
      </>
    );
  }

  return (
    <>
      <Navbar />
      <div className="form-content">
        <PageHeader
          title="Send Batch Details"
          onBack={() => navigate('/dms/email_templates/batches')}
        />

        {error && <div className="error-message">{error}</div>}

        {batch && (
          <div className="form-card card" style={{ marginBottom: 16 }}>
            <h3 style={{ marginTop: 0 }}>Summary</h3>
            <p><strong>Template:</strong> {batch.template_name || batch.template?.name}</p>
            <p><strong>Channel:</strong> {batch.channel?.toUpperCase()}</p>
            <p><strong>Selection mode:</strong> {batch.selection_mode}</p>
            <p><strong>Criteria:</strong>{' '}
              {batch.selection_mode === 'filters'
                ? formatFiltersSummary(batch.filters)
                : `Manual selection (${batch.donor_ids?.length || 0} donor IDs saved)`}
            </p>
            {batch.selection_mode === 'filters' && batch.filters && (
              <pre
                style={{
                  background: '#f8f9fa',
                  padding: 12,
                  borderRadius: 8,
                  overflow: 'auto',
                  fontSize: 12,
                }}
              >
                {JSON.stringify(batch.filters, null, 2)}
              </pre>
            )}
            <p><strong>Matched:</strong> {batch.matched_count}</p>
            <p><strong>Sent:</strong> {batch.sent_count}</p>
            <p><strong>Scheduled:</strong> {batch.scheduled_count}</p>
            <p><strong>Failed:</strong> {batch.failed_count}</p>
            <p><strong>Status:</strong> {batch.batch_status}</p>
            <p><strong>Sent at:</strong> {formatDateTime(batch.sent_at || batch.created_at)}</p>
            <p><strong>Sent by:</strong> {batch.sent_by?.email || batch.sent_by?.name || '—'}</p>
          </div>
        )}

        <div className="table-container card">
          <h3>Donor delivery log</h3>
          <table className="custom-table">
            <thead>
              <tr>
                <th>Donor</th>
                <th>Recipient</th>
                <th>Status</th>
                <th>Sent at</th>
                <th>Error</th>
              </tr>
            </thead>
            <tbody>
              {logs.length ? (
                logs.map((log) => (
                  <tr key={log.id}>
                    <td>{log.donor?.name || log.donor_id || '—'}</td>
                    <td>{log.recipient || '—'}</td>
                    <td>{log.delivery_status}</td>
                    <td>{formatDateTime(log.sent_at || log.scheduled_at)}</td>
                    <td>{log.error_message || '—'}</td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan="5" className="text-center">No delivery logs</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </>
  );
};

export default CommunicationBatchView;
