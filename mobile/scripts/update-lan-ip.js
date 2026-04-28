const fs = require('fs');
const os = require('os');
const path = require('path');

const EXPO_PORT = 8081;

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

  if (/(virtual|vbox|vmware|vethernet|hyper-v|docker|wsl|loopback|tailscale|zerotier)/i.test(lowerName)) {
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

function buildExpoEnv(ipAddress) {
  return {
    REACT_NATIVE_PACKAGER_HOSTNAME: ipAddress,
    EXPO_PACKAGER_PROXY_URL: `http://${ipAddress}:${EXPO_PORT}`,
    EXPO_PUBLIC_API_HOST: ipAddress,
    EXPO_OFFLINE: '1',
  };
}

function syncLanEnvFile(projectRoot = process.cwd()) {
  const lanIp = getBestLanIPv4();
  if (!lanIp) {
    throw new Error('Nao foi possivel detectar um IPv4 de rede local.');
  }

  const envVars = buildExpoEnv(lanIp);
  const envPath = path.join(projectRoot, '.env.local');
  const envFile = `${Object.entries(envVars)
    .map(([key, value]) => `${key}=${value}`)
    .join('\n')}\n`;

  fs.writeFileSync(envPath, envFile, 'utf8');
  return { lanIp, envVars, envPath };
}

if (require.main === module) {
  try {
    const { lanIp, envPath } = syncLanEnvFile();
    console.log(`[lan-ip] IP detectado: ${lanIp}`);
    console.log(`[lan-ip] Arquivo atualizado: ${envPath}`);
    console.log(`[lan-ip] URL Expo Go: exp://${lanIp}:${EXPO_PORT}`);
  } catch (error) {
    console.error('[lan-ip] Falha ao atualizar IP automaticamente:', error.message);
    process.exit(1);
  }
}

module.exports = {
  syncLanEnvFile,
  buildExpoEnv,
  getBestLanIPv4,
};
