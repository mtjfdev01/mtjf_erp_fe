import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import '../../../../../styles/variables.css';
import '../../../../../styles/components.css';
import Navbar from '../../../../Navbar';
import PageHeader from '../../../../common/PageHeader';

const ViewWheelChairOrCrutchesReport = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const [report, setReport] = useState(null);
    const [error, setError] = useState('');

    // Mock data fetching
    useEffect(() => {
        const fetchReport = () => {
            const mockReports = [
                {
                  id: 1,
                  date: '2024-07-01',
                  distributions: [
                    { id: 1, type: 'Wheel Chair', gender: 'Male', vulnerabilities: { 'Orphans': 5, 'Divorced': 3, 'Disable': 2, 'Indegent': 4 } },
                    { id: 2, type: 'Crutches', gender: 'Female', vulnerabilities: { 'Orphans': 2, 'Divorced': 1, 'Disable': 1, 'Indegent': 3 } }
                  ]
                },
            ];
            const reportToView = mockReports.find(r => r.id === parseInt(id));
            if (reportToView) {
                setReport(reportToView);
            } else {
                setError("Report not found");
            }
        };
        fetchReport();
    }, [id]);
    
    const formatDate = (dateString) => {
        return new Date(dateString).toLocaleDateString();
    };
    
    const getTotal = (distribution) => {
        if (!distribution) return 0;
        return Object.values(distribution).reduce((total, count) => total + count, 0);
    };

    if (error) {
        return (
            <>
                <Navbar />
                <div className="view-wrapper">
                    <PageHeader 
                        title="View Report"
                        showBackButton={true}
                        backPath="/program/wheel_chair_or_crutches/reports/list"
                    />
                    <div className="view-content">
                        <div className="status-message status-message--error">{error}</div>
                    </div>
                </div>
            </>
        );
    }
    
    if (!report) {
        return <div>Loading...</div>;
    }

    const grandTotal = report.distributions.reduce((total, dist) => total + getTotal(dist.vulnerabilities), 0);

    return (
        <>
            <Navbar />
            <div className="view-wrapper">
                <PageHeader 
                    title="View Wheel Chair/Crutches Report"
                    showBackButton={true}
                    backPath="/program/wheel_chair_or_crutches/reports/list"
                    showEdit={true}
                    editPath={`/program/wheel_chair_or_crutches/reports/update/${report.id}`}
                />
                <div className="view-content">
                    <div className="view-section">
                        <h3 className="view-section-title">Report Summary</h3>
                        <div className="view-grid">
                            <div className="view-item">
                                <span className="view-item-label">Report ID</span>
                                <span className="view-item-value">WCC-{report.id}</span>
                            </div>
                            <div className="view-item">
                                <span className="view-item-label">Date</span>
                                <span className="view-item-value">{formatDate(report.date)}</span>
                            </div>
                            <div className="view-item">
                                <span className="view-item-label">Grand Total Items</span>
                                <span className="view-item-value">{grandTotal}</span>
                            </div>
                        </div>
                    </div>

                    {report.distributions.map((dist) => (
                         <div className="view-section" key={dist.id}>
                            <h3 className="view-section-title">{dist.type} Distribution ({dist.gender})</h3>
                            <div className="view-grid-dynamic">
                                {Object.entries(dist.vulnerabilities).map(([vul, count]) => (
                                    <div className="view-item" key={vul}>
                                        <span className="view-item-label">{vul}</span>
                                        <span className="view-item-value">{count}</span>
                                    </div>
                                ))}
                            </div>
                            <div className="view-total">
                                <span className="view-item-label">Sub-Total</span>
                                <span className="view-item-value">{getTotal(dist.vulnerabilities)}</span>
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </>
    );
};

export default ViewWheelChairOrCrutchesReport; 