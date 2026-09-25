import { useCallback, useMemo, useState } from "react";

import { FILTER_SEVERITY } from "@features/incident-viewer/constants/filters";

import type { ChangeEvent } from "react";
import type { IThreatAlert } from "@core/domain/types";
import type { FilterSeverity } from "@features/incident-viewer/constants/filters";

export interface IUseIncidentFilterReturn {
  readonly searchTerm: string;
  readonly severityFilter: FilterSeverity;
  readonly filteredAlerts: readonly IThreatAlert[];
  readonly handleSearchChange: (e: ChangeEvent<HTMLInputElement>) => void;
  readonly handleSeverityChange: (e: ChangeEvent<HTMLSelectElement>) => void;
}

export const useIncidentFilter = (alerts: readonly IThreatAlert[]): IUseIncidentFilterReturn => {
  const [searchTerm, setSearchTerm] = useState("");
  const [severityFilter, setSeverityFilter] = useState<FilterSeverity>(FILTER_SEVERITY.ALL);

  const handleSearchChange = useCallback((e: ChangeEvent<HTMLInputElement>): void => {
    setSearchTerm(e.target.value);
  }, []);

  const handleSeverityChange = useCallback((e: ChangeEvent<HTMLSelectElement>): void => {
    const nextSeverity = e.target.value as FilterSeverity;
    setSeverityFilter(nextSeverity);
  }, []);

  const filteredAlerts = useMemo(() => {
    const normalizedSearch = searchTerm.toLowerCase();

    return alerts.filter((alert) => {
      const matchesSearch =
        alert.ruleName.toLowerCase().includes(normalizedSearch) ||
        (alert.sourceEntry.clientIp && alert.sourceEntry.clientIp.includes(searchTerm)) ||
        alert.sourceEntry.rawLine.toLowerCase().includes(normalizedSearch) ||
        alert.mitreRef.techniqueId.toLowerCase().includes(normalizedSearch);

      const matchesSeverity =
        severityFilter === FILTER_SEVERITY.ALL || alert.severity === severityFilter;

      return matchesSearch && matchesSeverity;
    });
  }, [alerts, searchTerm, severityFilter]);

  return {
    searchTerm,
    severityFilter,
    filteredAlerts,
    handleSearchChange,
    handleSeverityChange,
  };
};
