import React from 'react';
import { Text, TouchableOpacity, View } from 'react-native';
import { useRouter } from 'expo-router';
import { useTheme } from '../context/ThemeContext';
import { useResponsive } from '../utils/responsive';
import { tituloMarca } from '../theme/typography';

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
  const { isSmall } = useResponsive();

  const voltar = () => {
    if (onBack) onBack();
    else router.back();
  };

  const indent = showBack ? 48 : 0;

  return (
    <View className="mb-5 mt-2">
      <View className="flex-row items-start justify-between">
        <View className="flex-row items-center flex-1 min-w-0 pr-2">
          {showBack && (
            <TouchableOpacity
              onPress={voltar}
              activeOpacity={0.7}
              className="w-10 h-10 rounded-full items-center justify-center mr-2 shrink-0"
              style={{ backgroundColor: colors.accentSoft }}
            >
              <Text style={{ color: colors.accent, fontSize: 22, fontWeight: '800', lineHeight: 24 }}>
                {'‹'}
              </Text>
            </TouchableOpacity>
          )}
          <Text
            className={`${isSmall ? 'text-2xl' : 'text-3xl'} flex-1`}
            style={{ color: colors.textPrimary, fontWeight: '900', letterSpacing: -0.5 }}
            numberOfLines={2}
          >
            {tituloMarca(title)}
          </Text>
        </View>

        {right ? <View className="shrink-0">{right}</View> : null}
      </View>

      {subtitle ? (
        <Text
          className="text-sm font-semibold mt-1"
          style={{ color: colors.textSecondary, marginLeft: indent }}
          numberOfLines={3}
        >
          {subtitle}
        </Text>
      ) : null}

      {hint ? (
        <Text
          className="text-xs font-semibold mt-1"
          style={{ color: colors.accent, marginLeft: indent }}
          numberOfLines={3}
        >
          {hint}
        </Text>
      ) : null}
    </View>
  );
}
