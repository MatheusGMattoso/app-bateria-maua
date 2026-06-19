import Constants from 'expo-constants';
import { Platform } from 'react-native';

const URL_PRODUCAO = 'https://app-bateria-maua.onrender.com/api';

let usarNuvem = false;

if (Platform.OS === 'web') {
  if (typeof window === 'undefined') {
    usarNuvem = true;
  } else if (window.location.hostname !== 'localhost' && window.location.hostname !== '127.0.0.1') {
    usarNuvem = true;
  }
} else {
  usarNuvem = !__DEV__;
}

const expoHost = Constants.expoConfig?.hostUri?.split(':')[0];
const envHost = process.env.EXPO_PUBLIC_API_HOST;

const IP_LOCAL =
  expoHost && expoHost !== '127.0.0.1' && expoHost !== 'localhost'
    ? expoHost
    : envHost || 'localhost';

const URL_LOCAL = `http://${IP_LOCAL}:3000/api`;

export const BASE_URL = usarNuvem ? URL_PRODUCAO : URL_LOCAL;