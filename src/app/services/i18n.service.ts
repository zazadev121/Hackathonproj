import { Injectable, signal } from '@angular/core';
import { Lang, TRANSLATIONS, TranslationKey } from '../i18n/translations';

const STORAGE_KEY = 'teachback-lang';

@Injectable({ providedIn: 'root' })
export class I18nService {
  readonly lang = signal<Lang>(this.readStored());

  constructor() {
    this.apply(this.lang());
  }

  setLang(lang: Lang): void {
    this.lang.set(lang);
    localStorage.setItem(STORAGE_KEY, lang);
    this.apply(lang);
  }

  t(key: TranslationKey, params?: Record<string, string | number>): string {
    const table = TRANSLATIONS[this.lang()];
    let text: string = table[key] ?? TRANSLATIONS.en[key] ?? key;
    if (params) {
      for (const [k, v] of Object.entries(params)) {
        text = text.replaceAll(`{{${k}}}`, String(v));
      }
    }
    return text;
  }

  exampleTopics(): string[] {
    return [
      this.t('examples.englishTenses'),
      this.t('examples.quadratic'),
      this.t('examples.wwii'),
    ];
  }

  private readStored(): Lang {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored === 'en' || stored === 'ka') return stored;
    return 'en';
  }

  private apply(lang: Lang): void {
    document.documentElement.lang = lang === 'ka' ? 'ka' : 'en';
  }
}
