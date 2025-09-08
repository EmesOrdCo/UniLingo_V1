import { UserFlashcard } from './userFlashcardService';

export interface MemoryMatchSetupOptions {
  cardCount: number;
  difficulty: 'easy' | 'medium' | 'hard';
  timeLimit: number | null;
  showHints: boolean;
  selectedTopic: string | null;
  filteredFlashcards: any[];
}

export interface GameQuestion {
  question: string;
  correctAnswer: string;
  options?: string[];
  type?: string;
  // Additional properties for specific games
  front?: string;
  back?: string;
  example?: string;
  pronunciation?: string;
}

export interface GameData {
  questions: GameQuestion[];
  languageMode?: 'question' | 'answer';
  setupOptions?: MemoryMatchSetupOptions;
}

export class GameDataService {
  /**
   * Generate wrong answer options for multiple choice questions
   */
  private static generateWrongOptions(correctAnswer: string, allFlashcards: UserFlashcard[], count: number = 3): string[] {
    const wrongAnswers: string[] = [];
    const usedAnswers = new Set([correctAnswer]);
    
    // Get random answers from other flashcards
    const shuffledCards = [...allFlashcards].sort(() => Math.random() - 0.5);
    
    for (const card of shuffledCards) {
      if (wrongAnswers.length >= count) break;
      
      // Use either front or back as wrong answer
      const possibleAnswers = [card.front, card.back].filter(answer => 
        answer && !usedAnswers.has(answer) && answer !== correctAnswer
      );
      
      for (const answer of possibleAnswers) {
        if (wrongAnswers.length >= count) break;
        wrongAnswers.push(answer);
        usedAnswers.add(answer);
      }
    }
    
    // If we don't have enough wrong answers, add generic ones
    while (wrongAnswers.length < count) {
      const genericAnswers = ['Not sure', 'Maybe', 'Possibly', 'Unknown', 'Not applicable'];
      for (const generic of genericAnswers) {
        if (!usedAnswers.has(generic) && wrongAnswers.length < count) {
          wrongAnswers.push(generic);
          usedAnswers.add(generic);
          break;
        }
      }
    }
    
    return wrongAnswers.slice(0, count);
  }

  /**
   * Shuffle array in place
   */
  private static shuffleArray<T>(array: T[]): T[] {
    const shuffled = [...array];
    for (let i = shuffled.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
    }
    return shuffled;
  }

  /**
   * Generate quiz questions for FlashcardQuizGame
   */
  static generateQuizQuestions(flashcards: UserFlashcard[], count: number, languageMode: 'question' | 'answer' = 'question'): GameData {
    const questions: GameQuestion[] = [];
    const shuffledCards = this.shuffleArray(flashcards).slice(0, count);
    
    for (const card of shuffledCards) {
      const question = languageMode === 'question' 
        ? `What is the definition of "${card.front}"?`
        : `What is the term for "${card.back}"?`;
      
      const correctAnswer = languageMode === 'question' ? card.back : card.front;
      const wrongOptions = this.generateWrongOptions(correctAnswer, flashcards, 3);
      
      // Shuffle all options together
      const allOptions = this.shuffleArray([correctAnswer, ...wrongOptions]);
      
      questions.push({
        question,
        correctAnswer,
        options: allOptions,
        type: 'definition'
      });
    }
    
    return {
      questions,
      languageMode
    };
  }

  /**
   * Generate scramble questions for WordScrambleGame
   */
  static generateScrambleQuestions(flashcards: UserFlashcard[], count: number): GameData {
    const questions: GameQuestion[] = [];
    const shuffledCards = this.shuffleArray(flashcards).slice(0, count);
    
    for (const card of shuffledCards) {
      const wordToScramble = card.front;
      const scrambled = this.shuffleArray(wordToScramble.split('')).join('');
      
      questions.push({
        question: `Unscramble this word: "${scrambled}"`,
        correctAnswer: wordToScramble,
        type: 'scramble'
      });
    }
    
    return { questions };
  }

  /**
   * Generate hangman questions for HangmanGame
   */
  static generateHangmanQuestions(flashcards: UserFlashcard[], count: number, difficulty: 'easy' | 'medium' | 'hard' = 'medium', maxGuesses: number = 6): GameData {
    const questions: GameQuestion[] = [];
    const shuffledCards = this.shuffleArray(flashcards).slice(0, count);
    
    for (const card of shuffledCards) {
      questions.push({
        question: `Guess the word: ${card.back}`,
        correctAnswer: card.front.toLowerCase(),
        type: 'hangman'
      });
    }
    
    return { questions };
  }

  /**
   * Generate memory match questions for MemoryMatchGame
   */
  static generateMemoryMatchQuestions(flashcards: UserFlashcard[], count: number, setupOptions?: MemoryMatchSetupOptions): GameData {
    const questions: GameQuestion[] = [];
    const shuffledCards = this.shuffleArray(flashcards).slice(0, Math.min(count, flashcards.length));
    
    for (const card of shuffledCards) {
      // Create English card (front)
      questions.push({
        question: card.front,
        correctAnswer: card.back,
        type: 'memory_match',
        // Add additional data for memory match
        front: card.front,
        back: card.back,
        example: card.example,
        pronunciation: card.pronunciation,
        cardType: 'english', // Mark as English card
        originalCardId: card.id, // Reference to original flashcard
      });
      
      // Create Native card (back)
      questions.push({
        question: card.back,
        correctAnswer: card.front,
        type: 'memory_match',
        // Add additional data for memory match
        front: card.front,
        back: card.back,
        example: card.example,
        pronunciation: card.pronunciation,
        cardType: 'native', // Mark as Native card
        originalCardId: card.id, // Reference to original flashcard
      });
    }
    
    return { 
      questions,
      setupOptions: setupOptions || {
        cardCount: count,
        difficulty: 'medium',
        timeLimit: null,
        showHints: true
      }
    };
  }

  /**
   * Generate speed challenge questions for SpeedChallengeGame
   */
  static generateSpeedChallengeQuestions(flashcards: UserFlashcard[], difficulty: 'easy' | 'medium' | 'hard' = 'medium', timeLimit: number): GameData {
    // For speed challenge, we don't limit the number of questions
    // The game will randomly select from the available flashcards pool
    // and can repeat questions if needed
    const questions: GameQuestion[] = [];
    
    // Create a pool of all available flashcards
    const shuffledCards = this.shuffleArray(flashcards);
    
    // Generate a reasonable number of questions for the time limit
    // This is just for initial setup - the game will dynamically generate more
    const estimatedQuestions = Math.max(20, Math.floor(timeLimit / 3)); // ~3 seconds per question estimate
    const questionCount = Math.min(estimatedQuestions, shuffledCards.length * 2); // Allow repeats
    
    for (let i = 0; i < questionCount; i++) {
      const card = shuffledCards[i % shuffledCards.length]; // Cycle through cards, allowing repeats
      questions.push({
        question: `What is the definition of "${card.front}"?`,
        correctAnswer: card.back,
        type: 'speed_challenge'
      });
    }
    
    return { questions, timeLimit };
  }

  /**
   * Generate type what you hear questions for TypeWhatYouHearGame
   */
  static generateTypeWhatYouHearQuestions(flashcards: UserFlashcard[], count: number, difficulty: 'easy' | 'medium' | 'hard' = 'medium'): GameData {
    const questions: GameQuestion[] = [];
    const shuffledCards = this.shuffleArray(flashcards).slice(0, count);
    
    for (const card of shuffledCards) {
      questions.push({
        question: `Type what you hear: "${card.front}"`,
        correctAnswer: card.front,
        type: 'audio_recognition'
      });
    }
    
    return { questions };
  }

  /**
   * Generate sentence scramble questions for SentenceScrambleGame
   */
  static generateSentenceScrambleQuestions(flashcards: UserFlashcard[], count: number, difficulty: 'easy' | 'medium' | 'hard' = 'medium'): GameData {
    const questions: GameQuestion[] = [];
    const shuffledCards = this.shuffleArray(flashcards).slice(0, count);
    
    for (const card of shuffledCards) {
      // Use example sentence if available, otherwise create one from front/back
      const sentence = card.example || `${card.front} means ${card.back}`;
      const words = sentence.split(' ');
      const scrambledWords = this.shuffleArray(words);
      
      questions.push({
        question: `Unscramble this sentence: "${scrambledWords.join(' ')}"`,
        correctAnswer: sentence,
        type: 'sentence_scramble'
      });
    }
    
    return { questions };
  }

  /**
   * Generate gravity game questions for GravityGame
   */
  static generateGravityGameQuestions(flashcards: UserFlashcard[], difficulty: 'easy' | 'medium' | 'hard' = 'medium', gravitySpeed: number = 1.0): GameData {
    const questions: GameQuestion[] = [];
    const shuffledCards = this.shuffleArray(flashcards);
    
    for (const card of shuffledCards) {
      questions.push({
        question: `Defend Earth! What is "${card.front}"?`,
        correctAnswer: card.back,
        type: 'gravity_game'
      });
    }
    
    return { questions };
  }

  /**
   * Validate flashcard data before generating game questions
   */
  static validateFlashcards(flashcards: UserFlashcard[], gameType: string): { isValid: boolean; error?: string } {
    if (!flashcards || flashcards.length === 0) {
      return { isValid: false, error: 'No flashcards available' };
    }
    
    const validCards = flashcards.filter(card => 
      card.front && card.back && card.front.trim() && card.back.trim()
    );
    
    if (validCards.length === 0) {
      return { isValid: false, error: 'No valid flashcards found' };
    }
    
    if (validCards.length < 3 && gameType !== 'Memory Match') {
      return { isValid: false, error: 'Need at least 3 flashcards for this game' };
    }
    
    return { isValid: true };
  }
}
