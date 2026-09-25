import { ExternalLink, ShieldCheck } from "lucide-react";

import { SafeUrlValidator } from "@core/pipeline/safe-url-validator";
import { useTranslation } from "@shared/locales";
import { TACTICS_ORDER, TECHNIQUES } from "@features/incident-viewer/constants/mitre";
import { useMitreAttackGrid } from "@features/incident-viewer/hooks/useMitreAttackGrid";

import type { FC } from "react";
import type { IThreatAlert } from "@core/domain/types";

interface IMitreAttackGridProps {
  readonly alerts: readonly IThreatAlert[];
}

export const MitreAttackGrid: FC<IMitreAttackGridProps> = ({ alerts }) => {
  const t = useTranslation();
  const { hitCounts } = useMitreAttackGrid(alerts);

  return (
    <div className="border-border bg-card/60 rounded-2xl border p-5">
      <div className="mb-4 flex items-center justify-between">
        <div>
          <h2 className="text-card-foreground flex items-center gap-2 text-sm font-bold tracking-wider uppercase">
            <ShieldCheck className="text-primary h-4 w-4" />
            {t.mitre.matrixTitle}
          </h2>
          <p className="text-muted-foreground text-xs">{t.mitre.matrixDesc}</p>
        </div>
        <div className="border-primary/40 bg-primary/10 text-primary rounded border px-2.5 py-1 font-mono text-xs">
          {t.mitre.techniquesTriggered(hitCounts.size)}
        </div>
      </div>

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-5">
        {TACTICS_ORDER.map((tactic) => {
          const cells = TECHNIQUES.filter((cell) => cell.tactic === tactic);

          return (
            <div
              key={tactic}
              className="border-border/80 bg-background/60 flex flex-col rounded-xl border p-3"
            >
              <div className="border-border text-muted-foreground mb-2 border-b pb-2 font-mono text-xs font-bold tracking-wider uppercase">
                {tactic}
              </div>

              <div className="flex-1 space-y-2">
                {cells.map((tech) => {
                  const count = hitCounts.get(tech.id) ?? 0;
                  const isActive = count > 0;
                  const safeUrl = SafeUrlValidator.getSafeHref(tech.url);

                  return (
                    <div
                      key={tech.id}
                      className={`flex flex-col justify-between rounded-lg border p-2.5 text-xs transition-all ${
                        isActive
                          ? "border-destructive/50 bg-destructive/10"
                          : "border-border/60 bg-card/40 opacity-60"
                      }`}
                    >
                      <div className="mb-1 flex items-center justify-between">
                        <span className="text-primary font-mono text-xs font-bold">{tech.id}</span>
                        {isActive && (
                          <span className="border-destructive bg-destructive text-card dark:text-card-foreground animate-pulse rounded-full border px-1.5 font-mono text-xs">
                            {t.mitre.hitsCount(count)}
                          </span>
                        )}
                      </div>
                      <div className="text-foreground mb-2 text-xs leading-tight font-medium">
                        {tech.name}
                      </div>
                      {safeUrl ? (
                        <a
                          href={safeUrl}
                          target="_blank"
                          rel="noreferrer"
                          className="text-muted-foreground hover:text-primary mt-auto flex items-center gap-1 font-mono text-xs"
                        >
                          {t.mitre.docsLink} <ExternalLink className="h-2.5 w-2.5" />
                        </a>
                      ) : (
                        <span className="text-muted-foreground mt-auto flex items-center gap-1 font-mono text-xs">
                          {t.mitre.docsLink}
                        </span>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
