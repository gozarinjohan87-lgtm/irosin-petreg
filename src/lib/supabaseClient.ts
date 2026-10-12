import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  console.error('Missing Supabase environment variables. Please check your .env configuration.');
}

export const supabase = createClient(
  supabaseUrl || 'sb_publishable_hyGoDKf-jtsrs0mZ17KHEA_ABv9K3fc',
  supabaseAnonKey || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InRnYXF6YnFnZHJ1bWZ4YmF2ZHhlIiwicm9sZSI6ImFub24iLCJpYXQiOjE3OTE4MDYyNjMsImV4cCI6MjEwNzM4MjI2M30.gR7ioqg4Po2Uqi5l9DndPawz1LieRcpnHoTX3C6HVJE'
);