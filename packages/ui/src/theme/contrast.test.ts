import { DEFAULT_THEME, mergeMantineTheme } from '@mantine/core';
import { describe, expect, it } from 'vitest';
import { defaultTheme } from './app-theme';
import { brand, renderedLightBadges, success, themeTokens } from './colors';
import { contrastRatio, meetsWcagAaText, meetsWcagAaUi } from './contrast';

const theme = mergeMantineTheme(DEFAULT_THEME, defaultTheme);

function resolvedLightBadge(color: 'success' | 'red'): {
  color: string;
  background: string;
} {
  const resolved = theme.variantColorResolver({
    color,
    theme,
    variant: 'light',
  });

  return {
    color: resolved.color,
    background: resolved.background,
  };
}

describe('default theme contrast', () => {
  it('meets WCAG AA for light-theme body and dimmed text', () => {
    expect(
      meetsWcagAaText(themeTokens.light.text, themeTokens.light.body)
    ).toBe(true);
    expect(
      meetsWcagAaText(themeTokens.light.dimmed, themeTokens.light.body)
    ).toBe(true);
  });

  it('meets WCAG AA for the light badges Mantine actually renders', () => {
    const successBadge = resolvedLightBadge('success');
    const redBadge = resolvedLightBadge('red');

    expect(successBadge).toEqual(renderedLightBadges.success);
    expect(redBadge).toEqual(renderedLightBadges.red);
    expect(successBadge.color).toBe(success[7]);
    expect(successBadge.color).not.toBe(success[6]);

    expect(meetsWcagAaText(successBadge.color, successBadge.background)).toBe(
      true
    );
    expect(meetsWcagAaText(redBadge.color, redBadge.background)).toBe(true);
    expect(
      contrastRatio(successBadge.color, successBadge.background)
    ).toBeGreaterThan(contrastRatio(success[6], success[1]));
  });

  it('meets WCAG AA for light-theme primary buttons', () => {
    expect(
      meetsWcagAaText(
        themeTokens.light.primaryFilledText,
        themeTokens.light.primaryFilled
      )
    ).toBe(true);
    expect(
      meetsWcagAaUi(themeTokens.light.primaryFilled, themeTokens.light.body)
    ).toBe(true);
  });

  it('meets WCAG AA for dark-theme body, dimmed text, and accents', () => {
    expect(meetsWcagAaText(themeTokens.dark.text, themeTokens.dark.body)).toBe(
      true
    );
    expect(
      meetsWcagAaText(themeTokens.dark.dimmed, themeTokens.dark.body)
    ).toBe(true);
    expect(
      meetsWcagAaText(
        themeTokens.dark.primaryFilledText,
        themeTokens.dark.primaryFilled
      )
    ).toBe(true);
    expect(
      meetsWcagAaText(
        themeTokens.dark.successText,
        themeTokens.dark.successBackground
      )
    ).toBe(true);
    expect(meetsWcagAaUi(themeTokens.dark.accent, themeTokens.dark.body)).toBe(
      true
    );
    expect(
      meetsWcagAaUi(themeTokens.dark.successAccent, themeTokens.dark.body)
    ).toBe(true);
  });

  it('keeps the default brand swatch as a recognizable mid-scale color', () => {
    expect(brand[4]).toBe('#A99BE0');
    expect(contrastRatio('#FFFFFF', brand[6])).toBeGreaterThanOrEqual(4.5);
  });
});
