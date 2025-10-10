import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axiosInstance from '../../../../utils/axios';
import Navbar from '../../../Navbar'; 
import PageHeader from '../../../common/PageHeader';
import ActionMenu from '../../../common/ActionMenu';
import ConfirmationModal from '../../../common/ConfirmationModal';
import Pagination from '../../../common/Pagination';
import { SearchFilter, DropdownFilter, DateFilter, DateRangeFilter } from '../../../common/filters';
import { SearchButton, ClearButton } from '../../../common/filters';
import { FiEye, FiEdit, FiTrash2, FiUser } from 'react-icons/fi';
import { BsFillBuildingsFill } from "react-icons/bs";
import FormInput from '../../../common/FormInput';

const DonorsList = () => {
  const navigate = useNavigate();
  const [donors, setDonors] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [donorToDelete, setDonorToDelete] = useState(null);
  
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
    donor_type: '',
    city: '',
    date: '',
    start_date: '',
    end_date: ''
  });

  // Applied filters - Actually sent to API
  const [appliedFilters, setAppliedFilters] = useState({
    search: '',
    donor_type: '',
    city: '',
    date: '',
    start_date: '',
    end_date: ''
  });

  // Universal filter change handler - Updates temporary filters only
  const handleFilterChange = (key, value) => {
    setTempFilters(prev => ({
      ...prev,
      [key]: value
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
      // If filters haven't changed, force refresh by calling fetchDonors
      fetchDonors();
    }
  };

  // Clear filters - Triggered by Clear button
  const handleClearFilters = () => {
    const emptyFilters = {
      search: '',
      donor_type: '',
      city: '',
      date: '',
      start_date: '',
      end_date: ''
    };
    
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
    fetchDonors();
  }, [currentPage, pageSize, sortField, sortOrder, appliedFilters]);

  const fetchDonors = async () => {
    try {
      setLoading(true);
      const params = {
        page: currentPage,
        pageSize: pageSize,
        sortField: sortField,
        sortOrder: sortOrder,
        ...appliedFilters
      };
      
      const response = await axiosInstance.get('/donors', { params }); 
      if (response.data.success) {
        setDonors(response.data.data || []);
        setTotalItems(response.data.pagination?.total || 0);
        setTotalPages(response.data.pagination?.totalPages || 1);
      } else {
        setError('Failed to fetch donors');
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to fetch donors');
      console.error('Error fetching donors:', err);
    } finally {
      setLoading(false);
    }
  };

  const handlePageChange = (page) => {
    setCurrentPage(page);
  };

  const handlePageSizeChange = (newPageSize) => {
    setPageSize(newPageSize);
    setCurrentPage(1);
  };

  const handleSortChange = (field, order) => {
    setSortField(field);
    setSortOrder(order);
    setCurrentPage(1);
  };

  const handleDeleteClick = (donor) => {
    setDonorToDelete(donor);
    setShowDeleteModal(true);
  };

  const handleDeleteConfirm = async () => {
    if (!donorToDelete) return;

    try {
      await axiosInstance.delete(`/donors/${donorToDelete.id}`);
      setShowDeleteModal(false);
      setDonorToDelete(null);
      fetchDonors(); // Refresh the list
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to delete donor');
      console.error('Error deleting donor:', err);
    }
  };

  const handleDeleteCancel = () => {
    setShowDeleteModal(false);
    setDonorToDelete(null);
  };

  const getDonorActions = (donor) => [
    {
      icon: <FiEye />,
      label: 'View',
      color: '#2196f3',
      onClick: () => navigate(`/dms/donors/view/${donor.id}`),  
      visible: true
    },
    {
      icon: <FiEdit />,
      label: 'Edit',
      color: '#ff9800',
      onClick: () => navigate(`/dms/donors/edit/${donor.id}`),
      visible: true
    },
    {
      icon: <FiTrash2 />,
      label: 'Delete',
      color: '#f44336',
      onClick: () => handleDeleteClick(donor),
      visible: true
    }
  ];

  const sortOptions = [
    { value: 'created_at', label: 'Registration Date' },
    { value: 'name', label: 'Name' },
    { value: 'email', label: 'Email' },
    { value: 'donor_type', label: 'Type' },
    { value: 'city', label: 'City' }
  ];

  // Filter options
  const donorTypeOptions = [
    { value: 'individual', label: 'Individual' },
    { value: 'csr', label: 'CSR (Corporate)' }
  ];

  const getDonorTypeIcon = (type) => {
    return type === 'csr' ? <BsFillBuildingsFill /> : <FiUser />;
  };

  const getDonorTypeLabel = (type) => {
    return type === 'csr' ? 'CSR' : 'Individual';
  };

  const getDonorTypeClass = (type) => {
    return type === 'csr' ? 'donor-type--csr' : 'donor-type--individual';
  };

  if (loading) {
    return (
      <>
        <Navbar />
        <div className="list-wrapper">
          <div className="loading-container">
            <div className="loading-spinner"></div>
            <p>Loading donors...</p>
          </div>
        </div>
      </>
    );
  }

  return (
    <>
      <Navbar />
      <div className="list-wrapper">
        <PageHeader 
          title="Registered Donors" 
          showBackButton={false} 
          showAdd={true}
          onAddClick={() => navigate('/dms/donors/register')}
          addButtonText="Register Donor"
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
              placeholder="Search by name, email, phone..."
            />
            
            <DropdownFilter
              filterKey="donor_type"
              label="Donor Type"
              data={donorTypeOptions}
              filters={tempFilters}
              onFilterChange={handleFilterChange}
              placeholder="All Types"
            />
            
            <DateFilter
              filterKey="date"
              label="Registration Date"
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
                  <th>Type</th>
                  <th>Name</th>
                  <th>Email</th>
                  <th>Phone</th>
                  <th>City</th>
                  <th>Registration Date</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {donors.length === 0 ? (
                  <tr>
                    <td colSpan="7" className="no-data">
                      No donors found
                    </td>
                  </tr>
                ) : (
                  donors.map((donor) => (
                    <tr key={donor.id}>
                      <td>
                        <div className={`donor-type ${getDonorTypeClass(donor.donor_type)}`}>
                          {getDonorTypeIcon(donor.donor_type)}
                          <span>{getDonorTypeLabel(donor.donor_type)}</span>
                        </div>
                      </td>
                      <td>
                        <div className="donor-info">
                          <div className="donor-name">{donor.name}</div>
                          {donor.donor_type === 'csr' && donor.company_name && (
                            <div className="company-name">{donor.company_name}</div>
                          )}
                        </div>
                      </td>
                      <td>{donor.email}</td>
                      <td>{donor.phone}</td>
                      <td>{donor.city}</td>
                      <td>{new Date(donor.created_at).toLocaleDateString()}</td>
                      <td>
                        <ActionMenu actions={getDonorActions(donor)} />
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          {donors.length > 0 && (
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
        </div>
      </div>

      <ConfirmationModal
        isOpen={showDeleteModal}
        text={`Are you sure you want to delete donor "${donorToDelete?.name}"? This action cannot be undone.`}
        onConfirm={handleDeleteConfirm}
        onCancel={handleDeleteCancel}
      />
    </>
  );
};

export default DonorsList;
