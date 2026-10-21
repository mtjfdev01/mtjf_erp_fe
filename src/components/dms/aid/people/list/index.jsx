import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { FiEye, FiPlus, FiMinus, FiSearch, FiFilter } from 'react-icons/fi';
import axiosInstance from '../../../../../utils/axios';
import { useAuth } from '../../../../../context/AuthContext';
import {
  canViewModule,
  hasAidPermission,
} from '../../../../../utils/permissions';
import Navbar from '../../../../Navbar';
import PageHeader from '../../../../common/PageHeader';
import Pagination from '../../../../common/Pagination';
import FormInput from '../../../../common/FormInput';
import FormSelect from '../../../../common/FormSelect';
import FormTextarea from '../../../../common/FormTextarea';
import { PrimaryButton } from '../../../../common/buttons';
import AidLiteracyFields from '../../shared/AidLiteracyFields';
import {
  AID_FAMILY_SECTIONS,
  AID_GENDERS,
  AID_VULNERABILITIES,
  emptyLiteracyFields,
  personAge,
} from '../../aidConstants';
import '../../aid.css';

const emptyCreatePerson = () => ({
  full_name: '',
  cnic: '',
  phone: '',
  gender: '',
  city: '',
  address: '',
  vulnerability: '',
  ...emptyLiteracyFields(),
});

const STATUS_FILTER_OPTIONS = [
  { value: '', label: 'All Statuses' },
  { value: 'pending', label: 'Pending' },
  { value: 'successful', label: 'Successful' },
];

const formatCreatedDate = (d) => {
  if (!d) return '';
  try {
    return new Date(d).toISOString().slice(0, 10);
  } catch {
    return String(d).slice(0, 10);
  }
};

const nameInitial = (name) => {
  const t = String(name || '').trim();
  return t ? t.charAt(0).toUpperCase() : '?';
};

const formatRelationLabel = (relation) => {
  const raw = String(relation || '').trim();
  if (!raw) return '—';
  return raw
    .replace(/_/g, ' ')
    .replace(/\b\w/g, (c) => c.toUpperCase());
};

/** Flatten /aid/people/:id family_tree into nested-table rows. */
const flattenFamilyMembers = (tree = {}) => {
  const members = [];
  AID_FAMILY_SECTIONS.forEach((section) => {
    (tree[section.key] || []).forEach((row) => {
      if (!row?.person) return;
      members.push({
        key: row.edge_id || `${section.key}-${row.person.id}`,
        person: row.person,
        relation: row.relation_type || section.defaultRelation,
      });
    });
  });
  return members;
};

const AidPeopleList = () => {
  const navigate = useNavigate();
  const { permissions } = useAuth();
  const canList =
    canViewModule(permissions, 'program', 'aid_people') ||
    permissions?.super_admin ||
    permissions?.program_manager ||
    permissions?.fund_raising_manager;
  const canCreate =
    hasAidPermission(permissions, 'aid_people', 'create') ||
    permissions?.super_admin ||
    permissions?.program_manager ||
    permissions?.fund_raising_manager;

  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(20);
  const [totalItems, setTotalItems] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [sortField, setSortField] = useState('created_at');
  const [sortOrder, setSortOrder] = useState('DESC');
  const [searchInput, setSearchInput] = useState('');
  const [appliedSearch, setAppliedSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [showCreate, setShowCreate] = useState(false);
  const [person, setPerson] = useState(emptyCreatePerson);
  const [saving, setSaving] = useState(false);

  const [expandedId, setExpandedId] = useState(null);
  const [familyCache, setFamilyCache] = useState({});
  const [familyLoadingId, setFamilyLoadingId] = useState(null);

  const handleSortChange = (field, order) => {
    setSortField(field);
    setSortOrder(order);
    setCurrentPage(1);
  };

  const sortOptions = [
    { value: 'created_at', label: 'Created Date' },
    { value: 'updated_at', label: 'Updated Date' },
    { value: 'full_name', label: 'Full Name' },
    { value: 'city', label: 'City' },
    { value: 'cnic', label: 'CNIC' },
    { value: 'id', label: 'ID' },
  ];

  const fetchRows = async () => {
    if (!canList) {
      setError('You do not have permission to view aid people.');
      setLoading(false);
      return;
    }
    try {
      setLoading(true);
      const res = await axiosInstance.get('/aid/people', {
        params: {
          search: appliedSearch || undefined,
          page: currentPage,
          pageSize,
          sortField,
          sortOrder,
        },
      });
      setRows(res.data?.data || []);
      setTotalItems(res.data?.total || 0);
      setTotalPages(res.data?.totalPages || 1);
      setExpandedId(null);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to load people');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRows();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentPage, pageSize, sortField, sortOrder, appliedSearch]);

  const applySearch = () => {
    setCurrentPage(1);
    setAppliedSearch(searchInput.trim());
  };

  const loadFamily = async (personId) => {
    if (familyCache[personId]) return;
    setFamilyLoadingId(personId);
    try {
      const res = await axiosInstance.get(`/aid/people/${personId}`);
      const tree = res.data?.data?.family_tree || {};
      setFamilyCache((prev) => ({
        ...prev,
        [personId]: flattenFamilyMembers(tree),
      }));
    } catch {
      setFamilyCache((prev) => ({
        ...prev,
        [personId]: [],
      }));
    } finally {
      setFamilyLoadingId(null);
    }
  };

  const toggleExpand = (personId) => {
    if (expandedId === personId) {
      setExpandedId(null);
      return;
    }
    setExpandedId(personId);
    loadFamily(personId);
  };

  const createPerson = async (e) => {
    e.preventDefault();
    if (!person.full_name.trim()) {
      setError('Full name is required');
      return;
    }
    setSaving(true);
    setError('');
    try {
      const res = await axiosInstance.post('/aid/people', {
        full_name: person.full_name.trim(),
        gender: person.gender || undefined,
        cnic: person.cnic || undefined,
        phone: person.phone || undefined,
        city: person.city || undefined,
        address: person.address || undefined,
        vulnerability: person.vulnerability || undefined,
        literacy_status: person.literacy_status || undefined,
        literacy_category: person.literacy_category || undefined,
        student_class: person.student_class || undefined,
        student_class_type: person.student_class_type || undefined,
        student_class_name: person.student_class_name || undefined,
        monthly_income: person.monthly_income || undefined,
        occupation: person.literacy_category || undefined,
        has_disability: !!person.has_disability,
        disability_type: person.has_disability
          ? person.disability_type || undefined
          : undefined,
      });
      setShowCreate(false);
      setPerson(emptyCreatePerson());
      navigate(`/dms/aid/people/view/${res.data?.data?.id}`);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to create person');
    } finally {
      setSaving(false);
    }
  };

  const rangeFrom = totalItems === 0 ? 0 : (currentPage - 1) * pageSize + 1;
  const rangeTo = Math.min(currentPage * pageSize, totalItems);

  return (
    <>
      <Navbar />
      <div className="list-wrapper aid-list aid-people-list">
        <PageHeader
          title="Beneficiaries List"
          backPath="/dms/aid/applications/list"
          showAdd={false}
          rightElement={
            canCreate ? (
              <button
                type="button"
                className="aid-people-cta"
                onClick={() => setShowCreate((v) => !v)}
              >
                <FiPlus size={18} />
                New Aid Registration
              </button>
            ) : null
          }
        />

        <p className="aid-people-list__subtitle">
          Manage registered beneficiaries, program requests, and regional
          statuses.
        </p>

        <div className="list-content">
          {error && <div className="error-message">{error}</div>}

          {showCreate && (
            <form
              className="aid-card"
              onSubmit={createPerson}
              style={{ marginBottom: 16 }}
            >
              <h3 style={{ marginTop: 0 }}>New person</h3>
              <div className="form-grid">
                <FormInput
                  label="Full name"
                  required
                  value={person.full_name}
                  onChange={(e) =>
                    setPerson((p) => ({ ...p, full_name: e.target.value }))
                  }
                />
                <FormInput
                  label="CNIC"
                  value={person.cnic}
                  onChange={(e) =>
                    setPerson((p) => ({ ...p, cnic: e.target.value }))
                  }
                />
                <FormInput
                  label="Phone"
                  value={person.phone}
                  onChange={(e) =>
                    setPerson((p) => ({ ...p, phone: e.target.value }))
                  }
                />
                <FormSelect
                  label="Gender"
                  value={person.gender}
                  onChange={(e) =>
                    setPerson((p) => ({ ...p, gender: e.target.value }))
                  }
                  options={[{ value: '', label: '—' }, ...AID_GENDERS]}
                />
                <FormSelect
                  label="Vulnerability"
                  value={person.vulnerability || ''}
                  onChange={(e) =>
                    setPerson((p) => ({ ...p, vulnerability: e.target.value }))
                  }
                  options={[{ value: '', label: '—' }, ...AID_VULNERABILITIES]}
                />
                <FormInput
                  label="City"
                  value={person.city}
                  onChange={(e) =>
                    setPerson((p) => ({ ...p, city: e.target.value }))
                  }
                />
                <FormTextarea
                  label="Address"
                  value={person.address}
                  onChange={(e) =>
                    setPerson((p) => ({ ...p, address: e.target.value }))
                  }
                  rows={2}
                  placeholder="Full address"
                />
              </div>
              <div className="aid-family-panel" style={{ marginTop: 12 }}>
                <h4 className="aid-family-panel__title">Literacy</h4>
                <AidLiteracyFields value={person} onChange={setPerson} />
              </div>
              <div style={{ marginTop: 12 }}>
                <PrimaryButton
                  type="submit"
                  loading={saving}
                  loadingText="Saving…"
                >
                  Create person
                </PrimaryButton>
              </div>
            </form>
          )}

          <div className="aid-people-toolbar">
            <div className="aid-people-search">
              <FiSearch className="aid-people-search__icon" size={16} />
              <input
                type="search"
                value={searchInput}
                onChange={(e) => setSearchInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault();
                    applySearch();
                  }
                }}
                placeholder="Search by beneficiary name, CNIC or phone..."
                aria-label="Search beneficiaries"
              />
            </div>
            <div className="aid-people-status-filter">
              <FiFilter size={14} />
              <span>Status:</span>
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                aria-label="Filter by status"
              >
                {STATUS_FILTER_OPTIONS.map((o) => (
                  <option key={o.value || 'all'} value={o.value}>
                    {o.label}
                  </option>
                ))}
              </select>
            </div>
            <span className="aid-people-showing">
              Showing {totalItems} record{totalItems === 1 ? '' : 's'}
            </span>
          </div>

          <div className="aid-people-collapse">
            <div className="aid-people-collapse__head" aria-hidden="true">
              <span className="aid-people-collapse__toggle-cell" />
              <span>Beneficiary Name</span>
              <span>CNIC Number</span>
              <span>Phone</span>
              <span>City</span>
              <span>Program / Aid</span>
              <span>Expected Amount</span>
              <span>Status</span>
              <span>Actions</span>
            </div>

            {loading ? (
              <div className="aid-people-collapse__empty">Loading…</div>
            ) : rows.length === 0 ? (
              <div className="aid-people-collapse__empty">
                No beneficiaries found.
              </div>
            ) : (
              rows.map((row) => {
                const isOpen = expandedId === row.id;
                const members = familyCache[row.id];
                const membersLoading = familyLoadingId === row.id;

                return (
                  <div
                    key={row.id}
                    className={`aid-people-collapse__item${
                      isOpen ? ' aid-people-collapse__item--open' : ''
                    }`}
                  >
                    <div className="aid-people-collapse__row">
                      <div className="aid-people-collapse__toggle-cell">
                        <button
                          type="button"
                          className="aid-people-collapse__toggle"
                          aria-expanded={isOpen}
                          aria-label={
                            isOpen
                              ? `Collapse ${row.full_name}`
                              : `Expand ${row.full_name}`
                          }
                          onClick={() => toggleExpand(row.id)}
                        >
                          {isOpen ? <FiMinus size={14} /> : <FiPlus size={14} />}
                        </button>
                      </div>

                      <div className="aid-people-collapse__cell aid-people-collapse__cell--name">
                        <div className="aid-people-name-cell">
                          <span
                            className="aid-people-avatar"
                            aria-hidden="true"
                          >
                            {nameInitial(row.full_name)}
                          </span>
                          <div className="aid-people-name-cell__text">
                            <span className="aid-people-name-cell__name">
                              {row.full_name}
                            </span>
                            {row.created_at && (
                              <span className="aid-people-name-cell__meta">
                                Created: {formatCreatedDate(row.created_at)}
                              </span>
                            )}
                          </div>
                        </div>
                      </div>

                      <div className="aid-people-collapse__cell">
                        {row.cnic || '—'}
                      </div>
                      <div className="aid-people-collapse__cell">
                        {row.phone || '—'}
                      </div>
                      <div className="aid-people-collapse__cell">
                        {row.city || '—'}
                      </div>
                      <div className="aid-people-collapse__cell aid-people-empty-col">
                        —
                      </div>
                      <div className="aid-people-collapse__cell aid-people-empty-col">
                        —
                      </div>
                      <div className="aid-people-collapse__cell aid-people-empty-col">
                        —
                      </div>
                      <div className="aid-people-collapse__cell aid-people-collapse__cell--actions">
                        <button
                          type="button"
                          className="aid-people-view-btn"
                          onClick={() =>
                            navigate(`/dms/aid/people/view/${row.id}`)
                          }
                        >
                          <FiEye size={15} />
                          View
                        </button>
                      </div>
                    </div>

                    <div
                      className={`aid-people-collapse__body${
                        isOpen ? ' aid-people-collapse__body--open' : ''
                      }`}
                      aria-hidden={!isOpen}
                    >
                      <div className="aid-people-collapse__body-inner">
                        <div className="aid-people-collapse__panel">
                          {!isOpen && !members ? null : membersLoading ? (
                            <div className="aid-people-collapse__panel-msg">
                              Loading family members…
                            </div>
                          ) : !members || members.length === 0 ? (
                            <div className="aid-people-collapse__panel-msg">
                              No family members linked to this beneficiary.
                            </div>
                          ) : (
                            <div className="aid-people-nested-wrap">
                              <table className="aid-people-nested-table">
                                <thead>
                                  <tr>
                                    <th>Member</th>
                                    <th>Relation</th>
                                    <th>Age</th>
                                    <th>CNIC / B-Form</th>
                                    <th>Phone</th>
                                    <th>City</th>
                                  </tr>
                                </thead>
                                <tbody>
                                  {members.map((m) => {
                                    const p = m.person;
                                    const age = personAge(p.date_of_birth);
                                    return (
                                      <tr key={m.key}>
                                        <td>
                                          <button
                                            type="button"
                                            className="aid-text-link"
                                            tabIndex={isOpen ? 0 : -1}
                                            onClick={() =>
                                              navigate(
                                                `/dms/aid/people/view/${p.id}`,
                                              )
                                            }
                                          >
                                            {p.full_name || '—'}
                                          </button>
                                        </td>
                                        <td>
                                          {formatRelationLabel(m.relation)}
                                        </td>
                                        <td>{age != null ? age : '—'}</td>
                                        <td>{p.cnic || '—'}</td>
                                        <td>{p.phone || '—'}</td>
                                        <td>{p.city || '—'}</td>
                                      </tr>
                                    );
                                  })}
                                </tbody>
                              </table>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })
            )}
          </div>

          {totalItems > 0 && (
            <div className="aid-people-footer">
              <span className="aid-people-footer__range">
                Showing {rangeFrom} to {rangeTo} of {totalItems} entries
              </span>
              <Pagination
                currentPage={currentPage}
                totalPages={totalPages}
                totalItems={totalItems}
                pageSize={pageSize}
                onPageChange={setCurrentPage}
                onPageSizeChange={(n) => {
                  setPageSize(n);
                  setCurrentPage(1);
                }}
                onSortChange={handleSortChange}
                sortField={sortField}
                sortOrder={sortOrder}
                sortOptions={sortOptions}
              />
            </div>
          )}
        </div>
      </div>
    </>
  );
};

export default AidPeopleList;
