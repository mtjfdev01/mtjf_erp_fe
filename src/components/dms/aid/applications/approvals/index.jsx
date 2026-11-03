import React, { useEffect, useMemo, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { FiCheckCircle, FiDownload, FiEye } from 'react-icons/fi';
import { MdZoomIn } from 'react-icons/md';
import axiosInstance from '../../../../../utils/axios';
import { useAuth } from '../../../../../context/AuthContext';
import {
  canViewModule,
  hasAidPermission,
} from '../../../../../utils/permissions';
import Navbar from '../../../../Navbar';
import PageHeader from '../../../../common/PageHeader';
import Pagination from '../../../../common/Pagination';
import FormSelect from '../../../../common/FormSelect';
import DateFilter from '../../../../common/filters/DateFilter';
import DateRangeFilter from '../../../../common/filters/DateRangeFilter';
import {
  SearchFilter,
  DropdownFilter,
  SearchButton,
  ClearButton,
  CollapsibleFilters,
} from '../../../../common/filters';
import useFiltersPanel from '../../../../../hooks/useFiltersPanel';
import {
  AID_REQUEST_TYPES,
  aidStatusTone,
  formatAidStatus,
  formatAidRequestType,
  formatAidProgramLabel,
  formatExpectedAmount,
} from '../../aidConstants';
import {
  AID_RATION_REC_OPTIONS,
  normalizeRationOptions,
} from '../../shared/AidInvestigationPanel';
import AidRationRecommendationModal from '../../shared/AidRationRecommendationModal';
import '../../aid.css';
import '../../overview/overview.css';
import useListAutoRefresh from '../../../../../hooks/useListAutoRefresh';

const isRationApp = (row) =>
  String(row?.requested_aid_type || '').toLowerCase() === 'ration';

const formatRationRecLabel = (rec) => {
  const opts = normalizeRationOptions(rec?.ration_options);
  if (opts.length) {
    return opts
      .map(
        (v) =>
          AID_RATION_REC_OPTIONS.find((o) => o.value === v)?.label || v,
      )
      .join(', ');
  }
  return rec?.decision ? String(rec.decision).replace(/_/g, ' ') : '—';
};

const CEO_PENDING = 'ceo_approval_required';

const STATUS_FILTERS = [
  { value: '', label: 'All (not rejected)' },
  { value: CEO_PENDING, label: 'Awaiting CEO approval' },
  { value: 'successful', label: 'CEO approved' },
  { value: 'delivered', label: 'Delivered' },
];

const formatMoneyShort = (n) => {
  const v = Number(n) || 0;
  if (v >= 1_000_000) return `${(v / 1_000_000).toFixed(2)}M`;
  if (v >= 1_000) return `${(v / 1_000).toFixed(1)}K`;
  return String(Math.round(v));
};

const AidApprovalsList = () => {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const { permissions } = useAuth();
  const { filtersOpen, toggleFilters } = useFiltersPanel();

  const isStaffElevated =
    !!permissions?.super_admin ||
    !!permissions?.program_manager ||
    !!permissions?.fund_raising_manager;

  const canCeo =
    isStaffElevated ||
    hasAidPermission(permissions, 'aid_applications', 'ceo_approve');

  const canList =
    canViewModule(permissions, 'program', 'aid_applications') ||
    canCeo ||
    isStaffElevated;

  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(20);
  const [totalItems, setTotalItems] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [sortField, setSortField] = useState('verified_at');
  const [sortOrder, setSortOrder] = useState('DESC');
  const initialStatus = searchParams.get('status') || CEO_PENDING;
  const [tempFilters, setTempFilters] = useState({
    search: '',
    status: initialStatus,
  });
  const [appliedFilters, setAppliedFilters] = useState({
    search: '',
    status: initialStatus,
  });

  const [program, setProgram] = useState(
    searchParams.get('program') || 'all',
  );
  const [dateFilters, setDateFilters] = useState({
    date: searchParams.get('date') || '',
    start_date: searchParams.get('start_date') || '',
    end_date: searchParams.get('end_date') || '',
  });
  const [overview, setOverview] = useState(null);
  const [overviewLoading, setOverviewLoading] = useState(true);
  const [rationModalRow, setRationModalRow] = useState(null);
  const [rationBusy, setRationBusy] = useState(false);
  const [rationError, setRationError] = useState('');

  const programOptions = useMemo(
    () => [
      { value: 'all', label: 'All programs' },
      ...AID_REQUEST_TYPES.filter(
        (t) => !['cash', 'medical', 'other'].includes(t.value),
      ),
    ],
    [],
  );

  const handleDateFilterChange = (key, value) => {
    setDateFilters((prev) => {
      if (key === 'date') {
        return { date: value, start_date: '', end_date: '' };
      }
      return { ...prev, date: '', [key]: value };
    });
  };

  const handleSortChange = (field, order) => {
    setSortField(field);
    setSortOrder(order);
    setCurrentPage(1);
  };

  const sortOptions = [
    { value: 'verified_at', label: 'Verified Date' },
    { value: 'created_at', label: 'Created Date' },
    { value: 'updated_at', label: 'Updated Date' },
    { value: 'status', label: 'Status' },
    { value: 'application_no', label: 'Application Number' },
  ];

  const syncUrlParams = (next) => {
    const params = new URLSearchParams();
    if (next.status) params.set('status', next.status);
    if (next.program && next.program !== 'all') {
      params.set('program', next.program);
    }
    if (next.date) params.set('date', next.date);
    if (next.start_date) params.set('start_date', next.start_date);
    if (next.end_date) params.set('end_date', next.end_date);
    setSearchParams(params, { replace: true });
  };

  const applyFilters = (next) => {
    setTempFilters(next);
    setAppliedFilters(next);
    setCurrentPage(1);
    syncUrlParams({
      status: next.status,
      program,
      date: dateFilters.date,
      start_date: dateFilters.start_date,
      end_date: dateFilters.end_date,
    });
  };

  const fetchOverview = async () => {
    try {
      setOverviewLoading(true);
      const res = await axiosInstance.get('/aid/overview', {
        params: {
          date: dateFilters.date || undefined,
          start_date: dateFilters.start_date || undefined,
          end_date: dateFilters.end_date || undefined,
          program: program === 'all' ? undefined : program,
        },
      });
      setOverview(res.data?.data || null);
    } catch {
      setOverview(null);
    } finally {
      setOverviewLoading(false);
    }
  };

  const fetchRows = async () => {
    if (!canList) {
      setError('You do not have permission to view approvals.');
      setLoading(false);
      return;
    }
    try {
      setLoading(true);
      setError('');
      const res = await axiosInstance.get('/aid/applications', {
        params: {
          queue: 'approvals',
          search: appliedFilters.search || undefined,
          status: appliedFilters.status || undefined,
          requested_aid_type: program === 'all' ? undefined : program,
          page: currentPage,
          pageSize,
          sortField,
          sortOrder,
        },
      });
      setRows(res.data?.data || []);
      setTotalItems(res.data?.total || 0);
      setTotalPages(res.data?.totalPages || 1);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to load approvals');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOverview();
    syncUrlParams({
      status: appliedFilters.status,
      program,
      date: dateFilters.date,
      start_date: dateFilters.start_date,
      end_date: dateFilters.end_date,
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [dateFilters.date, dateFilters.start_date, dateFilters.end_date, program]);

  useEffect(() => {
    fetchRows();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentPage, pageSize, sortField, sortOrder, appliedFilters, program]);

  useListAutoRefresh(
    () => {
      fetchRows();
      fetchOverview();
    },
    [currentPage, pageSize, sortField, sortOrder, appliedFilters, program, dateFilters],
    ['aid'],
  );

  const openView = (id) => {
    navigate(`/dms/aid/applications/view/${id}?from=approvals`);
  };

  const openApprove = (row) => {
    if (isRationApp(row)) {
      setRationError('');
      setRationModalRow(row);
      return;
    }
    navigate(
      `/dms/aid/applications/view/${row.id}?from=approvals&action=approve`,
    );
  };

  const closeRationModal = () => {
    if (rationBusy) return;
    setRationModalRow(null);
    setRationError('');
  };

  const saveRationRecommendation = async (recommendation) => {
    if (!rationModalRow?.id) return;
    setRationBusy(true);
    setRationError('');
    try {
      await axiosInstance.patch(`/aid/applications/${rationModalRow.id}`, {
        investigation_recommendation: recommendation,
      });
      setRationModalRow(null);
      await fetchRows();
      await fetchOverview();
    } catch (err) {
      setRationError(
        err.response?.data?.message ||
          err.message ||
          'Failed to save recommendation',
      );
    } finally {
      setRationBusy(false);
    }
  };

  const approveRationRecommendation = async (recommendation) => {
    if (!rationModalRow?.id) return;
    setRationBusy(true);
    setRationError('');
    try {
      await axiosInstance.post(
        `/aid/applications/${rationModalRow.id}/ceo-decide`,
        {
          decision: 'approved',
          recommendation,
        },
      );
      setRationModalRow(null);
      await fetchRows();
      await fetchOverview();
    } catch (err) {
      setRationError(
        err.response?.data?.message ||
          err.message ||
          'Failed to approve application',
      );
    } finally {
      setRationBusy(false);
    }
  };

  const handleExport = () => window.print();

  const kpis = overview?.kpis || {};

  if (!canList) {
    return (
      <>
        <Navbar />
        <div className="form-content">
          <div className="error-message">
            {error || 'You do not have permission to view approvals.'}
          </div>
        </div>
      </>
    );
  }

  return (
    <>
      <Navbar />
      <div className="aid-welfare-overview aid-approvals-page">
        <PageHeader
          title="Aid Approvals"
          backPath="/dms/aid/applications/list"
          showAdd={false}
          showFilterToggle
          filtersOpen={filtersOpen}
          onFilterToggle={toggleFilters}
          onRefresh={() => {
            fetchRows();
            fetchOverview();
          }}
        />

        <div className="aid-wo-top">
          <div>
            <div className="aid-wo-crumb">Welfare › Approvals</div>
            <p className="aid-wo-sub">
              {overview?.filters?.range_label || '—'} ·{' '}
              {program === 'all'
                ? 'all programs'
                : formatAidRequestType(program)}
            </p>
          </div>
          <div className="aid-wo-filters">
            <DateFilter
              filterKey="date"
              label="Date"
              filters={dateFilters}
              onFilterChange={handleDateFilterChange}
            />
            <DateRangeFilter
              startKey="start_date"
              endKey="end_date"
              label="Date range"
              filters={dateFilters}
              onFilterChange={handleDateFilterChange}
            />
            <FormSelect
              label="Program"
              value={program}
              onChange={(e) => {
                setProgram(e.target.value);
                setCurrentPage(1);
              }}
              options={programOptions}
            />
            <button
              type="button"
              className="aid-wo-export"
              onClick={handleExport}
            >
              <FiDownload /> Export PDF
            </button>
          </div>
        </div>

        {overviewLoading && !overview ? (
          <div className="aid-wo-loading">Loading summary…</div>
        ) : null}

        <div className="aid-wo-kpis">
          <div className="aid-wo-kpi">
            <div className="aid-wo-kpi__label">Applications</div>
            <div className="aid-wo-kpi__value">{kpis.applications ?? '—'}</div>
            <div className="aid-wo-kpi__meta">
              {kpis.applications_delta_pct != null ? (
                <span
                  className={
                    kpis.applications_delta_pct >= 0
                      ? 'aid-wo-up'
                      : 'aid-wo-down'
                  }
                >
                  {kpis.applications_delta_pct >= 0 ? '↑' : '↓'}{' '}
                  {Math.abs(kpis.applications_delta_pct)}% vs prior
                </span>
              ) : (
                '—'
              )}
            </div>
          </div>
          <div className="aid-wo-kpi">
            <div className="aid-wo-kpi__label">Approved</div>
            <div className="aid-wo-kpi__value">{kpis.approved ?? '—'}</div>
            <div className="aid-wo-kpi__meta">
              {kpis.approved_of_decisions_pct != null
                ? `${kpis.approved_of_decisions_pct}% of final decisions`
                : '—'}
            </div>
          </div>
          <div className="aid-wo-kpi">
            <div className="aid-wo-kpi__label">Disbursed</div>
            <div className="aid-wo-kpi__value">
              {formatMoneyShort(kpis.disbursed)}
            </div>
            <div className="aid-wo-kpi__meta">
              PKR
              {kpis.budget_used_pct != null
                ? ` · ${kpis.budget_used_pct}% of ${formatMoneyShort(kpis.budget)} budget`
                : ''}
            </div>
          </div>
          <div className="aid-wo-kpi">
            <div className="aid-wo-kpi__label">Families supported</div>
            <div className="aid-wo-kpi__value">
              {(kpis.families_supported ?? 0).toLocaleString()}
            </div>
            <div className="aid-wo-kpi__meta">Active this period</div>
          </div>
          <div className="aid-wo-kpi">
            <div className="aid-wo-kpi__label">Intake → decision</div>
            <div className="aid-wo-kpi__value">
              {kpis.intake_to_decision_days != null
                ? `${kpis.intake_to_decision_days} d`
                : '—'}
            </div>
            <div
              className={`aid-wo-kpi__meta${
                kpis.intake_to_decision_days != null &&
                kpis.intake_to_decision_days > (kpis.intake_target_days || 10)
                  ? ' is-late'
                  : ''
              }`}
            >
              Target {kpis.intake_target_days || 10} days
            </div>
          </div>
          <div className="aid-wo-kpi">
            <div className="aid-wo-kpi__label">Avg vulnerability</div>
            <div className="aid-wo-kpi__value">
              {kpis.avg_vulnerability != null
                ? `${kpis.avg_vulnerability}%`
                : '—'}
            </div>
            <div className="aid-wo-kpi__meta">Of approved cases</div>
          </div>
        </div>

        <div className="list-content aid-approvals-list-content">
          {error && <div className="error-message">{error}</div>}

          <div className="aid-list-banner">
            Applications that completed investigation and are{' '}
            <strong>not rejected</strong>. Use View or Approve to open the CEO
            decision on the application.
          </div>

          <CollapsibleFilters open={filtersOpen}>
            <div className="filters-row">
              <SearchFilter
                filterKey="search"
                label="Search"
                filters={tempFilters}
                onFilterChange={(k, v) =>
                  setTempFilters((p) => ({ ...p, [k]: v }))
                }
                placeholder="App no, name, CNIC…"
              />
              <DropdownFilter
                filterKey="status"
                label="Status"
                data={STATUS_FILTERS}
                filters={tempFilters}
                onFilterChange={(k, v) =>
                  setTempFilters((p) => ({ ...p, [k]: v }))
                }
                placeholder="All (not rejected)"
              />
              <SearchButton
                onClick={() => {
                  setCurrentPage(1);
                  applyFilters({ ...tempFilters });
                }}
              />
              <ClearButton
                onClick={() =>
                  applyFilters({ search: '', status: CEO_PENDING })
                }
              />
            </div>
          </CollapsibleFilters>

          <div className="aid-list-toolbar">
            <button
              type="button"
              className={`aid-filter-chip${
                appliedFilters.status === CEO_PENDING
                  ? ' aid-filter-chip--active'
                  : ''
              }`}
              onClick={() =>
                applyFilters({
                  ...appliedFilters,
                  status:
                    appliedFilters.status === CEO_PENDING ? '' : CEO_PENDING,
                })
              }
            >
              <FiCheckCircle />
              Awaiting CEO
            </button>
          </div>

          <div className="table-container">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Application</th>
                  <th>Beneficiary</th>
                  <th>Program</th>
                  <th>SubProgram</th>
                  <th>Expected Amount</th>
                  <th>Recommendation</th>
                  <th>Status</th>
                  <th>Verified</th>
                  <th style={{ width: 120 }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr>
                    <td colSpan={9}>Loading…</td>
                  </tr>
                ) : rows.length === 0 ? (
                  <tr>
                    <td colSpan={9}>No approval applications found.</td>
                  </tr>
                ) : (
                  rows.map((row) => {
                    const needsCeo = canCeo && row.status === CEO_PENDING;
                    const ration = isRationApp(row);
                    const rec = row.investigation_recommendation;
                    const recLabel = ration
                      ? formatRationRecLabel(rec)
                      : rec?.decision
                        ? String(rec.decision).replace(/_/g, ' ')
                        : '—';
                    return (
                      <tr
                        key={row.id}
                        className={
                          needsCeo ? 'aid-row--ceo-pending' : undefined
                        }
                      >
                        <td>
                          <strong>{row.application_no}</strong>
                          <div style={{ fontSize: 12, color: '#64748b' }}>
                            {row.title || '—'}
                          </div>
                        </td>
                        <td>{row.beneficiary?.full_name || '—'}</td>
                        <td>{formatAidRequestType(row.requested_aid_type)}</td>
                        <td>{formatAidProgramLabel(row.aid_program)}</td>
                        <td style={{ fontWeight: 600, whiteSpace: 'nowrap' }}>
                          {formatExpectedAmount(row)}
                        </td>
                        <td>
                          <div style={{ textTransform: 'capitalize' }}>
                            {recLabel}
                          </div>
                          {!ration && rec?.amount != null ? (
                            <div style={{ fontSize: 12, color: '#64748b' }}>
                              PKR {rec.amount}
                              {rec.period_months
                                ? ` · ${rec.period_months} mo`
                                : ''}
                            </div>
                          ) : null}
                          {ration && rec?.remarks ? (
                            <div style={{ fontSize: 12, color: '#64748b' }}>
                              {String(rec.remarks).slice(0, 60)}
                              {String(rec.remarks).length > 60 ? '…' : ''}
                            </div>
                          ) : null}
                        </td>
                        <td>
                          <span
                            className={`aid-status-pill aid-status-pill--${aidStatusTone(
                              row.status,
                            )}`}
                          >
                            {formatAidStatus(row.status)}
                          </span>
                        </td>
                        <td style={{ fontSize: 13, color: '#64748b' }}>
                          {row.verified_at
                            ? new Date(row.verified_at).toLocaleDateString()
                            : '—'}
                        </td>
                        <td>
                          <div className="aid-icon-actions">
                            <button
                              type="button"
                              className="aid-icon-btn aid-icon-btn--view"
                              title="View application"
                              aria-label="View application"
                              onClick={() => openView(row.id)}
                            >
                              <FiEye />
                            </button>
                            {needsCeo && ration ? (
                              <button
                                type="button"
                                className="aid-icon-btn aid-icon-btn--approve"
                                title="Ration recommendation / approve"
                                aria-label="Ration recommendation / approve"
                                onClick={() => openApprove(row)}
                              >
                                <MdZoomIn />
                              </button>
                            ) : null}
                            {needsCeo && !ration ? (
                              <button
                                type="button"
                                className="aid-icon-btn aid-icon-btn--approve"
                                title="Approve / decide as CEO"
                                aria-label="Approve / decide as CEO"
                                onClick={() => openApprove(row)}
                              >
                                <FiCheckCircle />
                              </button>
                            ) : null}
                          </div>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>

          <AidRationRecommendationModal
            open={!!rationModalRow}
            application={rationModalRow}
            mode="ceo"
            busy={rationBusy}
            error={rationError}
            onClose={closeRationModal}
            onSave={saveRationRecommendation}
            onApprove={approveRationRecommendation}
          />

          {totalItems > 0 && (
            <Pagination
              currentPage={currentPage}
              totalPages={totalPages}
              totalItems={totalItems}
              pageSize={pageSize}
              onPageChange={setCurrentPage}
              onPageSizeChange={(n) => {
                setPageSize(n);
                setCurrentPage(1);
              }}
              onSortChange={handleSortChange}
              sortField={sortField}
              sortOrder={sortOrder}
              sortOptions={sortOptions}
            />
          )}
        </div>
      </div>
    </>
  );
};

export default AidApprovalsList;
