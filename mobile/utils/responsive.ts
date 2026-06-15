import { useWindowDimensions } from 'react-native';

export function useResponsive() {
  const { width, height } = useWindowDimensions();

  const isSmall = width < 380;
  const isMedium = width >= 380 && width < 768;

  return {
    width,
    height,
    isSmall,
    isMedium,
    isLarge: width >= 768,
    screenPadding: isSmall ? 16 : isMedium ? 20 : 24,
    gap: isSmall ? 8 : 12,
  };
}

export function abreviarPerfil(perfil: string) {
  if (perfil === 'Administrador') return 'Admin';
  if (perfil === 'Gestor de Módulo') return 'Gestor';
  return perfil;
}
