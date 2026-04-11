import React, { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, ScrollView, SafeAreaView, StyleSheet } from 'react-native';
import { CameraView, useCameraPermissions } from 'expo-camera';
import { useRouter } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';

export default function PresencaScreen() {
  const [permissao, solicitarPermissao] = useCameraPermissions();
  const [escaneando, setEscaneando] = useState(false);
  const [perfil, setPerfil] = useState('Membro');
  const router = useRouter();

  useEffect(() => {
    const carregarUsuario = async () => {
      const usuarioStorage = await AsyncStorage.getItem('usuario');
      if (usuarioStorage) {
        const usuario = JSON.parse(usuarioStorage);
        setPerfil(usuario.perfil_acesso);
      }
    };
    carregarUsuario();
  }, []);

  const lidarComQrCodeLido = ({ data }: { data: string }) => {
    setEscaneando(false);
    alert(`QR Code lido: ${data}`);
  };

  const iniciarLeitura = async () => {
    if (!permissao?.granted) {
      const resultado = await solicitarPermissao();
      if (!resultado.granted) {
        alert("É necessário permitir o uso da câmera para ler o QR Code.");
        return;
      }
    }
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
          onPress={() => setEscaneando(false)}
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