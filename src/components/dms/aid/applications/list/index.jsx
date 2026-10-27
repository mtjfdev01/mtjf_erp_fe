import React, { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  FiEye,
  FiEdit2,
  FiCheckCircle,
  FiTruck,
} from 'react-icons/fi';
import { MdZoomIn } from 'react-icons/md';
import axiosInstance from '../../../../../utils/axios';
import { useAuth } from '../../../../../context/AuthContext';
import {
  canViewModule,
  hasAidPermission,
  isSuperAdmin,
} from '../../../../../utils/permissions';
import Navbar from '../../../../Navbar';
import PageHeader from '../../../../common/PageHeader';
import Pagination from '../../../../common/Pagination';
import {
  SearchFilter,
  DropdownFilter,
  SearchButton,
  ClearButton,
  CollapsibleFilters,
} from '../../../../common/filters';
import useFiltersPanel from '../../../../../hooks/useFiltersPanel';
import {
  AID_STATUS_OPTIONS,
  aidStatusTone,
  formatAidStatus,
  formatAidRequestType,
  formatAidProgramLabel,
} from '../../aidConstants';
import AidRationRecommendationModal from '../../shared/AidRationRecommendationModal';
import '../../aid.css';
import useListAutoRefresh from '../../../../../hooks/useListAutoRefresh';

const CEO_PENDING_STATUS = 'ceo_approval_required';
const MANAGER_REVIEW_STATUS = 'manager_review';
const DELIVERY_PENDING_STATUSES = new Set(['successful']);
const VERIFICATION_STATUS_OPTIONS = AID_STATUS_OPTIONS.filter(
  (o) => o.value !== 'draft',
);

const isRationApp = (row) =>
  String(row?.requested_aid_type || '').toLowerCase() === 'ration';

const AidApplicationsList = () => {
  const navigate = useNavigate();
  const { permissions, user } = useAuth();
  const { filtersOpen, toggleFilters } = useFiltersPanel();

  const isStaffElevated =
    !!permissions?.super_admin ||
    !!permissions?.program_manager ||
    !!permissions?.fund_raising_manager;

  const isProgramDeptManager =
    isSuperAdmin(permissions) ||
    (!!permissions?.program_manager &&
      String(user?.department || '').toLowerCase() === 'program');

  const canEditRationRec =
    isSuperAdmin(permissions) ||
    !!permissions?.program_manager ||
    isStaffElevated ||
    hasAidPermission(permissions, 'aid_drafts', 'approve_draft') ||
    hasAidPermission(permissions, 'aid_applications', 'approve_draft');

  const canCeo =
    isStaffElevated ||
    hasAidPermission(permissions, 'aid_applications', 'ceo_approve');

  const canDeliver =
    isStaffElevated ||
    hasAidPermission(permissions, 'aid_applications', 'deliver');

  const canList =
    canViewModule(permissions, 'program', 'aid_verification') ||
    hasAidPermission(permissions, 'aid_verification', 'list_view') ||
    canCeo ||
    canDeliver ||
    isStaffElevated;

  const canCreate =
    hasAidPermission(permissions, 'aid_applications', 'create') ||
    isStaffElevated;

  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(20);
  const [totalItems, setTotalItems] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [sortField, setSortField] = useState('created_at');
  const [sortOrder, setSortOrder] = useState('DESC');
  const [tempFilters, setTempFilters] = useState({ search: '', status: '' });
  const [appliedFilters, setAppliedFilters] = useState({ search: '', status: '' });
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
    { value: 'created_at', label: 'Created Date' },
    { value: 'updated_at', label: 'Updated Date' },
    { value: 'status', label: 'Status' },
    { value: 'application_no', label: 'Application Number' },
    { value: 'id', label: 'ID' },
  ];

  const applyFilters = (next) => {
    setTempFilters(next);
    setAppliedFilters(next);
    setCurrentPage(1);
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
          search: appliedFilters.search || undefined,
          status: appliedFilters.status || undefined,
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
      setError(err.response?.data?.message || 'Failed to load applications');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRows();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentPage, pageSize, sortField, sortOrder, appliedFilters]);

  useListAutoRefresh(() => fetchRows(), [appliedFilters, currentPage], ['aid']);

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

  const ceoFilterActive = appliedFilters.status === CEO_PENDING_STATUS;
  const pendingCeoCount = rows.filter((r) => r.status === CEO_PENDING_STATUS).length;

  return (
    <>
      <Navbar />
      <div className="list-wrapper aid-list">
        <PageHeader
          title="Verification Process"
          backPath="/dms"
          showAdd={!!canCreate}
          addPath="/dms/aid/applications/add"
          addTitle="New application"
          showFilterToggle
          filtersOpen={filtersOpen}
          onFilterToggle={toggleFilters}
          onRefresh={fetchRows}
        />
        <div className="list-content">
          {error && <div className="error-message">{error}</div>}

          <CollapsibleFilters open={filtersOpen}>
            <div className="filters-row">
              <SearchFilter
                filterKey="search"
                label="Search"
                filters={tempFilters}
                onFilterChange={(k, v) => setTempFilters((p) => ({ ...p, [k]: v }))}
                placeholder="App no, name, CNIC…"
              />
              <DropdownFilter
                filterKey="status"
                label="Status"
                data={VERIFICATION_STATUS_OPTIONS}
                filters={tempFilters}
                onFilterChange={(k, v) => setTempFilters((p) => ({ ...p, [k]: v }))}
                placeholder="All"
              />
              <SearchButton
                onClick={() => {
                  setCurrentPage(1);
                  setAppliedFilters({ ...tempFilters });
                }}
              />
              <ClearButton
                onClick={() => {
                  applyFilters({ search: '', status: '' });
                }}
              />
            </div>
          </CollapsibleFilters>

          <div className="aid-list-toolbar">
            <Link to="/dms/aid/people/list" className="secondary-btn">
              People / family registry
            </Link>
            {canCeo && (
              <Link
                to="/dms/aid/applications/approvals"
                className="secondary-btn"
              >
                <FiCheckCircle /> Approvals
              </Link>
            )}

            {canCeo && (
              <button
                type="button"
                className={`aid-filter-chip${ceoFilterActive ? ' aid-filter-chip--active' : ''}`}
                onClick={() =>
                  applyFilters({
                    ...appliedFilters,
                    status: ceoFilterActive ? '' : CEO_PENDING_STATUS,
                  })
                }
              >
                <FiCheckCircle />
                {ceoFilterActive
                  ? 'Showing CEO pending'
                  : 'Awaiting CEO approval'}
                {!ceoFilterActive && pendingCeoCount > 0 ? (
                  <span className="aid-filter-chip__count">{pendingCeoCount}</span>
                ) : null}
              </button>
            )}
          </div>

          {canCeo && ceoFilterActive && (
            <div className="aid-list-banner">
              Showing applications that need <strong>CEO approval</strong>. Use
              Review to approve or reject.
            </div>
          )}

          <div className="table-container">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Application</th>
                  <th>Beneficiary</th>
                  <th>Program</th>
                  <th>Status</th>
                  <th>Assigned</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr>
                    <td colSpan={6}>Loading…</td>
                  </tr>
                ) : rows.length === 0 ? (
                  <tr>
                    <td colSpan={6}>No applications found.</td>
                  </tr>
                ) : (
                  rows.map((row) => {
                    const ration = isRationApp(row);
                    const needsCeo =
                      canCeo && row.status === CEO_PENDING_STATUS;
                    const needsManagerRation =
                      canEditRationRec &&
                      ration &&
                      row.status === MANAGER_REVIEW_STATUS;
                    const needsDelivery =
                      canDeliver && DELIVERY_PENDING_STATUSES.has(row.status);
                    return (
                      <tr
                        key={row.id}
                        className={needsCeo ? 'aid-row--ceo-pending' : undefined}
                      >
                        <td>
                          <strong>{row.application_no}</strong>
                          <div style={{ fontSize: 12, color: '#64748b' }}>
                            {row.title || '—'}
                          </div>
                        </td>
                        <td>{row.beneficiary?.full_name || '—'}</td>
                        <td>
                          <div>
                            {formatAidRequestType(row.requested_aid_type)}
                          </div>
                          {row.aid_program ? (
                            <div style={{ fontSize: 12, color: '#64748b' }}>
                              {formatAidProgramLabel(row.aid_program)}
                            </div>
                          ) : null}
                        </td>
                        <td>
                          <span
                            className={`aid-status-pill aid-status-pill--${aidStatusTone(row.status)}`}
                          >
                            {formatAidStatus(row.status)}
                          </span>
                        </td>
                        <td>
                          {row.assigned_to
                            ? [row.assigned_to.first_name, row.assigned_to.last_name]
                                .filter(Boolean)
                                .join(' ') || row.assigned_to.email
                            : '—'}
                        </td>
                        <td>
                          <div className="aid-icon-actions">
                            <button
                              type="button"
                              className="aid-icon-btn aid-icon-btn--view"
                              title="View"
                              aria-label="View"
                              onClick={() =>
                                navigate(`/dms/aid/applications/view/${row.id}`)
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
                            {needsCeo && ration ? (
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
                            {needsCeo && !ration ? (
                              <button
                                type="button"
                                className="aid-icon-btn aid-icon-btn--approve"
                                title="CEO Review"
                                aria-label="CEO Review"
                                onClick={() =>
                                  navigate(`/dms/aid/applications/view/${row.id}`)
                                }
                              >
                                <FiCheckCircle />
                              </button>
                            ) : null}
                            {needsDelivery ? (
                              <button
                                type="button"
                                className="aid-icon-btn aid-icon-btn--warn"
                                title="Delivery"
                                aria-label="Delivery"
                                onClick={() =>
                                  navigate(`/dms/aid/applications/view/${row.id}`)
                                }
                              >
                                <FiTruck />
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

export default AidApplicationsList;
