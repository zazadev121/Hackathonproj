import { Injectable } from '@angular/core';
import { MasteryCredential } from '../models/mastery.models';

const STORAGE_KEY = 'teachback-mastery-credentials';

@Injectable({ providedIn: 'root' })
export class MasteryStorageService {
  getCredentials(): MasteryCredential[] {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (!raw) return [];
      const parsed = JSON.parse(raw) as MasteryCredential[];
      return Array.isArray(parsed)
        ? parsed.sort((a, b) => b.mintedAt - a.mintedAt)
        : [];
    } catch {
      return [];
    }
  }

  saveCredential(
    topic: string,
    score: number,
    signature: string,
    isDemo: boolean
  ): MasteryCredential {
    const trimmed = topic.trim();
    const credentials = this.getCredentials();
    const normalized = trimmed.toLowerCase();
    const existing = credentials.find((c) => c.topic.trim().toLowerCase() === normalized);

    const entry: MasteryCredential = {
      id: existing?.id ?? crypto.randomUUID(),
      topic: trimmed,
      score,
      mintedAt: Date.now(),
      signature,
      isDemo,
    };

    if (existing) {
      const index = credentials.findIndex((c) => c.id === existing.id);
      credentials[index] = entry;
    } else {
      credentials.unshift(entry);
    }

    localStorage.setItem(STORAGE_KEY, JSON.stringify(credentials));
    return entry;
  }

  removeCredential(id: string): void {
    const credentials = this.getCredentials().filter((c) => c.id !== id);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(credentials));
  }
}
