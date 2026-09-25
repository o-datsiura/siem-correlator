import { Globe, Shield, Terminal } from "lucide-react";

import { PRESET_ID } from "@features/log-ingestion/constants/presets";

import type { ReactNode } from "react";

export const getPresetIcon = (id: string): ReactNode => {
  switch (id) {
    case PRESET_ID.SSH_BRUTE_FORCE:
      return <Terminal className="text-primary h-5 w-5" />;
    case PRESET_ID.WEB_ATTACK:
      return <Globe className="text-destructive h-5 w-5" />;
    default:
      return <Shield className="text-primary h-5 w-5" />;
  }
};
