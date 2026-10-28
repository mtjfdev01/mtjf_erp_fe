import React, { useEffect, useState } from 'react';
import FormInput from '../../../common/FormInput';
import mtjfLogo from '../../../../assets/mtjf_logo.png';
import {
  emptyWheelchairConsentForm,
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
    title: 'حلف نامہ برائے وہیل چیئر',
    date: 'تاریخ',
    appNo: 'درخواست نمبر',
    applicantName: 'نام درخواست دہندہ',
    applicantCnic: 'شناختی کارڈ نمبر',
    beneficiaryName: 'مستفید',
    beneficiaryCnic: 'شناختی کارڈ نمبر',
    mobile: 'موبائل نمبر',
    age: 'عمر',
    termsHeading: 'شرائط',
    terms: [
      'یہ وہیل چیئر بطور تحفہ مولانا طارق جمیل فاؤنڈیشن نے فراہم کی ہے۔',
      'یہ وہیل چیئر صرف معذور فرد کی ذاتی استعمال کے لیے ہے اور اسے فروخت، منتقل یا غلط استعمال نہیں کیا جا سکتا۔',
      'وہیل چیئر وصول کرتے وقت میں نے اس کے نئی اور اصل حالت میں ہونے کی تصدیق کر لی ہے۔',
      'شرائط کی کسی بھی خلاف ورزی یا غلط معلومات کی صورت میں فاؤنڈیشن ضروری کارروائی کر سکتی ہے۔',
    ],
    declarationHeading: 'بینیفشری ڈیکلریشن',
    declaration:
      'میں زیر دستخطی تصدیق کرتا / کرتی ہوں کہ مجھے مندرجہ بالا شرائط و ضوابط کے تحت مولانا طارق جمیل فاؤنڈیشن سے وہیل چیئر ملی ہے۔ میں مذکورہ بالا تمام شرائط کی تعمیل کرنے سے اتفاق کرتا / کرتی ہوں۔',
    accept: 'میں مذکورہ بالا شرائط و ڈیکلریشن سے اتفاق کرتا / کرتی ہوں',
    applicantSign: 'درخواست گزار کے دستخط اور انگوٹھا',
    thumb: 'انگوٹھا درخواست گزار',
    sign: 'دستخط درخواست گزار',
    mtjfRepSign: 'ایم ٹی جے کے نمائندے کے دستخط',
    capture: 'ڈیوائس سے کیپچر',
    upload: 'اپ لوڈ',
    clear: 'صاف',
    empty: 'انگوٹھا سینسر پر رکھیں، پھر Capture from device',
    capturing: 'کےپچر ہو رہا ہے…',
    deviceHint:
      'SecuGen Demo 1 جیسا: https://localhost:8443/SGIFPCapture — انگوٹھا رکھیں پھر Capture from device۔',
  },
  en: {
    org: 'Maulana Tariq Jamil Foundation',
    title: 'Affidavit for Wheelchair',
    date: 'Date',
    appNo: 'Application No.',
    applicantName: 'Applicant name',
    applicantCnic: 'CNIC (applicant)',
    beneficiaryName: 'Beneficiary',
    beneficiaryCnic: 'CNIC (beneficiary)',
    mobile: 'Mobile number',
    age: 'Age',
    termsHeading: 'Terms & conditions',
    terms: [
      'This wheelchair is provided as a gift by the Maulana Tariq Jamil Foundation.',
      'This wheelchair is for the personal use of the person with disability only and must not be sold, transferred, or misused.',
      'At the time of receiving the wheelchair, I have verified that it is new and in original condition.',
      'In case of any violation of these terms or incorrect information, the Foundation may take necessary action.',
    ],
    declarationHeading: 'Beneficiary declaration',
    declaration:
      'I, the undersigned, confirm that I have received a wheelchair from the Maulana Tariq Jamil Foundation under the above terms and conditions. I agree to comply with all of the above terms.',
    accept: 'I agree to the terms and declaration above',
    applicantSign: 'Applicant signature and thumb',
    thumb: 'Applicant thumb',
    sign: 'Applicant signature',
    mtjfRepSign: 'MTJF representative signature',
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
 * Wheelchair affidavit / consent — bilingual Urdu / English.
 * Matches paper form: حلف نامہ برائے وہیل چیئر
 */
const AidWheelchairConsentForm = ({
  value,
  onChange,
  readOnly = false,
  applicationNo,
  uiLang,
}) => {
  const details = { ...emptyWheelchairConsentForm(), ...(value || {}) };
  const lang = details.lang === 'en' ? 'en' : 'ur';
  const t = COPY[lang];
  const rtl = lang === 'ur';
  const [busyKey, setBusyKey] = useState(null);
  const [deviceMsg, setDeviceMsg] = useState('');

  const patch = (partial) => {
    if (readOnly || !onChange) return;
    onChange({ ...details, variant: 'wheelchair', ...partial });
  };

  useEffect(() => {
    if (!uiLang || !onChange || readOnly) return;
    if ((value?.lang || 'ur') === uiLang) return;
    onChange({
      ...emptyWheelchairConsentForm(),
      ...(value || {}),
      variant: 'wheelchair',
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
    } catch (err) {
      setDeviceMsg(err?.message || String(err) || 'Capture failed');
    } finally {
      setBusyKey(null);
    }
  };

  return (
    <div
      className={`aid-consent-form aid-wheelchair-consent aid-zakat-form ${
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
          label={t.appNo}
          value={applicationNo || details.application_no || ''}
          onChange={(e) => patch({ application_no: e.target.value })}
          readOnly={readOnly || !!applicationNo}
          placeholder={applicationNo ? undefined : '—'}
        />
        <FormInput
          label={t.date}
          type="date"
          value={details.form_date || ''}
          onChange={(e) => patch({ form_date: e.target.value })}
          readOnly={readOnly}
        />
        <FormInput
          label={t.applicantName}
          value={details.applicant_name || ''}
          onChange={(e) => patch({ applicant_name: e.target.value })}
          readOnly={readOnly}
        />
        <FormInput
          label={t.applicantCnic}
          value={formatCnicInput(details.applicant_cnic || '')}
          onChange={(e) =>
            patch({ applicant_cnic: formatCnicInput(e.target.value) })
          }
          readOnly={readOnly}
        />
        <FormInput
          label={t.beneficiaryName}
          value={details.beneficiary_name || ''}
          onChange={(e) => patch({ beneficiary_name: e.target.value })}
          readOnly={readOnly}
        />
        <FormInput
          label={t.beneficiaryCnic}
          value={formatCnicInput(details.beneficiary_cnic || '')}
          onChange={(e) =>
            patch({ beneficiary_cnic: formatCnicInput(e.target.value) })
          }
          readOnly={readOnly}
        />
        <FormInput
          label={t.mobile}
          value={formatPkPhoneInput(details.mobile || '')}
          onChange={(e) =>
            patch({ mobile: formatPkPhoneInput(e.target.value) })
          }
          readOnly={readOnly}
        />
        <FormInput
          label={t.age}
          value={details.age || ''}
          onChange={(e) => patch({ age: e.target.value })}
          readOnly={readOnly}
        />
      </div>

      <div className="aid-wheelchair-consent__terms">
        <h5 className="aid-wheelchair-consent__section-title">
          {t.termsHeading}
        </h5>
        <ol className="aid-wheelchair-consent__terms-list">
          {t.terms.map((line) => (
            <li key={line}>{line}</li>
          ))}
        </ol>
      </div>

      <div className="aid-consent-form__body aid-wheelchair-consent__declaration">
        <h5 className="aid-wheelchair-consent__section-title">
          {t.declarationHeading}
        </h5>
        <p>{t.declaration}</p>
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

      <p className="aid-consent-form__sign-heading">{t.applicantSign}</p>
      <p className="aid-zakat-form__device-hint">{t.deviceHint}</p>
      {deviceMsg ? (
        <p className="aid-zakat-form__device-msg">{deviceMsg}</p>
      ) : null}

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

      <p className="aid-consent-form__sign-heading">{t.mtjfRepSign}</p>
      <div className="aid-zakat-form__signs aid-wheelchair-consent__rep-sign">
        <AidBiometricCaptureSlot
          kind="signature"
          label={t.mtjfRepSign}
          value={details.mtjf_rep_signature}
          readOnly={readOnly}
          busy={busyKey === 'mtjf_rep_signature'}
          labels={slotLabels}
          allowUpload={false}
          onCapture={() =>
            runCapture('mtjf_rep_signature', 'signature', 'epad_vp9801')
          }
          onClear={() => patch({ mtjf_rep_signature: null })}
        />
      </div>
    </div>
  );
};

export default AidWheelchairConsentForm;
