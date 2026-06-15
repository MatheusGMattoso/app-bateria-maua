import React, { createContext, useCallback, useContext, useEffect, useRef, useState } from 'react';
import * as Notifications from 'expo-notifications';
import { useRouter } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';
import {
  getPermissionStatus,
  requestPermissions,
  resyncAll,
  setupAfterLogin,
} from '../services/notificationService';

type NotificationContextValue = {
  permissionStatus: 'granted' | 'denied' | 'undetermined';
  requestPermission: () => Promise<boolean>;
  resyncReminders: (force?: boolean) => Promise<void>;
  setupForUser: (membroId: string) => Promise<void>;
};

const NotificationContext = createContext<NotificationContextValue | null>(null);

export function NotificationProvider({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const [permissionStatus, setPermissionStatus] = useState<'granted' | 'denied' | 'undetermined'>('undetermined');
  const membroIdRef = useRef<string | null>(null);

  const refreshPermission = useCallback(async () => {
    const status = await getPermissionStatus();
    setPermissionStatus(status);
  }, []);

  const requestPermission = useCallback(async () => {
    const ok = await requestPermissions();
    await refreshPermission();
    return ok;
  }, [refreshPermission]);

  const resyncReminders = useCallback(async (force = false) => {
    const membroId = membroIdRef.current;
    if (!membroId) return;
    await resyncAll(membroId, force);
  }, []);

  const setupForUser = useCallback(async (membroId: string) => {
    membroIdRef.current = membroId;
    await setupAfterLogin(membroId);
    await refreshPermission();
  }, [refreshPermission]);

  useEffect(() => {
    refreshPermission();

    (async () => {
      const usuarioRaw = await AsyncStorage.getItem('usuario');
      if (usuarioRaw) {
        const usuario = JSON.parse(usuarioRaw);
        if (usuario?.id) {
          membroIdRef.current = usuario.id;
        }
      }
    })();

    const responseSub = Notifications.addNotificationResponseReceivedListener((response) => {
      const screen = response.notification.request.content.data?.screen;
      if (screen === 'calendario') {
        router.push('/(painel)/calendario');
      } else if (screen === 'presenca') {
        router.push('/(painel)/presenca');
      }
    });

    return () => {
      responseSub.remove();
    };
  }, [router, refreshPermission]);

  return (
    <NotificationContext.Provider
      value={{ permissionStatus, requestPermission, resyncReminders, setupForUser }}
    >
      {children}
    </NotificationContext.Provider>
  );
}

export function useNotifications() {
  const ctx = useContext(NotificationContext);
  if (!ctx) {
    throw new Error('useNotifications deve ser usado dentro de NotificationProvider');
  }
  return ctx;
}
