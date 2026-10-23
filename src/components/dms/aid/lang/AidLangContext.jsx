import React, {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
} from 'react';
import { AID_UI_COPY, formatAidCopy } from './aidUiCopy';

const STORAGE_KEY = 'aid.ui.lang';

const defaultT = (key, vars) => {
  const raw = AID_UI_COPY.en[key] ?? key;
  return vars ? formatAidCopy(raw, vars) : raw;
};

const AidLangContext = createContext({
  lang: 'en',
  setLang: () => {},
  t: defaultT,
  rtl: false,
});

const readStoredLang = () => {
  try {
    const v = localStorage.getItem(STORAGE_KEY);
    if (v === 'ur' || v === 'en') return v;
  } catch {
    /* ignore */
  }
  return 'en';
};

export const AidLangProvider = ({ children, defaultLang }) => {
  const [lang, setLangState] = useState(
    () => defaultLang || readStoredLang(),
  );

  const setLang = useCallback((next) => {
    const v = next === 'ur' ? 'ur' : 'en';
    setLangState(v);
    try {
      localStorage.setItem(STORAGE_KEY, v);
    } catch {
      /* ignore */
    }
  }, []);

  const t = useCallback(
    (key, vars) => {
      const dict = AID_UI_COPY[lang] || AID_UI_COPY.en;
      const fallback = AID_UI_COPY.en[key];
      const raw = dict[key] ?? fallback ?? key;
      return vars ? formatAidCopy(raw, vars) : raw;
    },
    [lang],
  );

  const value = useMemo(
    () => ({
      lang,
      setLang,
      t,
      rtl: lang === 'ur',
    }),
    [lang, setLang, t],
  );

  return (
    <AidLangContext.Provider value={value}>{children}</AidLangContext.Provider>
  );
};

export const useAidLang = () => useContext(AidLangContext);

export default AidLangContext;
