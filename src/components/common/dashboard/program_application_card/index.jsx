import React, { useCallback, useEffect, useId, useRef, useState } from 'react';
import { FiChevronLeft, FiChevronRight } from 'react-icons/fi';
import {
  FiBook,
  FiDroplet,
  FiHeart,
  FiLayers,
  FiShoppingBag,
  FiTool,
  FiUsers,
} from 'react-icons/fi';

import '../../../../styles/variables.css';
import './ProgramApplicationCard.css';
import { PROGRAM_APPLICATION_CARD_DUMMY_DATA } from './dummyData';
import axiosInstance from '../../../../utils/axios';
import { fetchProgramApplicationOverviewCardsFromServer } from '../../../../utils/programApplicationOverviewApi';
import Modal from '../../Modal';

const ICON_MAP = {
  bag: FiShoppingBag,
  users: FiUsers,
  heart: FiHeart,
  book: FiBook,
  droplet: FiDroplet,
  tool: FiTool,
  shopping: FiShoppingBag,
  layers: FiLayers,
};

function formatCount(n) {
  return typeof n === 'number' ? n.toLocaleString() : n;
}

/** Key/value object for `Modal` `details` prop */
function rowToModalDetails(row) {
  const details = {
    Applications: formatCount(row.total),
    Investigated: formatCount(Number(row.investigated) || 0),
    Verified: formatCount(Number(row.verified) || 0),
    Approved: formatCount(Number(row.approved) || 0),
    Rejected: formatCount(Number(row.rejected) || 0),
  };
  if (typeof row.pendingTotal === 'number') {
    details['Pending (overall)'] = formatCount(row.pendingTotal);
  }
  if (typeof row.approvalRate === 'number') {
    details['Approval rate'] = `${row.approvalRate}%`;
  }
  return details;
}

function ProgramApplicationCardItem({ row }) {
  const Icon = ICON_MAP[row.icon] || FiShoppingBag;

  return (
    <>
      <div className="program-application-card__card-top">
        <div className="program-application-card__identity">
          <span
            className="program-application-card__icon-wrap"
            style={{ background: row.accentSoft || '#f3f4f6', color: row.accent }}
          >
            <Icon aria-hidden />
          </span>
          <h3 className="program-application-card__name">{row?.name?.length > 15 ? row?.name?.slice(0,10) + '..' : row?.name}</h3>
        </div>
        <div className="program-application-card__total-wrap">
          {/* <span className="program-application-card__total-caption">Applications</span> */}
          <p className="program-application-card__total">{formatCount(row.total)}</p>
        </div>
      </div>

      <div className="program-application-card__footer">
        <div className="program-application-card__footer-row">
          <div className="program-application-card__stat">
            <span className="program-application-card__stat-label">Invtg.</span>
            <span className="program-application-card__stat-value program-application-card__stat-value--investigated">
              {formatCount(Number(row.investigated) || 0)}
            </span>
          </div>
          <div className="program-application-card__stat">
            <span className="program-application-card__stat-label">Verified</span>
            <span className="program-application-card__stat-value program-application-card__stat-value--verified">
              {formatCount(Number(row.verified) || 0)}
            </span>
          </div>
        </div>
        <div className="program-application-card__footer-row">
          <div className="program-application-card__stat">
            <span className="program-application-card__stat-label">Approved</span>
            <span className="program-application-card__stat-value program-application-card__stat-value--approved">
              {formatCount(row.approved)}
            </span>
          </div>
          <div className="program-application-card__stat">
            <span className="program-application-card__stat-label">Rejected</span>
            <span className="program-application-card__stat-value program-application-card__stat-value--rejected">
              {formatCount(row.rejected)}
            </span>
          </div>
        </div>
      </div>
    </>
  );
}

/**
 * Program Overview (Applications) — horizontal carousel, mobile-first.
 * Loads data from `GET /new-dashboard/dashboard-report/program-application-overview` via axios unless `items` is passed.
 *
 * @param {object} props
 * @param {Array} [props.items] — if set, used as-is (no API call)
 * @param {string} [props.from] — YYYY-MM-DD filter (optional)
 * @param {string} [props.to] — YYYY-MM-DD filter (optional)
 * @param {string} [props.title]
 * @param {string} [props.subtitle]
 * @param {string} [props.className]
 */
export default function ProgramApplicationCard({
  items: itemsProp,
  from,
  to,
  title = 'Program Overview (Applications)',
  subtitle,
  className = '',
}) {
  const headingId = useId();
  const trackRef = useRef(null);
  const [canPrev, setCanPrev] = useState(false);
  const [canNext, setCanNext] = useState(true);

  const [items, setItems] = useState(() => (Array.isArray(itemsProp) ? itemsProp : []));
  const [loading, setLoading] = useState(() => !Array.isArray(itemsProp));
  const [fetchError, setFetchError] = useState(null);
  const [modalRow, setModalRow] = useState(null);

  useEffect(() => {
    if (Array.isArray(itemsProp)) {
      setItems(itemsProp);
      setLoading(false);
      setFetchError(null);
      return undefined;
    }

    let cancelled = false;
    (async () => {
      try {
        setLoading(true);
        setFetchError(null);
        const data = await fetchProgramApplicationOverviewCardsFromServer({
          from,
          to,
          client: axiosInstance,
        });
        if (!cancelled) setItems(Array.isArray(data) ? data : []);
      } catch (err) {
        if (!cancelled) {
          setFetchError(err?.message || 'Failed to load program overview');
          setItems(PROGRAM_APPLICATION_CARD_DUMMY_DATA);
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [itemsProp, from, to]);

  const defaultSubtitle =
    subtitle ??
    (loading && items.length === 0
      ? 'Loading…'
      : `Total ${items.length} Program${items.length === 1 ? '' : 's'}`);

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
  }, [items, updateScrollState]);

  const scrollByDir = (direction) => {
    const el = trackRef.current;
    if (!el) return;
    const firstWrap = el.querySelector('.program-application-card__card-wrap');
    const gap = parseFloat(getComputedStyle(el).gap) || 16;
    const step = firstWrap ? firstWrap.offsetWidth + gap : el.clientWidth * 0.85;
    el.scrollBy({ left: direction * step, behavior: 'smooth' });
  };

  return (
    <section
      className={`program-application-card-section ${className}`.trim()}
      aria-labelledby={headingId}
    >
      <header className="program-application-card__header">
        <div className="program-application-card__titles">
          <h2 id={headingId} className="program-application-card__title">
            {title}
          </h2>
          <p className="program-application-card__subtitle">{defaultSubtitle}</p>
          {fetchError && (
            <p className="program-application-card__fetch-warning" role="status">
              {fetchError} — showing sample data.
            </p>
          )}
        </div>
        <div className="program-application-card__nav">
          <button
            type="button"
            className="program-application-card__nav-btn"
            onClick={() => scrollByDir(-1)}
            disabled={!canPrev}
            aria-label="Show previous programs"
          >
            <FiChevronLeft size={20} />
          </button>
          <button
            type="button"
            className="program-application-card__nav-btn"
            onClick={() => scrollByDir(1)}
            disabled={!canNext}
            aria-label="Show next programs"
          >
            <FiChevronRight size={20} />
          </button>
        </div>
      </header>

      <div className="program-application-card__viewport">
        {loading && items.length === 0 ? (
          <p className="program-application-card__loading">Loading program overview…</p>
        ) : (
          <div ref={trackRef} className="program-application-card__track" role="list">
            {items.map((row) => (
              <div key={row.id} className="program-application-card__card-wrap" role="listitem">
                <button
                  type="button"
                  className="program-application-card__card program-application-card__card--trigger"
                  onClick={() => setModalRow(row)}
                  aria-label={`Open details for ${row.name}`}
                >
                  <ProgramApplicationCardItem row={row} />
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      <Modal
        open={modalRow != null}
        onClose={() => setModalRow(null)}
        title={modalRow?.name}
        details={modalRow ? rowToModalDetails(modalRow) : null}
      />
    </section>
  );
}
