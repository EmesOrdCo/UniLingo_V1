import { NavigatorScreenParams } from '@react-navigation/native';
import { StackScreenProps } from '@react-navigation/stack';
import { SimpleAudioLesson } from '../lib/simpleAudioLessonService';

// Define parameter types for each screen
export type RootStackParamList = {
  // Auth Stack
  Landing: undefined;
  Home: undefined;
  Login: undefined;
  Register: undefined;
  EmailConfirmation: { email: string; onboardingData?: any };
  OnboardingFlow: { prefillEmail?: string; prefillPassword?: string };

  // Main Stack
  Dashboard: undefined;
  ProfileSetup: undefined;
  CreateFlashcard: undefined;
  Study: undefined;
  Upload: undefined;
  Subjects: undefined;
  Exercises: undefined;
  MemoryGame: undefined;
  WordScramble: undefined;
  ReadingAnalysis: undefined;
  FeatureComingSoon: undefined;
  ProgressDashboard: undefined;
  Profile: undefined;
  CreateLesson: undefined;
  AIChat: undefined;
  AssistantConfig: undefined;
  LessonWalkthrough: { lessonId: string; lessonTitle: string };
  SubjectLesson: { subjectName: string; cefrLevel?: string };
  FAQ: undefined;
  TermsAndConditions: undefined;
  PrivacyPolicy: undefined;
  DailyGoals: undefined;
  LevelProgress: undefined;
  UnitDetail: { unitId: number; unitTitle: string; topicGroup: string; unitCode: string };
  Courses: undefined;
  YourLessons: undefined;
  FlashcardStudy: { flashcards: any[]; topic: string; difficulty: string };
  BrowseFlashcards: { topic: string; difficulty: string };
  UnitWords: { unitId: number; unitTitle: string; topicGroup: string; unitCode: string; isDailyChallenge?: boolean };
  UnitListen: { unitId: number; unitTitle: string; topicGroup: string; unitCode: string };
  UnitWrite: { unitId: number; unitTitle: string; topicGroup: string; unitCode: string };
  Games: { launchGame?: string; isDailyChallenge?: boolean; challengeId?: string; gameOptions?: any };
  Flashcards: undefined;
  AudioRecap: undefined;
  Settings: undefined;
  AudioPlayer: { lesson: SimpleAudioLesson; userId: string };
  AvatarEditor: undefined;
  AvatarSubcategory: { 
    category: 'skin' | 'hair' | 'facialHair' | 'eyes' | 'eyebrows' | 'mouth' | 'clothing' | 'accessories';
    categoryName: string;
    categoryIcon: string;
  };
  LevelSelection: { onLevelSelected?: (level: string, subLevel: string | null) => void };
};

// Export screen props types for use in components
export type RootStackScreenProps<T extends keyof RootStackParamList> = StackScreenProps<RootStackParamList, T>;

// Declare global navigation type for useNavigation hook
declare global {
  namespace ReactNavigation {
    interface RootParamList extends RootStackParamList {}
  }
}
