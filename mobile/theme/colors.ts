// Paleta inspirada na fruta manga: laranja maduro, amarelo-dourado e verde-folha.
// Usada pelo ThemeContext para alternar entre modo claro e escuro.

export type ThemeColors = {
  background: string;
  backgroundAlt: string;
  card: string;
  cardAlt: string;
  border: string;
  borderStrong: string;
  textPrimary: string;
  textSecondary: string;
  textMuted: string;
  accent: string;
  accentLight: string;
  accentSoft: string;
  onAccent: string;
  gold: string;
  success: string;
  successSoft: string;
  successText: string;
  danger: string;
  dangerSoft: string;
  dangerText: string;
  overlay: string;
};

export const lightColors: ThemeColors = {
  background: '#FFF8F1',
  backgroundAlt: '#FDF1E6',
  card: '#FFFFFF',
  cardAlt: '#FFF6EE',
  border: '#F1E2D3',
  borderStrong: '#E7D2BC',
  textPrimary: '#2A1E14',
  textSecondary: '#7C6A5A',
  textMuted: '#A99684',
  accent: '#E35202',
  accentLight: '#F89109',
  accentSoft: '#FFF1E4',
  onAccent: '#FFFFFF',
  gold: '#F4B400',
  success: '#6F8C2F',
  successSoft: '#EEF4DD',
  successText: '#4E6420',
  danger: '#C62828',
  dangerSoft: '#FDECEA',
  dangerText: '#B23030',
  overlay: 'rgba(20, 12, 4, 0.45)',
};

export const darkColors: ThemeColors = {
  background: '#17100A',
  backgroundAlt: '#1F160D',
  card: '#241A0F',
  cardAlt: '#2E2113',
  border: '#3D2C1A',
  borderStrong: '#4A3725',
  textPrimary: '#FBEFE2',
  textSecondary: '#C2AC95',
  textMuted: '#8C7A68',
  accent: '#FF8C2B',
  accentLight: '#FFB347',
  accentSoft: '#3A2914',
  onAccent: '#1A1006',
  gold: '#FFC83D',
  success: '#A6C04F',
  successSoft: '#2A3015',
  successText: '#C7DA7E',
  danger: '#FF6B6B',
  dangerSoft: '#3A1E1E',
  dangerText: '#FF9B9B',
  overlay: 'rgba(0, 0, 0, 0.6)',
};
