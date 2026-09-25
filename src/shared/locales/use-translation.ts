import { en } from "@shared/locales/en";
import { createDecodedLocale } from "@shared/locales/typography-decoder";

import type { ILocaleTranslations } from "@shared/locales/types";

const decodedEn = createDecodedLocale(en);

export const useTranslation = (): ILocaleTranslations => {
  return decodedEn;
};
