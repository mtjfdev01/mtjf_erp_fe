import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axiosInstance from '../../../../../utils/axios';
import '../../../../../styles/variables.css';
import '../../../../../styles/components.css';
import PageHeader from '../../../../common/PageHeader';
import Navbar from '../../../../Navbar';
const ViewOnlineDonation = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [donation, setDonation] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [totalDonationAmount, setTotalDonationAmount] = useState(0);

  console.log("donation", donation);
  useEffect(() => {
    fetchDonation();
  }, [id]);

  const fetchDonation = async () => {
    try {
      setLoading(true);
      const response = await axiosInstance.get(`/donations/${id}`);
      console.log("ASDadadasdadsada9ijrwef09dej2q0439jef", response)
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
            title="View Online Donation 123"
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
              {donation.status === 'failed' && donation.err_msg && (
                <div className="view-item view-item--full">
                  <span className="view-item-label">Error Message</span>
                  <span className="view-item-value" style={{ color: '#dc2626', fontWeight: '500' }}>
                    {donation.err_msg}
                  </span>
                </div>
              )}
            </div>
          </div>

          <div className="view-section">
            <h3 className="view-section-title">Donor Information</h3>
            <div className="view-grid">
              <div className="view-item">
                <span className="view-item-label">Name</span>
                <span className="view-item-value">{donation?.donor?.name || 'Anonymous'}</span>
              </div>
              <div className="view-item">
                <span className="view-item-label">Email</span>
                <span className="view-item-value">{donation?.donor?.email || '-'}</span>
              </div>
              <div className="view-item">
                <span className="view-item-label">Phone</span>
                <span className="view-item-value">{donation?.donor?.phone || '-'}</span>
              </div>
              <div className="view-item">
                <span className="view-item-label">Country</span>
                <span className="view-item-value">{donation?.donor?.country || '-'}</span>
              </div>
              <div className="view-item">
                <span className="view-item-label">City</span>
                <span className="view-item-value">{donation?.donor?.city || '-'}</span>
              </div>
              {donation.address && (
                <div className="view-item view-item--full">
                  <span className="view-item-label">Address</span>
                  <span className="view-item-value">{donation?.donor?.address}</span>
                </div>
              )}
            </div>
          </div>

          {donation.in_kind_items && donation.in_kind_items.length > 0 && (
            <div className="view-section">
              <h3 className="view-section-title">In-Kind Donation Details</h3>
              {donation.in_kind_items.map((item, index) => (
                <div key={index} style={{ 
                  marginBottom: '1.5rem', 
                  padding: '1rem', 
                  border: '1px solid #e5e7eb', 
                  borderRadius: '8px',
                  backgroundColor: '#f9fafb'
                }}>
                  <h4 style={{ margin: '0 0 1rem 0', color: '#374151', fontSize: '16px' }}>
                    Item {index + 1}
                  </h4>
                  <div className="view-grid">
                    <div className="view-item">
                      <span className="view-item-label">Item Name</span>
                      <span className="view-item-value">{item.name || '-'}</span>
                    </div>
                    <div className="view-item">
                      <span className="view-item-label">Category</span>
                      <span className="view-item-value">{item.category || '-'}</span>
                    </div>
                    <div className="view-item">
                      <span className="view-item-label">Condition</span>
                      <span className="view-item-value">{item.condition || '-'}</span>
                    </div>
                    <div className="view-item">
                      <span className="view-item-label">Quantity</span>
                      <span className="view-item-value">{item.quantity || '-'}</span>
                    </div>
                    {item.estimated_value && (
                      <div className="view-item">
                        <span className="view-item-label">Estimated Value</span>
                        <span className="view-item-value">{formatAmount(item.estimated_value, donation.currency)}</span>
                      </div>
                    )}
                    {item.brand && (
                      <div className="view-item">
                        <span className="view-item-label">Brand</span>
                        <span className="view-item-value">{item.brand}</span>
                      </div>
                    )}
                    {item.model && (
                      <div className="view-item">
                        <span className="view-item-label">Model</span>
                        <span className="view-item-value">{item.model}</span>
                      </div>
                    )}
                    {item.size && (
                      <div className="view-item">
                        <span className="view-item-label">Size</span>
                        <span className="view-item-value">{item.size}</span>
                      </div>
                    )}
                    {item.color && (
                      <div className="view-item">
                        <span className="view-item-label">Color</span>
                        <span className="view-item-value">{item.color}</span>
                      </div>
                    )}
                    {item.collection_date && (
                      <div className="view-item">
                        <span className="view-item-label">Collection Date</span>
                        <span className="view-item-value">{formatDate(item.collection_date)}</span>
                      </div>
                    )}
                    {item.collection_location && (
                      <div className="view-item">
                        <span className="view-item-label">Collection Location</span>
                        <span className="view-item-value">{item.collection_location}</span>
                      </div>
                    )}
                    {item.description && (
                      <div className="view-item view-item--full">
                        <span className="view-item-label">Description</span>
                        <span className="view-item-value">{item.description}</span>
                      </div>
                    )}
                    {item.notes && (
                      <div className="view-item view-item--full">
                        <span className="view-item-label">Notes</span>
                        <span className="view-item-value">{item.notes}</span>
                      </div>
                    )}
                  </div>
                </div>
              ))}
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
