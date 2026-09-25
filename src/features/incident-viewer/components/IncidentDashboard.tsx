import { ShieldAlert, Trash2 } from "lucide-react";

import { useTranslation } from "@shared/locales";
import { IncidentContextDrawer } from "@features/incident-viewer/components/IncidentContextDrawer";
import { IncidentTable } from "@features/incident-viewer/components/IncidentTable";
import { MitreAttackGrid } from "@features/incident-viewer/components/MitreAttackGrid";
import { useIncidentDashboard } from "@features/incident-viewer/hooks/useIncidentDashboard";

import type { FC } from "react";
import type { IThreatAlert } from "@core/domain/types";

interface IIncidentDashboardProps {
  readonly alerts: readonly IThreatAlert[];
  readonly onClearAlerts: () => void;
}

export const IncidentDashboard: FC<IIncidentDashboardProps> = ({ alerts, onClearAlerts }) => {
  const t = useTranslation();
  const { selectedAlert, handleAlertSelect, handleCloseDrawer } = useIncidentDashboard();

  return (
    <div className="space-y-6">
      <MitreAttackGrid alerts={alerts} />

      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-foreground flex items-center gap-2 text-sm font-bold tracking-wider uppercase">
            <ShieldAlert className="text-destructive h-4 w-4" />
            {t.incidents.streamTitle}
          </h2>
          <p className="text-muted-foreground text-xs">{t.incidents.streamDesc}</p>
        </div>
        {alerts.length > 0 && (
          <button
            onClick={onClearAlerts}
            className="border-border bg-card text-muted-foreground hover:bg-muted hover:text-destructive flex cursor-pointer items-center gap-1.5 rounded-lg border px-3 py-1.5 text-xs transition-colors"
          >
            <Trash2 className="h-3.5 w-3.5" /> {t.incidents.clearAlerts}
          </button>
        )}
      </div>

      <IncidentTable
        alerts={alerts}
        onSelectAlert={handleAlertSelect}
        selectedAlertId={selectedAlert?.id}
      />

      <IncidentContextDrawer alert={selectedAlert} onClose={handleCloseDrawer} />
    </div>
  );
};
