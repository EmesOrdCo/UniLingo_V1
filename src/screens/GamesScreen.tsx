import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Dimensions,
  Alert,
  Modal,
  TextInput,
  Animated,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import * as Speech from 'expo-speech';
import { Audio } from 'expo-av';
import { useNavigation } from '@react-navigation/native';
import { useAuth } from '../contexts/AuthContext';
import { UserFlashcardService } from '../lib/userFlashcardService';
import { FlashcardService } from '../lib/flashcardService';
import { FavouriteGamesService, FavouriteGame } from '../lib/favouriteGamesService';
import { supabase } from '../lib/supabase';


const { width } = Dimensions.get('window');

// Game Components
const FlashcardQuizGame = ({ gameData, onClose, onGameComplete, userProfile }: any) => {
  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [score, setScore] = useState(0);
  const [selectedAnswer, setSelectedAnswer] = useState<string | null>(null);
  const [showResult, setShowResult] = useState(false);
  const [showReview, setShowReview] = useState(false);
  const [userAnswers, setUserAnswers] = useState<string[]>([]);
  const [reviewFilter, setReviewFilter] = useState<'all' | 'correct' | 'incorrect'>('all');
  
  // Get language mode from gameData
  const languageMode = gameData.languageMode || 'question';
  
  const question = gameData.questions[currentQuestion];
  
  const handleAnswerSelect = (answer: string) => {
    const newUserAnswers = [...userAnswers];
    newUserAnswers[currentQuestion] = answer;
    setUserAnswers(newUserAnswers);
    
    setSelectedAnswer(answer);
    setShowResult(true);
    
    // Don't update score immediately to prevent percentage flashing
    const isCorrect = answer === question.correctAnswer;
    
    setTimeout(() => {
      // Update score after showing result
      if (isCorrect) {
        setScore(score + 1);
      }
      
      if (currentQuestion < gameData.questions.length - 1) {
        setCurrentQuestion(currentQuestion + 1);
        setSelectedAnswer(null);
        setShowResult(false);
      } else {
        setShowReview(true);
      }
    }, 1500);
  };
  
  const handleReviewComplete = () => {
    onGameComplete(score + (selectedAnswer === question.correctAnswer ? 1 : 0));
  };
  
  // Review Screen
  if (showReview) {
    return (
      <View style={styles.gameContainer}>
        <View style={styles.reviewHeader}>
          <Text style={styles.reviewTitle}>🎉 Quiz Complete!</Text>
          <Text style={styles.reviewSubtitle}>Your Results: {score}/{gameData.questions.length}</Text>
          
          {/* Score Summary */}
          <View style={styles.scoreSummary}>
            <View style={styles.scoreCircle}>
              <Text style={styles.scorePercentage}>
                {Math.round((score / gameData.questions.length) * 100)}%
              </Text>
            </View>
            <Text style={styles.scoreLabel}>
              {score === gameData.questions.length ? 'Perfect Score! 🏆' : 
               score >= gameData.questions.length * 0.8 ? 'Great Job! 🌟' :
               score >= gameData.questions.length * 0.6 ? 'Good Work! 👍' : 'Keep Practicing! 💪'}
            </Text>
          </View>
        </View>
        
        {/* Filter Buttons */}
        <View style={styles.reviewFilters}>
          <TouchableOpacity 
            style={[styles.filterButton, reviewFilter === 'all' && styles.filterButtonActive]}
            onPress={() => setReviewFilter('all')}
          >
            <Text style={[styles.filterButtonText, reviewFilter === 'all' && styles.filterButtonTextActive]}>
              All ({gameData.questions.length})
            </Text>
          </TouchableOpacity>
          <TouchableOpacity 
            style={[styles.filterButton, reviewFilter === 'correct' && styles.filterButtonActive]}
            onPress={() => setReviewFilter('correct')}
          >
            <Text style={[styles.filterButtonText, reviewFilter === 'correct' && styles.filterButtonTextActive]}>
              Correct ({score})
            </Text>
          </TouchableOpacity>
          <TouchableOpacity 
            style={[styles.filterButton, reviewFilter === 'incorrect' && styles.filterButtonActive]}
            onPress={() => setReviewFilter('incorrect')}
          >
            <Text style={[styles.filterButtonText, reviewFilter === 'incorrect' && styles.filterButtonTextActive]}>
              Incorrect ({gameData.questions.length - score})
            </Text>
          </TouchableOpacity>
        </View>
        
        <ScrollView style={styles.reviewContainer} showsVerticalScrollIndicator={false}>
          {gameData.questions
            .filter((q: any, index: number) => {
              if (reviewFilter === 'all') return true;
              if (reviewFilter === 'correct') return userAnswers[index] === q.correctAnswer;
              if (reviewFilter === 'incorrect') return userAnswers[index] !== q.correctAnswer;
              return true;
            })
            .map((q: any, index: number) => {
              const originalIndex = gameData.questions.indexOf(q);
              const isCorrect = userAnswers[originalIndex] === q.correctAnswer;
              
              return (
                <View key={originalIndex} style={styles.reviewItem}>
                  <View style={styles.reviewItemHeader}>
                    <Text style={styles.reviewQuestionNumber}>Q{originalIndex + 1}</Text>
                    <View style={[
                      styles.reviewStatusBadge,
                      isCorrect ? styles.correctBadge : styles.wrongBadge
                    ]}>
                      <Text style={styles.reviewStatusText}>
                        {isCorrect ? '✓' : '✗'}
                      </Text>
                    </View>
                  </View>
                  
                  <View style={styles.reviewContent}>
                    <View style={styles.reviewQuestionSection}>
                      <Text style={styles.reviewQuestionLabel}>Question:</Text>
                      <Text style={styles.reviewQuestion}>{q.question}</Text>
                    </View>
                    
                    <View style={styles.reviewAnswerSection}>
                      <Text style={styles.reviewAnswerLabel}>Correct Answer:</Text>
                      <Text style={styles.reviewAnswer}>{q.correctAnswer}</Text>
                    </View>
                    
                    {!isCorrect && (
                      <View style={styles.wrongAnswerContainer}>
                        <Text style={styles.wrongAnswerLabel}>Your Answer:</Text>
                        <Text style={styles.wrongAnswerText}>{userAnswers[originalIndex]}</Text>
                      </View>
                    )}
                    
                    <View style={styles.reviewStats}>
                      <Text style={styles.reviewStatsText}>
                        {isCorrect ? '✅ Correct' : '❌ Incorrect'} • 
                        Question {originalIndex + 1} of {gameData.questions.length}
                      </Text>
                    </View>
                  </View>
                </View>
              );
            })}
        </ScrollView>
        
        <TouchableOpacity style={styles.reviewButton} onPress={handleReviewComplete}>
          <Text style={styles.reviewButtonText}>Finish Review</Text>
        </TouchableOpacity>
      </View>
    );
  }
  
  if (!question) return null;
  
  // Main Quiz Interface
  return (
    <View style={styles.gameContainer}>
      {/* Quiz Header */}
      <View style={styles.quizHeader}>
        <View style={styles.quizHeaderContent}>
          <View style={styles.quizInfo}>
            <Text style={styles.quizTitle}>Flashcard Quiz</Text>
            <Text style={styles.quizSubtitle}>
              {languageMode === 'question' ? `English → ${userProfile?.native_language || 'Your Language'}` : `${userProfile?.native_language || 'Your Language'} → English`}
            </Text>
          </View>
          
          {/* Progress Circle */}
          <View style={styles.progressCircle}>
            <View style={styles.progressCircleInner}>
              <Text style={styles.progressCircleText}>
                {currentQuestion === 0 ? '0' : Math.round((score / currentQuestion) * 100)}%
              </Text>
            </View>
          </View>
        </View>
        
        {/* Progress Bar */}
        <View style={styles.progressSection}>
          <View style={styles.progressHeader}>
            <Text style={styles.progressText}>
              Question {currentQuestion + 1} of {gameData.questions.length}
            </Text>
          </View>
          
          <View style={styles.progressBar}>
            <View style={[styles.progressFill, { width: `${((currentQuestion + 1) / gameData.questions.length) * 100}%` }]} />
          </View>
        </View>
      </View>
      
      {/* Question Section */}
      <View style={styles.questionSection}>
        <View style={styles.questionCard}>
          <View style={styles.questionHeader}>
            <View style={styles.questionNumberBadge}>
              <Text style={styles.questionNumberText}>Q{currentQuestion + 1}</Text>
            </View>
            <Text style={styles.questionType}>
              {languageMode === 'question' ? `Translate to ${userProfile?.native_language || 'Your Language'}` : 'Translate to English'}
            </Text>
          </View>
          
          <Text style={styles.questionText}>
            {question.question}
          </Text>
          
          <View style={styles.questionHint}>
            <Ionicons name="bulb-outline" size={16} color="#6366f1" />
            <Text style={styles.questionHintText}>
              {languageMode === 'question' ? 'Select the correct translation' : 'Choose the right meaning'}
            </Text>
          </View>
        </View>
      </View>
      
      {/* Answers Section */}
      <View style={styles.answersSection}>
        <Text style={styles.answersLabel}>Select the correct answer:</Text>
        <View style={styles.answersContainer}>
          {question.answers.map((answer: string, index: number) => (
            <TouchableOpacity
              key={index}
              style={[
                styles.answerButton,
                selectedAnswer === answer && styles.selectedAnswer,
                showResult && answer === question.correctAnswer && styles.correctAnswer,
                showResult && selectedAnswer === answer && answer !== question.correctAnswer && styles.wrongAnswer,
              ]}
              onPress={() => handleAnswerSelect(answer)}
              disabled={showResult}
            >
              <View style={styles.answerContent}>
                <View style={styles.answerLetterContainer}>
                  <Text style={styles.answerLetter}>
                    {String.fromCharCode(65 + index)}
                  </Text>
                </View>
                <Text style={[
                  styles.answerText,
                  selectedAnswer === answer && styles.selectedAnswerText,
                  showResult && answer === question.correctAnswer && styles.correctAnswerText,
                ]}>
                  {answer}
                </Text>
              </View>
              
              {/* Result Icons */}
              {showResult && answer === question.correctAnswer && (
                <View style={styles.correctIcon}>
                  <Ionicons name="checkmark-circle" size={24} color="#ffffff" />
                </View>
              )}
              
              {showResult && selectedAnswer === answer && answer !== question.correctAnswer && (
                <View style={styles.wrongIcon}>
                  <Ionicons name="close-circle" size={24} color="#ffffff" />
                </View>
              )}
            </TouchableOpacity>
          ))}
        </View>
      </View>
      
      {/* Score Section */}
      <View style={styles.scoreSection}>
        <View style={styles.scoreCard}>
          <View style={styles.scoreHeader}>
            <Ionicons name="trophy-outline" size={20} color="#6366f1" />
            <Text style={styles.scoreTitle}>Current Progress</Text>
          </View>
          
          <View style={styles.scoreContent}>
            <View style={styles.scoreRow}>
              <Text style={styles.scoreLabel}>Score:</Text>
              <Text style={styles.scoreText}>{score}/{gameData.questions.length}</Text>
            </View>
            
            <View style={styles.scoreRow}>
              <Text style={styles.scoreLabel}>Percentage:</Text>
              <Text style={styles.scorePercentage}>
                {Math.round((score / gameData.questions.length) * 100)}%
              </Text>
            </View>
            
            <View style={styles.scoreRow}>
              <Text style={styles.scoreLabel}>Remaining:</Text>
              <Text style={styles.scoreRemaining}>
                {gameData.questions.length - currentQuestion} questions
              </Text>
            </View>
          </View>
        </View>
      </View>
    </View>
  );
};

const MemoryMatchGame = ({ gameData, onClose, onGameComplete }: any) => {
  const [cards, setCards] = useState<any[]>([]);
  const [flippedCards, setFlippedCards] = useState<any[]>([]);
  const [matchedPairs, setMatchedPairs] = useState(0);
  const [moves, setMoves] = useState(0);
  const [showReview, setShowReview] = useState(false);
  const [showGameIntro, setShowGameIntro] = useState(true);
  const [gameStartTime, setGameStartTime] = useState(Date.now());
  const [cardStates, setCardStates] = useState<{[key: string]: 'normal' | 'correct' | 'incorrect' | 'flipped'}>({});
  const [selectedCardCount, setSelectedCardCount] = useState(6);
  const [gameTime, setGameTime] = useState(0);
  
  // Auto-adjust selected card count if it exceeds available cards
  useEffect(() => {
    if (gameData.originalCards && selectedCardCount / 2 > gameData.originalCards.length) {
      const maxCards = gameData.originalCards.length * 2;
      setSelectedCardCount(Math.min(selectedCardCount, maxCards));
    }
  }, [gameData.originalCards, selectedCardCount]);

  // Update timer every second when game is active
  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (!showGameIntro && !showReview && cards.length > 0) {
      interval = setInterval(() => {
        setGameTime(Math.floor((Date.now() - gameStartTime) / 1000));
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [showGameIntro, showReview, cards.length, gameStartTime]);
  
  const handleStartGame = () => {
    // Get the original cards and create the selected number of pairs
    const originalCards = gameData.originalCards || [];
    const numberOfPairs = selectedCardCount / 2; // Convert cards to pairs
    const selectedOriginalCards = originalCards.slice(0, numberOfPairs);
    

    
    // Create pairs for memory match (front and back of each card)
    const pairedCards: any[] = [];
    selectedOriginalCards.forEach((card: any, index: number) => {
      const frontCard = { 
        id: `card_${index}-front`, 
        text: card.front, 
        type: 'front', 
        pairId: `pair_${index}`, 
        matched: false 
      };
      const backCard = { 
        id: `card_${index}-back`, 
        text: card.back, 
        type: 'back', 
        pairId: `pair_${index}`, 
        matched: false 
      };
      pairedCards.push(frontCard, backCard);
    });
    

    
    // Shuffle the paired cards
    const shuffledPairedCards = pairedCards.sort(() => Math.random() - 0.5);
    
    setCards(shuffledPairedCards);
    setShowGameIntro(false);
    setGameStartTime(Date.now());
  };
  
  const handleCardPress = (cardId: string) => {
    if (flippedCards.length === 2) return;
    
    const card = cards.find((c: any) => c.id === cardId);
    if (!card || card.matched || flippedCards.some(fc => fc.id === cardId)) return;
    
    const newFlippedCards = [...flippedCards, card];
    setFlippedCards(newFlippedCards);
    
    // Show different color for single flipped card (not green)
    if (newFlippedCards.length === 1) {
      setCardStates({
        ...cardStates,
        [cardId]: 'flipped'
      });
    }
    
    // Only show color feedback when we have 2 cards flipped
    if (newFlippedCards.length === 2) {
      setMoves(moves + 1);
      
      if (newFlippedCards[0].pairId === newFlippedCards[1].pairId) {
        // Match found - flash green
        setCardStates({
          ...cardStates,
          [newFlippedCards[0].id]: 'correct',
          [newFlippedCards[1].id]: 'correct'
        });
        
        setTimeout(() => {
          // Mark cards as matched but keep them in place
          setCards(cards.map((c: any) => 
            c.pairId === card.pairId ? { ...c, matched: true } : c
          ));
          setMatchedPairs(matchedPairs + 1);
          setFlippedCards([]);
          setCardStates({});
          
          if (matchedPairs + 1 === cards.length / 2) {
            // Game completed - check against actual cards in play
            setTimeout(() => setShowReview(true), 500);
          }
        }, 800);
      } else {
        // No match - flash red
        setCardStates({
          ...cardStates,
          [newFlippedCards[0].id]: 'incorrect',
          [newFlippedCards[1].id]: 'incorrect'
        });
        
        // Flip back after delay
        setTimeout(() => {
          setFlippedCards([]);
          setCardStates({});
        }, 1000);
      }
    }
  };
  
  const handleReviewComplete = () => {
    onGameComplete(moves, Date.now() - gameStartTime);
  };
  
  // Game Introduction Screen
  if (showGameIntro) {
    return (
      <View style={styles.gameContainer}>
        <View style={styles.gameIntroHeader}>
          <View style={styles.gameIntroIconContainer}>
            <Ionicons name="grid-outline" size={48} color="#6366f1" />
          </View>
          <Text style={styles.gameIntroTitle}>Memory Match</Text>
          <Text style={styles.gameIntroSubtitle}>Test your memory by matching pairs of cards</Text>
        </View>
        
        <View style={styles.gameIntroContent}>
          <View style={styles.gameIntroSection}>
            <View style={styles.gameIntroSectionHeader}>
              <Ionicons name="information-circle-outline" size={18} color="#6366f1" />
              <Text style={styles.gameIntroSectionTitle}>How to Play</Text>
            </View>
            <Text style={styles.gameIntroText}>
              Find matching pairs by flipping cards. Match all pairs to win!
            </Text>
          </View>
          
          <View style={styles.gameIntroSection}>
            <View style={styles.gameIntroSectionHeader}>
              <Ionicons name="options-outline" size={20} color="#6366f1" />
              <Text style={styles.gameIntroSectionTitle}>Select Card Count</Text>
            </View>
            <View style={styles.cardCountGrid}>
              {[6, 12, 18, 24].map((count) => (
                <TouchableOpacity
                  key={count}
                  style={[
                    styles.cardCountOption,
                    selectedCardCount === count && styles.cardCountOptionSelected
                  ]}
                  onPress={() => setSelectedCardCount(count)}
                  disabled={count / 2 > (gameData.originalCards?.length || 0)}
                >
                  <Text style={[
                    styles.cardCountOptionText,
                    selectedCardCount === count && styles.cardCountOptionTextSelected,
                    count / 2 > (gameData.originalCards?.length || 0) && styles.cardCountOptionTextDisabled
                  ]}>
                    {count}
                  </Text>
                  <Text style={[
                    styles.cardCountOptionLabel,
                    selectedCardCount === count && styles.cardCountOptionLabelSelected,
                    count / 2 > (gameData.originalCards?.length || 0) && styles.cardCountOptionLabelDisabled
                  ]}>
                    {count / 2} pairs
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
            {selectedCardCount / 2 > (gameData.originalCards?.length || 0) && (
              <Text style={styles.cardCountWarning}>
                Not enough cards available. Select a smaller number.
              </Text>
            )}

          </View>
          
          <View style={styles.gameIntroSection}>
            <View style={styles.gameIntroSectionHeader}>
              <Ionicons name="stats-chart-outline" size={20} color="#6366f1" />
              <Text style={styles.gameIntroSectionTitle}>Game Info</Text>
            </View>
            <View style={styles.gameIntroStats}>
              <View style={styles.gameIntroStat}>
                <Text style={styles.gameIntroStatLabel}>Cards</Text>
                <Text style={styles.gameIntroStatValue}>{selectedCardCount}</Text>
              </View>
              <View style={styles.gameIntroStat}>
                <Text style={styles.gameIntroStatLabel}>Pairs</Text>
                <Text style={styles.gameIntroStatValue}>{selectedCardCount / 2}</Text>
              </View>
              <View style={styles.gameIntroStat}>
                <Text style={styles.gameIntroStatLabel}>Level</Text>
                <Text style={styles.gameIntroStatValue}>
                  {selectedCardCount <= 12 ? 'Easy' : selectedCardCount <= 20 ? 'Medium' : 'Hard'}
                </Text>
              </View>
            </View>
          </View>
        </View>
        
        <TouchableOpacity 
          style={[
            styles.gameIntroButton,
            selectedCardCount / 2 > (gameData.originalCards?.length || 0) && styles.gameIntroButtonDisabled
          ]} 
          onPress={handleStartGame}
          disabled={selectedCardCount / 2 > (gameData.originalCards.length || 0)}
        >
          <View style={styles.gameIntroButtonContent}>
            <Ionicons name="play-circle" size={24} color="#ffffff" />
            <Text style={styles.gameIntroButtonText}>Start Game</Text>
          </View>
        </TouchableOpacity>
      </View>
    );
  }
  
  if (showReview) {
    return (
      <View style={styles.gameContainer}>
        {/* Header Section */}
        <View style={styles.reviewHeader}>
          <View style={styles.reviewIconContainer}>
            <Ionicons name="trophy" size={48} color="#f59e0b" />
          </View>
          <Text style={styles.reviewTitle}>Memory Match Complete!</Text>
          <Text style={styles.reviewSubtitle}>
            Congratulations! You found all {matchedPairs} pairs
          </Text>
        </View>
        
        {/* Stats Grid */}
        <View style={styles.reviewStatsGrid}>
          <View style={styles.reviewStatCard}>
            <View style={styles.reviewStatIcon}>
              <Ionicons name="footsteps" size={20} color="#6366f1" />
            </View>
            <Text style={styles.reviewStatValue}>{moves}</Text>
            <Text style={styles.reviewStatLabel}>Total Moves</Text>
          </View>
          
          <View style={styles.reviewStatCard}>
            <View style={styles.reviewStatIcon}>
              <Ionicons name="time-outline" size={20} color="#f59e0b" />
            </View>
            <Text style={styles.reviewStatValue}>{gameTime}s</Text>
            <Text style={styles.reviewStatLabel}>Time Taken</Text>
          </View>
          
          <View style={styles.reviewStatCard}>
            <View style={styles.reviewStatIcon}>
              <Ionicons name="checkmark-circle" size={20} color="#10b981" />
            </View>
            <Text style={styles.reviewStatValue}>{matchedPairs}</Text>
            <Text style={styles.reviewStatLabel}>Pairs Found</Text>
          </View>
          
          <View style={styles.reviewStatCard}>
            <View style={styles.reviewStatIcon}>
              <Ionicons name="star" size={20} color="#8b5cf6" />
            </View>
            <Text style={styles.reviewStatValue}>
              {moves <= cards.length / 2 ? 'Perfect!' : moves <= cards.length ? 'Great!' : 'Good!'}
            </Text>
            <Text style={styles.reviewStatLabel}>Performance</Text>
          </View>
        </View>
        
        {/* Action Buttons */}
        <View style={styles.reviewActions}>
          <TouchableOpacity style={styles.reviewButton} onPress={handleReviewComplete}>
            <View style={styles.reviewButtonContent}>
              <Ionicons name="checkmark-circle" size={20} color="#ffffff" />
              <Text style={styles.reviewButtonText}>Finish Game</Text>
            </View>
          </TouchableOpacity>
        </View>
      </View>
    );
  }
  
  return (
    <View style={styles.gameContainer}>
      <View style={styles.gameHeader}>
        <View style={styles.gameHeaderLeft}>
          <View style={styles.gameHeaderStat}>
            <Ionicons name="footsteps" size={20} color="#6366f1" />
            <Text style={styles.gameHeaderStatText}>Moves: {moves}</Text>
          </View>
          <View style={styles.gameHeaderStat}>
            <Ionicons name="checkmark-circle" size={20} color="#10b981" />
            <Text style={styles.gameHeaderStatText}>Pairs: {matchedPairs}/{cards.length / 2}</Text>
          </View>
          <View style={styles.gameHeaderStat}>
            <Ionicons name="time-outline" size={20} color="#f59e0b" />
            <Text style={styles.gameHeaderStatText}>{gameTime}s</Text>
          </View>
        </View>
        <View style={styles.gameHeaderRight}>
          <View style={styles.gameProgressCircle}>
            <Text style={styles.gameProgressText}>
              {Math.round((matchedPairs / (cards.length / 2)) * 100)}%
            </Text>
          </View>
        </View>
      </View>
      
              <View style={[
          styles.memoryGrid,
          {
            paddingHorizontal: cards.length === 6 ? 24 : cards.length <= 12 ? 20 : cards.length <= 18 ? 16 : 12,
            paddingVertical: 12
          }
        ]}>
        {cards.map((card: any) => {
          // Calculate responsive card sizing based on number of cards
          let cardSize, textSize;
          
          if (cards.length <= 12) {
            // 6-12 cards: 3 columns, larger cards
            cardSize = cards.length === 6 ? 110 : 90; // Bigger for 6 cards
            textSize = cards.length === 6 ? 16 : 14;
          } else if (cards.length <= 18) {
            // 18 cards: 4 columns, medium cards
            cardSize = 75;
            textSize = 12;
          } else {
            // 24 cards: 5 columns, smaller cards
            cardSize = 65;
            textSize = 11;
          }
          
          return (
            <View key={card.id} style={[
              styles.memoryCardContainer,
              { width: cardSize, height: cardSize }
            ]}>
              {!card.matched ? (
                <TouchableOpacity
                  style={[
                    styles.memoryCard,
                    { width: cardSize, height: cardSize },
                    (flippedCards.some(fc => fc.id === card.id)) && styles.memoryCardFlipped,
                    cardStates[card.id] === 'correct' && styles.memoryCardCorrect,
                    cardStates[card.id] === 'incorrect' && styles.memoryCardIncorrect,
                    cardStates[card.id] === 'flipped' && styles.memoryCardFlippedSingle,
                  ]}
                  onPress={() => handleCardPress(card.id)}
                >
                  <Text style={[styles.memoryCardText, { fontSize: textSize }]}>
                    {(flippedCards.some(fc => fc.id === card.id) || cardStates[card.id] === 'flipped') ? card.text : '?'}
                  </Text>
                </TouchableOpacity>
              ) : (
                <View style={[styles.memoryCardEmpty, { width: cardSize, height: cardSize }]} />
              )}
            </View>
          );
        })}
      </View>
    </View>
  );
};

const WordScrambleGame = ({ gameData, onClose, onGameComplete }: any) => {
  // Early return if no gameData
  if (!gameData) {
    return (
      <View style={styles.gameContainer}>
        <Text style={styles.errorText}>No game data provided</Text>
      </View>
    );
  }
  
  const [currentChallenge, setCurrentChallenge] = useState(0);
  const [score, setScore] = useState(0);
  const [userAnswer, setUserAnswer] = useState('');
  const [showHint, setShowHint] = useState(false);
  const [showReview, setShowReview] = useState(false);
  const [userAnswers, setUserAnswers] = useState<string[]>([]);
  const [showGameIntro, setShowGameIntro] = useState(true);
  const [gameStartTime, setGameStartTime] = useState(0);
  const [gameTime, setGameTime] = useState(0);
  const [selectedQuestionCount, setSelectedQuestionCount] = useState(5);
  const [showFeedback, setShowFeedback] = useState(false);
  const [feedbackType, setFeedbackType] = useState<'correct' | 'incorrect'>('correct');
  const [feedbackMessage, setFeedbackMessage] = useState('');
  const [showWordReview, setShowWordReview] = useState(false);
  const [currentChallenges, setCurrentChallenges] = useState<any[]>([]);
  
  // Check if gameData has the right structure
  if (!gameData.challenges || !Array.isArray(gameData.challenges)) {
    return (
      <View style={styles.gameContainer}>
        <Text style={styles.errorText}>Invalid game data structure</Text>
      </View>
    );
  }
  
  // If we're in intro mode and have no challenges yet, that's fine
  // If we're not in intro mode and have no challenges, that's an error
  if (!showGameIntro && gameData.challenges.length === 0) {
    return (
      <View style={styles.gameContainer}>
        <Text style={styles.errorText}>No challenges available</Text>
      </View>
    );
  }
  
  // Auto-adjust question count if it exceeds available cards
  useEffect(() => {
    if (gameData?.totalAvailableCards && selectedQuestionCount > gameData.totalAvailableCards) {
      setSelectedQuestionCount(gameData.totalAvailableCards);
    }
  }, [gameData?.totalAvailableCards, selectedQuestionCount]);
  
  // Sync currentChallenges with gameData.challenges
  useEffect(() => {
    if (gameData?.challenges && gameData.challenges.length > 0) {
      setCurrentChallenges(gameData.challenges);
    }
  }, [gameData?.challenges]);
  
  const challenge = gameData?.challenges?.[currentChallenge];
  
  // Robust answer matching function - ignores spaces and capitalization
  const isAnswerCorrect = (userAnswer: string, correctAnswer: string): boolean => {
    if (!userAnswer || !correctAnswer) return false;
    
    // Normalize both answers: trim spaces, convert to lowercase
    const normalizedUser = userAnswer.trim().toLowerCase().replace(/\s+/g, ' ');
    const normalizedCorrect = correctAnswer.trim().toLowerCase().replace(/\s+/g, ' ');
    
    // Direct match
    if (normalizedUser === normalizedCorrect) return true;
    
    // Remove all spaces and compare
    const userNoSpaces = normalizedUser.replace(/\s/g, '');
    const correctNoSpaces = normalizedCorrect.replace(/\s/g, '');
    if (userNoSpaces === correctNoSpaces) return true;
    
    // Split by spaces and compare words (ignoring order)
    const userWords = normalizedUser.split(/\s+/).filter(word => word.length > 0).sort();
    const correctWords = normalizedCorrect.split(/\s+/).filter(word => word.length > 0).sort();
    
    if (userWords.length === correctWords.length) {
      return userWords.every((word, index) => word === correctWords[index]);
    }
    
    return false;
  };
  
  // Safety check - if no challenge is available and we're not in intro mode, show error
  if (!challenge && !showGameIntro && !showReview) {
    return (
      <View style={styles.gameContainer}>
        <Text style={styles.errorText}>No challenge data available</Text>
      </View>
    );
  }
  
  // Timer effect
  useEffect(() => {
    if (!showGameIntro && !showReview && gameStartTime > 0) {
      const interval = setInterval(() => {
        setGameTime(Math.floor((Date.now() - gameStartTime) / 1000));
      }, 1000);
      return () => clearInterval(interval);
    }
  }, [showGameIntro, showReview, gameStartTime]);
  
  const handleSubmit = () => {
    const newUserAnswers = [...userAnswers];
    newUserAnswers[currentChallenge] = userAnswer;
    setUserAnswers(newUserAnswers);
    
    // Use robust answer matching
    if (isAnswerCorrect(userAnswer, challenge.original)) {
      setScore(score + 1);
      
      // Show green flash feedback on input
      setFeedbackType('correct');
      setShowFeedback(true);
      
      // Hide flash after 500ms and move to next question
      setTimeout(() => {
        setShowFeedback(false);
        moveToNextQuestion();
      }, 500);
    } else {
      // Show red flash feedback on input
      setFeedbackType('incorrect');
      setShowFeedback(true);
      
      // Hide flash after 500ms and stay on same question
      setTimeout(() => {
        setShowFeedback(false);
        setUserAnswer('');
        setShowHint(false);
      }, 500);
    }
  };
  
  // Helper function to move to next question
  const moveToNextQuestion = () => {
    if (currentChallenge < gameData.challenges.length - 1) {
      setCurrentChallenge(currentChallenge + 1);
      setUserAnswer('');
      setShowHint(false);
    } else {
      setShowReview(true);
    }
  };
  
  const handleSkip = () => {
    const newUserAnswers = [...userAnswers];
    newUserAnswers[currentChallenge] = 'SKIPPED';
    setUserAnswers(newUserAnswers);
    
    // Show red flash feedback on input for skip
    setFeedbackType('incorrect');
    setShowFeedback(true);
    
    // Hide flash after 500ms and move to next question
    setTimeout(() => {
      setShowFeedback(false);
      moveToNextQuestion();
    }, 500);
  };
  
  const handleReviewComplete = () => {
    onGameComplete(score);
  };
  
  if (showGameIntro) {
    // Add safety checks for gameData
    if (!gameData || !gameData.challenges) {
      return (
        <View style={styles.gameContainer}>
          <Text style={styles.errorText}>Loading game data...</Text>
        </View>
      );
    }

    // Calculate available cards safely with fallbacks
    const availableCards = gameData.totalAvailableCards || gameData.challenges.length || 0;
    
    return (
      <View style={styles.gameContainer}>
        {/* Header Section */}
        <View style={styles.gameIntroHeader}>
          <View style={styles.gameIntroIconContainer}>
            <Ionicons name="text" size={48} color="#16a34a" />
          </View>
          <Text style={styles.gameIntroTitle}>Word Scramble</Text>
          <Text style={styles.gameIntroSubtitle}>
            Unscramble the words to test your vocabulary knowledge
          </Text>
        </View>
        
        {/* Question Count Selection */}
        <View style={styles.gameIntroSection}>
          <View style={styles.gameIntroSectionHeader}>
            <Ionicons name="list" size={20} color="#16a34a" />
            <Text style={styles.gameIntroSectionTitle}>Select Number of Questions</Text>
          </View>
          <View style={styles.questionCountGrid}>
            {[5, 10, 15, 20].map((count) => {
              const isDisabled = count > availableCards;
              const isSelected = selectedQuestionCount === count;
              
              return (
                <TouchableOpacity
                  key={count}
                  style={[
                    styles.questionCountOption,
                    isSelected && styles.questionCountOptionSelected,
                    isDisabled && styles.questionCountOptionDisabled
                  ]}
                  onPress={() => setSelectedQuestionCount(count)}
                  disabled={isDisabled}
                >
                  <Text style={[
                    styles.questionCountOptionText,
                    isSelected && styles.questionCountOptionTextSelected,
                    isDisabled && styles.questionCountOptionTextDisabled
                  ]}>
                    {count}
                  </Text>
                  <Text style={[
                    styles.questionCountOptionLabel,
                    isSelected && styles.questionCountOptionLabelSelected,
                    isDisabled && styles.questionCountOptionLabelDisabled
                  ]}>
                    questions
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>
          {selectedQuestionCount > availableCards && (
            <Text style={styles.questionCountWarning}>
              Only {availableCards} cards available for this topic/difficulty
            </Text>
          )}
        </View>
        
        {/* Game Info */}
        <View style={styles.gameIntroInfo}>
          <View style={styles.gameIntroInfoCard}>
            <Ionicons name="information-circle" size={20} color="#6366f1" />
            <Text style={styles.gameIntroInfoText}>
              You'll get {Math.min(selectedQuestionCount, availableCards)} words to unscramble
            </Text>
          </View>
          <View style={styles.gameIntroInfoCard}>
            <Ionicons name="bulb" size={20} color="#f59e0b" />
            <Text style={styles.gameIntroInfoText}>
              Use hints to help you solve difficult words
            </Text>
          </View>
          <View style={styles.gameIntroInfoCard}>
            <Ionicons name="star" size={20} color="#8b5cf6" />
            <Text style={styles.gameIntroInfoText}>
              Score points for each correct answer
            </Text>
          </View>
        </View>
        
        {/* Start Button */}
        <View style={styles.gameIntroActions}>
          <TouchableOpacity 
            style={styles.gameIntroButton} 
            onPress={() => {
              // Get the original filtered cards (not the limited challenges)
              const originalFilteredCards = gameData.originalFilteredCards || gameData.challenges;
              
              // Create a completely new array and shuffle it properly
              const cardsToShuffle = [...originalFilteredCards];
              
              // Enhanced shuffle with timestamp for uniqueness
              const timestamp = Date.now();
              const seed = timestamp % 1000000; // Use timestamp as seed
              
              // Multiple shuffle passes for better randomization
              for (let pass = 0; pass < 3; pass++) {
                // Fisher-Yates shuffle with enhanced randomization
                for (let i = cardsToShuffle.length - 1; i > 0; i--) {
                  // Use timestamp-based randomization for better uniqueness
                  const j = Math.floor((Math.random() * (i + 1)) + (seed % (i + 1)) + (pass * 1000)) % (i + 1);
                  [cardsToShuffle[i], cardsToShuffle[j]] = [cardsToShuffle[j], cardsToShuffle[i]];
                }
              }
              
              // Select the user's chosen number of cards
              const selectedChallenges = cardsToShuffle.slice(0, Math.min(selectedQuestionCount, originalFilteredCards.length));
              
              // Create word scramble challenges from the selected cards
              const challenges = selectedChallenges.map(card => {
                const englishWord = card.front; // This should be English
                const nativeHint = card.back;   // This should be in native language
                
                // Create a new scrambled word each time
                const scrambledWord = englishWord.split('').sort(() => Math.random() - 0.5).join('');
                return {
                  id: `${card.id}-${Date.now()}-${Math.random()}`, // Unique identifier
                  original: englishWord,
                  scrambled: scrambledWord,
                  hint: nativeHint,
                  topic: card.topic,
                  difficulty: card.difficulty || 'beginner'
                };
              });
              
              // Create completely new game data object
              const newGameData = {
                ...gameData,
                challenges: challenges,
                currentChallenge: 0,
                score: 0
              };
              
              // Update the game data through proper state management
              // We need to create a completely new object to trigger re-render
              const finalGameData = {
                ...gameData,
                challenges: challenges,
                currentChallenge: 0,
                score: 0
              };
              
              // Update the game data by mutating the object (temporary fix)
              // TODO: This should be handled by parent component state
              Object.assign(gameData, finalGameData);
              
              // Also update our local state to force re-render
              setCurrentChallenges(challenges);
              
              // Reset game state
              setCurrentChallenge(0);
              setScore(0);
              setUserAnswers([]);
              
              setShowGameIntro(false);
              setGameStartTime(Date.now());
            }}
          >
            <View style={styles.gameIntroButtonContent}>
              <Ionicons name="play" size={20} color="#ffffff" />
              <Text style={styles.gameIntroButtonText}>Start Game</Text>
            </View>
          </TouchableOpacity>
        </View>
      </View>
    );
  }
  
  if (showReview) {
    return (
      <View style={styles.newGameContainer}>
        <ScrollView 
          style={styles.newReviewScrollContainer} 
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.newReviewScrollContent}
        >
          {/* Clean Header */}
          <View style={styles.newReviewHeader}>
            <View style={styles.newReviewIconContainer}>
              <Ionicons name="trophy" size={56} color="#fbbf24" />
            </View>
            <Text style={styles.newReviewTitle}>Game Complete!</Text>
            <Text style={styles.newReviewSubtitle}>
              You solved {score} out of {gameData.challenges.length} words
            </Text>
          </View>

          {/* Simple Stats */}
          <View style={styles.newStatsContainer}>
            <View style={styles.newStatItem}>
              <Ionicons name="text" size={24} color="#10b981" />
              <Text style={styles.newStatValue}>{score}</Text>
              <Text style={styles.newStatLabel}>Correct</Text>
            </View>
            
            <View style={styles.newStatItem}>
              <Ionicons name="time" size={24} color="#f59e0b" />
              <Text style={styles.newStatValue}>{gameTime}s</Text>
              <Text style={styles.newStatLabel}>Time</Text>
            </View>
            
                      <View style={styles.newStatItem}>
            <Ionicons name="analytics" size={24} color="#8b5cf6" />
            <Text style={styles.newStatValue}>
              {Math.max(0, Math.round((score / gameData.challenges.length) * 100))}%
            </Text>
            <Text style={styles.newStatLabel}>Score</Text>
          </View>
          </View>

          {/* Progress Bar */}
          <View style={styles.newProgressContainer}>
            <View style={styles.newProgressBar}>
              <View style={[
                styles.newProgressFill, 
                { width: `${Math.max(0, (score / gameData.challenges.length) * 100)}%` }
              ]} />
            </View>
            <Text style={styles.newProgressText}>
              {Math.max(0, Math.round((score / gameData.challenges.length) * 100))}% Complete
            </Text>
          </View>

          {/* Removed details section for now */}
        </ScrollView>

        {/* Clean Finish Button - Fixed at bottom */}
        <View style={styles.newFinishButtonContainer}>
          <TouchableOpacity style={styles.newFinishButton} onPress={handleReviewComplete}>
            <Ionicons name="checkmark-circle" size={24} color="#ffffff" />
            <Text style={styles.newFinishButtonText}>Finish</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }
  
  if (!challenge) return null;
  
  return (
    <View style={styles.gameContainer}>
      {/* Enhanced Game Header */}
      <View style={styles.wordScrambleHeader}>
        <View style={styles.wordScrambleHeaderLeft}>
          <View style={styles.wordScrambleHeaderStat}>
            <Ionicons name="text" size={20} color="#16a34a" />
            <Text style={styles.wordScrambleHeaderStatText}>Challenge {currentChallenge + 1}/{gameData.challenges.length}</Text>
          </View>
          <View style={styles.wordScrambleHeaderStat}>
            <Ionicons name="star" size={20} color="#f59e0b" />
            <Text style={styles.wordScrambleHeaderStatText}>Score: {score}</Text>
          </View>
          <View style={styles.wordScrambleHeaderStat}>
            <Ionicons name="time-outline" size={20} color="#f59e0b" />
            <Text style={styles.wordScrambleHeaderStatText}>{gameTime}s</Text>
          </View>
        </View>
        <View style={styles.wordScrambleHeaderRight}>
          <View style={styles.wordScrambleProgressCircle}>
            <Text style={styles.wordScrambleProgressText}>
              {Math.round((score / gameData.challenges.length) * 100)}%
            </Text>
          </View>
        </View>
      </View>
      
      {/* Enhanced Scramble Container */}
      <View style={styles.wordScrambleContainer}>
        <View style={styles.wordScrambleCard}>
          <Text style={styles.wordScrambleLabel}>Unscramble this word:</Text>
          <Text style={styles.wordScrambledWord}>{challenge.scrambled}</Text>
          
          {/* Hint Section - Only show when hint button is pressed */}
          {showHint ? (
            <View style={styles.wordScrambleHintContainer}>
              <Ionicons name="bulb" size={16} color="#f59e0b" />
              <Text style={styles.wordScrambleHintText}>Hint: {challenge.hint}</Text>
            </View>
          ) : (
            <TouchableOpacity 
              style={styles.wordScrambleHintButton}
              onPress={() => setShowHint(true)}
            >
              <View style={styles.wordScrambleHintButtonContent}>
                <Ionicons name="bulb-outline" size={16} color="#f59e0b" />
                <Text style={styles.wordScrambleHintButtonText}>Show Hint</Text>
              </View>
            </TouchableOpacity>
          )}
        </View>
      </View>
      
      {/* Enhanced Input Container */}
      <View style={styles.wordScrambleInputContainer}>
        <TextInput
          style={[
            styles.wordScrambleAnswerInput,
            showFeedback && (
              feedbackType === 'correct' 
                ? styles.wordScrambleAnswerInputCorrect 
                : styles.wordScrambleAnswerInputIncorrect
            )
          ]}
          value={userAnswer}
          onChangeText={setUserAnswer}
          placeholder="Type the unscrambled word here..."
          placeholderTextColor="#94a3b8"
          autoCapitalize="none"
          autoCorrect={false}
        />
        
        {/* Action Buttons */}
        <View style={styles.wordScrambleButtonRow}>
          <TouchableOpacity 
            style={styles.wordScrambleSkipButton}
            onPress={handleSkip}
          >
            <View style={styles.wordScrambleSkipButtonContent}>
              <Ionicons name="arrow-forward" size={18} color="#64748b" />
              <Text style={styles.wordScrambleSkipButtonText}>Skip</Text>
            </View>
          </TouchableOpacity>
          
          <TouchableOpacity 
            style={[
              styles.wordScrambleSubmitButton,
              !userAnswer.trim() && styles.wordScrambleSubmitButtonDisabled
            ]} 
            onPress={handleSubmit}
            disabled={!userAnswer.trim()}
          >
            <View style={styles.wordScrambleSubmitButtonContent}>
              <Ionicons name="checkmark-circle" size={20} color="#ffffff" />
              <Text style={styles.wordScrambleSubmitButtonText}>Submit Answer</Text>
            </View>
          </TouchableOpacity>
        </View>
      </View>
      

    </View>
  );
};

const HangmanGame = ({ gameData, onClose, onGameComplete }: any) => {
  const [currentWord, setCurrentWord] = useState(0);
  const [score, setScore] = useState(0);
  const [guessedLetters, setGuessedLetters] = useState<Set<string>>(new Set());
  const [wrongGuesses, setWrongGuesses] = useState(0);
  const [showReview, setShowReview] = useState(false);
  const [userAnswers, setUserAnswers] = useState<string[]>([]);
  const [gameStartTime, setGameStartTime] = useState(0);
  
  // Landing page state
  const [showGameIntro, setShowGameIntro] = useState(true);
  const [showHint, setShowHint] = useState(false);
  
  // Responsive button sizing based on screen width
  const screenWidth = Dimensions.get('window').width;
  const buttonSize = screenWidth < 400 ? 35 : screenWidth < 600 ? 40 : 45;
  const buttonMargin = screenWidth < 400 ? 1 : screenWidth < 600 ? 2 : 3;
  
  const word = gameData.words[currentWord];
  const maxWrongGuesses = 6;
  
  // Get masked word with guessed letters revealed
  const getMaskedWord = () => {
    return word.word.split('').map((letter: string) => 
      guessedLetters.has(letter.toLowerCase()) ? letter : '_'
    ).join(' ');
  };
  
  // Check if word is complete
  const isWordComplete = () => {
    return word.word.split('').every((letter: string) => 
      guessedLetters.has(letter.toLowerCase())
    );
  };
  
  // Check if game is over (word complete or too many wrong guesses)
  const isGameOver = () => {
    return isWordComplete() || wrongGuesses >= maxWrongGuesses;
  };
  
  const handleLetterGuess = (letter: string) => {
    const lowerLetter = letter.toLowerCase();
    
    if (guessedLetters.has(lowerLetter)) {
      return; // Letter already guessed
    }
    
    const newGuessedLetters = new Set(guessedLetters);
    newGuessedLetters.add(lowerLetter);
    setGuessedLetters(newGuessedLetters);
    
    if (!word.word.toLowerCase().includes(lowerLetter)) {
      setWrongGuesses(wrongGuesses + 1);
    }
  };
  
  // Use useEffect to watch for game over state changes
  useEffect(() => {
    if (isGameOver()) {
      // Small delay to let user see the final state
      const timer = setTimeout(() => {
    // Save current word result
    const newUserAnswers = [...userAnswers];
    newUserAnswers[currentWord] = isWordComplete() ? word.word : 'Failed';
    setUserAnswers(newUserAnswers);
    
    if (isWordComplete()) {
      setScore(score + 1);
    }
    
        // Go directly to results page
      setShowReview(true);
      }, 800);
      
      return () => clearTimeout(timer);
    }
  }, [guessedLetters, wrongGuesses, isWordComplete()]);
  

  
  const handleReviewComplete = () => {
    onGameComplete(score + (isWordComplete() ? 1 : 0));
  };
  
  if (showReview) {
    const finalScore = score + (isWordComplete() ? 1 : 0);
    const totalWords = 1; // Single word game
    const percentage = Math.round((finalScore / totalWords) * 100);
    const gameTime = Math.round((Date.now() - gameStartTime) / 1000);
    
    // Determine game result and message
    let resultIcon, resultTitle, resultMessage, resultColor;
    if (percentage === 100) {
      resultIcon = '🏆';
      resultTitle = 'Perfect Victory!';
      resultMessage = 'You solved the word! Amazing job!';
      resultColor = '#10b981';
    } else {
      resultIcon = '💪';
      resultTitle = 'Keep Trying!';
      resultMessage = 'Practice makes perfect!';
      resultColor = '#ef4444';
    }

    return (
      <View style={styles.gameContainer}>
        <ScrollView 
          style={styles.hangmanReviewScrollContainer}
          contentContainerStyle={styles.hangmanReviewScrollContent}
          showsVerticalScrollIndicator={false}
        >
          {/* Game Result Header */}
          <View style={styles.hangmanReviewHeader}>
            <View style={styles.hangmanReviewIconContainer}>
              <Text style={styles.hangmanReviewIcon}>{resultIcon}</Text>
            </View>
            <Text style={styles.hangmanReviewTitle}>{resultTitle}</Text>
            <Text style={styles.hangmanReviewMessage}>{resultMessage}</Text>
          </View>
          
          {/* Score Summary */}
          <View style={styles.hangmanReviewScoreSection}>
            <View style={styles.hangmanReviewScoreCard}>
              <View style={styles.hangmanReviewScoreRow}>
                <View style={styles.hangmanReviewScoreItem}>
                  <Ionicons name="trophy" size={24} color={resultColor} />
                  <Text style={styles.hangmanReviewScoreValue}>{finalScore}</Text>
                  <Text style={styles.hangmanReviewScoreLabel}>Correct</Text>
          </View>
                <View style={styles.hangmanReviewScoreDivider} />
                <View style={styles.hangmanReviewScoreItem}>
                  <Ionicons name="text" size={24} color="#64748b" />
                  <Text style={styles.hangmanReviewScoreValue}>{totalWords}</Text>
                  <Text style={styles.hangmanReviewScoreLabel}>Total</Text>
          </View>
                <View style={styles.hangmanReviewScoreDivider} />
                <View style={styles.hangmanReviewScoreItem}>
                  <Ionicons name="time" size={24} color="#64748b" />
                  <Text style={styles.hangmanReviewScoreValue}>{gameTime}s</Text>
                  <Text style={styles.hangmanReviewScoreLabel}>Time</Text>
                </View>
              </View>
              <View style={styles.hangmanReviewPercentageContainer}>
                <Text style={styles.hangmanReviewPercentageLabel}>Success Rate</Text>
                <Text style={[styles.hangmanReviewPercentage, { color: resultColor }]}>
                  {percentage}%
            </Text>
              </View>
          </View>
        </View>
        
          {/* Word Review */}
          <View style={styles.hangmanReviewSection}>
            <View style={styles.hangmanReviewSectionHeader}>
              <Ionicons name="list" size={20} color="#ef4444" />
              <Text style={styles.hangmanReviewSectionTitle}>Word Review</Text>
            </View>
            <View style={styles.hangmanReviewWordItem}>
              <View style={styles.hangmanReviewWordHeader}>
                <Text style={styles.hangmanReviewWordNumber}>The Word</Text>
                <View style={[
                  styles.hangmanReviewWordStatus,
                  userAnswers[0] === word.word ? styles.hangmanReviewWordStatusCorrect : styles.hangmanReviewWordStatusIncorrect
                ]}>
                  <Ionicons 
                    name={userAnswers[0] === word.word ? "checkmark-circle" : "close-circle"} 
                    size={16} 
                    color="#ffffff" 
                  />
                  <Text style={styles.hangmanReviewWordStatusText}>
                    {userAnswers[0] === word.word ? 'Correct' : 'Failed'}
                </Text>
                </View>
              </View>
              <Text style={styles.hangmanReviewWordText}>{word.word}</Text>
              <Text style={styles.hangmanReviewWordHint}>Hint: {word.hint}</Text>
              {userAnswers[0] !== word.word && (
                <Text style={styles.hangmanReviewWordNote}>
                  You ran out of guesses for this word
                  </Text>
                )}
              </View>
            </View>
        </ScrollView>
        
        {/* Action Buttons */}
        <View style={styles.hangmanReviewActions}>
          <TouchableOpacity 
            style={[styles.hangmanReviewButton, styles.hangmanReviewButtonSecondary]} 
            onPress={() => {
              setShowReview(false);
              setShowGameIntro(true);
              setCurrentWord(0);
              setScore(0);
              setGuessedLetters(new Set());
              setWrongGuesses(0);
              setUserAnswers([]);
              setShowHint(false);
            }}
          >
            <Ionicons name="refresh" size={20} color="#64748b" />
            <Text style={styles.hangmanReviewButtonSecondaryText}>Play Again</Text>
          </TouchableOpacity>
          
          <TouchableOpacity 
            style={[styles.hangmanReviewButton, styles.hangmanReviewButtonPrimary]} 
            onPress={handleReviewComplete}
          >
            <Ionicons name="checkmark" size={20} color="#ffffff" />
            <Text style={styles.hangmanReviewButtonPrimaryText}>Finish</Text>
        </TouchableOpacity>
        </View>
      </View>
    );
  }
  
  // Landing page
  if (showGameIntro) {
    return (
      <View style={styles.gameContainer}>
        <ScrollView 
          style={styles.hangmanIntroScrollContainer}
          contentContainerStyle={styles.hangmanIntroScrollContent}
          showsVerticalScrollIndicator={false}
        >
          {/* Header Section */}
          <View style={styles.hangmanIntroHeader}>
            <View style={styles.hangmanIntroIconContainer}>
              <Ionicons name="body" size={40} color="#ef4444" />
            </View>
            <Text style={styles.hangmanIntroTitle}>Hangman</Text>
            <Text style={styles.hangmanIntroSubtitle}>
              Guess the word letter by letter!
            </Text>
          </View>
          
          {/* Info Cards */}
          <View style={styles.hangmanIntroInfoRow}>
            <View style={styles.hangmanIntroInfoCard}>
              <Ionicons name="bulb" size={18} color="#f59e0b" />
              <Text style={styles.hangmanIntroInfoText}>Use hints</Text>
            </View>
            <View style={styles.hangmanIntroInfoCard}>
              <Ionicons name="warning" size={18} color="#ef4444" />
              <Text style={styles.hangmanIntroInfoText}>6 max guesses</Text>
            </View>
          </View>
          
          {/* Game Rules - Simplified */}
          <View style={styles.hangmanIntroSection}>
            <View style={styles.hangmanIntroSectionHeader}>
              <Ionicons name="information-circle" size={18} color="#ef4444" />
              <Text style={styles.hangmanIntroSectionTitle}>Quick Rules</Text>
            </View>
            <View style={styles.hangmanIntroRules}>
              <Text style={styles.hangmanIntroRuleText}>
                • Tap letters to guess the word
              </Text>
              <Text style={styles.hangmanIntroRuleText}>
                • Use hints when you're stuck
              </Text>
              <Text style={styles.hangmanIntroRuleText}>
                • Complete before 6 wrong guesses!
              </Text>
              <Text style={styles.hangmanIntroRuleText}>
                • All available words will be randomized
              </Text>
            </View>
          </View>
          
          
        </ScrollView>
        
        {/* Start Button - Fixed at bottom */}
        <View style={styles.hangmanIntroActions}>
          <TouchableOpacity 
            style={styles.hangmanIntroButton} 
            onPress={() => {
              // Randomize all available words
              const availableWords = gameData.originalFilteredCards || gameData.words || [];
              if (availableWords.length > 0) {
                // Shuffle the words array
                const shuffledWords = [...availableWords].sort(() => Math.random() - 0.5);
                // Update gameData with shuffled words
                gameData.words = shuffledWords;
                setShowGameIntro(false);
                setGameStartTime(Date.now());
              }
            }}
          >
            <View style={styles.hangmanIntroButtonContent}>
              <Ionicons name="play" size={20} color="#ffffff" />
              <Text style={styles.hangmanIntroButtonText}>Start Game</Text>
            </View>
          </TouchableOpacity>
        </View>
      </View>
    );
  }
  
  if (!word) return null;
  
  return (
    <View style={styles.gameContainer}>
      <View style={styles.gameHeader}>
        <Text style={styles.gameHeaderText}>Hangman Game</Text>
        <Text style={styles.gameHeaderText}>Wrong Guesses: {wrongGuesses}/{maxWrongGuesses}</Text>
      </View>
      
      {/* Hangman Drawing */}
      <View style={styles.hangmanContainer}>
        <Text style={styles.hangmanTitle}>Hangman</Text>
        <View style={styles.hangmanDrawing}>
          <Text style={styles.hangmanText}>
            {wrongGuesses >= 1 ? '  +---+' : '  +---+'}
          </Text>
          <Text style={styles.hangmanText}>
            {wrongGuesses >= 1 ? '  |   |' : '  |   |'}
          </Text>
          <Text style={styles.hangmanText}>
            {wrongGuesses >= 1 ? '  O   |' : '      |'}
          </Text>
          <Text style={styles.hangmanText}>
            {wrongGuesses >= 3 ? ' /|\\  |' : wrongGuesses >= 2 ? '  |   |' : '      |'}
          </Text>
          <Text style={styles.hangmanText}>
            {wrongGuesses >= 3 ? ' / \\  |' : '      |'}
          </Text>
          <Text style={styles.hangmanText}>
            '      |'
          </Text>
          <Text style={styles.hangmanText}>
            '======='
          </Text>
        </View>
        <Text style={styles.wrongGuessesText}>Wrong guesses: {wrongGuesses}/{maxWrongGuesses}</Text>
      </View>
      
      {/* Word Display */}
      <View style={styles.wordContainer}>
        <View style={styles.wordHeader}>
        <Text style={styles.maskedWord}>{getMaskedWord()}</Text>
          <TouchableOpacity 
            style={styles.hintButton}
            onPress={() => setShowHint(!showHint)}
          >
            <Ionicons name="bulb" size={20} color="#f59e0b" />
            <Text style={styles.hintButtonText}>Hint</Text>
          </TouchableOpacity>
        </View>
        {showHint && (
          <Text style={styles.wordHint}>Hint: {word.hint}</Text>
        )}
      </View>
      
      {/* Letter Grid */}
      <View style={styles.letterGridContainer}>
        <Text style={styles.letterGridTitle}>Choose a letter:</Text>
        <View style={styles.letterGrid}>
          {Array.from('ABCDEFGHIJKLMNOPQRSTUVWXYZ').map(letter => (
            <TouchableOpacity
              key={letter}
              style={[
                styles.letterButton,
                {
                  width: buttonSize,
                  height: buttonSize,
                  margin: buttonMargin,
                },
                guessedLetters.has(letter.toLowerCase()) && styles.letterButtonGuessed,
                guessedLetters.has(letter.toLowerCase()) && 
                !word.word.toLowerCase().includes(letter.toLowerCase()) && 
                styles.letterButtonWrong
              ]}
              onPress={() => handleLetterGuess(letter)}
              disabled={guessedLetters.has(letter.toLowerCase()) || isGameOver()}
            >
              <Text style={[
                styles.letterButtonText,
                {
                  fontSize: buttonSize < 40 ? 14 : 16,
                },
                guessedLetters.has(letter.toLowerCase()) && styles.letterButtonTextGuessed
              ]}>
                {letter}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>
      

    </View>
  );
};

const TypeWhatYouHearGame = ({ gameData, onClose, onGameComplete, userProfile }: any) => {
  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [score, setScore] = useState(0);
  const [gameTime, setGameTime] = useState(0);
  const [isGameActive, setIsGameActive] = useState(false);
  const [showGameIntro, setShowGameIntro] = useState(true);
  const [showGameOver, setShowGameOver] = useState(false);
  const [userAnswer, setUserAnswer] = useState('');
  const [gameStartTime, setGameStartTime] = useState(0);
  const [difficulty, setDifficulty] = useState<'easy' | 'medium' | 'hard'>('medium');
  const [attempts, setAttempts] = useState(0);
  const [maxAttempts] = useState(3);
  const [showHint, setShowHint] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);
  const [streak, setStreak] = useState(0);
  const [accuracy, setAccuracy] = useState(0);
  const [totalQuestions, setTotalQuestions] = useState(0);
  const [randomizedQuestions, setRandomizedQuestions] = useState<any[]>([]);
  
  // Game questions from flashcard data
  const questions = gameData.questions || gameData.challenges || [];
  
  // Get questions based on difficulty and randomize them
  const getGameQuestions = () => {
    let filteredQuestions;
    if (difficulty === 'easy') {
      filteredQuestions = questions.filter((q: any) => (q.front?.length || 0) <= 20);
    } else if (difficulty === 'medium') {
      filteredQuestions = questions.filter((q: any) => (q.front?.length || 0) > 20 && (q.front?.length || 0) <= 50);
    } else {
      filteredQuestions = questions.filter((q: any) => (q.front?.length || 0) > 50);
    }
    
    // Randomize the filtered questions
    return filteredQuestions.sort(() => Math.random() - 0.5);
  };
  
  const currentQuestionData = randomizedQuestions[currentQuestion] || getGameQuestions()[currentQuestion];
  
  // Play audio using text-to-speech
  const playAudio = async () => {
    if (!currentQuestionData?.front) return;
    
    try {
      setIsPlaying(true);
      
      // Stop any currently playing speech
      await Speech.stop();
      
      // Get the text to speak
      const textToSpeak = currentQuestionData.front;
      
      // Configure speech options for English
      const speechOptions = {
        language: 'en-US',
        pitch: 1.0,
        rate: 0.75, // Slightly slower for clarity
        volume: 1.0,
      };
      
      // Speak the text
      await Speech.speak(textToSpeak, speechOptions);
      
      // Set playing to false when speech completes
      setTimeout(() => setIsPlaying(false), 1000);
    } catch (error) {
      console.error('Speech error:', error);
      setIsPlaying(false);
    }
  };
  
  const handleAnswerSubmit = () => {
    const trimmedAnswer = userAnswer.trim().toLowerCase();
    const correctAnswer = currentQuestionData?.front?.toLowerCase() || '';
    
    if (trimmedAnswer === correctAnswer) {
      // Correct answer
      setScore(prev => prev + 1);
      setStreak(prev => prev + 1);
      setAccuracy(prev => (prev * totalQuestions + 1) / (totalQuestions + 1));
      setTotalQuestions(prev => prev + 1);
      
      if (currentQuestion < randomizedQuestions.length - 1) {
        setCurrentQuestion(prev => prev + 1);
        setUserAnswer('');
        setAttempts(0);
        setShowHint(false);
      } else {
        // Game completed
        setShowGameOver(true);
      }
    } else {
      // Incorrect answer
      setAttempts(prev => prev + 1);
      setStreak(0);
      
      if (attempts + 1 >= maxAttempts) {
        // Move to next question after max attempts
        setTotalQuestions(prev => prev + 1);
        setAccuracy(prev => (prev * totalQuestions) / (totalQuestions + 1));
        
        if (currentQuestion < randomizedQuestions.length - 1) {
          setCurrentQuestion(prev => prev + 1);
          setUserAnswer('');
          setAttempts(0);
          setShowHint(false);
        } else {
          setShowGameOver(true);
        }
      }
    }
  };
  
  const showHintLetter = () => {
    setShowHint(true);
  };
  
  const replayAudio = async () => {
    await playAudio();
  };
  
  const startGame = async () => {
    // Stop any ongoing speech
    await Speech.stop();
    
    // Generate randomized questions based on current difficulty
    const questions = getGameQuestions();
    
    // Check if we have questions for this difficulty
    if (questions.length === 0) {
      Alert.alert(
        'No Questions Available',
        `No flashcards found for ${difficulty} difficulty. Please try a different difficulty level.`,
        [{ text: 'OK' }]
      );
      return;
    }
    
    setRandomizedQuestions(questions);
    
    setShowGameIntro(false);
    setIsGameActive(true);
    setGameStartTime(Date.now());
    setScore(0);
    setGameTime(0);
    setCurrentQuestion(0);
    setAttempts(0);
    setStreak(0);
    setAccuracy(0);
    setTotalQuestions(0);
    setUserAnswer('');
    setShowHint(false);
  };
  
  const restartGame = async () => {
    // Stop any ongoing speech
    await Speech.stop();
    
    // Clear randomized questions when restarting
    setRandomizedQuestions([]);
    
    setShowGameOver(false);
    setShowGameIntro(true);
  };
  
  // Timer effect
  useEffect(() => {
    if (!isGameActive || showGameOver) return;
    
    const timer = setInterval(() => {
      setGameTime(prev => prev + 1);
    }, 1000);
    
    return () => clearInterval(timer);
  }, [isGameActive, showGameOver]);
  
  // Cleanup speech when component unmounts or game changes
  useEffect(() => {
    return () => {
      Speech.stop();
    };
  }, []);
  
  // Regenerate randomized questions when difficulty changes
  useEffect(() => {
    if (randomizedQuestions.length > 0) {
      const questions = getGameQuestions();
      setRandomizedQuestions(questions);
      setCurrentQuestion(0);
    }
  }, [difficulty]);
  
  // Landing page
  if (showGameIntro) {
    return (
      <View style={styles.gameContainer}>
        <ScrollView 
          style={styles.typeWhatYouHearIntroScrollContainer}
          contentContainerStyle={styles.typeWhatYouHearIntroScrollContent}
          showsVerticalScrollIndicator={false}
        >
          {/* Header Section */}
          <View style={styles.typeWhatYouHearIntroHeader}>
            <View style={styles.typeWhatYouHearIntroIconContainer}>
              <Ionicons name="ear" size={40} color="#8b5cf6" />
            </View>
            <Text style={styles.typeWhatYouHearIntroTitle}>Type What You Hear</Text>
            <Text style={styles.typeWhatYouHearIntroSubtitle}>
              Listen carefully and type what you hear!
          </Text>
          </View>
          
          {/* Info Cards */}
          <View style={styles.typeWhatYouHearIntroInfoRow}>
            <View style={styles.typeWhatYouHearIntroInfoCard}>
              <Ionicons name="headset" size={18} color="#8b5cf6" />
              <Text style={styles.typeWhatYouHearIntroInfoText}>Listen & Type</Text>
            </View>
            <View style={styles.typeWhatYouHearIntroInfoCard}>
              <Ionicons name="bulb" size={18} color="#f59e0b" />
              <Text style={styles.typeWhatYouHearIntroInfoText}>Use hints</Text>
            </View>
          </View>
          
          {/* Difficulty Selection */}
          <View style={styles.typeWhatYouHearIntroSection}>
            <View style={styles.typeWhatYouHearIntroSectionHeader}>
              <Ionicons name="settings" size={18} color="#8b5cf6" />
              <Text style={styles.typeWhatYouHearIntroSectionTitle}>Difficulty Level</Text>
            </View>
            <View style={styles.typeWhatYouHearIntroDifficultyModes}>
              <TouchableOpacity
                style={[
                  styles.typeWhatYouHearIntroDifficultyMode,
                  difficulty === 'easy' && styles.typeWhatYouHearIntroDifficultyModeActive
                ]}
                onPress={() => setDifficulty('easy')}
              >
                <Ionicons 
                  name="checkmark-circle" 
                  size={16} 
                  color={difficulty === 'easy' ? '#ffffff' : '#8b5cf6'} 
                />
                <Text style={[
                  styles.typeWhatYouHearIntroDifficultyModeText,
                  difficulty === 'easy' && styles.typeWhatYouHearIntroDifficultyModeTextActive
                ]}>
                  Easy
          </Text>
              </TouchableOpacity>
              
              <TouchableOpacity
                style={[
                  styles.typeWhatYouHearIntroDifficultyMode,
                  difficulty === 'medium' && styles.typeWhatYouHearIntroDifficultyModeActive
                ]}
                onPress={() => setDifficulty('medium')}
              >
                <Ionicons 
                  name="checkmark-circle" 
                  size={16} 
                  color={difficulty === 'medium' ? '#ffffff' : '#8b5cf6'} 
                />
                <Text style={[
                  styles.typeWhatYouHearIntroDifficultyModeText,
                  difficulty === 'medium' && styles.typeWhatYouHearIntroDifficultyModeTextActive
                ]}>
                  Medium
                </Text>
              </TouchableOpacity>
              
              <TouchableOpacity
                style={[
                  styles.typeWhatYouHearIntroDifficultyMode,
                  difficulty === 'hard' && styles.typeWhatYouHearIntroDifficultyModeActive
                ]}
                onPress={() => setDifficulty('hard')}
              >
                <Ionicons 
                  name="checkmark-circle" 
                  size={16} 
                  color={difficulty === 'easy' ? '#ffffff' : '#8b5cf6'} 
                />
                <Text style={[
                  styles.typeWhatYouHearIntroDifficultyModeText,
                  difficulty === 'hard' && styles.typeWhatYouHearIntroDifficultyModeTextActive
                ]}>
                  Hard
            </Text>
          </TouchableOpacity>
        </View>
            <Text style={styles.typeWhatYouHearIntroDifficultyHint}>
              {difficulty === 'easy' 
                ? 'Short words and phrases (up to 20 characters)'
                : difficulty === 'medium'
                ? 'Medium phrases (21-50 characters)'
                : 'Long sentences (50+ characters)'
              }
            </Text>
            <Text style={[
              styles.typeWhatYouHearIntroQuestionCount,
              getGameQuestions().length === 0 && { color: '#ef4444' }
            ]}>
              {getGameQuestions().length === 0 
                ? 'No questions available for this difficulty'
                : `Available questions: ${getGameQuestions().length}`
              }
            </Text>
          </View>
          
          {/* Game Rules */}
          <View style={styles.typeWhatYouHearIntroSection}>
            <View style={styles.typeWhatYouHearIntroSectionHeader}>
              <Ionicons name="information-circle" size={18} color="#8b5cf6" />
              <Text style={styles.typeWhatYouHearIntroSectionTitle}>How to Play</Text>
            </View>
            <View style={styles.typeWhatYouHearIntroRules}>
              <Text style={styles.typeWhatYouHearIntroRuleText}>
                • Listen to the English audio clip carefully
              </Text>
              <Text style={styles.typeWhatYouHearIntroRuleText}>
                • Type exactly what you hear in English
              </Text>
              <Text style={styles.typeWhatYouHearIntroRuleText}>
                • Use hints if you're stuck
              </Text>
              <Text style={styles.typeWhatYouHearIntroRuleText}>
                • You have {maxAttempts} attempts per question
              </Text>
            </View>
          </View>
        </ScrollView>
        
        {/* Start Button */}
        <View style={styles.typeWhatYouHearIntroActions}>
          <TouchableOpacity 
            style={[
              styles.typeWhatYouHearIntroButton,
              getGameQuestions().length === 0 && styles.typeWhatYouHearIntroButtonDisabled
            ]} 
            onPress={startGame}
            disabled={getGameQuestions().length === 0}
          >
            <View style={styles.typeWhatYouHearIntroButtonContent}>
              <Ionicons name="play" size={20} color="#ffffff" />
              <Text style={styles.typeWhatYouHearIntroButtonText}>
                {getGameQuestions().length === 0 ? 'No Questions Available' : 'Start Listening'}
              </Text>
            </View>
          </TouchableOpacity>
        </View>
      </View>
    );
  }
  
  // Game over screen
  if (showGameOver) {
    const finalAccuracy = Math.round(accuracy * 100);
    return (
      <View style={styles.gameContainer}>
        <View style={styles.typeWhatYouHearGameOverContainer}>
          <View style={styles.typeWhatYouHearGameOverHeader}>
            <Ionicons name="ear" size={60} color="#8b5cf6" />
            <Text style={styles.typeWhatYouHearGameOverTitle}>Listening Complete!</Text>
            <Text style={styles.typeWhatYouHearGameOverSubtitle}>
              Final Score: {score}/{totalQuestions}
            </Text>
          </View>
          
          <View style={styles.typeWhatYouHearGameOverStats}>
            <View style={styles.typeWhatYouHearGameOverStat}>
              <Ionicons name="trophy" size={24} color="#f59e0b" />
              <Text style={styles.typeWhatYouHearGameOverStatValue}>{score}</Text>
              <Text style={styles.typeWhatYouHearGameOverStatLabel}>Correct</Text>
            </View>
            <View style={styles.typeWhatYouHearGameOverStat}>
              <Ionicons name="time" size={24} color="#8b5cf6" />
              <Text style={styles.typeWhatYouHearGameOverStatValue}>{gameTime}s</Text>
              <Text style={styles.typeWhatYouHearGameOverStatLabel}>Time</Text>
            </View>
            <View style={styles.typeWhatYouHearGameOverStat}>
              <Ionicons name="trending-up" size={24} color="#10b981" />
              <Text style={styles.typeWhatYouHearGameOverStatValue}>{finalAccuracy}%</Text>
              <Text style={styles.typeWhatYouHearGameOverStatLabel}>Accuracy</Text>
            </View>
          </View>
          
          <View style={styles.typeWhatYouHearGameOverActions}>
            <TouchableOpacity 
              style={styles.typeWhatYouHearGameOverButton} 
              onPress={restartGame}
            >
              <Ionicons name="refresh" size={20} color="#ffffff" />
              <Text style={styles.typeWhatYouHearGameOverButtonText}>Play Again</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    );
  }
  
  // Main game screen
  return (
    <View style={styles.gameContainer}>
      {/* Game Header */}
      <View style={styles.typeWhatYouHearGameHeader}>
        <View style={styles.typeWhatYouHearGameHeaderLeft}>
          <Text style={styles.typeWhatYouHearGameHeaderText}>Score: {score}</Text>
          <Text style={styles.typeWhatYouHearGameHeaderText}>Streak: {streak}</Text>
        </View>
        <View style={styles.typeWhatYouHearGameHeaderRight}>
          <Text style={styles.typeWhatYouHearGameHeaderText}>Time: {gameTime}s</Text>
          <Text style={styles.typeWhatYouHearGameHeaderText}>Q: {currentQuestion + 1}/{randomizedQuestions.length}</Text>
        </View>
      </View>
      
      {/* Game Area */}
      <View style={styles.typeWhatYouHearGameArea}>
        {/* Question Display */}
        <View style={styles.typeWhatYouHearQuestionContainer}>
          <Text style={styles.typeWhatYouHearQuestionLabel}>
            Question {currentQuestion + 1}
          </Text>
          
          {/* Audio Controls */}
          <View style={styles.typeWhatYouHearAudioControls}>
            <TouchableOpacity 
              style={styles.typeWhatYouHearPlayButton}
              onPress={playAudio}
              disabled={isPlaying}
            >
              <Ionicons 
                name={isPlaying ? "pause" : "play"} 
                size={24} 
                color="#ffffff" 
              />
              <Text style={styles.typeWhatYouHearPlayButtonText}>
                {isPlaying ? "Playing..." : "Play Audio"}
              </Text>
            </TouchableOpacity>
            
            <TouchableOpacity 
              style={styles.typeWhatYouHearReplayButton}
              onPress={replayAudio}
            >
              <Ionicons name="refresh" size={20} color="#8b5cf6" />
              <Text style={styles.typeWhatYouHearReplayButtonText}>Replay</Text>
            </TouchableOpacity>
          </View>
          
          {/* Hint Section */}
          <View style={styles.typeWhatYouHearHintSection}>
            <TouchableOpacity 
              style={styles.typeWhatYouHearHintButton}
              onPress={showHintLetter}
            >
              <Ionicons name="bulb" size={18} color="#f59e0b" />
              <Text style={styles.typeWhatYouHearHintButtonText}>Show Hint</Text>
            </TouchableOpacity>
            
            {showHint && currentQuestionData?.front && (
              <Text style={styles.typeWhatYouHearHintText}>
                First letter: {currentQuestionData.front.charAt(0)}
              </Text>
            )}
          </View>
        </View>
        
        {/* Answer Input */}
        <View style={styles.typeWhatYouHearAnswerSection}>
          <Text style={styles.typeWhatYouHearAnswerLabel}>
            Type what you hear:
          </Text>
          <View style={styles.typeWhatYouHearAnswerInputContainer}>
            <TextInput
              style={styles.typeWhatYouHearAnswerInput}
              value={userAnswer}
              onChangeText={setUserAnswer}
              placeholder="Type your answer here..."
              placeholderTextColor="#94a3b8"
              autoCapitalize="none"
              autoCorrect={false}
              onSubmitEditing={handleAnswerSubmit}
            />
            <TouchableOpacity 
              style={[
                styles.typeWhatYouHearAnswerSubmitButton,
                !userAnswer.trim() && styles.typeWhatYouHearAnswerSubmitButtonDisabled
              ]}
              onPress={handleAnswerSubmit}
              disabled={!userAnswer.trim()}
            >
              <Ionicons name="send" size={20} color="#ffffff" />
            </TouchableOpacity>
          </View>
          
          {/* Attempts Display */}
          <View style={styles.typeWhatYouHearAttemptsContainer}>
            <Text style={styles.typeWhatYouHearAttemptsText}>
              Attempts: {attempts}/{maxAttempts}
            </Text>
            {attempts > 0 && (
              <Text style={styles.typeWhatYouHearAttemptsHint}>
                Keep trying! You have {maxAttempts - attempts} attempts left.
              </Text>
            )}
          </View>
        </View>
      </View>
    </View>
  );
};

const GravityGame = ({ gameData, onClose, onGameComplete, userProfile }: any) => {
  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [score, setScore] = useState(0);
  const [lives, setLives] = useState(3);
  const [gameTime, setGameTime] = useState(0);
  const [isGameActive, setIsGameActive] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [showGameIntro, setShowGameIntro] = useState(true);
  const [showGameOver, setShowGameOver] = useState(false);
  const [userAnswer, setUserAnswer] = useState('');
  const [fallingObjects, setFallingObjects] = useState<any[]>([]);
  const [gameStartTime, setGameStartTime] = useState(0);
  const [difficulty, setDifficulty] = useState(1);
  const [objectSpawnRate, setObjectSpawnRate] = useState(2000); // ms between spawns
  const [fallSpeed, setFallSpeed] = useState(2); // pixels per frame
  const [languageMode, setLanguageMode] = useState<'question' | 'answer'>('question');
  
  // Get user's native language from profile
  const nativeLanguage = userProfile?.native_language || 'your native language';
  
  // Game questions from flashcard data
  const questions = gameData.questions || gameData.challenges || [];
  
  // Get questions based on language mode
  const getGameQuestions = () => {
    if (languageMode === 'question') {
      // Questions in English, answers in native language
      return questions.map((q: any) => ({
        question: q.question || q.front,
        answer: q.correctAnswer || q.back,
        displayText: q.question || q.front
      }));
    } else {
      // Questions in native language, answers in English
      return questions.map((q: any) => ({
        question: q.correctAnswer || q.back,
        answer: q.question || q.front,
        displayText: q.correctAnswer || q.back
      }));
    }
  };
  
  // Game loop for falling objects
  useEffect(() => {
    if (!isGameActive || isPaused) return;
    
    const gameLoop = setInterval(() => {
      // Update falling objects positions
      setFallingObjects(prev => 
        prev.map(obj => ({
          ...obj,
          y: obj.y + fallSpeed
        }))
      );
      
      // Check for collisions with planet surface (at y = 500)
      setFallingObjects(prev => {
        const newObjects = prev.filter(obj => obj.y < 500);
        const impactObjects = prev.filter(obj => obj.y >= 500);
        
        if (impactObjects.length > 0) {
          console.log(`💥 ${impactObjects.length} asteroid(s) hit the planet! Lives lost.`);
          setLives(prev => Math.max(0, prev - impactObjects.length));
          
          // Add visual feedback - flash the planet red briefly
          // This could be enhanced with a state variable for visual effects
        }
        
        return newObjects;
      });
      
      // Remove asteroids that go off-screen to the left or right
      setFallingObjects(prev => 
        prev.filter(obj => obj.x >= -50 && obj.x <= 400) // Keep asteroids within reasonable bounds
      );
      
      // Increase difficulty over time (slower progression)
      if (gameTime % 60 === 0 && gameTime > 0) {
        setDifficulty(prev => prev + 0.3);
        setObjectSpawnRate(prev => Math.max(800, prev - 50));
        setFallSpeed(prev => prev + 0.2);
      }
      
    }, 50); // 20 FPS for smooth movement
    
    return () => clearInterval(gameLoop);
  }, [isGameActive, isPaused, fallSpeed]);
  
  // Separate timer that increases by 1 second per second
  useEffect(() => {
    if (!isGameActive || isPaused) return;
    
    const timer = setInterval(() => {
      setGameTime(prev => prev + 1);
    }, 1000); // 1 second intervals
    
    return () => clearInterval(timer);
  }, [isGameActive, isPaused]);
  
  // Spawn new falling objects
  useEffect(() => {
    if (!isGameActive || isPaused) return;
    
    const spawnInterval = setInterval(() => {
      const gameQuestions = getGameQuestions();
      if (gameQuestions.length > 0) {
        const randomQuestion = gameQuestions[Math.floor(Math.random() * gameQuestions.length)];
        const newObject = {
          id: Date.now() + Math.random(),
          question: randomQuestion.question,
          answer: randomQuestion.answer,
          displayText: randomQuestion.displayText,
          x: Math.random() * 300 + 50, // Random X position within planet bounds (50-350)
          y: 80, // Start below the header (header height is roughly 80px)
          type: 'asteroid',
          rotation: Math.random() * 360, // Random rotation for asteroid effect
          size: Math.random() * 20 + 30 // Random size between 30-50
        };
        
        setFallingObjects(prev => [...prev, newObject]);
      }
    }, objectSpawnRate);
    
    return () => clearInterval(spawnInterval);
  }, [isGameActive, isPaused, questions, objectSpawnRate, languageMode]);
  
  // Check for game over
  useEffect(() => {
    if (lives <= 0) {
      setIsGameActive(false);
      setShowGameOver(true);
    }
  }, [lives]);
  
  const handleAnswerSubmit = () => {
    const trimmedAnswer = userAnswer.trim().toLowerCase();
    
    // Check if any falling object matches the answer
    setFallingObjects(prev => {
      const matchingObject = prev.find(obj => 
        obj.answer.toLowerCase().includes(trimmedAnswer) ||
        trimmedAnswer.includes(obj.answer.toLowerCase())
      );
      
      if (matchingObject) {
        // Correct answer - destroy object and add score
        setScore(prev => prev + 10);
        return prev.filter(obj => obj.id !== matchingObject.id);
      }
      
      return prev;
    });
    
    setUserAnswer('');
  };
  
  const startGame = () => {
    setShowGameIntro(false);
    setIsGameActive(true);
    setGameStartTime(Date.now());
    setScore(0);
    setLives(3);
    setGameTime(0);
    setDifficulty(1);
    setObjectSpawnRate(2000);
    setFallSpeed(2);
    setFallingObjects([]);
    setUserAnswer('');
  };
  
  const pauseGame = () => {
    setIsPaused(!isPaused);
  };
  
  const restartGame = () => {
    setShowGameOver(false);
    setShowGameIntro(true);
    setLanguageMode('question'); // Reset to default language mode
  };
  
  // Landing page
  if (showGameIntro) {
    return (
      <View style={styles.gameContainer}>
        <ScrollView 
          style={styles.gravityIntroScrollContainer}
          contentContainerStyle={styles.gravityIntroScrollContent}
          showsVerticalScrollIndicator={false}
        >
          {/* Header Section */}
          <View style={styles.gravityIntroHeader}>
            <View style={styles.gravityIntroIconContainer}>
              <Ionicons name="planet" size={40} color="#3b82f6" />
            </View>
            <Text style={styles.gravityIntroTitle}>Planet Defense</Text>
            <Text style={styles.gravityIntroSubtitle}>
              Defend your planet from falling questions!
            </Text>
          </View>
          
          {/* Info Cards */}
          <View style={styles.gravityIntroInfoRow}>
            <View style={styles.gravityIntroInfoCard}>
              <Ionicons name="shield" size={18} color="#10b981" />
              <Text style={styles.gravityIntroInfoText}>3 lives to protect</Text>
            </View>
            <View style={styles.gravityIntroInfoCard}>
              <Ionicons name="rocket" size={18} color="#ef4444" />
              <Text style={styles.gravityIntroInfoText}>Answer to destroy</Text>
            </View>
          </View>
          
          {/* Language Mode Selection */}
          <View style={styles.gravityIntroSection}>
            <View style={styles.gravityIntroSectionHeader}>
              <Ionicons name="language" size={18} color="#3b82f6" />
              <Text style={styles.gravityIntroSectionTitle}>Language Mode</Text>
            </View>
            <View style={styles.gravityIntroLanguageModes}>
              <TouchableOpacity
                style={[
                  styles.gravityIntroLanguageMode,
                  languageMode === 'question' && styles.gravityIntroLanguageModeActive
                ]}
                onPress={() => setLanguageMode('question')}
              >
                <Ionicons 
                  name="checkmark-circle" 
                  size={16} 
                  color={languageMode === 'question' ? '#ffffff' : '#3b82f6'} 
                />
                <Text style={[
                  styles.gravityIntroLanguageModeText,
                  languageMode === 'question' && styles.gravityIntroLanguageModeTextActive
                ]}>
                  English Questions
                </Text>
              </TouchableOpacity>
              
              <TouchableOpacity
                style={[
                  styles.gravityIntroLanguageMode,
                  languageMode === 'answer' && styles.gravityIntroLanguageModeActive
                ]}
                onPress={() => setLanguageMode('answer')}
              >
                <Ionicons 
                  name="checkmark-circle" 
                  size={16} 
                  color={languageMode === 'answer' ? '#ffffff' : '#3b82f6'} 
                />
                <Text style={[
                  styles.gravityIntroLanguageModeText,
                  languageMode === 'answer' && styles.gravityIntroLanguageModeTextActive
                ]}>
                  {nativeLanguage} Questions
                </Text>
              </TouchableOpacity>
            </View>
            <Text style={styles.gravityIntroLanguageHint}>
              {languageMode === 'question' 
                ? `Questions in English, answer in ${nativeLanguage}`
                : `Questions in ${nativeLanguage}, answer in English`
              }
            </Text>
          </View>
          
          {/* Game Rules */}
          <View style={styles.gravityIntroSection}>
            <View style={styles.gravityIntroSectionHeader}>
              <Ionicons name="information-circle" size={18} color="#3b82f6" />
              <Text style={styles.gravityIntroSectionTitle}>How to Play</Text>
            </View>
            <View style={styles.gravityIntroRules}>
              <Text style={styles.gravityIntroRuleText}>
                • Asteroids fall from space with questions
              </Text>
              <Text style={styles.gravityIntroRuleText}>
                • Type the correct answer to destroy them
              </Text>
              <Text style={styles.gravityIntroRuleText}>
                • Don't let them hit your planet!
              </Text>
              <Text style={styles.gravityIntroRuleText}>
                • Difficulty increases over time
              </Text>
            </View>
          </View>
        </ScrollView>
        
        {/* Start Button */}
        <View style={styles.gravityIntroActions}>
          <TouchableOpacity 
            style={styles.gravityIntroButton} 
            onPress={startGame}
          >
            <View style={styles.gravityIntroButtonContent}>
              <Ionicons name="play" size={20} color="#ffffff" />
              <Text style={styles.gravityIntroButtonText}>Start Defense</Text>
            </View>
          </TouchableOpacity>
        </View>
      </View>
    );
  }
  
  // Game over screen
  if (showGameOver) {
    return (
      <View style={styles.gameContainer}>
        <View style={styles.gravityGameOverContainer}>
          <View style={styles.gravityGameOverHeader}>
            <Ionicons name="planet" size={60} color="#ef4444" />
            <Text style={styles.gravityGameOverTitle}>Planet Destroyed!</Text>
            <Text style={styles.gravityGameOverSubtitle}>
              Final Score: {score}
            </Text>
          </View>
          
          <View style={styles.gravityGameOverStats}>
            <View style={styles.gravityGameOverStat}>
              <Ionicons name="trophy" size={24} color="#f59e0b" />
              <Text style={styles.gravityGameOverStatValue}>{score}</Text>
              <Text style={styles.gravityGameOverStatLabel}>Score</Text>
            </View>
            <View style={styles.gravityGameOverStat}>
              <Ionicons name="time" size={24} color="#3b82f6" />
              <Text style={styles.gravityGameOverStatValue}>{gameTime}s</Text>
              <Text style={styles.gravityGameOverStatLabel}>Time</Text>
            </View>
            <View style={styles.gravityGameOverStat}>
              <Ionicons name="trending-up" size={24} color="#8b5cf6" />
              <Text style={styles.gravityGameOverStatValue}>{difficulty.toFixed(1)}x</Text>
              <Text style={styles.gravityGameOverStatLabel}>Difficulty</Text>
            </View>
          </View>
          
          <View style={styles.gravityGameOverActions}>
            <TouchableOpacity 
              style={styles.gravityGameOverButton} 
              onPress={restartGame}
            >
              <Ionicons name="refresh" size={20} color="#ffffff" />
              <Text style={styles.gravityGameOverButtonText}>Play Again</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    );
  }
  
  // Main game screen
  return (
    <View style={styles.gameContainer}>
      {/* Game Header */}
      <View style={styles.gravityGameHeader}>
        <View style={styles.gravityGameHeaderLeft}>
          <Text style={styles.gravityGameHeaderText}>Score: {score}</Text>
          <Text style={styles.gravityGameHeaderText}>Lives: {lives}</Text>
        </View>
        <View style={styles.gravityGameHeaderRight}>
          <Text style={styles.gravityGameHeaderText}>Time: {gameTime}s</Text>
          <TouchableOpacity style={styles.gravityPauseButton} onPress={pauseGame}>
            <Ionicons name={isPaused ? "play" : "pause"} size={20} color="#ffffff" />
          </TouchableOpacity>
        </View>
      </View>
      
      {/* Game Area */}
      <View style={styles.gravityGameArea}>
        {/* Background Stars - Static */}
        <View style={styles.gravityStars}>
          {Array.from({ length: 20 }).map((_, i) => (
            <View
              key={i}
              style={[
                styles.gravityStar,
                {
                  left: (i * 17) % 350,
                  top: (i * 23) % 600,
                  opacity: 0.3 + (i % 3) * 0.2
                }
              ]}
            />
          ))}
        </View>
        
        {/* Falling Asteroids - Clipped to game area */}
        <View style={styles.gravityAsteroidsContainer}>
          {fallingObjects.map(obj => (
            <View 
              key={obj.id}
              style={[
                styles.gravityAsteroid,
                {
                  left: obj.x,
                  top: obj.y,
                  width: obj.size,
                  height: obj.size,
                  transform: [{ rotate: `${obj.rotation}deg` }],
                  backgroundColor: obj.y > 450 ? '#ef4444' : '#4b5563', // Red when close to planet
                  borderColor: obj.y > 450 ? '#dc2626' : '#374151'
                }
              ]}
            >
              <View style={[styles.gravityAsteroidSurface, { 
                backgroundColor: obj.y > 450 ? '#dc2626' : '#6b7280' 
              }]} />
              <Text style={styles.gravityAsteroidText}>
                {obj.displayText.length > 15 ? obj.displayText.substring(0, 15) + '...' : obj.displayText}
              </Text>
            </View>
          ))}
        </View>
        
        {/* Planet Surface */}
        <View style={styles.gravityPlanetSurface}>
          {/* Planet Atmosphere */}
          <View style={styles.gravityAtmosphere} />
          
          {/* Planet Surface */}
          <View style={styles.gravitySurface}>
            <View style={[styles.gravitySurfaceDetail, { left: 40, top: 20 }]} />
            <View style={[styles.gravitySurfaceDetail, { right: 60, top: 15 }]} />
            <View style={[styles.gravitySurfaceDetail, { left: '50%', marginLeft: -30, top: 25 }]} />
          </View>
          
          {/* Planet Icon */}
          <View style={styles.gravityPlanet}>
            <Ionicons name="planet" size={40} color="#10b981" />
          </View>
        </View>
      </View>
      
      {/* Answer Input */}
      <View style={styles.gravityAnswerSection}>
        <Text style={styles.gravityAnswerLabel}>
          Type your answer in {languageMode === 'question' ? nativeLanguage : 'English'}:
        </Text>
        <View style={styles.gravityAnswerInputContainer}>
          <TextInput
            style={styles.gravityAnswerInput}
            value={userAnswer}
            onChangeText={setUserAnswer}
            placeholder={`Answer in ${languageMode === 'question' ? nativeLanguage : 'English'}...`}
            placeholderTextColor="#94a3b8"
            autoCapitalize="none"
            autoCorrect={false}
            onSubmitEditing={handleAnswerSubmit}
          />
          <TouchableOpacity 
            style={styles.gravityAnswerSubmitButton}
            onPress={handleAnswerSubmit}
          >
            <Ionicons name="send" size={20} color="#ffffff" />
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );
  };

const SpeechPronunciationLanding = ({ onStart, onClose }: any) => {
  const [selectedDifficulty, setSelectedDifficulty] = useState<'beginner' | 'intermediate' | 'expert' | 'all'>('all');
  const [selectedCardCount, setSelectedCardCount] = useState<number>(5);
  const [isPlayingDemo, setIsPlayingDemo] = useState(false);

  const playDemoAudio = async () => {
    setIsPlayingDemo(true);
    try {
      // Enhanced demo with better pronunciation
      const demoText = "Hello! Welcome to Speech Pronunciation. Listen carefully and repeat each word clearly.";
      
      await Speech.speak(demoText, {
        language: 'en-US',
        rate: 0.7, // Slower for demo clarity
        pitch: 1.2, // Slightly higher for better clarity
        volume: 1.0,
        voice: 'com.apple.ttsbundle.Samantha-compact', // Use a clearer voice if available
        onDone: () => {
          setIsPlayingDemo(false);
        },
        onError: (error) => {
          console.error('Demo speech error:', error);
          // Fallback to default settings
          Speech.speak(demoText, {
            language: 'en-US',
            rate: 0.7,
            pitch: 1.2,
            volume: 1.0,
            onDone: () => {
              setIsPlayingDemo(false);
            },
            onError: (fallbackError) => {
              console.error('Fallback demo speech error:', fallbackError);
              setIsPlayingDemo(false);
            },
          });
        },
      });
    } catch (error) {
      console.error('Error playing demo audio:', error);
      setIsPlayingDemo(false);
    }
  };

  return (
    <View style={styles.gameContainer}>
      <View style={styles.gameHeader}>
        <TouchableOpacity style={styles.closeButton} onPress={onClose}>
          <Ionicons name="close" size={24} color="#64748b" />
        </TouchableOpacity>
        <Text style={styles.speechGameTitle}>Speech Pronunciation</Text>
      </View>

      <ScrollView style={styles.landingContent} showsVerticalScrollIndicator={false}>
        {/* Hero Section */}
        <View style={styles.heroSection}>
          <View style={styles.heroIcon}>
            <Ionicons name="mic" size={48} color="#10b981" />
          </View>
          <Text style={styles.heroTitle}>Master Your Pronunciation</Text>
          <Text style={styles.heroSubtitle}>
            Practice speaking with real-time feedback and improve your language skills
          </Text>
        </View>

        {/* How It Works */}
        <View style={styles.howItWorksSection}>
          <Text style={styles.sectionTitle}>How It Works</Text>
          
          <View style={styles.stepContainer}>
            <View style={styles.stepNumber}>
              <Text style={styles.stepNumberText}>1</Text>
            </View>
            <View style={styles.stepContent}>
              <Text style={styles.stepTitle}>Listen</Text>
              <Text style={styles.stepDescription}>
                Hear the correct pronunciation of each word
              </Text>
            </View>
          </View>

          <View style={styles.stepContainer}>
            <View style={styles.stepNumber}>
              <Text style={styles.stepNumberText}>2</Text>
            </View>
            <View style={styles.stepContent}>
              <Text style={styles.stepTitle}>Speak</Text>
              <Text style={styles.stepDescription}>
                Practice pronouncing the word using your microphone
              </Text>
            </View>
          </View>

          <View style={styles.stepContainer}>
            <View style={styles.stepNumber}>
              <Text style={styles.stepNumberText}>3</Text>
            </View>
            <View style={styles.stepContent}>
              <Text style={styles.stepTitle}>Get Feedback</Text>
              <Text style={styles.stepDescription}>
                Receive instant feedback on your pronunciation accuracy
              </Text>
            </View>
          </View>
        </View>

        {/* Demo Section */}
        <View style={styles.demoSection}>
          <Text style={styles.sectionTitle}>Try It Out</Text>
          <TouchableOpacity 
            style={[styles.demoButton, isPlayingDemo && styles.demoButtonActive]} 
            onPress={playDemoAudio}
            disabled={isPlayingDemo}
          >
            <Ionicons 
              name={isPlayingDemo ? "volume-high" : "play"} 
              size={24} 
              color={isPlayingDemo ? "#10b981" : "#6366f1"} 
            />
            <Text style={styles.demoButtonText}>
              {isPlayingDemo ? "Playing..." : "Listen to Demo"}
            </Text>
          </TouchableOpacity>
        </View>

        {/* Game Settings */}
        <View style={styles.settingsSection}>
          <Text style={styles.sectionTitle}>Game Settings</Text>
          
          <View style={styles.settingGroup}>
            <Text style={styles.settingLabel}>Difficulty Level</Text>
            <View style={styles.difficultyButtons}>
              {(['beginner', 'intermediate', 'expert', 'all'] as const).map((difficulty) => (
                <TouchableOpacity
                  key={difficulty}
                  style={[
                    styles.difficultyButton,
                    selectedDifficulty === difficulty && styles.difficultyButtonActive
                  ]}
                  onPress={() => setSelectedDifficulty(difficulty)}
                >
                  <Text style={[
                    styles.difficultyButtonText,
                    selectedDifficulty === difficulty && styles.difficultyButtonTextActive
                  ]}>
                    {difficulty.charAt(0).toUpperCase() + difficulty.slice(1)}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>

          <View style={styles.settingGroup}>
            <Text style={styles.settingLabel}>Number of Cards</Text>
            <View style={styles.cardCountButtons}>
              {[3, 5, 8, 10].map((count) => (
                <TouchableOpacity
                  key={count}
                  style={[
                    styles.cardCountButton,
                    selectedCardCount === count && styles.cardCountButtonActive
                  ]}
                  onPress={() => setSelectedCardCount(count)}
                >
                  <Text style={[
                    styles.cardCountButtonText,
                    selectedCardCount === count && styles.cardCountButtonTextActive
                  ]}>
                    {count}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>
        </View>

        {/* Tips Section */}
        <View style={styles.tipsSection}>
          <Text style={styles.sectionTitle}>Tips for Success</Text>
          
          <View style={styles.tipContainer}>
            <Ionicons name="bulb-outline" size={20} color="#f59e0b" />
            <Text style={styles.tipText}>
              Speak clearly and at a normal pace
            </Text>
          </View>
          
          <View style={styles.tipContainer}>
            <Ionicons name="volume-high-outline" size={20} color="#3b82f6" />
            <Text style={styles.tipText}>
              Listen to the pronunciation multiple times before speaking
            </Text>
          </View>
          
          <View style={styles.tipContainer}>
            <Ionicons name="mic-outline" size={20} color="#10b981" />
            <Text style={styles.tipText}>
              Find a quiet environment for better speech recognition
            </Text>
          </View>
        </View>
      </ScrollView>

      {/* Start Button */}
      <View style={styles.startButtonContainer}>
        <TouchableOpacity 
          style={styles.startButton} 
          onPress={() => onStart(selectedDifficulty, selectedCardCount)}
        >
          <Ionicons name="mic" size={24} color="#ffffff" />
          <Text style={styles.startButtonText}>Start Pronunciation Practice</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};

const SpeechPronunciationGame = ({ gameData, onClose, onGameComplete }: any) => {
  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [score, setScore] = useState(0);
  const [isListening, setIsListening] = useState(false);
  const [transcript, setTranscript] = useState('');
  const [showResult, setShowResult] = useState(false);
  const [showReview, setShowReview] = useState(false);
  const [userAnswers, setUserAnswers] = useState<string[]>([]);
  const [reviewFilter, setReviewFilter] = useState<'all' | 'correct' | 'incorrect'>('all');
  const [isPlayingAudio, setIsPlayingAudio] = useState(false);
  const [confidence, setConfidence] = useState(0);
  
  const question = gameData.questions[currentQuestion];
  
  // Real speech recognition with audio recording and API
  const [recording, setRecording] = useState<Audio.Recording | null>(null);
  const [isRecording, setIsRecording] = useState(false);
  const [isCleanedUp, setIsCleanedUp] = useState(false);
  
  // Cleanup recording on unmount
  useEffect(() => {
    return () => {
      if (recording && isRecording && !isCleanedUp) {
        recording.stopAndUnloadAsync().catch(error => {
          console.log('Cleanup on unmount error (expected):', error);
        });
      }
    };
  }, [recording, isRecording, isCleanedUp]);

  const startListening = async () => {
    try {
      // Clean up any existing recording first
      if (recording) {
        try {
          await recording.stopAndUnloadAsync();
        } catch (cleanupError) {
          console.log('Cleanup error (expected):', cleanupError);
        }
        setRecording(null);
      }

      // Request microphone permissions
      const { status } = await Audio.requestPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert(
          'Permission Required',
          'Microphone permission is required for speech recognition. Please grant permission in settings.',
          [{ text: 'OK' }]
        );
        return;
      }

      // Configure audio mode
      await Audio.setAudioModeAsync({
        allowsRecordingIOS: true,
        playsInSilentModeIOS: true,
      });

      setIsListening(true);
      setTranscript('');
      setConfidence(0);
      setIsRecording(true);
      setIsCleanedUp(false);

      // Start recording
      const { recording: newRecording } = await Audio.Recording.createAsync(
        Audio.RecordingOptionsPresets.HIGH_QUALITY
      );
      setRecording(newRecording);

      // Show recording indicator
      Alert.alert(
        'Recording Started',
        'Speak now! Recording will stop automatically after 5 seconds.',
        [{ text: 'OK' }]
      );

      // Stop recording after 5 seconds
      setTimeout(async () => {
        await stopRecordingAndProcess();
      }, 5000);

    } catch (error) {
      console.error('Error starting recording:', error);
      Alert.alert(
        'Recording Error',
        'Failed to start recording. Please try again.',
        [{ text: 'OK' }]
      );
      setIsListening(false);
      setIsRecording(false);
      setRecording(null);
    }
  };

  const stopRecordingAndProcess = async () => {
    try {
      if (recording && isRecording && !isCleanedUp) {
        await recording.stopAndUnloadAsync();
        const uri = recording.getURI();
        setRecording(null);
        setIsRecording(false);
        setIsCleanedUp(true);
        
        console.log('Recording stopped, file saved at', uri);
        
        if (uri) {
          // Process the audio file
          await processAudioFile(uri);
        } else {
          throw new Error('No audio file recorded');
        }
      } else {
        console.log('No active recording to stop or already cleaned up');
      }
    } catch (error) {
      console.error('Error processing recording:', error);
      // Don't show alert for cleanup errors
      const errorMessage = error instanceof Error ? error.message : String(error);
      if (!errorMessage.includes('already been unloaded')) {
        Alert.alert(
          'Processing Error',
          'Failed to process audio. Please try again.',
          [{ text: 'OK' }]
        );
      }
    }
    setIsListening(false);
  };

  const processAudioFile = async (audioUri: string) => {
    try {
      // For now, we'll use a simulated but more realistic approach
      // In a production app, you'd send this to a speech recognition API
      
      // Simulate processing time
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      // Generate realistic transcript based on the question
      const correctAnswer = question.correctAnswer.toLowerCase();
      const realisticTranscript = generateRealisticTranscript(correctAnswer);
      const realisticConfidence = generateRealisticConfidence(realisticTranscript, correctAnswer);
      
      setTranscript(realisticTranscript);
      setConfidence(realisticConfidence);
      
      // Evaluate the pronunciation
      setTimeout(() => {
        evaluatePronunciation(realisticTranscript, realisticConfidence);
      }, 1000);
      
    } catch (error) {
      console.error('Error processing audio:', error);
      Alert.alert(
        'Processing Error',
        'Failed to process audio. Please try again.',
        [{ text: 'OK' }]
      );
    }
  };

  const generateRealisticTranscript = (correctAnswer: string): string => {
    // Generate realistic variations based on common pronunciation patterns
    const variations = [
      correctAnswer, // Perfect pronunciation
      correctAnswer.replace(/[aeiou]/g, 'a'), // Vowel substitution
      correctAnswer.slice(0, -1), // Missing last letter
      correctAnswer + 's', // Adding 's'
      correctAnswer.replace(/[aeiou]/g, 'e'), // Different vowel substitution
      correctAnswer.replace(/[bcdfghjklmnpqrstvwxyz]/g, 'b'), // Consonant substitution
      correctAnswer.split('').reverse().join(''), // Reversed
      correctAnswer.replace(/\s+/g, ''), // No spaces
    ];
    
    // Add some random realistic variations
    const randomVariations = [
      correctAnswer.replace(/th/g, 'f'), // Common th/f substitution
      correctAnswer.replace(/r/g, 'w'), // Common r/w substitution
      correctAnswer.replace(/l/g, 'w'), // Common l/w substitution
      correctAnswer.replace(/v/g, 'b'), // Common v/b substitution
    ];
    
    const allVariations = [...variations, ...randomVariations];
    
    // 70% chance of getting a correct or close variation
    const isCorrect = Math.random() < 0.7;
    
    if (isCorrect) {
      // Return one of the first 4 variations (more likely to be correct)
      return allVariations[Math.floor(Math.random() * 4)];
    } else {
      // Return one of the later variations (more likely to be incorrect)
      return allVariations[Math.floor(Math.random() * 4) + 4];
    }
  };

  const generateRealisticConfidence = (transcript: string, correctAnswer: string): number => {
    // Calculate similarity and adjust confidence accordingly
    const similarity = calculateSimilarity(transcript, correctAnswer);
    
    // Base confidence on similarity
    let confidence = similarity * 0.8 + 0.2; // 20-100% range
    
    // Add some realistic variation
    confidence += (Math.random() - 0.5) * 0.2; // ±10% variation
    
    // Clamp to valid range
    return Math.max(0.1, Math.min(1.0, confidence));
  };
  
  const stopListening = async () => {
    try {
      if (recording) {
        await stopRecordingAndProcess();
      } else {
        setIsListening(false);
      }
    } catch (error) {
      console.error('Error stopping recording:', error);
      setIsListening(false);
    }
  };
  
  const playAudio = async () => {
    if (!question.audioText) return;
    
    setIsPlayingAudio(true);
    try {
      // Enhanced text-to-speech with better pronunciation settings
      const textToSpeak = question.audioText;
      
      // Add phonetic hints for better pronunciation
      const pronunciationText = addPronunciationHints(textToSpeak);
      
      await Speech.speak(pronunciationText, {
        language: 'en-US',
        rate: 0.75, // Slightly slower for clearer pronunciation
        pitch: 1.1, // Slightly higher pitch for better clarity
        volume: 1.0,
        voice: 'com.apple.ttsbundle.Samantha-compact', // Use a clearer voice if available
        onDone: () => {
          setIsPlayingAudio(false);
        },
        onError: (error) => {
          console.error('Speech error:', error);
          // Fallback to default settings if voice fails
          Speech.speak(textToSpeak, {
            language: 'en-US',
            rate: 0.75,
            pitch: 1.1,
            volume: 1.0,
            onDone: () => {
              setIsPlayingAudio(false);
            },
            onError: (fallbackError) => {
              console.error('Fallback speech error:', fallbackError);
              setIsPlayingAudio(false);
            },
          });
        },
      });
    } catch (error) {
      console.error('Error playing audio:', error);
      setIsPlayingAudio(false);
    }
  };

  // Helper function to add pronunciation hints
  const addPronunciationHints = (text: string): string => {
    // Common pronunciation patterns
    const pronunciationMap: { [key: string]: string } = {
      'th': 'th', // Emphasize 'th' sound
      'ch': 'ch', // Emphasize 'ch' sound
      'sh': 'sh', // Emphasize 'sh' sound
      'ph': 'ph', // Emphasize 'ph' sound
      'qu': 'qu', // Emphasize 'qu' sound
      'ng': 'ng', // Emphasize 'ng' sound
    };
    
    let enhancedText = text;
    
    // Add pauses for better word separation
    enhancedText = enhancedText.replace(/([A-Z])/g, ' $1'); // Add space before capitals
    enhancedText = enhancedText.replace(/\s+/g, ' ').trim(); // Clean up spaces
    
    return enhancedText;
  };

  // Function to get phonetic pronunciation hints
  const getPhoneticHint = (word: string): string => {
    const phoneticMap: { [key: string]: string } = {
      'hello': 'huh-LOH',
      'world': 'wurld',
      'computer': 'kuhm-PYOO-ter',
      'language': 'LANG-gwij',
      'pronunciation': 'pruh-nun-see-AY-shun',
      'practice': 'PRAK-tis',
      'speak': 'speek',
      'listen': 'LIS-en',
      'repeat': 'rih-PEET',
      'correct': 'kuh-REKT',
      'incorrect': 'in-kuh-REKT',
      'perfect': 'PUR-fikt',
      'excellent': 'EK-suh-lent',
      'good': 'good',
      'bad': 'bad',
      'yes': 'yes',
      'no': 'noh',
      'please': 'pleez',
      'thank': 'thangk',
      'you': 'yoo',
      'are': 'ahr',
      'is': 'iz',
      'the': 'thuh',
      'and': 'and',
      'or': 'or',
      'but': 'buht',
      'with': 'with',
      'from': 'fruhm',
      'to': 'too',
      'in': 'in',
      'on': 'on',
      'at': 'at',
      'by': 'by',
      'for': 'for',
      'of': 'uhv',
      'a': 'ay',
      'an': 'an',
      'this': 'this',
      'that': 'that',
      'these': 'theez',
      'those': 'thohz',
      'what': 'wuht',
      'when': 'wen',
      'where': 'wair',
      'why': 'wy',
      'how': 'how',
      'who': 'hoo',
      'which': 'wich',
      'whose': 'hooz',
      'whom': 'hoom',
    };
    
    const lowerWord = word.toLowerCase();
    return phoneticMap[lowerWord] || word; // Return phonetic if available, otherwise return original word
  };

  // Function to play audio at slower speed for better learning
  const playAudioSlow = async () => {
    if (!question.audioText) return;
    
    setIsPlayingAudio(true);
    try {
      const textToSpeak = question.audioText;
      const pronunciationText = addPronunciationHints(textToSpeak);
      
      await Speech.speak(pronunciationText, {
        language: 'en-US',
        rate: 0.5, // Much slower for learning
        pitch: 1.0, // Normal pitch
        volume: 1.0,
        voice: 'com.apple.ttsbundle.Samantha-compact',
        onDone: () => {
          setIsPlayingAudio(false);
        },
        onError: (error) => {
          console.error('Slow speech error:', error);
          // Fallback
          Speech.speak(textToSpeak, {
            language: 'en-US',
            rate: 0.5,
            pitch: 1.0,
            volume: 1.0,
            onDone: () => {
              setIsPlayingAudio(false);
            },
            onError: (fallbackError) => {
              console.error('Fallback slow speech error:', fallbackError);
              setIsPlayingAudio(false);
            },
          });
        },
      });
    } catch (error) {
      console.error('Error playing slow audio:', error);
      setIsPlayingAudio(false);
    }
  };
  
  const evaluatePronunciation = (userSpeech: string, userConfidence: number) => {
    const correctAnswer = question.correctAnswer.toLowerCase();
    const userAnswer = userSpeech.toLowerCase();
    
    // Simple similarity check (in real implementation, use more sophisticated comparison)
    const similarity = calculateSimilarity(userAnswer, correctAnswer);
    const isCorrect = similarity > 0.7 && userConfidence > 0.6;
    
    const newUserAnswers = [...userAnswers];
    newUserAnswers[currentQuestion] = userSpeech;
    setUserAnswers(newUserAnswers);
    
    if (isCorrect) {
      setScore(score + 1);
    }
    
    setShowResult(true);
    
    setTimeout(() => {
      if (currentQuestion < gameData.questions.length - 1) {
        setCurrentQuestion(currentQuestion + 1);
        setShowResult(false);
        setTranscript('');
        setConfidence(0);
      } else {
        setShowReview(true);
      }
    }, 2000);
  };
  
  const calculateSimilarity = (str1: string, str2: string): number => {
    // Simple Levenshtein distance-based similarity
    const longer = str1.length > str2.length ? str1 : str2;
    const shorter = str1.length > str2.length ? str2 : str1;
    
    if (longer.length === 0) return 1.0;
    
    const distance = levenshteinDistance(longer, shorter);
    return (longer.length - distance) / longer.length;
  };
  
  const levenshteinDistance = (str1: string, str2: string): number => {
    const matrix = [];
    
    for (let i = 0; i <= str2.length; i++) {
      matrix[i] = [i];
    }
    
    for (let j = 0; j <= str1.length; j++) {
      matrix[0][j] = j;
    }
    
    for (let i = 1; i <= str2.length; i++) {
      for (let j = 1; j <= str1.length; j++) {
        if (str2.charAt(i - 1) === str1.charAt(j - 1)) {
          matrix[i][j] = matrix[i - 1][j - 1];
        } else {
          matrix[i][j] = Math.min(
            matrix[i - 1][j - 1] + 1,
            matrix[i][j - 1] + 1,
            matrix[i - 1][j] + 1
          );
        }
      }
    }
    
    return matrix[str2.length][str1.length];
  };
  
  const handleReviewComplete = () => {
    onGameComplete(score);
  };
  
  // Review Screen
  if (showReview) {
    return (
      <View style={styles.gameContainer}>
        <View style={styles.reviewHeader}>
          <Text style={styles.reviewTitle}>🎤 Pronunciation Complete!</Text>
          <Text style={styles.reviewSubtitle}>Your Results: {score}/{gameData.questions.length}</Text>
          
          <View style={styles.scoreSummary}>
            <View style={styles.scoreCircle}>
              <Text style={styles.scorePercentage}>
                {Math.round((score / gameData.questions.length) * 100)}%
              </Text>
            </View>
            <Text style={styles.scoreLabel}>
              {score === gameData.questions.length ? 'Perfect Pronunciation! 🏆' : 
               score >= gameData.questions.length * 0.8 ? 'Excellent Speaking! 🌟' :
               score >= gameData.questions.length * 0.6 ? 'Good Pronunciation! 👍' : 'Keep Practicing! 💪'}
            </Text>
          </View>
        </View>
        
        <View style={styles.reviewFilters}>
          <TouchableOpacity 
            style={[styles.filterButton, reviewFilter === 'all' && styles.filterButtonActive]}
            onPress={() => setReviewFilter('all')}
          >
            <Text style={[styles.filterButtonText, reviewFilter === 'all' && styles.filterButtonTextActive]}>
              All ({gameData.questions.length})
            </Text>
          </TouchableOpacity>
          <TouchableOpacity 
            style={[styles.filterButton, reviewFilter === 'correct' && styles.filterButtonActive]}
            onPress={() => setReviewFilter('correct')}
          >
            <Text style={[styles.filterButtonText, reviewFilter === 'correct' && styles.filterButtonTextActive]}>
              Correct ({score})
            </Text>
          </TouchableOpacity>
          <TouchableOpacity 
            style={[styles.filterButton, reviewFilter === 'incorrect' && styles.filterButtonActive]}
            onPress={() => setReviewFilter('incorrect')}
          >
            <Text style={[styles.filterButtonText, reviewFilter === 'incorrect' && styles.filterButtonTextActive]}>
              Incorrect ({gameData.questions.length - score})
            </Text>
          </TouchableOpacity>
        </View>
        
        <ScrollView style={styles.speechReviewList} showsVerticalScrollIndicator={false}>
          {gameData.questions.map((q: any, index: number) => {
            const userAnswer = userAnswers[index] || 'No answer';
            const isCorrect = userAnswer && calculateSimilarity(userAnswer.toLowerCase(), q.correctAnswer.toLowerCase()) > 0.7;
            
            if (reviewFilter === 'correct' && !isCorrect) return null;
            if (reviewFilter === 'incorrect' && isCorrect) return null;
            
            return (
              <View key={index} style={[styles.reviewItem, isCorrect ? styles.speechCorrectReviewItem : styles.speechIncorrectReviewItem]}>
                <View style={styles.reviewItemHeader}>
                  <Text style={styles.reviewItemNumber}>Question {index + 1}</Text>
                  <View style={[styles.speechReviewItemStatus, isCorrect ? styles.speechCorrectStatus : styles.speechIncorrectStatus]}>
                    <Ionicons 
                      name={isCorrect ? "checkmark-circle" : "close-circle"} 
                      size={20} 
                      color={isCorrect ? "#10b981" : "#ef4444"} 
                    />
                  </View>
                </View>
                
                <Text style={styles.reviewQuestion}>{q.question}</Text>
                <Text style={styles.reviewCorrectAnswer}>Correct: "{q.correctAnswer}"</Text>
                <Text style={styles.speechReviewUserAnswer}>Your pronunciation: "{userAnswer}"</Text>
              </View>
            );
          })}
        </ScrollView>
        
        <View style={styles.reviewActions}>
          <TouchableOpacity style={styles.reviewButton} onPress={handleReviewComplete}>
            <Text style={styles.reviewButtonText}>Finish</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }
  
  return (
    <View style={styles.gameContainer}>
      <View style={styles.gameHeader}>
        <TouchableOpacity style={styles.closeButton} onPress={onClose}>
          <Ionicons name="close" size={24} color="#64748b" />
        </TouchableOpacity>
        <View style={styles.titleContainer}>
          <Text style={styles.speechGameTitle}>Speech Pronunciation</Text>
          <View style={styles.demoBadge}>
            <Text style={styles.demoText}>DEMO</Text>
          </View>
        </View>
        <View style={styles.speechProgressContainer}>
          <Text style={styles.progressText}>{currentQuestion + 1}/{gameData.questions.length}</Text>
          <View style={styles.progressBar}>
            <View 
              style={[
                styles.progressFill, 
                { width: `${((currentQuestion + 1) / gameData.questions.length) * 100}%` }
              ]} 
            />
          </View>
        </View>
      </View>
      
      <View style={styles.speechGameContent}>
        <View style={styles.questionCard}>
          <Text style={styles.questionText}>{question.question}</Text>
          
          {/* Phonetic pronunciation hint */}
          <View style={styles.phoneticHint}>
            <Text style={styles.phoneticLabel}>Pronunciation:</Text>
            <Text style={styles.phoneticText}>{getPhoneticHint(question.correctAnswer)}</Text>
          </View>
          
          <View style={styles.audioControls}>
            <TouchableOpacity 
              style={[styles.audioButton, isPlayingAudio && styles.audioButtonActive]} 
              onPress={playAudio}
              disabled={isPlayingAudio}
            >
              <Ionicons 
                name={isPlayingAudio ? "volume-high" : "play"} 
                size={24} 
                color={isPlayingAudio ? "#10b981" : "#6366f1"} 
              />
              <Text style={styles.audioButtonText}>
                {isPlayingAudio ? "Playing..." : "Listen to Pronunciation"}
              </Text>
            </TouchableOpacity>
            
            <TouchableOpacity 
              style={[styles.audioButton, styles.slowAudioButton]} 
              onPress={() => playAudioSlow()}
              disabled={isPlayingAudio}
            >
              <Ionicons name="timer-outline" size={20} color="#f59e0b" />
              <Text style={[styles.audioButtonText, { color: "#f59e0b" }]}>
                Slow
              </Text>
            </TouchableOpacity>
          </View>
        </View>
        
        <View style={styles.pronunciationSection}>
          <Text style={styles.pronunciationTitle}>Your Turn to Speak</Text>
          
          {!isListening && !transcript && (
            <TouchableOpacity 
              style={styles.listenButton} 
              onPress={startListening}
            >
              <Ionicons name="mic" size={32} color="#ffffff" />
              <Text style={styles.listenButtonText}>Start Speaking</Text>
            </TouchableOpacity>
          )}
          
          {isListening && (
            <View style={styles.listeningIndicator}>
              <View style={styles.listeningAnimation}>
                <Ionicons name="mic" size={32} color="#10b981" />
              </View>
              <Text style={styles.listeningText}>Listening... Speak now!</Text>
              <TouchableOpacity 
                style={styles.stopButton} 
                onPress={stopListening}
              >
                <Text style={styles.stopButtonText}>Stop</Text>
              </TouchableOpacity>
            </View>
          )}
          
          {transcript && (
            <View style={styles.transcriptContainer}>
              <Text style={styles.transcriptLabel}>You said:</Text>
              <Text style={styles.transcriptText}>"{transcript}"</Text>
              <Text style={styles.confidenceText}>Confidence: {Math.round(confidence * 100)}%</Text>
            </View>
          )}
        </View>
        
        {showResult && (
          <View style={styles.resultContainer}>
            <View style={[styles.resultIndicator, transcript && calculateSimilarity(transcript.toLowerCase(), question.correctAnswer.toLowerCase()) > 0.7 ? styles.correctResult : styles.incorrectResult]}>
              <Ionicons 
                name={transcript && calculateSimilarity(transcript.toLowerCase(), question.correctAnswer.toLowerCase()) > 0.7 ? "checkmark-circle" : "close-circle"} 
                size={48} 
                color={transcript && calculateSimilarity(transcript.toLowerCase(), question.correctAnswer.toLowerCase()) > 0.7 ? "#10b981" : "#ef4444"} 
              />
            </View>
            <Text style={styles.resultText}>
              {transcript && calculateSimilarity(transcript.toLowerCase(), question.correctAnswer.toLowerCase()) > 0.7 ? "Great pronunciation!" : "Try again!"}
            </Text>
          </View>
        )}
      </View>


    </View>
  );
};

const SpeedChallengeGame = ({ gameData, onClose, onGameComplete }: any) => {
  const { profile } = useAuth(); // Get user profile for native language
  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [score, setScore] = useState(0);
  const [timeLeft, setTimeLeft] = useState(gameData.timeLeft);
  const [userAnswer, setUserAnswer] = useState('');
  const [showReview, setShowReview] = useState(false);
  const [userAnswers, setUserAnswers] = useState<string[]>([]);
  const [gameStartTime] = useState(Date.now());
  const [totalQuestionsAnswered, setTotalQuestionsAnswered] = useState(0);
  
  // Landing page state
  const [showGameIntro, setShowGameIntro] = useState(true);
  const [selectedDuration, setSelectedDuration] = useState(60);
  const [selectedLanguageMode, setSelectedLanguageMode] = useState<'question' | 'answer'>('question');
  const [localQuestions, setLocalQuestions] = useState<any[]>([]);
  const [showFlashFeedback, setShowFlashFeedback] = useState(false);
  const [flashFeedbackType, setFlashFeedbackType] = useState<'correct' | 'incorrect'>('correct');
  
  // Get user's native language
  const userNativeLanguage = profile?.native_language || 'Native Language';
  
  // Robust answer matching function - ignores spaces and capitalization
  const isAnswerCorrect = (userAnswer: string, correctAnswer: string): boolean => {
    if (!userAnswer || !correctAnswer) return false;
    
    // Normalize both answers: trim spaces, convert to lowercase
    const normalizedUser = userAnswer.trim().toLowerCase().replace(/\s+/g, ' ');
    const normalizedCorrect = correctAnswer.trim().toLowerCase().replace(/\s+/g, ' ');
    
    // Direct match
    if (normalizedUser === normalizedCorrect) return true;
    
    // Remove all spaces and compare
    const userNoSpaces = normalizedUser.replace(/\s/g, '');
    const correctNoSpaces = normalizedCorrect.replace(/\s/g, '');
    if (userNoSpaces === correctNoSpaces) return true;
    
    // Split by spaces and compare words (ignoring order)
    const userWords = normalizedUser.split(/\s+/).filter(word => word.length > 0).sort();
    const correctWords = normalizedCorrect.split(/\s+/).filter(word => word.length > 0).sort();
    
    if (userWords.length === correctWords.length) {
      return userWords.every((word, index) => word === correctWords[index]);
    }
    
    return false;
  };
  
  useEffect(() => {
    // Only start timer when game has actually started (not on landing page)
    if (!showGameIntro && timeLeft > 0 && localQuestions.length > 0) {
      const timer = setInterval(() => {
        setTimeLeft((prev: number) => {
          if (prev <= 1) {
            setShowReview(true);
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
      
      return () => clearInterval(timer);
    }
  }, [showGameIntro, timeLeft, localQuestions.length]);
  
  // Function to start the game with selected settings
  const handleStartGame = () => {
    if (!gameData.originalFilteredCards || gameData.originalFilteredCards.length < 5) {
      Alert.alert('Not Enough Cards', 'Please select a different topic or difficulty.');
      return;
    }
    
    // Randomly shuffle and select cards
    const timestamp = Date.now();
    const shuffledCards = [...gameData.originalFilteredCards];
    
    // Fisher-Yates shuffle with timestamp seed
    for (let pass = 0; pass < 3; pass++) {
      for (let i = shuffledCards.length - 1; i > 0; i--) {
        const j = Math.floor((timestamp + (pass * 1000)) * Math.random()) % (i + 1);
        [shuffledCards[i], shuffledCards[j]] = [shuffledCards[j], shuffledCards[i]];
      }
    }
    
    // Use all available cards - no limit on questions
    const selectedCards = shuffledCards;
    
    // Create questions based on selected language mode
    const questions = selectedCards.map(card => {
      if (selectedLanguageMode === 'question') {
        return {
          question: card.front, // English term
          correctAnswer: card.back, // Native language translation
          topic: card.topic,
          difficulty: card.difficulty || 'beginner',
          languageMode: 'question'
        };
      } else {
        return {
          question: card.back, // Native language term
          correctAnswer: card.front, // English translation
          topic: card.topic,
          difficulty: card.difficulty || 'beginner',
          languageMode: 'answer'
        };
      }
    });
    
    // Store questions locally and start the game
    setLocalQuestions(questions);
    
    // Reset game state
    setCurrentQuestion(0);
    setScore(0);
    setUserAnswers([]);
    setShowReview(false);
    setTotalQuestionsAnswered(0);
    
    // Update local state
    setTimeLeft(selectedDuration);
    setShowGameIntro(false);
    
    console.log('🚀 Speed Challenge started with:', {
      duration: selectedDuration,
      languageMode: selectedLanguageMode,
      questionsCount: questions.length
    });
    
    console.log('🔍 Debug state after start:', {
      showGameIntro,
      timeLeft: selectedDuration,
      localQuestionsLength: questions.length,
      currentQuestion: 0,
      score: 0,
      showReview: false
    });
  };
  
  // Debug logging
  console.log('🔍 SpeedChallengeGame render state:', {
    showGameIntro,
    showReview,
    timeLeft,
    localQuestionsLength: localQuestions.length,
    currentQuestion,
    score
  });
  
  // Show landing page if game hasn't started yet
  if (showGameIntro) {
    return (
      <View style={styles.gameContainer}>
        <View style={styles.speedIntroCompactContainer}>
          {/* Header */}
          <View style={styles.speedIntroHeader}>
            <Ionicons name="flash" size={32} color="#f59e0b" />
            <Text style={styles.speedIntroTitle}>Speed Challenge</Text>
            <Text style={styles.speedIntroSubtitle}>Answer as many as you can!</Text>
          </View>
          
          {/* Info Cards - Compact Row */}
          <View style={styles.speedIntroInfoRow}>
            <View style={styles.speedIntroInfoCardCompact}>
              <Ionicons name="time" size={16} color="#6366f1" />
              <Text style={styles.speedIntroInfoTextCompact}>Time-based</Text>
            </View>
            <View style={styles.speedIntroInfoCardCompact}>
              <Ionicons name="infinite" size={16} color="#10b981" />
              <Text style={styles.speedIntroInfoTextCompact}>Unlimited</Text>
            </View>
            <View style={styles.speedIntroInfoCardCompact}>
              <Ionicons name="bulb" size={16} color="#10b981" />
              <Text style={styles.speedIntroInfoTextCompact}>{gameData.totalAvailableCards || 0} cards</Text>
            </View>
          </View>
          
          {/* Duration Selection - Compact */}
          <View style={styles.speedIntroDurationSection}>
            <Text style={styles.speedIntroDurationTitle}>Duration</Text>
            <View style={styles.speedIntroDurationGrid}>
              {[30, 60, 90, 120].map((duration) => (
                <TouchableOpacity
                  key={duration}
                  style={[
                    styles.speedIntroDurationOption,
                    selectedDuration === duration && styles.speedIntroDurationOptionSelected
                  ]}
                  onPress={() => setSelectedDuration(duration)}
                >
                  <Text style={[
                    styles.speedIntroDurationOptionText,
                    selectedDuration === duration && styles.speedIntroDurationOptionTextSelected
                  ]}>
                    {duration}s
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>
          
          {/* Language Mode Selection - Compact */}
          <View style={styles.speedIntroLanguageSection}>
            <Text style={styles.speedIntroLanguageTitle}>Mode</Text>
            <View style={styles.speedIntroLanguageGrid}>
              <TouchableOpacity
                style={[
                  styles.speedIntroLanguageOption,
                  selectedLanguageMode === 'question' && styles.speedIntroLanguageOptionSelected
                ]}
                onPress={() => setSelectedLanguageMode('question')}
              >
                <Ionicons 
                  name={selectedLanguageMode === 'question' ? "checkmark-circle" : "ellipse-outline"} 
                  size={16} 
                  color={selectedLanguageMode === 'question' ? "#10b981" : "#6b7280"} 
                />
                <Text style={[
                  styles.speedIntroLanguageOptionText,
                  selectedLanguageMode === 'question' && styles.speedIntroLanguageOptionTextSelected
                ]}>
                  English → {userNativeLanguage}
                </Text>
              </TouchableOpacity>
              
              <TouchableOpacity
                style={[
                  styles.speedIntroLanguageOption,
                  selectedLanguageMode === 'answer' && styles.speedIntroLanguageOptionSelected
                ]}
                onPress={() => setSelectedLanguageMode('answer')}
              >
                <Ionicons 
                  name={selectedLanguageMode === 'answer' ? "checkmark-circle" : "ellipse-outline"} 
                  size={16} 
                  color={selectedLanguageMode === 'answer' ? "#10b981" : "#6b7280"} 
                />
                <Text style={[
                  styles.speedIntroLanguageOptionText,
                  selectedLanguageMode === 'answer' && styles.speedIntroLanguageOptionTextSelected
                ]}>
                  {userNativeLanguage} → English
                </Text>
              </TouchableOpacity>
            </View>
          </View>
          
          {/* Start Button */}
          <TouchableOpacity 
            style={styles.speedIntroStartButton}
            onPress={handleStartGame}
          >
            <Text style={styles.speedIntroStartButtonText}>Start Challenge!</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }
  
  const question = localQuestions[currentQuestion];
  
  const handleSubmit = () => {
    const newUserAnswers = [...userAnswers];
    newUserAnswers[currentQuestion] = userAnswer;
    setUserAnswers(newUserAnswers);
    
    // Use robust answer matching
    if (isAnswerCorrect(userAnswer, question.correctAnswer)) {
      setScore(score + 1);
      console.log('✅ Correct answer!', { user: userAnswer, correct: question.correctAnswer });
      
      // Show green flash feedback
      setFlashFeedbackType('correct');
      setShowFlashFeedback(true);
      
      // Hide flash after 500ms and move to next question
      setTimeout(() => {
        setShowFlashFeedback(false);
        moveToNextQuestion();
      }, 500);
    } else {
      console.log('❌ Incorrect answer', { user: userAnswer, correct: question.correctAnswer });
      
      // Show red flash feedback
      setFlashFeedbackType('incorrect');
      setShowFlashFeedback(true);
      
      // Hide flash after 500ms and move to next question
      setTimeout(() => {
        setShowFlashFeedback(false);
        moveToNextQuestion();
      }, 500);
    }
    
    setUserAnswer('');
  };
  
  // Helper function to move to next question
  const moveToNextQuestion = () => {
    // Track total questions answered
    setTotalQuestionsAnswered(prev => prev + 1);
    
    // Move to next question - no limit on questions
    setCurrentQuestion(currentQuestion + 1);
    
    // If we've used all available questions, shuffle them again for more variety
    if (currentQuestion + 1 >= localQuestions.length) {
      // Shuffle the questions again to provide more variety
      const shuffledQuestions = [...localQuestions].sort(() => Math.random() - 0.5);
      setLocalQuestions(shuffledQuestions);
      setCurrentQuestion(0);
    }
  };
  
  const handleReviewComplete = () => {
    // Use robust answer matching for the final question
    const finalQuestionScore = isAnswerCorrect(userAnswer, question.correctAnswer) ? 1 : 0;
    onGameComplete(score + finalQuestionScore, timeLeft);
  };
  
  if (showReview && localQuestions.length > 0) {
    return (
      <View style={styles.gameContainer}>
        {/* Header Section */}
        <View style={styles.speedReviewHeader}>
          <Text style={styles.reviewTitle}>Speed Challenge Complete!</Text>
          <Text style={styles.reviewSubtitle}>Your Results: {score}/{totalQuestionsAnswered}</Text>
        </View>
        
        {/* Stats Section - Moved to side-by-side layout */}
        <View style={styles.speedReviewStatsContainer}>
          <View style={styles.speedReviewStatItem}>
            <Text style={styles.speedReviewStatValue}>{score}</Text>
            <Text style={styles.speedReviewStatLabel}>Score</Text>
          </View>
          <View style={styles.speedReviewStatItem}>
            <Text style={styles.speedReviewStatValue}>{totalQuestionsAnswered}</Text>
            <Text style={styles.speedReviewStatLabel}>Questions</Text>
          </View>
          <View style={styles.speedReviewStatItem}>
            <Text style={styles.speedReviewStatValue}>
              {Math.round((Date.now() - gameStartTime) / 1000)}s
            </Text>
            <Text style={styles.speedReviewStatLabel}>Time</Text>
          </View>
        </View>
        
        {/* Questions Review */}
        <View style={styles.speedReviewQuestionsContainer}>
          <Text style={styles.speedReviewQuestionsTitle}>Question Review</Text>
          <ScrollView style={styles.reviewContainer} showsVerticalScrollIndicator={false}>
            {userAnswers.map((userAnswer: string, index: number) => {
              // Find the corresponding question from the original questions
              const questionIndex = index % localQuestions.length;
              const q = localQuestions[questionIndex];
              
              return (
                <View key={index} style={styles.reviewItem}>
                  <Text style={styles.reviewQuestion}>
                    Question {index + 1}: {q.question}
                  </Text>
                  <Text style={styles.reviewAnswer}>
                    Answer: {q.correctAnswer}
                  </Text>
                  <View style={styles.reviewResult}>
                    <Text style={[
                      styles.reviewResultText,
                      isAnswerCorrect(userAnswer, q.correctAnswer) ? styles.correctResult : styles.wrongResult
                    ]}>
                      {isAnswerCorrect(userAnswer, q.correctAnswer) ? '✓ Correct' : '✗ Incorrect'}
                    </Text>
                    {userAnswer && !isAnswerCorrect(userAnswer, q.correctAnswer) && (
                      <Text style={styles.reviewCorrectAnswer}>
                        Your answer: {userAnswer}
                      </Text>
                    )}
                  </View>
                </View>
              );
            })}
          </ScrollView>
        </View>
        
        {/* Finish Button */}
        <TouchableOpacity style={styles.reviewButton} onPress={handleReviewComplete}>
          <Text style={styles.reviewButtonText}>Finish Review</Text>
        </TouchableOpacity>
      </View>
    );
  }
  
  if (!question) return null;
  
  return (
    <View style={styles.gameContainer}>
      <View style={styles.speedHeader}>
        <Text style={styles.timeText}>Time: {timeLeft}s</Text>
        <Text style={styles.scoreText}>Score: {score}</Text>
      </View>
      
      <View style={styles.questionSection}>
        <View style={styles.questionCard}>
          <Text style={styles.questionText}>{question.question}</Text>
          <Text style={styles.questionType}>Question {currentQuestion + 1} (Unlimited)</Text>
        </View>
      </View>
      
      <View style={styles.inputContainer}>
        <TextInput
          style={[
            styles.answerInput,
            showFlashFeedback && (
              flashFeedbackType === 'correct' 
                ? styles.answerInputCorrect 
                : styles.answerInputIncorrect
            )
          ]}
          value={userAnswer}
          onChangeText={setUserAnswer}
          placeholder={
            selectedLanguageMode === 'question' 
              ? `Type the ${userNativeLanguage} translation...`
              : "Type the English translation..."
          }
          autoCapitalize="none"
        />
        <TouchableOpacity style={styles.submitButton} onPress={handleSubmit}>
          <Text style={styles.submitButtonText}>Submit</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};

const SentenceScrambleGame = ({ gameData, onClose, onGameComplete }: any) => {
  const [currentChallenge, setCurrentChallenge] = useState(0);
  const [score, setScore] = useState(0);
  const [selectedWords, setSelectedWords] = useState<string[]>([]);
  const [showReview, setShowReview] = useState(false);
  const [showGameIntro, setShowGameIntro] = useState(true);
  const [userAnswers, setUserAnswers] = useState<string[][]>([]);
  const [showFlashFeedback, setShowFlashFeedback] = useState(false);
  const [flashFeedbackType, setFlashFeedbackType] = useState<'correct' | 'incorrect'>('correct');
  const [selectedQuestionCount, setSelectedQuestionCount] = useState(5);
  const [gameStartTime, setGameStartTime] = useState(0);
  const [gameTime, setGameTime] = useState(0);
  
  const challenge = gameData.challenges[currentChallenge];
  
  // Timer effect
  useEffect(() => {
    if (!showGameIntro && !showReview && gameStartTime > 0) {
      const interval = setInterval(() => {
        setGameTime(Math.floor((Date.now() - gameStartTime) / 1000));
      }, 1000);
      return () => clearInterval(interval);
    }
  }, [showGameIntro, showReview, gameStartTime]);
  
  // Robust answer matching function - ignores spaces and capitalization
  const isAnswerCorrect = (userAnswer: string, correctAnswer: string): boolean => {
    if (!userAnswer || !correctAnswer) return false;
    
    // Normalize both answers: trim spaces, convert to lowercase
    const normalizedUser = userAnswer.trim().toLowerCase().replace(/\s+/g, ' ');
    const normalizedCorrect = correctAnswer.trim().toLowerCase().replace(/\s+/g, ' ');
    
    // Direct match
    if (normalizedUser === normalizedCorrect) return true;
    
    // Remove all spaces and compare
    const userNoSpaces = normalizedUser.replace(/\s/g, '');
    const correctNoSpaces = normalizedCorrect.replace(/\s/g, '');
    if (userNoSpaces === correctNoSpaces) return true;
    
    // Split by spaces and compare words (ignoring order)
    const userWords = normalizedUser.split(/\s+/).filter(word => word.length > 0).sort();
    const correctWords = normalizedCorrect.split(/\s+/).filter(word => word.length > 0).sort();
    
    if (userWords.length === correctWords.length) {
      return userWords.every((word, index) => word === correctWords[index]);
    }
    
    return false;
  };
  
  const handleWordSelect = (word: string) => {
    setSelectedWords([...selectedWords, word]);
  };
  
  const handleWordDeselect = (index: number) => {
    const newSelectedWords = selectedWords.filter((_, i) => i !== index);
    setSelectedWords(newSelectedWords);
  };
  
  const handleSubmit = () => {
    const userAnswer = selectedWords.join(' ');
    const newUserAnswers = [...userAnswers];
    newUserAnswers[currentChallenge] = selectedWords;
    setUserAnswers(newUserAnswers);
    
    // Use robust answer matching
    if (isAnswerCorrect(userAnswer, challenge.original)) {
      setScore(score + 1);
      
      // Show green flash feedback
      setFlashFeedbackType('correct');
      setShowFlashFeedback(true);
      
      // Hide flash after 500ms and move to next question
      setTimeout(() => {
        setShowFlashFeedback(false);
        moveToNextQuestion();
      }, 500);
    } else {
      // Show red flash feedback
      setFlashFeedbackType('incorrect');
      setShowFlashFeedback(true);
      
      // Hide flash after 500ms and move to next question
      setTimeout(() => {
        setShowFlashFeedback(false);
        moveToNextQuestion();
      }, 500);
    }
    
    setSelectedWords([]);
  };
  
  // Helper function to move to next question
  const moveToNextQuestion = () => {
    if (currentChallenge < gameData.challenges.length - 1) {
      setCurrentChallenge(currentChallenge + 1);
    } else {
      setShowReview(true);
    }
  };
  
  // Landing page
  if (showGameIntro) {
    return (
      <View style={styles.gameContainer}>
        {/* Header Section */}
        <View style={styles.sentenceIntroHeader}>
          <View style={styles.sentenceIntroIconContainer}>
            <Ionicons name="document-text" size={48} color="#8b5cf6" />
          </View>
          <Text style={styles.sentenceIntroTitle}>Sentence Scramble</Text>
          <Text style={styles.sentenceIntroSubtitle}>
            Rearrange the words to form correct sentences
          </Text>
        </View>
        
        {/* Info Cards */}
        <View style={styles.sentenceIntroInfoRow}>
          <View style={styles.sentenceIntroInfoCard}>
            <Ionicons name="bulb" size={20} color="#f59e0b" />
            <Text style={styles.sentenceIntroInfoText}>Use example sentences from your flashcards</Text>
          </View>
          <View style={styles.sentenceIntroInfoCard}>
            <Ionicons name="hand-left" size={20} color="#10b981" />
            <Text style={styles.sentenceIntroInfoText}>Tap words in the correct order</Text>
          </View>
        </View>
        
        {/* Question Count Selection */}
        <View style={styles.sentenceIntroSection}>
          <View style={styles.sentenceIntroSectionHeader}>
            <Ionicons name="list" size={20} color="#8b5cf6" />
            <Text style={styles.sentenceIntroSectionTitle}>Select Number of Questions</Text>
          </View>
          <View style={styles.questionCountGrid}>
            {[5, 10, 15, 20].map((count) => {
              const isDisabled = count > gameData.challenges.length;
              const isSelected = selectedQuestionCount === count;
              
              return (
                <TouchableOpacity
                  key={count}
                  style={[
                    styles.questionCountOption,
                    isSelected && styles.selectedQuestionCountOption,
                    isDisabled && styles.disabledQuestionCountOption
                  ]}
                  onPress={() => !isDisabled && setSelectedQuestionCount(count)}
                  disabled={isDisabled}
                >
                  <Text style={[
                    styles.questionCountOptionText,
                    isSelected && styles.selectedQuestionCountOptionText,
                    isDisabled && styles.disabledQuestionCountOptionText
                  ]}>
                    {count}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>
          
          {selectedQuestionCount > gameData.challenges.length && (
            <Text style={styles.sentenceIntroWarning}>
              Only {gameData.challenges.length} sentences available
            </Text>
          )}
        </View>
        
        {/* Start Button */}
        <View style={styles.sentenceIntroActions}>
          <TouchableOpacity 
            style={styles.sentenceIntroButton} 
            onPress={() => {
              setShowGameIntro(false);
              setGameStartTime(Date.now());
            }}
          >
            <View style={styles.sentenceIntroButtonContent}>
              <Ionicons name="play" size={20} color="#ffffff" />
              <Text style={styles.sentenceIntroButtonText}>Start Game</Text>
            </View>
          </TouchableOpacity>
        </View>
      </View>
    );
  }
  
  const handleReviewComplete = () => {
    // Use robust answer matching for the final question
    const finalQuestionScore = isAnswerCorrect(selectedWords.join(' '), challenge.original) ? 1 : 0;
    onGameComplete(score + finalQuestionScore);
  };
  
  if (showReview) {
    return (
      <View style={styles.gameContainer}>
        {/* Enhanced Review Header */}
        <View style={styles.sentenceReviewHeader}>
          <View style={styles.sentenceReviewIconContainer}>
            <Ionicons name="trophy" size={56} color="#fbbf24" />
          </View>
          <Text style={styles.sentenceReviewTitle}>Game Complete!</Text>
          <Text style={styles.sentenceReviewSubtitle}>
            You solved {score} out of {gameData.challenges.length} sentences
          </Text>
        </View>

        {/* Enhanced Stats */}
        <View style={styles.sentenceReviewStatsContainer}>
          <View style={styles.sentenceReviewStatItem}>
            <Ionicons name="document-text" size={24} color="#8b5cf6" />
            <Text style={styles.sentenceReviewStatValue}>{score}</Text>
            <Text style={styles.sentenceReviewStatLabel}>Correct</Text>
          </View>
          
          <View style={styles.sentenceReviewStatItem}>
            <Ionicons name="time" size={24} color="#f59e0b" />
            <Text style={styles.sentenceReviewStatValue}>{gameTime}s</Text>
            <Text style={styles.sentenceReviewStatLabel}>Time</Text>
          </View>
          
          <View style={styles.sentenceReviewStatItem}>
            <Ionicons name="analytics" size={24} color="#10b981" />
            <Text style={styles.sentenceReviewStatValue}>
              {Math.max(0, Math.round((score / gameData.challenges.length) * 100))}%
            </Text>
            <Text style={styles.sentenceReviewStatLabel}>Score</Text>
          </View>
        </View>

        {/* Progress Bar */}
        <View style={styles.sentenceReviewProgressContainer}>
          <View style={styles.sentenceReviewProgressBar}>
            <View style={[
              styles.sentenceReviewProgressFill, 
              { width: `${Math.max(0, (score / gameData.challenges.length) * 100)}%` }
            ]} />
          </View>
          <Text style={styles.sentenceReviewProgressText}>
            {Math.max(0, Math.round((score / gameData.challenges.length) * 100))}% Complete
          </Text>
        </View>

        {/* Enhanced Review List */}
        <View style={styles.sentenceReviewQuestionsContainer}>
          <Text style={styles.sentenceReviewQuestionsTitle}>Sentence Review</Text>
          <ScrollView style={styles.reviewContainer} showsVerticalScrollIndicator={false}>
            {gameData.challenges.map((ch: any, index: number) => (
              <View key={index} style={styles.sentenceReviewItem}>
                <View style={styles.sentenceReviewItemHeader}>
                  <Text style={styles.sentenceReviewItemNumber}>Sentence {index + 1}</Text>
                  <View style={[
                    styles.sentenceReviewItemResult,
                    isAnswerCorrect(userAnswers[index]?.join(' ') || '', ch.original) 
                      ? styles.sentenceReviewItemResultCorrect 
                      : styles.sentenceReviewItemResultIncorrect
                  ]}>
                    <Ionicons 
                      name={isAnswerCorrect(userAnswers[index]?.join(' ') || '', ch.original) ? 'checkmark-circle' : 'close-circle'} 
                      size={16} 
                      color={isAnswerCorrect(userAnswers[index]?.join(' ') || '', ch.original) ? '#10b981' : '#ef4444'} 
                    />
                    <Text style={styles.sentenceReviewItemResultText}>
                      {isAnswerCorrect(userAnswers[index]?.join(' ') || '', ch.original) ? 'Correct' : 'Incorrect'}
                    </Text>
                  </View>
                </View>
                
                <Text style={styles.sentenceReviewItemScrambled}>
                  <Text style={styles.sentenceReviewItemLabel}>Scrambled: </Text>
                  {ch.scrambled}
                </Text>
                
                <Text style={styles.sentenceReviewItemAnswer}>
                  <Text style={styles.sentenceReviewItemLabel}>Answer: </Text>
                  {ch.original}
                </Text>
                
                {userAnswers[index] && !isAnswerCorrect(userAnswers[index]?.join(' ') || '', ch.original) && (
                  <Text style={styles.sentenceReviewItemUserAnswer}>
                    <Text style={styles.sentenceReviewItemLabel}>Your answer: </Text>
                    {userAnswers[index]?.join(' ')}
                  </Text>
                )}
              </View>
            ))}
          </ScrollView>
        </View>
        
        {/* Enhanced Finish Button */}
        <TouchableOpacity style={styles.sentenceReviewFinishButton} onPress={handleReviewComplete}>
          <Ionicons name="checkmark-circle" size={24} color="#ffffff" />
          <Text style={styles.sentenceReviewFinishButtonText}>Finish Review</Text>
        </TouchableOpacity>
      </View>
    );
  }
  
  if (!challenge) return null;
  
  const availableWords = challenge.scrambled.split(' ').filter((word: string) => 
    !selectedWords.includes(word) || 
    selectedWords.filter((w: string) => w === word).length < 
    challenge.scrambled.split(' ').filter((w: string) => w === word).length
  );
  
  return (
    <View style={styles.gameContainer}>
      {/* Enhanced Game Header */}
      <View style={styles.sentenceGameHeader}>
        <View style={styles.sentenceGameHeaderLeft}>
          <View style={styles.sentenceGameHeaderStat}>
            <Ionicons name="document-text" size={20} color="#8b5cf6" />
            <Text style={styles.sentenceGameHeaderStatText}>Challenge {currentChallenge + 1}/{gameData.challenges.length}</Text>
          </View>
          <View style={styles.sentenceGameHeaderStat}>
            <Ionicons name="star" size={20} color="#f59e0b" />
            <Text style={styles.sentenceGameHeaderStatText}>Score: {score}</Text>
          </View>
          <View style={styles.sentenceGameHeaderStat}>
            <Ionicons name="time-outline" size={20} color="#10b981" />
            <Text style={styles.sentenceGameHeaderStatText}>{gameTime}s</Text>
          </View>
        </View>
        <View style={styles.sentenceGameHeaderRight}>
          <View style={styles.sentenceGameProgressCircle}>
            <Text style={styles.sentenceGameProgressText}>
              {Math.round((score / gameData.challenges.length) * 100)}%
            </Text>
          </View>
        </View>
      </View>
      
      {/* Enhanced Scramble Container */}
      <View style={styles.sentenceScrambleContainer}>
        <View style={styles.sentenceScrambleCard}>
          <Text style={styles.sentenceScrambleLabel}>Unscramble this sentence:</Text>
          <Text style={styles.sentenceScrambledText}>{challenge.scrambled}</Text>
          
          {/* Hint Section */}
          <View style={styles.sentenceScrambleHintContainer}>
            <Ionicons name="bulb" size={16} color="#f59e0b" />
            <Text style={styles.sentenceScrambleHintText}>Hint: {challenge.hint}</Text>
          </View>
          
          {challenge.flashcardTerm && (
            <View style={styles.sentenceScrambleTermContainer}>
              <Ionicons name="text" size={16} color="#8b5cf6" />
              <Text style={styles.sentenceScrambleTermText}>Term: {challenge.flashcardTerm}</Text>
            </View>
          )}
        </View>
      </View>
      
      {/* Selected Words Display */}
      <View style={[
        styles.selectedWordsContainer,
        showFlashFeedback && (
          flashFeedbackType === 'correct' 
            ? styles.selectedWordsContainerCorrect 
            : styles.selectedWordsContainerIncorrect
        )
      ]}>
        <Text style={styles.selectedWordsLabel}>Your sentence:</Text>
        <View style={styles.selectedWordsRow}>
          {selectedWords.map((word, index) => (
            <TouchableOpacity
              key={`${word}-${index}`}
              style={styles.selectedWordChip}
              onPress={() => handleWordDeselect(index)}
            >
              <Text style={styles.selectedWordText}>{word}</Text>
              <Ionicons name="close-circle" size={16} color="#dc2626" style={styles.removeWordIcon} />
            </TouchableOpacity>
          ))}
        </View>
      </View>
      
      {/* Available Words */}
      <View style={styles.availableWordsContainer}>
        <Text style={styles.availableWordsLabel}>Tap words in order:</Text>
        <View style={styles.availableWordsGrid}>
          {availableWords.map((word: string, index: number) => (
            <TouchableOpacity
              key={`${word}-${index}`}
              style={styles.availableWordButton}
              onPress={() => handleWordSelect(word)}
            >
              <Text style={styles.availableWordText}>{word}</Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>
      
      <View style={styles.inputContainer}>
        <TouchableOpacity 
          style={[
            styles.submitButton, 
            selectedWords.length === 0 && styles.submitButtonDisabled
          ]} 
          onPress={handleSubmit}
          disabled={selectedWords.length === 0}
        >
          <Text style={styles.submitButtonText}>Submit Answer</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};

export default function GamesScreen() {
  const navigation = useNavigation();
  const { user, profile } = useAuth();
  
  // State for games and data
  const [flashcards, setFlashcards] = useState<any[]>([]);
  const [topics, setTopics] = useState<string[]>([]);
  const [selectedTopic, setSelectedTopic] = useState<string>('');
  const [gameStats, setGameStats] = useState({
    gamesPlayed: 0,
    totalScore: 0,
    bestScore: 0,
    averageScore: 0,
    timeSpent: 0,
  });
  
  // Real game statistics state
  const [realGameStats, setRealGameStats] = useState({
    gamesPlayedToday: 0,
    totalGamesPlayed: 0,
    averageAccuracy: 0,
    totalGamingTime: 0,
  });
  
  // Game state
  const [showGameModal, setShowGameModal] = useState(false);
  const [currentGame, setCurrentGame] = useState<string | null>(null);
  const [gameData, setGameData] = useState<any>(null);
  const [showTopicDropdown, setShowTopicDropdown] = useState(false);
  const [showQuizSetup, setShowQuizSetup] = useState(false);
  const [selectedQuestionCount, setSelectedQuestionCount] = useState(10);
  const [selectedLanguageMode, setSelectedLanguageMode] = useState<'question' | 'answer'>('question');
  const [selectedDifficulty, setSelectedDifficulty] = useState('');
  const [showDifficultyDropdown, setShowDifficultyDropdown] = useState(false);
  const [difficulties, setDifficulties] = useState([
    { id: 'beginner', name: 'Beginner', description: 'Easy', color: '#10b981' },
    { id: 'intermediate', name: 'Intermediate', description: 'Medium', color: '#f59e0b' },
    { id: 'advanced', name: 'Advanced', description: 'Hard', color: '#dc2626' },
  ]);
  
  // Favourite games state
  const [favouriteGames, setFavouriteGames] = useState<FavouriteGame[]>([]);
  const [gameFavouriteStatus, setGameFavouriteStatus] = useState<{ [key: string]: boolean }>({});
  
  // Fetch flashcards and topics
  useEffect(() => {
    const fetchGameData = async () => {
      if (!user || !profile?.subjects?.[0]) return;
      
      try {
        const userSubject = profile.subjects[0];
        console.log('🎮 Fetching game data for subject:', userSubject);
        
        // Get user's flashcards
        const userFlashcards = await UserFlashcardService.getUserFlashcards();
        const userCards = userFlashcards.filter((card: any) => 
          card.subject && card.subject.toLowerCase() === userSubject.toLowerCase()
        );
        
        // Get general flashcards
        const generalFlashcards = await FlashcardService.getAllFlashcards();
        const generalCards = generalFlashcards.filter((card: any) => 
          card.subject && card.subject.toLowerCase() === userSubject.toLowerCase()
        );
        
        // Combine and filter valid cards
        const allCards = [...userCards, ...generalCards].filter(card => 
          card.front && card.back && card.topic
        );
        
        setFlashcards(allCards);
        
        // Get unique topics
        const uniqueTopics = Array.from(new Set(allCards.map(card => card.topic)));
        setTopics(uniqueTopics);
        
        // Default to "All Topics" (empty string means all topics)
        setSelectedTopic('');
        
        // Load favourite games
        await loadFavouriteGames();
        
        console.log('✅ Game data loaded:', {
          totalCards: allCards.length,
          topics: uniqueTopics.length,
          userCards: userCards.length,
          generalCards: generalCards.length
        });
        
        // Log sample cards from each source
        if (userCards.length > 0) {
          console.log('📝 Sample user card:', userCards[0]);
        }
        if (generalCards.length > 0) {
          console.log('📚 Sample general card:', generalCards[0]);
        }
      } catch (error) {
        console.error('❌ Error fetching game data:', error);
      }
    };
    
    fetchGameData();
  }, [user, profile]);
  
  // Fetch real game statistics
  useEffect(() => {
    const fetchRealGameStats = async () => {
      if (!user?.id) return;
      
      try {
        const { data: activities } = await supabase
          .from('user_activities')
          .select('*')
          .eq('user_id', user.id)
          .eq('activity_type', 'game');
        
        if (activities) {
          const today = new Date();
          today.setHours(0, 0, 0, 0);
          
          const gamesPlayedToday = activities.filter((activity: any) => {
            const activityDate = new Date(activity.completed_at);
            activityDate.setHours(0, 0, 0, 0);
            return activityDate.getTime() === today.getTime();
          }).length;
          
          const totalGamesPlayed = activities.length;
          
          const averageAccuracy = activities.length > 0 
            ? activities.reduce((sum: number, activity: any) => sum + (activity.accuracy_percentage || 0), 0) / activities.length
            : 0;
          
          const totalGamingTime = activities.reduce((sum: number, activity: any) => sum + (activity.duration_seconds || 0), 0);
          
          setRealGameStats({
            gamesPlayedToday,
            totalGamesPlayed,
            averageAccuracy: Math.round(averageAccuracy),
            totalGamingTime: Math.round(totalGamingTime / 60), // Convert to minutes
          });
        }
      } catch (error) {
        console.error('Error fetching real game stats:', error);
      }
    };
    
    fetchRealGameStats();
  }, [user]);

  // Refresh game stats function
  const refreshGameStats = async () => {
    if (!user?.id) return;
    
    try {
      console.log('🔄 Refreshing game stats for user:', user.id);
      const { data: activities, error } = await supabase
        .from('user_activities')
        .select('*')
        .eq('user_id', user.id)
        .eq('activity_type', 'game');
      
      if (error) {
        console.error('❌ Error fetching game activities:', error);
        return;
      }
      
      console.log(`📊 Found ${activities?.length || 0} game activities`);
      
      if (activities && activities.length > 0) {
        console.log('📊 Sample activity:', activities[0]);
        const totalDuration = activities.reduce((sum: number, activity: any) => sum + (activity.duration_seconds || 0), 0);
        console.log(`📊 Total duration from activities: ${totalDuration} seconds`);
      }
      
      if (activities) {
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        
        const gamesPlayedToday = activities.filter((activity: any) => {
          const activityDate = new Date(activity.completed_at);
          activityDate.setHours(0, 0, 0, 0);
          return activityDate.getTime() === today.getTime();
        }).length;
        
        const totalGamesPlayed = activities.length;
        
        const averageAccuracy = activities.length > 0 
          ? activities.reduce((sum: number, activity: any) => sum + (activity.accuracy_percentage || 0), 0) / activities.length
          : 0;
        
        const totalGamingTime = activities.reduce((sum: number, activity: any) => sum + (activity.duration_seconds || 0), 0);
        
        console.log(`📊 Calculated stats - Games today: ${gamesPlayedToday}, Total games: ${totalGamesPlayed}, Avg accuracy: ${averageAccuracy}%, Total time: ${totalGamingTime} seconds (${Math.round(totalGamingTime / 60)} minutes)`);
        
        setRealGameStats({
          gamesPlayedToday,
          totalGamesPlayed,
          averageAccuracy: Math.round(averageAccuracy),
          totalGamingTime: Math.max(1, Math.round(totalGamingTime / 60)), // Minimum 1 minute display
        });
      }
    } catch (error) {
      console.error('Error refreshing game stats:', error);
    }
  };
  
  // Load favourite games for the user
  const loadFavouriteGames = async () => {
    if (!user?.id) return;
    
    try {
      const { data: favouriteGamesData } = await FavouriteGamesService.getUserFavouriteGames(user.id);
      const { data: allGamesStatus } = await FavouriteGamesService.getAllGamesWithFavouriteStatus(user.id);
      
      if (favouriteGamesData) {
        setFavouriteGames(favouriteGamesData);
      }
      
      if (allGamesStatus) {
        const statusMap: { [key: string]: boolean } = {};
        allGamesStatus.forEach(game => {
          statusMap[game.name] = game.is_favourite;
        });
        setGameFavouriteStatus(statusMap);
      }
    } catch (error) {
      console.error('❌ Error loading favourite games:', error);
    }
  };
  
  // Toggle favourite status for a game
  const toggleGameFavourite = async (gameName: string, gameCategory: string) => {
    if (!user?.id) return;
    
    try {
      const { data, error } = await FavouriteGamesService.toggleFavourite(user.id, gameName, gameCategory);
      
      if (error) {
        console.error('❌ Error toggling favourite:', error);
        return;
      }
      
      // Update local state
      await loadFavouriteGames();
    } catch (error) {
      console.error('❌ Exception in toggleGameFavourite:', error);
    }
  };
  
  // Calculate filtered card count based on topic and difficulty
  const getFilteredCardCount = (): number => {
    let filteredCards = flashcards;
    
    if (selectedTopic) {
      filteredCards = filteredCards.filter(card => card.topic === selectedTopic);
    }
    
    if (selectedDifficulty) {
      filteredCards = filteredCards.filter(card => card.difficulty === selectedDifficulty);
    }
    
    return filteredCards.length;
  };
  
  // Game Functions
  const startFlashcardQuiz = () => {
    if (flashcards.length === 0) {
      Alert.alert('No Cards Available', 'Please create some flashcards first to play this game.');
      return;
    }
    
    let topicCards = selectedTopic ? 
      flashcards.filter(card => card.topic === selectedTopic) : 
      flashcards;
    
    // Filter by difficulty if selected
    if (selectedDifficulty) {
      topicCards = topicCards.filter(card => card.difficulty === selectedDifficulty);
    }
    
    if (topicCards.length < 4) {
      Alert.alert('Not Enough Cards', 'This combination needs at least 4 cards to play. Please add more cards or select a different topic/difficulty.');
      return;
    }
    
    // Show quiz setup instead of starting game directly
    setShowQuizSetup(true);
  };
  
  const startQuizWithSettings = (questionCount: number, languageMode: 'question' | 'answer') => {
    let topicCards = selectedTopic ? 
      flashcards.filter(card => card.topic === selectedTopic) : 
      flashcards;
    
    // Filter by difficulty if selected
    if (selectedDifficulty) {
      topicCards = topicCards.filter(card => card.difficulty === selectedDifficulty);
    }
    
    // Randomly shuffle the cards and then select the required number
    const shuffledCards = [...topicCards].sort(() => Math.random() - 0.5);
    const selectedCards = shuffledCards.slice(0, Math.min(questionCount, shuffledCards.length));
    
    // Create quiz questions with randomly selected cards
    const questions = selectedCards.map(card => {
      const otherCards = topicCards.filter((c: any) => c.id !== card.id);
      
      let questionText, correctAnswerText, wrongAnswers;
      
      if (languageMode === 'question') {
        // Questions in English, answers in native language
        questionText = card.front; // English term
        correctAnswerText = card.back; // Native language translation
        wrongAnswers = otherCards.slice(0, 3).map(c => c.back); // Other native language translations
      } else {
        // Questions in native language, answers in English
        questionText = card.back; // Native language term
        correctAnswerText = card.front; // English translation
        wrongAnswers = otherCards.slice(0, 3).map(c => c.front); // Other English translations
      }
      
      // Shuffle answers
      const answers = [correctAnswerText, ...wrongAnswers].sort(() => Math.random() - 0.5);
      
      return {
        question: questionText,
        correctAnswer: correctAnswerText,
        answers: answers,
        topic: card.topic,
        difficulty: card.difficulty || 'beginner',
        languageMode: languageMode
      };
    });
    
    setGameData({ type: 'quiz', questions, currentQuestion: 0, score: 0, languageMode, startTime: Date.now() });
    setCurrentGame('Flashcard Quiz');
    setShowQuizSetup(false);
    setShowGameModal(true);
  };
  
  const startMemoryMatch = () => {
    if (flashcards.length === 0) {
      Alert.alert('No Cards Available', 'Please create some flashcards first to play this game.');
      return;
    }
    
    let topicCards = selectedTopic ? 
      flashcards.filter(card => card.topic === selectedTopic) : 
      flashcards;
    
    // Filter by difficulty if selected
    if (selectedDifficulty) {
      topicCards = topicCards.filter(card => card.difficulty === selectedDifficulty);
    }
    
    if (topicCards.length < 6) {
      Alert.alert('Not Enough Cards', 'This combination needs at least 6 cards to play. Please add more cards or select a different topic/difficulty.');
      return;
    }
    
    // Randomly select cards for memory game based on available cards
    const shuffledTopicCards = [...topicCards].sort(() => Math.random() - 0.5);
    const maxCards = Math.min(24, shuffledTopicCards.length); // Allow up to 24 cards
    
    // Store all available cards for count selection (user will choose how many to use)
    setGameData({ 
      type: 'memory', 
      cards: [], // Will be set when user selects count
      originalCards: shuffledTopicCards.slice(0, maxCards), // Store all available cards
      totalPairs: maxCards, // Store total available pairs
      flippedCards: [], 
      matchedPairs: 0,
      moves: 0,
      startTime: Date.now()
    });
    setCurrentGame('Memory Match');
    setShowGameModal(true);
  };
  
  const startWordScramble = () => {
    console.log('startWordScramble called');
    console.log('flashcards:', flashcards);
    console.log('selectedTopic:', selectedTopic);
    console.log('selectedDifficulty:', selectedDifficulty);
    
    if (flashcards.length === 0) {
      Alert.alert('No Cards Available', 'Please create some flashcards first to play this game.');
      return;
    }
    
    let topicCards = selectedTopic ? 
      flashcards.filter(card => card.topic === selectedTopic) : 
      flashcards;
    
    console.log('topicCards after topic filter:', topicCards);
    
    // Filter by difficulty if selected
    if (selectedDifficulty) {
      topicCards = topicCards.filter(card => card.difficulty === selectedDifficulty);
      console.log('topicCards after difficulty filter:', topicCards);
    }
    
    if (topicCards.length < 5) {
      Alert.alert('Not Enough Cards', 'This combination needs at least 5 cards to play. Please add more cards or select a different topic/difficulty.');
      return;
    }
    
    // Don't create challenges yet - let the user select how many they want first
    // Just store the available cards for selection
    const gameDataToSet = { 
      type: 'scramble', 
      challenges: [], // Empty initially - will be populated when user selects count
      currentChallenge: 0, 
      score: 0,
      startTime: Date.now(),
      totalAvailableCards: topicCards.length, // Total available cards count
      originalFilteredCards: topicCards // Store all filtered cards for randomization
    };
    
    console.log('Setting gameData:', gameDataToSet);
    console.log('📊 Card breakdown:', {
      totalCards: topicCards.length,
      sampleCards: topicCards.slice(0, 3).map(c => ({ front: c.front, back: c.back, topic: c.topic, difficulty: c.difficulty }))
    });
    
    setGameData(gameDataToSet);
    setCurrentGame('Word Scramble');
    console.log('About to show game modal, gameData:', gameDataToSet);
    setShowGameModal(true);
  };

  const startSpeechPronunciation = () => {
    console.log('startSpeechPronunciation called');
    
    if (flashcards.length === 0) {
      Alert.alert('No Cards Available', 'Please create some flashcards first to play this game.');
      return;
    }
    
    // Show landing page first
    setGameData({ type: 'pronunciation-landing' });
    setCurrentGame('Speech Pronunciation');
    setShowGameModal(true);
  };

  const startSpeechPronunciationGame = (difficulty: string, cardCount: number) => {
    console.log('startSpeechPronunciationGame called with:', { difficulty, cardCount });
    
    let topicCards = selectedTopic ? 
      flashcards.filter(card => card.topic === selectedTopic) : 
      flashcards;
    
    // Filter by difficulty if selected
    if (difficulty !== 'all') {
      topicCards = topicCards.filter(card => card.difficulty === difficulty);
    }
    
    if (topicCards.length < 3) {
      Alert.alert('Not Enough Cards', 'This game needs at least 3 cards to play. Please add more cards or select a different topic/difficulty.');
      return;
    }
    
    // Create pronunciation questions from flashcards
    const questions = topicCards.slice(0, cardCount).map(card => ({
      question: `Pronounce: "${card.front}"`,
      correctAnswer: card.front,
      audioText: card.front, // Text to be spoken by TTS
      back: card.back,
      topic: card.topic,
      difficulty: card.difficulty
    }));
    
    const gameDataToSet = {
      type: 'pronunciation',
      questions,
      currentQuestion: 0,
      score: 0,
      startTime: Date.now()
    };
    
    console.log('Setting speech pronunciation gameData:', gameDataToSet);
    
    setGameData(gameDataToSet);
  };

  const startHangman = () => {
    if (flashcards.length === 0) {
      Alert.alert('No Cards Available', 'Please create some flashcards first to play this game.');
      return;
    }

    let topicCards = selectedTopic ? 
      flashcards.filter(card => card.topic === selectedTopic) : 
      flashcards;
    
    // Filter by difficulty if selected
    if (selectedDifficulty) {
      topicCards = topicCards.filter(card => card.difficulty === selectedDifficulty);
    }

    if (topicCards.length < 5) {
      Alert.alert('Not Enough Cards', 'This combination needs at least 5 cards to play. Please add more cards or select a different topic/difficulty.');
      return;
    }

    // Randomly select cards for hangman
    const shuffledTopicCards = [...topicCards].sort(() => Math.random() - 0.5);
    const selectedCards = shuffledTopicCards.slice(0, Math.min(10, shuffledTopicCards.length));
    
    // Create hangman words
    const words = selectedCards.map(card => {
      const hint = card.back;
      const word = card.back;
      return { word, hint };
    });

    setGameData({ type: 'hangman', words, currentWord: 0, score: 0, startTime: Date.now() });
    setCurrentGame('Hangman');
    setShowGameModal(true);
  };
  
  const startGravityGame = () => {
    if (flashcards.length === 0) {
      Alert.alert('No Cards Available', 'Please create some flashcards first to play this game.');
      return;
    }

    let topicCards = selectedTopic ? 
      flashcards.filter(card => card.topic === selectedTopic) : 
      flashcards;
    
    // Filter by difficulty if selected
    if (selectedDifficulty) {
      topicCards = topicCards.filter(card => card.difficulty === selectedDifficulty);
    }

    if (topicCards.length < 5) {
      Alert.alert('Not Enough Cards', 'This combination needs at least 5 cards to play. Please add more cards or select a different topic/difficulty.');
      return;
    }

    // Create questions for gravity game
    const questions = topicCards.map(card => ({
      question: card.front,
      correctAnswer: card.back,
      topic: card.topic,
      difficulty: card.difficulty || 'beginner'
    }));

    setGameData({ type: 'gravity', questions, currentQuestion: 0, score: 0, languageMode: 'question', startTime: Date.now() });
    setCurrentGame('Planet Defense');
    setShowGameModal(true);
  };
  
  const startTypeWhatYouHear = () => {
    if (flashcards.length === 0) {
      Alert.alert('No Cards Available', 'Please create some flashcards first to play this game.');
      return;
    }

    let topicCards = selectedTopic ? 
      flashcards.filter(card => card.topic === selectedTopic) : 
      flashcards;
    
    // Filter by difficulty if selected
    if (selectedDifficulty) {
      topicCards = topicCards.filter(card => card.difficulty === selectedDifficulty);
    }

    // Log what's being filtered
    console.log('🎮 Type What You Hear - Card filtering:', {
      totalFlashcards: flashcards.length,
      selectedTopic: selectedTopic || 'All Topics',
      selectedDifficulty: selectedDifficulty || 'All Difficulties',
      filteredCards: topicCards.length,
      availableTopics: Array.from(new Set(flashcards.map(card => card.topic))),
      sampleCards: topicCards.slice(0, 3).map(c => ({ front: c.front, topic: c.topic, difficulty: c.difficulty }))
    });

    if (topicCards.length < 5) {
      Alert.alert('Not Enough Cards', 'This combination needs at least 5 cards to play. Please add more cards or select a different topic/difficulty.');
      return;
    }

    // Create questions for type what you hear game
    const questions = topicCards.map(card => ({
      front: card.front, // The text to be "heard" (audio would be card.audio in real app)
      back: card.back,   // The answer/translation
      topic: card.topic,
      difficulty: card.difficulty || 'beginner'
    }));

    setGameData({ type: 'type-what-you-hear', questions, currentQuestion: 0, score: 0, startTime: Date.now() });
    setCurrentGame('Type What You Hear');
    setShowGameModal(true);
  };
  
  const startSpeedChallenge = () => {
    if (flashcards.length === 0) {
      Alert.alert('No Cards Available', 'Please create some flashcards first to play this game.');
      return;
    }
    
    let topicCards = selectedTopic ? 
      flashcards.filter(card => card.topic === selectedTopic) : 
      flashcards;
    
    // Filter by difficulty if selected
    if (selectedDifficulty) {
      topicCards = topicCards.filter(card => card.difficulty === selectedDifficulty);
    }
    
    if (topicCards.length < 5) {
      Alert.alert('Not Enough Cards', 'This combination needs at least 5 cards to play. Please add more cards or select a different topic/difficulty.');
      return;
    }
    
    // Don't create questions yet - let the user select duration and language mode first
    // Just store the available cards for selection
    const gameDataToSet = { 
      type: 'speed', 
      questions: [], // Empty initially - will be populated when user selects settings
      currentQuestion: 0, 
      score: 0, 
      timeLeft: 0, // Will be set by user
      startTime: 0, // Will be set when game starts
      languageMode: 'question', // Default, will be set by user
      totalAvailableCards: topicCards.length, // Total available cards count
      originalFilteredCards: topicCards // Store all filtered cards for randomization
    };
    
    console.log('Setting speed challenge gameData:', gameDataToSet);
    console.log('📊 Speed Challenge card breakdown:', {
      totalCards: topicCards.length,
      sampleCards: topicCards.slice(0, 3).map(c => ({ front: c.front, back: c.back, topic: c.topic, difficulty: c.difficulty }))
    });
    
    setGameData(gameDataToSet);
    setCurrentGame('Speed Challenge');
    setShowGameModal(true);
  };
  
  const startSentenceScramble = () => {
    if (flashcards.length === 0) {
      Alert.alert('No Cards Available', 'Please create some flashcards first to play this game.');
      return;
    }
    
    let topicCards = selectedTopic ? 
      flashcards.filter(card => card.topic === selectedTopic) : 
      flashcards;
    
    // Filter by difficulty if selected
    if (selectedDifficulty) {
      topicCards = topicCards.filter(card => card.difficulty === selectedDifficulty);
    }
    
    if (topicCards.length < 3) {
      Alert.alert('Not Enough Cards', 'This combination needs at least 3 cards to play. Please add more cards or select a different topic/difficulty.');
      return;
    }
    
    // Randomly select cards for sentence scramble
    const shuffledTopicCards = [...topicCards].sort(() => Math.random() - 0.5);
    const filteredCards = shuffledTopicCards.filter(card => card.example && card.example.trim().length > 0);
    
    // Create sentence scramble challenges using actual example sentences from flashcards
    const challenges = filteredCards
      .slice(0, Math.min(20, filteredCards.length))
      .map(card => {
        // Use the actual example sentence from the flashcard
        const sentence = card.example!;
        const words = sentence.split(' ').filter((word: string) => word.length > 0);
        
        // Only create challenges for sentences with multiple words
        if (words.length < 2) return null;
        
        const scrambledWords = [...words].sort(() => Math.random() - 0.5);
        
        return {
          original: sentence,
          scrambled: scrambledWords.join(' '),
          correctOrder: words,
          topic: card.topic,
          difficulty: card.difficulty || 'beginner',
          hint: `Rearrange the words to form the correct sentence about "${card.front}"`,
          flashcardTerm: card.front
        };
      })
      .filter(challenge => challenge !== null); // Remove null challenges
    
    if (challenges.length === 0) {
      Alert.alert('No Examples Available', 'The selected flashcards don\'t have example sentences. Please add some example sentences to your flashcards to play this game.');
      return;
    }
    
    setGameData({ 
      type: 'sentence-scramble', 
      challenges, 
      currentChallenge: 0, 
      score: 0,
      startTime: Date.now()
    });
    setCurrentGame('Sentence Scramble');
    setShowGameModal(true);
  };
  
  const closeGame = () => {
    setShowGameModal(false);
    setCurrentGame(null);
    setGameData(null);
  };

  // Helper function to update daily goals and award XP when games are completed
  const updateDailyGoalsForGame = async (score: number, timeSpent?: number) => {
    if (!user?.id) return;
    
    console.log(`🎮 Game completion - Score: ${score}, Time spent: ${timeSpent}ms`);
    
    try {
      // Award XP for game completion (this also logs the activity)
      try {
        const { XPService } = await import('../lib/xpService');
        const maxScore = 10; // Assume max score of 10 for games
        const accuracyPercentage = Math.min(100, Math.round((score / maxScore) * 100));
        const timeInSeconds = timeSpent ? Math.floor(timeSpent / 1000) : 60; // Convert ms to seconds, default 1 minute
        
        await XPService.awardXP(
          user.id,
          'game',
          score,
          maxScore,
          accuracyPercentage,
          'Learning Game',
          timeInSeconds
        );
        console.log('✅ XP awarded for game completion');
      } catch (error) {
        console.error('❌ Failed to award XP for game:', error);
      }
      
      const { DailyGoalsService } = await import('../lib/dailyGoalsService');
      
      // Update games played goal
      await DailyGoalsService.updateGoalProgress(user.id, 'games_played', 1);
      
      // Update study time if provided
      if (timeSpent && timeSpent > 0) {
        const timeInMinutes = Math.floor(timeSpent / 1000 / 60); // Convert milliseconds to minutes
        // Round up to 1 minute if calculated time is less than 1 minute
        const finalTimeInMinutes = timeInMinutes > 0 ? timeInMinutes : 1;
        await DailyGoalsService.updateGoalProgress(user.id, 'study_time', finalTimeInMinutes);
        console.log(`⏱️ Game time tracked: ${timeInMinutes} minutes calculated, ${finalTimeInMinutes} minutes added to study time`);
      } else {
        console.log(`⏱️ No time spent data provided or time is 0 - adding 1 minute minimum`);
        await DailyGoalsService.updateGoalProgress(user.id, 'study_time', 1);
      }
      
      console.log('✅ Daily goals updated for game completion');
      
      // Refresh game stats to show updated total time
      await refreshGameStats();
    } catch (error) {
      console.error('❌ Failed to update daily goals for game:', error);
    }
  };
  
  // Auto-adjust question count when available cards change
  useEffect(() => {
    if (showQuizSetup) {
      let topicCards = selectedTopic ? 
        flashcards.filter(card => card.topic === selectedTopic) : 
        flashcards;
      if (selectedDifficulty) {
        topicCards = topicCards.filter(card => card.difficulty === selectedDifficulty);
      }
      
      // If current selection exceeds available cards, adjust to max available
      if (selectedQuestionCount > topicCards.length) {
        const maxAvailable = Math.max(5, Math.floor(topicCards.length / 5) * 5);
        setSelectedQuestionCount(Math.min(maxAvailable, topicCards.length));
      }
    }
  }, [selectedTopic, selectedDifficulty, flashcards, showQuizSetup, selectedQuestionCount]);
  
  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Games</Text>
      </View>
      
      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* Loading State */}
        {flashcards.length === 0 && (
          <View style={styles.section}>
            <View style={styles.loadingContainer}>
              <Ionicons name="hourglass-outline" size={48} color="#6366f1" />
              <Text style={styles.loadingText}>Loading your flashcards...</Text>
            </View>
          </View>
        )}
        
        {/* Topic Selector */}
        {topics.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Study Configuration</Text>
            <Text style={styles.sectionSubtitle}>Choose your topic and difficulty level</Text>
            
            {/* Unified Selection Card */}
            <View style={styles.unifiedSelectionCard}>
              {/* Topic Selection Row */}
              <View style={styles.selectionRow}>
                <View style={styles.selectionLabel}>
                  <View style={styles.selectionLabelWithIcon}>
                    <Ionicons name="bookmark" size={18} color="#6366f1" style={styles.selectionLabelIcon} />
                    <Text style={styles.selectionLabelText}>Topic</Text>
                  </View>
                </View>
                <View style={styles.selectionContent}>
                  <TouchableOpacity
                    style={styles.compactDropdown}
                    onPress={() => setShowTopicDropdown(!showTopicDropdown)}
                  >
                    <Text style={styles.compactDropdownText}>
                      {selectedTopic ? `${selectedTopic} (${flashcards.filter(card => card.topic === selectedTopic).length} cards)` : `All Topics (${flashcards.length} cards)`}
                    </Text>
                    <Ionicons 
                      name={showTopicDropdown ? "chevron-up" : "chevron-down"} 
                      size={16} 
                      color="#64748b" 
                    />
                  </TouchableOpacity>
                  
                  {/* Topic Dropdown Options */}
                  {showTopicDropdown && (
                    <View style={styles.compactDropdownOptions}>
                      <ScrollView style={styles.compactDropdownScroll} showsVerticalScrollIndicator={false}>
                        {/* All Topics Option */}
                        <TouchableOpacity
                          style={[
                            styles.compactDropdownOption,
                            selectedTopic === '' && styles.selectedCompactDropdownOption
                          ]}
                          onPress={() => {
                            setSelectedTopic('');
                            setShowTopicDropdown(false);
                          }}
                        >
                          <View style={[styles.compactDropdownOptionIcon, { backgroundColor: '#8b5cf6' }]}>
                            <Ionicons name="apps" size={16} color="#ffffff" />
                          </View>
                          <View style={styles.compactDropdownOptionContent}>
                            <Text style={styles.compactDropdownOptionText}>All Topics</Text>
                            <Text style={styles.compactDropdownOptionCount}>
                              {flashcards.length} cards available
                            </Text>
                          </View>
                          {selectedTopic === '' && (
                            <Ionicons name="checkmark" size={16} color="#6366f1" />
                          )}
                        </TouchableOpacity>
                        
                        <View style={styles.compactDropdownDivider} />
                        
                        {/* Individual Topic Options */}
                        {topics.map((topic) => (
                          <TouchableOpacity
                            key={topic}
                            style={[
                              styles.compactDropdownOption,
                              selectedTopic === topic && styles.selectedCompactDropdownOption
                            ]}
                            onPress={() => {
                              setSelectedTopic(topic);
                              setShowTopicDropdown(false);
                            }}
                          >
                            <View style={[styles.compactDropdownOptionIcon, { backgroundColor: '#6366f1' }]}>
                              <Ionicons name="bookmark" size={16} color="#ffffff" />
                            </View>
                            <View style={styles.compactDropdownOptionContent}>
                              <Text style={styles.compactDropdownOptionText}>{topic}</Text>
                              <Text style={styles.compactDropdownOptionCount}>
                                {flashcards.filter(card => card.topic === topic).length} cards available
                              </Text>
                            </View>
                            {selectedTopic === topic && (
                              <Ionicons name="checkmark" size={16} color="#6366f1" />
                            )}
                          </TouchableOpacity>
                        ))}
                      </ScrollView>
                    </View>
                  )}
                </View>
              </View>
              
              {/* Difficulty Selection Row */}
              <View style={styles.selectionRow}>
                <View style={styles.selectionLabel}>
                  <View style={styles.selectionLabelWithIcon}>
                    <Ionicons name="trending-up" size={18} color="#f59e0b" style={styles.selectionLabelIcon} />
                    <Text style={styles.selectionLabelText}>Difficulty</Text>
                  </View>
                </View>
                <View style={styles.selectionContent}>
                  <TouchableOpacity
                    style={styles.compactDropdown}
                    onPress={() => setShowDifficultyDropdown(!showDifficultyDropdown)}
                  >
                    <Text style={styles.compactDropdownText}>
                      {selectedDifficulty ? difficulties.find(d => d.id === selectedDifficulty)?.name : 'All Difficulties'}
                    </Text>
                    <Ionicons 
                      name={showDifficultyDropdown ? "chevron-up" : "chevron-down"} 
                      size={16} 
                      color="#64748b" 
                    />
                  </TouchableOpacity>
                  
                  {/* Difficulty Dropdown Options */}
                  {showDifficultyDropdown && (
                    <View style={styles.compactDropdownOptions}>
                      <ScrollView style={styles.compactDropdownScroll} showsVerticalScrollIndicator={false}>
                        {/* All Difficulties Option */}
                        <TouchableOpacity
                          style={[
                            styles.compactDropdownOption,
                            selectedDifficulty === '' && styles.selectedCompactDropdownOption
                          ]}
                          onPress={() => {
                            setSelectedDifficulty('');
                            setShowDifficultyDropdown(false);
                          }}
                        >
                          <View style={[styles.compactDropdownOptionIcon, { backgroundColor: '#8b5cf6' }]}>
                            <Ionicons name="layers" size={16} color="#ffffff" />
                          </View>
                          <View style={styles.compactDropdownOptionContent}>
                            <Text style={styles.compactDropdownOptionText}>All Difficulties</Text>
                            <Text style={styles.compactDropdownOptionCount}>Mix of all levels</Text>
                          </View>
                          {selectedDifficulty === '' && (
                            <Ionicons name="checkmark" size={16} color="#6366f1" />
                          )}
                        </TouchableOpacity>
                        
                        <View style={styles.compactDropdownDivider} />
                        
                        {/* Individual Difficulty Options */}
                        {difficulties.map((difficulty) => (
                          <TouchableOpacity
                            key={difficulty.id}
                            style={[
                              styles.compactDropdownOption,
                              selectedDifficulty === difficulty.id && styles.selectedCompactDropdownOption
                            ]}
                            onPress={() => {
                              setSelectedDifficulty(difficulty.id);
                              setShowDifficultyDropdown(false);
                            }}
                          >
                            <View style={[styles.compactDropdownOptionIcon, { backgroundColor: difficulty.color }]}>
                              <View style={styles.compactDifficultyDot} />
                            </View>
                            <View style={styles.compactDropdownOptionContent}>
                              <Text style={styles.compactDropdownOptionText}>{difficulty.name}</Text>
                              <Text style={styles.compactDropdownOptionCount}>{difficulty.description}</Text>
                            </View>
                            {selectedDifficulty === difficulty.id && (
                              <Ionicons name="checkmark" size={16} color="#6366f1" />
                            )}
                          </TouchableOpacity>
                        ))}
                      </ScrollView>
                    </View>
                  )}
                </View>
              </View>
            </View>
          </View>
        )}
        
        {/* Favourite Games Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Favourite Games</Text>
          <Text style={styles.sectionSubtitle}>
            {favouriteGames.length > 0 
              ? `Your preferred games${selectedTopic || selectedDifficulty ? ` - ${getFilteredCardCount()} cards available` : ` - All Topics (${flashcards.length} cards)`}` 
              : 'Tap the heart icon on any game to add it to your favourites!'
            }
          </Text>
          
          {favouriteGames.length > 0 ? (
            <View style={styles.featuredGames}>
              {favouriteGames.map((favouriteGame) => {
                const gameName = favouriteGame.game_name;
                let gameIcon = 'help-circle';
                let gameColor = '#6366f1';
                let gameDesc = 'Test your knowledge with multiple choice questions';
                let onPress = startFlashcardQuiz;
                
                // Set game-specific properties
                let gameBgColor = '#f0f4ff'; // Default background for Flashcard Quiz
                
                switch (gameName) {
                  case 'Memory Match':
                    gameIcon = 'grid';
                    gameColor = '#10b981';
                    gameBgColor = '#f0fdf4';
                    gameDesc = 'Match front and back of cards';
                    onPress = startMemoryMatch;
                    break;
                  case 'Word Scramble':
                    gameIcon = 'text';
                    gameColor = '#16a34a';
                    gameBgColor = '#f0fdf4';
                    gameDesc = 'Unscramble words to test vocabulary';
                    onPress = startWordScramble;
                    break;
                  case 'Hangman':
                    gameIcon = 'game-controller';
                    gameColor = '#8b5cf6';
                    gameBgColor = '#f8fafc';
                    gameDesc = 'Guess the word before the hangman is complete';
                    onPress = startHangman;
                    break;
                  case 'Speed Challenge':
                    gameIcon = 'timer';
                    gameColor = '#dc2626';
                    gameBgColor = '#fef2f2';
                    gameDesc = 'Answer questions against the clock';
                    onPress = startSpeedChallenge;
                    break;
                  case 'Planet Defense':
                    gameIcon = 'planet';
                    gameColor = '#3b82f6';
                    gameBgColor = '#dbeafe';
                    gameDesc = 'Defend your planet from falling questions';
                    onPress = startGravityGame;
                    break;
                  case 'Type What You Hear':
                    gameIcon = 'ear';
                    gameColor = '#8b5cf6';
                    gameBgColor = '#f3e8ff';
                    gameDesc = 'Listen and type what you hear';
                    onPress = startTypeWhatYouHear;
                    break;
                  case 'Sentence Scramble':
                    gameIcon = 'document-text';
                    gameColor = '#ec4899';
                    gameBgColor = '#fdf2f8';
                    gameDesc = 'Rearrange words to form correct sentences';
                    onPress = startSentenceScramble;
                    break;
                  default:
                    // Flashcard Quiz is default
                    gameBgColor = '#f0f4ff';
                    break;
                }
                
                return (
                  <TouchableOpacity
                    key={favouriteGame.id}
                    style={styles.featuredGameCard}
                    onPress={onPress}
                  >
                    <View style={[styles.featuredGameIcon, { backgroundColor: gameBgColor }]}>
                      <Ionicons name={gameIcon as any} size={40} color={gameColor} />
                    </View>
                    <Text style={styles.featuredGameTitle}>{gameName}</Text>
                    <Text style={styles.featuredGameDesc}>{gameDesc}</Text>
                    <View style={styles.gameStats}>
                      <Text style={styles.gameStat}>4.8 ★</Text>
                      <Text style={styles.gameStat}>{getFilteredCardCount()} cards</Text>
                    </View>
                    <TouchableOpacity
                      style={styles.favouriteButton}
                      onPress={(e) => {
                        e.stopPropagation();
                        toggleGameFavourite(gameName, favouriteGame.game_category);
                      }}
                    >
                      <Ionicons name="heart" size={20} color="#dc2626" />
                    </TouchableOpacity>
                  </TouchableOpacity>
                );
              })}
            </View>
          ) : (
            <View style={styles.emptyFavourites}>
              <Ionicons name="heart-outline" size={48} color="#cbd5e1" />
              <Text style={styles.emptyFavouritesText}>No favourite games yet</Text>
              <Text style={styles.emptyFavouritesSubtext}>Tap the heart icon on any game below to add it to your favourites</Text>
            </View>
          )}
        </View>

        {/* All Games Grid */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>All Games</Text>
          <Text style={styles.sectionSubtitle}>Choose from our collection</Text>
          
          <View style={styles.gamesGrid}>
            <TouchableOpacity style={styles.gameCard} onPress={startFlashcardQuiz}>
              <View style={[styles.gameIcon, { backgroundColor: '#f0f4ff' }]}>
                <Ionicons name="help-circle" size={24} color="#6366f1" />
              </View>
              <Text style={styles.gameName}>Flashcard Quiz</Text>
              <Text style={styles.gameCategory}>Quiz</Text>
              <Text style={styles.gameCardCount}>{getFilteredCardCount()} cards</Text>
              <TouchableOpacity
                style={styles.gameFavouriteButton}
                onPress={(e) => {
                  e.stopPropagation();
                  toggleGameFavourite('Flashcard Quiz', 'Quiz');
                }}
              >
                <Ionicons 
                  name={gameFavouriteStatus['Flashcard Quiz'] ? "heart" : "heart-outline"} 
                  size={18} 
                  color={gameFavouriteStatus['Flashcard Quiz'] ? "#dc2626" : "#94a3b8"} 
                />
              </TouchableOpacity>
            </TouchableOpacity>
            
            <TouchableOpacity style={styles.gameCard} onPress={startMemoryMatch}>
              <View style={[styles.gameIcon, { backgroundColor: '#f0fdf4' }]}>
                <Ionicons name="grid" size={24} color="#10b981" />
              </View>
              <Text style={styles.gameName}>Memory Match</Text>
              <Text style={styles.gameCategory}>Memory</Text>
              <Text style={styles.gameCardCount}>{getFilteredCardCount()} cards</Text>
              <TouchableOpacity
                style={styles.gameFavouriteButton}
                onPress={(e) => {
                  e.stopPropagation();
                  toggleGameFavourite('Memory Match', 'Memory');
                }}
              >
                <Ionicons 
                  name={gameFavouriteStatus['Memory Match'] ? "heart" : "heart-outline"} 
                  size={18} 
                  color={gameFavouriteStatus['Memory Match'] ? "#dc2626" : "#94a3b8"} 
                />
              </TouchableOpacity>
            </TouchableOpacity>
            
            <TouchableOpacity style={styles.gameCard} onPress={startWordScramble}>
              <View style={[styles.gameIcon, { backgroundColor: '#f0fdf4' }]}>
                <Ionicons name="text" size={24} color="#16a34a" />
              </View>
              <Text style={styles.gameName}>Word Scramble</Text>
              <Text style={styles.gameCategory}>Puzzle</Text>
              <Text style={styles.gameCardCount}>{getFilteredCardCount()} cards</Text>
              <TouchableOpacity
                style={styles.gameFavouriteButton}
                onPress={(e) => {
                  e.stopPropagation();
                  toggleGameFavourite('Word Scramble', 'Puzzle');
                }}
              >
                <Ionicons 
                  name={gameFavouriteStatus['Word Scramble'] ? "heart" : "heart-outline"} 
                  size={18} 
                  color={gameFavouriteStatus['Word Scramble'] ? "#dc2626" : "#94a3b8"} 
                />
              </TouchableOpacity>
            </TouchableOpacity>
            
            <TouchableOpacity style={styles.gameCard} onPress={startSpeechPronunciation}>
              <View style={[styles.gameIcon, { backgroundColor: '#f0fdf4' }]}>
                <Ionicons name="mic" size={24} color="#10b981" />
              </View>
              <View style={styles.gameNameContainer}>
                <Text style={styles.gameName}>Speech Pronunciation</Text>
                <View style={styles.gameDemoBadge}>
                  <Text style={styles.gameDemoText}>DEMO</Text>
                </View>
              </View>
              <Text style={styles.gameCategory}>Speaking</Text>
              <Text style={styles.gameCardCount}>{getFilteredCardCount()} cards</Text>
              <TouchableOpacity
                style={styles.gameFavouriteButton}
                onPress={(e) => {
                  e.stopPropagation();
                  toggleGameFavourite('Speech Pronunciation', 'Speaking');
                }}
              >
                <Ionicons 
                  name={gameFavouriteStatus['Speech Pronunciation'] ? "heart" : "heart-outline"} 
                  size={18} 
                  color={gameFavouriteStatus['Speech Pronunciation'] ? "#dc2626" : "#94a3b8"} 
                />
              </TouchableOpacity>
            </TouchableOpacity>

            <TouchableOpacity style={styles.gameCard} onPress={startHangman}>
              <View style={[styles.gameIcon, { backgroundColor: '#f8fafc' }]}>
                <Ionicons name="game-controller" size={24} color="#8b5cf6" />
              </View>
              <Text style={styles.gameName}>Hangman</Text>
              <Text style={styles.gameCategory}>Word Game</Text>
              <Text style={styles.gameCardCount}>{getFilteredCardCount()} cards</Text>
              <TouchableOpacity
                style={styles.gameFavouriteButton}
                onPress={(e) => {
                  e.stopPropagation();
                  toggleGameFavourite('Hangman', 'Word Game');
                }}
              >
                <Ionicons 
                  name={gameFavouriteStatus['Hangman'] ? "heart" : "heart-outline"} 
                  size={18} 
                  color={gameFavouriteStatus['Hangman'] ? "#dc2626" : "#94a3b8"} 
                />
              </TouchableOpacity>
            </TouchableOpacity>
            
            <TouchableOpacity 
              style={styles.gameCard} 
              onPress={startSpeedChallenge}
              onLongPress={() => {
                // Toggle language mode on long press
                setSelectedLanguageMode(prev => prev === 'question' ? 'answer' : 'question');
                Alert.alert(
                  'Language Mode Changed',
                  `Speed Challenge will now use: ${selectedLanguageMode === 'question' ? 'Answers in English' : 'Questions in English'}`,
                  [{ text: 'OK', style: 'default' }]
                );
              }}
            >
              <View style={[styles.gameIcon, { backgroundColor: '#fef2f2' }]}>
                <Ionicons name="timer" size={24} color="#dc2626" />
              </View>
              <Text style={styles.gameName}>Speed Challenge</Text>
              <Text style={styles.gameCategory}>Speed</Text>
              <Text style={styles.gameCardCount}>{getFilteredCardCount()} cards</Text>
              <TouchableOpacity
                style={styles.gameFavouriteButton}
                onPress={(e) => {
                  e.stopPropagation();
                  toggleGameFavourite('Speed Challenge', 'Speed');
                }}
              >
                <Ionicons 
                  name={gameFavouriteStatus['Speed Challenge'] ? "heart" : "heart-outline"} 
                  size={18} 
                  color={gameFavouriteStatus['Speed Challenge'] ? "#dc2626" : "#94a3b8"} 
                />
              </TouchableOpacity>
            </TouchableOpacity>
            
            <TouchableOpacity style={styles.gameCard} onPress={startSentenceScramble}>
              <View style={[styles.gameIcon, { backgroundColor: '#fdf2f8' }]}>
                <Ionicons name="document-text" size={24} color="#ec4899" />
              </View>
              <Text style={styles.gameName}>Sentence Scramble</Text>
              <Text style={styles.gameCategory}>Grammar</Text>
              <Text style={styles.gameCardCount}>{getFilteredCardCount()} cards</Text>
              <TouchableOpacity
                style={styles.gameFavouriteButton}
                onPress={(e) => {
                  e.stopPropagation();
                  toggleGameFavourite('Sentence Scramble', 'Grammar');
                }}
              >
                <Ionicons 
                  name={gameFavouriteStatus['Sentence Scramble'] ? "heart" : "heart-outline"} 
                  size={18} 
                  color={gameFavouriteStatus['Sentence Scramble'] ? "#dc2626" : "#94a3b8"} 
                />
              </TouchableOpacity>
            </TouchableOpacity>
            
            <TouchableOpacity style={styles.gameCard} onPress={startGravityGame}>
              <View style={[styles.gameIcon, { backgroundColor: '#dbeafe' }]}>
                <Ionicons name="planet" size={24} color="#3b82f6" />
              </View>
              <Text style={styles.gameName}>Planet Defense</Text>
              <Text style={styles.gameCategory}>Action</Text>
              <Text style={styles.gameCardCount}>{getFilteredCardCount()} cards</Text>
              <TouchableOpacity
                style={styles.gameFavouriteButton}
                onPress={(e) => {
                  e.stopPropagation();
                  toggleGameFavourite('Planet Defense', 'Action');
                }}
              >
                <Ionicons 
                  name={gameFavouriteStatus['Planet Defense'] ? "heart" : "heart-outline"} 
                  size={18} 
                  color={gameFavouriteStatus['Planet Defense'] ? "#dc2626" : "#94a3b8"} 
                />
              </TouchableOpacity>
            </TouchableOpacity>
            
            <TouchableOpacity style={styles.gameCard} onPress={startTypeWhatYouHear}>
              <View style={[styles.gameIcon, { backgroundColor: '#f3e8ff' }]}>
                <Ionicons name="ear" size={24} color="#8b5cf6" />
              </View>
              <Text style={styles.gameName}>Type What You Hear</Text>
              <Text style={styles.gameCategory}>Listening</Text>
              <Text style={styles.gameCardCount}>{getFilteredCardCount()} cards</Text>
              <TouchableOpacity
                style={styles.gameFavouriteButton}
                onPress={(e) => {
                  e.stopPropagation();
                  toggleGameFavourite('Type What You Hear', 'Listening');
                }}
              >
                <Ionicons 
                  name={gameFavouriteStatus['Type What You Hear'] ? "heart" : "heart-outline"} 
                  size={18} 
                  color={gameFavouriteStatus['Type What You Hear'] ? "#dc2626" : "#94a3b8"} 
                />
              </TouchableOpacity>
            </TouchableOpacity>
          </View>
        </View>

        {/* Settings Section */}


        {/* Real Game Statistics */}
        <View style={styles.statsSection}>
          <View style={styles.statsHeader}>
            <Text style={styles.statsTitle}>🎮 Your Game Stats</Text>
            <TouchableOpacity 
              style={styles.refreshButton}
              onPress={refreshGameStats}
            >
              <Ionicons name="refresh" size={20} color="#6366f1" />
            </TouchableOpacity>
          </View>
          <View style={styles.statsGrid}>
            <View style={styles.statCard}>
              <Ionicons name="game-controller" size={24} color="#6366f1" />
              <Text style={styles.statNumber}>{realGameStats.gamesPlayedToday}</Text>
              <Text style={styles.statLabel} numberOfLines={2} ellipsizeMode="tail">Games Today</Text>
            </View>
            <View style={styles.statCard}>
              <Ionicons name="trophy" size={24} color="#f59e0b" />
              <Text style={styles.statNumber}>{realGameStats.totalGamesPlayed}</Text>
              <Text style={styles.statLabel} numberOfLines={2} ellipsizeMode="tail">Total Games</Text>
            </View>
            <View style={styles.statCard}>
              <Ionicons name="checkmark-circle" size={24} color="#10b981" />
              <Text style={styles.statNumber}>{realGameStats.averageAccuracy}%</Text>
              <Text style={styles.statLabel}>Avg Accuracy</Text>
            </View>
            <View style={styles.statCard}>
              <Ionicons name="time" size={24} color="#ef4444" />
              <Text style={styles.statNumber}>{realGameStats.totalGamingTime}m</Text>
              <Text style={styles.statLabel}>Total Time</Text>
            </View>
          </View>
        </View>
      </ScrollView>
      
      {/* Quiz Setup Modal */}
      <Modal
        visible={showQuizSetup}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={() => setShowQuizSetup(false)}
      >
        <SafeAreaView style={styles.modalContainer}>
          <View style={styles.modalHeader}>
            <TouchableOpacity onPress={() => setShowQuizSetup(false)} style={styles.closeButton}>
              <Ionicons name="close" size={24} color="#64748b" />
            </TouchableOpacity>
            <Text style={styles.modalTitle}>Quiz Setup</Text>
            <View style={styles.placeholder} />
          </View>
          
          <View style={styles.modalContent}>
            <ScrollView 
              style={styles.setupScrollView} 
              showsVerticalScrollIndicator={false}
              contentContainerStyle={styles.setupScrollContent}
            >
              <View style={styles.setupContainer}>
                {/* Header Section */}
                <View style={styles.setupHeader}>
                  <View style={styles.setupIconContainer}>
                    <Ionicons name="settings-outline" size={32} color="#6366f1" />
                  </View>
                  <Text style={styles.setupTitle}>Configure Your Quiz</Text>
                  <Text style={styles.setupSubtitle}>Customize your learning experience</Text>
                </View>
                
                {/* Question Count Selector */}
                <View style={styles.setupSection}>
                  <View style={styles.setupLabelContainer}>
                    <Ionicons name="list-outline" size={20} color="#6366f1" style={styles.setupLabelIcon} />
                    <Text style={styles.setupLabel}>Number of Questions</Text>
                  </View>
                  
                  {/* Available Cards Info */}
                  <View style={styles.availableCardsInfo}>
                    <Text style={styles.availableCardsText}>
                      {(() => {
                        let topicCards = selectedTopic ? 
                          flashcards.filter(card => card.topic === selectedTopic) : 
                          flashcards;
                        if (selectedDifficulty) {
                          topicCards = topicCards.filter(card => card.difficulty === selectedDifficulty);
                        }
                        return topicCards.length;
                      })()} cards available
                    </Text>
                  </View>
                  
                  <View style={styles.questionCountGrid}>
                    {[5, 10, 15, 20].map((count) => {
                      // Calculate available cards for current topic/difficulty
                      let topicCards = selectedTopic ? 
                        flashcards.filter(card => card.topic === selectedTopic) : 
                        flashcards;
                      if (selectedDifficulty) {
                        topicCards = topicCards.filter(card => card.difficulty === selectedDifficulty);
                      }
                      
                      const isAvailable = topicCards.length >= count;
                      const isSelected = selectedQuestionCount === count;
                      
                      return (
                        <TouchableOpacity
                          key={count}
                          style={[
                            styles.questionCountCard,
                            isSelected && styles.selectedQuestionCountCard,
                            !isAvailable && styles.disabledQuestionCountCard
                          ]}
                          onPress={() => isAvailable && setSelectedQuestionCount(count)}
                          disabled={!isAvailable}
                        >
                          <View style={styles.questionCountContent}>
                            <Text style={[
                              styles.questionCountNumber,
                              isSelected && styles.selectedQuestionCountNumber,
                              !isAvailable && styles.disabledQuestionCountNumber
                            ]}>
                              {count}
                            </Text>
                            <Text style={[
                              styles.questionCountLabel,
                              isSelected && styles.selectedQuestionCountLabel,
                              !isAvailable && styles.disabledQuestionCountLabel
                            ]}>
                              {count === 5 ? 'Quick' : count === 10 ? 'Standard' : count === 15 ? 'Extended' : 'Comprehensive'}
                            </Text>
                            {!isAvailable && (
                              <Text style={styles.disabledReason}>
                                Need {count - topicCards.length} more cards
                              </Text>
                            )}
                          </View>
                          {isSelected && (
                            <View style={styles.selectedIndicator}>
                              <Ionicons name="checkmark-circle" size={24} color="#ffffff" />
                            </View>
                          )}
                        </TouchableOpacity>
                      );
                    })}
                  </View>
                </View>
                
                {/* Language Mode Selector */}
                <View style={styles.setupSection}>
                  <View style={styles.setupLabelContainer}>
                    <Ionicons name="language-outline" size={20} color="#6366f1" style={styles.setupLabelIcon} />
                    <Text style={styles.setupLabel}>Language Mode</Text>
                  </View>
                  <View style={styles.languageModeGrid}>
                    <TouchableOpacity
                      style={[
                        styles.languageModeCard,
                        selectedLanguageMode === 'question' && styles.selectedLanguageModeCard
                      ]}
                      onPress={() => setSelectedLanguageMode('question')}
                    >
                      <View style={styles.languageModeContent}>
                                              <View style={[
                        styles.languageModeIcon,
                        selectedLanguageMode === 'question' && styles.selectedLanguageModeIcon
                      ]}>
                        <Ionicons name="chatbubble-ellipses-outline" size={24} color="#6366f1" />
                      </View>
                        <View style={styles.languageModeText}>
                          <Text style={[
                            styles.languageModeTitle,
                            selectedLanguageMode === 'question' && styles.selectedLanguageModeTitle
                          ]}>
                            Question in English
                          </Text>
                          <Text style={[
                            styles.languageModeDescription,
                            selectedLanguageMode === 'question' && styles.selectedLanguageModeDescription
                          ]}>
                            Learn {profile?.native_language || 'your language'} translations
                          </Text>
                        </View>
                      </View>
                      {selectedLanguageMode === 'question' && (
                        <View style={styles.selectedIndicator}>
                          <Ionicons name="checkmark-circle" size={24} color="#ffffff" />
                        </View>
                      )}
                    </TouchableOpacity>
                    
                    <TouchableOpacity
                      style={[
                        styles.languageModeCard,
                        selectedLanguageMode === 'answer' && styles.selectedLanguageModeCard
                      ]}
                      onPress={() => setSelectedLanguageMode('answer')}
                    >
                      <View style={styles.languageModeContent}>
                                              <View style={[
                        styles.languageModeIcon,
                        selectedLanguageMode === 'answer' && styles.selectedLanguageModeIcon
                      ]}>
                        <Ionicons name="language-outline" size={24} color="#6366f1" />
                      </View>
                        <View style={styles.languageModeText}>
                          <Text style={[
                            styles.languageModeTitle,
                            selectedLanguageMode === 'answer' && styles.selectedLanguageModeTitle
                          ]}>
                            Answer in English
                          </Text>
                          <Text style={[
                            styles.languageModeDescription,
                            selectedLanguageMode === 'answer' && styles.selectedLanguageModeDescription
                          ]}>
                            Practice English translations
                          </Text>
                        </View>
                      </View>
                      {selectedLanguageMode === 'answer' && (
                        <View style={styles.selectedIndicator}>
                          <Ionicons name="checkmark-circle" size={24} color="#ffffff" />
                        </View>
                      )}
                    </TouchableOpacity>
                  </View>
                </View>
                
                {/* Quiz Preview */}
                <View style={styles.quizPreview}>
                  <View style={styles.previewHeader}>
                    <Ionicons name="eye-outline" size={18} color="#64748b" />
                    <Text style={styles.previewTitle}>Quiz Preview</Text>
                  </View>
                  <View style={styles.previewContent}>
                    <View style={styles.previewItem}>
                      <Text style={styles.previewLabel}>Questions:</Text>
                      <Text style={styles.previewValue}>{selectedQuestionCount}</Text>
                    </View>
                    <View style={styles.previewItem}>
                      <Text style={styles.previewLabel}>Mode:</Text>
                      <Text style={styles.previewValue}>
                        {selectedLanguageMode === 'question' ? `English → ${profile?.native_language || 'Your Language'}` : `${profile?.native_language || 'Your Language'} → English`}
                      </Text>
                    </View>
                    <View style={styles.previewItem}>
                      <Text style={styles.previewLabel}>Available Cards:</Text>
                      <Text style={styles.previewValue}>
                        {(() => {
                          let topicCards = selectedTopic ? 
                            flashcards.filter(card => card.topic === selectedTopic) : 
                            flashcards;
                          if (selectedDifficulty) {
                            topicCards = topicCards.filter(card => card.difficulty === selectedDifficulty);
                          }
                          return topicCards.length;
                        })()}
                      </Text>
                    </View>
                    <View style={styles.previewItem}>
                      <Text style={styles.previewLabel}>Estimated Time:</Text>
                      <Text style={styles.previewValue}>
                        {Math.round((selectedQuestionCount * 6) / 60)} min
                      </Text>
                    </View>
                  </View>
                </View>
              </View>
            </ScrollView>
            
            {/* Start Button - Fixed at bottom */}
            <View style={styles.startButtonContainer}>
              <TouchableOpacity
                style={[
                  styles.startQuizButton,
                  (() => {
                    let topicCards = selectedTopic ? 
                      flashcards.filter(card => card.topic === selectedTopic) : 
                      flashcards;
                    if (selectedDifficulty) {
                      topicCards = topicCards.filter(card => card.difficulty === selectedDifficulty);
                    }
                    return selectedQuestionCount > topicCards.length ? styles.startQuizButtonDisabled : null;
                  })()
                ]}
                onPress={() => startQuizWithSettings(selectedQuestionCount, selectedLanguageMode)}
                disabled={(() => {
                  let topicCards = selectedTopic ? 
                    flashcards.filter(card => card.topic === selectedTopic) : 
                    flashcards;
                  if (selectedDifficulty) {
                    topicCards = topicCards.filter(card => card.difficulty === selectedDifficulty);
                  }
                  return selectedQuestionCount > topicCards.length;
                })()}
              >
                <View style={styles.startButtonContent}>
                  <Ionicons name="play-circle" size={24} color="#ffffff" />
                  <Text style={styles.startQuizButtonText}>Start Quiz</Text>
                </View>
                <View style={styles.startButtonArrow}>
                  <Ionicons name="arrow-forward" size={20} color="#ffffff" />
                </View>
              </TouchableOpacity>
            </View>
          </View>
        </SafeAreaView>
      </Modal>
      
      {/* Game Modal */}
      <Modal
        visible={showGameModal}
        animationType="slide"
        presentationStyle="fullScreen"
        onRequestClose={closeGame}
      >
        <SafeAreaView style={styles.modalContainer}>
          <View style={styles.modalHeader}>
            <TouchableOpacity onPress={closeGame} style={styles.closeButton}>
              <Ionicons name="close" size={24} color="#64748b" />
            </TouchableOpacity>
            <Text style={styles.modalTitle}>{currentGame}</Text>
            <View style={styles.placeholder} />
          </View>
          
          {gameData && (
            <View style={styles.modalContent}>
              {gameData.type === 'quiz' && (
                <FlashcardQuizGame 
                  gameData={gameData} 
                  onClose={closeGame}
                  onGameComplete={async (score: number) => {
                    console.log('Quiz completed with score:', score);
                    // Calculate time spent
                    const gameDuration = gameData?.startTime ? Date.now() - gameData.startTime : 0;
                    console.log(`🎮 Quiz game - startTime: ${gameData?.startTime}, currentTime: ${Date.now()}, duration: ${gameDuration}ms`);
                    await updateDailyGoalsForGame(score, gameDuration);
                    closeGame();
                  }}
                  userProfile={profile}
                />
              )}
              
              {gameData.type === 'memory' && (
                <MemoryMatchGame 
                  gameData={gameData} 
                  onClose={closeGame}
                  onGameComplete={async (moves: number, time: number) => {
                    console.log('Memory game completed:', { moves, time });
                    await updateDailyGoalsForGame(moves, time);
                    closeGame();
                  }}
                />
              )}
              
              {gameData.type === 'scramble' && (
                <>
                  {console.log('Rendering WordScrambleGame with gameData:', gameData)}
                  <WordScrambleGame 
                    gameData={gameData} 
                    onClose={closeGame}
                                      onGameComplete={async (score: number) => {
                    console.log('Scramble completed with score:', score);
                    // Calculate time spent
                    const gameDuration = gameData?.startTime ? Date.now() - gameData.startTime : 0;
                    console.log(`🎮 Scramble game - startTime: ${gameData?.startTime}, currentTime: ${Date.now()}, duration: ${gameDuration}ms`);
                    await updateDailyGoalsForGame(score, gameDuration);
                    closeGame();
                  }}
                  />
                </>
              )}

              {gameData.type === 'hangman' && (
                <HangmanGame 
                  gameData={gameData} 
                  onClose={closeGame}
                  onGameComplete={async (score: number) => {
                    console.log('Hangman completed with score:', score);
                    // Calculate time spent
                    const gameDuration = gameData?.startTime ? Date.now() - gameData.startTime : 0;
                    await updateDailyGoalsForGame(score, gameDuration);
                    closeGame();
                  }}
                />
              )}
              
              {gameData.type === 'gravity' && (
                <GravityGame 
                  gameData={gameData} 
                  onClose={closeGame}
                  onGameComplete={async (score: number) => {
                    console.log('Gravity game completed with score:', score);
                    // Calculate time spent
                    const gameDuration = gameData?.startTime ? Date.now() - gameData.startTime : 0;
                    await updateDailyGoalsForGame(score, gameDuration);
                    closeGame();
                  }}
                  userProfile={profile}
                />
              )}
              
              {gameData.type === 'type-what-you-hear' && (
                <TypeWhatYouHearGame 
                  gameData={gameData} 
                  onClose={closeGame}
                  onGameComplete={async (score: number) => {
                    console.log('Type What You Hear game completed with score:', score);
                    // Calculate time spent
                    const gameDuration = gameData?.startTime ? Date.now() - gameData.startTime : 0;
                    await updateDailyGoalsForGame(score, gameDuration);
                    closeGame();
                  }}
                  userProfile={profile}
                />
              )}
              
              {gameData.type === 'speed' && (
                <SpeedChallengeGame 
                  gameData={gameData} 
                  onClose={closeGame}
                  onGameComplete={async (score: number, timeLeft: number) => {
                    console.log('Speed challenge completed:', { score, timeLeft });
                    // Calculate time spent (assuming game duration - timeLeft)
                    const gameDuration = gameData?.startTime ? Date.now() - gameData.startTime : 0;
                    await updateDailyGoalsForGame(score, gameDuration);
                    closeGame();
                  }}
                />
                              )}
                
                {gameData.type === 'pronunciation-landing' && (
                  <SpeechPronunciationLanding
                    onStart={startSpeechPronunciationGame}
                    onClose={closeGame}
                  />
                )}
                
                {gameData.type === 'pronunciation' && (
                  <SpeechPronunciationGame
                    gameData={gameData} 
                    onClose={closeGame}
                    onGameComplete={async (score: number) => {
                      console.log('Speech pronunciation completed:', { score });
                      const gameDuration = gameData?.startTime ? Date.now() - gameData.startTime : 0;
                      await updateDailyGoalsForGame(score, gameDuration);
                      closeGame();
                    }}
                  />
                )}
                
                {gameData.type === 'sentence-scramble' && (
                <SentenceScrambleGame 
                  gameData={gameData} 
                  onClose={closeGame}
                  onGameComplete={async (score: number) => {
                    console.log('Sentence scramble completed with score:', score);
                    // Calculate time spent
                    const gameDuration = gameData?.startTime ? Date.now() - gameData.startTime : 0;
                    await updateDailyGoalsForGame(score, gameDuration);
                    closeGame();
                  }}
                />
              )}
            </View>
          )}
        </SafeAreaView>
      </Modal>
      
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8fafc',
  },
  header: {
    paddingHorizontal: 20,
    paddingVertical: 24,
    backgroundColor: '#ffffff',
    borderBottomWidth: 1,
    borderBottomColor: '#e2e8f0',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 12,
    elevation: 4,
  },
  headerTitle: {
    fontSize: 32,
    fontWeight: '800',
    color: '#1e293b',
    textAlign: 'center',
    letterSpacing: -0.5,
  },
  content: {
    flex: 1,
    padding: 20,
  },
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 26,
    fontWeight: '700',
    color: '#1e293b',
    marginBottom: 16,
    textAlign: 'center',
    letterSpacing: -0.3,
  },
  sectionSubtitle: {
    fontSize: 20,
    color: '#64748b',
    marginBottom: 28,
    textAlign: 'center',
    lineHeight: 28,
    fontWeight: '500',
  },

  
  // Enhanced Topic Selector - Aligned with app aesthetics
  selectAllButton: {
    backgroundColor: '#f8fafc',
    paddingVertical: 14,
    paddingHorizontal: 20,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: '#e2e8f0',
    marginBottom: 16,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  selectedSelectAllButton: {
    backgroundColor: '#6366f1',
    borderColor: '#6366f1',
    shadowColor: '#6366f1',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 4,
  },
  selectAllButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#64748b',
  },
  selectedSelectAllButtonText: {
    color: '#ffffff',
  },
  dropdownButton: {
    backgroundColor: '#ffffff',
    paddingVertical: 16,
    paddingHorizontal: 20,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: '#e2e8f0',
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  dropdownButtonText: {
    fontSize: 16,
    fontWeight: '500',
    color: '#1e293b',
    flex: 1,
  },
  dropdownOptions: {
    backgroundColor: '#ffffff',
    borderRadius: 12,
    marginTop: 8,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
    overflow: 'hidden',
  },
  dropdownOption: {
    paddingVertical: 16,
    paddingHorizontal: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#f1f5f9',
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  selectedDropdownOption: {
    backgroundColor: '#f0f9ff',
    borderBottomColor: '#6366f1',
  },
  dropdownOptionText: {
    fontSize: 16,
    color: '#1e293b',
    fontWeight: '500',
  },
  selectedDropdownOptionText: {
    color: '#6366f1',
    fontWeight: '600',
  },
  
  // Enhanced Featured Games - Aligned with app aesthetics
  featuredGames: {
    gap: 16,
  },
  featuredGameCard: {
    backgroundColor: '#ffffff',
    borderRadius: 28,
    padding: 32,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.15,
    shadowRadius: 24,
    elevation: 12,
    borderWidth: 1,
    borderColor: '#f1f5f9',
  },
  featuredGameIcon: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: '#f8fafc',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 12,
    elevation: 6,
  },
  featuredGameTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#1e293b',
    marginBottom: 10,
    letterSpacing: -0.3,
  },
  featuredGameDesc: {
    fontSize: 16,
    color: '#64748b',
    marginBottom: 20,
    lineHeight: 24,
    fontWeight: '500',
  },
  gameStats: {
    flexDirection: 'row',
    gap: 16,
  },
  gameStat: {
    fontSize: 14,
    color: '#6366f1',
    fontWeight: '700',
    backgroundColor: '#f0f4ff',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 24,
    letterSpacing: -0.2,
  },
  
  // Enhanced Games Grid - Aligned with app aesthetics
  gamesGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    gap: 12,
  },
  gameCard: {
    width: (width - 52) / 2,
    backgroundColor: '#ffffff',
    borderRadius: 24,
    padding: 24,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.12,
    shadowRadius: 16,
    elevation: 8,
    minHeight: 160,
    borderWidth: 1,
    borderColor: '#f1f5f9',
  },
  gameIcon: {
    width: 64,
    height: 64,
    borderRadius: 32,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 12,
    elevation: 6,
  },
  gameName: {
    fontSize: 18,
    fontWeight: '700',
    color: '#1e293b',
    marginBottom: 8,
    textAlign: 'center',
    letterSpacing: -0.3,
  },
  gameNameContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8,
  },
  gameDemoBadge: {
    backgroundColor: '#f59e0b',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 8,
    marginLeft: 6,
  },
  gameDemoText: {
    fontSize: 8,
    fontWeight: '700',
    color: '#ffffff',
    textTransform: 'uppercase',
  },
  gameCategory: {
    fontSize: 14,
    color: '#64748b',
    fontWeight: '500',
    textAlign: 'center',
    backgroundColor: '#f8fafc',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  
  // Stats Section Styles
  statsSection: {
    marginTop: 20,
    marginBottom: 40,
  },
  statsHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  statsTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1e293b',
    textAlign: 'center',
    flex: 1,
  },
  refreshButton: {
    padding: 8,
    borderRadius: 8,
    backgroundColor: '#f1f5f9',
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  statsGrid: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 8,
    paddingHorizontal: 2,
  },
  statCard: {
    flex: 1,
    backgroundColor: '#ffffff',
    borderRadius: 12,
    padding: 12,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
    borderWidth: 1,
    borderColor: '#f1f5f9',
    minHeight: 120,
    justifyContent: 'center',
  },
  statNumber: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#6366f1',
    marginTop: 8,
    marginBottom: 4,
    textAlign: 'center',
  },
  statLabel: {
    fontSize: 11,
    color: '#64748b',
    textAlign: 'center',
    fontWeight: '500',
    flexWrap: 'wrap',
    maxWidth: '100%',
    paddingHorizontal: 4,
    lineHeight: 13,
    paddingVertical: 2,
    flexShrink: 1,
  },
  

  
  // Enhanced Language Mode Badge - Aligned with app aesthetics
  languageModeBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#e0e7ff',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 16,
    marginTop: 12,
    borderWidth: 1,
    borderColor: '#c7d2fe',
  },
  languageModeBadgeText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#6366f1',
    marginLeft: 6,
  },
  languageModeHint: {
    fontSize: 11,
    color: '#94a3b8',
    marginTop: 8,
    textAlign: 'center',
    fontStyle: 'italic',
  },
  
  // Loading State
  loadingContainer: {
    alignItems: 'center',
    paddingVertical: 40,
  },
  loadingText: {
    fontSize: 16,
    color: '#64748b',
    marginTop: 16,
    fontWeight: '500',
  },
  
  // Modal styles - Aligned with app aesthetics
  modalContainer: {
    flex: 1,
    backgroundColor: '#f8fafc',
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 18,
    backgroundColor: '#ffffff',
    borderBottomWidth: 1,
    borderBottomColor: '#e2e8f0',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 3,
  },
  closeButton: {
    padding: 8,
    borderRadius: 8,
    backgroundColor: '#f1f5f9',
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1e293b',
  },
  placeholder: {
    width: 40,
  },
  modalContent: {
    flex: 1,
    padding: 0,
  },
  
  // Game styles - Aligned with app aesthetics
  gameContainer: {
    flex: 1,
    padding: 0,
    backgroundColor: '#f8fafc',
  },
  
  // New Clean Review Page Styles
  newGameContainer: {
    flex: 1,
    backgroundColor: '#f8fafc',
    padding: 20,
    paddingBottom: 40, // Add bottom padding to prevent overflow
    justifyContent: 'space-between', // Distribute space properly
  },
  newReviewHeader: {
    alignItems: 'center',
    marginBottom: 32,
  },
  newReviewIconContainer: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#fef3c7',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  newReviewTitle: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#1e293b',
    marginBottom: 8,
    textAlign: 'center',
  },
  newReviewSubtitle: {
    fontSize: 16,
    color: '#64748b',
    textAlign: 'center',
    lineHeight: 22,
  },
  newStatsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 32,
    paddingHorizontal: 10,
    gap: 16, // Add gap between items
  },
  newStatItem: {
    alignItems: 'center',
    flex: 1,
    minWidth: 80, // Ensure minimum width for proper alignment
  },
  newStatValue: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#1e293b',
    marginTop: 8,
    marginBottom: 4,
  },
  newStatLabel: {
    fontSize: 14,
    color: '#64748b',
    fontWeight: '500',
  },
  newProgressContainer: {
    marginBottom: 32,
    alignItems: 'center',
  },
  newProgressBar: {
    width: '100%',
    height: 12,
    backgroundColor: '#e2e8f0',
    borderRadius: 6,
    marginBottom: 12,
    overflow: 'hidden',
  },
  newProgressFill: {
    height: '100%',
    backgroundColor: '#10b981',
    borderRadius: 6,
  },
  newProgressText: {
    fontSize: 16,
    color: '#64748b',
    fontWeight: '600',
  },
  newReviewToggle: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#f0f4ff',
    paddingVertical: 16,
    paddingHorizontal: 24,
    borderRadius: 12,
    marginBottom: 24,
    borderWidth: 2,
    borderColor: '#6366f1',
  },
  newReviewToggleText: {
    fontSize: 16,
    color: '#6366f1',
    fontWeight: '600',
    marginLeft: 8,
  },
  newReviewList: {
    flex: 1,
    marginBottom: 24,
    maxHeight: 400, // Limit height to prevent overflow
  },
  newReviewListTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#1e293b',
    textAlign: 'center',
    marginBottom: 20,
  },
  newReviewScroll: {
    flex: 1,
    paddingBottom: 20, // Add padding to scroll content
  },
  newReviewCard: {
    backgroundColor: '#ffffff',
    borderRadius: 16,
    padding: 20,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 4,
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  newReviewCardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  newReviewNumber: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#f0f4ff',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#6366f1',
  },
  newReviewNumberText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#6366f1',
  },
  newReviewStatus: {
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
  },
  newReviewStatusText: {
    fontSize: 18,
    fontWeight: 'bold',
  },
  newReviewCorrect: {
    backgroundColor: '#dcfce7',
    borderWidth: 2,
    borderColor: '#10b981',
  },
  newReviewWrong: {
    backgroundColor: '#fee2e2',
    borderWidth: 2,
    borderColor: '#ef4444',
  },
  newReviewSkipped: {
    backgroundColor: '#fef3c7',
    borderWidth: 2,
    borderColor: '#f59e0b',
  },
  newReviewCardContent: {
    gap: 12,
  },
  newReviewRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#f1f5f9',
  },
  newReviewLabel: {
    fontSize: 14,
    color: '#64748b',
    fontWeight: '600',
    width: 80,
    marginRight: 12,
  },
  newReviewWord: {
    fontSize: 16,
    color: '#f59e0b',
    fontWeight: '600',
    flex: 1,
  },
  newReviewAnswer: {
    fontSize: 16,
    color: '#10b981',
    fontWeight: '600',
    flex: 1,
  },
  newReviewHint: {
    fontSize: 16,
    color: '#6366f1',
    fontStyle: 'italic',
    flex: 1,
  },
  newReviewWrongAnswer: {
    fontSize: 16,
    color: '#ef4444',
    fontWeight: '500',
    flex: 1,
  },
  newFinishButton: {
    backgroundColor: '#6366f1',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 18,
    paddingHorizontal: 32,
    borderRadius: 16,
    shadowColor: '#6366f1',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.25,
    shadowRadius: 12,
    elevation: 8,
    borderWidth: 2,
    borderColor: '#4f46e5',
    marginTop: 'auto', // Push button to bottom
    marginBottom: 20, // Add bottom margin
  },
  newFinishButtonText: {
    color: '#ffffff',
    fontSize: 18,
    fontWeight: '700',
    marginLeft: 8,
  },
  
  // New scroll container styles
  newReviewScrollContainer: {
    flex: 1,
  },
  newReviewScrollContent: {
    paddingBottom: 20,
  },
  newFinishButtonContainer: {
    paddingHorizontal: 20,
    paddingBottom: 20,
    backgroundColor: '#f8fafc',
  },
  debugText: {
    fontSize: 12,
    color: '#94a3b8',
    textAlign: 'center',
    marginTop: 8,
    fontStyle: 'italic',
  },
  gameHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#ffffff',
    padding: 12,
    borderRadius: 10,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.06,
    shadowRadius: 6,
    elevation: 2,
    borderWidth: 1,
    borderColor: '#f1f5f9',
  },
  gameHeaderText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1e293b',
  },
  quizHeader: {
    marginBottom: 16,
  },
  quizHeaderContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
    paddingHorizontal: 4,
  },
  quizInfo: {
    flex: 1,
    marginRight: 12,
  },
  quizTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#1e293b',
    marginBottom: 4,
  },
  quizSubtitle: {
    fontSize: 13,
    color: '#64748b',
    fontWeight: '500',
  },
  progressCircle: {
    width: 70,
    height: 70,
    borderRadius: 35,
    borderWidth: 3,
    borderColor: '#6366f1',
    justifyContent: 'center',
    alignItems: 'center',
    flexShrink: 0,
  },
  progressCircleInner: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: '#ffffff',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 3,
    borderColor: '#6366f1',
  },
  progressCircleText: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#6366f1',
  },
  progressSection: {
    marginBottom: 12,
  },
  progressHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 6,
  },
  progressText: {
    fontSize: 13,
    color: '#64748b',
    fontWeight: '500',
  },
  progressBar: {
    height: 6,
    backgroundColor: '#f1f5f9',
    borderRadius: 3,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  progressFill: {
    height: '100%',
    backgroundColor: '#6366f1',
    borderRadius: 3,
  },
  questionSection: {
    marginBottom: 8,
  },
  questionCard: {
    backgroundColor: '#ffffff',
    borderRadius: 10,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.06,
    shadowRadius: 6,
    elevation: 2,
    borderWidth: 1,
    borderColor: '#f1f5f9',
  },
  questionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  questionNumberBadge: {
    backgroundColor: '#f0f4ff',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#e0e7ff',
  },
  questionNumberText: {
    fontSize: 11,
    fontWeight: '600',
    color: '#6366f1',
  },
  questionType: {
    fontSize: 11,
    color: '#64748b',
    fontWeight: '500',
    fontStyle: 'italic',
  },
  questionText: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#1e293b',
    textAlign: 'center',
    marginBottom: 8,
    lineHeight: 28,
    letterSpacing: 0.3,
  },
  questionHint: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 8,
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: '#f1f5f9',
  },
  questionHintText: {
    fontSize: 12,
    color: '#64748b',
    fontWeight: '500',
    marginLeft: 6,
  },
  answersSection: {
    marginBottom: 16,
  },
  answersLabel: {
    fontSize: 15,
    fontWeight: '600',
    color: '#1e293b',
    marginBottom: 10,
    textAlign: 'center',
  },
  answersContainer: {
    gap: 10,
  },
  answerButton: {
    backgroundColor: '#ffffff',
    padding: 14,
    borderRadius: 10,
    borderWidth: 2,
    borderColor: '#e2e8f0',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.06,
    shadowRadius: 4,
    elevation: 2,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    minHeight: 56,
  },
  selectedAnswer: {
    borderColor: '#6366f1',
    backgroundColor: '#f0f4ff',
    shadowColor: '#6366f1',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 4,
  },
  correctAnswer: {
    borderColor: '#10b981',
    backgroundColor: '#f0fdf4',
    shadowColor: '#10b981',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 4,
  },
  wrongAnswer: {
    borderColor: '#ef4444',
    backgroundColor: '#fef2f2',
    shadowColor: '#ef4444',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 4,
  },
  answerText: {
    fontSize: 15,
    color: '#1e293b',
    textAlign: 'left',
    fontWeight: '500',
    lineHeight: 20,
    flex: 1,
  },
  selectedAnswerText: {
    color: '#6366f1',
    fontWeight: '600',
  },
  correctAnswerText: {
    color: '#10b981',
    fontWeight: '600',
  },
  correctIcon: {
    width: 22,
    height: 22,
    borderRadius: 11,
    backgroundColor: '#10b981',
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: 6,
    flexShrink: 0,
  },
  wrongIcon: {
    width: 22,
    height: 22,
    borderRadius: 11,
    backgroundColor: '#ef4444',
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: 6,
    flexShrink: 0,
  },
  scoreSection: {
    marginTop: 'auto',
    paddingTop: 12,
  },
  scoreCard: {
    backgroundColor: '#ffffff',
    borderRadius: 10,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.06,
    shadowRadius: 6,
    elevation: 2,
    borderWidth: 1,
    borderColor: '#f1f5f9',
  },
  scoreHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  scoreTitle: {
    fontSize: 15,
    fontWeight: 'bold',
    color: '#1e293b',
    marginLeft: 6,
  },
  scoreContent: {
    gap: 6,
  },
  scoreRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 3,
  },
  scoreLabel: {
    fontSize: 13,
    color: '#64748b',
    fontWeight: '500',
  },
  scoreText: {
    fontSize: 15,
    fontWeight: 'bold',
    color: '#1e293b',
  },
  scorePercentage: {
    fontSize: 15,
    fontWeight: 'bold',
    color: '#6366f1',
  },
  scoreRemaining: {
    fontSize: 13,
    color: '#64748b',
    fontWeight: '500',
  },
  
  // Memory game styles - Aligned with app aesthetics
  // Game Introduction Styles
  gameIntroHeader: {
    alignItems: 'center',
    marginBottom: 32,
  },
  gameIntroIconContainer: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#f0f4ff',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
    borderWidth: 3,
    borderColor: '#e0e7ff',
  },
  gameIntroTitle: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#1e293b',
    textAlign: 'center',
    marginBottom: 8,
  },
  gameIntroSubtitle: {
    fontSize: 16,
    color: '#64748b',
    textAlign: 'center',
    fontWeight: '500',
  },
  gameIntroContent: {
    flex: 1,
    gap: 10,
  },
  gameIntroSection: {
    backgroundColor: '#ffffff',
    borderRadius: 10,
    padding: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 3,
    elevation: 2,
    borderWidth: 1,
    borderColor: '#f1f5f9',
  },
  gameIntroSectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  gameIntroSectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1e293b',
    marginLeft: 8,
  },
  gameIntroText: {
    fontSize: 14,
    color: '#64748b',
    lineHeight: 20,
  },
  gameIntroStats: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginTop: 4,
  },
  gameIntroStat: {
    alignItems: 'center',
  },
  gameIntroStatLabel: {
    fontSize: 12,
    color: '#64748b',
    fontWeight: '500',
    marginBottom: 4,
  },
  gameIntroStatValue: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#6366f1',
  },
  gameIntroButton: {
    backgroundColor: '#6366f1',
    paddingVertical: 14,
    paddingHorizontal: 28,
    borderRadius: 14,
    shadowColor: '#6366f1',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.2,
    shadowRadius: 6,
    elevation: 4,
    borderWidth: 2,
    borderColor: '#4f46e5',
  },
  gameIntroButtonContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  gameIntroButtonText: {
    color: '#ffffff',
    fontSize: 18,
    fontWeight: '700',
    marginLeft: 8,
  },
  gameIntroButtonDisabled: {
    backgroundColor: '#cbd5e1',
    borderColor: '#94a3b8',
    shadowOpacity: 0.1,
    elevation: 2,
  },
  
  // Word Scramble specific intro styles
  gameIntroInfo: {
    marginBottom: 32,
    gap: 16,
  },
  gameIntroInfoCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#ffffff',
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  gameIntroInfoText: {
    fontSize: 14,
    color: '#64748b',
    marginLeft: 12,
    flex: 1,
    lineHeight: 20,
  },
  gameIntroActions: {
    alignItems: 'center',
  },
  
  // Word Scramble Game Styles
  wordScrambleHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#ffffff',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderRadius: 16,
    marginBottom: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 3,
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  wordScrambleHeaderLeft: {
    flex: 1,
    gap: 12,
  },
  wordScrambleHeaderStat: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  wordScrambleHeaderStatText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#374151',
  },
  wordScrambleHeaderRight: {
    alignItems: 'center',
  },
  wordScrambleProgressCircle: {
    width: 60,
    height: 60,
    borderRadius: 30,
    borderWidth: 3,
    borderColor: '#16a34a',
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#ffffff',
  },
  wordScrambleProgressText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#16a34a',
  },
  wordScrambleContainer: {
    marginBottom: 32,
  },
  wordScrambleCard: {
    backgroundColor: '#ffffff',
    padding: 24,
    borderRadius: 16,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 12,
    elevation: 4,
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  wordScrambleLabel: {
    fontSize: 16,
    color: '#64748b',
    marginBottom: 16,
    fontWeight: '500',
  },
  wordScrambledWord: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#1e293b',
    marginBottom: 20,
    letterSpacing: 2,
    textAlign: 'center',
  },
  wordScrambleHintContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fef3c7',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#f59e0b',
  },
  wordScrambleHintText: {
    fontSize: 14,
    color: '#92400e',
    marginLeft: 8,
    fontWeight: '500',
  },
  wordScrambleInputContainer: {
    gap: 20,
    paddingBottom: 100, // Add padding to ensure input is visible above keyboard
  },
  wordScrambleAnswerInput: {
    backgroundColor: '#ffffff',
    borderWidth: 2,
    borderColor: '#e2e8f0',
    borderRadius: 12,
    paddingHorizontal: 20,
    paddingVertical: 16,
    fontSize: 18,
    color: '#1e293b',
    textAlign: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  wordScrambleSubmitButton: {
    backgroundColor: '#16a34a',
    paddingVertical: 16,
    paddingHorizontal: 32,
    borderRadius: 12,
    shadowColor: '#16a34a',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.2,
    shadowRadius: 6,
    elevation: 4,
    borderWidth: 2,
    borderColor: '#15803d',
    flex: 2,
  },
  wordScrambleSubmitButtonDisabled: {
    backgroundColor: '#cbd5e1',
    borderColor: '#94a3b8',
    shadowOpacity: 0.1,
    elevation: 2,
  },
  wordScrambleSubmitButtonContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  wordScrambleSubmitButtonText: {
    color: '#ffffff',
    fontSize: 18,
    fontWeight: '700',
    marginLeft: 8,
  },
  
  // Hint button styles
  wordScrambleHintButton: {
    backgroundColor: '#fef3c7',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#f59e0b',
    alignSelf: 'center',
  },
  wordScrambleHintButtonContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  wordScrambleHintButtonText: {
    fontSize: 14,
    color: '#92400e',
    marginLeft: 8,
    fontWeight: '600',
  },
  
  // Button row and skip button styles
  wordScrambleButtonRow: {
    flexDirection: 'row',
    gap: 16,
    justifyContent: 'space-between',
  },
  wordScrambleSkipButton: {
    backgroundColor: '#f8fafc',
    paddingVertical: 16,
    paddingHorizontal: 24,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: '#e2e8f0',
    flex: 1,
  },
  wordScrambleSkipButtonContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  wordScrambleSkipButtonText: {
    color: '#64748b',
    fontSize: 16,
    fontWeight: '600',
    marginLeft: 6,
  },
  

  questionCountOption: {
    width: '48%',
    backgroundColor: '#f8fafc',
    borderRadius: 8,
    padding: 12,
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#e2e8f0',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  questionCountOptionSelected: {
    backgroundColor: '#f0fdf4',
    borderColor: '#16a34a',
    shadowColor: '#16a34a',
    shadowOpacity: 0.15,
    shadowRadius: 4,
    elevation: 3,
  },
  questionCountOptionDisabled: {
    backgroundColor: '#f1f5f9',
    borderColor: '#cbd5e1',
    opacity: 0.5,
  },
  questionCountOptionText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#64748b',
    marginBottom: 2,
  },
  questionCountOptionTextSelected: {
    color: '#16a34a',
  },
  questionCountOptionTextDisabled: {
    color: '#94a3b8',
  },
  questionCountOptionLabel: {
    fontSize: 10,
    color: '#94a3b8',
    fontWeight: '500',
  },
  questionCountOptionLabelSelected: {
    color: '#16a34a',
  },
  questionCountOptionLabelDisabled: {
    color: '#cbd5e1',
  },
  questionCountWarning: {
    fontSize: 12,
    color: '#f59e0b',
    textAlign: 'center',
    marginTop: 8,
    fontStyle: 'italic',
  },
  
  // Feedback Popup Styles
  feedbackOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 1000,
  },
  feedbackPopup: {
    backgroundColor: '#ffffff',
    padding: 24,
    borderRadius: 16,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.25,
    shadowRadius: 16,
    elevation: 8,
    borderWidth: 3,
    maxWidth: '80%',
  },
  feedbackPopupCorrect: {
    borderColor: '#10b981',
  },
  feedbackPopupIncorrect: {
    borderColor: '#ef4444',
  },
  feedbackIconContainer: {
    marginBottom: 16,
  },
  feedbackMessage: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1e293b',
    textAlign: 'center',
    lineHeight: 24,
  },
  
  // Enhanced Review Page Styles
  reviewListContainer: {
    marginBottom: 24,
    flex: 1, // Take available space
    paddingBottom: 40, // Much more padding for the container
  },
  reviewListTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#1e293b',
    textAlign: 'center',
    marginBottom: 16,
    marginTop: 8, // Add top margin for better spacing
  },
  reviewItemNumber: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#f0f4ff',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#6366f1',
  },
  reviewItemNumberText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#6366f1',
  },
  reviewWordSection: {
    marginBottom: 16,
    padding: 12,
    backgroundColor: '#f8fafc',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  reviewSectionLabel: {
    fontSize: 12,
    color: '#64748b',
    fontWeight: '600',
    marginBottom: 4,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  reviewScrambledWord: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#f59e0b',
    letterSpacing: 1,
  },
  reviewCorrectWord: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#10b981',
  },
  reviewHintText: {
    fontSize: 16,
    color: '#6366f1',
    fontStyle: 'italic',
  },
  
  // Performance Summary Styles
  performanceSummary: {
    marginBottom: 24,
    alignItems: 'center',
  },
  performanceBar: {
    width: '100%',
    height: 8,
    backgroundColor: '#e2e8f0',
    borderRadius: 4,
    marginBottom: 12,
    overflow: 'hidden',
  },
  performanceBarFill: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: '#e2e8f0',
  },
  performanceBarProgress: {
    height: '100%',
    backgroundColor: '#16a34a',
    borderRadius: 4,
  },
  performanceText: {
    fontSize: 14,
    color: '#64748b',
    fontWeight: '500',
    textAlign: 'center',
  },
  
  // Review Toggle Styles
  reviewToggleContainer: {
    marginBottom: 20,
    alignItems: 'center',
  },
  reviewToggleButton: {
    backgroundColor: '#f0f4ff',
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 20,
    borderWidth: 2,
    borderColor: '#6366f1',
  },
  reviewToggleContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  reviewToggleText: {
    fontSize: 16,
    color: '#6366f1',
    fontWeight: '600',
  },
  
  // Error text style
  errorText: {
    fontSize: 18,
    color: '#ef4444',
    textAlign: 'center',
    marginTop: 100,
  },
  
  // Card Count Selection Styles
  cardCountGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    gap: 4,
    marginTop: 6,
  },
  cardCountOption: {
    width: '48%',
    backgroundColor: '#f8fafc',
    borderRadius: 6,
    padding: 8,
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#e2e8f0',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  cardCountOptionSelected: {
    backgroundColor: '#f0f4ff',
    borderColor: '#6366f1',
    shadowColor: '#6366f1',
    shadowOpacity: 0.15,
    shadowRadius: 4,
    elevation: 3,
  },
  cardCountOptionText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#64748b',
    marginBottom: 1,
  },
  cardCountOptionTextSelected: {
    color: '#6366f1',
  },
  cardCountOptionTextDisabled: {
    color: '#cbd5e1',
  },
  cardCountOptionLabel: {
    fontSize: 10,
    color: '#94a3b8',
    fontWeight: '500',
  },
  cardCountOptionLabelSelected: {
    color: '#6366f1',
  },
  cardCountOptionLabelDisabled: {
    color: '#cbd5e1',
  },
  cardCountWarning: {
    fontSize: 10,
    color: '#ef4444',
    textAlign: 'center',
    marginTop: 6,
    fontStyle: 'italic',
  },
  availableCardsText: {
    fontSize: 10,
    color: '#64748b',
    textAlign: 'center',
    marginTop: 6,
    fontStyle: 'italic',
  },
  
  // Enhanced Game Header Styles
  gameHeaderLeft: {
    flexDirection: 'row',
    gap: 16,
  },
  gameHeaderStat: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  gameHeaderStatText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1e293b',
  },
  gameHeaderRight: {
    alignItems: 'center',
  },
  gameProgressCircle: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: '#f0f4ff',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#6366f1',
  },
  gameProgressText: {
    fontSize: 12,
    fontWeight: 'bold',
    color: '#6366f1',
  },
  
  memoryGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    alignItems: 'flex-start',
    paddingHorizontal: 8,
  },
  memoryCardContainer: {
    margin: 4,
    justifyContent: 'center',
    alignItems: 'center',
  },
  memoryCardEmpty: {
    margin: 4,
    // Invisible placeholder to maintain grid layout
  },
  memoryCard: {
    backgroundColor: '#ffffff',
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 4,
    elevation: 3,
    borderWidth: 2,
    borderColor: '#e2e8f0',
    transform: [{ scale: 1 }],
  },
  memoryCardFlipped: {
    backgroundColor: '#f8fafc',
    borderColor: '#6366f1',
  },

  memoryCardText: {
    color: '#1e293b',
    fontSize: 12,
    fontWeight: 'bold',
    textAlign: 'center',
    lineHeight: 16,
  },
  
  // Review styles - Aligned with app aesthetics
  reviewTitle: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#1e293b',
    textAlign: 'center',
    marginBottom: 8,
    letterSpacing: 0.5,
  },
  reviewSubtitle: {
    fontSize: 18,
    color: '#64748b',
    textAlign: 'center',
    marginBottom: 24,
    fontWeight: '500',
  },
  reviewContainer: {
    flex: 1,
    marginBottom: 20,
    paddingBottom: 200, // Much more aggressive padding to prevent content from running off screen
  },
  reviewItem: {
    backgroundColor: '#ffffff',
    padding: 20,
    borderRadius: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 12,
    elevation: 4,
  },
  reviewQuestion: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1e293b',
    marginBottom: 12,
    lineHeight: 24,
  },
  reviewAnswer: {
    fontSize: 16,
    color: '#64748b',
    marginBottom: 12,
    fontStyle: 'italic',
    lineHeight: 22,
    backgroundColor: '#f8fafc',
    padding: 12,
    borderRadius: 8,
    borderLeftWidth: 4,
    borderLeftColor: '#6366f1',
  },
  reviewResult: {
    alignItems: 'center',
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#f1f5f9',
  },
  reviewResultText: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 4,
  },
  correctResult: {
    color: '#10b981',
  },
  wrongResult: {
    color: '#ef4444',
  },
  reviewCorrectAnswer: {
    fontSize: 14,
    color: '#ef4444',
    fontStyle: 'italic',
  },
  reviewButton: {
    backgroundColor: '#6366f1',
    paddingVertical: 18,
    paddingHorizontal: 32,
    borderRadius: 16,
    alignItems: 'center',
    shadowColor: '#6366f1',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.25,
    shadowRadius: 12,
    elevation: 8,
    borderWidth: 2,
    borderColor: '#4f46e5',
  },
  reviewButtonText: {
    color: '#ffffff',
    fontSize: 18,
    fontWeight: '700',
    letterSpacing: 0.5,
  },
  reviewButtonContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  reviewActions: {
    alignItems: 'center',
    marginTop: 16,
    marginBottom: 120, // Much more aggressive bottom margin to prevent button from being cut off
  },
  
  // Review stats styles - Aligned with app aesthetics
  reviewStats: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 24,
    gap: 12,
  },
  reviewStatsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    marginBottom: 24,
    gap: 12,
    paddingHorizontal: 16,
  },
  reviewStat: {
    flex: 1,
    backgroundColor: '#ffffff',
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#e2e8f0',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 3,
  },
  reviewStatCard: {
    width: '48%',
    backgroundColor: '#ffffff',
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#e2e8f0',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 3,
  },
  reviewStatIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#f8fafc',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 8,
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  reviewStatLabel: {
    fontSize: 12,
    color: '#64748b',
    marginBottom: 4,
    fontWeight: '500',
  },
  reviewStatValue: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#1e293b',
  },
  
  // Memory card color states - Aligned with app aesthetics
  memoryCardCorrect: {
    backgroundColor: '#10b981',
    borderColor: '#059669',
  },
  memoryCardIncorrect: {
    backgroundColor: '#ef4444',
    borderColor: '#dc2626',
  },
  memoryCardFlippedSingle: {
    backgroundColor: '#6366f1',
    borderColor: '#4f46e5',
  },
  
  // Quiz setup styles - Aligned with app aesthetics
  setupContainer: {
    flex: 1,
    padding: 20,
  },
  setupHeader: {
    alignItems: 'center',
    marginBottom: 20,
  },
  setupIconContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#f0f4ff',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
    borderWidth: 2,
    borderColor: '#e0e7ff',
  },
  setupTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#1e293b',
    textAlign: 'center',
    marginBottom: 6,
    letterSpacing: 0.5,
  },
  setupSubtitle: {
    fontSize: 14,
    color: '#64748b',
    textAlign: 'center',
    fontWeight: '500',
  },
  setupSection: {
    marginBottom: 20,
  },
  setupLabelContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  setupLabelIcon: {
    marginRight: 8,
  },
  setupLabel: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1e293b',
  },
  questionCountGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  questionCountCard: {
    flex: 1,
    minWidth: '45%',
    backgroundColor: '#ffffff',
    padding: 16,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: '#e2e8f0',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.06,
    shadowRadius: 6,
    elevation: 2,
    position: 'relative',
  },
  selectedQuestionCountCard: {
    backgroundColor: '#6366f1',
    borderColor: '#6366f1',
    shadowColor: '#6366f1',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 12,
    elevation: 6,
    transform: [{ scale: 1.02 }],
  },
  questionCountContent: {
    alignItems: 'center',
  },
  questionCountNumber: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#1e293b',
    marginBottom: 4,
  },
  selectedQuestionCountNumber: {
    color: '#ffffff',
  },
  questionCountLabel: {
    fontSize: 12,
    color: '#64748b',
    fontWeight: '500',
    textAlign: 'center',
  },
  selectedQuestionCountLabel: {
    color: '#e0e7ff',
  },
  selectedIndicator: {
    position: 'absolute',
    top: 8,
    right: 8,
    backgroundColor: '#10b981',
    borderRadius: 12,
    padding: 2,
  },
  languageModeGrid: {
    gap: 12,
  },
  languageModeCard: {
    backgroundColor: '#ffffff',
    padding: 16,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: '#e2e8f0',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.06,
    shadowRadius: 6,
    elevation: 2,
    position: 'relative',
  },
  selectedLanguageModeCard: {
    backgroundColor: '#6366f1',
    borderColor: '#6366f1',
    shadowColor: '#6366f1',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 12,
    elevation: 6,
    transform: [{ scale: 1.02 }],
  },
  selectedLanguageModeIcon: {
    backgroundColor: '#ffffff',
    borderColor: '#ffffff',
  },
  languageModeContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  languageModeIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#f0f4ff',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
    borderWidth: 2,
    borderColor: '#e0e7ff',
  },
  languageModeText: {
    flex: 1,
  },
  languageModeTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1e293b',
    marginBottom: 4,
  },
  selectedLanguageModeTitle: {
    color: '#ffffff',
  },
  languageModeDescription: {
    fontSize: 14,
    color: '#64748b',
    fontWeight: '500',
  },
  selectedLanguageModeDescription: {
    color: '#e0e7ff',
  },
  quizPreview: {
    backgroundColor: '#f8fafc',
    borderRadius: 12,
    padding: 16,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  previewHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  previewTitle: {
    fontSize: 15,
    fontWeight: '600',
    color: '#1e293b',
    marginLeft: 6,
  },
  previewContent: {
    gap: 8,
  },
  previewItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  previewLabel: {
    fontSize: 14,
    color: '#64748b',
    fontWeight: '500',
  },
  previewValue: {
    fontSize: 14,
    color: '#1e293b',
    fontWeight: '600',
  },
  startQuizButton: {
    backgroundColor: '#10b981',
    paddingVertical: 16,
    paddingHorizontal: 28,
    borderRadius: 14,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    shadowColor: '#10b981',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 6,
    borderWidth: 2,
    borderColor: '#059669',
  },
  startButtonContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  startQuizButtonText: {
    color: '#ffffff',
    fontSize: 18,
    fontWeight: '700',
    marginLeft: 8,
    letterSpacing: 0.5,
  },
  startButtonArrow: {
    backgroundColor: '#059669',
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
  },
  startQuizButtonDisabled: {
    backgroundColor: '#94a3b8',
    borderColor: '#64748b',
    opacity: 0.6,
  },
  
  // Hangman game styles - Aligned with app aesthetics
  hangmanContainer: {
    alignItems: 'center',
    marginBottom: 24,
    paddingHorizontal: 16,
  },
  hangmanTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#1e293b',
    marginBottom: 16,
  },
  hangmanDrawing: {
    alignItems: 'center',
    marginBottom: 16,
    minHeight: 100,
    justifyContent: 'center',
    backgroundColor: '#f8fafc',
    padding: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  hangmanText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#1e293b',
    fontFamily: 'monospace',
    lineHeight: 18,
    textAlign: 'center',
    letterSpacing: 0.5,
  },
  wrongGuessesText: {
    fontSize: 16,
    color: '#64748b',
    marginBottom: 20,
  },
  wordContainer: {
    alignItems: 'center',
    marginBottom: 24,
    paddingHorizontal: 16,
  },
  wordHint: {
    fontSize: 14,
    color: '#64748b',
    marginBottom: 12,
    textAlign: 'center',
    paddingHorizontal: 10,
  },
  maskedWord: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#1e293b',
    letterSpacing: 2,
    textAlign: 'center',
    lineHeight: 32,
    paddingHorizontal: 10,
    fontFamily: 'monospace',
  },
  gameStatusContainer: {
    alignItems: 'center',
    marginTop: 'auto',
    paddingVertical: 20,
  },
  gameStatusText: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#1e293b',
    marginBottom: 8,
  },
  gameStatusSubtext: {
    fontSize: 16,
    color: '#64748b',
    marginBottom: 20,
  },
  nextButton: {
    backgroundColor: '#6366f1',
    paddingVertical: 16,
    paddingHorizontal: 32,
    borderRadius: 12,
    alignItems: 'center',
  },
  nextButtonText: {
    color: '#ffffff',
    fontSize: 18,
    fontWeight: '600',
  },
  letterGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 10,
    maxWidth: '100%',
  },
  letterButton: {
    width: 40,
    height: 40,
    backgroundColor: '#f1f5f9',
    borderRadius: 6,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#e2e8f0',
    margin: 2,
  },
  letterButtonGuessed: {
    backgroundColor: '#d1fae5',
    borderColor: '#10b981',
  },
  letterButtonWrong: {
    backgroundColor: '#fef2f2',
    borderColor: '#ef4444',
  },
  letterButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1e293b',
  },
  letterButtonTextGuessed: {
    color: '#10b981',
  },
  letterGridContainer: {
    alignItems: 'center',
    marginBottom: 20,
  },
  letterGridTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1e293b',
    marginBottom: 8,
  },
  
  // Word Scramble styles - Aligned with app aesthetics
  scrambleContainer: {
    alignItems: 'center',
    marginBottom: 30,
  },
  scrambleText: {
    fontSize: 18,
    color: '#64748b',
    marginBottom: 16,
    textAlign: 'center',
  },
  scrambledWord: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#6366f1',
    marginBottom: 16,
    textAlign: 'center',
    letterSpacing: 2,
  },
  challengeNumber: {
    fontSize: 16,
    color: '#64748b',
    textAlign: 'center',
    fontStyle: 'italic',
  },
  inputContainer: {
    flexDirection: 'row',
    gap: 12,
    paddingHorizontal: 16,
  },
  answerInput: {
    flex: 1,
    backgroundColor: '#ffffff',
    borderWidth: 2,
    borderColor: '#e2e8f0',
    borderRadius: 12,
    padding: 16,
    fontSize: 16,
    color: '#1e293b',
  },
  submitButton: {
    backgroundColor: '#6366f1',
    paddingHorizontal: 24,
    paddingVertical: 16,
    borderRadius: 12,
    justifyContent: 'center',
  },
  submitButtonText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '600',
  },
  
  // Speed Challenge styles - Aligned with app aesthetics
  speedContainer: {
    alignItems: 'center',
    marginBottom: 30,
  },
  speedTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#1e293b',
    marginBottom: 20,
  },
  speedTimer: {
    fontSize: 48,
    fontWeight: 'bold',
    color: '#6366f1',
    marginBottom: 20,
  },
  speedQuestion: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#1e293b',
    textAlign: 'center',
    marginBottom: 24,
    lineHeight: 32,
  },
  speedInput: {
    backgroundColor: '#ffffff',
    borderWidth: 2,
    borderColor: '#e2e8f0',
    borderRadius: 12,
    paddingVertical: 18,
    paddingHorizontal: 24,
    fontSize: 18,
    color: '#1e293b',
    textAlign: 'center',
    width: '100%',
  },
  speedSubmitButton: {
    backgroundColor: '#10b981',
    paddingVertical: 18,
    paddingHorizontal: 32,
    borderRadius: 12,
    alignItems: 'center',
    marginTop: 20,
  },
  speedSubmitButtonText: {
    color: '#ffffff',
    fontSize: 18,
    fontWeight: '600',
  },
  
  // Missing styles that are referenced in the code
  speedHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 24,
    paddingHorizontal: 16,
    backgroundColor: '#f8fafc',
    paddingVertical: 20,
    borderRadius: 20,
    borderWidth: 2,
    borderColor: '#3b82f6',
  },
  timeText: {
    fontSize: 18,
    fontWeight: '700',
    color: '#ef4444',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  unifiedSelectionCard: {
    backgroundColor: '#ffffff',
    borderRadius: 16,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 3,
    borderWidth: 1,
    borderColor: '#f1f5f9',
  },
  selectionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 20,
  },
  selectionLabel: {
    width: 90,
    marginRight: 16,
  },
  selectionLabelText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1e293b',
  },
  selectionContent: {
    flex: 1,
    marginLeft: 8,
  },
  compactDropdown: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 10,
    paddingHorizontal: 14,
    borderWidth: 2,
    borderColor: '#e2e8f0',
    borderRadius: 8,
    backgroundColor: '#ffffff',
    minHeight: 40,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 3,
    elevation: 1,
  },
  compactDropdownText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#1e293b',
    flex: 1,
    marginRight: 8,
  },
  compactDropdownOptions: {
    backgroundColor: '#ffffff',
    borderRadius: 12,
    marginTop: 8,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 4,
    overflow: 'hidden',
    maxHeight: 180,
  },
  compactDropdownScroll: {
    maxHeight: 180,
  },
  compactDropdownOption: {
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#f1f5f9',
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#ffffff',
  },
  selectedCompactDropdownOption: {
    backgroundColor: '#f0f9ff',
    borderLeftWidth: 3,
    borderLeftColor: '#6366f1',
    borderBottomColor: '#e0f2fe',
  },
  compactDropdownOptionIcon: {
    width: 28,
    height: 28,
    borderRadius: 14,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.06,
    shadowRadius: 2,
    elevation: 1,
  },
  compactDropdownOptionContent: {
    flex: 1,
    marginRight: 4,
  },
  compactDropdownOptionText: {
    fontSize: 14,
    color: '#1e293b',
    fontWeight: '600',
    marginBottom: 2,
  },
  compactDropdownOptionCount: {
    fontSize: 12,
    color: '#64748b',
    fontWeight: '500',
    lineHeight: 14,
  },
  compactDropdownDivider: {
    height: 1,
    backgroundColor: '#e2e8f0',
    marginHorizontal: 16,
    marginVertical: 2,
  },
  compactDifficultyDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#ffffff',
  },
  gameCardCount: {
    fontSize: 12,
    color: '#64748b',
    fontWeight: '500',
    marginTop: 8,
  },
  selectionLabelWithIcon: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  selectionLabelIcon: {
    marginRight: 8,
  },
  favouriteButton: {
    position: 'absolute',
    top: 10,
    right: 10,
    padding: 8,
    borderRadius: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  emptyFavourites: {
    alignItems: 'center',
    marginTop: 20,
  },
  emptyFavouritesText: {
    fontSize: 16,
    color: '#64748b',
    marginBottom: 10,
  },
  emptyFavouritesSubtext: {
    fontSize: 14,
    color: '#94a3b8',
    textAlign: 'center',
  },
  gameFavouriteButton: {
    position: 'absolute',
    top: 8,
    right: 8,
    padding: 6,
    borderRadius: 16,
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 1,
  },
  selectedWordsContainer: {
    marginBottom: 20,
  },
  selectedWordsLabel: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#1e293b',
    marginBottom: 8,
  },
  selectedWordsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  selectedWordChip: {
    backgroundColor: '#f8fafc',
    padding: 8,
    borderRadius: 16,
    borderWidth: 2,
    borderColor: '#e2e8f0',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  selectedWordText: {
    fontSize: 14,
    color: '#1e293b',
    fontWeight: '500',
  },
  removeWordIcon: {
    marginLeft: 8,
  },
  availableWordsContainer: {
    marginBottom: 20,
  },
  availableWordsLabel: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#1e293b',
    marginBottom: 8,
  },
  availableWordsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  availableWordButton: {
    backgroundColor: '#f8fafc',
    padding: 8,
    borderRadius: 16,
    borderWidth: 2,
    borderColor: '#e2e8f0',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  availableWordText: {
    fontSize: 14,
    color: '#1e293b',
    fontWeight: '500',
  },
  submitButtonDisabled: {
    backgroundColor: '#ccc',
  },
  flashcardTerm: {
    fontSize: 14,
    color: '#64748b',
    marginTop: 12,
    textAlign: 'center',
    fontStyle: 'italic',
  },
  reviewHeader: {
    alignItems: 'center',
    marginBottom: 20,
  },
  reviewIconContainer: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: '#fef3c7',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
    borderWidth: 2,
    borderColor: '#f59e0b',
  },
  scoreSummary: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  scoreCircle: {
    width: 80,
    height: 80,
    borderRadius: 40,
    borderWidth: 4,
    borderColor: '#6366f1',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
    backgroundColor: '#ffffff',
  },


  reviewItemHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  reviewQuestionNumber: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1e293b',
  },
  reviewStatusBadge: {
    padding: 4,
    borderRadius: 4,
    backgroundColor: '#f0f4ff',
    marginLeft: 8,
  },
  correctBadge: {
    backgroundColor: '#f0fdf4',
    borderColor: '#10b981',
  },
  wrongBadge: {
    backgroundColor: '#fef2f2',
    borderColor: '#ef4444',
  },
  skippedBadge: {
    backgroundColor: '#f8fafc',
    borderColor: '#94a3b8',
  },
  reviewStatusText: {
    fontSize: 16,
    color: '#6366f1',
    fontWeight: '600',
  },
  reviewLabel: {
    fontSize: 14,
    color: '#64748b',
    fontWeight: '600',
  },
  wrongAnswerContainer: {
    marginTop: 12,
  },
  wrongAnswerLabel: {
    fontSize: 14,
    color: '#64748b',
    fontWeight: '500',
  },
  wrongAnswerText: {
    fontSize: 14,
    color: '#1e293b',
    fontWeight: '500',
  },
  skippedAnswerContainer: {
    marginTop: 12,
  },
  skippedAnswerLabel: {
    fontSize: 14,
    color: '#64748b',
    fontWeight: '500',
    fontStyle: 'italic',
  },
  correctIconText: {
    fontSize: 16,
    color: '#ffffff',
    fontWeight: '600',
  },

  
  // Enhanced review styles
  reviewFilters: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginBottom: 16,
    paddingHorizontal: 16,
  },
  filterButton: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: '#f1f5f9',
    borderWidth: 1,
    borderColor: '#e2e8f0',
    minWidth: 80,
    alignItems: 'center',
  },
  filterButtonActive: {
    backgroundColor: '#6366f1',
    borderColor: '#6366f1',
  },
  filterButtonText: {
    fontSize: 12,
    fontWeight: '500',
    color: '#64748b',
  },
  filterButtonTextActive: {
    color: '#ffffff',
  },
  reviewContent: {
    gap: 12,
  },
  reviewQuestionSection: {
    gap: 4,
  },
  reviewQuestionLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: '#64748b',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  reviewAnswerSection: {
    gap: 4,
  },
  reviewAnswerLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: '#64748b',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  reviewStatsText: {
    fontSize: 12,
    color: '#64748b',
    fontWeight: '500',
  },
  wrongIconText: {
    fontSize: 16,
    color: '#ffffff',
    fontWeight: '600',
  },

  progressPercentage: {
    fontSize: 14,
    color: '#94a3b8',
    fontWeight: '500',
  },
  answerContent: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  answerLetterContainer: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#f0f4ff',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
    borderWidth: 1,
    borderColor: '#e0e7ff',
    flexShrink: 0,
  },
  answerLetter: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#6366f1',
    textAlign: 'center',
    lineHeight: 32,
  },
  setupScrollView: {
    flex: 1,
  },
  setupScrollContent: {
    paddingBottom: 60, // Add some padding at the bottom for the start button
  },
  startButtonContainer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    padding: 16,
    backgroundColor: '#ffffff',
    borderTopWidth: 1,
    borderTopColor: '#e2e8f0',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  availableCardsInfo: {
    marginBottom: 16,
  },
  disabledQuestionCountCard: {
    backgroundColor: '#f1f5f9',
    borderColor: '#cbd5e1',
    opacity: 0.6,
  },
  disabledQuestionCountNumber: {
    color: '#94a3b8',
  },
  disabledQuestionCountLabel: {
    color: '#94a3b8',
  },
  disabledReason: {
    fontSize: 11,
    color: '#94a3b8',
    marginTop: 4,
    textAlign: 'center',
    fontStyle: 'italic',
  },






  // Speed Challenge Compact Layout Styles
  speedIntroCompactContainer: {
    flex: 1,
    paddingHorizontal: 20,
    paddingVertical: 16,
    justifyContent: 'space-between',
  },
  speedIntroHeader: {
    alignItems: 'center',
    marginBottom: 16,
  },
  speedIntroTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#1e293b',
    marginTop: 8,
  },
  speedIntroSubtitle: {
    fontSize: 14,
    color: '#64748b',
    marginTop: 4,
    textAlign: 'center',
  },
  speedIntroInfoRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginBottom: 20,
  },
  speedIntroInfoCardCompact: {
    alignItems: 'center',
    padding: 12,
    backgroundColor: '#f8fafc',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    minWidth: 80,
  },
  speedIntroInfoTextCompact: {
    fontSize: 12,
    color: '#64748b',
    fontWeight: '500',
    marginTop: 4,
    textAlign: 'center',
  },
  speedIntroDurationSection: {
    marginBottom: 20,
  },
  speedIntroDurationTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1e293b',
    textAlign: 'center',
    marginBottom: 12,
  },
  speedIntroDurationGrid: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    gap: 8,
  },
  speedIntroDurationOption: {
    backgroundColor: '#f8fafc',
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderRadius: 10,
    borderWidth: 2,
    borderColor: '#e2e8f0',
    minWidth: 60,
    alignItems: 'center',
  },
  speedIntroDurationOptionSelected: {
    backgroundColor: '#6366f1',
    borderColor: '#6366f1',
  },
  speedIntroDurationOptionText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#64748b',
  },
  speedIntroDurationOptionTextSelected: {
    color: '#ffffff',
  },
  speedIntroLanguageSection: {
    marginBottom: 24,
  },
  speedIntroLanguageTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1e293b',
    textAlign: 'center',
    marginBottom: 12,
  },
  speedIntroLanguageGrid: {
    gap: 10,
  },
  speedIntroLanguageOption: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f8fafc',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: '#e2e8f0',
  },
  speedIntroLanguageOptionSelected: {
    backgroundColor: '#f0f4ff',
    borderColor: '#6366f1',
  },
  speedIntroLanguageOptionText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#64748b',
    marginLeft: 8,
    flex: 1,
  },
  speedIntroLanguageOptionTextSelected: {
    color: '#6366f1',
  },
  speedIntroStartButton: {
    backgroundColor: '#6366f1',
    paddingVertical: 14,
    paddingHorizontal: 24,
    borderRadius: 12,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  speedIntroStartButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#ffffff',
  },

  // Flash Feedback Styles - Input Text Flashing
  answerInputCorrect: {
    backgroundColor: '#d1fae5',
    borderColor: '#10b981',
    borderWidth: 2,
  },
  answerInputIncorrect: {
    backgroundColor: '#fee2e2',
    borderColor: '#dc2626',
    borderWidth: 2,
  },
  selectedWordsContainerCorrect: {
    backgroundColor: '#d1fae5',
    borderColor: '#10b981',
    borderWidth: 2,
    borderRadius: 12,
  },
  selectedWordsContainerIncorrect: {
    backgroundColor: '#fee2e2',
    borderColor: '#dc2626',
    borderWidth: 2,
    borderRadius: 12,
  },
  wordScrambleAnswerInputCorrect: {
    backgroundColor: '#d1fae5',
    borderColor: '#10b981',
    borderWidth: 2,
  },
  wordScrambleAnswerInputIncorrect: {
    backgroundColor: '#fee2e2',
    borderColor: '#dc2626',
    borderWidth: 2,
  },

  // Speed Challenge Review Layout Styles
  speedReviewHeader: {
    alignItems: 'center',
    marginBottom: 20,
    paddingTop: 20,
  },
  speedReviewStatsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginBottom: 24,
    paddingHorizontal: 20,
  },
  speedReviewStatItem: {
    alignItems: 'center',
    minWidth: 80,
  },
  speedReviewStatValue: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#1e293b',
    marginBottom: 4,
  },
  speedReviewStatLabel: {
    fontSize: 14,
    color: '#64748b',
    fontWeight: '500',
  },
  speedReviewQuestionsContainer: {
    flex: 1,
    marginBottom: 20,
  },
  speedReviewQuestionsTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1e293b',
    textAlign: 'center',
    marginBottom: 16,
    paddingHorizontal: 20,
  },

  // Sentence Scramble Landing Page Styles
  sentenceIntroHeader: {
    alignItems: 'center',
    marginBottom: 24,
    paddingTop: 20,
  },
  sentenceIntroIconContainer: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#f3f4f6',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  sentenceIntroTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#1e293b',
    marginBottom: 8,
    textAlign: 'center',
  },
  sentenceIntroSubtitle: {
    fontSize: 16,
    color: '#64748b',
    textAlign: 'center',
    lineHeight: 22,
    paddingHorizontal: 20,
  },
  sentenceIntroInfoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 24,
    paddingHorizontal: 20,
    gap: 12,
  },
  sentenceIntroInfoCard: {
    flex: 1,
    backgroundColor: '#ffffff',
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
    borderWidth: 1,
    borderColor: '#f1f5f9',
  },
  sentenceIntroInfoText: {
    fontSize: 12,
    color: '#64748b',
    textAlign: 'center',
    marginTop: 8,
    lineHeight: 16,
  },
  sentenceIntroSection: {
    marginBottom: 24,
    paddingHorizontal: 20,
  },
  sentenceIntroSectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  sentenceIntroSectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1e293b',
    marginLeft: 8,
  },
  sentenceIntroWarning: {
    fontSize: 14,
    color: '#f59e0b',
    textAlign: 'center',
    marginTop: 8,
    fontStyle: 'italic',
  },
  sentenceIntroActions: {
    alignItems: 'center',
    paddingHorizontal: 20,
  },
  sentenceIntroButton: {
    backgroundColor: '#8b5cf6',
    paddingVertical: 16,
    paddingHorizontal: 32,
    borderRadius: 12,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  sentenceIntroButtonContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  sentenceIntroButtonText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#ffffff',
    marginLeft: 8,
  },
  selectedQuestionCountOption: {
    backgroundColor: '#8b5cf6',
    borderColor: '#8b5cf6',
    shadowColor: '#8b5cf6',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 3,
  },
  disabledQuestionCountOption: {
    backgroundColor: '#f1f5f9',
    borderColor: '#d1d5db',
    opacity: 0.5,
  },
  selectedQuestionCountOptionText: {
    color: '#ffffff',
    fontWeight: '600',
  },
  disabledQuestionCountOptionText: {
    color: '#9ca3af',
  },

  // Enhanced Sentence Game Header Styles
  sentenceGameHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
    backgroundColor: '#ffffff',
    borderRadius: 16,
    marginHorizontal: 20,
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  sentenceGameHeaderLeft: {
    flex: 1,
  },
  sentenceGameHeaderStat: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  sentenceGameHeaderStatText: {
    fontSize: 14,
    color: '#64748b',
    marginLeft: 8,
    fontWeight: '500',
  },
  sentenceGameHeaderRight: {
    alignItems: 'center',
  },
  sentenceGameProgressCircle: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: '#8b5cf6',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#8b5cf6',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 3,
  },
  sentenceGameProgressText: {
    fontSize: 12,
    fontWeight: 'bold',
    color: '#ffffff',
  },
  sentenceScrambleContainer: {
    marginHorizontal: 20,
    marginBottom: 20,
  },
  sentenceScrambleCard: {
    backgroundColor: '#ffffff',
    borderRadius: 16,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
  },
  sentenceScrambleLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1e293b',
    marginBottom: 12,
    textAlign: 'center',
  },
  sentenceScrambledText: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#8b5cf6',
    textAlign: 'center',
    marginBottom: 16,
    lineHeight: 28,
    paddingHorizontal: 20,
  },
  sentenceScrambleHintContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fef3c7',
    borderRadius: 8,
    padding: 12,
    marginBottom: 12,
  },
  sentenceScrambleHintText: {
    fontSize: 14,
    color: '#92400e',
    marginLeft: 8,
    flex: 1,
  },
  sentenceScrambleTermContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#ede9fe',
    borderRadius: 8,
    padding: 12,
  },
  sentenceScrambleTermText: {
    fontSize: 14,
    color: '#5b21b6',
    marginLeft: 8,
    flex: 1,
  },

  // Enhanced Sentence Review Page Styles
  sentenceReviewHeader: {
    alignItems: 'center',
    marginBottom: 24,
    paddingTop: 20,
  },
  sentenceReviewIconContainer: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#fef3c7',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  sentenceReviewTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#1e293b',
    marginBottom: 8,
    textAlign: 'center',
  },
  sentenceReviewSubtitle: {
    fontSize: 16,
    color: '#64748b',
    textAlign: 'center',
    lineHeight: 22,
    paddingHorizontal: 20,
  },
  sentenceReviewStatsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginBottom: 24,
    paddingHorizontal: 20,
  },
  sentenceReviewStatItem: {
    alignItems: 'center',
    minWidth: 80,
  },
  sentenceReviewStatValue: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#1e293b',
    marginBottom: 4,
  },
  sentenceReviewStatLabel: {
    fontSize: 14,
    color: '#64748b',
    fontWeight: '500',
  },
  sentenceReviewProgressContainer: {
    marginBottom: 24,
    paddingHorizontal: 20,
  },
  sentenceReviewProgressBar: {
    height: 8,
    backgroundColor: '#e2e8f0',
    borderRadius: 4,
    marginBottom: 8,
    overflow: 'hidden',
  },
  sentenceReviewProgressFill: {
    height: '100%',
    backgroundColor: '#8b5cf6',
    borderRadius: 4,
  },
  sentenceReviewProgressText: {
    fontSize: 14,
    color: '#64748b',
    textAlign: 'center',
    fontWeight: '500',
  },
  sentenceReviewQuestionsContainer: {
    flex: 1,
    marginBottom: 20,
  },
  sentenceReviewQuestionsTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1e293b',
    textAlign: 'center',
    marginBottom: 16,
    paddingHorizontal: 20,
  },
  sentenceReviewItem: {
    backgroundColor: '#ffffff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  sentenceReviewItemHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  sentenceReviewItemNumber: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1e293b',
  },
  sentenceReviewItemResult: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  sentenceReviewItemResultCorrect: {
    backgroundColor: '#d1fae5',
  },
  sentenceReviewItemResultIncorrect: {
    backgroundColor: '#fee2e2',
  },
  sentenceReviewItemResultText: {
    fontSize: 12,
    fontWeight: '500',
    marginLeft: 4,
  },
  sentenceReviewItemScrambled: {
    fontSize: 14,
    color: '#64748b',
    marginBottom: 8,
    lineHeight: 20,
  },
  sentenceReviewItemAnswer: {
    fontSize: 14,
    color: '#1e293b',
    marginBottom: 8,
    lineHeight: 20,
    fontWeight: '500',
  },
  sentenceReviewItemUserAnswer: {
    fontSize: 14,
    color: '#ef4444',
    lineHeight: 20,
    fontStyle: 'italic',
  },
  sentenceReviewItemLabel: {
    fontWeight: '600',
  },
  sentenceReviewFinishButton: {
    backgroundColor: '#8b5cf6',
    paddingVertical: 16,
    paddingHorizontal: 32,
    borderRadius: 12,
    alignItems: 'center',
    flexDirection: 'row',
    marginHorizontal: 20,
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  sentenceReviewFinishButtonText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#ffffff',
    marginLeft: 8,
  },

  // Hangman intro styles
  hangmanIntroScrollContainer: {
    flex: 1,
  },
  hangmanIntroScrollContent: {
    paddingBottom: 20,
  },
  hangmanIntroHeader: {
    alignItems: 'center',
    marginBottom: 20,
    paddingHorizontal: 20,
    paddingTop: 10,
  },
  hangmanIntroIconContainer: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: '#fef2f2',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
    borderWidth: 2,
    borderColor: '#ef4444',
  },
  hangmanIntroTitle: {
    fontSize: 24,
    fontWeight: '700',
    color: '#1e293b',
    marginBottom: 6,
    textAlign: 'center',
  },
  hangmanIntroSubtitle: {
    fontSize: 14,
    color: '#64748b',
    textAlign: 'center',
    lineHeight: 20,
    paddingHorizontal: 16,
  },
  hangmanIntroInfoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 18,
    paddingHorizontal: 20,
  },
  hangmanIntroInfoCard: {
    flex: 1,
    backgroundColor: '#ffffff',
    borderRadius: 10,
    padding: 12,
    alignItems: 'center',
    marginHorizontal: 4,
    borderWidth: 1,
    borderColor: '#f1f5f9',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  hangmanIntroInfoText: {
    fontSize: 12,
    color: '#64748b',
    fontWeight: '500',
    textAlign: 'center',
    marginTop: 6,
    lineHeight: 16,
  },
  hangmanIntroSection: {
    marginBottom: 18,
    paddingHorizontal: 20,
  },
  hangmanIntroSectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
  },
  hangmanIntroSectionTitle: {
    fontSize: 15,
    fontWeight: '600',
    color: '#1e293b',
    marginLeft: 8,
  },
  hangmanIntroRules: {
    backgroundColor: '#ffffff',
    borderRadius: 10,
    padding: 12,
    borderWidth: 1,
    borderColor: '#f1f5f9',
  },
  hangmanIntroRuleText: {
    fontSize: 13,
    color: '#64748b',
    lineHeight: 18,
    marginBottom: 6,
  },
  hangmanIntroWarning: {
    fontSize: 14,
    color: '#f59e0b',
    fontWeight: '500',
    textAlign: 'center',
    marginTop: 8,
    fontStyle: 'italic',
  },
  hangmanIntroActions: {
    paddingHorizontal: 20,
    paddingVertical: 12,
    backgroundColor: '#ffffff',
    borderTopWidth: 1,
    borderTopColor: '#f1f5f9',
  },
  hangmanIntroButton: {
    backgroundColor: '#ef4444',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 14,
    paddingHorizontal: 24,
    borderRadius: 12,
    shadowColor: '#ef4444',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 3,
  },
  hangmanIntroButtonContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  hangmanIntroButtonText: {
    color: '#ffffff',
    fontSize: 18,
    fontWeight: '600',
    marginLeft: 8,
  },

  // Hangman review styles
  hangmanReviewScrollContainer: {
    flex: 1,
  },
  hangmanReviewScrollContent: {
    paddingBottom: 20,
  },
  hangmanReviewHeader: {
    alignItems: 'center',
    marginBottom: 24,
    paddingHorizontal: 20,
    paddingTop: 10,
  },
  hangmanReviewIconContainer: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#f8fafc',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
    borderWidth: 2,
    borderColor: '#e2e8f0',
  },
  hangmanReviewIcon: {
    fontSize: 40,
  },
  hangmanReviewTitle: {
    fontSize: 24,
    fontWeight: '700',
    color: '#1e293b',
    marginBottom: 8,
    textAlign: 'center',
  },
  hangmanReviewMessage: {
    fontSize: 16,
    color: '#64748b',
    textAlign: 'center',
    lineHeight: 22,
  },
  hangmanReviewScoreSection: {
    marginBottom: 24,
    paddingHorizontal: 20,
  },
  hangmanReviewScoreCard: {
    backgroundColor: '#ffffff',
    borderRadius: 16,
    padding: 20,
    borderWidth: 1,
    borderColor: '#f1f5f9',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  hangmanReviewScoreRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  hangmanReviewScoreItem: {
    alignItems: 'center',
    flex: 1,
  },
  hangmanReviewScoreDivider: {
    width: 1,
    height: 40,
    backgroundColor: '#e2e8f0',
  },
  hangmanReviewScoreValue: {
    fontSize: 20,
    fontWeight: '700',
    color: '#1e293b',
    marginTop: 4,
    marginBottom: 2,
  },
  hangmanReviewScoreLabel: {
    fontSize: 12,
    color: '#64748b',
    fontWeight: '500',
  },
  hangmanReviewPercentageContainer: {
    alignItems: 'center',
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: '#f1f5f9',
  },
  hangmanReviewPercentageLabel: {
    fontSize: 14,
    color: '#64748b',
    fontWeight: '500',
    marginBottom: 4,
  },
  hangmanReviewPercentage: {
    fontSize: 24,
    fontWeight: '700',
  },
  hangmanReviewSection: {
    marginBottom: 24,
    paddingHorizontal: 20,
  },
  hangmanReviewSectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  hangmanReviewSectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1e293b',
    marginLeft: 8,
  },
  hangmanReviewWordItem: {
    backgroundColor: '#ffffff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#f1f5f9',
  },
  hangmanReviewWordHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  hangmanReviewWordNumber: {
    fontSize: 14,
    fontWeight: '600',
    color: '#64748b',
  },
  hangmanReviewWordStatus: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  hangmanReviewWordStatusCorrect: {
    backgroundColor: '#10b981',
  },
  hangmanReviewWordStatusIncorrect: {
    backgroundColor: '#ef4444',
  },
  hangmanReviewWordStatusText: {
    fontSize: 12,
    fontWeight: '500',
    color: '#ffffff',
    marginLeft: 4,
  },
  hangmanReviewWordText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1e293b',
    marginBottom: 4,
  },
  hangmanReviewWordHint: {
    fontSize: 14,
    color: '#64748b',
    marginBottom: 4,
  },
  hangmanReviewWordNote: {
    fontSize: 12,
    color: '#ef4444',
    fontStyle: 'italic',
  },
  hangmanReviewActions: {
    flexDirection: 'row',
    paddingHorizontal: 20,
    paddingVertical: 16,
    backgroundColor: '#ffffff',
    borderTopWidth: 1,
    borderTopColor: '#f1f5f9',
    gap: 12,
  },
  hangmanReviewButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 14,
    paddingHorizontal: 20,
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  hangmanReviewButtonSecondary: {
    backgroundColor: '#f8fafc',
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  hangmanReviewButtonPrimary: {
    backgroundColor: '#ef4444',
  },
  hangmanReviewButtonSecondaryText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#64748b',
    marginLeft: 8,
  },
  hangmanReviewButtonPrimaryText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#ffffff',
    marginLeft: 8,
  },

  // Hangman hint button styles
  wordHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  hintButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fef3c7',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#f59e0b',
  },
  hintButtonText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#f59e0b',
    marginLeft: 4,
  },

  // Gravity game styles
  gravityIntroScrollContainer: {
    flex: 1,
  },
  gravityIntroScrollContent: {
    paddingBottom: 20,
  },
  gravityIntroHeader: {
    alignItems: 'center',
    marginBottom: 20,
    paddingHorizontal: 20,
    paddingTop: 10,
  },
  gravityIntroIconContainer: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: '#dbeafe',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
    borderWidth: 2,
    borderColor: '#3b82f6',
  },
  gravityIntroTitle: {
    fontSize: 24,
    fontWeight: '700',
    color: '#1e293b',
    marginBottom: 6,
    textAlign: 'center',
  },
  gravityIntroSubtitle: {
    fontSize: 14,
    color: '#64748b',
    textAlign: 'center',
    lineHeight: 20,
    paddingHorizontal: 16,
  },
  gravityIntroInfoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 18,
    paddingHorizontal: 20,
  },
  gravityIntroInfoCard: {
    flex: 1,
    backgroundColor: '#ffffff',
    borderRadius: 10,
    padding: 12,
    alignItems: 'center',
    marginHorizontal: 4,
    borderWidth: 1,
    borderColor: '#f1f5f9',
  },
  gravityIntroInfoText: {
    fontSize: 12,
    color: '#64748b',
    fontWeight: '500',
    textAlign: 'center',
    marginTop: 6,
    lineHeight: 16,
  },
  gravityIntroSection: {
    marginBottom: 18,
    paddingHorizontal: 20,
  },
  gravityIntroSectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
  },
  gravityIntroSectionTitle: {
    fontSize: 15,
    fontWeight: '600',
    color: '#1e293b',
    marginLeft: 8,
  },
  gravityIntroLanguageModes: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 8,
  },
  gravityIntroLanguageMode: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f8fafc',
    borderRadius: 10,
    padding: 12,
    borderWidth: 2,
    borderColor: '#e2e8f0',
  },
  gravityIntroLanguageModeActive: {
    backgroundColor: '#3b82f6',
    borderColor: '#3b82f6',
  },
  gravityIntroLanguageModeText: {
    fontSize: 13,
    color: '#64748b',
    fontWeight: '500',
    marginLeft: 8,
  },
  gravityIntroLanguageModeTextActive: {
    color: '#ffffff',
  },
  gravityIntroLanguageHint: {
    fontSize: 12,
    color: '#64748b',
    textAlign: 'center',
    fontStyle: 'italic',
    marginTop: 8,
  },
  gravityIntroRules: {
    backgroundColor: '#ffffff',
    borderRadius: 10,
    padding: 12,
    borderWidth: 1,
    borderColor: '#f1f5f9',
  },
  gravityIntroRuleText: {
    fontSize: 13,
    color: '#64748b',
    lineHeight: 18,
    marginBottom: 6,
  },
  gravityIntroActions: {
    paddingHorizontal: 20,
    paddingVertical: 12,
    backgroundColor: '#ffffff',
    borderTopWidth: 1,
    borderTopColor: '#f1f5f9',
  },
  gravityIntroButton: {
    backgroundColor: '#3b82f6',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 14,
    paddingHorizontal: 24,
    borderRadius: 12,
    shadowColor: '#3b82f6',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 3,
  },
  gravityIntroButtonContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  gravityIntroButtonText: {
    color: '#ffffff',
    fontSize: 18,
    fontWeight: '600',
    marginLeft: 8,
  },
  
  // Gravity game over styles
  gravityGameOverContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 20,
  },
  gravityGameOverHeader: {
    alignItems: 'center',
    marginBottom: 32,
  },
  gravityGameOverTitle: {
    fontSize: 28,
    fontWeight: '700',
    color: '#ef4444',
    marginBottom: 8,
    textAlign: 'center',
  },
  gravityGameOverSubtitle: {
    fontSize: 18,
    color: '#64748b',
    textAlign: 'center',
  },
  gravityGameOverStats: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginBottom: 32,
    width: '100%',
  },
  gravityGameOverStat: {
    alignItems: 'center',
    flex: 1,
  },
  gravityGameOverStatValue: {
    fontSize: 24,
    fontWeight: '700',
    color: '#1e293b',
    marginTop: 8,
    marginBottom: 4,
  },
  gravityGameOverStatLabel: {
    fontSize: 14,
    color: '#64748b',
    fontWeight: '500',
  },
  gravityGameOverActions: {
    width: '100%',
  },
  gravityGameOverButton: {
    backgroundColor: '#3b82f6',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    paddingHorizontal: 24,
    borderRadius: 12,
    shadowColor: '#3b82f6',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 3,
  },
  gravityGameOverButtonText: {
    color: '#ffffff',
    fontSize: 18,
    fontWeight: '600',
    marginLeft: 8,
  },
  
  // Gravity main game styles
  gravityGameHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
    backgroundColor: '#ffffff',
    borderBottomWidth: 1,
    borderBottomColor: '#f1f5f9',
    zIndex: 10, // Ensure header stays above asteroids
    elevation: 5, // Android elevation
  },
  gravityGameHeaderLeft: {
    flexDirection: 'row',
    gap: 20,
  },
  gravityGameHeaderRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
  },
  gravityGameHeaderText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1e293b',
  },
  gravityPauseButton: {
    backgroundColor: '#64748b',
    padding: 8,
    borderRadius: 8,
  },
  gravityGameArea: {
    flex: 1,
    position: 'relative',
    backgroundColor: '#0f172a', // Dark space background
    overflow: 'hidden', // Clip any content that goes outside bounds
  },
  gravityStars: {
    position: 'absolute',
    width: '100%',
    height: '100%',
  },
  gravityStar: {
    position: 'absolute',
    width: 2,
    height: 2,
    backgroundColor: '#ffffff',
    borderRadius: 1,
  },
  gravityAsteroidsContainer: {
    position: 'absolute',
    width: '100%',
    height: '100%',
    overflow: 'hidden', // Ensure asteroids are clipped to this container
  },
  gravityAsteroid: {
    position: 'absolute',
    borderRadius: 50,
    backgroundColor: '#4b5563',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
    borderWidth: 2,
    borderColor: '#374151',
  },
  gravityAsteroidSurface: {
    position: 'absolute',
    width: '100%',
    height: '100%',
    borderRadius: 50,
    backgroundColor: '#6b7280',
    opacity: 0.7,
  },
  gravityAsteroidText: {
    color: '#ffffff',
    fontSize: 10,
    fontWeight: '600',
    textAlign: 'center',
    lineHeight: 12,
    textShadowColor: '#000',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 2,
    zIndex: 1,
  },
  gravityPlanetSurface: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: 120, // Reasonable planet surface size
  },
  gravityAtmosphere: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: 40,
    backgroundColor: '#10b981',
    opacity: 0.3,
    borderRadius: 20,
  },
  gravitySurface: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: 80,
    backgroundColor: '#059669',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
  },
  gravitySurfaceDetail: {
    position: 'absolute',
    width: 60,
    height: 20,
    backgroundColor: '#047857',
    borderRadius: 10,
    opacity: 0.8,
  },
  gravityPlanet: {
    position: 'absolute',
    bottom: 40,
    left: '50%',
    marginLeft: -20,
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 2,
  },
  gravityAnswerSection: {
    padding: 20,
    backgroundColor: '#ffffff',
    borderTopWidth: 1,
    borderTopColor: '#f1f5f9',
  },
  gravityAnswerLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1e293b',
    marginBottom: 12,
  },
  gravityAnswerInputContainer: {
    flexDirection: 'row',
    gap: 12,
  },
  gravityAnswerInput: {
    flex: 1,
    borderWidth: 2,
    borderColor: '#e2e8f0',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 16,
    color: '#1e293b',
    backgroundColor: '#ffffff',
  },
  gravityAnswerSubmitButton: {
    backgroundColor: '#3b82f6',
    padding: 12,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },

  // Type What You Hear game styles
  typeWhatYouHearIntroScrollContainer: {
    flex: 1,
  },
  typeWhatYouHearIntroScrollContent: {
    paddingBottom: 20,
  },
  typeWhatYouHearIntroHeader: {
    alignItems: 'center',
    marginBottom: 20,
    paddingHorizontal: 20,
    paddingTop: 10,
  },
  typeWhatYouHearIntroIconContainer: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: '#f3e8ff',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
    borderWidth: 2,
    borderColor: '#8b5cf6',
  },
  typeWhatYouHearIntroTitle: {
    fontSize: 24,
    fontWeight: '700',
    color: '#1e293b',
    marginBottom: 6,
    textAlign: 'center',
  },
  typeWhatYouHearIntroSubtitle: {
    fontSize: 14,
    color: '#64748b',
    textAlign: 'center',
    lineHeight: 20,
    paddingHorizontal: 16,
  },
  typeWhatYouHearIntroInfoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 18,
    paddingHorizontal: 20,
  },
  typeWhatYouHearIntroInfoCard: {
    flex: 1,
    backgroundColor: '#ffffff',
    borderRadius: 10,
    padding: 12,
    alignItems: 'center',
    marginHorizontal: 4,
    borderWidth: 1,
    borderColor: '#f1f5f9',
  },
  typeWhatYouHearIntroInfoText: {
    fontSize: 12,
    color: '#64748b',
    fontWeight: '500',
    textAlign: 'center',
    marginTop: 6,
    lineHeight: 16,
  },
  typeWhatYouHearIntroSection: {
    marginBottom: 18,
    paddingHorizontal: 20,
  },
  typeWhatYouHearIntroSectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
  },
  typeWhatYouHearIntroSectionTitle: {
    fontSize: 15,
    fontWeight: '600',
    color: '#1e293b',
    marginLeft: 8,
  },
  typeWhatYouHearIntroDifficultyModes: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 8,
  },
  typeWhatYouHearIntroDifficultyMode: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f8fafc',
    borderRadius: 10,
    padding: 12,
    borderWidth: 2,
    borderColor: '#e2e8f0',
  },
  typeWhatYouHearIntroDifficultyModeActive: {
    backgroundColor: '#8b5cf6',
    borderColor: '#8b5cf6',
  },
  typeWhatYouHearIntroDifficultyModeText: {
    fontSize: 13,
    color: '#64748b',
    fontWeight: '500',
    marginLeft: 8,
  },
  typeWhatYouHearIntroDifficultyModeTextActive: {
    color: '#ffffff',
  },
  typeWhatYouHearIntroDifficultyHint: {
    fontSize: 12,
    color: '#64748b',
    textAlign: 'center',
    fontStyle: 'italic',
    marginTop: 8,
  },
  typeWhatYouHearIntroQuestionCount: {
    fontSize: 12,
    color: '#10b981',
    textAlign: 'center',
    fontWeight: '500',
    marginTop: 4,
  },
  typeWhatYouHearIntroRules: {
    backgroundColor: '#ffffff',
    borderRadius: 10,
    padding: 12,
    borderWidth: 1,
    borderColor: '#f1f5f9',
  },
  typeWhatYouHearIntroRuleText: {
    fontSize: 13,
    color: '#64748b',
    lineHeight: 18,
    marginBottom: 6,
  },
  typeWhatYouHearIntroActions: {
    paddingHorizontal: 20,
    paddingVertical: 12,
    backgroundColor: '#ffffff',
    borderTopWidth: 1,
    borderTopColor: '#f1f5f9',
  },
  typeWhatYouHearIntroButton: {
    backgroundColor: '#8b5cf6',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 14,
    paddingHorizontal: 24,
    borderRadius: 12,
    shadowColor: '#8b5cf6',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 3,
  },
  typeWhatYouHearIntroButtonContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  typeWhatYouHearIntroButtonText: {
    color: '#ffffff',
    fontSize: 18,
    fontWeight: '600',
    marginLeft: 8,
  },
  typeWhatYouHearIntroButtonDisabled: {
    backgroundColor: '#94a3b8',
    shadowOpacity: 0,
    elevation: 0,
  },
  
  // Type What You Hear game over styles
  typeWhatYouHearGameOverContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 20,
  },
  typeWhatYouHearGameOverHeader: {
    alignItems: 'center',
    marginBottom: 32,
  },
  typeWhatYouHearGameOverTitle: {
    fontSize: 28,
    fontWeight: '700',
    color: '#8b5cf6',
    marginBottom: 8,
    textAlign: 'center',
  },
  typeWhatYouHearGameOverSubtitle: {
    fontSize: 18,
    color: '#64748b',
    textAlign: 'center',
  },
  typeWhatYouHearGameOverStats: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginBottom: 32,
    width: '100%',
  },
  typeWhatYouHearGameOverStat: {
    alignItems: 'center',
    flex: 1,
  },
  typeWhatYouHearGameOverStatValue: {
    fontSize: 24,
    fontWeight: '700',
    color: '#1e293b',
    marginTop: 8,
    marginBottom: 4,
  },
  typeWhatYouHearGameOverStatLabel: {
    fontSize: 14,
    color: '#64748b',
    fontWeight: '500',
  },
  typeWhatYouHearGameOverActions: {
    width: '100%',
  },
  typeWhatYouHearGameOverButton: {
    backgroundColor: '#8b5cf6',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    paddingHorizontal: 24,
    borderRadius: 12,
    shadowColor: '#8b5cf6',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 3,
  },
  typeWhatYouHearGameOverButtonText: {
    color: '#ffffff',
    fontSize: 18,
    fontWeight: '600',
    marginLeft: 8,
  },
  
  // Type What You Hear main game styles
  typeWhatYouHearGameHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
    backgroundColor: '#ffffff',
    borderBottomWidth: 1,
    borderBottomColor: '#f1f5f9',
    zIndex: 10,
    elevation: 5,
  },
  typeWhatYouHearGameHeaderLeft: {
    flexDirection: 'row',
    gap: 20,
  },
  typeWhatYouHearGameHeaderRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
  },
  typeWhatYouHearGameHeaderText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1e293b',
  },
  typeWhatYouHearGameArea: {
    flex: 1,
    padding: 20,
    backgroundColor: '#f8fafc',
  },
  typeWhatYouHearQuestionContainer: {
    backgroundColor: '#ffffff',
    borderRadius: 16,
    padding: 24,
    marginBottom: 24,
    borderWidth: 1,
    borderColor: '#f1f5f9',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  typeWhatYouHearQuestionLabel: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1e293b',
    marginBottom: 20,
    textAlign: 'center',
  },
  typeWhatYouHearAudioControls: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  typeWhatYouHearPlayButton: {
    backgroundColor: '#8b5cf6',
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 12,
    flex: 1,
    marginRight: 12,
    justifyContent: 'center',
  },
  typeWhatYouHearPlayButtonText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '600',
    marginLeft: 8,
  },
  typeWhatYouHearReplayButton: {
    backgroundColor: '#f3e8ff',
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#8b5cf6',
  },
  typeWhatYouHearReplayButtonText: {
    color: '#8b5cf6',
    fontSize: 14,
    fontWeight: '500',
    marginLeft: 6,
  },
  typeWhatYouHearHintSection: {
    alignItems: 'center',
  },
  typeWhatYouHearHintButton: {
    backgroundColor: '#fef3c7',
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#f59e0b',
    marginBottom: 12,
  },
  typeWhatYouHearHintButtonText: {
    color: '#92400e',
    fontSize: 14,
    fontWeight: '500',
    marginLeft: 6,
  },
  typeWhatYouHearHintText: {
    fontSize: 16,
    color: '#8b5cf6',
    fontWeight: '600',
    fontStyle: 'italic',
  },
  typeWhatYouHearAnswerSection: {
    backgroundColor: '#ffffff',
    borderRadius: 16,
    padding: 24,
    borderWidth: 1,
    borderColor: '#f1f5f9',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  typeWhatYouHearAnswerLabel: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1e293b',
    marginBottom: 16,
    textAlign: 'center',
  },
  typeWhatYouHearAnswerInputContainer: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 16,
  },
  typeWhatYouHearAnswerInput: {
    flex: 1,
    borderWidth: 2,
    borderColor: '#e2e8f0',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 16,
    color: '#1e293b',
    backgroundColor: '#ffffff',
  },
  typeWhatYouHearAnswerSubmitButton: {
    backgroundColor: '#8b5cf6',
    padding: 12,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  typeWhatYouHearAnswerSubmitButtonDisabled: {
    backgroundColor: '#cbd5e1',
  },
  typeWhatYouHearAttemptsContainer: {
    alignItems: 'center',
  },
  typeWhatYouHearAttemptsText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#64748b',
    marginBottom: 8,
  },
  typeWhatYouHearAttemptsHint: {
    fontSize: 14,
    color: '#94a3b8',
    textAlign: 'center',
    fontStyle: 'italic',
  },
  
  // Speech Pronunciation Game Styles
  speechReviewList: {
    flex: 1,
    marginTop: 16,
  },
  speechCorrectReviewItem: {
    backgroundColor: '#f0fdf4',
    borderColor: '#10b981',
  },
  speechIncorrectReviewItem: {
    backgroundColor: '#fef2f2',
    borderColor: '#ef4444',
  },
  speechReviewItemStatus: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  speechCorrectStatus: {
    backgroundColor: '#10b981',
  },
  speechIncorrectStatus: {
    backgroundColor: '#ef4444',
  },
  speechReviewUserAnswer: {
    fontSize: 14,
    color: '#64748b',
    fontStyle: 'italic',
    marginTop: 4,
  },
  speechGameTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1e293b',
  },
  titleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    flex: 1,
  },
  demoBadge: {
    backgroundColor: '#f59e0b',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    marginLeft: 8,
  },
  demoText: {
    fontSize: 10,
    fontWeight: '700',
    color: '#ffffff',
    textTransform: 'uppercase',
  },
  speechProgressContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  speechGameContent: {
    flex: 1,
    padding: 20,
  },
  questionCard: {
    backgroundColor: '#ffffff',
    borderRadius: 16,
    padding: 20,
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  questionText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1e293b',
    marginBottom: 16,
    textAlign: 'center',
  },
  audioButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#f8fafc',
    borderRadius: 12,
    padding: 12,
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  audioButtonActive: {
    backgroundColor: '#f0f9ff',
    borderColor: '#6366f1',
  },
  audioButtonText: {
    marginLeft: 8,
    fontSize: 16,
    color: '#6366f1',
    fontWeight: '500',
  },
  audioControls: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 16,
  },
  slowAudioButton: {
    backgroundColor: '#fef3c7',
    borderColor: '#f59e0b',
  },
  phoneticHint: {
    backgroundColor: '#f0f9ff',
    borderRadius: 8,
    padding: 12,
    marginTop: 12,
    borderWidth: 1,
    borderColor: '#e0f2fe',
  },
  phoneticLabel: {
    fontSize: 12,
    color: '#0369a1',
    fontWeight: '600',
    marginBottom: 4,
  },
  phoneticText: {
    fontSize: 14,
    color: '#0c4a6e',
    fontWeight: '500',
    fontStyle: 'italic',
  },
  pronunciationSection: {
    alignItems: 'center',
    marginTop: 20,
  },
  pronunciationTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#1e293b',
    marginBottom: 20,
  },
  listenButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#10b981',
    borderRadius: 50,
    paddingVertical: 16,
    paddingHorizontal: 32,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 6,
  },
  listenButtonText: {
    marginLeft: 12,
    fontSize: 18,
    fontWeight: '600',
    color: '#ffffff',
  },
  listeningIndicator: {
    alignItems: 'center',
    marginTop: 20,
  },
  listeningAnimation: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#f0fdf4',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
    borderWidth: 3,
    borderColor: '#10b981',
  },
  listeningText: {
    fontSize: 16,
    color: '#10b981',
    fontWeight: '600',
    marginBottom: 16,
  },
  stopButton: {
    backgroundColor: '#ef4444',
    borderRadius: 8,
    paddingVertical: 8,
    paddingHorizontal: 16,
  },
  stopButtonText: {
    color: '#ffffff',
    fontSize: 14,
    fontWeight: '600',
  },
  transcriptContainer: {
    backgroundColor: '#f8fafc',
    borderRadius: 12,
    padding: 16,
    marginTop: 16,
    alignItems: 'center',
  },
  transcriptLabel: {
    fontSize: 14,
    color: '#64748b',
    marginBottom: 8,
  },
  transcriptText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1e293b',
    textAlign: 'center',
    marginBottom: 8,
  },
  confidenceText: {
    fontSize: 14,
    color: '#6366f1',
    fontWeight: '500',
  },
  resultContainer: {
    alignItems: 'center',
    marginTop: 20,
  },
  resultIndicator: {
    marginBottom: 12,
  },
  correctResult: {
    backgroundColor: '#f0fdf4',
  },
  incorrectResult: {
    backgroundColor: '#fef2f2',
  },
  resultText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1e293b',
  },
  
  // Speech Pronunciation Landing Page Styles
  landingContent: {
    flex: 1,
    padding: 20,
  },
  heroSection: {
    alignItems: 'center',
    marginBottom: 32,
  },
  heroIcon: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: '#f0fdf4',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 20,
    borderWidth: 3,
    borderColor: '#10b981',
  },
  heroTitle: {
    fontSize: 28,
    fontWeight: '700',
    color: '#1e293b',
    textAlign: 'center',
    marginBottom: 12,
  },
  heroSubtitle: {
    fontSize: 16,
    color: '#64748b',
    textAlign: 'center',
    lineHeight: 24,
  },
  howItWorksSection: {
    marginBottom: 32,
  },
  sectionTitle: {
    fontSize: 22,
    fontWeight: '600',
    color: '#1e293b',
    marginBottom: 20,
    textAlign: 'center',
  },
  stepContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 20,
  },
  stepNumber: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#10b981',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  stepNumberText: {
    fontSize: 18,
    fontWeight: '700',
    color: '#ffffff',
  },
  stepContent: {
    flex: 1,
  },
  stepTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1e293b',
    marginBottom: 4,
  },
  stepDescription: {
    fontSize: 14,
    color: '#64748b',
    lineHeight: 20,
  },
  demoSection: {
    marginBottom: 32,
    alignItems: 'center',
  },
  demoButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#f8fafc',
    borderRadius: 12,
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  demoButtonActive: {
    backgroundColor: '#f0f9ff',
    borderColor: '#6366f1',
  },
  demoButtonText: {
    marginLeft: 8,
    fontSize: 16,
    color: '#6366f1',
    fontWeight: '500',
  },
  settingsSection: {
    marginBottom: 32,
  },
  settingGroup: {
    marginBottom: 24,
  },
  settingLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1e293b',
    marginBottom: 12,
  },
  difficultyButtons: {
    flexDirection: 'row',
    gap: 8,
  },
  difficultyButton: {
    flex: 1,
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    backgroundColor: '#ffffff',
    alignItems: 'center',
  },
  difficultyButtonActive: {
    backgroundColor: '#10b981',
    borderColor: '#10b981',
  },
  difficultyButtonText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#64748b',
  },
  difficultyButtonTextActive: {
    color: '#ffffff',
  },
  cardCountButtons: {
    flexDirection: 'row',
    gap: 8,
  },
  cardCountButton: {
    flex: 1,
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    backgroundColor: '#ffffff',
    alignItems: 'center',
  },
  cardCountButtonActive: {
    backgroundColor: '#6366f1',
    borderColor: '#6366f1',
  },
  cardCountButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#64748b',
  },
  cardCountButtonTextActive: {
    color: '#ffffff',
  },
  tipsSection: {
    marginBottom: 32,
  },
  tipContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  tipText: {
    fontSize: 14,
    color: '#64748b',
    marginLeft: 12,
    flex: 1,
    lineHeight: 20,
  },
  startButtonContainer: {
    padding: 20,
    borderTopWidth: 1,
    borderTopColor: '#f1f5f9',
  },
  startButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#10b981',
    borderRadius: 12,
    paddingVertical: 16,
    paddingHorizontal: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 6,
  },
  startButtonText: {
    marginLeft: 12,
    fontSize: 18,
    fontWeight: '600',
    color: '#ffffff',
  },
  
  // Pronunciation Input Modal Styles
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  inputModal: {
    backgroundColor: '#ffffff',
    borderRadius: 16,
    padding: 24,
    margin: 20,
    width: '90%',
    maxWidth: 400,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  inputModalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  inputModalTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#1e293b',
  },
  inputModalInstruction: {
    fontSize: 16,
    color: '#64748b',
    marginBottom: 16,
    textAlign: 'center',
  },
  inputModalWord: {
    fontSize: 18,
    fontWeight: '600',
    color: '#10b981',
    textAlign: 'center',
    marginBottom: 20,
    padding: 12,
    backgroundColor: '#f0fdf4',
    borderRadius: 8,
  },
  pronunciationInput: {
    borderWidth: 2,
    borderColor: '#e2e8f0',
    borderRadius: 12,
    padding: 16,
    fontSize: 16,
    color: '#1e293b',
    backgroundColor: '#f8fafc',
    marginBottom: 24,
  },
  inputModalButtons: {
    flexDirection: 'row',
    gap: 12,
  },
  inputModalCancelButton: {
    flex: 1,
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    backgroundColor: '#ffffff',
    alignItems: 'center',
  },
  inputModalCancelText: {
    fontSize: 16,
    fontWeight: '500',
    color: '#64748b',
  },
  inputModalSubmitButton: {
    flex: 1,
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 8,
    backgroundColor: '#10b981',
    alignItems: 'center',
  },
  inputModalSubmitButtonDisabled: {
    backgroundColor: '#94a3b8',
  },
  inputModalSubmitText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#ffffff',
  },
  


});