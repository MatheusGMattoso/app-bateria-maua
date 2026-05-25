/**
 * Copia eventos de backend/data/eventos.json para public.eventos no Supabase.
 * Uso: node scripts/migrate-eventos-fallback.js
 */
require('dotenv').config({ path: require('path').join(__dirname, '..', '.env') });
const fs = require('fs');
const path = require('path');
const supabase = require('../src/config/supabase');

const FALLBACK_PATH = path.join(__dirname, '..', 'data', 'eventos.json');

async function main() {
  if (!fs.existsSync(FALLBACK_PATH)) {
    console.log('Nenhum arquivo de fallback encontrado.');
    return;
  }

  const eventos = JSON.parse(fs.readFileSync(FALLBACK_PATH, 'utf8'));
  if (!eventos.length) {
    console.log('Fallback vazio, nada a migrar.');
    return;
  }

  const payloads = eventos.map(({ titulo, descricao, data_evento, horario_evento, criado_por }) => ({
    titulo,
    descricao: descricao || null,
    data_evento,
    horario_evento: horario_evento || '23:59',
    criado_por: criado_por || null,
  }));

  const { data, error } = await supabase.from('eventos').insert(payloads).select();

  if (error) {
    console.error('Erro na migracao:', error.message);
    process.exit(1);
  }

  fs.writeFileSync(FALLBACK_PATH, '[]', 'utf8');
  console.log(`Migrados ${data.length} evento(s) para o Supabase. Fallback limpo.`);
}

main();
