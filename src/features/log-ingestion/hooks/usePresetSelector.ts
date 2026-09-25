import { useCallback, useState } from "react";

import { useTranslation } from "@shared/locales";
import { INGESTION_SOURCE } from "@features/log-ingestion/constants/presets";
import { loadPreset } from "@features/log-ingestion/utils/presets";

export interface IUsePresetSelectorReturn {
  readonly loadingPresetId: string | null;
  readonly activePresetId: string | null;
  readonly createPresetLoadHandler: (presetId: string, filename: string) => () => void;
}

export const usePresetSelector = (
  onSelectPreset: (lines: string[], sourceId: string) => void,
): IUsePresetSelectorReturn => {
  const t = useTranslation();
  const [loadingPresetId, setLoadingPresetId] = useState<string | null>(null);
  const [activePresetId, setActivePresetId] = useState<string | null>(null);

  const handleLoad = useCallback(
    async (presetId: string, filename: string): Promise<void> => {
      try {
        setLoadingPresetId(presetId);
        const lines = await loadPreset(filename);

        onSelectPreset(lines, `${INGESTION_SOURCE.PRESET_PREFIX}${presetId}`);
        setActivePresetId(presetId);
      } catch (err) {
        console.error(t.errors.failedToLoadPreset(filename), err);
      } finally {
        setLoadingPresetId(null);
      }
    },
    [onSelectPreset, t],
  );

  const createPresetLoadHandler = useCallback(
    (presetId: string, filename: string) => (): void => {
      void handleLoad(presetId, filename);
    },
    [handleLoad],
  );

  return {
    loadingPresetId,
    activePresetId,
    createPresetLoadHandler,
  };
};
