// Arquivo: mobile/app/(painel)/presenca.tsx

import React, { useState, useEffect, useRef } from 'react';
import { View, Text, TouchableOpacity, ScrollView, SafeAreaView, StyleSheet, Alert } from 'react-native';
import { CameraView, useCameraPermissions } from 'expo-camera';
import { useRouter } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { BASE_URL } from '../../config/api';

export default function PresencaScreen() {
  const [permissao, solicitarPermissao] = useCameraPermissions();
  const [escaneando, setEscaneando] = useState(false);
  const [perfil, setPerfil] = useState('Membro');
  const [usuarioId, setUsuarioId] = useState<string | null>(null);
  const jaLeuRef = useRef(false);
  const router = useRouter();

  useEffect(() => {
    const carregarUsuario = async () => {
      const usuarioStorage = await AsyncStorage.getItem('usuario');
      if (usuarioStorage) {
        const usuario = JSON.parse(usuarioStorage);
        setPerfil(usuario.perfil_acesso);
        setUsuarioId(usuario.id);
      }
    };
    carregarUsuario();
  }, []);

  const lidarComQrCodeLido = ({ data }: { data: string }) => {
    if (jaLeuRef.current) return;

    jaLeuRef.current = true;
    setEscaneando(false);
    
    Alert.alert(
      "Confirmar Presença",
      "Deseja registrar sua presença neste ensaio?",
      [
        {
          text: "Cancelar",
          style: "cancel",
          onPress: () => { jaLeuRef.current = false; }
        },
        {
          text: "Sim, Confirmar",
          onPress: () => confirmarPresencaNoBanco(data)
        }
      ]
    );
  };

  const confirmarPresencaNoBanco = async (codigo_qr: string) => {
    if (!usuarioId) {
      Alert.alert("Erro", "Usuário não identificado. Faça login novamente.");
      return;
    }

    try {
      const resposta = await fetch(`${BASE_URL}/presencas`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          codigo_qr: codigo_qr,
          membro_id: usuarioId
        })
      });

      const json = await resposta.json();

      if (!resposta.ok) {
        throw new Error(json.erro || "Erro ao registrar presença.");
      }

      Alert.alert("Sucesso!", "Sua presença foi confirmada neste ensaio!");
    } catch (error: any) {
      Alert.alert("Erro", error.message);
    }
  };

  const iniciarLeitura = async () => {
    if (!permissao?.granted) {
      const resultado = await solicitarPermissao();
      if (!resultado.granted) {
        Alert.alert("Erro", "É necessário permitir o uso da câmera para ler o QR Code.");
        return;
      }
    }
    jaLeuRef.current = false;
    setEscaneando(true);
  };

  if (escaneando) {
    return (
      <View className="flex-1 bg-manga-black">
        <CameraView
          style={StyleSheet.absoluteFillObject}
          facing="back"
          onBarcodeScanned={lidarComQrCodeLido}
          barcodeScannerSettings={{ barcodeTypes: ["qr"] }}
        />
        <TouchableOpacity 
          className="absolute bottom-10 self-center bg-manga-white px-6 py-3 rounded-full"
          onPress={() => {
            setEscaneando(false);
            jaLeuRef.current = false;
          }}
        >
          <Text className="text-manga-red font-bold">Cancelar</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <SafeAreaView className="flex-1 bg-[#f5f5f5]">
      <ScrollView contentContainerStyle={{ padding: 24, paddingBottom: 40 }} showsVerticalScrollIndicator={false}>
        
        <View className="mb-8 mt-4">
          <Text className="text-2xl font-bold text-[#333]">Presença</Text>
          <Text className="text-sm text-manga-gray font-semibold">Acompanhe seu rendimento nos ensaios</Text>
        </View>

        <View className="flex-row justify-between mb-8">
          <View className="bg-manga-white w-[31%] p-4 rounded-xl shadow-sm border border-[#ddd] items-center">
            <Text className="text-2xl font-bold text-manga-green">12</Text>
            <Text className="text-xs text-manga-gray text-center mt-1">Presenças</Text>
          </View>
          <View className="bg-manga-white w-[31%] p-4 rounded-xl shadow-sm border border-[#ddd] items-center">
            <Text className="text-2xl font-bold text-manga-red">2</Text>
            <Text className="text-xs text-manga-gray text-center mt-1">Faltas</Text>
          </View>
          <View className="bg-manga-white w-[31%] p-4 rounded-xl shadow-sm border border-[#ddd] items-center">
            <Text className="text-2xl font-bold text-manga-orangeDark">85%</Text>
            <Text className="text-xs text-manga-gray text-center mt-1">Frequência</Text>
          </View>
        </View>

        <Text className="text-lg font-bold text-[#333] mb-4">Registro de Ensaio</Text>
        
        {(perfil === 'Membro' || perfil === 'Gestor de Módulo' || perfil === 'Administrador') && (
          <TouchableOpacity 
            className="bg-manga-orangeDark p-5 rounded-xl items-center justify-center mb-4 shadow-sm"
            onPress={iniciarLeitura}
          >
            <Text className="text-manga-white text-lg font-bold">📷 Ler QR Code</Text>
          </TouchableOpacity>
        )}

        {(perfil === 'Gestor de Módulo' || perfil === 'Administrador') && (
          <TouchableOpacity 
            className="bg-transparent border-2 border-manga-orangeDark p-5 rounded-xl items-center justify-center"
            onPress={() => router.push('/(painel)/gerar-qrcode')}
          >
            <Text className="text-manga-orangeDark text-lg font-bold">⚙️ Gerar QR Code (Diretoria)</Text>
          </TouchableOpacity>
        )}

      </ScrollView>
    </SafeAreaView>
  );
}