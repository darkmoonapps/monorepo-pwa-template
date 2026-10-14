import type { Resource } from 'i18next';
import enAuth from './locales/en/auth.json';
import enCommon from './locales/en/common.json';
import enExample from './locales/en/example.json';
import enValidation from './locales/en/validation.json';
import heAuth from './locales/he/auth.json';
import heCommon from './locales/he/common.json';
import heExample from './locales/he/example.json';
import heValidation from './locales/he/validation.json';

export const defaultNS = 'common' as const;

export const i18nResources = {
  he: {
    common: heCommon,
    example: heExample,
    auth: heAuth,
    validation: heValidation,
  },
  en: {
    common: enCommon,
    example: enExample,
    auth: enAuth,
    validation: enValidation,
  },
} as const satisfies Resource;
