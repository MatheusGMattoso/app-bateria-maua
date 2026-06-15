/**
 * Cria a tabela public.eventos no Supabase.
 * Requer DATABASE_URL no .env (Connection string do Supabase > Settings > Database).
 *
 * Uso: node scripts/setup-eventos-table.js
 */
require('dotenv').config({ path: require('path').join(__dirname, '..', '.env') });
const fs = require('fs');
const path = require('path');
const { Client } = require('pg');

const MIGRATION_PATH = path.join(
  __dirname,
  '..',
  'supabase',
  'migrations',
  '20260518100000_create_eventos.sql',
);

async function main() {
  const databaseUrl = process.env.DATABASE_URL;
  if (!databaseUrl) {
    console.error(
      'DATABASE_URL ausente no .env.\n' +
        'No Supabase: Project Settings > Database > Connection string (URI).\n' +
        'Ou execute o SQL manualmente em: SQL Editor > New query\n' +
        `Arquivo: ${MIGRATION_PATH}`,
    );
    process.exit(1);
  }

  const sql = fs.readFileSync(MIGRATION_PATH, 'utf8');
  const client = new Client({ connectionString: databaseUrl, ssl: { rejectUnauthorized: false } });

  try {
    await client.connect();
    await client.query(sql);
    console.log('Tabela public.eventos criada com sucesso.');
  } finally {
    await client.end();
  }
}

main().catch((err) => {
  console.error('Erro ao criar tabela:', err.message);
  process.exit(1);
});
