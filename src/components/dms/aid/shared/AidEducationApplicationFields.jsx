import React, { useState } from 'react';
import axiosInstance from '../../../../utils/axios';
import FormInput from '../../../common/FormInput';
import FormSelect from '../../../common/FormSelect';
import FormTextarea from '../../../common/FormTextarea';
import {
  AID_EDUCATION_HISTORY_CLASSES,
  AID_SCHOLARSHIP_CLASS_MODES,
  AID_SCHOLARSHIP_DEGREES,
  calcEducationPercentage,
  emptyEducationHistoryRow,
  emptyScholarshipRow,
} from '../aidConstants';
import { useAidLang } from '../lang/AidLangContext';

const labelOf = (options, value, fallbackDash = '—') =>
  options.find((o) => o.value === value)?.label || value || fallbackDash;

/**
 * Education aid type — Application tab special structure:
 * Education History + Scholarship applied for + income questions
 */
const AidEducationApplicationFields = ({
  value,
  onChange,
  readOnly = false,
}) => {
  const { t } = useAidLang();
  const dash = t('dash');
  const details = value || {};
  const history = details.education_history?.length
    ? details.education_history
    : readOnly
      ? []
      : [emptyEducationHistoryRow()];
  const scholarships = details.scholarships?.length
    ? details.scholarships
    : readOnly
      ? []
      : [emptyScholarshipRow()];
  const [uploadError, setUploadError] = useState('');
  const [uploadingIdx, setUploadingIdx] = useState(null);

  const patch = (partial) => {
    if (readOnly || !onChange) return;
    onChange({ ...details, ...partial });
  };

  const updateHistory = (idx, partial) => {
    const next = history.map((row, i) => {
      if (i !== idx) return row;
      const merged = { ...row, ...partial };
      if (
        partial.marks_obtained !== undefined ||
        partial.total_marks !== undefined
      ) {
        merged.percentage = calcEducationPercentage(
          merged.marks_obtained,
          merged.total_marks,
        );
      }
      return merged;
    });
    patch({ education_history: next });
  };

  const updateScholarship = (idx, partial) => {
    patch({
      scholarships: scholarships.map((row, i) =>
        i === idx ? { ...row, ...partial } : row,
      ),
    });
  };

  const uploadDegree = async (idx, file) => {
    if (!file) return;
    const ok =
      ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'].includes(
        String(file.type || '').toLowerCase(),
      ) || /\.(jpe?g|png|webp)$/i.test(file.name || '');
    if (!ok) {
      setUploadError(t('imageTypesError'));
      return;
    }
    setUploadingIdx(idx);
    setUploadError('');
    try {
      const fd = new FormData();
      fd.append('file', file);
      fd.append('context', 'education');
      const res = await axiosInstance.post(
        '/aid/applications/documents/upload',
        fd,
        { headers: { 'Content-Type': 'multipart/form-data' } },
      );
      const data = res.data?.data || {};
      updateHistory(idx, {
        attachment_url: data.url || '',
        attachment_name: data.file_name || file.name,
      });
    } catch (err) {
      setUploadError(
        err.response?.data?.message || err.message || t('uploadFailed'),
      );
    } finally {
      setUploadingIdx(null);
    }
  };

  if (readOnly) {
    const hasHistory = history.some(
      (r) =>
        r.class_level ||
        r.board_institute ||
        r.year ||
        r.marks_obtained ||
        r.attachment_url,
    );
    const hasScholarships = scholarships.some(
      (r) => r.current_degree || r.institute_name || r.city || r.annual_fee,
    );
    if (
      !hasHistory &&
      !hasScholarships &&
      !details.income_source_before &&
      !details.continue_education_if_not_approved
    ) {
      return null;
    }
    return (
      <div className="aid-education-application" style={{ marginTop: 12 }}>
        {hasHistory && (
          <div className="aid-family-panel">
            <h4 className="aid-family-panel__title">{t('educationHistory')}</h4>
            <div className="aid-children-list">
              {history.map((row, idx) => (
                <div key={`edu-hist-ro-${idx}`} className="aid-child-card">
                  <div className="aid-child-card__title">
                    {t('recordN', { n: idx + 1 })}
                  </div>
                  <p style={{ fontSize: 13, color: '#64748b', margin: '4px 0 0' }}>
                    {[
                      labelOf(AID_EDUCATION_HISTORY_CLASSES, row.class_level, dash),
                      row.board_institute,
                      row.year,
                      row.marks_obtained != null && row.total_marks
                        ? `${row.marks_obtained}/${row.total_marks}`
                        : null,
                      row.percentage ? `${row.percentage}%` : null,
                    ]
                      .filter(Boolean)
                      .join(' · ') || dash}
                  </p>
                  {row.attachment_url && (
                    <p style={{ fontSize: 13, marginTop: 4 }}>
                      <a
                        href={row.attachment_url}
                        target="_blank"
                        rel="noreferrer"
                      >
                        {row.attachment_name || t('viewDegree')}
                      </a>
                    </p>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}
        {hasScholarships && (
          <div className="aid-family-panel" style={{ marginTop: 12 }}>
            <h4 className="aid-family-panel__title">{t('scholarshipApplied')}</h4>
            <div className="aid-children-list">
              {scholarships.map((row, idx) => (
                <div key={`sch-ro-${idx}`} className="aid-child-card">
                  <div className="aid-child-card__title">
                    {t('scholarshipN', { n: idx + 1 })}
                  </div>
                  <p style={{ fontSize: 13, color: '#64748b', margin: '4px 0 0' }}>
                    {[
                      labelOf(AID_SCHOLARSHIP_DEGREES, row.current_degree, dash),
                      row.institute_name,
                      row.city,
                      row.annual_fee != null && row.annual_fee !== ''
                        ? t('feeLabel', { n: row.annual_fee })
                        : null,
                      row.start_date || row.end_date
                        ? `${row.start_date || dash} → ${row.end_date || dash}`
                        : null,
                      row.total_years
                        ? `${row.total_years} ${t('yrShort')}`
                        : null,
                      labelOf(AID_SCHOLARSHIP_CLASS_MODES, row.class_mode, dash),
                    ]
                      .filter((x) => x && x !== dash)
                      .join(' · ') || dash}
                  </p>
                </div>
              ))}
            </div>
          </div>
        )}
        {(details.income_source_before ||
          details.continue_education_if_not_approved) && (
          <div className="aid-family-panel" style={{ marginTop: 12 }}>
            {details.income_source_before && (
              <p style={{ fontSize: 13, margin: '0 0 8px' }}>
                <strong>{t('incomeSourceBeforeRo')}</strong>{' '}
                {details.income_source_before}
              </p>
            )}
            {details.continue_education_if_not_approved && (
              <p style={{ fontSize: 13, margin: 0 }}>
                <strong>{t('continueEducationIfNotRo')}</strong>{' '}
                {details.continue_education_if_not_approved}
              </p>
            )}
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="aid-education-application">
      <div className="aid-family-panel" style={{ marginTop: 12 }}>
        <div className="aid-family-panel__head">
          <h4 className="aid-family-panel__title">{t('educationHistory')}</h4>
          <button
            type="button"
            className="aid-mini-btn aid-mini-btn--add"
            onClick={() =>
              patch({
                education_history: [...history, emptyEducationHistoryRow()],
              })
            }
          >
            {t('addRow')}
          </button>
        </div>
        {uploadError && (
          <p style={{ color: '#b91c1c', fontSize: 13 }}>{uploadError}</p>
        )}
        <div className="aid-children-list">
          {history.map((row, idx) => (
            <div key={`edu-hist-${idx}`} className="aid-child-card">
              <div className="aid-repeat-item__head">
                <div className="aid-child-card__title">
                  {t('recordN', { n: idx + 1 })}
                </div>
                {history.length > 1 && (
                  <button
                    type="button"
                    className="aid-mini-btn aid-mini-btn--remove"
                    onClick={() =>
                      patch({
                        education_history: history.filter((_, i) => i !== idx),
                      })
                    }
                  >
                    {t('remove')}
                  </button>
                )}
              </div>
              <div className="form-grid-2">
                <FormSelect
                  label={t('classLabel')}
                  value={row.class_level || ''}
                  onChange={(e) =>
                    updateHistory(idx, { class_level: e.target.value })
                  }
                  options={[
                    { value: '', label: dash },
                    ...AID_EDUCATION_HISTORY_CLASSES,
                  ]}
                />
                <FormInput
                  label={t('boardInstitute')}
                  value={row.board_institute || ''}
                  onChange={(e) =>
                    updateHistory(idx, { board_institute: e.target.value })
                  }
                />
                <FormInput
                  label={t('year')}
                  value={row.year || ''}
                  onChange={(e) => updateHistory(idx, { year: e.target.value })}
                  placeholder={t('yearPlaceholder')}
                />
                <FormInput
                  label={t('markObtained')}
                  type="number"
                  min="0"
                  value={row.marks_obtained ?? ''}
                  onChange={(e) =>
                    updateHistory(idx, { marks_obtained: e.target.value })
                  }
                />
                <FormInput
                  label={t('totalMark')}
                  type="number"
                  min="0"
                  value={row.total_marks ?? ''}
                  onChange={(e) =>
                    updateHistory(idx, { total_marks: e.target.value })
                  }
                />
                <FormInput
                  label={t('percentage')}
                  value={row.percentage ?? ''}
                  readOnly
                  placeholder={t('auto')}
                />
              </div>
              <label className="aid-file-label" style={{ marginTop: 8 }}>
                {t('attachmentsDegree')}
                <input
                  type="file"
                  accept=".jpg,.jpeg,.png,.webp,image/jpeg,image/png,image/webp"
                  disabled={uploadingIdx === idx}
                  onChange={(e) => {
                    const f = e.target.files?.[0];
                    if (f) uploadDegree(idx, f);
                    e.target.value = '';
                  }}
                />
              </label>
              {uploadingIdx === idx && (
                <p className="aid-section-hint">{t('uploading')}</p>
              )}
              {row.attachment_url && (
                <p style={{ fontSize: 13, marginTop: 6 }}>
                  <a href={row.attachment_url} target="_blank" rel="noreferrer">
                    {row.attachment_name || t('viewDegree')}
                  </a>
                  <button
                    type="button"
                    className="aid-mini-btn aid-mini-btn--remove"
                    style={{ marginLeft: 8 }}
                    onClick={() =>
                      updateHistory(idx, {
                        attachment_url: '',
                        attachment_name: '',
                      })
                    }
                  >
                    {t('remove')}
                  </button>
                </p>
              )}
            </div>
          ))}
        </div>
      </div>

      <div className="aid-family-panel" style={{ marginTop: 12 }}>
        <div className="aid-family-panel__head">
          <h4 className="aid-family-panel__title">{t('scholarshipApplied')}</h4>
          <button
            type="button"
            className="aid-mini-btn aid-mini-btn--add"
            onClick={() =>
              patch({
                scholarships: [...scholarships, emptyScholarshipRow()],
              })
            }
          >
            {t('addRow')}
          </button>
        </div>
        <div className="aid-children-list">
          {scholarships.map((row, idx) => (
            <div key={`sch-${idx}`} className="aid-child-card">
              <div className="aid-repeat-item__head">
                <div className="aid-child-card__title">
                  {t('scholarshipN', { n: idx + 1 })}
                </div>
                {scholarships.length > 1 && (
                  <button
                    type="button"
                    className="aid-mini-btn aid-mini-btn--remove"
                    onClick={() =>
                      patch({
                        scholarships: scholarships.filter((_, i) => i !== idx),
                      })
                    }
                  >
                    {t('remove')}
                  </button>
                )}
              </div>
              <div className="form-grid-2">
                <FormSelect
                  label={t('currentDegree')}
                  value={row.current_degree || ''}
                  onChange={(e) =>
                    updateScholarship(idx, { current_degree: e.target.value })
                  }
                  options={[
                    { value: '', label: dash },
                    ...AID_SCHOLARSHIP_DEGREES,
                  ]}
                />
                <FormInput
                  label={t('instituteName')}
                  value={row.institute_name || ''}
                  onChange={(e) =>
                    updateScholarship(idx, { institute_name: e.target.value })
                  }
                />
                <FormInput
                  label={t('city')}
                  value={row.city || ''}
                  onChange={(e) =>
                    updateScholarship(idx, { city: e.target.value })
                  }
                />
                <FormInput
                  label={t('annualFee')}
                  type="number"
                  min="0"
                  value={row.annual_fee ?? ''}
                  onChange={(e) =>
                    updateScholarship(idx, { annual_fee: e.target.value })
                  }
                />
                <FormInput
                  label={t('startingDate')}
                  type="date"
                  value={row.start_date || ''}
                  onChange={(e) =>
                    updateScholarship(idx, { start_date: e.target.value })
                  }
                />
                <FormInput
                  label={t('endDate')}
                  type="date"
                  value={row.end_date || ''}
                  onChange={(e) =>
                    updateScholarship(idx, { end_date: e.target.value })
                  }
                />
                <FormInput
                  label={t('totalYears')}
                  type="number"
                  min="0"
                  step="0.5"
                  value={row.total_years ?? ''}
                  onChange={(e) =>
                    updateScholarship(idx, { total_years: e.target.value })
                  }
                />
                <FormSelect
                  label={t('classLabel')}
                  value={row.class_mode || ''}
                  onChange={(e) =>
                    updateScholarship(idx, { class_mode: e.target.value })
                  }
                  options={[
                    { value: '', label: dash },
                    ...AID_SCHOLARSHIP_CLASS_MODES,
                  ]}
                />
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="aid-family-panel" style={{ marginTop: 12 }}>
        <FormTextarea
          label={t('incomeSourceBefore')}
          value={details.income_source_before || ''}
          onChange={(e) => patch({ income_source_before: e.target.value })}
          rows={2}
        />
        <FormTextarea
          label={t('continueEducationIfNot')}
          value={details.continue_education_if_not_approved || ''}
          onChange={(e) =>
            patch({ continue_education_if_not_approved: e.target.value })
          }
          rows={2}
        />
      </div>
    </div>
  );
};

export default AidEducationApplicationFields;
