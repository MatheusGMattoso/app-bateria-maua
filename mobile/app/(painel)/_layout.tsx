import { Stack } from 'expo-router';
import { useTheme } from '../../context/ThemeContext';
import { NotificationProvider } from '../../context/NotificationContext';

export default function PainelLayout() {
  const { colors } = useTheme();
  return (
    <NotificationProvider>
      <Stack
        screenOptions={{ headerShown: false, contentStyle: { backgroundColor: colors.background } }}
      />
    </NotificationProvider>
  );
}
