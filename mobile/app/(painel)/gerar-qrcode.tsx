import React, { useState } from 'react';
import { View, Text, TextInput, SafeAreaView, TouchableOpacity, ScrollView, KeyboardAvoidingView, Platform, Alert } from 'react-native';
import QRCode from 'react-native-qrcode-svg';
import { useRouter } from 'expo-router';
import { BASE_URL } from '../../config/api';

export default function GerarQrCodeScreen() {
  const router = useRouter();
  
  const [etapa, setEtapa] = useState(1);
  const [dataEnsaio, setDataEnsaio] = useState('');
  const [tipoEnsaio, setTipoEnsaio] = useState('Geral');
  const [valorQrCode, setValorQrCode] = useState('');

  const formatarData = (texto: string) => {
    const num = texto.replace(/\D/g, '');
    let formatado = num;
    if (num.length > 2) formatado = num.substring(0, 2) + '/' + num.substring(2);
    if (num.length > 4) formatado = formatado.substring(0, 5) + '/' + formatado.substring(5, 9);
    setDataEnsaio(formatado);
  };

  const handleGerarQrCode = async () => {
    if (!dataEnsaio || !tipoEnsaio) {
      Alert.alert("Erro", "Preencha todos os campos do ensaio.");
      return;
    }

    console.log("Enviando data:", dataEnsaio);
    try {
      const resposta = await fetch(`${BASE_URL}/ensaios`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          data_ensaio: dataEnsaio,
          tipo: tipoEnsaio
        })
      });

      const dados = await resposta.json();

      if (!resposta.ok) {
        throw new Error(dados.erro || "Erro ao criar ensaio no banco");
      }

      setValorQrCode(dados.ensaio.codigo_qr);
      setEtapa(2);
    } catch (error) {
      console.log(error);
      Alert.alert("Erro", "Não foi possível gerar o ensaio no servidor.");
    }
  };

  return (
    <SafeAreaView className="flex-1 bg-[#f5f5f5]">
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} className="flex-1">
        <ScrollView contentContainerStyle={{ flexGrow: 1, justifyContent: 'center', padding: 32 }} showsVerticalScrollIndicator={false}>
          
          {etapa === 1 ? (
            <View>
              <Text className="text-3xl font-black text-manga-orangeDark mb-2 text-center">
                Novo Ensaio
              </Text>
              <Text className="text-base text-manga-gray text-center mb-8">
                Preencha os dados para gerar o código de presença.
              </Text>

              <Text className="text-[#333] font-bold mb-2 ml-1">Data do Ensaio (DD/MM/AAAA)</Text>
              <TextInput
                className="bg-manga-white h-[50px] rounded-lg px-4 mb-4 border border-[#ddd] text-base text-[#666]"
                placeholder="Ex: 12/04/2026"
                placeholderTextColor="#999"
                value={dataEnsaio}
                onChangeText={formatarData}
                keyboardType="numeric"
                maxLength={10}
              />

              <Text className="text-[#333] font-bold mb-2 ml-1">Tipo de Ensaio</Text>
              <TextInput
                className="bg-manga-white h-[50px] rounded-lg px-4 mb-8 border border-[#ddd] text-base text-[#666]"
                placeholder="Ex: Geral, Naipe de Caixas, Apresentação"
                placeholderTextColor="#999"
                value={tipoEnsaio}
                onChangeText={setTipoEnsaio}
              />

              <TouchableOpacity 
                className="bg-manga-orangeDark h-[55px] rounded-xl justify-center items-center shadow-sm mb-4"
                onPress={handleGerarQrCode}
              >
                <Text className="text-manga-white text-lg font-bold">Gerar QR Code</Text>
              </TouchableOpacity>

              <TouchableOpacity 
                className="h-[55px] justify-center items-center rounded-xl"
                onPress={() => router.back()}
              >
                <Text className="text-manga-gray font-bold text-lg">Cancelar</Text>
              </TouchableOpacity>
            </View>
          ) : (
            <View className="items-center">
              <Text className="text-3xl font-black text-manga-orangeDark mb-2 text-center">
                Código Gerado!
              </Text>
              <Text className="text-base text-manga-gray text-center mb-10">
                Peça para os ritmistas lerem este código para registrar a presença de hoje.
              </Text>

              <View className="bg-manga-white p-6 rounded-3xl shadow-sm border border-[#ddd] mb-12">
                <QRCode
                  value={valorQrCode}
                  size={250}
                  color="#E35202"
                  backgroundColor="#FDFDFD"
                />
              </View>

              <TouchableOpacity 
                className="bg-transparent border-2 border-manga-gray w-full h-[55px] justify-center items-center rounded-xl"
                onPress={() => router.back()}
              >
                <Text className="text-manga-gray font-bold text-lg">Concluir e Voltar</Text>
              </TouchableOpacity>
            </View>
          )}

        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}