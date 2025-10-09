import React from 'react';
import Svg, { Ellipse, Path, Defs, LinearGradient, Stop, RadialGradient } from 'react-native-svg';
import { CharacterAppearance, SKIN_TONES } from '../../types/character';

interface FaceProps {
  appearance: CharacterAppearance;
  size?: number;
}

const Face: React.FC<FaceProps> = ({ appearance, size = 200 }) => {
  const { faceShape, skinTone } = appearance;
  
  const getFacePath = () => {
    const centerX = size / 2;
    const centerY = size / 2;
    
    switch (faceShape) {
      case 'round':
        return `M ${centerX} ${centerY - 65} A 55 65 0 0 1 ${centerX} ${centerY + 65} A 55 65 0 0 1 ${centerX} ${centerY - 65}`;
      case 'oval':
        return `M ${centerX} ${centerY - 75} A 45 75 0 0 1 ${centerX} ${centerY + 75} A 45 75 0 0 1 ${centerX} ${centerY - 75}`;
      case 'square':
        return `M ${centerX - 45} ${centerY - 65} L ${centerX + 45} ${centerY - 65} L ${centerX + 50} ${centerY - 50} L ${centerX + 50} ${centerY + 65} L ${centerX - 50} ${centerY + 65} L ${centerX - 50} ${centerY - 50} Z`;
      case 'heart':
        return `M ${centerX} ${centerY + 50} C ${centerX - 40} ${centerY - 15} ${centerX - 45} ${centerY + 25} ${centerX} ${centerY + 50} C ${centerX + 45} ${centerY + 25} ${centerX + 40} ${centerY - 15} ${centerX} ${centerY + 50}`;
      default:
        return `M ${centerX} ${centerY - 75} A 45 75 0 0 1 ${centerX} ${centerY + 75} A 45 75 0 0 1 ${centerX} ${centerY - 75}`;
    }
  };

  const getFaceGradientId = () => `face-gradient-${skinTone}`;
  const getShadowGradientId = () => `face-shadow-${skinTone}`;
  
  const getSkinGradient = () => {
    const baseColor = SKIN_TONES[skinTone];
    const lighterColor = lightenColor(baseColor, 20);
    const darkerColor = darkenColor(baseColor, 15);
    
    return (
      <LinearGradient id={getFaceGradientId()} x1="0%" y1="0%" x2="0%" y2="100%">
        <Stop offset="0%" stopColor={lighterColor} />
        <Stop offset="50%" stopColor={baseColor} />
        <Stop offset="100%" stopColor={darkerColor} />
      </LinearGradient>
    );
  };

  const getShadowGradient = () => {
    const baseColor = SKIN_TONES[skinTone];
    const shadowColor = darkenColor(baseColor, 30);
    
    return (
      <RadialGradient id={getShadowGradientId()} cx="50%" cy="30%" r="60%">
        <Stop offset="0%" stopColor={shadowColor} stopOpacity="0.3" />
        <Stop offset="70%" stopColor={shadowColor} stopOpacity="0.1" />
        <Stop offset="100%" stopColor="transparent" />
      </RadialGradient>
    );
  };

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

  return (
    <Svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
      <Defs>
        {getSkinGradient()}
        {getShadowGradient()}
      </Defs>
      
      {/* Face shadow for depth and dimension */}
      <Path
        d={getFacePath()}
        fill="#000000"
        opacity={0.15}
        transform={`translate(3, 4)`}
      />
      
      {/* Main face with gradient */}
      <Path
        d={getFacePath()}
        fill={`url(#${getFaceGradientId()})`}
        stroke="#8B4513"
        strokeWidth="1.5"
        strokeOpacity="0.3"
      />
      
      {/* Face shadow gradient for cheek definition */}
      <Path
        d={getFacePath()}
        fill={`url(#${getShadowGradientId()})`}
        opacity="0.4"
      />
      
      {/* Face highlight for cheekbones */}
      <Ellipse
        cx={size * 0.4}
        cy={size * 0.45}
        rx={size * 0.08}
        ry={size * 0.12}
        fill="#FFFFFF"
        opacity="0.25"
      />
      <Ellipse
        cx={size * 0.6}
        cy={size * 0.45}
        rx={size * 0.08}
        ry={size * 0.12}
        fill="#FFFFFF"
        opacity="0.25"
      />
      
      {/* Subtle jawline definition */}
      <Path
        d={`M ${size * 0.25} ${size * 0.7} Q ${size * 0.5} ${size * 0.8} ${size * 0.75} ${size * 0.7}`}
        stroke="#8B4513"
        strokeWidth="1"
        strokeOpacity="0.2"
        fill="none"
      />
    </Svg>
  );
};

export default Face;
