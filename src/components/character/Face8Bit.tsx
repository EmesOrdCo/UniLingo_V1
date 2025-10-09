import React from 'react';
import Svg, { Rect, Circle } from 'react-native-svg';
import { CharacterAppearance, SKIN_TONES } from '../../types/character';

interface FaceProps {
  appearance: CharacterAppearance;
  size?: number;
}

const Face8Bit: React.FC<FaceProps> = ({ appearance, size = 200 }) => {
  const { faceShape, skinTone } = appearance;
  
  // Much simpler 8-bit system - just essential pixels
  const pixelSize = size / 16; // 16x16 pixel grid - much cleaner
  const centerX = size / 2;
  const centerY = size / 2;
  
  const getFacePixels = () => {
    const pixels: JSX.Element[] = [];
    const faceColor = SKIN_TONES[skinTone];
    
    switch (faceShape) {
      case 'round':
        // Simple round face - just key pixels
        const roundPixels = [
          [0,0,1,1,1,1,1,1,1,1,1,1,1,1,0,0],
          [0,1,1,1,1,1,1,1,1,1,1,1,1,1,1,0],
          [1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1],
          [1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1],
          [1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1],
          [1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1],
          [1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1],
          [1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1],
          [1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1],
          [1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1],
          [1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1],
          [1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1],
          [0,1,1,1,1,1,1,1,1,1,1,1,1,1,1,0],
          [0,0,1,1,1,1,1,1,1,1,1,1,1,1,0,0]
        ];
        
        roundPixels.forEach((row, y) => {
          row.forEach((pixel, x) => {
            if (pixel) {
              pixels.push(
                <Rect
                  key={`${x}-${y}`}
                  x={x * pixelSize}
                  y={y * pixelSize}
                  width={pixelSize}
                  height={pixelSize}
                  fill={faceColor}
                />
              );
            }
          });
        });
        break;
        
      case 'oval':
        // Oval face
        for (let y = 0; y < 32; y++) {
          for (let x = 0; x < 32; x++) {
            const dx = (x - 16) * pixelSize;
            const dy = (y - 16) * pixelSize;
            const distance = Math.sqrt(dx * dx + dy * dy * 0.6); // More oval
            
            if (distance < size * 0.38) {
              pixels.push(
                <Rect
                  key={`${x}-${y}`}
                  x={x * pixelSize}
                  y={y * pixelSize}
                  width={pixelSize}
                  height={pixelSize}
                  fill={faceColor}
                />
              );
            }
          }
        }
        break;
        
      case 'square':
        // Square face - rectangular
        for (let y = 8; y < 24; y++) {
          for (let x = 6; x < 26; x++) {
            pixels.push(
              <Rect
                key={`${x}-${y}`}
                x={x * pixelSize}
                y={y * pixelSize}
                width={pixelSize}
                height={pixelSize}
                fill={faceColor}
              />
            );
          }
        }
        break;
        
      case 'heart':
        // Heart face - triangular with curves
        for (let y = 8; y < 28; y++) {
          for (let x = 4; x < 28; x++) {
            const dx = (x - 16) * pixelSize;
            const dy = (y - 16) * pixelSize;
            
            // Heart shape approximation
            const inHeart = (dx * dx + (dy - Math.abs(dx) * 0.8) * (dy - Math.abs(dx) * 0.8)) < size * 0.25;
            
            if (inHeart && y < 24) {
              pixels.push(
                <Rect
                  key={`${x}-${y}`}
                  x={x * pixelSize}
                  y={y * pixelSize}
                  width={pixelSize}
                  height={pixelSize}
                  fill={faceColor}
                />
              );
            }
          }
        }
        break;
        
      default:
        // Default oval
        for (let y = 0; y < 32; y++) {
          for (let x = 0; x < 32; x++) {
            const dx = (x - 16) * pixelSize;
            const dy = (y - 16) * pixelSize;
            const distance = Math.sqrt(dx * dx + dy * dy * 0.6);
            
            if (distance < size * 0.38) {
              pixels.push(
                <Rect
                  key={`${x}-${y}`}
                  x={x * pixelSize}
                  y={y * pixelSize}
                  width={pixelSize}
                  height={pixelSize}
                  fill={faceColor}
                />
              );
            }
          }
        }
    }
    
    return pixels;
  };

  const getFaceOutline = () => {
    const outlineColor = '#2F1B14'; // Dark brown outline
    
    return (
      <>
        {/* Simple face outline */}
        <Circle
          cx={centerX}
          cy={centerY}
          r={size * 0.35}
          fill="none"
          stroke={outlineColor}
          strokeWidth="2"
        />
      </>
    );
  };

  return (
    <Svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
      {/* Face pixels */}
      {getFacePixels()}
      
      {/* Face outline */}
      {getFaceOutline()}
    </Svg>
  );
};

export default Face8Bit;
