import React, { useCallback, useState } from 'react';
import { View, Text, TouchableOpacity, SafeAreaView, ScrollView, ActivityIndicator } from 'react-native';
import { useRouter, useFocusEffect } from 'expo-router';
import { BASE_URL } from '../../config/api';

type Evento = {
  id?: string;
  titulo: string;
  descricao?: string | null;
  data_evento: string;
  horario_evento?: string | null;
};

const NOMES_MESES = [
  'Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho',
  'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro',
];

const NOMES_DIAS = ['Domingo', 'Segunda', 'Terça', 'Quarta', 'Quinta', 'Sexta', 'Sábado'];

function formatarDataEvento(dataStr: string) {
  const [ano, mes, dia] = dataStr.split('-').map(Number);
  const data = new Date(ano, mes - 1, dia);
  const diaSemana = NOMES_DIAS[data.getDay()];
  return `${diaSemana}, ${dia} de ${NOMES_MESES[mes - 1]} de ${ano}`;
}

export default function DashboardScreen() {
  const router = useRouter();
  const [eventos, setEventos] = useState<Evento[]>([]);
  const [carregando, setCarregando] = useState(true);

  const handleLogout = () => {
    router.replace('/(auth)/login');
  };

  const buscarEventos = useCallback(async () => {
    try {
      setCarregando(true);
      const anoAtual = new Date().getFullYear();
      const resposta = await fetch(`${BASE_URL}/eventos?ano=${anoAtual}`);
      const dados = await resposta.json();

      if (!resposta.ok) {
        throw new Error(dados.erro || 'Erro ao carregar eventos.');
      }

      const hoje = new Date();
      hoje.setHours(0, 0, 0, 0);

      const proximos = (dados.eventos || [])
        .filter((evento: Evento) => {
          const [ano, mes, dia] = evento.data_evento.split('-').map(Number);
          return new Date(ano, mes - 1, dia) >= hoje;
        })
        .sort((a: Evento, b: Evento) => {
          const chaveA = `${a.data_evento}T${a.horario_evento || '23:59'}`;
          const chaveB = `${b.data_evento}T${b.horario_evento || '23:59'}`;
          return chaveA.localeCompare(chaveB);
        });

      setEventos(proximos);
    } catch (error) {
      setEventos([]);
    } finally {
      setCarregando(false);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      buscarEventos();
    }, [buscarEventos])
  );

  return (
    <SafeAreaView className="flex-1 bg-[#f5f5f5]">
      <ScrollView contentContainerStyle={{ padding: 24, paddingBottom: 40 }} showsVerticalScrollIndicator={false}>
        
        <View className="flex-row justify-between items-center mb-8 mt-4">
          <View>
            <Text className="text-2xl font-bold text-[#333]">Olá, Ritmista! 🥁</Text>
            <Text className="text-sm text-manga-gray font-semibold">Bem-vindo ao Mauá Core</Text>
          </View>
          <TouchableOpacity 
            onPress={handleLogout}
            className="bg-manga-orangeDark px-4 py-2 rounded-lg justify-center items-center"
          >
            <Text className="text-manga-white font-bold">Sair</Text>
          </TouchableOpacity>
        </View>

        <View className="flex-row flex-wrap justify-between">
          
          <TouchableOpacity 
            className="bg-manga-white w-[48%] p-5 rounded-xl shadow-sm border border-[#ddd] mb-4 items-center"
            onPress={() => router.push('/(painel)/membros')}
          >
            <Text className="text-4xl mb-3">👥</Text>
            <Text className="text-manga-orangeDark font-bold text-lg">Membros</Text>
            <Text className="text-xs text-manga-gray text-center mt-1">Gestão da bateria</Text>
          </TouchableOpacity>

          <TouchableOpacity 
            className="bg-manga-white w-[48%] p-5 rounded-xl shadow-sm border border-[#ddd] mb-4 items-center"
            onPress={() => router.push('/(painel)/presenca')}
          >
            <Text className="text-4xl mb-3">✅</Text>
            <Text className="text-manga-orangeDark font-bold text-lg">Presença</Text>
            <Text className="text-xs text-manga-gray text-center mt-1">Controle de ensaios</Text>
          </TouchableOpacity>

          <TouchableOpacity
            className="bg-manga-white w-[48%] p-5 rounded-xl shadow-sm border border-[#ddd] mb-4 items-center"
            onPress={() => router.push('/(painel)/calendario')}
          >
            <Text className="text-4xl mb-3">📅</Text>
            <Text className="text-manga-orangeDark font-bold text-lg">Calendário</Text>
            <Text className="text-xs text-manga-gray text-center mt-1">Eventos do ano</Text>
          </TouchableOpacity>

          <TouchableOpacity className="bg-manga-white w-[48%] p-5 rounded-xl shadow-sm border border-[#ddd] mb-4 items-center">
            <Text className="text-4xl mb-3">🥁</Text>
            <Text className="text-manga-orangeDark font-bold text-lg">Patrimônio</Text>
            <Text className="text-xs text-manga-gray text-center mt-1">Instrumentos</Text>
          </TouchableOpacity>

        </View>

        <View className="mt-4">
          <View className="flex-row items-center justify-between mb-4">
            <Text className="text-lg font-bold text-[#333]">Mural de Avisos</Text>
            <TouchableOpacity onPress={() => router.push('/(painel)/calendario')}>
              <Text className="text-xs text-manga-orangeDark font-bold">Ver calendário ›</Text>
            </TouchableOpacity>
          </View>

          {carregando ? (
            <View className="bg-manga-white p-6 rounded-xl shadow-sm items-center">
              <ActivityIndicator size="small" color="#E65100" />
              <Text className="text-xs text-manga-gray mt-2">Carregando eventos...</Text>
            </View>
          ) : eventos.length === 0 ? (
            <View className="bg-manga-white p-6 rounded-xl border-l-4 border-manga-orangeDark shadow-sm items-center">
              <Text className="text-3xl mb-2">📭</Text>
              <Text className="font-bold text-[#333] mb-1">Nenhum evento agendado</Text>
              <Text className="text-sm text-manga-gray text-center">
                Os próximos eventos do calendário aparecerão aqui.
              </Text>
            </View>
          ) : (
            eventos.map((evento, index) => (
              <View
                key={`${evento.id || evento.titulo}-${index}`}
                className="bg-manga-white p-4 rounded-xl border-l-4 border-manga-orangeDark shadow-sm mb-3"
              >
                <View className="flex-row items-start justify-between">
                  <Text className="font-bold text-[#333] flex-1 mr-2">{evento.titulo}</Text>
                  {evento.horario_evento ? (
                    <View className="bg-[#fff3eb] px-2 py-1 rounded-full">
                      <Text className="text-manga-orangeDark text-xs font-bold">
                        {evento.horario_evento}
                      </Text>
                    </View>
                  ) : null}
                </View>
                <Text className="text-xs text-manga-orangeDark font-semibold mt-1">
                  📅 {formatarDataEvento(evento.data_evento)}
                </Text>
                {evento.descricao ? (
                  <Text className="text-sm text-manga-gray mt-2">{evento.descricao}</Text>
                ) : null}
              </View>
            ))
          )}
        </View>

      </ScrollView>
    </SafeAreaView>
  );
}
