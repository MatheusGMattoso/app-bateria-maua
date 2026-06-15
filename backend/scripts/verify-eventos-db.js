require('dotenv').config({ path: require('path').join(__dirname, '..', '.env') });
const supabase = require('../src/config/supabase');

async function main() {
  const { data, error, count } = await supabase
    .from('eventos')
    .select('id, titulo, data_evento, horario_evento', { count: 'exact' })
    .order('data_evento', { ascending: true })
    .limit(10);

  if (error) {
    console.error('Falha ao consultar eventos:', error.message);
    if (error.message.includes("Could not find the table 'public.eventos'")) {
      console.error('\nA tabela public.eventos nao existe. Execute: npm run db:setup-eventos');
      console.error('(requer DATABASE_URL no .env) ou rode o SQL em supabase/migrations/');
    }
    process.exit(1);
  }

  console.log(`Tabela eventos OK. Total: ${count ?? data?.length ?? 0}`);
  if (data?.length) {
    console.log('Amostra:', JSON.stringify(data, null, 2));
  }
}

main();
