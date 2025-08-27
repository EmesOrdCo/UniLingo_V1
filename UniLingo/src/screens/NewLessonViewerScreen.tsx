import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
  Dimensions,
  TextInput,
  Modal,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation, useRoute } from '@react-navigation/native';
import { useAuth } from '../contexts/AuthContext';
import { LessonService, Lesson, LessonVocabulary, LessonExercise, LessonProgress } from '../lib/lessonService';

const { width } = Dimensions.get('window');

interface LessonViewerRouteParams {
  lessonId: string;
}

export default function NewLessonViewerScreen() {
  const navigation = useNavigation();
  const route = useRoute();
  const { lessonId } = route.params as LessonViewerRouteParams;
  const { user } = useAuth();

  const [lesson, setLesson] = useState<Lesson | null>(null);
  const [vocabulary, setVocabulary] = useState<LessonVocabulary[]>([]);
  const [exercises, setExercises] = useState<LessonExercise[]>([]);
  const [currentExerciseIndex, setCurrentExerciseIndex] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [progress, setProgress] = useState<LessonProgress | null>(null);
  const [showVocabularyModal, setShowVocabularyModal] = useState(false);
  const [exerciseScore, setExerciseScore] = useState(0);
  const [totalScore, setTotalScore] = useState(0);
  const [maxPossibleScore, setMaxPossibleScore] = useState(0);
  const [startTime, setStartTime] = useState<Date | null>(null);

  useEffect(() => {
    loadLesson();
    if (user?.id) {
      loadProgress();
    }
  }, [lessonId, user?.id]);

  const loadLesson = async () => {
    try {
      setLoading(true);
      const lessonData = await LessonService.getLesson(lessonId);
      
      if (lessonData) {
        setLesson(lessonData.lesson);
        setVocabulary(lessonData.vocabulary || []);
        setExercises(lessonData.exercises || []);
        setMaxPossibleScore((lessonData.exercises || []).reduce((sum, ex) => sum + ex.points, 0));
      } else {
        setError('Lesson not found');
      }
    } catch (err) {
      setError('Failed to load lesson');
      console.error('Error loading lesson:', err);
    } finally {
      setLoading(false);
    }
  };

  const loadProgress = async () => {
    if (!user?.id) return;
    
    try {
      const progressData = await LessonService.getLessonProgress(user.id, lessonId);
      if (progressData) {
        setProgress(progressData);
        setTotalScore(progressData.total_score);
        setCurrentExerciseIndex(0); // Start from beginning since we don't track exercise completion
      }
    } catch (err) {
      console.error('Error loading progress:', err);
    }
  };

  const startLesson = () => {
    setStartTime(new Date());
    setCurrentExerciseIndex(0);
    setTotalScore(0);
    setExerciseScore(0);
    
    if (user?.id) {
      LessonService.updateLessonProgress(user.id, lessonId, {
        started_at: new Date().toISOString(),
        total_score: 0,
        max_possible_score: maxPossibleScore,
        // Removed exercise_completed field that doesn't exist in database
        total_exercises: exercises ? exercises.length : 0,
        time_spent_seconds: 0,
        status: 'in_progress'
      });
    }
  };

  const completeExercise = (score: number) => {
    const newTotalScore = totalScore + score;
    setTotalScore(newTotalScore);
    setExerciseScore(score);

    const nextIndex = currentExerciseIndex + 1;
    setCurrentExerciseIndex(nextIndex);

    if (user?.id) {
      const timeSpent = startTime ? Math.floor((Date.now() - startTime.getTime()) / 1000) : 0;
      
      LessonService.updateLessonProgress(user.id, lessonId, {
        total_score: newTotalScore,
        exercise_completed: nextIndex,
        time_spent_seconds: timeSpent,
        status: nextIndex >= (exercises ? exercises.length : 0) ? 'completed' : 'in_progress'
      });
    }

    if (nextIndex >= (exercises ? exercises.length : 0)) {
      // Lesson completed
      const finalScore = Math.round((newTotalScore / maxPossibleScore) * 100);
      Alert.alert(
        'Lesson Complete! 🎓',
        `Congratulations! You completed the lesson with a score of ${finalScore}%`,
        [
          {
            text: 'Review Vocabulary',
            onPress: () => setShowVocabularyModal(true)
          },
          {
            text: 'Done',
            onPress: () => navigation.goBack()
          }
        ]
      );
    }
  };

  const renderExercise = (exercise: LessonExercise) => {
    switch (exercise.exercise_type) {
      case 'flashcard_match':
        return <FlashcardMatchExercise exercise={exercise} onComplete={completeExercise} />;
      case 'multiple_choice':
        return <MultipleChoiceExercise exercise={exercise} onComplete={completeExercise} />;
      case 'fill_in_blank':
        return <FillInBlankExercise exercise={exercise} onComplete={completeExercise} />;
      case 'typing':
        return <TypingExercise exercise={exercise} onComplete={completeExercise} />;
      case 'sentence_ordering':
        return <SentenceOrderingExercise exercise={exercise} onComplete={completeExercise} />;
      case 'memory_game':
        return <MemoryGameExercise exercise={exercise} onComplete={completeExercise} />;
      case 'word_scramble':
        return <WordScrambleExercise exercise={exercise} onComplete={completeExercise} />;
      case 'speed_challenge':
        return <SpeedChallengeExercise exercise={exercise} onComplete={completeExercise} />;
      default:
        return <Text>Unknown exercise type</Text>;
    }
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#6366f1" />
          <Text style={styles.loadingText}>Loading lesson...</Text>
        </View>
      </SafeAreaView>
    );
  }

  if (error || !lesson) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.errorContainer}>
          <Ionicons name="alert-circle" size={64} color="#ef4444" />
          <Text style={styles.errorText}>{error || 'Lesson not found'}</Text>
          <TouchableOpacity style={styles.retryButton} onPress={loadLesson}>
            <Text style={styles.retryButtonText}>Retry</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  const currentExercise = exercises && exercises.length > 0 ? exercises[currentExerciseIndex] : null;
  const progressPercentage = exercises && exercises.length > 0 ? (currentExerciseIndex / exercises.length) * 100 : 0;

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
          <Ionicons name="arrow-back" size={24} color="#6366f1" />
        </TouchableOpacity>
        <View style={styles.headerInfo}>
          <Text style={styles.lessonTitle}>{lesson.title}</Text>
          <Text style={styles.lessonSubject}>{lesson.subject}</Text>
        </View>
        <TouchableOpacity style={styles.vocabButton} onPress={() => setShowVocabularyModal(true)}>
          <Ionicons name="book" size={24} color="#6366f1" />
        </TouchableOpacity>
      </View>

      {/* Progress Bar */}
      <View style={styles.progressContainer}>
        <View style={styles.progressBar}>
          <View style={[styles.progressFill, { width: `${progressPercentage}%` }]} />
        </View>
        <Text style={styles.progressText}>
          Exercise {currentExerciseIndex + 1} of {exercises ? exercises.length : 0}
        </Text>
      </View>

      {/* Score Display */}
      <View style={styles.scoreContainer}>
        <Text style={styles.scoreText}>Score: {totalScore}/{maxPossibleScore}</Text>
        <Text style={styles.scoreText}>Progress: {Math.round(progressPercentage)}%</Text>
      </View>

      {/* Content */}
      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {!startTime ? (
          <View style={styles.startContainer}>
            <Text style={styles.startTitle}>Ready to start?</Text>
            <Text style={styles.startDescription}>
              This lesson will teach you {vocabulary ? vocabulary.length : 0} key terms in {lesson.subject}.
              Estimated time: {lesson.estimated_duration} minutes
            </Text>
            <TouchableOpacity style={styles.startButton} onPress={startLesson}>
              <Text style={styles.startButtonText}>Start Lesson</Text>
            </TouchableOpacity>
          </View>
        ) : currentExercise ? (
          <View style={styles.exerciseContainer}>
            <Text style={styles.exerciseTitle}>Exercise {currentExerciseIndex + 1}</Text>
            {renderExercise(currentExercise)}
          </View>
        ) : (
          <View style={styles.completeContainer}>
            <Text style={styles.completeTitle}>Lesson Complete!</Text>
            <Text style={styles.completeScore}>Final Score: {totalScore}/{maxPossibleScore}</Text>
          </View>
        )}
      </ScrollView>

      {/* Vocabulary Modal */}
      <Modal
        visible={showVocabularyModal}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={() => setShowVocabularyModal(false)}
      >
        <SafeAreaView style={styles.modalContainer}>
          <View style={styles.modalHeader}>
            <TouchableOpacity onPress={() => setShowVocabularyModal(false)} style={styles.closeButton}>
              <Ionicons name="close" size={24} color="#64748b" />
            </TouchableOpacity>
            <Text style={styles.modalTitle}>Lesson Vocabulary</Text>
            <View style={styles.placeholder} />
          </View>
          
          <ScrollView style={styles.modalContent} showsVerticalScrollIndicator={false}>
            {(vocabulary || []).map((item, index) => (
              <View key={item.id} style={styles.vocabItem}>
                <Text style={styles.vocabTerm}>{item.english_term}</Text>
                <Text style={styles.vocabDefinition}>{item.definition}</Text>
                <Text style={styles.vocabTranslation}>{item.native_translation}</Text>
                <Text style={styles.vocabExample}>{item.example_sentence_en}</Text>
                <Text style={styles.vocabExampleNative}>{item.example_sentence_native}</Text>
              </View>
            ))}
          </ScrollView>
        </SafeAreaView>
      </Modal>
    </SafeAreaView>
  );
}

// Exercise Components
const FlashcardMatchExercise = ({ exercise, onComplete }: { exercise: LessonExercise, onComplete: (score: number) => void }) => {
  const [selectedPairs, setSelectedPairs] = useState<{ [key: string]: string }>({});
  const [completed, setCompleted] = useState(false);

  const handlePairSelect = (english: string, native: string) => {
    setSelectedPairs(prev => ({ ...prev, [english]: native }));
  };

  const checkAnswers = () => {
    const pairs = exercise.exercise_data.pairs;
    let correct = 0;
    
    pairs.forEach((pair: { english: string; native: string }) => {
      if (selectedPairs[pair.english] === pair.native) {
        correct++;
      }
    });

    const score = Math.round((correct / pairs.length) * exercise.points);
    setCompleted(true);
    onComplete(score);
  };

  return (
    <View style={styles.exerciseContent}>
      <Text style={styles.exercisePrompt}>{exercise.exercise_data.prompt}</Text>
      
      {exercise.exercise_data.pairs.map((pair: { english: string; native: string }, index: number) => (
        <View key={index} style={styles.pairContainer}>
          <Text style={styles.pairEnglish}>{pair.english}</Text>
          <Text style={styles.pairArrow}>→</Text>
          <Text style={styles.pairNative}>{pair.native}</Text>
        </View>
      ))}

      {!completed && (
        <TouchableOpacity style={styles.checkButton} onPress={checkAnswers}>
          <Text style={styles.checkButtonText}>Check Answers</Text>
        </TouchableOpacity>
      )}
    </View>
  );
};

const MultipleChoiceExercise = ({ exercise, onComplete }: { exercise: LessonExercise, onComplete: (score: number) => void }) => {
  const [selectedAnswer, setSelectedAnswer] = useState<string | null>(null);
  const [completed, setCompleted] = useState(false);

  const handleAnswerSelect = (answer: string) => {
    setSelectedAnswer(answer);
  };

  const checkAnswer = () => {
    if (!selectedAnswer) return;
    
    const isCorrect = selectedAnswer === exercise.exercise_data.correct_answer;
    const score = isCorrect ? exercise.points : 0;
    
    setCompleted(true);
    onComplete(score);
  };

  return (
    <View style={styles.exerciseContent}>
      <Text style={styles.exercisePrompt}>{exercise.exercise_data.prompt}</Text>
      
      {exercise.exercise_data.options.map((option: string, index: number) => (
        <TouchableOpacity
          key={index}
          style={[
            styles.optionButton,
            selectedAnswer === option && styles.selectedOption
          ]}
          onPress={() => handleAnswerSelect(option)}
        >
          <Text style={[
            styles.optionText,
            selectedAnswer === option && styles.selectedOptionText
          ]}>
            {option}
          </Text>
        </TouchableOpacity>
      ))}

      {selectedAnswer && !completed && (
        <TouchableOpacity style={styles.checkButton} onPress={checkAnswer}>
          <Text style={styles.checkButtonText}>Check Answer</Text>
        </TouchableOpacity>
      )}
    </View>
  );
};

const FillInBlankExercise = ({ exercise, onComplete }: { exercise: LessonExercise, onComplete: (score: number) => void }) => {
  const [selectedAnswer, setSelectedAnswer] = useState<string | null>(null);
  const [completed, setCompleted] = useState(false);

  const handleAnswerSelect = (answer: string) => {
    setSelectedAnswer(answer);
  };

  const checkAnswer = () => {
    if (!selectedAnswer) return;
    
    const isCorrect = selectedAnswer === exercise.exercise_data.correct_answer;
    const score = isCorrect ? exercise.points : 0;
    
    setCompleted(true);
    onComplete(score);
  };

  const sentenceParts = exercise.exercise_data.sentence.split('____');

  return (
    <View style={styles.exerciseContent}>
      <Text style={styles.exercisePrompt}>Complete the sentence:</Text>
      
      <View style={styles.sentenceContainer}>
        <Text style={styles.sentenceText}>{sentenceParts[0]}</Text>
        <View style={styles.blankContainer}>
          <Text style={styles.blankText}>____</Text>
        </View>
        <Text style={styles.sentenceText}>{sentenceParts[1]}</Text>
      </View>

      {exercise.exercise_data.options.map((option: string, index: number) => (
        <TouchableOpacity
          key={index}
          style={[
            styles.optionButton,
            selectedAnswer === option && styles.selectedOption
          ]}
          onPress={() => handleAnswerSelect(option)}
        >
          <Text style={[
            styles.optionText,
            selectedAnswer === option && styles.selectedOptionText
          ]}>
            {option}
          </Text>
        </TouchableOpacity>
      ))}

      {selectedAnswer && !completed && (
        <TouchableOpacity style={styles.checkButton} onPress={checkAnswer}>
          <Text style={styles.checkButtonText}>Check Answer</Text>
        </TouchableOpacity>
      )}
    </View>
  );
};

const TypingExercise = ({ exercise, onComplete }: { exercise: LessonExercise, onComplete: (score: number) => void }) => {
  const [userInput, setUserInput] = useState('');
  const [completed, setCompleted] = useState(false);

  const checkAnswer = () => {
    if (!userInput.trim()) return;
    
    const isCorrect = userInput.trim().toLowerCase() === exercise.exercise_data.correct_answer.toLowerCase();
    const score = isCorrect ? exercise.points : 0;
    
    setCompleted(true);
    onComplete(score);
  };

  return (
    <View style={styles.exerciseContent}>
      <Text style={styles.exercisePrompt}>{exercise.exercise_data.prompt}</Text>
      
      {exercise.exercise_data.hint && (
        <Text style={styles.hintText}>Hint: {exercise.exercise_data.hint}</Text>
      )}

      <TextInput
        style={styles.typingInput}
        value={userInput}
        onChangeText={setUserInput}
        placeholder="Type your answer..."
        autoCapitalize="none"
        autoCorrect={false}
      />

      {userInput.trim() && !completed && (
        <TouchableOpacity style={styles.checkButton} onPress={checkAnswer}>
          <Text style={styles.checkButtonText}>Check Answer</Text>
        </TouchableOpacity>
      )}
    </View>
  );
};

const SentenceOrderingExercise = ({ exercise, onComplete }: { exercise: LessonExercise, onComplete: (score: number) => void }) => {
  const [orderedWords, setOrderedWords] = useState<string[]>([]);
  const [availableWords, setAvailableWords] = useState<string[]>(exercise.exercise_data.words);
  const [completed, setCompleted] = useState(false);

  const handleWordSelect = (word: string, index: number) => {
    setOrderedWords(prev => [...prev, word]);
    setAvailableWords(prev => prev.filter((_, i) => i !== index));
  };

  const handleWordRemove = (index: number) => {
    const word = orderedWords[index];
    setOrderedWords(prev => prev.filter((_, i) => i !== index));
    setAvailableWords(prev => [...prev, word]);
  };

  const checkAnswer = () => {
    if (orderedWords.length !== exercise.exercise_data.correct_order.length) return;
    
    let correct = 0;
    orderedWords.forEach((word, index) => {
      if (word === exercise.exercise_data.correct_order[index]) {
        correct++;
      }
    });

    const score = Math.round((correct / exercise.exercise_data.correct_order.length) * exercise.points);
    setCompleted(true);
    onComplete(score);
  };

  return (
    <View style={styles.exerciseContent}>
      <Text style={styles.exercisePrompt}>{exercise.exercise_data.prompt}</Text>
      
      {exercise.exercise_data.hint && (
        <Text style={styles.hintText}>Hint: {exercise.exercise_data.hint}</Text>
      )}

      <View style={styles.orderingContainer}>
        <Text style={styles.orderingLabel}>Your sentence:</Text>
        <View style={styles.orderedWordsContainer}>
          {orderedWords.map((word, index) => (
            <TouchableOpacity
              key={index}
              style={styles.orderedWord}
              onPress={() => handleWordRemove(index)}
            >
              <Text style={styles.orderedWordText}>{word}</Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>

      <View style={styles.orderingContainer}>
        <Text style={styles.orderingLabel}>Available words:</Text>
        <View style={styles.availableWordsContainer}>
          {availableWords.map((word, index) => (
            <TouchableOpacity
              key={index}
              style={styles.availableWord}
              onPress={() => handleWordSelect(word, index)}
            >
              <Text style={styles.availableWordText}>{word}</Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>

      {orderedWords.length > 0 && !completed && (
        <TouchableOpacity style={styles.checkButton} onPress={checkAnswer}>
          <Text style={styles.checkButtonText}>Check Answer</Text>
        </TouchableOpacity>
      )}
    </View>
  );
};

// Game Exercise Components
const MemoryGameExercise = ({ exercise, onComplete }: { exercise: LessonExercise, onComplete: (score: number) => void }) => {
  const [flippedCards, setFlippedCards] = useState<number[]>([]);
  const [matchedPairs, setMatchedPairs] = useState<number[]>([]);
  const [moves, setMoves] = useState(0);
  const [completed, setCompleted] = useState(false);

  const cards: Array<{ id: number; pairId: number; content: string }> = exercise.exercise_data.cards || [];

  const handleCardPress = (cardId: number) => {
    if (flippedCards.length === 2 || flippedCards.includes(cardId) || matchedPairs.includes(cardId) || completed) {
      return;
    }

    const newFlippedCards = [...flippedCards, cardId];
    setFlippedCards(newFlippedCards);

    if (newFlippedCards.length === 2) {
      setMoves(moves + 1);
      
      setTimeout(() => {
        const [card1, card2] = newFlippedCards;
        const card1Data = cards.find((c: { id: number; pairId: number; content: string }) => c.id === card1);
        const card2Data = cards.find((c: { id: number; pairId: number; content: string }) => c.id === card2);
        
        if (card1Data && card2Data && card1Data.pairId === card2Data.pairId) {
          setMatchedPairs([...matchedPairs, ...newFlippedCards]);
          if (matchedPairs.length + 2 >= cards.length) {
            setCompleted(true);
            onComplete(exercise.points);
          }
        } else {
          setFlippedCards([]);
        }
      }, 1000);
    }
  };

  const isCardFlipped = (cardId: number) => {
    return flippedCards.includes(cardId) || matchedPairs.includes(cardId);
  };

  const getCardContent = (cardId: number) => {
    const card = cards.find((c: { id: number; pairId: number; content: string }) => c.id === cardId);
    if (!card) return '';
    
    if (isCardFlipped(cardId)) {
      return card.content;
    }
    return '?';
  };

  return (
    <View style={styles.exerciseContent}>
      <Text style={styles.exercisePrompt}>{exercise.exercise_data.prompt}</Text>
      
      <View style={styles.memoryGameGrid}>
        {cards.map((card: { id: number; pairId: number; content: string }) => (
          <TouchableOpacity
            key={card.id}
            style={[
              styles.memoryCard,
              isCardFlipped(card.id) && styles.memoryCardFlipped,
              matchedPairs.includes(card.id) && styles.memoryCardMatched
            ]}
            onPress={() => handleCardPress(card.id)}
            disabled={matchedPairs.includes(card.id)}
          >
            <Text style={[
              styles.memoryCardText,
              isCardFlipped(card.id) && styles.memoryCardTextFlipped
            ]}>
              {getCardContent(card.id)}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      <View style={styles.memoryGameStats}>
        <Text style={styles.memoryGameStat}>Moves: {moves}</Text>
        <Text style={styles.memoryGameStat}>Pairs: {matchedPairs.length / 2}/{cards.length / 2}</Text>
      </View>
    </View>
  );
};

const WordScrambleExercise = ({ exercise, onComplete }: { exercise: LessonExercise, onComplete: (score: number) => void }) => {
  const [currentWordIndex, setCurrentWordIndex] = useState(0);
  const [userAnswer, setUserAnswer] = useState('');
  const [score, setScore] = useState(0);
  const [completed, setCompleted] = useState(false);

  const words = exercise.exercise_data.words || [];
  const currentWord = words[currentWordIndex];

  const checkAnswer = () => {
    if (!userAnswer.trim()) return;
    
    const isCorrect = userAnswer.trim().toLowerCase() === currentWord.term.toLowerCase();
    const newScore = score + (isCorrect ? 1 : 0);
    setScore(newScore);

    if (currentWordIndex < words.length - 1) {
      setCurrentWordIndex(currentWordIndex + 1);
      setUserAnswer('');
    } else {
      setCompleted(true);
      const finalScore = Math.round((newScore / words.length) * exercise.points);
      onComplete(finalScore);
    }
  };

  if (completed) {
    return (
      <View style={styles.exerciseContent}>
        <Text style={styles.exercisePrompt}>Word Scramble Complete!</Text>
        <Text style={styles.completeScore}>Score: {score}/{words.length}</Text>
      </View>
    );
  }

  return (
    <View style={styles.exerciseContent}>
      <Text style={styles.exercisePrompt}>{exercise.exercise_data.prompt}</Text>
      
      <View style={styles.wordScrambleProgress}>
        <Text style={styles.progressText}>
          {currentWordIndex + 1} of {words.length}
        </Text>
        <View style={styles.progressBar}>
          <View 
            style={[
              styles.progressFill, 
              { width: `${((currentWordIndex + 1) / words.length) * 100}%` }
            ]} 
          />
        </View>
      </View>

      <View style={styles.wordScrambleCard}>
        <Text style={styles.hintText}>{currentWord.hint}</Text>
        
        <TextInput
          style={styles.typingInput}
          value={userAnswer}
          onChangeText={setUserAnswer}
          placeholder="Type your answer here..."
          autoCapitalize="none"
          autoCorrect={false}
        />

        <TouchableOpacity 
          style={styles.checkButton} 
          onPress={checkAnswer}
          disabled={!userAnswer.trim()}
        >
          <Text style={styles.checkButtonText}>Check Answer</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};

const SpeedChallengeExercise = ({ exercise, onComplete }: { exercise: LessonExercise, onComplete: (score: number) => void }) => {
  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [selectedAnswer, setSelectedAnswer] = useState<string | null>(null);
  const [score, setScore] = useState(0);
  const [timeLeft, setTimeLeft] = useState(exercise.exercise_data.timeLimit || 60);
  const [completed, setCompleted] = useState(false);

  const questions = exercise.exercise_data.questions || [];
  const currentQuestionData = questions[currentQuestion];

  useEffect(() => {
    if (completed || timeLeft <= 0) return;

    const timer = setInterval(() => {
      setTimeLeft((prev: number) => {
        if (prev <= 1) {
          setCompleted(true);
          onComplete(score);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [timeLeft, completed, score, onComplete]);

  const handleAnswerSelect = (answer: string) => {
    if (completed) return;
    
    setSelectedAnswer(answer);
    const isCorrect = answer === currentQuestionData.correctAnswer;
    const newScore = score + (isCorrect ? 1 : 0);
    setScore(newScore);

    setTimeout(() => {
      if (currentQuestion < questions.length - 1) {
        setCurrentQuestion(currentQuestion + 1);
        setSelectedAnswer(null);
      } else {
        setCompleted(true);
        onComplete(newScore);
      }
    }, 1000);
  };

  if (completed) {
    return (
      <View style={styles.exerciseContent}>
        <Text style={styles.exercisePrompt}>Speed Challenge Complete!</Text>
        <Text style={styles.completeScore}>Score: {score}/{questions.length}</Text>
        <Text style={styles.completeScore}>Time: {exercise.exercise_data.timeLimit - timeLeft}s</Text>
      </View>
    );
  }

  return (
    <View style={styles.exerciseContent}>
      <Text style={styles.exercisePrompt}>{exercise.exercise_data.prompt}</Text>
      
      <View style={styles.speedChallengeHeader}>
        <Text style={styles.speedChallengeScore}>Score: {score}</Text>
        <Text style={styles.speedChallengeTime}>Time: {timeLeft}s</Text>
      </View>

      <View style={styles.speedChallengeQuestion}>
        <Text style={styles.questionText}>{currentQuestionData.question}</Text>
        
        {currentQuestionData.options.map((option: string, index: number) => (
          <TouchableOpacity
            key={index}
            style={[
              styles.optionButton,
              selectedAnswer === option && styles.selectedOption
            ]}
            onPress={() => handleAnswerSelect(option)}
          >
            <Text style={[
              styles.optionText,
              selectedAnswer === option && styles.selectedOptionText
            ]}>
              {option}
            </Text>
          </TouchableOpacity>
        ))}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8fafc',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 15,
    backgroundColor: '#ffffff',
    borderBottomWidth: 1,
    borderBottomColor: '#e2e8f0',
  },
  backButton: {
    padding: 8,
  },
  headerInfo: {
    flex: 1,
    marginLeft: 12,
  },
  lessonTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1e293b',
  },
  lessonSubject: {
    fontSize: 14,
    color: '#64748b',
  },
  vocabButton: {
    padding: 8,
  },
  progressContainer: {
    paddingHorizontal: 20,
    paddingVertical: 15,
    backgroundColor: '#ffffff',
  },
  progressBar: {
    height: 8,
    backgroundColor: '#e2e8f0',
    borderRadius: 4,
    marginBottom: 8,
  },
  progressFill: {
    height: '100%',
    backgroundColor: '#6366f1',
    borderRadius: 4,
  },
  progressText: {
    fontSize: 14,
    color: '#64748b',
    textAlign: 'center',
  },
  scoreContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    paddingVertical: 15,
    backgroundColor: '#ffffff',
    borderBottomWidth: 1,
    borderBottomColor: '#e2e8f0',
  },
  scoreText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#6366f1',
  },
  content: {
    flex: 1,
    padding: 20,
  },
  startContainer: {
    alignItems: 'center',
    paddingVertical: 40,
  },
  startTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#1e293b',
    marginBottom: 16,
  },
  startDescription: {
    fontSize: 16,
    color: '#64748b',
    textAlign: 'center',
    marginBottom: 32,
    lineHeight: 24,
  },
  startButton: {
    backgroundColor: '#6366f1',
    paddingHorizontal: 32,
    paddingVertical: 16,
    borderRadius: 12,
  },
  startButtonText: {
    color: '#ffffff',
    fontSize: 18,
    fontWeight: '600',
  },
  exerciseContainer: {
    paddingVertical: 20,
  },
  exerciseTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#1e293b',
    marginBottom: 20,
    textAlign: 'center',
  },
  exerciseContent: {
    backgroundColor: '#ffffff',
    borderRadius: 16,
    padding: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
  },
  exercisePrompt: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1e293b',
    marginBottom: 24,
    textAlign: 'center',
  },
  pairContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#e2e8f0',
  },
  pairEnglish: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1e293b',
    flex: 1,
  },
  pairArrow: {
    fontSize: 18,
    color: '#6366f1',
    marginHorizontal: 16,
  },
  pairNative: {
    fontSize: 16,
    color: '#64748b',
    flex: 1,
    textAlign: 'right',
  },
  optionButton: {
    backgroundColor: '#f1f5f9',
    paddingVertical: 16,
    paddingHorizontal: 20,
    borderRadius: 12,
    marginBottom: 12,
    borderWidth: 2,
    borderColor: 'transparent',
  },
  selectedOption: {
    borderColor: '#6366f1',
    backgroundColor: '#f0f4ff',
  },
  optionText: {
    fontSize: 16,
    color: '#1e293b',
    textAlign: 'center',
  },
  selectedOptionText: {
    color: '#6366f1',
    fontWeight: '600',
  },
  sentenceContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 24,
    flexWrap: 'wrap',
  },
  sentenceText: {
    fontSize: 16,
    color: '#1e293b',
  },
  blankContainer: {
    backgroundColor: '#f1f5f9',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
    marginHorizontal: 8,
  },
  blankText: {
    fontSize: 16,
    color: '#6366f1',
    fontWeight: '600',
  },
  typingInput: {
    backgroundColor: '#ffffff',
    borderWidth: 2,
    borderColor: '#e2e8f0',
    borderRadius: 12,
    paddingHorizontal: 20,
    paddingVertical: 16,
    fontSize: 16,
    marginBottom: 24,
    textAlign: 'center',
  },
  hintText: {
    fontSize: 14,
    color: '#64748b',
    fontStyle: 'italic',
    marginBottom: 20,
    textAlign: 'center',
  },
  orderingContainer: {
    marginBottom: 20,
  },
  orderingLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1e293b',
    marginBottom: 12,
  },
  orderedWordsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginBottom: 16,
  },
  orderedWord: {
    backgroundColor: '#6366f1',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 20,
    marginRight: 8,
    marginBottom: 8,
  },
  orderedWordText: {
    color: '#ffffff',
    fontSize: 14,
    fontWeight: '600',
  },
  availableWordsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  availableWord: {
    backgroundColor: '#f1f5f9',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 20,
    marginRight: 8,
    marginBottom: 8,
    borderWidth: 2,
    borderColor: '#e2e8f0',
  },
  availableWordText: {
    color: '#1e293b',
    fontSize: 14,
    fontWeight: '500',
  },
  checkButton: {
    backgroundColor: '#10b981',
    paddingVertical: 16,
    paddingHorizontal: 32,
    borderRadius: 12,
    marginTop: 20,
  },
  checkButtonText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '600',
    textAlign: 'center',
  },
  completeContainer: {
    alignItems: 'center',
    paddingVertical: 40,
  },
  completeTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#10b981',
    marginBottom: 16,
  },
  completeScore: {
    fontSize: 18,
    color: '#1e293b',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    fontSize: 16,
    color: '#64748b',
    marginTop: 16,
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 40,
  },
  errorText: {
    fontSize: 16,
    color: '#64748b',
    textAlign: 'center',
    marginTop: 16,
    marginBottom: 24,
  },
  retryButton: {
    backgroundColor: '#6366f1',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
  },
  retryButtonText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '600',
  },
  modalContainer: {
    flex: 1,
    backgroundColor: '#f8fafc',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 15,
    backgroundColor: '#ffffff',
    borderBottomWidth: 1,
    borderBottomColor: '#e2e8f0',
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#1e293b',
  },
  closeButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#f1f5f9',
    justifyContent: 'center',
    alignItems: 'center',
  },
  placeholder: {
    width: 40,
  },
  modalContent: {
    flex: 1,
    padding: 20,
  },
  vocabItem: {
    backgroundColor: '#ffffff',
    borderRadius: 16,
    padding: 20,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
  },
  vocabTerm: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1e293b',
    marginBottom: 8,
  },
  vocabDefinition: {
    fontSize: 16,
    color: '#475569',
    marginBottom: 12,
    lineHeight: 22,
  },
  vocabTranslation: {
    fontSize: 16,
    color: '#6366f1',
    fontWeight: '600',
    marginBottom: 12,
  },
  vocabExample: {
    fontSize: 14,
    color: '#64748b',
    fontStyle: 'italic',
    marginBottom: 8,
    lineHeight: 20,
  },
  vocabExampleNative: {
    fontSize: 14,
    color: '#64748b',
    fontStyle: 'italic',
    lineHeight: 20,
  },
  // Memory Game Styles
  memoryGameGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    marginBottom: 20,
  },
  memoryCard: {
    width: 70,
    height: 70,
    backgroundColor: '#6366f1',
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
    margin: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  memoryCardFlipped: {
    backgroundColor: '#ffffff',
    borderWidth: 2,
    borderColor: '#6366f1',
  },
  memoryCardMatched: {
    backgroundColor: '#10b981',
    borderColor: '#10b981',
  },
  memoryCardText: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#ffffff',
    textAlign: 'center',
  },
  memoryCardTextFlipped: {
    color: '#6366f1',
    fontSize: 10,
  },
  memoryGameStats: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    backgroundColor: '#f1f5f9',
    padding: 12,
    borderRadius: 8,
  },
  memoryGameStat: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1e293b',
  },
  // Word Scramble Styles
  wordScrambleProgress: {
    width: '100%',
    alignItems: 'center',
    marginBottom: 20,
  },
  wordScrambleCard: {
    backgroundColor: '#ffffff',
    padding: 20,
    borderRadius: 12,
    width: '100%',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  // Speed Challenge Styles
  speedChallengeHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    backgroundColor: '#f1f5f9',
    padding: 12,
    borderRadius: 8,
    marginBottom: 20,
  },
  speedChallengeScore: {
    fontSize: 16,
    fontWeight: '600',
    color: '#10b981',
  },
  speedChallengeTime: {
    fontSize: 16,
    fontWeight: '600',
    color: '#ef4444',
  },
  speedChallengeQuestion: {
    width: '100%',
  },
  questionText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1e293b',
    marginBottom: 20,
    textAlign: 'center',
  },
});
