import React, { useCallback, useEffect, useState } from 'react';
import axiosInstance from '../../../../utils/axios';
import AuditHistoryTimeline from '../../../common/audit/AuditHistoryTimeline';
import {
  DONATION_BOX_AUDIT_ACTION_LABELS,
  DONATION_BOX_AUDIT_SOURCE_LABELS,
  DONATION_BOX_AUDIT_FIELD_LABELS,
  formatAuditActor,
  formatAuditValue,
} from '../../../common/audit/auditHistoryLabels';

const DonationBoxAuditHistory = ({ donationBoxId, refreshKey = 0 }) => {
  const [entries, setEntries] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const fetchHistory = useCallback(async () => {
    if (!donationBoxId) return;
    setLoading(true);
    setError('');
    try {
      const res = await axiosInstance.get(
        `/donation-box/${donationBoxId}/audit-history`,
      );
      if (res.data?.success) {
        setEntries(res.data.data || []);
      } else {
        setError(res.data?.message || 'Failed to load change history');
        setEntries([]);
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to load change history');
      setEntries([]);
    } finally {
      setLoading(false);
    }
  }, [donationBoxId]);

  useEffect(() => {
    fetchHistory();
  }, [fetchHistory, refreshKey]);

  return (
    <AuditHistoryTimeline
      entries={entries}
      loading={loading}
      error={error}
      emptyMessage="No staff changes recorded yet. Edits to this donation box will appear here."
      getActionLabel={(a) => DONATION_BOX_AUDIT_ACTION_LABELS[a] || a}
      getSourceLabel={(s) => DONATION_BOX_AUDIT_SOURCE_LABELS[s] || s}
      getFieldLabel={(f) =>
        DONATION_BOX_AUDIT_FIELD_LABELS[f] || f.replace(/_/g, ' ')
      }
      formatActor={formatAuditActor}
      formatValue={formatAuditValue}
    />
  );
};

export default DonationBoxAuditHistory;
