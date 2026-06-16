import React, { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  RefreshControl,
  ScrollView,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useRouter, type Href } from 'expo-router';
import { BASE_URL } from '../../config/api';
import { fetchJson } from '../../utils/apiClient';
import { useTheme } from '../../context/ThemeContext';
import ScreenHeader from '../../components/ScreenHeader';
import EmptyState from '../../components/EmptyState';
import MemberAvatar from '../../components/MemberAvatar';
import { useResponsive } from '../../utils/responsive';
import { ROTULO_PERFIL } from '../../utils/memberUtils';

type Membro = {
  id: string;
  nome: string;
  email: string;
  perfil_acesso: string;
  instrumento?: string | null;
  avatar_url?: string | null;
};

const PERFIS_DISPONIVEIS = ['Administrador', 'Gestor de Módulo', 'Membro'] as const;

export default function MembrosScreen() {
  const router = useRouter();
  const { colors, isDark } = useTheme();
  const { screenPadding, isSmall } = useResponsive();
  const [membros, setMembros] = useState<Membro[]>([]);
  const [carregando, setCarregando] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [busca, setBusca] = useState('');
  const [filtroAtivo, setFiltroAtivo] = useState<string | null>(null);
  const [usuario, setUsuario] = useState<any>(null);
  const [atualizandoId, setAtualizandoId] = useState<string | null>(null);

  const ehAdministrador = usuario?.perfil_acesso === 'Administrador';

  const corPerfil = (perfilNome: string) => {
    if (perfilNome === 'Administrador') return { bg: colors.dangerSoft, text: colors.dangerText };
    if (perfilNome === 'Gestor de Módulo') return { bg: colors.accentSoft, text: colors.accent };
    return { bg: colors.successSoft, text: colors.successText };
  };

  useEffect(() => {
    const carregarUsuario = async () => {
      const usuarioStorage = await AsyncStorage.getItem('usuario');
      if (usuarioStorage) setUsuario(JSON.parse(usuarioStorage));
    };
    carregarUsuario();
    carregarMembros();
  }, []);

  const carregarMembros = async () => {
    try {
      setCarregando(true);
      const dados = await fetchJson(`${BASE_URL}/membros`);
      setMembros(dados.membros || []);
    } catch (error: any) {
      Alert.alert('Erro', error.message);
    } finally {
      setCarregando(false);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await carregarMembros();
    setRefreshing(false);
  };

  const atualizarPerfil = async (membro: Membro, novoPerfil: string) => {
    if (!ehAdministrador || !usuario?.id) return;

    const perfilAtual = membro.perfil_acesso || 'Membro';
    if (perfilAtual === novoPerfil) {
      Alert.alert('Perfil inalterado', `${membro.nome} já possui este perfil.`);
      return;
    }

    try {
      setAtualizandoId(membro.id);
      await fetchJson(`${BASE_URL}/membros/${membro.id}/perfil`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ perfil_acesso: novoPerfil }),
      });

      setMembros((lista) =>
        lista.map((m) => (m.id === membro.id ? { ...m, perfil_acesso: novoPerfil } : m))
      );

      if (usuario.id === membro.id) {
        const usuarioAtualizado = { ...usuario, perfil_acesso: novoPerfil };
        setUsuario(usuarioAtualizado);
        await AsyncStorage.setItem('usuario', JSON.stringify(usuarioAtualizado));
      }

      Alert.alert('Sucesso', `Perfil de ${membro.nome} alterado para ${ROTULO_PERFIL[novoPerfil] || novoPerfil}.`);
    } catch (error: any) {
      Alert.alert('Erro', error.message);
    } finally {
      setAtualizandoId(null);
    }
  };

  const abrirAlteracaoPerfil = (membro: Membro) => {
    if (!ehAdministrador) return;

    Alert.alert('Alterar perfil de acesso', `Selecione o novo perfil para ${membro.nome}:`, [
      ...PERFIS_DISPONIVEIS.map((perfil) => ({
        text: ROTULO_PERFIL[perfil],
        onPress: () => atualizarPerfil(membro, perfil),
      })),
      { text: 'Cancelar', style: 'cancel' as const },
    ]);
  };

  const abrirPerfil = (membroId: string) => {
    router.push(`/(painel)/perfil/${membroId}` as Href);
  };

  const membrosFiltrados = membros.filter((m) => {
    const perfil = m.perfil_acesso || 'Membro';
    const buscaMatch =
      !busca ||
      m.nome.toLowerCase().includes(busca.toLowerCase()) ||
      m.email.toLowerCase().includes(busca.toLowerCase());
    const filtroMatch = !filtroAtivo || perfil === filtroAtivo;
    return buscaMatch && filtroMatch;
  });

  const contadores = {
    total: membros.length,
    Administrador: membros.filter((m) => m.perfil_acesso === 'Administrador').length,
    'Gestor de Módulo': membros.filter((m) => m.perfil_acesso === 'Gestor de Módulo').length,
    Membro: membros.filter((m) => !m.perfil_acesso || m.perfil_acesso === 'Membro').length,
  };

  const filtros = [
    { key: null, label: 'Todos', count: contadores.total },
    { key: 'Administrador', label: 'Admins', count: contadores.Administrador },
    { key: 'Gestor de Módulo', label: 'Gestores', count: contadores['Gestor de Módulo'] },
    { key: 'Membro', label: 'Membros', count: contadores.Membro },
  ];

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
          title="Membros"
          subtitle="Gestão dos integrantes da bateria."
          hint={
            ehAdministrador
              ? 'Toque no card para ver o perfil. Segure o avatar para alterar o perfil de acesso.'
              : 'Toque no card para ver o perfil do ritmista.'
          }
        />

        <View
          className={`flex-row rounded-2xl ${isSmall ? 'p-3' : 'p-4'} mb-5`}
          style={{ backgroundColor: colors.card, borderWidth: 1, borderColor: colors.border, ...sombraCard }}
        >
          {[
            { valor: contadores.total, rotulo: 'Total', cor: colors.textPrimary },
            { valor: contadores.Administrador, rotulo: 'Admins', cor: colors.dangerText },
            { valor: contadores['Gestor de Módulo'], rotulo: 'Gestores', cor: colors.accent },
            { valor: contadores.Membro, rotulo: 'Membros', cor: colors.successText },
          ].map((item, idx) => (
            <React.Fragment key={item.rotulo}>
              {idx > 0 && <View style={{ width: 1, backgroundColor: colors.border }} />}
              <View className="flex-1 items-center min-w-0 px-0.5">
                <Text className={`${isSmall ? 'text-xl' : 'text-2xl'} font-bold`} style={{ color: item.cor }}>
                  {item.valor}
                </Text>
                <Text className="text-[10px] font-semibold text-center" style={{ color: colors.textSecondary }} numberOfLines={1}>
                  {item.rotulo}
                </Text>
              </View>
            </React.Fragment>
          ))}
        </View>

        <View
          className="rounded-2xl flex-row items-center px-4 mb-4"
          style={{ backgroundColor: colors.card, borderWidth: 1, borderColor: colors.border, height: 46 }}
        >
          <Text style={{ color: colors.textSecondary, marginRight: 8 }}>🔍</Text>
          <TextInput
            className="flex-1 text-sm"
            style={{ color: colors.textPrimary }}
            placeholder="Buscar por nome ou e-mail..."
            placeholderTextColor={colors.textMuted}
            value={busca}
            onChangeText={setBusca}
          />
          {busca.length > 0 && (
            <TouchableOpacity onPress={() => setBusca('')}>
              <Text style={{ color: colors.textSecondary }} className="text-sm">
                ✕
              </Text>
            </TouchableOpacity>
          )}
        </View>

        <ScrollView horizontal showsHorizontalScrollIndicator={false} className="mb-4" contentContainerStyle={{ gap: 8 }}>
          {filtros.map((f) => {
            const ativo = filtroAtivo === f.key;
            return (
              <TouchableOpacity
                key={f.label}
                className="px-4 py-2 rounded-full flex-row items-center"
                style={{
                  backgroundColor: ativo ? colors.accent : colors.card,
                  borderWidth: ativo ? 0 : 1,
                  borderColor: colors.border,
                }}
                onPress={() => setFiltroAtivo(ativo ? null : f.key)}
                activeOpacity={0.7}
              >
                <Text className="text-xs font-bold" style={{ color: ativo ? colors.onAccent : colors.textSecondary }}>
                  {f.label}
                </Text>
                <View
                  className="ml-2 px-1.5 py-0.5 rounded-full"
                  style={{ backgroundColor: ativo ? 'rgba(255,255,255,0.3)' : colors.backgroundAlt }}
                >
                  <Text className="text-[10px] font-bold" style={{ color: ativo ? colors.onAccent : colors.textSecondary }}>
                    {f.count}
                  </Text>
                </View>
              </TouchableOpacity>
            );
          })}
        </ScrollView>

        {carregando ? (
          <View className="items-center py-12">
            <ActivityIndicator size="large" color={colors.accent} />
            <Text className="mt-3 text-sm" style={{ color: colors.textSecondary }}>
              Carregando membros...
            </Text>
          </View>
        ) : membrosFiltrados.length === 0 ? (
          <EmptyState
            icon="🔍"
            title="Nenhum membro encontrado"
            message={busca ? `Sem resultados para "${busca}".` : 'Ajuste os filtros e tente novamente.'}
          />
        ) : (
          <View>
            <Text className="text-xs font-semibold mb-3 ml-1" style={{ color: colors.textSecondary }}>
              {membrosFiltrados.length} resultado{membrosFiltrados.length !== 1 ? 's' : ''}
            </Text>
            {membrosFiltrados.map((membro) => {
              const perfilNome = membro.perfil_acesso || 'Membro';
              const perfil = corPerfil(perfilNome);
              const ehUsuarioLogado = usuario?.id === membro.id;

              return (
                <TouchableOpacity
                  key={membro.id}
                  className="rounded-2xl mb-3 p-4"
                  style={{
                    backgroundColor: colors.card,
                    borderWidth: 1,
                    borderColor: ehUsuarioLogado ? colors.accent : colors.border,
                    ...sombraCard,
                  }}
                  onPress={() => abrirPerfil(membro.id)}
                  activeOpacity={0.85}
                >
                  <View className="flex-row items-center">
                    {ehAdministrador ? (
                      <TouchableOpacity
                        className="mr-3"
                        onPress={() => abrirPerfil(membro.id)}
                        onLongPress={() => abrirAlteracaoPerfil(membro)}
                        delayLongPress={400}
                        activeOpacity={0.7}
                        disabled={atualizandoId === membro.id}
                      >
                        {atualizandoId === membro.id ? (
                          <View
                            className="w-12 h-12 rounded-full items-center justify-center"
                            style={{ backgroundColor: colors.accent }}
                          >
                            <ActivityIndicator size="small" color={colors.onAccent} />
                          </View>
                        ) : (
                          <MemberAvatar
                            nome={membro.nome}
                            avatarUrl={membro.avatar_url}
                            tamanho="sm"
                            destacado
                          />
                        )}
                      </TouchableOpacity>
                    ) : (
                      <View className="mr-3">
                        <MemberAvatar nome={membro.nome} avatarUrl={membro.avatar_url} tamanho="sm" />
                      </View>
                    )}
                    <View className="flex-1 min-w-0">
                      <View className="flex-row items-center flex-wrap">
                        <Text className="font-bold text-sm shrink" style={{ color: colors.textPrimary }} numberOfLines={1}>
                          {membro.nome}
                        </Text>
                        {ehUsuarioLogado && (
                          <View className="ml-2 px-2 py-0.5 rounded-full" style={{ backgroundColor: colors.accent }}>
                            <Text className="text-[9px] font-bold" style={{ color: colors.onAccent }}>
                              VOCÊ
                            </Text>
                          </View>
                        )}
                      </View>
                      <Text className="text-xs mt-0.5" style={{ color: colors.textSecondary }} numberOfLines={1}>
                        {membro.email}
                      </Text>
                      {membro.instrumento ? (
                        <Text className="text-[10px] mt-0.5 font-semibold" style={{ color: colors.accent }} numberOfLines={1}>
                          🥁 {membro.instrumento}
                        </Text>
                      ) : null}
                    </View>
                    <View className="px-2 py-1.5 rounded-full shrink-0 ml-1" style={{ backgroundColor: perfil.bg }}>
                      <Text className="text-[10px] font-bold" style={{ color: perfil.text }}>
                        {ROTULO_PERFIL[perfilNome] || perfilNome}
                      </Text>
                    </View>
                  </View>
                </TouchableOpacity>
              );
            })}
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}
