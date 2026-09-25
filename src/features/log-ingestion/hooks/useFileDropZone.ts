import { useCallback, useState } from "react";

import { useWindowDragDropBoundary } from "@shared/hooks/useWindowDragDropBoundary";
import { useTranslation } from "@shared/locales";
import { FILE_INGESTION_ERROR_CODE } from "@features/log-ingestion/constants/file-security";
import { readLogFileStream } from "@features/log-ingestion/utils/stream-log-reader";

import type { ChangeEvent, DragEvent } from "react";

export interface IUseFileDropZoneReturn {
  readonly isDragOver: boolean;
  readonly loadedFileName: string | null;
  readonly errorMessage: string | null;
  readonly handleDragOver: (e: DragEvent<HTMLDivElement>) => void;
  readonly handleDragLeave: (e: DragEvent<HTMLDivElement>) => void;
  readonly handleDrop: (e: DragEvent<HTMLDivElement>) => void;
  readonly handleFileInput: (e: ChangeEvent<HTMLInputElement>) => void;
}

export const useFileDropZone = (
  onFileLoaded: (lines: string[], fileName: string) => void,
  disabled = false,
): IUseFileDropZoneReturn => {
  const t = useTranslation();
  useWindowDragDropBoundary();

  const [isDragOver, setIsDragOver] = useState(false);
  const [loadedFileName, setLoadedFileName] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const processFile = useCallback(
    async (file: File): Promise<void> => {
      setErrorMessage(null);
      setLoadedFileName(null);

      try {
        const lines = await readLogFileStream(file);

        setLoadedFileName(file.name);
        onFileLoaded(lines, file.name);
      } catch (err: unknown) {
        if (err instanceof Error) {
          if (err.message === FILE_INGESTION_ERROR_CODE.FILE_SIZE_EXCEEDED) {
            setErrorMessage(t.ingestion.fileSizeExceeded);

            return;
          }

          if (err.message === FILE_INGESTION_ERROR_CODE.BINARY_PAYLOAD_REJECTED) {
            setErrorMessage(t.ingestion.binaryPayloadRejected);

            return;
          }
        }

        setErrorMessage(t.ingestion.fileReadFailed);
      }
    },
    [onFileLoaded, t],
  );

  const handleDragOver = useCallback(
    (e: DragEvent<HTMLDivElement>): void => {
      e.preventDefault();

      if (disabled) {
        return;
      }

      setIsDragOver(true);
    },
    [disabled],
  );

  const handleDragLeave = useCallback((e: DragEvent<HTMLDivElement>): void => {
    e.preventDefault();
    setIsDragOver(false);
  }, []);

  const handleDrop = useCallback(
    (e: DragEvent<HTMLDivElement>): void => {
      e.preventDefault();
      setIsDragOver(false);

      if (disabled) {
        return;
      }

      const file = e.dataTransfer.files[0];

      if (!file) {
        return;
      }

      void processFile(file);
    },
    [disabled, processFile],
  );

  const handleFileInput = useCallback(
    (e: ChangeEvent<HTMLInputElement>): void => {
      const file = e.target.files?.[0];

      if (!file) {
        return;
      }

      void processFile(file);
    },
    [processFile],
  );

  return {
    isDragOver,
    loadedFileName,
    errorMessage,
    handleDragOver,
    handleDragLeave,
    handleDrop,
    handleFileInput,
  };
};
