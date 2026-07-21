import { createClient } from "@supabase/supabase-js";

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

export const supabaseClient = createClient(supabaseUrl, supabaseAnonKey);

export async function getAuthToken(): Promise<string> {
  const { data, error } = await supabaseClient.auth.getSession();

  if (error) throw error;
  if (!data.session) throw new Error("No authenticated session");

  return data.session.access_token;
}
