import React, { useState } from 'react';
import { Alert, Image, Text, TextInput, TouchableOpacity, View } from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import { useTheme } from '../context/ThemeContext';
import LoadingButton from './LoadingButton';
import { BASE_URL } from '../config/api';
import { fetchJson } from '../utils/apiClient';

type Props = {
  autorId: string;
  perfilAcesso: string;
  onPublicado: () => void;
};

export default function PostComposer({ autorId, perfilAcesso, onPublicado }: Props) {
  const { colors } = useTheme();
  const [conteudo, setConteudo] = useState('');
  const [tipo, setTipo] = useState<'post' | 'aviso'>('post');
  const [salvando, setSalvando] = useState(false);
  const [imagemUri, setImagemUri] = useState<string | null>(null);
  const [imagemBase64, setImagemBase64] = useState<string | null>(null);
  const [mimeType, setMimeType] = useState<string | null>(null);

  const ehDiretoria = perfilAcesso === 'Administrador' || perfilAcesso === 'Gestor de Módulo';

  const estiloInput = {
    backgroundColor: colors.backgroundAlt,
    borderColor: colors.border,
    color: colors.textPrimary,
    borderWidth: 1,
  };

  const selecionarImagem = async () => {
    const permissao = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!permissao.granted) {
      Alert.alert('Permissão necessária', 'Permita o acesso à galeria para anexar fotos.');
      return;
    }

    const resultado = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      allowsEditing: true,
      quality: 0.7,
      base64: true,
    });

    if (!resultado.canceled && resultado.assets[0]) {
      const asset = resultado.assets[0];
      setImagemUri(asset.uri);
      setImagemBase64(asset.base64 || null);
      setMimeType(asset.mimeType || 'image/jpeg');
    }
  };

  const removerImagem = () => {
    setImagemUri(null);
    setImagemBase64(null);
    setMimeType(null);
  };

  const publicar = async () => {
    if (!conteudo.trim()) {
      Alert.alert('Conteúdo vazio', 'Escreva algo antes de publicar.');
      return;
    }

    try {
      setSalvando(true);
      let imagemUrl: string | null = null;

      if (imagemBase64) {
        const upload = await fetchJson(`${BASE_URL}/feed/upload`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            imagem_base64: imagemBase64,
            mime_type: mimeType,
            nome_arquivo: 'feed',
          }),
        });
        imagemUrl = upload.imagem_url;
      }

      await fetchJson(`${BASE_URL}/feed`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          autor_id: autorId,
          conteudo: conteudo.trim(),
          tipo: ehDiretoria ? tipo : 'post',
          perfil_acesso: perfilAcesso,
          imagem_url: imagemUrl,
        }),
      });

      setConteudo('');
      removerImagem();
      setTipo('post');
      onPublicado();
    } catch (error: any) {
      Alert.alert('Erro', error.message || 'Não foi possível publicar.');
    } finally {
      setSalvando(false);
    }
  };

  return (
    <View
      className="rounded-2xl p-4 mb-4"
      style={{ backgroundColor: colors.card, borderWidth: 1, borderColor: colors.border }}
    >
      <Text className="text-sm font-bold mb-3" style={{ color: colors.textPrimary }}>
        Nova publicação
      </Text>

      {ehDiretoria ? (
        <View className="flex-row mb-3" style={{ gap: 8 }}>
          {(['post', 'aviso'] as const).map((opcao) => {
            const ativo = tipo === opcao;
            return (
              <TouchableOpacity
                key={opcao}
                onPress={() => setTipo(opcao)}
                className="px-3 py-1.5 rounded-full"
                style={{
                  backgroundColor: ativo ? colors.accentSoft : colors.backgroundAlt,
                  borderWidth: 1,
                  borderColor: ativo ? colors.accent : colors.border,
                }}
              >
                <Text className="text-xs font-bold" style={{ color: ativo ? colors.accent : colors.textSecondary }}>
                  {opcao === 'aviso' ? '📢 Aviso' : '💬 Post'}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>
      ) : null}

      <TextInput
        className="rounded-xl px-4 py-3 mb-3 text-sm"
        style={{ ...estiloInput, minHeight: 90, textAlignVertical: 'top' }}
        placeholder="Compartilhe algo com a bateria..."
        placeholderTextColor={colors.textMuted}
        value={conteudo}
        onChangeText={setConteudo}
        multiline
        numberOfLines={4}
      />

      {imagemUri ? (
        <View className="mb-3 relative">
          <Image source={{ uri: imagemUri }} className="w-full rounded-xl" style={{ height: 160 }} resizeMode="cover" />
          <TouchableOpacity
            onPress={removerImagem}
            className="absolute top-2 right-2 w-8 h-8 rounded-full items-center justify-center"
            style={{ backgroundColor: colors.overlay }}
          >
            <Text className="text-white font-bold">✕</Text>
          </TouchableOpacity>
        </View>
      ) : null}

      <View className="flex-row items-center justify-between">
        <TouchableOpacity
          onPress={selecionarImagem}
          className="px-3 py-2 rounded-xl"
          style={{ backgroundColor: colors.backgroundAlt, borderWidth: 1, borderColor: colors.border }}
        >
          <Text className="text-xs font-bold" style={{ color: colors.textSecondary }}>
            📷 Foto
          </Text>
        </TouchableOpacity>

        <LoadingButton
          label="Publicar"
          onPress={publicar}
          loading={salvando}
          className="px-6"
        />
      </View>
    </View>
  );
}
