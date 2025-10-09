import React from 'react';
import Svg, { Rect, Circle } from 'react-native-svg';
import { CharacterAppearance } from '../../types/character';

interface EyesProps {
  appearance: CharacterAppearance;
  size?: number;
}

const Eyes8Bit: React.FC<EyesProps> = ({ appearance, size = 200 }) => {
  const { eyeColor, eyeShape, expression } = appearance;
  
  // 8-bit pixel grid system
  const pixelSize = size / 32;
  const centerX = size / 2;
  const centerY = size * 0.4;
  
  const getEyePixels = (eyeX: number, eyeY: number) => {
    const pixels: JSX.Element[] = [];
    
    // Eye size based on shape
    const eyeWidth = eyeShape === 'narrow' ? 6 : eyeShape === 'wide' ? 10 : 8;
    const eyeHeight = eyeShape === 'narrow' ? 4 : eyeShape === 'wide' ? 6 : 5;
    
    // White eye background
    for (let y = 0; y < eyeHeight; y++) {
      for (let x = 0; x < eyeWidth; x++) {
        pixels.push(
          <Rect
            key={`eye-${x}-${y}`}
            x={(eyeX - eyeWidth/2 + x) * pixelSize}
            y={(eyeY - eyeHeight/2 + y) * pixelSize}
            width={pixelSize}
            height={pixelSize}
            fill="#FFFFFF"
          />
        );
      }
    }
    
    // Eye outline
    for (let y = 0; y < eyeHeight; y++) {
      for (let x = 0; x < eyeWidth; x++) {
        if (x === 0 || x === eyeWidth - 1 || y === 0 || y === eyeHeight - 1) {
          pixels.push(
            <Rect
              key={`outline-${x}-${y}`}
              x={(eyeX - eyeWidth/2 + x) * pixelSize}
              y={(eyeY - eyeHeight/2 + y) * pixelSize}
              width={pixelSize}
              height={pixelSize}
              fill="#2F1B14"
            />
          );
        }
      }
    }
    
    // Iris
    if (expression !== 'wink') {
      const irisSize = 3;
      for (let y = 1; y < eyeHeight - 1; y++) {
        for (let x = 1; x < eyeWidth - 1; x++) {
          if (x >= (eyeWidth - irisSize) / 2 && x < (eyeWidth + irisSize) / 2 &&
              y >= (eyeHeight - irisSize) / 2 && y < (eyeHeight + irisSize) / 2) {
            pixels.push(
              <Rect
                key={`iris-${x}-${y}`}
                x={(eyeX - eyeWidth/2 + x) * pixelSize}
                y={(eyeY - eyeHeight/2 + y) * pixelSize}
                width={pixelSize}
                height={pixelSize}
                fill={eyeColor}
              />
            );
          }
        }
      }
      
      // Pupil
      const pupilX = eyeX;
      const pupilY = eyeY;
      pixels.push(
        <Rect
          key="pupil"
          x={(pupilX - 0.5) * pixelSize}
          y={(pupilY - 0.5) * pixelSize}
          width={pixelSize}
          height={pixelSize}
          fill="#000000"
        />
      );
    }
    
    return pixels;
  };

  const getWinkEye = (eyeX: number, eyeY: number) => {
    if (expression !== 'wink') return null;
    
    return (
      <>
        {/* Wink line */}
        {[0, 1, 2, 3, 4, 5, 6].map(x => (
          <Rect
            key={`wink-${x}`}
            x={(eyeX - 3 + x) * pixelSize}
            y={eyeY * pixelSize}
            width={pixelSize}
            height={pixelSize}
            fill="#2F1B14"
          />
        ))}
      </>
    );
  };

  const getEyebrows = (eyeX: number, eyeY: number) => {
    const eyebrowY = eyeY - 3;
    
    if (expression === 'surprised') {
      // Raised eyebrows
      return (
        <>
          {[-3, -2, -1, 0, 1, 2, 3].map(x => (
            <Rect
              key={`brow-${x}`}
              x={(eyeX + x) * pixelSize}
              y={(eyebrowY - 1) * pixelSize}
              width={pixelSize}
              height={pixelSize}
              fill="#8B4513"
            />
          ))}
        </>
      );
    }
    
    // Normal eyebrows
    return (
      <>
        {[-3, -2, -1, 0, 1, 2, 3].map(x => (
          <Rect
            key={`brow-${x}`}
            x={(eyeX + x) * pixelSize}
            y={eyebrowY * pixelSize}
            width={pixelSize}
            height={pixelSize}
            fill="#8B4513"
          />
        ))}
      </>
    );
  };

  return (
    <Svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
      {/* Left eyebrow */}
      {getEyebrows(size * 0.35 / pixelSize, size * 0.35 / pixelSize)}
      
      {/* Right eyebrow */}
      {getEyebrows(size * 0.65 / pixelSize, size * 0.35 / pixelSize)}
      
      {/* Left eye */}
      {getEyePixels(size * 0.35 / pixelSize, size * 0.4 / pixelSize)}
      {getWinkEye(size * 0.35 / pixelSize, size * 0.4 / pixelSize)}
      
      {/* Right eye */}
      {getEyePixels(size * 0.65 / pixelSize, size * 0.4 / pixelSize)}
      {getWinkEye(size * 0.65 / pixelSize, size * 0.4 / pixelSize)}
    </Svg>
  );
};

export default Eyes8Bit;
