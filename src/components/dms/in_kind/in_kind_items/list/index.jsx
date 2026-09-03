import React, { useState, useEffect, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { FiEye, FiEdit2, FiTrash2 } from 'react-icons/fi';
import ActionMenu from '../../../../common/ActionMenu';
import ConfirmationModal from '../../../../common/ConfirmationModal';
import Pagination from '../../../../common/Pagination';
import axiosInstance from '../../../../../utils/axios';
import Navbar from '../../../../Navbar';
import PageHeader from '../../../../common/PageHeader';
import {
  SearchFilter,
  DropdownFilter,
  CollapsibleFilters,
  SearchButton,
  ClearButton,
} from '../../../../common/filters';
import useFiltersPanel from '../../../../../hooks/useFiltersPanel';
import { useAuth } from '../../../../../context/AuthContext';
import { hasPermission } from '../../../../../utils/permissions';
import '../inKindItems.css';

const EMPTY_FILTERS = {
  search: '',
  category: '',
};

const CATEGORY_LABELS = {
  clothing: 'Clothing',
  food: 'Food',
  medical: 'Medical',
  educational: 'Educational',
  electronics: 'Electronics',
  furniture: 'Furniture',
  books: 'Books',
  toys: 'Toys',
  household: 'Household',
  other: 'Other',
};

const categoryOptions = [
  { value: 'clothing', label: 'Clothing' },
  { value: 'food', label: 'Food' },
  { value: 'medical', label: 'Medical' },
  { value: 'educational', label: 'Educational' },
  { value: 'electronics', label: 'Electronics' },
  { value: 'furniture', label: 'Furniture' },
  { value: 'books', label: 'Books' },
  { value: 'toys', label: 'Toys' },
  { value: 'household', label: 'Household' },
  { value: 'other', label: 'Other' },
];

const formatDate = (dateString) => {
  if (!dateString) return '—';
  return new Date(dateString).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });
};

const getCategoryBadge = (category) => {
  const key = String(category || 'other').toLowerCase();
  return (
    <span className={`inkind-category-badge inkind-category-badge--${key}`}>
      {CATEGORY_LABELS[key] || category || 'Other'}
    </span>
  );
};

const getStatusBadge = (item) => {
  const archived = item?.is_archived === true;
  return (
    <span className={`status-badge ${archived ? 'status-cancelled' : 'status-completed'}`}>
      {archived ? 'Archived' : 'Active'}
    </span>
  );
};

const InKindItemsList = () => {
  const { permissions } = useAuth();
  const { filtersOpen, toggleFilters } = useFiltersPanel();

  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [totalPages, setTotalPages] = useState(1);
  const [totalItems, setTotalItems] = useState(0);
  const [sortBy, setSortBy] = useState('created_at');
  const [sortOrder, setSortOrder] = useState('DESC');
  const [tempFilters, setTempFilters] = useState(EMPTY_FILTERS);
  const [appliedFilters, setAppliedFilters] = useState(EMPTY_FILTERS);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [listRefreshNonce, setListRefreshNonce] = useState(0);

  const canCreate = useMemo(
    () =>
      permissions?.super_admin === true ||
      permissions?.fund_raising_manager === true ||
      hasPermission(permissions, 'fund_raising', 'donation_in_kind_items', 'create'),
    [permissions],
  );

  const canUpdate = useMemo(
    () =>
      permissions?.super_admin === true ||
      permissions?.fund_raising_manager === true ||
      hasPermission(permissions, 'fund_raising', 'donation_in_kind_items', 'update'),
    [permissions],
  );

  const canDelete = useMemo(
    () =>
      permissions?.super_admin === true ||
      permissions?.fund_raising_manager === true ||
      hasPermission(permissions, 'fund_raising', 'donation_in_kind_items', 'delete'),
    [permissions],
  );

  const fetchItems = async () => {
    try {
      setLoading(true);
      setError('');

      const params = {
        page: currentPage,
        pageSize,
        sortField: sortBy,
        sortOrder,
      };
      if (appliedFilters.search) params.search = appliedFilters.search;
      if (appliedFilters.category) params.category = appliedFilters.category;

      const response = await axiosInstance.get('/dms/in-kind-items/list', { params });
      const payload = response.data?.data;
      const rows = Array.isArray(payload?.data)
        ? payload.data
        : Array.isArray(payload)
          ? payload
          : [];

      setItems(rows);
      setTotalPages(payload?.totalPages || response.data?.pagination?.totalPages || 1);
      setTotalItems(payload?.total || response.data?.pagination?.total || rows.length);
    } catch (err) {
      console.error('Error fetching in-kind items:', err);
      setError(err.response?.data?.message || 'Failed to fetch in-kind items. Please try again.');
      setItems([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchItems();
  }, [currentPage, pageSize, sortBy, sortOrder, appliedFilters, listRefreshNonce]);

  const handleRefresh = () => setListRefreshNonce((n) => n + 1);

  const handleFilterChange = (key, value) => {
    setTempFilters((prev) => ({ ...prev, [key]: value }));
  };

  const handleApplyFilters = () => {
    setAppliedFilters({ ...tempFilters });
    setCurrentPage(1);
  };

  const handleClearFilters = () => {
    setTempFilters(EMPTY_FILTERS);
    setAppliedFilters(EMPTY_FILTERS);
    setCurrentPage(1);
  };

  const confirmDelete = async () => {
    if (!deleteTarget) return;
    try {
      await axiosInstance.delete(`/dms/in-kind-items/${deleteTarget.id}`);
      setDeleteTarget(null);
      handleRefresh();
    } catch (err) {
      console.error('Error deleting item:', err);
      setError(err.response?.data?.message || 'Failed to delete item. Please try again.');
      setDeleteTarget(null);
    }
  };

  const getRowActions = (item) => [
    {
      icon: <FiEye />,
      label: 'View',
      color: '#4CAF50',
      to: `/dms/in-kind-items/view/${item.id}`,
      visible: true,
    },
    {
      icon: <FiEdit2 />,
      label: 'Edit',
      color: '#2196F3',
      to: `/dms/in-kind-items/edit/${item.id}`,
      visible: canUpdate,
    },
    {
      icon: <FiTrash2 />,
      label: 'Delete',
      color: '#f44336',
      onClick: () => setDeleteTarget(item),
      visible: canDelete,
    },
  ];

  return (
    <>
      <Navbar />
      <div className="list-wrapper">
        <PageHeader
          title="In-Kind Items"
          showBackButton={false}
          showAdd={!!canCreate}
          addPath="/dms/in-kind-items/add"
          showFilterToggle
          filtersOpen={filtersOpen}
          onFilterToggle={toggleFilters}
          onRefresh={handleRefresh}
          refreshing={loading}
        />

        <div className="list-content">
          {error && <div className="status-message status-message--error">{error}</div>}
          {loading && items.length === 0 && <div className="loading">Loading in-kind items...</div>}

          <CollapsibleFilters open={filtersOpen}>
            <div className="filters-section">
              <SearchFilter
                filterKey="search"
                label="Search"
                filters={tempFilters}
                onFilterChange={handleFilterChange}
                placeholder="Search by item name..."
              />
              <DropdownFilter
                filterKey="category"
                label="Category"
                filters={tempFilters}
                onFilterChange={handleFilterChange}
                data={categoryOptions}
                placeholder="All Categories"
              />
              <div
                style={{
                  display: 'flex',
                  gap: '10px',
                  alignItems: 'flex-end',
                  marginTop: '20px',
                  width: '100%',
                }}
              >
                <SearchButton onClick={handleApplyFilters} text="Search" loading={loading} />
                <ClearButton onClick={handleClearFilters} text="Clear" />
              </div>
            </div>
          </CollapsibleFilters>

          <div
            style={{
              display: 'flex',
              justifyContent: 'flex-end',
              gap: '10px',
              alignItems: 'center',
              marginBottom: '0.75rem',
            }}
          >
            <label style={{ fontSize: '14px', color: '#374151' }}>Sort by:</label>
            <select
              value={sortBy}
              onChange={(e) => {
                setSortBy(e.target.value);
                setCurrentPage(1);
              }}
              style={{ padding: '6px 12px', border: '1px solid #d1d5db', borderRadius: '4px' }}
            >
              <option value="name">Item Name</option>
              <option value="category">Category</option>
              <option value="created_at">Created Date</option>
              <option value="updated_at">Updated Date</option>
            </select>
            <button
              type="button"
              onClick={() => setSortOrder((prev) => (prev === 'ASC' ? 'DESC' : 'ASC'))}
              className="secondary_btn"
              style={{ padding: '6px 12px' }}
            >
              {sortOrder === 'ASC' ? '↑' : '↓'}
            </button>
          </div>

          <div className="table-container">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Item Name</th>
                  <th>Category</th>
                  <th className="hide-on-mobile">Description</th>
                  <th>Status</th>
                  <th className="hide-on-mobile">Created</th>
                  <th className="table-actions">Actions</th>
                </tr>
              </thead>
              <tbody>
                {!loading && items.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="no-data">
                      No in-kind items found
                    </td>
                  </tr>
                ) : (
                  items.map((item) => (
                    <tr key={item.id}>
                      <td>
                        <Link
                          to={`/dms/in-kind-items/view/${item.id}`}
                          className="inkind-item-name"
                          style={{ color: 'inherit', textDecoration: 'inherit' }}
                        >
                          {item.name}
                        </Link>
                      </td>
                      <td>{getCategoryBadge(item.category)}</td>
                      <td className="hide-on-mobile">
                        <div className="inkind-item-description" title={item.description || ''}>
                          {item.description || '—'}
                        </div>
                      </td>
                      <td>{getStatusBadge(item)}</td>
                      <td className="hide-on-mobile">{formatDate(item.created_at)}</td>
                      <td className="table-actions" onClick={(e) => e.stopPropagation()}>
                        <ActionMenu actions={getRowActions(item)} />
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

      <ConfirmationModal
        isOpen={!!deleteTarget}
        text={`Are you sure you want to delete "${deleteTarget?.name || ''}"? This action cannot be undone.`}
        delete
        onConfirm={confirmDelete}
        onCancel={() => setDeleteTarget(null)}
      />
    </>
  );
};

export default InKindItemsList;
