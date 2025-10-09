import React from 'react';
import Svg, { Rect, Circle } from 'react-native-svg';
import { CharacterAppearance, ACCESSORY_COLORS } from '../../types/character';

interface AccessoriesProps {
  appearance: CharacterAppearance;
  size?: number;
}

const AccessoriesSimple: React.FC<AccessoriesProps> = ({ appearance, size = 200 }) => {
  const { accessories } = appearance;
  
  const centerX = size / 2;
  const centerY = size / 2;
  
  const getGlasses = () => {
    if (!accessories.includes('glasses')) return null;
    
    return (
      <>
        {/* Left lens */}
        <Rect
          x={centerX - size * 0.25}
          y={centerY - size * 0.05}
          width={size * 0.1}
          height={size * 0.06}
          fill="#2F2F2F"
          stroke="#2F1B14"
          strokeWidth="1"
        />
        {/* Right lens */}
        <Rect
          x={centerX + size * 0.15}
          y={centerY - size * 0.05}
          width={size * 0.1}
          height={size * 0.06}
          fill="#2F2F2F"
          stroke="#2F1B14"
          strokeWidth="1"
        />
        {/* Bridge */}
        <Rect
          x={centerX - size * 0.02}
          y={centerY - size * 0.03}
          width={size * 0.04}
          height={size * 0.02}
          fill="#2F2F2F"
          stroke="#2F1B14"
          strokeWidth="1"
        />
      </>
    );
  };

  const getHat = () => {
    if (!accessories.includes('hat')) return null;
    
    return (
      <>
        {/* Hat base */}
        <Rect
          x={centerX - size * 0.4}
          y={centerY - size * 0.45}
          width={size * 0.8}
          height={size * 0.08}
          fill="#8B4513"
          stroke="#2F1B14"
          strokeWidth="1"
        />
        {/* Hat crown */}
        <Rect
          x={centerX - size * 0.3}
          y={centerY - size * 0.5}
          width={size * 0.6}
          height={size * 0.05}
          fill="#8B4513"
          stroke="#2F1B14"
          strokeWidth="1"
        />
      </>
    );
  };

  const getEarrings = () => {
    if (!accessories.includes('earrings')) return null;
    
    return (
      <>
        {/* Left earring */}
        <Circle
          cx={centerX - size * 0.35}
          cy={centerY + size * 0.05}
          r={size * 0.02}
          fill={ACCESSORY_COLORS.gold}
        />
        {/* Right earring */}
        <Circle
          cx={centerX + size * 0.35}
          cy={centerY + size * 0.05}
          r={size * 0.02}
          fill={ACCESSORY_COLORS.gold}
        />
      </>
    );
  };

  const getNecklace = () => {
    if (!accessories.includes('necklace')) return null;
    
    return (
      <>
        {/* Chain */}
        <Rect
          x={centerX - size * 0.15}
          y={centerY + size * 0.15}
          width={size * 0.3}
          height={size * 0.02}
          fill={ACCESSORY_COLORS.silver}
        />
        {/* Pendant */}
        <Circle
          cx={centerX}
          cy={centerY + size * 0.2}
          r={size * 0.03}
          fill={ACCESSORY_COLORS.gold}
        />
      </>
    );
  };

  return (
    <Svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
      {getHat()}
      {getGlasses()}
      {getEarrings()}
      {getNecklace()}
    </Svg>
  );
};

export default AccessoriesSimple;
