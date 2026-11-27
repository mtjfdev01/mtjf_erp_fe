import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import axiosInstance from '../../../../utils/axios';
import Navbar from '../../../Navbar';
import PageHeader from '../../../common/PageHeader';
import FormInput from '../../../common/FormInput';
import './placementHistory.css';

const formatDate = (value) => {
  if (!value) return '—';
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return String(value).slice(0, 10);
  return d.toLocaleDateString('en-GB', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  });
};

const formatCurrency = (amount) => {
  const num = Number(amount) || 0;
  return `Rs. ${num.toLocaleString('en-PK', {
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  })}`;
};

const monthStart = () => {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-01`;
};

const today = () => new Date().toISOString().slice(0, 10);

/**
 * @param {'box' | 'poc'} mode
 */
const PlacementHistoryPage = ({ mode = 'box' }) => {
  const { id } = useParams();
  const navigate = useNavigate();
  const isPocMode = mode === 'poc';

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [header, setHeader] = useState(null);
  const [placements, setPlacements] = useState([]);
  const [summary, setSummary] = useState(null);
  const [startDate, setStartDate] = useState(monthStart);
  const [endDate, setEndDate] = useState(today);

  const title = isPocMode
    ? `POC History — ${header?.name || `#${id}`}`
    : `Collection Unit History — ${
        header?.box_id_no || header?.shop_name || header?.name || `#${id}`
      }`;

  const backPath = isPocMode
    ? header?.donation_box_id
      ? `/dms/donation_box/profile/${header.donation_box_id}`
      : `/dms/csr-pocs/list`
    : `/dms/donation_box/view/${id}`;

  const fetchHistory = useCallback(async () => {
    if (!id) return;
    setLoading(true);
    setError('');
    try {
      const params = {};
      if (startDate) params.start_date = startDate;
      if (endDate) params.end_date = endDate;

      if (isPocMode) {
        const [pocRes, historyRes] = await Promise.all([
          axiosInstance.get(`/csr-pocs/${id}`).catch(() => null),
          axiosInstance.get(`/donation-box/history/by-poc/${id}`, { params }),
        ]);
        const pocData = pocRes?.data?.data || historyRes.data?.data?.poc || null;
        setHeader(pocData);
        const payload = historyRes.data?.data || {};
        setPlacements(Array.isArray(payload.placements) ? payload.placements : []);
        setSummary(payload.summary || null);
      } else {
        const [boxRes, historyRes] = await Promise.all([
          axiosInstance.get(`/donation-box/${id}`),
          axiosInstance.get(`/donation-box/${id}/placement-history`, { params }),
        ]);
        if (!boxRes.data?.success) {
          throw new Error(boxRes.data?.message || 'Failed to load collection unit');
        }
        setHeader(boxRes.data.data);
        const payload = historyRes.data?.data || {};
        setPlacements(Array.isArray(payload.placements) ? payload.placements : []);
        setSummary(payload.summary || null);
      }
    } catch (err) {
      setError(
        err.response?.data?.message ||
          err.message ||
          'Failed to load placement history',
      );
      setPlacements([]);
      setSummary(null);
    } finally {
      setLoading(false);
    }
  }, [endDate, id, isPocMode, startDate]);

  useEffect(() => {
    fetchHistory();
  }, [fetchHistory]);

  const uniqueCounterparts = useMemo(() => {
    const map = new Map();
    placements.forEach((row) => {
      if (isPocMode) {
        const box = row.donation_box;
        if (box?.id && !map.has(box.id)) map.set(box.id, box);
      } else {
        const poc = row.poc;
        if (poc?.id && !map.has(poc.id)) map.set(poc.id, poc);
      }
    });
    return Array.from(map.values());
  }, [isPocMode, placements]);

  return (
    <>
      <Navbar />
      <div className="form-content placement-history-page">
        <PageHeader title={title} onBack={() => navigate(backPath)} />

        <div className="placement-history-toolbar">
          <FormInput
            label="From"
            type="date"
            name="start_date"
            value={startDate}
            onChange={(e) => setStartDate(e.target.value)}
          />
          <FormInput
            label="To"
            type="date"
            name="end_date"
            value={endDate}
            onChange={(e) => setEndDate(e.target.value)}
          />
          <button type="button" className="primary_btn" onClick={fetchHistory}>
            Apply range
          </button>
          {!isPocMode && (
            <Link
              to={`/dms/donation_box/relocate/${id}`}
              className="secondary_btn"
              style={{ textDecoration: 'none' }}
            >
              Relocate unit
            </Link>
          )}
          {isPocMode && header?.donation_box_id ? (
            <Link
              to={`/dms/donation_box/history/${header.donation_box_id}`}
              className="secondary_btn"
              style={{ textDecoration: 'none' }}
            >
              Open linked unit history
            </Link>
          ) : null}
        </div>

        {error && <div className="status-message status-message--error">{error}</div>}

        <div className="placement-history-summary">
          <div className="placement-history-stat">
            <span className="placement-history-stat__label">
              Collected in range
            </span>
            <span className="placement-history-stat__value">
              {formatCurrency(summary?.collection_amount)}
            </span>
          </div>
          <div className="placement-history-stat">
            <span className="placement-history-stat__label">Collections</span>
            <span className="placement-history-stat__value">
              {summary?.collection_count ?? 0}
            </span>
          </div>
          <div className="placement-history-stat">
            <span className="placement-history-stat__label">Placements</span>
            <span className="placement-history-stat__value">
              {summary?.placement_count ?? placements.length}
            </span>
          </div>
          <div className="placement-history-stat">
            <span className="placement-history-stat__label">
              {isPocMode ? 'Boxes linked' : 'POCs linked'}
            </span>
            <span className="placement-history-stat__value">
              {uniqueCounterparts.length}
            </span>
          </div>
        </div>

        <div className="form-section">
          <h3 className="form-section-heading">
            {isPocMode ? 'Boxes attached to this POC' : 'POCs attached to this unit'}
          </h3>
          {uniqueCounterparts.length === 0 ? (
            <p className="placement-history-empty">No linked records in this range.</p>
          ) : (
            <div className="placement-history-chips">
              {uniqueCounterparts.map((item) =>
                isPocMode ? (
                  <Link
                    key={item.id}
                    className="placement-history-chip"
                    to={`/dms/donation_box/history/${item.id}`}
                  >
                    {item.box_id_no || item.shop_name || item.name || `Box #${item.id}`}
                  </Link>
                ) : (
                  <Link
                    key={item.id}
                    className="placement-history-chip"
                    to={`/dms/csr-pocs/history/${item.id}`}
                  >
                    {item.name || `POC #${item.id}`}
                    {item.phone ? ` · ${item.phone}` : ''}
                  </Link>
                ),
              )}
            </div>
          )}
        </div>

        <div className="form-section">
          <h3 className="form-section-heading">Placement timeline</h3>
          {loading ? (
            <div className="loading">Loading history…</div>
          ) : placements.length === 0 ? (
            <p className="placement-history-empty">
              No placement periods found for the selected dates.
            </p>
          ) : (
            <div className="table-responsive">
              <table className="data-table">
                <thead>
                  <tr>
                    <th>Period</th>
                    <th>Shop</th>
                    {isPocMode ? <th>Collection unit</th> : <th>POC</th>}
                    <th>City / Route</th>
                    <th>Collected</th>
                    <th>Count</th>
                    <th>Status</th>
                  </tr>
                </thead>
                <tbody>
                  {placements.map((row) => (
                    <tr key={row.id}>
                      <td>
                        {formatDate(row.started_at)}
                        {' → '}
                        {row.ended_at ? formatDate(row.ended_at) : 'Present'}
                      </td>
                      <td>
                        <div>{row.shop_name || '—'}</div>
                        <div className="placement-history-muted">
                          {row.shopkeeper || '—'}
                          {row.cell_no ? ` · ${row.cell_no}` : ''}
                        </div>
                      </td>
                      <td>
                        {isPocMode ? (
                          row.donation_box ? (
                            <Link to={`/dms/donation_box/history/${row.donation_box.id}`}>
                              {row.donation_box.box_id_no ||
                                row.donation_box.shop_name ||
                                row.donation_box.name ||
                                `Box #${row.donation_box.id}`}
                            </Link>
                          ) : (
                            '—'
                          )
                        ) : row.poc ? (
                          <Link to={`/dms/csr-pocs/history/${row.poc.id}`}>
                            {row.poc.name}
                          </Link>
                        ) : (
                          row.shopkeeper || '—'
                        )}
                      </td>
                      <td>
                        {[row.city?.name, row.route?.name].filter(Boolean).join(' · ') ||
                          '—'}
                      </td>
                      <td>{formatCurrency(row.collection_amount)}</td>
                      <td>{row.collection_count ?? 0}</td>
                      <td>
                        <span
                          className={`placement-history-pill${
                            row.is_current ? ' is-current' : ''
                          }`}
                        >
                          {row.is_current ? 'Current' : 'Ended'}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </>
  );
};

export const CollectionUnitHistory = () => <PlacementHistoryPage mode="box" />;
export const PocHistory = () => <PlacementHistoryPage mode="poc" />;
export default CollectionUnitHistory;
