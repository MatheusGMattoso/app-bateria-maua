// Paleta oficial da Bateria Mauá (Clube da Manga), conforme o Manual de Identidade.
// Cores-base: laranja #F89109, laranja-queimado #E35202, vermelho #AA0001,
// verde-oliva #7A8836, cinza #4B4A4A, preto #000000 e branco #FDFDFD.
// O manual não possui tom dourado/amarelo nem marrom (este último deve ser evitado
// em gradientes), por isso os destaques usam exclusivamente os laranjas da paleta.

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

// Cores cruas da paleta — referência única para todo o app.
export const brandPalette = {
  orange: '#F89109',
  orangeBurnt: '#E35202',
  red: '#AA0001',
  green: '#7A8836',
  gray: '#4B4A4A',
  black: '#000000',
  white: '#FDFDFD',
} as const;

export const lightColors: ThemeColors = {
  background: '#FFF8F1',
  backgroundAlt: '#FDF1E6',
  card: '#FDFDFD',
  cardAlt: '#FFF4E9',
  border: '#F0E1D1',
  borderStrong: '#E6D0BA',
  textPrimary: '#1F1A16',
  textSecondary: '#6B5B4E',
  textMuted: '#A2917F',
  accent: '#E35202',
  accentLight: '#F89109',
  accentSoft: '#FFEEDD',
  onAccent: '#FDFDFD',
  gold: '#F89109',
  success: '#7A8836',
  successSoft: '#EEF1DC',
  successText: '#5A6627',
  danger: '#AA0001',
  dangerSoft: '#FBE7E7',
  dangerText: '#AA0001',
  overlay: 'rgba(20, 12, 4, 0.45)',
};

export const darkColors: ThemeColors = {
  background: '#161210',
  backgroundAlt: '#1F1813',
  card: '#221A14',
  cardAlt: '#2C2118',
  border: '#3A2C20',
  borderStrong: '#4B4A4A',
  textPrimary: '#FDFDFD',
  textSecondary: '#C4B3A4',
  textMuted: '#8C7A6A',
  accent: '#F89109',
  accentLight: '#FBA63A',
  accentSoft: '#3A2614',
  onAccent: '#161210',
  gold: '#F89109',
  success: '#9DAE4C',
  successSoft: '#262B14',
  successText: '#C2D178',
  danger: '#E5484D',
  dangerSoft: '#3A1717',
  dangerText: '#F38B8E',
  overlay: 'rgba(0, 0, 0, 0.6)',
};
