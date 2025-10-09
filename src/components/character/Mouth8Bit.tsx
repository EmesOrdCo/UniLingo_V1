import React from 'react';
import Svg, { Rect } from 'react-native-svg';
import { CharacterAppearance } from '../../types/character';

interface MouthProps {
  appearance: CharacterAppearance;
  size?: number;
}

const Mouth8Bit: React.FC<MouthProps> = ({ appearance, size = 200 }) => {
  const { expression } = appearance;
  
  // 8-bit pixel grid system
  const pixelSize = size / 32;
  const centerX = size / 2;
  const centerY = size * 0.65;
  
  const getMouthPixels = () => {
    const pixels: JSX.Element[] = [];
    
    switch (expression) {
      case 'happy':
        // Happy mouth - curved upward
        const happyMouth = [
          [0, 1, 1, 1, 1, 1, 1, 0],
          [1, 1, 1, 1, 1, 1, 1, 1],
          [0, 1, 1, 1, 1, 1, 1, 0],
          [0, 0, 1, 1, 1, 1, 0, 0],
          [0, 0, 0, 1, 1, 0, 0, 0]
        ];
        
        happyMouth.forEach((row, y) => {
          row.forEach((pixel, x) => {
            if (pixel) {
              pixels.push(
                <Rect
                  key={`mouth-${x}-${y}`}
                  x={(centerX - 4 + x) * pixelSize}
                  y={(centerY - 2 + y) * pixelSize}
                  width={pixelSize}
                  height={pixelSize}
                  fill="#8B4513"
                />
              );
            }
          });
        });
        break;
        
      case 'neutral':
        // Neutral mouth - straight line
        for (let x = -3; x <= 3; x++) {
          pixels.push(
            <Rect
              key={`mouth-${x}`}
              x={(centerX + x) * pixelSize}
              y={centerY * pixelSize}
              width={pixelSize}
              height={pixelSize}
              fill="#8B4513"
            />
          );
        }
        break;
        
      case 'wink':
        // Wink mouth - slightly curved
        const winkMouth = [
          [0, 1, 1, 1, 1, 1, 0],
          [1, 1, 1, 1, 1, 1, 1],
          [0, 1, 1, 1, 1, 1, 0]
        ];
        
        winkMouth.forEach((row, y) => {
          row.forEach((pixel, x) => {
            if (pixel) {
              pixels.push(
                <Rect
                  key={`mouth-${x}-${y}`}
                  x={(centerX - 3 + x) * pixelSize}
                  y={(centerY - 1 + y) * pixelSize}
                  width={pixelSize}
                  height={pixelSize}
                  fill="#8B4513"
                />
              );
            }
          });
        });
        break;
        
      case 'surprised':
        // Surprised mouth - small circle
        const surprisedMouth = [
          [0, 1, 1, 0],
          [1, 1, 1, 1],
          [0, 1, 1, 0]
        ];
        
        surprisedMouth.forEach((row, y) => {
          row.forEach((pixel, x) => {
            if (pixel) {
              pixels.push(
                <Rect
                  key={`mouth-${x}-${y}`}
                  x={(centerX - 2 + x) * pixelSize}
                  y={(centerY - 1 + y) * pixelSize}
                  width={pixelSize}
                  height={pixelSize}
                  fill="#8B4513"
                />
              );
            }
          });
        });
        break;
        
      default:
        // Default happy mouth
        const defaultMouth = [
          [0, 1, 1, 1, 1, 1, 1, 0],
          [1, 1, 1, 1, 1, 1, 1, 1],
          [0, 1, 1, 1, 1, 1, 1, 0]
        ];
        
        defaultMouth.forEach((row, y) => {
          row.forEach((pixel, x) => {
            if (pixel) {
              pixels.push(
                <Rect
                  key={`mouth-${x}-${y}`}
                  x={(centerX - 4 + x) * pixelSize}
                  y={(centerY - 1 + y) * pixelSize}
                  width={pixelSize}
                  height={pixelSize}
                  fill="#8B4513"
                />
              );
            }
          });
        });
    }
    
    return pixels;
  };

  return (
    <Svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
      {/* Mouth pixels */}
      {getMouthPixels()}
    </Svg>
  );
};

export default Mouth8Bit;
