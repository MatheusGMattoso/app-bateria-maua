import '../global.css';
import { useEffect } from 'react';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { useFonts } from 'expo-font';
import * as SplashScreen from 'expo-splash-screen';
import { ThemeProvider, useTheme } from '../context/ThemeContext';
import { applyBrandTypography, brandFontMap } from '../theme/typography';

applyBrandTypography();
SplashScreen.preventAutoHideAsync().catch(() => {});

function StackComTema() {
  const { colors, isDark } = useTheme();

  return (
    <>
      <StatusBar style={isDark ? 'light' : 'dark'} />
      <Stack
        screenOptions={{
          headerShown: false,
          contentStyle: { backgroundColor: colors.background },
        }}
      >
        <Stack.Screen name="index" />
        <Stack.Screen name="(auth)" />
        <Stack.Screen name="(painel)" />
      </Stack>
    </>
  );
}

export default function RootLayout() {
  const [fontesProntas] = useFonts(brandFontMap);

  useEffect(() => {
    if (fontesProntas) {
      SplashScreen.hideAsync().catch(() => {});
    }
  }, [fontesProntas]);

  if (!fontesProntas) return null;

  return (
    <SafeAreaProvider>
      <ThemeProvider>
        <StackComTema />
      </ThemeProvider>
    </SafeAreaProvider>
  );
}
