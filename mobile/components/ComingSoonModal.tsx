import React from 'react';
import { Modal, Text, TouchableOpacity, View } from 'react-native';
import { useTheme } from '../context/ThemeContext';

type Props = {
  visible: boolean;
  onClose: () => void;
  title: string;
  message: string;
  icon?: string;
};

export default function ComingSoonModal({ visible, onClose, title, message, icon = '🥭' }: Props) {
  const { colors } = useTheme();

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <View className="flex-1 items-center justify-center px-8" style={{ backgroundColor: colors.overlay }}>
        <View
          className="w-full rounded-3xl p-6 items-center"
          style={{ backgroundColor: colors.card, borderWidth: 1, borderColor: colors.border }}
        >
          <View
            className="w-16 h-16 rounded-full items-center justify-center mb-4"
            style={{ backgroundColor: colors.accentSoft }}
          >
            <Text style={{ fontSize: 32 }}>{icon}</Text>
          </View>

          <Text className="text-xl font-bold mb-2 text-center" style={{ color: colors.textPrimary }}>
            {title}
          </Text>
          <Text className="text-sm text-center mb-6" style={{ color: colors.textSecondary }}>
            {message}
          </Text>

          <TouchableOpacity
            onPress={onClose}
            activeOpacity={0.85}
            className="w-full h-[50px] rounded-2xl items-center justify-center"
            style={{ backgroundColor: colors.accent }}
          >
            <Text className="text-base font-bold" style={{ color: colors.onAccent }}>
              Entendi
            </Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
}
