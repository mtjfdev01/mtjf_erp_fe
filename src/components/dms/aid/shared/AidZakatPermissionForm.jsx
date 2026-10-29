import React, { useEffect, useState } from 'react';
import FormInput from '../../../common/FormInput';
import FormSelect from '../../../common/FormSelect';
import mtjfLogo from '../../../../assets/mtjf_logo.png';
import {
  AID_ZAKAT_RELIGIONS,
  calcZakatAssetTotal,
  calcZakatNetAfterLoan,
  emptyZakatPermission,
  formatCnicInput,
  formatPkPhoneInput,
} from '../aidConstants';
import {
  captureSignature,
  captureThumb,
} from './mtjfDeviceCapture';
import AidBiometricCaptureSlot from './AidBiometricCaptureSlot';

const COPY = {
  ur: {
    org: 'مولانا طارق جمیل فاؤنڈیشن',
    title: 'اجازت نامہ برائے زکوٰۃ',
    date: 'تاریخ',
    appNo: 'درخواست نمبر',
    applicantName: 'درخواست دہندہ کا نام',
    age: 'عمر',
    education: 'تعلیم',
    religion: 'مذہب',
    cnic: 'شناختی کارڈ نمبر',
    phone: 'موبائل نمبر',
    sr: 'نمبر شمار',
    items: 'اشیاء',
    amount: 'مالیت',
    gold: 'سونا',
    silver: 'چاندی',
    cash: 'نقد رقم: کرنسی، بانڈ، بی سی (کمیٹی) وغیرہ',
    commercial: 'تجارتی سامان',
    surplus: 'ضرورت سے زائد سامان مثلاً ٹی وی',
    total: '1 تا 5 کی کل مالیت',
    loan: 'قرض',
    loanHint: 'اب 1 تا 5 کی مالیت میں سے قرض کو منہا کیا جائے۔',
    net: 'قرض منہا کرنے کے بعد مالیت',
    eligible: 'مستحق زکوٰۃ',
    yes: 'ہاں',
    no: 'نہیں',
    decl1:
      'میں اقرار کرتا / کرتی ہوں کہ میں مسلمان ہوں اور سید، ہاشمی یا عباسی نہیں ہوں۔ نیز یہ کہ میری ملکیت میں قرض منہا کرنے کے بعد سونا، چاندی، تجارتی سامان، نقد رقم اور ضرورت سے زائد سامان کی مالیت چاندی کے باون سوا تولے (52.5) کی موجودہ بازاری قیمت کے برابر نہیں ہے۔',
    decl2:
      'میں مولانا طارق جمیل فاؤنڈیشن کے انتظامیہ اور نمائندگان کو یہ اختیار دیتا / دیتی ہوں کہ جب تک میں مستحق زکوٰۃ ہوں، ادارہ میری طرف سے زکوٰۃ و صدقات کی رقم یا اشیاء وصول کرے، اپنی ملکیت میں لے اور میری یا دیگر مستحقین کی ضروریات پر خرچ کرے۔',
    accept: 'میں مذکورہ بالا اقرارات سے اتفاق کرتا / کرتی ہوں',
    applicantThumb: 'انگوٹھا درخواست گزار',
    applicantSign: 'دستخط درخواست گزار',
    capture: 'ڈیوائس سے کیپچر',
    upload: 'اپ لوڈ',
    clear: 'صاف',
    empty: 'انگوٹھا سینسر پر رکھیں، پھر Capture from device',
    capturing: 'کےپچر ہو رہا ہے…',
    deviceHint:
      'SecuGen Demo 1 جیسا: https://localhost:8443/SGIFPCapture',
  },
  en: {
    org: 'Maulana Tariq jamil Foundation',
    title: 'Permission Letter for Zakat',
    date: 'Date',
    appNo: 'Application No.',
    applicantName: "Applicant's Name",
    age: 'Age',
    education: 'Education',
    religion: 'Religion',
    cnic: 'CNIC',
    phone: 'Mobile',
    sr: 'Sr.',
    items: 'Items',
    amount: 'Value / Amount',
    gold: 'Gold',
    silver: 'Silver',
    cash: 'Cash: currency, bonds, BC (committee), etc.',
    commercial: 'Commercial / business goods',
    surplus: 'Items beyond necessity (e.g. TV)',
    total: 'Total value of 1 to 5',
    loan: 'Loan / Debt',
    loanHint: 'Subtract the loan from the total value of items 1 to 5.',
    net: 'Value after loan deduction',
    eligible: 'Eligible for Zakat',
    yes: 'Yes',
    no: 'No',
    decl1:
      'I declare that I am a Muslim and not a Syed, Hashmi, or Abbasi. I also declare that my ownership, after subtracting debts, of gold, silver, business goods, cash, and items beyond necessity does not equal the current market value of 52.5 tolas of silver (Nisab).',
    decl2:
      'I authorize the management and representatives of Maulana Tariq jamil Foundation that, as long as I remain eligible for Zakat, the organization may collect Zakat and Sadaqat funds or items on my behalf, take them into their ownership, and spend them on my needs or the needs of other deserving people.',
    accept: 'I agree to the declarations above',
    applicantThumb: 'Applicant thumb',
    applicantSign: 'Applicant signature',
    capture: 'Capture from device',
    upload: 'Upload',
    clear: 'Clear',
    empty: 'Place finger on SecuGen, then Capture from device',
    capturing: 'Capturing…',
    deviceHint:
      'Same as SecuGen Demo 1: POST https://localhost:8443/SGIFPCapture',
  },
};

const money = (n) => {
  if (!Number.isFinite(n)) return '';
  return n.toLocaleString(undefined, {
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  });
};

function normalizeCapture(raw, fallbackSource) {
  if (!raw) return null;
  const dataUrl = raw.dataUrl || raw.data_url || raw.image || null;
  const url = raw.url || null;
  if (!dataUrl && !url) return null;
  return {
    data_url: dataUrl,
    url,
    source: raw.source || fallbackSource,
    meta: raw.meta || null,
    captured_at: new Date().toISOString(),
  };
}

/**
 * Zakat Permission Letter — bilingual (Urdu / English) for every application.
 * Thumb / signature: Upload for all users; live device capture optional.
 */
const AidZakatPermissionForm = ({
  value,
  onChange,
  onBiometricSaved,
  readOnly = false,
  applicationNo,
  uiLang,
}) => {
  const details = { ...emptyZakatPermission(), ...(value || {}) };
  const lang = details.lang === 'en' ? 'en' : 'ur';
  const t = COPY[lang];
  const rtl = lang === 'ur';
  const total = calcZakatAssetTotal(details);
  const net = calcZakatNetAfterLoan(details);
  const [busyKey, setBusyKey] = useState(null);
  const [deviceMsg, setDeviceMsg] = useState('');

  const patch = (partial) => {
    if (readOnly || !onChange) return;
    onChange({ ...details, ...partial });
  };

  useEffect(() => {
    if (!uiLang || !onChange || readOnly) return;
    if ((value?.lang || 'ur') === uiLang) return;
    onChange({
      ...emptyZakatPermission(),
      ...(value || {}),
      lang: uiLang,
    });
  }, [uiLang]);

  const slotLabels = {
    capture: t.capture,
    upload: t.upload,
    clear: t.clear,
    empty: t.empty,
    capturing: t.capturing,
  };

  const runCapture = async (field, kind, source) => {
    setBusyKey(field);
    setDeviceMsg('');
    try {
      const raw =
        kind === 'thumb'
          ? await captureThumb({ device: 'secugen' })
          : await captureSignature({ device: 'epad', model: 'VP9801' });
      const normalized = normalizeCapture(raw, source);
      if (!normalized) {
        setDeviceMsg(
          'Capture returned no image. Check Console / Network for SecuGen response.',
        );
        return;
      }
      patch({ [field]: normalized });
      if (typeof onBiometricSaved === 'function') {
        onBiometricSaved(field, normalized);
      }
    } catch (err) {
      setDeviceMsg(err?.message || String(err) || 'Capture failed');
    } finally {
      setBusyKey(null);
    }
  };

  const assetRows = [
    { key: 'gold', label: t.gold, no: 1 },
    { key: 'silver', label: t.silver, no: 2 },
    { key: 'cash', label: t.cash, no: 3 },
    { key: 'commercial_goods', label: t.commercial, no: 4 },
    { key: 'surplus_items', label: t.surplus, no: 5 },
  ];

  return (
    <div
      className={`aid-zakat-form ${rtl ? 'aid-zakat-form--rtl' : 'aid-zakat-form--ltr'}`}
      dir={rtl ? 'rtl' : 'ltr'}
    >
      <div className="aid-zakat-form__lang">
        <button
          type="button"
          className={`aid-zakat-form__lang-btn${lang === 'ur' ? ' is-active' : ''}`}
          onClick={() => patch({ lang: 'ur' })}
          disabled={readOnly}
        >
          اردو
        </button>
        <button
          type="button"
          className={`aid-zakat-form__lang-btn${lang === 'en' ? ' is-active' : ''}`}
          onClick={() => patch({ lang: 'en' })}
          disabled={readOnly}
        >
          English
        </button>
      </div>

      <header className="aid-zakat-form__header">
        <img
          src={mtjfLogo}
          alt="MTJF Logo"
          className="aid-zakat-form__logo"
        />
        <h3 className="aid-zakat-form__org">{t.org}</h3>
        <h4 className="aid-zakat-form__title">{t.title}</h4>
      </header>

      <div className="aid-zakat-form__meta form-grid-2">
        <FormInput
          label={t.date}
          type="date"
          value={details.form_date || ''}
          onChange={(e) => patch({ form_date: e.target.value })}
          readOnly={readOnly}
        />
        <FormInput
          label={t.appNo}
          value={applicationNo || details.application_no || ''}
          onChange={(e) => patch({ application_no: e.target.value })}
          readOnly={readOnly || !!applicationNo}
          placeholder={applicationNo ? undefined : '—'}
        />
        <FormInput
          label={t.applicantName}
          value={details.applicant_name || ''}
          onChange={(e) => patch({ applicant_name: e.target.value })}
          readOnly={readOnly}
        />
        <FormInput
          label={t.age}
          type="number"
          min="0"
          value={details.age ?? ''}
          onChange={(e) => patch({ age: e.target.value })}
          readOnly={readOnly}
        />
        <FormInput
          label={t.education}
          value={details.education || ''}
          onChange={(e) => patch({ education: e.target.value })}
          readOnly={readOnly}
        />
        <FormSelect
          label={t.religion}
          value={details.religion || 'muslim'}
          onChange={(e) => patch({ religion: e.target.value })}
          options={AID_ZAKAT_RELIGIONS}
          disabled={readOnly}
        />
        <FormInput
          label={t.cnic}
          value={formatCnicInput(details.cnic || '')}
          onChange={(e) => patch({ cnic: formatCnicInput(e.target.value) })}
          readOnly={readOnly}
          placeholder="00000-0000000-0"
          inputMode="numeric"
        />
        <FormInput
          label={t.phone}
          value={formatPkPhoneInput(details.phone || '')}
          onChange={(e) =>
            patch({ phone: formatPkPhoneInput(e.target.value) })
          }
          readOnly={readOnly}
          placeholder="03000000000"
          inputMode="numeric"
          autoComplete="tel"
        />
      </div>

      <div className="aid-zakat-form__table-wrap">
        <table className="aid-zakat-form__table">
          <thead>
            <tr>
              <th style={{ width: '4.5rem' }}>{t.sr}</th>
              <th>{t.items}</th>
              <th style={{ width: '9rem' }}>{t.amount}</th>
            </tr>
          </thead>
          <tbody>
            {assetRows.map((row) => (
              <tr key={row.key}>
                <td>{row.no}</td>
                <td>{row.label}</td>
                <td>
                  {readOnly ? (
                    details[row.key] || ''
                  ) : (
                    <input
                      type="number"
                      min="0"
                      step="0.01"
                      className="aid-zakat-form__amount"
                      value={details[row.key] ?? ''}
                      onChange={(e) => patch({ [row.key]: e.target.value })}
                    />
                  )}
                </td>
              </tr>
            ))}
            <tr className="aid-zakat-form__total-row">
              <td>6</td>
              <td>{t.total}</td>
              <td>{money(total)}</td>
            </tr>
            <tr>
              <td>{t.loan}</td>
              <td className="aid-zakat-form__loan-hint">{t.loanHint}</td>
              <td>
                {readOnly ? (
                  details.loan || ''
                ) : (
                  <input
                    type="number"
                    min="0"
                    step="0.01"
                    className="aid-zakat-form__amount"
                    value={details.loan ?? ''}
                    onChange={(e) => patch({ loan: e.target.value })}
                  />
                )}
              </td>
            </tr>
            <tr className="aid-zakat-form__total-row">
              <td colSpan={2}>{t.net}</td>
              <td>{money(net)}</td>
            </tr>
          </tbody>
        </table>
      </div>

      <div className="aid-zakat-form__eligible">
        <span className="aid-zakat-form__eligible-label">{t.eligible}:</span>
        <label className="aid-zakat-form__check">
          <input
            type="radio"
            name="zakat_eligible"
            checked={details.zakat_eligible === 'yes'}
            disabled={readOnly}
            onChange={() => patch({ zakat_eligible: 'yes' })}
          />
          {t.yes}
        </label>
        <label className="aid-zakat-form__check">
          <input
            type="radio"
            name="zakat_eligible"
            checked={details.zakat_eligible === 'no'}
            disabled={readOnly}
            onChange={() => patch({ zakat_eligible: 'no' })}
          />
          {t.no}
        </label>
      </div>

      <div className="aid-zakat-form__decls">
        <p>{t.decl1}</p>
        <p>{t.decl2}</p>
        <label className="aid-zakat-form__check aid-zakat-form__accept">
          <input
            type="checkbox"
            checked={!!details.declaration_accepted}
            disabled={readOnly}
            onChange={(e) =>
              patch({ declaration_accepted: e.target.checked })
            }
          />
          {t.accept}
        </label>
      </div>

      <p className="aid-zakat-form__device-hint">{t.deviceHint}</p>
      {deviceMsg && (
        <p className="aid-zakat-form__device-msg">{deviceMsg}</p>
      )}

      <div className="aid-zakat-form__signs">
        <AidBiometricCaptureSlot
          kind="thumb"
          label={t.applicantThumb}
          value={details.applicant_thumb}
          readOnly={readOnly}
          busy={busyKey === 'applicant_thumb'}
          labels={slotLabels}
          allowUpload={false}
          onCapture={() => runCapture('applicant_thumb', 'thumb', 'secugen')}
          onClear={() => patch({ applicant_thumb: null })}
        />
        <AidBiometricCaptureSlot
          kind="signature"
          label={t.applicantSign}
          value={details.applicant_signature}
          readOnly={readOnly}
          busy={busyKey === 'applicant_signature'}
          labels={slotLabels}
          allowUpload={false}
          onCapture={() =>
            runCapture('applicant_signature', 'signature', 'epad_vp9801')
          }
          onClear={() => patch({ applicant_signature: null })}
        />
      </div>
    </div>
  );
};

export default AidZakatPermissionForm;
