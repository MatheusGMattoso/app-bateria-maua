import Constants from 'expo-constants';

// =============================================================================
// CHECKLIST DE APRESENTAÇÃO ACADÊMICA
// -----------------------------------------------------------------------------
// 1. Suba o backend antes da demo:        cd backend && npm start
// 2. Demo em celular físico:              USAR_NUVEM = false e confira o IP da
//                                         rede (use o script `npm run start:lan`).
// 3. Demo pela nuvem:                     USAR_NUVEM = true e garanta que o
//                                         deploy do Render está atualizado com a
//                                         branch `main`.
// 4. Reinicie o backend após qualquer     (evita erro 404 em rotas novas e o
//    `git pull`.                          alerta "Servidor indisponível").
// 5. Deixe 1 evento e 1 membro de teste   já cadastrados antes de apresentar.
// 6. Fluxo de demo: Welcome -> Login ->   Dashboard -> Membros / Calendário /
//                                         Presença.
// =============================================================================

// Detecta automaticamente se está rodando em produção (Vercel/Render) ou no seu PC
const USAR_NUVEM = process.env.NODE_ENV === 'production';

const URL_PRODUCAO = 'https://app-bateria-maua.onrender.com/api';

const expoHost = Constants.expoConfig?.hostUri?.split(':')[0];
const envHost = process.env.EXPO_PUBLIC_API_HOST;

const IP_LOCAL =
  expoHost && expoHost !== '127.0.0.1' && expoHost !== 'localhost'
    ? expoHost
    : envHost || 'localhost';

const URL_LOCAL = `http://${IP_LOCAL}:3000/api`;

export const BASE_URL = USAR_NUVEM ? URL_PRODUCAO : URL_LOCAL;