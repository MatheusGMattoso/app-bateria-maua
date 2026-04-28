import React, { useEffect, useMemo, useState } from 'react';
import {
  Alert,
  SafeAreaView,
  ScrollView,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { BASE_URL } from '../../config/api';

type Evento = {
  id?: string;
  titulo: string;
  descricao?: string | null;
  data_evento: string;
  criado_por?: string | null;
};

const NOMES_MESES = [
  'Janeiro',
  'Fevereiro',
  'Marco',
  'Abril',
  'Maio',
  'Junho',
  'Julho',
  'Agosto',
  'Setembro',
  'Outubro',
  'Novembro',
  'Dezembro',
];

const NOMES_DIAS = ['D', 'S', 'T', 'Q', 'Q', 'S', 'S'];

function formatDateKey(date: Date) {
  const ano = date.getFullYear();
  const mes = `${date.getMonth() + 1}`.padStart(2, '0');
  const dia = `${date.getDate()}`.padStart(2, '0');
  return `${ano}-${mes}-${dia}`;
}

export default function CalendarioScreen() {
  const hoje = new Date();
  const [anoSelecionado, setAnoSelecionado] = useState(hoje.getFullYear());
  const [mesSelecionado, setMesSelecionado] = useState(hoje.getMonth());
  const [diaSelecionado, setDiaSelecionado] = useState(hoje.getDate());
  const [eventos, setEventos] = useState<Evento[]>([]);
  const [carregando, setCarregando] = useState(false);
  const [usuario, setUsuario] = useState<any>(null);
  const [titulo, setTitulo] = useState('');
  const [descricao, setDescricao] = useState('');
  const [dataEvento, setDataEvento] = useState(formatDateKey(hoje));

  const ehAdministrador =
    usuario?.perfil_acesso === 'Administrador' || usuario?.perfil_acesso === 'Gestor de Módulo';

  useEffect(() => {
    const carregarUsuario = async () => {
      const usuarioStorage = await AsyncStorage.getItem('usuario');
      if (usuarioStorage) {
        setUsuario(JSON.parse(usuarioStorage));
      }
    };

    carregarUsuario();
  }, []);

  useEffect(() => {
    buscarEventos();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [anoSelecionado]);

  const buscarEventos = async () => {
    try {
      setCarregando(true);
      const resposta = await fetch(`${BASE_URL}/eventos?ano=${anoSelecionado}`);
      const dados = await resposta.json();

      if (!resposta.ok) {
        throw new Error(dados.erro || 'Nao foi possivel carregar os eventos.');
      }

      setEventos(dados.eventos || []);
    } catch (error: any) {
      Alert.alert('Erro', error.message);
    } finally {
      setCarregando(false);
    }
  };

  const agendarEvento = async () => {
    if (!titulo || !dataEvento) {
      Alert.alert('Campos obrigatorios', 'Preencha titulo e data do evento.');
      return;
    }

    try {
      const resposta = await fetch(`${BASE_URL}/eventos`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          titulo,
          descricao,
          data_evento: dataEvento,
          criado_por: usuario?.id || null,
          perfil_acesso: usuario?.perfil_acesso,
        }),
      });

      const dados = await resposta.json();

      if (!resposta.ok) {
        throw new Error(dados.erro || 'Nao foi possivel agendar o evento.');
      }

      Alert.alert('Sucesso', 'Evento agendado com sucesso.');
      setTitulo('');
      setDescricao('');
      setDataEvento(formatDateKey(new Date()));
      buscarEventos();
    } catch (error: any) {
      Alert.alert('Erro', error.message);
    }
  };

  const eventosPorData = useMemo(() => {
    return eventos.reduce((acc: Record<string, Evento[]>, evento) => {
      if (!acc[evento.data_evento]) {
        acc[evento.data_evento] = [];
      }
      acc[evento.data_evento].push(evento);
      return acc;
    }, {});
  }, [eventos]);

  const dataSelecionada = `${anoSelecionado}-${`${mesSelecionado + 1}`.padStart(2, '0')}-${`${diaSelecionado}`.padStart(2, '0')}`;
  const eventosDoDia = eventosPorData[dataSelecionada] || [];

  const primeiroDiaDoMes = new Date(anoSelecionado, mesSelecionado, 1);
  const totalDiasNoMes = new Date(anoSelecionado, mesSelecionado + 1, 0).getDate();
  const deslocamentoInicial = primeiroDiaDoMes.getDay();

  const diasCalendario: (number | null)[] = [];
  for (let i = 0; i < deslocamentoInicial; i += 1) diasCalendario.push(null);
  for (let dia = 1; dia <= totalDiasNoMes; dia += 1) diasCalendario.push(dia);

  const mudarMes = (direcao: number) => {
    let proximoMes = mesSelecionado + direcao;
    let proximoAno = anoSelecionado;

    if (proximoMes < 0) {
      proximoMes = 11;
      proximoAno -= 1;
    } else if (proximoMes > 11) {
      proximoMes = 0;
      proximoAno += 1;
    }

    setMesSelecionado(proximoMes);
    setAnoSelecionado(proximoAno);
    setDiaSelecionado(1);
  };

  return (
    <SafeAreaView className="flex-1 bg-[#f5f5f5]">
      <ScrollView contentContainerStyle={{ padding: 24, paddingBottom: 60 }} showsVerticalScrollIndicator={false}>
        <View className="mb-6 mt-4">
          <Text className="text-2xl font-bold text-[#333]">Calendario</Text>
          <Text className="text-sm text-manga-gray font-semibold">
            Visualize todas as datas do ano e eventos agendados pela administracao.
          </Text>
        </View>

        <View className="bg-manga-white rounded-xl border border-[#ddd] p-4 mb-5">
          <View className="flex-row justify-between items-center mb-4">
            <TouchableOpacity onPress={() => mudarMes(-1)}>
              <Text className="text-manga-orangeDark font-bold text-lg">{'<'}</Text>
            </TouchableOpacity>
            <Text className="text-lg font-bold text-[#333]">
              {NOMES_MESES[mesSelecionado]} {anoSelecionado}
            </Text>
            <TouchableOpacity onPress={() => mudarMes(1)}>
              <Text className="text-manga-orangeDark font-bold text-lg">{'>'}</Text>
            </TouchableOpacity>
          </View>

          <View className="flex-row justify-between mb-2">
            {NOMES_DIAS.map((dia) => (
              <Text key={dia} className="w-[13%] text-center text-manga-gray font-bold text-xs">
                {dia}
              </Text>
            ))}
          </View>

          <View className="flex-row flex-wrap justify-between">
            {diasCalendario.map((dia, index) => {
              if (!dia) {
                return <View key={`vazio-${index}`} className="w-[13%] h-10 mb-2" />;
              }

              const data = `${anoSelecionado}-${`${mesSelecionado + 1}`.padStart(2, '0')}-${`${dia}`.padStart(2, '0')}`;
              const temEvento = Boolean(eventosPorData[data]?.length);
              const selecionado = dia === diaSelecionado;

              return (
                <TouchableOpacity
                  key={data}
                  className={`w-[13%] h-10 mb-2 rounded-lg items-center justify-center ${
                    selecionado ? 'bg-manga-orangeDark' : 'bg-[#f5f5f5]'
                  }`}
                  onPress={() => setDiaSelecionado(dia)}
                >
                  <Text className={`${selecionado ? 'text-white' : 'text-[#333]'} font-semibold text-xs`}>
                    {dia}
                  </Text>
                  {temEvento && <View className={`w-1.5 h-1.5 rounded-full mt-1 ${selecionado ? 'bg-white' : 'bg-manga-orangeDark'}`} />}
                </TouchableOpacity>
              );
            })}
          </View>
        </View>

        <View className="mb-5">
          <Text className="text-lg font-bold text-[#333] mb-3">Eventos do dia {dataSelecionada}</Text>
          {carregando ? (
            <Text className="text-manga-gray">Carregando eventos...</Text>
          ) : eventosDoDia.length === 0 ? (
            <Text className="text-manga-gray">Nenhum evento agendado para esta data.</Text>
          ) : (
            eventosDoDia.map((evento, index) => (
              <View key={`${evento.id || evento.titulo}-${index}`} className="bg-manga-white p-4 rounded-xl border border-[#ddd] mb-3">
                <Text className="font-bold text-[#333]">{evento.titulo}</Text>
                {evento.descricao ? <Text className="text-sm text-manga-gray mt-1">{evento.descricao}</Text> : null}
              </View>
            ))
          )}
        </View>

        {ehAdministrador && (
          <View className="bg-manga-white p-4 rounded-xl border border-[#ddd]">
            <Text className="text-lg font-bold text-[#333] mb-3">Agendar novo evento</Text>
            <TextInput
              className="bg-[#f5f5f5] h-[46px] rounded-lg px-4 mb-3 border border-[#ddd] text-[#333]"
              placeholder="Titulo do evento"
              value={titulo}
              onChangeText={setTitulo}
            />
            <TextInput
              className="bg-[#f5f5f5] h-[46px] rounded-lg px-4 mb-3 border border-[#ddd] text-[#333]"
              placeholder="Data (AAAA-MM-DD)"
              value={dataEvento}
              onChangeText={setDataEvento}
            />
            <TextInput
              className="bg-[#f5f5f5] rounded-lg px-4 py-3 mb-3 border border-[#ddd] text-[#333]"
              placeholder="Descricao (opcional)"
              value={descricao}
              onChangeText={setDescricao}
              multiline
            />
            <TouchableOpacity
              className="bg-manga-orangeDark h-[46px] rounded-lg items-center justify-center"
              onPress={agendarEvento}
            >
              <Text className="text-white font-bold">Salvar evento</Text>
            </TouchableOpacity>
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}
