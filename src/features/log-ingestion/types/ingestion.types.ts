import type { ChangeEvent, DragEvent } from "react";

export interface IUseManualIngestionReturn {
  readonly manualText: string;
  readonly activeLineCount: number;
  readonly handleManualTextChange: (e: ChangeEvent<HTMLTextAreaElement>) => void;
  readonly handleClearManualText: () => void;
  readonly handleManualIngest: () => void;
}

export interface IUseFileDropZoneReturn {
  readonly isDragOver: boolean;
  readonly loadedFileName: string | null;
  readonly errorMessage: string | null;
  readonly handleDragOver: (e: DragEvent<HTMLDivElement>) => void;
  readonly handleDragLeave: (e: DragEvent<HTMLDivElement>) => void;
  readonly handleDrop: (e: DragEvent<HTMLDivElement>) => void;
  readonly handleFileInput: (e: ChangeEvent<HTMLInputElement>) => void;
}

export interface IUsePresetSelectorReturn {
  readonly loadingPresetId: string | null;
  readonly activePresetId: string | null;
  readonly createPresetLoadHandler: (presetId: string, filename: string) => () => void;
}
