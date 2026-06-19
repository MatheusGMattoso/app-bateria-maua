import Constants from 'expo-constants';

// 1. Busca a URL de produção na variável de ambiente (que vamos configurar na Vercel).
// Se estiver rodando no seu PC, isso aqui será 'undefined'.
const URL_PRODUCAO = process.env.EXPO_PUBLIC_API_URL;

// 2. Sua lógica para descobrir o IP dinâmico para o Expo Go no celular físico (mantida!)
const expoHost = Constants.expoConfig?.hostUri?.split(':')[0];
const IP_LOCAL =
  expoHost && expoHost !== '127.0.0.1' && expoHost !== 'localhost'
    ? expoHost
    : process.env.EXPO_PUBLIC_API_HOST || 'localhost';

const URL_LOCAL = `http://${IP_LOCAL}:3000/api`;

// 3. A MÁGICA ACONTECE AQUI:
// Se URL_PRODUCAO tiver conteúdo (Vercel), usa a nuvem.
// Se não tiver (Seu notebook), cai pro local automaticamente.
export const BASE_URL = URL_PRODUCAO || URL_LOCAL;