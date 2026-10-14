import type { Resource } from 'i18next';
import enAuth from './locales/en/auth.json';
import enCommon from './locales/en/common.json';
import enItems from './locales/en/items.json';
import enValidation from './locales/en/validation.json';
import heAuth from './locales/he/auth.json';
import heCommon from './locales/he/common.json';
import heItems from './locales/he/items.json';
import heValidation from './locales/he/validation.json';

export const defaultNS = 'common' as const;

export const i18nResources = {
  he: {
    common: heCommon,
    items: heItems,
    auth: heAuth,
    validation: heValidation,
  },
  en: {
    common: enCommon,
    items: enItems,
    auth: enAuth,
    validation: enValidation,
  },
} as const satisfies Resource;
