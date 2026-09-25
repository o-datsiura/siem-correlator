import type { MitreTactic } from "@core/domain/enums";

export interface ITechniqueCell {
  readonly id: string;
  readonly name: string;
  readonly tactic: MitreTactic;
  readonly url: string;
}
