import React from 'react';
import { render, fireEvent, waitFor } from '@testing-library/react-native';
import LevelSelectionScreen from '../src/screens/LevelSelectionScreen';
import { I18nProvider } from '../src/lib/i18n';

// Mock the navigation
const mockNavigation = {
  goBack: jest.fn(),
};

// Mock the auth context
jest.mock('../src/contexts/AuthContext', () => ({
  useAuth: () => ({
    user: { id: 'test-user-id' },
  }),
}));

// Mock the supabase client
jest.mock('../src/lib/supabase', () => ({
  supabase: {
    from: jest.fn(() => ({
      select: jest.fn(() => ({
        not: jest.fn(() => ({
          data: [
            { cefr_sub_level: 'A1.1' },
            { cefr_sub_level: 'A1.2' },
            { cefr_sub_level: 'A2.1' },
            { cefr_sub_level: 'A2.2' },
          ],
          error: null,
        })),
      })),
    })),
  },
}));

describe('LevelSelectionScreen', () => {
  const renderWithI18n = (component: React.ReactElement) => {
    return render(
      <I18nProvider>
        {component}
      </I18nProvider>
    );
  };

  it('renders correctly', () => {
    const { getByText } = renderWithI18n(
      <LevelSelectionScreen navigation={mockNavigation as any} />
    );
    
    expect(getByText('Select Your Level')).toBeTruthy();
    expect(getByText('Main Level')).toBeTruthy();
    expect(getByText('Choose your current proficiency level')).toBeTruthy();
  });

  it('allows level selection', async () => {
    const mockOnLevelSelected = jest.fn();
    const { getByText } = renderWithI18n(
      <LevelSelectionScreen 
        navigation={mockNavigation as any}
        route={{ params: { onLevelSelected: mockOnLevelSelected } }}
      />
    );
    
    // Wait for the component to load
    await waitFor(() => {
      expect(getByText('A1')).toBeTruthy();
    });
    
    // Tap on A2 level
    fireEvent.press(getByText('A2'));
    
    // Verify the level was selected
    expect(getByText('Beginner A2')).toBeTruthy();
  });

  it('navigates back when confirm is pressed', async () => {
    const { getByText } = renderWithI18n(
      <LevelSelectionScreen navigation={mockNavigation as any} />
    );
    
    await waitFor(() => {
      expect(getByText('Confirm Selection')).toBeTruthy();
    });
    
    fireEvent.press(getByText('Confirm Selection'));
    
    expect(mockNavigation.goBack).toHaveBeenCalled();
  });
});
