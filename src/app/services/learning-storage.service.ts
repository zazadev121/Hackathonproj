import { Injectable } from '@angular/core';
import { LearningTopic, ScoreRecord } from '../models/learning.models';

const STORAGE_KEY = 'teachback-now-learning';

@Injectable({ providedIn: 'root' })
export class LearningStorageService {
  getTopics(): LearningTopic[] {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (!raw) return [];
      const parsed = JSON.parse(raw) as LearningTopic[];
      return Array.isArray(parsed)
        ? parsed.sort((a, b) => b.updatedAt - a.updatedAt)
        : [];
    } catch {
      return [];
    }
  }

  saveTeachBackScore(topic: string, score: number): LearningTopic {
    return this.addScore(topic, { score, date: Date.now(), type: 'teach-back' });
  }

  saveLongTestScore(topic: string, score: number, letterGrade: string): LearningTopic {
    return this.addScore(topic, {
      score,
      date: Date.now(),
      type: 'long-test',
      letterGrade,
    });
  }

  removeTopic(id: string): void {
    const topics = this.getTopics().filter((t) => t.id !== id);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(topics));
  }

  getTopicByName(topic: string): LearningTopic | undefined {
    const normalized = topic.trim().toLowerCase();
    return this.getTopics().find((t) => t.topic.trim().toLowerCase() === normalized);
  }

  private addScore(topic: string, record: ScoreRecord): LearningTopic {
    const trimmed = topic.trim();
    const topics = this.getTopics();
    const normalized = trimmed.toLowerCase();
    const existing = topics.find((t) => t.topic.trim().toLowerCase() === normalized);

    let updated: LearningTopic;
    if (existing) {
      updated = {
        ...existing,
        scores: [record, ...existing.scores],
        lastScore: record.score,
        updatedAt: Date.now(),
      };
      const index = topics.findIndex((t) => t.id === existing.id);
      topics[index] = updated;
    } else {
      updated = {
        id: crypto.randomUUID(),
        topic: trimmed,
        scores: [record],
        lastScore: record.score,
        updatedAt: Date.now(),
      };
      topics.unshift(updated);
    }

    localStorage.setItem(STORAGE_KEY, JSON.stringify(topics));
    return updated;
  }
}
