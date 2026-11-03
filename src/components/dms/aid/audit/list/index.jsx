import React, { useCallback, useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { FiEye } from 'react-icons/fi';
import axiosInstance from '../../../../../utils/axios';
import { useAuth } from '../../../../../context/AuthContext';
import { hasAidPermission, isSuperAdmin } from '../../../../../utils/permissions';
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
  formatAidStatus,
  formatAidRequestType,
  aidStatusTone,
} from '../../aidConstants';
import '../../aid.css';

const AidAuditList = () => {
  const navigate = useNavigate();
  const { permissions } = useAuth();
  const { filtersOpen, toggleFilters } = useFiltersPanel();

  const canList =
    isSuperAdmin(permissions) ||
    hasAidPermission(permissions, 'aid_audit', 'list_view') ||
    hasAidPermission(permissions, 'aid_audit', 'view');

  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(20);
  const [totalItems, setTotalItems] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [tempFilters, setTempFilters] = useState({ search: '', status: '' });
  const [appliedFilters, setAppliedFilters] = useState({
    search: '',
    status: '',
  });

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
          search: appliedFilters.search || undefined,
          status: appliedFilters.status || undefined,
          sortField: 'updated_at',
          sortOrder: 'DESC',
        },
      });
      setRows(res.data?.data || []);
      setTotalItems(res.data?.totalItems ?? res.data?.total ?? 0);
      setTotalPages(res.data?.totalPages ?? 1);
    } catch (err) {
      setError(
        err.response?.data?.message || err.message || 'Failed to load applications',
      );
      setRows([]);
    } finally {
      setLoading(false);
    }
  }, [canList, currentPage, pageSize, appliedFilters]);

  useEffect(() => {
    fetchRows();
  }, [fetchRows]);

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
      <div className="page-container">
        <PageHeader
          title="Aid Audit Logs"
          backPath="/dms"
          showFilterToggle
          filtersOpen={filtersOpen}
          onFilterToggle={toggleFilters}
          onRefresh={fetchRows}
        />
        <p className="aid-section-hint" style={{ marginTop: 0 }}>
          Separate audit trail for Aid applications — who changed what and when.
          Only users with Aid Audit Logs permission can open this screen.
        </p>

        <CollapsibleFilters open={filtersOpen} onToggle={toggleFilters}>
          <SearchFilter
            value={tempFilters.search}
            onChange={(e) =>
              setTempFilters((f) => ({ ...f, search: e.target.value }))
            }
            placeholder="Search application no. / name / CNIC"
          />
          <DropdownFilter
            label="Status"
            value={tempFilters.status}
            onChange={(e) =>
              setTempFilters((f) => ({ ...f, status: e.target.value }))
            }
            options={[
              { value: '', label: 'All statuses' },
              ...AID_STATUS_OPTIONS,
            ]}
          />
          <SearchButton
            onClick={() => {
              setAppliedFilters({ ...tempFilters });
              setCurrentPage(1);
            }}
          />
          <ClearButton
            onClick={() => {
              setTempFilters({ search: '', status: '' });
              setAppliedFilters({ search: '', status: '' });
              setCurrentPage(1);
            }}
          />
        </CollapsibleFilters>

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
                      <span className={`aid-status-pill aid-status-pill--${aidStatusTone(row.status)}`}>
                        {formatAidStatus(row.status)}
                      </span>
                    </td>
                    <td>
                      {row.updated_at
                        ? new Date(row.updated_at).toLocaleString()
                        : '—'}
                    </td>
                    <td>
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
                        style={{ marginLeft: 8 }}
                      >
                        Open app
                      </Link>
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
    </>
  );
};

export default AidAuditList;
