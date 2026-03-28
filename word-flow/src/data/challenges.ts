import { Challenge, Difficulty } from '../types';

const rawChallenges: Omit<Challenge, 'id'>[] = [
  // Easy
  { difficulty: 'Easy', prompt: 'Things you find in a kitchen' },
  { difficulty: 'Easy', prompt: 'Colors of the rainbow' },
  { difficulty: 'Easy', prompt: 'Types of fruit' },
  { difficulty: 'Easy', prompt: 'Animals you might see at a zoo' },
  { difficulty: 'Easy', prompt: 'Things you wear' },
  { difficulty: 'Easy', prompt: 'Types of weather' },
  { difficulty: 'Easy', prompt: 'Things you find in a bathroom' },
  { difficulty: 'Easy', prompt: 'Modes of transportation' },
  { difficulty: 'Easy', prompt: 'Things you do in the morning' },
  { difficulty: 'Easy', prompt: 'Types of furniture' },
  { difficulty: 'Easy', prompt: 'Things you find in a classroom' },
  { difficulty: 'Easy', prompt: 'Types of drinks' },
  { difficulty: 'Easy', prompt: 'Things you find at the beach' },
  { difficulty: 'Easy', prompt: 'Types of sports' },
  { difficulty: 'Easy', prompt: 'Things you find in a park' },
  { difficulty: 'Easy', prompt: 'Types of pets' },
  { difficulty: 'Easy', prompt: 'Things you find in a bedroom' },
  { difficulty: 'Easy', prompt: 'Types of vegetables' },
  { difficulty: 'Easy', prompt: 'Things you do on a weekend' },
  { difficulty: 'Easy', prompt: 'Types of flowers' },
  
  // Medium
  { difficulty: 'Medium', prompt: 'Countries in Europe' },
  { difficulty: 'Medium', prompt: 'Types of musical instruments' },
  { difficulty: 'Medium', prompt: 'Things you find in a toolbox' },
  { difficulty: 'Medium', prompt: 'Types of cheese' },
  { difficulty: 'Medium', prompt: 'Things you pack for a vacation' },
  { difficulty: 'Medium', prompt: 'Types of trees' },
  { difficulty: 'Medium', prompt: 'Things you find in a hospital' },
  { difficulty: 'Medium', prompt: 'Types of birds' },
  { difficulty: 'Medium', prompt: 'Things you find in a purse or wallet' },
  { difficulty: 'Medium', prompt: 'Types of fish' },
  { difficulty: 'Medium', prompt: 'Things you do to relax' },
  { difficulty: 'Medium', prompt: 'Types of bread' },
  { difficulty: 'Medium', prompt: 'Things you find in a gym' },
  { difficulty: 'Medium', prompt: 'Types of shoes' },
  { difficulty: 'Medium', prompt: 'Things you find in a library' },
  { difficulty: 'Medium', prompt: 'Types of pasta' },
  { difficulty: 'Medium', prompt: 'Things you do before bed' },
  { difficulty: 'Medium', prompt: 'Types of hats' },
  { difficulty: 'Medium', prompt: 'Things you find in a garden' },
  { difficulty: 'Medium', prompt: 'Types of soup' },

  // Hard
  { difficulty: 'Hard', prompt: 'Elements on the periodic table' },
  { difficulty: 'Hard', prompt: 'Capitals of US states' },
  { difficulty: 'Hard', prompt: 'Types of dinosaurs' },
  { difficulty: 'Hard', prompt: 'Things you find in a spaceship' },
  { difficulty: 'Hard', prompt: 'Types of clouds' },
  { difficulty: 'Hard', prompt: 'Things you find in a medieval castle' },
  { difficulty: 'Hard', prompt: 'Types of gemstones' },
  { difficulty: 'Hard', prompt: 'Things you find in a chemistry lab' },
  { difficulty: 'Hard', prompt: 'Types of philosophical theories' },
  { difficulty: 'Hard', prompt: 'Things you find in an ancient Egyptian tomb' },
  { difficulty: 'Hard', prompt: 'Types of subatomic particles' },
  { difficulty: 'Hard', prompt: 'Things you find in a submarine' },
  { difficulty: 'Hard', prompt: 'Types of classical composers' },
  { difficulty: 'Hard', prompt: 'Things you find in a professional kitchen' },
  { difficulty: 'Hard', prompt: 'Types of architectural styles' },
  { difficulty: 'Hard', prompt: 'Things you find in a recording studio' },
  { difficulty: 'Hard', prompt: 'Types of literary genres' },
  { difficulty: 'Hard', prompt: 'Things you find in a courtroom' },
  { difficulty: 'Hard', prompt: 'Types of martial arts' },
  { difficulty: 'Hard', prompt: 'Things you find in a botanical garden' },
];

// Fisher-Yates shuffle
function shuffle<T>(array: T[]): T[] {
  const newArray = [...array];
  for (let i = newArray.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [newArray[i], newArray[j]] = [newArray[j], newArray[i]];
  }
  return newArray;
}

// Initialize and shuffle challenges
export const challenges: Challenge[] = shuffle(
  rawChallenges.map((c, index) => ({ ...c, id: `challenge-${index}` }))
);

export function getChallengesByDifficulty(difficulty: Difficulty): Challenge[] {
  return challenges.filter(c => c.difficulty === difficulty);
}
