import { Component, inject, OnInit, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { MasteryCredential } from '../../models/mastery.models';
import { I18nService } from '../../services/i18n.service';
import { MasteryStorageService } from '../../services/mastery-storage.service';
import { SolanaService } from '../../services/solana.service';
import { TranslatePipe } from '../../pipes/translate.pipe';

@Component({
  selector: 'app-mastery',
  imports: [RouterLink, TranslatePipe],
  templateUrl: './mastery.html',
  styleUrl: './mastery.css',
})
export class Mastery {
  private readonly storage = inject(MasteryStorageService);
  private readonly i18n = inject(I18nService);
  readonly solana = inject(SolanaService);

  readonly credentials = signal<MasteryCredential[]>([]);

  ngOnInit(): void {
    this.refresh();
  }

  refresh(): void {
    this.credentials.set(this.storage.getCredentials());
  }

  remove(id: string, event: Event): void {
    event.stopPropagation();
    this.storage.removeCredential(id);
    this.refresh();
  }

  formatDate(ts: number): string {
    const locale = this.i18n.lang() === 'ka' ? 'ka-GE' : undefined;
    return new Date(ts).toLocaleDateString(locale, {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
  }

  explorerUrl(credential: MasteryCredential): string {
    return this.solana.getExplorerUrl(credential.signature);
  }
}
