import React, { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Image,
  KeyboardAvoidingView,
  Modal,
  Platform,
  RefreshControl,
  ScrollView,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as ImagePicker from 'expo-image-picker';
import { BASE_URL } from '../../config/api';
import { fetchJson } from '../../utils/apiClient';
import { useTheme } from '../../context/ThemeContext';
import { useResponsive } from '../../utils/responsive';
import { ThemeColors } from '../../theme/colors';
import ScreenHeader from '../../components/ScreenHeader';
import EmptyState from '../../components/EmptyState';
import ThemeToggle from '../../components/ThemeToggle';
import LoadingButton from '../../components/LoadingButton';

type Categoria = 'Instrumento' | 'Uniforme' | 'Equipamento';
type Estado = 'Novo' | 'Bom' | 'Regular' | 'Danificado';
type Status = 'Disponível' | 'Em uso' | 'Manutenção' | 'Emprestado' | 'Baixado';

type ItemPatrimonio = {
  id: string;
  nome: string;
  categoria: Categoria;
  codigo_patrimonio?: string;
  estado_conservacao: Estado;
  status: Status;
  responsavel_id?: string | null;
  responsavel_nome?: string | null;
  localizacao?: string;
  observacoes?: string;
  foto_url?: string | null;
};

type Membro = { id: string; nome: string };

type FotoNova = { uri: string; base64: string; mimeType: string };

const CATEGORIAS: { key: Categoria; label: string; icon: string }[] = [
  { key: 'Instrumento', label: 'Instrumentos', icon: '🥁' },
  { key: 'Uniforme', label: 'Uniformes', icon: '👕' },
  { key: 'Equipamento', label: 'Equipamentos', icon: '🧰' },
];

const ESTADOS: Estado[] = ['Novo', 'Bom', 'Regular', 'Danificado'];
const STATUS_LISTA: Status[] = ['Disponível', 'Em uso', 'Manutenção', 'Emprestado', 'Baixado'];

const iconePorCategoria = (categoria: Categoria) =>
  CATEGORIAS.find((c) => c.key === categoria)?.icon || '📦';

type FormState = {
  nome: string;
  categoria: Categoria;
  codigo_patrimonio: string;
  estado_conservacao: Estado;
  status: Status;
  responsavel_id: string | null;
  responsavel_nome: string | null;
  localizacao: string;
  observacoes: string;
  foto_url: string | null;
};

const formVazio = (categoria: Categoria): FormState => ({
  nome: '',
  categoria,
  codigo_patrimonio: '',
  estado_conservacao: 'Bom',
  status: 'Disponível',
  responsavel_id: null,
  responsavel_nome: null,
  localizacao: '',
  observacoes: '',
  foto_url: null,
});

export default function PatrimonioScreen() {
  const { colors, isDark } = useTheme();
  const { screenPadding, isSmall } = useResponsive();

  const [itens, setItens] = useState<ItemPatrimonio[]>([]);
  const [membros, setMembros] = useState<Membro[]>([]);
  const [carregando, setCarregando] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [busca, setBusca] = useState('');
  const [categoriaAtiva, setCategoriaAtiva] = useState<Categoria>('Instrumento');
  const [usuario, setUsuario] = useState<any>(null);

  const [modalVisivel, setModalVisivel] = useState(false);
  const [pickerResponsavelVisivel, setPickerResponsavelVisivel] = useState(false);
  const [editandoId, setEditandoId] = useState<string | null>(null);
  const [form, setForm] = useState<FormState>(formVazio('Instrumento'));
  const [fotoNova, setFotoNova] = useState<FotoNova | null>(null);
  const [salvando, setSalvando] = useState(false);

  const ehGestor =
    usuario?.perfil_acesso === 'Administrador' || usuario?.perfil_acesso === 'Gestor de Módulo';
  const ehAdministrador = usuario?.perfil_acesso === 'Administrador';

  useEffect(() => {
    (async () => {
      const usuarioStorage = await AsyncStorage.getItem('usuario');
      if (usuarioStorage) {
        const u = JSON.parse(usuarioStorage);
        setUsuario(u);
        if (u?.perfil_acesso === 'Administrador' || u?.perfil_acesso === 'Gestor de Módulo') {
          carregarMembros();
        }
      }
    })();
    carregarItens();
  }, []);

  const carregarItens = async () => {
    try {
      setCarregando(true);
      const dados = await fetchJson(`${BASE_URL}/patrimonio`);
      setItens(dados.itens || []);
    } catch (error: any) {
      Alert.alert('Erro', error.message || 'Não foi possível carregar o patrimônio.');
    } finally {
      setCarregando(false);
    }
  };

  const carregarMembros = async () => {
    try {
      const dados = await fetchJson(`${BASE_URL}/membros`);
      setMembros(dados.membros || []);
    } catch {
      setMembros([]);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await carregarItens();
    setRefreshing(false);
  };

  const selecionarFoto = async () => {
    const permissao = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!permissao.granted) {
      Alert.alert('Permissão necessária', 'Permita o acesso à galeria para anexar uma foto.');
      return;
    }

    const resultado = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      quality: 0.55,
      base64: true,
    });

    const asset = resultado.assets?.[0];
    if (!resultado.canceled && asset?.base64) {
      setFotoNova({ uri: asset.uri, base64: asset.base64, mimeType: asset.mimeType || 'image/jpeg' });
    }
  };

  const abrirNovo = () => {
    setEditandoId(null);
    setForm(formVazio(categoriaAtiva));
    setFotoNova(null);
    setModalVisivel(true);
  };

  const abrirEdicao = (item: ItemPatrimonio) => {
    if (!ehGestor) return;
    setEditandoId(item.id);
    setForm({
      nome: item.nome,
      categoria: item.categoria,
      codigo_patrimonio: item.codigo_patrimonio || '',
      estado_conservacao: item.estado_conservacao,
      status: item.status,
      responsavel_id: item.responsavel_id || null,
      responsavel_nome: item.responsavel_nome || null,
      localizacao: item.localizacao || '',
      observacoes: item.observacoes || '',
      foto_url: item.foto_url || null,
    });
    setFotoNova(null);
    setModalVisivel(true);
  };

  const selecionarResponsavel = (membro: Membro | null) => {
    setForm((f) => ({
      ...f,
      responsavel_id: membro?.id || null,
      responsavel_nome: membro?.nome || null,
    }));
    setPickerResponsavelVisivel(false);
  };

  const salvarItem = async () => {
    if (!form.nome.trim()) {
      Alert.alert('Nome obrigatório', 'Informe o nome/identificação do item.');
      return;
    }

    try {
      setSalvando(true);

      let fotoUrl = form.foto_url;
      if (fotoNova) {
        const upload = await fetchJson(`${BASE_URL}/patrimonio/upload`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            imagem_base64: fotoNova.base64,
            mime_type: fotoNova.mimeType,
            nome_arquivo: 'patrimonio',
          }),
        });
        fotoUrl = upload.imagem_url;
      }

      const payload = {
        nome: form.nome.trim(),
        categoria: form.categoria,
        codigo_patrimonio: form.codigo_patrimonio.trim() || null,
        estado_conservacao: form.estado_conservacao,
        status: form.status,
        responsavel_id: form.responsavel_id,
        localizacao: form.localizacao.trim() || null,
        observacoes: form.observacoes.trim() || null,
        foto_url: fotoUrl,
      };

      if (editandoId) {
        await fetchJson(`${BASE_URL}/patrimonio/${editandoId}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        });
      } else {
        await fetchJson(`${BASE_URL}/patrimonio`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        });
      }

      setCategoriaAtiva(form.categoria);
      setModalVisivel(false);
      await carregarItens();
    } catch (error: any) {
      Alert.alert('Erro', error.message || 'Não foi possível salvar.');
    } finally {
      setSalvando(false);
    }
  };

  const excluirItem = () => {
    if (!editandoId) return;
    Alert.alert('Excluir item', 'Tem certeza que deseja remover este item do patrimônio?', [
      { text: 'Cancelar', style: 'cancel' },
      {
        text: 'Excluir',
        style: 'destructive',
        onPress: async () => {
          try {
            await fetchJson(`${BASE_URL}/patrimonio/${editandoId}`, { method: 'DELETE' });
            setModalVisivel(false);
            await carregarItens();
          } catch (error: any) {
            Alert.alert('Erro', error.message || 'Não foi possível excluir.');
          }
        },
      },
    ]);
  };

  const corStatus = (status: Status) => {
    switch (status) {
      case 'Disponível':
        return { bg: colors.successSoft, text: colors.successText };
      case 'Em uso':
        return { bg: colors.accentSoft, text: colors.accent };
      case 'Manutenção':
        return { bg: colors.dangerSoft, text: colors.dangerText };
      case 'Emprestado':
        return { bg: colors.backgroundAlt, text: colors.gold };
      default:
        return { bg: colors.backgroundAlt, text: colors.textMuted };
    }
  };

  const corEstado = (estado: Estado) => {
    if (estado === 'Novo') return colors.successText;
    if (estado === 'Bom') return colors.accent;
    if (estado === 'Regular') return colors.gold;
    return colors.dangerText;
  };

  const itensCategoria = itens.filter((i) => i.categoria === categoriaAtiva);

  const itensFiltrados = itensCategoria.filter((i) => {
    if (!busca) return true;
    const alvo = `${i.nome} ${i.codigo_patrimonio || ''} ${i.responsavel_nome || ''}`.toLowerCase();
    return alvo.includes(busca.toLowerCase());
  });

  const contadores = {
    total: itensCategoria.length,
    disponiveis: itensCategoria.filter((i) => i.status === 'Disponível').length,
    manutencao: itensCategoria.filter((i) => i.status === 'Manutenção').length,
  };

  const sombraCard = {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: isDark ? 0.2 : 0.05,
    shadowRadius: 4,
    elevation: 2,
  };

  const previewFoto = fotoNova?.uri || form.foto_url;

  return (
    <SafeAreaView className="flex-1" style={{ backgroundColor: colors.background }}>
      <ScrollView
        contentContainerStyle={{ padding: screenPadding, paddingBottom: 60 }}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={[colors.accent]} tintColor={colors.accent} />
        }
      >
        <ScreenHeader
          title="Patrimônio"
          subtitle="Bens, instrumentos e uniformes da bateria."
          hint={ehGestor ? 'Toque em um item para editar ou em “Adicionar” para cadastrar.' : undefined}
          right={<ThemeToggle />}
        />

        <ScrollView horizontal showsHorizontalScrollIndicator={false} className="mb-4" contentContainerStyle={{ gap: 8 }}>
          {CATEGORIAS.map((cat) => {
            const ativo = categoriaAtiva === cat.key;
            return (
              <TouchableOpacity
                key={cat.key}
                onPress={() => setCategoriaAtiva(cat.key)}
                activeOpacity={0.7}
                className="px-4 py-2 rounded-full flex-row items-center"
                style={{
                  backgroundColor: ativo ? colors.accent : colors.card,
                  borderWidth: ativo ? 0 : 1,
                  borderColor: colors.border,
                }}
              >
                <Text className="text-sm mr-1.5">{cat.icon}</Text>
                <Text className="text-xs font-bold" style={{ color: ativo ? colors.onAccent : colors.textSecondary }}>
                  {cat.label}
                </Text>
              </TouchableOpacity>
            );
          })}
        </ScrollView>

        <View
          className={`flex-row rounded-2xl ${isSmall ? 'p-3' : 'p-4'} mb-4`}
          style={{ backgroundColor: colors.card, borderWidth: 1, borderColor: colors.border, ...sombraCard }}
        >
          {[
            { valor: contadores.total, rotulo: 'Total', cor: colors.textPrimary },
            { valor: contadores.disponiveis, rotulo: 'Disponíveis', cor: colors.successText },
            { valor: contadores.manutencao, rotulo: 'Manutenção', cor: colors.dangerText },
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
          className="rounded-2xl flex-row items-center px-4 mb-3"
          style={{ backgroundColor: colors.card, borderWidth: 1, borderColor: colors.border, height: 46 }}
        >
          <Text style={{ color: colors.textSecondary, marginRight: 8 }}>🔍</Text>
          <TextInput
            className="flex-1 text-sm"
            style={{ color: colors.textPrimary }}
            placeholder="Buscar por nome, código ou responsável..."
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

        {ehGestor && (
          <TouchableOpacity
            onPress={abrirNovo}
            activeOpacity={0.85}
            className="rounded-2xl items-center justify-center mb-4"
            style={{ backgroundColor: colors.accent, height: 46 }}
          >
            <Text className="text-sm font-bold" style={{ color: colors.onAccent }}>
              ＋ Adicionar {CATEGORIAS.find((c) => c.key === categoriaAtiva)?.label.toLowerCase()}
            </Text>
          </TouchableOpacity>
        )}

        {carregando ? (
          <View className="items-center py-12">
            <ActivityIndicator size="large" color={colors.accent} />
            <Text className="mt-3 text-sm" style={{ color: colors.textSecondary }}>
              Carregando patrimônio...
            </Text>
          </View>
        ) : itensFiltrados.length === 0 ? (
          <EmptyState
            icon={iconePorCategoria(categoriaAtiva)}
            title="Nenhum item nesta categoria"
            message={busca ? `Sem resultados para "${busca}".` : 'Cadastre o primeiro item usando o botão acima.'}
          />
        ) : (
          <View>
            <Text className="text-xs font-semibold mb-3 ml-1" style={{ color: colors.textSecondary }}>
              {itensFiltrados.length} {itensFiltrados.length !== 1 ? 'itens' : 'item'}
            </Text>
            {itensFiltrados.map((item) => {
              const status = corStatus(item.status);
              const Conteudo = (
                <View
                  className="rounded-2xl mb-3 p-3 flex-row items-center"
                  style={{ backgroundColor: colors.card, borderWidth: 1, borderColor: colors.border, ...sombraCard }}
                >
                  {item.foto_url ? (
                    <Image source={{ uri: item.foto_url }} style={{ width: 52, height: 52, borderRadius: 12 }} resizeMode="cover" />
                  ) : (
                    <View
                      className="items-center justify-center"
                      style={{ width: 52, height: 52, borderRadius: 12, backgroundColor: colors.accentSoft }}
                    >
                      <Text style={{ fontSize: 24 }}>{iconePorCategoria(item.categoria)}</Text>
                    </View>
                  )}

                  <View className="flex-1 min-w-0 ml-3">
                    <Text className="font-bold text-sm" style={{ color: colors.textPrimary }} numberOfLines={1}>
                      {item.nome}
                    </Text>
                    <View className="flex-row items-center flex-wrap mt-0.5" style={{ gap: 6 }}>
                      {item.codigo_patrimonio ? (
                        <Text className="text-[11px]" style={{ color: colors.textMuted }}>
                          {item.codigo_patrimonio}
                        </Text>
                      ) : null}
                      <View className="flex-row items-center">
                        <View style={{ width: 6, height: 6, borderRadius: 3, backgroundColor: corEstado(item.estado_conservacao), marginRight: 4 }} />
                        <Text className="text-[11px] font-semibold" style={{ color: colors.textSecondary }}>
                          {item.estado_conservacao}
                        </Text>
                      </View>
                    </View>
                    {item.responsavel_nome ? (
                      <Text className="text-[11px] mt-0.5" style={{ color: colors.textSecondary }} numberOfLines={1}>
                        Resp.: {item.responsavel_nome}
                      </Text>
                    ) : null}
                  </View>

                  <View className="px-2 py-1.5 rounded-full shrink-0 ml-1" style={{ backgroundColor: status.bg }}>
                    <Text className="text-[10px] font-bold" style={{ color: status.text }}>
                      {item.status}
                    </Text>
                  </View>
                </View>
              );

              return ehGestor ? (
                <TouchableOpacity key={item.id} activeOpacity={0.7} onPress={() => abrirEdicao(item)}>
                  {Conteudo}
                </TouchableOpacity>
              ) : (
                <View key={item.id}>{Conteudo}</View>
              );
            })}
          </View>
        )}
      </ScrollView>

      <Modal visible={modalVisivel} animationType="slide" transparent onRequestClose={() => setModalVisivel(false)}>
        <KeyboardAvoidingView
          className="flex-1 justify-end"
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
          style={{ backgroundColor: colors.overlay }}
        >
          <View
            className="rounded-t-3xl"
            style={{ backgroundColor: colors.background, maxHeight: '92%', borderTopWidth: 1, borderColor: colors.border }}
          >
            <ScrollView contentContainerStyle={{ padding: 24, paddingBottom: 40 }} showsVerticalScrollIndicator={false}>
              <View className="flex-row items-center justify-between mb-5">
                <Text className="text-lg font-bold" style={{ color: colors.textPrimary }}>
                  {editandoId ? 'Editar item' : 'Novo item'}
                </Text>
                <TouchableOpacity onPress={() => setModalVisivel(false)}>
                  <Text className="text-xl" style={{ color: colors.textSecondary }}>
                    ✕
                  </Text>
                </TouchableOpacity>
              </View>

              <TouchableOpacity
                onPress={selecionarFoto}
                activeOpacity={0.8}
                className="rounded-2xl items-center justify-center mb-4 overflow-hidden"
                style={{ height: 150, backgroundColor: colors.cardAlt, borderWidth: 1, borderColor: colors.border }}
              >
                {previewFoto ? (
                  <Image source={{ uri: previewFoto }} style={{ width: '100%', height: '100%' }} resizeMode="cover" />
                ) : (
                  <>
                    <Text style={{ fontSize: 28 }}>📷</Text>
                    <Text className="text-xs font-semibold mt-1" style={{ color: colors.textSecondary }}>
                      Adicionar foto
                    </Text>
                  </>
                )}
              </TouchableOpacity>

              <CampoTexto rotulo="Nome / identificação *" valor={form.nome} onChange={(t) => setForm((f) => ({ ...f, nome: t }))} placeholder="Ex.: Surdo de 1ª #03" colors={colors} />

              <Rotulo texto="Categoria" colors={colors} />
              <View className="flex-row mb-4" style={{ gap: 8 }}>
                {CATEGORIAS.map((cat) => {
                  const ativo = form.categoria === cat.key;
                  return (
                    <TouchableOpacity
                      key={cat.key}
                      onPress={() => setForm((f) => ({ ...f, categoria: cat.key }))}
                      className="flex-1 py-2.5 rounded-xl items-center"
                      style={{ backgroundColor: ativo ? colors.accentSoft : colors.card, borderWidth: 1, borderColor: ativo ? colors.accent : colors.border }}
                    >
                      <Text className="text-xs font-bold" style={{ color: ativo ? colors.accent : colors.textSecondary }}>
                        {cat.icon} {cat.label}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </View>

              <CampoTexto rotulo="Código de patrimônio" valor={form.codigo_patrimonio} onChange={(t) => setForm((f) => ({ ...f, codigo_patrimonio: t }))} placeholder="Ex.: INST-003" colors={colors} />

              <Rotulo texto="Responsável" colors={colors} />
              <TouchableOpacity
                onPress={() => setPickerResponsavelVisivel(true)}
                className="rounded-xl px-4 mb-4 flex-row items-center justify-between"
                style={{ backgroundColor: colors.card, borderWidth: 1, borderColor: colors.border, height: 46 }}
              >
                <Text className="text-sm" style={{ color: form.responsavel_nome ? colors.textPrimary : colors.textMuted }}>
                  {form.responsavel_nome || 'Ninguém'}
                </Text>
                <Text style={{ color: colors.textSecondary }}>⌄</Text>
              </TouchableOpacity>

              <Rotulo texto="Estado de conservação" colors={colors} />
              <View className="flex-row flex-wrap mb-4" style={{ gap: 8 }}>
                {ESTADOS.map((e) => {
                  const ativo = form.estado_conservacao === e;
                  return (
                    <TouchableOpacity
                      key={e}
                      onPress={() => setForm((f) => ({ ...f, estado_conservacao: e }))}
                      className="px-3 py-2 rounded-full"
                      style={{ backgroundColor: ativo ? colors.accent : colors.card, borderWidth: ativo ? 0 : 1, borderColor: colors.border }}
                    >
                      <Text className="text-xs font-bold" style={{ color: ativo ? colors.onAccent : colors.textSecondary }}>
                        {e}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </View>

              <Rotulo texto="Status" colors={colors} />
              <View className="flex-row flex-wrap mb-4" style={{ gap: 8 }}>
                {STATUS_LISTA.map((s) => {
                  const ativo = form.status === s;
                  return (
                    <TouchableOpacity
                      key={s}
                      onPress={() => setForm((f) => ({ ...f, status: s }))}
                      className="px-3 py-2 rounded-full"
                      style={{ backgroundColor: ativo ? colors.accent : colors.card, borderWidth: ativo ? 0 : 1, borderColor: colors.border }}
                    >
                      <Text className="text-xs font-bold" style={{ color: ativo ? colors.onAccent : colors.textSecondary }}>
                        {s}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </View>

              <CampoTexto rotulo="Localização" valor={form.localizacao} onChange={(t) => setForm((f) => ({ ...f, localizacao: t }))} placeholder="Ex.: Sala da bateria" colors={colors} />
              <CampoTexto rotulo="Observações" valor={form.observacoes} onChange={(t) => setForm((f) => ({ ...f, observacoes: t }))} placeholder="Detalhes, defeitos, etc." colors={colors} multiline />

              <LoadingButton label={editandoId ? 'Salvar alterações' : 'Cadastrar item'} onPress={salvarItem} loading={salvando} />

              {editandoId && ehAdministrador && (
                <TouchableOpacity onPress={excluirItem} className="items-center mt-3 py-2">
                  <Text className="text-sm font-bold" style={{ color: colors.danger }}>
                    Excluir item
                  </Text>
                </TouchableOpacity>
              )}
            </ScrollView>
          </View>
        </KeyboardAvoidingView>
      </Modal>

      <Modal visible={pickerResponsavelVisivel} animationType="slide" transparent onRequestClose={() => setPickerResponsavelVisivel(false)}>
        <View className="flex-1 justify-end" style={{ backgroundColor: colors.overlay }}>
          <View
            className="rounded-t-3xl"
            style={{ backgroundColor: colors.background, maxHeight: '70%', borderTopWidth: 1, borderColor: colors.border }}
          >
            <View className="flex-row items-center justify-between px-6 pt-6 pb-3">
              <Text className="text-lg font-bold" style={{ color: colors.textPrimary }}>
                Responsável
              </Text>
              <TouchableOpacity onPress={() => setPickerResponsavelVisivel(false)}>
                <Text className="text-xl" style={{ color: colors.textSecondary }}>
                  ✕
                </Text>
              </TouchableOpacity>
            </View>
            <ScrollView contentContainerStyle={{ paddingHorizontal: 24, paddingBottom: 40 }}>
              <TouchableOpacity
                onPress={() => selecionarResponsavel(null)}
                className="py-3 border-b"
                style={{ borderColor: colors.border }}
              >
                <Text className="text-sm font-semibold" style={{ color: colors.textMuted }}>
                  Ninguém
                </Text>
              </TouchableOpacity>
              {membros.map((m) => (
                <TouchableOpacity
                  key={m.id}
                  onPress={() => selecionarResponsavel(m)}
                  className="py-3 border-b"
                  style={{ borderColor: colors.border }}
                >
                  <Text className="text-sm" style={{ color: form.responsavel_id === m.id ? colors.accent : colors.textPrimary }}>
                    {m.nome}
                  </Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

function Rotulo({ texto, colors }: { texto: string; colors: ThemeColors }) {
  return (
    <Text className="text-xs font-bold mb-2 ml-1" style={{ color: colors.textSecondary }}>
      {texto}
    </Text>
  );
}

function CampoTexto({
  rotulo,
  valor,
  onChange,
  placeholder,
  colors,
  multiline,
}: {
  rotulo: string;
  valor: string;
  onChange: (t: string) => void;
  placeholder?: string;
  colors: ThemeColors;
  multiline?: boolean;
}) {
  return (
    <View className="mb-4">
      <Rotulo texto={rotulo} colors={colors} />
      <TextInput
        className="rounded-xl px-4 text-sm"
        style={{
          backgroundColor: colors.card,
          borderWidth: 1,
          borderColor: colors.border,
          color: colors.textPrimary,
          minHeight: multiline ? 80 : 46,
          paddingVertical: multiline ? 12 : 0,
          textAlignVertical: multiline ? 'top' : 'center',
        }}
        placeholder={placeholder}
        placeholderTextColor={colors.textMuted}
        value={valor}
        onChangeText={onChange}
        multiline={multiline}
      />
    </View>
  );
}
