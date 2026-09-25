import { AbstractLogHandler } from "@core/pipeline/handler";

import type { RawLogInput } from "@core/domain/types";

const MAX_LINE_LENGTH = 8192;

export class RedosGuardHandler extends AbstractLogHandler {
  protected process(input: RawLogInput): RawLogInput {
    if (input.line.length <= MAX_LINE_LENGTH) {
      return input;
    }

    return {
      ...input,
      line: input.line.slice(0, MAX_LINE_LENGTH),
    };
  }
}
