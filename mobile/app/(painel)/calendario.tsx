import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
  Alert,
  Animated,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { BASE_URL } from '../../config/api';
import { fetchJson } from '../../utils/apiClient';
import { useTheme } from '../../context/ThemeContext';
import ScreenHeader from '../../components/ScreenHeader';
import EmptyState from '../../components/EmptyState';
import ThemeToggle from '../../components/ThemeToggle';

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
  'Março',
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
  const { colors, isDark } = useTheme();
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
  const [salvando, setSalvando] = useState(false);

  const formAnimacao = useRef(new Animated.Value(0)).current;
  const diaAnimacao = useRef(new Animated.Value(0)).current;
  const scrollViewRef = useRef<ScrollView>(null);

  const ehAdministrador =
    usuario?.perfil_acesso === 'Administrador' || usuario?.perfil_acesso === 'Gestor de Módulo';

  useEffect(() => {
    const carregarUsuario = async () => {
      const usuarioStorage = await AsyncStorage.getItem('usuario');
      if (usuarioStorage) setUsuario(JSON.parse(usuarioStorage));
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
        setTimeout(() => scrollViewRef.current?.scrollToEnd({ animated: true }), 100);
      }
    });
  };

  const buscarEventos = async () => {
    try {
      setCarregando(true);
      const dados = await fetchJson(`${BASE_URL}/eventos?ano=${anoSelecionado}`);
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
      Alert.alert('Campos obrigatórios', 'Preencha título e horário do evento.');
      return;
    }

    if (!/^([01]\d|2[0-3]):([0-5]\d)$/.test(horarioEvento)) {
      Alert.alert('Horário inválido', 'Use o formato HH:MM (ex: 19:30).');
      return;
    }

    try {
      setSalvando(true);
      await fetchJson(`${BASE_URL}/eventos`, {
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

      Alert.alert('Sucesso', 'Evento agendado com sucesso.');
      setTitulo('');
      setDescricao('');
      setHorarioEvento(formatTimeKey(new Date()));
      setFormularioAberto(false);
      formAnimacao.setValue(0);
      buscarEventos();
    } catch (error: any) {
      Alert.alert('Erro', error.message);
    } finally {
      setSalvando(false);
    }
  };

  const eventosPorData = useMemo(() => {
    return eventos.reduce((acc: Record<string, Evento[]>, evento) => {
      if (!acc[evento.data_evento]) acc[evento.data_evento] = [];
      acc[evento.data_evento].push(evento);
      return acc;
    }, {});
  }, [eventos]);

  const eventosDoDia = dataSelecionada ? eventosPorData[dataSelecionada] || [] : [];

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
    setDiaSelecionado(diaSelecionado === dia ? null : dia);
    setFormularioAberto(false);
    formAnimacao.setValue(0);
  };

  const formMaxHeight = formAnimacao.interpolate({ inputRange: [0, 1], outputRange: [0, 400] });
  const formOpacity = formAnimacao.interpolate({ inputRange: [0, 0.5, 1], outputRange: [0, 0, 1] });
  const diaSecaoScale = diaAnimacao.interpolate({ inputRange: [0, 1], outputRange: [0.95, 1] });
  const diaSecaoOpacity = diaAnimacao.interpolate({ inputRange: [0, 1], outputRange: [0, 1] });

  const sombraCard = {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: isDark ? 0.25 : 0.06,
    shadowRadius: 8,
    elevation: 3,
  };

  const estiloInput = {
    backgroundColor: colors.backgroundAlt,
    borderColor: colors.border,
    color: colors.textPrimary,
    borderWidth: 1,
  };

  return (
    <SafeAreaView className="flex-1" style={{ backgroundColor: colors.background }}>
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
          <ScreenHeader
            title="Calendário"
            subtitle="Datas do ano e eventos agendados pela administração."
            right={<ThemeToggle />}
          />

          <View
            className="rounded-2xl p-4 mb-5"
            style={{ backgroundColor: colors.card, borderWidth: 1, borderColor: colors.border, ...sombraCard }}
          >
            <View className="flex-row justify-between items-center mb-4">
              <TouchableOpacity
                onPress={() => mudarMes(-1)}
                className="w-10 h-10 rounded-full items-center justify-center"
                style={{ backgroundColor: colors.accentSoft }}
              >
                <Text className="font-bold text-lg" style={{ color: colors.accent }}>
                  {'<'}
                </Text>
              </TouchableOpacity>
              <Text className="text-lg font-bold" style={{ color: colors.textPrimary }}>
                {NOMES_MESES[mesSelecionado]} {anoSelecionado}
              </Text>
              <TouchableOpacity
                onPress={() => mudarMes(1)}
                className="w-10 h-10 rounded-full items-center justify-center"
                style={{ backgroundColor: colors.accentSoft }}
              >
                <Text className="font-bold text-lg" style={{ color: colors.accent }}>
                  {'>'}
                </Text>
              </TouchableOpacity>
            </View>

            <View className="flex-row justify-between mb-2">
              {NOMES_DIAS.map((dia, index) => (
                <Text
                  key={`dia-semana-${index}`}
                  className="w-[13%] text-center font-bold text-xs"
                  style={{ color: colors.textSecondary }}
                >
                  {dia}
                </Text>
              ))}
            </View>

            <View className="flex-row flex-wrap justify-between">
              {diasCalendario.map((dia, index) => {
                if (!dia) return <View key={`vazio-${index}`} className="w-[13%] h-10 mb-2" />;

                const data = `${anoSelecionado}-${`${mesSelecionado + 1}`.padStart(2, '0')}-${`${dia}`.padStart(2, '0')}`;
                const temEvento = Boolean(eventosPorData[data]?.length);
                const selecionado = dia === diaSelecionado;
                const ehHoje =
                  dia === hoje.getDate() &&
                  mesSelecionado === hoje.getMonth() &&
                  anoSelecionado === hoje.getFullYear();

                const fundo = selecionado ? colors.accent : ehHoje ? colors.accentSoft : colors.backgroundAlt;
                const corTexto = selecionado ? colors.onAccent : ehHoje ? colors.accent : colors.textPrimary;

                return (
                  <TouchableOpacity
                    key={data}
                    className="w-[13%] h-10 mb-2 rounded-xl items-center justify-center"
                    style={{ backgroundColor: fundo }}
                    onPress={() => selecionarDia(dia)}
                    activeOpacity={0.7}
                  >
                    <Text className="font-semibold text-xs" style={{ color: corTexto }}>
                      {dia}
                    </Text>
                    {temEvento && (
                      <View
                        className="w-1.5 h-1.5 rounded-full mt-0.5"
                        style={{ backgroundColor: selecionado ? colors.onAccent : colors.accent }}
                      />
                    )}
                  </TouchableOpacity>
                );
              })}
            </View>
          </View>

          {diaSelecionado !== null && dataSelecionada && (
            <Animated.View style={{ opacity: diaSecaoOpacity, transform: [{ scale: diaSecaoScale }] }}>
              <View
                className="rounded-2xl p-5 mb-5"
                style={{ backgroundColor: colors.card, borderWidth: 1, borderColor: colors.border, ...sombraCard }}
              >
                <View className="flex-row items-center justify-between mb-4">
                  <View className="flex-row items-center">
                    <View
                      className="w-10 h-10 rounded-full items-center justify-center mr-3"
                      style={{ backgroundColor: colors.accent }}
                    >
                      <Text className="font-bold text-sm" style={{ color: colors.onAccent }}>
                        {diaSelecionado}
                      </Text>
                    </View>
                    <View>
                      <Text className="text-base font-bold" style={{ color: colors.textPrimary }}>
                        {formatarDataExibicao(dataSelecionada)}
                      </Text>
                      <Text className="text-xs" style={{ color: colors.textSecondary }}>
                        {NOMES_DIAS[new Date(anoSelecionado, mesSelecionado, diaSelecionado).getDay()]}
                        {', '}
                        {NOMES_MESES[mesSelecionado]}
                      </Text>
                    </View>
                  </View>
                  {eventosDoDia.length > 0 && (
                    <View className="px-3 py-1 rounded-full" style={{ backgroundColor: colors.accentSoft }}>
                      <Text className="text-xs font-bold" style={{ color: colors.accent }}>
                        {eventosDoDia.length} evento{eventosDoDia.length > 1 ? 's' : ''}
                      </Text>
                    </View>
                  )}
                </View>

                {carregando ? (
                  <Text className="text-center py-4" style={{ color: colors.textSecondary }}>
                    Carregando eventos...
                  </Text>
                ) : eventosDoDia.length === 0 ? (
                  <EmptyState icon="📅" title="Nenhum evento agendado" message="Não há eventos para esta data." />
                ) : (
                  eventosDoDia.map((evento, index) => (
                    <View key={`${evento.id || evento.titulo}-${index}`} className="flex-row items-start mb-3">
                      <View
                        className="w-1 rounded-full mr-3 mt-1"
                        style={{ height: '100%', minHeight: 40, backgroundColor: colors.accent }}
                      />
                      <View className="flex-1 p-3 rounded-xl" style={{ backgroundColor: colors.backgroundAlt }}>
                        <Text className="font-bold text-sm" style={{ color: colors.textPrimary }}>
                          {evento.titulo}
                        </Text>
                        {evento.horario_evento && (
                          <Text className="text-xs font-semibold mt-1" style={{ color: colors.accent }}>
                            🕐 {evento.horario_evento}
                          </Text>
                        )}
                        {evento.descricao ? (
                          <Text className="text-xs mt-1" style={{ color: colors.textSecondary }}>
                            {evento.descricao}
                          </Text>
                        ) : null}
                      </View>
                    </View>
                  ))
                )}

                {ehAdministrador && (
                  <View className="mt-2">
                    <TouchableOpacity
                      className="flex-row items-center justify-center py-3 rounded-xl"
                      style={{ backgroundColor: formularioAberto ? colors.backgroundAlt : colors.accent }}
                      onPress={toggleFormulario}
                      activeOpacity={0.8}
                    >
                      <Text
                        className="font-bold text-sm"
                        style={{ color: formularioAberto ? colors.textSecondary : colors.onAccent }}
                      >
                        {formularioAberto ? '✕  Cancelar' : '+  Agendar evento neste dia'}
                      </Text>
                    </TouchableOpacity>

                    <Animated.View style={{ maxHeight: formMaxHeight, opacity: formOpacity, overflow: 'hidden' }}>
                      <View className="mt-4">
                        <Text className="text-xs font-semibold mb-1 ml-1" style={{ color: colors.textSecondary }}>
                          TÍTULO
                        </Text>
                        <TextInput
                          className="h-[46px] rounded-xl px-4 mb-3"
                          style={estiloInput}
                          placeholder="Nome do evento"
                          placeholderTextColor={colors.textMuted}
                          value={titulo}
                          onChangeText={setTitulo}
                          onFocus={() => setTimeout(() => scrollViewRef.current?.scrollToEnd({ animated: true }), 300)}
                        />

                        <Text className="text-xs font-semibold mb-1 ml-1" style={{ color: colors.textSecondary }}>
                          HORÁRIO
                        </Text>
                        <TextInput
                          className="h-[46px] rounded-xl px-4 mb-3"
                          style={estiloInput}
                          placeholder="HH:MM (ex: 19:30)"
                          placeholderTextColor={colors.textMuted}
                          value={horarioEvento}
                          onChangeText={setHorarioEvento}
                          keyboardType="numbers-and-punctuation"
                          onFocus={() => setTimeout(() => scrollViewRef.current?.scrollToEnd({ animated: true }), 300)}
                        />

                        <Text className="text-xs font-semibold mb-1 ml-1" style={{ color: colors.textSecondary }}>
                          DESCRIÇÃO (OPCIONAL)
                        </Text>
                        <TextInput
                          className="rounded-xl px-4 py-3 mb-4"
                          style={{ ...estiloInput, minHeight: 70, textAlignVertical: 'top' }}
                          placeholder="Detalhes sobre o evento..."
                          placeholderTextColor={colors.textMuted}
                          value={descricao}
                          onChangeText={setDescricao}
                          multiline
                          numberOfLines={3}
                          onFocus={() => setTimeout(() => scrollViewRef.current?.scrollToEnd({ animated: true }), 300)}
                        />

                        <TouchableOpacity
                          className="h-[48px] rounded-xl items-center justify-center"
                          style={{ backgroundColor: colors.accent, opacity: salvando ? 0.6 : 1 }}
                          onPress={agendarEvento}
                          disabled={salvando}
                          activeOpacity={0.8}
                        >
                          <Text className="font-bold text-sm" style={{ color: colors.onAccent }}>
                            {salvando ? 'Salvando...' : 'Salvar evento'}
                          </Text>
                        </TouchableOpacity>
                      </View>
                    </Animated.View>
                  </View>
                )}
              </View>
            </Animated.View>
          )}

          {diaSelecionado === null && (
            <EmptyState icon="👆" title="Selecione um dia no calendário" message="Toque em uma data para ver os eventos." />
          )}
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
