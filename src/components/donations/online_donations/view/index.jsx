import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axiosInstance from '../../../../../utils/axios';
import '../../../../styles/variables.css';
import '../../../../styles/components.css';
import Navbar from '../../../../Navbar';
import PageHeader from '../../../../common/PageHeader';

const ViewOnlineDonation = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [donation, setDonation] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    fetchDonation();
  }, [id]);

  const fetchDonation = async () => {
    try {
      setLoading(true);
      const response = await axiosInstance.get(`/donations/${id}`);
      
      if (response.data.success) {
        setDonation(response.data.data);
        setError('');
      } else {
        setError('Failed to fetch donation data');
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to fetch donation data. Please try again.');
      console.error('Error fetching donation:', err);
    } finally {
      setLoading(false);
    }
  };
  
  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString();
  };
  
  const formatAmount = (amount, currency = 'PKR') => {
    if (!amount) return '0';
    return `${currency} ${parseFloat(amount).toLocaleString()}`;
  };

  const getStatusBadge = (status) => {
    const statusMap = {
      'pending': { class: 'status-pending', text: 'Pending' },
      'completed': { class: 'status-completed', text: 'Completed' },
      'failed': { class: 'status-failed', text: 'Failed' },
      'cancelled': { class: 'status-cancelled', text: 'Cancelled' },
      'registered': { class: 'status-registered', text: 'Registered' }
    };
    
    const statusInfo = statusMap[status] || { class: 'status-pending', text: status };
    return <span className={`status-badge ${statusInfo.class}`}>{statusInfo.text}</span>;
  };

  if (loading) {
    return (
      <>
        <Navbar />
        <div className="view-wrapper">
          <PageHeader 
            title="View Online Donation"
            showBackButton={true}
            backPath="/donations/online_donations/list"
          />
          <div className="loading">Loading...</div>
        </div>
      </>
    );
  }

  if (error) {
    return (
      <>
        <Navbar />
        <div className="view-wrapper">
          <PageHeader 
            title="View Online Donation"
            showBackButton={true}
            backPath="/donations/online_donations/list"
          />
          <div className="view-content">
            <div className="status-message status-message--error">{error}</div>
          </div>
        </div>
      </>
    );
  }
  
  if (!donation) {
    return (
      <>
        <Navbar />
        <div className="view-wrapper">
          <PageHeader 
            title="View Online Donation"
            showBackButton={true}
            backPath="/donations/online_donations/list"
          />
          <div className="view-content">
            <div className="status-message status-message--error">Donation not found</div>
          </div>
        </div>
      </>
    );
  }

  return (
    <>
      <Navbar />
      <div className="view-wrapper">
        <PageHeader 
          title="View Online Donation"
          showBackButton={true}
          backPath="/donations/online_donations/list"
        />
        <div className="view-content">
          <div className="view-section">
            <h3 className="view-section-title">Donation Details</h3>
            <div className="view-grid">
              <div className="view-item">
                <span className="view-item-label">Donation ID</span>
                <span className="view-item-value">DON-{donation.id}</span>
              </div>
              <div className="view-item">
                <span className="view-item-label">Status</span>
                <span className="view-item-value">{getStatusBadge(donation.status)}</span>
              </div>
              <div className="view-item">
                <span className="view-item-label">Amount</span>
                <span className="view-item-value">{formatAmount(donation.amount, donation.currency)}</span>
              </div>
              <div className="view-item">
                <span className="view-item-label">Donation Date</span>
                <span className="view-item-value">{formatDate(donation.date || donation.created_at)}</span>
              </div>
              <div className="view-item">
                <span className="view-item-label">Type</span>
                <span className="view-item-value">
                  {donation.donation_type === 'zakat' ? 'Zakat' : 
                   donation.donation_type === 'sadqa' ? 'Sadqa' : 
                   donation.donation_type || 'General'}
                </span>
              </div>
              <div className="view-item">
                <span className="view-item-label">Payment Method</span>
                <span className="view-item-value">{donation.donation_method?.toUpperCase() || 'N/A'}</span>
              </div>
              {donation.orderId && (
                <div className="view-item">
                  <span className="view-item-label">Order ID</span>
                  <span className="view-item-value">{donation.orderId}</span>
                </div>
              )}
            </div>
          </div>

          <div className="view-section">
            <h3 className="view-section-title">Donor Information</h3>
            <div className="view-grid">
              <div className="view-item">
                <span className="view-item-label">Name</span>
                <span className="view-item-value">{donation.donor_name || 'Anonymous'}</span>
              </div>
              <div className="view-item">
                <span className="view-item-label">Email</span>
                <span className="view-item-value">{donation.donor_email || '-'}</span>
              </div>
              <div className="view-item">
                <span className="view-item-label">Phone</span>
                <span className="view-item-value">{donation.donor_phone || '-'}</span>
              </div>
              <div className="view-item">
                <span className="view-item-label">Country</span>
                <span className="view-item-value">{donation.country || '-'}</span>
              </div>
              <div className="view-item">
                <span className="view-item-label">City</span>
                <span className="view-item-value">{donation.city || '-'}</span>
              </div>
              {donation.address && (
                <div className="view-item view-item--full">
                  <span className="view-item-label">Address</span>
                  <span className="view-item-value">{donation.address}</span>
                </div>
              )}
            </div>
          </div>

          {donation.item_name && (
            <div className="view-section">
              <h3 className="view-section-title">Item Details</h3>
              <div className="view-grid">
                <div className="view-item">
                  <span className="view-item-label">Item Name</span>
                  <span className="view-item-value">{donation.item_name}</span>
                </div>
                {donation.item_price && (
                  <div className="view-item">
                    <span className="view-item-label">Item Price</span>
                    <span className="view-item-value">{formatAmount(donation.item_price, donation.currency)}</span>
                  </div>
                )}
                {donation.item_description && (
                  <div className="view-item view-item--full">
                    <span className="view-item-label">Description</span>
                    <span className="view-item-value">{donation.item_description}</span>
                  </div>
                )}
              </div>
            </div>
          )}

          <div className="view-section">
            <h3 className="view-section-title">System Information</h3>
            <div className="view-grid">
              <div className="view-item">
                <span className="view-item-label">Created At</span>
                <span className="view-item-value">{formatDate(donation.created_at)}</span>
              </div>
              <div className="view-item">
                <span className="view-item-label">Updated At</span>
                <span className="view-item-value">{formatDate(donation.updated_at)}</span>
              </div>
              {donation.recurrence_id && (
                <div className="view-item">
                  <span className="view-item-label">Recurrence ID</span>
                  <span className="view-item-value">{donation.recurrence_id}</span>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

export default ViewOnlineDonation;
