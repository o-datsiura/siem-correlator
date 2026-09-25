import { PRESET_ID } from "@features/log-ingestion/constants/presets";

import type { PresetId } from "@features/log-ingestion/constants/presets";

export { PRESET_ID } from "@features/log-ingestion/constants/presets";
export type { PresetId } from "@features/log-ingestion/constants/presets";

interface PresetDefinition {
  readonly id: PresetId;
  readonly name: string;
  readonly description: string;
  readonly filename: string;
  readonly icon: string;
  readonly threatTypes: readonly string[];
}

export const PRESETS: readonly PresetDefinition[] = [
  {
    id: PRESET_ID.SSH_BRUTE_FORCE,
    name: "SSH Brute Force",
    description:
      "37 auth log entries with multiple brute force attacks from different IPs targeting SSH services",
    filename: "ssh-brute-force.log",
    icon: "🔐",
    threatTypes: ["Brute Force", "Credential Access"],
  },
  {
    id: PRESET_ID.WEB_ATTACK,
    name: "Web Application Attack",
    description:
      "31 Nginx access logs with SQLi, directory traversal, scanner probes, and shell injection attempts",
    filename: "web-attack.log",
    icon: "🌐",
    threatTypes: ["SQLi", "Traversal", "Scanner", "Shell Injection"],
  },
  {
    id: PRESET_ID.MIXED_TRAFFIC,
    name: "Mixed Traffic",
    description:
      "32 mixed Syslog and Nginx entries combining normal operations with interspersed attack patterns",
    filename: "mixed-traffic.log",
    icon: "📊",
    threatTypes: ["Mixed Threats"],
  },
];

export async function loadPreset(filename: string): Promise<string[]> {
  const response = await fetch(`/presets/${filename}`);

  if (!response.ok) {
    throw new Error(`Failed to load preset: ${filename}`);
  }

  const text = await response.text();

  return text.split("\n").filter((line) => line.trim().length > 0);
}
