import React from 'react';
import { Text, TouchableOpacity, View } from 'react-native';
import { useTheme } from '../context/ThemeContext';

type Props = {
  icon: string;
  title: string;
  subtitle?: string;
  badge?: string;
  onPress?: () => void;
};

export default function ModuleCard({ icon, title, subtitle, badge, onPress }: Props) {
  const { colors, isDark } = useTheme();

  return (
    <TouchableOpacity
      onPress={onPress}
      activeOpacity={0.85}
      className="rounded-2xl p-4 mb-3 flex-row items-center"
      style={{
        backgroundColor: colors.card,
        borderWidth: 1,
        borderColor: colors.border,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: isDark ? 0.25 : 0.06,
        shadowRadius: 8,
        elevation: 3,
      }}
    >
      <View
        className="w-12 h-12 rounded-2xl items-center justify-center mr-4"
        style={{ backgroundColor: colors.accentSoft }}
      >
        <Text style={{ fontSize: 22 }}>{icon}</Text>
      </View>

      <View className="flex-1">
        <View className="flex-row items-center">
          <Text className="text-base font-bold" style={{ color: colors.textPrimary }}>
            {title}
          </Text>
          {badge ? (
            <View
              className="ml-2 px-2 py-0.5 rounded-full"
              style={{ backgroundColor: colors.accentSoft }}
            >
              <Text className="text-[10px] font-bold" style={{ color: colors.accent }}>
                {badge}
              </Text>
            </View>
          ) : null}
        </View>
        {subtitle ? (
          <Text className="text-xs mt-0.5" style={{ color: colors.textSecondary }}>
            {subtitle}
          </Text>
        ) : null}
      </View>

      <Text style={{ color: colors.textMuted, fontSize: 22, fontWeight: '700' }}>{'›'}</Text>
    </TouchableOpacity>
  );
}
