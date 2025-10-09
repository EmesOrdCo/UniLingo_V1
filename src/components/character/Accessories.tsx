import React from 'react';
import Svg, { Path, Circle, Ellipse, Defs, LinearGradient, Stop, RadialGradient } from 'react-native-svg';
import { CharacterAppearance } from '../../types/character';

interface AccessoriesProps {
  appearance: CharacterAppearance;
  size?: number;
}

const Accessories: React.FC<AccessoriesProps> = ({ appearance, size = 200 }) => {
  const { accessories } = appearance;
  
  // Helper functions for color manipulation
  const lightenColor = (color: string, percent: number) => {
    const num = parseInt(color.replace("#", ""), 16);
    const amt = Math.round(2.55 * percent);
    const R = (num >> 16) + amt;
    const G = (num >> 8 & 0x00FF) + amt;
    const B = (num & 0x0000FF) + amt;
    return "#" + (0x1000000 + (R < 255 ? R < 1 ? 0 : R : 255) * 0x10000 +
      (G < 255 ? G < 1 ? 0 : G : 255) * 0x100 +
      (B < 255 ? B < 1 ? 0 : B : 255)).toString(16).slice(1);
  };

  const darkenColor = (color: string, percent: number) => {
    const num = parseInt(color.replace("#", ""), 16);
    const amt = Math.round(2.55 * percent);
    const R = (num >> 16) - amt;
    const G = (num >> 8 & 0x00FF) - amt;
    const B = (num & 0x0000FF) - amt;
    return "#" + (0x1000000 + (R > 255 ? 255 : R < 0 ? 0 : R) * 0x10000 +
      (G > 255 ? 255 : G < 0 ? 0 : G) * 0x100 +
      (B > 255 ? 255 : B < 0 ? 0 : B)).toString(16).slice(1);
  };

  const getGlasses = () => {
    if (!accessories.includes('glasses')) return null;
    
    const centerX = size / 2;
    const centerY = size * 0.4;
    
    return (
      <>
        {/* Glasses shadow */}
        <Path
          d={`M ${centerX - 25} ${centerY - 8} A 12 10 0 0 1 ${centerX - 25} ${centerY + 8} A 12 10 0 0 1 ${centerX - 25} ${centerY - 8}`}
          fill="#000000"
          opacity="0.1"
          transform={`translate(1, 1)`}
        />
        <Path
          d={`M ${centerX + 25} ${centerY - 8} A 12 10 0 0 1 ${centerX + 25} ${centerY + 8} A 12 10 0 0 1 ${centerX + 25} ${centerY - 8}`}
          fill="#000000"
          opacity="0.1"
          transform={`translate(1, 1)`}
        />
        
        {/* Glasses frames */}
        <Path
          d={`M ${centerX - 25} ${centerY - 8} A 12 10 0 0 1 ${centerX - 25} ${centerY + 8} A 12 10 0 0 1 ${centerX - 25} ${centerY - 8}`}
          fill="none"
          stroke="#2C2C2C"
          strokeWidth="2"
        />
        <Path
          d={`M ${centerX + 25} ${centerY - 8} A 12 10 0 0 1 ${centerX + 25} ${centerY + 8} A 12 10 0 0 1 ${centerX + 25} ${centerY - 8}`}
          fill="none"
          stroke="#2C2C2C"
          strokeWidth="2"
        />
        
        {/* Bridge */}
        <Path
          d={`M ${centerX - 13} ${centerY} L ${centerX + 13} ${centerY}`}
          stroke="#2C2C2C"
          strokeWidth="2"
          strokeLinecap="round"
        />
        
        {/* Temple arms */}
        <Path
          d={`M ${centerX - 37} ${centerY} L ${centerX - 45} ${centerY - 5} L ${centerX - 50} ${centerY - 10}`}
          stroke="#2C2C2C"
          strokeWidth="2"
          strokeLinecap="round"
        />
        <Path
          d={`M ${centerX + 37} ${centerY} L ${centerX + 45} ${centerY - 5} L ${centerX + 50} ${centerY - 10}`}
          stroke="#2C2C2C"
          strokeWidth="2"
          strokeLinecap="round"
        />
        
        {/* Lens highlights */}
        <Ellipse
          cx={centerX - 25}
          cy={centerY - 3}
          rx={4}
          ry={3}
          fill="#FFFFFF"
          opacity="0.6"
        />
        <Ellipse
          cx={centerX + 25}
          cy={centerY - 3}
          rx={4}
          ry={3}
          fill="#FFFFFF"
          opacity="0.6"
        />
      </>
    );
  };

  const getHat = () => {
    if (!accessories.includes('hat')) return null;
    
    const centerX = size / 2;
    const centerY = size * 0.3;
    
    return (
      <>
        {/* Hat shadow */}
        <Ellipse
          cx={centerX}
          cy={centerY + 5}
          rx={size * 0.3}
          ry={size * 0.08}
          fill="#000000"
          opacity="0.15"
        />
        
        {/* Hat base */}
        <Path
          d={`M ${centerX - 60} ${centerY + 10} Q ${centerX} ${centerY + 20} ${centerX + 60} ${centerY + 10}`}
          fill="#8B4513"
          stroke="#654321"
          strokeWidth="1"
        />
        
        {/* Hat crown */}
        <Path
          d={`M ${centerX - 50} ${centerY + 10} Q ${centerX - 40} ${centerY - 20} ${centerX} ${centerY - 25} Q ${centerX + 40} ${centerY - 20} ${centerX + 50} ${centerY + 10}`}
          fill="#8B4513"
          stroke="#654321"
          strokeWidth="1"
        />
        
        {/* Hat band */}
        <Path
          d={`M ${centerX - 45} ${centerY + 5} Q ${centerX} ${centerY + 8} ${centerX + 45} ${centerY + 5}`}
          fill="#654321"
          stroke="#4A2C17"
          strokeWidth="1"
        />
        
        {/* Hat highlight */}
        <Ellipse
          cx={centerX}
          cy={centerY - 10}
          rx={size * 0.2}
          ry={size * 0.04}
          fill="#A0522D"
          opacity="0.4"
        />
      </>
    );
  };

  const getEarrings = () => {
    if (!accessories.includes('earrings')) return null;
    
    const centerX = size / 2;
    const centerY = size * 0.45;
    
    return (
      <>
        {/* Left earring */}
        <Circle
          cx={centerX - 65}
          cy={centerY + 5}
          r={3}
          fill="#FFD700"
          stroke="#DAA520"
          strokeWidth="1"
        />
        <Circle
          cx={centerX - 65}
          cy={centerY + 10}
          r={2}
          fill="#FFD700"
          stroke="#DAA520"
          strokeWidth="0.5"
        />
        
        {/* Right earring */}
        <Circle
          cx={centerX + 65}
          cy={centerY + 5}
          r={3}
          fill="#FFD700"
          stroke="#DAA520"
          strokeWidth="1"
        />
        <Circle
          cx={centerX + 65}
          cy={centerY + 10}
          r={2}
          fill="#FFD700"
          stroke="#DAA520"
          strokeWidth="0.5"
        />
        
        {/* Earring highlights */}
        <Circle
          cx={centerX - 64}
          cy={centerY + 4}
          r={1}
          fill="#FFFFFF"
          opacity="0.8"
        />
        <Circle
          cx={centerX + 66}
          cy={centerY + 4}
          r={1}
          fill="#FFFFFF"
          opacity="0.8"
        />
      </>
    );
  };

  const getNecklace = () => {
    if (!accessories.includes('necklace')) return null;
    
    const centerX = size / 2;
    const centerY = size * 0.55;
    
    return (
      <>
        {/* Necklace chain */}
        <Path
          d={`M ${centerX - 30} ${centerY} Q ${centerX} ${centerY + 5} ${centerX + 30} ${centerY}`}
          stroke="#C0C0C0"
          strokeWidth="2"
          fill="none"
          strokeLinecap="round"
        />
        
        {/* Pendant */}
        <Ellipse
          cx={centerX}
          cy={centerY + 8}
          rx={6}
          ry={8}
          fill="#FFD700"
          stroke="#DAA520"
          strokeWidth="1"
        />
        
        {/* Pendant highlight */}
        <Ellipse
          cx={centerX - 1}
          cy={centerY + 6}
          rx={2}
          ry={3}
          fill="#FFFFFF"
          opacity="0.6"
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

export default Accessories;
