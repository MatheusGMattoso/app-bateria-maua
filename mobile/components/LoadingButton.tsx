import React from 'react';
import { ActivityIndicator, Text, TouchableOpacity, View } from 'react-native';
import { useTheme } from '../context/ThemeContext';

type Variant = 'primary' | 'outline' | 'success' | 'danger';

type Props = {
  label: string;
  onPress: () => void;
  loading?: boolean;
  disabled?: boolean;
  variant?: Variant;
  icon?: string;
  className?: string;
};

export default function LoadingButton({
  label,
  onPress,
  loading = false,
  disabled = false,
  variant = 'primary',
  icon,
  className = '',
}: Props) {
  const { colors } = useTheme();
  const inativo = loading || disabled;

  const fundo = variant === 'success' ? colors.success : variant === 'danger' ? colors.danger : colors.accent;
  const ehContorno = variant === 'outline';

  const corTexto = ehContorno ? colors.accent : colors.onAccent;

  return (
    <TouchableOpacity
      onPress={onPress}
      disabled={inativo}
      activeOpacity={0.85}
      className={`h-[52px] rounded-2xl items-center justify-center flex-row ${className}`}
      style={{
        backgroundColor: ehContorno ? 'transparent' : fundo,
        borderWidth: ehContorno ? 2 : 0,
        borderColor: ehContorno ? colors.accent : undefined,
        opacity: inativo ? 0.6 : 1,
      }}
    >
      {loading ? (
        <ActivityIndicator color={corTexto} />
      ) : (
        <View className="flex-row items-center">
          {icon ? <Text style={{ fontSize: 16, marginRight: 8 }}>{icon}</Text> : null}
          <Text className="text-base font-bold" style={{ color: corTexto }}>
            {label}
          </Text>
        </View>
      )}
    </TouchableOpacity>
  );
}
