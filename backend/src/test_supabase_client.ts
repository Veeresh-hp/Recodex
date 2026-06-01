import { createClient } from "@supabase/supabase-js";

const supabaseUrl = "https://fpeyenqtujkmmwmolwtp.supabase.co";
const supabaseAnonKey = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZwZXllbnF0dWprbW13bW9sd3RwIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Nzk5NjIxNDQsImV4cCI6MjA5NTUzODE0NH0.xUXnO0wVL0gl9yr1tqZ_s6Z_O7J2gmyu-Jq6TfuUAsM";

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function run() {
  console.log("Querying users via Supabase Client...");
  const { data: users, error: userError } = await supabase.from("users").select("*");
  console.log("Users response:", { count: users?.length, error: userError });

  console.log("Querying projects via Supabase Client...");
  const { data: projects, error: projectError } = await supabase.from("projects").select("*");
  console.log("Projects response:", { count: projects?.length, error: projectError });
}

run().catch(console.error);
