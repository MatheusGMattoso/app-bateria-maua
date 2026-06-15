import React, { useState } from 'react';
import { Alert, TextInput, View } from 'react-native';
import { useTheme } from '../context/ThemeContext';
import LoadingButton from './LoadingButton';
import { BASE_URL } from '../config/api';
import { fetchJson } from '../utils/apiClient';

type Props = {
  postId: string;
  autorId: string;
  onComentado: () => void;
};

export default function CommentComposer({ postId, autorId, onComentado }: Props) {
  const { colors } = useTheme();
  const [conteudo, setConteudo] = useState('');
  const [salvando, setSalvando] = useState(false);

  const enviar = async () => {
    if (!conteudo.trim()) return;

    try {
      setSalvando(true);
      await fetchJson(`${BASE_URL}/feed/${postId}/comentarios`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ autor_id: autorId, conteudo: conteudo.trim() }),
      });
      setConteudo('');
      onComentado();
    } catch (error: any) {
      Alert.alert('Erro', error.message || 'Não foi possível comentar.');
    } finally {
      setSalvando(false);
    }
  };

  return (
    <View className="mt-3">
      <TextInput
        className="rounded-xl px-4 py-3 mb-2 text-sm"
        style={{
          backgroundColor: colors.backgroundAlt,
          borderColor: colors.border,
          color: colors.textPrimary,
          borderWidth: 1,
          minHeight: 60,
          textAlignVertical: 'top',
        }}
        placeholder="Escreva um comentário..."
        placeholderTextColor={colors.textMuted}
        value={conteudo}
        onChangeText={setConteudo}
        multiline
      />
      <LoadingButton label="Comentar" onPress={enviar} loading={salvando} className="h-11" />
    </View>
  );
}
