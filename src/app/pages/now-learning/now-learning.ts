import { Component, computed, inject, OnInit, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { LearningTopic } from '../../models/learning.models';
import { I18nService } from '../../services/i18n.service';
import { LearningStorageService } from '../../services/learning-storage.service';
import { TranslatePipe } from '../../pipes/translate.pipe';

@Component({
  selector: 'app-now-learning',
  imports: [FormsModule, TranslatePipe],
  templateUrl: './now-learning.html',
  styleUrl: './now-learning.css',
})
export class NowLearning implements OnInit {
  private readonly storage = inject(LearningStorageService);
  private readonly router = inject(Router);
  private readonly i18n = inject(I18nService);

  readonly topics = signal<LearningTopic[]>([]);
  readonly showAddForm = signal(false);
  readonly newTopic = signal('');

  readonly canAddTopic = computed(() => this.newTopic().trim().length > 0);

  ngOnInit(): void {
    this.refresh();
  }

  refresh(): void {
    this.topics.set(this.storage.getTopics());
  }

  openAddForm(): void {
    this.showAddForm.set(true);
    this.newTopic.set('');
  }

  cancelAdd(): void {
    this.showAddForm.set(false);
    this.newTopic.set('');
  }

  addAndExplain(): void {
    const trimmed = this.newTopic().trim();
    if (!trimmed) return;

    this.storage.addTopic(trimmed);
    this.router.navigate(['/'], { queryParams: { topic: trimmed, from: 'learning' } });
  }

  continueTopic(topic: string): void {
    this.router.navigate(['/'], { queryParams: { topic, from: 'learning' } });
  }

  removeTopic(id: string, event: Event): void {
    event.stopPropagation();
    this.storage.removeTopic(id);
    this.refresh();
  }

  formatDate(ts: number): string {
    const locale = this.i18n.lang() === 'ka' ? 'ka-GE' : undefined;
    return new Date(ts).toLocaleDateString(locale, {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  }

  hasScore(item: LearningTopic): boolean {
    return item.scores.length > 0;
  }
}
