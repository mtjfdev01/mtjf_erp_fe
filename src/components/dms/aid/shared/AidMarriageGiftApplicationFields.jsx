import React, { useMemo } from 'react';
import FormInput from '../../../common/FormInput';
import FormSelect from '../../../common/FormSelect';
import FormTextarea from '../../../common/FormTextarea';
import { AID_YES_NO, emptyMarriageGiftItem } from '../aidConstants';
import { useAidLang } from '../lang/AidLangContext';
import { aidOptionsForLang } from '../lang/aidUiCopy';

/**
 * Marriage Gift aid type — Application tab special structure
 */
const AidMarriageGiftApplicationFields = ({
  value,
  onChange,
  readOnly = false,
}) => {
  const { t, lang } = useAidLang();
  const dash = t('dash');
  const yesNoOptions = useMemo(
    () => aidOptionsForLang(AID_YES_NO, lang),
    [lang],
  );
  const details = value || {};
  const items = details.items?.length
    ? details.items
    : readOnly
      ? []
      : [emptyMarriageGiftItem('Paiti set')];
  const alreadyMarried = details.already_married_nikah === 'yes';

  const patch = (partial) => {
    if (readOnly || !onChange) return;
    onChange({ ...details, ...partial });
  };

  const updateItem = (idx, name) => {
    patch({
      items: items.map((row, i) => (i === idx ? { ...row, name } : row)),
    });
  };

  if (readOnly) {
    const namedItems = items.map((r) => r.name).filter(Boolean);
    const hasAny =
      details.date_of_marriage ||
      details.already_married_nikah ||
      details.bride_groom_relationship ||
      details.earlier_children_marriage_expenses ||
      namedItems.length ||
      details.others;
    if (!hasAny) return null;

    return (
      <div className="aid-marriage-gift-application" style={{ marginTop: 12 }}>
        <div className="aid-family-panel">
          <h4 className="aid-family-panel__title">{t('marriageGift')}</h4>
          <p style={{ fontSize: 13, color: '#64748b', margin: '4px 0 0' }}>
            {t('dateOfMarriage')}: {details.date_of_marriage || dash}
          </p>
          <p style={{ fontSize: 13, color: '#64748b', margin: '4px 0 0' }}>
            {t('alreadyMarriedRo')}{' '}
            {details.already_married_nikah === 'yes'
              ? `${t('yes')}${details.nikah_date ? ` · ${details.nikah_date}` : ''}`
              : details.already_married_nikah === 'no'
                ? t('no')
                : dash}
          </p>
          {details.bride_groom_relationship && (
            <p style={{ fontSize: 13, margin: '8px 0 0' }}>
              <strong>{t('brideGroomRelationshipRo')}</strong>{' '}
              {details.bride_groom_relationship}
            </p>
          )}
          {details.earlier_children_marriage_expenses && (
            <p style={{ fontSize: 13, margin: '4px 0 0' }}>
              <strong>{t('earlierChildrenRo')}</strong>{' '}
              {details.earlier_children_marriage_expenses}
            </p>
          )}
          {namedItems.length > 0 && (
            <p style={{ fontSize: 13, margin: '8px 0 0' }}>
              <strong>{t('availableItemsRo')}</strong> {namedItems.join(', ')}
            </p>
          )}
          {details.others && (
            <p style={{ fontSize: 13, margin: '4px 0 0' }}>
              <strong>{t('others')}:</strong> {details.others}
            </p>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="aid-marriage-gift-application">
      <div className="aid-family-panel" style={{ marginTop: 12 }}>
        <h4 className="aid-family-panel__title">{t('marriageGift')}</h4>
        <div className="form-grid-2">
          <FormInput
            label={t('dateOfMarriage')}
            type="date"
            value={details.date_of_marriage || ''}
            onChange={(e) => patch({ date_of_marriage: e.target.value })}
          />
          <FormSelect
            label={t('alreadyMarried')}
            value={details.already_married_nikah || ''}
            onChange={(e) => {
              const next = e.target.value;
              patch({
                already_married_nikah: next,
                ...(next !== 'yes' ? { nikah_date: '' } : {}),
              });
            }}
            options={[{ value: '', label: dash }, ...yesNoOptions]}
          />
          {alreadyMarried && (
            <FormInput
              label={t('ifYesNikahDate')}
              type="date"
              value={details.nikah_date || ''}
              onChange={(e) => patch({ nikah_date: e.target.value })}
            />
          )}
        </div>
        <FormTextarea
          label={t('brideGroomRelationship')}
          value={details.bride_groom_relationship || ''}
          onChange={(e) =>
            patch({ bride_groom_relationship: e.target.value })
          }
          rows={2}
        />
        <FormTextarea
          label={t('earlierChildrenMarriageExpenses')}
          value={details.earlier_children_marriage_expenses || ''}
          onChange={(e) =>
            patch({ earlier_children_marriage_expenses: e.target.value })
          }
          rows={2}
        />
      </div>

      <div className="aid-family-panel" style={{ marginTop: 12 }}>
        <div className="aid-family-panel__head">
          <h4 className="aid-family-panel__title">
            {t('availableItemsMarriage')}
          </h4>
          <button
            type="button"
            className="aid-mini-btn aid-mini-btn--add"
            onClick={() =>
              patch({ items: [...items, emptyMarriageGiftItem()] })
            }
          >
            {t('addShort')}
          </button>
        </div>
        <div className="aid-children-list">
          {items.map((row, idx) => (
            <div key={`mg-item-${idx}`} className="aid-child-card">
              <div className="aid-repeat-item__head">
                <div className="aid-child-card__title">
                  {t('itemN', { n: idx + 1 })}
                </div>
                {items.length > 1 && (
                  <button
                    type="button"
                    className="aid-mini-btn aid-mini-btn--remove"
                    onClick={() =>
                      patch({ items: items.filter((_, i) => i !== idx) })
                    }
                  >
                    {t('remove')}
                  </button>
                )}
              </div>
              <FormInput
                label={t('itemName')}
                value={row.name || ''}
                onChange={(e) => updateItem(idx, e.target.value)}
                placeholder={idx === 0 ? 'Paiti set' : t('itemName')}
              />
            </div>
          ))}
        </div>
        <FormTextarea
          label={t('others')}
          value={details.others || ''}
          onChange={(e) => patch({ others: e.target.value })}
          rows={2}
          placeholder={t('othersPlaceholder')}
        />
      </div>
    </div>
  );
};

export default AidMarriageGiftApplicationFields;
