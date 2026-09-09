import React from 'react';
import Navbar from '../../Navbar';
import PageHeader from '../../common/PageHeader';
import FundraisingDashboard from '../../common/charts/fundraising_dashboard';

const RECURRING_CARD_KEYS = [
  'total_recurring_collection',
  'total_pending_installments_amount',
  'recurring_donors_count',
  'recurring_donations_count',
  'total_donations_amount',
  'total_donations_count',
  'individual_donors_count',
  'corporate_donors_count',
  'multi_time_donors_count',
];

const RecurringPerformanceDashboardPage = () => {
  return (
    <>
      <Navbar />
      <div className="list-wrapper">
        <PageHeader
          title="Recurring Performance"
          showBackButton={false}
          showAdd={false}
        />
        <div className="list-content">
          <FundraisingDashboard
            months={12}
            apiEndpoint="/dashboard/recurring-performance"
            storageKeyPrefix="recurring-performance-dashboard"
            cardsTitle="Recurring performance"
            cardKeys={RECURRING_CARD_KEYS}
            forbiddenMessage="You do not have permission to view recurring performance dashboard."
            showCumulative={false}
            showOverviewComparison={false}
          />
        </div>
      </div>
    </>
  );
};

export default RecurringPerformanceDashboardPage;
