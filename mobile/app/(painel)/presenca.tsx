import React, { useState, useEffect, useRef } from 'react';
import { View, Text, TouchableOpacity, ScrollView, StyleSheet, Alert, Platform, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import * as FileSystem from 'expo-file-system/legacy';
import * as Sharing from 'expo-sharing';
import { CameraView, useCameraPermissions } from 'expo-camera';
import { useRouter } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { BASE_URL } from '../../config/api';
import { fetchJson } from '../../utils/apiClient';
import { useTheme } from '../../context/ThemeContext';
import ScreenHeader from '../../components/ScreenHeader';
import ThemeToggle from '../../components/ThemeToggle';

export default function PresencaScreen() {
  const [permissao, solicitarPermissao] = useCameraPermissions();
  const [escaneando, setEscaneando] = useState(false);
  const [perfil, setPerfil] = useState('Membro');
  const [usuarioId, setUsuarioId] = useState<string | null>(null);
  const [resumo, setResumo] = useState({ presencas: 0, faltas: 0, frequencia: 0 });
  const [carregandoResumo, setCarregandoResumo] = useState(true);
  const jaLeuRef = useRef(false);
  const router = useRouter();
  const { colors, isDark } = useTheme();

  const carregarResumo = async (id: string) => {
    try {
      setCarregandoResumo(true);
      const dados = await fetchJson(`${BASE_URL}/presencas/resumo/${id}`);
      setResumo(dados);
    } catch (error) {
      console.error('Erro ao carregar resumo:', error);
    } finally {
      setCarregandoResumo(false);
    }
  };

  const baixarRelatorioPAE = async () => {
    const url = `${BASE_URL}/presencas/relatorio/aprovados`;
    try {
      if (Platform.OS === 'web') {
        window.open(url, '_blank');
      } else {
        const fileUri = `${FileSystem.documentDirectory}horas_pae_aprovados.csv`;
        const downloadResult = await FileSystem.downloadAsync(url, fileUri);
        if (await Sharing.isAvailableAsync()) {
          await Sharing.shareAsync(downloadResult.uri);
        } else {
          Alert.alert('Aviso', 'O compartilhamento não está disponível neste dispositivo.');
        }
      }
    } catch (error) {
      console.error('Erro ao baixar o relatório:', error);
      Alert.alert('Erro', 'Não foi possível gerar a planilha de horas PAE.');
    }
  };

  useEffect(() => {
    const carregarUsuario = async () => {
      const usuarioStorage = await AsyncStorage.getItem('usuario');
      if (usuarioStorage) {
        const usuario = JSON.parse(usuarioStorage);
        setPerfil(usuario.perfil_acesso);
        setUsuarioId(usuario.id);
        carregarResumo(usuario.id);
      } else {
        setCarregandoResumo(false);
      }
    };
    carregarUsuario();
  }, []);

  const lidarComQrCodeLido = ({ data }: { data: string }) => {
    if (jaLeuRef.current) return;
    jaLeuRef.current = true;
    setEscaneando(false);

    const titulo = 'Confirmar Presença';
    const mensagem = 'Deseja registrar sua presença neste ensaio?';

    if (Platform.OS === 'web') {
      const confirmou = window.confirm(`${titulo}\n\n${mensagem}`);
      if (confirmou) confirmarPresencaNoBanco(data);
      else jaLeuRef.current = false;
    } else {
      Alert.alert(titulo, mensagem, [
        { text: 'Cancelar', style: 'cancel', onPress: () => { jaLeuRef.current = false; } },
        { text: 'Sim, Confirmar', onPress: () => confirmarPresencaNoBanco(data) },
      ]);
    }
  };

  const confirmarPresencaNoBanco = async (codigo_qr: string) => {
    if (!usuarioId) {
      const msg = 'Usuário não identificado. Faça login novamente.';
      Platform.OS === 'web' ? window.alert(`Erro: ${msg}`) : Alert.alert('Erro', msg);
      return;
    }

    try {
      await fetchJson(`${BASE_URL}/presencas`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ codigo_qr, membro_id: usuarioId }),
      });

      const msgSucesso = 'Sua presença foi confirmada neste ensaio!';
      Platform.OS === 'web' ? window.alert(`Sucesso! ${msgSucesso}`) : Alert.alert('Sucesso!', msgSucesso);
      carregarResumo(usuarioId);
    } catch (error: any) {
      Platform.OS === 'web' ? window.alert('Erro: ' + error.message) : Alert.alert('Erro', error.message);
      jaLeuRef.current = false;
    }
  };

  const iniciarLeitura = async () => {
    if (!permissao?.granted) {
      const resultado = await solicitarPermissao();
      if (!resultado.granted) {
        Alert.alert('Erro', 'É necessário permitir o uso da câmera para ler o QR Code.');
        return;
      }
    }
    jaLeuRef.current = false;
    setEscaneando(true);
  };

  if (escaneando) {
    return (
      <View className="flex-1" style={{ backgroundColor: '#000' }}>
        <CameraView
          style={StyleSheet.absoluteFillObject}
          facing="back"
          onBarcodeScanned={lidarComQrCodeLido}
          barcodeScannerSettings={{ barcodeTypes: ['qr'] }}
        />
        <TouchableOpacity
          className="absolute bottom-10 self-center px-6 py-3 rounded-full"
          style={{ backgroundColor: '#fff' }}
          onPress={() => {
            setEscaneando(false);
            jaLeuRef.current = false;
          }}
        >
          <Text className="font-bold" style={{ color: colors.danger }}>
            Cancelar
          </Text>
        </TouchableOpacity>
      </View>
    );
  }

  const sombraCard = {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: isDark ? 0.2 : 0.05,
    shadowRadius: 4,
    elevation: 2,
  };

  const podeGerir = perfil === 'Gestor de Módulo' || perfil === 'Administrador';

  return (
    <SafeAreaView className="flex-1" style={{ backgroundColor: colors.background }}>
      <ScrollView contentContainerStyle={{ padding: 24, paddingBottom: 40 }} showsVerticalScrollIndicator={false}>
        <ScreenHeader
          title="Presença"
          subtitle="Acompanhe seu rendimento nos ensaios."
          right={<ThemeToggle />}
        />

        {carregandoResumo ? (
          <View
            className="rounded-2xl p-6 items-center mb-8"
            style={{ backgroundColor: colors.card, borderWidth: 1, borderColor: colors.border, ...sombraCard }}
          >
            <ActivityIndicator color={colors.accent} />
            <Text className="text-xs mt-2" style={{ color: colors.textSecondary }}>
              Carregando resumo...
            </Text>
          </View>
        ) : (
          <View className="flex-row justify-between mb-8">
            {[
              { valor: `${resumo.presencas}`, rotulo: 'Presenças', cor: colors.successText },
              { valor: `${resumo.faltas}`, rotulo: 'Faltas', cor: colors.dangerText },
              { valor: `${resumo.frequencia}%`, rotulo: 'Frequência', cor: colors.accent },
            ].map((item) => (
              <View
                key={item.rotulo}
                className="w-[31%] p-4 rounded-2xl items-center"
                style={{ backgroundColor: colors.card, borderWidth: 1, borderColor: colors.border, ...sombraCard }}
              >
                <Text className="text-2xl font-bold" style={{ color: item.cor }}>
                  {item.valor}
                </Text>
                <Text className="text-xs text-center mt-1" style={{ color: colors.textSecondary }}>
                  {item.rotulo}
                </Text>
              </View>
            ))}
          </View>
        )}

        <Text className="text-lg font-bold mb-4" style={{ color: colors.textPrimary }}>
          Registro de Ensaio
        </Text>

        <TouchableOpacity
          className="p-5 rounded-2xl items-center justify-center mb-4"
          style={{ backgroundColor: colors.accent, ...sombraCard }}
          onPress={iniciarLeitura}
          activeOpacity={0.85}
        >
          <Text className="text-lg font-bold" style={{ color: colors.onAccent }}>
            📷 Ler QR Code
          </Text>
        </TouchableOpacity>

        {podeGerir && (
          <TouchableOpacity
            className="p-5 rounded-2xl items-center justify-center mb-4"
            style={{ borderWidth: 2, borderColor: colors.accent }}
            onPress={() => router.push('/(painel)/gerar-qrcode')}
            activeOpacity={0.85}
          >
            <Text className="text-lg font-bold" style={{ color: colors.accent }}>
              ⚙️ Gerar QR Code (Diretoria)
            </Text>
          </TouchableOpacity>
        )}

        {podeGerir && (
          <TouchableOpacity
            className="p-5 rounded-2xl items-center justify-center"
            style={{ backgroundColor: colors.success, ...sombraCard }}
            onPress={baixarRelatorioPAE}
            activeOpacity={0.85}
          >
            <Text className="text-lg font-bold" style={{ color: colors.onAccent }}>
              📄 Exportar Horas PAE
            </Text>
          </TouchableOpacity>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}
