const os = require('os');
const { spawn } = require('child_process');

function isPrivateIPv4(address) {
  if (!address) return false;
  if (address.startsWith('10.')) return true;
  if (address.startsWith('192.168.')) return true;
  const match172 = /^172\.(\d+)\./.exec(address);
  if (!match172) return false;
  const secondOctet = Number(match172[1]);
  return secondOctet >= 16 && secondOctet <= 31;
}

function scoreInterface(name, address) {
  const lowerName = name.toLowerCase();
  let score = 0;

  if (isPrivateIPv4(address)) score += 5;
  if (address.startsWith('192.168.')) score += 2;
  if (address.startsWith('10.')) score += 1;

  if (/(wi-?fi|wlan|ethernet|en\d+)/i.test(name)) score += 3;

  if (/(virtual|vbox|vmware|vEthernet|hyper-v|docker|wsl|loopback|tailscale|zerotier)/i.test(lowerName)) {
    score -= 6;
  }

  return score;
}

function getBestLanIPv4() {
  const networkMap = os.networkInterfaces();
  const candidates = [];

  for (const [name, infos] of Object.entries(networkMap)) {
    for (const info of infos || []) {
      if (info.family !== 'IPv4' || info.internal) continue;
      if (!info.address || info.address.startsWith('169.254.')) continue;

      candidates.push({
        name,
        address: info.address,
        score: scoreInterface(name, info.address),
      });
    }
  }

  candidates.sort((a, b) => b.score - a.score);
  return candidates[0]?.address || null;
}

const lanIp = getBestLanIPv4();
const env = { ...process.env };

if (lanIp) {
  env.REACT_NATIVE_PACKAGER_HOSTNAME = lanIp;
  env.EXPO_PACKAGER_PROXY_URL = `http://${lanIp}:8081`;
  env.EXPO_PUBLIC_API_HOST = lanIp;
  console.log(`[expo-start] Usando IP LAN: ${lanIp}`);
  console.log(`[expo-start] URL manual no Expo Go: exp://${lanIp}:8081`);
} else {
  console.warn('[expo-start] Não foi possível detectar IP LAN. Expo iniciará com host padrão.');
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
