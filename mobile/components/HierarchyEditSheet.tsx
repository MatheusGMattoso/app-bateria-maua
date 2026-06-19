import React, { useEffect, useState } from 'react';
import { Alert, Modal, Text, TouchableOpacity, View } from 'react-native';
import { useTheme } from '../context/ThemeContext';
import LoadingButton from './LoadingButton';
import { BASE_URL } from '../config/api';
import { fetchJson } from '../utils/apiClient';
import { type MembroPerfil } from '../utils/memberUtils';

const NIVEIS: { valor: string; rotulo: string; descricao: string }[] = [
  { valor: 'Administrador', rotulo: 'Administrador', descricao: 'Acesso total ao sistema' },
  { valor: 'Gestor de Módulo', rotulo: 'Gestor de Módulo', descricao: 'Gerencia módulos específicos' },
  { valor: 'Membro', rotulo: 'Membro', descricao: 'Acesso padrão de ritmista' },
];

type Props = {
  visible: boolean;
  membro: MembroPerfil;
  onClose: () => void;
  onSalvo: (novoNivel: string) => void;
};

export default function HierarchyEditSheet({ visible, membro, onClose, onSalvo }: Props) {
  const { colors } = useTheme();
  const [nivelSelecionado, setNivelSelecionado] = useState(membro.perfil_acesso || 'Membro');
  const [salvando, setSalvando] = useState(false);

  useEffect(() => {
    if (visible) {
      setNivelSelecionado(membro.perfil_acesso || 'Membro');
    }
  }, [visible, membro.perfil_acesso]);

  const salvar = async () => {
    if (nivelSelecionado === membro.perfil_acesso) {
      onClose();
      return;
    }

    try {
      setSalvando(true);
      await fetchJson(`${BASE_URL}/membros/${membro.id}/perfil`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ perfil_acesso: nivelSelecionado }),
      });
      onSalvo(nivelSelecionado);
      onClose();
      Alert.alert('Nível atualizado', `${membro.nome} agora é ${nivelSelecionado}.`);
    } catch (error: any) {
      Alert.alert('Erro', error.message || 'Não foi possível alterar o nível hierárquico.');
    } finally {
      setSalvando(false);
    }
  };

  return (
    <Modal visible={visible} animationType="slide" transparent onRequestClose={onClose}>
      <View className="flex-1 justify-end" style={{ backgroundColor: 'rgba(0,0,0,0.5)' }}>
        <View className="rounded-t-3xl" style={{ backgroundColor: colors.background, padding: 20, paddingBottom: 40 }}>
          <View className="flex-row items-center justify-between mb-5">
            <Text className="text-lg font-bold" style={{ color: colors.textPrimary }}>
              Nível hierárquico
            </Text>
            <TouchableOpacity onPress={onClose}>
              <Text className="text-sm font-bold" style={{ color: colors.accent }}>
                Fechar
              </Text>
            </TouchableOpacity>
          </View>

          <Text className="text-xs mb-4" style={{ color: colors.textSecondary }}>
            Alterando o nível de{' '}
            <Text className="font-bold" style={{ color: colors.textPrimary }}>
              {membro.nome}
            </Text>
          </Text>

          <View style={{ gap: 10, marginBottom: 24 }}>
            {NIVEIS.map((nivel) => {
              const ativo = nivelSelecionado === nivel.valor;
              return (
                <TouchableOpacity
                  key={nivel.valor}
                  className="flex-row items-center rounded-2xl p-4"
                  style={{
                    backgroundColor: ativo ? colors.accentSoft : colors.backgroundAlt,
                    borderWidth: 1.5,
                    borderColor: ativo ? colors.accent : colors.border,
                  }}
                  onPress={() => setNivelSelecionado(nivel.valor)}
                >
                  <View
                    className="w-5 h-5 rounded-full mr-3 items-center justify-center"
                    style={{
                      borderWidth: 2,
                      borderColor: ativo ? colors.accent : colors.border,
                      backgroundColor: ativo ? colors.accent : 'transparent',
                    }}
                  >
                    {ativo ? (
                      <View className="w-2 h-2 rounded-full" style={{ backgroundColor: colors.onAccent }} />
                    ) : null}
                  </View>
                  <View className="flex-1">
                    <Text className="text-sm font-bold" style={{ color: ativo ? colors.accent : colors.textPrimary }}>
                      {nivel.rotulo}
                    </Text>
                    <Text className="text-xs mt-0.5" style={{ color: colors.textSecondary }}>
                      {nivel.descricao}
                    </Text>
                  </View>
                </TouchableOpacity>
              );
            })}
          </View>

          <LoadingButton label="Salvar nível" loading={salvando} onPress={salvar} />
        </View>
      </View>
    </Modal>
  );
}
