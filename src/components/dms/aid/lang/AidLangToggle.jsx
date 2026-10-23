import React from 'react';
import { useAidLang } from './AidLangContext';

/** Compact اردو / English control for Aid intake. */
const AidLangToggle = ({ className = '' }) => {
  const { lang, setLang } = useAidLang();

  return (
    <div
      className={`aid-lang-toggle${className ? ` ${className}` : ''}`}
      role="group"
      aria-label="Language"
    >
      <button
        type="button"
        className={`aid-zakat-form__lang-btn${lang === 'ur' ? ' is-active' : ''}`}
        onClick={() => setLang('ur')}
        aria-pressed={lang === 'ur'}
      >
        اردو
      </button>
      <button
        type="button"
        className={`aid-zakat-form__lang-btn${lang === 'en' ? ' is-active' : ''}`}
        onClick={() => setLang('en')}
        aria-pressed={lang === 'en'}
      >
        English
      </button>
    </div>
  );
};

export default AidLangToggle;
