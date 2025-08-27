#!/bin/bash

echo "🚀 UniLingo Setup Script"
echo "=========================="

# Check if Node.js is installed
if ! command -v node &> /dev/null; then
    echo "❌ Node.js is not installed."
    echo "📥 Installing Node.js..."
    
    # Check if Homebrew is installed
    if ! command -v brew &> /dev/null; then
        echo "📥 Installing Homebrew first..."
        /bin/bash -c "$(curl -fsSL https://raw.githubusercontent.com/Homebrew/install/HEAD/install.sh)"
        
        # Add Homebrew to PATH
        echo 'eval "$(/opt/homebrew/bin/brew shellenv)"' >> ~/.zprofile
        eval "$(/opt/homebrew/bin/brew shellenv)"
    fi
    
    # Install Node.js
    brew install node
    echo "✅ Node.js installed successfully!"
else
    echo "✅ Node.js is already installed: $(node --version)"
fi

# Check if npm is installed
if ! command -v npm &> /dev/null; then
    echo "❌ npm is not installed."
    echo "📥 Installing npm..."
    brew install npm
    echo "✅ npm installed successfully!"
else
    echo "✅ npm is already installed: $(npm --version)"
fi

echo ""
echo "📦 Installing project dependencies..."
npm install

echo ""
echo "🔐 Setting up environment variables..."
if [ ! -f .env.local ]; then
    cp env.example .env.local
    echo "✅ Created .env.local file from template"
    echo "⚠️  Please update .env.local with your Supabase credentials"
else
    echo "✅ .env.local file already exists"
fi

echo ""
echo "🎯 Next Steps:"
echo "1. Update .env.local with your Supabase credentials"
echo "2. Set up your Supabase database using the SQL schema in README.md"
echo "3. Run 'npm run dev' to start the development server"
echo ""
echo "📚 For detailed setup instructions, see README.md"
echo ""
echo "🎉 Setup complete! Happy coding!"


