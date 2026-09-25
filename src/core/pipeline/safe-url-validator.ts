export interface IUrlToken {
  readonly text: string;
  readonly isLink: boolean;
  readonly href?: string;
}

const FORBIDDEN_PSEUDO_PROTOCOLS = new Set([
  "javascript:",
  "data:",
  "vbscript:",
  "file:",
  "blob:",
  "about:",
]);

const ALLOWED_PROTOCOLS = new Set(["http:", "https:"]);

const CONTROL_CHARS_AND_WHITESPACE_REGEX = /[\u0000-\u001F\u007F-\u009F\s]/g;

const FORBIDDEN_PSEUDO_PROTOCOL_REGEX = /^(?:javascript|data|vbscript|file|blob|about):/i;

const DOMAIN_CANDIDATE_REGEX =
  /^[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(?:\.[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)+(?::\d{1,5})?(?:\/[^\s"'<>|]*)?$/;

const LOG_URL_OR_DOMAIN_REGEX =
  /(?:(?:[a-zA-Z][a-zA-Z0-9+.-]*:)[^\s"'<>|]+|(?:[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?\.)+[a-zA-Z]{2,}(?::\d{1,5})?(?:\/[^\s"'<>|]*)?)/g;

function stripTrailingPunctuation(text: string): { cleanText: string; trailing: string } {
  let cleanText = text;
  let trailing = "";

  const trailingPunctuationMatch = cleanText.match(/[,.;:]+$/);

  if (trailingPunctuationMatch) {
    trailing = trailingPunctuationMatch[0] + trailing;
    cleanText = cleanText.slice(0, cleanText.length - trailingPunctuationMatch[0].length);
  }

  if (cleanText.endsWith(")") && !cleanText.includes("(")) {
    trailing = `)${trailing}`;
    cleanText = cleanText.slice(0, cleanText.length - 1);
  }

  return { cleanText, trailing };
}

export class SafeUrlValidator {
  static isSafeProtocol(candidate: string): boolean {
    if (!candidate || typeof candidate !== "string") {
      return false;
    }

    const stripped = candidate.replace(CONTROL_CHARS_AND_WHITESPACE_REGEX, "");

    if (FORBIDDEN_PSEUDO_PROTOCOL_REGEX.test(stripped)) {
      return false;
    }

    try {
      const parsed = new URL(stripped);

      if (FORBIDDEN_PSEUDO_PROTOCOLS.has(parsed.protocol.toLowerCase())) {
        return false;
      }

      return ALLOWED_PROTOCOLS.has(parsed.protocol.toLowerCase());
    } catch {
      return false;
    }
  }

  static getSafeHref(candidate: string): string | null {
    if (!candidate || typeof candidate !== "string") {
      return null;
    }

    const trimmed = candidate.trim();
    const stripped = trimmed.replace(CONTROL_CHARS_AND_WHITESPACE_REGEX, "");

    if (FORBIDDEN_PSEUDO_PROTOCOL_REGEX.test(stripped)) {
      return null;
    }

    if (this.isSafeProtocol(trimmed)) {
      return trimmed;
    }

    if (DOMAIN_CANDIDATE_REGEX.test(trimmed)) {
      const withHttps = `https://${trimmed}`;

      if (this.isSafeProtocol(withHttps)) {
        return withHttps;
      }
    }

    return null;
  }

  static tokenizeLogLine(line: string): readonly IUrlToken[] {
    if (!line) {
      return [{ text: "", isLink: false }];
    }

    const tokens: IUrlToken[] = [];
    let lastIndex = 0;
    const regex = new RegExp(LOG_URL_OR_DOMAIN_REGEX.source, "g");
    let match: RegExpExecArray | null = null;

    while ((match = regex.exec(line)) !== null) {
      const matchIndex = match.index;
      const matchedText = match[0];

      if (matchIndex > lastIndex) {
        tokens.push({
          text: line.slice(lastIndex, matchIndex),
          isLink: false,
        });
      }

      const { cleanText, trailing } = stripTrailingPunctuation(matchedText);
      const safeHref = this.getSafeHref(cleanText);

      if (safeHref === null) {
        tokens.push({
          text: cleanText,
          isLink: false,
        });
      } else {
        tokens.push({
          text: cleanText,
          isLink: true,
          href: safeHref,
        });
      }

      if (trailing.length > 0) {
        tokens.push({
          text: trailing,
          isLink: false,
        });
      }

      lastIndex = matchIndex + matchedText.length;
    }

    if (lastIndex < line.length) {
      tokens.push({
        text: line.slice(lastIndex),
        isLink: false,
      });
    }

    return tokens;
  }
}
