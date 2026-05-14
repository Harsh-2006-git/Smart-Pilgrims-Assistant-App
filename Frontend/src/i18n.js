import i18n from "i18next";
import { initReactI18next } from "react-i18next";
import LanguageDetector from "i18next-browser-languagedetector";

// Import translation files
import en from "./locales/en/translation.json";
import hi from "./locales/hi/translation.json";
import mr from "./locales/mr/translation.json";
import gu from "./locales/gu/translation.json";
import ta from "./locales/ta/translation.json";
import te from "./locales/te/translation.json";
import bn from "./locales/bn/translation.json";
import kn from "./locales/kn/translation.json";
import ml from "./locales/ml/translation.json";
import pa from "./locales/pa/translation.json";
import ur from "./locales/ur/translation.json";
import or from "./locales/or/translation.json";

i18n
  .use(LanguageDetector)
  .use(initReactI18next)
  .init({
    resources: {
      en: { translation: en },
      hi: { translation: hi },
      mr: { translation: mr },
      gu: { translation: gu },
      ta: { translation: ta },
      te: { translation: te },
      bn: { translation: bn },
      kn: { translation: kn },
      ml: { translation: ml },
      pa: { translation: pa },
      ur: { translation: ur },
      or: { translation: or },
    },
    fallbackLng: "en",
    detection: {
      order: ["localStorage", "navigator"],
      lookupLocalStorage: "i18n_lang",
      caches: ["localStorage"],
    },
    interpolation: {
      escapeValue: false, // React already escapes values
    },
  });

export default i18n;
