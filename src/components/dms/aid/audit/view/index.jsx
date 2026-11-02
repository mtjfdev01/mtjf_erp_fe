import React, { useCallback, useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import axiosInstance from '../../../../../utils/axios';
import { useAuth } from '../../../../../context/AuthContext';
import { hasAidPermission, isSuperAdmin } from '../../../../../utils/permissions';
import Navbar from '../../../../Navbar';
import PageHeader from '../../../../common/PageHeader';
import {
  formatAidStatus,
  formatAidRequestType,
} from '../../aidConstants';
import AidChangeHistory from '../AidChangeHistory';
import '../../aid.css';

const AidAuditView = () => {
  const { id } = useParams();
  const { permissions } = useAuth();

  const canView =
    isSuperAdmin(permissions) ||
    hasAidPermission(permissions, 'aid_audit', 'view') ||
    hasAidPermission(permissions, 'aid_audit', 'list_view');

  const [summary, setSummary] = useState(null);
  const [entries, setEntries] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const load = useCallback(async () => {
    if (!canView || !id) {
      setLoading(false);
      return;
    }
    setLoading(true);
    setError('');
    try {
      const [sumRes, histRes] = await Promise.all([
        axiosInstance.get(`/aid/audit/applications/${id}`),
        axiosInstance.get(`/aid/audit/applications/${id}/history`),
      ]);
      setSummary(sumRes.data?.data || null);
      setEntries(histRes.data?.data || []);
    } catch (err) {
      setError(
        err.response?.data?.message || err.message || 'Failed to load audit',
      );
      setSummary(null);
      setEntries([]);
    } finally {
      setLoading(false);
    }
  }, [canView, id]);

  useEffect(() => {
    load();
  }, [load]);

  if (!canView) {
    return (
      <>
        <Navbar />
        <div className="page-container">
          <PageHeader title="Aid Audit History" />
          <p className="aid-section-hint">
            You do not have permission to view Aid audit logs.
          </p>
        </div>
      </>
    );
  }

  return (
    <>
      <Navbar />
      <div className="page-container">
        <PageHeader
          title={
            summary?.application_no
              ? `Audit · ${summary.application_no}`
              : `Audit · #${id}`
          }
          backPath="/dms/aid/audit/list"
          rightElement={
            <Link
              to={`/dms/aid/applications/view/${id}`}
              className="secondary-btn"
            >
              Open application
            </Link>
          }
          onRefresh={load}
        />

        {error ? (
          <div className="status-message status-message--error">{error}</div>
        ) : null}

        {summary ? (
          <section className="aid-section" style={{ marginBottom: '1rem' }}>
            <div
              className="aid-preview__grid aid-preview__grid--3"
              style={{ border: '1px solid #e2e8f0' }}
            >
              <div className="aid-preview__cell">
                <span className="aid-preview__label">Status</span>
                <span className="aid-preview__value">
                  {formatAidStatus(summary.status)}
                </span>
              </div>
              <div className="aid-preview__cell">
                <span className="aid-preview__label">Beneficiary</span>
                <span className="aid-preview__value">
                  {summary.beneficiary?.full_name || '—'}
                  {summary.beneficiary?.cnic
                    ? ` · ${summary.beneficiary.cnic}`
                    : ''}
                </span>
              </div>
              <div className="aid-preview__cell">
                <span className="aid-preview__label">Aid type</span>
                <span className="aid-preview__value">
                  {formatAidRequestType(summary.requested_aid_type)}
                </span>
              </div>
            </div>
          </section>
        ) : null}

        <section className="aid-section">
          <AidChangeHistory
            entries={entries}
            loading={loading}
            emptyMessage={
              loading
                ? 'Loading…'
                : 'No audit events recorded yet for this application. New changes will appear here going forward.'
            }
          />
        </section>
      </div>
    </>
  );
};

export default AidAuditView;
