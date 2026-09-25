import { useCallback, useState } from "react";

import { INGESTION_SOURCE } from "@features/log-ingestion/constants/presets";

import type { ChangeEvent } from "react";

export interface IUseManualIngestionReturn {
  readonly manualText: string;
  readonly activeLineCount: number;
  readonly handleManualTextChange: (e: ChangeEvent<HTMLTextAreaElement>) => void;
  readonly handleClearManualText: () => void;
  readonly handleManualIngest: () => void;
}

export const useManualIngestion = (
  onIngest: (lines: string[], sourceId: string) => void,
): IUseManualIngestionReturn => {
  const [manualText, setManualText] = useState("");

  const handleManualIngest = useCallback((): void => {
    if (!manualText.trim()) return;

    const lines = manualText.split("\n").filter((l) => l.trim().length > 0);

    onIngest(lines, INGESTION_SOURCE.MANUAL_PASTE);
    setManualText("");
  }, [manualText, onIngest]);

  const handleManualTextChange = useCallback((e: ChangeEvent<HTMLTextAreaElement>): void => {
    setManualText(e.target.value);
  }, []);

  const handleClearManualText = useCallback((): void => {
    setManualText("");
  }, []);

  const activeLineCount = manualText.split("\n").filter((l) => l.trim().length > 0).length;

  return {
    manualText,
    activeLineCount,
    handleManualTextChange,
    handleClearManualText,
    handleManualIngest,
  };
};
