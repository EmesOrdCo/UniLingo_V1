import React, { useState } from 'react';
import { Modal } from 'react-native';
import { ArcadeGame, ArcadeService } from '../../lib/arcadeService';
import { useAuth } from '../../contexts/AuthContext';
import GameWebView from './GameWebView';
import SnakeGame from '../games/SnakeGame';
import Game2048 from '../games/2048Game';
import TetrisGame from '../games/TetrisGame';
import BreakoutGame from '../games/BreakoutGame';
import SpaceInvadersGame from '../games/SpaceInvadersGame';
import PongGame from '../games/PongGame';
import MinesweeperGame from '../games/MinesweeperGame';
import PacManGame from '../games/PacManGame';
import FlappyBirdGame from '../games/FlappyBirdGame';
import AsteroidsGame from '../games/AsteroidsGame';
import BubbleShooterGame from '../games/BubbleShooterGame';
import SudokuGame from '../games/SudokuGame';
import FlowFreeGame from '../games/FlowFreeGame';

interface ArcadeGameLauncherProps {
  visible: boolean;
  game: ArcadeGame | null;
  onClose: () => void;
}

export default function ArcadeGameLauncher({ visible, game, onClose }: ArcadeGameLauncherProps) {
  const { user } = useAuth();
  const [gameStartTime] = useState(Date.now());

  if (!game) return null;

  // Determine if this is a React Native game or WebView game
  const isReactNativeGame = ['snake', '2048', 'tetris', 'breakout', 'space-invaders', 'pong', 'minesweeper', 'pacman', 'flappy-bird', 'asteroids', 'bubble-shooter', 'sudoku', 'flow-free'].includes(game.game_url) || game.game_url.startsWith('native://');

  const handleGameComplete = async (score: number) => {
    const durationSeconds = Math.floor((Date.now() - gameStartTime) / 1000);

    // Record the game play
    if (user?.id) {
      await ArcadeService.recordGamePlay(user.id, game.id, score, durationSeconds);
      
      // Update high score if applicable
      if (score > 0) {
        await ArcadeService.updateHighScore(user.id, game.id, score);
      }
    }
  };

  const handleClose = async () => {
    const durationSeconds = Math.floor((Date.now() - gameStartTime) / 1000);

    // Record the game play (even if they didn't finish)
    if (user?.id) {
      await ArcadeService.recordGamePlay(user.id, game.id, undefined, durationSeconds);
    }

    onClose();
  };

  // Render React Native games directly
  if (isReactNativeGame) {
    if (game.game_url === 'snake') {
      return (
        <Modal
          visible={visible}
          animationType="slide"
          presentationStyle="fullScreen"
          onRequestClose={handleClose}
        >
          <SnakeGame onClose={handleClose} onGameComplete={handleGameComplete} />
        </Modal>
      );
    }
    
    if (game.game_url === '2048') {
      return (
        <Modal
          visible={visible}
          animationType="slide"
          presentationStyle="fullScreen"
          onRequestClose={handleClose}
        >
          <Game2048 onClose={handleClose} onGameComplete={handleGameComplete} />
        </Modal>
      );
    }
    
    if (game.game_url === 'tetris') {
      return (
        <Modal
          visible={visible}
          animationType="slide"
          presentationStyle="fullScreen"
          onRequestClose={handleClose}
        >
          <TetrisGame onClose={handleClose} onGameComplete={handleGameComplete} />
        </Modal>
      );
    }
    
    if (game.game_url === 'breakout') {
      return (
        <Modal
          visible={visible}
          animationType="slide"
          presentationStyle="fullScreen"
          onRequestClose={handleClose}
        >
          <BreakoutGame onClose={handleClose} onGameComplete={handleGameComplete} />
        </Modal>
      );
    }
    
    if (game.game_url === 'space-invaders') {
      return (
        <Modal
          visible={visible}
          animationType="slide"
          presentationStyle="fullScreen"
          onRequestClose={handleClose}
        >
          <SpaceInvadersGame onClose={handleClose} onGameComplete={handleGameComplete} />
        </Modal>
      );
    }
    
    if (game.game_url === 'pong') {
      return (
        <Modal
          visible={visible}
          animationType="slide"
          presentationStyle="fullScreen"
          onRequestClose={handleClose}
        >
          <PongGame onClose={handleClose} onGameComplete={handleGameComplete} />
        </Modal>
      );
    }
    
    if (game.game_url === 'minesweeper') {
      return (
        <Modal
          visible={visible}
          animationType="slide"
          presentationStyle="fullScreen"
          onRequestClose={handleClose}
        >
          <MinesweeperGame onClose={handleClose} onGameComplete={handleGameComplete} />
        </Modal>
      );
    }
    
    if (game.game_url === 'pacman') {
      return (
        <Modal
          visible={visible}
          animationType="slide"
          presentationStyle="fullScreen"
          onRequestClose={handleClose}
        >
          <PacManGame onClose={handleClose} onGameComplete={handleGameComplete} />
        </Modal>
      );
    }
    
    if (game.game_url === 'flappy-bird') {
      return (
        <Modal
          visible={visible}
          animationType="slide"
          presentationStyle="fullScreen"
          onRequestClose={handleClose}
        >
          <FlappyBirdGame onClose={handleClose} onGameComplete={handleGameComplete} />
        </Modal>
      );
    }
    
    if (game.game_url === 'asteroids') {
      return (
        <Modal
          visible={visible}
          animationType="slide"
          presentationStyle="fullScreen"
          onRequestClose={handleClose}
        >
          <AsteroidsGame onClose={handleClose} onGameComplete={handleGameComplete} />
        </Modal>
      );
    }
    
    if (game.game_url === 'bubble-shooter') {
      return (
        <Modal
          visible={visible}
          animationType="slide"
          presentationStyle="fullScreen"
          onRequestClose={handleClose}
        >
          <BubbleShooterGame onClose={handleClose} onGameComplete={handleGameComplete} />
        </Modal>
      );
    }
    
    if (game.game_url === 'sudoku') {
      return (
        <Modal
          visible={visible}
          animationType="slide"
          presentationStyle="fullScreen"
          onRequestClose={handleClose}
        >
          <SudokuGame onClose={handleClose} onGameComplete={handleGameComplete} />
        </Modal>
      );
    }
    
    if (game.game_url === 'flow-free') {
      return (
        <Modal
          visible={visible}
          animationType="slide"
          presentationStyle="fullScreen"
          onRequestClose={handleClose}
        >
          <FlowFreeGame onClose={handleClose} onGameComplete={handleGameComplete} />
        </Modal>
      );
    }
  }

  // Render HTML5 games via WebView
  return (
    <GameWebView
      visible={visible}
      game={game}
      onClose={handleClose}
      onGameEnd={handleGameComplete}
    />
  );
}

