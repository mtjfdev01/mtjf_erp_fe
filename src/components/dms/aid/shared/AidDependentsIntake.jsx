import React from 'react';
import FormInput from '../../../common/FormInput';
import FormSelect from '../../../common/FormSelect';
import AidLiteracyFields from './AidLiteracyFields';
import {
  AID_DEPENDENT_RELATIONS,
  AID_GENDERS,
  AID_MARITAL_STATUS,
  AID_YES_NO,
  ageFromDob,
  emptyDependentRow,
} from '../aidConstants';

/**
 * "Others under sponsorship / dependents?" Yes/No → rows:
 * Name, Gender, DoB, Age, CNIC, Disability, Type, Marital Status, Literacy, Relation with FAMILY HEAD
 */
const AidDependentsIntake = ({
  hasDependents,
  onHasDependentsChange,
  rows,
  onChange,
  title = 'Others under sponsorship / dependents',
  relationLabel = 'Relation with FAMILY HEAD',
}) => {
  const count = rows?.length || 0;

  const setCount = (n) => {
    const next = Math.max(0, Math.min(20, Number(n) || 0));
    const list = [...(rows || [])];
    while (list.length < next) list.push(emptyDependentRow());
    while (list.length > next) list.pop();
    onChange(list);
  };

  const updateRow = (idx, partial) => {
    onChange(
      (rows || []).map((row, i) => (i === idx ? { ...row, ...partial } : row)),
    );
  };

  return (
    <div className="aid-dependents-intake">
      <h4 className="aid-family-panel__title">{title}</h4>
      <FormSelect
        label="If some other under your sponsorship / dependents"
        value={hasDependents ? 'yes' : 'no'}
        onChange={(e) => {
          const yes = e.target.value === 'yes';
          onHasDependentsChange(yes);
          if (!yes) onChange([]);
          else if (!(rows || []).length) onChange([emptyDependentRow()]);
        }}
        options={AID_YES_NO}
      />

      {hasDependents && (
        <>
          <div className="aid-children-intake__head" style={{ marginTop: 12 }}>
            <span className="aid-section-hint" style={{ margin: 0 }}>
              Add each dependent under sponsorship
            </span>
            <FormInput
              label="No. of dependents"
              type="number"
              min="1"
              max="20"
              value={String(Math.max(1, count))}
              onChange={(e) => setCount(e.target.value)}
            />
          </div>
          <div className="aid-children-list">
            {(rows || []).map((dep, idx) => (
              <div key={`dep-${idx}`} className="aid-child-card">
                <div className="aid-child-card__title">Dependent {idx + 1}</div>
                <div className="form-grid-2">
                  <FormInput
                    label="Name"
                    value={dep.full_name}
                    onChange={(e) => updateRow(idx, { full_name: e.target.value })}
                    required
                  />
                  <FormSelect
                    label="Gender"
                    value={dep.gender}
                    onChange={(e) => updateRow(idx, { gender: e.target.value })}
                    options={[{ value: '', label: '—' }, ...AID_GENDERS]}
                  />
                  <FormInput
                    label="DoB"
                    type="date"
                    value={dep.date_of_birth}
                    onChange={(e) =>
                      updateRow(idx, { date_of_birth: e.target.value })
                    }
                  />
                  <FormInput
                    label="Age"
                    value={ageFromDob(dep.date_of_birth)}
                    readOnly
                    placeholder="From DoB"
                  />
                  <FormInput
                    label="CNIC"
                    value={dep.cnic}
                    onChange={(e) => updateRow(idx, { cnic: e.target.value })}
                  />
                  <FormSelect
                    label="Disability"
                    value={dep.has_disability ? 'yes' : 'no'}
                    onChange={(e) =>
                      updateRow(idx, {
                        has_disability: e.target.value === 'yes',
                        disability_type:
                          e.target.value === 'yes' ? dep.disability_type : '',
                      })
                    }
                    options={AID_YES_NO}
                  />
                  {dep.has_disability && (
                    <FormInput
                      label="Type of disability"
                      value={dep.disability_type || ''}
                      onChange={(e) =>
                        updateRow(idx, { disability_type: e.target.value })
                      }
                    />
                  )}
                  <FormSelect
                    label="Marital status"
                    value={dep.marital_status}
                    onChange={(e) =>
                      updateRow(idx, { marital_status: e.target.value })
                    }
                    options={[{ value: '', label: '—' }, ...AID_MARITAL_STATUS]}
                  />
                  <FormSelect
                    label={relationLabel}
                    value={dep.relation_with_family_head || 'other'}
                    onChange={(e) =>
                      updateRow(idx, {
                        relation_with_family_head: e.target.value,
                      })
                    }
                    options={AID_DEPENDENT_RELATIONS}
                  />
                </div>
                <AidLiteracyFields
                  value={dep}
                  onChange={(next) => updateRow(idx, next)}
                />
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  );
};

export default AidDependentsIntake;
