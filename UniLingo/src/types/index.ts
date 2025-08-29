export interface User {
  id: string
  email: string
  name?: string
  nativeLanguage: string
  targetLanguage: string
  subjects: Subject[]
  level: 'beginner' | 'intermediate' | 'expert'
  createdAt: Date
  lastActive: Date
}

export interface Subject {
  id: string
  name: string
  category: 'Medicine' | 'Engineering' | 'Physics' | 'Biology' | 'Chemistry' | 'English' | 'Business' | 'Humanities' | 'Sciences'
  description: string
  difficulty: 'beginner' | 'intermediate' | 'expert'
  topics: Topic[]
}

export interface Topic {
  id: string
  name: string
  description: string
  vocabulary: VocabularyItem[]
  exercises: Exercise[]
  materials: LearningMaterial[]
}

export interface VocabularyItem {
  id: string
  term: string
  definition: string
  pronunciation: string
  example: string
  subject: string
  difficulty: 'beginner' | 'intermediate' | 'expert'
  tags: string[]
}

export interface Exercise {
  id: string
  type: 'multiple-choice' | 'fill-blank' | 'matching' | 'translation' | 'speaking'
  question: string
  options?: string[]
  correctAnswer: string
  explanation: string
  subject: string
  difficulty: 'beginner' | 'intermediate' | 'expert'
}

export interface LearningMaterial {
  id: string
  title: string
  content: string
  type: 'text' | 'video' | 'audio' | 'interactive'
  subject: string
  difficulty: 'beginner' | 'intermediate' | 'expert'
  tags: string[]
}

export interface Flashcard {
  id: string
  front: string
  back: string
  subject: string
  topic: string
  difficulty: 'beginner' | 'intermediate' | 'expert'
  lastReviewed?: Date
  example?: string
  pronunciation?: string
  tags?: string[]
  source?: 'manual' | 'ai_extraction' | 'ai_generated'
}

export interface Progress {
  userId: string
  subjectId: string
  topicId: string
  completedExercises: string[]
  vocabularyMastered: string[]
  overallScore: number
  lastStudied: Date
}

export interface CourseNote {
  id: string
  userId: string
  title: string
  content: string
  subject: string
  topic: string
  extractedTerms: string[]
  createdAt: Date
  updatedAt: Date
}

export interface AIResponse {
  success: boolean
  message: string
  data?: any
  error?: string
}

export interface StudySession {
  id: string
  userId: string
  subjectId: string
  topicId: string
  startTime: Date
  endTime?: Date
  duration: number
  score: number
  completedExercises: string[]
  vocabularyReviewed: string[]
}

export interface UserProfile {
  id: string
  email: string
  name: string
  native_language: string
  target_language: string
  proficiency_level: 'beginner' | 'intermediate' | 'expert'
  subjects: string[]
  created_at: string
  updated_at: string
}

export interface UpdateProfileData {
  name?: string
  native_language?: string
  target_language?: string
  proficiency_level?: 'beginner' | 'intermediate' | 'expert'
  subjects?: string[]
}









