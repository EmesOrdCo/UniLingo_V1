import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import AsyncStorage from '@react-native-async-storage/async-storage';

// Define types for all the avataaars options
export type AvatarOptions = {
  // Basic options
  skinColor: string;
  hairColor: string;
  facialHairType: string;
  facialHairColor: string;
  topType: string;
  clotheType: string;
  clotheColor: string;
  eyeType: string;
  eyebrowType: string;
  mouthType: string;
  accessoriesType: string;
};

export interface AvatarState {
  options: AvatarOptions;
}

// Default avatar options
const defaultOptions: AvatarOptions = {
  skinColor: 'f2d3b1',
  hairColor: '2c1b18',
  facialHairType: 'Blank',
  facialHairColor: '2c1b18',
  topType: 'shortWaved',
  clotheType: 'shirtCrewNeck',
  clotheColor: '3c4f5c',
  eyeType: 'default',
  eyebrowType: 'default',
  mouthType: 'default',
  accessoriesType: 'Blank',
};

// Function to get saved avatar options from AsyncStorage
const getSavedAvatarOptions = async (): Promise<AvatarOptions> => {
  try {
    const savedOptions = await AsyncStorage.getItem('avatar-options');
    return savedOptions ? JSON.parse(savedOptions) : defaultOptions;
  } catch (error) {
    console.error('Error loading avatar options:', error);
    return defaultOptions;
  }
};

// Initialize state with default options
const initialState: AvatarState = {
  options: defaultOptions,
};

export const avatarSlice = createSlice({
  name: 'avatar',
  initialState,
  reducers: {
    updateAvatarOption: (
      state,
      action: PayloadAction<{ option: keyof AvatarOptions; value: string; persist?: boolean }>
    ) => {
      const { option, value, persist = true } = action.payload;
      state.options[option] = value;
      
      // Only save to AsyncStorage if persist is true (default behavior)
      if (persist) {
        AsyncStorage.setItem('avatar-options', JSON.stringify(state.options)).catch(
          (error) => console.error('Error saving avatar options:', error)
        );
      }
    },
    resetAvatar: (state) => {
      // Reset to default state
      state.options = { ...defaultOptions };
      
      // Clear saved options from AsyncStorage
      AsyncStorage.removeItem('avatar-options').catch(
        (error) => console.error('Error clearing avatar options:', error)
      );
    },
    loadAvatarOptions: (state, action: PayloadAction<AvatarOptions>) => {
      state.options = action.payload;
    },
    initializeAvatarOptions: (state) => {
      // This will be called to load saved options from AsyncStorage
      // The actual loading will be done in a thunk or component
    },
  },
});

export const { updateAvatarOption, resetAvatar, loadAvatarOptions, initializeAvatarOptions } = avatarSlice.actions;

// Selectors
export const selectAvatarOptions = (state: { avatar: AvatarState }) => state.avatar.options;

export default avatarSlice.reducer;
