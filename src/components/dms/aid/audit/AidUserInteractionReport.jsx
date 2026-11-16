import React, { useCallback, useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { FiDownload, FiX } from 'react-icons/fi';
import axiosInstance from '../../../../utils/axios';
import { useAuth } from '../../../../context/AuthContext';
import { withAidProgramApiFilter } from '../../../../utils/permissions';
import { formatAuditActor, formatAuditValue } from '../../../common/audit/auditHistoryLabels';
import {
  formatAidRequestType,
  formatAidStatus,
} from '../aidConstants';
import {
  AID_AUDIT_ACTION_LABELS,
  AID_AUDIT_SOURCE_LABELS,
  aidAuditFieldLabel,
} from './aidAuditLabels';
import { formatAidUserLabel } from '../shared/AidUserAssignField';

const AidUserInteractionReport = ({
  open = false,
  user = null,
  filters = {},
  onClose,
}) => {
  const { permissions, user: authUser } = useAuth();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [payload, setPayload] = useState(null);
  const [page, setPage] = useState(1);

  const load = useCallback(
    async (pageNum = 1) => {
      if (!open || !user?.id) return;
      setLoading(true);
      setError('');
      try {
        const res = await axiosInstance.get('/aid/audit/user-interactions', {
          params: withAidProgramApiFilter(
            {
              user_id: user.id,
              page: pageNum,
              pageSize: 50,
              search: filters.search || undefined,
              status: filters.status || undefined,
              stage: filters.stage || undefined,
              requested_aid_type: filters.requested_aid_type || undefined,
              district: filters.district || undefined,
              date: filters.date || undefined,
              start_date: filters.start_date || undefined,
              end_date: filters.end_date || undefined,
            },
            authUser,
            permissions,
          ),
        });
        setPayload(res.data || null);
        setPage(pageNum);
      } catch (err) {
        setPayload(null);
        setError(
          err.response?.data?.message ||
            err.message ||
            'Failed to load interaction report',
        );
      } finally {
        setLoading(false);
      }
    },
    [open, user?.id, filters, authUser, permissions],
  );

  useEffect(() => {
    if (!open) return;
    load(1);
  }, [open, load]);

  if (!open || !user) return null;

  const rows = payload?.data || [];
  const summary = payload?.summary || {};
  const totalPages = payload?.totalPages || 1;
  const reportUser = payload?.user || user;
  const actionCounts = summary.action_counts || {};

  const exportCsv = () => {
    const header = [
      'When',
      'Application',
      'Beneficiary',
      'Program',
      'Status',
      'Action',
      'Source',
      'Field',
      'Previous',
      'Updated',
    ];
    const out = [header];
    rows.forEach((entry) => {
      const when = entry.created_at
        ? new Date(entry.created_at).toISOString()
        : '';
      const appNo = entry.application_no || `#${entry.application_id || ''}`;
      const beneficiary = entry.beneficiary?.full_name || '';
      const program = formatAidRequestType(entry.requested_aid_type);
      const status = formatAidStatus(entry.application_status);
      const action = AID_AUDIT_ACTION_LABELS[entry.action] || entry.action;
      const source = AID_AUDIT_SOURCE_LABELS[entry.source] || entry.source || '';
      const changes = Array.isArray(entry.changes) ? entry.changes : [];
      if (!changes.length) {
        out.push([
          when,
          appNo,
          beneficiary,
          program,
          status,
          action,
          source,
          '',
          '',
          '',
        ]);
        return;
      }
      changes.forEach((ch) => {
        out.push([
          when,
          appNo,
          beneficiary,
          program,
          status,
          action,
          source,
          aidAuditFieldLabel(ch.field),
          formatAuditValue(ch.old_value),
          formatAuditValue(ch.new_value),
        ]);
      });
    });
    const csv = out
      .map((r) =>
        r
          .map((cell) => {
            const s = String(cell ?? '');
            if (/[",\n]/.test(s)) return `"${s.replace(/"/g, '""')}"`;
            return s;
          })
          .join(','),
      )
      .join('\n');
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `aid-user-interaction-${user.id}-${Date.now()}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="aid-rec-modal aid-audit-report-modal" role="dialog" aria-modal="true">
      <div className="aid-rec-modal__backdrop" onClick={loading ? undefined : onClose} />
      <div className="aid-rec-modal__panel aid-audit-report-modal__panel">
        <header className="aid-rec-modal__head">
          <div>
            <h4>Complete interaction report</h4>
            <p className="aid-rec-modal__meta">
              {formatAidUserLabel(reportUser)}
              {reportUser?.email ? ` · ${reportUser.email}` : ''}
            </p>
          </div>
          <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
            <button
              type="button"
              className="secondary-btn"
              disabled={loading || !rows.length}
              onClick={exportCsv}
            >
              <FiDownload aria-hidden /> Export CSV
            </button>
            <button
              type="button"
              className="aid-rec-modal__x"
              onClick={onClose}
              disabled={loading}
              aria-label="Close"
            >
              <FiX />
            </button>
          </div>
        </header>

        <div className="aid-rec-modal__body aid-audit-report-modal__body">
          {error ? (
            <div className="status-message status-message--error">{error}</div>
          ) : null}

          <div className="aid-audit-report-modal__kpis">
            <div>
              <span>Total events</span>
              <strong>{summary.total_events ?? (loading ? '…' : 0)}</strong>
            </div>
            <div>
              <span>Applications touched</span>
              <strong>
                {summary.applications_touched ?? (loading ? '…' : 0)}
              </strong>
            </div>
            <div>
              <span>Action types</span>
              <strong>
                {Object.keys(actionCounts).length || (loading ? '…' : 0)}
              </strong>
            </div>
          </div>

          {Object.keys(actionCounts).length > 0 ? (
            <div className="aid-audit-report-modal__actions-summary">
              {Object.entries(actionCounts)
                .sort((a, b) => b[1] - a[1])
                .map(([action, count]) => (
                  <span key={action} className="aid-status-pill aid-status-pill--info">
                    {AID_AUDIT_ACTION_LABELS[action] || action}: {count}
                  </span>
                ))}
            </div>
          ) : null}

          {loading && !rows.length ? (
            <p className="aid-section-hint">Loading interaction report…</p>
          ) : !rows.length ? (
            <p className="aid-section-hint">
              No interactions found for this user with the current filters.
            </p>
          ) : (
            <div className="table-responsive">
              <table className="data-table">
                <thead>
                  <tr>
                    <th>When</th>
                    <th>Application</th>
                    <th>Action</th>
                    <th>Changes</th>
                  </tr>
                </thead>
                <tbody>
                  {rows.map((entry) => (
                    <tr key={entry.id}>
                      <td>
                        {entry.created_at
                          ? new Date(entry.created_at).toLocaleString()
                          : '—'}
                        <div style={{ fontSize: 12, color: '#64748b' }}>
                          {AID_AUDIT_SOURCE_LABELS[entry.source] ||
                            entry.source ||
                            '—'}
                        </div>
                      </td>
                      <td>
                        {entry.application_id ? (
                          <Link
                            to={`/dms/aid/audit/applications/${entry.application_id}`}
                          >
                            {entry.application_no || `#${entry.application_id}`}
                          </Link>
                        ) : (
                          entry.application_no || '—'
                        )}
                        <div style={{ fontSize: 12, color: '#64748b' }}>
                          {entry.beneficiary?.full_name || '—'}
                          {entry.requested_aid_type
                            ? ` · ${formatAidRequestType(entry.requested_aid_type)}`
                            : ''}
                        </div>
                      </td>
                      <td>
                        {AID_AUDIT_ACTION_LABELS[entry.action] || entry.action}
                        {entry.application_status ? (
                          <div style={{ fontSize: 12, color: '#64748b' }}>
                            App: {formatAidStatus(entry.application_status)}
                          </div>
                        ) : null}
                      </td>
                      <td>
                        {Array.isArray(entry.changes) && entry.changes.length ? (
                          <ul className="aid-audit-report-modal__changes">
                            {entry.changes.map((ch, idx) => (
                              <li key={`${entry.id}-${ch.field}-${idx}`}>
                                <strong>{aidAuditFieldLabel(ch.field)}:</strong>{' '}
                                <span className="audit-timeline__old">
                                  {formatAuditValue(ch.old_value)}
                                </span>
                                {' → '}
                                <span className="audit-timeline__new">
                                  {formatAuditValue(ch.new_value)}
                                </span>
                              </li>
                            ))}
                          </ul>
                        ) : (
                          '—'
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {totalPages > 1 ? (
            <div className="aid-audit-report-modal__pager">
              <button
                type="button"
                className="secondary-btn"
                disabled={loading || page <= 1}
                onClick={() => load(page - 1)}
              >
                Previous
              </button>
              <span>
                Page {page} of {totalPages}
              </span>
              <button
                type="button"
                className="secondary-btn"
                disabled={loading || page >= totalPages}
                onClick={() => load(page + 1)}
              >
                Next
              </button>
            </div>
          ) : null}

          <p className="aid-section-hint" style={{ marginTop: '0.75rem' }}>
            Actor: {formatAuditActor(reportUser)}. Report uses the current
            search, status/stage, program, district, and date filters.
          </p>
        </div>
      </div>
    </div>
  );
};

export default AidUserInteractionReport;
