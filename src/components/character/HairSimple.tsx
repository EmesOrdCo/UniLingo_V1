import React from 'react';
import Svg, { Rect, Path, Circle } from 'react-native-svg';
import { CharacterAppearance, HAIR_COLORS } from '../../types/character';

interface HairProps {
  appearance: CharacterAppearance;
  size?: number;
}

const HairSimple: React.FC<HairProps> = ({ appearance, size = 200 }) => {
  const { hairStyle, hairColor } = appearance;
  
  const hairColorValue = HAIR_COLORS[hairColor];
  const centerX = size / 2;
  const centerY = size / 2;
  
  const getHairShape = () => {
    switch (hairStyle) {
      case 'short':
        return (
          <Path
            d={`M ${centerX - size * 0.4} ${centerY - size * 0.3} 
                 Q ${centerX} ${centerY - size * 0.45} ${centerX + size * 0.4} ${centerY - size * 0.3}
                 L ${centerX + size * 0.4} ${centerY - size * 0.15}
                 Q ${centerX} ${centerY - size * 0.2} ${centerX - size * 0.4} ${centerY - size * 0.15} Z`}
            fill={hairColorValue}
            stroke="#2F1B14"
            strokeWidth="1"
          />
        );
        
      case 'medium':
        return (
          <Path
            d={`M ${centerX - size * 0.4} ${centerY - size * 0.35} 
                 Q ${centerX} ${centerY - size * 0.5} ${centerX + size * 0.4} ${centerY - size * 0.35}
                 L ${centerX + size * 0.4} ${centerY - size * 0.1}
                 Q ${centerX} ${centerY - size * 0.15} ${centerX - size * 0.4} ${centerY - size * 0.1} Z`}
            fill={hairColorValue}
            stroke="#2F1B14"
            strokeWidth="1"
          />
        );
        
      case 'long':
        return (
          <Path
            d={`M ${centerX - size * 0.4} ${centerY - size * 0.4} 
                 Q ${centerX} ${centerY - size * 0.55} ${centerX + size * 0.4} ${centerY - size * 0.4}
                 L ${centerX + size * 0.4} ${centerY + size * 0.1}
                 Q ${centerX} ${centerY + size * 0.15} ${centerX - size * 0.4} ${centerY + size * 0.1} Z`}
            fill={hairColorValue}
            stroke="#2F1B14"
            strokeWidth="1"
          />
        );
        
      case 'curly':
        return (
          <Path
            d={`M ${centerX - size * 0.4} ${centerY - size * 0.35} 
                 Q ${centerX - size * 0.2} ${centerY - size * 0.5} ${centerX} ${centerY - size * 0.35}
                 Q ${centerX + size * 0.2} ${centerY - size * 0.5} ${centerX + size * 0.4} ${centerY - size * 0.35}
                 L ${centerX + size * 0.4} ${centerY - size * 0.1}
                 Q ${centerX} ${centerY - size * 0.15} ${centerX - size * 0.4} ${centerY - size * 0.1} Z`}
            fill={hairColorValue}
            stroke="#2F1B14"
            strokeWidth="1"
          />
        );
        
      case 'afro':
        return (
          <Circle
            cx={centerX}
            cy={centerY - size * 0.25}
            r={size * 0.45}
            fill={hairColorValue}
            stroke="#2F1B14"
            strokeWidth="1"
          />
        );
        
      case 'bald':
        return null;
        
      default:
        return (
          <Path
            d={`M ${centerX - size * 0.4} ${centerY - size * 0.35} 
                 Q ${centerX} ${centerY - size * 0.5} ${centerX + size * 0.4} ${centerY - size * 0.35}
                 L ${centerX + size * 0.4} ${centerY - size * 0.1}
                 Q ${centerX} ${centerY - size * 0.15} ${centerX - size * 0.4} ${centerY - size * 0.1} Z`}
            fill={hairColorValue}
            stroke="#2F1B14"
            strokeWidth="1"
          />
        );
    }
  };

  if (hairStyle === 'bald') {
    return null;
  }

  return (
    <Svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
      {getHairShape()}
    </Svg>
  );
};

export default HairSimple;
