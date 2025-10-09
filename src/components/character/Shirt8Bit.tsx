import React from 'react';
import Svg, { Rect } from 'react-native-svg';
import { CharacterAppearance, SHIRT_COLORS } from '../../types/character';

interface ShirtProps {
  appearance: CharacterAppearance;
  size?: number;
}

const Shirt8Bit: React.FC<ShirtProps> = ({ appearance, size = 200 }) => {
  const { shirtStyle, shirtColor } = appearance;
  
  // 8-bit pixel grid system
  const pixelSize = size / 32;
  const centerX = size / 2;
  const centerY = size / 2;
  
  const getShirtPixels = () => {
    const pixels: JSX.Element[] = [];
    const shirtColorValue = SHIRT_COLORS[shirtColor];
    
    switch (shirtStyle) {
      case 'casual':
        // Casual shirt - simple rectangular
        for (let y = 16; y < 28; y++) {
          for (let x = 6; x < 26; x++) {
            pixels.push(
              <Rect
                key={`${x}-${y}`}
                x={x * pixelSize}
                y={y * pixelSize}
                width={pixelSize}
                height={pixelSize}
                fill={shirtColorValue}
              />
            );
          }
        }
        break;
        
      case 'formal':
        // Formal shirt - with collar
        for (let y = 16; y < 28; y++) {
          for (let x = 8; x < 24; x++) {
            pixels.push(
              <Rect
                key={`${x}-${y}`}
                x={x * pixelSize}
                y={y * pixelSize}
                width={pixelSize}
                height={pixelSize}
                fill={shirtColorValue}
              />
            );
          }
        }
        // Collar
        for (let x = 12; x < 20; x++) {
          pixels.push(
            <Rect
              key={`collar-${x}`}
              x={x * pixelSize}
              y={16 * pixelSize}
              width={pixelSize}
              height={pixelSize}
              fill="#FFFFFF"
            />
          );
        }
        break;
        
      case 'hoodie':
        // Hoodie - with hood
        for (let y = 16; y < 28; y++) {
          for (let x = 6; x < 26; x++) {
            pixels.push(
              <Rect
                key={`${x}-${y}`}
                x={x * pixelSize}
                y={y * pixelSize}
                width={pixelSize}
                height={pixelSize}
                fill={shirtColorValue}
              />
            );
          }
        }
        // Hood
        for (let y = 8; y < 16; y++) {
          for (let x = 8; x < 24; x++) {
            pixels.push(
              <Rect
                key={`hood-${x}-${y}`}
                x={x * pixelSize}
                y={y * pixelSize}
                width={pixelSize}
                height={pixelSize}
                fill={shirtColorValue}
              />
            );
          }
        }
        break;
        
      case 'dress':
        // Dress - longer and wider
        for (let y = 16; y < 30; y++) {
          for (let x = 8; x < 24; x++) {
            pixels.push(
              <Rect
                key={`${x}-${y}`}
                x={x * pixelSize}
                y={y * pixelSize}
                width={pixelSize}
                height={pixelSize}
                fill={shirtColorValue}
              />
            );
          }
        }
        break;
        
      case 'tank':
        // Tank top - narrower
        for (let y = 16; y < 26; y++) {
          for (let x = 10; x < 22; x++) {
            pixels.push(
              <Rect
                key={`${x}-${y}`}
                x={x * pixelSize}
                y={y * pixelSize}
                width={pixelSize}
                height={pixelSize}
                fill={shirtColorValue}
              />
            );
          }
        }
        break;
        
      default:
        // Default casual shirt
        for (let y = 16; y < 28; y++) {
          for (let x = 6; x < 26; x++) {
            pixels.push(
              <Rect
                key={`${x}-${y}`}
                x={x * pixelSize}
                y={y * pixelSize}
                width={pixelSize}
                height={pixelSize}
                fill={shirtColorValue}
              />
            );
          }
        }
    }
    
    return pixels;
  };

  return (
    <Svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
      {/* Shirt pixels */}
      {getShirtPixels()}
    </Svg>
  );
};

export default Shirt8Bit;
