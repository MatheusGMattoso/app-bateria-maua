import Constants from 'expo-constants';

const URL_PRODUCAO = 'https://app-bateria-maua.onrender.com/api';

const expoHost = Constants.expoConfig?.hostUri?.split(':')[0];
const envHost = process.env.EXPO_PUBLIC_API_HOST;

const IP_LOCAL =
  expoHost && expoHost !== '127.0.0.1' && expoHost !== 'localhost'
    ? expoHost
    : envHost || 'localhost';

const URL_LOCAL = `http://${IP_LOCAL}:3000/api`;

export const BASE_URL = __DEV__ ? URL_LOCAL : URL_PRODUCAO;