import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';
import {
  FiUpload,
  FiSearch,
  FiCalendar,
  FiFileText,
  FiRefreshCw,
  FiCheckCircle,
  FiExternalLink,
  FiInbox,
} from 'react-icons/fi';
import { RiFileExcel2Line } from 'react-icons/ri';
import axiosInstance from '../../../utils/axios';
import Navbar from '../../Navbar';
import ReconciliationWorkbenchSlipModal from './ReconciliationWorkbenchSlipModal';
import ReconciliationWorkbenchReviewModal from './ReconciliationWorkbenchReviewModal';
import './reconciliationWorkbench.css';

const TABS = [
  { id: 'all', label: 'All' },
  { id: 'online', label: 'Online Donations' },
  { id: 'offline', label: 'Offline Donations' },
  { id: 'donation_box', label: 'Donation Box Donations' },
  { id: 'recurring', label: 'Recurring Donations' },
];

const RECURRING_SUB_TABS = [
  { id: 'installments', label: 'Pending installments' },
  { id: 'subscriptions', label: 'Pending subscriptions' },
];

const ReconciliationWorkbench = () => {
  const navigate = useNavigate();

  // Tab & Filter States
  const [activeTab, setActiveTab] = useState('recurring');
  const [recurringSubTab, setRecurringSubTab] = useState('installments');
  const [selectedAgeBucket, setSelectedAgeBucket] = useState('all');
  const [search, setSearch] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [page, setPage] = useState(1);
  const limit = 20;

  // Data States
  const [loading, setLoading] = useState(false);
  const [items, setItems] = useState([]);
  const [kpis, setKpis] = useState({
    all_pending: { count: 0, total_amount: 0 },
    age_0_3: { count: 0, total_amount: 0 },
    age_4_7: { count: 0, total_amount: 0 },
    age_8_15: { count: 0, total_amount: 0 },
    age_over_15: { count: 0, total_amount: 0 },
  });
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 20,
    total: 0,
    totalPages: 1,
  });

  // Selection & Modal States
  const [selectedKeys, setSelectedKeys] = useState(new Set());
  const [reviewItem, setReviewItem] = useState(null);
  const [slipAttachment, setSlipAttachment] = useState(null);
  const [slipReference, setSlipReference] = useState('');
  const [bulkLoading, setBulkLoading] = useState(false);

  // Fetch workbench items from API
  const fetchWorkbenchData = useCallback(async () => {
    setLoading(true);
    try {
      const params = {
        tab: activeTab,
        recurring_sub_tab: recurringSubTab,
        age_bucket: selectedAgeBucket,
        page,
        limit,
      };
      if (search.trim()) params.search = search.trim();
      if (startDate) params.start_date = startDate;
      if (endDate) params.end_date = endDate;

      const res = await axiosInstance.get('/reconciliation-workbench/items', { params });
      if (res.data?.success && res.data?.data) {
        setItems(res.data.data.items || []);
        if (res.data.data.kpis) {
          setKpis(res.data.data.kpis);
        }
        if (res.data.data.pagination) {
          setPagination(res.data.data.pagination);
        }
      }
    } catch (err) {
      console.error('Error fetching workbench items:', err);
      toast.error(err.response?.data?.message || 'Failed to load workbench records');
    } finally {
      setLoading(false);
    }
  }, [activeTab, recurringSubTab, selectedAgeBucket, search, startDate, endDate, page, limit]);

  useEffect(() => {
    fetchWorkbenchData();
  }, [fetchWorkbenchData]);

  // Reset pagination when primary filters change
  const handleTabChange = (tabId) => {
    setActiveTab(tabId);
    setSelectedAgeBucket('all');
    setSelectedKeys(new Set());
    setPage(1);
  };

  const handleSubTabChange = (subId) => {
    setRecurringSubTab(subId);
    setSelectedAgeBucket('all');
    setSelectedKeys(new Set());
    setPage(1);
  };

  const handleAgeBucketClick = (bucketKey) => {
    setSelectedAgeBucket(bucketKey);
    setPage(1);
  };

  // Row selection
  const handleSelectAll = (e) => {
    if (e.target.checked) {
      const all = new Set(items.map((i) => `${i.type}_${i.id}`));
      setSelectedKeys(all);
    } else {
      setSelectedKeys(new Set());
    }
  };

  const handleToggleRow = (itemKey) => {
    const updated = new Set(selectedKeys);
    if (updated.has(itemKey)) {
      updated.delete(itemKey);
    } else {
      updated.add(itemKey);
    }
    setSelectedKeys(updated);
  };

  const allSelected = useMemo(() => {
    if (!items.length) return false;
    return items.every((i) => selectedKeys.has(`${i.type}_${i.id}`));
  }, [items, selectedKeys]);

  // Review & Approval Handlers
  const handleApproveItem = async (item, notes) => {
    try {
      const res = await axiosInstance.post('/reconciliation-workbench/approve', {
        type: item.type,
        id: item.id,
        notes,
      });
      if (res.data?.success) {
        toast.success(res.data.message || 'Record approved successfully');
        fetchWorkbenchData();
      }
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to approve record');
      throw err;
    }
  };

  const handleRejectItem = async (item, reason) => {
    try {
      const res = await axiosInstance.post('/reconciliation-workbench/reject', {
        type: item.type,
        id: item.id,
        reason,
      });
      if (res.data?.success) {
        toast.success(res.data.message || 'Record rejected successfully');
        fetchWorkbenchData();
      }
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to reject record');
      throw err;
    }
  };

  // Bulk Approval
  const handleBulkApprove = async () => {
    if (!selectedKeys.size) return;
    const selectedItems = items
      .filter((i) => selectedKeys.has(`${i.type}_${i.id}`))
      .map((i) => ({ type: i.type, id: i.id }));

    if (!window.confirm(`Are you sure you want to approve ${selectedItems.length} selected record(s)?`)) {
      return;
    }

    setBulkLoading(true);
    try {
      const res = await axiosInstance.post('/reconciliation-workbench/bulk-approve', {
        items: selectedItems,
      });
      if (res.data?.success) {
        toast.success(res.data.message || 'Bulk approved successfully');
        setSelectedKeys(new Set());
        fetchWorkbenchData();
      }
    } catch (err) {
      toast.error(err.response?.data?.message || 'Bulk approval failed');
    } finally {
      setBulkLoading(false);
    }
  };

  // View Slip Modal trigger
  const openSlipModal = (attachment, reference) => {
    setSlipAttachment(attachment);
    setSlipReference(reference);
  };

  // Export to CSV / Excel
  const handleExportCsv = () => {
    if (!items.length) {
      toast.info('No records to export');
      return;
    }

    const headers = [
      'Reference',
      'Logged Date',
      'Donor / Entity',
      'Phone',
      'Email',
      'Context / Installment',
      'Bank Reference',
      'Amount (PKR)',
      'Status',
    ];

    const rows = items.map((r) => [
      `"${r.reference || ''}"`,
      `"${r.logged_at || ''}"`,
      `"${(r.donor_name || '').replace(/"/g, '""')}"`,
      `"${r.donor_phone || ''}"`,
      `"${r.donor_email || ''}"`,
      `"${(r.context_info || '').replace(/"/g, '""')}"`,
      `"${(r.bank_reference || '').replace(/"/g, '""')}"`,
      r.amount || 0,
      `"${r.status || 'pending'}"`,
    ]);

    const csvContent =
      '\uFEFF' +
      [headers.join(','), ...rows.map((row) => row.join(','))].join('\r\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    const dateStr = new Date().toISOString().split('T')[0];
    link.setAttribute('download', `Reconciliation_Workbench_${activeTab}_${dateStr}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
    toast.success('Workbench records exported successfully');
  };

  // Dynamic Context Column Header
  const contextHeader = useMemo(() => {
    if (activeTab === 'recurring') {
      return recurringSubTab === 'installments' ? 'Installment' : 'Subscription Plan';
    }
    if (activeTab === 'online' || activeTab === 'offline') {
      return 'Payment Method';
    }
    if (activeTab === 'donation_box') {
      return 'Box & Collector';
    }
    return 'Context / Type';
  }, [activeTab, recurringSubTab]);

  return (
    <>
      <Navbar />

      <div className="rw-page">
        {/* Top Header */}
        <div className="rw-header">
          <h1 className="rw-title">Reconciliation Workbench</h1>
          <div className="rw-header-actions">
            <button
              type="button"
              className="rw-btn-outline"
              onClick={() => navigate('/dms/reconciliation/add')}
            >
              <FiUpload /> Upload bank statement
            </button>
            <button
              type="button"
              className="rw-btn-outline"
              onClick={handleExportCsv}
            >
              <RiFileExcel2Line className="rw-excel-icon" /> Export Excel
            </button>
          </div>
        </div>

        {/* Top Navigation Tabs */}
        <div className="rw-tabs-bar">
          {TABS.map((tab) => (
            <button
              key={tab.id}
              type="button"
              className={`rw-tab ${activeTab === tab.id ? 'active' : ''}`}
              onClick={() => handleTabChange(tab.id)}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Sub-tabs under Recurring Donations */}
        {activeTab === 'recurring' && (
          <div className="rw-subtabs-bar">
            {RECURRING_SUB_TABS.map((sub) => (
              <button
                key={sub.id}
                type="button"
                className={`rw-subtab ${recurringSubTab === sub.id ? 'active' : ''}`}
                onClick={() => handleSubTabChange(sub.id)}
              >
                {sub.label}
              </button>
            ))}
          </div>
        )}

        {/* Filter status pill */}
        <div className="rw-status-pill-row">
          <span className="rw-status-pill">Pending reconciliation</span>
        </div>

        {/* Aging KPI Cards */}
        <div className="rw-kpi-grid">
          <div
            className={`rw-kpi-card ${selectedAgeBucket === 'all' ? 'selected' : ''}`}
            onClick={() => handleAgeBucketClick('all')}
            title="Click to view all pending items"
          >
            <div className="rw-kpi-label">All pending</div>
            <div className="rw-kpi-number-dark">{kpis.all_pending?.count || 0}</div>
            <div className="rw-kpi-subtext">
              PKR {(kpis.all_pending?.total_amount || 0).toLocaleString()}
            </div>
          </div>

          <div
            className={`rw-kpi-card ${selectedAgeBucket === '0_3' ? 'selected' : ''}`}
            onClick={() => handleAgeBucketClick('0_3')}
            title="Click to filter 0-3 days old"
          >
            <div className="rw-kpi-label">0-3 days</div>
            <div className="rw-kpi-number-green">{kpis.age_0_3?.count || 0}</div>
          </div>

          <div
            className={`rw-kpi-card ${selectedAgeBucket === '4_7' ? 'selected' : ''}`}
            onClick={() => handleAgeBucketClick('4_7')}
            title="Click to filter 4-7 days old"
          >
            <div className="rw-kpi-label">4-7 days</div>
            <div className="rw-kpi-number-green">{kpis.age_4_7?.count || 0}</div>
          </div>

          <div
            className={`rw-kpi-card ${selectedAgeBucket === '8_15' ? 'selected' : ''}`}
            onClick={() => handleAgeBucketClick('8_15')}
            title="Click to filter 8-15 days old"
          >
            <div className="rw-kpi-label">8-15 days</div>
            <div className="rw-kpi-number-green">{kpis.age_8_15?.count || 0}</div>
          </div>

          <div
            className={`rw-kpi-card ${selectedAgeBucket === 'over_15' ? 'selected' : ''}`}
            onClick={() => handleAgeBucketClick('over_15')}
            title="Click to filter over 15 days old"
          >
            <div className="rw-kpi-label">Over 15 days</div>
            <div className="rw-kpi-number-green">{kpis.age_over_15?.count || 0}</div>
          </div>
        </div>

        {/* Search & Date Filter Toolbar */}
        <div className="rw-filter-toolbar">
          <div className="rw-search-wrapper">
            <FiSearch className="rw-search-icon" />
            <input
              type="text"
              className="rw-search-input"
              placeholder="Search by donor, phone, reference..."
              value={search}
              onChange={(e) => {
                setSearch(e.target.value);
                setPage(1);
              }}
            />
          </div>

          <div className="rw-filter-actions">
            <div className="rw-date-box">
              <FiCalendar style={{ color: '#64748b' }} />
              <input
                type="date"
                className="rw-date-input"
                value={startDate}
                onChange={(e) => {
                  setStartDate(e.target.value);
                  setPage(1);
                }}
                title="Start date"
              />
              <span style={{ color: '#94a3b8' }}>&ndash;</span>
              <input
                type="date"
                className="rw-date-input"
                value={endDate}
                onChange={(e) => {
                  setEndDate(e.target.value);
                  setPage(1);
                }}
                title="End date"
              />
            </div>

            {(search || startDate || endDate || selectedAgeBucket !== 'all') && (
              <button
                type="button"
                className="rw-btn-outline"
                style={{ padding: '6px 12px', fontSize: 13 }}
                onClick={() => {
                  setSearch('');
                  setStartDate('');
                  setEndDate('');
                  setSelectedAgeBucket('all');
                  setPage(1);
                }}
                title="Reset filters"
              >
                Reset
              </button>
            )}

            <button
              type="button"
              className="rw-btn-outline"
              style={{ padding: '6px 10px' }}
              onClick={fetchWorkbenchData}
              title="Refresh records"
            >
              <FiRefreshCw className={loading ? 'spin' : ''} />
            </button>
          </div>
        </div>

        {/* Full-width Table */}
        <div className="rw-table-container">
          <table className="rw-table">
            <thead>
              <tr>
                <th style={{ width: 40, textAlign: 'center' }}>
                  <input
                    type="checkbox"
                    className="rw-checkbox"
                    checked={allSelected}
                    onChange={handleSelectAll}
                    disabled={!items.length}
                  />
                </th>
                <th>Reference</th>
                <th>Logged</th>
                <th>Donor</th>
                <th>{contextHeader}</th>
                <th>Bank reference</th>
                <th>Attachment</th>
                <th>Amount</th>
                <th style={{ textAlign: 'center', width: 130 }}>Action</th>
              </tr>
            </thead>
            <tbody>
              {loading && !items.length ? (
                <tr>
                  <td colSpan={9} style={{ textAlign: 'center', padding: '60px 0', color: '#64748b' }}>
                    <FiRefreshCw className="spin" style={{ fontSize: 24, marginBottom: 8 }} />
                    <div>Loading workbench records...</div>
                  </td>
                </tr>
              ) : !items.length ? (
                <tr>
                  <td colSpan={9}>
                    <div className="rw-empty-state">
                      <FiInbox className="rw-empty-icon" />
                      <div className="rw-empty-title">No pending records found</div>
                      <div style={{ fontSize: 13.5 }}>
                        {activeTab === 'recurring'
                          ? 'No recurring records with attached documents pending reconciliation.'
                          : 'All records in this view are up to date and reconciled.'}
                      </div>
                    </div>
                  </td>
                </tr>
              ) : (
                items.map((row) => {
                  const rowKey = `${row.type}_${row.id}`;
                  const isChecked = selectedKeys.has(rowKey);
                  const firstAtt = row.attachments && row.attachments.length > 0 ? row.attachments[0] : null;

                  return (
                    <tr key={rowKey} style={isChecked ? { backgroundColor: '#f0fdf4' } : undefined}>
                      <td style={{ textAlign: 'center' }}>
                        <input
                          type="checkbox"
                          className="rw-checkbox"
                          checked={isChecked}
                          onChange={() => handleToggleRow(rowKey)}
                        />
                      </td>

                      <td>
                        <button
                          type="button"
                          className="rw-ref-link"
                          onClick={() => setReviewItem(row)}
                          title="Click to review"
                        >
                          {row.reference}
                        </button>
                      </td>

                      <td style={{ whiteSpace: 'nowrap' }}>
                        {row.logged_at || '—'}
                      </td>

                      <td>
                        <div className="rw-donor-info">
                          <span className="rw-donor-name">{row.donor_name}</span>
                          <span className="rw-donor-contact">{row.donor_contact}</span>
                        </div>
                      </td>

                      <td>
                        <span className="rw-context-badge">
                          {row.context_info || '—'}
                        </span>
                      </td>

                      <td>
                        <span className="rw-bank-ref">
                          {row.bank_reference || '—'}
                        </span>
                      </td>

                      <td>
                        {firstAtt ? (
                          <button
                            type="button"
                            className="rw-slip-link"
                            onClick={() => openSlipModal(firstAtt, row.reference)}
                          >
                            <FiFileText style={{ fontSize: 14 }} /> View slip
                          </button>
                        ) : (
                          <span style={{ color: '#94a3b8' }}>&mdash;</span>
                        )}
                      </td>

                      <td>
                        <span className="rw-amount">
                          {row.currency || 'PKR'} {Number(row.amount).toLocaleString()}
                        </span>
                      </td>

                      <td style={{ textAlign: 'center' }}>
                        <button
                          type="button"
                          className="rw-btn-review"
                          onClick={() => setReviewItem(row)}
                        >
                          Review
                        </button>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>

          {/* Pagination */}
          {pagination.totalPages > 1 && (
            <div className="rw-pagination-bar">
              <div>
                Showing {(pagination.page - 1) * pagination.limit + 1} &ndash;{' '}
                {Math.min(pagination.page * pagination.limit, pagination.total)} of {pagination.total} records
              </div>
              <div style={{ display: 'flex', gap: 6 }}>
                <button
                  type="button"
                  className="rw-page-btn"
                  disabled={pagination.page <= 1}
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                >
                  Previous
                </button>
                <button
                  type="button"
                  className="rw-page-btn"
                  disabled={pagination.page >= pagination.totalPages}
                  onClick={() => setPage((p) => p + 1)}
                >
                  Next
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Floating Bulk Approval Toolbar */}
        {selectedKeys.size > 0 && (
          <div className="rw-bulk-toolbar">
            <span>
              <strong>{selectedKeys.size}</strong> record(s) selected
            </span>
            <button
              type="button"
              className="rw-bulk-btn"
              onClick={handleBulkApprove}
              disabled={bulkLoading}
            >
              <FiCheckCircle />
              {bulkLoading ? 'Approving...' : `Approve Selected (${selectedKeys.size})`}
            </button>
            <button
              type="button"
              className="rw-bulk-clear"
              onClick={() => setSelectedKeys(new Set())}
            >
              Clear selection
            </button>
          </div>
        )}
      </div>

      {/* Review Modal */}
      <ReconciliationWorkbenchReviewModal
        isOpen={Boolean(reviewItem)}
        onClose={() => setReviewItem(null)}
        item={reviewItem}
        onApprove={handleApproveItem}
        onReject={handleRejectItem}
        onViewSlip={openSlipModal}
      />

      {/* Slip Modal (rendered after Review Modal with z-index 1200 so it appears cleanly above) */}
      <ReconciliationWorkbenchSlipModal
        isOpen={Boolean(slipAttachment)}
        onClose={() => setSlipAttachment(null)}
        attachment={slipAttachment}
        reference={slipReference}
      />
    </>
  );
};

export default ReconciliationWorkbench;
