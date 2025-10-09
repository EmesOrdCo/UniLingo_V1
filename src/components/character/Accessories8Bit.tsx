import React from 'react';
import Svg, { Rect, Circle } from 'react-native-svg';
import { CharacterAppearance, ACCESSORY_COLORS } from '../../types/character';

interface AccessoriesProps {
  appearance: CharacterAppearance;
  size?: number;
}

const Accessories8Bit: React.FC<AccessoriesProps> = ({ appearance, size = 200 }) => {
  const { accessories } = appearance;
  
  // 8-bit pixel grid system
  const pixelSize = size / 32;
  const centerX = size / 2;
  const centerY = size / 2;
  
  const getGlasses = () => {
    if (!accessories.includes('glasses')) return null;
    
    const glassesPixels: JSX.Element[] = [];
    
    // Left lens
    for (let y = 12; y < 18; y++) {
      for (let x = 10; x < 16; x++) {
        glassesPixels.push(
          <Rect
            key={`glasses-left-${x}-${y}`}
            x={x * pixelSize}
            y={y * pixelSize}
            width={pixelSize}
            height={pixelSize}
            fill="#2F2F2F"
          />
        );
      }
    }
    
    // Right lens
    for (let y = 12; y < 18; y++) {
      for (let x = 16; x < 22; x++) {
        glassesPixels.push(
          <Rect
            key={`glasses-right-${x}-${y}`}
            x={x * pixelSize}
            y={y * pixelSize}
            width={pixelSize}
            height={pixelSize}
            fill="#2F2F2F"
          />
        );
      }
    }
    
    // Bridge
    for (let x = 14; x < 18; x++) {
      glassesPixels.push(
        <Rect
          key={`glasses-bridge-${x}`}
          x={x * pixelSize}
          y={15 * pixelSize}
          width={pixelSize}
          height={pixelSize}
          fill="#2F2F2F"
        />
      );
    }
    
    return glassesPixels;
  };

  const getHat = () => {
    if (!accessories.includes('hat')) return null;
    
    const hatPixels: JSX.Element[] = [];
    
    // Hat base
    for (let y = 4; y < 8; y++) {
      for (let x = 8; x < 24; x++) {
        hatPixels.push(
          <Rect
            key={`hat-base-${x}-${y}`}
            x={x * pixelSize}
            y={y * pixelSize}
            width={pixelSize}
            height={pixelSize}
            fill="#8B4513"
          />
        );
      }
    }
    
    // Hat crown
    for (let y = 0; y < 4; y++) {
      for (let x = 10; x < 22; x++) {
        hatPixels.push(
          <Rect
            key={`hat-crown-${x}-${y}`}
            x={x * pixelSize}
            y={y * pixelSize}
            width={pixelSize}
            height={pixelSize}
            fill="#8B4513"
          />
        );
      }
    }
    
    return hatPixels;
  };

  const getEarrings = () => {
    if (!accessories.includes('earrings')) return null;
    
    return (
      <>
        {/* Left earring */}
        <Rect
          x={8 * pixelSize}
          y={18 * pixelSize}
          width={pixelSize}
          height={pixelSize}
          fill={ACCESSORY_COLORS.gold}
        />
        <Rect
          x={8 * pixelSize}
          y={19 * pixelSize}
          width={pixelSize}
          height={pixelSize}
          fill={ACCESSORY_COLORS.gold}
        />
        
        {/* Right earring */}
        <Rect
          x={23 * pixelSize}
          y={18 * pixelSize}
          width={pixelSize}
          height={pixelSize}
          fill={ACCESSORY_COLORS.gold}
        />
        <Rect
          x={23 * pixelSize}
          y={19 * pixelSize}
          width={pixelSize}
          height={pixelSize}
          fill={ACCESSORY_COLORS.gold}
        />
      </>
    );
  };

  const getNecklace = () => {
    if (!accessories.includes('necklace')) return null;
    
    const necklacePixels: JSX.Element[] = [];
    
    // Necklace chain
    for (let x = 12; x < 20; x++) {
      necklacePixels.push(
        <Rect
          key={`necklace-${x}`}
          x={x * pixelSize}
          y={22 * pixelSize}
          width={pixelSize}
          height={pixelSize}
          fill={ACCESSORY_COLORS.silver}
        />
      );
    }
    
    // Pendant
    for (let y = 23; y < 25; y++) {
      for (let x = 15; x < 17; x++) {
        necklacePixels.push(
          <Rect
            key={`pendant-${x}-${y}`}
            x={x * pixelSize}
            y={y * pixelSize}
            width={pixelSize}
            height={pixelSize}
            fill={ACCESSORY_COLORS.gold}
          />
        );
      }
    }
    
    return necklacePixels;
  };

  return (
    <Svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
      {/* Hat (rendered first, behind other accessories) */}
      {getHat()}
      
      {/* Glasses */}
      {getGlasses()}
      
      {/* Earrings */}
      {getEarrings()}
      
      {/* Necklace */}
      {getNecklace()}
    </Svg>
  );
};

export default Accessories8Bit;
