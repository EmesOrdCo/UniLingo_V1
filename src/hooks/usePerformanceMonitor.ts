import { useEffect, useRef } from 'react';
import { Animated } from 'react-native';

interface PerformanceMonitorProps {
  animationType: string;
  onPerformanceData?: (data: PerformanceData) => void;
}

interface PerformanceData {
  animationType: string;
  frameRate: number;
  memoryUsage: number;
  animationDuration: number;
  timestamp: number;
}

/**
 * Performance monitoring hook for avatar animations
 * Tracks frame rate, memory usage, and animation performance
 */
export const usePerformanceMonitor = (animationType: string) => {
  const frameCount = useRef(0);
  const lastTime = useRef(Date.now());
  const animationStartTime = useRef(Date.now());
  const performanceData = useRef<PerformanceData[]>([]);

  useEffect(() => {
    const startTime = Date.now();
    animationStartTime.current = startTime;
    frameCount.current = 0;
    lastTime.current = startTime;

    const measurePerformance = () => {
      const currentTime = Date.now();
      const deltaTime = currentTime - lastTime.current;
      
      if (deltaTime >= 1000) { // Measure every second
        const frameRate = (frameCount.current * 1000) / deltaTime;
        const animationDuration = currentTime - animationStartTime.current;
        
        // Estimate memory usage (rough approximation)
        const memoryUsage = (performance as any).memory?.usedJSHeapSize || 0;
        
        const data: PerformanceData = {
          animationType,
          frameRate: Math.round(frameRate),
          memoryUsage: Math.round(memoryUsage / 1024 / 1024), // Convert to MB
          animationDuration,
          timestamp: currentTime,
        };

        performanceData.current.push(data);
        
        // Keep only last 10 measurements
        if (performanceData.current.length > 10) {
          performanceData.current.shift();
        }

        // Log performance data
        console.log('🎬 Animation Performance:', {
          type: animationType,
          fps: frameRate,
          memory: `${Math.round(memoryUsage / 1024 / 1024)}MB`,
          duration: `${animationDuration}ms`,
        });

        // Reset counters
        frameCount.current = 0;
        lastTime.current = currentTime;
      }

      frameCount.current++;
      requestAnimationFrame(measurePerformance);
    };

    const animationId = requestAnimationFrame(measurePerformance);

    return () => {
      cancelAnimationFrame(animationId);
    };
  }, [animationType]);

  return {
    getPerformanceData: () => performanceData.current,
    getAverageFrameRate: () => {
      const data = performanceData.current;
      if (data.length === 0) return 0;
      return data.reduce((sum, d) => sum + d.frameRate, 0) / data.length;
    },
    getMemoryUsage: () => {
      const data = performanceData.current;
      if (data.length === 0) return 0;
      return data[data.length - 1]?.memoryUsage || 0;
    },
  };
};

/**
 * Simple performance test component
 * Use this to test animation performance
 */
export const PerformanceTest: React.FC<{ animationType: string }> = ({ animationType }) => {
  const { getAverageFrameRate, getMemoryUsage } = usePerformanceMonitor(animationType);

  useEffect(() => {
    const interval = setInterval(() => {
      const avgFPS = getAverageFrameRate();
      const memory = getMemoryUsage();
      
      console.log('📊 Performance Summary:', {
        animationType,
        averageFPS: Math.round(avgFPS),
        memoryUsage: `${memory}MB`,
        status: avgFPS > 50 ? '✅ Good' : avgFPS > 30 ? '⚠️ Fair' : '❌ Poor',
      });
    }, 5000);

    return () => clearInterval(interval);
  }, [animationType, getAverageFrameRate, getMemoryUsage]);

  return null; // This is just a monitoring component
};
