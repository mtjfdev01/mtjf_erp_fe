import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from '../../../../../utils/axios';
import PageHeader from '../../../../common/PageHeader';
import ActionMenu from '../../../../common/ActionMenu';
import Pagination from '../../../../common/Pagination';
import './ListKasbTrainingReports.css';
import Navbar from '../../../../Navbar';

const ListKasbTrainingReports = () => {
  const navigate = useNavigate();
  const [reports, setReports] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [itemsPerPage] = useState(10);

  useEffect(() => {
    fetchReports();
  }, [currentPage]);

  const fetchReports = async () => {
    try {
      setLoading(true);
      const response = await axios.get('/program/kasb-training/reports');
      
      if (response.data.success) {
        setReports(response.data.data || []);
        setTotalPages(Math.ceil((response.data.data || []).length / itemsPerPage));
      } else {
        setError(response.data.message || 'Failed to fetch reports');
      }
    } catch (err) {
      setError(err.response?.data?.message || 'An error occurred while fetching reports');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id) => {
    if (window.confirm('Are you sure you want to delete this report?')) {
      try {
        const response = await axios.delete(`/program/kasb-training/reports/${id}`);
        
        if (response.data.success) {
          fetchReports();
        } else {
          setError(response.data.message || 'Failed to delete report');
        }
      } catch (err) {
        setError(err.response?.data?.message || 'An error occurred while deleting the report');
      }
    }
  };

  const getSkillLevelLabel = (skillLevel) => {
    const labels = {
      'expert': 'Expert',
      'medium_expert': 'Medium Expert',
      'new trainee': 'New Trainee'
    };
    return labels[skillLevel] || skillLevel;
  };

  const formatDate = (dateString) => {
    if (!dateString) return '-';
    return new Date(dateString).toLocaleDateString();
  };

  const paginatedReports = reports.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  if (loading) {
    return (
      <div className="list-kasb-training-reports">
        <PageHeader 
          title="Kasb Training Reports" 
          breadcrumbs={[
            { label: 'Program', path: '/program' },
            { label: 'Kasb Training Reports' }
          ]}
          actionButton={{
            label: 'Add Report',
            onClick: () => navigate('/program/kasb-training/reports/add')
          }}
        />
        <div className="loading">Loading...</div>
      </div>
    );
  }

  return (
    <>
    <Navbar />
    <div className="list-kasb-training-reports">
              <PageHeader 
          title="Kasb Training Reports"
          showBackButton={false} 
          showAdd={true}
          addPath="/program/kasb-training/reports/add"
        />
      {error && <div className="error-message">{error}</div>}
      
      <div className="table-container">
        <table className="data-table">
          <thead>
            <tr>
              <th>Date</th>
              <th>Skill Level</th>
              <th>Quantity</th>
              <th>Addition</th>
              <th>Left</th>
              <th>Total</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {paginatedReports.length === 0 ? (
              <tr>
                <td colSpan="7" className="no-data">No reports found</td>
              </tr>
            ) : (
              paginatedReports.map((report) => (
                <tr key={report.id}>
                  <td>{formatDate(report.date)}</td>
                  <td>{getSkillLevelLabel(report.skill_level)}</td>
                  <td>{report.quantity}</td>
                  <td>{report.addition}</td>
                  <td>{report.left}</td>
                  <td>{report.total}</td>
                  <td>
                    <ActionMenu
                      items={[
                        {
                          label: 'View',
                          onClick: () => navigate(`/program/kasb-training/reports/view/${report.id}`)
                        },
                        {
                          label: 'Edit',
                          onClick: () => navigate(`/program/kasb-training/reports/update/${report.id}`)
                        },
                        {
                          label: 'Delete',
                          onClick: () => handleDelete(report.id),
                          className: 'delete-action'
                        }
                      ]}
                    />
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
      
      {totalPages > 1 && (
        <Pagination
          currentPage={currentPage}
          totalPages={totalPages}
          onPageChange={setCurrentPage}
        />
      )}
    </div>
    </>
  );
};

export default ListKasbTrainingReports; 