const supabase = require('../config/supabase');

exports.registrarPresenca = async (req, res) => {
  try {
    const { codigo_qr, membro_id } = req.body;

    const { data: ensaio, error: erroEnsaio } = await supabase
      .from('ensaios')
      .select('id')
      .eq('codigo_qr', codigo_qr)
      .single();

    if (erroEnsaio || !ensaio) {
      return res.status(404).json({ erro: 'QR Code inválido ou ensaio não encontrado.' });
    }

    const { data: membro, error: erroMembro } = await supabase
      .from('membros')
      .select('nome')
      .eq('id', membro_id)
      .single();

    if (erroMembro || !membro) {
      return res.status(404).json({ erro: 'Membro não encontrado.' });
    }

    const { data: presenca, error: erroPresenca } = await supabase
      .from('presencas')
      .insert([{ 
        ensaio_id: ensaio.id, 
        membro_id,
        nome_membro: membro.nome
      }])
      .select()
      .single();

    if (erroPresenca && erroPresenca.code === '23505') {
      return res.status(400).json({ erro: 'Presença já registrada para este ensaio.' });
    }

    if (erroPresenca) throw erroPresenca;

    res.status(201).json({ mensagem: 'Presença confirmada!', presenca });
  } catch (error) {
    res.status(500).json({ erro: error.message });
  }
};

exports.obterResumo = async (req, res) => {
  try {
    const { membro_id } = req.params;

    const { count: totalEnsaios, error: erroEnsaios } = await supabase
      .from('ensaios')
      .select('*', { count: 'exact', head: true });

    if (erroEnsaios) throw erroEnsaios;

    const { count: totalPresencas, error: erroPresencas } = await supabase
      .from('presencas')
      .select('*', { count: 'exact', head: true })
      .eq('membro_id', membro_id);

    if (erroPresencas) throw erroPresencas;

    const faltas = totalEnsaios - totalPresencas;
    const frequencia = totalEnsaios > 0 ? Math.round((totalPresencas / totalEnsaios) * 100) : 0;

    res.status(200).json({
      presencas: totalPresencas || 0,
      faltas: faltas >= 0 ? faltas : 0, 
      frequencia: frequencia
    });

  } catch (error) {
    res.status(500).json({ erro: error.message });
  }
};