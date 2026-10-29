import React, { useEffect, useState } from 'react';
import FormInput from '../../../common/FormInput';
import FormSelect from '../../../common/FormSelect';
import mtjfLogo from '../../../../assets/mtjf_logo.png';
import {
  emptyMarriageGiftConsentForm,
  AID_MARRIAGE_GIFT_CONSENT_ITEMS,
  formatCnicInput,
} from '../aidConstants';
import {
  captureSignature,
  captureThumb,
} from './mtjfDeviceCapture';
import AidBiometricCaptureSlot from './AidBiometricCaptureSlot';

const RELATION_OPTIONS = {
  ur: [
    { value: 'daughter', label: 'بیٹی' },
    { value: 'sister', label: 'بہن' },
    { value: 'niece', label: 'بھتیجی / بھانجی' },
  ],
  en: [
    { value: 'daughter', label: 'Daughter' },
    { value: 'sister', label: 'Sister' },
    { value: 'niece', label: 'Niece' },
  ],
};

const COPY = {
  ur: {
    org: 'مولانا طارق جمیل فاؤنڈیشن',
    program: 'شادی تحفہ منصوبہ برائے مستحقین',
    tagline: 'آئیں بیٹیوں کے گھر بسائیں',
    brideName: 'نام دلہن',
    brideCnic: 'شناختی کارڈ نمبر',
    itemsHeading: 'تفصیل سامان',
    sr: 'نمبر شمار',
    itemName: 'نام اشیاء',
    qty: 'تعداد اشیاء',
    applicantHeading: 'درخواست دہندہ',
    applicantName: 'نام',
    parentage: 'ولد / زوجہ',
    applicantCnic: 'شناختی کارڈ نمبر',
    appNo: 'درخواست نمبر',
    relation: 'رشتہ (دلہن سے)',
    declarationBefore:
      'میں',
    declarationMid1:
      'ولد / زوجہ',
    declarationMid2:
      'شناختی کارڈ نمبر',
    declarationMid3:
      'اور درخواست نمبر',
    declarationMid4:
      'مولانا طارق جمیل فاؤنڈیشن سے اپنی',
    declarationMid5:
      'کے لیے مندرجہ بالا فہرست کے مطابق شادی تحفہ سامان وصول کر چکا / چکی ہوں۔',
    promise:
      'میں یہ وعدہ کرتا / کرتی ہوں کہ شادی کے تین دن کے اندر اپنی بیٹی / بہن / بھتیجی کا نکاح نامہ مولانا طارق جمیل فاؤنڈیشن میں جمع کرواؤں گا۔ / گی۔',
    accept: 'میں مذکورہ بالا بیانات سے اتفاق کرتا / کرتی ہوں',
    receiverSign: 'دستخط وصول کنندہ',
    thumb: 'انگوٹھا وصول کنندہ',
    sign: 'دستخط وصول کنندہ',
    orgLabel: 'ادارہ',
    mtjfRepSign: 'دستخط نمائندہ',
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
    program: 'Marriage Gift Program for the deserving',
    tagline: "Let's settle our daughters' homes",
    brideName: "Bride's name",
    brideCnic: 'CNIC (bride)',
    itemsHeading: 'Details of items',
    sr: 'Sr.',
    itemName: 'Item name',
    qty: 'Qty',
    applicantHeading: 'Applicant',
    applicantName: 'Name',
    parentage: 'Son / wife of',
    applicantCnic: 'CNIC (applicant)',
    appNo: 'Application No.',
    relation: 'Relation to bride',
    declarationBefore: 'I',
    declarationMid1: 'son / wife of',
    declarationMid2: 'CNIC',
    declarationMid3: 'and Application No.',
    declarationMid4:
      'have received the marriage gift items listed above from Maulana Tariq Jamil Foundation for my',
    declarationMid5: '.',
    promise:
      'I undertake to submit the Nikah Nama (marriage certificate) of my daughter / sister / niece to the Maulana Tariq Jamil Foundation within three days of the marriage.',
    accept: 'I agree to the statements above',
    receiverSign: 'Signature of receiver',
    thumb: 'Receiver thumb',
    sign: 'Receiver signature',
    orgLabel: 'Organization',
    mtjfRepSign: 'Signature of representative',
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

function ensureItems(details) {
  if (Array.isArray(details.items) && details.items.length) {
    return details.items;
  }
  return AID_MARRIAGE_GIFT_CONSENT_ITEMS.map((row) => ({
    key: row.key,
    name_en: row.name_en,
    name_ur: row.name_ur,
    qty: row.qty,
  }));
}

/**
 * Marriage Gift receipt / consent — bilingual Urdu / English.
 * Matches paper form: شادی تحفہ منصوبہ برائے مستحقین
 */
const AidMarriageGiftConsentForm = ({
  value,
  onChange,
  onBiometricSaved,
  readOnly = false,
  applicationNo,
  uiLang,
}) => {
  const details = { ...emptyMarriageGiftConsentForm(), ...(value || {}) };
  const items = ensureItems(details);
  const lang = details.lang === 'en' ? 'en' : 'ur';
  const t = COPY[lang];
  const rtl = lang === 'ur';
  const [busyKey, setBusyKey] = useState(null);
  const [deviceMsg, setDeviceMsg] = useState('');

  const patch = (partial) => {
    if (readOnly || !onChange) return;
    onChange({
      ...details,
      items,
      variant: 'marriage_gift',
      ...partial,
    });
  };

  useEffect(() => {
    if (!uiLang || !onChange || readOnly) return;
    if ((value?.lang || 'ur') === uiLang) return;
    onChange({
      ...emptyMarriageGiftConsentForm(),
      ...(value || {}),
      variant: 'marriage_gift',
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

  const updateQty = (idx, qty) => {
    const next = items.map((row, i) =>
      i === idx ? { ...row, qty: qty === '' ? '' : Number(qty) || 0 } : row,
    );
    patch({ items: next });
  };

  const relationLabel =
    RELATION_OPTIONS[lang].find((o) => o.value === details.relation_to_bride)
      ?.label || details.relation_to_bride;

  return (
    <div
      className={`aid-consent-form aid-marriage-gift-consent aid-zakat-form ${
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
          {t.program}
        </h4>
        <p className="aid-marriage-gift-consent__tagline">{t.tagline}</p>
      </header>

      <div className="aid-zakat-form__meta form-grid-2">
        <FormInput
          label={t.brideName}
          value={details.bride_name || ''}
          onChange={(e) => patch({ bride_name: e.target.value })}
          readOnly={readOnly}
        />
        <FormInput
          label={t.brideCnic}
          value={formatCnicInput(details.bride_cnic || '')}
          onChange={(e) =>
            patch({ bride_cnic: formatCnicInput(e.target.value) })
          }
          readOnly={readOnly}
        />
      </div>

      <div className="aid-marriage-gift-consent__items">
        <h5 className="aid-wheelchair-consent__section-title">
          {t.itemsHeading}
        </h5>
        <div className="aid-zakat-form__table-wrap">
          <table className="aid-zakat-form__table">
            <thead>
              <tr>
                <th style={{ width: '4rem' }}>{t.sr}</th>
                <th>{t.itemName}</th>
                <th style={{ width: '7rem' }}>{t.qty}</th>
              </tr>
            </thead>
            <tbody>
              {items.map((row, idx) => (
                <tr key={row.key || idx}>
                  <td>{idx + 1}</td>
                  <td>{lang === 'ur' ? row.name_ur : row.name_en}</td>
                  <td>
                    {readOnly ? (
                      row.qty
                    ) : (
                      <input
                        type="number"
                        min="0"
                        className="aid-zakat-form__amount"
                        value={row.qty ?? ''}
                        onChange={(e) => updateQty(idx, e.target.value)}
                      />
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <div className="aid-consent-form__body aid-marriage-gift-consent__declaration">
        <h5 className="aid-wheelchair-consent__section-title">
          {t.applicantHeading}
        </h5>
        <div className="aid-zakat-form__meta form-grid-2">
          <FormInput
            label={t.applicantName}
            value={details.applicant_name || ''}
            onChange={(e) => patch({ applicant_name: e.target.value })}
            readOnly={readOnly}
          />
          <FormInput
            label={t.parentage}
            value={details.parentage_or_spouse || ''}
            onChange={(e) => patch({ parentage_or_spouse: e.target.value })}
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
            label={t.appNo}
            value={applicationNo || details.application_no || ''}
            onChange={(e) => patch({ application_no: e.target.value })}
            readOnly={readOnly || !!applicationNo}
            placeholder={applicationNo ? undefined : '—'}
          />
          <FormSelect
            label={t.relation}
            value={details.relation_to_bride || 'daughter'}
            onChange={(e) => patch({ relation_to_bride: e.target.value })}
            options={RELATION_OPTIONS[lang]}
            disabled={readOnly}
          />
        </div>

        <p className="aid-marriage-gift-consent__story">
          {t.declarationBefore}{' '}
          <strong>{details.applicant_name || '________'}</strong>{' '}
          {t.declarationMid1}{' '}
          <strong>{details.parentage_or_spouse || '________'}</strong>{' '}
          {t.declarationMid2}{' '}
          <strong>
            {formatCnicInput(details.applicant_cnic || '') || '________'}
          </strong>{' '}
          {t.declarationMid3}{' '}
          <strong>
            {applicationNo || details.application_no || '________'}
          </strong>{' '}
          {t.declarationMid4}{' '}
          <strong>{relationLabel}</strong>
          {t.declarationMid5}
        </p>
        <p>{t.promise}</p>
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

      <p className="aid-consent-form__sign-heading">{t.receiverSign}</p>
      <p className="aid-zakat-form__device-hint">{t.deviceHint}</p>
      {deviceMsg ? (
        <p className="aid-zakat-form__device-msg">{deviceMsg}</p>
      ) : null}

      <div className="aid-zakat-form__signs">
        <AidBiometricCaptureSlot
          kind="thumb"
          label={t.thumb}
          value={details.receiver_thumb}
          readOnly={readOnly}
          busy={busyKey === 'receiver_thumb'}
          labels={slotLabels}
          allowUpload={false}
          onCapture={() => runCapture('receiver_thumb', 'thumb', 'secugen')}
          onClear={() => patch({ receiver_thumb: null })}
        />
        <AidBiometricCaptureSlot
          kind="signature"
          label={t.sign}
          value={details.receiver_signature}
          readOnly={readOnly}
          busy={busyKey === 'receiver_signature'}
          labels={slotLabels}
          allowUpload={false}
          onCapture={() =>
            runCapture('receiver_signature', 'signature', 'epad_vp9801')
          }
          onClear={() => patch({ receiver_signature: null })}
        />
      </div>

      <div className="aid-marriage-gift-consent__footer-meta">
        <span className="aid-marriage-gift-consent__org">{t.orgLabel}</span>
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

export default AidMarriageGiftConsentForm;
