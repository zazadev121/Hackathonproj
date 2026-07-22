import { Component, inject } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';
import { Lang } from './i18n/translations';
import { TranslatePipe } from './pipes/translate.pipe';
import { I18nService } from './services/i18n.service';
import { ThemeService } from './services/theme.service';

@Component({
  selector: 'app-root',
  imports: [RouterOutlet, RouterLink, RouterLinkActive, TranslatePipe, FormsModule],
  templateUrl: './app.html',
  styleUrl: './app.css',
})
export class App {
  readonly theme = inject(ThemeService);
  readonly i18n = inject(I18nService);

  setLang(lang: Lang): void {
    this.i18n.setLang(lang);
  }
}
