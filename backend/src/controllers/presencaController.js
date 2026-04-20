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

    const { data: ensaios, error: erroEnsaios } = await supabase
      .from('ensaios')
      .select('id, peso, categoria');

    if (erroEnsaios) throw erroEnsaios;

    const totalPontosPossiveis = ensaios
      .filter(e => e.categoria === 'ensaio')
      .reduce((soma, e) => soma + (e.peso || 1), 0);

    const { data: presencas, error: erroPresencas } = await supabase
      .from('presencas')
      .select('id, ensaios(peso, categoria)')
      .eq('membro_id', membro_id);

    if (erroPresencas) throw erroPresencas;

    let pontosObtidos = 0;
    let comparecimentos = presencas.length;

    presencas.forEach(p => {
      if (p.ensaios) pontosObtidos += (p.ensaios.peso || 1);
    });

    const qtdeEnsaiosTotais = ensaios.filter(e => e.categoria === 'ensaio').length;
    const qtdeEnsaiosComparecidos = presencas.filter(p => p.ensaios?.categoria === 'ensaio').length;
    const faltas = qtdeEnsaiosTotais - qtdeEnsaiosComparecidos;

    let frequencia = totalPontosPossiveis > 0 
      ? Math.round((pontosObtidos / totalPontosPossiveis) * 100) 
      : 0;
    
    if (frequencia > 100) frequencia = 100;

    res.status(200).json({
      presencas: comparecimentos, 
      faltas: faltas >= 0 ? faltas : 0, 
      frequencia: frequencia
    });

  } catch (error) {
    res.status(500).json({ erro: error.message });
  }
};

exports.gerarRelatorioAprovados = async (req, res) => {
  try {
    const { data: ensaios, error: erroEnsaios } = await supabase
      .from('ensaios')
      .select('id, peso, categoria');

    if (erroEnsaios) throw erroEnsaios;

    const totalPontosPossiveis = ensaios
      .filter(e => e.categoria === 'ensaio')
      .reduce((soma, e) => soma + (e.peso || 1), 0);

    if (totalPontosPossiveis === 0) {
      return res.status(400).json({ erro: 'Nenhum ensaio registrado para base de cálculo.' });
    }

    const { data: membros, error: erroMembros } = await supabase
      .from('membros')
      .select('id, nome');

    if (erroMembros) throw erroMembros;

    const { data: presencas, error: erroPresencas } = await supabase
      .from('presencas')
      .select('membro_id, ensaios(peso, categoria)');

    if (erroPresencas) throw erroPresencas;

    const aprovados = [];

    membros.forEach(membro => {
      const presencasDoMembro = presencas.filter(p => p.membro_id === membro.id);
      
      const pontosObtidos = presencasDoMembro.reduce((soma, p) => soma + (p.ensaios?.peso || 1), 0);
      
      let frequencia = (pontosObtidos / totalPontosPossiveis) * 100;
      let frequenciaFinal = frequencia > 100 ? 100 : Math.round(frequencia);

      if (frequenciaFinal >= 70) {
        aprovados.push({
          nome: membro.nome,
          pontos: pontosObtidos,
          frequencia: frequenciaFinal
        });
      }
    });

    let csv = 'Nome,Pontos,Frequencia (%)\n'; 
    
    aprovados.forEach(linha => {
      csv += `${linha.nome},${linha.pontos},${linha.frequencia}%\n`;
    });

    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', 'attachment; filename=horas_pae_aprovados.csv');
    res.status(200).send(csv);

  } catch (error) {
    res.status(500).json({ erro: error.message });
  }
};