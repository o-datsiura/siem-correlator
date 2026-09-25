import { describe, expect, it } from "vitest";

import {
  FILE_INGESTION_ERROR_CODE,
  isBinaryPayload,
  MAX_LOG_FILE_SIZE_BYTES,
  readLogFileStream,
} from "@features/log-ingestion";

describe("Stream-Based Log Ingestion & Binary Security Guard", () => {
  describe("isBinaryPayload", () => {
    it("detects null bytes anywhere in the chunk", () => {
      const chunk = new Uint8Array([0x41, 0x42, 0x00, 0x43]);

      expect(isBinaryPayload(chunk)).toBe(true);
    });

    it("detects Linux ELF binary magic header", () => {
      const elfHeader = new Uint8Array([0x7f, 0x45, 0x4c, 0x46, 0x02, 0x01]);

      expect(isBinaryPayload(elfHeader)).toBe(true);
    });

    it("detects Windows PE MZ executable magic header", () => {
      const peHeader = new Uint8Array([0x4d, 0x5a, 0x90, 0x00]);

      expect(isBinaryPayload(peHeader)).toBe(true);
    });

    it("detects Mach-O executable signature", () => {
      const machOHeader = new Uint8Array([0xfe, 0xed, 0xfa, 0xce, 0x01]);

      expect(isBinaryPayload(machOHeader)).toBe(true);
    });

    it("detects ZIP archive magic header", () => {
      const zipHeader = new Uint8Array([0x50, 0x4b, 0x03, 0x04]);

      expect(isBinaryPayload(zipHeader)).toBe(true);
    });

    it("detects PDF binary magic header", () => {
      const pdfHeader = new Uint8Array([0x25, 0x50, 0x44, 0x46, 0x2d]);

      expect(isBinaryPayload(pdfHeader)).toBe(true);
    });

    it("accepts valid ASCII and UTF-8 plain text log lines", () => {
      const text = "Sep 24 10:00:01 web01 sshd[123]: Failed password for root\n";
      const encoder = new TextEncoder();
      const chunk = encoder.encode(text);

      expect(isBinaryPayload(chunk)).toBe(false);
    });
  });

  describe("readLogFileStream", () => {
    it("strictly rejects files exceeding 50MB before reading", async () => {
      const oversizedFile = {
        name: "huge.log",
        size: MAX_LOG_FILE_SIZE_BYTES + 1,
        stream: () => {
          throw new Error("Stream must not be initiated for oversized files");
        },
      } as unknown as File;

      await expect(readLogFileStream(oversizedFile)).rejects.toThrow(
        FILE_INGESTION_ERROR_CODE.FILE_SIZE_EXCEEDED,
      );
    });

    it("rejects binary files containing null bytes on the first chunk", async () => {
      const binaryContent = new Uint8Array([0x41, 0x00, 0x42, 0x43]);
      const blob = new Blob([binaryContent], { type: "application/octet-stream" });
      const file = new File([blob], "malicious.bin");

      await expect(readLogFileStream(file)).rejects.toThrow(
        FILE_INGESTION_ERROR_CODE.BINARY_PAYLOAD_REJECTED,
      );
    });

    it("rejects ELF executable files on the first chunk", async () => {
      const elfContent = new Uint8Array([0x7f, 0x45, 0x4c, 0x46, 0x01, 0x02]);
      const blob = new Blob([elfContent], { type: "application/octet-stream" });
      const file = new File([blob], "trojan");

      await expect(readLogFileStream(file)).rejects.toThrow(
        FILE_INGESTION_ERROR_CODE.BINARY_PAYLOAD_REJECTED,
      );
    });

    it("streams plain text log files and correctly parses lines", async () => {
      const content = [
        "192.168.1.1 - - [24/Sep/2026:10:00:00] 'GET /index.html' 200",
        "192.168.1.2 - - [24/Sep/2026:10:00:01] 'POST /login' 401",
        "",
        "192.168.1.3 - - [24/Sep/2026:10:00:02] 'GET /admin' 403",
      ].join("\n");

      const blob = new Blob([content], { type: "text/plain" });
      const file = new File([blob], "access.log");

      const lines = await readLogFileStream(file);

      expect(lines).toHaveLength(3);
      expect(lines[0]).toBe("192.168.1.1 - - [24/Sep/2026:10:00:00] 'GET /index.html' 200");
      expect(lines[1]).toBe("192.168.1.2 - - [24/Sep/2026:10:00:01] 'POST /login' 401");
      expect(lines[2]).toBe("192.168.1.3 - - [24/Sep/2026:10:00:02] 'GET /admin' 403");
    });
  });
});
