import { useCallback, useState } from "react";

import type { IThreatAlert } from "@core/domain/types";

export interface IUseIncidentDashboardReturn {
  readonly selectedAlert: IThreatAlert | null;
  readonly handleAlertSelect: (alert: IThreatAlert) => void;
  readonly handleCloseDrawer: () => void;
}

export const useIncidentDashboard = (): IUseIncidentDashboardReturn => {
  const [selectedAlert, setSelectedAlert] = useState<IThreatAlert | null>(null);

  const handleAlertSelect = useCallback((alert: IThreatAlert): void => {
    setSelectedAlert(alert);
  }, []);

  const handleCloseDrawer = useCallback((): void => {
    setSelectedAlert(null);
  }, []);

  return {
    selectedAlert,
    handleAlertSelect,
    handleCloseDrawer,
  };
};
