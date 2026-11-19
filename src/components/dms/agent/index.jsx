import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Navbar from '../../Navbar';
import axios from '../../../utils/axios';
import { useAuth } from '../../../context/AuthContext';
import { canAccessAgentScreen } from '../../../utils/permissions';
import './agentScreen.css';

const formatRs = (value) =>
  `Rs ${Math.round(Number(value || 0)).toLocaleString('en-US')}`;

const stopTitle = (box) =>
  box?.name || box?.shop_name || box?.box_id_no || `Box #${box?.id || ''}`;

const stopMeta = (box, { includeLastAmount = false } = {}) => {
  const parts = [];
  if (box?.box_id_no) parts.push(String(box.box_id_no).startsWith('Box') ? box.box_id_no : `Box ${box.box_id_no}`);
  if (box?.box_type) parts.push(String(box.box_type).toLowerCase());
  if (includeLastAmount && Number(box?.last_amount || 0) > 0) {
    parts.push(`last ${formatRs(box.last_amount)}`);
  } else if (box?.landmark_marketplace) {
    parts.push(`near ${box.landmark_marketplace}`);
  } else if (box?.city) {
    parts.push(box.city);
  }
  return parts.join(' · ');
};

const AgentScreen = () => {
  const navigate = useNavigate();
  const { permissions, user } = useAuth();
  const allowed = canAccessAgentScreen(permissions, user);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [stops, setStops] = useState([]);
  const [pendingCash, setPendingCash] = useState({ count: 0, total: 0 });

  const fetchAgentData = useCallback(async () => {
    try {
      setLoading(true);
      setError('');

      const [monitorRes, inactiveRes, pendingRes] = await Promise.all([
        axios.get('/donation-box-collections/monitor', {
          params: { status: 'overdue' },
        }),
        axios.get('/donation-box', {
          params: {
            status: 'inactive',
            page: 1,
            pageSize: 20,
            sortField: 'updated_at',
            sortOrder: 'DESC',
          },
        }),
        axios.get('/donation-box-donation', {
          params: {
            status: 'pending',
            page: 1,
            pageSize: 100,
            sortField: 'collection_date',
            sortOrder: 'DESC',
          },
        }),
      ]);

      const overdueBoxes = monitorRes.data?.success
        ? monitorRes.data.data?.boxes || []
        : [];
      const inactiveBoxes = inactiveRes.data?.success
        ? inactiveRes.data.data || []
        : [];

      const dueStops = overdueBoxes.map((box) => {
        const neverCollected = box.days_ago == null || !box.last_emptied_date;
        return {
          id: box.id,
          key: `due-${box.id}`,
          title: stopTitle(box),
          meta: stopMeta(box, { includeLastAmount: !neverCollected }),
          statusText: neverCollected
            ? 'No collection ever logged'
            : `Due — ${box.days_ago} day${box.days_ago === 1 ? '' : 's'} since last visit`,
          statusTone: neverCollected ? 'alert' : 'due',
          actionLabel: neverCollected ? 'Check' : 'Collect',
          actionType: neverCollected ? 'check' : 'collect',
        };
      });

      const inactiveStops = inactiveBoxes
        .filter((box) => !dueStops.some((stop) => Number(stop.id) === Number(box.id)))
        .map((box) => ({
          id: box.id,
          key: `inactive-${box.id}`,
          title: stopTitle(box),
          meta: stopMeta({
            ...box,
            city: box.city?.name || box.city || null,
          }),
          statusText: 'Marked inactive — check box',
          statusTone: 'alert',
          actionLabel: 'Check',
          actionType: 'check',
        }));

      setStops([...dueStops, ...inactiveStops]);

      const pendingRows = pendingRes.data?.success
        ? pendingRes.data.data || []
        : [];
      const total =
        Number(
          pendingRes.data?.totalDonationAmount ??
            pendingRes.data?.total_donation_amount ??
            0,
        ) ||
        pendingRows.reduce(
          (sum, row) => sum + Number(row.collection_amount || 0),
          0,
        );
      setPendingCash({
        count: pendingRes.data?.pagination?.total ?? pendingRows.length,
        total,
      });
    } catch (err) {
      setError(
        err?.response?.data?.message ||
          err.message ||
          'Failed to load agent screen',
      );
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (!allowed) return;
    fetchAgentData();
  }, [allowed, fetchAgentData]);

  const stopCountLabel = useMemo(() => {
    const count = stops.length;
    return `${count} stop${count === 1 ? '' : 's'}`;
  }, [stops.length]);

  const handleCollect = (boxId) => {
    navigate(`/dms/donation-box-donations/add/${boxId}`);
  };

  const handleCheck = (boxId) => {
    navigate(`/dms/donation_box/view/${boxId}`);
  };

  const handleStopAction = (stop) => {
    if (stop.actionType === 'collect') handleCollect(stop.id);
    else handleCheck(stop.id);
  };

  if (!allowed) {
    return (
      <>
        <Navbar />
        <div className="agent-screen">
          <div className="agent-screen__denied">
            Agent Screen is available to fundraising users with Collection Units,
            Donors, and Donations permissions.
          </div>
        </div>
      </>
    );
  }

  return (
    <>
      <Navbar />
      <div className="agent-screen">
        <div className="agent-screen__wrap">
          <div className="agent-screen__actions">
            <button
              type="button"
              className="agent-screen__btn agent-screen__btn--primary"
              onClick={() => navigate('/dms/donation-box-donations/add')}
            >
              Log collection
            </button>
            <button
              type="button"
              className="agent-screen__btn agent-screen__btn--secondary"
              onClick={() => navigate('/donations/offline_donations/add')}
            >
              Add donation
            </button>
          </div>

          <div className="agent-screen__section-head">
            <h2>Boxes due today</h2>
            <span>{stopCountLabel}</span>
          </div>

          {loading && <div className="agent-screen__loading">Loading stops…</div>}
          {!loading && error && <div className="agent-screen__error">{error}</div>}
          {!loading && !error && stops.length === 0 && (
            <div className="agent-screen__empty">No boxes due right now.</div>
          )}

          {!loading && !error && stops.length > 0 && (
            <div className="agent-screen__list">
              {stops.map((stop) => (
                <article className="agent-screen__card" key={stop.key}>
                  <div className="agent-screen__card-main">
                    <h3 className="agent-screen__card-title">{stop.title}</h3>
                    <p className="agent-screen__card-meta">{stop.meta}</p>
                    <p
                      className={`agent-screen__card-status agent-screen__card-status--${stop.statusTone}`}
                    >
                      {stop.statusText}
                    </p>
                  </div>
                  <button
                    type="button"
                    className="agent-screen__card-action"
                    onClick={() => handleStopAction(stop)}
                  >
                    {stop.actionLabel}
                  </button>
                </article>
              ))}
            </div>
          )}
        </div>

        <div className="agent-screen__cash">
          <div className="agent-screen__cash-inner">
            <div className="agent-screen__cash-copy">
              <strong>Cash not yet submitted</strong>
              <span>
                {pendingCash.count} collection
                {pendingCash.count === 1 ? '' : 's'} · hand over to Accounts
              </span>
            </div>
            <div className="agent-screen__cash-amount">
              {formatRs(pendingCash.total)}
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

export default AgentScreen;
