import React, { useState, useEffect } from 'react';
import axiosInstance from '../../../../utils/axios';
import FundraisingCards from '../fundraising_cards';
import CumulativeChart from '../cumulative_chart';
import RaisedEachMonthChart from '../raised_each_month_chart';
import {
  DUMMY_CARDS,
  DUMMY_CUMULATIVE,
  DUMMY_RAISED_EACH_MONTH,
} from '../fundraising_demo';
import '../fundraising_demo/index.css';

const DEFAULT_MONTHS = 12;

/**
 * Maps API fundraising-overview response to chart data shapes.
 */
function mapApiToCharts(apiData) {
  if (!apiData?.cumulative?.length && !apiData?.raised_per_month?.length) {
    return {
      cumulative: DUMMY_CUMULATIVE,
      raisedEachMonth: DUMMY_RAISED_EACH_MONTH,
    };
  }
  const cumulative = {
    labels: (apiData.cumulative || []).map((r) => r.month),
    values: (apiData.cumulative || []).map((r) => Number(r.total_cumulative ?? 0)),
  };
  const raised = apiData.raised_per_month || [];
  const raisedEachMonth = {
    labels: raised.map((r) => r.month),
    datasets: [
      { label: 'Online', data: raised.map((r) => Number(r.online ?? 0)) },
      { label: 'Phone', data: raised.map((r) => Number(r.phone ?? 0)) },
      { label: 'Events', data: raised.map((r) => Number(r.events ?? 0)) },
      { label: 'Corporate', data: raised.map((r) => Number(r.corporate ?? 0)) },
      { label: 'Donation box', data: raised.map((r) => Number(r.donation_box ?? 0)) },
      { label: 'Campaigns', data: raised.map((r) => Number(r.campaigns ?? 0)) },
    ].filter((ds) => ds.data.some((v) => v > 0)), // only show datasets with data
  };
  if (raisedEachMonth.datasets.length === 0) {
    raisedEachMonth.datasets = DUMMY_RAISED_EACH_MONTH.datasets;
  }
  return { cumulative, raisedEachMonth };
}

/**
 * Fundraising dashboard: fetches from GET /dashboard/fundraising-overview,
 * renders cards + cumulative + raised each month. Falls back to dummy data on error.
 */
const FundraisingDashboard = ({ months = DEFAULT_MONTHS }) => {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [cards, setCards] = useState(DUMMY_CARDS);
  const [cumulativeData, setCumulativeData] = useState(DUMMY_CUMULATIVE);
  const [raisedEachMonthData, setRaisedEachMonthData] = useState(DUMMY_RAISED_EACH_MONTH);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError(null);
    axiosInstance
      .get('/dashboard/fundraising-overview', { params: { months } })
      .then((res) => {
        if (cancelled) return;
        const raw = res?.data?.data;
        if (raw?.cards) {
          setCards(raw.cards);
        }
        const { cumulative, raisedEachMonth } = mapApiToCharts(raw);
        setCumulativeData(cumulative);
        setRaisedEachMonthData(raisedEachMonth);
      })
      .catch((err) => {
        if (!cancelled) {
          setError(err?.response?.data?.message || err?.message || 'Failed to load fundraising data');
          setCards(DUMMY_CARDS);
          setCumulativeData(DUMMY_CUMULATIVE);
          setRaisedEachMonthData(DUMMY_RAISED_EACH_MONTH);
        }
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => { cancelled = true; };
  }, [months]);

  if (loading) {
    return (
      <div className="fundraising-charts-demo" style={{ padding: 24, textAlign: 'center' }}>
        Loading fundraising data…
      </div>
    );
  }

  return (
    <div className="fundraising-charts-demo">
      {error && (
        <div style={{ marginBottom: 12, padding: 8, background: '#fef3cd', borderRadius: 4 }}>
          {error} (showing sample data)
        </div>
      )}
      <div className="fundraising-charts-demo__cards">
        <FundraisingCards cards={cards} title="Fundraising overview" />
      </div>
      <div className="fundraising-charts-demo__chart">
        <CumulativeChart title="Cumulative" data={cumulativeData} height={280} />
      </div>
      <div className="fundraising-charts-demo__chart">
        <RaisedEachMonthChart
          title="Raised each month"
          data={raisedEachMonthData}
          height={320}
        />
      </div>
    </div>
  );
};

export default FundraisingDashboard;
