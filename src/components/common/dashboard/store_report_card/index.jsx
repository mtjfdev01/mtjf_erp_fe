import React, { useEffect, useId, useMemo, useState } from 'react';
import { FiBox } from 'react-icons/fi';

import '../../../../styles/variables.css';
import './StoreReportCard.css';

import axiosInstance from '../../../../utils/axios';
import { fetchLatestStoreDailyReport } from '../../../../utils/storeOverviewApi';
import Modal from '../../Modal';

function formatCount(n) {
  return typeof n === 'number' ? n.toLocaleString() : n;
}

export default function StoreReportCard({
  title = 'Store — Daily report (latest)',
  subtitle,
  className = '',
}) {
  const headingId = useId();
  const [loading, setLoading] = useState(true);
  const [fetchError, setFetchError] = useState(null);
  const [latest, setLatest] = useState(null);
  const [open, setOpen] = useState(false);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        setLoading(true);
        setFetchError(null);
        const data = await fetchLatestStoreDailyReport({ client: axiosInstance });
        if (!cancelled) setLatest(data);
      } catch (err) {
        if (!cancelled) {
          setLatest(null);
          setFetchError(err?.message || 'Failed to load store report');
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const defaultSubtitle =
    subtitle ??
    (loading ? 'Loading…' : latest?.date ? `Date: ${latest.date}` : 'No report found');

  const modalDetails = useMemo(() => {
    if (!latest) return null;
    return {
      Date: latest.date || '—',
      'Demands (generated)': formatCount(latest.generated_demands),
      'Demands (pending)': formatCount(latest.pending_demands),
      'Demands (rejected)': formatCount(latest.rejected_demands),
      'GRN (generated)': formatCount(latest.generated_grn),
      'GRN (pending)': formatCount(latest.pending_grn),
    };
  }, [latest]);

  return (
    <section className={`store-report-card ${className}`.trim()} aria-labelledby={headingId}>
      <header className="store-report-card__header">
        <div>
          <h2 id={headingId} className="store-report-card__title">
            {title}
          </h2>
          <p className="store-report-card__subtitle">{defaultSubtitle}</p>
          {fetchError && (
            <p className="store-report-card__fetch-warning" role="status">
              {fetchError}
            </p>
          )}
        </div>
      </header>

      <button
        type="button"
        className="store-report-card__body"
        onClick={() => setOpen(true)}
        disabled={!latest}
        aria-label={latest ? 'Open store report details' : 'No store report available'}
      >
        <div className="store-report-card__top">
          <div className="store-report-card__identity">
            <span className="store-report-card__icon-wrap">
              <FiBox aria-hidden />
            </span>
            <h3 className="store-report-card__name">Daily snapshot</h3>
          </div>
          <div className="store-report-card__date">{latest?.date || '—'}</div>
        </div>

        <div className="store-report-card__grid">
          <div className="store-report-card__stat">
            <span className="store-report-card__stat-label">Demands gen.</span>
            <span className="store-report-card__stat-value">{formatCount(latest?.generated_demands ?? 0)}</span>
          </div>
          <div className="store-report-card__stat">
            <span className="store-report-card__stat-label">Demands pend.</span>
            <span className="store-report-card__stat-value">{formatCount(latest?.pending_demands ?? 0)}</span>
          </div>
          <div className="store-report-card__stat">
            <span className="store-report-card__stat-label">Demands rej.</span>
            <span className="store-report-card__stat-value">{formatCount(latest?.rejected_demands ?? 0)}</span>
          </div>
          <div className="store-report-card__stat">
            <span className="store-report-card__stat-label">GRN gen.</span>
            <span className="store-report-card__stat-value">{formatCount(latest?.generated_grn ?? 0)}</span>
          </div>
          <div className="store-report-card__stat">
            <span className="store-report-card__stat-label">GRN pend.</span>
            <span className="store-report-card__stat-value">{formatCount(latest?.pending_grn ?? 0)}</span>
          </div>
        </div>
      </button>

      <Modal
        open={open}
        onClose={() => setOpen(false)}
        title={latest?.date ? `Store report — ${latest.date}` : 'Store report'}
        details={modalDetails}
      />
    </section>
  );
}

