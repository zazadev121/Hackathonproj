import { Component, inject, OnInit, signal } from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import { LearningTopic } from '../../models/learning.models';
import { LearningStorageService } from '../../services/learning-storage.service';

@Component({
  selector: 'app-now-learning',
  imports: [RouterLink],
  templateUrl: './now-learning.html',
  styleUrl: './now-learning.css',
})
export class NowLearning implements OnInit {
  private readonly storage = inject(LearningStorageService);
  private readonly router = inject(Router);

  readonly topics = signal<LearningTopic[]>([]);

  ngOnInit(): void {
    this.refresh();
  }

  refresh(): void {
    this.topics.set(this.storage.getTopics());
  }

  continueTopic(topic: string): void {
    this.router.navigate(['/'], { queryParams: { topic } });
  }

  removeTopic(id: string, event: Event): void {
    event.stopPropagation();
    this.storage.removeTopic(id);
    this.refresh();
  }

  formatDate(ts: number): string {
    return new Date(ts).toLocaleDateString(undefined, {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  }
}
