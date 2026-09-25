import { useCallback, useState } from "react";

import { readLogFileStream } from "@features/log-ingestion/utils/stream-log-reader";

interface IFileReaderState {
  readonly lines: readonly string[];
  readonly fileName: string | null;
  readonly fileSize: number;
  readonly isReading: boolean;
  readonly error: string | null;
}

interface IFileReaderActions {
  readonly readFile: (file: File) => Promise<void>;
  readonly clearFile: () => void;
}

export type IUseFileReaderReturn = IFileReaderState & IFileReaderActions;

export const useFileReader = (): IUseFileReaderReturn => {
  const [lines, setLines] = useState<readonly string[]>([]);
  const [fileName, setFileName] = useState<string | null>(null);
  const [fileSize, setFileSize] = useState(0);
  const [isReading, setIsReading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const readFile = useCallback(async (file: File): Promise<void> => {
    setIsReading(true);
    setError(null);
    setFileName(file.name);
    setFileSize(file.size);

    try {
      const parsedLines = await readLogFileStream(file);

      setLines(parsedLines);
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Failed to read file";

      setError(message);
    } finally {
      setIsReading(false);
    }
  }, []);

  const clearFile = useCallback((): void => {
    setLines([]);
    setFileName(null);
    setFileSize(0);
    setError(null);
  }, []);

  return {
    lines,
    fileName,
    fileSize,
    isReading,
    error,
    readFile,
    clearFile,
  };
};
