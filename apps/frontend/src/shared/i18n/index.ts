import i18n from "i18next";

import { initReactI18next } from "react-i18next";
import yardEn from "../../locales/en/yard.json";

import yardVi from "../../locales/vi/yard.json";

import inventoryEn from "../../locales/en/inventory.json";

import inventoryVi from "../../locales/vi/inventory.json";

import operationalEn from "../../locales/en/operational.json";
import operationalVi from "../../locales/vi/operational.json";

import commonEn from "../../locales/en/common.json";
import commonVi from "../../locales/vi/common.json";
i18n.use(initReactI18next).init({
  lng: "vi",

  fallbackLng: "en",

  interpolation: {
    escapeValue: false,
  },

  resources: {
  en: {
    inventory: inventoryEn,
    yard: yardEn,
    operational: operationalEn,
    common: commonEn,
  },

  vi: {
    inventory: inventoryVi,
    yard: yardVi,
    operational: operationalVi,
    common: commonVi,
  },
},
});

export default i18n;
