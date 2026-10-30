import React, { useEffect, useMemo, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import {
  FiAlertTriangle,
  FiCalendar,
  FiCheckCircle,
  FiEdit2,
  FiEye,
  FiPackage,
} from 'react-icons/fi';
import axiosInstance from '../../../../../utils/axios';
import { useAuth } from '../../../../../context/AuthContext';
import {
  canViewModule,
  hasAidPermission,
} from '../../../../../utils/permissions';
import Navbar from '../../../../Navbar';
import PageHeader from '../../../../common/PageHeader';
import Pagination from '../../../../common/Pagination';
import FormInput from '../../../../common/FormInput';
import FormSelect from '../../../../common/FormSelect';
import {
  AID_REQUEST_TYPES,
  formatAidProgramLabel,
  formatAidRequestType,
} from '../../aidConstants';
import useListAutoRefresh from '../../../../../hooks/useListAutoRefresh';
import '../../aid.css';

const emptyFilters = {
  search: '',
  requested_aid_type: '',
  office_name: '',
  fund_source: '',
  assigned_to_user_id: '',
  status: '',
};

const STAGE_CARDS = [
  {
    id: 'overdue',
    label: 'Overdue',
    hint: 'Past due date',
    tone: 'overdue',
    status: 'overdue',
    Icon: FiAlertTriangle,
  },
  {
    id: 'due_this_week',
    label: 'Due this week',
    hint: 'Needs delivery soon',
    tone: 'due',
    status: 'due_this_week',
    Icon: FiCalendar,
  },
  {
    id: 'partially_delivered',
    label: 'Partially delivered',
    hint: 'Installments in progress',
    tone: 'partial',
    status: 'partially_delivered',
    Icon: FiPackage,
  },
  {
    id: 'awaiting_verification',
    label: 'Awaiting verification',
    hint: 'Proof under review',
    tone: 'verify',
    status: 'awaiting_verification',
    Icon: FiCheckCircle,
  },
];

const formatMoney = (v) => {
  const n = Number(v);
  if (!Number.isFinite(n)) return '—';
  return n.toLocaleString('en-PK');
};

const formatDue = (iso) => {
  if (!iso) return '—';
  try {
    return new Date(iso).toLocaleDateString('en-GB', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
    });
  } catch {
    return iso;
  }
};

const statusLabel = (s) => {
  switch (s) {
    case 'overdue':
      return 'Overdue';
    case 'due':
      return 'Due this week';
    case 'awaiting_verification':
      return 'Awaiting verification';
    case 'on_hold':
      return 'On hold';
    case 'delivered':
      return 'Delivered';
    case 'queued':
      return 'Queued';
    default:
      return s || '—';
  }
};

const statusTone = (s) => {
  switch (s) {
    case 'overdue':
      return 'overdue';
    case 'due':
      return 'due';
    case 'awaiting_verification':
      return 'verify';
    case 'on_hold':
      return 'hold';
    case 'delivered':
      return 'done';
    default:
      return 'queued';
  }
};

/**
 * Disbursements queue — approved cases waiting for delivery / verification.
 */
const AidDisbursementsList = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { permissions } = useAuth();

  const isStaffElevated =
    !!permissions?.super_admin ||
    !!permissions?.program_manager ||
    !!permissions?.fund_raising_manager;

  const canList =
    canViewModule(permissions, 'program', 'aid_disbursements') ||
    hasAidPermission(permissions, 'aid_disbursements', 'list_view') ||
    hasAidPermission(permissions, 'aid_disbursements', 'deliver') ||
    hasAidPermission(permissions, 'aid_applications', 'deliver') ||
    isStaffElevated;

  const canDeliver =
    hasAidPermission(permissions, 'aid_disbursements', 'deliver') ||
    hasAidPermission(permissions, 'aid_applications', 'deliver') ||
    isStaffElevated;

  const appIdFromUrl = searchParams.get('application_id') || '';

  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(20);
  const [totalItems, setTotalItems] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [stageCounts, setStageCounts] = useState({});
  const [offices, setOffices] = useState([]);
  const [fundSources, setFundSources] = useState([]);
  const [tempFilters, setTempFilters] = useState({ ...emptyFilters });
  const [appliedFilters, setAppliedFilters] = useState({ ...emptyFilters });

  const applyFilters = (next) => {
    setTempFilters(next);
    setAppliedFilters(next);
    setCurrentPage(1);
  };

  const setStage = (statusId) => {
    const next = {
      ...appliedFilters,
      status: appliedFilters.status === statusId ? '' : statusId,
    };
    applyFilters(next);
  };

  const fetchRows = async () => {
    if (!canList) {
      setError('You do not have permission to view disbursements.');
      setLoading(false);
      return;
    }
    try {
      setLoading(true);
      setError('');
      const res = await axiosInstance.get('/aid/disbursements', {
        params: {
          search: appliedFilters.search || undefined,
          requested_aid_type: appliedFilters.requested_aid_type || undefined,
          office_name: appliedFilters.office_name || undefined,
          fund_source: appliedFilters.fund_source || undefined,
          assigned_to_user_id:
            appliedFilters.assigned_to_user_id || undefined,
          status: appliedFilters.status || undefined,
          application_id: appIdFromUrl || undefined,
          page: currentPage,
          pageSize,
          sortField: 'due_at',
          sortOrder: 'ASC',
        },
      });
      setRows(res.data?.data || []);
      setTotalItems(res.data?.total || 0);
      setTotalPages(res.data?.totalPages || 1);
      setStageCounts(res.data?.stage_counts || {});
      setOffices(res.data?.filter_options?.offices || []);
      setFundSources(res.data?.filter_options?.fund_sources || []);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to load disbursements');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRows();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentPage, pageSize, appliedFilters, appIdFromUrl]);

  useListAutoRefresh(
    () => fetchRows(),
    [currentPage, pageSize, appliedFilters, appIdFromUrl],
    ['aid'],
  );

  const programOptions = useMemo(
    () => [{ value: '', label: 'All programs' }, ...AID_REQUEST_TYPES],
    [],
  );
  const officeOptions = useMemo(
    () => [
      { value: '', label: 'All offices' },
      ...offices.map((o) => ({ value: o, label: o })),
    ],
    [offices],
  );
  const fundOptions = useMemo(
    () => [
      { value: '', label: 'All' },
      ...fundSources.map((f) => ({ value: f, label: f })),
      ...(fundSources.includes('Zakat')
        ? []
        : [{ value: 'Zakat', label: 'Zakat' }]),
    ],
    [fundSources],
  );
  const officerOptions = [
    { value: '', label: 'All officers' },
    { value: 'me', label: 'Assigned to me' },
  ];

  const openRow = (row) => {
    const canRecord =
      canDeliver &&
      row.status !== 'delivered' &&
      row.status !== 'awaiting_verification' &&
      row.status !== 'on_hold';
    navigate(
      canRecord
        ? `/dms/aid/disbursements/record/${row.id}`
        : `/dms/aid/disbursements/record/${row.id}?view=1`,
    );
  };

  return (
    <>
      <Navbar />
      <div className="list-wrapper aid-list aid-disb-list">
        <PageHeader
          title="Disbursements"
          backPath="/dms"
          showAdd={false}
          onRefresh={fetchRows}
        />
        <div className="list-content">
          <p className="aid-disb-list__subtitle">
            Approved cases waiting for delivery, verification or closure.
          </p>

          {error && <div className="error-message">{error}</div>}

          <div className="aid-disb-stages" role="toolbar" aria-label="Queue">
            {STAGE_CARDS.map((s) => {
              const active = appliedFilters.status === s.status;
              const count = stageCounts[s.id] ?? 0;
              const Icon = s.Icon;
              return (
                <button
                  key={s.id}
                  type="button"
                  className={`aid-disb-stage aid-disb-stage--${s.tone}${
                    active ? ' aid-disb-stage--active' : ''
                  }`}
                  onClick={() => setStage(s.status)}
                >
                  <span className="aid-disb-stage__top">
                    <span className="aid-disb-stage__icon" aria-hidden>
                      <Icon size={18} />
                    </span>
                    <span className="aid-disb-stage__label">{s.label}</span>
                  </span>
                  <span className="aid-disb-stage__value">{count}</span>
                  <span className="aid-disb-stage__hint">{s.hint}</span>
                </button>
              );
            })}
          </div>

          <div className="aid-disb-filters">
            <div className="aid-disb-filters__field aid-disb-filters__field--search">
              <FormInput
                label="Search"
                value={tempFilters.search}
                onChange={(e) =>
                  setTempFilters((p) => ({ ...p, search: e.target.value }))
                }
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault();
                    applyFilters({ ...tempFilters });
                  }
                }}
                placeholder="Case ID, beneficiary, CNIC"
              />
            </div>
            <div className="aid-disb-filters__field">
              <FormSelect
                label="Program"
                value={tempFilters.requested_aid_type}
                onChange={(e) =>
                  setTempFilters((p) => ({
                    ...p,
                    requested_aid_type: e.target.value,
                  }))
                }
                options={programOptions}
              />
            </div>
            <div className="aid-disb-filters__field">
              <FormSelect
                label="Office"
                value={tempFilters.office_name}
                onChange={(e) =>
                  setTempFilters((p) => ({
                    ...p,
                    office_name: e.target.value,
                  }))
                }
                options={officeOptions}
              />
            </div>
            <div className="aid-disb-filters__field">
              <FormSelect
                label="Fund source"
                value={tempFilters.fund_source}
                onChange={(e) =>
                  setTempFilters((p) => ({
                    ...p,
                    fund_source: e.target.value,
                  }))
                }
                options={fundOptions}
              />
            </div>
            <div className="aid-disb-filters__field">
              <FormSelect
                label="Officer"
                value={tempFilters.assigned_to_user_id}
                onChange={(e) =>
                  setTempFilters((p) => ({
                    ...p,
                    assigned_to_user_id: e.target.value,
                  }))
                }
                options={officerOptions}
              />
            </div>
            <div className="aid-disb-filters__actions">
              <button
                type="button"
                className="primary-btn"
                onClick={() => applyFilters({ ...tempFilters })}
              >
                Search
              </button>
              <button
                type="button"
                className="secondary-btn"
                onClick={() => applyFilters({ ...emptyFilters })}
              >
                Clear
              </button>
            </div>
          </div>

          <div className="table-container">
            <table className="data-table aid-disb-table">
              <thead>
                <tr>
                  <th>Case</th>
                  <th>Beneficiary</th>
                  <th>Program</th>
                  <th>Installment</th>
                  <th>Due</th>
                  <th>Value (PKR)</th>
                  <th>Progress</th>
                  <th>Status</th>
                  <th />
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr>
                    <td colSpan={9}>Loading…</td>
                  </tr>
                ) : rows.length === 0 ? (
                  <tr>
                    <td colSpan={9}>No disbursements found.</td>
                  </tr>
                ) : (
                  rows.map((row) => {
                    const canRecord =
                      canDeliver &&
                      row.status !== 'delivered' &&
                      row.status !== 'awaiting_verification' &&
                      row.status !== 'on_hold';
                    return (
                      <tr key={row.id}>
                        <td>
                          <strong className="aid-disb-table__case">
                            {row.application_no || `APP-${row.application_id}`}
                          </strong>
                        </td>
                        <td>{row.beneficiary_name || '—'}</td>
                        <td>
                          <div>
                            {formatAidRequestType(row.requested_aid_type)}
                          </div>
                          {row.aid_program ? (
                            <div className="aid-disb-table__sub">
                              {formatAidProgramLabel(row.aid_program)}
                            </div>
                          ) : null}
                        </td>
                        <td>{row.installment_label}</td>
                        <td>{formatDue(row.due_at)}</td>
                        <td>{formatMoney(row.planned_amount)}</td>
                        <td>
                          <div
                            className="aid-disb-progress"
                            title={`${row.progress_pct || 0}%`}
                          >
                            <span className="aid-disb-progress__track">
                              <i
                                style={{
                                  width: `${Math.min(
                                    100,
                                    Number(row.progress_pct) || 0,
                                  )}%`,
                                }}
                              />
                            </span>
                          </div>
                        </td>
                        <td>
                          <span
                            className={`aid-disb-pill aid-disb-pill--${statusTone(
                              row.status,
                            )}`}
                          >
                            {statusLabel(row.status)}
                          </span>
                        </td>
                        <td>
                          <div className="aid-icon-actions">
                            <button
                              type="button"
                              className={`aid-icon-btn ${
                                canRecord
                                  ? 'aid-icon-btn--edit'
                                  : 'aid-icon-btn--view'
                              }`}
                              title={canRecord ? 'Record' : 'View'}
                              aria-label={canRecord ? 'Record' : 'View'}
                              onClick={() => openRow(row)}
                            >
                              {canRecord ? <FiEdit2 /> : <FiEye />}
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>

          <Pagination
            currentPage={currentPage}
            totalPages={totalPages}
            totalItems={totalItems}
            pageSize={pageSize}
            onPageChange={setCurrentPage}
            onPageSizeChange={(size) => {
              setPageSize(size);
              setCurrentPage(1);
            }}
          />
        </div>
      </div>
    </>
  );
};

export default AidDisbursementsList;
