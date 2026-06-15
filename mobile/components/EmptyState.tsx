import React from 'react';
import { Text, View } from 'react-native';
import { useTheme } from '../context/ThemeContext';

type Props = {
  icon: string;
  title: string;
  message?: string;
};

export default function EmptyState({ icon, title, message }: Props) {
  const { colors } = useTheme();

  return (
    <View className="items-center py-10">
      <Text style={{ fontSize: 40, marginBottom: 10 }}>{icon}</Text>
      <Text className="text-sm font-semibold text-center" style={{ color: colors.textPrimary }}>
        {title}
      </Text>
      {message ? (
        <Text className="text-xs text-center mt-1" style={{ color: colors.textSecondary }}>
          {message}
        </Text>
      ) : null}
    </View>
  );
}
