import React from 'react';
import Svg, { Rect, Path, Circle } from 'react-native-svg';
import { CharacterAppearance, SHIRT_COLORS } from '../../types/character';

interface ShirtProps {
  appearance: CharacterAppearance;
  size?: number;
}

const ShirtSimple: React.FC<ShirtProps> = ({ appearance, size = 200 }) => {
  const { shirtStyle, shirtColor } = appearance;
  
  const shirtColorValue = SHIRT_COLORS[shirtColor];
  const centerX = size / 2;
  const centerY = size / 2;
  
  const getShirtShape = () => {
    switch (shirtStyle) {
      case 'casual':
        return (
          <Path
            d={`M ${centerX - size * 0.35} ${centerY + size * 0.2} 
                 L ${centerX - size * 0.25} ${centerY + size * 0.1}
                 L ${centerX + size * 0.25} ${centerY + size * 0.1}
                 L ${centerX + size * 0.35} ${centerY + size * 0.2}
                 L ${centerX + size * 0.35} ${centerY + size * 0.5}
                 L ${centerX - size * 0.35} ${centerY + size * 0.5} Z`}
            fill={shirtColorValue}
            stroke="#2F1B14"
            strokeWidth="1"
          />
        );
        
      case 'formal':
        return (
          <Path
            d={`M ${centerX - size * 0.3} ${centerY + size * 0.15} 
                 L ${centerX - size * 0.2} ${centerY + size * 0.05}
                 L ${centerX + size * 0.2} ${centerY + size * 0.05}
                 L ${centerX + size * 0.3} ${centerY + size * 0.15}
                 L ${centerX + size * 0.3} ${centerY + size * 0.5}
                 L ${centerX - size * 0.3} ${centerY + size * 0.5} Z`}
            fill={shirtColorValue}
            stroke="#2F1B14"
            strokeWidth="1"
          />
        );
        
      case 'hoodie':
        return (
          <>
            <Path
              d={`M ${centerX - size * 0.35} ${centerY + size * 0.2} 
                   L ${centerX - size * 0.25} ${centerY + size * 0.1}
                   L ${centerX + size * 0.25} ${centerY + size * 0.1}
                   L ${centerX + size * 0.35} ${centerY + size * 0.2}
                   L ${centerX + size * 0.35} ${centerY + size * 0.5}
                   L ${centerX - size * 0.35} ${centerY + size * 0.5} Z`}
              fill={shirtColorValue}
              stroke="#2F1B14"
              strokeWidth="1"
            />
            <Path
              d={`M ${centerX - size * 0.3} ${centerY + size * 0.05} 
                   L ${centerX - size * 0.2} ${centerY - size * 0.05}
                   L ${centerX + size * 0.2} ${centerY - size * 0.05}
                   L ${centerX + size * 0.3} ${centerY + size * 0.05}
                   L ${centerX + size * 0.3} ${centerY + size * 0.15}
                   L ${centerX - size * 0.3} ${centerY + size * 0.15} Z`}
              fill={shirtColorValue}
              stroke="#2F1B14"
              strokeWidth="1"
            />
          </>
        );
        
      case 'dress':
        return (
          <Path
            d={`M ${centerX - size * 0.3} ${centerY + size * 0.15} 
                 L ${centerX - size * 0.2} ${centerY + size * 0.05}
                 L ${centerX + size * 0.2} ${centerY + size * 0.05}
                 L ${centerX + size * 0.3} ${centerY + size * 0.15}
                 L ${centerX + size * 0.3} ${centerY + size * 0.6}
                 L ${centerX - size * 0.3} ${centerY + size * 0.6} Z`}
            fill={shirtColorValue}
            stroke="#2F1B14"
            strokeWidth="1"
          />
        );
        
      case 'tank':
        return (
          <Path
            d={`M ${centerX - size * 0.25} ${centerY + size * 0.2} 
                 L ${centerX - size * 0.15} ${centerY + size * 0.1}
                 L ${centerX + size * 0.15} ${centerY + size * 0.1}
                 L ${centerX + size * 0.25} ${centerY + size * 0.2}
                 L ${centerX + size * 0.25} ${centerY + size * 0.4}
                 L ${centerX - size * 0.25} ${centerY + size * 0.4} Z`}
            fill={shirtColorValue}
            stroke="#2F1B14"
            strokeWidth="1"
          />
        );
        
      default:
        return (
          <Path
            d={`M ${centerX - size * 0.35} ${centerY + size * 0.2} 
                 L ${centerX - size * 0.25} ${centerY + size * 0.1}
                 L ${centerX + size * 0.25} ${centerY + size * 0.1}
                 L ${centerX + size * 0.35} ${centerY + size * 0.2}
                 L ${centerX + size * 0.35} ${centerY + size * 0.5}
                 L ${centerX - size * 0.35} ${centerY + size * 0.5} Z`}
            fill={shirtColorValue}
            stroke="#2F1B14"
            strokeWidth="1"
          />
        );
    }
  };

  return (
    <Svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
      {getShirtShape()}
    </Svg>
  );
};

export default ShirtSimple;
