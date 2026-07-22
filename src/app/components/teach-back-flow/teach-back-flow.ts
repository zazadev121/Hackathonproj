import { Component, computed, inject, OnInit, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute } from '@angular/router';
import {
  FinalResponse,
  FlowScreen,
  GradingResponse,
  PendingAction,
} from '../../models/ai.models';
import { AiService } from '../../services/ai.service';
import { I18nService } from '../../services/i18n.service';
import { LearningStorageService } from '../../services/learning-storage.service';
import { SolanaError, SolanaService } from '../../services/solana.service';
import { TranslatePipe } from '../../pipes/translate.pipe';
import { ScoreDisplay } from '../score-display/score-display';
import { MASTERY_SCORE_THRESHOLD } from '../../constants/mastery.constants';

const EXAMPLE_KEYS = ['examples.englishTenses', 'examples.quadratic', 'examples.wwii'] as const;

@Component({
  selector: 'app-teach-back-flow',
  imports: [FormsModule, ScoreDisplay, TranslatePipe],
  templateUrl: './teach-back-flow.html',
  styleUrl: './teach-back-flow.css',
})
export class TeachBackFlow implements OnInit {
  private readonly ai = inject(AiService);
  private readonly route = inject(ActivatedRoute);
  private readonly learningStorage = inject(LearningStorageService);
  readonly solana = inject(SolanaService);
  readonly i18n = inject(I18nService);

  readonly exampleKeys = EXAMPLE_KEYS;
  readonly masteryThreshold = MASTERY_SCORE_THRESHOLD;

  readonly screen = signal<FlowScreen>('topic');
  readonly topic = signal('');
  readonly explanation = signal('');
  readonly followUpAnswer = signal('');

  readonly grading = signal<GradingResponse | null>(null);
  readonly finalResult = signal<FinalResponse | null>(null);

  readonly loading = signal(false);
  readonly error = signal<string | null>(null);
  readonly pendingAction = signal<PendingAction>(null);

  readonly mintSignature = signal<string | null>(null);
  readonly mintError = signal<string | null>(null);
  readonly fromLearning = signal(false);

  readonly canSubmitTopic = computed(
    () => this.topic().trim().length > 0 && this.explanation().trim().length > 0 && !this.loading()
  );

  readonly canSubmitFollowUp = computed(
    () => this.followUpAnswer().trim().length > 0 && !this.loading()
  );

  readonly canMint = computed(
    () =>
      (this.finalResult()?.final_score ?? 0) >= MASTERY_SCORE_THRESHOLD &&
      !this.solana.isMinting() &&
      !this.mintSignature()
  );

  readonly walletAddressShort = computed(() => {
    const addr = this.solana.walletAddress();
    if (!addr) return '';
    return `${addr.slice(0, 4)}…${addr.slice(-4)}`;
  });

  ngOnInit(): void {
    this.route.queryParams.subscribe((params) => {
      const t = params['topic'];
      if (typeof t === 'string' && t.trim()) {
        this.topic.set(t.trim());
      }
      this.fromLearning.set(params['from'] === 'learning');
    });
  }

  selectTopic(key: (typeof EXAMPLE_KEYS)[number]): void {
    this.topic.set(this.i18n.t(key));
  }

  async submitExplanation(): Promise<void> {
    if (!this.canSubmitTopic()) return;
    await this.runWithRetry('grade', () => this.doGrade());
  }

  async submitFollowUp(): Promise<void> {
    if (!this.canSubmitFollowUp()) return;
    await this.runWithRetry('followUp', () => this.doFollowUp());
  }

  async retryLastAction(): Promise<void> {
    const action = this.pendingAction();
    if (action === 'grade') await this.doGrade();
    else if (action === 'followUp') await this.doFollowUp();
  }

  async connectWallet(): Promise<void> {
    this.mintError.set(null);
    try {
      await this.solana.connectWallet();
      if (!this.solana.hasEnoughDevnetSol()) {
        this.mintError.set(this.i18n.t('teachBack.errorLowBalance'));
      }
    } catch (err) {
      this.mintError.set(
        err instanceof SolanaError ? err.message : this.i18n.t('teachBack.errorConnect')
      );
    }
  }

  async mintProof(): Promise<void> {
    const result = this.finalResult();
    if (!result || result.final_score < MASTERY_SCORE_THRESHOLD) return;

    this.mintError.set(null);
    try {
      if (!this.solana.walletAddress()) {
        await this.connectWallet();
      }
      const sig = await this.solana.mintProofOfMastery(this.topic(), result.final_score);
      this.mintSignature.set(sig);
    } catch (err) {
      this.mintError.set(
        err instanceof SolanaError ? err.message : this.i18n.t('teachBack.errorMint')
      );
    }
  }

  resetFlow(): void {
    this.screen.set('topic');
    this.topic.set('');
    this.explanation.set('');
    this.followUpAnswer.set('');
    this.grading.set(null);
    this.finalResult.set(null);
    this.loading.set(false);
    this.error.set(null);
    this.pendingAction.set(null);
    this.mintSignature.set(null);
    this.mintError.set(null);
  }

  private async runWithRetry(action: PendingAction, fn: () => Promise<void>): Promise<void> {
    this.pendingAction.set(action);
    this.error.set(null);
    await fn();
  }

  private async doGrade(): Promise<void> {
    this.loading.set(true);
    this.error.set(null);
    try {
      const result = await this.ai.gradeExplanation(this.topic().trim(), this.explanation().trim());
      this.grading.set(result);
      this.screen.set('grading');
    } catch (err) {
      this.error.set(err instanceof Error ? err.message : this.i18n.t('teachBack.errorGeneric'));
    } finally {
      this.loading.set(false);
    }
  }

  private async doFollowUp(): Promise<void> {
    const grading = this.grading();
    if (!grading) return;

    this.loading.set(true);
    this.error.set(null);
    try {
      const result = await this.ai.evaluateFollowUp(
        this.topic().trim(),
        this.explanation().trim(),
        grading.follow_up_question,
        this.followUpAnswer().trim(),
        grading
      );
      this.finalResult.set(result);
      this.learningStorage.saveTeachBackScore(this.topic().trim(), result.final_score);
      this.screen.set('final');
    } catch (err) {
      this.error.set(err instanceof Error ? err.message : this.i18n.t('teachBack.errorGeneric'));
    } finally {
      this.loading.set(false);
    }
  }
}
