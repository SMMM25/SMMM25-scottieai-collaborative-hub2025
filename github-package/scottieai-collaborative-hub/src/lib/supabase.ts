
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://nqmfuclhvwnnvjjytbzz.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im5xbWZ1Y2xodndubnZqanl0Ynp6Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDMyNzQ2MzgsImV4cCI6MjA1ODg1MDYzOH0.x8IFrP_JmCauF2v4YzbbNmS2ksdMDjHDDYCvPpLDE1g';

export const supabase = createClient(supabaseUrl, supabaseAnonKey);
