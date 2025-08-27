# UniLingo - AI-Powered Language Learning for University Students

UniLingo is a comprehensive language learning platform specifically designed for university students. It focuses on subject-specific academic English learning with AI-powered content generation, interactive flashcards, and personalized learning experiences.

## 🚀 Features

### Core Learning Features
- **Subject-Specific Content**: Tailored learning materials for Medicine, Engineering, Physics, Biology, Chemistry, Business, Humanities, and Sciences
- **AI-Generated Content**: Personalized learning materials and exercises based on your subject and current level
- **Interactive Flashcards**: Spaced repetition learning system for maximum retention
- **Progress Tracking**: Monitor your learning progress with detailed analytics
- **Course Note Upload**: Upload your lecture notes and get AI-generated flashcards

### Technical Features
- **Modern UI/UX**: Beautiful, responsive design with smooth animations
- **Real-time Updates**: Live progress tracking and instant feedback
- **File Processing**: Support for PDF, DOC, DOCX, TXT, and MD files
- **Responsive Design**: Works seamlessly on desktop, tablet, and mobile devices

## 🛠️ Tech Stack

### Frontend
- **Next.js 14**: React framework with App Router
- **TypeScript**: Type-safe development
- **Tailwind CSS**: Utility-first CSS framework
- **Framer Motion**: Smooth animations and transitions
- **React Hook Form**: Form handling and validation
- **Zod**: Schema validation

### Backend & Database
- **Supabase**: Backend-as-a-Service with PostgreSQL database
- **Real-time Subscriptions**: Live updates and notifications
- **Row Level Security**: Secure data access
- **Storage**: File upload and management

### AI & Processing
- **AI Content Generation**: Personalized learning materials
- **Natural Language Processing**: Term extraction and analysis
- **Spaced Repetition**: Optimized learning algorithms

## 📋 Prerequisites

Before you begin, ensure you have the following installed:
- **Node.js** (version 18 or higher)
- **npm** or **yarn** package manager
- **Git** for version control

## 🚀 Getting Started

### 1. Clone the Repository

```bash
git clone <your-repository-url>
cd language-learning-app
```

### 2. Install Dependencies

```bash
npm install
# or
yarn install
```

### 3. Set Up Supabase

1. **Create a Supabase Project**:
   - Go to [supabase.com](https://supabase.com)
   - Sign up or log in
   - Create a new project
   - Wait for the project to be ready

2. **Get Your Project Credentials**:
   - Go to Project Settings → API
   - Copy your Project URL and anon/public key

3. **Create Environment File**:
   ```bash
   cp .env.local.example .env.local
   ```
   
   Update `.env.local` with your Supabase credentials:
   ```env
   NEXT_PUBLIC_SUPABASE_URL=your_supabase_project_url
   NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
   SUPABASE_SERVICE_ROLE_KEY=your_supabase_service_role_key
   ```

### 4. Set Up Database Schema

Run the following SQL commands in your Supabase SQL editor:

```sql
-- Enable necessary extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Users table (extends Supabase auth.users)
CREATE TABLE public.users (
    id UUID REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
    email TEXT UNIQUE NOT NULL,
    name TEXT,
    native_language TEXT NOT NULL,
    target_language TEXT NOT NULL DEFAULT 'en',
    subjects TEXT[] DEFAULT '{}',
    level TEXT DEFAULT 'beginner' CHECK (level IN ('beginner', 'intermediate', 'advanced')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    last_active TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Subjects table
CREATE TABLE public.subjects (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    name TEXT NOT NULL,
    category TEXT NOT NULL,
    description TEXT,
    difficulty TEXT DEFAULT 'beginner' CHECK (difficulty IN ('beginner', 'intermediate', 'advanced')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Topics table
CREATE TABLE public.topics (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    subject_id UUID REFERENCES public.subjects(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    description TEXT,
    difficulty TEXT DEFAULT 'beginner' CHECK (difficulty IN ('beginner', 'intermediate', 'advanced')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Vocabulary table
CREATE TABLE public.vocabulary (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    topic_id UUID REFERENCES public.topics(id) ON DELETE CASCADE,
    term TEXT NOT NULL,
    definition TEXT NOT NULL,
    pronunciation TEXT,
    example TEXT,
    difficulty TEXT DEFAULT 'beginner' CHECK (difficulty IN ('beginner', 'intermediate', 'advanced')),
    tags TEXT[] DEFAULT '{}',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Exercises table
CREATE TABLE public.exercises (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    topic_id UUID REFERENCES public.topics(id) ON DELETE CASCADE,
    type TEXT NOT NULL CHECK (type IN ('multiple-choice', 'fill-blank', 'matching', 'translation', 'speaking')),
    question TEXT NOT NULL,
    options TEXT[],
    correct_answer TEXT NOT NULL,
    explanation TEXT,
    difficulty TEXT DEFAULT 'beginner' CHECK (difficulty IN ('beginner', 'intermediate', 'advanced')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Learning materials table
CREATE TABLE public.learning_materials (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    topic_id UUID REFERENCES public.topics(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    content TEXT NOT NULL,
    type TEXT NOT NULL CHECK (type IN ('text', 'video', 'audio', 'interactive')),
    difficulty TEXT DEFAULT 'beginner' CHECK (difficulty IN ('beginner', 'intermediate', 'advanced')),
    tags TEXT[] DEFAULT '{}',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Flashcards table
CREATE TABLE public.flashcards (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    user_id UUID REFERENCES public.users(id) ON DELETE CASCADE,
    subject TEXT NOT NULL,
    topic TEXT NOT NULL,
    front TEXT NOT NULL,
    back TEXT NOT NULL,
    difficulty TEXT DEFAULT 'beginner' CHECK (difficulty IN ('beginner', 'intermediate', 'advanced')),
    last_reviewed TIMESTAMP WITH TIME ZONE,
    next_review TIMESTAMP WITH TIME ZONE,
    review_count INTEGER DEFAULT 0,
    mastery INTEGER DEFAULT 0 CHECK (mastery >= 0 AND mastery <= 100),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Progress table
CREATE TABLE public.progress (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    user_id UUID REFERENCES public.users(id) ON DELETE CASCADE,
    subject_id UUID REFERENCES public.subjects(id) ON DELETE CASCADE,
    topic_id UUID REFERENCES public.topics(id) ON DELETE CASCADE,
    completed_exercises TEXT[] DEFAULT '{}',
    vocabulary_mastered TEXT[] DEFAULT '{}',
    overall_score INTEGER DEFAULT 0 CHECK (overall_score >= 0 AND overall_score <= 100),
    last_studied TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(user_id, subject_id, topic_id)
);

-- Course notes table
CREATE TABLE public.course_notes (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    user_id UUID REFERENCES public.users(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    content TEXT NOT NULL,
    subject TEXT NOT NULL,
    topic TEXT NOT NULL,
    extracted_terms TEXT[] DEFAULT '{}',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Uploaded files table
CREATE TABLE public.uploaded_files (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    user_id UUID REFERENCES public.users(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    type TEXT NOT NULL,
    size INTEGER NOT NULL,
    content TEXT NOT NULL,
    extracted_terms TEXT[] DEFAULT '{}',
    subject TEXT NOT NULL,
    topic TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Row Level Security (RLS) policies
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.subjects ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.topics ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.vocabulary ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.exercises ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.learning_materials ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.flashcards ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.progress ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.course_notes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.uploaded_files ENABLE ROW LEVEL SECURITY;

-- Users can only access their own data
CREATE POLICY "Users can view own profile" ON public.users
    FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Users can update own profile" ON public.users
    FOR UPDATE USING (auth.uid() = id);

-- Public access to subjects and topics
CREATE POLICY "Public access to subjects" ON public.subjects
    FOR SELECT USING (true);

CREATE POLICY "Public access to topics" ON public.topics
    FOR SELECT USING (true);

-- Public access to vocabulary and exercises
CREATE POLICY "Public access to vocabulary" ON public.vocabulary
    FOR SELECT USING (true);

CREATE POLICY "Public access to exercises" ON public.exercises
    FOR SELECT USING (true);

-- Public access to learning materials
CREATE POLICY "Public access to learning materials" ON public.learning_materials
    FOR SELECT USING (true);

-- Users can only access their own flashcards
CREATE POLICY "Users can view own flashcards" ON public.flashcards
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own flashcards" ON public.flashcards
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own flashcards" ON public.flashcards
    FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own flashcards" ON public.flashcards
    FOR DELETE USING (auth.uid() = user_id);

-- Users can only access their own progress
CREATE POLICY "Users can view own progress" ON public.progress
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own progress" ON public.progress
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own progress" ON public.progress
    FOR UPDATE USING (auth.uid() = user_id);

-- Users can only access their own course notes
CREATE POLICY "Users can view own course notes" ON public.course_notes
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own course notes" ON public.course_notes
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own course notes" ON public.course_notes
    FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own course notes" ON public.course_notes
    FOR DELETE USING (auth.uid() = user_id);

-- Users can only access their own uploaded files
CREATE POLICY "Users can view own uploaded files" ON public.uploaded_files
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own uploaded files" ON public.uploaded_files
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own uploaded files" ON public.uploaded_files
    FOR DELETE USING (auth.uid() = user_id);

-- Insert some sample subjects
INSERT INTO public.subjects (name, category, description, difficulty) VALUES
('Medicine', 'Medicine', 'Medical terminology and concepts for healthcare professionals', 'intermediate'),
('Engineering', 'Engineering', 'Engineering principles and technical vocabulary', 'intermediate'),
('Physics', 'Physics', 'Physical sciences and mathematical concepts', 'intermediate'),
('Biology', 'Biology', 'Biological sciences and life processes', 'intermediate'),
('Chemistry', 'Chemistry', 'Chemical sciences and molecular concepts', 'intermediate'),
('Business', 'Business', 'Business terminology and management concepts', 'intermediate'),
('Humanities', 'Humanities', 'Humanities and social sciences vocabulary', 'intermediate'),
('Sciences', 'Sciences', 'General scientific concepts and terminology', 'intermediate');

-- Create indexes for better performance
CREATE INDEX idx_flashcards_user_id ON public.flashcards(user_id);
CREATE INDEX idx_progress_user_id ON public.progress(user_id);
CREATE INDEX idx_course_notes_user_id ON public.course_notes(user_id);
CREATE INDEX idx_uploaded_files_user_id ON public.uploaded_files(user_id);
CREATE INDEX idx_vocabulary_topic_id ON public.vocabulary(topic_id);
CREATE INDEX idx_exercises_topic_id ON public.exercises(topic_id);
CREATE INDEX idx_topics_subject_id ON public.topics(subject_id);
```

### 5. Run the Development Server

```bash
npm run dev
# or
yarn dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser to see the application.

## 🔧 Development

### Project Structure

```
src/
├── app/                    # Next.js App Router pages
│   ├── auth/              # Authentication pages
│   ├── dashboard/         # Main dashboard and features
│   └── globals.css        # Global styles
├── components/             # Reusable React components
├── lib/                   # Utility libraries and configurations
├── types/                 # TypeScript type definitions
├── hooks/                 # Custom React hooks
└── utils/                 # Helper functions
```

### Available Scripts

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run start` - Start production server
- `npm run lint` - Run ESLint

### Code Style

- **TypeScript**: Strict mode enabled
- **ESLint**: Code quality and consistency
- **Prettier**: Code formatting (recommended)
- **Tailwind CSS**: Utility-first CSS approach

## 🚀 Deployment

### Vercel (Recommended)

1. Push your code to GitHub
2. Connect your repository to Vercel
3. Add environment variables in Vercel dashboard
4. Deploy automatically

### Other Platforms

The app can be deployed to any platform that supports Next.js:
- Netlify
- Railway
- DigitalOcean App Platform
- AWS Amplify

## 🔐 Environment Variables

Create a `.env.local` file in your project root:

```env
# Supabase Configuration
NEXT_PUBLIC_SUPABASE_URL=your_supabase_project_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_supabase_service_role_key

# App Configuration
NEXT_PUBLIC_APP_URL=http://localhost:3000
NODE_ENV=development
```

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📝 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🆘 Support

If you encounter any issues or have questions:

1. Check the [Issues](https://github.com/yourusername/language-learning-app/issues) page
2. Create a new issue with detailed information
3. Contact the development team

## 🎯 Roadmap

### Phase 1 (Current)
- ✅ Basic authentication system
- ✅ Landing page and user registration
- ✅ Dashboard with overview
- ✅ File upload system
- ✅ Basic navigation structure

### Phase 2 (Next)
- [ ] Flashcard system with spaced repetition
- [ ] Exercise generation and practice
- [ ] Progress tracking and analytics
- [ ] Subject-specific content management

### Phase 3 (Future)
- [ ] AI-powered content generation
- [ ] Advanced analytics and insights
- [ ] Mobile app development
- [ ] Social learning features
- [ ] Integration with learning management systems

## 🙏 Acknowledgments

- **Next.js Team** for the amazing React framework
- **Supabase Team** for the excellent backend service
- **Tailwind CSS Team** for the utility-first CSS framework
- **Framer Motion Team** for the smooth animation library

---

**Happy Learning! 🎓✨**
