import React, { useEffect, useState } from 'react';
import FormInput from '../../../common/FormInput';
import mtjfLogo from '../../../../assets/mtjf_logo.png';
import { emptyConsentForm } from '../aidConstants';
import {
  captureSignature,
  captureThumb,
} from './mtjfDeviceCapture';
import AidBiometricCaptureSlot from './AidBiometricCaptureSlot';

const COPY = {
  ur: {
    org: 'مولانا طارق جمیل فاؤنڈیشن',
    title: 'کنسنٹ فارم',
    date: 'تاریخ',
    appNo: 'درخواست نمبر',
    name: 'نام',
    parentage: 'ولدیت / زوجیت',
    cnic: 'شناختی کارڈ نمبر',
    sector: 'سیکٹر',
    body:
      'میں مولانا طارق جمیل فاؤنڈیشن کو اس عمل کا مکمل اختیار دیتا/دیتی ہوں کہ وہ میری تصاویر، ویڈیوز، انٹرویوز، بیانات اور درخواست فارم میں تحریر شدہ معلومات کو اپنے اشاعتی مواد مثلاً رپورٹس، ویب سائٹس، سوشل، پرنٹ اور الیکٹرانکس میڈیا، اشتہارات وغیرہ میں استعمال کر سکتے ہیں۔ مزید میری مندرجہ بالا معلومات اپنے ڈونرز سے بھی شئیر کر سکتے ہیں۔ جس پر مجھے کوئی اعتراض نہیں ہو گا۔',
    accept: 'میں مذکورہ بالا رضامندی سے اتفاق کرتا / کرتی ہوں',
    thumb: 'انگوٹھا درخواست گزار',
    sign: 'دستخط درخواست گزار',
    signLabel: 'دستخط / انگوٹھا',
    capture: 'ڈیوائس سے کیپچر',
    upload: 'اپ لوڈ',
    clear: 'صاف',
    empty: 'انگوٹھا سینسر پر رکھیں، پھر Capture from device',
    capturing: 'کےپچر ہو رہا ہے…',
    deviceHint:
      'SecuGen Demo 1 جیسا: https://localhost:8443/SGIFPCapture — انگوٹھا رکھیں پھر Capture from device۔',
  },
  en: {
    org: 'Maulana Tariq jamil Foundation',
    title: 'Consent Form',
    date: 'Date',
    appNo: 'Application No.',
    name: 'Name',
    parentage: 'Parentage / Spouse',
    cnic: 'CNIC',
    sector: 'Sector',
    body:
      'I hereby grant Maulana Tariq jamil Foundation full authority to use my photographs, videos, interviews, statements, and information written in the application form in their publications such as reports, websites, social, print and electronic media, advertisements, etc. Further, they may also share the above information with their donors. I have no objection to this.',
    accept: 'I agree to the consent statement above',
    thumb: 'Applicant thumb',
    sign: 'Applicant signature',
    signLabel: 'Signature / Thumb',
    capture: 'Capture from device',
    upload: 'Upload',
    clear: 'Clear',
    empty: 'Place finger on SecuGen, then Capture from device',
    capturing: 'Capturing…',
    deviceHint:
      'Same as SecuGen Demo 1: POST https://localhost:8443/SGIFPCapture. Place finger, then Capture from device.',
  },
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
 * Consent Form (کنسنٹ فارم) — bilingual Urdu / English for every application.
 */
const AidConsentForm = ({
  value,
  onChange,
  onBiometricSaved,
  readOnly = false,
  applicationNo,
  uiLang,
}) => {
  const details = { ...emptyConsentForm(), ...(value || {}) };
  const lang = details.lang === 'en' ? 'en' : 'ur';
  const t = COPY[lang];
  const rtl = lang === 'ur';
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
      ...emptyConsentForm(),
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
        setDeviceMsg('Capture returned no image. Check Console / Network for SecuGen response.');
        return;
      }
      patch({ [field]: normalized });
      if (typeof onBiometricSaved === 'function') {
        onBiometricSaved(field, normalized);
      }
    } catch (err) {
      // Surface the real SecuGen / network / cert error — no silent upload fallback
      setDeviceMsg(err?.message || String(err) || 'Capture failed');
    } finally {
      setBusyKey(null);
    }
  };

  return (
    <div
      className={`aid-consent-form aid-zakat-form ${
        rtl ? 'aid-zakat-form--rtl' : 'aid-zakat-form--ltr'
      }`}
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
        <h4 className="aid-zakat-form__title aid-consent-form__title">
          {t.title}
        </h4>
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
          label={t.name}
          value={details.full_name || ''}
          onChange={(e) => patch({ full_name: e.target.value })}
          readOnly={readOnly}
        />
        <FormInput
          label={t.parentage}
          value={details.parentage_or_spouse || ''}
          onChange={(e) => patch({ parentage_or_spouse: e.target.value })}
          readOnly={readOnly}
        />
        <FormInput
          label={t.cnic}
          value={details.cnic || ''}
          onChange={(e) => patch({ cnic: e.target.value })}
          readOnly={readOnly}
        />
        <FormInput
          label={t.sector}
          value={details.sector || ''}
          onChange={(e) => patch({ sector: e.target.value })}
          readOnly={readOnly}
        />
      </div>

      <div className="aid-consent-form__body">
        <p>{t.body}</p>
        <label className="aid-zakat-form__check aid-zakat-form__accept">
          <input
            type="checkbox"
            checked={!!details.consent_accepted}
            disabled={readOnly}
            onChange={(e) => patch({ consent_accepted: e.target.checked })}
          />
          {t.accept}
        </label>
      </div>

      <p className="aid-consent-form__sign-heading">{t.signLabel}</p>
      <p className="aid-zakat-form__device-hint">{t.deviceHint}</p>
      {deviceMsg && (
        <p className="aid-zakat-form__device-msg">{deviceMsg}</p>
      )}

      <div className="aid-zakat-form__signs">
        <AidBiometricCaptureSlot
          kind="thumb"
          label={t.thumb}
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
          label={t.sign}
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

export default AidConsentForm;
