import React from 'react';
import Svg, { Path, Ellipse, Defs, LinearGradient, Stop, RadialGradient } from 'react-native-svg';
import { CharacterAppearance, HAIR_COLORS } from '../../types/character';

interface HairProps {
  appearance: CharacterAppearance;
  size?: number;
}

const Hair: React.FC<HairProps> = ({ appearance, size = 200 }) => {
  const { hairStyle, hairColor } = appearance;
  
  const getHairPath = () => {
    const centerX = size / 2;
    const centerY = size / 2;
    
    switch (hairStyle) {
      case 'short':
        return `M ${centerX - 48} ${centerY - 65} Q ${centerX} ${centerY - 85} ${centerX + 48} ${centerY - 65} 
                 L ${centerX + 48} ${centerY - 35} Q ${centerX + 25} ${centerY - 25} ${centerX} ${centerY - 35} 
                 Q ${centerX - 25} ${centerY - 25} ${centerX - 48} ${centerY - 35} Z`;
      
      case 'medium':
        return `M ${centerX - 52} ${centerY - 75} Q ${centerX} ${centerY - 95} ${centerX + 52} ${centerY - 75} 
                 L ${centerX + 52} ${centerY - 25} Q ${centerX + 25} ${centerY - 15} ${centerX} ${centerY - 25} 
                 Q ${centerX - 25} ${centerY - 15} ${centerX - 52} ${centerY - 25} Z`;
      
      case 'long':
        return `M ${centerX - 55} ${centerY - 80} Q ${centerX} ${centerY - 100} ${centerX + 55} ${centerY - 80} 
                 L ${centerX + 55} ${centerY + 15} Q ${centerX + 30} ${centerY + 25} ${centerX} ${centerY + 15} 
                 Q ${centerX - 30} ${centerY + 25} ${centerX - 55} ${centerY + 15} Z`;
      
      case 'curly':
        return `M ${centerX - 50} ${centerY - 75} 
                 Q ${centerX - 35} ${centerY - 95} ${centerX - 15} ${centerY - 75} 
                 Q ${centerX + 5} ${centerY - 95} ${centerX + 25} ${centerY - 75} 
                 Q ${centerX + 45} ${centerY - 95} ${centerX + 50} ${centerY - 75} 
                 L ${centerX + 50} ${centerY - 15} Q ${centerX + 25} ${centerY - 5} ${centerX} ${centerY - 15} 
                 Q ${centerX - 25} ${centerY - 5} ${centerX - 50} ${centerY - 15} Z`;
      
      case 'afro':
        return `M ${centerX - 65} ${centerY - 65} 
                 Q ${centerX - 45} ${centerY - 105} ${centerX - 25} ${centerY - 65} 
                 Q ${centerX - 5} ${centerY - 105} ${centerX + 15} ${centerY - 65} 
                 Q ${centerX + 35} ${centerY - 105} ${centerX + 55} ${centerY - 65} 
                 Q ${centerX + 65} ${centerY - 35} ${centerX + 35} ${centerY - 25} 
                 Q ${centerX} ${centerY - 35} ${centerX - 35} ${centerY - 25} 
                 Q ${centerX - 65} ${centerY - 35} ${centerX - 65} ${centerY - 65} Z`;
      
      case 'bald':
        return null; // No hair
      
      default:
        return `M ${centerX - 52} ${centerY - 75} Q ${centerX} ${centerY - 95} ${centerX + 52} ${centerY - 75} 
                 L ${centerX + 52} ${centerY - 25} Q ${centerX + 25} ${centerY - 15} ${centerX} ${centerY - 25} 
                 Q ${centerX - 25} ${centerY - 15} ${centerX - 52} ${centerY - 25} Z`;
    }
  };

  const getHairColor = () => {
    return HAIR_COLORS[hairColor] || HAIR_COLORS.brown;
  };

  const getHairGradientId = () => `hair-gradient-${hairColor}`;
  const getHairShadowGradientId = () => `hair-shadow-${hairColor}`;
  
  const getHairGradient = () => {
    const baseColor = getHairColor();
    const lighterColor = lightenColor(baseColor, 25);
    const darkerColor = darkenColor(baseColor, 20);
    
    return (
      <LinearGradient id={getHairGradientId()} x1="0%" y1="0%" x2="0%" y2="100%">
        <Stop offset="0%" stopColor={lighterColor} />
        <Stop offset="50%" stopColor={baseColor} />
        <Stop offset="100%" stopColor={darkerColor} />
      </LinearGradient>
    );
  };

  const getHairShadowGradient = () => {
    const baseColor = getHairColor();
    const shadowColor = darkenColor(baseColor, 40);
    
    return (
      <RadialGradient id={getHairShadowGradientId()} cx="50%" cy="30%" r="70%">
        <Stop offset="0%" stopColor={shadowColor} stopOpacity="0.4" />
        <Stop offset="60%" stopColor={shadowColor} stopOpacity="0.2" />
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

  const getHairTexture = () => {
    const centerX = size / 2;
    const centerY = size / 2;
    
    // Add texture lines based on hair style
    switch (hairStyle) {
      case 'short':
        return (
          <>
            <Path
              d={`M ${centerX - 35} ${centerY - 60} Q ${centerX - 25} ${centerY - 70} ${centerX - 15} ${centerY - 60}`}
              stroke={darkenColor(getHairColor(), 15)}
              strokeWidth="1"
              fill="none"
              opacity="0.6"
            />
            <Path
              d={`M ${centerX + 15} ${centerY - 60} Q ${centerX + 25} ${centerY - 70} ${centerX + 35} ${centerY - 60}`}
              stroke={darkenColor(getHairColor(), 15)}
              strokeWidth="1"
              fill="none"
              opacity="0.6"
            />
          </>
        );
      
      case 'curly':
        return (
          <>
            <Path
              d={`M ${centerX - 40} ${centerY - 70} Q ${centerX - 30} ${centerY - 80} ${centerX - 20} ${centerY - 70}`}
              stroke={darkenColor(getHairColor(), 20)}
              strokeWidth="1.5"
              fill="none"
              opacity="0.7"
            />
            <Path
              d={`M ${centerX - 10} ${centerY - 70} Q ${centerX} ${centerY - 80} ${centerX + 10} ${centerY - 70}`}
              stroke={darkenColor(getHairColor(), 20)}
              strokeWidth="1.5"
              fill="none"
              opacity="0.7"
            />
            <Path
              d={`M ${centerX + 20} ${centerY - 70} Q ${centerX + 30} ${centerY - 80} ${centerX + 40} ${centerY - 70}`}
              stroke={darkenColor(getHairColor(), 20)}
              strokeWidth="1.5"
              fill="none"
              opacity="0.7"
            />
          </>
        );
      
      case 'afro':
        return (
          <>
            <Ellipse
              cx={centerX - 30}
              cy={centerY - 45}
              rx={8}
              ry={12}
              fill={darkenColor(getHairColor(), 25)}
              opacity="0.4"
            />
            <Ellipse
              cx={centerX + 30}
              cy={centerY - 45}
              rx={8}
              ry={12}
              fill={darkenColor(getHairColor(), 25)}
              opacity="0.4"
            />
            <Ellipse
              cx={centerX}
              cy={centerY - 55}
              rx={6}
              ry={10}
              fill={darkenColor(getHairColor(), 25)}
              opacity="0.4"
            />
          </>
        );
      
      default:
        return null;
    }
  };

  const getHairHighlights = () => {
    const centerX = size / 2;
    const centerY = size / 2;
    
    return (
      <>
        {/* Top highlight */}
        <Ellipse
          cx={centerX}
          cy={centerY - 75}
          rx={size * 0.25}
          ry={size * 0.08}
          fill="#FFFFFF"
          opacity="0.3"
        />
        {/* Side highlights */}
        <Ellipse
          cx={centerX - 25}
          cy={centerY - 60}
          rx={size * 0.08}
          ry={size * 0.05}
          fill="#FFFFFF"
          opacity="0.25"
        />
        <Ellipse
          cx={centerX + 25}
          cy={centerY - 60}
          rx={size * 0.08}
          ry={size * 0.05}
          fill="#FFFFFF"
          opacity="0.25"
        />
      </>
    );
  };

  if (hairStyle === 'bald') {
    return null;
  }

  return (
    <Svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
      <Defs>
        {getHairGradient()}
        {getHairShadowGradient()}
      </Defs>
      
      {/* Hair shadow for depth */}
      <Path
        d={getHairPath()}
        fill="#000000"
        opacity={0.25}
        transform={`translate(3, 4)`}
      />
      
      {/* Main hair with gradient */}
      <Path
        d={getHairPath()}
        fill={`url(#${getHairGradientId()})`}
        stroke={darkenColor(getHairColor(), 30)}
        strokeWidth="1.2"
        strokeOpacity="0.4"
      />
      
      {/* Hair shadow gradient */}
      <Path
        d={getHairPath()}
        fill={`url(#${getHairShadowGradientId()})`}
        opacity="0.5"
      />
      
      {/* Hair texture */}
      {getHairTexture()}
      
      {/* Hair highlights */}
      {getHairHighlights()}
    </Svg>
  );
};

export default Hair;
