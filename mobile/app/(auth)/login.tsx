import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, KeyboardAvoidingView, Platform, ScrollView, Image } from 'react-native';
import { useRouter } from 'expo-router';
import { BASE_URL } from '../../config/api';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { fetchJson } from '../../utils/apiClient';
import { useTheme } from '../../context/ThemeContext';
import LoadingButton from '../../components/LoadingButton';
import { useResponsive } from '../../utils/responsive';
import { tituloMarca } from '../../theme/typography';

export default function LoginScreen() {
  const [email, setEmail] = useState('');
  const [senha, setSenha] = useState('');
  const [mostrarSenha, setMostrarSenha] = useState(false);
  const [erro, setErro] = useState('');
  const [carregando, setCarregando] = useState(false);

  const router = useRouter();
  const { colors } = useTheme();
  const { screenPadding } = useResponsive();

  const handleLogin = async () => {
    setErro('');

    if (!email || !senha) {
      setErro('Por favor, preencha seu e-mail e senha.');
      return;
    }

    try {
      setCarregando(true);
      const dados = await fetchJson(`${BASE_URL}/membros/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, senha }),
      });

      await AsyncStorage.setItem('token', dados.token);
      await AsyncStorage.setItem('usuario', JSON.stringify(dados.usuario));
      if (dados.usuario?.id) {
        import('../../services/notificationService')
          .then((mod) => mod.setupAfterLogin(dados.usuario.id))
          .catch(() => undefined);
      }
      router.replace('/(painel)');
    } catch (error: any) {
      setErro(error.message || 'Erro ao fazer login.');
    } finally {
      setCarregando(false);
    }
  };

  const estiloInput = {
    backgroundColor: colors.card,
    borderColor: colors.border,
    color: colors.textPrimary,
  };

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      className="flex-1"
      style={{ backgroundColor: colors.background }}
    >
      <ScrollView
        contentContainerStyle={{ flexGrow: 1, justifyContent: 'center' }}
        showsVerticalScrollIndicator={false}
      >
        <View style={{ paddingHorizontal: screenPadding, paddingVertical: 20 }}>
          <View className="items-center mb-6">
            <Image
              source={require('../../assets/images/logo-bateria-maua.png')}
              style={{ width: 132, height: 132, marginBottom: 12 }}
              resizeMode="contain"
            />
            <Text
              className="text-4xl text-center"
              style={{ color: colors.textPrimary, fontWeight: '900', letterSpacing: -0.5 }}
            >
              {tituloMarca('Bateria Mauá')}
            </Text>
            <Text
              className="text-xs text-center mt-1 uppercase"
              style={{ color: colors.accent, fontWeight: '700', letterSpacing: 2 }}
            >
              Clube da Manga
            </Text>
            <Text className="text-base text-center mt-3" style={{ color: colors.textSecondary }}>
              Acesse o painel da bateria
            </Text>
          </View>

          <TextInput
            className="h-[50px] rounded-2xl px-4 mb-4 text-base"
            style={{ ...estiloInput, borderWidth: 1 }}
            placeholder="E-mail"
            placeholderTextColor={colors.textMuted}
            value={email}
            onChangeText={setEmail}
            autoCapitalize="none"
            keyboardType="email-address"
          />

          <View
            className="flex-row items-center h-[50px] rounded-2xl mb-6"
            style={{ backgroundColor: colors.card, borderColor: colors.border, borderWidth: 1 }}
          >
            <TextInput
              className="flex-1 px-4 text-base"
              style={{ color: colors.textPrimary }}
              placeholder="Senha"
              placeholderTextColor={colors.textMuted}
              value={senha}
              onChangeText={setSenha}
              secureTextEntry={!mostrarSenha}
            />
            <TouchableOpacity className="px-4 h-full justify-center" onPress={() => setMostrarSenha(!mostrarSenha)}>
              <Text className="text-sm font-bold" style={{ color: colors.accent }}>
                {mostrarSenha ? 'Ocultar' : 'Mostrar'}
              </Text>
            </TouchableOpacity>
          </View>

          {erro ? (
            <Text className="text-center mb-4 font-semibold" style={{ color: colors.danger }}>
              {erro}
            </Text>
          ) : null}

          <LoadingButton label="Entrar" onPress={handleLogin} loading={carregando} />

          <TouchableOpacity className="mt-5 items-center" onPress={() => router.push('/(auth)/cadastro')}>
            <Text className="text-sm font-semibold" style={{ color: colors.textSecondary }}>
              Não tem uma conta? <Text style={{ color: colors.accent }}>Crie aqui.</Text>
            </Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}
