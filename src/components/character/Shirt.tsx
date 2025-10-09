import React from 'react';
import Svg, { Path, Ellipse, Defs, LinearGradient, Stop, RadialGradient, Circle } from 'react-native-svg';
import { CharacterAppearance, SHIRT_COLORS } from '../../types/character';

interface ShirtProps {
  appearance: CharacterAppearance;
  size?: number;
}

const Shirt: React.FC<ShirtProps> = ({ appearance, size = 200 }) => {
  const { shirtStyle, shirtColor } = appearance;
  
  const getShirtPath = () => {
    const centerX = size / 2;
    const centerY = size / 2;
    
    switch (shirtStyle) {
      case 'casual':
        return `M ${centerX - 65} ${centerY + 45} 
                 L ${centerX - 45} ${centerY + 25} 
                 Q ${centerX - 30} ${centerY + 35} ${centerX - 15} ${centerY + 32} 
                 Q ${centerX} ${centerY + 30} ${centerX + 15} ${centerY + 32} 
                 Q ${centerX + 30} ${centerY + 35} ${centerX + 45} ${centerY + 25} 
                 L ${centerX + 65} ${centerY + 45} 
                 L ${centerX + 65} ${centerY + 110} 
                 L ${centerX - 65} ${centerY + 110} Z`;
      
      case 'formal':
        return `M ${centerX - 55} ${centerY + 40} 
                 L ${centerX - 35} ${centerY + 20} 
                 Q ${centerX - 20} ${centerY + 30} ${centerX - 10} ${centerY + 28} 
                 Q ${centerX} ${centerY + 26} ${centerX + 10} ${centerY + 28} 
                 Q ${centerX + 20} ${centerY + 30} ${centerX + 35} ${centerY + 20} 
                 L ${centerX + 55} ${centerY + 40} 
                 L ${centerX + 55} ${centerY + 110} 
                 L ${centerX - 55} ${centerY + 110} Z`;
      
      case 'hoodie':
        return `M ${centerX - 65} ${centerY + 45} 
                 L ${centerX - 50} ${centerY + 25} 
                 Q ${centerX - 35} ${centerY + 20} ${centerX - 20} ${centerY + 22} 
                 Q ${centerX - 5} ${centerY + 20} ${centerX} ${centerY + 20} 
                 Q ${centerX + 5} ${centerY + 20} ${centerX + 20} ${centerY + 22} 
                 Q ${centerX + 35} ${centerY + 20} ${centerX + 50} ${centerY + 25} 
                 L ${centerX + 65} ${centerY + 45} 
                 L ${centerX + 65} ${centerY + 110} 
                 L ${centerX - 65} ${centerY + 110} Z`;
      
      case 'dress':
        return `M ${centerX - 50} ${centerY + 45} 
                 L ${centerX - 35} ${centerY + 25} 
                 Q ${centerX - 20} ${centerY + 35} ${centerX - 10} ${centerY + 32} 
                 Q ${centerX} ${centerY + 30} ${centerX + 10} ${centerY + 32} 
                 Q ${centerX + 20} ${centerY + 35} ${centerX + 35} ${centerY + 25} 
                 L ${centerX + 50} ${centerY + 45} 
                 L ${centerX + 50} ${centerY + 130} 
                 L ${centerX - 50} ${centerY + 130} Z`;
      
      case 'tank':
        return `M ${centerX - 45} ${centerY + 45} 
                 L ${centerX - 30} ${centerY + 25} 
                 Q ${centerX - 15} ${centerY + 30} ${centerX - 5} ${centerY + 28} 
                 Q ${centerX} ${centerY + 26} ${centerX + 5} ${centerY + 28} 
                 Q ${centerX + 15} ${centerY + 30} ${centerX + 30} ${centerY + 25} 
                 L ${centerX + 45} ${centerY + 45} 
                 L ${centerX + 45} ${centerY + 85} 
                 L ${centerX - 45} ${centerY + 85} Z`;
      
      default:
        return `M ${centerX - 65} ${centerY + 45} 
                 L ${centerX - 45} ${centerY + 25} 
                 Q ${centerX - 30} ${centerY + 35} ${centerX - 15} ${centerY + 32} 
                 Q ${centerX} ${centerY + 30} ${centerX + 15} ${centerY + 32} 
                 Q ${centerX + 30} ${centerY + 35} ${centerX + 45} ${centerY + 25} 
                 L ${centerX + 65} ${centerY + 45} 
                 L ${centerX + 65} ${centerY + 110} 
                 L ${centerX - 65} ${centerY + 110} Z`;
    }
  };

  const getShirtColor = () => {
    return SHIRT_COLORS[shirtColor] || SHIRT_COLORS.blue;
  };

  const getShirtGradientId = () => `shirt-gradient-${shirtColor}`;
  const getShirtShadowGradientId = () => `shirt-shadow-${shirtColor}`;
  
  const getShirtGradient = () => {
    const baseColor = getShirtColor();
    const lighterColor = lightenColor(baseColor, 15);
    const darkerColor = darkenColor(baseColor, 20);
    
    return (
      <LinearGradient id={getShirtGradientId()} x1="0%" y1="0%" x2="0%" y2="100%">
        <Stop offset="0%" stopColor={lighterColor} />
        <Stop offset="50%" stopColor={baseColor} />
        <Stop offset="100%" stopColor={darkerColor} />
      </LinearGradient>
    );
  };

  const getShirtShadowGradient = () => {
    const baseColor = getShirtColor();
    const shadowColor = darkenColor(baseColor, 35);
    
    return (
      <RadialGradient id={getShirtShadowGradientId()} cx="50%" cy="20%" r="80%">
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

  const getHoodieHood = () => {
    if (shirtStyle !== 'hoodie') return null;
    
    const centerX = size / 2;
    const centerY = size / 2;
    
    return (
      <Path
        d={`M ${centerX - 50} ${centerY + 20} 
             Q ${centerX - 35} ${centerY - 5} ${centerX - 20} ${centerY + 15} 
             Q ${centerX - 5} ${centerY + 5} ${centerX} ${centerY + 5} 
             Q ${centerX + 5} ${centerY + 5} ${centerX + 20} ${centerY + 15} 
             Q ${centerX + 35} ${centerY - 5} ${centerX + 50} ${centerY + 20} 
             L ${centerX + 50} ${centerY + 30} 
             Q ${centerX} ${centerY + 15} ${centerX - 50} ${centerY + 30} Z`}
        fill={`url(#${getShirtGradientId()})`}
        stroke={darkenColor(getShirtColor(), 40)}
        strokeWidth="1.2"
        strokeOpacity="0.4"
      />
    );
  };

  const getShirtDetails = () => {
    const centerX = size / 2;
    const centerY = size / 2;
    
    switch (shirtStyle) {
      case 'formal':
        return (
          <>
            {/* Tie */}
            <Path
              d={`M ${centerX - 8} ${centerY + 40} L ${centerX - 4} ${centerY + 80} L ${centerX - 2} ${centerY + 80} L ${centerX + 2} ${centerY + 80} L ${centerX + 4} ${centerY + 80} L ${centerX + 8} ${centerY + 40}`}
              fill={darkenColor(getShirtColor(), 50)}
              stroke={darkenColor(getShirtColor(), 60)}
              strokeWidth="0.5"
            />
            {/* Collar */}
            <Path
              d={`M ${centerX - 25} ${centerY + 40} L ${centerX - 15} ${centerY + 45} L ${centerX} ${centerY + 42} L ${centerX + 15} ${centerY + 45} L ${centerX + 25} ${centerY + 40}`}
              fill={darkenColor(getShirtColor(), 30)}
              stroke={darkenColor(getShirtColor(), 50)}
              strokeWidth="0.8"
            />
          </>
        );
      
      case 'hoodie':
        return (
          <>
            {/* Hoodie strings */}
            <Path
              d={`M ${centerX - 45} ${centerY + 20} Q ${centerX - 50} ${centerY + 15} ${centerX - 45} ${centerY + 10}`}
              stroke={darkenColor(getShirtColor(), 60)}
              strokeWidth="2"
              fill="none"
            />
            <Path
              d={`M ${centerX + 45} ${centerY + 20} Q ${centerX + 50} ${centerY + 15} ${centerX + 45} ${centerY + 10}`}
              stroke={darkenColor(getShirtColor(), 60)}
              strokeWidth="2"
              fill="none"
            />
            {/* Pocket */}
            <Path
              d={`M ${centerX - 20} ${centerY + 60} L ${centerX + 20} ${centerY + 60} L ${centerX + 20} ${centerY + 75} L ${centerX - 20} ${centerY + 75} Z`}
              fill={darkenColor(getShirtColor(), 25)}
              stroke={darkenColor(getShirtColor(), 40)}
              strokeWidth="0.8"
            />
          </>
        );
      
      case 'casual':
        return (
          <>
            {/* Button holes */}
            <Circle cx={centerX - 15} cy={centerY + 50} r={1.5} fill={darkenColor(getShirtColor(), 40)} />
            <Circle cx={centerX - 15} cy={centerY + 60} r={1.5} fill={darkenColor(getShirtColor(), 40)} />
            <Circle cx={centerX - 15} cy={centerY + 70} r={1.5} fill={darkenColor(getShirtColor(), 40)} />
            <Circle cx={centerX - 15} cy={centerY + 80} r={1.5} fill={darkenColor(getShirtColor(), 40)} />
          </>
        );
      
      case 'dress':
        return (
          <>
            {/* Dress belt */}
            <Path
              d={`M ${centerX - 35} ${centerY + 70} L ${centerX + 35} ${centerY + 70}`}
              stroke={darkenColor(getShirtColor(), 40)}
              strokeWidth="3"
            />
            {/* Dress pattern */}
            <Path
              d={`M ${centerX - 30} ${centerY + 90} Q ${centerX} ${centerY + 95} ${centerX + 30} ${centerY + 90}`}
              stroke={darkenColor(getShirtColor(), 30)}
              strokeWidth="1"
              fill="none"
            />
            <Path
              d={`M ${centerX - 30} ${centerY + 110} Q ${centerX} ${centerY + 115} ${centerX + 30} ${centerY + 110}`}
              stroke={darkenColor(getShirtColor(), 30)}
              strokeWidth="1"
              fill="none"
            />
          </>
        );
      
      default:
        return null;
    }
  };

  const getShirtFolds = () => {
    const centerX = size / 2;
    const centerY = size / 2;
    
    return (
      <>
        {/* Vertical folds */}
        <Path
          d={`M ${centerX - 30} ${centerY + 50} L ${centerX - 30} ${centerY + 90}`}
          stroke={darkenColor(getShirtColor(), 25)}
          strokeWidth="1"
          opacity="0.4"
        />
        <Path
          d={`M ${centerX + 30} ${centerY + 50} L ${centerX + 30} ${centerY + 90}`}
          stroke={darkenColor(getShirtColor(), 25)}
          strokeWidth="1"
          opacity="0.4"
        />
        {/* Horizontal folds */}
        <Path
          d={`M ${centerX - 40} ${centerY + 70} L ${centerX + 40} ${centerY + 70}`}
          stroke={darkenColor(getShirtColor(), 20)}
          strokeWidth="0.8"
          opacity="0.3"
        />
      </>
    );
  };

  return (
    <Svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
      <Defs>
        {getShirtGradient()}
        {getShirtShadowGradient()}
      </Defs>
      
      {/* Shirt shadow for depth */}
      <Path
        d={getShirtPath()}
        fill="#000000"
        opacity={0.2}
        transform={`translate(3, 4)`}
      />
      
      {/* Main shirt with gradient */}
      <Path
        d={getShirtPath()}
        fill={`url(#${getShirtGradientId()})`}
        stroke={darkenColor(getShirtColor(), 40)}
        strokeWidth="1.5"
        strokeOpacity="0.4"
      />
      
      {/* Shirt shadow gradient */}
      <Path
        d={getShirtPath()}
        fill={`url(#${getShirtShadowGradientId()})`}
        opacity="0.4"
      />
      
      {/* Hoodie hood */}
      {getHoodieHood()}
      
      {/* Shirt details */}
      {getShirtDetails()}
      
      {/* Shirt folds for realism */}
      {getShirtFolds()}
      
      {/* Shirt highlights */}
      <Ellipse
        cx={size / 2}
        cy={size * 0.55}
        rx={size * 0.2}
        ry={size * 0.05}
        fill="#FFFFFF"
        opacity="0.2"
      />
    </Svg>
  );
};

export default Shirt;
