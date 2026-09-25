import { useCallback } from "react";
import { Send, ShieldAlert, Trash2 } from "lucide-react";

import { useTranslation } from "@shared/locales";
import { FileDropZone } from "@features/log-ingestion/components/FileDropZone";
import { PresetSelector } from "@features/log-ingestion/components/PresetSelector";
import { INGESTION_SOURCE } from "@features/log-ingestion/constants/presets";
import { useManualIngestion } from "@features/log-ingestion/hooks/useManualIngestion";

import type { FC } from "react";

interface ILogIngestionPanelProps {
  readonly onIngest: (lines: string[], sourceId: string) => void;
  readonly isReady: boolean;
}

export const LogIngestionPanel: FC<ILogIngestionPanelProps> = ({ onIngest, isReady }) => {
  const t = useTranslation();
  const {
    manualText,
    activeLineCount,
    handleManualTextChange,
    handleClearManualText,
    handleManualIngest,
  } = useManualIngestion(onIngest);

  const handleFileLines = useCallback(
    (lines: string[], fileName: string): void => {
      onIngest(lines, `${INGESTION_SOURCE.FILE_PREFIX}${fileName}`);
    },
    [onIngest],
  );

  return (
    <div className="space-y-6">
      <section className="border-border bg-card/60 rounded-2xl border p-5">
        <div className="mb-4">
          <h2 className="text-card-foreground flex items-center gap-2 text-sm font-bold tracking-wider uppercase">
            <ShieldAlert className="text-primary h-4 w-4" />
            {t.ingestion.attackScenariosTitle}
          </h2>
          <p className="text-muted-foreground text-xs">{t.ingestion.attackScenariosDesc}</p>
        </div>
        <PresetSelector onSelectPreset={onIngest} disabled={!isReady} />
      </section>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <section className="border-border bg-card/60 flex flex-col rounded-2xl border p-5">
          <h3 className="text-card-foreground mb-2 text-sm font-semibold">
            {t.ingestion.dropZoneTitle}
          </h3>
          <p className="text-muted-foreground mb-4 text-xs">{t.ingestion.dropZoneDesc}</p>
          <div className="min-h-40 flex-1">
            <FileDropZone onFileLoaded={handleFileLines} disabled={!isReady} />
          </div>
        </section>

        <section className="border-border bg-card/60 flex flex-col rounded-2xl border p-5">
          <div className="mb-2 flex items-center justify-between">
            <h3 className="text-card-foreground text-sm font-semibold">
              {t.ingestion.rawStreamTitle}
            </h3>
            <span className="text-muted-foreground font-mono text-xs">
              {t.ingestion.rawStreamLinesCount(activeLineCount)}
            </span>
          </div>
          <p className="text-muted-foreground mb-3 text-xs">{t.ingestion.rawStreamDesc}</p>
          <textarea
            value={manualText}
            onChange={handleManualTextChange}
            placeholder={t.ingestion.rawStreamPlaceholder}
            className="border-input bg-background/80 text-foreground placeholder:text-muted-foreground focus:border-ring min-h-32 w-full flex-1 resize-none rounded-lg border p-3 font-mono text-xs focus:outline-none"
          />
          <div className="mt-3 flex items-center justify-end gap-2">
            <button
              onClick={handleClearManualText}
              disabled={!manualText}
              className="text-muted-foreground hover:text-foreground flex cursor-pointer items-center gap-1.5 px-3 py-1.5 text-xs disabled:opacity-30"
            >
              <Trash2 className="h-3.5 w-3.5" /> {t.common.clear}
            </button>
            <button
              onClick={handleManualIngest}
              disabled={!manualText.trim() || !isReady}
              className="bg-primary text-primary-foreground hover:bg-primary/90 flex cursor-pointer items-center gap-1.5 rounded-lg px-4 py-1.5 text-xs font-semibold shadow transition-colors disabled:opacity-50"
            >
              <Send className="h-3.5 w-3.5" /> {t.ingestion.ingestButton}
            </button>
          </div>
        </section>
      </div>
    </div>
  );
};
