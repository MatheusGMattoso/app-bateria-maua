import React from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { useTheme } from '../context/ThemeContext';
import ThemeToggle from '../components/ThemeToggle';

export default function WelcomeScreen() {
  const router = useRouter();
  const { colors } = useTheme();

  return (
    <SafeAreaView className="flex-1" style={{ backgroundColor: colors.background }}>
      <View className="flex-row justify-end px-6 pt-2">
        <ThemeToggle />
      </View>

      <View className="flex-1 justify-between px-8 pb-16 pt-6">
        <View className="flex-1 justify-center items-center">
          <View
            className="w-24 h-24 rounded-3xl items-center justify-center mb-6"
            style={{ backgroundColor: colors.accentSoft }}
          >
            <Text style={{ fontSize: 48 }}>🥭</Text>
          </View>
          <Text
            className="text-4xl font-black text-center"
            style={{ color: colors.accent, letterSpacing: 2 }}
          >
            BATERIA MAUÁ
          </Text>
          <Text
            className="text-base font-bold text-center mt-2"
            style={{ color: colors.textSecondary, letterSpacing: 4 }}
          >
            CLUBE DA MANGA
          </Text>

          <View className="flex-row items-center mt-5">
            <View className="h-1 w-6 rounded-full" style={{ backgroundColor: colors.accent }} />
            <View className="h-1 w-6 rounded-full mx-1" style={{ backgroundColor: colors.gold }} />
            <View className="h-1 w-6 rounded-full" style={{ backgroundColor: colors.success }} />
          </View>
        </View>

        <View className="w-full gap-4">
          <TouchableOpacity
            className="h-[55px] rounded-2xl justify-center items-center"
            style={{ backgroundColor: colors.accent }}
            activeOpacity={0.85}
            onPress={() => router.push('/(auth)/login')}
          >
            <Text className="text-lg font-bold" style={{ color: colors.onAccent }}>
              Entrar
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            className="h-[55px] rounded-2xl justify-center items-center"
            style={{ borderWidth: 2, borderColor: colors.accent }}
            activeOpacity={0.85}
            onPress={() => router.push('/(auth)/cadastro')}
          >
            <Text className="text-lg font-bold" style={{ color: colors.accent }}>
              Criar Conta
            </Text>
          </TouchableOpacity>
        </View>
      </View>
    </SafeAreaView>
  );
}
