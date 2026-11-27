import React, { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { FiEye } from 'react-icons/fi';
import axiosInstance from '../../../../utils/axios';
import { useAuth } from '../../../../context/AuthContext';
import Navbar from '../../../Navbar';
import PageHeader from '../../../common/PageHeader';
import ActionMenu from '../../../common/ActionMenu';
import Pagination from '../../../common/Pagination';
import {
  SearchFilter,
  SearchButton,
  ClearButton,
  CollapsibleFilters,
  DropdownFilter,
} from '../../../common/filters';
import useFiltersPanel from '../../../../hooks/useFiltersPanel';

const STATUS_OPTIONS = [
  { value: 'pending', label: 'Pending' },
  { value: 'approved', label: 'Approved' },
  { value: 'rejected', label: 'Rejected' },
  { value: 'cancelled', label: 'Cancelled' },
];

const SCOPE_OPTIONS = [
  { value: 'all', label: 'All queries' },
  { value: 'mine', label: 'Requested by me' },
  { value: 'for_me', label: 'Awaiting my approval' },
];

const emptyFilters = {
  search: '',
  status: 'pending',
  scope: 'all',
};

const formatUser = (user) => {
  if (!user) return '—';
  const name = `${user.first_name || ''} ${user.last_name || ''}`.trim();
  return name || user.email || `User #${user.id}`;
};

const formatDate = (value) => {
  if (!value) return '—';
  return new Date(value).toLocaleString('en-GB', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
};

const OperationalQueriesList = () => {
  const { user } = useAuth();
  const { filtersOpen, toggleFilters } = useFiltersPanel();
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(20);
  const [totalItems, setTotalItems] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [tempFilters, setTempFilters] = useState(emptyFilters);
  const [appliedFilters, setAppliedFilters] = useState(emptyFilters);

  const queryParams = useMemo(
    () => ({
      page: currentPage,
      pageSize,
      ...(appliedFilters.status ? { status: appliedFilters.status } : {}),
      ...(appliedFilters.scope ? { scope: appliedFilters.scope } : {}),
      ...(appliedFilters.search?.trim()
        ? { search: appliedFilters.search.trim() }
        : {}),
    }),
    [appliedFilters, currentPage, pageSize],
  );

  const fetchRows = async () => {
    try {
      setLoading(true);
      setError('');
      const res = await axiosInstance.get('/operational-queries', {
        params: queryParams,
      });
      setRows(res.data?.data || []);
      const p = res.data?.pagination;
      if (p) {
        setTotalItems(p.total || 0);
        setTotalPages(p.totalPages || 1);
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to load operational queries');
      setRows([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRows();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [queryParams]);

  const getRowActions = (row) => [
    {
      icon: <FiEye />,
      label: 'View',
      color: '#0284c7',
      to: `/dms/operational-queries/view/${row.id}`,
      visible: true,
    },
  ];

  return (
    <>
      <Navbar />
      <div className="list-wrapper">
        <PageHeader
          title="Operational Queries"
          backPath="/dms/donation_box/list"
          showBackButton
          showFilterToggle
          filtersOpen={filtersOpen}
          onFilterToggle={toggleFilters}
          onRefresh={fetchRows}
          refreshing={loading}
        />

        <div className="list-content">
          {error && <div className="status-message status-message--error">{error}</div>}

          <CollapsibleFilters open={filtersOpen}>
            <div className="filters-section">
              <SearchFilter
                filterKey="search"
                label="Search"
                filters={tempFilters}
                onFilterChange={(key, value) =>
                  setTempFilters((prev) => ({ ...prev, [key]: value }))
                }
                placeholder="Title, reason, query id..."
              />
              <DropdownFilter
                filterKey="status"
                label="Status"
                data={STATUS_OPTIONS}
                filters={tempFilters}
                onFilterChange={(key, value) =>
                  setTempFilters((prev) => ({ ...prev, [key]: value }))
                }
                placeholder="All statuses"
              />
              <DropdownFilter
                filterKey="scope"
                label="Scope"
                data={SCOPE_OPTIONS}
                filters={tempFilters}
                onFilterChange={(key, value) =>
                  setTempFilters((prev) => ({ ...prev, [key]: value }))
                }
                placeholder="All queries"
              />
              <div style={{ display: 'flex', gap: 10, marginTop: 20 }}>
                <SearchButton
                  onClick={() => {
                    setAppliedFilters({ ...tempFilters });
                    setCurrentPage(1);
                  }}
                  text="Search"
                  loading={loading}
                />
                <ClearButton
                  onClick={() => {
                    setTempFilters(emptyFilters);
                    setAppliedFilters(emptyFilters);
                    setCurrentPage(1);
                  }}
                  text="Clear"
                />
              </div>
            </div>
          </CollapsibleFilters>

          <div className="table-container">
            <table className="data-table">
              <thead>
                <tr>
                  <th>ID</th>
                  <th>Title</th>
                  <th>Subject</th>
                  <th>Requested by</th>
                  <th>Approver</th>
                  <th>Status</th>
                  <th>Created</th>
                  <th className="table-actions">Actions</th>
                </tr>
              </thead>
              <tbody>
                {rows.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="no-data">
                      {loading ? (
                        <div className="loading">Loading...</div>
                      ) : (
                        'No operational queries found'
                      )}
                    </td>
                  </tr>
                ) : (
                  rows.map((row) => (
                    <tr key={row.id}>
                      <td>
                        <Link to={`/dms/operational-queries/view/${row.id}`}>
                          #{row.id}
                        </Link>
                      </td>
                      <td>{row.title}</td>
                      <td>
                        {row.subject_meta?.label ||
                          `${row.subject_type} #${row.subject_id}`}
                      </td>
                      <td>{formatUser(row.requested_by)}</td>
                      <td>
                        {formatUser(row.approver)}
                        {user?.id === row.approver_id && row.status === 'pending' ? (
                          <span style={{ color: '#b45309', fontSize: 12, displayBlock: 'block' }}>
                            Needs your decision
                          </span>
                        ) : null}
                      </td>
                      <td>
                        <span className={`status-badge status-${row.status}`}>
                          {row.status}
                        </span>
                      </td>
                      <td>{formatDate(row.created_at)}</td>
                      <td className="table-actions">
                        <ActionMenu actions={getRowActions(row)} />
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          {totalItems > 0 && (
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
          )}
        </div>
      </div>
    </>
  );
};

export default OperationalQueriesList;
