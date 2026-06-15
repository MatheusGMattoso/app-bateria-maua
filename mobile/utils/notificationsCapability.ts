import Constants from 'expo-constants';
import { Platform } from 'react-native';

/** Lembretes locais agendados (ensaio, PAE, etc.). */
export function notificationsSupported(): boolean {
  return Platform.OS !== 'web';
}

/** Push remoto via Expo — indisponível no Expo Go (SDK 53+). */
export function pushNotificationsSupported(): boolean {
  return Constants.appOwnership !== 'expo';
}
