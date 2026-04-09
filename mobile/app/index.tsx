import React from 'react';
import { View, Text, TouchableOpacity, SafeAreaView } from 'react-native';
import { useRouter } from 'expo-router';

export default function WelcomeScreen() {
  const router = useRouter();

  return (
    <SafeAreaView className="flex-1 bg-[#f5f5f5]">
      <View className="flex-1 justify-between px-8 py-16">
        
        <View className="flex-1 justify-center items-center">
          <Text className="text-4xl font-black text-manga-orangeDark text-center tracking-[2px]">
            BATERIA MAUÁ
          </Text>
          <Text className="text-base font-bold text-manga-gray text-center tracking-[4px] mt-1.5">
            CLUBE DA MANGA
          </Text>
        </View>

        <View className="w-full gap-4">
          <TouchableOpacity 
            className="bg-manga-orangeDark h-[55px] rounded-lg justify-center items-center shadow-sm"
            onPress={() => router.push('/(auth)/login')} 
          >
            <Text className="text-manga-white text-lg font-bold">Entrar</Text>
          </TouchableOpacity>

          <TouchableOpacity 
            className="bg-transparent h-[55px] rounded-lg border-2 border-manga-orangeDark justify-center items-center"
            onPress={() => router.push('/(auth)/cadastro')} 
          >
            <Text className="text-manga-orangeDark text-lg font-bold">Criar Conta</Text>
          </TouchableOpacity>
        </View>

      </View>
    </SafeAreaView>
  );
}