import React from 'react';
import { View, Text, TouchableOpacity, SafeAreaView, ScrollView } from 'react-native';
import { useRouter } from 'expo-router';

export default function DashboardScreen() {
  const router = useRouter();

  const handleLogout = () => {
    router.replace('/(auth)/login');
  };

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
          
          <TouchableOpacity className="bg-manga-white w-[48%] p-5 rounded-xl shadow-sm border border-[#ddd] mb-4 items-center">
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

          <TouchableOpacity className="bg-manga-white w-[48%] p-5 rounded-xl shadow-sm border border-[#ddd] mb-4 items-center">
            <Text className="text-4xl mb-3">📅</Text>
            <Text className="text-manga-orangeDark font-bold text-lg">Eventos</Text>
            <Text className="text-xs text-manga-gray text-center mt-1">Próximos shows</Text>
          </TouchableOpacity>

          <TouchableOpacity className="bg-manga-white w-[48%] p-5 rounded-xl shadow-sm border border-[#ddd] mb-4 items-center">
            <Text className="text-4xl mb-3">🥁</Text>
            <Text className="text-manga-orangeDark font-bold text-lg">Patrimônio</Text>
            <Text className="text-xs text-manga-gray text-center mt-1">Instrumentos</Text>
          </TouchableOpacity>

        </View>

        <View className="mt-4">
          <Text className="text-lg font-bold text-[#333] mb-4">Mural de Avisos</Text>
          <View className="bg-manga-white p-4 rounded-xl border-l-4 border-manga-orangeDark shadow-sm">
            <Text className="font-bold text-[#333] mb-1">Ensaio Geral - Sábado</Text>
            <Text className="text-sm text-manga-gray">
              Não se esqueçam do ensaio geral neste sábado às 14h na quadra. Presença obrigatória para todos os naipes!
            </Text>
          </View>
        </View>

      </ScrollView>
    </SafeAreaView>
  );
}