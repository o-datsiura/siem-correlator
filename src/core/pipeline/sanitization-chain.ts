import { AnsiSanitizerHandler } from "@core/pipeline/ansi-sanitizer-handler";
import { FormatRouterHandler } from "@core/pipeline/format-router";
import { RedosGuardHandler } from "@core/pipeline/redos-guard-handler";
import { XssShieldHandler } from "@core/pipeline/xss-shield-handler";

import type { ILogEntry, RawLogInput } from "@core/domain/types";

export class SanitizationChain {
  private readonly ansiSanitizer: AnsiSanitizerHandler;
  private readonly xssShield: XssShieldHandler;
  private readonly redosGuard: RedosGuardHandler;
  private readonly formatRouter: FormatRouterHandler;

  constructor() {
    this.ansiSanitizer = new AnsiSanitizerHandler();
    this.xssShield = new XssShieldHandler();
    this.redosGuard = new RedosGuardHandler();
    this.formatRouter = new FormatRouterHandler();

    this.ansiSanitizer.setNext(this.xssShield);
    this.xssShield.setNext(this.redosGuard);
  }

  process(rawLine: string, lineNumber: number, sourceId: string): ILogEntry | null {
    const input: RawLogInput = {
      line: rawLine,
      lineNumber,
      sourceId,
    };

    const sanitized = this.ansiSanitizer.handle(input);
    if (sanitized === null) {
      return null;
    }

    return this.formatRouter.extractEntry(sanitized);
  }
}
