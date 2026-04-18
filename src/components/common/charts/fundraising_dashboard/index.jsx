import React, { useState, useEffect, useMemo } from 'react';
import axiosInstance from '../../../../utils/axios';
import usePersistedFilters from '../../../../hooks/usePersistedFilters';
import FundraisingCards from '../fundraising_cards';
import CumulativeChart from '../cumulative_chart';
import RaisedEachMonthChart from '../raised_each_month_chart';
import { DropdownFilter, DateFilter, DateRangeFilter, SearchFilter } from '../../filters';
import { SearchButton, ClearButton } from '../../filters/index';
import MultiSelect from '../../MultiSelect';
import { projectCards } from '../../../../utils/variables';
import './styles.css';

const projectOptions = projectCards.map((p) => ({ value: p.id, label: p.title }));

const DEFAULT_MONTHS = 12;

const EMPTY_FILTERS = {
  donation_type: '',
  donation_method: '',
  ref: '',
  projects: [],
  date: '',
  start_date: '',
  end_date: '',
};

const donationTypeOptions = [
  { value: 'zakat', label: 'Zakat' },
  { value: 'sadqa', label: 'Sadqa' },
  { value: 'general', label: 'General' },
];

const donationMethodOptions = [
  { value: 'cash', label: 'Cash' },
  { value: 'cheque', label: 'Cheque' },
  { value: 'in_kind', label: 'In Kind' },
  { value: 'bank_transfer', label: 'Bank Transfer' },
  { value: 'online', label: 'Online (Manual)' },
  { value: 'meezan', label: 'Meezan Bank' },
  { value: 'blinq', label: 'Blinq' },
  { value: 'payfast', label: 'Payfast' },
  { value: 'stripe', label: 'Stripe' },
  { value: 'stripe_embed', label: 'Stripe Embed' },
];

function mapApiToCharts(apiData) {
  if (!apiData?.cumulative?.length && !apiData?.raised_per_month?.length) {
    return {
      cumulative: { labels: [], values: [] },
      raisedEachMonth: { labels: [], datasets: [] },
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
    ].filter((ds) => ds.data.some((v) => v > 0)),
  };
  return { cumulative, raisedEachMonth };
}

const FundraisingDashboard = ({ months = DEFAULT_MONTHS }) => {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isForbidden, setIsForbidden] = useState(false);
  const [cards, setCards] = useState(null);
  const [cumulativeData, setCumulativeData] = useState({ labels: [], values: [] });
  const [raisedEachMonthData, setRaisedEachMonthData] = useState({ labels: [], datasets: [] });
  const [tempFilters, setTempFilters] = usePersistedFilters('fundraising-dashboard:temp', EMPTY_FILTERS);
  const [appliedFilters, setAppliedFilters, clearAppliedFilters] = usePersistedFilters('fundraising-dashboard:applied', EMPTY_FILTERS);

  const handleFilterChange = (key, value) => {
    setTempFilters((prev) => ({ ...prev, [key]: value }));
  };

  const handleApplyFilters = () => {
    setAppliedFilters({ ...tempFilters });
  };

  const handleClearFilters = () => {
    setTempFilters(EMPTY_FILTERS);
    clearAppliedFilters();
  };

  const apiParams = useMemo(() => {
    const params = { months };
    if (appliedFilters.donation_type) params.donation_type = appliedFilters.donation_type;
    if (appliedFilters.donation_method) params.donation_method = appliedFilters.donation_method;
    if (typeof appliedFilters.ref === 'string' && appliedFilters.ref.trim()) {
      params.ref = appliedFilters.ref
        .split(',')
        .map((v) => v.trim())
        .filter(Boolean)
        .join(',');
    }
    if (appliedFilters.projects?.length) params.projects = appliedFilters.projects.join(',');
    if (appliedFilters.date) params.date = appliedFilters.date;
    if (appliedFilters.start_date) params.start_date = appliedFilters.start_date;
    if (appliedFilters.end_date) params.end_date = appliedFilters.end_date;
    return params;
  }, [months, appliedFilters]);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError(null);
    setIsForbidden(false);
    axiosInstance
      .get('/dashboard/fundraising-overview', { params: apiParams })
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
          const statusCode = err?.response?.status;
          if (statusCode === 401 || statusCode === 403) {
            setIsForbidden(true);
          }
          setError(err?.response?.data?.message || err?.message || 'Failed to load fundraising data');
          setCards(null);
          setCumulativeData({ labels: [], values: [] });
          setRaisedEachMonthData({ labels: [], datasets: [] });
        }
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => { cancelled = true; };
  }, [apiParams]);

  return (
    <div className="fundraising-charts-demo">
      {/* Filters Section */}
      {!isForbidden &&
      <div className="fundraising-charts-demo__filters">
        <DropdownFilter
          filterKey="donation_type"
          label="Donation Type"
          data={donationTypeOptions}
          filters={tempFilters}
          onFilterChange={handleFilterChange}
          placeholder="All Types"
        />
        <DropdownFilter
          filterKey="donation_method"
          label="Payment Method"
          data={donationMethodOptions}
          filters={tempFilters}
          onFilterChange={handleFilterChange}
          placeholder="All Methods"
        />
        <SearchFilter
          filterKey="ref"
          label="Ref/Campaign"
          filters={tempFilters}
          onFilterChange={handleFilterChange}
          placeholder="Comma-separated refs (e.g. MTJ-123,MTJ-456)"
        />
        {/* <MultiSelect
          name="projects"
          label="Projects"
          options={projectOptions}
          value={tempFilters.projects}
          onChange={(value) => handleFilterChange('projects', value)}
          placeholder="Select Projects"
        /> */}

        <DateFilter
          filterKey="date"
          label="Specific Date"
          filters={tempFilters}
          onFilterChange={handleFilterChange}
        />
        <DateRangeFilter
          startKey="start_date"
          endKey="end_date"
          label="Date Range"
          filters={tempFilters}
          onFilterChange={handleFilterChange}
        />
        <div className="fundraising-filters__actions" style={{ display: 'flex', gap: 8, alignItems: 'flex-end' }}>
          <SearchButton onClick={handleApplyFilters} text="Apply" loading={loading} />
          <ClearButton onClick={handleClearFilters} text="Clear" />
        </div>
      </div>
}

      {loading ? (
        <div className="fundraising-charts-demo__loading">
          Loading fundraising data…
        </div>
        ) : !error ? (
        <>
          <div className="fundraising-charts-demo__cards">
            <FundraisingCards cards={cards} title="Fundraising overview" />
          </div>

          <div className="fundraising-charts-demo__chart">
            <CumulativeChart
              title="Cumulative"
              data={cumulativeData}
              height={280}
            />
          </div>

          <div className="fundraising-charts-demo__chart">
            <RaisedEachMonthChart
              title="Raised each month"
              data={raisedEachMonthData}
              height={320}
            />
          </div>
        </>
        ) : (
        <div className="fundraising-charts-demo__error">
          {isForbidden
            ? 'You do not have permission to view fundraising dashboard.'
            : (error || 'Failed to load fundraising data.')}
        </div>
        )}
    </div>
  );
};

export default FundraisingDashboard;
