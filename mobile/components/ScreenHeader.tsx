import React from 'react';
import { Text, TouchableOpacity, View } from 'react-native';
import { useRouter } from 'expo-router';
import { useTheme } from '../context/ThemeContext';

type Props = {
  title: string;
  subtitle?: string;
  hint?: string;
  onBack?: () => void;
  showBack?: boolean;
  right?: React.ReactNode;
};

export default function ScreenHeader({
  title,
  subtitle,
  hint,
  onBack,
  showBack = true,
  right,
}: Props) {
  const router = useRouter();
  const { colors } = useTheme();

  const voltar = () => {
    if (onBack) onBack();
    else router.back();
  };

  return (
    <View className="mb-5 mt-2">
      <View className="flex-row items-center justify-between">
        <View className="flex-row items-center flex-1">
          {showBack && (
            <TouchableOpacity
              onPress={voltar}
              activeOpacity={0.7}
              className="w-10 h-10 rounded-full items-center justify-center mr-2"
              style={{ backgroundColor: colors.accentSoft }}
            >
              <Text style={{ color: colors.accent, fontSize: 22, fontWeight: '800', lineHeight: 24 }}>
                {'‹'}
              </Text>
            </TouchableOpacity>
          )}
          <Text className="text-2xl font-bold flex-1" style={{ color: colors.textPrimary }}>
            {title}
          </Text>
        </View>
        {right}
      </View>

      {subtitle ? (
        <Text
          className="text-sm font-semibold mt-1"
          style={{ color: colors.textSecondary, marginLeft: showBack ? 48 : 0 }}
        >
          {subtitle}
        </Text>
      ) : null}

      {hint ? (
        <Text
          className="text-xs font-semibold mt-1"
          style={{ color: colors.accent, marginLeft: showBack ? 48 : 0 }}
        >
          {hint}
        </Text>
      ) : null}
    </View>
  );
}
