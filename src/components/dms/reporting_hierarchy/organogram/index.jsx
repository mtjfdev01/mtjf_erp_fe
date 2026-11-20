import React, { useCallback, useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { FiUser } from 'react-icons/fi';
import { toast } from 'react-toastify';
import axiosInstance from '../../../../utils/axios';
import '../../../../styles/variables.css';
import '../../../../styles/components.css';
import Navbar from '../../../Navbar';
import PageHeader from '../../../common/PageHeader';
import ReportingHierarchyTabs from '../ReportingHierarchyTabs';
import '../reportingHierarchy.css';

const DEPARTMENTS = [
  '',
  'store',
  'procurement',
  'accounts_and_finance',
  'program',
  'admin',
  'fund_raising',
  'hr',
  'it',
  'geographic',
  'tasking',
  'ceo',
];

const levelClass = (level) => {
  const n = Number(level) || 0;
  if (n === 0) return 'rh-org-node--l0';
  if (n === 1) return 'rh-org-node--l1';
  if (n === 2) return 'rh-org-node--l2';
  return 'rh-org-node--l3';
};

const OrgNode = ({ node, onOpen }) => {
  if (!node) return null;
  const children = Array.isArray(node.children) ? node.children : [];

  return (
    <li className="rh-org-branch">
      <button
        type="button"
        className={`rh-org-node ${levelClass(node.level)}`}
        onClick={() => onOpen(node.id)}
        title={`Open ${node.display_name}`}
      >
        <span className="rh-org-node__avatar" aria-hidden="true">
          <FiUser />
        </span>
        <span className="rh-org-node__name">{node.display_name}</span>
        <span className="rh-org-node__role">
          {node.role || node.department || 'Employee'}
        </span>
      </button>
      {children.length > 0 ? (
        <ul className="rh-org-children">
          {children.map((child) => (
            <OrgNode key={child.id} node={child} onOpen={onOpen} />
          ))}
        </ul>
      ) : null}
    </li>
  );
};

const EmployeeOrganogram = () => {
  const navigate = useNavigate();
  const [trees, setTrees] = useState([]);
  const [loading, setLoading] = useState(true);
  const [department, setDepartment] = useState('');
  const [mode, setMode] = useState('primary');
  const [meta, setMeta] = useState({ edge_count: 0, tree_count: 0 });

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await axiosInstance.get('/reporting-hierarchy/organogram', {
        params: {
          department: department || undefined,
          mode,
        },
      });
      const data = res.data?.data;
      setTrees(Array.isArray(data?.trees) ? data.trees : []);
      setMeta({
        edge_count: data?.edge_count || 0,
        tree_count: data?.tree_count || 0,
      });
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to load organogram');
      setTrees([]);
    } finally {
      setLoading(false);
    }
  }, [department, mode]);

  useEffect(() => {
    load();
  }, [load]);

  return (
    <>
      <Navbar />
      <div className="rh-page">
        <PageHeader
          title="Reporting Hierarchy"
          backPath="/admin/users"
          breadcrumbs={[
            { label: 'DMS Menu', path: '/admin' },
            { label: 'Reporting Hierarchy', path: '/dms/reporting-hierarchy' },
            { label: 'Employee Organogram' },
          ]}
        />

        <ReportingHierarchyTabs />

        <div className="rh-org-toolbar">
          <div className="rh-org-title-wrap">
            <h2 className="rh-org-heading">Organogram</h2>
            <p className="rh-muted">
              {meta.tree_count} tree(s) · {meta.edge_count} reporting link(s)
            </p>
          </div>
          <div className="rh-filters rh-filters--org">
            <select
              className="form-input"
              value={department}
              onChange={(e) => setDepartment(e.target.value)}
            >
              <option value="">All departments</option>
              {DEPARTMENTS.filter(Boolean).map((d) => (
                <option key={d} value={d}>
                  {d}
                </option>
              ))}
            </select>
            <select
              className="form-input"
              value={mode}
              onChange={(e) => setMode(e.target.value)}
            >
              <option value="primary">Primary reports only</option>
              <option value="all">Primary + secondary</option>
            </select>
          </div>
        </div>

        {loading ? (
          <div className="rh-loading">Loading organogram…</div>
        ) : trees.length === 0 ? (
          <div className="rh-empty">
            <p>
              No reporting trees yet. Assign primary managers under the People
              tab, then return here.
            </p>
          </div>
        ) : (
          <div className="rh-org-canvas">
            {trees.map((tree) => (
              <ul key={tree.id} className="rh-org-forest">
                <OrgNode
                  node={tree}
                  onOpen={(id) =>
                    navigate(`/dms/reporting-hierarchy/people/${id}`)
                  }
                />
              </ul>
            ))}
          </div>
        )}
      </div>
    </>
  );
};

export default EmployeeOrganogram;
