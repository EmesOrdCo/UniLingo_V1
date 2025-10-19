import React, { useState, useEffect, useRef, useCallback } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Dimensions, Animated, ScrollView } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { useTranslation } from '../../lib/i18n';

interface SudokuGameProps {
  gameData?: any;
  onClose: () => void;
  onGameComplete: (score: number) => void;
  onRestart?: () => Promise<boolean>;
}

const { width, height } = Dimensions.get('window');

// Game constants
const GRID_SIZE = 9;
const BOX_SIZE = 3;
const CELL_SIZE = Math.min((width - 80) / GRID_SIZE, 40);

type Cell = {
  value: number;
  isFixed: boolean;
  notes: number[];
};

const SudokuGame: React.FC<SudokuGameProps> = ({ onClose, onGameComplete, onRestart }) => {
  const { t } = useTranslation();
  
  // Game state
  const [grid, setGrid] = useState<Cell[][]>([]);
  const [selectedCell, setSelectedCell] = useState<{ row: number; col: number } | null>(null);
  const [notesMode, setNotesMode] = useState(false);
  const [mistakes, setMistakes] = useState(0);
  const [score, setScore] = useState(0);
  const [gameWon, setGameWon] = useState(false);
  const [gameOver, setGameOver] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [gameStarted, setGameStarted] = useState(false);
  const [difficulty, setDifficulty] = useState<'easy' | 'medium' | 'hard' | 'expert'>('easy');
  const [showDifficultySelect, setShowDifficultySelect] = useState(true);
  const [seconds, setSeconds] = useState(0);

  // Refs
  const finalScoreRef = useRef<number>(0);
  const completionCalledRef = useRef<boolean>(false);
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  // Animated values
  const bgFloat1 = useRef(new Animated.Value(0)).current;
  const bgFloat2 = useRef(new Animated.Value(0)).current;

  // Generate a valid Sudoku solution
  const generateSolution = useCallback(() => {
    const grid: number[][] = Array(GRID_SIZE).fill(0).map(() => Array(GRID_SIZE).fill(0));

    const isValid = (row: number, col: number, num: number): boolean => {
      // Check row
      for (let x = 0; x < GRID_SIZE; x++) {
        if (grid[row][x] === num) return false;
      }

      // Check column
      for (let x = 0; x < GRID_SIZE; x++) {
        if (grid[x][col] === num) return false;
      }

      // Check 3x3 box
      const startRow = row - (row % BOX_SIZE);
      const startCol = col - (col % BOX_SIZE);
      for (let i = 0; i < BOX_SIZE; i++) {
        for (let j = 0; j < BOX_SIZE; j++) {
          if (grid[i + startRow][j + startCol] === num) return false;
        }
      }

      return true;
    };

    const fillGrid = (): boolean => {
      for (let row = 0; row < GRID_SIZE; row++) {
        for (let col = 0; col < GRID_SIZE; col++) {
          if (grid[row][col] === 0) {
            const numbers = [1, 2, 3, 4, 5, 6, 7, 8, 9].sort(() => Math.random() - 0.5);
            for (const num of numbers) {
              if (isValid(row, col, num)) {
                grid[row][col] = num;
                if (fillGrid()) return true;
                grid[row][col] = 0;
              }
            }
            return false;
          }
        }
      }
      return true;
    };

    fillGrid();
    return grid;
  }, []);

  // Create puzzle from solution
  const createPuzzle = useCallback((solution: number[][], difficulty: 'easy' | 'medium' | 'hard' | 'expert') => {
    const puzzle: Cell[][] = solution.map(row => 
      row.map(value => ({ value, isFixed: false, notes: [] }))
    );

    // Remove numbers based on difficulty
    const cellsToRemove = 
      difficulty === 'easy' ? 30 : 
      difficulty === 'medium' ? 40 : 
      difficulty === 'hard' ? 50 : 
      60; // expert
    let removed = 0;

    while (removed < cellsToRemove) {
      const row = Math.floor(Math.random() * GRID_SIZE);
      const col = Math.floor(Math.random() * GRID_SIZE);
      if (puzzle[row][col].value !== 0) {
        puzzle[row][col].value = 0;
        removed++;
      }
    }

    // Mark remaining numbers as fixed
    puzzle.forEach(row => {
      row.forEach(cell => {
        if (cell.value !== 0) {
          cell.isFixed = true;
        }
      });
    });

    return puzzle;
  }, []);

  // Initialize game
  const initializeGame = useCallback((selectedDifficulty: 'easy' | 'medium' | 'hard' | 'expert') => {
    const solution = generateSolution();
    const puzzle = createPuzzle(solution, selectedDifficulty);
    setGrid(puzzle);
    setSelectedCell(null);
    setNotesMode(false);
    setMistakes(0);
    setScore(0);
    setGameWon(false);
    setGameOver(false);
    setGameStarted(false);
    setSeconds(0);
  }, [generateSolution, createPuzzle]);

  // Start game with selected difficulty
  const startGameWithDifficulty = (selectedDifficulty: 'easy' | 'medium' | 'hard' | 'expert') => {
    setDifficulty(selectedDifficulty);
    setShowDifficultySelect(false);
    initializeGame(selectedDifficulty);
    // Set gameStarted after a brief delay to ensure grid is initialized
    setTimeout(() => setGameStarted(true), 100);
  };

  // Don't auto-initialize - wait for difficulty selection
  // useEffect(() => {
  //   initializeGame('easy');
  // }, []);

  // Timer
  useEffect(() => {
    if (gameStarted && !isPaused && !gameOver && !gameWon) {
      timerRef.current = setInterval(() => {
        setSeconds(s => s + 1);
      }, 1000);
    } else {
      if (timerRef.current) {
        clearInterval(timerRef.current);
        timerRef.current = null;
      }
    }

    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
    };
  }, [gameStarted, isPaused, gameOver, gameWon]);

  // Check if number is valid in position
  const isValidMove = useCallback((row: number, col: number, num: number): boolean => {
    // Check row
    for (let x = 0; x < GRID_SIZE; x++) {
      if (x !== col && grid[row][x].value === num) return false;
    }

    // Check column
    for (let x = 0; x < GRID_SIZE; x++) {
      if (x !== row && grid[x][col].value === num) return false;
    }

    // Check 3x3 box
    const startRow = row - (row % BOX_SIZE);
    const startCol = col - (col % BOX_SIZE);
    for (let i = 0; i < BOX_SIZE; i++) {
      for (let j = 0; j < BOX_SIZE; j++) {
        const r = i + startRow;
        const c = j + startCol;
        if ((r !== row || c !== col) && grid[r][c].value === num) return false;
      }
    }

    return true;
  }, [grid]);

  // Check if puzzle is complete
  const checkWin = useCallback((currentGrid: Cell[][]) => {
    for (let row = 0; row < GRID_SIZE; row++) {
      for (let col = 0; col < GRID_SIZE; col++) {
        if (currentGrid[row][col].value === 0) return false;
      }
    }
    return true;
  }, []);

  // Place number in cell
  const placeNumber = useCallback((num: number) => {
    if (!selectedCell || !gameStarted) return;
    
    const { row, col } = selectedCell;
    if (grid[row][col].isFixed) return;

    const newGrid = grid.map(r => r.map(c => ({ ...c, notes: [...c.notes] })));

    if (notesMode) {
      // Toggle note
      const noteIndex = newGrid[row][col].notes.indexOf(num);
      if (noteIndex > -1) {
        newGrid[row][col].notes.splice(noteIndex, 1);
      } else {
        newGrid[row][col].notes.push(num);
        newGrid[row][col].notes.sort();
      }
    } else {
      // Place number
      if (newGrid[row][col].value === num) {
        newGrid[row][col].value = 0;
      } else {
        newGrid[row][col].value = num;
        newGrid[row][col].notes = [];

        // Check if valid
        if (!isValidMove(row, col, num)) {
          // Haptic feedback for invalid move
          Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
          setMistakes(prev => {
            const newMistakes = prev + 1;
            if (newMistakes >= 3) {
              setGameOver(true);
            }
            return newMistakes;
          });
        } else {
          // Haptic feedback for valid move
          Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
          setScore(prev => prev + 10);
        }
      }
    }

    setGrid(newGrid);

    // Clear selection after placing a number (not in notes mode)
    if (!notesMode) {
      setSelectedCell(null);
    }

    // Check win
    if (checkWin(newGrid)) {
      // Haptic feedback for winning
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      const timeBonus = Math.max(0, 1000 - seconds * 2);
      const finalScore = score + timeBonus;
      setScore(finalScore);
      setGameWon(true);
    }
  }, [selectedCell, gameStarted, grid, notesMode, isValidMove, checkWin, score, seconds]);

  // Clear cell
  const clearCell = useCallback(() => {
    if (!selectedCell || !gameStarted) return;
    
    const { row, col } = selectedCell;
    if (grid[row][col].isFixed) return;

    const newGrid = grid.map(r => r.map(c => ({ ...c, notes: [...c.notes] })));
    newGrid[row][col].value = 0;
    newGrid[row][col].notes = [];
    setGrid(newGrid);
  }, [selectedCell, gameStarted, grid]);

  // Hint
  const getHint = useCallback(() => {
    if (!gameStarted || gameOver || gameWon) return;
    
    // Find all empty cells
    const emptyCells: { row: number; col: number }[] = [];
    for (let row = 0; row < GRID_SIZE; row++) {
      for (let col = 0; col < GRID_SIZE; col++) {
        if (grid[row][col].value === 0 && !grid[row][col].isFixed) {
          emptyCells.push({ row, col });
        }
      }
    }
    
    if (emptyCells.length === 0) return;
    
    // Pick a random empty cell
    const randomCell = emptyCells[Math.floor(Math.random() * emptyCells.length)];
    const { row, col } = randomCell;
    
    // Find the correct number for this cell
    for (let num = 1; num <= 9; num++) {
      if (isValidMove(row, col, num)) {
        const newGrid = grid.map(r => r.map(c => ({ ...c, notes: [...c.notes] })));
        newGrid[row][col].value = num;
        newGrid[row][col].notes = [];
        setGrid(newGrid);
        // Don't highlight the cell - just fill it
        setScore(prev => Math.max(0, prev - 20)); // Penalty for hint
        return;
      }
    }
  }, [gameStarted, gameOver, gameWon, grid, isValidMove]);

  // Handle game over
  useEffect(() => {
    if ((gameOver || gameWon) && !completionCalledRef.current) {
      finalScoreRef.current = score;
      completionCalledRef.current = true;
      console.log('🔢 Sudoku calling onGameComplete with score:', score);
      setTimeout(() => {
        onGameComplete(score);
      }, 100);
    }
  }, [gameOver, gameWon, score, onGameComplete]);

  // Background animations
  useEffect(() => {
    const createFloatAnimation = (animatedValue: Animated.Value, duration: number) => {
      return Animated.loop(
        Animated.sequence([
          Animated.timing(animatedValue, {
            toValue: 1,
            duration: duration,
            useNativeDriver: true,
          }),
          Animated.timing(animatedValue, {
            toValue: 0,
            duration: duration,
            useNativeDriver: true,
          }),
        ]),
        { iterations: -1 }
      );
    };

    setTimeout(() => createFloatAnimation(bgFloat1, 3500).start(), 100);
    setTimeout(() => createFloatAnimation(bgFloat2, 4000).start(), 300);
  }, []);

  const handleRestart = async () => {
    // Check if we can afford to restart (charge XP)
    if (onRestart) {
      const canRestart = await onRestart();
      if (!canRestart) {
        return; // User doesn't have enough XP or restart failed
      }
    }

    setShowDifficultySelect(true);
    setGameStarted(false);
    completionCalledRef.current = false;
    finalScoreRef.current = 0;
  };

  const handleClose = () => {
    if (!completionCalledRef.current) {
      finalScoreRef.current = score;
      completionCalledRef.current = true;
      onGameComplete(score);
    }
    onClose();
  };

  const handleStart = () => {
    setGameStarted(true);
  };

  const floatInterpolate1 = bgFloat1.interpolate({ inputRange: [0, 1], outputRange: [0, 20] });
  const floatInterpolate2 = bgFloat2.interpolate({ inputRange: [0, 1], outputRange: [0, -15] });

  const formatTime = (secs: number) => {
    const mins = Math.floor(secs / 60);
    const remainingSecs = secs % 60;
    return `${mins}:${remainingSecs.toString().padStart(2, '0')}`;
  };

  return (
    <View style={styles.container}>
      {/* Animated Background */}
      <View style={styles.backgroundContainer}>
        <Animated.View style={[styles.bgElement1, { transform: [{ translateY: floatInterpolate1 }] }]} />
        <Animated.View style={[styles.bgElement2, { transform: [{ translateY: floatInterpolate2 }] }]} />
      </View>

      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={handleClose} style={styles.closeButton}>
          <Ionicons name="close-circle" size={28} color="#EF4444" />
        </TouchableOpacity>
        <Text style={styles.title}>{t('arcade.sudoku.title')}</Text>
        <TouchableOpacity onPress={() => setIsPaused(!isPaused)} style={styles.pauseButton}>
          <Ionicons name={isPaused ? 'play-circle' : 'pause-circle'} size={28} color="#3B82F6" />
        </TouchableOpacity>
      </View>

      {/* Stats */}
      <View style={styles.statsBar}>
        <View style={styles.statBox}>
          <Ionicons name="time" size={16} color="#3B82F6" />
          <Text style={styles.statText}>{formatTime(seconds)}</Text>
        </View>
        <View style={styles.statBox}>
          <Ionicons name="trophy" size={16} color="#F59E0B" />
          <Text style={styles.statText}>{score}</Text>
        </View>
        <View style={styles.statBox}>
          <Ionicons name="close-circle" size={16} color="#EF4444" />
          <Text style={styles.statText}>{mistakes}/3</Text>
        </View>
      </View>

      {/* Difficulty Selector */}
      {showDifficultySelect && (
        <View style={styles.difficultyOverlay}>
          <View style={styles.difficultyCard}>
            <Ionicons name="grid" size={64} color="#6366F1" />
            <Text style={styles.difficultyTitle}>{t('arcade.sudoku.chooseDifficulty')}</Text>
            <Text style={styles.difficultySubtitle}>{t('arcade.sudoku.selectChallenge')}</Text>
            
            <View style={styles.difficultyButtons}>
              <TouchableOpacity 
                style={[styles.difficultyButton, styles.easyButton]}
                onPress={() => startGameWithDifficulty('easy')}
              >
                <Ionicons name="happy" size={32} color="#FFFFFF" />
                <Text style={styles.difficultyButtonText}>{t('arcade.sudoku.easy')}</Text>
              </TouchableOpacity>

              <TouchableOpacity 
                style={[styles.difficultyButton, styles.mediumButton]}
                onPress={() => startGameWithDifficulty('medium')}
              >
                <Ionicons name="flame" size={32} color="#FFFFFF" />
                <Text style={styles.difficultyButtonText}>{t('arcade.sudoku.medium')}</Text>
              </TouchableOpacity>

              <TouchableOpacity 
                style={[styles.difficultyButton, styles.hardButton]}
                onPress={() => startGameWithDifficulty('hard')}
              >
                <Ionicons name="flash" size={32} color="#FFFFFF" />
                <Text style={styles.difficultyButtonText}>{t('arcade.sudoku.hard')}</Text>
              </TouchableOpacity>

              <TouchableOpacity 
                style={[styles.difficultyButton, styles.expertButton]}
                onPress={() => startGameWithDifficulty('expert')}
              >
                <Ionicons name="skull" size={32} color="#FFFFFF" />
                <Text style={styles.difficultyButtonText}>{t('arcade.sudoku.expert')}</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      )}

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        {/* Grid */}
        <View style={[styles.gridContainer, { width: CELL_SIZE * GRID_SIZE + 20 }]}>
          {grid.map((row, rowIndex) => (
            <View key={rowIndex} style={styles.row}>
              {row.map((cell, colIndex) => {
                const isSelected = selectedCell?.row === rowIndex && selectedCell?.col === colIndex;
                const isHighlighted = selectedCell && (
                  selectedCell.row === rowIndex || 
                  selectedCell.col === colIndex ||
                  (Math.floor(selectedCell.row / BOX_SIZE) === Math.floor(rowIndex / BOX_SIZE) &&
                   Math.floor(selectedCell.col / BOX_SIZE) === Math.floor(colIndex / BOX_SIZE))
                );
                const hasError = cell.value !== 0 && !cell.isFixed && !isValidMove(rowIndex, colIndex, cell.value);

                return (
                  <TouchableOpacity
                    key={colIndex}
                    style={[
                      styles.cell,
                      { width: CELL_SIZE, height: CELL_SIZE },
                      colIndex % BOX_SIZE === BOX_SIZE - 1 && colIndex !== GRID_SIZE - 1 && styles.boxBorderRight,
                      rowIndex % BOX_SIZE === BOX_SIZE - 1 && rowIndex !== GRID_SIZE - 1 && styles.boxBorderBottom,
                      isSelected && styles.selectedCell,
                      isHighlighted && !isSelected && styles.highlightedCell,
                      hasError && styles.errorCell,
                    ]}
                    onPress={() => {
                      if (!gameStarted) handleStart();
                      // Toggle selection - if clicking same cell, deselect it
                      if (selectedCell?.row === rowIndex && selectedCell?.col === colIndex) {
                        setSelectedCell(null);
                      } else {
                        setSelectedCell({ row: rowIndex, col: colIndex });
                      }
                    }}
                  >
                    {cell.value !== 0 ? (
                      <Text style={[
                        styles.cellText,
                        cell.isFixed && styles.fixedText,
                        hasError && styles.errorText,
                      ]}>
                        {cell.value}
                      </Text>
                    ) : cell.notes.length > 0 ? (
                      <View style={styles.notesContainer}>
                        {cell.notes.map(note => (
                          <Text key={note} style={styles.noteText}>{note}</Text>
                        ))}
                      </View>
                    ) : null}
                  </TouchableOpacity>
                );
              })}
            </View>
          ))}
        </View>

        {/* Controls */}
        {gameStarted && !gameOver && !gameWon && (
          <View style={styles.controls}>
            <View style={styles.numberPad}>
              {[1, 2, 3, 4, 5, 6, 7, 8, 9].map(num => (
                <TouchableOpacity
                  key={num}
                  style={styles.numberButton}
                  onPress={() => placeNumber(num)}
                >
                  <Text style={styles.numberButtonText}>{num}</Text>
                </TouchableOpacity>
              ))}
            </View>

            <View style={styles.actionButtons}>
              <TouchableOpacity
                style={[styles.actionButton, notesMode && styles.activeActionButton]}
                onPress={() => setNotesMode(!notesMode)}
              >
                <Ionicons name="pencil" size={20} color="#FFFFFF" />
                <Text style={styles.actionButtonText}>Notes</Text>
              </TouchableOpacity>

              <TouchableOpacity style={styles.actionButton} onPress={clearCell}>
                <Ionicons name="backspace" size={20} color="#FFFFFF" />
                <Text style={styles.actionButtonText}>Clear</Text>
              </TouchableOpacity>

              <TouchableOpacity style={styles.actionButton} onPress={getHint}>
                <Ionicons name="bulb" size={20} color="#FFFFFF" />
                <Text style={styles.actionButtonText}>Hint</Text>
              </TouchableOpacity>
            </View>
          </View>
        )}

        {/* Start Message */}
        {!gameStarted && !gameOver && !gameWon && (
          <View style={styles.startMessage}>
            <Text style={styles.startText}>{t('arcade.sudoku.fillGrid')}</Text>
            <TouchableOpacity style={styles.startButton} onPress={handleStart}>
              <Ionicons name="play" size={24} color="#FFFFFF" />
              <Text style={styles.startButtonText}>{t('arcade.sudoku.start')}</Text>
            </TouchableOpacity>
          </View>
        )}
      </ScrollView>

      {/* Win Overlay */}
      {gameWon && (
        <View style={styles.overlay}>
          <View style={styles.winCard}>
            <Ionicons name="trophy" size={64} color="#F59E0B" />
            <Text style={styles.winTitle}>{t('arcade.sudoku.puzzleSolved')}</Text>
            <Text style={styles.winScore}>{t('arcade.sudoku.score', { score })}</Text>
            <Text style={styles.winTime}>{t('arcade.sudoku.time', { time: formatTime(seconds) })}</Text>
            <View style={styles.buttonRow}>
              <TouchableOpacity style={styles.restartButton} onPress={handleRestart}>
                <Ionicons name="refresh" size={20} color="#FFFFFF" />
                <Text style={styles.buttonText}>{t('arcade.sudoku.newPuzzle')}</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.exitButton} onPress={handleClose}>
                <Ionicons name="exit" size={20} color="#FFFFFF" />
                <Text style={styles.buttonText}>{t('arcade.sudoku.exit')}</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      )}

      {/* Game Over Overlay */}
      {gameOver && (
        <View style={styles.overlay}>
          <View style={styles.gameOverCard}>
            <Ionicons name="close-circle" size={64} color="#EF4444" />
            <Text style={styles.gameOverTitle}>{t('arcade.sudoku.tooManyMistakes')}</Text>
            <Text style={styles.finalScore}>{t('arcade.sudoku.score', { score })}</Text>
            <View style={styles.buttonRow}>
              <TouchableOpacity style={styles.restartButton} onPress={handleRestart}>
                <Ionicons name="refresh" size={20} color="#FFFFFF" />
                <Text style={styles.buttonText}>{t('arcade.sudoku.tryAgain')}</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.exitButton} onPress={handleClose}>
                <Ionicons name="exit" size={20} color="#FFFFFF" />
                <Text style={styles.buttonText}>{t('arcade.sudoku.exit')}</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      )}

      {/* Pause Overlay */}
      {isPaused && !gameOver && !gameWon && (
        <View style={styles.overlay}>
          <View style={styles.pausedCard}>
            <Ionicons name="pause-circle" size={64} color="#3B82F6" />
            <Text style={styles.pausedTitle}>{t('arcade.sudoku.paused')}</Text>
            <TouchableOpacity style={styles.resumeButton} onPress={() => setIsPaused(false)}>
              <Ionicons name="play" size={20} color="#FFFFFF" />
              <Text style={styles.buttonText}>{t('arcade.sudoku.resume')}</Text>
            </TouchableOpacity>
          </View>
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0F172A',
  },
  backgroundContainer: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
  },
  bgElement1: {
    position: 'absolute',
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: 'rgba(59, 130, 246, 0.08)',
    top: 50,
    left: 30,
  },
  bgElement2: {
    position: 'absolute',
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: 'rgba(16, 185, 129, 0.07)',
    bottom: 150,
    right: 40,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 10,
    paddingTop: 50,
  },
  closeButton: {
    padding: 5,
  },
  title: {
    fontSize: 28,
    fontWeight: '700',
    color: '#FFFFFF',
    letterSpacing: 2,
  },
  pauseButton: {
    padding: 5,
  },
  statsBar: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 12,
    paddingVertical: 12,
  },
  statBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#1E293B',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#334155',
  },
  statText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  scrollContent: {
    alignItems: 'center',
    paddingBottom: 40,
  },
  gridContainer: {
    backgroundColor: '#1E293B',
    padding: 10,
    borderRadius: 8,
    borderWidth: 2,
    borderColor: '#334155',
  },
  row: {
    flexDirection: 'row',
  },
  cell: {
    borderWidth: 0.5,
    borderColor: '#475569',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#1E293B',
  },
  boxBorderRight: {
    borderRightWidth: 2,
    borderRightColor: '#64748B',
  },
  boxBorderBottom: {
    borderBottomWidth: 2,
    borderBottomColor: '#64748B',
  },
  selectedCell: {
    backgroundColor: '#3B82F6',
  },
  highlightedCell: {
    backgroundColor: '#1E40AF',
  },
  errorCell: {
    backgroundColor: '#7F1D1D',
  },
  cellText: {
    fontSize: CELL_SIZE > 35 ? 20 : 16,
    fontWeight: '700',
    color: '#3B82F6',
  },
  fixedText: {
    color: '#FFFFFF',
  },
  errorText: {
    color: '#EF4444',
  },
  notesContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    padding: 2,
    justifyContent: 'center',
  },
  noteText: {
    fontSize: 8,
    color: '#94A3B8',
    margin: 1,
  },
  controls: {
    marginTop: 20,
    width: '90%',
  },
  numberPad: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 6,
    marginBottom: 15,
    paddingHorizontal: 10,
  },
  numberButton: {
    flex: 1,
    height: 55,
    backgroundColor: '#1E293B',
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 3,
    borderColor: '#6366F1',
    maxWidth: 50,
    minWidth: 35,
    shadowColor: '#6366F1',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 6,
    elevation: 6,
  },
  numberButtonText: {
    fontSize: 26,
    fontWeight: '800',
    color: '#6366F1',
  },
  actionButtons: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 10,
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#334155',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 8,
    borderWidth: 2,
    borderColor: '#475569',
  },
  activeActionButton: {
    backgroundColor: '#10B981',
    borderColor: '#059669',
  },
  actionButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  startMessage: {
    alignItems: 'center',
    gap: 15,
    marginTop: 30,
  },
  startText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#FFFFFF',
    textAlign: 'center',
  },
  startButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#3B82F6',
    paddingHorizontal: 30,
    paddingVertical: 15,
    borderRadius: 20,
    gap: 10,
  },
  startButtonText: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: '700',
  },
  overlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.85)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  winCard: {
    backgroundColor: '#1E293B',
    borderRadius: 20,
    padding: 30,
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#F59E0B',
  },
  winTitle: {
    fontSize: 32,
    fontWeight: '700',
    color: '#FFFFFF',
    marginTop: 15,
    marginBottom: 10,
  },
  winScore: {
    fontSize: 20,
    color: '#3B82F6',
    marginBottom: 5,
  },
  winTime: {
    fontSize: 16,
    color: '#94A3B8',
    marginBottom: 20,
  },
  gameOverCard: {
    backgroundColor: '#1E293B',
    borderRadius: 20,
    padding: 30,
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#EF4444',
  },
  gameOverTitle: {
    fontSize: 28,
    fontWeight: '700',
    color: '#FFFFFF',
    marginTop: 15,
    marginBottom: 10,
  },
  finalScore: {
    fontSize: 20,
    color: '#3B82F6',
    marginBottom: 20,
  },
  buttonRow: {
    flexDirection: 'row',
    gap: 10,
  },
  restartButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#3B82F6',
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 12,
    gap: 8,
  },
  exitButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#EF4444',
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 12,
    gap: 8,
  },
  buttonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
  pausedCard: {
    backgroundColor: '#1E293B',
    borderRadius: 20,
    padding: 30,
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#3B82F6',
  },
  pausedTitle: {
    fontSize: 32,
    fontWeight: '700',
    color: '#FFFFFF',
    marginTop: 15,
    marginBottom: 20,
  },
  resumeButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#3B82F6',
    paddingHorizontal: 30,
    paddingVertical: 12,
    borderRadius: 12,
    gap: 8,
  },
  difficultyOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.85)',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 1000,
  },
  difficultyCard: {
    backgroundColor: '#1E293B',
    borderRadius: 20,
    padding: 30,
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#6366F1',
    maxWidth: 350,
  },
  difficultyTitle: {
    fontSize: 28,
    fontWeight: '700',
    color: '#FFFFFF',
    marginTop: 15,
    marginBottom: 8,
  },
  difficultySubtitle: {
    fontSize: 14,
    color: '#94A3B8',
    marginBottom: 25,
  },
  difficultyButtons: {
    flexDirection: 'column',
    gap: 12,
    width: '100%',
  },
  difficultyButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 24,
    paddingVertical: 18,
    borderRadius: 14,
    gap: 12,
    width: '100%',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  easyButton: {
    backgroundColor: '#10B981',
  },
  mediumButton: {
    backgroundColor: '#F59E0B',
  },
  hardButton: {
    backgroundColor: '#EF4444',
  },
  expertButton: {
    backgroundColor: '#7C3AED',
  },
  difficultyButtonText: {
    fontSize: 18,
    fontWeight: '700',
    color: '#FFFFFF',
    textAlign: 'center',
    flex: 1,
  },
});

export default SudokuGame;

