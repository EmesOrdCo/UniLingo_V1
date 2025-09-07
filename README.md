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

### Quick Setup (Recommended)
```bash
# Run the automated setup script
node setup.js
```

### Manual Setup

#### 1. Install Dependencies
```bash
# Install frontend dependencies
npm install

# Install backend dependencies
cd backend
npm install
cd ..
```

#### 2. Configure Environment
```bash
# Create frontend .env file with your Supabase credentials
cp .env.example .env

# Create backend .env file with your API keys
cd backend
cp env.example .env
cd ..
```

#### 3. Detect IP Address (Important!)
```bash
# Auto-detect your local IP and update frontend config
node detect-ip.js
```

#### 4. Start the Application
```bash
# Terminal 1: Start backend server
cd backend
npm start

# Terminal 2: Start frontend
npx expo start
```

### Troubleshooting

#### Connection Issues
If you're having trouble connecting to the backend:
```bash
# Re-detect your IP address
node detect-ip.js
```

#### Manual IP Configuration
If automatic IP detection fails, manually edit `src/config/backendConfig.ts`:
```typescript
export const BACKEND_CONFIG = {
  BASE_URL: 'http://YOUR_LOCAL_IP:3001',
  // ... rest of config
};
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
