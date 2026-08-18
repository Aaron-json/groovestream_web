function required(name: string, value: string | undefined) {
  if (!value) throw new Error(`Missing ${name}`);
  return value;
}

export const env = {
  apiUrl:
    process.env.EXPO_PUBLIC_API_URL ??
    "https://groovestream.up.railway.app",
  cdnUrl:
    process.env.EXPO_PUBLIC_CDN_URL ?? "https://cdn.groovestream.app",
  supabaseUrl: required(
    "EXPO_PUBLIC_SUPABASE_URL",
    process.env.EXPO_PUBLIC_SUPABASE_URL,
  ),
  supabaseKey: required(
    "EXPO_PUBLIC_SUPABASE_PUBLISHABLE_KEY",
    process.env.EXPO_PUBLIC_SUPABASE_PUBLISHABLE_KEY ??
      process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY,
  ),
};
