import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { FiEye, FiFileText } from 'react-icons/fi';
import axiosInstance from '../../../../../utils/axios';
import { useAuth } from '../../../../../context/AuthContext';
import { hasAidPermission, isSuperAdmin } from '../../../../../utils/permissions';
import Navbar from '../../../../Navbar';
import PageHeader from '../../../../common/PageHeader';
import Pagination from '../../../../common/Pagination';
import {
  SearchFilter,
  DropdownFilter,
  DateFilter,
  DateRangeFilter,
  SearchButton,
  ClearButton,
  CollapsibleFilters,
} from '../../../../common/filters';
import SearchableDropdown from '../../../../common/SearchableDropdown';
import useFiltersPanel from '../../../../../hooks/useFiltersPanel';
import {
  formatAidUserLabel,
  toAssignableAidUser,
} from '../../shared/AidUserAssignField';
import {
  AID_ENTRY_STAGES,
  AID_REQUEST_TYPES,
  AID_STATUS_OPTIONS,
  formatAidStatus,
  formatAidRequestType,
  aidStatusTone,
} from '../../aidConstants';
import AidUserInteractionReport from '../AidUserInteractionReport';
import '../../aid.css';

const EMPTY_FILTERS = {
  search: '',
  status: '',
  stage: '',
  requested_aid_type: '',
  district: '',
  interacted_by_user_id: '',
  date: '',
  start_date: '',
  end_date: '',
};

const AidAuditList = () => {
  const navigate = useNavigate();
  const { permissions } = useAuth();
  const { filtersOpen, toggleFilters } = useFiltersPanel(true);

  const canList =
    isSuperAdmin(permissions) ||
    hasAidPermission(permissions, 'aid_audit', 'list_view') ||
    hasAidPermission(permissions, 'aid_audit', 'view');

  const [rows, setRows] = useState([]);
  const [districts, setDistricts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(20);
  const [totalItems, setTotalItems] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [tempFilters, setTempFilters] = useState({ ...EMPTY_FILTERS });
  const [appliedFilters, setAppliedFilters] = useState({ ...EMPTY_FILTERS });
  const [selectedUser, setSelectedUser] = useState(null);
  const [reportOpen, setReportOpen] = useState(false);

  const handleFilterChange = (key, value) => {
    setTempFilters((f) => {
      const next = { ...f, [key]: value };
      if (key === 'date' && value) {
        next.start_date = '';
        next.end_date = '';
      }
      if ((key === 'start_date' || key === 'end_date') && value) {
        next.date = '';
      }
      if (key === 'status' && value) next.stage = '';
      if (key === 'stage' && value) next.status = '';
      return next;
    });
  };

  const handleUserSelect = (user) => {
    const next = toAssignableAidUser(user);
    setSelectedUser(next);
    handleFilterChange(
      'interacted_by_user_id',
      next?.id != null ? String(next.id) : '',
    );
  };

  const handleUserClear = () => {
    setSelectedUser(null);
    setReportOpen(false);
    handleFilterChange('interacted_by_user_id', '');
  };

  const handleApplyFilters = () => {
    setAppliedFilters({ ...tempFilters });
    setCurrentPage(1);
  };

  const handleClearFilters = () => {
    setTempFilters({ ...EMPTY_FILTERS });
    setAppliedFilters({ ...EMPTY_FILTERS });
    setSelectedUser(null);
    setReportOpen(false);
    setCurrentPage(1);
  };

  const openInteractionReport = () => {
    if (!selectedUser?.id) return;
    const next = {
      ...tempFilters,
      interacted_by_user_id: String(selectedUser.id),
    };
    setTempFilters(next);
    setAppliedFilters(next);
    setCurrentPage(1);
    setReportOpen(true);
  };

  const fetchRows = useCallback(async () => {
    if (!canList) {
      setLoading(false);
      setRows([]);
      return;
    }
    setLoading(true);
    setError('');
    try {
      const res = await axiosInstance.get('/aid/audit/applications', {
        params: {
          page: currentPage,
          pageSize,
          queue: 'audit',
          search: appliedFilters.search || undefined,
          status: appliedFilters.status || undefined,
          stage: appliedFilters.stage || undefined,
          requested_aid_type: appliedFilters.requested_aid_type || undefined,
          district: appliedFilters.district || undefined,
          interacted_by_user_id:
            appliedFilters.interacted_by_user_id || undefined,
          date: appliedFilters.date || undefined,
          start_date: appliedFilters.start_date || undefined,
          end_date: appliedFilters.end_date || undefined,
          sortField: 'updated_at',
          sortOrder: 'DESC',
        },
      });
      setRows(res.data?.data || []);
      setTotalItems(res.data?.totalItems ?? res.data?.total ?? 0);
      setTotalPages(res.data?.totalPages ?? 1);
      const nextDistricts = res.data?.filter_options?.districts;
      if (Array.isArray(nextDistricts)) setDistricts(nextDistricts);
    } catch (err) {
      setError(
        err.response?.data?.message ||
          err.message ||
          'Failed to load applications',
      );
      setRows([]);
    } finally {
      setLoading(false);
    }
  }, [canList, currentPage, pageSize, appliedFilters]);

  useEffect(() => {
    fetchRows();
  }, [fetchRows]);

  const districtOptions = useMemo(
    () => districts.map((d) => ({ value: d, label: d })),
    [districts],
  );

  const programOptions = useMemo(
    () => AID_REQUEST_TYPES.map((o) => ({ value: o.value, label: o.label })),
    [],
  );

  const stageOptions = useMemo(
    () => AID_ENTRY_STAGES.map((s) => ({ value: s.id, label: s.label })),
    [],
  );

  const statusOptions = useMemo(
    () => AID_STATUS_OPTIONS.map((o) => ({ value: o.value, label: o.label })),
    [],
  );

  if (!canList) {
    return (
      <>
        <Navbar />
        <div className="page-container">
          <PageHeader title="Aid Audit Logs" />
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
      <div className="page-container aid-list aid-audit-list">
        <PageHeader
          title="Aid Audit Logs"
          showBackButton={false}
          showFilterToggle
          filtersOpen={filtersOpen}
          onFilterToggle={toggleFilters}
          onRefresh={fetchRows}
          refreshing={loading}
        />

        <div className="list-content">
          <p className="aid-section-hint" style={{ marginTop: 0 }}>
            Separate audit trail for Aid applications — who changed what and
            when. Only users with Aid Audit Logs permission can open this
            screen.
          </p>

          <CollapsibleFilters open={filtersOpen}>
            <div className="filters-section">
              <SearchFilter
                filterKey="search"
                label="Search"
                filters={tempFilters}
                onFilterChange={handleFilterChange}
                placeholder="Search application no. / name / CNIC"
              />

              <DropdownFilter
                filterKey="status"
                label="Status"
                data={statusOptions}
                filters={tempFilters}
                onFilterChange={handleFilterChange}
                placeholder="All statuses"
              />

              <DropdownFilter
                filterKey="stage"
                label="Stage"
                data={stageOptions}
                filters={tempFilters}
                onFilterChange={handleFilterChange}
                placeholder="All stages"
              />

              <DropdownFilter
                filterKey="requested_aid_type"
                label="Program"
                data={programOptions}
                filters={tempFilters}
                onFilterChange={handleFilterChange}
                placeholder="All programs"
              />

              <DropdownFilter
                filterKey="district"
                label="District"
                data={districtOptions}
                filters={tempFilters}
                onFilterChange={handleFilterChange}
                placeholder="All districts"
              />

              <div className="dropdown-filter-container aid-audit-user-filter">
                <label className="dropdown-filter-label">
                  Interacted by user
                </label>
                <SearchableDropdown
                  placeholder="Search user…"
                  apiEndpoint="/users/options"
                  value={selectedUser}
                  displayKey="name"
                  onSelect={handleUserSelect}
                  onClear={handleUserClear}
                  debounceDelay={400}
                  minSearchLength={1}
                  allowResearch
                  renderOption={(user, index, list) => (
                    <div
                      key={user.id}
                      className="searchable-dropdown__option"
                      onClick={() => handleUserSelect(user)}
                      style={{
                        padding: '10px 12px',
                        borderBottom:
                          Array.isArray(list) && index < list.length - 1
                            ? '1px solid #eee'
                            : 'none',
                        cursor: 'pointer',
                      }}
                    >
                      <div style={{ fontWeight: 500 }}>
                        {formatAidUserLabel(user)}
                      </div>
                      <div style={{ fontSize: 12, color: '#666' }}>
                        {user.email}
                      </div>
                    </div>
                  )}
                />
              </div>

              <DateFilter
                filterKey="date"
                label="Updated date"
                filters={tempFilters}
                onFilterChange={handleFilterChange}
              />

              <DateRangeFilter
                startKey="start_date"
                endKey="end_date"
                label="Updated date range"
                filters={tempFilters}
                onFilterChange={handleFilterChange}
              />

              <div className="filters-actions">
                <SearchButton
                  onClick={handleApplyFilters}
                  text="Search"
                  loading={loading}
                />
                <ClearButton onClick={handleClearFilters} text="Clear" />
              </div>
            </div>
          </CollapsibleFilters>

          {selectedUser?.id ? (
            <div className="aid-audit-report-cta">
              <p>
                Selected user: <strong>{formatAidUserLabel(selectedUser)}</strong>
                . Open a full interaction report using the current date and
                filter values.
              </p>
              <button
                type="button"
                className="primary-btn"
                onClick={openInteractionReport}
              >
                <FiFileText aria-hidden /> Show complete interaction report
              </button>
            </div>
          ) : null}

          {error ? (
            <div className="status-message status-message--error">{error}</div>
          ) : null}

          <div className="table-responsive">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Application</th>
                  <th>Beneficiary</th>
                  <th>Type</th>
                  <th>Status</th>
                  <th>Updated</th>
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
                    <td colSpan={6}>No applications found</td>
                  </tr>
                ) : (
                  rows.map((row) => (
                    <tr key={row.id}>
                      <td>
                        <strong>{row.application_no || `#${row.id}`}</strong>
                      </td>
                      <td>
                        {row.beneficiary?.full_name || '—'}
                        {row.beneficiary?.cnic ? (
                          <div style={{ fontSize: 12, color: '#64748b' }}>
                            {row.beneficiary.cnic}
                          </div>
                        ) : null}
                      </td>
                      <td>{formatAidRequestType(row.requested_aid_type)}</td>
                      <td>
                        <span
                          className={`aid-status-pill aid-status-pill--${aidStatusTone(
                            row.status,
                          )}`}
                        >
                          {formatAidStatus(row.status)}
                        </span>
                      </td>
                      <td>
                        {row.updated_at
                          ? new Date(row.updated_at).toLocaleString()
                          : '—'}
                      </td>
                      <td>
                        <div className="aid-audit-row-actions">
                          <button
                            type="button"
                            className="secondary-btn"
                            title="View audit history"
                            onClick={() =>
                              navigate(`/dms/aid/audit/applications/${row.id}`)
                            }
                          >
                            <FiEye aria-hidden /> History
                          </button>
                          <Link
                            to={`/dms/aid/applications/view/${row.id}`}
                            className="secondary-btn"
                          >
                            Open app
                          </Link>
                        </div>
                      </td>
                    </tr>
                  ))
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
            onPageSizeChange={(n) => {
              setPageSize(n);
              setCurrentPage(1);
            }}
          />
        </div>
      </div>

      <AidUserInteractionReport
        open={reportOpen}
        user={selectedUser}
        filters={appliedFilters}
        onClose={() => setReportOpen(false)}
      />
    </>
  );
};

export default AidAuditList;
