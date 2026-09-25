import { AbstractLogHandler } from "@core/pipeline/handler";

import type { RawLogInput } from "@core/domain/types";

const HTML_ENTITY_MAP: Readonly<Record<string, string>> = {
  "&": "&amp;",
  "<": "&lt;",
  ">": "&gt;",
  '"': "&quot;",
  "'": "&#x27;",
  "`": "&#x60;",
};

function escapeHtmlEntities(text: string): string {
  let result = "";
  for (let i = 0; i < text.length; i++) {
    const char = text[i]!;
    const entity = HTML_ENTITY_MAP[char];
    result += entity ?? char;
  }
  return result;
}

export class XssSanitizer {
  static escape(text: string): string {
    return escapeHtmlEntities(text);
  }
}

export class XssShieldHandler extends AbstractLogHandler {
  protected process(input: RawLogInput): RawLogInput {
    return {
      ...input,
      line: escapeHtmlEntities(input.line),
    };
  }
}
