export type Difficulty = 'Easy' | 'Medium' | 'Hard';

export interface Challenge {
  id: string;
  difficulty: Difficulty;
  prompt: string;
}

export interface EvaluationResult {
  rawScore: number;
  performanceScore: number;
  whatTheyDidWell: string;
  roomForImprovement: string;
}

export type AppState = 'HOME' | 'READY' | 'PLAYING' | 'EVALUATING' | 'RESULTS';
