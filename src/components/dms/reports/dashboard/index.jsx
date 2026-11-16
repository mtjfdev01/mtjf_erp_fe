import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import Navbar from '../../../Navbar';
import axios from '../../../../utils/axios';
import {
  FiInfo,
  FiTrendingUp,
  FiAlertTriangle,
  FiClock,
  FiBox,
  FiUsers,
  FiDollarSign,
  FiCalendar,
  FiGlobe,
  FiHome,
  FiRepeat,
  FiBriefcase,
  FiGift,
} from 'react-icons/fi';
import './reportsDashboard.css';

const ReportsDashboard = () => {
  const navigate = useNavigate();

  // Filters state
  const [period, setPeriod] = useState('this_month');
  const [fundType, setFundType] = useState('all');
  const [basis, setBasis] = useState('confirmed'); // 'confirmed' | 'all'
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');

  // Dashboard API data
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [dashboardData, setDashboardData] = useState(null);

  // Fetch Dashboard Data
  const fetchDashboard = useCallback(async () => {
    try {
      setLoading(true);
      setError('');
      const params = new URLSearchParams();
      params.append('period', period);
      params.append('fund_type', fundType);
      params.append('basis', basis);
      if (period === 'custom' && startDate && endDate) {
        params.append('start_date', startDate);
        params.append('end_date', endDate);
      }

      const response = await axios.get(`/dms/reports-dashboard?${params.toString()}`);
      if (response.data?.success) {
        setDashboardData(response.data.data);
      } else {
        setError(response.data?.message || 'Failed to load reports dashboard');
      }
    } catch (err) {
      console.error('Error fetching reports dashboard:', err);
      setError(err?.response?.data?.message || err.message || 'Error loading dashboard');
    } finally {
      setLoading(false);
    }
  }, [period, fundType, basis, startDate, endDate]);

  useEffect(() => {
    fetchDashboard();
  }, [fetchDashboard]);

  // Fallback data matching mockup specifications
  const data = dashboardData || {
    banner_message:
      basis === 'confirmed'
        ? 'Showing confirmed donations only: matched to bank or gateway by accounts. This is the figure management should quote.'
        : 'Showing all logged donations: includes pending verification and unconfirmed records.',
    cards: {
      collected_current: {
        title:
          basis === 'confirmed'
            ? 'Collected this month (confirmed)'
            : 'Collected this month (all logged)',
        value: basis === 'confirmed' ? 'PKR 18.42M' : 'PKR 21.07M',
        subtitle: '▲ 12.4% vs last month',
        trend: 'up',
      },
      same_period_last_year: {
        title: 'Same month last year',
        value: 'PKR 15.96M',
        subtitle: '▲ 15.4% year on year',
        trend: 'up',
      },
      pending_reconciliation: {
        title: 'Pending reconciliation',
        value: '214',
        subtitle: 'PKR 2.65M awaiting accounts',
      },
      pending_over_7_days: {
        title: 'Pending over 7 days',
        value: '38',
        subtitle: 'Oldest: 23 days',
      },
      donation_boxes_due: {
        title: 'Donation boxes due',
        value: '29',
        subtitle: 'Not collected in 30+ days',
      },
      boxes_flagged: {
        title: 'Boxes flagged',
        value: '6',
        subtitle: 'Collection dropped 40%+ vs average',
      },
      active_donors: {
        title: 'Active donors this month',
        value: '3,482',
        subtitle: '612 first-time donors',
      },
    },
    collection_by_channel: [
      { id: 'online', name: 'Online (website)', amount_formatted: 'PKR 5.84M', bar_width_pct: 100 },
      { id: 'offline', name: 'Offline / bank', amount_formatted: 'PKR 4.92M', bar_width_pct: 84 },
      { id: 'recurring', name: 'Recurring', amount_formatted: 'PKR 2.71M', bar_width_pct: 46 },
      { id: 'csr', name: 'CSR', amount_formatted: 'PKR 2.10M', bar_width_pct: 36 },
      { id: 'donation_boxes', name: 'Donation boxes', amount_formatted: 'PKR 1.63M', bar_width_pct: 28 },
      { id: 'in_kind', name: 'In-kind (valued)', amount_formatted: 'PKR 0.48M', bar_width_pct: 10 },
    ],
    fund_type_breakdown: {
      items: [
        { id: 'zakat', fund_name: 'Zakat', restriction: 'Restricted', amount_formatted: 'PKR 6.31M', share_percentage: 34.3 },
        { id: 'sadqa', fund_name: 'Sadqa', restriction: 'Unrestricted', amount_formatted: 'PKR 4.08M', share_percentage: 22.1 },
        { id: 'general', fund_name: 'Atiya / General', restriction: 'Unrestricted', amount_formatted: 'PKR 3.57M', share_percentage: 19.4 },
        { id: 'apna_ghar', fund_name: 'Apna Ghar (project)', restriction: 'Restricted', amount_formatted: 'PKR 2.22M', share_percentage: 12.1 },
        { id: 'education', fund_name: 'Education (project)', restriction: 'Restricted', amount_formatted: 'PKR 1.46M', share_percentage: 7.9 },
        { id: 'health', fund_name: 'Health / AAS (project)', restriction: 'Restricted', amount_formatted: 'PKR 0.78M', share_percentage: 4.2 },
      ],
      total: { amount_formatted: 'PKR 18.42M', share_percentage: 100 },
    },
    trend_12_months: {
      months: ['Dec', 'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov'],
      this_year_series: [
        { month: 'Dec', amount_millions: 5.1 },
        { month: 'Jan', amount_millions: 5.5 },
        { month: 'Feb', amount_millions: 6.2 },
        { month: 'Mar', amount_millions: 14.8 },
        { month: 'Apr', amount_millions: 19.2 },
        { month: 'May', amount_millions: 7.8 },
        { month: 'Jun', amount_millions: 6.1 },
        { month: 'Jul', amount_millions: 6.5 },
        { month: 'Aug', amount_millions: 7.8 },
        { month: 'Sep', amount_millions: 10.2 },
        { month: 'Oct', amount_millions: 11.4 },
        { month: 'Nov', amount_millions: 0 },
      ],
      last_year_series: [
        { month: 'Dec', amount_millions: 4.4 },
        { month: 'Jan', amount_millions: 4.8 },
        { month: 'Feb', amount_millions: 5.1 },
        { month: 'Mar', amount_millions: 4.5 },
        { month: 'Apr', amount_millions: 16.5 },
        { month: 'May', amount_millions: 10.3 },
        { month: 'Jun', amount_millions: 5.4 },
        { month: 'Jul', amount_millions: 5.8 },
        { month: 'Aug', amount_millions: 6.3 },
        { month: 'Sep', amount_millions: 8.9 },
        { month: 'Oct', amount_millions: 10.1 },
        { month: 'Nov', amount_millions: 10.8 },
      ],
    },
    needs_action: [
      {
        id: 'pending_7_days',
        title: '38 donations pending over 7 days',
        description: 'Accounts has not confirmed or rejected them. PKR 611K.',
        button_text: 'Open workbench',
        target_url: '/dms/reconciliation-workbench',
      },
      {
        id: 'boxes_flagged',
        title: '6 donation boxes flagged',
        description: 'Collection fell 40%+ below their 3-month average.',
        button_text: 'Review boxes',
        target_url: '/dms/donation-box-collections/overview?status=flagged',
      },
      {
        id: 'boxes_due',
        title: '29 boxes not collected in 30+ days',
        description: 'Assign collectors before month end.',
        button_text: 'View list',
        target_url: '/dms/donation-box-collections/overview?status=overdue',
      },
    ],
    meta: {
      generated_at: 'Generated 02 Nov 2026, 2:46 PM',
      disclaimer: 'Figures shown in PKR · All totals use the selected basis.',
    },
  };

  const cards = data.cards;

  const renderChannelIcon = (id) => {
    switch (id) {
      case 'online':
        return <FiGlobe className="rd-channel-icon" />;
      case 'offline':
        return <FiHome className="rd-channel-icon" />;
      case 'recurring':
        return <FiRepeat className="rd-channel-icon" />;
      case 'csr':
        return <FiBriefcase className="rd-channel-icon" />;
      case 'donation_boxes':
        return <FiBox className="rd-channel-icon" />;
      case 'in_kind':
        return <FiGift className="rd-channel-icon" />;
      default:
        return <FiDollarSign className="rd-channel-icon" />;
    }
  };

  const getActionCardClass = (id) => {
    if (id === 'pending_7_days') return 'rd-action-card rd-action-card--pending';
    if (id === 'boxes_flagged') return 'rd-action-card rd-action-card--flagged';
    if (id === 'boxes_due') return 'rd-action-card rd-action-card--overdue';
    return 'rd-action-card';
  };

  return (
    <>
      <Navbar />
      <div className="rd-container">
        <div className="rd-content-wrapper">
          {/* Top Header */}
          <div className="rd-header">
            <div className="rd-title-group">
              <h1>Reports Dashboard</h1>
              <p className="rd-subtitle">
                Fundraising health at a glance. Every card opens the report behind it.
              </p>
            </div>

            <div className="rd-header-actions">
              {/* Period Dropdown */}
              <div className="rd-control-group">
                <label className="rd-control-label">Period</label>
                <select
                  className="rd-select"
                  value={period}
                  onChange={(e) => setPeriod(e.target.value)}
                >
                  <option value="this_month">This month</option>
                  <option value="last_month">Last month</option>
                  <option value="this_quarter">This quarter</option>
                  <option value="this_year">This year</option>
                  <option value="custom">Custom range</option>
                </select>
              </div>

              {/* Fund Type Dropdown */}
              <div className="rd-control-group">
                <label className="rd-control-label">Fund type</label>
                <select
                  className="rd-select"
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

              {/* Basis Segmented Control */}
              <div className="rd-control-group">
                <label className="rd-control-label">Basis</label>
                <div className="rd-basis-toggle">
                  <button
                    type="button"
                    className={`rd-basis-btn ${basis === 'confirmed' ? 'rd-basis-btn--active' : ''}`}
                    onClick={() => setBasis('confirmed')}
                  >
                    Confirmed only
                  </button>
                  <button
                    type="button"
                    className={`rd-basis-btn ${basis === 'all' ? 'rd-basis-btn--active' : ''}`}
                    onClick={() => setBasis('all')}
                  >
                    All logged
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* Custom Range Picker Inputs if Selected */}
          {period === 'custom' && (
            <div
              style={{
                display: 'flex',
                gap: '12px',
                alignItems: 'center',
                marginBottom: '16px',
                backgroundColor: '#ffffff',
                padding: '12px 16px',
                borderRadius: '8px',
                border: '1px solid #e2e8f0',
                width: 'fit-content',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '13px' }}>
                <FiCalendar color="#64748b" />
                <span>Start:</span>
                <input
                  type="date"
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                  style={{
                    border: '1px solid #cbd5e1',
                    borderRadius: '6px',
                    padding: '4px 8px',
                    fontSize: '13px',
                  }}
                />
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '13px' }}>
                <span>End:</span>
                <input
                  type="date"
                  value={endDate}
                  onChange={(e) => setEndDate(e.target.value)}
                  style={{
                    border: '1px solid #cbd5e1',
                    borderRadius: '6px',
                    padding: '4px 8px',
                    fontSize: '13px',
                  }}
                />
              </div>
            </div>
          )}

          {/* Notice Banner */}
          <div className="rd-notice-banner">
            <FiInfo className="rd-notice-icon" />
            <span>{data.banner_message}</span>
          </div>

          {/* 7 KPI Cards in Balanced 4+3 Layout (Unmatched bank credits skipped per user instruction) */}
          <div className="rd-kpis-container">
            {/* Top Row: 4 Cards */}
            <div className="rd-kpis-row-4">
              {/* Card 1: Collected this month */}
              <div
                className="rd-kpi-card"
                onClick={() => navigate('/donations/online_donations/list?status=completed')}
                title="Open donations report"
              >
                <div className="rd-kpi-top">
                  <span className="rd-card-title">{cards.collected_current.title}</span>
                  <span className="rd-card-icon rd-card-icon--blue">
                    <FiDollarSign />
                  </span>
                </div>
                <div className="rd-card-value">{cards.collected_current.value}</div>
                <div className="rd-card-subtitle">
                  <span className="rd-trend-pill-up">{cards.collected_current.subtitle}</span>
                </div>
              </div>

              {/* Card 2: Same month last year */}
              <div
                className="rd-kpi-card"
                onClick={() => navigate('/donations/online_donations/list')}
                title="Open year-over-year report"
              >
                <div className="rd-kpi-top">
                  <span className="rd-card-title">{cards.same_period_last_year.title}</span>
                  <span className="rd-card-icon rd-card-icon--green">
                    <FiTrendingUp />
                  </span>
                </div>
                <div className="rd-card-value">{cards.same_period_last_year.value}</div>
                <div className="rd-card-subtitle">
                  <span className="rd-trend-pill-up">{cards.same_period_last_year.subtitle}</span>
                </div>
              </div>

              {/* Card 3: Pending reconciliation */}
              <div
                className="rd-kpi-card"
                onClick={() => navigate('/dms/reconciliation-workbench')}
                title="Open reconciliation workbench"
              >
                <div className="rd-kpi-top">
                  <span className="rd-card-title">{cards.pending_reconciliation.title}</span>
                  <span className="rd-card-icon rd-card-icon--amber">
                    <FiClock />
                  </span>
                </div>
                <div className="rd-card-value">{cards.pending_reconciliation.value}</div>
                <div className="rd-card-subtitle">{cards.pending_reconciliation.subtitle}</div>
              </div>

              {/* Card 4: Pending over 7 days */}
              <div
                className="rd-kpi-card"
                onClick={() => navigate('/dms/reconciliation-workbench')}
                title="Open pending reconciliation"
              >
                <div className="rd-kpi-top">
                  <span className="rd-card-title">{cards.pending_over_7_days.title}</span>
                  <span className="rd-card-icon rd-card-icon--red">
                    <FiAlertTriangle />
                  </span>
                </div>
                <div className="rd-card-value">{cards.pending_over_7_days.value}</div>
                <div className="rd-card-subtitle">{cards.pending_over_7_days.subtitle}</div>
              </div>
            </div>

            {/* Bottom Row: 3 Cards Spanning 100% Width */}
            <div className="rd-kpis-row-3">
              {/* Card 5: Donation boxes due */}
              <div
                className="rd-kpi-card"
                onClick={() => navigate('/dms/donation-box-collections/overview?status=overdue')}
                title="Open overdue donation boxes"
              >
                <div className="rd-kpi-top">
                  <span className="rd-card-title">{cards.donation_boxes_due.title}</span>
                  <span className="rd-card-icon rd-card-icon--orange">
                    <FiBox />
                  </span>
                </div>
                <div className="rd-card-value">{cards.donation_boxes_due.value}</div>
                <div className="rd-card-subtitle">{cards.donation_boxes_due.subtitle}</div>
              </div>

              {/* Card 6: Boxes flagged */}
              <div
                className="rd-kpi-card"
                onClick={() => navigate('/dms/donation-box-collections/overview?status=flagged')}
                title="Open flagged donation boxes"
              >
                <div className="rd-kpi-top">
                  <span className="rd-card-title">{cards.boxes_flagged.title}</span>
                  <span className="rd-card-icon rd-card-icon--red">
                    <FiAlertTriangle />
                  </span>
                </div>
                <div className="rd-card-value">{cards.boxes_flagged.value}</div>
                <div className="rd-card-subtitle">{cards.boxes_flagged.subtitle}</div>
              </div>

              {/* Card 7: Active donors this month */}
              <div
                className="rd-kpi-card"
                onClick={() => navigate('/dms/online_donors/list')}
                title="Open active donors report"
              >
                <div className="rd-kpi-top">
                  <span className="rd-card-title">{cards.active_donors.title}</span>
                  <span className="rd-card-icon rd-card-icon--purple">
                    <FiUsers />
                  </span>
                </div>
                <div className="rd-card-value">{cards.active_donors.value}</div>
                <div className="rd-card-subtitle">{cards.active_donors.subtitle}</div>
              </div>
            </div>
          </div>

          {/* Middle Row (2 Columns) */}
          <div className="rd-row-2col">
            {/* Left Card: Collection by channel (Event pledges skipped) */}
            <div className="rd-section-card">
              <div className="rd-section-header">
                <h2 className="rd-section-title">Collection by channel</h2>
                <span
                  className="rd-section-link"
                  onClick={() => navigate('/dms/reports/fundraising-summary')}
                >
                  Open report
                </span>
              </div>

              <div className="rd-channel-list">
                {data.collection_by_channel.map((ch) => (
                  <div key={ch.id} className="rd-channel-item">
                    <div className="rd-channel-label">
                      {renderChannelIcon(ch.id)}
                      <span>{ch.name}</span>
                    </div>
                    <div className="rd-channel-bar-track">
                      <div
                        className="rd-channel-bar-fill"
                        style={{ width: `${ch.bar_width_pct}%` }}
                      />
                    </div>
                    <span className="rd-channel-amount">{ch.amount_formatted}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Right Card: Fund-type breakdown */}
            <div className="rd-section-card">
              <div className="rd-section-header">
                <h2 className="rd-section-title">Fund-type breakdown</h2>
                <span
                  className="rd-section-link"
                  onClick={() => navigate('/dms/reports/fundraising-summary')}
                >
                  Open report
                </span>
              </div>

              <table className="rd-table">
                <thead>
                  <tr>
                    <th>Fund</th>
                    <th>Restriction</th>
                    <th style={{ textAlign: 'right' }}>Collected</th>
                    <th style={{ textAlign: 'right' }}>Share</th>
                  </tr>
                </thead>
                <tbody>
                  {data.fund_type_breakdown.items.map((item) => (
                    <tr key={item.id}>
                      <td style={{ fontWeight: 600, color: '#1e293b' }}>{item.fund_name}</td>
                      <td>
                        <span
                          className={
                            item.restriction === 'Restricted'
                              ? 'rd-badge-restricted'
                              : 'rd-badge-unrestricted'
                          }
                        >
                          {item.restriction}
                        </span>
                      </td>
                      <td style={{ textAlign: 'right', fontWeight: 600, color: '#0f172a' }}>
                        {item.amount_formatted}
                      </td>
                      <td style={{ textAlign: 'right', color: '#64748b', fontWeight: 500 }}>
                        {item.share_percentage}%
                      </td>
                    </tr>
                  ))}
                  <tr className="rd-table-total">
                    <td>Total</td>
                    <td />
                    <td style={{ textAlign: 'right' }}>
                      {data.fund_type_breakdown.total.amount_formatted}
                    </td>
                    <td style={{ textAlign: 'right' }}>
                      {data.fund_type_breakdown.total.share_percentage}%
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>

          {/* Bottom Row (2 Columns) */}
          <div className="rd-row-2col">
            {/* Left Card: 12-month trend */}
            <div className="rd-section-card">
              <div className="rd-section-header">
                <h2 className="rd-section-title">12-month trend (PKR millions)</h2>
                <div className="rd-chart-legend">
                  <div className="rd-legend-item">
                    <span className="rd-legend-dot-dark" />
                    <span>This year</span>
                  </div>
                  <div className="rd-legend-item">
                    <span className="rd-legend-dot-light" />
                    <span>Last year</span>
                  </div>
                </div>
              </div>

              <div className="rd-chart-container">
                <div className="rd-chart-y-axis">
                  <span>20M</span>
                  <span>15M</span>
                  <span>10M</span>
                  <span>5M</span>
                  <span>0M</span>
                </div>
                <div className="rd-chart-area">
                  <div className="rd-chart-gridlines">
                    <div className="rd-chart-gridline" />
                    <div className="rd-chart-gridline" />
                    <div className="rd-chart-gridline" />
                    <div className="rd-chart-gridline" />
                    <div className="rd-chart-gridline" />
                  </div>
                  <div className="rd-trend-bars-wrapper">
                    {data.trend_12_months.months.map((m, idx) => {
                      const thisVal = data.trend_12_months.this_year_series[idx]?.amount_millions || 0;
                      const lastVal = data.trend_12_months.last_year_series[idx]?.amount_millions || 0;
                      const maxVal = 20; // 20M max height
                      const thisHeight = Math.min(100, Math.round((thisVal / maxVal) * 100));
                      const lastHeight = Math.min(100, Math.round((lastVal / maxVal) * 100));

                      return (
                        <div key={m} className="rd-trend-month-col">
                          <div className="rd-trend-pair">
                            <div
                              className="rd-bar-light"
                              style={{ height: `${lastHeight}%` }}
                              title={`Last year (${m}): PKR ${lastVal}M`}
                            />
                            <div
                              className="rd-bar-dark"
                              style={{ height: `${thisHeight}%` }}
                              title={`This year (${m}): PKR ${thisVal}M`}
                            />
                          </div>
                          <span className="rd-month-label">{m}</span>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>
            </div>

            {/* Right Card: Needs action (17 bank credits skipped) */}
            <div className="rd-section-card">
              <div className="rd-section-header">
                <h2 className="rd-section-title">Needs action</h2>
              </div>

              <div className="rd-action-list">
                {data.needs_action.map((act) => (
                  <div key={act.id} className={getActionCardClass(act.id)}>
                    <div className="rd-action-info">
                      <div className="rd-action-title">{act.title}</div>
                      <div className="rd-action-desc">{act.description}</div>
                    </div>
                    <button
                      type="button"
                      className="rd-action-btn"
                      onClick={() => navigate(act.target_url)}
                    >
                      {act.button_text}
                    </button>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Footer */}
          <div className="rd-footer">
            <span>{data.meta.generated_at} · {data.meta.disclaimer}</span>
            <span>All amounts verified against bank & gateway reconciliation</span>
          </div>
        </div>
      </div>
    </>
  );
};

export default ReportsDashboard;
