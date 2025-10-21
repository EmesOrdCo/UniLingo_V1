import { useState, useEffect } from 'react';
import SessionTimerService from '../lib/sessionTimerService';
import { useNavigation } from '@react-navigation/native';

export function useSessionTimer() {
  const [showBreakReminder, setShowBreakReminder] = useState(false);
  const [sessionTime, setSessionTime] = useState(0);
  const navigation = useNavigation();

  useEffect(() => {
    // Start the session timer
    const timer = SessionTimerService.getInstance();
    
    timer.startSession({
      onBreakReminder: () => {
        const currentTime = timer.getCurrentSessionTime();
        setSessionTime(currentTime);
        setShowBreakReminder(true);
      }
    });

    // Update session time every minute
    const updateInterval = setInterval(() => {
      const currentTime = timer.getCurrentSessionTime();
      setSessionTime(currentTime);
    }, 60000);

    // Cleanup on unmount
    return () => {
      timer.stopSession();
      clearInterval(updateInterval);
    };
  }, []);

  const handleCloseBreakReminder = () => {
    setShowBreakReminder(false);
  };

  const handleGoToArcade = () => {
    setShowBreakReminder(false);
    (navigation as any).navigate('Arcade');
  };

  return {
    showBreakReminder,
    sessionTime,
    onCloseBreakReminder: handleCloseBreakReminder,
    onGoToArcade: handleGoToArcade,
  };
}
