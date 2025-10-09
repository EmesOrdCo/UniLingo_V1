import React, { useState, useRef } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Modal,
  ActivityIndicator,
  Alert,
  Platform,
} from 'react-native';
import { WebView } from 'react-native-webview';
import { Ionicons } from '@expo/vector-icons';
import { ArcadeGame, ArcadeService } from '../../lib/arcadeService';
import { useAuth } from '../../contexts/AuthContext';
import { getBackendUrl } from '../../config/backendConfig';

interface GameWebViewProps {
  visible: boolean;
  game: ArcadeGame | null;
  onClose: () => void;
  onGameEnd?: (score?: number) => void;
}

export default function GameWebView({ visible, game, onClose, onGameEnd }: GameWebViewProps) {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [gameStartTime] = useState(Date.now());
  const webViewRef = useRef<WebView>(null);

  if (!game) return null;

  // Safety check: Don't try to load React Native games in WebView
  const reactNativeGames = ['snake', '2048', 'tetris', 'breakout', 'space-invaders', 'pong', 'minesweeper', 'pacman', 'flappy-bird', 'asteroids', 'bubble-shooter', 'sudoku', 'flow-free'];
  if (reactNativeGames.includes(game.game_url)) {
    console.warn('GameWebView: Attempted to load React Native game in WebView:', game.game_url);
    return null;
  }

  // Construct the full game URL using backend config
  const gameUrl = getBackendUrl(`/${game.game_url}`);

  const handleClose = async () => {
    // Calculate duration
    const durationSeconds = Math.floor((Date.now() - gameStartTime) / 1000);

    // Record the game play
    if (user?.id) {
      await ArcadeService.recordGamePlay(user.id, game.id, undefined, durationSeconds);
    }

    setLoading(true);
    setError(false);
    onClose();
  };

  const handleGameMessage = async (event: any) => {
    try {
      const data = JSON.parse(event.nativeEvent.data);

      if (data.type === 'GAME_OVER' && data.score !== undefined) {
        const score = parseInt(data.score, 10);

        if (user?.id) {
          // Record game play with score
          const durationSeconds = Math.floor((Date.now() - gameStartTime) / 1000);
          await ArcadeService.recordGamePlay(user.id, game.id, score, durationSeconds);

          // Update high score if applicable
          const isNewHighScore = await ArcadeService.updateHighScore(user.id, game.id, score);

          if (isNewHighScore) {
            Alert.alert(
              '🎉 New High Score!',
              `Congratulations! You scored ${score.toLocaleString()} points!`,
              [{ text: 'Awesome!', style: 'default' }]
            );
          }
        }

        if (onGameEnd) {
          onGameEnd(score);
        }
      }
    } catch (error) {
      console.error('Error handling game message:', error);
    }
  };

  const handleReload = () => {
    setError(false);
    setLoading(true);
    if (webViewRef.current) {
      webViewRef.current.reload();
    }
  };

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="fullScreen"
      onRequestClose={handleClose}
    >
      <View style={styles.container}>
        {/* Header */}
        <View style={styles.header}>
          <View style={styles.headerLeft}>
            <TouchableOpacity
              style={styles.closeButton}
              onPress={handleClose}
              hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
            >
              <Ionicons name="close" size={28} color="#111827" />
            </TouchableOpacity>
            <View style={styles.headerTextContainer}>
              <Text style={styles.headerTitle}>{game.name}</Text>
              <Text style={styles.headerSubtitle}>{game.category}</Text>
            </View>
          </View>
          <TouchableOpacity
            style={styles.reloadButton}
            onPress={handleReload}
            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
          >
            <Ionicons name="reload" size={24} color="#6366F1" />
          </TouchableOpacity>
        </View>

        {/* Game Content */}
        <View style={styles.gameContainer}>
          {loading && (
            <View style={styles.loadingContainer}>
              <ActivityIndicator size="large" color="#6366F1" />
              <Text style={styles.loadingText}>Loading {game.name}...</Text>
            </View>
          )}

          {error && (
            <View style={styles.errorContainer}>
              <Ionicons name="alert-circle-outline" size={64} color="#EF4444" />
              <Text style={styles.errorTitle}>Failed to Load Game</Text>
              <Text style={styles.errorMessage}>
                There was a problem loading {game.name}. Please try again.
              </Text>
              <TouchableOpacity style={styles.retryButton} onPress={handleReload}>
                <Text style={styles.retryButtonText}>Retry</Text>
              </TouchableOpacity>
            </View>
          )}

          <WebView
            ref={webViewRef}
            source={{ uri: gameUrl }}
            style={[styles.webview, { opacity: loading || error ? 0 : 1 }]}
            onLoad={() => {
              console.log('Game loaded successfully:', game.name);
              setLoading(false);
            }}
            onError={(syntheticEvent) => {
              const { nativeEvent } = syntheticEvent;
              console.error('WebView error:', nativeEvent);
              setLoading(false);
              setError(true);
            }}
            onHttpError={(syntheticEvent) => {
              const { nativeEvent } = syntheticEvent;
              console.error('HTTP error loading game:', nativeEvent.statusCode, nativeEvent.url);
            }}
            onMessage={handleGameMessage}
            javaScriptEnabled={true}
            domStorageEnabled={true}
            startInLoadingState={false}
            scalesPageToFit={true}
            bounces={false}
            scrollEnabled={false}
            allowsInlineMediaPlayback={true}
            mediaPlaybackRequiresUserAction={false}
            mixedContentMode="always"
            originWhitelist={['*']}
            allowFileAccess={true}
            allowUniversalAccessFromFileURLs={true}
            onLoadEnd={() => {
              console.log('Game load ended for:', game.name);
            }}
          />
        </View>

        {/* Instructions */}
        <View style={styles.instructions}>
          <Text style={styles.instructionsText}>
            💡 Tip: {game.description}
          </Text>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F9FAFB',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingTop: Platform.OS === 'ios' ? 50 : 16,
    paddingBottom: 16,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  closeButton: {
    padding: 8,
    marginRight: 12,
  },
  headerTextContainer: {
    flex: 1,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#111827',
  },
  headerSubtitle: {
    fontSize: 12,
    color: '#6B7280',
    textTransform: 'capitalize',
    marginTop: 2,
  },
  reloadButton: {
    padding: 8,
  },
  gameContainer: {
    flex: 1,
    backgroundColor: '#000000',
    position: 'relative',
  },
  webview: {
    flex: 1,
    backgroundColor: '#000000',
  },
  loadingContainer: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#F9FAFB',
    zIndex: 10,
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: '#6B7280',
    fontWeight: '500',
  },
  errorContainer: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#F9FAFB',
    padding: 32,
    zIndex: 10,
  },
  errorTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#111827',
    marginTop: 16,
    marginBottom: 8,
  },
  errorMessage: {
    fontSize: 14,
    color: '#6B7280',
    textAlign: 'center',
    marginBottom: 24,
    lineHeight: 20,
  },
  retryButton: {
    backgroundColor: '#6366F1',
    paddingHorizontal: 32,
    paddingVertical: 12,
    borderRadius: 12,
  },
  retryButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  instructions: {
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderTopWidth: 1,
    borderTopColor: '#E5E7EB',
  },
  instructionsText: {
    fontSize: 14,
    color: '#6B7280',
    textAlign: 'center',
    lineHeight: 20,
  },
});
