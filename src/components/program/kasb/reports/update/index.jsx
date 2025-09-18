import React from 'react';
import { useNavigate } from 'react-router-dom';
import '../../../../../styles/variables.css';
import '../../../../../styles/components.css';
import Navbar from '../../../../Navbar';
import PageHeader from '../../../../common/PageHeader';

const UpdateKasbReport = () => {
  const navigate = useNavigate();

  return (
    <>
      <Navbar />
      <div className="form-wrapper">
        <PageHeader 
          title="Update Kasb Report"
          showBackButton={true}
          backPath="/program/kasb/reports/list"
        />
        <div className="form-content">
          <div className="status-message status-message--info">
            Update functionality will be implemented later.
          </div>
        </div>
      </div>
    </>
  );
};

export default UpdateKasbReport; 