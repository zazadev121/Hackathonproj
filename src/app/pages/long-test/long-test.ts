import { Component, computed, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import {
  LongTestAnswer,
  LongTestGradeResponse,
  LongTestQuestion,
  LongTestScreen,
} from '../../models/test.models';
import { AiService } from '../../services/ai.service';
import { LearningStorageService } from '../../services/learning-storage.service';

@Component({
  selector: 'app-long-test',
  imports: [FormsModule, RouterLink],
  templateUrl: './long-test.html',
  styleUrl: './long-test.css',
})
export class LongTest {
  private readonly ai = inject(AiService);
  private readonly storage = inject(LearningStorageService);

  readonly screen = signal<LongTestScreen>('topic');
  readonly topic = signal('');
  readonly questions = signal<LongTestQuestion[]>([]);
  readonly answers = signal<Map<number, number>>(new Map());
  readonly result = signal<LongTestGradeResponse | null>(null);

  readonly loading = signal(false);
  readonly error = signal<string | null>(null);

  readonly canStart = computed(() => this.topic().trim().length > 0 && !this.loading());
  readonly allAnswered = computed(() => {
    const qs = this.questions();
    const ans = this.answers();
    return qs.length > 0 && qs.every((q) => ans.has(q.id));
  });

  selectAnswer(questionId: number, optionIndex: number): void {
    const next = new Map(this.answers());
    next.set(questionId, optionIndex);
    this.answers.set(next);
  }

  isSelected(questionId: number, optionIndex: number): boolean {
    return this.answers().get(questionId) === optionIndex;
  }

  async startTest(): Promise<void> {
    if (!this.canStart()) return;
    this.loading.set(true);
    this.error.set(null);
    try {
      const qs = await this.ai.generateLongTest(this.topic().trim());
      this.questions.set(qs);
      this.answers.set(new Map());
      this.screen.set('questions');
    } catch (err) {
      this.error.set(err instanceof Error ? err.message : 'Failed to generate test.');
    } finally {
      this.loading.set(false);
    }
  }

  async submitTest(): Promise<void> {
    if (!this.allAnswered()) return;
    this.loading.set(true);
    this.error.set(null);
    try {
      const answerList: LongTestAnswer[] = [...this.answers()].map(([questionId, selectedIndex]) => ({
        questionId,
        selectedIndex,
      }));
      const graded = await this.ai.gradeLongTest(this.topic().trim(), this.questions(), answerList);
      this.result.set(graded);
      this.storage.saveLongTestScore(this.topic().trim(), graded.score, graded.letter_grade);
      this.screen.set('result');
    } catch (err) {
      this.error.set(err instanceof Error ? err.message : 'Failed to grade test.');
    } finally {
      this.loading.set(false);
    }
  }

  reset(): void {
    this.screen.set('topic');
    this.topic.set('');
    this.questions.set([]);
    this.answers.set(new Map());
    this.result.set(null);
    this.error.set(null);
  }

  gradeClass(letter: string): string {
    if (letter.startsWith('A')) return 'grade-a';
    if (letter.startsWith('B')) return 'grade-b';
    if (letter.startsWith('C')) return 'grade-c';
    if (letter.startsWith('D')) return 'grade-d';
    return 'grade-f';
  }
}
