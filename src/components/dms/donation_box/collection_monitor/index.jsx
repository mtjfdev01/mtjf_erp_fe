import React, { useState, useEffect, useCallback, useMemo } from 'react';
import Navbar from '../../../Navbar';
import axios from '../../../../utils/axios';
import { toast } from 'react-toastify';
import {
  FiFileText,
  FiTrendingUp,
  FiTrendingDown,
  FiAlertTriangle,
  FiClock,
  FiBox,
  FiCheckCircle,
} from 'react-icons/fi';
import AssignCollectorModal from './AssignCollectorModal';
import './donationBoxCollectionMonitor.css';

const DonationBoxCollectionMonitor = () => {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [monitorData, setMonitorData] = useState(null);

  // Filters
  const [selectedCity, setSelectedCity] = useState('all');
  const [selectedCollector, setSelectedCollector] = useState('all');
  const [activeStatusPill, setActiveStatusPill] = useState('all');
  const [selectedBox, setSelectedBox] = useState(null);

  // Modal & action state
  const [assignModalOpen, setAssignModalOpen] = useState(false);
  const [reviewingBoxId, setReviewingBoxId] = useState(null);
  const [reviewedBoxIds, setReviewedBoxIds] = useState(new Set());

  // Fetch monitor data
  const fetchMonitorData = useCallback(async (boxIdToSelect = null) => {
    try {
      setLoading(true);
      setError('');
      const params = new URLSearchParams();
      if (selectedCity && selectedCity !== 'all') {
        params.append('city_id', selectedCity);
      }
      if (selectedCollector && selectedCollector !== 'all') {
        params.append('collector_id', selectedCollector);
      }
      if (activeStatusPill && activeStatusPill !== 'all') {
        params.append('status', activeStatusPill);
      }
      if (boxIdToSelect) {
        params.append('selected_box_id', String(boxIdToSelect));
      } else if (selectedBox?.id) {
        params.append('selected_box_id', String(selectedBox.id));
      }

      const response = await axios.get(
        `/donation-box-collections/monitor?${params.toString()}`
      );
      if (response.data?.success) {
        const payload = response.data.data;
        setMonitorData(payload);

        // Keep or select box
        if (boxIdToSelect) {
          const match = payload.boxes?.find((b) => b.id === Number(boxIdToSelect));
          setSelectedBox(match || payload.selected_box || payload.boxes?.[0] || null);
        } else if (payload.selected_box) {
          setSelectedBox(payload.selected_box);
        } else if (payload.boxes?.length > 0) {
          setSelectedBox(payload.boxes[0]);
        }
      } else {
        setError(response.data?.message || 'Failed to load monitor data');
      }
    } catch (err) {
      console.error('Error fetching collection monitor:', err);
      setError(err?.response?.data?.message || err.message || 'Error loading dashboard');
    } finally {
      setLoading(false);
    }
  }, [selectedCity, selectedCollector, activeStatusPill]);

  useEffect(() => {
    fetchMonitorData();
  }, [fetchMonitorData]);

  // Handle Box Row Click
  const handleSelectBox = (box) => {
    setSelectedBox(box);
  };

  // Handle Mark Reviewed
  const handleMarkReviewed = async () => {
    if (!selectedBox) return;
    try {
      setReviewingBoxId(selectedBox.id);
      const res = await axios.post(
        `/donation-box-collections/monitor/mark-reviewed/${selectedBox.id}`,
        { notes: 'Reviewed from Donation Box Collection Workbench' }
      );
      if (res.data?.success) {
        toast.success(res.data.message || `Box ${selectedBox.box_id_no} marked reviewed`);
        setReviewedBoxIds((prev) => new Set(prev).add(selectedBox.id));
      }
    } catch (err) {
      toast.error(err?.response?.data?.message || 'Failed to mark reviewed');
    } finally {
      setReviewingBoxId(null);
    }
  };

  // Handle Assign Collector
  const handleAssignCollector = async (boxId, collectorId) => {
    try {
      const res = await axios.post(
        `/donation-box-collections/monitor/assign-collector/${boxId}`,
        { collector_id: collectorId }
      );
      if (res.data?.success) {
        toast.success(res.data.message || 'Collector assigned successfully');
        fetchMonitorData(boxId);
      }
    } catch (err) {
      toast.error(err?.response?.data?.message || 'Failed to assign collector');
    }
  };

  // Handle Excel Export
  const handleExportExcel = () => {
    const boxes = monitorData?.boxes || [];
    if (boxes.length === 0) {
      toast.info('No boxes to export');
      return;
    }

    const headers = [
      'Box ID',
      'Shop Name',
      'City',
      'Collector',
      'Last Emptied Date',
      'Days Ago',
      'Last Amount (PKR)',
      '3-Month Avg (PKR)',
      'Change (%)',
      'Status',
    ];

    const rows = boxes.map((b) => [
      `"${(b.box_id_no || '').replace(/"/g, '""')}"`,
      `"${(b.shop_name || '').replace(/"/g, '""')}"`,
      `"${(b.city || '').replace(/"/g, '""')}"`,
      `"${(b.collector_name || '').replace(/"/g, '""')}"`,
      `"${b.last_emptied_date || b.last_emptied_display || ''}"`,
      `"${b.days_ago !== null ? b.days_ago : ''}"`,
      `"${b.last_amount || 0}"`,
      `"${b.three_month_avg || 0}"`,
      `"${b.change_pct !== null ? b.change_pct + '%' : ''}"`,
      `"${b.status || 'normal'}"`,
    ]);

    const csvContent =
      '\uFEFF' + [headers.join(','), ...rows.map((r) => r.join(','))].join('\r\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute(
      'download',
      `Donation_Box_Collections_${new Date().toISOString().slice(0, 10)}.csv`
    );
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
    toast.success('Donation box collection data exported successfully');
  };

  // Chart max value calculation
  const chartMaxAmount = useMemo(() => {
    if (!selectedBox?.last_6_months) return 50000;
    const amounts = selectedBox.last_6_months.map((m) => m.amount || 0);
    const max = Math.max(...amounts, 10000);
    return max * 1.15; // 15% headroom
  }, [selectedBox]);

  const kpis = monitorData?.kpis || {
    active_boxes: 184,
    cities_count: 4,
    collected_in_month_formatted: 'PKR 1.63M',
    month_name: 'October',
    previous_month_name: 'September',
    month_growth_pct: -6.3,
    month_growth_text: '▼ 6.3% vs September',
    due_for_collection: 29,
    flagged: 6,
  };

  const filterCounts = monitorData?.filter_counts || {
    all: 10,
    flagged: 2,
    overdue: 3,
    normal: 5,
  };

  const citiesList = monitorData?.cities || [{ id: 'all', name: 'All cities' }];
  const collectorsList = monitorData?.collectors || [
    { id: 'all', name: 'All collectors' },
  ];
  const boxesList = monitorData?.boxes || [];

  return (
    <>
      <Navbar />
      <div className="dbc-container">
        {/* Top Header */}
        <div className="dbc-header">
          <div className="dbc-title-group">
            <h1>Donation Box Collection</h1>
            <p className="dbc-subtitle">
              Every box, when it was last emptied, and whether its collection looks normal.
            </p>
          </div>

          <div className="dbc-header-actions">
            {/* City Dropdown */}
            <div className="dbc-filter-select-wrapper">
              <label className="dbc-filter-label">City</label>
              <select
                className="dbc-select"
                value={selectedCity}
                onChange={(e) => setSelectedCity(e.target.value)}
              >
                {citiesList.map((c) => (
                  <option key={String(c.id)} value={String(c.id)}>
                    {c.name}
                  </option>
                ))}
              </select>
            </div>

            {/* Collector Dropdown */}
            <div className="dbc-filter-select-wrapper">
              <label className="dbc-filter-label">Collector</label>
              <select
                className="dbc-select"
                value={selectedCollector}
                onChange={(e) => setSelectedCollector(e.target.value)}
              >
                {collectorsList.map((col) => (
                  <option key={String(col.id)} value={String(col.id)}>
                    {col.name}
                  </option>
                ))}
              </select>
            </div>

            {/* Export Excel Button */}
            <button
              type="button"
              className="dbc-btn-export"
              onClick={handleExportExcel}
              title="Export current collection overview to Excel"
            >
              <span className="dbc-excel-icon">📊</span>
              <span>Export Excel</span>
            </button>
          </div>
        </div>

        {/* 4 KPI Summary Cards */}
        <div className="dbc-kpis-grid">
          {/* Card 1: Active Boxes */}
          <div className="dbc-kpi-card">
            <div className="dbc-kpi-label">Active boxes</div>
            <div className="dbc-kpi-value">{kpis.active_boxes}</div>
            <div className="dbc-kpi-subtext">Across {kpis.cities_count} cities</div>
          </div>

          {/* Card 2: Collected in Month */}
          <div className="dbc-kpi-card">
            <div className="dbc-kpi-label">Collected in {kpis.month_name}</div>
            <div className="dbc-kpi-value">{kpis.collected_in_month_formatted}</div>
            <div className="dbc-kpi-subtext">
              <span
                className={
                  kpis.month_growth_pct >= 0 ? 'dbc-trend-up' : 'dbc-trend-down'
                }
              >
                {kpis.month_growth_text}
              </span>
            </div>
          </div>

          {/* Card 3: Due for collection */}
          <div className="dbc-kpi-card">
            <div className="dbc-kpi-label">Due for collection</div>
            <div className="dbc-kpi-value dbc-kpi-value--due">
              {kpis.due_for_collection}
            </div>
            <div className="dbc-kpi-subtext">Not emptied in 30+ days</div>
          </div>

          {/* Card 4: Flagged */}
          <div className="dbc-kpi-card">
            <div className="dbc-kpi-label">Flagged</div>
            <div className="dbc-kpi-value dbc-kpi-value--flagged">{kpis.flagged}</div>
            <div className="dbc-kpi-subtext">40%+ below 3-month average</div>
          </div>
        </div>

        {/* Filter Pills */}
        <div className="dbc-pills-row">
          <button
            type="button"
            className={`dbc-pill ${activeStatusPill === 'all' ? 'dbc-pill--active' : ''}`}
            onClick={() => setActiveStatusPill('all')}
          >
            All ({filterCounts.all})
          </button>
          <button
            type="button"
            className={`dbc-pill ${
              activeStatusPill === 'flagged' ? 'dbc-pill--active' : ''
            }`}
            onClick={() => setActiveStatusPill('flagged')}
          >
            Flagged ({filterCounts.flagged})
          </button>
          <button
            type="button"
            className={`dbc-pill ${
              activeStatusPill === 'overdue' ? 'dbc-pill--active' : ''
            }`}
            onClick={() => setActiveStatusPill('overdue')}
          >
            Overdue (30+ days) ({filterCounts.overdue})
          </button>
          <button
            type="button"
            className={`dbc-pill ${
              activeStatusPill === 'normal' ? 'dbc-pill--active' : ''
            }`}
            onClick={() => setActiveStatusPill('normal')}
          >
            Normal ({filterCounts.normal})
          </button>
        </div>

        {/* Main 2-Column Content */}
        <div className="dbc-content-layout">
          {/* Left Table Section */}
          <div className="dbc-table-card">
            <div className="dbc-table-scroll">
              <table className="dbc-table">
                <thead>
                  <tr>
                    <th>Box</th>
                    <th>Location</th>
                    <th>Collector</th>
                    <th>Last emptied</th>
                    <th>Last amount</th>
                    <th>3-mo avg</th>
                    <th>Change</th>
                  </tr>
                </thead>
                <tbody>
                  {boxesList.length === 0 ? (
                    <tr>
                      <td colSpan="7" className="dbc-empty">
                        No donation boxes match the selected filters.
                      </td>
                    </tr>
                  ) : (
                    boxesList.map((box) => {
                      const isSelected = selectedBox?.id === box.id;
                      const isReviewed = reviewedBoxIds.has(box.id);
                      return (
                        <tr
                          key={box.id}
                          className={isSelected ? 'dbc-row--selected' : ''}
                          onClick={() => handleSelectBox(box)}
                        >
                          {/* Box link */}
                          <td>
                            <span className="dbc-box-link">{box.box_id_no}</span>
                          </td>

                          {/* Location */}
                          <td>
                            <div className="dbc-loc-shop">{box.shop_name}</div>
                            <div className="dbc-loc-city">{box.city}</div>
                          </td>

                          {/* Collector */}
                          <td>
                            <span className="dbc-collector">{box.collector_name}</span>
                          </td>

                          {/* Last Emptied */}
                          <td>
                            <div className="dbc-date-main">{box.last_emptied_display}</div>
                            <div className="dbc-date-relative">{box.days_ago_display}</div>
                          </td>

                          {/* Last Amount */}
                          <td>
                            <span className="dbc-amount-last">
                              PKR {Number(box.last_amount || 0).toLocaleString()}
                            </span>
                          </td>

                          {/* 3-Month Average */}
                          <td>
                            <span className="dbc-amount-avg">
                              {box.three_month_avg > 0
                                ? `PKR ${Number(box.three_month_avg).toLocaleString()}`
                                : '—'}
                            </span>
                          </td>

                          {/* Change */}
                          <td>
                            {box.change_pct !== null ? (
                              <span
                                className={`dbc-change-tag ${
                                  box.change_pct > 0
                                    ? 'dbc-change-tag--up'
                                    : box.change_pct < 0
                                    ? 'dbc-change-tag--down'
                                    : 'dbc-change-tag--neutral'
                                }`}
                              >
                                {box.change_pct > 0
                                  ? `▲ ${box.change_pct}%`
                                  : box.change_pct < 0
                                  ? `▼ ${Math.abs(box.change_pct)}%`
                                  : '0%'}
                              </span>
                            ) : (
                              <span className="dbc-change-tag dbc-change-tag--neutral">
                                —
                              </span>
                            )}
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>

            <div className="dbc-table-footer">
              Showing {boxesList.length} of {monitorData?.meta?.total_active_boxes || 184}{' '}
              boxes (sample) · Flag rule: last collection below 60% of its 3-month average
            </div>
          </div>

          {/* Right Selected Box Card */}
          {selectedBox && (
            <div className="dbc-detail-card">
              {/* Header with Box ID and Status Badge */}
              <div className="dbc-detail-header">
                <div className="dbc-detail-box-id">{selectedBox.box_id_no}</div>
                <span className={`dbc-badge dbc-badge--${selectedBox.status}`}>
                  {selectedBox.status}
                </span>
              </div>

              {/* Subtitle */}
              <div className="dbc-detail-subtitle">
                {selectedBox.shop_name}, {selectedBox.city} · Collector:{' '}
                {selectedBox.collector_name}
              </div>

              {/* Bar Chart: Last 6 collections (PKR thousands) */}
              <div className="dbc-chart-section">
                <div className="dbc-chart-title">
                  Last 6 collections (PKR thousands)
                </div>
                <div className="dbc-bar-chart">
                  {selectedBox.last_6_months?.map((m, idx) => {
                    const heightPct =
                      m.amount > 0
                        ? Math.max(16, Math.min(100, Math.round((m.amount / chartMaxAmount) * 100)))
                        : 8;
                    return (
                      <div key={idx} className="dbc-bar-col">
                        <span className="dbc-bar-label-top">{m.display_k}</span>
                        <div
                          className="dbc-bar"
                          style={{ height: `${heightPct}%` }}
                          title={`${m.month}: PKR ${m.amount.toLocaleString()}`}
                        />
                        <span className="dbc-bar-month">{m.month}</span>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Collection Log */}
              <div className="dbc-log-section">
                <div className="dbc-log-title">Collection log</div>
                <div className="dbc-log-list">
                  {selectedBox.collection_log?.map((log, idx) => (
                    <div key={idx} className="dbc-log-item">
                      <div className="dbc-log-left">
                        <span className="dbc-log-date">{log.date}</span>
                        <span className="dbc-log-collector">
                          Collected by {log.collector_name}
                        </span>
                      </div>
                      <div className="dbc-log-right">
                        <span className="dbc-log-amount">
                          PKR {Number(log.amount).toLocaleString()}
                        </span>
                        <span className="dbc-log-notes" title={log.notes}>
                          {log.notes}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Action Buttons */}
              <div className="dbc-detail-actions">
                <button
                  type="button"
                  className="dbc-btn-assign"
                  onClick={() => setAssignModalOpen(true)}
                >
                  Assign collection
                </button>
                <button
                  type="button"
                  className="dbc-btn-reviewed"
                  disabled={reviewingBoxId === selectedBox.id}
                  onClick={handleMarkReviewed}
                >
                  {reviewingBoxId === selectedBox.id
                    ? 'Saving...'
                    : reviewedBoxIds.has(selectedBox.id)
                    ? '✓ Reviewed'
                    : 'Mark reviewed'}
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Assign Collector Modal */}
        <AssignCollectorModal
          isOpen={assignModalOpen}
          onClose={() => setAssignModalOpen(false)}
          box={selectedBox}
          collectors={collectorsList}
          onAssign={handleAssignCollector}
        />
      </div>
    </>
  );
};

export default DonationBoxCollectionMonitor;
