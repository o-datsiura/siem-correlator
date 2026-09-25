import { Moon, Sun } from "lucide-react";

import { useTheme } from "@shared/hooks/useTheme";
import { useTranslation } from "@shared/locales";

import type { FC } from "react";

interface IThemeToggleProps {
  readonly className?: string;
}

export const ThemeToggle: FC<IThemeToggleProps> = ({ className }) => {
  const t = useTranslation();
  const { isDark, toggleTheme } = useTheme();

  return (
    <button
      type="button"
      onClick={toggleTheme}
      aria-label={t.common.toggleTheme}
      title={isDark ? t.common.themeLight : t.common.themeDark}
      className={
        className ??
        "border-border bg-card text-muted-foreground hover:bg-muted hover:text-foreground flex h-9 w-9 cursor-pointer items-center justify-center rounded-lg border transition-colors"
      }
    >
      {isDark ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
    </button>
  );
};
