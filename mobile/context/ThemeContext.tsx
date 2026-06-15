import React, { createContext, useContext, useEffect, useState } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { ThemeColors, darkColors, lightColors } from '../theme/colors';

const STORAGE_KEY = '@bateria_maua_tema';

type ThemeContextValue = {
  colors: ThemeColors;
  isDark: boolean;
  toggleTheme: () => void;
  pronto: boolean;
};

const ThemeContext = createContext<ThemeContextValue>({
  colors: lightColors,
  isDark: false,
  toggleTheme: () => {},
  pronto: false,
});

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [isDark, setIsDark] = useState(false);
  const [pronto, setPronto] = useState(false);

  useEffect(() => {
    (async () => {
      try {
        const salvo = await AsyncStorage.getItem(STORAGE_KEY);
        if (salvo === 'dark') setIsDark(true);
      } finally {
        setPronto(true);
      }
    })();
  }, []);

  const toggleTheme = () => {
    setIsDark((anterior) => {
      const proximo = !anterior;
      AsyncStorage.setItem(STORAGE_KEY, proximo ? 'dark' : 'light').catch(() => {});
      return proximo;
    });
  };

  return (
    <ThemeContext.Provider
      value={{ colors: isDark ? darkColors : lightColors, isDark, toggleTheme, pronto }}
    >
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  return useContext(ThemeContext);
}
