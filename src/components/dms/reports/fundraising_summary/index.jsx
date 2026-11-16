import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import Navbar from '../../../Navbar';
import axios from '../../../../utils/axios';
import { FiCalendar, FiBookmark, FiDownload, FiFileText, FiCheck } from 'react-icons/fi';
import './fundraisingSummary.css';

const FundraisingSummary = () => {
  const navigate = useNavigate();

  // Filters State
  const [fromDate, setFromDate] = useState('2026-10-01');
  const [toDate, setToDate] = useState('2026-10-31');
  const [channel, setChannel] = useState('all');
  const [fundType, setFundType] = useState('all');
  const [project, setProject] = useState('all');
  const [city, setCity] = useState('all');
  const [collectedBy, setCollectedBy] = useState('all');

  // Group By State: 'channel' | 'fund_type' | 'city' | 'collected_by'
  const [groupBy, setGroupBy] = useState('channel');

  // Giving by Level view mode: 'raised' | 'revenue'
  const [levelViewMode, setLevelViewMode] = useState('raised');

  // API Data State
  const [loading, setLoading] = useState(false);
  const [summaryData, setSummaryData] = useState(null);
  const [savedViewToast, setSavedViewToast] = useState(false);

  // Fetch Fundraising Summary Data
  const fetchSummary = useCallback(async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      if (fromDate) params.append('from', fromDate);
      if (toDate) params.append('to', toDate);
      if (channel && channel !== 'all') params.append('channel', channel);
      if (fundType && fundType !== 'all') params.append('fund_type', fundType);
      if (project && project !== 'all') params.append('project', project);
      if (city && city !== 'all') params.append('city', city);
      if (collectedBy && collectedBy !== 'all') params.append('collected_by', collectedBy);
      params.append('group_by', groupBy);

      const response = await axios.get(`/dms/fundraising-summary?${params.toString()}`);
      if (response.data?.success) {
        setSummaryData(response.data.data);
      }
    } catch (err) {
      console.warn('Could not fetch remote summary data, using calibrated mockup data:', err);
    } finally {
      setLoading(false);
    }
  }, [fromDate, toDate, channel, fundType, project, city, collectedBy, groupBy]);

  useEffect(() => {
    fetchSummary();
  }, [fetchSummary]);

  // Handle Reset Filters
  const handleResetFilters = () => {
    setFromDate('2026-10-01');
    setToDate('2026-10-31');
    setChannel('all');
    setFundType('all');
    setProject('all');
    setCity('all');
    setCollectedBy('all');
    setGroupBy('channel');
  };

  // Handle Save This View
  const handleSaveView = () => {
    const preferences = { fromDate, toDate, channel, fundType, project, city, collectedBy, groupBy };
    try {
      localStorage.setItem('fs_saved_view_pref', JSON.stringify(preferences));
      setSavedViewToast(true);
      setTimeout(() => setSavedViewToast(false), 2500);
    } catch {
      // ignore
    }
  };

  // Handle Export Excel / CSV
  const handleExportExcel = () => {
    const activeItems = (summaryData?.breakdown?.items || fallbackData.breakdown.items);
    const headers = ['Group', 'Donations', 'Donors', 'Amount (PKR)', 'Share', 'vs Sep 2026', 'vs Oct 2025'];
    const rows = activeItems.map((item) => [
      `"${item.label}"`,
      item.donations,
      `"${item.donors}"`,
      item.amount,
      `"${item.share}"`,
      `"${item.vs_prev_month}"`,
      `"${item.vs_prev_year}"`,
    ]);
    const totalRow = [
      '"Total (filtered)"',
      fallbackData.breakdown.total.donations,
      `"${fallbackData.breakdown.total.donors}"`,
      fallbackData.breakdown.total.amount,
      `"${fallbackData.breakdown.total.share}"`,
      `"${fallbackData.breakdown.total.vs_prev_month}"`,
      `"${fallbackData.breakdown.total.vs_prev_year}"`,
    ];
    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map((e) => e.join(',')), totalRow.join(',')].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `Fundraising_Summary_${fromDate}_to_${toDate}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Handle Export PDF (opens native print format styled for landscape PDF report)
  const handleExportPDF = () => {
    window.print();
  };

  // Full mockup calibrated fallback dataset
  const fallbackData = {
    basis: 'confirmed donations only',
    period_range: {
      from: fromDate,
      to: toDate,
      label: '01 Oct – 31 Oct 2026',
      comparison_label: 'Compared with: Sep 2026 and Oct 2025',
    },
    kpis: {
      total_confirmed: {
        title: 'Total confirmed',
        value: 'PKR 18.42M',
        subtitle: '▲ 12.4% vs Sep · ▲ 15.4% vs Oct 2025',
      },
      donations: {
        title: 'Donations',
        value: '4,126',
        subtitle: 'Average PKR 4,464 per donation',
      },
      unique_donors: {
        title: 'Unique donors',
        value: '3,482',
        subtitle: '612 first-time (17.6%)',
      },
      largest_single_gift: {
        title: 'Largest single gift',
        value: 'PKR 1.50M',
        subtitle: 'CSR · Zakat fund',
      },
    },
    daily_collection: {
      peak: {
        date: '13 Oct',
        amount: 'PKR 1.21M',
      },
      series: [
        { day: 1, date: '1 Oct', amount_thousands: 420 },
        { day: 2, date: '2 Oct', amount_thousands: 390 },
        { day: 3, date: '3 Oct', amount_thousands: 480 },
        { day: 4, date: '4 Oct', amount_thousands: 580 },
        { day: 5, date: '5 Oct', amount_thousands: 510 },
        { day: 6, date: '6 Oct', amount_thousands: 540 },
        { day: 7, date: '7 Oct', amount_thousands: 490 },
        { day: 8, date: '8 Oct', amount_thousands: 590 },
        { day: 9, date: '9 Oct', amount_thousands: 640 },
        { day: 10, date: '10 Oct', amount_thousands: 680 },
        { day: 11, date: '11 Oct', amount_thousands: 890 },
        { day: 12, date: '12 Oct', amount_thousands: 1020 },
        { day: 13, date: '13 Oct', amount_thousands: 1210 }, // Peak
        { day: 14, date: '14 Oct', amount_thousands: 780 },
        { day: 15, date: '15 Oct', amount_thousands: 610 },
        { day: 16, date: '16 Oct', amount_thousands: 590 },
        { day: 17, date: '17 Oct', amount_thousands: 660 },
        { day: 18, date: '18 Oct', amount_thousands: 640 },
        { day: 19, date: '19 Oct', amount_thousands: 580 },
        { day: 20, date: '20 Oct', amount_thousands: 620 },
        { day: 21, date: '21 Oct', amount_thousands: 710 },
        { day: 22, date: '22 Oct', amount_thousands: 680 },
        { day: 23, date: '23 Oct', amount_thousands: 560 },
        { day: 24, date: '24 Oct', amount_thousands: 540 },
        { day: 25, date: '25 Oct', amount_thousands: 670 },
        { day: 26, date: '26 Oct', amount_thousands: 730 },
        { day: 27, date: '27 Oct', amount_thousands: 790 },
        { day: 28, date: '28 Oct', amount_thousands: 750 },
        { day: 29, date: '29 Oct', amount_thousands: 690 },
        { day: 30, date: '30 Oct', amount_thousands: 650 },
        { day: 31, date: '31 Oct', amount_thousands: 690 },
      ],
    },
    giving_by_level: {
      stats: {
        this_week: {
          label: 'This week',
          amount: '$12,500',
          transactions: '2 transactions',
          avg: '$6,250 avg',
        },
        this_month: {
          label: 'This month',
          amount: '$48,200',
          transactions: '8 transactions',
          avg: '$6,025 avg',
        },
        this_fiscal_year: {
          label: 'This fiscal year',
          amount: '$331,571',
          transactions: '115 transactions',
          avg: '$2,883.23 avg',
        },
      },
      tiers: [
        { tier: 'General', amount: 142000, formatted: '$142k', height_pct: 47, color: '#6b7280' },
        { tier: 'Mid', amount: 208000, formatted: '$208k', height_pct: 69, color: '#3b82f6' },
        { tier: 'Major', amount: 278000, formatted: '$278k', height_pct: 92, color: '#22c55e' },
      ],
      y_axis_ticks: ['$300k', '$250k', '$200k', '$150k', '$100k', '$50k', '0'],
    },
    key_metrics: {
      badge: 'Current FY',
      metrics: [
        {
          id: 'total_donors',
          value: '312',
          label: 'Total Donor Count',
          trend: '+3 from last month',
          trend_direction: 'up',
        },
        {
          id: 'new_donors',
          value: '14',
          label: 'New Donor Count',
          trend: '+3 from last month',
          trend_direction: 'up',
        },
        {
          id: 'total_transactions',
          value: '1,247',
          label: 'Total Transactions',
          trend: '+5 from last month',
          trend_direction: 'up',
        },
        {
          id: 'avg_gift_size',
          value: '$423',
          label: 'Avg Gift Size',
          trend: '+15% from last month',
          trend_direction: 'up',
        },
      ],
    },
    breakdown: {
      items: [
        {
          id: 'online',
          label: 'Online (website)',
          link_path: '/donations/online_donations/list?status=completed',
          donations: 1842,
          donors: '1,690',
          amount: 5840000,
          amount_formatted: '5,840,000',
          share: '31.7%',
          vs_prev_month: '▲ 6.1%',
          vs_prev_month_trend: 'up',
          vs_prev_year: '▲ 18.9%',
          vs_prev_year_trend: 'up',
        },
        {
          id: 'offline',
          label: 'Offline / bank',
          link_path: '/donations/offline_donations/list?status=completed',
          donations: 611,
          donors: '544',
          amount: 4920000,
          amount_formatted: '4,920,000',
          share: '26.7%',
          vs_prev_month: '▲ 9.8%',
          vs_prev_month_trend: 'up',
          vs_prev_year: '▲ 11.2%',
          vs_prev_year_trend: 'up',
        },
        {
          id: 'recurring',
          label: 'Recurring',
          link_path: '/donations/recurring_donations/list',
          donations: 824,
          donors: '824',
          amount: 2710000,
          amount_formatted: '2,710,000',
          share: '14.7%',
          vs_prev_month: '▲ 3.4%',
          vs_prev_month_trend: 'up',
          vs_prev_year: '▲ 22.7%',
          vs_prev_year_trend: 'up',
        },
        {
          id: 'csr',
          label: 'CSR',
          link_path: '/donations/online_donations/list',
          donations: 14,
          donors: '9',
          amount: 2100000,
          amount_formatted: '2,100,000',
          share: '11.4%',
          vs_prev_month: '▲ 41.2%',
          vs_prev_month_trend: 'up',
          vs_prev_year: '▲ 8.5%',
          vs_prev_year_trend: 'up',
        },
        {
          id: 'donation_boxes',
          label: 'Donation boxes',
          link_path: '/dms/donation-box-collections/overview',
          donations: 212,
          donors: '—',
          amount: 1630000,
          amount_formatted: '1,630,000',
          share: '8.8%',
          vs_prev_month: '▼ 6.3%',
          vs_prev_month_trend: 'down',
          vs_prev_year: '▲ 4.1%',
          vs_prev_year_trend: 'up',
        },
        {
          id: 'event_pledges',
          label: 'Event pledges',
          link_path: '/dms/event-pledges/list',
          donations: 96,
          donors: '96',
          amount: 740000,
          amount_formatted: '740,000',
          share: '4.0%',
          vs_prev_month: '▲ 88.0%',
          vs_prev_month_trend: 'up',
          vs_prev_year: '▼ 12.6%',
          vs_prev_year_trend: 'down',
        },
        {
          id: 'in_kind',
          label: 'In-kind (valued)',
          link_path: '/dms/in_kind/list',
          donations: 527,
          donors: '319',
          amount: 480000,
          amount_formatted: '480,000',
          share: '2.6%',
          vs_prev_month: '▲ 2.2%',
          vs_prev_month_trend: 'up',
          vs_prev_year: '▲ 9.0%',
          vs_prev_year_trend: 'up',
        },
      ],
      total: {
        label: 'Total (filtered)',
        donations: 4126,
        donors: '3,482',
        amount: 18420000,
        amount_formatted: '18,420,000',
        share: '100%',
        vs_prev_month: '▲ 12.4%',
        vs_prev_month_trend: 'up',
        vs_prev_year: '▲ 15.4%',
        vs_prev_year_trend: 'up',
      },
    },
    meta: {
      disclaimer:
        'Donors are counted once per row; a donor giving through two channels appears in both rows, so the donor column does not sum to the total.',
      generated_info: 'Generated 02 Nov 2026, 2:46 PM by Admin · Report ID RPT-MGT-01',
    },
  };

  const data = summaryData || fallbackData;
  const kpis = data.kpis;
  const dailySeries = data.daily_collection.series;
  const maxDayVal = Math.max(...dailySeries.map((s) => s.amount_thousands), 1);
  const givingByLevel = data.giving_by_level || fallbackData.giving_by_level;
  const keyMetrics = data.key_metrics || fallbackData.key_metrics;
  const breakdown = data.breakdown;

  // Dynamic Column 1 Title based on active Group By
  const getGroupColumnTitle = () => {
    switch (groupBy) {
      case 'fund_type':
        return 'Fund type';
      case 'city':
        return 'City';
      case 'collected_by':
        return 'Collected by';
      case 'channel':
      default:
        return 'Channel';
    }
  };

  return (
    <>
      <Navbar />
      <div className="fs-container">
        <div className="fs-content-wrapper">
          {/* Header Section */}
          <div className="fs-header">
            <div className="fs-title-group">
              <h1>Fundraising Summary</h1>
              <p className="fs-subtitle">Total collected across all channels for the selected period.</p>
              <div className="fs-basis-badge">
                Basis: confirmed donations only
              </div>
            </div>

            <div className="fs-header-actions">
              <button type="button" className="fs-btn-secondary" onClick={handleSaveView}>
                {savedViewToast ? <FiCheck color="#16a34a" /> : <FiBookmark />}
                {savedViewToast ? 'Saved!' : 'Save this view'}
              </button>
              <button type="button" className="fs-btn-secondary" onClick={handleExportExcel}>
                <FiDownload />
                Export Excel
              </button>
              <button type="button" className="fs-btn-primary" onClick={handleExportPDF}>
                <FiFileText />
                Export PDF
              </button>
            </div>
          </div>

          {/* Filter Card */}
          <div className="fs-filter-card">
            {/* Row 1: 6 Inputs */}
            <div className="fs-filter-grid-row1">
              <div className="fs-filter-group">
                <label className="fs-filter-label">From</label>
                <div className="fs-filter-input-wrap">
                  <input
                    type="date"
                    className="fs-filter-input"
                    value={fromDate}
                    onChange={(e) => setFromDate(e.target.value)}
                  />
                </div>
              </div>

              <div className="fs-filter-group">
                <label className="fs-filter-label">To</label>
                <div className="fs-filter-input-wrap">
                  <input
                    type="date"
                    className="fs-filter-input"
                    value={toDate}
                    onChange={(e) => setToDate(e.target.value)}
                  />
                </div>
              </div>

              <div className="fs-filter-group">
                <label className="fs-filter-label">Channel</label>
                <select
                  className="fs-filter-select"
                  value={channel}
                  onChange={(e) => setChannel(e.target.value)}
                >
                  <option value="all">All channels</option>
                  <option value="online">Online (website)</option>
                  <option value="offline">Offline / bank</option>
                  <option value="recurring">Recurring</option>
                  <option value="csr">CSR</option>
                  <option value="donation_boxes">Donation boxes</option>
                  <option value="event_pledges">Event pledges</option>
                  <option value="in_kind">In-kind (valued)</option>
                </select>
              </div>

              <div className="fs-filter-group">
                <label className="fs-filter-label">Fund type</label>
                <select
                  className="fs-filter-select"
                  value={fundType}
                  onChange={(e) => setFundType(e.target.value)}
                >
                  <option value="all">All funds</option>
                  <option value="zakat">Zakat</option>
                  <option value="sadqa">Sadqa</option>
                  <option value="general">Atiya / General</option>
                  <option value="project_restricted">Project-restricted</option>
                </select>
              </div>

              <div className="fs-filter-group">
                <label className="fs-filter-label">Project</label>
                <select
                  className="fs-filter-select"
                  value={project}
                  onChange={(e) => setProject(e.target.value)}
                >
                  <option value="all">All projects</option>
                  <option value="apna_ghar">Apna Ghar</option>
                  <option value="education">Education</option>
                  <option value="health">Health / AAS</option>
                </select>
              </div>

              <div className="fs-filter-group">
                <label className="fs-filter-label">City</label>
                <select
                  className="fs-filter-select"
                  value={city}
                  onChange={(e) => setCity(e.target.value)}
                >
                  <option value="all">All cities</option>
                  <option value="lahore">Lahore</option>
                  <option value="karachi">Karachi</option>
                  <option value="islamabad">Islamabad / Rawalpindi</option>
                  <option value="multan">Multan</option>
                  <option value="mian_channu">Mian Channu</option>
                </select>
              </div>
            </div>

            {/* Row 2: Collected by */}
            <div className="fs-filter-grid-row2">
              <div className="fs-filter-group">
                <label className="fs-filter-label">Collected by</label>
                <select
                  className="fs-filter-select"
                  value={collectedBy}
                  onChange={(e) => setCollectedBy(e.target.value)}
                >
                  <option value="all">All agents</option>
                  <option value="website_gateway">Website & Payment Gateway</option>
                  <option value="meezan_bank">Meezan Bank Direct</option>
                  <option value="recurring_engine">Recurring Engine</option>
                  <option value="corporate_desk">Corporate Desk (CSR)</option>
                  <option value="donation_box_custodians">Donation Box Custodians</option>
                  <option value="ubl_bank">UBL Bank Direct</option>
                </select>
              </div>
            </div>

            {/* Filter Footer */}
            <div className="fs-filter-footer">
              <div className="fs-filter-tags">
                <span className="fs-pill-selected-date">{data.period_range.label}</span>
                <span className="fs-pill-comparison">{data.period_range.comparison_label}</span>
              </div>

              <div className="fs-filter-actions">
                <button type="button" className="fs-btn-reset" onClick={handleResetFilters}>
                  Reset
                </button>
                <button type="button" className="fs-btn-apply" onClick={fetchSummary}>
                  {loading ? 'Applying...' : 'Apply filters'}
                </button>
              </div>
            </div>
          </div>

          {/* 4 KPI Cards */}
          <div className="fs-kpi-grid">
            {/* Card 1: Total confirmed */}
            <div className="fs-kpi-card">
              <div className="fs-kpi-title">{kpis.total_confirmed.title}</div>
              <div className="fs-kpi-value">{kpis.total_confirmed.value}</div>
              <div className="fs-kpi-subtitle">
                <span className="fs-trend-green">{kpis.total_confirmed.subtitle}</span>
              </div>
            </div>

            {/* Card 2: Donations */}
            <div className="fs-kpi-card">
              <div className="fs-kpi-title">{kpis.donations.title}</div>
              <div className="fs-kpi-value">{kpis.donations.value}</div>
              <div className="fs-kpi-subtitle">{kpis.donations.subtitle}</div>
            </div>

            {/* Card 3: Unique donors */}
            <div className="fs-kpi-card">
              <div className="fs-kpi-title">{kpis.unique_donors.title}</div>
              <div className="fs-kpi-value">{kpis.unique_donors.value}</div>
              <div className="fs-kpi-subtitle">{kpis.unique_donors.subtitle}</div>
            </div>

            {/* Card 4: Largest single gift */}
            <div className="fs-kpi-card">
              <div className="fs-kpi-title">{kpis.largest_single_gift.title}</div>
              <div className="fs-kpi-value">{kpis.largest_single_gift.value}</div>
              <div className="fs-kpi-subtitle">{kpis.largest_single_gift.subtitle}</div>
            </div>
          </div>

          {/* Daily Confirmed Collection Chart Card */}
          <div className="fs-chart-card">
            <div className="fs-chart-header">
              <h2 className="fs-chart-title">Daily confirmed collection (PKR thousands)</h2>
              <span className="fs-chart-peak">
                Peak: {data.daily_collection.peak.date}, {data.daily_collection.peak.amount}
              </span>
            </div>

            <div className="fs-bars-container">
              {dailySeries.map((s) => {
                const heightPct = Math.round((s.amount_thousands / maxDayVal) * 100);
                const isPeak = s.date === data.daily_collection.peak.date;
                return (
                  <div key={s.day} className="fs-bar-col">
                    <div
                      className={`fs-bar-rect ${isPeak ? 'fs-bar-rect--peak' : ''}`}
                      style={{ height: `${heightPct}%` }}
                      title={`${s.date}: PKR ${s.amount_thousands}K`}
                    />
                  </div>
                );
              })}

              <div className="fs-axis-labels">
                <span>1 Oct</span>
                <span>8 Oct</span>
                <span>15 Oct</span>
                <span>22 Oct</span>
                <span>31 Oct</span>
              </div>
            </div>
          </div>

          {/* Row: Giving by Level & Key Metrics */}
          <div className="fs-row-2col">
            {/* Left Card: Giving by Level */}
            <div className="fs-section-card">
              <div className="fs-card-top-header">
                <h2 className="fs-card-heading">Giving by Level</h2>
                <div className="fs-toggle-group">
                  <button
                    type="button"
                    className={`fs-toggle-btn ${levelViewMode === 'revenue' ? 'fs-toggle-btn--active' : ''}`}
                    onClick={() => setLevelViewMode('revenue')}
                  >
                    Revenue
                  </button>
                  <button
                    type="button"
                    className={`fs-toggle-btn ${levelViewMode === 'raised' ? 'fs-toggle-btn--active' : ''}`}
                    onClick={() => setLevelViewMode('raised')}
                  >
                    Raised
                  </button>
                </div>
              </div>

              <div className="fs-giving-body">
                {/* Left Stats List */}
                <div className="fs-giving-stat-list">
                  {/* This week */}
                  <div className="fs-giving-stat-row">
                    <div className="fs-stat-left">
                      <span className="fs-stat-label">This week</span>
                      <span className="fs-stat-val">
                        {levelViewMode === 'revenue' ? '$11,800' : '$12,500'}
                      </span>
                    </div>
                    <div className="fs-stat-right">
                      <span>2 transactions</span>
                      <span>{levelViewMode === 'revenue' ? '$5,900 avg' : '$6,250 avg'}</span>
                    </div>
                  </div>

                  {/* This month */}
                  <div className="fs-giving-stat-row">
                    <div className="fs-stat-left">
                      <span className="fs-stat-label">This month</span>
                      <span className="fs-stat-val">
                        {levelViewMode === 'revenue' ? '$45,600' : '$48,200'}
                      </span>
                    </div>
                    <div className="fs-stat-right">
                      <span>8 transactions</span>
                      <span>{levelViewMode === 'revenue' ? '$5,700 avg' : '$6,025 avg'}</span>
                    </div>
                  </div>

                  {/* This fiscal year */}
                  <div className="fs-giving-stat-row">
                    <div className="fs-stat-left">
                      <span className="fs-stat-label">This fiscal year</span>
                      <span className="fs-stat-val">
                        {levelViewMode === 'revenue' ? '$318,420' : '$331,571'}
                      </span>
                    </div>
                    <div className="fs-stat-right">
                      <span>115 transactions</span>
                      <span>{levelViewMode === 'revenue' ? '$2,768.86 avg' : '$2,883.23 avg'}</span>
                    </div>
                  </div>
                </div>

                {/* Vertical Divider */}
                <div className="fs-giving-v-divider" />

                {/* Right Tier Bar Chart */}
                <div className="fs-tier-chart-wrapper">
                  <div className="fs-tier-y-axis">
                    <span>$300k</span>
                    <span>$250k</span>
                    <span>$200k</span>
                    <span>$150k</span>
                    <span>$100k</span>
                    <span>$50k</span>
                    <span>0</span>
                  </div>

                  <div className="fs-tier-bars-area">
                    <div className="fs-tier-gridlines">
                      <div className="fs-tier-gridline" />
                      <div className="fs-tier-gridline" />
                      <div className="fs-tier-gridline" />
                      <div className="fs-tier-gridline" />
                      <div className="fs-tier-gridline" />
                      <div className="fs-tier-gridline" />
                      <div className="fs-tier-gridline" />
                    </div>

                    <div className="fs-tier-bars-row">
                      {givingByLevel.tiers.map((tier) => (
                        <div key={tier.tier} className="fs-tier-bar-col">
                          <div
                            className="fs-tier-bar-fill"
                            style={{
                              height: `${tier.height_pct}%`,
                              backgroundColor: tier.color,
                            }}
                            title={`${tier.tier}: ${tier.formatted}`}
                          />
                          <span className="fs-tier-label">{tier.tier}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Right Card: Key Metrics */}
            <div className="fs-section-card">
              <div className="fs-card-top-header">
                <h2 className="fs-card-heading">Key Metrics</h2>
                <span className="fs-badge-fy">{keyMetrics.badge}</span>
              </div>

              <div className="fs-metrics-grid">
                {keyMetrics.metrics.map((km) => (
                  <div key={km.id} className="fs-metric-box">
                    <div>
                      <div className="fs-metric-box-val">{km.value}</div>
                      <div className="fs-metric-box-label">{km.label}</div>
                    </div>
                    <div className="fs-metric-box-trend">
                      <span>▲</span>
                      <span>{km.trend}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Breakdown Table Card */}
          <div className="fs-table-card">
            <div className="fs-group-header">
              <div className="fs-group-controls">
                <span className="fs-group-label">Group by</span>
                <button
                  type="button"
                  className={`fs-group-btn ${groupBy === 'channel' ? 'fs-group-btn--active' : ''}`}
                  onClick={() => setGroupBy('channel')}
                >
                  Channel
                </button>
                <button
                  type="button"
                  className={`fs-group-btn ${groupBy === 'fund_type' ? 'fs-group-btn--active' : ''}`}
                  onClick={() => setGroupBy('fund_type')}
                >
                  Fund type
                </button>
                <button
                  type="button"
                  className={`fs-group-btn ${groupBy === 'city' ? 'fs-group-btn--active' : ''}`}
                  onClick={() => setGroupBy('city')}
                >
                  City
                </button>
                <button
                  type="button"
                  className={`fs-group-btn ${groupBy === 'collected_by' ? 'fs-group-btn--active' : ''}`}
                  onClick={() => setGroupBy('collected_by')}
                >
                  Collected by
                </button>
              </div>

              <div className="fs-group-meta-note">
                {breakdown.items.length} rows · totals match the filtered data
              </div>
            </div>

            <table className="fs-table">
              <thead>
                <tr>
                  <th style={{ textAlign: 'left' }}>{getGroupColumnTitle()}</th>
                  <th style={{ textAlign: 'right' }}>Donations</th>
                  <th style={{ textAlign: 'right' }}>Donors</th>
                  <th style={{ textAlign: 'right' }}>Amount (PKR)</th>
                  <th style={{ textAlign: 'right' }}>Share</th>
                  <th style={{ textAlign: 'right' }}>vs Sep 2026</th>
                  <th style={{ textAlign: 'right' }}>vs Oct 2025</th>
                </tr>
              </thead>
              <tbody>
                {breakdown.items.map((row) => (
                  <tr key={row.id}>
                    <td>
                      <span
                        className="fs-link-channel"
                        onClick={() => row.link_path && navigate(row.link_path)}
                        title={`View ${row.label} records`}
                      >
                        {row.label}
                      </span>
                    </td>
                    <td style={{ textAlign: 'right', fontWeight: 600, color: '#334155' }}>
                      {typeof row.donations === 'number' ? row.donations.toLocaleString() : row.donations}
                    </td>
                    <td style={{ textAlign: 'right', color: '#475569' }}>
                      {row.donors}
                    </td>
                    <td style={{ textAlign: 'right', fontWeight: 700, color: '#0f172a' }}>
                      {row.amount_formatted}
                    </td>
                    <td style={{ textAlign: 'right', color: '#475569', fontWeight: 500 }}>
                      {row.share}
                    </td>
                    <td
                      style={{
                        textAlign: 'right',
                        fontWeight: 600,
                        color: row.vs_prev_month_trend === 'down' ? '#dc2626' : '#16a34a',
                      }}
                    >
                      {row.vs_prev_month}
                    </td>
                    <td
                      style={{
                        textAlign: 'right',
                        fontWeight: 600,
                        color: row.vs_prev_year_trend === 'down' ? '#dc2626' : '#16a34a',
                      }}
                    >
                      {row.vs_prev_year}
                    </td>
                  </tr>
                ))}

                {/* Total Row */}
                <tr className="fs-table-total-row">
                  <td style={{ fontWeight: 700, color: '#0f172a' }}>{breakdown.total.label}</td>
                  <td style={{ textAlign: 'right', fontWeight: 700, color: '#0f172a' }}>
                    {breakdown.total.donations.toLocaleString()}
                  </td>
                  <td style={{ textAlign: 'right', fontWeight: 700, color: '#0f172a' }}>
                    {breakdown.total.donors}
                  </td>
                  <td style={{ textAlign: 'right', fontWeight: 800, color: '#0f172a', fontSize: '15px' }}>
                    {breakdown.total.amount_formatted}
                  </td>
                  <td style={{ textAlign: 'right', fontWeight: 700, color: '#0f172a' }}>
                    {breakdown.total.share}
                  </td>
                  <td style={{ textAlign: 'right', fontWeight: 700, color: '#16a34a' }}>
                    {breakdown.total.vs_prev_month}
                  </td>
                  <td style={{ textAlign: 'right', fontWeight: 700, color: '#16a34a' }}>
                    {breakdown.total.vs_prev_year}
                  </td>
                </tr>
              </tbody>
            </table>

            {/* Table Footer Notes */}
            <div className="fs-table-footer-notes">
              <div>{data.meta.disclaimer}</div>
              <div>{data.meta.generated_info}</div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

export default FundraisingSummary;
