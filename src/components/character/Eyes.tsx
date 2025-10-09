import React from 'react';
import Svg, { Ellipse, Circle, Path, Defs, LinearGradient, Stop, RadialGradient } from 'react-native-svg';
import { CharacterAppearance } from '../../types/character';

interface EyesProps {
  appearance: CharacterAppearance;
  size?: number;
}

const Eyes: React.FC<EyesProps> = ({ appearance, size = 200 }) => {
  const { eyeColor, eyeShape, expression } = appearance;
  
  const getEyeShape = (x: number, y: number) => {
    const baseWidth = eyeShape === 'narrow' ? 14 : eyeShape === 'wide' ? 24 : 18;
    const baseHeight = eyeShape === 'narrow' ? 9 : eyeShape === 'wide' ? 15 : 12;
    
    // More realistic eye shape with slight almond curve
    const eyePath = `M ${x - baseWidth} ${y - baseHeight/3} 
                     Q ${x - baseWidth/2} ${y - baseHeight} ${x} ${y - baseHeight/3}
                     Q ${x + baseWidth/2} ${y - baseHeight} ${x + baseWidth} ${y - baseHeight/3}
                     Q ${x + baseWidth} ${y + baseHeight/3} ${x} ${y + baseHeight}
                     Q ${x - baseWidth} ${y + baseHeight/3} ${x - baseWidth} ${y - baseHeight/3} Z`;
    
    return (
      <Path
        d={eyePath}
        fill="white"
        stroke="#4A4A4A"
        strokeWidth="1.2"
        strokeOpacity="0.6"
      />
    );
  };

  const getEyeShadow = (x: number, y: number) => {
    const baseWidth = eyeShape === 'narrow' ? 14 : eyeShape === 'wide' ? 24 : 18;
    const baseHeight = eyeShape === 'narrow' ? 9 : eyeShape === 'wide' ? 15 : 12;
    
    const eyePath = `M ${x - baseWidth} ${y - baseHeight/3} 
                     Q ${x - baseWidth/2} ${y - baseHeight} ${x} ${y - baseHeight/3}
                     Q ${x + baseWidth/2} ${y - baseHeight} ${x + baseWidth} ${y - baseHeight/3}
                     Q ${x + baseWidth} ${y + baseHeight/3} ${x} ${y + baseHeight}
                     Q ${x - baseWidth} ${y + baseHeight/3} ${x - baseWidth} ${y - baseHeight/3} Z`;
    
    return (
      <Path
        d={eyePath}
        fill="#000000"
        opacity="0.1"
        transform={`translate(1, 1)`}
      />
    );
  };

  const getIris = (x: number, y: number) => {
    if (expression === 'wink') return null;
    
    const irisSize = eyeShape === 'narrow' ? 8 : eyeShape === 'wide' ? 12 : 10;
    
    return (
      <Circle
        cx={x}
        cy={y}
        r={irisSize}
        fill={eyeColor}
        stroke="#4A4A4A"
        strokeWidth="0.8"
        strokeOpacity="0.4"
      />
    );
  };

  const getPupil = (x: number, y: number) => {
    if (expression === 'wink') return null;
    
    const pupilSize = eyeShape === 'narrow' ? 4 : eyeShape === 'wide' ? 6 : 5;
    
    return (
      <Circle
        cx={x}
        cy={y}
        r={pupilSize}
        fill="#000000"
      />
    );
  };

  const getEyeHighlights = (x: number, y: number) => {
    if (expression === 'wink') return null;
    
    const highlight1Size = eyeShape === 'narrow' ? 2 : eyeShape === 'wide' ? 3 : 2.5;
    const highlight2Size = eyeShape === 'narrow' ? 1 : eyeShape === 'wide' ? 1.5 : 1.2;
    
    return (
      <>
        {/* Main highlight */}
        <Circle 
          cx={x - 3} 
          cy={y - 3} 
          r={highlight1Size} 
          fill="#FFFFFF" 
          opacity="0.9"
        />
        {/* Secondary highlight */}
        <Circle 
          cx={x + 2} 
          cy={y - 2} 
          r={highlight2Size} 
          fill="#FFFFFF" 
          opacity="0.7"
        />
      </>
    );
  };

  const getWinkEye = (x: number, y: number) => {
    if (expression !== 'wink') return null;
    
    return (
      <Path
        d={`M ${x - 10} ${y} Q ${x} ${y - 4} ${x + 10} ${y}`}
        stroke="#4A4A4A"
        strokeWidth="2.5"
        fill="none"
        strokeLinecap="round"
      />
    );
  };

  const getEyebrow = (x: number, y: number) => {
    const eyebrowY = y - 18;
    const eyebrowWidth = eyeShape === 'narrow' ? 16 : eyeShape === 'wide' ? 20 : 18;
    
    if (expression === 'surprised') {
      return (
        <Path
          d={`M ${x - eyebrowWidth} ${eyebrowY} Q ${x} ${eyebrowY - 10} ${x + eyebrowWidth} ${eyebrowY}`}
          stroke="#8B4513"
          strokeWidth="3.5"
          fill="none"
          strokeLinecap="round"
        />
      );
    }
    
    if (expression === 'wink') {
      return (
        <Path
          d={`M ${x - eyebrowWidth} ${eyebrowY} Q ${x} ${eyebrowY + 1} ${x + eyebrowWidth} ${eyebrowY}`}
          stroke="#8B4513"
          strokeWidth="3.5"
          fill="none"
          strokeLinecap="round"
        />
      );
    }
    
    return (
      <Path
        d={`M ${x - eyebrowWidth} ${eyebrowY} Q ${x} ${eyebrowY + 3} ${x + eyebrowWidth} ${eyebrowY}`}
        stroke="#8B4513"
        strokeWidth="3.5"
        fill="none"
        strokeLinecap="round"
      />
    );
  };

  const getEyelashes = (x: number, y: number) => {
    const baseWidth = eyeShape === 'narrow' ? 14 : eyeShape === 'wide' ? 24 : 18;
    const baseHeight = eyeShape === 'narrow' ? 9 : eyeShape === 'wide' ? 15 : 12;
    
    const lashY = y - baseHeight/3;
    const lashLength = eyeShape === 'narrow' ? 3 : eyeShape === 'wide' ? 5 : 4;
    
    return (
      <>
        {/* Left eyelashes */}
        <Path
          d={`M ${x - baseWidth + 2} ${lashY} L ${x - baseWidth + 2} ${lashY - lashLength}`}
          stroke="#4A4A4A"
          strokeWidth="1"
          strokeLinecap="round"
        />
        <Path
          d={`M ${x - baseWidth/2} ${lashY} L ${x - baseWidth/2} ${lashY - lashLength}`}
          stroke="#4A4A4A"
          strokeWidth="1"
          strokeLinecap="round"
        />
        {/* Right eyelashes */}
        <Path
          d={`M ${x + baseWidth/2} ${lashY} L ${x + baseWidth/2} ${lashY - lashLength}`}
          stroke="#4A4A4A"
          strokeWidth="1"
          strokeLinecap="round"
        />
        <Path
          d={`M ${x + baseWidth - 2} ${lashY} L ${x + baseWidth - 2} ${lashY - lashLength}`}
          stroke="#4A4A4A"
          strokeWidth="1"
          strokeLinecap="round"
        />
      </>
    );
  };

  return (
    <Svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
      {/* Left eyebrow */}
      {getEyebrow(size * 0.35, size * 0.35)}
      
      {/* Right eyebrow */}
      {getEyebrow(size * 0.65, size * 0.35)}
      
      {/* Left eye shadow */}
      {getEyeShadow(size * 0.35, size * 0.4)}
      
      {/* Right eye shadow */}
      {getEyeShadow(size * 0.65, size * 0.4)}
      
      {/* Left eye */}
      {getEyeShape(size * 0.35, size * 0.4)}
      {getIris(size * 0.35, size * 0.4)}
      {getPupil(size * 0.35, size * 0.4)}
      {getEyeHighlights(size * 0.35, size * 0.4)}
      {getWinkEye(size * 0.35, size * 0.4)}
      {getEyelashes(size * 0.35, size * 0.4)}
      
      {/* Right eye */}
      {getEyeShape(size * 0.65, size * 0.4)}
      {getIris(size * 0.65, size * 0.4)}
      {getPupil(size * 0.65, size * 0.4)}
      {getEyeHighlights(size * 0.65, size * 0.4)}
      {getWinkEye(size * 0.65, size * 0.4)}
      {getEyelashes(size * 0.65, size * 0.4)}
    </Svg>
  );
};

export default Eyes;
