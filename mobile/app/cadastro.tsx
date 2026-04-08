import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, KeyboardAvoidingView, Platform, ScrollView } from 'react-native';
import { BASE_URL } from '../config/api';
import { useRouter } from 'expo-router';

export default function RegisterScreen() {
  const [nome, setNome] = useState('');
  const [email, setEmail] = useState('');
  const [senha, setSenha] = useState('');
  const [confirmarSenha, setConfirmarSenha] = useState('');

  const [mostrarSenha, setMostrarSenha] = useState(false);
  const [mostrarConfirmarSenha, setMostrarConfirmarSenha] = useState(false);

  const router = useRouter();

  const handleRegister = async () => {
    if (senha !== confirmarSenha) {
      alert("As senhas não coincidem!");
      return;
    }
    
    if (!nome || !email || !senha) {
      alert("Por favor, preencha todos os campos.");
      return;
    }

    try {
      const respota = await fetch(`${BASE_URL}/membros/registro`, { 
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ nome, email, senha }),
      });
      
      const dados = await respota.json();

      if (respota.ok) {
        alert("Conta criada com sucesso!");
      } else {
        alert(dados.message || "Erro ao criar conta.");
      }
    } catch (error) {
      console.error(error);
      alert("Erro de conexão com o servidor.");
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
          <Text className="text-3xl font-bold text-[#333] text-center">Criar Conta</Text>
          <Text className="text-base text-manga-gray text-center mb-10">Junte-se à Bateria Mauá</Text>

          <TextInput
            className="bg-manga-white h-[50px] rounded-lg px-4 mb-4 border border-[#ddd] text-base text-[#666]"
            placeholder="Nome Completo"
            placeholderTextColor="#666"
            value={nome}
            onChangeText={setNome}
            autoCapitalize="words"
          />

          <TextInput
            className="bg-manga-white h-[50px] rounded-lg px-4 mb-4 border border-[#ddd] text-base text-[#666]"
            placeholder="E-mail ou RA"
            placeholderTextColor="#666"
            value={email}
            onChangeText={setEmail}
            autoCapitalize="none"
            keyboardType="email-address"
          />

          <View className="flex-row items-center bg-manga-white h-[50px] rounded-lg mb-4 border border-[#ddd]">
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

          <View className="flex-row items-center bg-manga-white h-[50px] rounded-lg mb-4 border border-[#ddd]">
            <TextInput
              className="flex-1 px-4 text-base text-[#666]"
              placeholder="Confirmar Senha"
              placeholderTextColor="#666"
              value={confirmarSenha}
              onChangeText={setConfirmarSenha}
              secureTextEntry={!mostrarConfirmarSenha}
            />
            <TouchableOpacity 
              className="px-4 h-full justify-center" 
              onPress={() => setMostrarConfirmarSenha(!mostrarConfirmarSenha)}
            >
              <Text className="text-manga-orangeDark text-sm font-bold">
                {mostrarConfirmarSenha ? 'Ocultar' : 'Mostrar'}
              </Text>
            </TouchableOpacity>
          </View>

          <TouchableOpacity 
            className="bg-manga-orangeDark h-[50px] rounded-lg justify-center items-center mt-2" 
            onPress={handleRegister}
          >
            <Text className="text-manga-white text-lg font-bold">Cadastrar</Text>
          </TouchableOpacity>

          <TouchableOpacity 
            className="mt-5 items-center" 
            onPress={() => router.push('/')}
          >
            <Text className="text-manga-orangeDark text-sm font-semibold">
              Já tem uma conta? Entre aqui.
            </Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}