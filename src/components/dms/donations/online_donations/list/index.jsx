import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axiosInstance from '../../../../../utils/axios';
import '../../../../../styles/variables.css';
import '../../../../../styles/components.css';
// import Navbar from '../../../../../Navbar';
// import ActionMenu from '../../../../../common/ActionMenu';
// import ConfirmationModal from '../../../../../common/ConfirmationModal';
import Pagination from '../../../../common/Pagination';
import { DownloadCSV } from '../../../../common/download';
import { SearchFilter, DropdownFilter, DateFilter, DateRangeFilter } from '../../../../common/filters';
import { ClearButton } from '../../../../common/filters/index';
import { SearchButton } from '../../../../common/filters/index';
import HybridDropdown from '../../../../common/HybridDropdown';
import SearchableDropdown from '../../../../common/SearchableDropdown';

import { FiEye, FiTrash2, FiDollarSign } from 'react-icons/fi';
import PageHeader from '../../../../common/PageHeader';
import Navbar from '../../../../Navbar';
import ActionMenu from '../../../../common/ActionMenu';
import ConfirmationModal from '../../../../common/ConfirmationModal';

const OnlineDonationsList = () => {
  const navigate = useNavigate();
  const [donations, setDonations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [donationToDelete, setDonationToDelete] = useState(null);
  const [selectedDonor, setSelectedDonor] = useState(null);
  
  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [totalItems, setTotalItems] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [sortField, setSortField] = useState('created_at');
  const [sortOrder, setSortOrder] = useState('DESC');

  // Filter state - Temporary filters (not applied until search button is clicked)
  const [tempFilters, setTempFilters] = useState({
    search: '',
    status: '',
    donation_type: '',
    donation_method: '',
    date: '',
    start_date: '',
    end_date: '',
    amount: '',
    price_operator: '',
    donor_id: ''
  });

  // Applied filters - Actually sent to API
  const [appliedFilters, setAppliedFilters] = useState({
    search: '',
    status: '',
    donation_type: '',
    donation_method: '',
    date: '',
    start_date: '',
    end_date: '',
    amount: '',
    price_operator: '',
    donor_id: ''
  });

  // Universal filter change handler - Updates temporary filters only
  const handleFilterChange = (key, value) => {
    setTempFilters(prev => ({
      ...prev,
      [key]: value
    }));
  };

  // Handle donor selection for filtering
  const handleDonorSelect = (donor) => {
    setSelectedDonor(donor);
    setTempFilters(prev => ({
      ...prev,
      donor_id: donor.id
    }));
  };

  // Handle donor clear
  const handleDonorClear = () => {
    setSelectedDonor(null);
    setTempFilters(prev => ({
      ...prev,
      donor_id: ''
    }));
  };

  // Apply filters - Triggered by Search button
  const handleApplyFilters = () => {
    // Check if filters have changed
    const filtersChanged = JSON.stringify(appliedFilters) !== JSON.stringify(tempFilters);
    
    if (filtersChanged) {
      // If filters changed, apply them
      setAppliedFilters(tempFilters);
      setCurrentPage(1);
    } else {
      // If filters haven't changed, force refresh by calling fetchDonations
      fetchDonations();
    }
  };

  // Clear filters - Triggered by Clear button
  const handleClearFilters = () => {
    const emptyFilters = {
      search: '',
      status: '',
      donation_type: '',
      donation_method: '',
      date: '',
      start_date: '',
      end_date: '',
      amount: '',
      price_operator: '',
      donor_id: ''
    };
    
    // Also clear selected donor
    setSelectedDonor(null);
    
    // Check if filters are already empty
    const filtersAreEmpty = JSON.stringify(appliedFilters) === JSON.stringify(emptyFilters);
    
    if (!filtersAreEmpty) {
      // Only clear and call API if there are active filters
      setTempFilters(emptyFilters);
      setAppliedFilters(emptyFilters);
      setCurrentPage(1);
    }
  };

  useEffect(() => {
    fetchDonations();
  }, [currentPage, pageSize, sortField, sortOrder, appliedFilters]);

  const fetchDonations = async () => {
    try {
      setLoading(true);
      
      // Prepare filter payload
      const filterPayload = {
        pagination: {
          page: currentPage,
          pageSize: pageSize,
          sortField: sortField,
          sortOrder: sortOrder
        },
        filters: {
          // Basic filters
          search: appliedFilters.search,
          status: appliedFilters.status,
          donation_type: appliedFilters.donation_type,
          donation_method: appliedFilters.donation_method,
          
          // Date filters
          date: appliedFilters.date,
          start_date: appliedFilters.start_date,
          end_date: appliedFilters.end_date,
          
          // Donor filter
          donor_id: appliedFilters.donor_id,
          
          // Future filters can be easily added here
          // amount_range: { min: 1000, max: 50000 },
          // donor_categories: ['premium', 'regular'],
          // payment_status: ['completed', 'pending'],
          // locations: ['karachi', 'lahore', 'islamabad']
        },
        hybrid_filters:[ {
          value: appliedFilters.amount,
          operator: appliedFilters.price_operator,
          column: 'amount',
        }
      ]
      };
      
      const response = await axiosInstance.post('/donations/search', filterPayload); 
      if (response.data.success) {
        setDonations(response.data.data || []);
        setTotalItems(response.data.pagination?.total || 0);
        setTotalPages(response.data.pagination?.totalPages || 1);
      } else {
        setError('Failed to fetch donations');
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to fetch donations');
      console.error('Error fetching donations:', err);
    } finally {
      setLoading(false);
    }
  };

  const handlePageChange = (page) => {
    setCurrentPage(page);
  };

  const handlePageSizeChange = (newPageSize) => {
    setPageSize(newPageSize);
    setCurrentPage(1); // Reset to first page when changing page size
  };

  const handleSortChange = (field, order) => {
    setSortField(field);
    setSortOrder(order);
    setCurrentPage(1); // Reset to first page when sorting
  };

  const handleDeleteClick = (donation) => {
    setDonationToDelete(donation);
    setShowDeleteModal(true);
  };

  const handleDeleteConfirm = async () => {
    if (donationToDelete) {
      try {
        await axiosInstance.delete(`/donations/${donationToDelete.id}`);
        // Refresh the current page after deletion
        fetchDonations();
      } catch (err) {
        setError(err.response?.data?.message || 'Failed to delete donation');
        console.error('Error deleting donation:', err);
      }
    }
    setShowDeleteModal(false);
    setDonationToDelete(null);
  };

  const handleDeleteCancel = () => {
    setShowDeleteModal(false);
    setDonationToDelete(null);
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

  const getActionMenuItems = (donation) => [
    {
      icon: <FiEye />,
      label: 'View',
      color: '#4CAF50',
      onClick: () => navigate(`/donations/online_donations/view/${donation.id}`),
      visible: true
    },
    {
      icon: <FiTrash2 />,
      label: 'Delete',
      color: '#f44336',
      onClick: () => handleDeleteClick(donation),
      visible: true
    }
  ];

  const sortOptions = [
    { value: 'created_at', label: 'Created Date' },
    { value: 'date', label: 'Donation Date' },
    { value: 'amount', label: 'Amount' },
    { value: 'donor_name', label: 'Donor Name' },
    { value: 'donation_type', label: 'Type' },
    { value: 'status', label: 'Status' }
  ];

  // Filter options
  const statusOptions = [
    { value: 'pending', label: 'Pending' },
    { value: 'completed', label: 'Completed' },
    { value: 'failed', label: 'Failed' },
    { value: 'cancelled', label: 'Cancelled' },
    { value: 'registered', label: 'Registered' }
  ];

  const donationTypeOptions = [
    { value: 'zakat', label: 'Zakat' },
    { value: 'sadqa', label: 'Sadqa' },
    { value: 'general', label: 'General' }
  ];

  const donationMethodOptions = [
    { value: 'meezan', label: 'Meezan Bank' },
    { value: 'blinq', label: 'Blinq' },
    { value: 'payfast', label: 'Payfast' }
  ];

  const priceRangeOptions = [
    { value: '', label: 'Any Amount' },
    { value: '1000', label: '1,000' },
    { value: '5000', label: '5,000' },
    { value: '10000', label: '10,000' },
    { value: '25000', label: '25,000' },
    { value: '50000', label: '50,000' },
    { value: '100000', label: '100,000' },
    { value: '250000', label: '250,000' },
    { value: '500000', label: '500,000' },
    { value: '1000000', label: '1,000,000' }
  ];

  const priceOperatorOptions = [
    { value: '', label: 'Select Operator' },
    { value: '>', label: 'Greater than' },
    { value: '<', label: 'Less than' },
    { value: '=', label: 'Equal to' },
    { value: '>=', label: 'Greater than or equal' },
    { value: '<=', label: 'Less than or equal' }
  ];

  // CSV Download Configuration
  const csvColumns = [
    { key: 'id', label: 'ID' },
    { key: 'donor_name', label: 'Donor Name' },
    { key: 'donor_email', label: 'Email' },
    { key: 'donor_phone', label: 'Phone' },
    { key: 'amount', label: 'Amount' },
    { key: 'currency', label: 'Currency' },
    { key: 'donation_type', label: 'Type' },
    { key: 'donation_method', label: 'Method' },
    { key: 'status', label: 'Status' },
    { key: 'item_name', label: 'Item Name' },
    { key: 'country', label: 'Country' },
    { key: 'city', label: 'City' },
    { key: 'orderId', label: 'Order ID' },
    { key: 'date', label: 'Donation Date' },
    { key: 'created_at', label: 'Created Date' }
  ];

  // Prepare CSV data with formatted values
  const prepareCSVData = () => {
    return donations.map(donation => ({
      ...donation,
      donor_name: donation.donor_name || 'Anonymous',
      donor_email: donation.donor_email || '-',
      donor_phone: donation.donor_phone || '-',
      amount: donation.amount ? parseFloat(donation.amount) : 0,
      currency: donation.currency || 'PKR',
      donation_type: donation.donation_type === 'zakat' ? 'Zakat' : 
      donation.donation_type === 'sadqa' ? 'Sadqa' : 
      donation.donation_type || 'General',
      donation_method: donation.donation_method?.toUpperCase() || 'N/A',
      status: donation.status || 'pending',
      item_name: donation.item_name || '-',
      country: donation.country || '-',
      city: donation.city || '-',
      orderId: donation.orderId || '-',
      date: donation.date ? new Date(donation.date).toLocaleDateString() : '-',
      created_at: donation.created_at ? new Date(donation.created_at).toLocaleDateString() : '-'
    }));
  };

  // Generate filename with current date
  const getCSVFilename = () => {
    const today = new Date().toISOString().split('T')[0];
    return `online-donations-${today}`;
  };

  if (loading) {
    return (
      <>
        <Navbar />
        <div className="list-wrapper">
          <PageHeader 
            title="Online Donations" 
            showBackButton={false} 
            showAdd={false}
          />
          <div className="loading">Loading...</div>
        </div>
      </>
    );
  }

  return (
    <>
      <Navbar />
      <div className="list-wrapper">
        <PageHeader 
          title="Online Donations" 
          showBackButton={false} 
          showAdd={false}
        />
        
        <div className="list-content">
          {error && <div className="status-message status-message--error">{error}</div>}
          
          {/* Filters Section */}
          <div className="filters-section" style={{ 
            display: 'flex', 
            gap: '20px', 
            flexWrap: 'wrap', 
            marginBottom: '20px',
            padding: '20px',
            backgroundColor: '#f9fafb',
            borderRadius: '8px'
          }}>
            <SearchFilter
              filterKey="search"
              label="Search"
              filters={tempFilters}
              onFilterChange={handleFilterChange}
              placeholder="Search by donor name, email, phone..."
            />
            
            <DropdownFilter
              filterKey="status"
              label="Status"
              data={statusOptions}
              filters={tempFilters}
              onFilterChange={handleFilterChange}
              placeholder="All Status"
            />
            
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
            
            <HybridDropdown
              label="Amount"
              placeholder="Type or select amount..."
              options={priceRangeOptions}
              value={tempFilters.amount}
              onChange={(value) => handleFilterChange('amount', value)}
              allowCustom={true}
            />
            
            {/* Custom plus specified options */}
            <HybridDropdown
              label="Amount Operator"
              placeholder="Type or select operator..."
              options={priceOperatorOptions}
              value={tempFilters.price_operator}
              onChange={(value) => handleFilterChange('price_operator', value)}
              allowCustom={true}
            />
            
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
            
            <SearchableDropdown
              label="Filter by Donor"
              placeholder="Search donors..."
              apiEndpoint="/donors"
              onSelect={handleDonorSelect}
              onClear={handleDonorClear}
              value={selectedDonor}
              displayKey="name"
              debounceDelay={500}
              minSearchLength={2}
              allowResearch={true}
              renderOption={(donor, index) => (
                <div 
                  key={donor.id}
                  className="searchable-dropdown__option"
                  onClick={() => handleDonorSelect(donor)}
                  style={{ 
                    padding: '12px',
                    borderBottom: index < donor.length - 1 ? '1px solid #eee' : 'none',
                    cursor: 'pointer'
                  }}
                >
                  <div style={{ fontWeight: '500', marginBottom: '4px' }}>
                    {donor.name || `${donor.first_name} ${donor.last_name}`}
                  </div>
                  <div style={{ fontSize: '12px', color: '#666' }}>
                    {donor.email} • {donor.phone}
                  </div>
                </div>
              )}
            />
            
            {/* Filter Action Buttons */}
            <div style={{ 
              display: 'flex', 
              gap: '10px', 
              alignItems: 'flex-end',
              marginTop: '20px',
              width: '100%'
            }}>
              <SearchButton
                onClick={handleApplyFilters}
                text="Search"
                loading={loading}
              />
              <ClearButton
                onClick={handleClearFilters}
                text="Clear"
              />
            </div>
          </div>
          
          <div className="table-container">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Donor Name</th>
                  <th>Amount</th>
                  <th>Type</th>
                  <th>Method</th>
                  <th className="hide-on-mobile">Email</th>
                  <th className="hide-on-mobile">Phone</th>
                  <th>Status</th>
                  <th>Date</th>
                  {/* <th className="table-actions">Actions</th> */}
                </tr>
              </thead>
              <tbody>
                {donations.map(donation => (
                  <tr key={donation.id}>
                    <td>
                      <div className="donor-info">
                        <div className="donor-name">{donation.donor_name || 'Anonymous'}</div>
                        {donation.item_name && (
                          <div className="donor-item hide-on-mobile">{donation.item_name}</div>
                        )}
                      </div>
                    </td>
                    <td>
                      <div className="amount-info">
                        <div className="amount-value">{formatAmount(donation.amount, donation.currency)}</div>
                        {donation.item_price && (
                          <div className="item-price hide-on-mobile">
                            Item: {formatAmount(donation.item_price, donation.currency)}
                          </div>
                        )}
                      </div>
                    </td>
                    <td>
                      <span className="donation-type">
                        {donation.donation_type === 'zakat' ? 'Zakat' : 
                         donation.donation_type === 'sadqa' ? 'Sadqa' : 
                         donation.donation_type || 'General'}
                      </span>
                    </td>
                    <td>
                      <span className="donation-method">
                        {donation.donation_method?.toUpperCase() || 'N/A'}
                      </span>
                    </td>
                    <td className="hide-on-mobile">{donation.donor_email || '-'}</td>
                    <td className="hide-on-mobile">{donation.donor_phone || '-'}</td>
                    <td>{getStatusBadge(donation.status)}</td>
                    <td>{formatDate(donation.date || donation.created_at)}</td>
                    {/* <td className="table-actions">
                      <ActionMenu actions={getActionMenuItems(donation)} />
                    </td> */}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          
          <div className="list-header">
            <DownloadCSV
              data={prepareCSVData()}
              filename={getCSVFilename()}
              columns={csvColumns}
              buttonText="Export to CSV"
              onDownloadStart={() => console.log('Downloading donations CSV...')}
              onDownloadComplete={() => console.log('Download complete!')}
            />
          </div>
          
          {totalItems > 0 && (
            <Pagination
              currentPage={currentPage}
              totalPages={totalPages}
              totalItems={totalItems}
              pageSize={pageSize}
              onPageChange={handlePageChange}
              onPageSizeChange={handlePageSizeChange}
              onSortChange={handleSortChange}
              sortField={sortField}
              sortOrder={sortOrder}
              sortOptions={sortOptions}
            />
          )}
          
          {donations.length === 0 && totalItems === 0 && (
            <div className="empty-state">
              <div className="empty-state-icon">💰</div>
              <div className="empty-state-text">No online donations found</div>
              <div className="empty-state-subtext">Donations will appear here once they are received</div>
            </div>
          )}
        </div>
      </div>
      
      <ConfirmationModal
        isOpen={showDeleteModal}
        text={`Are you sure you want to delete the donation from ${donationToDelete?.donor_name || 'Anonymous'}?`}
        delete={true}
        onConfirm={handleDeleteConfirm}
        onCancel={handleDeleteCancel}
      />
    </>
  );
};

export default OnlineDonationsList;
