import { useState } from "react";
import { FileCode2, Radio, Shield, Terminal } from "lucide-react";

import { NAVIGATION_TAB } from "@shared/constants/navigation";
import { useTranslation } from "@shared/locales";
import { IncidentDashboard } from "@features/incident-viewer";
import { LogIngestionPanel } from "@features/log-ingestion";
import { TelemetryBar } from "@features/telemetry";
import { useDetectionEngine } from "@features/threat-detection";

import type { NavigationTab } from "@shared/constants/navigation";

export const App = () => {
  const t = useTranslation();
  const { alerts, telemetry, isReady, error, ingestLines, clearAlerts } = useDetectionEngine();
  const [activeTab, setActiveTab] = useState<NavigationTab>(NAVIGATION_TAB.INCIDENTS);

  const createTabSelectHandler = (tab: NavigationTab) => (): void => {
    setActiveTab(tab);
  };

  return (
    <div className="bg-background text-foreground selection:bg-primary selection:text-primary-foreground flex min-h-screen flex-col font-sans">
      <TelemetryBar telemetry={telemetry} isReady={isReady} alertCount={alerts.length} />

      <main className="mx-auto w-full max-w-7xl flex-1 space-y-6 p-6">
        {error && (
          <div className="border-destructive/50 bg-destructive/10 text-destructive rounded-xl border p-4 font-mono text-xs">
            {t.errors.workerErrorPrefix(error)}
          </div>
        )}

        <div className="border-border flex items-center justify-between border-b pb-3">
          <nav className="flex items-center gap-2">
            <button
              onClick={createTabSelectHandler(NAVIGATION_TAB.INCIDENTS)}
              className={`flex cursor-pointer items-center gap-2 rounded-lg px-4 py-2 text-xs font-semibold transition-all ${
                activeTab === NAVIGATION_TAB.INCIDENTS
                  ? "border-primary/40 bg-primary/10 text-primary border"
                  : "text-muted-foreground hover:bg-muted hover:text-foreground"
              }`}
            >
              <Radio className="h-4 w-4" />
              {t.tabs.threatOverview}
              {alerts.length > 0 && (
                <span className="bg-destructive text-card dark:text-card-foreground rounded-full px-1.5 py-0.5 font-mono text-xs">
                  {alerts.length}
                </span>
              )}
            </button>

            <button
              onClick={createTabSelectHandler(NAVIGATION_TAB.INGEST)}
              className={`flex cursor-pointer items-center gap-2 rounded-lg px-4 py-2 text-xs font-semibold transition-all ${
                activeTab === NAVIGATION_TAB.INGEST
                  ? "border-primary/40 bg-primary/10 text-primary border"
                  : "text-muted-foreground hover:bg-muted hover:text-foreground"
              }`}
            >
              <Terminal className="h-4 w-4" />
              {t.tabs.logIngestion}
            </button>
          </nav>

          <div className="text-muted-foreground hidden items-center gap-2 font-mono text-xs md:flex">
            <Shield className="text-primary h-3.5 w-3.5" />
            {t.common.zeroDependencyDetection}
          </div>
        </div>

        {activeTab === NAVIGATION_TAB.INCIDENTS ? (
          <IncidentDashboard alerts={alerts} onClearAlerts={clearAlerts} />
        ) : (
          <LogIngestionPanel onIngest={ingestLines} isReady={isReady} />
        )}
      </main>

      <footer className="border-border bg-background text-muted-foreground mx-auto flex w-full max-w-7xl items-center justify-between border-t px-6 py-4 text-center font-mono text-xs">
        <div>{t.common.footerTitle}</div>
        <div className="flex items-center gap-1">
          <FileCode2 className="text-muted-foreground h-3.5 w-3.5" />
          {t.common.pureWorkerSandbox}
        </div>
      </footer>
    </div>
  );
};

export default App;
