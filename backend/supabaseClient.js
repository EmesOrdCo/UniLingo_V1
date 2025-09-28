const { createClient } = require('@supabase/supabase-js');
const path = require('path');

// Load environment variables from parent directory .env file
require('dotenv').config({ path: path.join(__dirname, '..', '.env') });

// Initialize Supabase client
const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  throw new Error('Missing Supabase environment variables');
}

const supabase = createClient(supabaseUrl, supabaseKey);

module.exports = { supabase };
