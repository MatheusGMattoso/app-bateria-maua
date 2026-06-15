import React, { createContext, useCallback, useContext, useEffect, useRef, useState } from 'react';
import { useRouter } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';
import {
  addNotificationResponseListener,
  getPermissionStatus,
  notificationsSupported,
  requestPermissions,
  resyncAll,
  setupAfterLogin,
} from '../services/notificationService';

type NotificationContextValue = {
  permissionStatus: 'granted' | 'denied' | 'undetermined';
  notificationsAvailable: boolean;
  requestPermission: () => Promise<boolean>;
  resyncReminders: (force?: boolean) => Promise<void>;
  setupForUser: (membroId: string) => Promise<void>;
};

const NotificationContext = createContext<NotificationContextValue | null>(null);

export function NotificationProvider({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const [permissionStatus, setPermissionStatus] = useState<'granted' | 'denied' | 'undetermined'>('undetermined');
  const membroIdRef = useRef<string | null>(null);
  const notificationsAvailable = notificationsSupported();

  const refreshPermission = useCallback(async () => {
    if (!notificationsAvailable) {
      setPermissionStatus('undetermined');
      return;
    }
    const status = await getPermissionStatus();
    setPermissionStatus(status);
  }, [notificationsAvailable]);

  const requestPermission = useCallback(async () => {
    if (!notificationsAvailable) return false;
    const ok = await requestPermissions();
    await refreshPermission();
    return ok;
  }, [notificationsAvailable, refreshPermission]);

  const resyncReminders = useCallback(async (force = false) => {
    const membroId = membroIdRef.current;
    if (!membroId || !notificationsAvailable) return;
    await resyncAll(membroId, force);
  }, [notificationsAvailable]);

  const setupForUser = useCallback(async (membroId: string) => {
    membroIdRef.current = membroId;
    if (!notificationsAvailable) return;
    await setupAfterLogin(membroId);
    await refreshPermission();
  }, [notificationsAvailable, refreshPermission]);

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

    let removeListener: (() => void) | null = null;

    addNotificationResponseListener((screen) => {
      if (screen === 'calendario') {
        router.push('/(painel)/calendario');
      } else if (screen === 'presenca') {
        router.push('/(painel)/presenca');
      }
    }).then((remove) => {
      removeListener = remove;
    });

    return () => {
      removeListener?.();
    };
  }, [router, refreshPermission]);

  return (
    <NotificationContext.Provider
      value={{
        permissionStatus,
        notificationsAvailable,
        requestPermission,
        resyncReminders,
        setupForUser,
      }}
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
