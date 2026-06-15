import React from 'react';
import { Text, TouchableOpacity, View } from 'react-native';
import { useTheme } from '../context/ThemeContext';
import { useResponsive } from '../utils/responsive';

type Props = {
  icon: string;
  title: string;
  subtitle?: string;
  badge?: string;
  onPress?: () => void;
};

export default function ModuleCard({ icon, title, subtitle, badge, onPress }: Props) {
  const { colors, isDark } = useTheme();
  const { isSmall } = useResponsive();

  return (
    <TouchableOpacity
      onPress={onPress}
      activeOpacity={0.85}
      className={`rounded-2xl ${isSmall ? 'p-3' : 'p-4'} mb-3 flex-row items-center`}
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
        className={`${isSmall ? 'w-10 h-10 mr-3' : 'w-12 h-12 mr-4'} rounded-2xl items-center justify-center shrink-0`}
        style={{ backgroundColor: colors.accentSoft }}
      >
        <Text style={{ fontSize: isSmall ? 18 : 22 }}>{icon}</Text>
      </View>

      <View className="flex-1 min-w-0 mr-2">
        <View className="flex-row items-center flex-wrap">
          <Text
            className={`${isSmall ? 'text-sm' : 'text-base'} font-bold shrink`}
            style={{ color: colors.textPrimary }}
            numberOfLines={1}
          >
            {title}
          </Text>
          {badge ? (
            <View
              className="ml-2 px-2 py-0.5 rounded-full shrink-0"
              style={{ backgroundColor: colors.accentSoft }}
            >
              <Text className="text-[10px] font-bold" style={{ color: colors.accent }}>
                {badge}
              </Text>
            </View>
          ) : null}
        </View>
        {subtitle ? (
          <Text
            className="text-xs mt-0.5"
            style={{ color: colors.textSecondary }}
            numberOfLines={2}
          >
            {subtitle}
          </Text>
        ) : null}
      </View>

      <Text className="shrink-0" style={{ color: colors.textMuted, fontSize: isSmall ? 18 : 22, fontWeight: '700' }}>
        {'›'}
      </Text>
    </TouchableOpacity>
  );
}
