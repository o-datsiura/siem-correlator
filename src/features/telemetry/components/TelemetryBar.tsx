import { Activity, Clock, Cpu, Layers, ShieldAlert } from "lucide-react";

import { ThemeToggle } from "@shared/components/ThemeToggle";
import { useTranslation } from "@shared/locales";
import { useTelemetryMetrics } from "@features/telemetry/hooks/useTelemetryMetrics";

import type { FC } from "react";
import type { ITelemetrySnapshot } from "@core/domain/types";

interface ITelemetryBarProps {
  readonly telemetry: ITelemetrySnapshot | null;
  readonly isReady: boolean;
  readonly alertCount: number;
}

export const TelemetryBar: FC<ITelemetryBarProps> = ({ telemetry, isReady, alertCount }) => {
  const t = useTranslation();
  const { eps, totalEvents, partitions, uptimeSeconds } = useTelemetryMetrics(telemetry);

  return (
    <header className="border-border bg-card/90 text-card-foreground sticky top-0 z-30 w-full border-b px-6 py-3 shadow-sm backdrop-blur">
      <div className="mx-auto flex max-w-7xl flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="border-primary/40 bg-primary/10 text-primary relative flex h-9 w-9 items-center justify-center rounded-lg border">
            <Activity className="h-5 w-5 animate-pulse" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-foreground flex items-center gap-1.5 text-base font-bold tracking-tight">
                {t.common.appTitle}
                <span className="border-primary/40 bg-primary/10 text-primary rounded border px-1.5 py-0.5 font-mono text-xs uppercase">
                  {t.common.engineVersion}
                </span>
              </h1>
            </div>
            <div className="text-muted-foreground flex items-center gap-1.5 text-xs">
              <span
                className={`inline-block h-2 w-2 rounded-full ${
                  isReady ? "bg-primary" : "bg-muted-foreground animate-ping"
                }`}
              />
              <span>{isReady ? t.telemetry.workerOnline : t.telemetry.workerInitializing}</span>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-6 font-mono text-sm">
          <div className="border-border bg-background/60 flex items-center gap-2.5 rounded-md border px-3.5 py-1.5">
            <Cpu className="text-primary h-4 w-4" />
            <div>
              <div className="text-muted-foreground text-xs tracking-wider uppercase">
                {t.telemetry.throughput}
              </div>
              <div className="text-primary font-bold">{t.telemetry.eps(eps)}</div>
            </div>
          </div>

          <div className="border-border bg-background/60 flex items-center gap-2.5 rounded-md border px-3.5 py-1.5">
            <Layers className="text-foreground h-4 w-4" />
            <div>
              <div className="text-muted-foreground text-xs tracking-wider uppercase">
                {t.telemetry.eventsIngested}
              </div>
              <div className="text-foreground font-bold">{totalEvents.toLocaleString()}</div>
            </div>
          </div>

          <div className="border-border bg-background/60 flex items-center gap-2.5 rounded-md border px-3.5 py-1.5">
            <ShieldAlert
              className={`h-4 w-4 ${
                alertCount > 0 ? "text-destructive animate-bounce" : "text-muted-foreground"
              }`}
            />
            <div>
              <div className="text-muted-foreground text-xs tracking-wider uppercase">
                {t.telemetry.activeThreats}
              </div>
              <div
                className={`font-bold ${alertCount > 0 ? "text-destructive" : "text-foreground"}`}
              >
                {alertCount.toLocaleString()}
              </div>
            </div>
          </div>

          <div className="border-border bg-background/60 hidden items-center gap-2.5 rounded-md border px-3.5 py-1.5 sm:flex">
            <Clock className="text-primary h-4 w-4" />
            <div>
              <div className="text-muted-foreground text-xs tracking-wider uppercase">
                {t.telemetry.partitionsUptime}
              </div>
              <div className="text-foreground font-bold">
                {t.telemetry.partitionsSummary(partitions, uptimeSeconds)}
              </div>
            </div>
          </div>

          <ThemeToggle />
        </div>
      </div>
    </header>
  );
};
