export interface MasteryCredential {
  id: string;
  topic: string;
  score: number;
  mintedAt: number;
  signature: string;
  isDemo: boolean;
}
