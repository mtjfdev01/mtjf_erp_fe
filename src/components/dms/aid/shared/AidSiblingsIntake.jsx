import React from 'react';
import FormInput from '../../../common/FormInput';
import FormSelect from '../../../common/FormSelect';
import AidLiteracyFields from './AidLiteracyFields';
import {
  AID_GENDERS,
  AID_MARITAL_STATUS,
  AID_SIBLING_RELATIONS,
  AID_YES_NO,
  ageFromDob,
  emptySiblingRow,
} from '../aidConstants';

/**
 * Single → No. of siblings → Brothers / Sisters rows
 * Name, Gender, DoB, Age, CNIC, Disability, Status, Relation with Beneficiary
 */
const AidSiblingsIntake = ({ siblingRows, onChange, title = 'Siblings' }) => {
  const count = siblingRows?.length || 0;

  const setCount = (n) => {
    const next = Math.max(0, Math.min(20, Number(n) || 0));
    const rows = [...(siblingRows || [])];
    while (rows.length < next) rows.push(emptySiblingRow());
    while (rows.length > next) rows.pop();
    onChange(rows);
  };

  const updateRow = (idx, partial) => {
    onChange(
      (siblingRows || []).map((row, i) => {
        if (i !== idx) return row;
        const next = { ...row, ...partial };
        if (partial.relation_with_beneficiary) {
          const rel = partial.relation_with_beneficiary;
          if (rel.includes('sister') && !next.gender) next.gender = 'female';
          if (rel.includes('brother') && !next.gender) next.gender = 'male';
        }
        return next;
      }),
    );
  };

  return (
    <div className="aid-children-intake">
      <div className="aid-children-intake__head">
        <h4 className="aid-family-panel__title">{title}</h4>
        <FormInput
          label="No. of siblings"
          type="number"
          min="0"
          max="20"
          value={String(count)}
          onChange={(e) => setCount(e.target.value)}
        />
      </div>

      {count === 0 ? (
        <p className="aid-empty-note">
          If single, enter number of brothers/sisters (leave 0 if none).
        </p>
      ) : (
        <div className="aid-children-list">
          {(siblingRows || []).map((sib, idx) => (
            <div key={`sib-${idx}`} className="aid-child-card">
              <div className="aid-child-card__title">Sibling {idx + 1}</div>
              <div className="form-grid-2">
                <FormInput
                  label="Name"
                  value={sib.full_name}
                  onChange={(e) => updateRow(idx, { full_name: e.target.value })}
                  required
                />
                <FormSelect
                  label="Gender"
                  value={sib.gender}
                  onChange={(e) => updateRow(idx, { gender: e.target.value })}
                  options={[{ value: '', label: '—' }, ...AID_GENDERS]}
                />
                <FormInput
                  label="DoB"
                  type="date"
                  value={sib.date_of_birth}
                  onChange={(e) =>
                    updateRow(idx, { date_of_birth: e.target.value })
                  }
                />
                <FormInput
                  label="Age"
                  value={ageFromDob(sib.date_of_birth)}
                  readOnly
                  placeholder="From DoB"
                />
                <FormInput
                  label="CNIC"
                  value={sib.cnic}
                  onChange={(e) => updateRow(idx, { cnic: e.target.value })}
                />
                <FormSelect
                  label="Disability"
                  value={sib.has_disability ? 'yes' : 'no'}
                  onChange={(e) =>
                    updateRow(idx, {
                      has_disability: e.target.value === 'yes',
                      disability_type:
                        e.target.value === 'yes' ? sib.disability_type : '',
                    })
                  }
                  options={AID_YES_NO}
                />
                {sib.has_disability && (
                  <FormInput
                    label="Type of disability"
                    value={sib.disability_type || ''}
                    onChange={(e) =>
                      updateRow(idx, { disability_type: e.target.value })
                    }
                  />
                )}
                <FormSelect
                  label="Status (marital)"
                  value={sib.marital_status}
                  onChange={(e) =>
                    updateRow(idx, { marital_status: e.target.value })
                  }
                  options={[{ value: '', label: '—' }, ...AID_MARITAL_STATUS]}
                />
                <FormSelect
                  label="Relation with beneficiary"
                  value={sib.relation_with_beneficiary || 'brother'}
                  onChange={(e) =>
                    updateRow(idx, {
                      relation_with_beneficiary: e.target.value,
                    })
                  }
                  options={AID_SIBLING_RELATIONS}
                  required
                />
              </div>
              <AidLiteracyFields
                value={sib}
                onChange={(next) => updateRow(idx, next)}
              />
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default AidSiblingsIntake;
