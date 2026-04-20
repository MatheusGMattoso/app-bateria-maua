const supabase = require('../config/supabase');

exports.criarEnsaio = async (req, res) => {
  try {
    const { peso, categoria } = req.body;

    const pesoFinal = peso || 1;
    const categoriaFinal = categoria || 'ensaio';

    const codigo_qr = `bateria_maua_${Date.now()}`;

    const { data, error } = await supabase
      .from('ensaios')
      .insert([
        { 
          codigo_qr: codigo_qr, 
          peso: pesoFinal, 
          categoria: categoriaFinal 
        }
      ])
      .select();

    if (error) throw error;

    res.status(201).json({
      mensagem: 'QR Code gerado com sucesso!',
      codigo_qr: data[0].codigo_qr
    });

  } catch (error) {
    res.status(500).json({ erro: error.message });
  }
};