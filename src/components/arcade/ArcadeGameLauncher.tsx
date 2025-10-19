import React, { useState } from 'react';
import { Modal } from 'react-native';
import { ArcadeGame, ArcadeService } from '../../lib/arcadeService';
import { useAuth } from '../../contexts/AuthContext';
import { useTranslation } from '../../lib/i18n';
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

interface ArcadeGameLauncherProps {
  visible: boolean;
  game: ArcadeGame | null;
  onClose: () => void;
}

export default function ArcadeGameLauncher({ visible, game, onClose }: ArcadeGameLauncherProps) {
  const { t } = useTranslation();
  const { user } = useAuth();
  const [gameStartTime] = useState(Date.now());
  const [restartCount, setRestartCount] = useState(0);

  if (!game) return null;

  // Determine if this is a React Native game or WebView game
  const isReactNativeGame = ['snake', '2048', 'tetris', 'breakout', 'space-invaders', 'pong', 'minesweeper', 'pacman', 'flappy-bird', 'asteroids', 'bubble-shooter', 'sudoku'].includes(game.game_url) || game.game_url.startsWith('native://');

  const handleGameComplete = async (score: number) => {
    const durationSeconds = Math.floor((Date.now() - gameStartTime) / 1000);

    // Record the game play (for React Native games)
    if (user?.id) {
      await ArcadeService.recordGamePlay(user.id, game.id, score, durationSeconds);
      
      // Update high score if applicable
      if (score > 0) {
        await ArcadeService.updateHighScore(user.id, game.id, score);
      }
    }
  };

  const handleWebViewGameEnd = async (score: number) => {
    const durationSeconds = Math.floor((Date.now() - gameStartTime) / 1000);

    // Record the game play (for WebView games)
    if (user?.id) {
      await ArcadeService.recordGamePlay(user.id, game.id, score, durationSeconds);
      
      // Update high score if applicable
      if (score > 0) {
        await ArcadeService.updateHighScore(user.id, game.id, score);
      }
    }
  };

  const handleClose = async () => {
    // Don't record game play on close - only record when games actually complete
    onClose();
  };

  const handleGameRestart = async () => {
    if (!user?.id || !game) return;

    // Check if user can afford to restart (has enough XP for paid games)
    if (game.xp_cost > 0) {
      const playCheck = await ArcadeService.canPlayGame(user.id, game.id);
      
      if (!playCheck.canPlay) {
        // Translate the message if it's the standard XP message
        let message = playCheck.message;
        if (message && message.includes('Need') && message.includes('XP') && message.includes('You have')) {
          // Extract cost and available XP from the message
          const costMatch = message.match(/Need (\d+) XP/);
          const availableMatch = message.match(/You have (\d+) XP/);
          if (costMatch && availableMatch) {
            message = t('arcade.gameLauncher.needXP', { 
              cost: costMatch[1], 
              available: availableMatch[1] 
            });
          }
        } else if (message === 'Game not found') {
          message = t('arcade.gameLauncher.gameNotFound');
        } else if (message === 'Error checking XP') {
          message = t('arcade.gameLauncher.errorCheckingXP');
        }
        alert(message || t('arcade.gameLauncher.notEnoughXP'));
        return false; // Indicate restart failed
      }

      // Purchase the restart (spend XP again)
      const purchase = await ArcadeService.purchaseGame(user.id, game.id);
      if (!purchase.success) {
        // Translate common error messages
        let message = purchase.message;
        if (message === 'Failed to spend XP') {
          message = t('arcade.gameLauncher.failedToSpendXP');
        } else if (message === 'Error processing purchase') {
          message = t('arcade.gameLauncher.errorProcessingPurchase');
        }
        alert(message || t('arcade.gameLauncher.restartFailed'));
        return false; // Indicate restart failed
      }

      console.log(`💰 Charged ${game.xp_cost} XP for game restart (attempt ${restartCount + 1})`);
      setRestartCount(prev => prev + 1);
    }

    return true; // Indicate restart succeeded
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
          <SnakeGame onClose={handleClose} onGameComplete={handleGameComplete} onRestart={handleGameRestart} />
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
          <Game2048 onClose={handleClose} onGameComplete={handleGameComplete} onRestart={handleGameRestart} />
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
          <TetrisGame onClose={handleClose} onGameComplete={handleGameComplete} onRestart={handleGameRestart} />
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
          <BreakoutGame onClose={handleClose} onGameComplete={handleGameComplete} onRestart={handleGameRestart} />
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
          <SpaceInvadersGame onClose={handleClose} onGameComplete={handleGameComplete} onRestart={handleGameRestart} />
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
          <PongGame onClose={handleClose} onGameComplete={handleGameComplete} onRestart={handleGameRestart} />
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
          <MinesweeperGame onClose={handleClose} onGameComplete={handleGameComplete} onRestart={handleGameRestart} />
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
          <PacManGame onClose={handleClose} onGameComplete={handleGameComplete} onRestart={handleGameRestart} />
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
          <FlappyBirdGame onClose={handleClose} onGameComplete={handleGameComplete} onRestart={handleGameRestart} />
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
          <AsteroidsGame onClose={handleClose} onGameComplete={handleGameComplete} onRestart={handleGameRestart} />
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
          <BubbleShooterGame onClose={handleClose} onGameComplete={handleGameComplete} onRestart={handleGameRestart} />
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
          <SudokuGame onClose={handleClose} onGameComplete={handleGameComplete} onRestart={handleGameRestart} />
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
      onGameEnd={handleWebViewGameEnd}
    />
  );
}

