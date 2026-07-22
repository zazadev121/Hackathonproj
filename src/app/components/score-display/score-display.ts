import { Component, computed, effect, inject, input, signal } from '@angular/core';
import { TranslationKey } from '../../i18n/translations';
import { I18nService } from '../../services/i18n.service';

@Component({
  selector: 'app-score-display',
  templateUrl: './score-display.html',
  styleUrl: './score-display.css',
})
export class ScoreDisplay {
  private readonly i18n = inject(I18nService);

  readonly score = input.required<number>();
  readonly labelKey = input<TranslationKey>('score.understanding');

  readonly displayScore = signal(0);
  readonly barWidth = signal(0);

  readonly label = computed(() => {
    this.i18n.lang();
    return this.i18n.t(this.labelKey());
  });

  constructor() {
    effect((onCleanup) => {
      this.i18n.lang();
      const target = Math.max(0, Math.min(100, this.score()));
      const duration = 1200;
      const start = performance.now();
      let frameId = 0;

      const animate = (now: number) => {
        const elapsed = now - start;
        const progress = Math.min(elapsed / duration, 1);
        const eased = 1 - Math.pow(1 - progress, 3);
        const current = Math.round(target * eased);
        this.displayScore.set(current);
        this.barWidth.set(current);
        if (progress < 1) {
          frameId = requestAnimationFrame(animate);
        }
      };

      this.displayScore.set(0);
      this.barWidth.set(0);
      frameId = requestAnimationFrame(animate);

      onCleanup(() => cancelAnimationFrame(frameId));
    });
  }
}
