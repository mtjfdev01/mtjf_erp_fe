import React, { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { FiEdit2, FiEye } from 'react-icons/fi';
import { MdZoomIn } from 'react-icons/md';
import axiosInstance from '../../../../../../utils/axios';
import { useAuth } from '../../../../../../context/AuthContext';
import {
  canViewModule,
  hasAidPermission,
  isSuperAdmin,
} from '../../../../../../utils/permissions';
import Navbar from '../../../../../Navbar';
import PageHeader from '../../../../../common/PageHeader';
import Pagination from '../../../../../common/Pagination';
import FormInput from '../../../../../common/FormInput';
import FormSelect from '../../../../../common/FormSelect';
import {
  AID_REQUEST_TYPES,
  formatAidProgramLabel,
  AID_ENTRY_STAGES,
  formatAidRequestType,
  formatAidEntryStage,
  formatRelativeAidTime,
  aidEntryStageTone,
} from '../../../aidConstants';
import AidRationRecommendationModal from '../../../shared/AidRationRecommendationModal';
import '../../../aid.css';
import useOfflineDataRefresh from '../../../../../../hooks/useOfflineDataRefresh';

const emptyFilters = {
  search: '',
  requested_aid_type: '',
  district: '',
  stage: '',
};

const CEO_PENDING_STATUS = 'ceo_approval_required';
const MANAGER_REVIEW_STATUS = 'manager_review';

const isRationApp = (row) =>
  String(row?.requested_aid_type || '').toLowerCase() === 'ration';

/**
 * Data-entry listing — pipeline cards, filters, and case table.
 */
const AidEntryApplicationsList = () => {
  const navigate = useNavigate();
  const { permissions, user } = useAuth();

  const isStaffElevated =
    !!permissions?.super_admin ||
    !!permissions?.program_manager ||
    !!permissions?.fund_raising_manager;

  const isProgramDeptManager =
    isSuperAdmin(permissions) ||
    (!!permissions?.program_manager &&
      String(user?.department || '').toLowerCase() === 'program');

  /** Who may open ration recommendation from Applications list */
  const canEditRationRec =
    isSuperAdmin(permissions) ||
    !!permissions?.program_manager ||
    isStaffElevated ||
    hasAidPermission(permissions, 'aid_drafts', 'approve_draft') ||
    hasAidPermission(permissions, 'aid_applications', 'approve_draft');

  const canCeo =
    isStaffElevated ||
    hasAidPermission(permissions, 'aid_applications', 'ceo_approve');

  const canList =
    canViewModule(permissions, 'program', 'aid_applications') ||
    hasAidPermission(permissions, 'aid_applications', 'create') ||
    isStaffElevated;

  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(20);
  const [totalItems, setTotalItems] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [sortField, setSortField] = useState('updated_at');
  const [sortOrder, setSortOrder] = useState('DESC');
  const [tempFilters, setTempFilters] = useState({ ...emptyFilters });
  const [appliedFilters, setAppliedFilters] = useState({ ...emptyFilters });
  const [stageCounts, setStageCounts] = useState({});
  const [districts, setDistricts] = useState([]);
  const [rationModalRow, setRationModalRow] = useState(null);
  const [rationMode, setRationMode] = useState('ceo');
  const [rationBusy, setRationBusy] = useState(false);
  const [rationError, setRationError] = useState('');

  const handleSortChange = (field, order) => {
    setSortField(field);
    setSortOrder(order);
    setCurrentPage(1);
  };

  const sortOptions = [
    { value: 'updated_at', label: 'Updated' },
    { value: 'created_at', label: 'Created' },
    { value: 'status', label: 'Stage' },
    { value: 'application_no', label: 'Application Number' },
    { value: 'id', label: 'ID' },
  ];

  const applyFilters = (next) => {
    setTempFilters(next);
    setAppliedFilters(next);
    setCurrentPage(1);
  };

  const setStage = (stageId) => {
    const next = {
      ...appliedFilters,
      stage: appliedFilters.stage === stageId ? '' : stageId,
    };
    applyFilters(next);
  };

  const fetchRows = async () => {
    if (!canList) {
      setError('You do not have permission to view aid applications.');
      setLoading(false);
      return;
    }
    try {
      setLoading(true);
      setError('');
      const res = await axiosInstance.get('/aid/applications', {
        params: {
          queue: 'entry',
          search: appliedFilters.search || undefined,
          stage: appliedFilters.stage || undefined,
          requested_aid_type: appliedFilters.requested_aid_type || undefined,
          district: appliedFilters.district || undefined,
          page: currentPage,
          pageSize,
          sortField,
          sortOrder,
        },
      });
      setRows(res.data?.data || []);
      setTotalItems(res.data?.total || 0);
      setTotalPages(res.data?.totalPages || 1);
      setStageCounts(res.data?.stage_counts || {});
      setDistricts(res.data?.filter_options?.districts || []);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to load applications');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRows();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentPage, pageSize, sortField, sortOrder, appliedFilters]);

  useOfflineDataRefresh(() => fetchRows(), [appliedFilters, currentPage], ['aid']);

  const openRationModal = (row, mode) => {
    setRationError('');
    setRationMode(mode);
    setRationModalRow(row);
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

  const submitRationRecommendation = async (recommendation) => {
    if (!rationModalRow?.id) return;
    setRationBusy(true);
    setRationError('');
    try {
      if (rationMode === 'manager') {
        await axiosInstance.post(
          `/aid/applications/${rationModalRow.id}/manager-forward`,
          { recommendation },
        );
      } else {
        await axiosInstance.post(
          `/aid/applications/${rationModalRow.id}/ceo-decide`,
          { decision: 'approved', recommendation },
        );
      }
      setRationModalRow(null);
      await fetchRows();
    } catch (err) {
      setRationError(
        err.response?.data?.message ||
          err.message ||
          'Failed to submit recommendation',
      );
    } finally {
      setRationBusy(false);
    }
  };

  const districtOptions = useMemo(
    () => [
      { value: '', label: 'All districts' },
      ...districts.map((d) => ({ value: d, label: d })),
    ],
    [districts],
  );

  const programOptions = useMemo(
    () => [{ value: '', label: 'All programs' }, ...AID_REQUEST_TYPES],
    [],
  );

  return (
    <>
      <Navbar />
      <div className="list-wrapper aid-list aid-entry-list">
        <PageHeader
          title="Applications"
          backPath="/dms"
          showAdd={false}
          onRefresh={fetchRows}
        />
        <div className="list-content">
          {error && <div className="error-message">{error}</div>}

          <div className="aid-entry-stages" role="toolbar" aria-label="Pipeline">
            {AID_ENTRY_STAGES.map((s) => {
              const active = appliedFilters.stage === s.id;
              const count = stageCounts[s.id] ?? 0;
              return (
                <button
                  key={s.id}
                  type="button"
                  className={`aid-entry-stage${
                    active ? ' aid-entry-stage--active' : ''
                  }`}
                  onClick={() => setStage(s.id)}
                >
                  <span className="aid-entry-stage__label">{s.label}</span>
                  <span className="aid-entry-stage__value">{count}</span>
                  <span className="aid-entry-stage__hint">{s.hint}</span>
                </button>
              );
            })}
          </div>

          <div className="aid-entry-filters">
            <div className="aid-entry-filters__field aid-entry-filters__field--search">
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
                placeholder="Application no., CNIC or family head name"
              />
            </div>
            <div className="aid-entry-filters__field">
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
            <div className="aid-entry-filters__field">
              <FormSelect
                label="District"
                value={tempFilters.district}
                onChange={(e) =>
                  setTempFilters((p) => ({ ...p, district: e.target.value }))
                }
                options={districtOptions}
              />
            </div>
            <div className="aid-entry-filters__actions">
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

          <div className="table-container aid-entry-table-wrap">
            <table className="data-table aid-entry-table">
              <thead>
                <tr>
                  <th>Application</th>
                  <th>Family head</th>
                  <th>Program</th>
                  <th>Location</th>
                  <th>Members</th>
                  <th>Vulnerability</th>
                  <th>Stage</th>
                  <th>Updated</th>
                  <th>Action</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr>
                    <td colSpan={9}>Loading…</td>
                  </tr>
                ) : rows.length === 0 ? (
                  <tr>
                    <td colSpan={9}>No applications found.</td>
                  </tr>
                ) : (
                  rows.map((row) => {
                    const stage = row.stage || 'submitted';
                    const pct = Number(row.vulnerability_pct) || 0;
                    const ration = isRationApp(row);
                    const status = String(row.status || '').toLowerCase();
                    const needsManagerRation =
                      canEditRationRec &&
                      ration &&
                      (status === MANAGER_REVIEW_STATUS ||
                        stage === MANAGER_REVIEW_STATUS);
                    const needsCeoRation =
                      canCeo &&
                      ration &&
                      (status === CEO_PENDING_STATUS ||
                        stage === 'pending_approval');
                    return (
                      <tr key={row.id}>
                        <td>
                          <strong className="aid-entry-table__app-no">
                            {row.application_no}
                          </strong>
                        </td>
                        <td>
                          <div className="aid-entry-table__head-name">
                            {row.family_head_name ||
                              row.beneficiary?.full_name ||
                              '—'}
                          </div>
                          <div className="aid-entry-table__head-cnic">
                            {row.family_head_cnic ||
                              row.beneficiary?.cnic ||
                              '—'}
                          </div>
                        </td>
                        <td>
                          <div>
                            {formatAidRequestType(row.requested_aid_type)}
                          </div>
                          {row.aid_program ? (
                            <div
                              style={{ fontSize: 12, color: '#64748b' }}
                            >
                              {formatAidProgramLabel(row.aid_program)}
                            </div>
                          ) : null}
                        </td>
                        <td>{row.location || '—'}</td>
                        <td>{row.members_count ?? '—'}</td>
                        <td>
                          <div className="aid-vuln-bar" title={`${pct}%`}>
                            <span
                              className={`aid-vuln-bar__track aid-vuln-bar__track--${
                                pct >= 70
                                  ? 'high'
                                  : pct >= 40
                                    ? 'mid'
                                    : 'low'
                              }`}
                            >
                              <i style={{ width: `${Math.min(100, pct)}%` }} />
                            </span>
                            <span className="aid-vuln-bar__pct">{pct}%</span>
                          </div>
                        </td>
                        <td>
                          <span
                            className={`aid-stage-pill aid-stage-pill--${aidEntryStageTone(
                              stage,
                            )}`}
                          >
                            {formatAidEntryStage(stage)}
                          </span>
                        </td>
                        <td>{formatRelativeAidTime(row.updated_at)}</td>
                        <td>
                          <div className="aid-icon-actions">
                            <button
                              type="button"
                              className="aid-icon-btn aid-icon-btn--view"
                              title="Open"
                              aria-label="Open"
                              onClick={() =>
                                navigate(
                                  `/dms/aid/applications/entry/view/${row.id}`,
                                )
                              }
                            >
                              <FiEye />
                            </button>
                            {row.status !== 'rejected' &&
                            row.status !== 'delivered' ? (
                              <button
                                type="button"
                                className="aid-icon-btn aid-icon-btn--edit"
                                title="Edit"
                                aria-label="Edit"
                                onClick={() =>
                                  navigate(
                                    `/dms/aid/applications/edit/${row.id}`,
                                  )
                                }
                              >
                                <FiEdit2 />
                              </button>
                            ) : null}
                            {needsManagerRation ? (
                              <button
                                type="button"
                                className="aid-icon-btn aid-icon-btn--approve"
                                title="Ration recommendation"
                                aria-label="Ration recommendation"
                                onClick={() => openRationModal(row, 'manager')}
                              >
                                <MdZoomIn />
                              </button>
                            ) : null}
                            {needsCeoRation ? (
                              <button
                                type="button"
                                className="aid-icon-btn aid-icon-btn--approve"
                                title="Ration recommendation / approve"
                                aria-label="Ration recommendation / approve"
                                onClick={() => openRationModal(row, 'ceo')}
                              >
                                <MdZoomIn />
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
            mode={rationMode}
            busy={rationBusy}
            error={rationError}
            onClose={closeRationModal}
            onSave={saveRationRecommendation}
            onApprove={submitRationRecommendation}
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

export default AidEntryApplicationsList;
