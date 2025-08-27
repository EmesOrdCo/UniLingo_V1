// Test script to check OpenAI account status
// Run this to verify your account has credits before trying to generate lessons

import OpenAIWithRateLimit from './openAIWithRateLimit';

export async function testOpenAIAccount(): Promise<void> {
  const apiKey = process.env.EXPO_PUBLIC_OPENAI_API_KEY;
  
  if (!apiKey) {
    console.error('❌ No OpenAI API key found in environment variables');
    return;
  }

  console.log('🔍 Testing OpenAI account status...');
  console.log('🔑 API Key length:', apiKey.length);
  console.log('🔑 API Key starts with:', apiKey.substring(0, 7) + '...');

  const openai = new OpenAIWithRateLimit({ apiKey });

  try {
    // Check account status
    const status = await openai.checkAccountStatus();
    
    if (status.hasCredits) {
      console.log('✅ Account Status:', status.message);
      console.log('🎉 Your OpenAI account has credits and is ready to use!');
    } else {
      console.log('❌ Account Status:', status.message);
      console.log('💳 Please add credits to your OpenAI account to continue.');
    }

    // Show rate limiter status
    const rateLimitStatus = openai.getRateLimitStatus();
    console.log('📊 Rate Limiter Status:', {
      queueSize: rateLimitStatus.queueSize,
      requestsThisMinute: rateLimitStatus.requestsThisMinute,
      tokensThisMinute: rateLimitStatus.tokensThisMinute,
      circuitBreakerOpen: rateLimitStatus.circuitBreakerOpen
    });

  } catch (error: any) {
    console.error('❌ Error testing OpenAI account:', error.message);
  }
}

// Export for use in other files
export default testOpenAIAccount;




