import React, { useCallback, useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { FiTrash2 } from 'react-icons/fi';
import { toast } from 'react-toastify';
import axiosInstance from '../../../../utils/axios';
import '../../../../styles/variables.css';
import '../../../../styles/components.css';
import Navbar from '../../../Navbar';
import PageHeader from '../../../common/PageHeader';
import Pagination from '../../../common/Pagination';
import ConfirmationModal from '../../../common/ConfirmationModal';
import ActionMenu from '../../../common/ActionMenu';
import ReportingHierarchyTabs from '../ReportingHierarchyTabs';
import '../reportingHierarchy.css';

const ReportingEdgesList = () => {
  const navigate = useNavigate();
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [relationship, setRelationship] = useState('');
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(20);
  const [totalPages, setTotalPages] = useState(1);
  const [totalItems, setTotalItems] = useState(0);
  const [toDelete, setToDelete] = useState(null);
  const [deleting, setDeleting] = useState(false);

  const fetchEdges = useCallback(async () => {
    setLoading(true);
    try {
      const res = await axiosInstance.get('/reporting-hierarchy/edges', {
        params: {
          page,
          pageSize,
          search: search.trim() || undefined,
          relationship: relationship || undefined,
        },
      });
      const data = res.data?.data;
      setItems(Array.isArray(data?.items) ? data.items : []);
      setTotalPages(data?.pagination?.totalPages || 1);
      setTotalItems(data?.pagination?.total || 0);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to load edges');
      setItems([]);
    } finally {
      setLoading(false);
    }
  }, [page, pageSize, search, relationship]);

  useEffect(() => {
    fetchEdges();
  }, [fetchEdges]);

  const handleArchive = async () => {
    if (!toDelete?.id) return;
    setDeleting(true);
    try {
      await axiosInstance.delete(`/reporting-hierarchy/edges/${toDelete.id}`);
      toast.success('Edge archived');
      setToDelete(null);
      fetchEdges();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to archive');
    } finally {
      setDeleting(false);
    }
  };

  return (
    <>
      <Navbar />
      <div className="rh-page">
        <PageHeader
          title="Reporting Hierarchy"
          backPath="/dms/reporting-hierarchy"
          breadcrumbs={[
            { label: 'DMS Menu', path: '/admin' },
            { label: 'Reporting Hierarchy', path: '/dms/reporting-hierarchy' },
            { label: 'Edges' },
          ]}
        />

        <ReportingHierarchyTabs />

        <div className="rh-filters">
          <input
            className="form-input"
            placeholder="Search employee or manager…"
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setPage(1);
            }}
          />
          <select
            className="form-input"
            value={relationship}
            onChange={(e) => {
              setRelationship(e.target.value);
              setPage(1);
            }}
          >
            <option value="">All relationships</option>
            <option value="primary">Primary</option>
            <option value="secondary">Secondary</option>
          </select>
        </div>

        {loading ? (
          <div className="rh-loading">Loading…</div>
        ) : (
          <div className="rh-table-wrap">
            <table className="rh-table">
              <thead>
                <tr>
                  <th>Employee</th>
                  <th>Manager</th>
                  <th>Type</th>
                  <th>Department</th>
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
                          navigate(
                            `/dms/reporting-hierarchy/people/${row.user_id}`,
                          )
                        }
                      >
                        {row.user?.display_name || `#${row.user_id}`}
                      </button>
                    </td>
                    <td>{row.manager?.display_name || `#${row.manager_id}`}</td>
                    <td>
                      <span
                        className={
                          row.relationship === 'primary'
                            ? 'rh-badge rh-badge--primary'
                            : 'rh-badge rh-badge--secondary'
                        }
                      >
                        {row.relationship}
                      </span>
                    </td>
                    <td>{row.department || '—'}</td>
                    <td>
                      <ActionMenu
                        items={[
                          {
                            label: 'Archive',
                            icon: <FiTrash2 />,
                            danger: true,
                            onClick: () => setToDelete(row),
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

      <ConfirmationModal
        isOpen={!!toDelete}
        title="Archive reporting edge?"
        message="This removes the link in the Reporting Hierarchy module only."
        confirmLabel={deleting ? 'Archiving…' : 'Archive'}
        onConfirm={handleArchive}
        onCancel={() => !deleting && setToDelete(null)}
        confirmDisabled={deleting}
      />
    </>
  );
};

export default ReportingEdgesList;
