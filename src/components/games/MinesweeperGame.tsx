import React, { useState, useEffect, useRef, useCallback } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Dimensions, Animated, Alert } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { useTranslation } from '../../lib/i18n';

interface MinesweeperGameProps {
  gameData?: any;
  onClose: () => void;
  onGameComplete: (score: number) => void;
  onRestart?: () => Promise<boolean>;
}

const { width, height } = Dimensions.get('window');

// Game constants
const GRID_SIZE = 10;
const MINE_COUNT = 15;
const CELL_SIZE = Math.floor(Math.min(width - 50, height - 400) / GRID_SIZE);

type Cell = {
  row: number;
  col: number;
  isMine: boolean;
  isRevealed: boolean;
  isFlagged: boolean;
  adjacentMines: number;
};

const MinesweeperGame: React.FC<MinesweeperGameProps> = ({ onClose, onGameComplete, onRestart }) => {
  const { t } = useTranslation();
  
  // Game state
  const [grid, setGrid] = useState<Cell[][]>([]);
  const [gameOver, setGameOver] = useState(false);
  const [won, setWon] = useState(false);
  const [minesRemaining, setMinesRemaining] = useState(MINE_COUNT);
  const [timer, setTimer] = useState(0);
  const [gameStarted, setGameStarted] = useState(false);

  // Refs
  const timerInterval = useRef<NodeJS.Timeout | null>(null);
  const finalScoreRef = useRef<number>(0);
  const completionCalledRef = useRef<boolean>(false);

  // Animated values
  const bgFloat1 = useRef(new Animated.Value(0)).current;
  const bgFloat2 = useRef(new Animated.Value(0)).current;
  const bgFloat3 = useRef(new Animated.Value(0)).current;

  // Initialize grid
  const initializeGrid = useCallback((): Cell[][] => {
    const newGrid: Cell[][] = [];
    
    // Create empty grid
    for (let row = 0; row < GRID_SIZE; row++) {
      newGrid[row] = [];
      for (let col = 0; col < GRID_SIZE; col++) {
        newGrid[row][col] = {
          row,
          col,
          isMine: false,
          isRevealed: false,
          isFlagged: false,
          adjacentMines: 0,
        };
      }
    }

    // Place mines randomly
    let minesPlaced = 0;
    while (minesPlaced < MINE_COUNT) {
      const row = Math.floor(Math.random() * GRID_SIZE);
      const col = Math.floor(Math.random() * GRID_SIZE);
      
      if (!newGrid[row][col].isMine) {
        newGrid[row][col].isMine = true;
        minesPlaced++;
      }
    }

    // Calculate adjacent mines for each cell
    for (let row = 0; row < GRID_SIZE; row++) {
      for (let col = 0; col < GRID_SIZE; col++) {
        if (!newGrid[row][col].isMine) {
          let count = 0;
          // Check all 8 adjacent cells
          for (let dr = -1; dr <= 1; dr++) {
            for (let dc = -1; dc <= 1; dc++) {
              if (dr === 0 && dc === 0) continue;
              const newRow = row + dr;
              const newCol = col + dc;
              if (
                newRow >= 0 &&
                newRow < GRID_SIZE &&
                newCol >= 0 &&
                newCol < GRID_SIZE &&
                newGrid[newRow][newCol].isMine
              ) {
                count++;
              }
            }
          }
          newGrid[row][col].adjacentMines = count;
        }
      }
    }

    return newGrid;
  }, []);

  // Initialize game
  useEffect(() => {
    setGrid(initializeGrid());
  }, [initializeGrid]);

  // Timer
  useEffect(() => {
    if (gameStarted && !gameOver && !won) {
      timerInterval.current = setInterval(() => {
        setTimer(prev => prev + 1);
      }, 1000);
    }
    return () => {
      if (timerInterval.current) clearInterval(timerInterval.current);
    };
  }, [gameStarted, gameOver, won]);

  // Handle game over
  useEffect(() => {
    if ((gameOver || won) && !completionCalledRef.current) {
      const score = won ? Math.max(1000 - timer * 10, 100) : 0;
      finalScoreRef.current = score;
      completionCalledRef.current = true;
      console.log('💣 Minesweeper calling onGameComplete with score:', score);
      setTimeout(() => {
        onGameComplete(score);
      }, 100);
    }
  }, [gameOver, won, timer, onGameComplete]);

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
    setTimeout(() => createFloatAnimation(bgFloat3, 3200).start(), 500);
  }, []);

  // Reveal cell
  const revealCell = useCallback((row: number, col: number) => {
    if (gameOver || won || grid[row][col].isRevealed || grid[row][col].isFlagged) return;

    if (!gameStarted) {
      setGameStarted(true);
    }

    const newGrid = grid.map(r => r.map(c => ({ ...c })));

    // Hit a mine
    if (newGrid[row][col].isMine) {
      // Haptic feedback for hitting a mine
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      
      // Reveal all mines
      newGrid.forEach(r => r.forEach(c => {
        if (c.isMine) c.isRevealed = true;
      }));
      setGrid(newGrid);
      setGameOver(true);
      return;
    }

    // Haptic feedback for revealing safe cell
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);

    // Reveal cell and cascade if empty
    const toReveal: [number, number][] = [[row, col]];
    const visited = new Set<string>();

    while (toReveal.length > 0) {
      const [r, c] = toReveal.pop()!;
      const key = `${r}-${c}`;
      
      if (visited.has(key)) continue;
      visited.add(key);

      if (r < 0 || r >= GRID_SIZE || c < 0 || c >= GRID_SIZE) continue;
      if (newGrid[r][c].isRevealed || newGrid[r][c].isFlagged || newGrid[r][c].isMine) continue;

      newGrid[r][c].isRevealed = true;

      // If no adjacent mines, reveal neighbors
      if (newGrid[r][c].adjacentMines === 0) {
        for (let dr = -1; dr <= 1; dr++) {
          for (let dc = -1; dc <= 1; dc++) {
            if (dr === 0 && dc === 0) continue;
            toReveal.push([r + dr, c + dc]);
          }
        }
      }
    }

    setGrid(newGrid);

    // Check for win
    const allNonMinesRevealed = newGrid.every(r =>
      r.every(c => c.isMine || c.isRevealed)
    );
    if (allNonMinesRevealed) {
      // Haptic feedback for winning
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      setWon(true);
    }
  }, [grid, gameOver, won, gameStarted]);

  // Toggle flag
  const toggleFlag = useCallback((row: number, col: number) => {
    if (gameOver || won || grid[row][col].isRevealed) return;

    const newGrid = grid.map(r => r.map(c => ({ ...c })));
    newGrid[row][col].isFlagged = !newGrid[row][col].isFlagged;
    
    setGrid(newGrid);
    setMinesRemaining(prev => newGrid[row][col].isFlagged ? prev - 1 : prev + 1);
  }, [grid, gameOver, won]);

  const handleRestart = async () => {
    // Check if we can afford to restart (charge XP)
    if (onRestart) {
      const canRestart = await onRestart();
      if (!canRestart) {
        return; // User doesn't have enough XP or restart failed
      }
    }

    setGrid(initializeGrid());
    setGameOver(false);
    setWon(false);
    setGameStarted(false);
    setTimer(0);
    setMinesRemaining(MINE_COUNT);
    completionCalledRef.current = false;
    finalScoreRef.current = 0;
  };

  const handleClose = () => {
    if (!completionCalledRef.current) {
      const score = won ? Math.max(1000 - timer * 10, 100) : 0;
      finalScoreRef.current = score;
      completionCalledRef.current = true;
      onGameComplete(score);
    }
    onClose();
  };

  // Get number color
  const getNumberColor = (count: number): string => {
    const colors = ['', '#0000FF', '#008000', '#FF0000', '#000080', '#800000', '#008080', '#000000', '#808080'];
    return colors[count] || '#000000';
  };

  const floatInterpolate1 = bgFloat1.interpolate({ inputRange: [0, 1], outputRange: [0, 20] });
  const floatInterpolate2 = bgFloat2.interpolate({ inputRange: [0, 1], outputRange: [0, -15] });
  const floatInterpolate3 = bgFloat3.interpolate({ inputRange: [0, 1], outputRange: [0, 25] });

  return (
    <View style={styles.container}>
      {/* Animated Background */}
      <View style={styles.backgroundContainer}>
        <Animated.View style={[styles.bgElement1, { transform: [{ translateY: floatInterpolate1 }] }]} />
        <Animated.View style={[styles.bgElement2, { transform: [{ translateY: floatInterpolate2 }] }]} />
        <Animated.View style={[styles.bgElement3, { transform: [{ translateY: floatInterpolate3 }] }]} />
      </View>

      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={handleClose} style={styles.closeButton}>
          <Ionicons name="close-circle" size={28} color="#EF4444" />
        </TouchableOpacity>
        <Text style={styles.title}>{t('arcade.minesweeper.title')}</Text>
        <TouchableOpacity onPress={handleRestart} style={styles.restartHeaderButton}>
          <Ionicons name="refresh-circle" size={28} color="#3B82F6" />
        </TouchableOpacity>
      </View>

      {/* Stats Board */}
      <View style={styles.statsBoard}>
        <View style={styles.statBox}>
          <Ionicons name="flag" size={18} color="#EF4444" />
          <Text style={styles.statValue}>{minesRemaining}</Text>
        </View>
        <View style={styles.statBox}>
          <Ionicons name="time" size={18} color="#3B82F6" />
          <Text style={styles.statValue}>{timer}s</Text>
        </View>
      </View>

      {/* Instructions */}
      <View style={styles.instructionsBar}>
        <View style={styles.instructionItem}>
          <Ionicons name="hand-left" size={16} color="#6B7280" />
          <Text style={styles.instructionText}>{t('arcade.minesweeper.tap')}</Text>
        </View>
        <View style={styles.instructionItem}>
          <Ionicons name="flag" size={16} color="#EF4444" />
          <Text style={styles.instructionText}>{t('arcade.minesweeper.hold')}</Text>
        </View>
      </View>

      {/* Game Grid */}
      <View style={styles.gameArea}>
        <View
          style={[
            styles.grid,
            {
              width: GRID_SIZE * (CELL_SIZE + 1) + 1,
              height: GRID_SIZE * (CELL_SIZE + 1) + 1,
            },
          ]}
        >
          {grid.map((row, rowIndex) =>
            row.map((cell, colIndex) => (
              <TouchableOpacity
                key={`${rowIndex}-${colIndex}`}
                style={[
                  styles.cell,
                  {
                    width: CELL_SIZE,
                    height: CELL_SIZE,
                    top: rowIndex * (CELL_SIZE + 1) + 1,
                    left: colIndex * (CELL_SIZE + 1) + 1,
                    backgroundColor: cell.isRevealed
                      ? cell.isMine
                        ? '#EF4444'
                        : '#E5E7EB'
                      : '#94A3B8',
                  },
                ]}
                onPress={() => revealCell(rowIndex, colIndex)}
                onLongPress={() => toggleFlag(rowIndex, colIndex)}
                delayLongPress={300}
                disabled={gameOver || won}
              >
                {cell.isFlagged && !cell.isRevealed && (
                  <Ionicons name="flag" size={CELL_SIZE * 0.6} color="#EF4444" />
                )}
                {cell.isRevealed && !cell.isMine && cell.adjacentMines > 0 && (
                  <Text
                    style={[
                      styles.cellNumber,
                      {
                        fontSize: CELL_SIZE * 0.5,
                        color: getNumberColor(cell.adjacentMines),
                      },
                    ]}
                  >
                    {cell.adjacentMines}
                  </Text>
                )}
                {cell.isRevealed && cell.isMine && (
                  <Ionicons name="nuclear" size={CELL_SIZE * 0.7} color="#FFFFFF" />
                )}
              </TouchableOpacity>
            ))
          )}
        </View>
      </View>

      {/* Legend */}
      <View style={styles.legend}>
        <View style={styles.legendItem}>
          <View style={[styles.legendCell, styles.legendUnrevealed]} />
          <Text style={styles.legendText}>{t('arcade.minesweeper.hidden')}</Text>
        </View>
        <View style={styles.legendItem}>
          <View style={[styles.legendCell, styles.legendRevealed]}>
            <Text style={styles.legendNumber}>3</Text>
          </View>
          <Text style={styles.legendText}>{t('arcade.minesweeper.number')}</Text>
        </View>
        <View style={styles.legendItem}>
          <View style={[styles.legendCell, styles.legendFlagged]}>
            <Ionicons name="flag" size={12} color="#EF4444" />
          </View>
          <Text style={styles.legendText}>{t('arcade.minesweeper.flag')}</Text>
        </View>
        <View style={styles.legendItem}>
          <View style={[styles.legendCell, styles.legendMine]}>
            <Ionicons name="nuclear" size={12} color="#FFFFFF" />
          </View>
          <Text style={styles.legendText}>{t('arcade.minesweeper.mine')}</Text>
        </View>
      </View>

      {/* Win Overlay */}
      {won && (
        <View style={styles.overlay}>
          <View style={styles.winCard}>
            <Ionicons name="trophy" size={64} color="#F59E0B" />
            <Text style={styles.winTitle}>{t('arcade.minesweeper.youWin')}</Text>
            <Text style={styles.winTime}>{t('arcade.minesweeper.time', { time: timer })}</Text>
            <Text style={styles.winScore}>{t('arcade.minesweeper.score', { score: Math.max(1000 - timer * 10, 100) })}</Text>
            <Text style={styles.winSubtext}>{t('arcade.minesweeper.fasterTime')}</Text>
            <View style={styles.buttonRow}>
              <TouchableOpacity style={styles.playAgainButton} onPress={handleRestart}>
                <Ionicons name="refresh" size={20} color="#FFFFFF" />
                <Text style={styles.buttonText}>{t('arcade.minesweeper.playAgain')}</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.exitButton} onPress={handleClose}>
                <Ionicons name="exit" size={20} color="#FFFFFF" />
                <Text style={styles.buttonText}>{t('arcade.minesweeper.exit')}</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      )}

      {/* Game Over Overlay */}
      {gameOver && (
        <View style={styles.overlay}>
          <View style={styles.gameOverCard}>
            <Ionicons name="nuclear" size={64} color="#EF4444" />
            <Text style={styles.gameOverTitle}>{t('arcade.minesweeper.boom')}</Text>
            <Text style={styles.gameOverText}>{t('arcade.minesweeper.youHitMine')}</Text>
            <Text style={styles.gameOverTime}>{t('arcade.minesweeper.timeSurvived', { time: timer })}</Text>
            <View style={styles.buttonRow}>
              <TouchableOpacity style={styles.tryAgainButton} onPress={handleRestart}>
                <Ionicons name="refresh" size={20} color="#FFFFFF" />
                <Text style={styles.buttonText}>{t('arcade.minesweeper.tryAgain')}</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.exitButton} onPress={handleClose}>
                <Ionicons name="exit" size={20} color="#FFFFFF" />
                <Text style={styles.buttonText}>{t('arcade.minesweeper.exit')}</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F3F4F6',
    alignItems: 'center',
    justifyContent: 'flex-start',
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
    backgroundColor: 'rgba(59, 130, 246, 0.05)',
    top: 50,
    left: 30,
  },
  bgElement2: {
    position: 'absolute',
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: 'rgba(239, 68, 68, 0.04)',
    top: 150,
    right: 40,
  },
  bgElement3: {
    position: 'absolute',
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: 'rgba(16, 185, 129, 0.045)',
    bottom: 200,
    left: 50,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    width: '100%',
    paddingHorizontal: 20,
    paddingVertical: 10,
    paddingTop: 50,
  },
  closeButton: {
    padding: 5,
  },
  title: {
    fontSize: 22,
    fontWeight: '700',
    color: '#1F2937',
    letterSpacing: 1,
  },
  restartHeaderButton: {
    padding: 5,
  },
  statsBoard: {
    flexDirection: 'row',
    gap: 20,
    marginVertical: 10,
  },
  statBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: '#E5E7EB',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  statValue: {
    fontSize: 20,
    fontWeight: '700',
    color: '#1F2937',
  },
  instructionsBar: {
    flexDirection: 'row',
    gap: 20,
    marginBottom: 10,
  },
  instructionItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  instructionText: {
    fontSize: 12,
    color: '#6B7280',
    fontWeight: '500',
  },
  gameArea: {
    alignItems: 'center',
    justifyContent: 'center',
    marginVertical: 10,
  },
  grid: {
    backgroundColor: '#9CA3AF',
    borderRadius: 4,
    position: 'relative',
  },
  cell: {
    position: 'absolute',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#6B7280',
  },
  cellNumber: {
    fontWeight: '700',
  },
  legend: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 15,
    flexWrap: 'wrap',
    justifyContent: 'center',
    paddingHorizontal: 20,
  },
  legendItem: {
    alignItems: 'center',
    gap: 4,
  },
  legendCell: {
    width: 24,
    height: 24,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 2,
    borderWidth: 1,
    borderColor: '#6B7280',
  },
  legendUnrevealed: {
    backgroundColor: '#94A3B8',
  },
  legendRevealed: {
    backgroundColor: '#E5E7EB',
  },
  legendFlagged: {
    backgroundColor: '#94A3B8',
  },
  legendMine: {
    backgroundColor: '#EF4444',
  },
  legendNumber: {
    fontSize: 10,
    fontWeight: '700',
    color: '#0000FF',
  },
  legendText: {
    fontSize: 10,
    color: '#6B7280',
    fontWeight: '500',
  },
  overlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.8)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  winCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: 30,
    alignItems: 'center',
    borderWidth: 3,
    borderColor: '#F59E0B',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  winTitle: {
    fontSize: 32,
    fontWeight: '700',
    color: '#1F2937',
    marginTop: 15,
    marginBottom: 10,
  },
  winTime: {
    fontSize: 20,
    color: '#3B82F6',
    fontWeight: '600',
    marginBottom: 5,
  },
  winScore: {
    fontSize: 24,
    color: '#10B981',
    fontWeight: '700',
    marginBottom: 5,
  },
  winSubtext: {
    fontSize: 12,
    color: '#6B7280',
    marginBottom: 20,
  },
  gameOverCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: 30,
    alignItems: 'center',
    borderWidth: 3,
    borderColor: '#EF4444',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  gameOverTitle: {
    fontSize: 32,
    fontWeight: '700',
    color: '#1F2937',
    marginTop: 15,
    marginBottom: 10,
  },
  gameOverText: {
    fontSize: 18,
    color: '#6B7280',
    marginBottom: 10,
  },
  gameOverTime: {
    fontSize: 16,
    color: '#6B7280',
    marginBottom: 20,
  },
  buttonRow: {
    flexDirection: 'row',
    gap: 10,
  },
  playAgainButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#10B981',
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 12,
    gap: 8,
  },
  tryAgainButton: {
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
});

export default MinesweeperGame;

