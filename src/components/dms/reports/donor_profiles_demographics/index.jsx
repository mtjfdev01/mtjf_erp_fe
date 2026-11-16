import React, { useCallback, useEffect, useState } from 'react';
import Navbar from '../../../Navbar';
import axios from '../../../../utils/axios';
import './donorProfilesDemographics.css';

const kpiValueClass = (tone) => {
  if (tone === 'red') return 'dpd-kpi__value dpd-kpi__value--red';
  if (tone === 'green') return 'dpd-kpi__value dpd-kpi__value--green';
  if (tone === 'amber') return 'dpd-kpi__value dpd-kpi__value--amber';
  return 'dpd-kpi__value';
};

const periodOptions = [
  { value: 'last_12_months', label: 'Last 12 months' },
  { value: 'this_month', label: 'This month' },
];

const donorTypeOptions = [
  { value: 'all', label: 'All' },
  { value: 'individual', label: 'Individual' },
  { value: 'csr', label: 'CSR' },
];

const DonorProfilesDemographics = () => {
  const [period, setPeriod] = useState('last_12_months');
  const [donorType, setDonorType] = useState('all');
  const [topLimit, setTopLimit] = useState(8);
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
      params.append('donor_type', donorType);
      params.append('top_limit', String(topLimit));
      const res = await axios.get(
        `/dms/donor-profiles-demographics?${params.toString()}`,
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
  }, [period, donorType, topLimit]);

  useEffect(() => {
    fetchOverview();
  }, [fetchOverview]);

  const cards = data?.cards || {};
  const top = data?.top_donors || {};
  const tiers = data?.giving_tiers || {};
  const kpiOrder = [
    'unique_donors',
    'top10_share',
    'median_ltv',
    'major_unassigned',
    'age_gender',
  ];

  return (
    <>
      <Navbar />
      <div className="dpd-container">
        <div className="dpd-wrap">
          <div className="dpd-header">
            <div>
              <div className="dpd-title-row">
                <h1>{data?.title || 'Donor Profiles & Demographics'}</h1>
                {data?.badge ? (
                  <span className="dpd-badge">{data.badge}</span>
                ) : null}
                {data?.access_note ? (
                  <span className="dpd-badge dpd-badge--slate">
                    {data.access_note}
                  </span>
                ) : null}
              </div>
              <p className="dpd-subtitle">
                {data?.subtitle ||
                  'Who gives most · lifetime giving per de-duplicated donor'}
              </p>
            </div>
            <div className="dpd-filters">
              <div className="dpd-control">
                <label htmlFor="dpd-period">Period</label>
                <select
                  id="dpd-period"
                  className="dpd-select"
                  value={period}
                  onChange={(e) => setPeriod(e.target.value)}
                  disabled={loading}
                >
                  {periodOptions.map((o) => (
                    <option key={o.value} value={o.value}>
                      {o.label}
                    </option>
                  ))}
                </select>
              </div>
              <div className="dpd-control">
                <label htmlFor="dpd-type">Donor type</label>
                <select
                  id="dpd-type"
                  className="dpd-select"
                  value={donorType}
                  onChange={(e) => setDonorType(e.target.value)}
                  disabled={loading}
                >
                  {donorTypeOptions.map((o) => (
                    <option key={o.value} value={o.value}>
                      {o.label}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </div>

          {loading && <div className="dpd-loading">Loading overview…</div>}
          {!loading && error ? <div className="dpd-error">{error}</div> : null}

          {!loading && !error && data ? (
            <>
              <div className="dpd-kpis">
                {kpiOrder.map((key) => {
                  const card = cards[key];
                  if (!card) return null;
                  return (
                    <div className="dpd-kpi" key={key}>
                      <p className="dpd-kpi__title">{card.title}</p>
                      <p className={kpiValueClass(card.value_tone)}>
                        {card.value}
                      </p>
                      <div className="dpd-kpi__footer">{card.footer}</div>
                    </div>
                  );
                })}
              </div>

              <div className="dpd-grid">
                <section className="dpd-card">
                  <div className="dpd-card__head">
                    <div>
                      <h2 className="dpd-card__title">{top.title}</h2>
                      <p className="dpd-card__subtitle">{top.subtitle}</p>
                    </div>
                    <button
                      type="button"
                      className="dpd-top100"
                      onClick={() =>
                        setTopLimit((n) => (n >= 100 ? 8 : 100))
                      }
                    >
                      {topLimit >= 100 ? 'Top 8' : 'Top 100'}
                    </button>
                  </div>
                  {(top.items || []).length === 0 ? (
                    <p className="dpd-empty">No donors in this period.</p>
                  ) : (
                    <table className="dpd-table">
                      <thead>
                        <tr>
                          <th>#</th>
                          <th>Donor</th>
                          <th>Given</th>
                          <th>Gifts</th>
                          <th>Last gift</th>
                          <th>Channels</th>
                          <th>Owner</th>
                        </tr>
                      </thead>
                      <tbody>
                        {(top.items || []).map((row) => (
                          <tr key={row.id}>
                            <td className="dpd-rank">{row.rank}</td>
                            <td>
                              <div className="dpd-donor-id">
                                {row.donor_label}
                              </div>
                              <div className="dpd-donor-meta">{row.meta}</div>
                            </td>
                            <td className="dpd-given">{row.given_formatted}</td>
                            <td>{row.gifts}</td>
                            <td>{row.last_gift}</td>
                            <td>{row.channels}</td>
                            <td
                              className={
                                row.owner_unassigned ? 'dpd-owner--warn' : ''
                              }
                            >
                              {row.owner}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  )}
                </section>

                <section className="dpd-card">
                  <h2 className="dpd-card__title">{tiers.title}</h2>
                  <p className="dpd-card__subtitle">{tiers.subtitle}</p>
                  {(tiers.items || []).map((tier) => (
                    <div className="dpd-tier" key={tier.id}>
                      <p className="dpd-tier__title">{tier.title}</p>
                      <div className="dpd-tier__bars">
                        <div className="dpd-tier-row">
                          <span>% of donors</span>
                          <div className="dpd-tier-track">
                            <div
                              className="dpd-tier-fill"
                              style={{
                                width: `${Math.min(100, Number(tier.donors_pct || 0))}%`,
                              }}
                            />
                          </div>
                          <span>{tier.donors_pct}%</span>
                        </div>
                        <div className="dpd-tier-row">
                          <span>% of income</span>
                          <div className="dpd-tier-track">
                            <div
                              className="dpd-tier-fill dpd-tier-fill--income"
                              style={{
                                width: `${Math.min(100, Number(tier.income_pct || 0))}%`,
                              }}
                            />
                          </div>
                          <span>{tier.income_pct}%</span>
                        </div>
                      </div>
                      <div className="dpd-tier__action">{tier.action}</div>
                    </div>
                  ))}
                </section>
              </div>
            </>
          ) : null}
        </div>
      </div>
    </>
  );
};

export default DonorProfilesDemographics;
