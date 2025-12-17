import { createClient } from '@supabase/supabase-js';

// ⚠️ SUBSTITUA PELAS SUAS CHAVES DO SUPABASE ⚠️
// Você encontra isso em Project Settings -> API
const SUPABASE_URL = 'https://mhfctrkmjzgxtllyuoyd.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im1oZmN0cmttanpneHRsbHl1b3lkIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjU4MzE5MDUsImV4cCI6MjA4MTQwNzkwNX0.AptpgZSu7WhBZ5Bg889BKUMwkkt0jTkT80aM_9B5x1s';

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);