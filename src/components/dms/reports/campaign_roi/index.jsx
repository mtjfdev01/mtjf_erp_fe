import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Navbar from '../../../Navbar';
import axios from '../../../../utils/axios';
import './campaignRoi.css';

const currentPeriod = () => {
  const date = new Date();
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
};

const periodOptions = () => {
  const now = new Date();
  return Array.from({ length: 18 }, (_, index) => {
    const date = new Date(now.getFullYear(), now.getMonth() - index, 1);
    return {
      value: `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`,
      label: date.toLocaleString('en-US', { month: 'long', year: 'numeric' }),
    };
  });
};

const formatRs = (value, compact = false) => {
  const amount = Number(value || 0);
  if (compact && Math.abs(amount) >= 1_000_000) {
    return `Rs ${(amount / 1_000_000).toFixed(2).replace(/\.00$/, '')}M`;
  }
  if (compact && Math.abs(amount) >= 1_000) {
    return `Rs ${(amount / 1_000).toFixed(1).replace(/\.0$/, '')}K`;
  }
  return `Rs ${Math.round(amount).toLocaleString('en-US')}`;
};

const metricCards = (summary) => [
  {
    key: 'collected',
    title: 'Total collected',
    value: formatRs(summary.total_collected, true),
    footer:
      summary.target_achieved_pct == null
        ? 'No fundraising target'
        : `${summary.target_achieved_pct}% of fundraising target`,
    tone: 'green',
  },
  {
    key: 'spent',
    title: 'Total spent',
    value: formatRs(summary.total_spent, true),
    footer: 'Itemized campaign expenses',
  },
  {
    key: 'net',
    title: 'Net raised',
    value: formatRs(summary.net_raised, true),
    footer: 'Collected less spend',
  },
  {
    key: 'cost',
    title: 'Cost per Rs 100',
    value:
      summary.cost_per_100 == null
        ? '—'
        : `Rs ${Number(summary.cost_per_100).toFixed(2)}`,
    footer: 'Spend ÷ collected × 100',
  },
  {
    key: 'roi',
    title: 'Net ROI',
    value:
      summary.net_roi_pct == null
        ? '—'
        : `${Number(summary.net_roi_pct).toFixed(1)}%`,
    footer:
      summary.total_spent > 0
        ? `${(Number(summary.total_collected) / Number(summary.total_spent)).toFixed(2)}× collected per rupee spent`
        : 'No spend recorded',
  },
];

const sourceColors = ['#168f83', '#2563eb', '#db3e57', '#8b5cf6', '#64748b', '#d97706'];

const CampaignRoi = () => {
  const navigate = useNavigate();
  const [period, setPeriod] = useState(currentPeriod);
  const [from, setFrom] = useState('');
  const [to, setTo] = useState('');
  const [sortBy, setSortBy] = useState('collected');
  const [limit, setLimit] = useState('10');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [data, setData] = useState(null);

  const fetchData = useCallback(async () => {
    try {
      setLoading(true);
      setError('');
      const response = await axios.get('/dms/campaign-roi', {
        params: {
          period,
          ...(from && to ? { from, to } : {}),
        },
      });
      if (!response.data?.success) {
        throw new Error(response.data?.message || 'Failed to load Campaign ROI');
      }
      setData(response.data.data);
    } catch (err) {
      setError(
        err?.response?.data?.message || err.message || 'Failed to load Campaign ROI',
      );
    } finally {
      setLoading(false);
    }
  }, [from, period, to]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const sortedCampaigns = useMemo(() => {
    const rows = [...(data?.campaigns || [])];
    rows.sort((a, b) => Number(b[sortBy] || 0) - Number(a[sortBy] || 0));
    return rows.slice(0, Number(limit));
  }, [data?.campaigns, limit, sortBy]);

  const chartMax = Math.max(
    1,
    ...(data?.weekly || []).flatMap((row) => [
      Number(row.collected || 0),
      Number(row.spent || 0),
    ]),
  );

  const exportCsv = () => {
    const headers = [
      'Campaign',
      'Target',
      'Collected',
      'Achieved %',
      'Unique donors',
      'Spent',
      'Cost per Rs 100',
      'Net ROI %',
    ];
    const rows = (data?.campaigns || []).map((row) => [
      row.title,
      row.target,
      row.collected,
      row.achieved_pct ?? '',
      row.unique_donors,
      row.spent,
      row.cost_per_100 ?? '',
      row.net_roi_pct ?? '',
    ]);
    const csv = [headers, ...rows]
      .map((row) =>
        row
          .map((cell) => `"${String(cell ?? '').replace(/"/g, '""')}"`)
          .join(','),
      )
      .join('\n');
    const url = URL.createObjectURL(new Blob([csv], { type: 'text/csv' }));
    const link = document.createElement('a');
    link.href = url;
    link.download = `campaign-roi-${from && to ? `${from}-to-${to}` : period}.csv`;
    link.click();
    URL.revokeObjectURL(url);
  };

  return (
    <>
      <Navbar />
      <div className="croi-container">
        <div className="croi-wrap">
          <header className="croi-header">
            <div>
              <h1>{data?.title || 'Campaign ROI'}</h1>
              <p>{data?.subtitle || 'Active campaigns · completed donations'}</p>
            </div>
            <div className="croi-controls">
              <select
                value={period}
                onChange={(event) => {
                  setPeriod(event.target.value);
                  setFrom('');
                  setTo('');
                }}
                aria-label="Reporting month"
              >
                {periodOptions().map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
              <label className="croi-date-control">
                <span>From</span>
                <input
                  type="date"
                  value={from}
                  max={to || undefined}
                  onChange={(event) => setFrom(event.target.value)}
                />
              </label>
              <label className="croi-date-control">
                <span>To</span>
                <input
                  type="date"
                  value={to}
                  min={from || undefined}
                  onChange={(event) => setTo(event.target.value)}
                />
              </label>
              {(from || to) && (
                <button
                  type="button"
                  className="croi-clear-button"
                  onClick={() => {
                    setFrom('');
                    setTo('');
                  }}
                >
                  Clear dates
                </button>
              )}
              <button type="button" onClick={exportCsv} disabled={!data}>
                Export CSV
              </button>
            </div>
          </header>

          {loading && <div className="croi-loading">Loading Campaign ROI…</div>}
          {!loading && error && <div className="croi-error">{error}</div>}

          {!loading && !error && data ? (
            <>
              <div className="croi-kpis">
                {metricCards(data.summary || {}).map((card) => (
                  <article
                    key={card.key}
                    className={`croi-kpi ${card.tone ? `croi-kpi--${card.tone}` : ''}`}
                  >
                    <span>{card.title}</span>
                    <strong>{card.value}</strong>
                    <small>{card.footer}</small>
                  </article>
                ))}
              </div>

              <div className="croi-grid">
                <section className="croi-card">
                  <h2>Collections vs spend</h2>
                  <p>{data.filters?.period_label} · PKR by reporting week</p>
                  <div className="croi-legend">
                    <span><i className="croi-dot croi-dot--collected" />Collected</span>
                    <span><i className="croi-dot croi-dot--spent" />Spend</span>
                  </div>
                  <div className="croi-chart">
                    {(data.weekly || []).map((row) => (
                      <div className="croi-chart__group" key={row.id}>
                        <div className="croi-chart__bars">
                          <div
                            className="croi-chart__bar croi-chart__bar--collected"
                            style={{ height: `${Math.max(2, (Number(row.collected) / chartMax) * 100)}%` }}
                            title={`Collected ${formatRs(row.collected)}`}
                          />
                          <div
                            className="croi-chart__bar croi-chart__bar--spent"
                            style={{ height: `${Math.max(2, (Number(row.spent) / chartMax) * 100)}%` }}
                            title={`Spent ${formatRs(row.spent)}`}
                          />
                        </div>
                        <span>{row.label}</span>
                      </div>
                    ))}
                  </div>
                </section>

                <section className="croi-card">
                  <h2>Collections by source</h2>
                  <p>Attributed donations · one source per donation</p>
                  <div className="croi-source-head">
                    <span>Source</span><span>Collected</span><span>Share</span>
                  </div>
                  {(data.sources || []).length === 0 ? (
                    <div className="croi-empty">No attributed collections this month.</div>
                  ) : (
                    (data.sources || []).map((row, index) => (
                      <div className="croi-source-row" key={row.source}>
                        <span>
                          <i style={{ background: sourceColors[index % sourceColors.length] }} />
                          {row.source}
                        </span>
                        <strong>{formatRs(row.collected)}</strong>
                        <strong>{row.share_pct}%</strong>
                      </div>
                    ))
                  )}
                </section>
              </div>

              <section className="croi-card croi-table-card">
                <div className="croi-table-title">
                  <div>
                    <h2>Top active campaigns</h2>
                    <p>Select a campaign to see its ROI and source breakdown.</p>
                  </div>
                  <div className="croi-table-filters">
                    <select value={sortBy} onChange={(event) => setSortBy(event.target.value)}>
                      <option value="collected">Most collected</option>
                      <option value="spent">Most spent</option>
                      <option value="net_roi_pct">Highest ROI</option>
                      <option value="unique_donors">Most donors</option>
                    </select>
                    <select value={limit} onChange={(event) => setLimit(event.target.value)}>
                      <option value="5">Top 5</option>
                      <option value="10">Top 10</option>
                      <option value="20">Top 20</option>
                    </select>
                  </div>
                </div>
                <div className="croi-table-scroll">
                  <table>
                    <thead>
                      <tr>
                        <th>#</th>
                        <th>Campaign</th>
                        <th>Target</th>
                        <th>Collected</th>
                        <th>Achieved</th>
                        <th>Unique donors</th>
                        <th>Spent</th>
                        <th>Cost per Rs 100</th>
                        <th>Net ROI</th>
                      </tr>
                    </thead>
                    <tbody>
                      {sortedCampaigns.map((row, index) => (
                        <tr key={row.id}>
                          <td>{index + 1}</td>
                          <td>
                            <button
                              type="button"
                              className="croi-campaign-link"
                              onClick={() => navigate(`/dms/campaigns/view/${row.id}`)}
                            >
                              {row.title} ↗
                            </button>
                          </td>
                          <td>{formatRs(row.target)}</td>
                          <td>{formatRs(row.collected)}</td>
                          <td>
                            {row.achieved_pct == null ? '—' : (
                              <div className="croi-progress">
                                <div>
                                  <i style={{ width: `${Math.min(100, row.achieved_pct)}%` }} />
                                </div>
                                <span>{row.achieved_pct}%</span>
                              </div>
                            )}
                          </td>
                          <td>{Number(row.unique_donors).toLocaleString()}</td>
                          <td>{formatRs(row.spent)}</td>
                          <td>{row.cost_per_100 == null ? '—' : `Rs ${Number(row.cost_per_100).toFixed(2)}`}</td>
                          <td>{row.net_roi_pct == null ? '—' : `${row.net_roi_pct}%`}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
                <div className="croi-table-foot">
                  Showing {sortedCampaigns.length} of {(data.campaigns || []).length} active campaigns.
                  Summary figures cover all active campaigns.
                </div>
              </section>
            </>
          ) : null}
        </div>
      </div>
    </>
  );
};

export default CampaignRoi;
