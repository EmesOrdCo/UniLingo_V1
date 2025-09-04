# UniLingo - Clean Project Structure

This project has been reorganized for clarity. It is a React Native/Expo mobile application with a Node.js backend.

## Project Structure

```
UniLingo_Final/
├── src/                    # React Native frontend source code
│   ├── components/         # Reusable UI components
│   ├── screens/           # App screens/pages
│   ├── contexts/          # React contexts for state management
│   ├── types/             # TypeScript type definitions
│   ├── lib/               # Utility libraries and helpers
│   └── config/            # Configuration files
├── backend/                # Node.js backend server
│   ├── server.js          # Main server file
│   ├── package.json       # Backend dependencies
│   ├── env.example        # Environment variables template
│   └── README.md          # Backend documentation
├── assets/                 # Static assets (images, icons, etc.)
├── .expo/                  # Expo configuration
├── package.json            # Frontend dependencies (React Native)
├── app.json               # Expo app configuration
├── tsconfig.json          # TypeScript configuration
├── .gitignore             # Git ignore rules
└── delete/                 # Files moved during cleanup (for reference)
```

## Getting Started

### Frontend (React Native/Expo)
```bash
npm install
npm start
```

### Backend (Node.js)
```bash
cd backend
npm install
# Copy env.example to .env and configure
npm start
```

## What Was Cleaned Up

The following items were safely removed during reorganization:
- ❌ Duplicate environment files (kept essential ones)
- ❌ Scattered test files (not referenced anywhere)
- ❌ Duplicate project structures (temp-unilingo, nested UniLingo)
- ❌ Next.js configuration files (not needed for React Native)
- ❌ Web-specific files (tailwind, postcss, index.html)

## What Was Preserved

The following essential items were kept:
- ✅ **Supabase Edge Functions** (used by the app)
- ✅ **Utility Scripts** (referenced in documentation)
- ✅ **Database Setup Files** (needed for deployment)
- ✅ **Important Documentation** (setup guides)
- ✅ **Environment Configuration** (working setup)

All essential code has been preserved and organized into a clear frontend/backend structure.
