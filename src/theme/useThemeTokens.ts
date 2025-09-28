import { useMemo } from 'react';

export interface ThemeTokens {
  colors: {
    // Primary colors
    primary: string;
    primaryLight: string;
    primaryDark: string;
    
    // Text colors
    text: {
      primary: string;
      secondary: string;
      tertiary: string;
      inverse: string;
      light: string;
      medium: string;
      dark: string;
    };
    
    // Background colors
    background: {
      primary: string;
      secondary: string;
      tertiary: string;
      card: string;
      surface: string;
    };
    
    // Status colors
    status: {
      success: string;
      warning: string;
      error: string;
      info: string;
    };
    
    // Border colors
    border: {
      primary: string;
      secondary: string;
      focus: string;
    };
    
    // Overlay colors
    overlay: {
      light: string;
      medium: string;
      dark: string;
    };
  };
  
  spacing: {
    xs: number;
    sm: number;
    md: number;
    lg: number;
    xl: number;
    xxl: number;
  };
  
  radius: {
    sm: number;
    md: number;
    lg: number;
    xl: number;
    full: number;
  };
  
  fonts: {
    sizes: {
      xs: number;
      sm: number;
      md: number;
      lg: number;
      xl: number;
      xxl: number;
      xxxl: number;
    };
    weights: {
      normal: '400';
      medium: '500';
      semibold: '600';
      bold: '700';
      regular: '400';
    };
    families: {
      system: string;
    };
  };
  
  shadows: {
    sm: {
      shadowColor: string;
      shadowOffset: { width: number; height: number };
      shadowOpacity: number;
      shadowRadius: number;
      elevation: number;
    };
    md: {
      shadowColor: string;
      shadowOffset: { width: number; height: number };
      shadowOpacity: number;
      shadowRadius: number;
      elevation: number;
    };
    lg: {
      shadowColor: string;
      shadowOffset: { width: number; height: number };
      shadowOpacity: number;
      shadowRadius: number;
      elevation: number;
    };
  };
}

/**
 * Hook that provides theme tokens extracted from the existing app's design system.
 * These tokens are based on the most commonly used values throughout the codebase.
 */
export function useThemeTokens(): ThemeTokens {
  return useMemo(() => ({
    colors: {
      // Primary colors - extracted from #6366f1 usage
      primary: '#6366f1',
      primaryLight: '#818cf8',
      primaryDark: '#4f46e5',
      
      // Text colors - extracted from common text colors
      text: {
        primary: '#1e293b',    // #1e293b - main text
        secondary: '#64748b',  // #64748b - secondary text
        tertiary: '#94a3b8',   // #94a3b8 - tertiary text
        inverse: '#ffffff',    // #ffffff - white text
        light: '#94a3b8',      // #94a3b8 - light text
        medium: '#64748b',     // #64748b - medium text
        dark: '#1e293b',       // #1e293b - dark text
      },
      
      // Background colors - extracted from common backgrounds
      background: {
        primary: '#ffffff',    // #ffffff - white background
        secondary: '#f8fafc',  // #f8fafc - light gray background
        tertiary: '#f1f5f9',   // #f1f5f9 - very light gray
        card: '#ffffff',       // #ffffff - card background
        surface: '#f8fafc',    // #f8fafc - surface background
      },
      
      // Status colors - extracted from status indicators
      status: {
        success: '#10b981',    // #10b981 - green
        warning: '#f59e0b',    // #f59e0b - amber
        error: '#ef4444',      // #ef4444 - red
        info: '#3b82f6',       // #3b82f6 - blue
      },
      
      // Border colors - extracted from border usage
      border: {
        primary: '#e2e8f0',    // #e2e8f0 - light border
        secondary: '#e5e7eb',  // #e5e7eb - alternative border
        focus: '#6366f1',      // #6366f1 - focus border (primary)
      },
      
      // Overlay colors - for modals and overlays
      overlay: {
        light: 'rgba(255,255,255,0.1)',
        medium: 'rgba(0,0,0,0.1)',
        dark: 'rgba(0,0,0,0.5)',
      },
    },
    
    spacing: {
      xs: 4,    // 4px
      sm: 8,    // 8px
      md: 16,   // 16px - most common
      lg: 20,   // 20px - common
      xl: 24,   // 24px - common
      xxl: 32,  // 32px
    },
    
    radius: {
      sm: 8,    // 8px
      md: 12,   // 12px - most common
      lg: 16,   // 16px - common
      xl: 20,   // 20px
      full: 50, // 50px - for circular elements
    },
    
    fonts: {
      sizes: {
        xs: 12,   // 12px
        sm: 14,   // 14px
        md: 16,   // 16px - most common
        lg: 18,   // 18px
        xl: 20,   // 20px
        xxl: 24,  // 24px
        xxxl: 28, // 28px
      },
      weights: {
        normal: '400',
        medium: '500',
        semibold: '600',
        bold: '700',
        regular: '400',
      },
      families: {
        system: 'System',
      },
    },
    
    shadows: {
      sm: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.1,
        shadowRadius: 2,
        elevation: 2,
      },
      md: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
        elevation: 3,
      },
      lg: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.15,
        shadowRadius: 8,
        elevation: 5,
      },
    },
  }), []);
}

export default useThemeTokens;

