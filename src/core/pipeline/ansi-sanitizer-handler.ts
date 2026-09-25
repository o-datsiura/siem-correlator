import { AbstractLogHandler } from "@core/pipeline/handler";

import type { RawLogInput } from "@core/domain/types";

const ANSI_ESCAPE_PATTERN = /\u001B(?:[@-Z\\-_]|\[[0-?]*[ -/]*[@-~])/gu;
const CONTROL_CHAR_PATTERN = /[\u0000-\u0008\u000B\u000C\u000E-\u001F\u007F]/gu;

export class AnsiSanitizerHandler extends AbstractLogHandler {
  protected process(input: RawLogInput): RawLogInput {
    const cleaned = input.line.replace(ANSI_ESCAPE_PATTERN, "").replace(CONTROL_CHAR_PATTERN, "");

    return {
      ...input,
      line: cleaned,
    };
  }
}
