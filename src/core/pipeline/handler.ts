import type { RawLogInput } from "@core/domain/types";

export abstract class AbstractLogHandler {
  private nextHandler: AbstractLogHandler | null = null;

  setNext(handler: AbstractLogHandler): AbstractLogHandler {
    this.nextHandler = handler;
    return handler;
  }

  handle(input: RawLogInput): RawLogInput | null {
    const result = this.process(input);
    if (result === null) {
      return null;
    }
    if (this.nextHandler) {
      return this.nextHandler.handle(result);
    }
    return result;
  }

  protected abstract process(input: RawLogInput): RawLogInput | null;
}
