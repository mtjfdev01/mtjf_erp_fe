import React, { useCallback, useEffect, useState } from 'react';
import Navbar from '../../../Navbar';
import axios from '../../../../utils/axios';
import './fieldTeamDonationBoxes.css';

const kpiValueClass = (tone) => {
  if (tone === 'green') return 'ftb-kpi__value ftb-kpi__value--green';
  if (tone === 'blue') return 'ftb-kpi__value ftb-kpi__value--blue';
  if (tone === 'red') return 'ftb-kpi__value ftb-kpi__value--red';
  if (tone === 'amber') return 'ftb-kpi__value ftb-kpi__value--amber';
  return 'ftb-kpi__value';
};

const barFillClass = (tone) => {
  if (tone === 'green') return 'ftb-bar-fill ftb-bar-fill--green';
  if (tone === 'amber') return 'ftb-bar-fill ftb-bar-fill--amber';
  if (tone === 'orange') return 'ftb-bar-fill ftb-bar-fill--orange';
  if (tone === 'red') return 'ftb-bar-fill ftb-bar-fill--red';
  return 'ftb-bar-fill ftb-bar-fill--rose';
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

const FieldTeamDonationBoxes = () => {
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
        `/dms/field-team-donation-boxes?${params.toString()}`,
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

  const cards = data?.cards || {};
  const collectors = data?.collector_performance || {};
  const topBoxes = data?.top_boxes || {};

  const kpiOrder = [
    'boxes_registered',
    'collected_in_month',
    'avg_per_collection',
    'silent_45_days',
    'team_target_achieved',
  ];

  return (
    <>
      <Navbar />
      <div className="ftb-container">
        <div className="ftb-wrap">
          <div className="ftb-header">
            <div>
              <div className="ftb-title-row">
                <h1>{data?.title || 'Field Team & Donation Boxes'}</h1>
                {data?.badge ? (
                  <span className="ftb-badge">{data.badge}</span>
                ) : null}
              </div>
              <p className="ftb-subtitle">
                {data?.subtitle || 'Supervisor view'}
              </p>
            </div>
            <div className="ftb-filters">
              <div className="ftb-control">
                <label htmlFor="ftb-period">Month</label>
                <select
                  id="ftb-period"
                  className="ftb-select"
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

          {loading && <div className="ftb-loading">Loading overview…</div>}
          {!loading && error ? <div className="ftb-error">{error}</div> : null}

          {!loading && !error && data ? (
            <>
              <div className="ftb-kpis">
                {kpiOrder.map((key) => {
                  const card = cards[key];
                  if (!card) return null;
                  return (
                    <div className="ftb-kpi" key={key}>
                      <p className="ftb-kpi__title">{card.title}</p>
                      <p className={kpiValueClass(card.value_tone)}>
                        {card.value}
                      </p>
                      <div className="ftb-kpi__footer">{card.footer}</div>
                    </div>
                  );
                })}
              </div>

              <div className="ftb-grid">
                <section className="ftb-card">
                  <h2 className="ftb-card__title">
                    {collectors.title || 'Collector performance'}
                  </h2>
                  <p className="ftb-card__subtitle">{collectors.subtitle}</p>
                  <div className="ftb-collectors">
                    {(collectors.items || []).length === 0 ? (
                      <p className="ftb-empty">No collector data for this month.</p>
                    ) : (
                      (collectors.items || []).map((row) => (
                        <div key={row.id || row.name}>
                          <div className="ftb-collector__top">
                            <span className="ftb-collector__name">{row.name}</span>
                            <span className="ftb-collector__meta">
                              {row.has_target ? (
                                <>
                                  <strong>{row.collected_formatted}</strong> of{' '}
                                  {row.target_formatted}
                                </>
                              ) : (
                                <strong>{row.collected_formatted}</strong>
                              )}
                            </span>
                          </div>
                          {row.has_target ? (
                            <>
                              <div className="ftb-bar-track">
                                <div
                                  className={barFillClass(row.tone)}
                                  style={{
                                    width: `${Math.min(100, Number(row.pct || 0))}%`,
                                  }}
                                />
                              </div>
                              <div className="ftb-collector__bottom">
                                <span>{row.pct}% of target</span>
                                <span>{row.collections} collections</span>
                              </div>
                            </>
                          ) : (
                            <div className="ftb-collector__bottom">
                              <span>Collected</span>
                              <span>{row.collections} collections</span>
                            </div>
                          )}
                        </div>
                      ))
                    )}
                  </div>
                </section>

                <section className="ftb-card">
                  <h2 className="ftb-card__title">
                    {topBoxes.title || 'Top boxes by collection'}
                  </h2>
                  <p className="ftb-card__subtitle">{topBoxes.subtitle}</p>
                  {(topBoxes.items || []).length === 0 ? (
                    <p className="ftb-empty">No box collections for this month.</p>
                  ) : (
                    <table className="ftb-table">
                      <thead>
                        <tr>
                          <th>#</th>
                          <th>Key</th>
                          <th>Shop</th>
                          <th>Size</th>
                          <th>Collected</th>
                        </tr>
                      </thead>
                      <tbody>
                        {(topBoxes.items || []).map((row) => (
                          <tr key={row.id || row.key}>
                            <td className="ftb-rank">{row.rank}</td>
                            <td className="ftb-key">{row.key}</td>
                            <td>{row.shop}</td>
                            <td>
                              <span className="ftb-size">{row.size}</span>
                            </td>
                            <td className="ftb-amount">
                              {row.collected_formatted}
                            </td>
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

export default FieldTeamDonationBoxes;
