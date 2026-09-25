import { AlertTriangle, FileText, Upload } from "lucide-react";

import { useTranslation } from "@shared/locales";
import { useFileDropZone } from "@features/log-ingestion/hooks/useFileDropZone";

import type { FC } from "react";

interface IFileDropZoneProps {
  readonly onFileLoaded: (lines: string[], fileName: string) => void;
  readonly disabled?: boolean;
}

export const FileDropZone: FC<IFileDropZoneProps> = ({ onFileLoaded, disabled = false }) => {
  const t = useTranslation();
  const {
    isDragOver,
    loadedFileName,
    errorMessage,
    handleDragOver,
    handleDragLeave,
    handleDrop,
    handleFileInput,
  } = useFileDropZone(onFileLoaded, disabled);

  return (
    <div
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
      className={`relative flex flex-col items-center justify-center gap-3 rounded-xl border-2 border-dashed p-8 transition-all duration-300 ${
        isDragOver
          ? "border-primary bg-primary/5 glow-primary"
          : errorMessage
            ? "border-destructive/40 bg-destructive/5"
            : "border-muted-foreground/20 hover:border-muted-foreground/40"
      }`}
    >
      {loadedFileName ? (
        <>
          <FileText className="text-primary h-10 w-10" />
          <p className="text-foreground text-sm font-medium">{loadedFileName}</p>
          <p className="text-muted-foreground text-xs">{t.ingestion.dropZoneSuccess}</p>
        </>
      ) : errorMessage ? (
        <>
          <AlertTriangle className="text-destructive h-10 w-10" />
          <p className="text-destructive text-center text-xs font-semibold">{errorMessage}</p>
          <p className="text-muted-foreground text-xs">{t.ingestion.dropZoneSupportedFormats}</p>
        </>
      ) : (
        <>
          <Upload
            className={`h-10 w-10 transition-colors ${
              isDragOver ? "text-primary" : "text-muted-foreground"
            }`}
          />
          <p className="text-foreground text-sm font-medium">{t.ingestion.dropZonePrompt}</p>
          <p className="text-muted-foreground text-xs">{t.ingestion.dropZoneSupportedFormats}</p>
        </>
      )}

      <label className="bg-secondary text-secondary-foreground hover:bg-secondary/80 mt-2 cursor-pointer rounded-md px-4 py-2 text-xs font-medium transition-colors">
        {t.ingestion.dropZoneBrowse}
        <input
          type="file"
          accept=".log,.txt,.json"
          onChange={handleFileInput}
          className="hidden"
          disabled={disabled}
        />
      </label>
    </div>
  );
};
