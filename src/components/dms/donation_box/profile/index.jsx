import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, useLocation, useSearchParams, Link } from 'react-router-dom';
import axiosInstance from '../../../../utils/axios';
import Navbar from '../../../Navbar';
import PageHeader from '../../../common/PageHeader';
import DonorCommunication from '../../donor_relationship/shared/DonorCommunication';
import {
  FiUser,
  FiPhone,
  FiMapPin,
  FiCalendar,
  FiDollarSign,
  FiPackage,
  FiEdit2,
  FiMessageSquare,
  FiCheckCircle,
  FiLayers,
  FiArrowLeft,
  FiActivity,
  FiExternalLink,
  FiBriefcase,
} from 'react-icons/fi';
import { FaWhatsapp } from 'react-icons/fa';
import './collectionUnitProfile.css';

const CollectionUnitProfile = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const [searchParams] = useSearchParams();

  const [activeTab, setActiveTab] = useState(searchParams.get('tab') || 'overview');
  const [donationBox, setDonationBox] = useState(null);
  const [org, setOrg] = useState(null);
  const [poc, setPoc] = useState(null);
  const [collections, setCollections] = useState([]);
  const [collectionsLoading, setCollectionsLoading] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    fetchProfileData();
  }, [id, location.pathname]);

  const fetchCollections = async (explicitBoxId = null) => {
    const targetBoxId = explicitBoxId || donationBox?.id || poc?.donation_box_id;
    if (!targetBoxId) return;

    try {
      setCollectionsLoading(true);
      // Primary: /donation-box-donation/box/:boxId
      const res = await axiosInstance.get(`/donation-box-donation/box/${targetBoxId}`, {
        params: { pageSize: 100, page: 1 },
      });
      const items = res.data?.data || (Array.isArray(res.data) ? res.data : []);
      if (Array.isArray(items) && items.length > 0) {
        setCollections(items);
      } else {
        // Fallback to query param endpoint
        try {
          const fallbackRes = await axiosInstance.get('/donation-box-donation', {
            params: { donation_box_id: targetBoxId, pageSize: 100 },
          });
          const fbItems = fallbackRes.data?.data || (Array.isArray(fallbackRes.data) ? fallbackRes.data : []);
          setCollections(Array.isArray(fbItems) ? fbItems : []);
        } catch {
          setCollections(Array.isArray(items) ? items : []);
        }
      }
    } catch (err) {
      console.warn('Primary box collections lookup failed, trying fallback:', err);
      try {
        const fallbackRes = await axiosInstance.get('/donation-box-donation', {
          params: { donation_box_id: targetBoxId, pageSize: 100 },
        });
        const fbItems = fallbackRes.data?.data || (Array.isArray(fallbackRes.data) ? fallbackRes.data : []);
        setCollections(Array.isArray(fbItems) ? fbItems : []);
      } catch (fbErr) {
        console.error('Failed to load collections:', fbErr);
        setCollections([]);
      }
    } finally {
      setCollectionsLoading(false);
    }
  };

  const fetchCsrDonations = async (explicitOrgId = null) => {
    const targetOrgId = explicitOrgId || org?.id || poc?.csr_donor_id;
    if (!targetOrgId) return;

    try {
      setCollectionsLoading(true);
      const res = await axiosInstance.get('/donations', {
        params: { csr_donor_id: targetOrgId, pageSize: 100 },
      });
      const items = res.data?.data || (Array.isArray(res.data) ? res.data : []);
      setCollections(Array.isArray(items) ? items : []);
    } catch (err) {
      console.warn('Failed to load CSR donations:', err);
      setCollections([]);
    } finally {
      setCollectionsLoading(false);
    }
  };

  const fetchProfileData = async () => {
    try {
      setLoading(true);
      setError('');

      let boxData = null;
      let pocData = null;
      let orgData = null;

      const isPocRoute =
        location.pathname.includes('/poc') ||
        searchParams.get('type') === 'poc' ||
        searchParams.has('poc_id');

      // 1. If accessed via a POC path/param, lookup csr-pocs first
      if (isPocRoute) {
        try {
          const pocRes = await axiosInstance.get(`/csr-pocs/${id}`);
          pocData = pocRes.data?.data || (pocRes.data?.id ? pocRes.data : null);
          if (pocData?.donation_box_id) {
            try {
              const bRes = await axiosInstance.get(`/donation-box/${pocData.donation_box_id}`);
              boxData = bRes.data?.data || (bRes.data?.id ? bRes.data : null);
            } catch (bErr) {
              console.warn('Linked box lookup failed:', bErr);
            }
          } else if (pocData?.csr_donor_id) {
            try {
              const oRes = await axiosInstance.get(`/csr-donors/${pocData.csr_donor_id}`);
              orgData = oRes.data?.data || (oRes.data?.id ? oRes.data : null);
            } catch (oErr) {
              console.warn('Linked CSR donor lookup failed:', oErr);
            }
          }
        } catch (pocErr) {
          console.warn('Direct POC lookup failed, falling back to box:', pocErr);
        }
      }

      // 2. If not found yet, try lookup as donation box
      if (!boxData && !orgData) {
        try {
          const res = await axiosInstance.get(`/donation-box/${id}`);
          boxData = res.data?.data || (res.data?.id ? res.data : null);
        } catch (boxErr) {
          // If box lookup fails, fallback to POC lookup
          if (!pocData) {
            try {
              const pocRes = await axiosInstance.get(`/csr-pocs/${id}`);
              pocData = pocRes.data?.data || (pocRes.data?.id ? pocRes.data : null);
              if (pocData?.donation_box_id) {
                const bRes = await axiosInstance.get(`/donation-box/${pocData.donation_box_id}`);
                boxData = bRes.data?.data || (bRes.data?.id ? bRes.data : null);
              } else if (pocData?.csr_donor_id) {
                const oRes = await axiosInstance.get(`/csr-donors/${pocData.csr_donor_id}`);
                orgData = oRes.data?.data || (oRes.data?.id ? oRes.data : null);
              }
            } catch (pErr) {
              throw boxErr;
            }
          }
        }
      }

      if (boxData) {
        setDonationBox(boxData);
        if (boxData.poc) {
          setPoc(boxData.poc);
        } else if (pocData) {
          setPoc(pocData);
        } else {
          try {
            const pocRes = await axiosInstance.get(`/csr-pocs/by-box/${boxData.id}`);
            const foundPoc = pocRes.data?.data || (pocRes.data?.id ? pocRes.data : null);
            if (foundPoc) {
              setPoc(foundPoc);
            }
          } catch (pocErr) {
            console.warn('Fallback POC lookup failed:', pocErr);
          }
        }
        // Fetch collections immediately so counts & tabs are always ready
        fetchCollections(boxData.id);
      } else if (orgData) {
        setOrg(orgData);
        if (pocData) setPoc(pocData);
        fetchCsrDonations(orgData.id);
      } else if (pocData) {
        setPoc(pocData);
      } else {
        setError('Failed to load Profile details');
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to load profile');
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateStr) => {
    if (!dateStr) return '—';
    return new Date(dateStr).toLocaleDateString('en-GB', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
    });
  };

  const formatCurrency = (amount) => {
    const num = Number(amount) || 0;
    return `Rs. ${num.toLocaleString('en-PK', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  };

  // Determine entity context (Donation Box, Mosque, or Corporate Donor)
  const isCorporateMode = !!org || (poc?.type === 'Corporate Donors' && !donationBox);
  const unitType = isCorporateMode
    ? 'Corporate Donors'
    : donationBox?.type || (poc?.type === 'Mosques' ? 'Mosques' : 'Donation Boxes');
  const pocType = poc?.type || unitType;
  const pocName = poc?.name || donationBox?.shopkeeper || donationBox?.name || org?.name || 'Contact Person';
  const pocPhone = poc?.phone || donationBox?.cell_no || org?.phone || '';
  const cleanPhone = String(pocPhone || '').replace(/[^0-9]/g, '');

  // Calculate live collections / donations summary
  const totalCollectionsAmount =
    collections.length > 0
      ? collections.reduce((acc, c) => acc + (Number(c.collection_amount || c.amount) || 0), 0)
      : Number(donationBox?.total_collected || org?.total_donations || 0);

  const totalCollectionsCount =
    collections.length > 0
      ? collections.length
      : Number(donationBox?.collection_count || org?.donations_count || 0);

  const lastCollectionDate =
    collections.length > 0 && collections[0]
      ? collections[0].collection_date || collections[0].donation_date || collections[0].created_at
      : donationBox?.last_collection_date || org?.last_donation_date;

  const targetBoxId = donationBox?.id || poc?.donation_box_id;
  const targetOrgId = org?.id || poc?.csr_donor_id;

  if (loading) {
    return (
      <>
        <Navbar />
        <div className="cup-container">
          <div className="loading" style={{ marginTop: '40px' }}>Loading Profile...</div>
        </div>
      </>
    );
  }

  if (error || (!donationBox && !org && !poc)) {
    return (
      <>
        <Navbar />
        <div className="cup-container">
          <PageHeader title="Profile" onBack={() => navigate('/dms/donation_box/list')} />
          <div className="status-message status-message--error" style={{ marginTop: '20px' }}>
            {error || 'Profile record not found'}
          </div>
        </div>
      </>
    );
  }

  return (
    <>
      <Navbar />
      <div className="cup-container">
        <PageHeader
          title={`${pocName} — Profile`}
          onBack={() => {
            if (targetBoxId) {
              navigate(`/dms/donation_box/view/${targetBoxId}`);
            } else if (targetOrgId) {
              navigate(`/dms/csr-donors/view/${targetOrgId}`);
            } else {
              navigate(-1);
            }
          }}
        />

        {/* Top Profile Summary Card */}
        <div className="cup-header-card">
          <div className="cup-header-main">
            <div className="cup-avatar">
              <FiUser />
            </div>
            <div className="cup-info">
              <div className="cup-title-row">
                <h2 className="cup-name">{pocName}</h2>
                <span
                  className={`cup-type-badge ${
                    unitType === 'Mosques'
                      ? 'badge-mosque'
                      : unitType === 'Corporate Donors'
                        ? 'badge-corporate'
                        : 'badge-box'
                  }`}
                >
                  {pocType}
                </span>
                {poc?.id && (
                  <span className="cup-id-badge" title="Person of Contact ID">
                    POC #{poc.id}
                  </span>
                )}
                <span
                  className={`cup-status-pill status-${
                    (donationBox?.status || org?.status || 'active').toLowerCase()
                  }`}
                >
                  {(donationBox?.status || org?.status || 'active').replace(/_/g, ' ')}
                </span>
              </div>

              <div className="cup-meta-row">
                {donationBox && (
                  <span className="cup-meta-item">
                    <FiPackage /> Unit: <strong>{donationBox.name || donationBox.shop_name}</strong>
                    {donationBox.key_no ? ` (Key ${donationBox.key_no})` : ` (#${donationBox.box_id_no || donationBox.id})`}
                  </span>
                )}
                {org && (
                  <span className="cup-meta-item">
                    <FiBriefcase /> Corporate Donor: <strong>{org.name}</strong>
                  </span>
                )}
                {donationBox?.route?.name && (
                  <span className="cup-meta-item">
                    <FiMapPin /> Route: {donationBox.route.name}
                  </span>
                )}
                {pocPhone && (
                  <span className="cup-meta-item">
                    <FiPhone /> <a href={`tel:${pocPhone}`}>{pocPhone}</a>
                  </span>
                )}
              </div>
            </div>
          </div>

          <div className="cup-header-actions">
            {cleanPhone && (
              <a
                href={`https://wa.me/${cleanPhone.startsWith('0') ? '92' + cleanPhone.slice(1) : cleanPhone}`}
                target="_blank"
                rel="noreferrer"
                className="cup-btn cup-btn--whatsapp"
                title="Open WhatsApp chat"
              >
                <FaWhatsapp /> WhatsApp
              </a>
            )}
            {targetBoxId && (
              <>
                <button
                  type="button"
                  className="cup-btn cup-btn--primary"
                  onClick={() => navigate(`/dms/donation-box-donations/add/${targetBoxId}`)}
                >
                  <FiDollarSign /> Add Collection
                </button>
                <button
                  type="button"
                  className="cup-btn cup-btn--secondary"
                  onClick={() => navigate(`/dms/donation_box/edit/${targetBoxId}`)}
                >
                  <FiEdit2 /> Edit Unit / POC
                </button>
              </>
            )}
            {targetOrgId && (
              <>
                <button
                  type="button"
                  className="cup-btn cup-btn--primary"
                  onClick={() => navigate(`/dms/online-donations/add?csr_donor_id=${targetOrgId}`)}
                >
                  <FiDollarSign /> Add Donation
                </button>
                <button
                  type="button"
                  className="cup-btn cup-btn--secondary"
                  onClick={() => navigate(`/dms/csr-donors/view/${targetOrgId}`)}
                >
                  <FiBriefcase /> View CSR Donor
                </button>
              </>
            )}
          </div>
        </div>

        {/* Key Metrics Row */}
        <div className="cup-metrics-grid">
          <div className="cup-metric-card">
            <span className="cup-metric-label">Total Collections</span>
            <span className="cup-metric-value">{formatCurrency(totalCollectionsAmount)}</span>
            <span className="cup-metric-sub">
              {isCorporateMode ? 'Lifetime corporate donations' : 'Lifetime collected funds'}
            </span>
          </div>
          <div className="cup-metric-card">
            <span className="cup-metric-label">Total Count</span>
            <span className="cup-metric-value">{totalCollectionsCount}</span>
            <span className="cup-metric-sub">
              {isCorporateMode ? 'Donations made' : 'Collection visits made'}
            </span>
          </div>
          <div className="cup-metric-card">
            <span className="cup-metric-label">
              {isCorporateMode ? 'Donor Category' : 'Collection Frequency'}
            </span>
            <span className="cup-metric-value" style={{ textTransform: 'capitalize' }}>
              {isCorporateMode ? org?.category || 'Corporate' : donationBox?.frequency || 'Monthly'}
            </span>
            <span className="cup-metric-sub">
              {isCorporateMode ? 'CSR partnership' : 'Target schedule'}
            </span>
          </div>
          <div className="cup-metric-card">
            <span className="cup-metric-label">Last Collection</span>
            <span className="cup-metric-value" style={{ fontSize: '18px' }}>
              {formatDate(lastCollectionDate)}
            </span>
            <span className="cup-metric-sub">
              Active since {formatDate(donationBox?.active_since || donationBox?.created_at || org?.created_at)}
            </span>
          </div>
        </div>

        {/* Tabs Bar */}
        <div className="cup-tabs-nav">
          <button
            type="button"
            className={`cup-tab-btn ${activeTab === 'overview' ? 'active' : ''}`}
            onClick={() => setActiveTab('overview')}
          >
            <FiLayers /> Overview & Identification
          </button>
          <button
            type="button"
            className={`cup-tab-btn ${activeTab === 'crm' ? 'active' : ''}`}
            onClick={() => setActiveTab('crm')}
          >
            <FiMessageSquare /> Communications & Interactions
          </button>
          <button
            type="button"
            className={`cup-tab-btn ${activeTab === 'collections' ? 'active' : ''}`}
            onClick={() => {
              setActiveTab('collections');
              if (targetBoxId) fetchCollections(targetBoxId);
              else if (targetOrgId) fetchCsrDonations(targetOrgId);
            }}
          >
            <FiDollarSign /> Total Collections ({totalCollectionsCount})
          </button>
        </div>

        {/* Tab 1: Overview */}
        {activeTab === 'overview' && (
          <div className="cup-tab-pane">
            <div className="cup-grid-2">
              {/* POC Info */}
              <div className="cup-card">
                <h3 className="cup-card-title">
                  <FiUser /> Person of Contact (POC) Details
                </h3>
                <div className="cup-details-list">
                  <div className="cup-detail-row">
                    <span className="cup-detail-label">Full Name</span>
                    <span className="cup-detail-val" style={{ fontWeight: 600 }}>{pocName}</span>
                  </div>
                  <div className="cup-detail-row">
                    <span className="cup-detail-label">POC Type</span>
                    <span className="cup-detail-val">
                      <span
                        className={`cup-type-badge ${
                          unitType === 'Mosques'
                            ? 'badge-mosque'
                            : unitType === 'Corporate Donors'
                              ? 'badge-corporate'
                              : 'badge-box'
                        }`}
                      >
                        {pocType}
                      </span>
                    </span>
                  </div>
                  <div className="cup-detail-row">
                    <span className="cup-detail-label">Contact Number</span>
                    <span className="cup-detail-val">{pocPhone || '—'}</span>
                  </div>
                  <div className="cup-detail-row">
                    <span className="cup-detail-label">CRM POC Reference</span>
                    <span className="cup-detail-val">{poc?.id ? `ID #${poc.id}` : 'Auto-registered'}</span>
                  </div>
                  <div className="cup-detail-row">
                    <span className="cup-detail-label">Role in Unit</span>
                    <span className="cup-detail-val" style={{ textTransform: 'capitalize' }}>
                      {unitType === 'Mosques'
                        ? 'Imam / Mosque Contact'
                        : unitType === 'Corporate Donors'
                          ? poc?.designation || 'Corporate Representative'
                          : 'Shopkeeper / Primary Contact'}
                    </span>
                  </div>
                  <div className="cup-detail-row">
                    <span className="cup-detail-label">Primary Status</span>
                    <span className="cup-detail-val">
                      <FiCheckCircle style={{ color: '#10b981', verticalAlign: 'middle', marginRight: '4px' }} />
                      Primary Contact Person
                    </span>
                  </div>
                </div>
              </div>

              {/* Unit Info */}
              <div className="cup-card">
                <h3 className="cup-card-title">
                  {isCorporateMode ? <FiBriefcase /> : <FiPackage />}
                  {isCorporateMode ? ' Corporate Donor Information' : ' Collection Unit Information'}
                </h3>
                <div className="cup-details-list">
                  <div className="cup-detail-row">
                    <span className="cup-detail-label">
                      {isCorporateMode ? 'Company / Organization' : 'Unit Name'}
                    </span>
                    <span className="cup-detail-val" style={{ fontWeight: 600 }}>
                      {donationBox?.name || donationBox?.shop_name || org?.name || '—'}
                    </span>
                  </div>
                  {donationBox && (
                    <>
                      <div className="cup-detail-row">
                        <span className="cup-detail-label">Unit Identification</span>
                        <span className="cup-detail-val">
                          {donationBox.box_id_no || (donationBox.key_no ? `Key: ${donationBox.key_no}` : `#${donationBox.id}`)}
                        </span>
                      </div>
                      {unitType === 'Donation Boxes' && (
                        <>
                          <div className="cup-detail-row">
                            <span className="cup-detail-label">Key Number</span>
                            <span className="cup-detail-val">{donationBox.key_no || '—'}</span>
                          </div>
                          <div className="cup-detail-row">
                            <span className="cup-detail-label">Box Size</span>
                            <span className="cup-detail-val" style={{ textTransform: 'capitalize' }}>
                              {donationBox.box_type || 'Medium'}
                            </span>
                          </div>
                        </>
                      )}
                      <div className="cup-detail-row">
                        <span className="cup-detail-label">Route</span>
                        <span className="cup-detail-val">{donationBox.route?.name || '—'}</span>
                      </div>
                      <div className="cup-detail-row">
                        <span className="cup-detail-label">City & Region</span>
                        <span className="cup-detail-val">
                          {donationBox.city?.name || donationBox.route?.cities?.[0]?.name || '—'}, {donationBox.route?.region?.name || '—'}
                        </span>
                      </div>
                      <div className="cup-detail-row">
                        <span className="cup-detail-label">FRD Assigned Officers</span>
                        <span className="cup-detail-val">
                          {donationBox.assignedUsers?.map((u) => `${u.first_name || ''} ${u.last_name || ''}`.trim()).filter(Boolean).join(', ') || 'Unassigned'}
                        </span>
                      </div>
                      <div className="cup-detail-row">
                        <span className="cup-detail-label">Landmark / Marketplace</span>
                        <span className="cup-detail-val">{donationBox.landmark_marketplace || '—'}</span>
                      </div>
                    </>
                  )}
                  {org && (
                    <>
                      <div className="cup-detail-row">
                        <span className="cup-detail-label">Industry / Sector</span>
                        <span className="cup-detail-val">{org.industry || '—'}</span>
                      </div>
                      <div className="cup-detail-row">
                        <span className="cup-detail-label">Official Email</span>
                        <span className="cup-detail-val">{org.email || '—'}</span>
                      </div>
                      <div className="cup-detail-row">
                        <span className="cup-detail-label">City / Address</span>
                        <span className="cup-detail-val">{org.city || org.address || '—'}</span>
                      </div>
                    </>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Tab 2: Communications & Interactions */}
        {activeTab === 'crm' && (
          <div className="cup-tab-pane">
            {poc?.id ? (
              <DonorCommunication
                csrPocId={poc.id}
                journeyTitle={`Interactions & Follow-ups — ${pocName}`}
                journeySubtitle={`CRM communication timeline, calls, visits and follow-up reminders for ${pocType}`}
              />
            ) : (
              <div className="cup-card" style={{ textAlign: 'center', padding: '40px 20px' }}>
                <p>Registering POC communication record...</p>
              </div>
            )}
          </div>
        )}

        {/* Tab 3: Total Collections */}
        {activeTab === 'collections' && (
          <div className="cup-tab-pane">
            <div className="cup-card">
              <div
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  marginBottom: '16px',
                  flexWrap: 'wrap',
                  gap: '10px',
                }}
              >
                <div>
                  <h3 className="cup-card-title" style={{ margin: 0 }}>
                    <FiDollarSign /> Collections Received ({totalCollectionsCount})
                  </h3>
                  <p style={{ margin: '4px 0 0', fontSize: '13px', color: '#64748b' }}>
                    All collections recorded for{' '}
                    <strong>{donationBox?.name || donationBox?.shop_name || org?.name || 'this unit'}</strong>{' '}
                    (not limited to this POC)
                  </p>
                </div>
                <div style={{ display: 'flex', gap: '8px' }}>
                  {targetBoxId && (
                    <>
                      <button
                        type="button"
                        className="cup-btn cup-btn--secondary"
                        onClick={() => navigate(`/dms/donation-box-donations/list/${targetBoxId}`)}
                        title="Open full collections page"
                      >
                        View in Full List
                      </button>
                      <button
                        type="button"
                        className="cup-btn cup-btn--primary"
                        onClick={() => navigate(`/dms/donation-box-donations/add/${targetBoxId}`)}
                      >
                        <FiDollarSign /> Add New Collection
                      </button>
                    </>
                  )}
                  {targetOrgId && (
                    <button
                      type="button"
                      className="cup-btn cup-btn--primary"
                      onClick={() => navigate(`/dms/online-donations/add?csr_donor_id=${targetOrgId}`)}
                    >
                      <FiDollarSign /> Add Donation
                    </button>
                  )}
                </div>
              </div>

              {collectionsLoading ? (
                <div className="loading" style={{ padding: '40px 20px', textAlign: 'center' }}>
                  Loading collections…
                </div>
              ) : collections.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '40px 20px', color: '#64748b' }}>
                  <p style={{ fontSize: '16px', fontWeight: 600 }}>No collections recorded yet</p>
                  <p style={{ fontSize: '13px' }}>
                    Click &apos;Add New Collection&apos; to record funds collected from this unit.
                  </p>
                </div>
              ) : (
                <div className="table-responsive">
                  <table className="data-table">
                    <thead>
                      <tr>
                        <th>ID</th>
                        <th>Collection Amount</th>
                        <th>Collection Date</th>
                        <th>Collected By</th>
                        <th>Status</th>
                        <th>Notes</th>
                        <th className="table-actions">Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {collections.map((item) => (
                        <tr key={item.id}>
                          <td>
                            <Link
                              to={`/dms/donation-box-donations/view/${item.id}`}
                              state={{ donation: item }}
                              style={{ fontWeight: 600, color: '#0369a1', textDecoration: 'none' }}
                            >
                              COL-{item.id}
                            </Link>
                          </td>
                          <td>
                            <span style={{ fontWeight: 700, color: '#15803d', fontSize: '15px' }}>
                              {formatCurrency(item.collection_amount || item.amount)}
                            </span>
                          </td>
                          <td>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
                              <FiCalendar style={{ color: '#6b7280' }} />
                              {formatDate(item.collection_date || item.donation_date || item.created_at)}
                            </div>
                          </td>
                          <td style={{ fontWeight: 500, color: '#334155' }}>
                            {item.collected_by
                              ? `${item.collected_by.first_name || ''} ${item.collected_by.last_name || ''}`.trim()
                              : item.collector_name || '—'}
                          </td>
                          <td>
                            <span className={`status-badge status-${(item.status || 'completed').toLowerCase()}`}>
                              {item.status || 'Completed'}
                            </span>
                          </td>
                          <td>
                            <div
                              style={{
                                fontSize: '13px',
                                color: '#64748b',
                                maxWidth: '200px',
                                overflow: 'hidden',
                                textOverflow: 'ellipsis',
                                whiteSpace: 'nowrap',
                              }}
                              title={item.notes || ''}
                            >
                              {item.notes || '—'}
                            </div>
                          </td>
                          <td className="table-actions">
                            <Link
                              to={
                                isCorporateMode
                                  ? `/dms/donations/view/${item.id}`
                                  : `/dms/donation-box-donations/view/${item.id}`
                              }
                              className="cup-link-btn"
                              title="View details"
                            >
                              View <FiExternalLink />
                            </Link>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </>
  );
};

export default CollectionUnitProfile;