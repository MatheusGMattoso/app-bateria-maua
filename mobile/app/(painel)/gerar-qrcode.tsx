import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, ScrollView, KeyboardAvoidingView, Platform, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import QRCode from 'react-native-qrcode-svg';
import { useRouter } from 'expo-router';
import { BASE_URL } from '../../config/api';
import { fetchJson } from '../../utils/apiClient';
import { useTheme } from '../../context/ThemeContext';
import ScreenHeader from '../../components/ScreenHeader';
import LoadingButton from '../../components/LoadingButton';
import { useResponsive } from '../../utils/responsive';

export default function GerarQrCodeScreen() {
  const router = useRouter();
  const { colors } = useTheme();
  const { screenPadding, isSmall } = useResponsive();

  const [etapa, setEtapa] = useState(1);
  const [dataEnsaio, setDataEnsaio] = useState('');
  const [valorQrCode, setValorQrCode] = useState('');
  const [gerando, setGerando] = useState(false);

  const opcoesEvento = [
    { titulo: 'Ensaio de Quarta', sub: 'Escolinha (1 Ponto)', peso: 1, categoria: 'ensaio' },
    { titulo: 'Ensaio de Sábado', sub: 'Fim de semana (2 Pontos)', peso: 2, categoria: 'ensaio' },
    { titulo: 'Evento Menor', sub: 'Bônus (2 Pontos)', peso: 2, categoria: 'evento' },
    { titulo: 'Evento Importante', sub: 'Dia de Semana / Grande porte (3 Pontos)', peso: 3, categoria: 'evento' },
  ];

  const [selecao, setSelecao] = useState(opcoesEvento[0]);

  const formatarData = (texto: string) => {
    const num = texto.replace(/\D/g, '');
    let formatado = num;
    if (num.length > 2) formatado = num.substring(0, 2) + '/' + num.substring(2);
    if (num.length > 4) formatado = formatado.substring(0, 5) + '/' + formatado.substring(5, 9);
    setDataEnsaio(formatado);
  };

  const handleGerarQrCode = async () => {
    if (!dataEnsaio) {
      Alert.alert('Erro', 'Preencha a data do ensaio.');
      return;
    }

    try {
      setGerando(true);
      const dados = await fetchJson(`${BASE_URL}/ensaios`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          data_ensaio: dataEnsaio,
          tipo: selecao.titulo,
          peso: selecao.peso,
          categoria: selecao.categoria,
        }),
      });

      setValorQrCode(dados.codigo_qr || dados.ensaio?.codigo_qr);
      setEtapa(2);
    } catch (error: any) {
      Alert.alert('Erro', error.message || 'Não foi possível gerar o ensaio no servidor.');
    } finally {
      setGerando(false);
    }
  };

  const estiloInput = {
    backgroundColor: colors.card,
    borderColor: colors.border,
    color: colors.textPrimary,
    borderWidth: 1,
  };

  return (
    <SafeAreaView className="flex-1" style={{ backgroundColor: colors.background }}>
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} className="flex-1">
        <ScrollView contentContainerStyle={{ flexGrow: 1, padding: screenPadding }} showsVerticalScrollIndicator={false}>
          <ScreenHeader title="Gerar QR Code" subtitle="Crie o código de presença do ensaio." onBack={() => router.back()} />

          {etapa === 1 ? (
            <View className="flex-1 justify-center">
              <View
                className="w-16 h-16 rounded-2xl items-center justify-center self-center mb-4"
                style={{ backgroundColor: colors.accentSoft }}
              >
                <Text style={{ fontSize: 32 }}>🥭</Text>
              </View>
              <Text className="text-2xl font-black mb-2 text-center" style={{ color: colors.accent }}>
                Novo Ensaio
              </Text>
              <Text className="text-base text-center mb-8" style={{ color: colors.textSecondary }}>
                Preencha os dados e o peso para gerar o código.
              </Text>

              <Text className="font-bold mb-2 ml-1" style={{ color: colors.textPrimary }}>
                Data do Ensaio (DD/MM/AAAA)
              </Text>
              <TextInput
                className="h-[50px] rounded-2xl px-4 mb-6 text-base"
                style={estiloInput}
                placeholder="Ex: 12/04/2026"
                placeholderTextColor={colors.textMuted}
                value={dataEnsaio}
                onChangeText={formatarData}
                keyboardType="numeric"
                maxLength={10}
              />

              <Text className="font-bold mb-2 ml-1" style={{ color: colors.textPrimary }}>
                Categoria do Evento
              </Text>
              <View className="mb-6">
                {opcoesEvento.map((opcao, index) => {
                  const selecionado = selecao.titulo === opcao.titulo;
                  return (
                    <TouchableOpacity
                      key={index}
                      onPress={() => setSelecao(opcao)}
                      className="p-4 rounded-2xl mb-3 flex-row justify-between items-center"
                      style={{
                        borderWidth: 2,
                        borderColor: selecionado ? colors.accent : colors.border,
                        backgroundColor: selecionado ? colors.accentSoft : colors.card,
                      }}
                    >
                      <View>
                        <Text className="text-base font-bold" style={{ color: selecionado ? colors.accent : colors.textPrimary }}>
                          {opcao.titulo}
                        </Text>
                        <Text className="text-xs mt-1" style={{ color: colors.textSecondary }}>
                          {opcao.sub}
                        </Text>
                      </View>
                      {selecionado && <View className="h-4 w-4 rounded-full" style={{ backgroundColor: colors.accent }} />}
                    </TouchableOpacity>
                  );
                })}
              </View>

              <LoadingButton label="Gerar QR Code" onPress={handleGerarQrCode} loading={gerando} className="mb-3" />

              <TouchableOpacity className="h-[52px] justify-center items-center rounded-2xl" onPress={() => router.back()}>
                <Text className="font-bold text-base" style={{ color: colors.textSecondary }}>
                  Cancelar
                </Text>
              </TouchableOpacity>
            </View>
          ) : (
            <View className="flex-1 justify-center items-center">
              <Text className="text-2xl font-black mb-2 text-center" style={{ color: colors.accent }}>
                Código Gerado!
              </Text>
              <Text className="text-base text-center mb-10" style={{ color: colors.textSecondary }}>
                Peça para os ritmistas lerem este código para registrar a presença de hoje.
              </Text>

              <View
                className="p-6 rounded-3xl mb-12"
                style={{ backgroundColor: '#FFFFFF', borderWidth: 1, borderColor: colors.border }}
              >
                <QRCode value={valorQrCode} size={isSmall ? 200 : 250} color="#E35202" backgroundColor="#FFFFFF" />
              </View>

              <TouchableOpacity
                className="w-full h-[52px] justify-center items-center rounded-2xl"
                style={{ borderWidth: 2, borderColor: colors.border }}
                onPress={() => router.back()}
              >
                <Text className="font-bold text-base" style={{ color: colors.textSecondary }}>
                  Concluir e Voltar
                </Text>
              </TouchableOpacity>
            </View>
          )}
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
