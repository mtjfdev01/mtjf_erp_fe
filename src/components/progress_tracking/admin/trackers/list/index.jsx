import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import axiosInstance from '../../../../../utils/axios';
import Navbar from '../../../../Navbar';
import PageHeader from '../../../../common/PageHeader';
import ActionMenu from '../../../../common/ActionMenu';
import Pagination from '../../../../common/Pagination';
import { SearchFilter } from '../../../../common/filters';
import { SearchButton, ClearButton } from '../../../../common/filters';
import { FiEye } from 'react-icons/fi';




const TrackersList = () => {
  const navigate = useNavigate();
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [totalItems, setTotalItems] = useState(0);
  const [totalPages, setTotalPages] = useState(1);

  const [tempFilters, setTempFilters] = useState({ search: '' });
  const [appliedFilters, setAppliedFilters] = useState({ search: '' });

  const fetchData = async () => {
    setLoading(true);
    setError('');
    try {
      const params = {
        page: currentPage,
        pageSize,
        search: appliedFilters.search || undefined,
      };
      const res = await axiosInstance.get('/progress/trackers', { params });
      if (res.data?.success) {
        setRows(res.data.data || []);
        setTotalItems(res.data.pagination?.total || 0);
        setTotalPages(res.data.pagination?.totalPages || 1);
      } else {
        setError(res.data?.message || 'Failed to load trackers');
      }
    } catch (e) {
      setError(e.response?.data?.message || 'Failed to load trackers');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentPage, pageSize, appliedFilters]);

  const handleFilterChange = (key, value) => setTempFilters((p) => ({ ...p, [key]: value }));
  const handleApply = () => {
    setAppliedFilters(tempFilters);
    setCurrentPage(1);
  };
  const handleClear = () => {
    const empty = { search: '' };
    setTempFilters(empty);
    setAppliedFilters(empty);
    setCurrentPage(1);
  };

  const actionsFor = (t) => [
    {
      icon: <FiEye />,
      label: 'View',
      color: '#4CAF50',
      onClick: () => navigate(`/progress/trackers/${t.id}`),
      visible: true,
    },
  ];

  if (loading) {
    return (
      <>
        <Navbar />
        <div className="list-wrapper">
          <PageHeader title="Progress Trackers" showBackButton={false} />
          <div className="loading">Loading...</div>
        </div>
      </>
    );
  }

  return (
    <>
      <Navbar />
      <div className="list-wrapper">
        <PageHeader
          title="Progress Trackers"
          showBackButton={false}
          showAdd={true}
          addPath="/progress/trackers/add"
          addTitle="Create tracker"
        />
        <div className="list-content">
          {error && <div className="status-message status-message--error">{error}</div>}

          <div className="filters-section" style={{ display: 'flex', gap: '12px', flexWrap: 'wrap', marginBottom: '14px' }}>
            <SearchFilter
              filterKey="search"
              label="Search"
              filters={tempFilters}
              onFilterChange={handleFilterChange}
              placeholder="Search by template/donation id..."
            />
            <div style={{ display: 'flex', gap: '10px', alignItems: 'flex-end' }}>
              <SearchButton onClick={handleApply} text="Search" loading={loading} />
              <ClearButton onClick={handleClear} text="Clear" />
            </div>
          </div>

          <div className="table-container">
            <table className="data-table">
              <thead>
                <tr>
                  <th>ID</th>
                  <th>Template</th>
                  <th className="hide-on-mobile">Donation ID</th>
                  <th>Overall</th>
                  <th className="table-actions">Actions</th>
                </tr>
              </thead>
              <tbody>
                {rows.map((t) => (
                  <tr key={t.id}>
                    <td>{t.id}</td>
                    <td>{t?.template?.name || '-'}</td>
                    <td className="hide-on-mobile">{t.donation_id || '-'}</td>
                    <td>{t.overall_status}</td>
                    <td className="table-actions">
                      <ActionMenu actions={actionsFor(t)} />
                    </td>
                  </tr>
                ))}
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
              onPageSizeChange={(ps) => {
                setPageSize(ps);
                setCurrentPage(1);
              }}
              onSortChange={() => {}}
              sortOptions={[]}
            />
          )}

          {rows.length === 0 && totalItems === 0 && (
            <div className="empty-state" style={{ padding: '20px' }}>
              No trackers found.
            </div>
          )}
        </div>
      </div>
    </>
  );
};

export default TrackersList;

