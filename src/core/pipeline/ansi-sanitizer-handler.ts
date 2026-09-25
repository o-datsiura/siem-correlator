import { AbstractLogHandler } from "@core/pipeline/handler";

import type { RawLogInput } from "@core/domain/types";

const ANSI_ESCAPE_PATTERN = /\u001B(?:[@-Z\\-_]|\[[0-?]*[ -/]*[@-~])/g;
const CONTROL_CHAR_PATTERN = /[\u0000-\u0008\x0B\u000C\x0E-\u001F\x7F]/g;

export class AnsiSanitizerHandler extends AbstractLogHandler {
  protected process(input: RawLogInput): RawLogInput {
    const cleaned = input.line.replace(ANSI_ESCAPE_PATTERN, "").replace(CONTROL_CHAR_PATTERN, "");

    return {
      ...input,
      line: cleaned,
    };
  }
}
