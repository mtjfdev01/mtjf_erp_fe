import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { FiDownload } from 'react-icons/fi';
import Navbar from '../../../Navbar';
import axios from '../../../../utils/axios';
import './managementOverview.css';

const valueToneClass = (tone) => {
  if (tone === 'green') return 'mo-kpi__value mo-kpi__value--green';
  if (tone === 'amber') return 'mo-kpi__value mo-kpi__value--amber';
  if (tone === 'red') return 'mo-kpi__value mo-kpi__value--red';
  if (tone === 'blue') return 'mo-kpi__value mo-kpi__value--blue';
  return 'mo-kpi__value';
};

const deltaClass = (trend) => {
  if (trend === 'up') return 'mo-kpi__delta mo-kpi__delta--up';
  if (trend === 'down') return 'mo-kpi__delta mo-kpi__delta--down';
  return 'mo-kpi__delta';
};

const currentPeriodYm = () => {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
};

const periodOptions = () => {
  const opts = [];
  const now = new Date();
  for (let i = 0; i < 6; i += 1) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    const value = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
    const label = d.toLocaleString('en-US', { month: 'long', year: 'numeric' });
    opts.push({ value, label });
  }
  return opts;
};

const ManagementOverview = () => {
  const [period, setPeriod] = useState(currentPeriodYm);
  const [project, setProject] = useState('all');
  const [office, setOffice] = useState('all');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [data, setData] = useState(null);

  const fetchOverview = useCallback(async () => {
    try {
      setLoading(true);
      setError('');
      setData(null);
      const params = new URLSearchParams();
      params.append('period', period);
      params.append('project', project);
      params.append('office', office);
      const res = await axios.get(
        `/dms/management-overview?${params.toString()}`,
      );
      if (res.data?.success && res.data?.data) {
        setData(res.data.data);
      } else {
        setError(res.data?.message || 'Could not load overview.');
      }
    } catch (err) {
      setError(
        err?.response?.data?.message ||
          err.message ||
          'Could not load overview.',
      );
    } finally {
      setLoading(false);
    }
  }, [period, project, office]);

  useEffect(() => {
    fetchOverview();
  }, [fetchOverview]);

  const view = data || {};
  const cards = view.cards || {};
  const trend = view.monthly_trend || {};
  const channels = view.raised_by_channel || {};
  const projects = view.funds_by_project || {};

  const chartMax = useMemo(() => {
    const totals = (trend.completed || []).map(
      (c, i) => Number(c || 0) + Number(trend.pending?.[i] || 0),
    );
    return Math.max(1, ...totals, 1);
  }, [trend]);

  const kpiOrder = [
    'raised_completed',
    'pending_verification',
    'failed_online',
    'registered_donors',
    'recurring_run_rate',
  ];

  const handleExportPdf = () => {
    window.print();
  };

  return (
    <>
      <Navbar />
      <div className="mo-container">
        <div className="mo-wrap">
          <div className="mo-header">
            <div>
              <div className="mo-title-row">
                <h1>Management Overview</h1>
              </div>
              <p className="mo-subtitle">
                {view.subtitle || 'Fundraising overview'}
              </p>
            </div>

            <div className="mo-filters">
              <div className="mo-control">
                <label htmlFor="mo-period">Period</label>
                <select
                  id="mo-period"
                  className="mo-select"
                  value={period}
                  onChange={(e) => setPeriod(e.target.value)}
                >
                  {periodOptions().map((o) => (
                    <option key={o.value} value={o.value}>
                      {o.label}
                    </option>
                  ))}
                </select>
              </div>
              <div className="mo-control">
                <label htmlFor="mo-project">Project</label>
                <select
                  id="mo-project"
                  className="mo-select"
                  value={project}
                  onChange={(e) => setProject(e.target.value)}
                >
                  <option value="all">All projects</option>
                  <option value="general">General Donation</option>
                  <option value="health">Health</option>
                  <option value="education">Education</option>
                  <option value="clean_water">Clean Water</option>
                </select>
              </div>
              <div className="mo-control">
                <label htmlFor="mo-office">Office</label>
                <select
                  id="mo-office"
                  className="mo-select"
                  value={office}
                  onChange={(e) => setOffice(e.target.value)}
                >
                  <option value="all">All offices</option>
                  <option value="karachi">Karachi</option>
                  <option value="lahore">Lahore</option>
                  <option value="islamabad">Islamabad</option>
                </select>
              </div>
              <button
                type="button"
                className="mo-export-btn"
                onClick={handleExportPdf}
              >
                <FiDownload size={15} />
                Export PDF
              </button>
            </div>
          </div>

          {loading && <div className="mo-loading">Loading overview…</div>}
          {!loading && error ? <div className="mo-error">{error}</div> : null}

          {!loading && !error && data ? (
            <>
          <div className="mo-kpis">
            {kpiOrder.map((key) => {
              const card = cards[key];
              if (!card) return null;
              return (
                <div className="mo-kpi" key={key}>
                  <p className="mo-kpi__title">{card.title}</p>
                  <p className={valueToneClass(card.value_tone)}>{card.value}</p>
                  <p className={deltaClass(card.delta_trend)}>{card.delta}</p>
                  <div className="mo-kpi__footer">{card.footer}</div>
                </div>
              );
            })}
          </div>

          <div className="mo-main-grid">
            <section className="mo-card">
              <h2 className="mo-card__title">{trend.title}</h2>
              <p className="mo-card__subtitle">{trend.subtitle}</p>
              <div className="mo-legend">
                <span className="mo-legend__item">
                  <i className="mo-legend__swatch mo-legend__swatch--completed" />
                  Completed
                </span>
                <span className="mo-legend__item">
                  <i className="mo-legend__swatch mo-legend__swatch--pending" />
                  Pending
                </span>
              </div>
              <div className="mo-chart" aria-label="Monthly collection trend">
                {(trend.months || []).map((month, idx) => {
                  const completed = Number(trend.completed?.[idx] || 0);
                  const pending = Number(trend.pending?.[idx] || 0);
                  const total = completed + pending;
                  const completedPct = (completed / chartMax) * 100;
                  const pendingPct = (pending / chartMax) * 100;
                  const topLabel = trend.labels?.[idx] ?? Math.round(total);
                  return (
                    <div className="mo-chart__col" key={`${month}-${idx}`}>
                      <div className="mo-chart__label-top">{topLabel}</div>
                      <div
                        className="mo-chart__stack"
                        style={{ height: `${Math.max(4, (total / chartMax) * 100)}%` }}
                      >
                        <div
                          className="mo-chart__seg--completed"
                          style={{ height: `${(completedPct / Math.max(0.01, completedPct + pendingPct)) * 100}%` }}
                        />
                        <div
                          className="mo-chart__seg--pending"
                          style={{ height: `${(pendingPct / Math.max(0.01, completedPct + pendingPct)) * 100}%` }}
                        />
                      </div>
                      <div className="mo-chart__month">{month}</div>
                    </div>
                  );
                })}
              </div>
            </section>

            <section className="mo-card">
              <h2 className="mo-card__title">{channels.title}</h2>
              <p className="mo-card__subtitle">{channels.subtitle}</p>
              <div className="mo-bars">
                {(channels.items || []).map((item) => (
                  <div className="mo-bar-row" key={item.id || item.label}>
                    <div className="mo-bar-row__label">{item.label}</div>
                    <div className="mo-bar-track">
                      <div
                        className="mo-bar-fill"
                        style={{ width: `${Math.min(100, item.bar_pct || 0)}%` }}
                      />
                    </div>
                    <div className="mo-bar-row__amount">
                      {item.amount_formatted}
                    </div>
                    <div className="mo-bar-row__pct">{item.share_pct}%</div>
                  </div>
                ))}
              </div>
            </section>
          </div>

          <section className="mo-card mo-projects">
            <h2 className="mo-card__title">{projects.title}</h2>
            <p className="mo-card__subtitle">{projects.subtitle}</p>
            <div className="mo-bars">
              {(projects.items || []).map((item) => (
                <div className="mo-bar-row" key={item.id || item.label}>
                  <div className="mo-bar-row__label">{item.label}</div>
                  <div className="mo-bar-track">
                    <div
                      className={`mo-bar-fill${
                        item.tone === 'amber' ? ' mo-bar-fill--amber' : ''
                      }`}
                      style={{ width: `${Math.min(100, item.bar_pct || 0)}%` }}
                    />
                  </div>
                  <div className="mo-bar-row__amount">
                    {item.amount_formatted}
                  </div>
                </div>
              ))}
            </div>
          </section>
            </>
          ) : null}
        </div>
      </div>
    </>
  );
};

export default ManagementOverview;
