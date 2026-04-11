import React, { useCallback, useEffect, useId, useMemo, useRef, useState } from 'react';
import { FiChevronLeft, FiChevronRight, FiHeart, FiShoppingBag } from 'react-icons/fi';

import '../../../../styles/variables.css';
import './DeliverablesOverallCard.css';
import axiosInstance from '../../../../utils/axios';
import { fetchDeliverablesOverall } from '../../../../utils/deliverablesOverallApi';

function formatCount(n) {
  return typeof n === 'number' ? n.toLocaleString() : n;
}

function rangeCaption(from, to) {
  if (from && to) return `${from} → ${to}`;
  if (from) return `From ${from}`;
  if (to) return `Until ${to}`;
  return 'All dates';
}

/** Soft icon colors per program key (aligned with program application overview). */
const MINI_CARD_ACCENT = {
  food_security: { soft: '#dcfce7', solid: '#15803d' },
  community_services: { soft: '#ede9fe', solid: '#7c3aed' },
  widows_and_orphans_care_program: { soft: '#ffedd5', solid: '#ea580c' },
  education: { soft: '#dbeafe', solid: '#2563eb' },
  water_clean_water: { soft: '#cffafe', solid: '#0891b2' },
  kasb: { soft: '#e0e7ff', solid: '#4f46e5' },
  kasb_training: { soft: '#e0e7ff', solid: '#4338ca' },
  livelihood_support_program: { soft: '#ccfbf1', solid: '#0d9488' },
  green_initiative: { soft: '#dcfce7', solid: '#15803d' },
  disaster_management: { soft: '#ffe4e6', solid: '#be123c' },
  area_ration: { soft: '#fef3c7', solid: '#b45309' },
};

function accentForProgramKey(key) {
  return MINI_CARD_ACCENT[key] || { soft: '#e2e8f0', solid: '#475569' };
}

function DeliverablesProgramMiniCard({ card }) {
  const { soft, solid } = accentForProgramKey(card.key);
  const lines = Array.isArray(card.lines) ? card.lines : [];

  return (
    <article className="deliverables-mini-card">
      <div className="deliverables-mini-card__head">
        <span
          className="deliverables-mini-card__icon-wrap"
          style={{ background: soft, color: solid }}
          aria-hidden
        >
          <FiShoppingBag />
        </span>
        <h4 className="deliverables-mini-card__title" title={card.label}>
          {card.label}
        </h4>
      </div>
      {lines.length === 0 ? (
        <p className="deliverables-mini-card__empty">No vulnerability breakdown for this program.</p>
      ) : (
        <ul className="deliverables-mini-card__list">
          {lines.map((line) => (
            <li key={line.key} className="deliverables-mini-card__row">
              <span className="deliverables-mini-card__row-label">{line.label}</span>
              <span className="deliverables-mini-card__row-value">
                {formatCount(Number(line.count) || 0)}
              </span>
            </li>
          ))}
        </ul>
      )}
      <div className="deliverables-mini-card__footer">
        <span>Total</span>
        <span>{formatCount(Number(card.vulnerabilitiesTotal) || 0)}</span>
      </div>
    </article>
  );
}

/**
 * Deliverables overall: summary card + horizontal scroll of per-program vulnerability mini-cards.
 * Loads `GET /new-dashboard/dashboard-report/deliverables-overall` with optional `from` / `to` (YYYY-MM-DD).
 */
export default function DeliverablesOverallCard({
  from: fromProp,
  to: toProp,
  title = 'Deliverables by program (overall)',
  className = '',
}) {
  const headingId = useId();
  const carouselHeadingId = useId();
  const trackRef = useRef(null);
  const [canPrev, setCanPrev] = useState(false);
  const [canNext, setCanNext] = useState(true);

  const [draftFrom, setDraftFrom] = useState(fromProp ?? '');
  const [draftTo, setDraftTo] = useState(toProp ?? '');
  const [appliedFrom, setAppliedFrom] = useState(fromProp ?? '');
  const [appliedTo, setAppliedTo] = useState(toProp ?? '');
  const [payload, setPayload] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    setDraftFrom(fromProp ?? '');
    setDraftTo(toProp ?? '');
    setAppliedFrom(fromProp ?? '');
    setAppliedTo(toProp ?? '');
  }, [fromProp, toProp]);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        setLoading(true);
        setError(null);
        const data = await fetchDeliverablesOverall({
          from: appliedFrom || undefined,
          to: appliedTo || undefined,
          client: axiosInstance,
        });
        if (!cancelled) setPayload(data || null);
      } catch (err) {
        if (!cancelled) {
          setError(err?.message || 'Failed to load deliverables');
          setPayload(null);
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [appliedFrom, appliedTo]);

  const programsList = Array.isArray(payload?.programsList) ? payload.programsList : [];
  const vulnerabilities = Array.isArray(payload?.vulnerabilities) ? payload.vulnerabilities : [];
  const programVulnerabilityCards = Array.isArray(payload?.programVulnerabilityCards)
    ? payload.programVulnerabilityCards
    : [];

  const programsTotal = useMemo(() => {
    if (typeof payload?.totalDeliveredAllPrograms === 'number') {
      return payload.totalDeliveredAllPrograms;
    }
    return programsList.reduce((s, r) => s + (Number(r.totalDelivered) || 0), 0);
  }, [payload, programsList]);

  const vulnerabilitiesTotal = useMemo(() => {
    if (typeof payload?.totalVulnerabilitiesAll === 'number') {
      return payload.totalVulnerabilitiesAll;
    }
    return vulnerabilities.reduce((s, r) => s + (Number(r.total) || 0), 0);
  }, [payload, vulnerabilities]);

  const updateScrollState = useCallback(() => {
    const el = trackRef.current;
    if (!el) return;
    const { scrollLeft, scrollWidth, clientWidth } = el;
    const maxScroll = scrollWidth - clientWidth;
    setCanPrev(scrollLeft > 4);
    setCanNext(scrollLeft < maxScroll - 4);
  }, []);

  useEffect(() => {
    const el = trackRef.current;
    if (!el) return;
    updateScrollState();
    el.addEventListener('scroll', updateScrollState, { passive: true });
    const ro = new ResizeObserver(updateScrollState);
    ro.observe(el);
    return () => {
      el.removeEventListener('scroll', updateScrollState);
      ro.disconnect();
    };
  }, [programVulnerabilityCards, updateScrollState]);

  const scrollCarouselByDir = (direction) => {
    const el = trackRef.current;
    if (!el) return;
    const first = el.querySelector('.deliverables-mini-card');
    const gap = parseFloat(getComputedStyle(el).gap) || 16;
    const step = first ? first.offsetWidth + gap : el.clientWidth * 0.85;
    el.scrollBy({ left: direction * step, behavior: 'smooth' });
  };

  return (
    <section
      className={`deliverables-overall-card ${className}`.trim()}
      aria-labelledby={headingId}
    >
      <header className="deliverables-overall-card__header">
        <div className="deliverables-overall-card__titles">
          <h2 id={headingId} className="deliverables-overall-card__title">
            {title}
          </h2>
          <p className="deliverables-overall-card__subtitle">
            {loading && !payload
              ? 'Loading…'
              : `Period: ${rangeCaption(payload?.from ?? appliedFrom, payload?.to ?? appliedTo)}`}
          </p>
        </div>
        <div className="deliverables-overall-card__filters">
          <div className="deliverables-overall-card__field">
            <label htmlFor={`${headingId}-from`}>From</label>
            <input
              id={`${headingId}-from`}
              type="date"
              value={draftFrom}
              onChange={(e) => setDraftFrom(e.target.value)}
            />
          </div>
          <div className="deliverables-overall-card__field">
            <label htmlFor={`${headingId}-to`}>To</label>
            <input
              id={`${headingId}-to`}
              type="date"
              value={draftTo}
              onChange={(e) => setDraftTo(e.target.value)}
            />
          </div>
          <button
            type="button"
            className="deliverables-overall-card__apply"
            disabled={loading}
            onClick={() => {
              setAppliedFrom(draftFrom);
              setAppliedTo(draftTo);
            }}
          >
            Apply range
          </button>
        </div>
      </header>

      {error && (
        <p className="deliverables-overall-card__error" role="alert">
          {error}
        </p>
      )}
      {loading && !payload && (
        <p className="deliverables-overall-card__loading">Loading deliverables…</p>
      )}

      {payload && (
        <>
          <div className="deliverables-overall-card__body">
            <div className="deliverables-overall-card__split">
              <div className="deliverables-overall-card__section">
                <div className="deliverables-overall-card__section-head">
                  <span
                    className="deliverables-overall-card__icon-wrap deliverables-overall-card__icon-wrap--programs"
                    aria-hidden
                  >
                    <FiShoppingBag />
                  </span>
                  <h3 className="deliverables-overall-card__section-title">
                    Programs — total delivered
                  </h3>
                </div>
                {programsList.length === 0 ? (
                  <p className="deliverables-overall-card__empty">No programs in scope.</p>
                ) : (
                  <ul className="deliverables-overall-card__list">
                    {programsList.map((row) => (
                      <li key={row.key} className="deliverables-overall-card__row">
                        <span className="deliverables-overall-card__row-label" title={row.label}>
                          {row.label}
                        </span>
                        <span className="deliverables-overall-card__row-value">
                          {formatCount(Number(row.totalDelivered) || 0)}
                        </span>
                      </li>
                    ))}
                  </ul>
                )}
                <div className="deliverables-overall-card__section-footer">
                  <span>Total</span>
                  <span>{formatCount(programsTotal)}</span>
                </div>
              </div>

              <div className="deliverables-overall-card__divider" aria-hidden />

              <div className="deliverables-overall-card__section">
                <div className="deliverables-overall-card__section-head">
                  <span
                    className="deliverables-overall-card__icon-wrap deliverables-overall-card__icon-wrap--vuln"
                    aria-hidden
                  >
                    <FiHeart />
                  </span>
                  <h3 className="deliverables-overall-card__section-title">
                    Vulnerabilities — total (all programs)
                  </h3>
                </div>
                {vulnerabilities.length === 0 ? (
                  <p className="deliverables-overall-card__empty">No vulnerability data.</p>
                ) : (
                  <ul className="deliverables-overall-card__list">
                    {vulnerabilities.map((row) => (
                      <li key={row.key} className="deliverables-overall-card__row">
                        <span className="deliverables-overall-card__row-label">{row.label}</span>
                        <span className="deliverables-overall-card__row-value">
                          {formatCount(Number(row.total) || 0)}
                        </span>
                      </li>
                    ))}
                  </ul>
                )}
                <div className="deliverables-overall-card__section-footer">
                  <span>Total</span>
                  <span>{formatCount(vulnerabilitiesTotal)}</span>
                </div>
              </div>
            </div>
          </div>

          <div className="deliverables-overall-card__carousel" aria-labelledby={carouselHeadingId}>
            <div className="deliverables-overall-card__carousel-top">
              <h3 id={carouselHeadingId} className="deliverables-overall-card__carousel-title">
                By program — vulnerabilities
              </h3>
              <div className="deliverables-overall-card__carousel-nav">
                <button
                  type="button"
                  className="deliverables-overall-card__carousel-nav-btn"
                  onClick={() => scrollCarouselByDir(-1)}
                  disabled={!canPrev}
                  aria-label="Scroll to previous program cards"
                >
                  <FiChevronLeft size={20} />
                </button>
                <button
                  type="button"
                  className="deliverables-overall-card__carousel-nav-btn"
                  onClick={() => scrollCarouselByDir(1)}
                  disabled={!canNext}
                  aria-label="Scroll to next program cards"
                >
                  <FiChevronRight size={20} />
                </button>
              </div>
            </div>
            <div className="deliverables-overall-card__carousel-viewport">
              <div ref={trackRef} className="deliverables-overall-card__carousel-track" role="list">
                {programVulnerabilityCards.map((card) => (
                  <div key={card.key} className="deliverables-overall-card__carousel-item" role="listitem">
                    <DeliverablesProgramMiniCard card={card} />
                  </div>
                ))}
              </div>
            </div>
          </div>
        </>
      )}
    </section>
  );
}
