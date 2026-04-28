const { spawn } = require('child_process');
const { syncLanEnvFile } = require('./update-lan-ip');

const env = { ...process.env };
let lanIp = null;

try {
  const result = syncLanEnvFile();
  lanIp = result.lanIp;
  Object.assign(env, result.envVars);
  console.log(`[expo-start] Usando IP LAN: ${lanIp}`);
  console.log(`[expo-start] URL manual no Expo Go: exp://${lanIp}:8081`);
  console.log(`[expo-start] Arquivo atualizado automaticamente: ${result.envPath}`);
} catch (error) {
  console.warn('[expo-start] Nao foi possivel atualizar IP automaticamente:', error.message);
  console.warn('[expo-start] Expo iniciara com host padrao.');
}

const expoCliPath = require.resolve('expo/bin/cli');
const expoArgs = [expoCliPath, 'start', '--lan', ...process.argv.slice(2)];
const child = spawn(process.execPath, expoArgs, {
  stdio: 'inherit',
  env,
});

child.on('error', (error) => {
  console.error('[expo-start] Falha ao iniciar Expo:', error);
  process.exit(1);
});

child.on('exit', (code) => {
  process.exit(code ?? 0);
});
