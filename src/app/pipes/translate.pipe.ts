import { Pipe, PipeTransform, inject } from '@angular/core';
import { TranslationKey } from '../i18n/translations';
import { I18nService } from '../services/i18n.service';

@Pipe({ name: 't', pure: false })
export class TranslatePipe implements PipeTransform {
  private readonly i18n = inject(I18nService);

  transform(key: TranslationKey, params?: Record<string, string | number>): string {
    this.i18n.lang();
    return this.i18n.t(key, params);
  }
}
