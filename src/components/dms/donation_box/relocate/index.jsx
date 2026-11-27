import React, { useCallback, useEffect, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import axiosInstance from '../../../../utils/axios';
import FormInput from '../../../common/FormInput';
import FormSelect from '../../../common/FormSelect';
import SearchableDropdown from '../../../common/SearchableDropdown';
import SearchableMultiSelect from '../../../common/SearchableMultiSelect';
import Navbar from '../../../Navbar';
import PageHeader from '../../../common/PageHeader';
import DonationBoxAuditHistory from '../shared/DonationBoxAuditHistory';
import LocationMapPicker from '../../../common/LocationMapPicker';
import {
  getDonationBoxCityId,
  getDonationBoxCityName,
  getDonationBoxMapLocation,
  getDonationBoxRegionId,
  getDonationBoxRouteId,
  toDateInputValue,
} from '../shared/donationBoxFormUtils';

const EMPTY_RELOCATE_FORM = {
  region: '',
  city: '',
  city_id: '',
  route_id: '',
  shop_name: '',
  shopkeeper: '',
  cell_no: '',
  landmark_marketplace: '',
  active_since: '',
  relocation_note: '',
  assigned_user_ids: [],
  poc_id: '',
};

const RelocateDonationBox = () => {
  const navigate = useNavigate();
  const { id } = useParams();

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [auditRefreshKey, setAuditRefreshKey] = useState(0);
  const [donationBox, setDonationBox] = useState(null);

  const [relocateForm, setRelocateForm] = useState(() => ({ ...EMPTY_RELOCATE_FORM }));
  const [assignedUsers, setAssignedUsers] = useState([]);
  const [selectedPoc, setSelectedPoc] = useState(null);
  const [relocating, setRelocating] = useState(false);
  const [relocateLocation, setRelocateLocation] = useState(null);

  const [regions, setRegions] = useState([]);
  const [cities, setCities] = useState([]);
  const [routes, setRoutes] = useState([]);
  const [loadingRegions, setLoadingRegions] = useState(false);
  const [loadingCities, setLoadingCities] = useState(false);
  const [loadingRoutes, setLoadingRoutes] = useState(false);

  const fetchRegions = async () => {
    try {
      setLoadingRegions(true);
      const response = await axiosInstance.get('/regions?country_id=1');
      if (response.data.success) {
        setRegions(response.data.data || []);
      }
    } catch (err) {
      console.error('Error fetching regions:', err);
      setError('Failed to load regions');
    } finally {
      setLoadingRegions(false);
    }
  };

  const fetchCities = async (regionId) => {
    try {
      setLoadingCities(true);
      const response = await axiosInstance.get(`/cities?region_id=${regionId}`);
      if (response.data.success) {
        setCities(response.data.data || []);
      }
    } catch (err) {
      console.error('Error fetching cities:', err);
      setError('Failed to load cities');
    } finally {
      setLoadingCities(false);
    }
  };

  const fetchRoutes = async (cityId) => {
    try {
      setLoadingRoutes(true);
      const response = await axiosInstance.get(`/routes?city_id=${cityId}`);
      if (response.data.success) {
        setRoutes(response.data.data || []);
      }
    } catch (err) {
      console.error('Error fetching routes:', err);
      setError('Failed to load routes');
    } finally {
      setLoadingRoutes(false);
    }
  };

  const hydrateFromBox = useCallback(async (box) => {
    const regionId = getDonationBoxRegionId(box);
    const cityId = getDonationBoxCityId(box);
    const routeId = getDonationBoxRouteId(box);
    const assigned = Array.isArray(box.assignedUsers) ? box.assignedUsers : [];

    setRelocateForm({
      region: regionId,
      city: cityId,
      city_id: cityId,
      route_id: routeId,
      shop_name: box.shop_name || box.name || '',
      shopkeeper: box.shopkeeper || box.poc?.name || '',
      cell_no: box.cell_no || box.poc?.phone || '',
      landmark_marketplace: box.landmark_marketplace || '',
      active_since: toDateInputValue(box.active_since || box.created_at),
      relocation_note: '',
      assigned_user_ids: assigned.map((u) => u?.id).filter((uid) => uid != null),
      poc_id: '',
    });
    setAssignedUsers(assigned);
    setSelectedPoc(null);
    setRelocateLocation(getDonationBoxMapLocation(box));

    if (regionId) {
      await fetchCities(regionId);
    } else {
      setCities([]);
    }
    if (cityId) {
      await fetchRoutes(cityId);
    } else {
      setRoutes([]);
    }
  }, []);

  const fetchDonationBox = useCallback(async () => {
    try {
      setLoading(true);
      setError('');
      const response = await axiosInstance.get(`/donation-box/${id}`);
      if (!response.data?.success) {
        throw new Error(response.data?.message || 'Failed to load donation box');
      }

      const box = response.data.data;
      setDonationBox(box);
      await hydrateFromBox(box);
    } catch (err) {
      setError(err.response?.data?.message || err.message || 'Failed to load donation box');
    } finally {
      setLoading(false);
    }
  }, [hydrateFromBox, id]);

  useEffect(() => {
    fetchRegions();
    fetchDonationBox();
  }, [fetchDonationBox]);

  const handleBack = () => navigate(`/dms/donation_box/view/${id}`);

  const handleRelocateChange = (e) => {
    const { name, value } = e.target;
    setRelocateForm((prev) => {
      const next = { ...prev, [name]: value };
      if (name === 'region') {
        next.city = '';
        next.city_id = '';
        next.route_id = '';
        setCities([]);
        setRoutes([]);
        if (value) fetchCities(value);
      } else if (name === 'city') {
        next.city_id = value;
        next.route_id = '';
        setRoutes([]);
        if (value) fetchRoutes(value);
      }
      return next;
    });
    if (error) setError('');
    if (success) setSuccess('');
  };

  const handleAssignedUsersSelect = (selectedUsers) => {
    setAssignedUsers(selectedUsers);
    const userIds = selectedUsers.map((user) => user.id);
    setRelocateForm((prev) => ({ ...prev, assigned_user_ids: userIds }));
  };

  const handleAssignedUsersClear = () => {
    setAssignedUsers([]);
    setRelocateForm((prev) => ({ ...prev, assigned_user_ids: [] }));
  };

  const searchExistingPocs = async (term) => {
    try {
      const boxType = donationBox?.type === 'Mosques' ? 'Mosques' : 'Donation Boxes';
      const response = await axiosInstance.get('/csr-pocs', {
        params: {
          search: term,
          type: boxType,
          pageSize: 25,
          page: 1,
          is_active: true,
        },
      });
      return response.data?.data || [];
    } catch (err) {
      console.error('POC search failed:', err);
      return [];
    }
  };

  const handlePocSelect = (poc) => {
    if (!poc) return;
    setSelectedPoc(poc);
    setRelocateForm((prev) => ({
      ...prev,
      poc_id: poc.id,
      shopkeeper: poc.name || prev.shopkeeper,
      cell_no: poc.phone || prev.cell_no,
      shop_name:
        prev.shop_name ||
        poc.donation_box?.shop_name ||
        poc.donation_box?.name ||
        prev.shop_name,
    }));
    if (error) setError('');
    if (success) setSuccess('');
  };

  const handlePocClear = () => {
    setSelectedPoc(null);
    setRelocateForm((prev) => ({ ...prev, poc_id: '' }));
  };

  const handleRelocate = async (e) => {
    e.preventDefault();
    if (!relocateForm.shop_name?.trim()) {
      setError('Shop name is required to relocate the box.');
      return;
    }

    setRelocating(true);
    setError('');
    setSuccess('');
    try {
      const location = relocateLocation;
      const payload = {
        route_id: relocateForm.route_id ? Number(relocateForm.route_id) : null,
        city_id: relocateForm.city_id ? Number(relocateForm.city_id) : undefined,
        shop_name: relocateForm.shop_name.trim(),
        shopkeeper: relocateForm.shopkeeper?.trim() || undefined,
        cell_no: relocateForm.cell_no?.trim() || undefined,
        landmark_marketplace: relocateForm.landmark_marketplace?.trim() || undefined,
        active_since: relocateForm.active_since || undefined,
        relocation_note: relocateForm.relocation_note?.trim() || undefined,
        assigned_user_ids: relocateForm.assigned_user_ids,
        ...(relocateForm.poc_id ? { poc_id: Number(relocateForm.poc_id) } : {}),
      };

      if (location) {
        payload.registration_latitude = location.latitude;
        payload.registration_longitude = location.longitude;
        payload.registration_location_name = location.location_name || undefined;
        payload.registration_location_details = location.location_details || undefined;
        payload.require_collection_location = true;
      }

      const response = await axiosInstance.patch(`/donation-box/${id}/relocate`, payload);
      if (!response.data?.success) {
        throw new Error(response.data?.message || 'Failed to relocate donation box');
      }

      setSuccess('Donation box relocated successfully.');
      setAuditRefreshKey((k) => k + 1);
      await fetchDonationBox();
    } catch (err) {
      setError(err.response?.data?.message || err.message || 'Failed to relocate donation box');
    } finally {
      setRelocating(false);
    }
  };

  if (loading) {
    return (
      <>
        <Navbar />
        <div className="form-content">
          <PageHeader title="Relocate Collection Unit" onBack={handleBack} />
          <div className="loading">Loading...</div>
        </div>
      </>
    );
  }

  if (!donationBox) {
    return (
      <>
        <Navbar />
        <div className="form-content">
          <PageHeader title="Relocate Collection Unit" onBack={handleBack} />
          <div className="status-message status-message--error">
            {error || 'Donation box not found'}
          </div>
        </div>
      </>
    );
  }

  const unitLabel =
    donationBox.name || donationBox.shop_name || donationBox.key_no || donationBox.id;

  return (
    <>
      <Navbar />
      <div className="form-content">
        <PageHeader title={`Relocate Collection Unit — ${unitLabel}`} onBack={handleBack} />

        {error && <div className="status-message status-message--error">{error}</div>}
        {success && <div className="status-message status-message--success">{success}</div>}

        <div className="form-section">
          <div
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'flex-start',
              gap: '12px',
              flexWrap: 'wrap',
              marginBottom: '12px',
            }}
          >
            <div>
              <h3 className="form-section-heading" style={{ marginBottom: '4px' }}>
                Current shop placement
              </h3>
              <p className="form-section-hint" style={{ margin: 0, color: '#6b7280' }}>
                Existing values are loaded below. Change only what needs to move.
              </p>
            </div>
            <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
              <Link
                to={`/dms/donation_box/history/${id}`}
                className="secondary_btn"
                style={{ textDecoration: 'none', whiteSpace: 'nowrap' }}
              >
                Unit history
              </Link>
              <Link
                to={`/dms/donation_box/edit/${id}`}
                className="secondary_btn"
                style={{ textDecoration: 'none', whiteSpace: 'nowrap' }}
              >
                Update settings
              </Link>
            </div>
          </div>
          <div className="view-grid">
            <div className="view-item">
              <span className="view-item-label">Region</span>
              <span className="view-item-value">
                {donationBox.city?.region?.name || donationBox.route?.region?.name || '—'}
              </span>
            </div>
            <div className="view-item">
              <span className="view-item-label">City</span>
              <span className="view-item-value">{getDonationBoxCityName(donationBox)}</span>
            </div>
            <div className="view-item">
              <span className="view-item-label">Route</span>
              <span className="view-item-value">{donationBox.route?.name || '—'}</span>
            </div>
            <div className="view-item">
              <span className="view-item-label">Shop name</span>
              <span className="view-item-value">{donationBox.shop_name || '—'}</span>
            </div>
            <div className="view-item">
              <span className="view-item-label">Shopkeeper</span>
              <span className="view-item-value">{donationBox.shopkeeper || '—'}</span>
            </div>
            <div className="view-item">
              <span className="view-item-label">Cell number</span>
              <span className="view-item-value">{donationBox.cell_no || '—'}</span>
            </div>
            <div className="view-item">
              <span className="view-item-label">Active since</span>
              <span className="view-item-value">
                {toDateInputValue(donationBox.active_since || donationBox.created_at) || '—'}
              </span>
            </div>
          </div>
        </div>

        <form onSubmit={handleRelocate} className="form">
          <div className="form-section">
            <h3 className="form-section-heading">Relocate to new shop</h3>
            <p className="form-section-hint" style={{ marginBottom: '16px', color: '#6b7280' }}>
              Assign this same physical box to a new shop. Search an existing POC to reuse their
              contact history, or enter a new shopkeeper to create a new POC. Placement history is
              tracked separately for the unit and the POC.
            </p>
            <div className="form-grid-2">
              <div style={{ gridColumn: '1 / -1' }}>
                <SearchableDropdown
                  label="Existing POC (optional)"
                  placeholder="Search by name, phone, or shop..."
                  onSearch={searchExistingPocs}
                  onSelect={handlePocSelect}
                  onClear={handlePocClear}
                  value={selectedPoc}
                  displayKey="name"
                  debounceDelay={300}
                  minSearchLength={1}
                  allowResearch
                  renderOption={(poc) => (
                    <div style={{ padding: '4px 0' }}>
                      <div style={{ fontWeight: 600 }}>{poc.name}</div>
                      <div style={{ fontSize: '12px', color: '#64748b' }}>
                        {[poc.phone, poc.donation_box?.shop_name || poc.donation_box?.name]
                          .filter(Boolean)
                          .join(' · ') || 'No shop linked'}
                        {poc.donation_box_id ? ` · Box #${poc.donation_box_id}` : ''}
                      </div>
                    </div>
                  )}
                />
                <p style={{ margin: '6px 0 0', fontSize: '12px', color: '#64748b' }}>
                  Leave empty to create a new POC from the shopkeeper details below.
                  {selectedPoc?.id ? (
                    <>
                      {' '}
                      <Link to={`/dms/csr-pocs/history/${selectedPoc.id}`}>
                        View this POC&apos;s history
                      </Link>
                    </>
                  ) : null}
                </p>
              </div>

              <FormSelect
                label="Region"
                name="region"
                value={relocateForm.region}
                onChange={handleRelocateChange}
                options={regions.map((region) => ({
                  value: String(region.id),
                  label: region.name,
                }))}
                required
                disabled={loadingRegions}
                showDefaultOption
                defaultOptionText={loadingRegions ? 'Loading regions...' : 'Select region'}
              />

              <FormSelect
                label="City"
                name="city"
                value={relocateForm.city}
                onChange={handleRelocateChange}
                options={cities.map((city) => ({
                  value: String(city.id),
                  label: city.name,
                }))}
                required
                disabled={loadingCities || !relocateForm.region}
                showDefaultOption
                defaultOptionText={
                  loadingCities
                    ? 'Loading cities...'
                    : !relocateForm.region
                      ? 'Select region first'
                      : 'Select city'
                }
              />

              <FormSelect
                label="Route (optional)"
                name="route_id"
                value={relocateForm.route_id}
                onChange={handleRelocateChange}
                options={routes.map((route) => ({
                  value: String(route.id),
                  label: route.name,
                }))}
                disabled={loadingRoutes || !relocateForm.city}
                showDefaultOption
                defaultOptionText={
                  loadingRoutes
                    ? 'Loading routes...'
                    : !relocateForm.city
                      ? 'Select city first'
                      : 'No route'
                }
              />

              <FormInput
                label="Active since (at new shop)"
                type="date"
                name="active_since"
                value={relocateForm.active_since}
                onChange={handleRelocateChange}
              />

              <FormInput
                label="New shop name"
                type="text"
                name="shop_name"
                value={relocateForm.shop_name}
                onChange={handleRelocateChange}
                required
                placeholder="Enter new shop name"
              />

              <FormInput
                label="New shopkeeper name"
                type="text"
                name="shopkeeper"
                value={relocateForm.shopkeeper}
                onChange={handleRelocateChange}
                placeholder="Shopkeeper at new location"
              />

              <FormInput
                label="New cell number"
                type="tel"
                name="cell_no"
                value={relocateForm.cell_no}
                onChange={handleRelocateChange}
                placeholder="Contact at new shop"
              />

              <FormInput
                label="Landmark / marketplace"
                type="text"
                name="landmark_marketplace"
                value={relocateForm.landmark_marketplace}
                onChange={handleRelocateChange}
                placeholder="Optional landmark"
              />

              <div style={{ gridColumn: '1 / -1' }}>
                <SearchableMultiSelect
                  label="Assign collectors (new placement)"
                  apiEndpoint="/users/options?department=fund_raising"
                  onSelect={handleAssignedUsersSelect}
                  onClear={handleAssignedUsersClear}
                  value={assignedUsers}
                  displayKey="first_name"
                  valueKey="id"
                  allowResearch
                  debounceDelay={500}
                  minSearchLength={2}
                  renderOption={(user) => (
                    <div style={{ padding: '8px' }}>
                      <div style={{ fontWeight: '500', marginBottom: '4px' }}>
                        {user.first_name} {user.last_name}
                      </div>
                      <div style={{ fontSize: '12px', color: '#666' }}>{user.email}</div>
                    </div>
                  )}
                />
              </div>

              <div style={{ gridColumn: '1 / -1' }}>
                <FormInput
                  label="Relocation note (optional)"
                  type="text"
                  name="relocation_note"
                  value={relocateForm.relocation_note}
                  onChange={handleRelocateChange}
                  placeholder="Reason or details for this move (included in audit log)"
                />
              </div>
            </div>
          </div>

          <div className="form-section">
            <h3 className="form-section-heading">Shop location on map (optional)</h3>
            <p style={{ margin: '0 0 12px', fontSize: '13px', color: '#64748b' }}>
              Existing pin is loaded when available. Update only if the new shop needs GPS checks.
            </p>
            <LocationMapPicker
              value={relocateLocation}
              onChange={setRelocateLocation}
              axiosInstance={axiosInstance}
              disabled={relocating}
            />
          </div>

          <div className="form-actions">
            <button type="submit" className="primary_btn" disabled={relocating}>
              {relocating ? 'Relocating...' : 'Relocate box to new shop'}
            </button>
          </div>
        </form>

        <div className="form-section" style={{ marginTop: '32px' }}>
          <h3 className="form-section-heading">Relocation & change history</h3>
          <DonationBoxAuditHistory donationBoxId={id} refreshKey={auditRefreshKey} />
        </div>
      </div>
    </>
  );
};

export default RelocateDonationBox;
