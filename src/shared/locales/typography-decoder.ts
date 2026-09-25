const ENTITY_MAP: readonly (readonly [RegExp, string])[] = [
  [/&amp;/g, "&"],
  [/&lt;/g, "<"],
  [/&gt;/g, ">"],
  [/&quot;/g, '"'],
  [/&apos;/g, "'"],
  [/&nbsp;/g, "\u00A0"],
  [/&hellip;/g, "\u2026"],
  [/&mdash;/g, "\u2014"],
  [/&ndash;/g, "\u2013"],
  [/&times;/g, "\u00D7"],
];

export const decodeTypography = (value: string): string => {
  let result = value;

  for (const [pattern, replacement] of ENTITY_MAP) {
    result = result.replace(pattern, replacement);
  }

  return result;
};

export const createDecodedLocale = <T>(obj: T): T => {
  if (typeof obj === "string") {
    return decodeTypography(obj) as unknown as T;
  }

  if (typeof obj === "function") {
    return ((...args: unknown[]) => {
      const res = (obj as (...a: unknown[]) => unknown)(...args);

      if (typeof res === "string") {
        return decodeTypography(res);
      }

      return res;
    }) as unknown as T;
  }

  if (typeof obj === "object" && obj !== null) {
    const entries = Object.entries(obj);
    const decoded: Record<string, unknown> = {};

    for (const [key, val] of entries) {
      decoded[key] = createDecodedLocale(val);
    }

    return decoded as unknown as T;
  }

  return obj;
};
