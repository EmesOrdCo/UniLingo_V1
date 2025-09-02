# 🤖 **AI Chat Setup Guide**

## 🎯 **The Issue:**

The AI Chat is getting a **401 error** because the OpenAI API key is not properly configured. The current key `b214f483e4c5441a980832bf84db4501` is not a valid OpenAI API key.

## 🔧 **How to Fix:**

### **Step 1: Get a Valid OpenAI API Key**

1. **Go to OpenAI Platform**: [https://platform.openai.com/api-keys](https://platform.openai.com/api-keys)
2. **Sign in** to your OpenAI account (or create one)
3. **Click "Create new secret key"**
4. **Copy the API key** (it will start with `sk-` and be much longer)

### **Step 2: Update Your Environment File**

Update your `.env.local` file:

```env
# Supabase Configuration
EXPO_PUBLIC_SUPABASE_URL=your_supabase_url_here
EXPO_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key_here

# OpenAI Configuration
EXPO_PUBLIC_OPENAI_API_KEY=sk-your_actual_openai_api_key_here
```

**Replace** `sk-your_actual_openai_api_key_here` with your real OpenAI API key.

### **Step 3: Restart Your App**

1. **Stop the development server** (`Ctrl+C`)
2. **Restart** with `npm start`
3. **Test the AI Chat** again

## ✅ **What a Valid API Key Looks Like:**

```
sk-1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef
```

- **Starts with** `sk-`
- **Much longer** than the current key
- **Contains** letters and numbers

## 🚀 **After Setup:**

Once you have a valid API key, the AI Chat will work perfectly and users can:

- **Ask language questions** - Grammar, vocabulary, pronunciation
- **Get app help** - How to use UniLingo features
- **Get study tips** - Learning strategies and techniques
- **Have conversations** - Friendly chat and encouragement

## 💡 **Cost Information:**

- **GPT-3.5-turbo** is very affordable (~$0.002 per 1K tokens)
- **Free tier** includes $5 credit for new accounts
- **Pay-as-you-go** - only pay for what you use

**The AI Chat will work perfectly once you have a valid OpenAI API key!** 🎉
