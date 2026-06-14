import React, { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  RefreshControl,
  SafeAreaView,
  ScrollView,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useRouter } from 'expo-router';
import { BASE_URL } from '../../config/api';

type Membro = {
  id: string;
  nome: string;
  email: string;
  perfil_acesso: string;
};

const PERFIS_DISPONIVEIS = ['Administrador', 'Gestor de Módulo', 'Membro'] as const;

const PERFIL_COR: Record<string, { bg: string; text: string; label: string }> = {
  Administrador: { bg: 'bg-[#fdecea]', text: 'text-[#d32f2f]', label: 'Administrador' },
  'Gestor de Módulo': { bg: 'bg-[#fff3eb]', text: 'text-manga-orangeDark', label: 'Gestor' },
  Membro: { bg: 'bg-[#e8f5e9]', text: 'text-[#388e3c]', label: 'Membro' },
};

function obterIniciais(nome: string) {
  return nome
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map((p) => p[0].toUpperCase())
    .join('');
}

export default function MembrosScreen() {
  const router = useRouter();
  const [membros, setMembros] = useState<Membro[]>([]);
  const [carregando, setCarregando] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [busca, setBusca] = useState('');
  const [filtroAtivo, setFiltroAtivo] = useState<string | null>(null);
  const [usuario, setUsuario] = useState<any>(null);
  const [atualizandoId, setAtualizandoId] = useState<string | null>(null);

  const ehAdministrador = usuario?.perfil_acesso === 'Administrador';

  useEffect(() => {
    const carregarUsuario = async () => {
      const usuarioStorage = await AsyncStorage.getItem('usuario');
      if (usuarioStorage) setUsuario(JSON.parse(usuarioStorage));
    };
    carregarUsuario();
  }, []);

  useEffect(() => {
    carregarMembros();
  }, []);

  const carregarMembros = async () => {
    try {
      setCarregando(true);
      const resposta = await fetch(`${BASE_URL}/membros`);
      const dados = await resposta.json();

      if (!resposta.ok) {
        throw new Error(dados.message || 'Erro ao carregar membros.');
      }

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
      Alert.alert('Perfil inalterado', `${membro.nome} ja possui este perfil.`);
      return;
    }

    try {
      setAtualizandoId(membro.id);
      const resposta = await fetch(`${BASE_URL}/membros/${membro.id}/perfil`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          perfil_acesso: novoPerfil,
          solicitante_id: usuario.id,
        }),
      });

      const dados = await resposta.json();

      if (!resposta.ok) {
        throw new Error(dados.message || 'Erro ao atualizar perfil.');
      }

      setMembros((lista) =>
        lista.map((m) => (m.id === membro.id ? { ...m, perfil_acesso: novoPerfil } : m))
      );

      if (usuario.id === membro.id) {
        const usuarioAtualizado = { ...usuario, perfil_acesso: novoPerfil };
        setUsuario(usuarioAtualizado);
        await AsyncStorage.setItem('usuario', JSON.stringify(usuarioAtualizado));
      }

      Alert.alert('Sucesso', `Perfil de ${membro.nome} alterado para ${PERFIL_COR[novoPerfil]?.label || novoPerfil}.`);
    } catch (error: any) {
      Alert.alert('Erro', error.message);
    } finally {
      setAtualizandoId(null);
    }
  };

  const abrirAlteracaoPerfil = (membro: Membro) => {
    if (!ehAdministrador) return;

    Alert.alert(
      'Alterar perfil',
      `Selecione o novo perfil para ${membro.nome}:`,
      [
        ...PERFIS_DISPONIVEIS.map((perfil) => ({
          text: PERFIL_COR[perfil].label,
          onPress: () => atualizarPerfil(membro, perfil),
        })),
        { text: 'Cancelar', style: 'cancel' as const },
      ]
    );
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

  return (
    <SafeAreaView className="flex-1 bg-[#f5f5f5]">
      <ScrollView
        contentContainerStyle={{ padding: 24, paddingBottom: 60 }}
        showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={['#E65100']} />}
      >
        <View className="mb-5 mt-4">
          <View className="flex-row items-center mb-1">
            <TouchableOpacity onPress={() => router.back()} className="mr-3">
              <Text className="text-manga-orangeDark font-bold text-2xl">{'‹'}</Text>
            </TouchableOpacity>
            <Text className="text-2xl font-bold text-[#333]">Membros</Text>
          </View>
          <Text className="text-sm text-manga-gray font-semibold ml-7">
            Gestao dos integrantes da bateria.
          </Text>
          {ehAdministrador && (
            <Text className="text-xs text-manga-orangeDark font-semibold ml-7 mt-1">
              Toque no avatar de um membro para alterar o perfil.
            </Text>
          )}
        </View>

        <View className="flex-row bg-manga-white rounded-2xl border border-[#e0e0e0] p-4 mb-5" style={{ shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.05, shadowRadius: 4, elevation: 2 }}>
          <View className="flex-1 items-center">
            <Text className="text-2xl font-bold text-[#333]">{contadores.total}</Text>
            <Text className="text-xs text-manga-gray font-semibold">Total</Text>
          </View>
          <View className="w-[1px] bg-[#e0e0e0]" />
          <View className="flex-1 items-center">
            <Text className="text-2xl font-bold text-[#d32f2f]">{contadores.Administrador}</Text>
            <Text className="text-xs text-manga-gray font-semibold">Admins</Text>
          </View>
          <View className="w-[1px] bg-[#e0e0e0]" />
          <View className="flex-1 items-center">
            <Text className="text-2xl font-bold text-manga-orangeDark">{contadores['Gestor de Módulo']}</Text>
            <Text className="text-xs text-manga-gray font-semibold">Gestores</Text>
          </View>
          <View className="w-[1px] bg-[#e0e0e0]" />
          <View className="flex-1 items-center">
            <Text className="text-2xl font-bold text-[#388e3c]">{contadores.Membro}</Text>
            <Text className="text-xs text-manga-gray font-semibold">Membros</Text>
          </View>
        </View>

        <View className="bg-[#fff] rounded-xl border border-[#e0e0e0] flex-row items-center px-4 mb-4" style={{ height: 46 }}>
          <Text className="text-manga-gray mr-2">🔍</Text>
          <TextInput
            className="flex-1 text-[#333] text-sm"
            placeholder="Buscar por nome ou e-mail..."
            placeholderTextColor="#aaa"
            value={busca}
            onChangeText={setBusca}
          />
          {busca.length > 0 && (
            <TouchableOpacity onPress={() => setBusca('')}>
              <Text className="text-manga-gray text-sm">✕</Text>
            </TouchableOpacity>
          )}
        </View>

        <ScrollView horizontal showsHorizontalScrollIndicator={false} className="mb-4" contentContainerStyle={{ gap: 8 }}>
          {filtros.map((f) => {
            const ativo = filtroAtivo === f.key;
            return (
              <TouchableOpacity
                key={f.label}
                className={`px-4 py-2 rounded-full flex-row items-center ${ativo ? 'bg-manga-orangeDark' : 'bg-manga-white border border-[#e0e0e0]'}`}
                onPress={() => setFiltroAtivo(ativo ? null : f.key)}
                activeOpacity={0.7}
              >
                <Text className={`text-xs font-bold ${ativo ? 'text-white' : 'text-[#555]'}`}>
                  {f.label}
                </Text>
                <View className={`ml-2 px-1.5 py-0.5 rounded-full ${ativo ? 'bg-white/30' : 'bg-[#f0f0f0]'}`}>
                  <Text className={`text-[10px] font-bold ${ativo ? 'text-white' : 'text-manga-gray'}`}>{f.count}</Text>
                </View>
              </TouchableOpacity>
            );
          })}
        </ScrollView>

        {carregando ? (
          <View className="items-center py-12">
            <ActivityIndicator size="large" color="#E65100" />
            <Text className="text-manga-gray mt-3 text-sm">Carregando membros...</Text>
          </View>
        ) : membrosFiltrados.length === 0 ? (
          <View className="items-center py-12">
            <Text className="text-4xl mb-3">🔍</Text>
            <Text className="text-manga-gray text-sm text-center font-semibold">
              Nenhum membro encontrado{busca ? `\npara "${busca}"` : ''}.
            </Text>
          </View>
        ) : (
          <View>
            <Text className="text-xs text-manga-gray font-semibold mb-3 ml-1">
              {membrosFiltrados.length} resultado{membrosFiltrados.length !== 1 ? 's' : ''}
            </Text>
            {membrosFiltrados.map((membro) => {
              const perfil = PERFIL_COR[membro.perfil_acesso || 'Membro'] || PERFIL_COR.Membro;
              const ehUsuarioLogado = usuario?.id === membro.id;

              return (
                <View
                  key={membro.id}
                  className={`bg-manga-white rounded-2xl border mb-3 p-4 ${ehUsuarioLogado ? 'border-manga-orangeDark' : 'border-[#e0e0e0]'}`}
                  style={{ shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.04, shadowRadius: 4, elevation: 1 }}
                >
                  <View className="flex-row items-center">
                    {ehAdministrador ? (
                      <TouchableOpacity
                        className="w-12 h-12 rounded-full bg-manga-orangeDark items-center justify-center mr-3 border-2 border-[#ffb74d]"
                        onPress={() => abrirAlteracaoPerfil(membro)}
                        activeOpacity={0.7}
                        disabled={atualizandoId === membro.id}
                      >
                        {atualizandoId === membro.id ? (
                          <ActivityIndicator size="small" color="#fff" />
                        ) : (
                          <Text className="text-white font-bold text-base">
                            {obterIniciais(membro.nome)}
                          </Text>
                        )}
                      </TouchableOpacity>
                    ) : (
                      <View className="w-12 h-12 rounded-full bg-manga-orangeDark items-center justify-center mr-3">
                        <Text className="text-white font-bold text-base">
                          {obterIniciais(membro.nome)}
                        </Text>
                      </View>
                    )}
                    <View className="flex-1">
                      <View className="flex-row items-center">
                        <Text className="font-bold text-[#333] text-sm" numberOfLines={1}>
                          {membro.nome}
                        </Text>
                        {ehUsuarioLogado && (
                          <View className="bg-manga-orangeDark ml-2 px-2 py-0.5 rounded-full">
                            <Text className="text-white text-[9px] font-bold">VOCÊ</Text>
                          </View>
                        )}
                      </View>
                      <Text className="text-xs text-manga-gray mt-0.5" numberOfLines={1}>
                        {membro.email}
                      </Text>
                    </View>
                    <View className={`${perfil.bg} px-3 py-1.5 rounded-full`}>
                      <Text className={`${perfil.text} text-[10px] font-bold`}>
                        {perfil.label}
                      </Text>
                    </View>
                  </View>
                </View>
              );
            })}
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}
