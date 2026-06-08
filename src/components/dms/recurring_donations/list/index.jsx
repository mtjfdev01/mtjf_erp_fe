import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axiosInstance from '../../../../utils/axios';
import Navbar from '../../../Navbar';
import PageHeader from '../../../common/PageHeader';
import ActionMenu from '../../../common/ActionMenu';
import Pagination from '../../../common/Pagination';
import { SearchFilter, DropdownFilter } from '../../../common/filters';
import { SearchButton, ClearButton } from '../../../common/filters';
import { FiEye, FiRepeat } from 'react-icons/fi';

const STATUS_OPTIONS = [
  { value: 'active', label: 'Active' },
  { value: 'canceled', label: 'Canceled' },
  { value: 'past_due', label: 'Past due' },
  { value: 'failed', label: 'Failed' },
];

const INTERVAL_OPTIONS = [
  { value: 'day', label: 'Daily' },
  { value: 'week', label: 'Weekly' },
  { value: 'month', label: 'Monthly' },
  { value: 'year', label: 'Yearly' },
];

const RecurringDonationsList = () => {
  const navigate = useNavigate();
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [totalItems, setTotalItems] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [sortField, setSortField] = useState('created_at');
  const [sortOrder, setSortOrder] = useState('DESC');
  const [tempFilters, setTempFilters] = useState({ search: '', status: '', billing_interval: '' });
  const [appliedFilters, setAppliedFilters] = useState({ search: '', status: '', billing_interval: '' });

  const handleFilterChange = (key, value) => {
    setTempFilters((prev) => ({ ...prev, [key]: value }));
  };

  const handleApplyFilters = () => {
    if (JSON.stringify(appliedFilters) !== JSON.stringify(tempFilters)) {
      setAppliedFilters(tempFilters);
      setCurrentPage(1);
    } else {
      fetchRows();
    }
  };

  const handleClearFilters = () => {
    const empty = { search: '', status: '', billing_interval: '' };
    setTempFilters(empty);
    setAppliedFilters(empty);
    setCurrentPage(1);
  };

  const fetchRows = async () => {
    try {
      setLoading(true);
      setError('');
      const filters = { ...appliedFilters };
      Object.keys(filters).forEach((k) => !filters[k] && delete filters[k]);

      const response = await axiosInstance.post('/recurring-donations/search', {
        pagination: {
          page: currentPage,
          pageSize,
          sortField,
          sortOrder,
        },
        filters,
      });

      if (response.data.success) {
        setRows(response.data.data || []);
        setTotalItems(response.data.pagination?.total || 0);
        setTotalPages(response.data.pagination?.totalPages || 1);
      } else {
        setError(response.data.message || 'Failed to fetch recurring donations');
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to fetch recurring donations');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRows();
  }, [currentPage, pageSize, sortField, sortOrder, appliedFilters]);

  const formatAmount = (amount, currency = 'PKR') => {
    if (amount == null) return '-';
    return `${currency || 'PKR'} ${Number(amount).toLocaleString('en-PK', { minimumFractionDigits: 0 })}`;
  };

  const formatBilling = (interval, count) => {
    if (!interval) return '-';
    const n = count && count > 1 ? `every ${count} ` : 'every ';
    return `${n}${interval}${count > 1 ? 's' : ''}`;
  };

  const getStatusBadge = (status) => {
    const colors = {
      active: '#10b981',
      canceled: '#6b7280',
      past_due: '#f59e0b',
      failed: '#ef4444',
    };
    return (
      <span
        style={{
          padding: '4px 8px',
          borderRadius: '4px',
          backgroundColor: colors[status] || '#6b7280',
          color: 'white',
          fontSize: '12px',
          textTransform: 'capitalize',
        }}
      >
        {(status || '-').replace(/_/g, ' ')}
      </span>
    );
  };

  const getActions = (row) => [
    {
      icon: <FiEye />,
      label: 'View',
      color: '#2196f3',
      onClick: () => navigate(`/dms/recurring-donations/view/${row.id}`),
      visible: true,
    },
  ];

  if (loading && rows.length === 0) {
    return (
      <>
        <Navbar />
        <div className="list-wrapper">
          <PageHeader title="Recurring Donations" />
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
          title="Recurring Donations"
          subtitle="Stripe subscriptions and installment history"
          icon={<FiRepeat />}
        />

        {error && <div className="error-message">{error}</div>}

        <div className="filters-section">
          <SearchFilter
            value={tempFilters.search}
            onChange={(v) => handleFilterChange('search', v)}
            placeholder="Search subscription, order, donor..."
          />
          <DropdownFilter
            label="Status"
            value={tempFilters.status}
            onChange={(v) => handleFilterChange('status', v)}
            options={STATUS_OPTIONS}
          />
          <DropdownFilter
            label="Billing"
            value={tempFilters.billing_interval}
            onChange={(v) => handleFilterChange('billing_interval', v)}
            options={INTERVAL_OPTIONS}
          />
          <SearchButton onClick={handleApplyFilters} />
          <ClearButton onClick={handleClearFilters} />
        </div>

        <div className="table-container">
          <table className="data-table">
            <thead>
              <tr>
                <th>ID</th>
                <th>Donor</th>
                <th>Amount</th>
                <th>Billing</th>
                <th>Status</th>
                <th>Installments</th>
                <th>Subscription</th>
                <th>Initial order</th>
                <th>Created</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {rows.length === 0 ? (
                <tr>
                  <td colSpan="10" style={{ textAlign: 'center' }}>
                    No recurring donations found
                  </td>
                </tr>
              ) : (
                rows.map((row) => (
                  <tr key={row.id}>
                    <td>{row.id}</td>
                    <td>
                      <div>{row.donor_name || '-'}</div>
                      <small style={{ color: '#6b7280' }}>{row.donor_email || ''}</small>
                    </td>
                    <td>{formatAmount(row.amount, row.currency)}</td>
                    <td>{formatBilling(row.billing_interval, row.billing_interval_count)}</td>
                    <td>{getStatusBadge(row.status)}</td>
                    <td>{row.installment_count ?? 0}</td>
                    <td style={{ maxWidth: 140, overflow: 'hidden', textOverflow: 'ellipsis' }}>
                      {row.stripe_subscription_id || '-'}
                    </td>
                    <td>{row.initial_order_id || row.initial_donation_id || '-'}</td>
                    <td>
                      {row.created_at
                        ? new Date(row.created_at).toLocaleDateString()
                        : '-'}
                    </td>
                    <td>
                      <ActionMenu actions={getActions(row)} />
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
          onPageSizeChange={(size) => {
            setPageSize(size);
            setCurrentPage(1);
          }}
        />
      </div>
    </>
  );
};

export default RecurringDonationsList;
