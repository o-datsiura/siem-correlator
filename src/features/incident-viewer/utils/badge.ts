import { THREAT_SEVERITY } from "@core/domain/enums";

import type { ThreatSeverity } from "@core/domain/enums";

export const getSeverityBadgeClass = (severity: ThreatSeverity): string => {
  switch (severity) {
    case THREAT_SEVERITY.CRITICAL:
      return "bg-destructive text-card dark:text-card-foreground border-destructive";
    case THREAT_SEVERITY.HIGH:
      return "bg-destructive/80 text-card dark:text-card-foreground border-destructive/80";
    case THREAT_SEVERITY.MEDIUM:
      return "bg-chart-5 text-card border-border";
    case THREAT_SEVERITY.LOW:
      return "bg-muted text-muted-foreground border-border";
    default:
      return "bg-muted text-muted-foreground border-border";
  }
};

export const getDrawerSeverityBadgeClass = (severity: ThreatSeverity): string => {
  switch (severity) {
    case THREAT_SEVERITY.CRITICAL:
      return "bg-destructive text-destructive-foreground border-destructive";
    case THREAT_SEVERITY.HIGH:
      return "bg-destructive/80 text-destructive-foreground border-destructive/80";
    case THREAT_SEVERITY.MEDIUM:
      return "bg-secondary text-secondary-foreground border-border";
    case THREAT_SEVERITY.LOW:
      return "bg-muted text-muted-foreground border-border";
    default:
      return "bg-muted text-muted-foreground border-border";
  }
};
