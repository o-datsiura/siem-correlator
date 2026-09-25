export const PRESET_ID = {
  SSH_BRUTE_FORCE: "ssh-brute-force",
  WEB_ATTACK: "web-attack",
  MIXED_TRAFFIC: "mixed-traffic",
} as const;

export type PresetId = (typeof PRESET_ID)[keyof typeof PRESET_ID];

export const INGESTION_SOURCE = {
  MANUAL_PASTE: "manual-paste",
  FILE_PREFIX: "file-",
  PRESET_PREFIX: "preset-",
} as const;

export type IngestionSource = (typeof INGESTION_SOURCE)[keyof typeof INGESTION_SOURCE];
