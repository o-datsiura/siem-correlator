import { useMemo } from "react";

import { SafeUrlValidator } from "@core/pipeline/safe-url-validator";

import type { FC } from "react";
import type { IUrlToken } from "@core/pipeline/safe-url-validator";

interface ISafeLogViewerProps {
  readonly rawLine: string;
}

export const SafeLogViewer: FC<ISafeLogViewerProps> = ({ rawLine }) => {
  const tokens = useMemo<readonly IUrlToken[]>(() => {
    return SafeUrlValidator.tokenizeLogLine(rawLine);
  }, [rawLine]);

  return (
    <div className="border-border bg-background text-foreground rounded-lg border p-3 font-mono text-xs leading-relaxed break-all whitespace-pre-wrap select-all">
      {tokens.map((token, index) => {
        const key = `token-${index}-${token.text}`;

        if (token.isLink && token.href) {
          return (
            <a
              key={key}
              href={token.href}
              target="_blank"
              rel="noreferrer"
              className="text-primary hover:underline"
            >
              {token.text}
            </a>
          );
        }

        return <span key={key}>{token.text}</span>;
      })}
    </div>
  );
};
