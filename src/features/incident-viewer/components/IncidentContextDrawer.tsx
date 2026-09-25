import { Clock, ExternalLink, Globe, Hash, ShieldAlert, Terminal, X } from "lucide-react";

import { SafeUrlValidator } from "@core/pipeline/safe-url-validator";
import {
  Drawer,
  DrawerClose,
  DrawerContent,
  DrawerDescription,
  DrawerHeader,
  DrawerTitle,
} from "@shared/components/ui/drawer";
import { useTranslation } from "@shared/locales";
import { SafeLogViewer } from "@features/incident-viewer/components/SafeLogViewer";
import { useIncidentDrawer } from "@features/incident-viewer/hooks/useIncidentDrawer";
import { getDrawerSeverityBadgeClass } from "@features/incident-viewer/utils/badge";

import type { FC } from "react";
import type { IThreatAlert } from "@core/domain/types";

interface IIncidentContextDrawerProps {
  readonly alert: IThreatAlert | null;
  readonly onClose: () => void;
}

export const IncidentContextDrawer: FC<IIncidentContextDrawerProps> = ({ alert, onClose }) => {
  const t = useTranslation();
  const { isOpen, currentAlert, handleOpenChange, handleClose } = useIncidentDrawer(alert, onClose);

  if (!currentAlert) {
    return null;
  }

  const safeMitreUrl = SafeUrlValidator.getSafeHref(currentAlert.mitreRef.url);
  const contextKeys = Object.keys(currentAlert.context);
  const hasContext = contextKeys.length > 0;

  return (
    <Drawer open={isOpen} onOpenChange={handleOpenChange} direction="right">
      <DrawerContent className="border-border bg-card h-full border-l shadow-2xl backdrop-blur-md data-[vaul-drawer-direction=right]:w-full data-[vaul-drawer-direction=right]:max-w-lg">
        <DrawerHeader className="border-border flex flex-row items-center justify-between border-b p-5">
          <div className="flex items-center gap-2.5">
            <div className="border-destructive/50 bg-destructive/10 text-destructive rounded-lg border p-2">
              <ShieldAlert className="h-5 w-5" />
            </div>
            <div>
              <DrawerTitle className="text-foreground text-sm font-bold tracking-wide">
                {t.incidents.drawer.title}
              </DrawerTitle>
              <DrawerDescription className="text-muted-foreground font-mono text-xs">
                {t.incidents.drawer.idLabel(currentAlert.id)}
              </DrawerDescription>
            </div>
          </div>
          <DrawerClose asChild>
            <button
              type="button"
              onClick={handleClose}
              className="text-muted-foreground hover:bg-muted hover:text-foreground cursor-pointer rounded-lg p-1.5 transition-colors"
              aria-label={t.incidents.drawer.close}
            >
              <X className="h-5 w-5" />
            </button>
          </DrawerClose>
        </DrawerHeader>

        <div className="flex-1 space-y-6 overflow-y-auto p-6 font-sans">
          <div className="flex flex-wrap items-center gap-2">
            <span
              className={`rounded-md border px-2.5 py-1 font-mono text-xs font-bold uppercase ${getDrawerSeverityBadgeClass(
                currentAlert.severity,
              )}`}
            >
              {currentAlert.severity}
            </span>
            <span className="border-primary/40 bg-primary/10 text-primary rounded-md border px-2.5 py-1 font-mono text-xs">
              {currentAlert.category}
            </span>
            <span className="border-border bg-secondary text-secondary-foreground rounded-md border px-2.5 py-1 font-mono text-xs">
              {t.incidents.drawer.ruleLabel(currentAlert.ruleName)}
            </span>
          </div>

          <div className="border-border bg-background/80 rounded-xl border p-4">
            <div className="mb-2 flex items-center justify-between">
              <span className="text-muted-foreground font-mono text-xs tracking-wider uppercase">
                {t.incidents.drawer.mitreMatrixMapping}
              </span>
              {safeMitreUrl ? (
                <a
                  href={safeMitreUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="text-primary flex items-center gap-1 font-mono text-xs hover:underline"
                >
                  {currentAlert.mitreRef.techniqueId} <ExternalLink className="h-3 w-3" />
                </a>
              ) : (
                <span className="text-primary flex items-center gap-1 font-mono text-xs">
                  {currentAlert.mitreRef.techniqueId}
                </span>
              )}
            </div>
            <div className="text-foreground text-sm font-semibold">
              {currentAlert.mitreRef.techniqueName}
            </div>
            <div className="text-muted-foreground mt-1 text-xs">
              {t.incidents.drawer.tacticLabel}{" "}
              <span className="text-primary font-mono">{currentAlert.mitreRef.tactic}</span>
            </div>
          </div>

          {currentAlert.matchedPatterns.length > 0 && (
            <div>
              <h4 className="text-muted-foreground mb-2 flex items-center gap-1.5 text-xs font-semibold tracking-wider uppercase">
                <Hash className="text-primary h-3.5 w-3.5" />
                {t.incidents.drawer.signaturesDetected}
              </h4>
              <div className="flex flex-wrap gap-1.5">
                {currentAlert.matchedPatterns.map((pat) => (
                  <span
                    key={`${currentAlert.id}-${pat}`}
                    className="border-destructive/40 bg-destructive/10 text-destructive rounded border px-2.5 py-1 font-mono text-xs"
                  >
                    {pat}
                  </span>
                ))}
              </div>
            </div>
          )}

          <div>
            <h4 className="text-muted-foreground mb-2 flex items-center gap-1.5 text-xs font-semibold tracking-wider uppercase">
              <Terminal className="text-primary h-3.5 w-3.5" />
              {t.incidents.drawer.normalizedRawLog}
            </h4>
            <SafeLogViewer rawLine={currentAlert.sourceEntry.rawLine} />
          </div>

          <div>
            <h4 className="text-muted-foreground mb-2 flex items-center gap-1.5 text-xs font-semibold tracking-wider uppercase">
              <Globe className="text-primary h-3.5 w-3.5" />
              {t.incidents.drawer.extractedAttributes}
            </h4>
            <dl className="border-border bg-background/60 grid grid-cols-2 gap-2 rounded-lg border p-3 font-mono text-xs">
              <div>
                <dt className="text-muted-foreground">{t.incidents.drawer.attributeSourceIP}</dt>
                <dd className="text-foreground font-semibold">
                  {currentAlert.sourceEntry.clientIp ?? t.common.notApplicable}
                </dd>
              </div>
              <div>
                <dt className="text-muted-foreground">{t.incidents.drawer.attributeStatus}</dt>
                <dd className="text-foreground font-semibold">
                  {currentAlert.sourceEntry.statusCode ?? t.common.notApplicable}
                </dd>
              </div>
              <div>
                <dt className="text-muted-foreground">{t.incidents.drawer.attributeMethodPath}</dt>
                <dd className="text-foreground truncate">
                  {currentAlert.sourceEntry.method ?? ""}{" "}
                  {currentAlert.sourceEntry.path ?? t.common.notApplicable}
                </dd>
              </div>
              <div>
                <dt className="text-muted-foreground">{t.incidents.drawer.attributeLogFormat}</dt>
                <dd className="text-foreground">{currentAlert.sourceEntry.format}</dd>
              </div>
            </dl>
          </div>

          {hasContext && (
            <div>
              <h4 className="text-muted-foreground mb-2 flex items-center gap-1.5 text-xs font-semibold tracking-wider uppercase">
                <Clock className="text-primary h-3.5 w-3.5" />
                {t.incidents.drawer.statefulContext}
              </h4>
              <div className="border-border bg-background/60 space-y-1 rounded-lg border p-3 font-mono text-xs">
                {contextKeys.map((key) => (
                  <div key={key} className="flex justify-between">
                    <span className="text-muted-foreground">{key}:</span>
                    <span className="text-foreground font-semibold">
                      {currentAlert.context[key]}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </DrawerContent>
    </Drawer>
  );
};
