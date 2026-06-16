require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.SUPABASE_URL;
const serviceKey = process.env.SUPABASE_SERVICE_KEY;

// Cliente com privilegios de service_role: ignora RLS e pode gerenciar o Storage.
// Usado apenas no backend (a chave nunca e enviada ao app). Se a service key nao
// estiver configurada, mantemos null para o codigo cair no fallback adequado.
const supabaseAdmin = serviceKey ? createClient(supabaseUrl, serviceKey) : null;

module.exports = supabaseAdmin;
