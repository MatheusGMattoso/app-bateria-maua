import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
  Alert,
  Animated,
  KeyboardAvoidingView,
  Platform,
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
  horario_evento?: string | null;
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

const NOMES_DIAS = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'];

function formatDateKey(date: Date) {
  const ano = date.getFullYear();
  const mes = `${date.getMonth() + 1}`.padStart(2, '0');
  const dia = `${date.getDate()}`.padStart(2, '0');
  return `${ano}-${mes}-${dia}`;
}

function formatTimeKey(date: Date) {
  const hora = `${date.getHours()}`.padStart(2, '0');
  const minuto = `${date.getMinutes()}`.padStart(2, '0');
  return `${hora}:${minuto}`;
}

function formatarDataExibicao(dataStr: string) {
  const [ano, mes, dia] = dataStr.split('-');
  return `${dia}/${mes}/${ano}`;
}

export default function CalendarioScreen() {
  const hoje = new Date();
  const [anoSelecionado, setAnoSelecionado] = useState(hoje.getFullYear());
  const [mesSelecionado, setMesSelecionado] = useState(hoje.getMonth());
  const [diaSelecionado, setDiaSelecionado] = useState<number | null>(null);
  const [eventos, setEventos] = useState<Evento[]>([]);
  const [carregando, setCarregando] = useState(false);
  const [usuario, setUsuario] = useState<any>(null);
  const [titulo, setTitulo] = useState('');
  const [descricao, setDescricao] = useState('');
  const [horarioEvento, setHorarioEvento] = useState(formatTimeKey(hoje));
  const [formularioAberto, setFormularioAberto] = useState(false);

  const formAnimacao = useRef(new Animated.Value(0)).current;
  const diaAnimacao = useRef(new Animated.Value(0)).current;
  const scrollViewRef = useRef<ScrollView>(null);

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

  useEffect(() => {
    if (diaSelecionado !== null) {
      diaAnimacao.setValue(0);
      Animated.spring(diaAnimacao, {
        toValue: 1,
        useNativeDriver: true,
        tension: 80,
        friction: 8,
      }).start();
    }
  }, [diaSelecionado, diaAnimacao]);

  const toggleFormulario = () => {
    const abrindo = !formularioAberto;
    setFormularioAberto(abrindo);
    Animated.timing(formAnimacao, {
      toValue: abrindo ? 1 : 0,
      duration: 300,
      useNativeDriver: false,
    }).start(() => {
      if (abrindo) {
        setTimeout(() => {
          scrollViewRef.current?.scrollToEnd({ animated: true });
        }, 100);
      }
    });
  };

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

  const dataSelecionada = diaSelecionado
    ? `${anoSelecionado}-${`${mesSelecionado + 1}`.padStart(2, '0')}-${`${diaSelecionado}`.padStart(2, '0')}`
    : null;

  const agendarEvento = async () => {
    if (!titulo || !dataSelecionada || !horarioEvento) {
      Alert.alert('Campos obrigatorios', 'Preencha titulo e horario do evento.');
      return;
    }

    if (!/^([01]\d|2[0-3]):([0-5]\d)$/.test(horarioEvento)) {
      Alert.alert('Horario invalido', 'Use o formato HH:MM (ex: 19:30).');
      return;
    }

    try {
      const resposta = await fetch(`${BASE_URL}/eventos`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          titulo,
          descricao,
          data_evento: dataSelecionada,
          horario_evento: horarioEvento,
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
      setHorarioEvento(formatTimeKey(new Date()));
      setFormularioAberto(false);
      formAnimacao.setValue(0);
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

  const eventosDoDia = dataSelecionada ? (eventosPorData[dataSelecionada] || []) : [];

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
    setDiaSelecionado(null);
    setFormularioAberto(false);
    formAnimacao.setValue(0);
  };

  const selecionarDia = (dia: number) => {
    if (diaSelecionado === dia) {
      setDiaSelecionado(null);
      setFormularioAberto(false);
      formAnimacao.setValue(0);
    } else {
      setDiaSelecionado(dia);
      setFormularioAberto(false);
      formAnimacao.setValue(0);
    }
  };

  const formMaxHeight = formAnimacao.interpolate({
    inputRange: [0, 1],
    outputRange: [0, 400],
  });

  const formOpacity = formAnimacao.interpolate({
    inputRange: [0, 0.5, 1],
    outputRange: [0, 0, 1],
  });

  const diaSecaoScale = diaAnimacao.interpolate({
    inputRange: [0, 1],
    outputRange: [0.95, 1],
  });

  const diaSecaoOpacity = diaAnimacao.interpolate({
    inputRange: [0, 1],
    outputRange: [0, 1],
  });

  return (
    <SafeAreaView className="flex-1 bg-[#f5f5f5]">
      <KeyboardAvoidingView
        className="flex-1"
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 90 : 0}
      >
        <ScrollView
          ref={scrollViewRef}
          contentContainerStyle={{ padding: 24, paddingBottom: 60 }}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
        <View className="mb-6 mt-4">
          <Text className="text-2xl font-bold text-[#333]">Calendario</Text>
          <Text className="text-sm text-manga-gray font-semibold">
            Visualize todas as datas do ano e eventos agendados pela administracao.
          </Text>
        </View>

        <View className="bg-manga-white rounded-2xl border border-[#e0e0e0] p-4 mb-5" style={{ shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.06, shadowRadius: 8, elevation: 3 }}>
          <View className="flex-row justify-between items-center mb-4">
            <TouchableOpacity onPress={() => mudarMes(-1)} className="w-10 h-10 rounded-full bg-[#fff3eb] items-center justify-center">
              <Text className="text-manga-orangeDark font-bold text-lg">{'<'}</Text>
            </TouchableOpacity>
            <Text className="text-lg font-bold text-[#333]">
              {NOMES_MESES[mesSelecionado]} {anoSelecionado}
            </Text>
            <TouchableOpacity onPress={() => mudarMes(1)} className="w-10 h-10 rounded-full bg-[#fff3eb] items-center justify-center">
              <Text className="text-manga-orangeDark font-bold text-lg">{'>'}</Text>
            </TouchableOpacity>
          </View>

          <View className="flex-row justify-between mb-2">
            {NOMES_DIAS.map((dia, index) => (
              <Text key={`dia-semana-${index}`} className="w-[13%] text-center text-manga-gray font-bold text-xs">
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
              const ehHoje = dia === hoje.getDate() && mesSelecionado === hoje.getMonth() && anoSelecionado === hoje.getFullYear();

              return (
                <TouchableOpacity
                  key={data}
                  className={`w-[13%] h-10 mb-2 rounded-lg items-center justify-center ${
                    selecionado ? 'bg-manga-orangeDark' : ehHoje ? 'bg-[#fff3eb]' : 'bg-[#f5f5f5]'
                  }`}
                  onPress={() => selecionarDia(dia)}
                  activeOpacity={0.7}
                >
                  <Text className={`${selecionado ? 'text-white' : ehHoje ? 'text-manga-orangeDark' : 'text-[#333]'} font-semibold text-xs`}>
                    {dia}
                  </Text>
                  {temEvento && <View className={`w-1.5 h-1.5 rounded-full mt-0.5 ${selecionado ? 'bg-white' : 'bg-manga-orangeDark'}`} />}
                </TouchableOpacity>
              );
            })}
          </View>
        </View>

        {diaSelecionado !== null && dataSelecionada && (
          <Animated.View style={{ opacity: diaSecaoOpacity, transform: [{ scale: diaSecaoScale }] }}>
            <View className="bg-manga-white rounded-2xl border border-[#e0e0e0] p-5 mb-5" style={{ shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.06, shadowRadius: 8, elevation: 3 }}>
              <View className="flex-row items-center justify-between mb-4">
                <View className="flex-row items-center">
                  <View className="w-10 h-10 rounded-full bg-manga-orangeDark items-center justify-center mr-3">
                    <Text className="text-white font-bold text-sm">{diaSelecionado}</Text>
                  </View>
                  <View>
                    <Text className="text-base font-bold text-[#333]">
                      {formatarDataExibicao(dataSelecionada)}
                    </Text>
                    <Text className="text-xs text-manga-gray">
                      {NOMES_DIAS[new Date(anoSelecionado, mesSelecionado, diaSelecionado).getDay()]}
                      {', '}
                      {NOMES_MESES[mesSelecionado]}
                    </Text>
                  </View>
                </View>
                {eventosDoDia.length > 0 && (
                  <View className="bg-[#fff3eb] px-3 py-1 rounded-full">
                    <Text className="text-manga-orangeDark text-xs font-bold">
                      {eventosDoDia.length} evento{eventosDoDia.length > 1 ? 's' : ''}
                    </Text>
                  </View>
                )}
              </View>

              {carregando ? (
                <Text className="text-manga-gray text-center py-4">Carregando eventos...</Text>
              ) : eventosDoDia.length === 0 ? (
                <View className="items-center py-6">
                  <Text className="text-3xl mb-2">📅</Text>
                  <Text className="text-manga-gray text-sm text-center">
                    Nenhum evento agendado{'\n'}para esta data.
                  </Text>
                </View>
              ) : (
                eventosDoDia.map((evento, index) => (
                  <View
                    key={`${evento.id || evento.titulo}-${index}`}
                    className="flex-row items-start mb-3"
                  >
                    <View className="w-1 rounded-full bg-manga-orangeDark mr-3 mt-1" style={{ height: '100%', minHeight: 40 }} />
                    <View className="flex-1 bg-[#fafafa] p-3 rounded-xl">
                      <Text className="font-bold text-[#333] text-sm">{evento.titulo}</Text>
                      {evento.horario_evento && (
                        <Text className="text-xs text-manga-orangeDark font-semibold mt-1">
                          🕐 {evento.horario_evento}
                        </Text>
                      )}
                      {evento.descricao ? (
                        <Text className="text-xs text-manga-gray mt-1">{evento.descricao}</Text>
                      ) : null}
                    </View>
                  </View>
                ))
              )}

              {ehAdministrador && (
                <View className="mt-2">
                  <TouchableOpacity
                    className={`flex-row items-center justify-center py-3 rounded-xl ${
                      formularioAberto ? 'bg-[#f5f5f5]' : 'bg-manga-orangeDark'
                    }`}
                    onPress={toggleFormulario}
                    activeOpacity={0.8}
                  >
                    <Text className={`font-bold text-sm ${formularioAberto ? 'text-manga-gray' : 'text-white'}`}>
                      {formularioAberto ? '✕  Cancelar' : '+  Agendar evento neste dia'}
                    </Text>
                  </TouchableOpacity>

                  <Animated.View style={{ maxHeight: formMaxHeight, opacity: formOpacity, overflow: 'hidden' }}>
                    <View className="mt-4">
                      <Text className="text-xs text-manga-gray font-semibold mb-1 ml-1">TÍTULO</Text>
                      <TextInput
                        className="bg-[#f9f9f9] h-[46px] rounded-xl px-4 mb-3 border border-[#e8e8e8] text-[#333]"
                        placeholder="Nome do evento"
                        placeholderTextColor="#aaa"
                        value={titulo}
                        onChangeText={setTitulo}
                        onFocus={() => setTimeout(() => scrollViewRef.current?.scrollToEnd({ animated: true }), 300)}
                      />

                      <Text className="text-xs text-manga-gray font-semibold mb-1 ml-1">HORÁRIO</Text>
                      <TextInput
                        className="bg-[#f9f9f9] h-[46px] rounded-xl px-4 mb-3 border border-[#e8e8e8] text-[#333]"
                        placeholder="HH:MM (ex: 19:30)"
                        placeholderTextColor="#aaa"
                        value={horarioEvento}
                        onChangeText={setHorarioEvento}
                        keyboardType="numbers-and-punctuation"
                        onFocus={() => setTimeout(() => scrollViewRef.current?.scrollToEnd({ animated: true }), 300)}
                      />

                      <Text className="text-xs text-manga-gray font-semibold mb-1 ml-1">DESCRIÇÃO (OPCIONAL)</Text>
                      <TextInput
                        className="bg-[#f9f9f9] rounded-xl px-4 py-3 mb-4 border border-[#e8e8e8] text-[#333]"
                        placeholder="Detalhes sobre o evento..."
                        placeholderTextColor="#aaa"
                        value={descricao}
                        onChangeText={setDescricao}
                        multiline
                        numberOfLines={3}
                        style={{ minHeight: 70, textAlignVertical: 'top' }}
                        onFocus={() => setTimeout(() => scrollViewRef.current?.scrollToEnd({ animated: true }), 300)}
                      />

                      <TouchableOpacity
                        className="bg-manga-orangeDark h-[48px] rounded-xl items-center justify-center"
                        onPress={agendarEvento}
                        activeOpacity={0.8}
                      >
                        <Text className="text-white font-bold text-sm">Salvar evento</Text>
                      </TouchableOpacity>
                    </View>
                  </Animated.View>
                </View>
              )}
            </View>
          </Animated.View>
        )}

        {diaSelecionado === null && (
          <View className="items-center py-8">
            <Text className="text-4xl mb-3">👆</Text>
            <Text className="text-manga-gray text-sm text-center font-semibold">
              Selecione um dia no calendario{'\n'}para ver os eventos.
            </Text>
          </View>
        )}
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
