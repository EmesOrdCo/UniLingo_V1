import React from 'react';
import Svg, { Rect, Circle } from 'react-native-svg';
import { CharacterAppearance } from '../../types/character';

interface EyesProps {
  appearance: CharacterAppearance;
  size?: number;
}

const EyesSimple: React.FC<EyesProps> = ({ appearance, size = 200 }) => {
  const { eyeColor, eyeShape, expression } = appearance;
  
  const centerX = size / 2;
  const centerY = size * 0.4;
  
  const getEyeSize = () => {
    switch (eyeShape) {
      case 'narrow': return { width: size * 0.08, height: size * 0.04 };
      case 'wide': return { width: size * 0.12, height: size * 0.08 };
      default: return { width: size * 0.1, height: size * 0.06 };
    }
  };

  const eyeSize = getEyeSize();
  
  const getLeftEye = () => {
    if (expression === 'wink') {
      return (
        <Rect
          x={centerX - size * 0.25}
          y={centerY - size * 0.02}
          width={eyeSize.width}
          height={size * 0.02}
          fill="#2F1B14"
        />
      );
    }
    
    return (
      <>
        <Rect
          x={centerX - size * 0.25}
          y={centerY - eyeSize.height / 2}
          width={eyeSize.width}
          height={eyeSize.height}
          fill="#FFFFFF"
          stroke="#2F1B14"
          strokeWidth="2"
        />
        <Circle
          cx={centerX - size * 0.2}
          cy={centerY}
          r={size * 0.03}
          fill={eyeColor}
        />
        <Circle
          cx={centerX - size * 0.2}
          cy={centerY}
          r={size * 0.015}
          fill="#000000"
        />
      </>
    );
  };

  const getRightEye = () => {
    return (
      <>
        <Rect
          x={centerX + size * 0.15}
          y={centerY - eyeSize.height / 2}
          width={eyeSize.width}
          height={eyeSize.height}
          fill="#FFFFFF"
          stroke="#2F1B14"
          strokeWidth="2"
        />
        <Circle
          cx={centerX + size * 0.2}
          cy={centerY}
          r={size * 0.03}
          fill={eyeColor}
        />
        <Circle
          cx={centerX + size * 0.2}
          cy={centerY}
          r={size * 0.015}
          fill="#000000"
        />
      </>
    );
  };

  const getEyebrows = () => {
    if (expression === 'surprised') {
      return (
        <>
          <Rect
            x={centerX - size * 0.3}
            y={centerY - size * 0.15}
            width={size * 0.2}
            height={size * 0.02}
            fill="#8B4513"
          />
          <Rect
            x={centerX + size * 0.1}
            y={centerY - size * 0.15}
            width={size * 0.2}
            height={size * 0.02}
            fill="#8B4513"
          />
        </>
      );
    }
    
    return (
      <>
        <Rect
          x={centerX - size * 0.3}
          y={centerY - size * 0.12}
          width={size * 0.2}
          height={size * 0.02}
          fill="#8B4513"
        />
        <Rect
          x={centerX + size * 0.1}
          y={centerY - size * 0.12}
          width={size * 0.2}
          height={size * 0.02}
          fill="#8B4513"
        />
      </>
    );
  };

  return (
    <Svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
      {getEyebrows()}
      {getLeftEye()}
      {getRightEye()}
    </Svg>
  );
};

export default EyesSimple;
