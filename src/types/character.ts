// Character customization types
export interface CharacterAppearance {
  // Face features
  faceShape: 'round' | 'oval' | 'square' | 'heart';
  skinTone: 'light' | 'medium' | 'tan' | 'dark';
  
  // Hair
  hairStyle: 'short' | 'medium' | 'long' | 'curly' | 'afro' | 'bald';
  hairColor: 'black' | 'brown' | 'blonde' | 'red' | 'gray' | 'blue' | 'pink';
  
  // Eyes
  eyeColor: 'brown' | 'blue' | 'green' | 'hazel' | 'gray';
  eyeShape: 'normal' | 'narrow' | 'wide';
  
  // Facial hair
  facialHair: 'none' | 'mustache' | 'beard' | 'goatee' | 'full';
  
  // Clothing
  shirtStyle: 'casual' | 'formal' | 'hoodie' | 'dress' | 'tank';
  shirtColor: 'white' | 'black' | 'blue' | 'red' | 'green' | 'yellow' | 'purple';
  
  // Accessories
  accessories: ('glasses' | 'hat' | 'earrings' | 'necklace')[];
  
  // Expression
  expression: 'happy' | 'neutral' | 'wink' | 'surprised';
}

export interface CharacterCustomization {
  appearance: CharacterAppearance;
  unlockedItems: string[];
  currentLevel: number;
  experience: number;
}

export const DEFAULT_CHARACTER: CharacterAppearance = {
  faceShape: 'oval',
  skinTone: 'medium',
  hairStyle: 'medium',
  hairColor: 'brown',
  eyeColor: 'brown',
  eyeShape: 'normal',
  facialHair: 'none',
  shirtStyle: 'casual',
  shirtColor: 'blue',
  accessories: [],
  expression: 'happy'
};

// 8-bit color palette inspired by classic games
export const SKIN_TONES = {
  light: '#FFE4C4',    // Cream
  medium: '#DEB887',   // Burlywood
  tan: '#CD853F',      // Peru
  dark: '#8B4513'      // SaddleBrown
};

export const HAIR_COLORS = {
  black: '#2F1B14',    // Dark brown-black
  brown: '#8B4513',    // SaddleBrown
  blonde: '#F5DEB3',   // Wheat
  red: '#CD5C5C',      // IndianRed
  gray: '#A9A9A9',     // DarkGray
  blue: '#4682B4',     // SteelBlue
  pink: '#FFB6C1'      // LightPink
};

export const SHIRT_COLORS = {
  white: '#FFFFFF',    // White
  black: '#2F2F2F',    // Dark gray
  blue: '#4169E1',     // RoyalBlue
  red: '#DC143C',      // Crimson
  green: '#32CD32',    // LimeGreen
  yellow: '#FFD700',   // Gold
  purple: '#9370DB'    // MediumPurple
};

// 8-bit accessory colors
export const ACCESSORY_COLORS = {
  gold: '#FFD700',     // Gold
  silver: '#C0C0C0',   // Silver
  bronze: '#CD7F32',   // Bronze
  black: '#2F2F2F',    // Dark
  white: '#FFFFFF'     // White
};
