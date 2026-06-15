/**
 * Cria tabelas do feed (posts, reacoes, comentarios) no Supabase.
 * Requer DATABASE_URL no .env (Connection string do Supabase > Settings > Database).
 *
 * Uso: node scripts/setup-feed-table.js
 */
require('dotenv').config({ path: require('path').join(__dirname, '..', '.env') });
const fs = require('fs');
const path = require('path');
const { Client } = require('pg');

const MIGRATIONS = [
  '20260615140000_create_feed.sql',
  '20260616100000_create_feed_comentarios.sql',
];

async function main() {
  const databaseUrl = process.env.DATABASE_URL;
  if (!databaseUrl) {
    console.error(
      'DATABASE_URL ausente no .env.\n' +
        'No Supabase: Project Settings > Database > Connection string (URI).\n' +
        'Ou execute os SQL manualmente em: SQL Editor > New query',
    );
    process.exit(1);
  }

  const client = new Client({ connectionString: databaseUrl, ssl: { rejectUnauthorized: false } });

  try {
    await client.connect();
    for (const arquivo of MIGRATIONS) {
      const migrationPath = path.join(__dirname, '..', 'supabase', 'migrations', arquivo);
      const sql = fs.readFileSync(migrationPath, 'utf8');
      await client.query(sql);
      console.log(`Migration aplicada: ${arquivo}`);
    }
    console.log('Tabelas do feed criadas com sucesso.');
    console.log(
      '\nFase 2 (imagens): crie o bucket publico "feed-imagens" no Supabase Storage\n' +
        '(Storage > New bucket > nome: feed-imagens > Public bucket).',
    );
  } finally {
    await client.end();
  }
}

main().catch((err) => {
  console.error('Erro ao criar tabelas do feed:', err.message);
  process.exit(1);
});
