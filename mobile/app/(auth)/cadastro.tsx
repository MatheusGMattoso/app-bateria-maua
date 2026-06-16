import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, KeyboardAvoidingView, Platform, ScrollView, Image } from 'react-native';
import { BASE_URL } from '../../config/api';
import { useRouter } from 'expo-router';
import { fetchJson } from '../../utils/apiClient';
import { useTheme } from '../../context/ThemeContext';
import LoadingButton from '../../components/LoadingButton';
import { useResponsive } from '../../utils/responsive';
import { tituloMarca } from '../../theme/typography';

export default function RegisterScreen() {
  const [nome, setNome] = useState('');
  const [email, setEmail] = useState('');
  const [senha, setSenha] = useState('');
  const [confirmarSenha, setConfirmarSenha] = useState('');
  const [mostrarSenha, setMostrarSenha] = useState(false);
  const [mostrarConfirmarSenha, setMostrarConfirmarSenha] = useState(false);
  const [erro, setErro] = useState('');
  const [sucesso, setSucesso] = useState('');
  const [carregando, setCarregando] = useState(false);

  const router = useRouter();
  const { colors } = useTheme();
  const { screenPadding } = useResponsive();

  const handleRegister = async () => {
    setErro('');
    setSucesso('');

    if (!nome || !email || !senha) {
      setErro('Por favor, preencha todos os campos.');
      return;
    }

    if (senha !== confirmarSenha) {
      setErro('As senhas não coincidem.');
      return;
    }

    try {
      setCarregando(true);
      await fetchJson(`${BASE_URL}/membros/registro`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ nome, email, senha }),
      });

      setSucesso('Conta criada com sucesso! Redirecionando...');
      setTimeout(() => router.replace('/(auth)/login'), 900);
    } catch (error: any) {
      setErro(error.message || 'Erro ao criar conta.');
    } finally {
      setCarregando(false);
    }
  };

  const estiloInput = {
    backgroundColor: colors.card,
    borderColor: colors.border,
    color: colors.textPrimary,
    borderWidth: 1,
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
              style={{ width: 104, height: 104, marginBottom: 10 }}
              resizeMode="contain"
            />
            <Text
              className="text-4xl text-center"
              style={{ color: colors.textPrimary, fontWeight: '900', letterSpacing: -0.5 }}
            >
              {tituloMarca('Criar conta')}
            </Text>
            <Text className="text-base text-center mt-1" style={{ color: colors.textSecondary }}>
              Junte-se à Bateria Mauá
            </Text>
          </View>

          <TextInput
            className="h-[50px] rounded-2xl px-4 mb-4 text-base"
            style={estiloInput}
            placeholder="Nome Completo"
            placeholderTextColor={colors.textMuted}
            value={nome}
            onChangeText={setNome}
            autoCapitalize="words"
          />

          <TextInput
            className="h-[50px] rounded-2xl px-4 mb-4 text-base"
            style={estiloInput}
            placeholder="E-mail"
            placeholderTextColor={colors.textMuted}
            value={email}
            onChangeText={setEmail}
            autoCapitalize="none"
            keyboardType="email-address"
          />

          <View
            className="flex-row items-center h-[50px] rounded-2xl mb-4"
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

          <View
            className="flex-row items-center h-[50px] rounded-2xl mb-4"
            style={{ backgroundColor: colors.card, borderColor: colors.border, borderWidth: 1 }}
          >
            <TextInput
              className="flex-1 px-4 text-base"
              style={{ color: colors.textPrimary }}
              placeholder="Confirmar Senha"
              placeholderTextColor={colors.textMuted}
              value={confirmarSenha}
              onChangeText={setConfirmarSenha}
              secureTextEntry={!mostrarConfirmarSenha}
            />
            <TouchableOpacity className="px-4 h-full justify-center" onPress={() => setMostrarConfirmarSenha(!mostrarConfirmarSenha)}>
              <Text className="text-sm font-bold" style={{ color: colors.accent }}>
                {mostrarConfirmarSenha ? 'Ocultar' : 'Mostrar'}
              </Text>
            </TouchableOpacity>
          </View>

          {erro ? (
            <Text className="text-center mb-4 font-semibold" style={{ color: colors.danger }}>
              {erro}
            </Text>
          ) : null}
          {sucesso ? (
            <Text className="text-center mb-4 font-semibold" style={{ color: colors.success }}>
              {sucesso}
            </Text>
          ) : null}

          <LoadingButton label="Cadastrar" onPress={handleRegister} loading={carregando} className="mt-1" />

          <TouchableOpacity className="mt-5 items-center" onPress={() => router.push('/(auth)/login')}>
            <Text className="text-sm font-semibold" style={{ color: colors.textSecondary }}>
              Já tem uma conta? <Text style={{ color: colors.accent }}>Entre aqui.</Text>
            </Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}
