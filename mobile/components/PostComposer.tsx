import React, { useState } from 'react';
import { Alert, Image, Platform, Text, TextInput, TouchableOpacity, View } from 'react-native';
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

type AssetImagem = {
  uri: string;
  base64: string;
  mimeType: string;
};

export default function PostComposer({ autorId, perfilAcesso, onPublicado }: Props) {
  const { colors } = useTheme();
  const [conteudo, setConteudo] = useState('');
  const [tipo, setTipo] = useState<'post' | 'aviso'>('post');
  const [salvando, setSalvando] = useState(false);
  const [imagem, setImagem] = useState<AssetImagem | null>(null);

  const ehDiretoria = perfilAcesso === 'Administrador' || perfilAcesso === 'Gestor de Módulo';

  const estiloInput = {
    backgroundColor: colors.backgroundAlt,
    borderColor: colors.border,
    color: colors.textPrimary,
    borderWidth: 1,
  };

  const aplicarAsset = (asset: ImagePicker.ImagePickerAsset) => {
    if (!asset.base64) {
      Alert.alert('Erro', 'Não foi possível processar a imagem. Tente outra foto.');
      return;
    }
    setImagem({
      uri: asset.uri,
      base64: asset.base64,
      mimeType: asset.mimeType || 'image/jpeg',
    });
  };

  const abrirGaleria = async () => {
    const permissao = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!permissao.granted) {
      Alert.alert('Permissão necessária', 'Permita o acesso à galeria para anexar fotos.');
      return;
    }

    const resultado = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      quality: 0.55,
      base64: true,
      exif: false,
    });

    if (!resultado.canceled && resultado.assets[0]) {
      aplicarAsset(resultado.assets[0]);
    }
  };

  const abrirCamera = async () => {
    const permissao = await ImagePicker.requestCameraPermissionsAsync();
    if (!permissao.granted) {
      Alert.alert('Permissão necessária', 'Permita o acesso à câmera para tirar fotos.');
      return;
    }

    const resultado = await ImagePicker.launchCameraAsync({
      allowsEditing: true,
      quality: 0.55,
      base64: true,
      exif: false,
    });

    if (!resultado.canceled && resultado.assets[0]) {
      aplicarAsset(resultado.assets[0]);
    }
  };

  const selecionarImagem = () => {
    if (Platform.OS === 'web') {
      abrirGaleria();
      return;
    }

    Alert.alert('Adicionar foto', 'Escolha de onde enviar a imagem', [
      { text: 'Galeria', onPress: abrirGaleria },
      { text: 'Câmera', onPress: abrirCamera },
      { text: 'Cancelar', style: 'cancel' },
    ]);
  };

  const removerImagem = () => setImagem(null);

  const publicar = async () => {
    if (!conteudo.trim() && !imagem) {
      Alert.alert('Publicação vazia', 'Escreva algo ou anexe uma foto antes de publicar.');
      return;
    }

    try {
      setSalvando(true);
      let imagemUrl: string | null = null;

      if (imagem) {
        const upload = await fetchJson(`${BASE_URL}/feed/upload`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            imagem_base64: imagem.base64,
            mime_type: imagem.mimeType,
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

      {imagem ? (
        <View className="mb-3 relative">
          <Image source={{ uri: imagem.uri }} className="w-full rounded-xl" style={{ height: 180 }} resizeMode="cover" />
          <TouchableOpacity
            onPress={removerImagem}
            className="absolute top-2 right-2 w-8 h-8 rounded-full items-center justify-center"
            style={{ backgroundColor: colors.overlay }}
          >
            <Text className="text-white font-bold">✕</Text>
          </TouchableOpacity>
        </View>
      ) : null}

      <View className="flex-row items-center" style={{ gap: 12 }}>
        <TouchableOpacity
          onPress={selecionarImagem}
          disabled={salvando}
          className="flex-1 px-3 py-2 rounded-xl"
          style={{
            backgroundColor: colors.backgroundAlt,
            borderWidth: 1,
            borderColor: colors.border,
            opacity: salvando ? 0.6 : 1,
          }}
        >
          <Text className="text-xs font-bold" style={{ color: colors.textSecondary }}>
            📷 {imagem ? 'Trocar foto' : 'Adicionar foto'}
          </Text>
        </TouchableOpacity>

        <LoadingButton
          label="Publicar"
          onPress={publicar}
          loading={salvando}
          compact
        />
      </View>
    </View>
  );
}
