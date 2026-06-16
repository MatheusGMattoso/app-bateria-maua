/**
 * Cria o bucket publico "feed-imagens" no Supabase Storage, usado para
 * armazenar as fotos publicadas no mural. Necessario para que as imagens
 * fiquem visiveis para todos os usuarios (e nao apenas na rede local).
 *
 * Requer SUPABASE_SERVICE_KEY no .env (Supabase > Project Settings > API >
 * Project API keys > service_role). A service key NUNCA deve ir para o app.
 *
 * Uso: npm run db:setup-storage
 */
require('dotenv').config({ path: require('path').join(__dirname, '..', '.env') });
const supabaseAdmin = require('../src/config/supabaseAdmin');

const BUCKET = 'feed-imagens';

async function main() {
  if (!supabaseAdmin) {
    console.error(
      'SUPABASE_SERVICE_KEY ausente no .env.\n' +
        'Pegue em: Supabase > Project Settings > API > service_role (secret).',
    );
    process.exit(1);
  }

  const { data: buckets, error: erroLista } = await supabaseAdmin.storage.listBuckets();
  if (erroLista) throw erroLista;

  const existente = (buckets || []).find((b) => b.name === BUCKET);
  if (existente) {
    if (!existente.public) {
      const { error } = await supabaseAdmin.storage.updateBucket(BUCKET, { public: true });
      if (error) throw error;
      console.log(`Bucket "${BUCKET}" ja existia; tornado publico.`);
    } else {
      console.log(`Bucket "${BUCKET}" ja existe e e publico. Nada a fazer.`);
    }
    return;
  }

  const { error } = await supabaseAdmin.storage.createBucket(BUCKET, {
    public: true,
    fileSizeLimit: '5MB',
    allowedMimeTypes: ['image/jpeg', 'image/png', 'image/webp'],
  });
  if (error) throw error;

  console.log(`Bucket publico "${BUCKET}" criado com sucesso.`);
}

main().catch((err) => {
  console.error('Erro ao configurar o Storage do feed:', err.message);
  process.exit(1);
});
