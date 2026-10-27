import React, { useEffect } from 'react';
import FormInput from '../../../common/FormInput';
import FormTextarea from '../../../common/FormTextarea';
import {
  emptyCleanWaterDetails,
  emptyCleanWaterSurveyBeneficiary,
  formatCnicInput,
  formatPkPhoneInput,
} from '../aidConstants';

const COPY = {
  ur: {
    org: 'مولانا طارق جمیل فاؤنڈیشن',
    title: 'واٹر پروگرام — سروی فارم',
    subtitle: 'درخواست برائے صاف پانی',
    appNo: 'درخواست نمبر',
    applicantName: 'نام درخواست دہندہ',
    village: 'گاؤں / چک نمبر',
    unionCouncil: 'یونین کونسل',
    tehsilDistrict: 'تحصیل / ضلع',
    province: 'صوبہ',
    gps: 'جی پی ایس کوآرڈینیٹس',
    areaType: 'علاقہ',
    rural: 'دیہاتی',
    urban: 'شہری',
    tds: 'ٹی ڈی ایس (ppm)',
    beneficiaries: 'مستفید افراد',
    population: 'آبادی',
    households: 'خاندان',
    waterProblems: 'پانی کے مسائل',
    drainagePlan: 'نکاسی آب کا نظام',
    projectDetails: 'تفصیلات پروجیکٹ',
    projectName: 'نام پروجیکٹ / مشین',
    waterLevel: 'پانی کی سطح (فٹ)',
    boringDepth: 'بورنگ کی گہرائی (فٹ)',
    pipeLength: 'مشین پائپ لمبائی (فٹ)',
    constructionBy: 'تعمیر کی ذمہ داری',
    byOrg: 'ادارہ تعمیر کرے گا',
    byCommunity: 'کمیونٹی تعمیر کرے گی',
    byShared: 'مشترکہ',
    beneficiaryList: 'مستفیدین کی فہرست',
    name: 'نام',
    phone: 'رابطہ نمبر',
    cnic: 'شناختی کارڈ نمبر',
    familyMembers: 'افرادِ خانہ',
    addRow: 'قطار شامل کریں',
    removeRow: 'ہٹائیں',
    noSignature: 'دستخط درکار نہیں',
  },
  en: {
    org: 'Maulana Tariq Jamil Foundation',
    title: 'Water Program — Survey Form',
    subtitle: 'Clean water application survey',
    appNo: 'Application No.',
    applicantName: 'Applicant name',
    village: 'Village / Chak No.',
    unionCouncil: 'Union Council',
    tehsilDistrict: 'Tehsil / District',
    province: 'Province',
    gps: 'GPS coordinates',
    areaType: 'Area type',
    rural: 'Rural',
    urban: 'Urban',
    tds: 'TDS (ppm)',
    beneficiaries: 'Beneficiaries',
    population: 'Population',
    households: 'Households',
    waterProblems: 'Water problems',
    drainagePlan: 'Drainage plan',
    projectDetails: 'Project details',
    projectName: 'Project / machine name',
    waterLevel: 'Water level (ft)',
    boringDepth: 'Boring depth (ft)',
    pipeLength: 'Machine pipe length (ft)',
    constructionBy: 'Construction responsibility',
    byOrg: 'Organization will construct',
    byCommunity: 'Community will construct',
    byShared: 'Shared',
    beneficiaryList: 'Beneficiary list',
    name: 'Name',
    phone: 'Contact number',
    cnic: 'CNIC',
    familyMembers: 'Family members',
    addRow: 'Add row',
    removeRow: 'Remove',
    noSignature: 'No signature required',
  },
};

/**
 * Clean Water survey — bilingual (Urdu / English). No signature input.
 */
const AidCleanWaterSurveyForm = ({
  value,
  onChange,
  readOnly = false,
  applicationNo,
  uiLang,
}) => {
  const details = {
    ...emptyCleanWaterDetails(),
    ...(value || {}),
    survey_beneficiaries: Array.isArray(value?.survey_beneficiaries)
      ? value.survey_beneficiaries
      : emptyCleanWaterDetails().survey_beneficiaries,
  };
  const lang = details.lang === 'en' ? 'en' : 'ur';
  const t = COPY[lang];
  const rtl = lang === 'ur';

  const patch = (partial) => {
    if (readOnly || !onChange) return;
    onChange({ ...details, ...partial });
  };

  useEffect(() => {
    if (!uiLang || !onChange || readOnly) return;
    if ((value?.lang || 'ur') === uiLang) return;
    onChange({
      ...emptyCleanWaterDetails(),
      ...(value || {}),
      lang: uiLang,
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [uiLang]);

  useEffect(() => {
    if (readOnly || !onChange || !applicationNo) return;
    if (details.application_no === applicationNo) return;
    patch({ application_no: applicationNo });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [applicationNo]);

  const rows = details.survey_beneficiaries || [];

  const updateRow = (idx, partial) => {
    const next = rows.map((row, i) =>
      i === idx ? { ...emptyCleanWaterSurveyBeneficiary(), ...row, ...partial } : row,
    );
    patch({ survey_beneficiaries: next });
  };

  const addRow = () => {
    patch({
      survey_beneficiaries: [...rows, emptyCleanWaterSurveyBeneficiary()],
    });
  };

  const removeRow = (idx) => {
    if (rows.length <= 1) {
      patch({ survey_beneficiaries: [emptyCleanWaterSurveyBeneficiary()] });
      return;
    }
    patch({ survey_beneficiaries: rows.filter((_, i) => i !== idx) });
  };

  return (
    <div
      className={`aid-water-survey${rtl ? ' aid-water-survey--rtl' : ''}`}
      dir={rtl ? 'rtl' : 'ltr'}
    >
      <div className="aid-water-survey__lang">
        <button
          type="button"
          className={`aid-zakat-form__lang-btn${lang === 'ur' ? ' is-active' : ''}`}
          disabled={readOnly}
          aria-pressed={lang === 'ur'}
          onClick={() => patch({ lang: 'ur' })}
        >
          اردو
        </button>
        <button
          type="button"
          className={`aid-zakat-form__lang-btn${lang === 'en' ? ' is-active' : ''}`}
          disabled={readOnly}
          aria-pressed={lang === 'en'}
          onClick={() => patch({ lang: 'en' })}
        >
          English
        </button>
      </div>

      <header className="aid-water-survey__header">
        <div>
          <p className="aid-water-survey__org">{t.org}</p>
          <h3 className="aid-water-survey__title">{t.title}</h3>
          <p className="aid-water-survey__sub">{t.subtitle}</p>
        </div>
        <p className="aid-water-survey__note">{t.noSignature}</p>
      </header>

      <div className="aid-water-survey__grid">
        <FormInput
          label={t.appNo}
          value={details.application_no || ''}
          onChange={(e) => patch({ application_no: e.target.value })}
          disabled={readOnly}
        />
        <FormInput
          label={t.applicantName}
          value={details.applicant_name || ''}
          onChange={(e) => patch({ applicant_name: e.target.value })}
          disabled={readOnly}
        />
        <FormInput
          label={t.village}
          value={details.village || ''}
          onChange={(e) => patch({ village: e.target.value })}
          disabled={readOnly}
        />
        <FormInput
          label={t.unionCouncil}
          value={details.union_council || ''}
          onChange={(e) => patch({ union_council: e.target.value })}
          disabled={readOnly}
        />
        <FormInput
          label={t.tehsilDistrict}
          value={details.tehsil_district || ''}
          onChange={(e) => patch({ tehsil_district: e.target.value })}
          disabled={readOnly}
        />
        <FormInput
          label={t.province}
          value={details.province || ''}
          onChange={(e) => patch({ province: e.target.value })}
          disabled={readOnly}
        />
        <FormInput
          label={t.gps}
          value={details.gps_coordinates || ''}
          onChange={(e) => patch({ gps_coordinates: e.target.value })}
          disabled={readOnly}
          placeholder="30.440903, 71.993454"
        />
        <div className="aid-water-survey__checks">
          <span className="aid-water-survey__checks-label">{t.areaType}</span>
          <label className="aid-water-survey__check">
            <input
              type="radio"
              name="cw-area-type"
              checked={details.area_type === 'rural'}
              disabled={readOnly}
              onChange={() => patch({ area_type: 'rural' })}
            />
            {t.rural}
          </label>
          <label className="aid-water-survey__check">
            <input
              type="radio"
              name="cw-area-type"
              checked={details.area_type === 'urban'}
              disabled={readOnly}
              onChange={() => patch({ area_type: 'urban' })}
            />
            {t.urban}
          </label>
        </div>
        <FormInput
          label={t.tds}
          value={details.tds_ppm || ''}
          onChange={(e) => patch({ tds_ppm: e.target.value })}
          disabled={readOnly}
          placeholder="940"
        />
        <FormInput
          label={`${t.beneficiaries} — ${t.population}`}
          value={details.beneficiary_population || ''}
          onChange={(e) => patch({ beneficiary_population: e.target.value })}
          disabled={readOnly}
        />
        <FormInput
          label={`${t.beneficiaries} — ${t.households}`}
          value={details.beneficiary_households || ''}
          onChange={(e) => patch({ beneficiary_households: e.target.value })}
          disabled={readOnly}
        />
      </div>

      <div className="aid-water-survey__block">
        <FormTextarea
          label={t.waterProblems}
          value={details.water_problems || ''}
          onChange={(e) => patch({ water_problems: e.target.value })}
          disabled={readOnly}
          rows={3}
        />
        <FormTextarea
          label={t.drainagePlan}
          value={details.drainage_plan || ''}
          onChange={(e) => patch({ drainage_plan: e.target.value })}
          disabled={readOnly}
          rows={2}
        />
      </div>

      <h4 className="aid-water-survey__section">{t.projectDetails}</h4>
      <div className="aid-water-survey__grid">
        <FormInput
          label={t.projectName}
          value={details.project_name || ''}
          onChange={(e) => patch({ project_name: e.target.value })}
          disabled={readOnly}
        />
        <FormInput
          label={t.waterLevel}
          value={details.water_level_ft || ''}
          onChange={(e) => patch({ water_level_ft: e.target.value })}
          disabled={readOnly}
        />
        <FormInput
          label={t.boringDepth}
          value={details.boring_depth_ft || ''}
          onChange={(e) => patch({ boring_depth_ft: e.target.value })}
          disabled={readOnly}
        />
        <FormInput
          label={t.pipeLength}
          value={details.machine_pipe_length_ft || ''}
          onChange={(e) => patch({ machine_pipe_length_ft: e.target.value })}
          disabled={readOnly}
        />
      </div>
      <div className="aid-water-survey__checks" style={{ marginTop: 10 }}>
        <span className="aid-water-survey__checks-label">{t.constructionBy}</span>
        {[
          { value: 'organization', label: t.byOrg },
          { value: 'community', label: t.byCommunity },
          { value: 'shared', label: t.byShared },
        ].map((opt) => (
          <label key={opt.value} className="aid-water-survey__check">
            <input
              type="radio"
              name="cw-construction"
              checked={details.construction_by === opt.value}
              disabled={readOnly}
              onChange={() => patch({ construction_by: opt.value })}
            />
            {opt.label}
          </label>
        ))}
      </div>

      <h4 className="aid-water-survey__section">{t.beneficiaryList}</h4>
      <div className="aid-water-survey__table-wrap">
        <table className="aid-water-survey__table">
          <thead>
            <tr>
              <th>#</th>
              <th>{t.name}</th>
              <th>{t.phone}</th>
              <th>{t.cnic}</th>
              <th>{t.familyMembers}</th>
              {!readOnly ? <th /> : null}
            </tr>
          </thead>
          <tbody>
            {rows.map((row, idx) => (
              <tr key={`cw-ben-${idx}`}>
                <td>{idx + 1}</td>
                <td>
                  <input
                    className="aid-water-survey__cell"
                    value={row.name || ''}
                    disabled={readOnly}
                    onChange={(e) => updateRow(idx, { name: e.target.value })}
                  />
                </td>
                <td>
                  <input
                    className="aid-water-survey__cell"
                    value={row.phone || ''}
                    disabled={readOnly}
                    onChange={(e) =>
                      updateRow(idx, {
                        phone: formatPkPhoneInput(e.target.value),
                      })
                    }
                  />
                </td>
                <td>
                  <input
                    className="aid-water-survey__cell"
                    value={row.cnic || ''}
                    disabled={readOnly}
                    onChange={(e) =>
                      updateRow(idx, {
                        cnic: formatCnicInput(e.target.value),
                      })
                    }
                  />
                </td>
                <td>
                  <input
                    className="aid-water-survey__cell"
                    value={row.family_members || ''}
                    disabled={readOnly}
                    onChange={(e) =>
                      updateRow(idx, { family_members: e.target.value })
                    }
                  />
                </td>
                {!readOnly ? (
                  <td>
                    <button
                      type="button"
                      className="aid-text-link"
                      onClick={() => removeRow(idx)}
                    >
                      {t.removeRow}
                    </button>
                  </td>
                ) : null}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {!readOnly ? (
        <button
          type="button"
          className="secondary-btn"
          style={{ marginTop: 10 }}
          onClick={addRow}
        >
          {t.addRow}
        </button>
      ) : null}
    </div>
  );
};

export default AidCleanWaterSurveyForm;
