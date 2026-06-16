import React, { useEffect, useState } from 'react';
import { ActivityIndicator, RefreshControl, ScrollView, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { BASE_URL } from '../../config/api';
import { fetchJson } from '../../utils/apiClient';
import { useTheme } from '../../context/ThemeContext';
import { useResponsive } from '../../utils/responsive';
import ScreenHeader from '../../components/ScreenHeader';
import EmptyState from '../../components/EmptyState';
import LevelProgressCard from '../../components/LevelProgressCard';
import AchievementBadge from '../../components/AchievementBadge';
import RankingList from '../../components/RankingList';

type Conquista = {
  codigo: string;
  titulo: string;
  descricao: string;
  icone: string;
  desbloqueada: boolean;
};

type Perfil = {
  membro: { id: string; nome: string };
  pontos: number;
  nivel: {
    numero: number;
    nome: string;
    icone?: string;
    progressoPct: number;
    proximoNivel: string | null;
    pontosParaProximo: number;
  };
  resumo: { presencas: number; faltas: number; frequencia: number };
  streak: number;
  conquistas: Conquista[];
  conquistasDesbloqueadas: number;
  conquistasTotal: number;
};

type ItemRanking = {
  membro_id: string;
  nome: string;
  pontos: number;
  posicao: number;
  nivel: { numero: number; nome: string; icone: string };
};

export default function GamificacaoScreen() {
  const { colors, isDark } = useTheme();
  const { screenPadding, width } = useResponsive();
  const [usuario, setUsuario] = useState<any>(null);
  const [perfil, setPerfil] = useState<Perfil | null>(null);
  const [ranking, setRanking] = useState<ItemRanking[]>([]);
  const [carregando, setCarregando] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [erro, setErro] = useState('');

  const carregar = async (membroId: string) => {
    try {
      setErro('');
      const [dadosPerfil, dadosRanking] = await Promise.all([
        fetchJson(`${BASE_URL}/gamificacao/${membroId}`),
        fetchJson(`${BASE_URL}/gamificacao/ranking`),
      ]);
      setPerfil(dadosPerfil);
      setRanking(dadosRanking.ranking || []);
    } catch (error: any) {
      setErro(error.message || 'Erro ao carregar a gamificação.');
    } finally {
      setCarregando(false);
    }
  };

  useEffect(() => {
    (async () => {
      const usuarioStorage = await AsyncStorage.getItem('usuario');
      if (usuarioStorage) {
        const u = JSON.parse(usuarioStorage);
        setUsuario(u);
        carregar(u.id);
      } else {
        setCarregando(false);
        setErro('Faça login novamente para ver seu progresso.');
      }
    })();
  }, []);

  const onRefresh = async () => {
    if (!usuario?.id) return;
    setRefreshing(true);
    await carregar(usuario.id);
    setRefreshing(false);
  };

  const posicaoUsuario = ranking.find((r) => r.membro_id === usuario?.id)?.posicao ?? null;
  const larguraBadge = (width - screenPadding * 2 - 12) / 2;

  const sombraCard = {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: isDark ? 0.2 : 0.05,
    shadowRadius: 4,
    elevation: 2,
  };

  return (
    <SafeAreaView className="flex-1" style={{ backgroundColor: colors.background }}>
      <ScrollView
        contentContainerStyle={{ padding: screenPadding, paddingBottom: 60 }}
        showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={[colors.accent]} tintColor={colors.accent} />}
      >
        <ScreenHeader
          title="Minha Manga"
          subtitle="Seu progresso no Clube da Manga."
        />

        {carregando ? (
          <View className="items-center py-12">
            <ActivityIndicator size="large" color={colors.accent} />
            <Text className="mt-3 text-sm" style={{ color: colors.textSecondary }}>
              Carregando seu progresso...
            </Text>
          </View>
        ) : erro ? (
          <EmptyState icon="⚠️" title="Não foi possível carregar" message={erro} />
        ) : perfil ? (
          <>
            <LevelProgressCard nivel={perfil.nivel} pontos={perfil.pontos} posicaoRanking={posicaoUsuario} />

            <View className="flex-row mb-6" style={{ gap: 10 }}>
              {[
                { valor: `${perfil.streak}`, rotulo: 'Sequência', icone: '🔥' },
                { valor: `${perfil.resumo.frequencia}%`, rotulo: 'Frequência', icone: '✅' },
                { valor: `${perfil.resumo.presencas}`, rotulo: 'Presenças', icone: '🥁' },
              ].map((item) => (
                <View
                  key={item.rotulo}
                  className="flex-1 p-3 rounded-2xl items-center min-w-0"
                  style={{ backgroundColor: colors.card, borderWidth: 1, borderColor: colors.border, ...sombraCard }}
                >
                  <Text style={{ fontSize: 18 }}>{item.icone}</Text>
                  <Text className="text-lg font-bold mt-1" style={{ color: colors.textPrimary }}>
                    {item.valor}
                  </Text>
                  <Text className="text-[10px] text-center" style={{ color: colors.textSecondary }} numberOfLines={1}>
                    {item.rotulo}
                  </Text>
                </View>
              ))}
            </View>

            <View className="flex-row items-center justify-between mb-3">
              <Text className="text-lg font-bold" style={{ color: colors.textPrimary }}>
                Conquistas
              </Text>
              <Text className="text-xs font-bold" style={{ color: colors.accent }}>
                {perfil.conquistasDesbloqueadas}/{perfil.conquistasTotal}
              </Text>
            </View>

            <View className="flex-row flex-wrap mb-6" style={{ gap: 12 }}>
              {perfil.conquistas.map((c) => (
                <AchievementBadge key={c.codigo} conquista={c} largura={larguraBadge} />
              ))}
            </View>

            <Text className="text-lg font-bold mb-3" style={{ color: colors.textPrimary }}>
              Ranking dos ritmistas
            </Text>
            {ranking.length === 0 ? (
              <EmptyState icon="🏆" title="Ranking vazio" message="Registre presenças para aparecer aqui." />
            ) : (
              <RankingList ranking={ranking} usuarioId={usuario?.id} />
            )}
          </>
        ) : null}
      </ScrollView>
    </SafeAreaView>
  );
}
