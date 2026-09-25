export const NAVIGATION_TAB = {
  INCIDENTS: "incidents",
  INGEST: "ingest",
} as const;

export type NavigationTab = (typeof NAVIGATION_TAB)[keyof typeof NAVIGATION_TAB];
