import React from 'react';
import CumulativeChart from '../cumulative_chart';
import RaisedEachMonthChart from '../raised_each_month_chart';
import FundraisingCards from '../fundraising_cards';
import './index.css';

// Dummy cards data — matches API GET /dashboard/fundraising-overview data.cards
const DUMMY_CARDS = {
  total_donations_amount: 2678000,
  total_donations_count: 60254,
  total_donors_count: 45000,
  online_donations_amount: 1284910,
  online_donations_count: 21741,
  donation_box_amount: 199000,
  donation_box_count: 320,
  csr_amount: 1400000,
  csr_count: 19,
  individual_amount: 1000000,
  individual_count: 60254,
  events_amount: 199000,
  events_count: 14,
  campaigns_amount: 150000,
  campaigns_count: 8,
};

// Dummy data for demo — replace with API data later
const DUMMY_CUMULATIVE = {
  labels: ['January', 'February', 'March', 'April', 'May', 'June'],
  values: [0, 400000, 800000, 1200000, 1800000, 2500000],
};

const DUMMY_RAISED_EACH_MONTH = {
  labels: ['January', 'February', 'March', 'April', 'May', 'June'],
  datasets: [
    { label: 'Online', data: [120000, 180000, 480000, 220000, 320000, 280000] },
    { label: 'Phone', data: [20000, 25000, 30000, 22000, 28000, 25000] },
    { label: 'Events', data: [15000, 12000, 18000, 14000, 16000, 22000] },
    { label: 'Corporate', data: [0, 0, 5000, 0, 10000, 95000] },
  ],
};

/**
 * Demo wrapper: Horizontal cards + Cumulative + Raised each month with dummy data.
 * Use FundraisingCards, CumulativeChart and RaisedEachMonthChart with API data in production.
 */
const FundraisingChartsDemo = () => (
  <div className="fundraising-charts-demo">
    <div className="fundraising-charts-demo__cards">
      <FundraisingCards cards={DUMMY_CARDS} title="Fundraising overview" />
    </div>
    <div className="fundraising-charts-demo__chart">
      <CumulativeChart
        title="Cumulative"
        data={DUMMY_CUMULATIVE}
        height={280}
      />
    </div>
    <div className="fundraising-charts-demo__chart">
      <RaisedEachMonthChart
        title="Raised each month"
        data={DUMMY_RAISED_EACH_MONTH}
        height={320}
      />
    </div>
  </div>
);

export default FundraisingChartsDemo;
export { DUMMY_CARDS, DUMMY_CUMULATIVE, DUMMY_RAISED_EACH_MONTH };
