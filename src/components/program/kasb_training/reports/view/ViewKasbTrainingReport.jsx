import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axios from '../../../../../utils/axios';
import PageHeader from '../../../../common/PageHeader';
import './ViewKasbTrainingReport.css';

const ViewKasbTrainingReport = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [report, setReport] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    fetchReport();
  }, [id]);

  const fetchReport = async () => {
    try {
      setLoading(true);
      const response = await axios.get(`/program/kasb-training/reports/${id}`);
      
      if (response.data.success) {
        setReport(response.data.data);
      } else {
        setError(response.data.message || 'Failed to fetch report');
      }
    } catch (err) {
      setError(err.response?.data?.message || 'An error occurred while fetching the report');
    } finally {
      setLoading(false);
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

  if (loading) {
    return (
      <div className="view-kasb-training-report">
        <PageHeader 
          title="View Kasb Training Report" 
          breadcrumbs={[
            { label: 'Program', path: '/program' },
            { label: 'Kasb Training Reports', path: '/program/kasb-training/reports' },
            { label: 'View Report' }
          ]}
        />
        <div className="loading">Loading...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="view-kasb-training-report">
        <PageHeader 
          title="View Kasb Training Report" 
          breadcrumbs={[
            { label: 'Program', path: '/program' },
            { label: 'Kasb Training Reports', path: '/program/kasb-training/reports' },
            { label: 'View Report' }
          ]}
        />
        <div className="error-message">{error}</div>
      </div>
    );
  }

  if (!report) {
    return (
      <div className="view-kasb-training-report">
        <PageHeader 
          title="View Kasb Training Report" 
          breadcrumbs={[
            { label: 'Program', path: '/program' },
            { label: 'Kasb Training Reports', path: '/program/kasb-training/reports' },
            { label: 'View Report' }
          ]}
        />
        <div className="no-data">Report not found</div>
      </div>
    );
  }

  return (
    <div className="view-kasb-training-report">
      <PageHeader 
        title="View Kasb Training Report" 
        breadcrumbs={[
          { label: 'Program', path: '/program' },
          { label: 'Kasb Training Reports', path: '/program/kasb-training/reports' },
          { label: 'View Report' }
        ]}
      />
      
      <div className="report-container">
        <div className="report-header">
          <h2>Kasb Training Report Details</h2>
        </div>
        
        <div className="report-content">
          <div className="info-grid">
            <div className="info-item">
              <label>Date:</label>
              <span>{formatDate(report.date)}</span>
            </div>
            
            <div className="info-item">
              <label>Skill Level:</label>
              <span>{getSkillLevelLabel(report.skill_level)}</span>
            </div>
            
            <div className="info-item">
              <label>Quantity:</label>
              <span>{report.quantity}</span>
            </div>
            
            <div className="info-item">
              <label>Addition:</label>
              <span>{report.addition}</span>
            </div>
            
            <div className="info-item">
              <label>Left:</label>
              <span>{report.left}</span>
            </div>
            
            <div className="info-item">
              <label>Total:</label>
              <span className="total-value">{report.total}</span>
            </div>
          </div>
        </div>
        
        <div className="report-actions">
          <button 
            onClick={() => navigate('/program/kasb-training/reports')}
            className="btn btn-secondary"
          >
            Back to List
          </button>
          <button 
            onClick={() => navigate(`/program/kasb-training/reports/update/${report.id}`)}
            className="btn btn-primary"
          >
            Edit Report
          </button>
        </div>
      </div>
    </div>
  );
};

export default ViewKasbTrainingReport; 