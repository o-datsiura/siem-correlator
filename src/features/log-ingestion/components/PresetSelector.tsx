import { CheckCircle2, Play } from "lucide-react";

import { useTranslation } from "@shared/locales";
import { usePresetSelector } from "@features/log-ingestion/hooks/usePresetSelector";
import { getPresetIcon } from "@features/log-ingestion/utils/preset-icons";
import { PRESETS } from "@features/log-ingestion/utils/presets";

import type { FC } from "react";

interface IPresetSelectorProps {
  readonly onSelectPreset: (lines: string[], sourceId: string) => void;
  readonly disabled?: boolean;
}

export const PresetSelector: FC<IPresetSelectorProps> = ({ onSelectPreset, disabled = false }) => {
  const t = useTranslation();
  const { loadingPresetId, activePresetId, createPresetLoadHandler } =
    usePresetSelector(onSelectPreset);

  return (
    <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
      {PRESETS.map((preset) => {
        const isLoading = loadingPresetId === preset.id;
        const isLoaded = activePresetId === preset.id;

        return (
          <div
            key={preset.id}
            className={`flex flex-col justify-between rounded-xl border p-4 transition-all ${
              isLoaded
                ? "border-primary/50 bg-card shadow-sm"
                : "border-border bg-card/60 hover:border-border hover:bg-muted/60"
            }`}
          >
            <div>
              <div className="mb-2 flex items-center justify-between">
                <div className="border-border bg-muted rounded-lg border p-2">
                  {getPresetIcon(preset.id)}
                </div>
                {isLoaded && (
                  <span className="border-primary/40 bg-primary/10 text-primary flex items-center gap-1 rounded border px-2 py-0.5 font-mono text-xs">
                    <CheckCircle2 className="h-3 w-3" /> {t.common.loaded}
                  </span>
                )}
              </div>
              <h3 className="text-card-foreground mb-1 text-sm font-semibold">{preset.name}</h3>
              <p className="text-muted-foreground mb-3 text-xs leading-relaxed">
                {preset.description}
              </p>

              <div className="mb-4 flex flex-wrap gap-1">
                {preset.threatTypes.map((threatType) => (
                  <span
                    key={threatType}
                    className="border-border bg-muted text-muted-foreground rounded border px-2 py-0.5 font-mono text-xs"
                  >
                    {threatType}
                  </span>
                ))}
              </div>
            </div>

            <button
              onClick={createPresetLoadHandler(preset.id, preset.filename)}
              disabled={disabled || isLoading}
              className="bg-primary text-primary-foreground hover:bg-primary/90 flex w-full cursor-pointer items-center justify-center gap-2 rounded-lg px-3 py-2 text-xs font-semibold shadow transition-colors disabled:opacity-50"
            >
              <Play className="h-3.5 w-3.5 fill-current" />
              {isLoading ? t.ingestion.injectingPresetButton : t.ingestion.injectPresetButton}
            </button>
          </div>
        );
      })}
    </div>
  );
};
