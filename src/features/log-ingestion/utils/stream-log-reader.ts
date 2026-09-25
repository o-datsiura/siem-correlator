import {
  FILE_INGESTION_ERROR_CODE,
  MAX_LOG_FILE_SIZE_BYTES,
} from "@features/log-ingestion/constants/file-security";
import { isBinaryPayload } from "@features/log-ingestion/utils/binary-guard";

export const readLogFileStream = async (file: File): Promise<string[]> => {
  if (file.size > MAX_LOG_FILE_SIZE_BYTES) {
    throw new Error(FILE_INGESTION_ERROR_CODE.FILE_SIZE_EXCEEDED);
  }

  const reader = file.stream().getReader();
  const decoder = new TextDecoder("utf-8");

  const lines: string[] = [];
  let remainder = "";
  let isFirstChunk = true;

  try {
    while (true) {
      const { done, value } = await reader.read();

      if (done) {
        const finalTrimmed = remainder.trim();

        if (finalTrimmed.length > 0) {
          lines.push(finalTrimmed);
        }

        break;
      }

      if (isFirstChunk) {
        isFirstChunk = false;

        if (isBinaryPayload(value)) {
          await reader.cancel();

          throw new Error(FILE_INGESTION_ERROR_CODE.BINARY_PAYLOAD_REJECTED);
        }
      }

      const decodedChunk = decoder.decode(value, { stream: true });
      const combined = remainder + decodedChunk;
      const splitLines = combined.split("\n");

      remainder = splitLines.pop() ?? "";

      for (const line of splitLines) {
        const trimmed = line.trim();

        if (trimmed.length > 0) {
          lines.push(trimmed);
        }
      }
    }
  } catch (error: unknown) {
    if (
      error instanceof Error &&
      (error.message === FILE_INGESTION_ERROR_CODE.FILE_SIZE_EXCEEDED ||
        error.message === FILE_INGESTION_ERROR_CODE.BINARY_PAYLOAD_REJECTED)
    ) {
      throw error;
    }

    throw new Error(FILE_INGESTION_ERROR_CODE.FILE_READ_FAILED, { cause: error });
  }

  return lines;
};
