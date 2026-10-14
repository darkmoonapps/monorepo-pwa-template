import {
  createTheme,
  type CSSVariablesResolver,
  type MantineTheme,
} from '@mantine/core';
import { COLOR_SCHEME_STORAGE_KEY } from '@app/shared';
import {
  brand,
  neutral,
  renderedLightBadges,
  success,
  themeTokens,
} from './colors';
import { variantColorResolver } from './variant-colors';

export { COLOR_SCHEME_STORAGE_KEY };

export const defaultTheme = createTheme({
  primaryColor: 'brand',
  colors: {
    brand,
    success,
    dark: neutral,
  },
  variantColorResolver,
  primaryShade: { light: 6, dark: 6 },
  defaultRadius: 'md',
  cursorType: 'pointer',
  fontFamily:
    'system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',
  headings: {
    fontFamily:
      'system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',
  },
  white: themeTokens.light.paper,
  black: themeTokens.light.text,
  other: {
    brand: {
      primary: brand[4],
      success: success[3],
      dark: neutral[8],
    },
    semantic: {
      success: 'success',
      accent: 'brand',
    },
  },
});

/** @deprecated Use `defaultTheme` — kept as an alias for existing imports. */
export const appTheme = defaultTheme;

export const cssVariablesResolver: CSSVariablesResolver = (
  theme: MantineTheme
) => ({
  variables: {
    '--app-brand': theme.other.brand.primary,
    '--app-success': theme.other.brand.success,
    '--app-neutral': theme.other.brand.dark,
  },
  light: {
    '--mantine-color-body': themeTokens.light.body,
    '--mantine-color-text': themeTokens.light.text,
    '--mantine-color-dimmed': themeTokens.light.dimmed,
    '--mantine-color-default': themeTokens.light.paper,
    '--mantine-color-anchor': theme.colors.brand[7],
    '--mantine-color-success-light': renderedLightBadges.success.background,
    '--mantine-color-success-light-color': renderedLightBadges.success.color,
    '--mantine-color-red-light': renderedLightBadges.red.background,
    '--mantine-color-red-light-color': renderedLightBadges.red.color,
  },
  dark: {
    '--mantine-color-body': themeTokens.dark.body,
    '--mantine-color-text': themeTokens.dark.text,
    '--mantine-color-dimmed': themeTokens.dark.dimmed,
    '--mantine-color-default': themeTokens.dark.paper,
    '--mantine-color-default-hover': theme.colors.dark[6],
    '--mantine-color-default-border': theme.colors.dark[4],
    '--mantine-color-anchor': theme.colors.brand[3],
  },
});
