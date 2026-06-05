import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import axiosInstance from '../../../../utils/axios';
import Navbar from '../../../Navbar';
import PageHeader from '../../../common/PageHeader';
import { FiRepeat, FiUser, FiDollarSign } from 'react-icons/fi';

const RecurringDonationView = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const load = async () => {
      try {
        setLoading(true);
        const response = await axiosInstance.get(`/recurring-donations/${id}`);
        if (response.data.success) {
          setData(response.data.data);
          setError('');
        } else {
          setError(response.data.message || 'Failed to load recurring donation');
        }
      } catch (err) {
        setError(err.response?.data?.message || 'Failed to load recurring donation');
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [id]);

  const formatAmount = (amount, currency) => {
    if (amount == null) return '-';
    return `${currency || 'PKR'} ${Number(amount).toLocaleString('en-PK', { minimumFractionDigits: 0 })}`;
  };

  const formatDate = (value) => {
    if (!value) return '-';
    return new Date(value).toLocaleString();
  };

  const donorLabel = (donor) => {
    if (!donor) return '-';
    return donor.name || [donor.first_name, donor.last_name].filter(Boolean).join(' ') || donor.email;
  };

  if (loading) {
    return (
      <>
        <Navbar />
        <div className="view-wrapper">
          <PageHeader title="Recurring Donation" showBackButton backPath="/dms/recurring-donations/list" />
          <div className="loading">Loading...</div>
        </div>
      </>
    );
  }

  if (error || !data?.subscription) {
    return (
      <>
        <Navbar />
        <div className="view-wrapper">
          <PageHeader title="Recurring Donation" showBackButton backPath="/dms/recurring-donations/list" />
          <div className="error-message">{error || 'Not found'}</div>
        </div>
      </>
    );
  }

  const { subscription, installments, initial_donation, donor, summary } = data;

  return (
    <>
      <Navbar />
      <div className="view-wrapper">
        <PageHeader
          title={`Recurring Donation #${subscription.id}`}
          showBackButton
          backPath="/dms/recurring-donations/list"
          icon={<FiRepeat />}
        />

        <div className="view-content">
          <section className="view-section">
            <h3><FiRepeat style={{ marginRight: 8 }} />Subscription</h3>
            <div className="view-grid">
              <div><strong>Status</strong><p>{subscription.status}</p></div>
              <div><strong>Amount</strong><p>{formatAmount(subscription.amount, subscription.currency)}</p></div>
              <div><strong>Billing</strong><p>{subscription.billing_interval} (every {subscription.billing_interval_count || 1})</p></div>
              <div><strong>Stripe subscription</strong><p>{subscription.stripe_subscription_id || '-'}</p></div>
              <div><strong>Stripe customer</strong><p>{subscription.stripe_customer_id || '-'}</p></div>
              <div><strong>Method</strong><p>{subscription.donation_method || '-'}</p></div>
              <div><strong>Project</strong><p>{subscription.project_id || '-'}</p></div>
              <div><strong>Campaign</strong><p>{subscription.campaign_id || '-'}</p></div>
              <div><strong>Started</strong><p>{formatDate(subscription.created_at)}</p></div>
              <div><strong>Installments paid</strong><p>{summary?.installment_count ?? 0}</p></div>
              <div><strong>Total installment amount</strong><p>{formatAmount(summary?.total_paid_amount, subscription.currency)}</p></div>
            </div>
          </section>

          <section className="view-section">
            <h3><FiUser style={{ marginRight: 8 }} />Donor</h3>
            <div className="view-grid">
              <div><strong>Name</strong><p>{donorLabel(donor)}</p></div>
              <div><strong>Email</strong><p>{donor?.email || '-'}</p></div>
              <div><strong>Phone</strong><p>{donor?.phone || '-'}</p></div>
              {donor?.id && (
                <div>
                  <button type="button" className="btn-secondary" onClick={() => navigate(`/dms/donors/view/${donor.id}`)}>
                    Open donor profile
                  </button>
                </div>
              )}
            </div>
          </section>

          <section className="view-section">
            <h3><FiDollarSign style={{ marginRight: 8 }} />Initial donation</h3>
            <div className="view-grid">
              <div><strong>Donation ID</strong><p>{initial_donation?.id || subscription.initial_donation_id || '-'}</p></div>
              <div><strong>Order</strong><p>{initial_donation?.orderId || '-'}</p></div>
              <div><strong>Status</strong><p>{initial_donation?.status || '-'}</p></div>
              {initial_donation?.id && (
                <div>
                  <button
                    type="button"
                    className="btn-secondary"
                    onClick={() => navigate(`/donations/online_donations/view/${initial_donation.id}`)}
                  >
                    View initial donation
                  </button>
                </div>
              )}
            </div>
          </section>

          <section className="view-section">
            <h3>Installments</h3>
            <div className="table-container">
              <table className="data-table">
                <thead>
                  <tr>
                    <th>ID</th>
                    <th>Amount</th>
                    <th>Status</th>
                    <th>Invoice</th>
                    <th>Paid at</th>
                    <th>Billing reason</th>
                  </tr>
                </thead>
                <tbody>
                  {installments?.length ? (
                    installments.map((inst) => (
                      <tr key={inst.id}>
                        <td>{inst.id}</td>
                        <td>{formatAmount(inst.amount, inst.currency || subscription.currency)}</td>
                        <td>{inst.status}</td>
                        <td style={{ maxWidth: 160, overflow: 'hidden', textOverflow: 'ellipsis' }}>
                          {inst.stripe_invoice_id || '-'}
                        </td>
                        <td>{formatDate(inst.paid_at)}</td>
                        <td>{inst.stripe_billing_reason || '-'}</td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan="6" style={{ textAlign: 'center' }}>
                        No installments recorded yet
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </section>
        </div>
      </div>
    </>
  );
};

export default RecurringDonationView;
