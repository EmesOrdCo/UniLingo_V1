import React from 'react';
import Svg, { Path, Ellipse, Defs, LinearGradient, Stop } from 'react-native-svg';
import { CharacterAppearance } from '../../types/character';

interface MouthProps {
  appearance: CharacterAppearance;
  size?: number;
}

const Mouth: React.FC<MouthProps> = ({ appearance, size = 200 }) => {
  const { expression } = appearance;
  
  const getMouthPath = () => {
    const centerX = size / 2;
    const centerY = size * 0.65;
    
    switch (expression) {
      case 'happy':
        return `M ${centerX - 22} ${centerY - 3} Q ${centerX} ${centerY + 18} ${centerX + 22} ${centerY - 3}`;
      
      case 'neutral':
        return `M ${centerX - 16} ${centerY + 2} L ${centerX + 16} ${centerY + 2}`;
      
      case 'wink':
        return `M ${centerX - 20} ${centerY - 3} Q ${centerX} ${centerY + 12} ${centerX + 20} ${centerY - 3}`;
      
      case 'surprised':
        return `M ${centerX - 10} ${centerY - 10} A 10 10 0 0 1 ${centerX + 10} ${centerY - 10} A 10 10 0 0 1 ${centerX - 10} ${centerY - 10}`;
      
      default:
        return `M ${centerX - 22} ${centerY - 3} Q ${centerX} ${centerY + 18} ${centerX + 22} ${centerY - 3}`;
    }
  };

  const getMouthStyle = () => {
    switch (expression) {
      case 'happy':
      case 'wink':
        return {
          fill: 'none',
          stroke: '#8B4513',
          strokeWidth: '2.5',
          strokeLinecap: 'round'
        };
      
      case 'neutral':
        return {
          fill: 'none',
          stroke: '#8B4513',
          strokeWidth: '2.5',
          strokeLinecap: 'round'
        };
      
      case 'surprised':
        return {
          fill: '#8B4513',
          stroke: '#654321',
          strokeWidth: '1.2'
        };
      
      default:
        return {
          fill: 'none',
          stroke: '#8B4513',
          strokeWidth: '2.5',
          strokeLinecap: 'round'
        };
    }
  };

  const getTeeth = () => {
    if (expression !== 'happy' && expression !== 'wink') return null;
    
    const centerX = size / 2;
    const centerY = size * 0.65;
    
    return (
      <>
        {/* Top teeth */}
        <Path
          d={`M ${centerX - 8} ${centerY - 3} L ${centerX - 4} ${centerY + 5} L ${centerX} ${centerY + 3} L ${centerX + 4} ${centerY + 5} L ${centerX + 8} ${centerY - 3}`}
          fill="#FFFFFF"
          stroke="#E0E0E0"
          strokeWidth="0.5"
        />
      </>
    );
  };

  const getMouthShadow = () => {
    const centerX = size / 2;
    const centerY = size * 0.65;
    
    return (
      <Path
        d={getMouthPath()}
        fill="#000000"
        opacity="0.1"
        transform={`translate(1, 1)`}
      />
    );
  };

  const getMouthHighlight = () => {
    if (expression !== 'happy' && expression !== 'wink') return null;
    
    const centerX = size / 2;
    const centerY = size * 0.65;
    
    return (
      <Path
        d={`M ${centerX - 15} ${centerY - 1} Q ${centerX} ${centerY + 8} ${centerX + 15} ${centerY - 1}`}
        fill="#FFFFFF"
        opacity="0.2"
      />
    );
  };

  return (
    <Svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
      {/* Mouth shadow */}
      {getMouthShadow()}
      
      {/* Main mouth */}
      <Path
        d={getMouthPath()}
        {...getMouthStyle()}
      />
      
      {/* Teeth */}
      {getTeeth()}
      
      {/* Mouth highlight */}
      {getMouthHighlight()}
    </Svg>
  );
};

export default Mouth;
