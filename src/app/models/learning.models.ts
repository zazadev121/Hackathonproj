export interface ScoreRecord {
  score: number;
  date: number;
  type: 'teach-back' | 'long-test';
  letterGrade?: string;
}

export interface LearningTopic {
  id: string;
  topic: string;
  scores: ScoreRecord[];
  lastScore: number;
  updatedAt: number;
}
