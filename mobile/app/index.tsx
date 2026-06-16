import React from 'react';
import { View, Text, TouchableOpacity, Image } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { useTheme } from '../context/ThemeContext';
import { useResponsive } from '../utils/responsive';
import { tituloMarca } from '../theme/typography';

export default function WelcomeScreen() {
  const router = useRouter();
  const { colors } = useTheme();
  const { screenPadding } = useResponsive();

  return (
    <SafeAreaView className="flex-1" style={{ backgroundColor: colors.background }}>
      <View className="flex-1 justify-between pb-16" style={{ paddingHorizontal: screenPadding, paddingTop: 24 }}>
        <View className="flex-1 justify-center items-center">
          <Image
            source={require('../assets/images/logo-bateria-maua.png')}
            style={{ width: 200, height: 200, marginBottom: 20 }}
            resizeMode="contain"
          />
          <Text
            className="text-5xl text-center"
            style={{ color: colors.textPrimary, fontWeight: '900', letterSpacing: -0.5 }}
          >
            {tituloMarca('Bateria Mauá')}
          </Text>
          <Text
            className="text-sm font-bold text-center mt-2 uppercase"
            style={{ color: colors.accent, letterSpacing: 4 }}
          >
            Clube da Manga
          </Text>

          <View className="flex-row items-center mt-5">
            <View className="h-1 w-6 rounded-full" style={{ backgroundColor: colors.accentLight }} />
            <View className="h-1 w-6 rounded-full mx-1" style={{ backgroundColor: colors.accent }} />
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
