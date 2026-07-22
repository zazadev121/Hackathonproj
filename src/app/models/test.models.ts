export interface LongTestQuestion {
  id: number;
  question: string;
  options: string[];
}

export interface LongTestGenerateResponse {
  questions: LongTestQuestion[];
}

export interface LongTestAnswer {
  questionId: number;
  selectedIndex: number;
}

export interface LongTestGradeResponse {
  score: number;
  letter_grade: string;
  correct_count: number;
  total: number;
  summary: string;
  weak_areas: string[];
}

export type LongTestScreen = 'topic' | 'questions' | 'result';

export function scoreToLetterGrade(score: number): string {
  if (score >= 97) return 'A+';
  if (score >= 93) return 'A';
  if (score >= 90) return 'A-';
  if (score >= 87) return 'B+';
  if (score >= 83) return 'B';
  if (score >= 80) return 'B-';
  if (score >= 77) return 'C+';
  if (score >= 73) return 'C';
  if (score >= 70) return 'C-';
  if (score >= 67) return 'D+';
  if (score >= 63) return 'D';
  if (score >= 60) return 'D-';
  return 'F';
}
