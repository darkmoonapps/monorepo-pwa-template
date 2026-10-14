import '@mantine/core';

declare module '@mantine/core' {
  interface MantineThemeOther {
    brand: {
      primary: string;
      success: string;
      dark: string;
    };
    semantic: {
      success: 'success';
      accent: 'brand';
    };
  }
}
