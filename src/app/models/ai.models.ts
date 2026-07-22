export interface GradingResponse {
  score: number;
  correct_points: string[];
  wrong_points: { claim: string; correction: string }[];
  missed_points: string[];
  follow_up_question: string;
}

export interface ResourceLink {
  title: string;
  url: string;
}

export interface FinalResponse {
  follow_up_correct: boolean;
  follow_up_feedback: string;
  complete_explanation_bullets: string[];
  final_score: number;
  full_explanation: string;
  resource_links: ResourceLink[];
}

export type FlowScreen = 'topic' | 'grading' | 'final';

export type PendingAction = 'grade' | 'followUp' | null;
