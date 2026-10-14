import { Card, Group, Stack } from '@mantine/core';
import type { Meta, StoryObj } from '@storybook/react';
import { AppBadge, AppButton, AppText, AppTitle } from '../atoms';
import { AppThemeProvider } from './app-theme-provider';
import { BRAND, DARK_BACKGROUND, SUCCESS } from './colors';

const meta: Meta = {
  title: 'Theme/Default',
};

export default meta;

type Story = StoryObj;

function ThemePreview({ title }: { title: string }): JSX.Element {
  return (
    <Card withBorder padding="lg" radius="md">
      <Stack gap="md">
        <AppTitle order={3}>{title}</AppTitle>
        <AppText>
          Default theme primary {BRAND} with success {SUCCESS}. Change tokens in
          colors.ts to rebrand. Languages and theme are configurable.
        </AppText>
        <Group>
          <AppButton>Primary action</AppButton>
          <AppButton variant="light">Secondary</AppButton>
          <AppBadge color="success" variant="light">
            Success
          </AppBadge>
          <AppBadge color="brand" variant="light">
            Brand
          </AppBadge>
        </Group>
        <AppText c="dimmed" size="sm">
          Dark background token {DARK_BACKGROUND} is used in dark mode.
        </AppText>
      </Stack>
    </Card>
  );
}

export const LightDefault: Story = {
  name: 'Light — Default',
  render: () => <ThemePreview title="Default" />,
};

export const DarkNeutral: Story = {
  name: 'Dark',
  globals: { theme: 'dark' },
  render: () => <ThemePreview title="Dark" />,
};

export const BothThemes: Story = {
  name: 'Light and dark side by side',
  render: () => (
    <Group align="stretch" grow>
      <AppThemeProvider forceColorScheme="light">
        <ThemePreview title="Default" />
      </AppThemeProvider>
      <AppThemeProvider forceColorScheme="dark">
        <ThemePreview title="Dark" />
      </AppThemeProvider>
    </Group>
  ),
};
