import { useState, useCallback } from 'react';

export type AvatarAnimationType = 'idle' | 'blink' | 'celebrate' | 'equip' | 'disappointed' | 'none';

interface UseAvatarAnimationReturn {
  currentAnimation: AvatarAnimationType;
  triggerCelebration: () => void;
  triggerEquip: () => void;
  triggerBlink: () => void;
  triggerDisappointed: () => void;
  resetToIdle: () => void;
  stopAnimation: () => void;
}

/**
 * Hook to manage avatar animations
 * Provides simple controls for triggering different animation states
 */
export const useAvatarAnimation = (): UseAvatarAnimationReturn => {
  const [currentAnimation, setCurrentAnimation] = useState<AvatarAnimationType>('idle');

  const triggerCelebration = useCallback(() => {
    console.log('🎉 Triggering celebration animation');
    setCurrentAnimation('celebrate');
    // Auto-reset to idle after animation completes
    setTimeout(() => {
      console.log('🎉 Celebration animation completed, resetting to idle');
      setCurrentAnimation('idle');
    }, 850); // Faster duration to match animation (200+250+200+200ms)
  }, []);

  const triggerEquip = useCallback(() => {
    console.log('👕 Triggering equip animation');
    setCurrentAnimation('equip');
    // Auto-reset to idle after animation completes
    setTimeout(() => {
      console.log('👕 Equip animation completed, resetting to idle');
      setCurrentAnimation('idle');
    }, 400); // Faster duration to match animation
  }, []);

  const triggerBlink = useCallback(() => {
    console.log('👁️ Triggering blink animation');
    setCurrentAnimation('blink');
    // Auto-reset to idle after animation completes
    setTimeout(() => {
      console.log('👁️ Blink animation completed, resetting to idle');
      setCurrentAnimation('idle');
    }, 2000); // Shorter duration
  }, []);

  const triggerDisappointed = useCallback(() => {
    console.log('😞 Triggering disappointed animation');
    setCurrentAnimation('disappointed');
    // Auto-reset to idle after animation completes
    setTimeout(() => {
      console.log('😞 Disappointed animation completed, resetting to idle');
      setCurrentAnimation('idle');
    }, 500); // Faster duration to match shake animation (100+100+100+100+100ms)
  }, []);

  const resetToIdle = useCallback(() => {
    setCurrentAnimation('idle');
  }, []);

  const stopAnimation = useCallback(() => {
    setCurrentAnimation('none');
  }, []);

  return {
    currentAnimation,
    triggerCelebration,
    triggerEquip,
    triggerBlink,
    triggerDisappointed,
    resetToIdle,
    stopAnimation,
  };
};
