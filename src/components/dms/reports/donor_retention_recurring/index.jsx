import React, { useCallback, useEffect, useState } from 'react';
import Navbar from '../../../Navbar';
import axios from '../../../../utils/axios';
import './donorRetentionRecurring.css';

const kpiValueClass = (tone) => {
  if (tone === 'green') return 'drr-kpi__value drr-kpi__value--green';
  if (tone === 'red') return 'drr-kpi__value drr-kpi__value--red';
  if (tone === 'amber') return 'drr-kpi__value drr-kpi__value--amber';
  if (tone === 'blue') return 'drr-kpi__value drr-kpi__value--blue';
  return 'drr-kpi__value';
};

const rfmToneClass = (tone) => `drr-rfm-card drr-rfm-card--${tone || 'slate'}`;

const barFillClass = (tone) => {
  if (tone === 'green') return 'drr-bar-fill drr-bar-fill--green';
  if (tone === 'indigo') return 'drr-bar-fill drr-bar-fill--indigo';
  return 'drr-bar-fill drr-bar-fill--blue';
};

const cohortCellClass = (pct) => {
  if (pct == null) return 'drr-cohort-cell drr-cohort-cell--empty';
  if (pct >= 30) return 'drr-cohort-cell drr-cohort-cell--hi';
  if (pct >= 20) return 'drr-cohort-cell drr-cohort-cell--mid';
  if (pct >= 12) return 'drr-cohort-cell drr-cohort-cell--lo';
  return 'drr-cohort-cell drr-cohort-cell--vlo';
};

const currentPeriodYm = () => {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
};

const periodOptions = () => {
  const opts = [];
  const now = new Date();
  for (let i = 0; i < 12; i += 1) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    const value = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
    const label = d.toLocaleString('en-US', { month: 'long', year: 'numeric' });
    opts.push({ value, label });
  }
  return opts;
};

const DonorRetentionRecurring = () => {
  const [period, setPeriod] = useState(currentPeriodYm);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [data, setData] = useState(null);

  const fetchOverview = useCallback(async () => {
    try {
      setLoading(true);
      setError('');
      setData(null);
      const params = new URLSearchParams();
      if (period) params.append('period', period);
      const res = await axios.get(
        `/dms/donor-retention-recurring?${params.toString()}`,
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
  }, [period]);

  useEffect(() => {
    fetchOverview();
  }, [fetchOverview]);

  const retentionCards = data?.retention_cards || {};
  const rfm = data?.rfm_segments || {};
  const plan = data?.plan_health || {};
  const planCards = plan.cards || {};
  const promised = plan.promised_vs_actual || {};
  const funnel = plan.installment_funnel || {};
  const neverAge = plan.never_paid_by_age || {};
  const methods = plan.activation_by_method || {};
  const weekly = data?.weekly_activation || {};
  const cohort = data?.cohort_retention || {};

  const retentionOrder = [
    'retention_12m',
    'lapsed_ly',
    'new_donors',
    'reactivated',
    'avg_ltv',
  ];
  const planOrder = [
    'registered_plans',
    'paying_plans',
    'never_paid',
    'committed_monthly',
    'collected_in_period',
    'collected_this_month',
    'awaiting_first',
  ];

  const funnelMax = Math.max(
    1,
    ...(funnel.items || []).map((i) => Number(i.count || 0)),
  );
  const weekMax = Number(weekly.max || 1);
  const neverPaidTotal = (neverAge.items || []).reduce(
    (sum, item) => sum + Number(item.count || 0),
    0,
  );
  const methodTone = (pct) => {
    if (Number(pct) >= 75) return 'green';
    if (Number(pct) >= 40) return 'amber';
    return 'red';
  };

  return (
    <>
      <Navbar />
      <div className="drr-container">
        <div className="drr-wrap">
          <div className="drr-header">
            <div>
              <div className="drr-title-row">
                <h1>{data?.title || 'Donor Retention & Recurring'}</h1>
                {data?.badge ? (
                  <span className="drr-badge">{data.badge}</span>
                ) : null}
              </div>
              <p className="drr-subtitle">
                {data?.subtitle ||
                  'Who keeps giving, who is slipping away, and recurring plan health'}
              </p>
            </div>
            <div className="drr-filters">
              <div className="drr-control">
                <label htmlFor="drr-period">Period</label>
                <select
                  id="drr-period"
                  className="drr-select"
                  value={period}
                  onChange={(e) => setPeriod(e.target.value)}
                  disabled={loading}
                >
                  {periodOptions().map((o) => (
                    <option key={o.value} value={o.value}>
                      {o.label}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </div>

          {loading && <div className="drr-loading">Loading overview…</div>}
          {!loading && error ? <div className="drr-error">{error}</div> : null}

          {!loading && !error && data ? (
            <>
              <div className="drr-kpis">
                {retentionOrder.map((key) => {
                  const card = retentionCards[key];
                  if (!card) return null;
                  return (
                    <div className="drr-kpi" key={key}>
                      <p className="drr-kpi__title">{card.title}</p>
                      <p className={kpiValueClass(card.value_tone)}>
                        {card.value}
                      </p>
                      <div className="drr-kpi__footer">{card.footer}</div>
                    </div>
                  );
                })}
              </div>

              <div className="drr-section">
                <h2 className="drr-section__title">{rfm.title}</h2>
                <p className="drr-section__subtitle">{rfm.subtitle}</p>
                <div className="drr-rfm">
                  {(rfm.items || []).map((item) => (
                    <div
                      key={item.id}
                      className={rfmToneClass(item.tone)}
                    >
                      <p className="drr-rfm-card__title">{item.title}</p>
                      <p className="drr-rfm-card__criteria">{item.criteria}</p>
                      <div className="drr-rfm-card__count">{item.count}</div>
                      <div className="drr-rfm-card__amount">
                        {item.amount_formatted}
                      </div>
                      <div className="drr-rfm-card__action">
                        → {item.action}
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="drr-section">
                <h2 className="drr-section__title">{plan.title}</h2>
                <p className="drr-section__subtitle">{plan.subtitle}</p>
                <div className="drr-kpis drr-kpis--7">
                  {planOrder.map((key) => {
                    const card = planCards[key];
                    if (!card) return null;
                    return (
                      <div className="drr-kpi" key={key}>
                        <p className="drr-kpi__title">{card.title}</p>
                        <p className={kpiValueClass(card.value_tone)}>
                          {card.value}
                        </p>
                        <div className="drr-kpi__footer">{card.footer}</div>
                      </div>
                    );
                  })}
                </div>

                <div className="drr-grid-2">
                  <section className="drr-card">
                    <h3 className="drr-section__title">
                      {promised.title || 'Promised vs actually coming in'}
                    </h3>
                    {(promised.items || []).map((item) => (
                      <div className="drr-bar-row" key={item.id}>
                        <div className="drr-bar-row__top">
                          <span>{item.label}</span>
                          <strong>{item.amount_formatted}</strong>
                        </div>
                        <div className="drr-bar-track">
                          <div
                            className={barFillClass(item.tone)}
                            style={{
                              width: `${Math.min(100, Number(item.bar_pct || 0))}%`,
                            }}
                          />
                        </div>
                        {item.footnote ? (
                          <div className="drr-bar-row__note">{item.footnote}</div>
                        ) : null}
                      </div>
                    ))}
                  </section>

                  <section className="drr-card">
                    <h3 className="drr-section__title">
                      {funnel.title || 'Installment funnel'}
                    </h3>
                    <div className="drr-funnel">
                      {(funnel.items || []).map((item) => (
                        <div className="drr-funnel-row" key={item.id}>
                          <span>{item.label}</span>
                          <div className="drr-funnel-track">
                            <div
                              className="drr-funnel-fill"
                              style={{
                                width: `${Math.max(
                                  8,
                                  (Number(item.count || 0) / funnelMax) * 100,
                                )}%`,
                              }}
                            >
                              {Number(item.count || 0).toLocaleString('en-US')}
                            </div>
                          </div>
                          <span className="drr-funnel-drop">
                            {item.drop_pct != null ? `↓ ${item.drop_pct}%` : ''}
                          </span>
                        </div>
                      ))}
                    </div>
                  </section>
                </div>

                <div className="drr-grid-2">
                  <section className="drr-card drr-action-card">
                    <h3 className="drr-section__title">
                      {neverPaidTotal.toLocaleString('en-US')}{' '}
                      {neverAge.title?.toLowerCase() || 'never-paid plans, by age'}
                    </h3>
                    <p className="drr-section__subtitle">
                      Days since sign-up · each bucket has its own action
                    </p>
                    <div className="drr-age-list">
                      {(neverAge.items || []).map((item) => (
                        <div
                          className={`drr-age-item drr-age-item--${item.id}`}
                          key={item.id}
                        >
                          <div className="drr-age-item__top">
                            <strong>{item.label}</strong>
                            <span>
                              {Number(item.count || 0).toLocaleString('en-US')} plans
                              {' · '}
                              {item.amount_formatted}
                            </span>
                          </div>
                          <div className="drr-age-item__action">→ {item.action}</div>
                        </div>
                      ))}
                    </div>
                  </section>

                  <section className="drr-card drr-action-card">
                    <h3 className="drr-section__title">
                      {methods.title || 'Activation by payment method'}
                    </h3>
                    <p className="drr-section__subtitle">
                      Plans that paid at least once · plans registered
                    </p>
                    {(methods.items || []).length === 0 ? (
                      <p className="drr-empty">No method data.</p>
                    ) : (
                      <div className="drr-method-list">
                        {(methods.items || []).map((item) => (
                        <div
                          className={`drr-method-row drr-method-row--${methodTone(
                            item.success_pct,
                          )}`}
                          key={item.id}
                        >
                          <div className="drr-method-row__top">
                            <strong>{item.method}</strong>
                            <span>
                              {item.paying} of {item.registered} ·{' '}
                              <strong>{item.success_pct}%</strong>
                            </span>
                          </div>
                          <div className="drr-bar-track">
                            <div
                              className="drr-bar-fill"
                              style={{
                                width: `${Math.min(100, Number(item.bar_pct || 0))}%`,
                              }}
                            />
                          </div>
                        </div>
                        ))}
                      </div>
                    )}
                    <div className="drr-method-note">{methods.subtitle}</div>
                  </section>
                </div>
              </div>

              <div className="drr-grid-2 drr-section">
                <section className="drr-card">
                  <h3 className="drr-section__title">{weekly.title}</h3>
                  <p className="drr-section__subtitle">{weekly.subtitle}</p>
                  <div className="drr-legend">
                    <span>
                      <i className="drr-legend__signed" /> Signed up
                    </span>
                    <span>
                      <i className="drr-legend__paid" /> Paid 1st
                    </span>
                  </div>
                  <div className="drr-week-chart">
                    {(weekly.items || []).map((w) => (
                      <div className="drr-week-col" key={w.id}>
                        <div className="drr-week-bars">
                          <div
                            className="drr-week-bar drr-week-bar--signed"
                            style={{
                              height: `${Math.max(
                                4,
                                (Number(w.signed_up || 0) / weekMax) * 100,
                              )}%`,
                            }}
                            title={`Signed ${w.signed_up}`}
                          />
                          <div
                            className="drr-week-bar drr-week-bar--paid"
                            style={{
                              height: `${Math.max(
                                4,
                                (Number(w.paid_first || 0) / weekMax) * 100,
                              )}%`,
                            }}
                            title={`Paid 1st ${w.paid_first}`}
                          />
                        </div>
                        <div className="drr-week-label">{w.label}</div>
                        <div className="drr-week-pct">{w.conversion_pct}%</div>
                      </div>
                    ))}
                  </div>
                </section>

                <section className="drr-card">
                  <h3 className="drr-section__title">What this tells management</h3>
                  <ul className="drr-insights">
                    {(weekly.insights || []).map((line) => (
                      <li key={line}>{line}</li>
                    ))}
                  </ul>
                </section>
              </div>

              <div className="drr-section">
                <section className="drr-card">
                  <h3 className="drr-section__title">{cohort.title}</h3>
                  <p className="drr-section__subtitle">{cohort.subtitle}</p>
                  {(cohort.rows || []).length === 0 ? (
                    <p className="drr-empty">No cohort data yet.</p>
                  ) : (
                    <table className="drr-cohort">
                      <thead>
                        <tr>
                          <th className="drr-cohort__label">First gift</th>
                          {(cohort.columns || []).map((c) => (
                            <th key={c}>{c}</th>
                          ))}
                        </tr>
                      </thead>
                      <tbody>
                        {(cohort.rows || []).map((row) => (
                          <tr key={row.id}>
                            <td className="drr-cohort__label">{row.label}</td>
                            {(row.cells || []).map((pct, idx) => (
                              <td key={`${row.id}-${idx}`}>
                                <span className={cohortCellClass(pct)}>
                                  {pct == null ? '—' : `${pct}%`}
                                </span>
                              </td>
                            ))}
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  )}
                </section>
              </div>
            </>
          ) : null}
        </div>
      </div>
    </>
  );
};

export default DonorRetentionRecurring;
