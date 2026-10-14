import type { MantineColorsTuple } from '@mantine/core';

/**
 * Default theme tokens. Change these constants (and the matching palettes
 * below) to rebrand. Keep WCAG AA contrast — see `contrast.test.ts`.
 * Languages and this default theme are configurable.
 */
export const BRAND = '#A99BE0';
export const SUCCESS = '#A8E6CF';
export const DARK_BACKGROUND = '#1E1A2E';

export const brand: MantineColorsTuple = [
  '#F8F5FC',
  '#EEE7F8',
  '#DED3F2',
  '#C4B6E8',
  BRAND,
  '#8B76D0',
  '#6A54B5',
  '#544194',
  '#423474',
  '#2E2452',
];

export const success: MantineColorsTuple = [
  '#F3FBF8',
  '#DFF5EC',
  '#C5EDDC',
  SUCCESS,
  '#7DD4B3',
  '#4EBE94',
  '#2F9A74',
  '#247A5C',
  '#1C5E47',
  '#144533',
];

export const neutral: MantineColorsTuple = [
  '#F4F0FA',
  '#E3DDEC',
  '#C6BED8',
  '#A79DBE',
  '#7D7396',
  '#564D72',
  '#3A3454',
  '#2A2540',
  DARK_BACKGROUND,
  '#141022',
];

export const themeTokens = {
  light: {
    body: brand[0],
    paper: '#FFFFFF',
    text: neutral[8],
    dimmed: '#5A5470',
    primaryFilled: brand[6],
    primaryFilledText: '#FFFFFF',
    successBackground: success[1],
    successText: success[7],
    accent: BRAND,
    successAccent: SUCCESS,
  },
  dark: {
    body: DARK_BACKGROUND,
    paper: neutral[7],
    text: neutral[0],
    dimmed: neutral[2],
    primaryFilled: brand[6],
    primaryFilledText: '#FFFFFF',
    successBackground: '#1F4A3A',
    successText: '#C8F5E4',
    accent: '#C4B6E8',
    successAccent: '#C5EDDC',
  },
} as const;

export const MANTINE_RED_1 = '#ffe3e3';
export const MANTINE_RED_9 = '#c92a2a';

export const renderedLightBadges = {
  success: {
    color: success[7],
    background: success[1],
  },
  red: {
    color: MANTINE_RED_9,
    background: MANTINE_RED_1,
  },
} as const;
