import React from 'react';
import Svg, { Rect, Circle } from 'react-native-svg';
import { CharacterAppearance, SKIN_TONES } from '../../types/character';

interface FaceProps {
  appearance: CharacterAppearance;
  size?: number;
}

const FaceSimple: React.FC<FaceProps> = ({ appearance, size = 200 }) => {
  const { faceShape, skinTone } = appearance;
  
  const faceColor = SKIN_TONES[skinTone];
  const centerX = size / 2;
  const centerY = size / 2;
  
  // Much simpler - just use basic shapes with pixel-like styling
  const getFaceShape = () => {
    switch (faceShape) {
      case 'round':
        return (
          <Circle
            cx={centerX}
            cy={centerY}
            r={size * 0.4}
            fill={faceColor}
            stroke="#2F1B14"
            strokeWidth="2"
          />
        );
      case 'oval':
        return (
          <Circle
            cx={centerX}
            cy={centerY}
            r={size * 0.35}
            ry={size * 0.45}
            fill={faceColor}
            stroke="#2F1B14"
            strokeWidth="2"
          />
        );
      case 'square':
        return (
          <Rect
            x={centerX - size * 0.3}
            y={centerY - size * 0.35}
            width={size * 0.6}
            height={size * 0.7}
            fill={faceColor}
            stroke="#2F1B14"
            strokeWidth="2"
          />
        );
      case 'heart':
        return (
          <Circle
            cx={centerX}
            cy={centerY}
            r={size * 0.35}
            fill={faceColor}
            stroke="#2F1B14"
            strokeWidth="2"
          />
        );
      default:
        return (
          <Circle
            cx={centerX}
            cy={centerY}
            r={size * 0.35}
            fill={faceColor}
            stroke="#2F1B14"
            strokeWidth="2"
          />
        );
    }
  };

  return (
    <Svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
      {getFaceShape()}
    </Svg>
  );
};

export default FaceSimple;
