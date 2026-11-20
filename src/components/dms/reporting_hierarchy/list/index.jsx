import React, { useCallback, useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { FiEdit2, FiEye, FiGitBranch, FiPlus, FiList } from 'react-icons/fi';
import { toast } from 'react-toastify';
import axiosInstance from '../../../../utils/axios';
import '../../../../styles/variables.css';
import '../../../../styles/components.css';
import Navbar from '../../../Navbar';
import PageHeader from '../../../common/PageHeader';
import Pagination from '../../../common/Pagination';
import ActionMenu from '../../../common/ActionMenu';
import ReportingHierarchyTabs from '../ReportingHierarchyTabs';
import '../reportingHierarchy.css';

const DEPARTMENTS = [
  'store',
  'procurement',
  'accounts_and_finance',
  'program',
  'admin',
  'fund_raising',
  'hr',
  'it',
  'geographic',
  'tasking',
  'ceo',
];

const ReportingHierarchyList = () => {
  const navigate = useNavigate();
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [department, setDepartment] = useState('');
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(20);
  const [totalPages, setTotalPages] = useState(1);
  const [totalItems, setTotalItems] = useState(0);

  const fetchPeople = useCallback(async () => {
    setLoading(true);
    try {
      const res = await axiosInstance.get('/reporting-hierarchy/people', {
        params: {
          page,
          pageSize,
          search: search.trim() || undefined,
          department: department || undefined,
        },
      });
      const data = res.data?.data;
      setItems(Array.isArray(data?.items) ? data.items : []);
      setTotalPages(data?.pagination?.totalPages || 1);
      setTotalItems(data?.pagination?.total || 0);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to load people');
      setItems([]);
    } finally {
      setLoading(false);
    }
  }, [page, pageSize, search, department]);

  useEffect(() => {
    fetchPeople();
  }, [fetchPeople]);

  return (
    <>
      <Navbar />
      <div className="rh-page">
        <PageHeader
          title="Reporting Hierarchy"
          backPath="/admin/users"
          breadcrumbs={[
            { label: 'DMS Menu', path: '/admin' },
            { label: 'Reporting Hierarchy' },
          ]}
          rightElement={
            <div className="rh-header-actions">
              <button
                type="button"
                className="secondary_btn"
                onClick={() => navigate('/dms/reporting-hierarchy/edges')}
              >
                <FiList style={{ marginRight: 6 }} />
                All edges
              </button>
              <button
                type="button"
                className="primary_btn"
                onClick={() => navigate('/dms/reporting-hierarchy/assign')}
              >
                <FiPlus style={{ marginRight: 6 }} />
                Assign manager
              </button>
            </div>
          }
        />

        <ReportingHierarchyTabs />

        <p className="rh-hint">
          Standalone hierarchy store. Assignments here do not change legacy{' '}
          <code>user.manager_id</code> / team filters yet.
        </p>

        <div className="rh-filters">
          <input
            className="form-input"
            placeholder="Search name or email…"
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setPage(1);
            }}
          />
          <select
            className="form-input"
            value={department}
            onChange={(e) => {
              setDepartment(e.target.value);
              setPage(1);
            }}
          >
            <option value="">All departments</option>
            {DEPARTMENTS.map((d) => (
              <option key={d} value={d}>
                {d}
              </option>
            ))}
          </select>
        </div>

        {loading ? (
          <div className="rh-loading">Loading…</div>
        ) : items.length === 0 ? (
          <div className="rh-empty">
            <FiGitBranch size={28} />
            <p>No users found. Try another search or assign a manager.</p>
          </div>
        ) : (
          <div className="rh-table-wrap">
            <table className="rh-table">
              <thead>
                <tr>
                  <th>Employee</th>
                  <th>Department</th>
                  <th>Primary manager</th>
                  <th>Secondary</th>
                  <th style={{ width: 80 }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {items.map((row) => (
                  <tr key={row.id}>
                    <td>
                      <button
                        type="button"
                        className="rh-link"
                        onClick={() =>
                          navigate(`/dms/reporting-hierarchy/people/${row.id}`)
                        }
                      >
                        {row.display_name}
                      </button>
                      <div className="rh-muted">{row.email}</div>
                    </td>
                    <td>{row.department || '—'}</td>
                    <td>
                      {row.primary_manager?.display_name || (
                        <span className="rh-muted">Unassigned</span>
                      )}
                    </td>
                    <td>
                      {(row.secondary_managers || []).length
                        ? row.secondary_managers
                            .map((m) => m.display_name)
                            .join(', ')
                        : '—'}
                    </td>
                    <td>
                      <ActionMenu
                        items={[
                          {
                            label: 'View',
                            icon: <FiEye />,
                            onClick: () =>
                              navigate(
                                `/dms/reporting-hierarchy/people/${row.id}`,
                              ),
                          },
                          {
                            label: 'Manage',
                            icon: <FiEdit2 />,
                            onClick: () =>
                              navigate(
                                `/dms/reporting-hierarchy/people/${row.id}/edit`,
                              ),
                          },
                        ]}
                      />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        <Pagination
          currentPage={page}
          totalPages={totalPages}
          totalItems={totalItems}
          pageSize={pageSize}
          onPageChange={setPage}
          onPageSizeChange={(size) => {
            setPageSize(size);
            setPage(1);
          }}
        />
      </div>
    </>
  );
};

export default ReportingHierarchyList;
