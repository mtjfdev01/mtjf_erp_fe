import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { FiGift, FiMapPin, FiRepeat } from 'react-icons/fi';
import Navbar from '../../../Navbar';
import axios from '../../../../utils/axios';
import './reconciliationDesk.css';

const CHANNEL_META = {
  offline: { icon: FiMapPin, theme: 'offline' },
  in_kind: { icon: FiGift, theme: 'in_kind' },
  recurring: { icon: FiRepeat, theme: 'recurring' },
};

const kpiValueClass = (tone) => {
  if (tone === 'amber') return 'rdk-kpi__value rdk-kpi__value--amber';
  if (tone === 'red') return 'rdk-kpi__value rdk-kpi__value--red';
  if (tone === 'green') return 'rdk-kpi__value rdk-kpi__value--green';
  if (tone === 'blue') return 'rdk-kpi__value rdk-kpi__value--blue';
  return 'rdk-kpi__value';
};

const ageBarClass = (tone) => {
  if (tone === 'amber') return 'rdk-age-bar rdk-age-bar--amber';
  if (tone === 'rose') return 'rdk-age-bar rdk-age-bar--rose';
  if (tone === 'red') return 'rdk-age-bar rdk-age-bar--red';
  return 'rdk-age-bar rdk-age-bar--blue';
};

const oldestClass = (tone) => {
  if (tone === 'amber') return 'rdk-oldest--amber';
  if (tone === 'red') return 'rdk-oldest--red';
  return '';
};

const outcomeFillClass = (tone) => {
  if (tone === 'green') return 'rdk-outcome-fill rdk-outcome-fill--green';
  if (tone === 'amber') return 'rdk-outcome-fill rdk-outcome-fill--amber';
  if (tone === 'red') return 'rdk-outcome-fill rdk-outcome-fill--red';
  return 'rdk-outcome-fill rdk-outcome-fill--slate';
};

const formatCount = (n) => Number(n || 0).toLocaleString('en-US');

const ReconciliationDesk = () => {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [data, setData] = useState(null);

  const fetchDesk = useCallback(async () => {
    try {
      setLoading(true);
      setError('');
      setData(null);
      const res = await axios.get('/dms/reconciliation-desk');
      if (res.data?.success && res.data?.data) {
        setData(res.data.data);
      } else {
        setError(res.data?.message || 'Could not load desk.');
      }
    } catch (err) {
      setError(
        err?.response?.data?.message ||
          err.message ||
          'Could not load desk.',
      );
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchDesk();
  }, [fetchDesk]);

  const view = data || {};
  const cards = view.cards || {};
  const byAge = view.pending_by_age || {};
  const byMethod = view.pending_by_method || {};
  const byChannel = view.channel_breakdown || {};
  const outcome = view.payfast_outcome || {};

  const ageMax = useMemo(() => {
    const counts = (byAge.items || []).map((i) => Number(i.count || 0));
    return Math.max(1, ...counts);
  }, [byAge]);

  const kpiOrder = [
    'pending_verification',
    'older_than_7_days',
    'verified_today',
    'rejected_this_month',
    'payfast_success',
  ];

  return (
    <>
      <Navbar />
      <div className="rdk-container">
        <div className="rdk-wrap">
          <div className="rdk-header">
            <div className="rdk-title-row">
              <h1>Reconciliation Desk</h1>
              {view.badge ? (
                <span className="rdk-badge">{view.badge}</span>
              ) : null}
            </div>
            <p className="rdk-subtitle">
              {view.subtitle || 'Accounts verification queue'}
            </p>
          </div>

          {loading && <div className="rdk-loading">Loading desk…</div>}
          {!loading && error ? <div className="rdk-error">{error}</div> : null}

          {!loading && !error && data ? (
            <>
          <div className="rdk-kpis">
            {kpiOrder.map((key) => {
              const card = cards[key];
              if (!card) return null;
              return (
                <div className="rdk-kpi" key={key}>
                  <p className="rdk-kpi__title">{card.title}</p>
                  <p className={kpiValueClass(card.value_tone)}>{card.value}</p>
                  <div className="rdk-kpi__footer">{card.footer}</div>
                </div>
              );
            })}
          </div>

          {(byChannel.items || []).length > 0 ? (
            <section className="rdk-channel-section">
              <h2 className="rdk-card__title">{byChannel.title || 'By channel'}</h2>
              <p className="rdk-card__subtitle">
                {byChannel.subtitle ||
                  'Offline, in-kind and recurring — pending, completed and rejected'}
              </p>
              <div className="rdk-channel-grid">
                {(byChannel.items || []).map((ch) => {
                  const meta = CHANNEL_META[ch.id] || CHANNEL_META.offline;
                  const Icon = meta.icon;
                  return (
                    <div
                      className={`rdk-channel-card rdk-channel-card--${meta.theme}`}
                      key={ch.id || ch.label}
                    >
                      <div className="rdk-channel-card__head">
                        <span className="rdk-channel-card__icon" aria-hidden="true">
                          <Icon />
                        </span>
                        <p className="rdk-channel-card__label">{ch.label}</p>
                      </div>
                      <div className="rdk-channel-card__stats">
                        <div>
                          <span className="rdk-channel-card__stat-label">Pending</span>
                          <span className="rdk-channel-card__stat-value rdk-channel-card__stat-value--pending">
                            {formatCount(ch.pending)}
                          </span>
                          <span className="rdk-channel-card__stat-amount">
                            {ch.pending_amount_formatted || '—'}
                          </span>
                        </div>
                        <div>
                          <span className="rdk-channel-card__stat-label">Completed</span>
                          <span className="rdk-channel-card__stat-value rdk-channel-card__stat-value--done">
                            {formatCount(ch.completed)}
                          </span>
                          <span className="rdk-channel-card__stat-amount">
                            {ch.completed_amount_formatted || '—'}
                          </span>
                        </div>
                        <div>
                          <span className="rdk-channel-card__stat-label">Rejected</span>
                          <span className="rdk-channel-card__stat-value rdk-channel-card__stat-value--rejected">
                            {formatCount(ch.rejected)}
                          </span>
                          <span className="rdk-channel-card__stat-amount">
                            {ch.rejected_amount_formatted || '—'}
                          </span>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </section>
          ) : null}

          <div className="rdk-grid">
            <section className="rdk-card">
              <h2 className="rdk-card__title">{byAge.title}</h2>
              <p className="rdk-card__subtitle">{byAge.subtitle}</p>
              <div className="rdk-age-chart" aria-label="Pending by age">
                {(byAge.items || []).map((item) => {
                  const count = Number(item.count || 0);
                  const heightPct = (count / ageMax) * 100;
                  return (
                    <div className="rdk-age-col" key={item.id || item.label}>
                      <div className="rdk-age-count">{count}</div>
                      <div
                        className={ageBarClass(item.tone)}
                        style={{ height: `${Math.max(4, heightPct)}%` }}
                      />
                      <div className="rdk-age-label">{item.label}</div>
                    </div>
                  );
                })}
              </div>
            </section>

            <section className="rdk-card">
              <h2 className="rdk-card__title">{byMethod.title}</h2>
              <p className="rdk-card__subtitle">{byMethod.subtitle}</p>
              <table className="rdk-table">
                <thead>
                  <tr>
                    <th>Method</th>
                    <th>Records</th>
                    <th>Amount</th>
                    <th>Oldest</th>
                  </tr>
                </thead>
                <tbody>
                  {(byMethod.items || []).map((row) => (
                    <tr key={row.id || row.method}>
                      <td>{row.method}</td>
                      <td>{row.records}</td>
                      <td>{row.amount_formatted}</td>
                      <td className={oldestClass(row.oldest_tone)}>
                        {row.oldest}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </section>

            <section className="rdk-card">
              <h2 className="rdk-card__title">{outcome.title}</h2>
              <p className="rdk-card__subtitle">{outcome.subtitle}</p>
              <div className="rdk-outcome">
                {(outcome.items || []).map((item) => (
                  <div key={item.id || item.label}>
                    <div className="rdk-outcome-row__top">
                      <span className="rdk-outcome-row__label">
                        {item.label}
                      </span>
                      <span className="rdk-outcome-row__meta">
                        {formatCount(item.count)} · {item.share_pct}%
                      </span>
                    </div>
                    <div className="rdk-outcome-track">
                      <div
                        className={outcomeFillClass(item.tone)}
                        style={{
                          width: `${Math.min(100, Number(item.bar_pct || 0))}%`,
                        }}
                      />
                    </div>
                  </div>
                ))}
              </div>
              {outcome.footnote ? (
                <p className="rdk-footnote">{outcome.footnote}</p>
              ) : null}
            </section>
          </div>
            </>
          ) : null}
        </div>
      </div>
    </>
  );
};

export default ReconciliationDesk;
