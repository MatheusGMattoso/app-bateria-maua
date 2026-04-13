const supabase = require('../config/supabase');

exports.criarEnsaio = async (req, res) => {
  try {
    const { data_ensaio, tipo } = req.body;
    console.log("Recebido do app:", req.body.data_ensaio);
    
    let dataFormatada = data_ensaio;
    if (data_ensaio && data_ensaio.includes('/')) {
      const [dia, mes, ano] = data_ensaio.split('/');
      dataFormatada = `${ano}-${mes}-${dia}T00:00:00Z`;
    }

    const codigo_qr = `ensaio-${Date.now()}-${Math.random().toString(36).substring(2, 8)}`;

    const { data, error } = await supabase
      .from('ensaios')
      .insert([{ data_ensaio: dataFormatada, tipo, codigo_qr }])
      .select()
      .single();

    if (error) throw error;

    res.status(201).json({ mensagem: 'Ensaio criado com sucesso', ensaio: data });
  } catch (error) {
    res.status(400).json({ erro: error.message });
  }
};