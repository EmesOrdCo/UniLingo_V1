import { UserFlashcard } from './userFlashcardService';

export interface MemoryMatchSetupOptions {
  cardCount: number;
  difficulty: 'easy' | 'medium' | 'hard';
  timeLimit: number | null;
  showHints: boolean;
  selectedTopic: string | null;
  filteredFlashcards: any[];
  gravitySpeed?: number;
  meteorCount?: number;
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
  cardType?: string;
  originalCardId?: string;
  gravitySpeed?: number;
  meteorCount?: number;
  meteorId?: string;
  fallSpeed?: number;
  spawnDelay?: number;
}

export interface GameData {
  questions: GameQuestion[];
  languageMode?: 'question' | 'answer' | 'mixed';
  setupOptions?: MemoryMatchSetupOptions;
  timeLimit?: number;
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
   * Generate wrong answer options in the same language as the correct answer
   */
  private static generateWrongOptionsForLanguage(correctAnswer: string, allFlashcards: UserFlashcard[], languageMode: 'question' | 'answer', count: number = 3): string[] {
    const wrongAnswers: string[] = [];
    const usedAnswers = new Set([correctAnswer]);
    
    // Get random answers from other flashcards
    const shuffledCards = [...allFlashcards].sort(() => Math.random() - 0.5);
    
    for (const card of shuffledCards) {
      if (wrongAnswers.length >= count) break;
      
      // For question mode (native-to-target), we want target language answers (card.back)
      // For answer mode (target-to-native), we want native language answers (card.front)
      // This ensures the options are in the same language as the correct answer
      const wrongOption = languageMode === 'question' ? card.back : card.front;
      
      if (wrongOption && !usedAnswers.has(wrongOption) && wrongOption !== correctAnswer) {
        wrongAnswers.push(wrongOption);
        usedAnswers.add(wrongOption);
      }
    }
    
    // If we don't have enough wrong answers, add generic ones in the appropriate language
    while (wrongAnswers.length < count) {
      const genericAnswers = languageMode === 'question' 
        ? ['Not sure', 'Maybe', 'Possibly', 'Unknown', 'Not applicable']
        : ['No sé', 'Tal vez', 'Posiblemente', 'Desconocido', 'No aplica'];
      
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
  static generateQuizQuestions(
    flashcards: UserFlashcard[], 
    count: number, 
    languageMode: 'question' | 'answer' | 'mixed' = 'question',
    translations?: {
      questionTranslation: string;
      questionTerm: string;
    }
  ): GameData {
    // Validate input
    if (!flashcards || flashcards.length === 0) {
      console.warn('GameDataService.generateQuizQuestions: No flashcards provided');
      return {
        questions: [],
        languageMode
      };
    }

    const questions: GameQuestion[] = [];
    const shuffledCards = this.shuffleArray(flashcards).slice(0, count);
    
    for (const card of shuffledCards) {
      // Validate card data
      if (!card.front || !card.back) {
        console.warn('GameDataService.generateQuizQuestions: Invalid card data:', card);
        continue;
      }

      // For mixed mode, randomly choose question direction for each card
      const actualMode = languageMode === 'mixed' 
        ? (Math.random() < 0.5 ? 'question' : 'answer')
        : languageMode;
      
      const question = actualMode === 'question' 
        ? (translations?.questionTranslation || `What is the translation of "${card.front}"?`).replace('{{term}}', card.front)
        : (translations?.questionTerm || `What is the term for "${card.back}"?`).replace('{{term}}', card.back);
      
      const correctAnswer = actualMode === 'question' ? card.back : card.front;
      
      // Generate wrong options in the same language as the correct answer
      const wrongOptions = this.generateWrongOptionsForLanguage(correctAnswer, flashcards, actualMode, 3);
      
      // Shuffle all options together
      const allOptions = this.shuffleArray([correctAnswer, ...wrongOptions]);
      
      questions.push({
        question,
        correctAnswer,
        options: allOptions,
        type: 'translation'
      });
    }
    
    console.log(`GameDataService.generateQuizQuestions: Generated ${questions.length} questions from ${flashcards.length} flashcards`);
    
    return {
      questions,
      languageMode
    };
  }

  /**
   * Generate scramble questions for WordScrambleGame
   */
  static generateScrambleQuestions(
    flashcards: UserFlashcard[], 
    count: number,
    translations?: {
      unscrambleInstructions: string;
    }
  ): GameData {
    const questions: GameQuestion[] = [];
    const shuffledCards = this.shuffleArray(flashcards).slice(0, count);
    
    for (const card of shuffledCards) {
      const wordToScramble = card.front;
      
      questions.push({
        question: translations?.unscrambleInstructions || 'Unscramble the word below:',
        correctAnswer: wordToScramble,
        type: 'scramble'
      });
    }
    
    return { questions };
  }

  /**
   * Generate hangman questions for HangmanGame
   */
  static generateHangmanQuestions(flashcards: UserFlashcard[], count: number, difficulty: 'easy' | 'medium' | 'hard' = 'medium'): GameData {
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
        showHints: true,
        selectedTopic: null,
        filteredFlashcards: [],
      }
    };
  }

  /**
   * Generate speed challenge questions for SpeedChallengeGame
   */
  static generateSpeedChallengeQuestions(
    flashcards: UserFlashcard[], 
    difficulty: 'easy' | 'medium' | 'hard' = 'medium', 
    timeLimit: number,
    translations?: {
      questionTranslation: string;
    }
  ): GameData {
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
        question: (translations?.questionTranslation || `What is the translation of "${card.front}"?`).replace('{{term}}', card.front),
        correctAnswer: card.back,
        type: 'speed_challenge'
      });
    }
    
    return { questions, timeLimit };
  }

  /**
   * Generate type what you hear questions for TypeWhatYouHearGame
   */
  static generateTypeWhatYouHearQuestions(
    flashcards: UserFlashcard[], 
    count: number, 
    difficulty: 'easy' | 'medium' | 'hard' = 'medium',
    translations?: {
      typeWhatYouHear: string;
    }
  ): GameData {
    const questions: GameQuestion[] = [];
    const shuffledCards = this.shuffleArray(flashcards).slice(0, count);
    
    for (const card of shuffledCards) {
      questions.push({
        question: translations?.typeWhatYouHear || 'Type what you hear:',
        correctAnswer: card.front,
        type: 'audio_recognition'
      });
    }
    
    return { questions };
  }

  /**
   * Generate sentence scramble questions for SentenceScrambleGame
   */
  static generateSentenceScrambleQuestions(
    flashcards: UserFlashcard[], 
    count: number, 
    difficulty: 'easy' | 'medium' | 'hard' = 'medium',
    translations?: {
      unscrambleSentence: string;
    }
  ): GameData {
    const questions: GameQuestion[] = [];
    const shuffledCards = this.shuffleArray(flashcards).slice(0, count);
    
    for (const card of shuffledCards) {
      // Use example sentence if available, otherwise create one from front/back
      const sentence = card.example || `${card.front} means ${card.back}`;
      
      questions.push({
        question: translations?.unscrambleSentence || 'Unscramble the sentence below:',
        correctAnswer: sentence,
        type: 'sentence_scramble'
      });
    }
    
    return { questions };
  }

  /**
   * Generate meteor data for Planet Defense game
   */
  static generateGravityGameQuestions(flashcards: UserFlashcard[], difficulty: 'easy' | 'medium' | 'hard' = 'medium', gravitySpeed: number = 1.0): GameData {
    const meteors: GameQuestion[] = [];
    const shuffledCards = this.shuffleArray(flashcards);
    
    // Generate more meteors for longer gameplay
    const meteorCount = difficulty === 'easy' ? 20 : difficulty === 'medium' ? 30 : 40;
    const selectedCards = shuffledCards.slice(0, Math.min(meteorCount, shuffledCards.length));
    
    for (const card of selectedCards) {
      // Randomly choose whether to show term or definition on meteor
      const showTerm = Math.random() < 0.5;
      
      meteors.push({
        question: showTerm ? card.front : card.back, // What's shown on the meteor
        correctAnswer: showTerm ? card.back : card.front, // What player must type
        type: 'meteor',
        gravitySpeed: gravitySpeed,
        // Additional meteor properties
        meteorId: Math.random().toString(36).substr(2, 9),
        fallSpeed: this.calculateMeteorSpeed(difficulty, gravitySpeed),
        spawnDelay: Math.random() * 3000 + 1000, // Random spawn delay 1-4 seconds
      });
    }
    
    return { 
      questions: meteors,
      setupOptions: {
        cardCount: 0,
        difficulty,
        timeLimit: null,
        showHints: false,
        selectedTopic: null,
        filteredFlashcards: [],
        gravitySpeed,
        meteorCount: meteors.length
      }
    };
  }

  /**
   * Calculate meteor fall speed based on difficulty and gravity speed
   */
  private static calculateMeteorSpeed(difficulty: 'easy' | 'medium' | 'hard', gravitySpeed: number): number {
    const baseSpeed = difficulty === 'easy' ? 2 : difficulty === 'medium' ? 3 : 4;
    return baseSpeed * gravitySpeed;
  }

  /**
   * Generate speaking game questions for SpeakingGame
   */
  static generateSpeakingGameQuestions(flashcards: UserFlashcard[], count: number): GameData {
    const questions: GameQuestion[] = [];
    const shuffledCards = this.shuffleArray(flashcards).slice(0, count);
    
    for (const card of shuffledCards) {
      questions.push({
        question: 'Pronounce this word:',
        correctAnswer: card.front, // Use the front (English word) for pronunciation
        type: 'pronunciation',
        front: card.front,
        back: card.back,
        example: card.example,
        pronunciation: card.pronunciation
      });
    }
    
    return { 
      questions,
      setupOptions: {
        cardCount: 0,
        difficulty: 'medium',
        timeLimit: null,
        showHints: false,
        selectedTopic: null,
        filteredFlashcards: [],
      }
    };
  }

  /**
   * Validate flashcard data before generating game questions
   */
  static validateFlashcards(flashcards: UserFlashcard[], gameType: string): { isValid: boolean; error?: string } {
    if (!flashcards || flashcards.length === 0) {
      return { isValid: false, error: 'lessons.flashcards.noFlashcardsAvailable' };
    }
    
    const validCards = flashcards.filter(card => 
      card.front && card.back && card.front.trim() && card.back.trim()
    );
    
    if (validCards.length === 0) {
      return { isValid: false, error: 'No valid flashcards found' };
    }
    
    if (validCards.length < 3 && gameType !== 'memory_match') {
      return { isValid: false, error: 'Need at least 3 flashcards for this game' };
    }
    
    return { isValid: true };
  }
}
