import { useEffect, useState } from "react";

import { THEME_MODE, THEME_STORAGE_KEY } from "@shared/constants/theme";

import type { ThemeMode } from "@shared/constants/theme";

export { THEME_MODE } from "@shared/constants/theme";
export type { ThemeMode } from "@shared/constants/theme";

export const useTheme = () => {
  const [theme, setTheme] = useState<ThemeMode>(() => {
    if (typeof window === "undefined") {
      return THEME_MODE.DARK;
    }

    const saved = localStorage.getItem(THEME_STORAGE_KEY);

    if (saved === THEME_MODE.LIGHT || saved === THEME_MODE.DARK) {
      return saved;
    }

    return THEME_MODE.DARK;
  });

  useEffect(() => {
    const root = document.documentElement;

    if (theme === THEME_MODE.DARK) {
      root.classList.add(THEME_MODE.DARK);
    } else {
      root.classList.remove(THEME_MODE.DARK);
    }

    localStorage.setItem(THEME_STORAGE_KEY, theme);
  }, [theme]);

  const toggleTheme = () => {
    setTheme((prev) => (prev === THEME_MODE.DARK ? THEME_MODE.LIGHT : THEME_MODE.DARK));
  };

  return {
    theme,
    toggleTheme,
    isDark: theme === THEME_MODE.DARK,
  };
};
