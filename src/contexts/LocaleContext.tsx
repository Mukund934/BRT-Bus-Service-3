/**
 * Which language the interface is in.
 *
 * Device-scoped rather than account-scoped, deliberately. Somebody reads a bus
 * timetable on the phone in their hand, often before signing in and often
 * without ever signing in - tying the choice to an account would lose it for
 * exactly the passengers most likely to want it.
 *
 * The chosen locale is written to `<html lang>`, which is not decoration: it
 * is what tells a screen reader which voice to use. Hindi read aloud by an
 * English synthesiser is not accented, it is unintelligible.
 */

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import { STORAGE_KEYS } from "@/constants/config";
import {
  isLocale,
  preferredLocale,
  translate,
  type Locale,
  type TranslationKey,
} from "@/domain/i18n/strings";

interface LocaleValue {
  locale: Locale;
  setLocale: (next: Locale) => void;
  t: (key: TranslationKey) => string;
}

const LocaleContext = createContext<LocaleValue>({
  locale: "en",
  setLocale: () => {},
  t: (key) => translate("en", key),
});

/**
 * The locale to start in.
 *
 * A previous choice wins over the browser's preference - it was made
 * deliberately, and overriding it would mean a passenger re-choosing on every
 * visit. Storage can throw in a private window, so it is guarded rather than
 * assumed.
 */
const initialLocale = (): Locale => {
  try {
    const stored = localStorage.getItem(STORAGE_KEYS.LOCALE);

    if (isLocale(stored)) return stored;
  } catch {
    /* A device that refuses storage still gets a language. */
  }

  return preferredLocale(
    typeof navigator === "undefined" ? [] : (navigator.languages ?? [])
  );
};

export const LocaleProvider = ({ children }: { children: ReactNode }) => {
  const [locale, setLocaleState] = useState<Locale>(initialLocale);

  /*
    Written to the document rather than only to React state. `lang` drives
    screen-reader pronunciation and the browser's own translation offer, and
    neither reads component state.
  */
  useEffect(() => {
    document.documentElement.lang = locale;
  }, [locale]);

  const setLocale = useCallback((next: Locale) => {
    setLocaleState(next);

    try {
      localStorage.setItem(STORAGE_KEYS.LOCALE, next);
    } catch {
      /* The choice still applies to this session; it just will not persist. */
    }
  }, []);

  const value = useMemo<LocaleValue>(
    () => ({ locale, setLocale, t: (key) => translate(locale, key) }),
    [locale, setLocale]
  );

  return (
    <LocaleContext.Provider value={value}>{children}</LocaleContext.Provider>
  );
};

/** The interface language, and the function that renders copy in it. */
export const useTranslation = (): LocaleValue => useContext(LocaleContext);
