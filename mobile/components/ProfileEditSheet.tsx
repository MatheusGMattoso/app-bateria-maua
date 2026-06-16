import React, { useEffect, useState } from 'react';
import {
  Alert,
  Modal,
  Platform,
  ScrollView,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import { useTheme } from '../context/ThemeContext';
import LoadingButton from './LoadingButton';
import MemberAvatar from './MemberAvatar';
import { BASE_URL } from '../config/api';
import { fetchJson } from '../utils/apiClient';
import { INSTRUMENTOS, type MembroPerfil } from '../utils/memberUtils';

const BIO_MAX = 200;

type AssetImagem = {
  uri: string;
  base64: string;
  mimeType: string;
};

type Props = {
  visible: boolean;
  membro: MembroPerfil;
  solicitanteId: string;
  onClose: () => void;
  onSalvo: (membro: MembroPerfil) => void;
};

export default function ProfileEditSheet({
  visible,
  membro,
  solicitanteId,
  onClose,
  onSalvo,
}: Props) {
  const { colors } = useTheme();
  const [instrumento, setInstrumento] = useState(membro.instrumento || '');
  const [bio, setBio] = useState(membro.bio || '');
  const [imagem, setImagem] = useState<AssetImagem | null>(null);
  const [removerFoto, setRemoverFoto] = useState(false);
  const [salvando, setSalvando] = useState(false);

  useEffect(() => {
    if (visible) {
      setInstrumento(membro.instrumento || '');
      setBio(membro.bio || '');
      setImagem(null);
      setRemoverFoto(false);
    }
  }, [visible, membro]);

  const previewUrl = removerFoto ? null : imagem?.uri || membro.avatar_url;

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
    setRemoverFoto(false);
  };

  const abrirGaleria = async () => {
    const permissao = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!permissao.granted) {
      Alert.alert('Permissão necessária', 'Permita o acesso à galeria para alterar a foto.');
      return;
    }

    const resultado = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [1, 1],
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
      aspect: [1, 1],
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

    Alert.alert('Alterar foto', 'Escolha de onde enviar a imagem', [
      { text: 'Galeria', onPress: abrirGaleria },
      { text: 'Câmera', onPress: abrirCamera },
      { text: 'Cancelar', style: 'cancel' },
    ]);
  };

  const salvar = async () => {
    if (bio.length > BIO_MAX) {
      Alert.alert('Bio longa', `A bio deve ter no máximo ${BIO_MAX} caracteres.`);
      return;
    }

    try {
      setSalvando(true);

      let membroAtualizado = membro;

      const dados = await fetchJson(`${BASE_URL}/membros/${membro.id}/dados`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          solicitante_id: solicitanteId,
          instrumento: instrumento || null,
          bio: bio.trim() || null,
          remover_avatar: removerFoto && !imagem,
        }),
      });
      membroAtualizado = dados.membro;

      if (imagem) {
        const avatarRes = await fetchJson(`${BASE_URL}/membros/${membro.id}/avatar`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            solicitante_id: solicitanteId,
            imagem_base64: imagem.base64,
            mime_type: imagem.mimeType,
          }),
        });
        membroAtualizado = avatarRes.membro;
      }

      onSalvo(membroAtualizado);
      onClose();
      Alert.alert('Salvo', 'Seu perfil foi atualizado.');
    } catch (error: any) {
      Alert.alert('Erro', error.message || 'Não foi possível salvar o perfil.');
    } finally {
      setSalvando(false);
    }
  };

  const estiloInput = {
    backgroundColor: colors.backgroundAlt,
    borderColor: colors.border,
    color: colors.textPrimary,
    borderWidth: 1,
  };

  return (
    <Modal visible={visible} animationType="slide" transparent onRequestClose={onClose}>
      <View className="flex-1 justify-end" style={{ backgroundColor: 'rgba(0,0,0,0.5)' }}>
        <View
          className="rounded-t-3xl max-h-[90%]"
          style={{ backgroundColor: colors.background }}
        >
          <ScrollView contentContainerStyle={{ padding: 20, paddingBottom: 40 }}>
            <View className="flex-row items-center justify-between mb-5">
              <Text className="text-lg font-bold" style={{ color: colors.textPrimary }}>
                Editar perfil
              </Text>
              <TouchableOpacity onPress={onClose}>
                <Text className="text-sm font-bold" style={{ color: colors.accent }}>
                  Fechar
                </Text>
              </TouchableOpacity>
            </View>

            <View className="items-center mb-5">
              <MemberAvatar nome={membro.nome} avatarUrl={previewUrl} tamanho="lg" />
              <View className="flex-row mt-3" style={{ gap: 10 }}>
                <TouchableOpacity
                  className="px-4 py-2 rounded-xl"
                  style={{ backgroundColor: colors.accentSoft }}
                  onPress={selecionarImagem}
                >
                  <Text className="text-xs font-bold" style={{ color: colors.accent }}>
                    Alterar foto
                  </Text>
                </TouchableOpacity>
                {(membro.avatar_url || imagem) && !removerFoto ? (
                  <TouchableOpacity
                    className="px-4 py-2 rounded-xl"
                    style={{ backgroundColor: colors.backgroundAlt, borderWidth: 1, borderColor: colors.border }}
                    onPress={() => {
                      setImagem(null);
                      setRemoverFoto(true);
                    }}
                  >
                    <Text className="text-xs font-bold" style={{ color: colors.textSecondary }}>
                      Remover foto
                    </Text>
                  </TouchableOpacity>
                ) : null}
              </View>
            </View>

            <Text className="text-xs font-bold mb-2" style={{ color: colors.textSecondary }}>
              Instrumento
            </Text>
            <View className="flex-row flex-wrap mb-4" style={{ gap: 8 }}>
              {INSTRUMENTOS.map((item) => {
                const ativo = instrumento === item;
                return (
                  <TouchableOpacity
                    key={item}
                    className="px-3 py-2 rounded-full"
                    style={{
                      backgroundColor: ativo ? colors.accent : colors.backgroundAlt,
                      borderWidth: 1,
                      borderColor: ativo ? colors.accent : colors.border,
                    }}
                    onPress={() => setInstrumento(ativo ? '' : item)}
                  >
                    <Text
                      className="text-xs font-bold"
                      style={{ color: ativo ? colors.onAccent : colors.textSecondary }}
                    >
                      {item}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>

            <Text className="text-xs font-bold mb-2" style={{ color: colors.textSecondary }}>
              Bio
            </Text>
            <TextInput
              className="rounded-xl px-4 py-3 text-sm mb-1 min-h-[80px]"
              style={[estiloInput, { textAlignVertical: 'top' }]}
              placeholder="Conte um pouco sobre você na bateria..."
              placeholderTextColor={colors.textMuted}
              value={bio}
              onChangeText={setBio}
              multiline
              maxLength={BIO_MAX}
            />
            <Text className="text-[10px] mb-4 text-right" style={{ color: colors.textMuted }}>
              {bio.length}/{BIO_MAX}
            </Text>

            <LoadingButton label="Salvar perfil" loading={salvando} onPress={salvar} />
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
}
