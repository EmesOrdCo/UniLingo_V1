import React from 'react';
import Svg, { Rect, Circle, Path } from 'react-native-svg';
import { CharacterAppearance } from '../../types/character';

interface MouthProps {
  appearance: CharacterAppearance;
  size?: number;
}

const MouthSimple: React.FC<MouthProps> = ({ appearance, size = 200 }) => {
  const { expression } = appearance;
  
  const centerX = size / 2;
  const centerY = size * 0.65;
  
  const getMouth = () => {
    switch (expression) {
      case 'happy':
        return (
          <Path
            d={`M ${centerX - size * 0.08} ${centerY - size * 0.02} 
                 Q ${centerX} ${centerY + size * 0.06} ${centerX + size * 0.08} ${centerY - size * 0.02}`}
            stroke="#8B4513"
            strokeWidth="3"
            fill="none"
            strokeLinecap="round"
          />
        );
        
      case 'neutral':
        return (
          <Rect
            x={centerX - size * 0.06}
            y={centerY}
            width={size * 0.12}
            height={size * 0.02}
            fill="#8B4513"
          />
        );
        
      case 'wink':
        return (
          <Path
            d={`M ${centerX - size * 0.07} ${centerY - size * 0.01} 
                 Q ${centerX} ${centerY + size * 0.04} ${centerX + size * 0.07} ${centerY - size * 0.01}`}
            stroke="#8B4513"
            strokeWidth="3"
            fill="none"
            strokeLinecap="round"
          />
        );
        
      case 'surprised':
        return (
          <Circle
            cx={centerX}
            cy={centerY}
            r={size * 0.03}
            fill="#8B4513"
          />
        );
        
      default:
        return (
          <Path
            d={`M ${centerX - size * 0.08} ${centerY - size * 0.02} 
                 Q ${centerX} ${centerY + size * 0.06} ${centerX + size * 0.08} ${centerY - size * 0.02}`}
            stroke="#8B4513"
            strokeWidth="3"
            fill="none"
            strokeLinecap="round"
          />
        );
    }
  };

  return (
    <Svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
      {getMouth()}
    </Svg>
  );
};

export default MouthSimple;
