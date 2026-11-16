import React, { useCallback, useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { FiEdit2, FiTrash2 } from 'react-icons/fi';
import { toast } from 'react-toastify';
import axiosInstance from '../../../../utils/axios';
import { useAuth } from '../../../../context/AuthContext';
import { hasPermission } from '../../../../utils/permissions';
import Navbar from '../../../Navbar';
import PageHeader from '../../../common/PageHeader';
import Pagination from '../../../common/Pagination';
import ConfirmationModal from '../../../common/ConfirmationModal';
import {
  SearchFilter,
  DropdownFilter,
  SearchButton,
  ClearButton,
  CollapsibleFilters,
} from '../../../common/filters';
import useFiltersPanel from '../../../../hooks/useFiltersPanel';
import {
  TARGET_TYPES,
  MONTH_OPTIONS,
  formatTargetAmount,
  monthLabel,
  targetTypeLabel,
  userDisplayName,
} from '../constants';

const currentYear = new Date().getFullYear();
const YEAR_OPTIONS = Array.from({ length: 6 }, (_, i) => {
  const y = currentYear - i + 1;
  return { value: String(y), label: String(y) };
});

const emptyFilters = {
  search: '',
  target_type: '',
  period_year: '',
  period_month: '',
};

const TargetsList = () => {
  const navigate = useNavigate();
  const { permissions } = useAuth();
  const { filtersOpen, toggleFilters } = useFiltersPanel();

  const canCreate =
    !!permissions?.super_admin ||
    !!permissions?.fund_raising_manager ||
    hasPermission(permissions, 'fund_raising', 'targets', 'create');
  const canUpdate =
    !!permissions?.super_admin ||
    !!permissions?.fund_raising_manager ||
    hasPermission(permissions, 'fund_raising', 'targets', 'update');
  const canDelete =
    !!permissions?.super_admin ||
    !!permissions?.fund_raising_manager ||
    hasPermission(permissions, 'fund_raising', 'targets', 'delete');

  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(20);
  const [totalItems, setTotalItems] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [tempFilters, setTempFilters] = useState({ ...emptyFilters });
  const [appliedFilters, setAppliedFilters] = useState({ ...emptyFilters });
  const [deleteRow, setDeleteRow] = useState(null);
  const [deleting, setDeleting] = useState(false);

  const fetchRows = useCallback(async () => {
    try {
      setLoading(true);
      setError('');
      const params = { page, pageSize };
      if (appliedFilters.search) params.search = appliedFilters.search;
      if (appliedFilters.target_type) params.target_type = appliedFilters.target_type;
      if (appliedFilters.period_year) params.period_year = appliedFilters.period_year;
      if (appliedFilters.period_month) {
        params.period_month = appliedFilters.period_month;
      }

      const res = await axiosInstance.get('/dms/targets', { params });
      setRows(res.data?.data || []);
      setTotalItems(res.data?.total || 0);
      setTotalPages(res.data?.totalPages || 1);
    } catch (err) {
      setError(
        err?.response?.data?.message || err.message || 'Failed to load targets',
      );
      setRows([]);
    } finally {
      setLoading(false);
    }
  }, [page, pageSize, appliedFilters]);

  useEffect(() => {
    fetchRows();
  }, [fetchRows]);

  const handleFilterChange = (key, value) => {
    setTempFilters((prev) => ({ ...prev, [key]: value }));
  };

  const applyFilters = () => {
    setAppliedFilters({ ...tempFilters });
    setPage(1);
  };

  const clearFilters = () => {
    setTempFilters({ ...emptyFilters });
    setAppliedFilters({ ...emptyFilters });
    setPage(1);
  };

  const confirmDelete = async () => {
    if (!deleteRow?.id) return;
    try {
      setDeleting(true);
      await axiosInstance.delete(`/dms/targets/${deleteRow.id}`);
      toast.success('Target removed');
      setDeleteRow(null);
      fetchRows();
    } catch (err) {
      toast.error(err?.response?.data?.message || 'Failed to remove target');
    } finally {
      setDeleting(false);
    }
  };

  return (
    <>
      <Navbar />
      <div className="list-wrapper">
        <PageHeader
          title="Targets"
          onRefresh={fetchRows}
          refreshing={loading}
          showFilterToggle
          filtersOpen={filtersOpen}
          onFilterToggle={toggleFilters}
          showAdd={canCreate}
          addPath="/dms/targets/add"
          addTitle="Assign Target"
          backPath="/welcome"
        />

        {error ? <div className="error-message">{error}</div> : null}

        <CollapsibleFilters open={filtersOpen}>
          <SearchFilter
            filterKey="search"
            label="Search"
            placeholder="User name, email, notes…"
            filters={tempFilters}
            onFilterChange={handleFilterChange}
          />
          <DropdownFilter
            filterKey="target_type"
            label="Type"
            data={[{ value: '', label: 'All types' }, ...TARGET_TYPES]}
            filters={tempFilters}
            onFilterChange={handleFilterChange}
          />
          <DropdownFilter
            filterKey="period_year"
            label="Year"
            data={[{ value: '', label: 'All years' }, ...YEAR_OPTIONS]}
            filters={tempFilters}
            onFilterChange={handleFilterChange}
          />
          <DropdownFilter
            filterKey="period_month"
            label="Month"
            data={[
              { value: '', label: 'All months' },
              ...MONTH_OPTIONS.map((m) => ({
                value: String(m.value),
                label: m.label,
              })),
            ]}
            filters={tempFilters}
            onFilterChange={handleFilterChange}
          />
          <div style={{ display: 'flex', gap: 8, alignItems: 'flex-end' }}>
            <SearchButton onClick={applyFilters} text="Apply" loading={loading} />
            <ClearButton onClick={clearFilters} text="Clear" />
          </div>
        </CollapsibleFilters>

        <div className="table-container">
          <table className="data-table">
            <thead>
              <tr>
                <th>User</th>
                <th>Type</th>
                <th>Period</th>
                <th>Target Amount</th>
                <th>Notes</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {loading && rows.length === 0 ? (
                <tr>
                  <td colSpan={6} style={{ textAlign: 'center' }}>
                    Loading…
                  </td>
                </tr>
              ) : rows.length === 0 ? (
                <tr>
                  <td colSpan={6} style={{ textAlign: 'center' }}>
                    No targets found
                  </td>
                </tr>
              ) : (
                rows.map((row) => (
                  <tr key={row.id}>
                    <td>{userDisplayName(row.user)}</td>
                    <td>{targetTypeLabel(row.target_type)}</td>
                    <td>
                      {monthLabel(row.period_month)} {row.period_year}
                    </td>
                    <td>{formatTargetAmount(row.target_amount)}</td>
                    <td>{row.notes || '—'}</td>
                    <td>
                      <div className="aid-icon-actions">
                        {canUpdate ? (
                          <button
                            type="button"
                            className="aid-icon-btn aid-icon-btn--edit"
                            title="Edit"
                            onClick={() =>
                              navigate(`/dms/targets/edit/${row.id}`)
                            }
                          >
                            <FiEdit2 />
                          </button>
                        ) : null}
                        {canDelete ? (
                          <button
                            type="button"
                            className="aid-icon-btn aid-icon-btn--warn"
                            title="Remove"
                            onClick={() => setDeleteRow(row)}
                          >
                            <FiTrash2 />
                          </button>
                        ) : null}
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {totalItems > 0 && (
          <Pagination
            currentPage={page}
            totalPages={totalPages}
            totalItems={totalItems}
            pageSize={pageSize}
            onPageChange={setPage}
            onPageSizeChange={(n) => {
              setPageSize(n);
              setPage(1);
            }}
          />
        )}

        <ConfirmationModal
          isOpen={!!deleteRow}
          text={`Remove target for "${userDisplayName(deleteRow?.user)}"? This cannot be undone.`}
          delete
          onConfirm={confirmDelete}
          onCancel={() => (!deleting ? setDeleteRow(null) : null)}
        />
      </div>
    </>
  );
};

export default TargetsList;
