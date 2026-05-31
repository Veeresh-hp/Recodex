import { createClient } from "@supabase/supabase-js";

// Read from Vite env variables, falling back to your active project credentials
const supabaseUrl = 
  (typeof import.meta !== "undefined" && import.meta.env && (import.meta.env.VITE_SUPABASE_URL || import.meta.env.NEXT_PUBLIC_SUPABASE_URL)) || 
  "https://fpeyenqtujkmmwmolwtp.supabase.co";

const supabaseAnonKey = 
  (typeof import.meta !== "undefined" && import.meta.env && (import.meta.env.VITE_SUPABASE_ANON_KEY || import.meta.env.NEXT_PUBLIC_SUPABASE_ANON_KEY)) || 
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZwZXllbnF0dWprbW13bW9sd3RwIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Nzk5NjIxNDQsImV4cCI6MjA5NTUzODE0NH0.xUXnO0wVL0gl9yr1tqZ_s6Z_O7J2gmyu-Jq6TfuUAsM";

export const supabase = createClient(supabaseUrl, supabaseAnonKey);
