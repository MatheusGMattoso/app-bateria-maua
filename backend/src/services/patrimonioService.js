const supabase = require('../config/supabase');
const fs = require('fs');
const path = require('path');

const BUCKET_IMAGENS = 'patrimonio-imagens';
const UPLOAD_DIR = path.join(__dirname, '..', '..', 'uploads', 'patrimonio');

function garantirPastaUpload() {
  if (!fs.existsSync(UPLOAD_DIR)) {
    fs.mkdirSync(UPLOAD_DIR, { recursive: true });
  }
}

function nomeArquivoComExtensao(mimeType, nomeArquivo) {
  const extensao = mimeType?.includes('png') ? 'png' : mimeType?.includes('webp') ? 'webp' : 'jpg';
  return `${Date.now()}_${nomeArquivo || 'item'}.${extensao}`;
}

function salvarImagemLocal({ buffer, mimeType, nomeArquivo }) {
  garantirPastaUpload();
  const caminho = nomeArquivoComExtensao(mimeType, nomeArquivo);
  fs.writeFileSync(path.join(UPLOAD_DIR, caminho), buffer);
  return caminho;
}

async function uploadImagem({ buffer, mimeType, nomeArquivo, baseUrl }) {
  const caminho = nomeArquivoComExtensao(mimeType, nomeArquivo);

  const { error } = await supabase.storage
    .from(BUCKET_IMAGENS)
    .upload(caminho, buffer, { contentType: mimeType || 'image/jpeg', upsert: false });

  if (!error) {
    const { data: urlData } = supabase.storage.from(BUCKET_IMAGENS).getPublicUrl(caminho);
    return { imagem_url: urlData.publicUrl };
  }

  console.warn('Supabase Storage indisponivel (patrimonio), usando armazenamento local:', error.message);
  const arquivoLocal = salvarImagemLocal({ buffer, mimeType, nomeArquivo });
  const host = baseUrl || 'http://localhost:3000';
  return { imagem_url: `${host}/uploads/patrimonio/${arquivoLocal}` };
}

module.exports = { uploadImagem };
