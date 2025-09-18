import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { FiPlus, FiTrash2 } from 'react-icons/fi';
import axiosInstance from '../../../../utils/axios';
import '../../../../styles/variables.css';
import '../../../../styles/components.css';
import Navbar from '../../../Navbar';
import PageHeader from '../../../common/PageHeader';
import FormInput from '../../../common/FormInput';
import './UpdateApplication.css';

const UpdateApplicationReport = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [submitted, setSubmitted] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [applications, setApplications] = useState([]);
  const [reportData, setReportData] = useState({ report_date: ''});

  useEffect(() => {
    fetchApplicationReport();
    // eslint-disable-next-line
  }, [id]);

  const fetchApplicationReport = async () => {
    try {
      setLoading(true);
      const response = await axiosInstance.get(`/program/application-reports/${id}`);
      
      // Handle the controller's response structure
      if (response.data.success) {
        const data = response.data.data;
        setReportData({
          report_date: data.report_date || ''
        });
        setApplications(data.applications || []);
      } else {
        setError(response.data.message || 'Failed to fetch application report');
      }
      setError('');
    } catch (err) {
      setError('Failed to fetch application report data. Please try again.');
      console.error('Error fetching application report:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleApplicationChange = (index, field, value) => {
    const updatedApplications = [...applications];
    const numericFields = ['pending_last_month', 'application_count', 'investigation_count', 'verified_count', 'approved_count', 'rejected_count', 'pending_count'];
    if (numericFields.includes(field)) {
      updatedApplications[index][field] = parseInt(value) || 0;
    } else {
      updatedApplications[index][field] = value;
    }
    setApplications(updatedApplications);
    if (error) setError('');
  };

  const handleReportDataChange = (field, value) => {
    setReportData({ ...reportData, [field]: value });
    if (error) setError('');
  };

  const addApplication = () => {
    const newId = Math.max(...applications.map(app => app.id), 0) + 1;
    const newApplication = {
      id: newId,
      project: '',
      pending_last_month: 0,
      application_count: 0,
      investigation_count: 0,
      verified_count: 0,
      approved_count: 0,
      rejected_count: 0,
      pending_count: 0
    };
    setApplications([...applications, newApplication]);
  };

  const removeApplication = (index) => {
    if (applications.length > 1) {
      const updatedApplications = applications.filter((_, i) => i !== index);
      setApplications(updatedApplications);
    }
  };

  const validateForm = () => {
    if (!reportData.report_date) {
      setError('Please select a report date');
      return false;
    }
    for (let i = 0; i < applications.length; i++) {
      const app = applications[i];
      if (!app.project.trim()) {
        setError(`Please enter project name for application ${i + 1}`);
        return false;
      }
      const numericFields = ['pending_last_month', 'application_count', 'investigation_count', 'verified_count', 'approved_count', 'rejected_count', 'pending_count'];
      for (const field of numericFields) {
        if (app[field] < 0) {
          setError(`${field.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())} cannot be negative for application ${i + 1}`);
          return false;
        }
      }
    }
    return true;
  };

  const handleSubmit = async e => {
    e.preventDefault();
    if (!validateForm()) return;
    setIsSubmitting(true);
    try {
      const reportPayload = {
        ...reportData,
        applications: applications
      };
      await axiosInstance.patch(`/program/application-reports/${id}`, reportPayload);
      
      // Navigate immediately after successful update
      navigate('/program/applications_reports');
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to update report. Please try again.');
      console.error('Error updating report:', err);
    } finally {
      setIsSubmitting(false);
    }
  };

  if (loading) {
    return (
      <>
        <Navbar />
        <div className="update-application-container">
          <div className="status-message">Loading application report data...</div>
        </div>
      </>
    );
  }

  return (
    <>
      <Navbar />
      <div className="update-application-container">
        <PageHeader 
          title="Update Application Report"
          backPath="/program/applications_reports"
          showBackButton={true}
        />
        
        {submitted ? (
          <div className="status-message status-message--success">
            Application report updated successfully!
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="application-form">
            {error && <div className="status-message status-message--error">{error}</div>}
            <div className="date-field-container">
              <FormInput
                name="report_date"
                label="Report Date"
                type="date"
                value={reportData.report_date}
                onChange={e => handleReportDataChange('report_date', e.target.value)}
                required
              />
            </div>
            <div className="applications-section">
              {applications.map((application, index) => (
                <div key={application.id} className="application-entry">
                  <div className="application-header">
                    <h4 className="application-title">Application {index + 1}</h4>
                    <div className="application-actions">
                      {applications.length > 1 && (
                        <button
                          type="button"
                          className="remove-application-btn"
                          onClick={() => removeApplication(index)}
                          title="Remove Application"
                        >
                          <FiTrash2 />
                        </button>
                      )}
                      {index === applications.length - 1 && (
                        <button
                          type="button"
                          className="add-application-btn"
                          onClick={addApplication}
                          title="Add Another Application"
                        >
                          <FiPlus />
                        </button>
                      )}
                    </div>
                  </div>
                  <div className="form-grid">
                    <FormInput
                      name={`project-${index}`}
                      label="Project Name"
                      value={application.project}
                      onChange={e => handleApplicationChange(index, 'project', e.target.value)}
                      required
                    />
                    <FormInput
                      name={`pending_last_month-${index}`}
                      label="Pending of Last Month"
                      type="number"
                      value={application.pending_last_month}
                      onChange={e => handleApplicationChange(index, 'pending_last_month', e.target.value)}
                      min="0"
                      placeholder="0"
                    />
                    <FormInput
                      name={`application_count-${index}`}
                      label="Application Count"
                      type="number"
                      value={application.application_count}
                      onChange={e => handleApplicationChange(index, 'application_count', e.target.value)}
                      min="0"
                      placeholder="0"
                    />
                    <FormInput
                      name={`investigation_count-${index}`}
                      label="Investigation Count"
                      type="number"
                      value={application.investigation_count}
                      onChange={e => handleApplicationChange(index, 'investigation_count', e.target.value)}
                      min="0"
                      placeholder="0"
                    />
                    <FormInput
                      name={`verified_count-${index}`}
                      label="Verified Count"
                      type="number"
                      value={application.verified_count}
                      onChange={e => handleApplicationChange(index, 'verified_count', e.target.value)}
                      min="0"
                      placeholder="0"
                    />
                    <FormInput
                      name={`approved_count-${index}`}
                      label="Approved Count"
                      type="number"
                      value={application.approved_count}
                      onChange={e => handleApplicationChange(index, 'approved_count', e.target.value)}
                      min="0"
                      placeholder="0"
                    />
                    <FormInput
                      name={`rejected_count-${index}`}
                      label="Rejected Count"
                      type="number"
                      value={application.rejected_count}
                      onChange={e => handleApplicationChange(index, 'rejected_count', e.target.value)}
                      min="0"
                      placeholder="0"
                    />
                    <FormInput
                      name={`pending_count-${index}`}
                      label="Pending Count"
                      type="number"
                      value={application.pending_count}
                      onChange={e => handleApplicationChange(index, 'pending_count', e.target.value)}
                      min="0"
                      placeholder="0"
                    />
                  </div>
                </div>
              ))}
            </div>
            <div className="form-actions">
              <button
                type="submit"
                className="primary_btn"
                disabled={isSubmitting}
              >
                {isSubmitting ? 'Updating...' : 'Update Report'}
              </button>
            </div>
          </form>
        )}
      </div>
    </>
  );
};

export default UpdateApplicationReport; 