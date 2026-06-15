import { Stack } from 'expo-router';
import { useTheme } from '../../context/ThemeContext';

export default function PainelLayout() {
  const { colors } = useTheme();
  return (
    <Stack
      screenOptions={{ headerShown: false, contentStyle: { backgroundColor: colors.background } }}
    />
  );
}
