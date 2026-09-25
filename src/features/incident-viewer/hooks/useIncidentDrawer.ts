import { useCallback, useState } from "react";

import type { IThreatAlert } from "@core/domain/types";

export interface IUseIncidentDrawerReturn {
  readonly isOpen: boolean;
  readonly currentAlert: IThreatAlert | null;
  readonly handleOpenChange: (open: boolean) => void;
  readonly handleClose: () => void;
}

export const useIncidentDrawer = (
  alert: IThreatAlert | null,
  onClose: () => void,
): IUseIncidentDrawerReturn => {
  const [cachedAlert, setCachedAlert] = useState<IThreatAlert | null>(alert);

  if (alert !== null && alert !== cachedAlert) {
    setCachedAlert(alert);
  }

  const handleOpenChange = useCallback(
    (open: boolean): void => {
      if (!open) {
        onClose();
      }
    },
    [onClose],
  );

  const handleClose = useCallback((): void => {
    onClose();
  }, [onClose]);

  const isOpen = Boolean(alert);
  const currentAlert = alert ?? cachedAlert;

  return {
    isOpen,
    currentAlert,
    handleOpenChange,
    handleClose,
  };
};
