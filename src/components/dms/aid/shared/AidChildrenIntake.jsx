import React, { useEffect } from 'react';
import FormInput from '../../../common/FormInput';
import FormSelect from '../../../common/FormSelect';
import AidLiteracyFields from './AidLiteracyFields';
import {
  AID_GENDERS,
  AID_MARITAL_STATUS,
  AID_YES_NO,
  ageFromDob,
  emptyChildRow,
} from '../aidConstants';

/**
 * Married → No. of children → per-child rows
 * (Name, Gender, DoB, Age, CNIC, Disability, Status, Literacy hierarchy)
 */
const AidChildrenIntake = ({ childrenRows, onChange, title = 'Children' }) => {
  const count = childrenRows?.length || 0;

  const setCount = (n) => {
    const next = Math.max(0, Math.min(20, Number(n) || 0));
    const rows = [...(childrenRows || [])];
    while (rows.length < next) rows.push(emptyChildRow());
    while (rows.length > next) rows.pop();
    onChange(rows);
  };

  const updateRow = (idx, partial) => {
    onChange(
      (childrenRows || []).map((row, i) =>
        i === idx ? { ...row, ...partial } : row,
      ),
    );
  };

  useEffect(() => {
    // keep controlled
  }, [count]);

  return (
    <div className="aid-children-intake">
      <div className="aid-children-intake__head">
        <h4 className="aid-family-panel__title">{title}</h4>
        <FormInput
          label="No. of children"
          type="number"
          min="0"
          max="20"
          value={String(count)}
          onChange={(e) => setCount(e.target.value)}
        />
      </div>

      {count === 0 ? (
        <p className="aid-empty-note">
          Enter number of children to add their details (if none, leave 0).
        </p>
      ) : (
        <div className="aid-children-list">
          {(childrenRows || []).map((child, idx) => (
            <div key={`child-${idx}`} className="aid-child-card">
              <div className="aid-child-card__title">Child {idx + 1}</div>
              <div className="form-grid-2">
                <FormInput
                  label="Name"
                  value={child.full_name}
                  onChange={(e) => updateRow(idx, { full_name: e.target.value })}
                  required
                />
                <FormSelect
                  label="Gender"
                  value={child.gender}
                  onChange={(e) => updateRow(idx, { gender: e.target.value })}
                  options={[{ value: '', label: '—' }, ...AID_GENDERS]}
                />
                <FormInput
                  label="DoB"
                  type="date"
                  value={child.date_of_birth}
                  onChange={(e) =>
                    updateRow(idx, { date_of_birth: e.target.value })
                  }
                />
                <FormInput
                  label="Age"
                  value={ageFromDob(child.date_of_birth)}
                  readOnly
                  placeholder="From DoB"
                />
                <FormInput
                  label="CNIC"
                  value={child.cnic}
                  onChange={(e) => updateRow(idx, { cnic: e.target.value })}
                />
                <FormSelect
                  label="Disability"
                  value={child.has_disability ? 'yes' : 'no'}
                  onChange={(e) =>
                    updateRow(idx, {
                      has_disability: e.target.value === 'yes',
                      disability_type:
                        e.target.value === 'yes' ? child.disability_type : '',
                    })
                  }
                  options={AID_YES_NO}
                />
                {child.has_disability && (
                  <FormInput
                    label="Type of disability"
                    value={child.disability_type || ''}
                    onChange={(e) =>
                      updateRow(idx, { disability_type: e.target.value })
                    }
                  />
                )}
                <FormSelect
                  label="Status (marital)"
                  value={child.marital_status}
                  onChange={(e) =>
                    updateRow(idx, { marital_status: e.target.value })
                  }
                  options={[{ value: '', label: '—' }, ...AID_MARITAL_STATUS]}
                />
              </div>
              <AidLiteracyFields
                value={child}
                onChange={(next) => updateRow(idx, next)}
              />
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default AidChildrenIntake;
