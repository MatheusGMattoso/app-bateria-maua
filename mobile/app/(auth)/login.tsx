import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, KeyboardAvoidingView, Platform, ScrollView } from 'react-native';
import { useRouter } from 'expo-router';
import { BASE_URL } from '../../config/api';
import AsyncStorage from '@react-native-async-storage/async-storage';

export default function LoginScreen() {
  const [email, setEmail] = useState('');
  const [senha, setSenha] = useState('');
  const [mostrarSenha, setMostrarSenha] = useState(false);
  
  const [erro, setErro] = useState('');

  const router = useRouter();

  const handleLogin = async () => {
    setErro('');

    if (!email || !senha) {
      setErro("Por favor, preencha seu e-mail e senha.");
      return;
    }

    try {
      const resposta = await fetch(`${BASE_URL}/membros/login`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email, senha }),
      });

      const dados = await resposta.json();

      if (resposta.ok) {
        await AsyncStorage.setItem('usuario', JSON.stringify(dados.usuario));
        router.replace('/(painel)'); 
      } else {
        setErro(dados.message || "Erro ao fazer login.");
      }
    } catch (error) {
      console.error(error);
      setErro("Erro de conexão com o servidor.");
    }
  };

  return (
    <KeyboardAvoidingView 
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      className="flex-1 bg-[#f5f5f5]"
    >
      <ScrollView 
        contentContainerStyle={{ flexGrow: 1, justifyContent: 'center' }} 
        showsVerticalScrollIndicator={false}
      >
        <View className="px-8 py-5">
          <Text className="text-3xl font-bold text-[#333] text-center">Bem-vindo(a)!</Text>
          <Text className="text-base text-manga-gray text-center mb-10">Acesse o painel da Bateria Mauá</Text>

          <TextInput
            className="bg-manga-white h-[50px] rounded-lg px-4 mb-4 border border-[#ddd] text-base text-[#666]"
            placeholder="E-mail"
            placeholderTextColor="#666"
            value={email}
            onChangeText={setEmail}
            autoCapitalize="none"
            keyboardType="email-address"
          />

          <View className="flex-row items-center bg-manga-white h-[50px] rounded-lg mb-2 border border-[#ddd]">
            <TextInput
              className="flex-1 px-4 text-base text-[#666]"
              placeholder="Senha"
              placeholderTextColor="#666"
              value={senha}
              onChangeText={setSenha}
              secureTextEntry={!mostrarSenha}
            />
            <TouchableOpacity 
              className="px-4 h-full justify-center" 
              onPress={() => setMostrarSenha(!mostrarSenha)}
            >
              <Text className="text-manga-orangeDark text-sm font-bold">
                {mostrarSenha ? 'Ocultar' : 'Mostrar'}
              </Text>
            </TouchableOpacity>
          </View>

          <TouchableOpacity className="items-end mb-6">
            <Text className="text-manga-orangeDark text-sm font-semibold">Esqueceu a senha?</Text>
          </TouchableOpacity>

          {erro ? (
            <Text className="text-manga-red text-center mb-4 font-semibold">{erro}</Text>
          ) : null}

          <TouchableOpacity 
            className="bg-manga-orangeDark h-[50px] rounded-lg justify-center items-center" 
            onPress={handleLogin}
          >
            <Text className="text-manga-white text-lg font-bold">Entrar</Text>
          </TouchableOpacity>

          <TouchableOpacity 
            className="mt-5 items-center" 
            onPress={() => router.push('/(auth)/cadastro')}
          >
            <Text className="text-manga-gray text-sm font-semibold">
              Não tem uma conta? <Text className="text-manga-orangeDark">Crie aqui.</Text>
            </Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}