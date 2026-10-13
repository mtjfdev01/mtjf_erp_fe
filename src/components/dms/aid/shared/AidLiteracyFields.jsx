import React from 'react';
import FormInput from '../../../common/FormInput';
import FormSelect from '../../../common/FormSelect';
import {
  AID_LITERACY_STATUS,
  literacyCategoriesFor,
} from '../aidConstants';

/**
 * Literacy hierarchy:
 * Educated → Student (class fields) | Job (income) | Self Employed | Business | Others
 * UnEducated → Skilled Laborer (income) | Laborer | Self Employed | Others
 */
const AidLiteracyFields = ({ value, onChange, showIncomeAlways = false }) => {
  const status = value?.literacy_status || '';
  const category = value?.literacy_category || '';
  const categories = literacyCategoriesFor(status);
  const needsIncome =
    showIncomeAlways ||
    category === 'job' ||
    category === 'skilled_laborer';
  const needsStudent = status === 'educated' && category === 'student';

  const patch = (partial) => onChange({ ...value, ...partial });

  return (
    <div className="aid-literacy-fields">
      <div className="form-grid-2">
        <FormSelect
          label="Literacy"
          value={status}
          onChange={(e) =>
            patch({
              literacy_status: e.target.value,
              literacy_category: '',
              student_class: '',
              student_class_type: '',
              student_class_name: '',
            })
          }
          options={[{ value: '', label: '—' }, ...AID_LITERACY_STATUS]}
        />
        <FormSelect
          label="Status / category"
          value={category}
          onChange={(e) =>
            patch({
              literacy_category: e.target.value,
              ...(e.target.value !== 'student'
                ? {
                    student_class: '',
                    student_class_type: '',
                    student_class_name: '',
                  }
                : {}),
            })
          }
          options={[{ value: '', label: '—' }, ...categories]}
          disabled={!status}
        />
      </div>

      {needsStudent && (
        <div className="form-grid-2 aid-literacy-student">
          <FormInput
            label="Class"
            value={value.student_class || ''}
            onChange={(e) => patch({ student_class: e.target.value })}
            placeholder="e.g. 8th, Intermediate"
          />
          <FormInput
            label="Type of class"
            value={value.student_class_type || ''}
            onChange={(e) => patch({ student_class_type: e.target.value })}
            placeholder="e.g. Science, Arts"
          />
          <div className="aid-span-2">
            <FormInput
              label="Class name (editable)"
              value={value.student_class_name || ''}
              onChange={(e) => patch({ student_class_name: e.target.value })}
              placeholder="School / institute / class name"
            />
          </div>
        </div>
      )}

      {needsIncome && (
        <div className="form-grid-2">
          <FormInput
            label="Monthly income (PKR)"
            value={value.monthly_income || ''}
            onChange={(e) => patch({ monthly_income: e.target.value })}
            placeholder="Optional"
          />
        </div>
      )}
    </div>
  );
};

export default AidLiteracyFields;
