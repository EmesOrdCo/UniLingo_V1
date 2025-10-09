import React from 'react';
import Svg, { Rect } from 'react-native-svg';
import { CharacterAppearance, HAIR_COLORS } from '../../types/character';

interface HairProps {
  appearance: CharacterAppearance;
  size?: number;
}

const Hair8Bit: React.FC<HairProps> = ({ appearance, size = 200 }) => {
  const { hairStyle, hairColor } = appearance;
  
  // 8-bit pixel grid system
  const pixelSize = size / 32;
  const centerX = size / 2;
  const centerY = size / 2;
  
  const getHairPixels = () => {
    const pixels: JSX.Element[] = [];
    const hairColorValue = HAIR_COLORS[hairColor];
    
    switch (hairStyle) {
      case 'short':
        // Short hair - simple top section
        for (let y = 0; y < 12; y++) {
          for (let x = 4; x < 28; x++) {
            const dx = (x - 16) * pixelSize;
            const dy = (y - 6) * pixelSize;
            const distance = Math.sqrt(dx * dx + dy * dy * 0.8);
            
            if (distance < size * 0.4 && y < 10) {
              pixels.push(
                <Rect
                  key={`${x}-${y}`}
                  x={x * pixelSize}
                  y={y * pixelSize}
                  width={pixelSize}
                  height={pixelSize}
                  fill={hairColorValue}
                />
              );
            }
          }
        }
        break;
        
      case 'medium':
        // Medium hair - extends down sides
        for (let y = 0; y < 16; y++) {
          for (let x = 4; x < 28; x++) {
            const dx = (x - 16) * pixelSize;
            const dy = (y - 8) * pixelSize;
            const distance = Math.sqrt(dx * dx + dy * dy * 0.7);
            
            if (distance < size * 0.42) {
              pixels.push(
                <Rect
                  key={`${x}-${y}`}
                  x={x * pixelSize}
                  y={y * pixelSize}
                  width={pixelSize}
                  height={pixelSize}
                  fill={hairColorValue}
                />
              );
            }
          }
        }
        break;
        
      case 'long':
        // Long hair - extends further down
        for (let y = 0; y < 20; y++) {
          for (let x = 4; x < 28; x++) {
            const dx = (x - 16) * pixelSize;
            const dy = (y - 10) * pixelSize;
            const distance = Math.sqrt(dx * dx + dy * dy * 0.6);
            
            if (distance < size * 0.45) {
              pixels.push(
                <Rect
                  key={`${x}-${y}`}
                  x={x * pixelSize}
                  y={y * pixelSize}
                  width={pixelSize}
                  height={pixelSize}
                  fill={hairColorValue}
                />
              );
            }
          }
        }
        break;
        
      case 'curly':
        // Curly hair - more textured pattern
        for (let y = 0; y < 18; y++) {
          for (let x = 2; x < 30; x++) {
            const dx = (x - 16) * pixelSize;
            const dy = (y - 9) * pixelSize;
            const distance = Math.sqrt(dx * dx + dy * dy * 0.5);
            
            // Add some randomness for curly effect
            const curlyOffset = Math.sin(x * 0.8) * 2;
            
            if (distance < size * 0.43 + curlyOffset) {
              pixels.push(
                <Rect
                  key={`${x}-${y}`}
                  x={x * pixelSize}
                  y={y * pixelSize}
                  width={pixelSize}
                  height={pixelSize}
                  fill={hairColorValue}
                />
              );
            }
          }
        }
        break;
        
      case 'afro':
        // Afro - very round and full
        for (let y = 0; y < 20; y++) {
          for (let x = 2; x < 30; x++) {
            const dx = (x - 16) * pixelSize;
            const dy = (y - 8) * pixelSize;
            const distance = Math.sqrt(dx * dx + dy * dy * 0.4);
            
            if (distance < size * 0.48) {
              pixels.push(
                <Rect
                  key={`${x}-${y}`}
                  x={x * pixelSize}
                  y={y * pixelSize}
                  width={pixelSize}
                  height={pixelSize}
                  fill={hairColorValue}
                />
              );
            }
          }
        }
        break;
        
      case 'bald':
        // No hair
        break;
        
      default:
        // Default medium hair
        for (let y = 0; y < 16; y++) {
          for (let x = 4; x < 28; x++) {
            const dx = (x - 16) * pixelSize;
            const dy = (y - 8) * pixelSize;
            const distance = Math.sqrt(dx * dx + dy * dy * 0.7);
            
            if (distance < size * 0.42) {
              pixels.push(
                <Rect
                  key={`${x}-${y}`}
                  x={x * pixelSize}
                  y={y * pixelSize}
                  width={pixelSize}
                  height={pixelSize}
                  fill={hairColorValue}
                />
              );
            }
          }
        }
    }
    
    return pixels;
  };

  if (hairStyle === 'bald') {
    return null;
  }

  return (
    <Svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
      {/* Hair pixels */}
      {getHairPixels()}
    </Svg>
  );
};

export default Hair8Bit;
