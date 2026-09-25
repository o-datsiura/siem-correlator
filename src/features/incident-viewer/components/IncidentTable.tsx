import { Filter, Search, ShieldAlert } from "lucide-react";

import { useTranslation } from "@shared/locales";
import { FILTER_SEVERITY } from "@features/incident-viewer/constants/filters";
import { useIncidentFilter } from "@features/incident-viewer/hooks/useIncidentFilter";
import { getSeverityBadgeClass } from "@features/incident-viewer/utils/badge";

import type { FC } from "react";
import type { IThreatAlert } from "@core/domain/types";

interface IIncidentTableProps {
  readonly alerts: readonly IThreatAlert[];
  readonly onSelectAlert: (alert: IThreatAlert) => void;
  readonly selectedAlertId?: string;
}

export const IncidentTable: FC<IIncidentTableProps> = ({
  alerts,
  onSelectAlert,
  selectedAlertId,
}) => {
  const t = useTranslation();
  const { searchTerm, severityFilter, filteredAlerts, handleSearchChange, handleSeverityChange } =
    useIncidentFilter(alerts);

  const createAlertSelectHandler = (alert: IThreatAlert) => (): void => {
    onSelectAlert(alert);
  };

  return (
    <div className="border-border bg-card/60 flex flex-col overflow-hidden rounded-2xl border">
      <div className="border-border bg-muted/40 flex flex-wrap items-center justify-between gap-3 border-b p-4">
        <div className="flex min-w-48 flex-1 items-center gap-2">
          <div className="relative w-full max-w-sm">
            <Search className="text-muted-foreground absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2" />
            <input
              type="text"
              value={searchTerm}
              onChange={handleSearchChange}
              placeholder={t.incidents.searchPlaceholder}
              className="border-input bg-background text-foreground placeholder:text-muted-foreground focus:border-ring w-full rounded-lg border py-1.5 pr-3 pl-9 font-mono text-xs focus:outline-none"
            />
          </div>
        </div>

        <div className="flex items-center gap-2">
          <Filter className="text-muted-foreground h-3.5 w-3.5" />
          <select
            value={severityFilter}
            onChange={handleSeverityChange}
            className="border-input bg-background text-foreground focus:border-ring cursor-pointer rounded-lg border px-2.5 py-1.5 font-mono text-xs focus:outline-none"
          >
            <option value={FILTER_SEVERITY.ALL}>{t.incidents.allSeverities}</option>
            <option value={FILTER_SEVERITY.CRITICAL}>{FILTER_SEVERITY.CRITICAL}</option>
            <option value={FILTER_SEVERITY.HIGH}>{FILTER_SEVERITY.HIGH}</option>
            <option value={FILTER_SEVERITY.MEDIUM}>{FILTER_SEVERITY.MEDIUM}</option>
            <option value={FILTER_SEVERITY.LOW}>{FILTER_SEVERITY.LOW}</option>
            <option value={FILTER_SEVERITY.INFO}>{FILTER_SEVERITY.INFO}</option>
          </select>
          <span className="text-muted-foreground ml-2 font-mono text-xs">
            {t.incidents.incidentsCount(filteredAlerts.length, alerts.length)}
          </span>
        </div>
      </div>

      <div className="max-h-128 flex-1 overflow-x-auto overflow-y-auto">
        {filteredAlerts.length === 0 ? (
          <div className="text-muted-foreground flex flex-col items-center justify-center p-12 text-center">
            <ShieldAlert className="mb-2 h-10 w-10 opacity-30" />
            <p className="text-muted-foreground text-sm font-semibold">{t.incidents.emptyTitle}</p>
            <p className="text-muted-foreground mt-1 text-xs">{t.incidents.emptyDesc}</p>
          </div>
        ) : (
          <table className="w-full border-collapse text-left text-xs">
            <thead className="border-border bg-muted/80 text-muted-foreground sticky top-0 z-10 border-b font-mono text-xs font-semibold uppercase">
              <tr>
                <th className="px-4 py-2.5">{t.incidents.tableHeaders.timestamp}</th>
                <th className="px-4 py-2.5">{t.incidents.tableHeaders.severity}</th>
                <th className="px-4 py-2.5">{t.incidents.tableHeaders.ruleThreat}</th>
                <th className="px-4 py-2.5">{t.incidents.tableHeaders.sourceIP}</th>
                <th className="px-4 py-2.5">{t.incidents.tableHeaders.mitreTechnique}</th>
                <th className="px-4 py-2.5">{t.incidents.tableHeaders.payloadSnippet}</th>
              </tr>
            </thead>
            <tbody className="divide-border/60 divide-y font-sans">
              {filteredAlerts.map((alert) => {
                const isSelected = selectedAlertId === alert.id;
                const dateStr = new Date(alert.timestamp).toLocaleTimeString();

                return (
                  <tr
                    key={alert.id}
                    onClick={createAlertSelectHandler(alert)}
                    className={`cursor-pointer transition-colors ${
                      isSelected ? "border-l-primary bg-primary/10 border-l-2" : "hover:bg-muted/50"
                    }`}
                  >
                    <td className="text-muted-foreground px-4 py-2.5 font-mono whitespace-nowrap">
                      {dateStr}
                    </td>
                    <td className="px-4 py-2.5 whitespace-nowrap">
                      <span
                        className={`rounded border px-2 py-0.5 font-mono text-xs font-bold uppercase ${getSeverityBadgeClass(
                          alert.severity,
                        )}`}
                      >
                        {alert.severity}
                      </span>
                    </td>
                    <td className="text-foreground px-4 py-2.5 font-medium">
                      <div>{alert.ruleName}</div>
                      <div className="text-muted-foreground font-mono text-xs">
                        {alert.category}
                      </div>
                    </td>
                    <td className="text-foreground px-4 py-2.5 font-mono whitespace-nowrap">
                      {alert.sourceEntry.clientIp ?? t.common.notApplicable}
                    </td>
                    <td className="text-primary px-4 py-2.5 font-mono whitespace-nowrap">
                      <div className="flex items-center gap-1">
                        <span>{alert.mitreRef.techniqueId}</span>
                        <span className="text-muted-foreground max-w-28 truncate text-xs">
                          ({alert.mitreRef.techniqueName})
                        </span>
                      </div>
                    </td>
                    <td className="text-muted-foreground max-w-xs truncate px-4 py-2.5 font-mono">
                      {alert.sourceEntry.rawLine}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
};
