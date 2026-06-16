import React, { useCallback, useState } from 'react';
import { View, Text, TouchableOpacity, ScrollView, ActivityIndicator, Image } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter, useFocusEffect, type Href } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { BASE_URL } from '../../config/api';
import { fetchJson } from '../../utils/apiClient';
import { useTheme } from '../../context/ThemeContext';
import ModuleCard from '../../components/ModuleCard';
import EmptyState from '../../components/EmptyState';
import ComingSoonModal from '../../components/ComingSoonModal';
import SettingsButton from '../../components/SettingsButton';
import { abreviarPerfil, useResponsive } from '../../utils/responsive';
import { useNotifications } from '../../context/NotificationContext';
import { tituloMarca } from '../../theme/typography';

type Evento = {
  id?: string;
  titulo: string;
  descricao?: string | null;
  data_evento: string;
  horario_evento?: string | null;
};

const NOMES_MESES = [
  'Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho',
  'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro',
];

const NOMES_DIAS = ['Domingo', 'Segunda', 'Terça', 'Quarta', 'Quinta', 'Sexta', 'Sábado'];

const MAX_EVENTOS_MURAL = 3;

function formatarDataEvento(dataStr: string) {
  const [ano, mes, dia] = dataStr.split('-').map(Number);
  const data = new Date(ano, mes - 1, dia);
  const diaSemana = NOMES_DIAS[data.getDay()];
  return `${diaSemana}, ${dia} de ${NOMES_MESES[mes - 1]} de ${ano}`;
}

function primeiroNome(nome?: string) {
  if (!nome) return 'Ritmista';
  return nome.trim().split(' ')[0];
}

export default function DashboardScreen() {
  const router = useRouter();
  const { colors, isDark } = useTheme();
  const { screenPadding, isSmall } = useResponsive();
  const { resyncReminders } = useNotifications();
  const [eventos, setEventos] = useState<Evento[]>([]);
  const [carregando, setCarregando] = useState(true);
  const [usuario, setUsuario] = useState<any>(null);
  const [patrimonioVisivel, setPatrimonioVisivel] = useState(false);
  const [gamResumo, setGamResumo] = useState<{ nivel: number; nome: string; pontos: number } | null>(null);
  const [feedResumo, setFeedResumo] = useState<{ total: number } | null>(null);

  const handleLogout = async () => {
    await AsyncStorage.multiRemove(['token', 'usuario']);
    router.replace('/(auth)/login');
  };

  const buscarEventos = useCallback(async () => {
    try {
      setCarregando(true);
      const anoAtual = new Date().getFullYear();
      const dados = await fetchJson(`${BASE_URL}/eventos?ano=${anoAtual}`);

      const hoje = new Date();
      hoje.setHours(0, 0, 0, 0);

      const proximos = (dados.eventos || [])
        .filter((evento: Evento) => {
          const [ano, mes, dia] = evento.data_evento.split('-').map(Number);
          return new Date(ano, mes - 1, dia) >= hoje;
        })
        .sort((a: Evento, b: Evento) => {
          const chaveA = `${a.data_evento}T${a.horario_evento || '23:59'}`;
          const chaveB = `${b.data_evento}T${b.horario_evento || '23:59'}`;
          return chaveA.localeCompare(chaveB);
        });

      setEventos(proximos);
    } catch {
      setEventos([]);
    } finally {
      setCarregando(false);
    }
  }, []);

  const carregarGamificacao = useCallback(async (membroId: string) => {
    try {
      const dados = await fetchJson(`${BASE_URL}/gamificacao/${membroId}`);
      setGamResumo({ nivel: dados.nivel.numero, nome: dados.nivel.nome, pontos: dados.pontos });
    } catch {
      setGamResumo(null);
    }
  }, []);

  const carregarFeedResumo = useCallback(async () => {
    try {
      const dados = await fetchJson(`${BASE_URL}/feed?limit=1&page=1`);
      const totalPosts = (dados.total || 0) + (dados.fixados?.length || 0);
      setFeedResumo({ total: totalPosts });
    } catch {
      setFeedResumo(null);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      (async () => {
        const usuarioStorage = await AsyncStorage.getItem('usuario');
        if (usuarioStorage) {
          const u = JSON.parse(usuarioStorage);
          setUsuario(u);
          if (u?.id) carregarGamificacao(u.id);
        }
      })();
      buscarEventos();
      carregarFeedResumo();
      resyncReminders(false);
    }, [buscarEventos, carregarGamificacao, carregarFeedResumo, resyncReminders])
  );

  const perfil = usuario?.perfil_acesso || 'Membro';
  const eventosMural = eventos.slice(0, MAX_EVENTOS_MURAL);

  const abrirMeuPerfil = () => {
    if (usuario?.id) {
      router.push(`/(painel)/perfil/${usuario.id}` as Href);
    }
  };

  const subtituloMeuPerfil = usuario?.instrumento
    ? `${usuario.instrumento} · presenças e conquistas`
    : 'Seu perfil, presenças e conquistas';

  return (
    <SafeAreaView className="flex-1" style={{ backgroundColor: colors.background }}>
      <ScrollView contentContainerStyle={{ padding: screenPadding, paddingBottom: 40 }} showsVerticalScrollIndicator={false}>
        <View className="mb-7 mt-1">
          <View className="flex-row items-start justify-between">
            <TouchableOpacity
              className="flex-1 pr-3 flex-row items-center"
              onPress={abrirMeuPerfil}
              activeOpacity={0.7}
              disabled={!usuario?.id}
            >
              <Image
                source={require('../../assets/images/logo-bateria-maua.png')}
                style={{ width: 46, height: 46, marginRight: 10 }}
                resizeMode="contain"
              />
              <Text
                className={`${isSmall ? 'text-2xl' : 'text-3xl'} flex-1`}
                style={{ color: colors.textPrimary, fontWeight: '900', letterSpacing: -0.5 }}
                numberOfLines={2}
              >
                {tituloMarca(`Olá, ${primeiroNome(usuario?.nome)}!`)}
              </Text>
            </TouchableOpacity>

            <View className="flex-row items-center shrink-0" style={{ gap: 8 }}>
              <SettingsButton />
              <TouchableOpacity
                onPress={handleLogout}
                className="px-3 py-2 rounded-full justify-center items-center"
                style={{ backgroundColor: colors.accent }}
                activeOpacity={0.85}
              >
                <Text className="text-sm font-bold" style={{ color: colors.onAccent }}>
                  Sair
                </Text>
              </TouchableOpacity>
            </View>
          </View>

          <View className="flex-row items-center flex-wrap mt-2" style={{ gap: 8 }}>
            <Text
              className="text-xs uppercase"
              style={{ color: colors.accent, fontWeight: '700', letterSpacing: 1.5 }}
            >
              Clube da Manga
            </Text>
            <View className="px-2 py-0.5 rounded-full" style={{ backgroundColor: colors.accentSoft }}>
              <Text className="text-[10px] font-bold" style={{ color: colors.accent }}>
                {abreviarPerfil(perfil)}
              </Text>
            </View>
          </View>
        </View>

        <Text className="text-xs font-bold uppercase mb-3 ml-1" style={{ color: colors.textSecondary, letterSpacing: 1 }}>
          Módulos
        </Text>

        <ModuleCard
          icon="👤"
          title="Meu Perfil"
          subtitle={subtituloMeuPerfil}
          onPress={abrirMeuPerfil}
        />
        <ModuleCard
          icon="👥"
          title="Membros"
          subtitle="Gestão da bateria"
          onPress={() => router.push('/(painel)/membros')}
        />
        <ModuleCard
          icon="✅"
          title="Presença"
          subtitle="Controle de ensaios"
          onPress={() => router.push('/(painel)/presenca')}
        />
        <ModuleCard
          icon="🥭"
          title="Minha Manga"
          subtitle={gamResumo ? `Nível ${gamResumo.nivel} · ${gamResumo.nome} · ${gamResumo.pontos} pts` : 'Pontos, níveis e conquistas'}
          onPress={() => router.push('/(painel)/gamificacao')}
        />
        <ModuleCard
          icon="📅"
          title="Calendário"
          subtitle="Eventos do ano"
          onPress={() => router.push('/(painel)/calendario')}
        />
        <ModuleCard
          icon="📢"
          title="Mural"
          subtitle={
            feedResumo
              ? feedResumo.total === 0
                ? 'Nenhuma publicação ainda'
                : feedResumo.total === 1
                  ? '1 publicação recente'
                  : `${feedResumo.total} publicações recentes`
              : 'Avisos e publicações da bateria'
          }
          onPress={() => router.push('/(painel)/feed')}
        />
        <ModuleCard
          icon="🥁"
          title="Patrimônio"
          subtitle="Instrumentos e uniformes"
          badge="Em breve"
          onPress={() => setPatrimonioVisivel(true)}
        />

        <View className="mt-5">
          <View className="flex-row items-center justify-between mb-4">
            <Text className="text-lg font-bold" style={{ color: colors.textPrimary }}>
              Próximos Eventos
            </Text>
            <TouchableOpacity onPress={() => router.push('/(painel)/calendario')}>
              <Text className="text-xs font-bold" style={{ color: colors.accent }}>
                Ver calendário ›
              </Text>
            </TouchableOpacity>
          </View>

          {carregando ? (
            <View
              className="p-6 rounded-2xl items-center"
              style={{ backgroundColor: colors.card, borderWidth: 1, borderColor: colors.border }}
            >
              <ActivityIndicator size="small" color={colors.accent} />
              <Text className="text-xs mt-2" style={{ color: colors.textSecondary }}>
                Carregando eventos...
              </Text>
            </View>
          ) : eventosMural.length === 0 ? (
            <View
              className="rounded-2xl"
              style={{ backgroundColor: colors.card, borderWidth: 1, borderColor: colors.border }}
            >
              <EmptyState
                icon="📭"
                title="Nenhum evento agendado"
                message="Os próximos eventos do calendário aparecerão aqui."
              />
            </View>
          ) : (
            eventosMural.map((evento, index) => (
              <TouchableOpacity
                key={`${evento.id || evento.titulo}-${index}`}
                onPress={() => router.push('/(painel)/calendario')}
                activeOpacity={0.85}
                className="p-4 rounded-2xl mb-3"
                style={{
                  backgroundColor: colors.card,
                  borderWidth: 1,
                  borderColor: colors.border,
                  borderLeftWidth: 4,
                  borderLeftColor: colors.accent,
                  shadowColor: '#000',
                  shadowOffset: { width: 0, height: 1 },
                  shadowOpacity: isDark ? 0.2 : 0.05,
                  shadowRadius: 4,
                  elevation: 2,
                }}
              >
                <View className="flex-row items-start justify-between">
                  <Text
                    className="font-bold flex-1 mr-2"
                    style={{ color: colors.textPrimary }}
                    numberOfLines={2}
                  >
                    {evento.titulo}
                  </Text>
                  {evento.horario_evento ? (
                    <View className="px-2 py-1 rounded-full shrink-0" style={{ backgroundColor: colors.accentSoft }}>
                      <Text className="text-xs font-bold" style={{ color: colors.accent }}>
                        {evento.horario_evento}
                      </Text>
                    </View>
                  ) : null}
                </View>
                <Text className="text-xs font-semibold mt-1" style={{ color: colors.accent }} numberOfLines={2}>
                  📅 {formatarDataEvento(evento.data_evento)}
                </Text>
                {evento.descricao ? (
                  <Text className="text-sm mt-2" style={{ color: colors.textSecondary }}>
                    {evento.descricao}
                  </Text>
                ) : null}
              </TouchableOpacity>
            ))
          )}

          {!carregando && eventos.length > MAX_EVENTOS_MURAL ? (
            <TouchableOpacity className="items-center py-2" onPress={() => router.push('/(painel)/calendario')}>
              <Text className="text-xs font-bold" style={{ color: colors.accent }}>
                Ver todos os {eventos.length} eventos ›
              </Text>
            </TouchableOpacity>
          ) : null}
        </View>
      </ScrollView>

      <ComingSoonModal
        visible={patrimonioVisivel}
        onClose={() => setPatrimonioVisivel(false)}
        title="Patrimônio"
        message="Módulo em desenvolvimento. Em breve você poderá gerenciar instrumentos e uniformes da bateria."
        icon="🥁"
      />
    </SafeAreaView>
  );
}
