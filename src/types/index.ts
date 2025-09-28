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
  data?: any
  error?: string
  message?: string
}

export interface UploadedFile {
  id: string
  name: string
  type: string
  size: number
  content: string
  extractedTerms: string[]
  subject: string
  topic: string
  createdAt: Date
}


