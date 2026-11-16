import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import Navbar from '../../Navbar';
import ReconciliationOverview from './ReconciliationOverview';
import ReconciliationQueue from './ReconciliationQueue';
import ReconciliationBoxCollections, { analyseRun } from './ReconciliationBoxCollections';
import axiosInstance from '../../../utils/axios';
import {
  FiGrid,
  FiList,
  FiBox,
  FiFileText,
  FiSliders,
  FiBell,
} from 'react-icons/fi';
import './reconciliationAgent.css';

// Initial data from the DMS Reconciliation Agent specification
const INITIAL_ROWS = [
  { id: 1, donor: 'Dr Ammar Rafiq', amount: 50000, method: 'In-kind', project: '', date: '26 Oct 2026', time: '10:50 am', age: 0, status: 'pending', dup: false, phone: '+92 300 1234567', ref: '' },
  { id: 2, donor: 'Mian Umair M.', amount: 100000, method: 'Cash', project: '', date: '26 Oct 2026', time: '10:33 am', age: 0, status: 'pending', dup: false, phone: '+92 321 9876543', ref: '' },
  { id: 3, donor: 'Sarwat Haris', amount: 5000, method: 'Bank transfer', project: '', date: '23 Oct 2026', time: '12:00 pm', age: 3, status: 'pending', dup: false, phone: '+92 333 4567890', ref: '' },
  { id: 4, donor: 'Mohammad Jawed', amount: 2500, method: 'Bank transfer', project: '', date: '24 Oct 2026', time: '10:08 am', age: 2, status: 'completed', dup: false, phone: '+92 345 5678901', ref: 'FT-99281' },
  { id: 5, donor: 'Major Asim Khan', amount: 2500, method: 'Bank transfer', project: '', date: '23 Oct 2026', time: '11:43 am', age: 3, status: 'completed', dup: false, phone: '+92 312 6789012', ref: 'FT-98442' },
  { id: 6, donor: 'Rizwana Sohail', amount: 10000, method: 'Bank transfer', project: '', date: '20 Oct 2026', time: '11:40 am', age: 6, status: 'pending', dup: false, phone: '+92 301 7890123', ref: '' },
  { id: 7, donor: 'Muhammad Abu B.', amount: 1000, method: 'Bank transfer', project: 'Apna Ghar', date: '07 Sep 2026', time: '02:20 pm', age: 49, status: 'pending', dup: true, phone: '+92 322 8901234', ref: '' },
  { id: 8, donor: 'ملک ممتاز کانجو', amount: 5000, method: 'Bank transfer', project: 'AAS Lab', date: '21 Oct 2026', time: '02:15 pm', age: 5, status: 'pending', dup: false, phone: '+92 334 9012345', ref: '' },
  { id: 9, donor: 'Muhammad Farhan', amount: 50000, method: 'Bank transfer', project: 'AAS Lab', date: '18 Oct 2026', time: '02:09 pm', age: 8, status: 'pending', dup: false, phone: '+92 346 0123456', ref: '' },
  { id: 10, donor: 'Muhammad Abu B.', amount: 1000, method: 'Bank transfer', project: 'Apna Ghar', date: '15 Aug 2026', time: '02:08 pm', age: 72, status: 'pending', dup: true, phone: '+92 322 8901234', ref: '' },
];

const INITIAL_RUNS = [
  {
    id: 1,
    route: 'Mian Channu City',
    agent: 'Collection agent A',
    date: '24 Oct 2026',
    held: 1,
    status: 'pending',
    boxes: [
      { id: 'MC-001', place: 'Main Bazaar medical store', amount: 18200, avg: 17500 },
      { id: 'MC-004', place: 'GT Road petrol pump', amount: 12650, avg: 13100 },
      { id: 'MC-007', place: 'City hospital reception', amount: 21400, avg: 20800 },
      { id: 'MC-009', place: 'Grain market office', amount: 9300, avg: 10200 },
      { id: 'MC-012', place: 'Bus stand hotel', amount: 15900, avg: 14700 },
      { id: 'MC-015', place: 'Model Town general store', amount: 9000, avg: 9600 },
    ],
    deposits: [{ slip: 'SLIP-8849', date: '25 Oct 2026', account: 'Collection A/C', amount: 86450 }],
  },
  {
    id: 2,
    route: 'Multan Cantt',
    agent: 'Collection agent B',
    date: '22 Oct 2026',
    held: 2,
    status: 'pending',
    boxes: [
      { id: 'MT-002', place: 'Cantt bakery', amount: 14100, avg: 13800 },
      { id: 'MT-005', place: 'Clinic front desk', amount: 16900, avg: 16200 },
      { id: 'MT-008', place: 'Petrol station', amount: 3100, avg: 11900 },
      { id: 'MT-011', place: 'General store', amount: 20200, avg: 19500 },
      { id: 'MT-013', place: 'Mosque entrance', amount: null, avg: 8400 },
    ],
    deposits: [{ slip: 'SLIP-8821', date: '24 Oct 2026', account: 'Collection A/C', amount: 50000 }],
  },
  {
    id: 3,
    route: 'Khanewal Road',
    agent: 'Collection agent C',
    date: '19 Oct 2026',
    held: 7,
    status: 'pending',
    boxes: [
      { id: 'KR-001', place: 'Roadside hotel', amount: 7800, avg: 8100 },
      { id: 'KR-003', place: 'Medical store', amount: 9450, avg: 9000 },
      { id: 'KR-006', place: 'Tyre shop', amount: 6230, avg: 6500 },
      { id: 'KR-009', place: 'Fuel station', amount: 8300, avg: 8700 },
    ],
    deposits: [],
  },
  {
    id: 4,
    route: 'Lahore · Johar Town',
    agent: 'Collection agent D',
    date: '25 Oct 2026',
    held: 0,
    status: 'pending',
    boxes: [
      { id: 'LJ-003', place: 'Pharmacy, Block G', amount: 22400, avg: 21900 },
      { id: 'LJ-006', place: 'Bakery, Block J', amount: 18700, avg: 19200 },
      { id: 'LJ-008', place: 'Hospital lobby', amount: 25100, avg: 24300 },
      { id: 'LJ-011', place: 'Supermarket exit', amount: 14600, avg: 15000 },
      { id: 'LJ-014', place: 'Restaurant counter', amount: 17900, avg: 18400 },
      { id: 'LJ-017', place: 'Mobile shop', amount: 14200, avg: 13700 },
    ],
    deposits: [{ slip: 'SLIP-9901', date: '25 Oct 2026', account: 'Collection A/C', amount: 112900 }],
  },
  {
    id: 5,
    route: 'Mian Channu Bazaar',
    agent: 'Collection agent A',
    date: '17 Oct 2026',
    held: 3,
    status: 'pending',
    boxes: [
      { id: 'MB-002', place: 'Cloth market', amount: 6400, avg: 6100 },
      { id: 'MB-005', place: 'Sweet shop', amount: 4850, avg: 5200 },
      { id: 'MB-007', place: 'Shoe market', amount: null, avg: 4700 },
      { id: 'MB-010', place: 'Hardware store', amount: 5900, avg: 5600 },
      { id: 'MB-012', place: 'Tea stall', amount: 5000, avg: 5300 },
    ],
    deposits: [{ slip: 'SLIP-8755', date: '20 Oct 2026', account: 'Collection A/C', amount: 22150 }],
  },
];

export default function ReconciliationAgentModule() {
  const navigate = useNavigate();
  const location = useLocation();

  // Determine active view from URL or fallback
  const [activeView, setActiveView] = useState(() => {
    if (location.pathname.includes('/queue')) return 'queue';
    if (location.pathname.includes('/box-collections')) return 'box_collections';
    return 'overview';
  });

  // Keep state in sync with route navigation
  useEffect(() => {
    if (location.pathname.includes('/queue')) setActiveView('queue');
    else if (location.pathname.includes('/box-collections')) setActiveView('box_collections');
    else if (
      location.pathname.includes('/overview') ||
      location.pathname.endsWith('/reconciliation') ||
      location.pathname.endsWith('/reconciliation-agent')
    ) {
      setActiveView('overview');
    }
  }, [location.pathname]);

  // Queue state
  const [rows, setRows] = useState(INITIAL_ROWS);
  const [selectedRecordId, setSelectedRecordId] = useState(10);
  const [toastMessage, setToastMessage] = useState('');
  const [prevRowsState, setPrevRowsState] = useState(null);

  // Box collections state
  const [runs, setRuns] = useState(INITIAL_RUNS);
  const [selectedRunId, setSelectedRunId] = useState(3);
  const [boxToastMessage, setBoxToastMessage] = useState('');
  const [prevRunsState, setPrevRunsState] = useState(null);

  // Load live data from API if available (optional enhancement)
  useEffect(() => {
    const fetchLiveData = async () => {
      try {
        const res = await axiosInstance.get('/reconciliation-workbench/items', {
          params: { page: 1, limit: 30 },
        });
        if (res.data?.success && Array.isArray(res.data.data?.items) && res.data.data.items.length > 0) {
          const liveItems = res.data.data.items.map((item) => ({
            id: item.id,
            donor: item.donor_name || 'Anonymous Donor',
            amount: Number(item.amount) || 0,
            method: item.context_info || (item.type === 'offline' ? 'Offline' : item.type),
            project: item.raw_data?.project?.title || '',
            date: item.logged_at ? new Date(item.logged_at).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }) : 'Today',
            time: item.logged_at ? new Date(item.logged_at).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: true }) : '',
            age: item.age_days ?? 0,
            status: item.status === 'completed' ? 'completed' : item.status === 'rejected' ? 'rejected' : 'pending',
            dup: false,
            phone: item.donor_phone || '',
            ref: item.bank_reference || '',
            account: item.raw_data?.bank_name || '',
            enteredBy: item.created_by_name || '',
          }));
          setRows((prev) => {
            const existingIds = new Set(liveItems.map((x) => x.id));
            const retained = prev.filter((p) => !existingIds.has(p.id));
            return [...liveItems, ...retained];
          });
        }
      } catch {
        // Fall back gracefully to INITIAL_ROWS
      }
    };

    fetchLiveData();
  }, []);

  // Handlers for Queue
  const handleApproveRecord = useCallback((record) => {
    setPrevRowsState(rows);
    const updated = rows.map((r) =>
      r.id === record.id ? { ...r, status: 'completed' } : r,
    );
    setRows(updated);
    const nextPending = updated.filter((r) => r.status === 'pending').sort((a, b) => b.age - a.age)[0];
    if (nextPending) setSelectedRecordId(nextPending.id);
    setToastMessage(`Approved ${record.donor} · PKR ${record.amount.toLocaleString()} — moved to Completed.`);
  }, [rows]);

  const handleRejectRecord = useCallback((record, reason, note) => {
    setPrevRowsState(rows);
    const back = reason === 'mismatch' || reason === 'wrong_account';
    const newStatus = back ? 'discrepancy' : 'rejected';
    const updated = rows.map((r) =>
      r.id === record.id ? { ...r, status: newStatus, rejectReason: reason, rejectNote: note } : r,
    );
    setRows(updated);
    const nextPending = updated.filter((r) => r.status === 'pending').sort((a, b) => b.age - a.age)[0];
    if (nextPending) setSelectedRecordId(nextPending.id);
    setToastMessage(
      `${record.donor} · PKR ${record.amount.toLocaleString()} — ${
        back ? 'sent back to data entry.' : 'rejected.'
      }`,
    );
  }, [rows]);

  const handleUndoQueue = useCallback(() => {
    if (prevRowsState) {
      setRows(prevRowsState);
      setPrevRowsState(null);
      setToastMessage('');
    }
  }, [prevRowsState]);

  // Handlers for Box Collections
  const handleApproveRun = useCallback((run) => {
    setPrevRunsState(runs);
    const a = analyseRun(run);
    const updated = runs.map((r) => (r.id === run.id ? { ...r, status: 'approved' } : r));
    setRuns(updated);
    const nextPending = updated.filter((r) => r.status === 'pending')[0];
    if (nextPending) setSelectedRunId(nextPending.id);
    setBoxToastMessage(`${run.route} · PKR ${a.collected.toLocaleString()} — approved.`);
  }, [runs]);

  const handleFlagRun = useCallback((run, reason, escalateTo) => {
    setPrevRunsState(runs);
    const updated = runs.map((r) =>
      r.id === run.id ? { ...r, status: 'flagged', flagReason: reason, escalateTo } : r,
    );
    setRuns(updated);
    const nextPending = updated.filter((r) => r.status === 'pending')[0];
    if (nextPending) setSelectedRunId(nextPending.id);
    setBoxToastMessage(`${run.route} — flagged and escalated to ${escalateTo}.`);
  }, [runs]);

  const handleUndoBox = useCallback(() => {
    if (prevRunsState) {
      setRuns(prevRunsState);
      setPrevRunsState(null);
      setBoxToastMessage('');
    }
  }, [prevRunsState]);

  const pendingQueueCount = useMemo(
    () => rows.filter((r) => r.status === 'pending').length,
    [rows],
  );
  const pendingBoxCount = useMemo(
    () => runs.filter((r) => r.status === 'pending').length,
    [runs],
  );

  const switchView = (view) => {
    setActiveView(view);
    if (view === 'overview') navigate('/dms/reconciliation/overview');
    else if (view === 'queue') navigate('/dms/reconciliation/queue');
    else if (view === 'box_collections') navigate('/dms/reconciliation/box-collections');
  };

  return (
    <>
      <Navbar />

      <div className="ra-container">
        {/* Module Header with Top Horizontal Navigation (No duplicate inner sidebar) */}
        <header className="ra-topbar">
          <div className="ra-brand-cluster">
            <span className="ra-brand-title">MTJF Solutions</span>
            <span className="ra-brand-badge">Reconciliation</span>
          </div>

          {/* Top Horizontal Navigation Tabs */}
          <div className="ra-top-tabs">
            <button
              type="button"
              className={`ra-top-tab ${activeView === 'overview' ? 'active' : ''}`}
              onClick={() => switchView('overview')}
            >
              <FiGrid size={15} />
              <span>Overview</span>
            </button>

            <button
              type="button"
              className={`ra-top-tab ${activeView === 'queue' ? 'active' : ''}`}
              onClick={() => switchView('queue')}
            >
              <FiList size={15} />
              <span>Queue</span>
              <span className="ra-top-tab-badge amber">{pendingQueueCount}</span>
            </button>

            <button
              type="button"
              className={`ra-top-tab ${activeView === 'box_collections' ? 'active' : ''}`}
              onClick={() => switchView('box_collections')}
            >
              <FiBox size={15} />
              <span>Box collections</span>
              <span className="ra-top-tab-badge red">{pendingBoxCount}</span>
            </button>

            <button
              type="button"
              className="ra-top-tab"
              onClick={() => navigate('/dms/reconciliation/list')}
            >
              <FiFileText size={15} />
              <span>Bank statements</span>
            </button>

            <button
              type="button"
              className="ra-top-tab"
              onClick={() => navigate('/dms/reconciliation-workbench')}
            >
              <FiSliders size={15} />
              <span>Workbench</span>
            </button>
          </div>

          <div className="ra-topbar-actions">
            <button
              type="button"
              className="ra-icon-btn"
              aria-label="Notifications"
              title="Notifications"
            >
              <FiBell size={17} />
            </button>
            <select className="ra-dept-select" defaultValue="Accounts Dept">
              <option value="Accounts Dept">Accounts Dept ▾</option>
              <option value="Fundraising Dept">Fundraising Dept</option>
              <option value="Audit Dept">Audit &amp; Finance Dept</option>
            </select>
          </div>
        </header>

        {/* Full-width Main Body (No inner sidebar) */}
        <div className="ra-body">
          <main className="ra-main">
            {activeView === 'overview' && (
              <ReconciliationOverview
                rows={rows}
                onOpenQueue={() => switchView('queue')}
                onReviewRecord={(id) => {
                  setSelectedRecordId(id);
                  switchView('queue');
                }}
                onUploadStatement={() => navigate('/dms/reconciliation/add')}
              />
            )}

            {activeView === 'queue' && (
              <ReconciliationQueue
                rows={rows}
                selectedId={selectedRecordId}
                onSelectRecord={setSelectedRecordId}
                onApprove={handleApproveRecord}
                onReject={handleRejectRecord}
                onUndo={handleUndoQueue}
                toast={toastMessage}
                hasUndo={Boolean(prevRowsState)}
                onUploadStatement={() => navigate('/dms/reconciliation/add')}
              />
            )}

            {activeView === 'box_collections' && (
              <ReconciliationBoxCollections
                runs={runs}
                selectedId={selectedRunId}
                onSelectRun={setSelectedRunId}
                onApproveRun={handleApproveRun}
                onFlagRun={handleFlagRun}
                onUndo={handleUndoBox}
                toast={boxToastMessage}
                hasUndo={Boolean(prevRunsState)}
                onUploadStatement={() => navigate('/dms/reconciliation/add')}
              />
            )}
          </main>
        </div>
      </div>
    </>
  );
}
